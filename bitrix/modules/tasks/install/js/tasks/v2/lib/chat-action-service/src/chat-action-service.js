import { Page, Reflection, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { EventName } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { ChatActionDispatcher } from './chat-action-dispatcher.js';
import { ChatLinkParser } from './chat-link-parser.js';
import { resultServiceLoader } from './extension-loader';
import { addObserverAction } from './action/add-observer-action.js';
import { showCheckListAction } from './action/check-list/show-check-list-action';
import { showCheckListItemsAction } from './action/check-list/show-check-list-items-action';
import { changeDeadlineAction } from './action/change-deadline-action.js';
import { completeTaskAction } from './action/complete-task-action.js';
import { openGroupAction } from './action/open-group-action';
import { openResultAction } from './action/open-result-action';
import { openTimeTrackingAction } from './action/open-time-tracking-action';
import type { BaseAction } from './action/base-action';
import type { Coordinates } from './type/coordinates';
import type { Link } from './type/link.js';

type Dependencies = {
	actionDispatcher: ChatActionDispatcher,
	linkParser: ChatLinkParser,
};

type Options = {
	coordinates?: Coordinates,
};

type TaskFullCardClass = {
	isOpened: (taskId: number) => boolean,
	isBootstrapped: (taskId: number) => boolean,
	isMounted: (taskId: number) => boolean,
};

export class ChatActionService
{
	#defaultActions: Array<BaseAction> = [
		addObserverAction,
		changeDeadlineAction,
		completeTaskAction,
		openGroupAction,
		openResultAction,
		showCheckListAction,
		showCheckListItemsAction,
		openTimeTrackingAction,
	];

	#actionDispatcher: ChatActionDispatcher;
	#linkParser: ChatLinkParser;
	#pendingActions: Map<number, Array<{ actionName: string, payload: Object }>> = new Map();
	#activeProcesses: Map<string, Promise<void>> = new Map();
	#activeTaskLoads: Map<number, Promise<?TaskModel>> = new Map();

	/**
	 * Returns whether at least one V2 full card instance is registered, regardless of its loading state.
	 */
	static isTaskOpened(taskId: number): boolean
	{
		if (!ChatActionService.#isValidTaskId(taskId, 'isTaskOpened'))
		{
			return false;
		}

		return ChatActionService.#queryOpenedCards(
			(TaskFullCard: TaskFullCardClass): boolean => TaskFullCard.isOpened(taskId),
		);
	}

	/**
	 * Returns whether at least one open V2 full card finished its initial load, successfully or with an error.
	 */
	static isTaskBootstrapped(taskId: number): boolean
	{
		if (!ChatActionService.#isValidTaskId(taskId, 'isTaskBootstrapped'))
		{
			return false;
		}

		return ChatActionService.#queryOpenedCards(
			(TaskFullCard: TaskFullCardClass): boolean => TaskFullCard.isBootstrapped(taskId),
		);
	}

	constructor(dependencies: Dependencies)
	{
		this.#actionDispatcher = dependencies.actionDispatcher;
		this.#linkParser = dependencies.linkParser;

		this.#registerDefaultActions();
		this.#subscribeToCardEvents();
	}

	#registerDefaultActions(): void
	{
		this.#defaultActions.forEach((action: BaseAction): void => {
			try
			{
				this.#actionDispatcher.register(action);
			}
			catch (error)
			{
				console.error('ChatActionService: Failed to register action', action.getName(), error);
			}
		});
	}

	#subscribeToCardEvents(): void
	{
		EventEmitter.subscribe(EventName.FullCardInit, this.#onCardInit);
		EventEmitter.subscribe(EventName.FullCardInitFailed, this.#onCardInitFailed);
		EventEmitter.subscribe(EventName.FullCardClosed, this.#onCardClosed);
	}

	// the card that emits this event is mounted by definition, and the announcement outruns the registry
	// whenever this service subscribed before the card did, so both flags come from the event itself
	#onCardInit = (event: BaseEvent): void => {
		// the card announces its task only once it is in the store, so the queued actions see the data as ready
		void this.#executePendingActions(
			this.#extractTaskId(event),
			{ isTaskDataReady: true, isCardMounted: true },
		);
	};

	// a card that gave up on loading its task stays opened, so its action runs and reports the outcome
	// itself; isTaskDataReady=false mirrors what #preloadTaskData would have resolved to. The failed card
	// is not mounted, but another card of the same task may be, so that flag stays with the registry
	#onCardInitFailed = (event: BaseEvent): void => {
		void this.#executePendingActions(Number(event.getData()?.taskId), { isTaskDataReady: false });
	};

	// several links may be clicked while the card loads, so every queued action runs in its own turn;
	// the card state is recomputed here (not reused from queue time) and the caller may override it
	async #executePendingActions(taskId: number, extraPayload: Object = {}): Promise<void>
	{
		const pendingActions = this.#pendingActions.get(taskId);
		if (!pendingActions)
		{
			return;
		}

		this.#pendingActions.delete(taskId);

		const isCardMounted = this.#isCardMounted(taskId);

		for (const { actionName, payload } of pendingActions)
		{
			try
			{
				// eslint-disable-next-line no-await-in-loop
				await this.#actionDispatcher.execute(actionName, { ...payload, isCardMounted, ...extraPayload });
			}
			catch (error)
			{
				console.error('ChatActionService: Failed to execute pending action', actionName, error);
			}
		}
	}

	#onCardClosed = (event: BaseEvent): void => {
		const taskId = this.#extractTaskId(event);

		// a card may close before it ever announces init, and then nothing would drain its pending action;
		// the closed card is already unregistered from the opened-cards registry, so a still opened second
		// instance (e.g. side panel + slider) keeps the action alive instead of dropping it here
		if (this.#isCardOpened(taskId))
		{
			return;
		}

		this.#pendingActions.delete(taskId);
	};

	// the registry knows every card instance, including the ones mounted before this service was even loaded;
	// a failed check falls back to the hint path, which answers the click instead of aiming at a missing card
	#isCardMounted(taskId: number): boolean
	{
		return ChatActionService.#queryOpenedCards(
			(TaskFullCard: TaskFullCardClass): boolean => TaskFullCard.isMounted(taskId),
		);
	}

	// FullCardInit carries the task, FullCardClosed carries the card params
	#extractTaskId(event: BaseEvent): number
	{
		const data = event.getData();

		return Number(data?.task?.id ?? data?.taskId);
	}

	async process(link: Link, options: Options = {}): Promise<void>
	{
		try
		{
			const parsedLink = this.#linkParser.parse(link);
			if (!parsedLink)
			{
				return;
			}

			const payload = {
				...parsedLink.payload,
				...options,
			};

			const action = this.#actionDispatcher.get(parsedLink.actionName);
			if (!action)
			{
				return;
			}

			if (Core.getStore())
			{
				// a stale store must not pass for a removed entity, so the verdict waits for fresh data
				if (action.needsRefresh(payload))
				{
					const refreshed = await action.refreshData(payload);
					if (!refreshed)
					{
						return;
					}
				}

				// warm store lets a refusal answer with a hint right away, without the preload below
				if (action.isReady(payload) && action.isTooltipOnly(payload))
				{
					await action.execute(payload);

					return;
				}
			}

			const taskId = Number(payload.taskId);
			const { actionName } = parsedLink;

			if (this.#isCardOpened(taskId))
			{
				// the card is registered before it loads, so wait for its data instead of reopening the card
				if (!this.#isCardBootstrapped(taskId))
				{
					this.#addPendingAction(taskId, actionName, payload);

					return;
				}

				await this.#runDeduplicated(
					actionName,
					taskId,
					(): Promise<void> => this.#executeOnOpenedCard(action, actionName, payload, taskId),
				);

				return;
			}

			await this.#runDeduplicated(
				actionName,
				taskId,
				(): Promise<void> => this.#runAction(action, actionName, payload, taskId, link.url),
			);
		}
		catch (error)
		{
			console.error('ChatActionService: Failed to process link', error);
		}
	}

	// one click of a link runs at a time, so a double click neither doubles the request nor doubles the action
	async #runDeduplicated(actionName: string, taskId: number, startProcess: () => Promise<void>): Promise<void>
	{
		const processKey = `${actionName}:${taskId}`;
		const activeProcess = this.#activeProcesses.get(processKey);

		if (activeProcess)
		{
			await activeProcess;

			return;
		}

		const startedProcess = startProcess();

		this.#activeProcesses.set(processKey, startedProcess);

		try
		{
			await startedProcess;
		}
		finally
		{
			this.#activeProcesses.delete(processKey);
		}
	}

	// the card is already opened, so the action goes straight to it, without the card-opening handshake
	async #executeOnOpenedCard(action: BaseAction, actionName: string, payload: Object, taskId: number): Promise<void>
	{
		const actionPayload = await this.#buildActionPayload(action, payload, taskId);

		await this.#actionDispatcher.execute(actionName, actionPayload);
	}

	async #runAction(
		action: BaseAction,
		actionName: string,
		payload: Object,
		taskId: number,
		fallbackUrl: string,
	): Promise<void>
	{
		const actionPayload = await this.#buildActionPayload(action, payload, taskId);

		const cardRequired = !actionPayload.isTaskDataReady || action.requiresCard(actionPayload);

		if (cardRequired)
		{
			const event = new BaseEvent({ data: { taskId } });

			await EventEmitter.emitAsync(EventName.ChatActionBeforeExecute, event);

			if (event.isDefaultPrevented())
			{
				this.#addPendingAction(taskId, actionName, actionPayload);

				return;
			}

			if (action.redirectsToTaskWhenNotReady && !action.isReady(actionPayload))
			{
				Page.redirect(fallbackUrl);

				return;
			}
		}

		await this.#actionDispatcher.execute(actionName, actionPayload);
	}

	// the single place that fills the action payload, so no path can silently drop the readiness of the data
	async #buildActionPayload(action: BaseAction, payload: Object, taskId: number): Promise<Object>
	{
		const isTaskDataReady = await this.#preloadTaskData(action, taskId);

		return {
			...payload,
			isCardMounted: this.#isCardMounted(taskId),
			isTaskDataReady,
		};
	}

	async #preloadTaskData(action: BaseAction, taskId: number): Promise<boolean>
	{
		if (!action.needsTaskData)
		{
			return true;
		}

		try
		{
			await Core.init();
		}
		catch
		{
			return false;
		}

		if (taskService.hasStoreTask(taskId, false))
		{
			return this.#preloadStoreTaskResults(action, taskId);
		}

		const task = await this.#loadTask(taskId);
		if (!task)
		{
			return false;
		}

		return this.#preloadResults(action, task, taskId);
	}

	async #loadTask(taskId: number): Promise<?TaskModel>
	{
		const activeLoad = this.#activeTaskLoads.get(taskId);

		if (activeLoad)
		{
			return activeLoad;
		}

		const startedLoad = this.#requestTask(taskId);

		this.#activeTaskLoads.set(taskId, startedLoad);

		try
		{
			return await startedLoad;
		}
		finally
		{
			this.#activeTaskLoads.delete(taskId);
		}
	}

	async #requestTask(taskId: number): Promise<?TaskModel>
	{
		try
		{
			const { task, error } = await taskService.get(taskId);

			return error ? null : task;
		}
		catch
		{
			return null;
		}
	}

	#preloadStoreTaskResults(action: BaseAction, taskId: number): Promise<boolean>
	{
		return this.#preloadResults(action, taskService.getStoreTask(taskId), taskId, true);
	}

	async #preloadResults(
		action: BaseAction,
		task: ?TaskModel,
		taskId: number,
		canReuseStoreResults: boolean = false,
	): Promise<boolean>
	{
		if (!this.#needsResultLayer(action, task))
		{
			return true;
		}

		const resultService = (await resultServiceLoader.load())?.resultService;
		if (!resultService)
		{
			return false;
		}

		if (
			!this.#needsResults(action, task)
			|| (canReuseStoreResults && this.#hasStoreResults(task, resultService))
		)
		{
			return true;
		}

		try
		{
			await resultService.tail(taskId);
		}
		catch
		{
			return false;
		}

		return true;
	}

	#needsResultLayer(action: BaseAction, task: ?TaskModel): boolean
	{
		return action.needsResultData && Boolean(task?.requireResult);
	}

	#needsResults(action: BaseAction, task: ?TaskModel): boolean
	{
		return this.#needsResultLayer(action, task) && Boolean(task?.containsResults);
	}

	#hasStoreResults(task: ?TaskModel, resultService: Object): boolean
	{
		const results = task?.results ?? [];

		return results.length > 0 && results.every((resultId: number): boolean => {
			return resultService.hasStoreResult(resultId);
		});
	}

	#addPendingAction(taskId: number, actionName: string, payload: Object): void
	{
		const pendingActions = this.#pendingActions.get(taskId) ?? [];

		pendingActions.push({ actionName, payload });

		this.#pendingActions.set(taskId, pendingActions);
	}

	#isCardOpened(taskId: number): boolean
	{
		return ChatActionService.isTaskOpened(taskId);
	}

	// a failed check must not queue the action forever, so it falls back to the plain immediate dispatch
	#isCardBootstrapped(taskId: number): boolean
	{
		return ChatActionService.#queryOpenedCards(
			(TaskFullCard: TaskFullCardClass): boolean => TaskFullCard.isBootstrapped(taskId),
			true,
		);
	}

	static #isValidTaskId(taskId: mixed, methodName: string): boolean
	{
		if (!Type.isNumber(taskId) && !Number.isNaN(taskId))
		{
			// eslint-disable-next-line no-console
			console.warn(`ChatActionService.${methodName}: taskId must be a number.`);

			return false;
		}

		return Number.isInteger(taskId) && taskId > 0;
	}

	// the card bundle is loaded only when a card opens, so a missing class means no opened cards
	static #queryOpenedCards(query: (cardClass: TaskFullCardClass) => boolean, fallback: boolean = false): boolean
	{
		try
		{
			const TaskFullCard: ?TaskFullCardClass = Reflection.getClass('BX.Tasks.V2.Application.TaskFullCard');

			return TaskFullCard ? query(TaskFullCard) === true : fallback;
		}
		catch (error)
		{
			console.error('ChatActionService: Failed to check opened cards', error);

			return fallback;
		}
	}
}

export const chatActionService = new ChatActionService({
	actionDispatcher: new ChatActionDispatcher(),
	linkParser: new ChatLinkParser(),
});
