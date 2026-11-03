import { Event, Text, Type, Uri, Loc, Runtime } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { SidePanel, type Slider, type SliderEvent } from 'main.sidepanel';
import { type Popup } from 'main.popup';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import 'ui.design-tokens.air';

import { TaskCard, type Params } from 'tasks.v2.application.task-card';
import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { hasOpenPopups } from 'tasks.v2.component.tasks-popup';

import { App } from './component/app';
import { ClosePopup } from './lib/close-popup';
import { isSameTaskId } from './lib/is-same-task-id';
import { openedCards } from './lib/opened-cards';
import { mapSliderParamsToModel } from './lib/slider-params';

export class TaskFullCard
{
	#params: Params;
	#slider: Slider;
	#application: ?VueCreateAppResult;
	#handlers: { [eventName: string]: Function };
	#onCloseByEscHandler: (event: SliderEvent) => void;
	#needToReloadGrid: boolean = false;
	#isCloseConfirmed: boolean = false;
	#shouldCloseComplete: boolean = true;
	#isTornDown: boolean = false;

	constructor(params: Params = {})
	{
		this.#params = Object.fromEntries(Object.entries(params).filter(([, value]) => !Type.isUndefined(value)));

		this.#params.taskId ||= Text.getRandom();
		if (this.#params.taskId === 'template0')
		{
			this.#params.taskId = idUtils.boxTemplate(Text.getRandom());
		}
	}

	static isOpened(taskId: number): boolean
	{
		return openedCards.has(taskId);
	}

	// an opened card holds no task data until its bootstrap ends, so callers can tell loading from settled
	static isBootstrapped(taskId: number): boolean
	{
		return openedCards.isBootstrapped(taskId);
	}

	// a mounted card runs the task UI, so callers can route an action into it instead of answering with a hint
	static isMounted(taskId: number): boolean
	{
		return openedCards.isMounted(taskId);
	}

	async mount(slider: Slider): Promise<void>
	{
		if (!slider.isOpen())
		{
			return;
		}

		const queryParams = new Uri(this.#params.link?.url ?? this.#params.url).getQueryParams();
		const requestParams = slider.getRequestParams();
		this.#params = {
			...mapSliderParamsToModel(queryParams, requestParams),
			...this.#params,
			...(['tasks_planning', 'tasks_kanban_sprint'].includes(queryParams.SCOPE) ? { deadlineTs: 0 } : {}),
			embedded: false,
		};

		this.#params.groupId ||= Core.getParams().defaultCollab?.id || undefined;

		this.#slider = slider;

		// Veto the slider Esc while a nested popup is open, on ANY open path: the
		// task list auto-binding (intranet.sidepanel) mounts the card without
		// wiring this slider option, so the veto must be self-contained here.
		this.#onCloseByEscHandler = this.onCloseByEsc.bind(this);
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onCloseByEsc', this.#onCloseByEscHandler, { compatMode: true });

		this.#updateSliderUrl();

		this.#subscribe();

		await this.#mountApplication(slider.getContentContainer(), slider.getContainer());
	}

	async mountEmbedded(container: HTMLElement): Promise<void>
	{
		this.#params = {
			...this.#params,
			embedded: true,
		};

		this.#subscribe();

		await this.#mountApplication(container);
	}

