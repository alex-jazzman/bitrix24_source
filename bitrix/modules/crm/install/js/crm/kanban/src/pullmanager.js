import { Event, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import type { ActionItem } from 'pull.queuemanager';
import { QueueManager } from 'pull.queuemanager';
import PullOperation from './pulloperation';
import { ViewMode } from './viewmode';

const ACTIVITIES_LOAD_ITEMS_DELAY = 1000;
// The queue stops taking events once it holds more than it may, and its window
// here is five times shorter than the one its own limit is measured against, so
// the board keeps the backlog of the same span of time.
const ACTIVITIES_MAX_PENDING_ITEMS = 150;
const MAX_OFF_BOARD_ITEMS = 512;
const OFF_BOARD_PROBE_DELAY = 30000;
// The queue restarts its own batching window on the very events that bring the
// probe back - the tab and the last slider - and answers them with a load of its
// own. The probe waits out two of those windows: the first one belongs to the
// queue, the second keeps the probe behind it instead of beside it.
const PROBE_RESUME_QUEUE_WINDOWS = 2;

const EventName = {
	itemUpdated: 'ITEMUPDATED',
	itemAdded: 'ITEMADDED',
	itemDeleted: 'ITEMDELETED',
	stageAdded: 'STAGEADDED',
	stageUpdated: 'STAGEUPDATED',
	stageDeleted: 'STAGEDELETED',
};

export default class PullManager
{
	queueManager: QueueManager;
	grid: BX.CRM.Kanban.Grid;
	#offBoardItems: Set<number> = new Set();
	#delayedProbeIds: Set<number> = new Set();
	#delayedProbeTimer: ?number = null;
	#probeDeadline: number = 0;
	#isProbeFrozenBySlider: boolean = false;
	#isQueueLoading: boolean = false;

	constructor(grid: BX.CRM.Kanban.Grid)
	{
		if (!BX.PULL)
		{
			console.info('BX.PULL is not initialized');

			return;
		}

		this.grid = grid;

		const data = grid.getData();

		const options = {
			moduleId: data.moduleId,
			pullTag: data.pullTag,
			additionalPullTags: data.additionalPullTags ?? [],
			userId: data.userId,
			additionalData: {
				viewMode: data.viewMode,
			},
			events: {
				onBeforePull: (event) => {
					this.#onBeforePull(event);
				},
				onPull: (event) => {
					this.#onPull(event);
				},
			},
			callbacks: {
				onBeforeQueueExecute: (items) => {
					return this.#onBeforeQueueExecute(items);
				},
				onQueueExecute: (items) => {
					return this.#onQueueExecute(items);
				},
				onReload: () => {
					this.#onReload();
				},
			},
		};

		if (data.viewMode === ViewMode.MODE_ACTIVITIES)
		{
			options.config = {
				loadItemsDelay: ACTIVITIES_LOAD_ITEMS_DELAY,
				maxPendingItems: ACTIVITIES_MAX_PENDING_ITEMS,
			};
		}

		this.queueManager = new QueueManager(options);

		// A board can be drawn under an open card, so the pause is taken from the
		// page as it is now and not only from the next slider that opens.
		this.#isProbeFrozenBySlider = this.#getOpenSlidersCount() > 0;

		// The board reloads through its own funnel, not only by the global filter
		// event: a reload leaves the memory of another selection behind.
		EventEmitter.subscribe(this.grid, 'Kanban.Grid:onApplyFilter', () => {
			this.#forgetOffBoardItems();
		});

		// The queue stops taking events while a slider is open, and the probe goes
		// around the queue: it holds the same pause, or the board under an open card
		// keeps asking the server.
		EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
			this.#isProbeFrozenBySlider = true;
		});
		EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', () => {
			this.#syncSliderFreezeState();
		});

		Event.bind(document, 'visibilitychange', () => {
			if (!document.hidden)
			{
				this.#resumeOffBoardProbe();
			}
		});
	}

	#onBeforeQueueExecute(items: Object[]): Promise
	{
		items.forEach((item) => {
			const { data } = item;

			const operation = PullOperation.createInstance({
				grid: this.grid,
				itemId: data.id,
				action: data.action,
				actionParams: data.actionParams,
			});

			operation.execute(); // change to async and use Promise.all in return
		});

		return Promise.resolve();
	}

	#onQueueExecute(items: Object[]): Promise
	{
		const ids = [];
		items.forEach(({ data: { id, action } }) => {
			if (action === 'addItem' || action === 'updateItem')
			{
				ids.push(parseInt(id, 10));
			}
		});

		if (ids.length === 0)
		{
			return Promise.resolve();
		}

		this.#isQueueLoading = true;

		return this.grid
			.loadNew(ids, false, true, true, true)
			.then(
				(result) => {
					this.#isQueueLoading = false;
					this.#rememberLoadResult(ids);

					return result;
				},
				(error) => {
					this.#isQueueLoading = false;

					throw error;
				},
			)
		;
	}

	/**
	 * An item the board did not draw is outside its filter: further events about
	 * it would load it again for nothing. The board takes off the cards the server
	 * left out of its answer, so what is drawn after a load is what passed it.
	 */
	#rememberLoadResult(ids: number[]): void
	{
		ids.forEach((id) => {
			if (this.grid.getItem(id))
			{
				this.#offBoardItems.delete(id);
			}
			else
			{
				this.#offBoardItems.add(id);
			}
		});

		// The oldest records leave one by one: a whole reset would let every item
		// outside the board through again, and the queue would load them anew.
		while (this.#offBoardItems.size > MAX_OFF_BOARD_ITEMS)
		{
			this.#offBoardItems.delete(this.#offBoardItems.values().next().value);
		}
	}

	/**
	 * An item outside the board is asked about rarely and for the whole set at
	 * once: it gets onto the board only when a change brings it into the filter.
	 */
	#scheduleOffBoardProbe(itemId: number): void
	{
		this.#delayedProbeIds.add(itemId);
		this.#keepOffBoardProbeTimer(OFF_BOARD_PROBE_DELAY);
	}

	/**
	 * Events about items outside the board keep coming in while the window runs:
	 * the probe holds the timer it already has, or a busy board would push its own
	 * probe away for as long as the events last.
	 */
	#keepOffBoardProbeTimer(delay: number): void
	{
		if (this.#delayedProbeTimer !== null && this.#probeDeadline <= Date.now() + delay)
		{
			return;
		}

		this.#restartOffBoardProbeTimer(delay);
	}

	#restartOffBoardProbeTimer(delay: number): void
	{
		if (this.#delayedProbeTimer !== null)
		{
			clearTimeout(this.#delayedProbeTimer);
		}

		this.#probeDeadline = Date.now() + delay;
		this.#delayedProbeTimer = setTimeout(() => {
			this.#runOffBoardProbe();
		}, delay);
	}

	#runOffBoardProbe(): void
	{
		this.#delayedProbeTimer = null;

		if (this.#delayedProbeIds.size === 0)
		{
			return;
		}

		if (this.#isOffBoardProbeDeferred())
		{
			this.#restartOffBoardProbeTimer(OFF_BOARD_PROBE_DELAY);

			return;
		}

		if (this.#isQueueLoading)
		{
			// The queue is on the wire with a batch of its own: the probe comes back
			// when the answer is in, so the two never ask the server at once.
			this.#restartOffBoardProbeTimer(this.#getProbeResumeDelay());

			return;
		}

		const ids = [...this.#delayedProbeIds];
		this.#delayedProbeIds.clear();

		this.grid
			.loadNew(ids, false, true, true, true)
			.then(() => {
				this.#rememberLoadResult(ids);
			})
			.catch(() => {
				// A probe that did not reach the server tells nothing about the items:
				// they stay off the board until the next event asks about them again.
			})
		;
	}

	#isOffBoardProbeDeferred(): boolean
	{
		return (document.hidden || this.#isProbeFrozenBySlider);
	}

	/**
	 * The board came back - the tab was switched to, the last slider was closed.
	 * The queue picks up its own backlog on the same events, so the probe is moved
	 * onto a window of its own: a shorter one than the whole wait it would owe, and
	 * a later one than a timer about to fire, which would go before that backlog.
	 */
	#resumeOffBoardProbe(): void
	{
		if (this.#delayedProbeIds.size === 0 || this.#isOffBoardProbeDeferred())
		{
			return;
		}

		this.#restartOffBoardProbeTimer(this.#getProbeResumeDelay());
	}

	#getProbeResumeDelay(): number
	{
		return this.queueManager.getLoadItemsDelay() * PROBE_RESUME_QUEUE_WINDOWS;
	}

	#syncSliderFreezeState(): void
	{
		this.#isProbeFrozenBySlider = this.#getOpenSlidersCount() > 0;
		this.#resumeOffBoardProbe();
	}

	#getOpenSlidersCount(): number
	{
		return top.BX?.SidePanel?.Instance?.getOpenSlidersCount() ?? 0;
	}

	#forgetOffBoardItems(): void
	{
		this.#offBoardItems.clear();
		this.#delayedProbeIds.clear();

		if (this.#delayedProbeTimer !== null)
		{
			clearTimeout(this.#delayedProbeTimer);
			this.#delayedProbeTimer = null;
		}
	}

	#onReload(): void
	{
		this.#forgetOffBoardItems();
		this.grid.reload();
	}

	#onBeforePull(event: BaseEvent): void
	{
		const { data: { options, pullData } } = event;
		if (
			!pullData.command.startsWith(options.pullTag)
			&& options.additionalData.viewMode !== ViewMode.MODE_ACTIVITIES
		)
		{
			event.preventDefault();
		}
	}

	#onPull(event: BaseEvent): void
	{
		const { pullData: { params } } = event.data;

		if (params.eventName === EventName.itemUpdated)
		{
			this.#onPullItemUpdated(event);

			return;
		}

		if (params.eventName === EventName.itemAdded)
		{
			this.#onPullItemAdded(event);

			return;
		}

		if (params.eventName === EventName.itemDeleted)
		{
			this.#onPullItemDeleted(event);

			return;
		}

		if (params.eventName === EventName.stageAdded)
		{
			this.#onPullStageChanged(event);

			return;
		}

		if (params.eventName === EventName.stageUpdated)
		{
			this.#onPullStageChanged(event);

			return;
		}

		if (params.eventName === EventName.stageDeleted)
		{
			this.#onPullStageDeleted(event);
		}
	}

	#onPullItemUpdated(event: BaseEvent): void
	{
		const { pullData: { params }, promises } = event.data;

		const item = this.grid.getItem(params.item.id);

		if (item)
		{
			promises.push(Promise.resolve({
				data: this.#getPullData('updateItem', params),
			}));

			return;
		}

		// eslint-disable-next-line no-param-reassign
		params.eventName = EventName.itemAdded;
		this.#onPullItemAdded(event);
	}

	#onPullItemAdded(event: BaseEvent): void
	{
		const { pullData: { params }, promises } = event.data;

		const itemId = parseInt(params.item.id, 10);
		const oldItem = this.grid.getItem(itemId);

		if (oldItem)
		{
			event.preventDefault();

			return;
		}

		if (this.#offBoardItems.has(itemId))
		{
			event.preventDefault();
			this.#scheduleOffBoardProbe(itemId);

			return;
		}

		promises.push(Promise.resolve({
			data: this.#getPullData('addItem', params),
		}));
	}

	#getPullData(action: string, actionParams: Object): ActionItem
	{
		const { id } = actionParams.item ?? actionParams.stage;

		return {
			id,
			action,
			actionParams,
		};
	}

	#getPendingItemKeys(itemId: number): string[]
	{
		return [
			`${itemId}_${EventName.itemAdded}`,
			`${itemId}_${EventName.itemUpdated}`,
		];
	}

	#hasPendingItemChanges(itemId: number): boolean
	{
		return this.#getPendingItemKeys(itemId).some((key) => this.queueManager.hasInQueue(key));
	}

	#clearPendingItemChanges(itemId: number): void
	{
		this.#getPendingItemKeys(itemId).forEach((key) => {
			this.queueManager.deleteFromQueue(key);
		});
	}

	#onPullItemDeleted(event: BaseEvent): void
	{
		const { pullData: { params } } = event.data;

		if (!Type.isPlainObject(params.item))
		{
			return;
		}

		const { id } = params.item;

		/**
		 * Delay so that the element has time to be rendered before deletion,
		 * if an event for changing the element came before. Ticket #141983
		 */
		const delay = (
			this.#hasPendingItemChanges(id)
				? this.queueManager.getLoadItemsDelay()
				: 0
		);

		setTimeout(() => {
			this.#clearPendingItemChanges(id);
			// QueueManager appends action items asynchronously after pull handlers finish.
			setTimeout(() => {
				this.#clearPendingItemChanges(id);
			}, 0);

			const { grid } = this;
			const item = grid.getItem(id);
			if (!item)
			{
				return;
			}

			// The event names the stage of the item, which is not the column of the card
			// in the deadlines view.
			const column = item.getColumn();
			grid.removeItem(id);

			if (column && grid.getTypeInfoParam('showTotalPrice'))
			{
				column.decPrice(item.data.price);
				column.renderSubTitle();
			}
		}, delay);

		event.preventDefault();
	}

	#onPullStageChanged(event: BaseEvent): void
	{
		const { pullData: { params }, promises } = event.data;
		if (Type.isPlainObject(params.stage) && Type.isFunction(this.grid.markStageEditorExternalConflict))
		{
			this.grid.markStageEditorExternalConflict(params.stage.id, params.stage);
		}

		const action = (
			params.eventName === EventName.stageAdded
				? 'addStage'
				: 'updateStage'
		);

		promises.push(Promise.resolve({
			data: this.#getPullData(action, params),
		}));
	}

	#clearPendingStageChanges(stageId: string): void
	{
		this.queueManager.deleteFromQueue(`${stageId}_${EventName.stageAdded}`);
		this.queueManager.deleteFromQueue(`${stageId}_${EventName.stageUpdated}`);
	}

	#onPullStageDeleted(event: BaseEvent): void
	{
		event.preventDefault();

		const { pullData: { params } } = event.data;
		if (Type.isPlainObject(params.stage) && Type.isFunction(this.grid.handleStageEditorExternalDelete))
		{
			this.grid.handleStageEditorExternalDelete(params.stage.id);
		}
		else if (Type.isPlainObject(params.stage) && Type.isFunction(this.grid.markStageEditorExternalConflict))
		{
			this.grid.markStageEditorExternalConflict(params.stage.id, params.stage);
		}

		const stageId = params.stage.id;
		this.#clearPendingStageChanges(stageId);
		// QueueManager appends action items asynchronously after pull handlers finish.
		setTimeout(() => {
			this.#clearPendingStageChanges(stageId);
		}, 0);

		const column = this.grid.getColumn(stageId);
		if (Type.isFunction(column?.closeStageDescriptionTooltip))
		{
			column.closeStageDescriptionTooltip();
		}

		this.grid.removeColumn(stageId);
	}
}