	unmount(): void
	{
		this.#teardown();

		if (this.#slider && this.#onCloseByEscHandler)
		{
			EventEmitter.unsubscribe(this.#slider, 'SidePanel.Slider:onCloseByEsc', this.#onCloseByEscHandler);
		}

		if (this.#needToReloadGrid)
		{
			const id = this.#params.taskId;

			EventEmitter.emit(EventName.LegacyTasksTaskEvent, new BaseEvent({
				data: id,
				compatData: [
					'UPDATE',
					{
						task: { ID: id },
						taskUgly: { id },
						options: { STAY_AT_PAGE: true },
					},
				],
			}));
		}
	}

	unmountEmbedded(): void
	{
		this.#teardown();
	}

	#teardown(): void
	{
		if (this.#isTornDown)
		{
			return;
		}

		this.#isTornDown = true;

		// unregistered first, so the closed event lets subscribers see the cards that stay opened
		openedCards.remove(this);

		this.#unmountApplication();

		this.#unsubscribe();
	}

	onClose(event: SliderEvent): void
	{
		if (this.#isCloseConfirmed)
		{
			return;
		}

		/** @type {{ taskId: number | string, hasChanges: boolean }[]} */
		const allChanges = EventEmitter.emit(EventName.FullCardHasChanges, { taskId: this.#params.taskId });
		const hasChanges = allChanges.find((result) => result.taskId === this.#params.taskId)?.hasChanges;
		if (!hasChanges)
		{
			return;
		}

		event.denyAction();
		new ClosePopup().show((dialog) => {
			dialog.close();
			this.#isCloseConfirmed = true;
			this.#slider.close();
		});
	}

	onCloseByEsc(event: SliderEvent): void
	{
		if (hasOpenPopups(this.#slider.getContainer()))
		{
			event.denyAction();
		}
	}

	onCloseComplete(): void
	{
		this.unmount();

		if (this.#shouldCloseComplete && this.#params.closeCompleteUrl)
		{
			location.href = this.#params.closeCompleteUrl;
		}
	}

	async #mountApplication(container: HTMLElement, popupTeleportTarget: ?HTMLElement = null): Promise<void>
	{
		// registered before the await, so an unmount during the load still clears the entry
		openedCards.add(this, this.#params.taskId);

		try
		{
			// assigned where the application is created, so no path can outlive the teardown with it unset
			this.#application = await this.#createApplication(container, popupTeleportTarget);
		}
		catch (error)
		{
			// the embedded path mounts without awaiting, so a failed mount has to end the lifecycle on its own
			this.#teardown();

			throw error;
		}
	}

	async #createApplication(container: HTMLElement, popupTeleportTarget: ?HTMLElement): Promise<?VueCreateAppResult>
	{
		await Core.init();

		// the card may be closed while Core loads, and a torn down one has no one left to unmount the application
		if (this.#isTornDown)
		{
			return null;
		}

		const {
			taskId,
			analytics,
			url,
			link,
			closeCompleteUrl,
			embedded,
			onCloseEmbedded,
			...initialTask
		} = this.#params;

		const application = BitrixVue.createApp(App, {
			id: taskId,
			initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !Type.isNil(value))),
			analytics,
			embedded,
			onCloseEmbedded,
			popupTeleportTarget,
		});

		application.mixin(locMixin);
		application.use(Core.getStore());
		application.mount(container);

		return application;
	}

	#unmountApplication(): void
	{
		this.#application?.unmount();

		EventEmitter.emit(EventName.FullCardClosed, this.#params);
	}

	#subscribe(): void
	{
		this.#handlers = {
			[EventName.FullCardInit]: this.#handleTaskCardInit,
			[EventName.FullCardInitFailed]: this.#handleTaskCardInitFailed,
			[EventName.TaskAdded]: this.#handleTaskAdd,
			[EventName.TaskBeforeUpdate]: this.#handleTaskUpdate,
			[EventName.TemplateAdded]: this.#handleTemplateAdd,
			[EventName.TemplateBeforeUpdate]: this.#handleTemplateUpdate,
			[EventName.CloseFullCard]: this.#onClose,
			[EventName.TryCloseFullCard]: this.#onTryClose,
			[EventName.OpenCompactCard]: this.#openCompactCard,
			[EventName.OpenGrid]: this.#openGrid,
			[EventName.OpenTemplateHistory]: this.#openTemplateHistory,
			[EventName.OpenHistory]: this.#openHistory,
			'BX.Main.Popup:onShow': this.#handlePopupShow,
		};

		Object.entries(this.#handlers).forEach(([event, handler]) => EventEmitter.subscribe(event, handler));
	}

	#unsubscribe(): void
	{
		Object.entries(this.#handlers).forEach(([event, handler]) => EventEmitter.unsubscribe(event, handler));
	}

	#handleTaskUpdate = (event: BaseEvent): void => {
		const task: TaskModel = event.getData().task;
		const taskId = task.id;

		const relationIds = new Set([...task.subTaskIds, ...task.relatedTaskIds, ...task.ganttTaskIds]);
		const isRelationTaskUpdated = relationIds.has(taskId);

		const fields = Object.keys(event.getData().fields);
		const fieldsForReloadGrid = new Set(['deadlineTs', 'responsibleIds']);
		const isFieldsForGridUpdated = fields.some((it: string) => fieldsForReloadGrid.has(it));

		if (isRelationTaskUpdated || (taskId === this.#params.taskId && isFieldsForGridUpdated))
		{
			this.#needToReloadGrid = true;
		}

		this.#updateSliderTitle(taskId, task.title);
	};

	#handleTaskCardInit = (event: BaseEvent): void => {
		const task: TaskModel = event.getData().task;

		if (isSameTaskId(task.id, this.#params.taskId))
		{
			openedCards.markBootstrapped(this);
			openedCards.markMounted(this);
		}

		this.#updateSliderTitle(task.id, task.title);
	};

	#handleTaskCardInitFailed = (event: BaseEvent): void => {
		if (isSameTaskId(event.getData().taskId, this.#params.taskId))
		{
			openedCards.markBootstrapped(this);
		}
	};

	#handleTaskAdd = (event: BaseEvent): void => {
		const initialTask: TaskModel = event.getData().initialTask;
		if (initialTask.id !== this.#params.taskId)
		{
			return;
		}

		const task: TaskModel = event.getData().task;

		this.#params.taskId = task.id;
		openedCards.add(this, this.#params.taskId);

		this.#isCloseConfirmed = true;

		this.#updateSliderTitle(task.id, task.title);
		this.#updateSliderUrl();
	};

	#handleTemplateAdd = (event: BaseEvent): void => {
		const initialTemplate: TaskModel = event.getData().initialTemplate;
		if (!initialTemplate || initialTemplate.id !== this.#params.taskId)
		{
			return;
		}

		const template: TaskModel = event.getData().template;

		this.#params.taskId = template.id;
		this.#isCloseConfirmed = true;

		this.#updateSliderTitle(template.id, template.title);
		this.#updateSliderUrl();
	};

	#handleTemplateUpdate = (event: BaseEvent): void => {
		const template: TaskModel = event.getData().template;

		this.#updateSliderTitle(template.id, template.title);
	};

	#updateSliderUrl(): void
	{
		const taskId = Number.isInteger(this.#params.taskId) ? this.#params.taskId : 0;
		const taskUrl = TaskCard.getUrl(this.#params.taskId, this.#params.groupId);

		if (!idUtils.isTemplate(this.#params.taskId))
		{
			this.#slider.setMinimizeOptions({
				entityType: 'tasks:task',
				entityName: Loc.getMessage('INTRANET_BINDINGS_TASK'),
				url: taskUrl,
				entityId: taskId,
			});
		}

		this.#slider.setUrl(taskUrl);

		SidePanel.Instance.resetBrowserHistory();
	}

	#updateSliderTitle(taskId: number | string, title: string): void
	{
		if (!isSameTaskId(taskId, this.#params.taskId))
		{
			return;
		}

		if (this.#slider && Type.isStringFilled(title))
		{
			this.#slider.setTitle(title);
			SidePanel.Instance.updateBrowserTitle();
		}
	}

	#onTryClose = (event: BaseEvent): void => {
		if (this.#slider && event.getData().taskId === this.#params.taskId)
		{
			this.#slider.close();
		}
	};

	#onClose = (event: BaseEvent): void => {
		if (this.#slider && event.getData().taskId === this.#params.taskId)
		{
			this.#isCloseConfirmed = true;
			this.#slider.close();
		}
	};

	#openHistory = async (baseEvent: BaseEvent): Promise<void> => {
		const { taskId } = baseEvent.getData();

		const { HistoryGrid } = await Runtime.loadExtension('tasks.v2.application.history-grid');

		HistoryGrid.openHistoryGrid({ taskId });
	};

	#openCompactCard = async (baseEvent: BaseEvent): Promise<void> => {
		const params = baseEvent.getData();

		TaskCard.showCompactCard({
			...params,
			groupId: this.#params.groupId,
		});
	};

	#openGrid = (baseEvent: BaseEvent): void => {
		const { taskId, type } = baseEvent.getData();
		const userId = Core.getParams().currentUser.id;

		SidePanel.Instance.open(`/company/personal/user/${userId}/tasks/?relationToId=${taskId}&relationType=${type}`, {
			newWindowLabel: false,
			copyLinkLabel: false,
		});
	};

	#openTemplateHistory = (baseEvent: BaseEvent): void => {
		const params = baseEvent.getData();

		let templateHistoryGrid = null;
		BX.SidePanel.Instance.open('tasks-template-history-grid', {
			contentCallback: async (slider: Slider): Promise<HTMLElement> => {
				const exports = await Runtime.loadExtension('tasks.v2.application.template-history-grid');

				templateHistoryGrid = new exports.TemplateHistoryGrid(params);

				return templateHistoryGrid.mount(slider);
			},
			events: {
				onClose: (): void => templateHistoryGrid?.unmount(),
			},
			cacheable: false,
			width: 1200,
		});
	};

	#handlePopupShow = (event: BaseEvent): void => {
		const popup: Popup = event.getCompatData()[0];
		if (popup.getTargetContainer() !== document.body)
		{
			return;
		}

		const onScroll = () => popup.adjustPosition();
		const onClose = () => {
			popup.unsubscribe('onClose', onClose);
			popup.unsubscribe('onDestroy', onClose);
			Event.unbind(document, 'scroll', onScroll, true);
		};

		popup.subscribe('onClose', onClose);
		popup.subscribe('onDestroy', onClose);
		Event.bind(document, 'scroll', onScroll, true);
	};
}
