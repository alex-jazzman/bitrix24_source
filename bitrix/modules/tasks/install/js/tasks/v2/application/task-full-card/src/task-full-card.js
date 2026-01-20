import { Event, Text, Type, Uri, Loc, Runtime } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { SidePanel, type Slider, type SliderEvent } from 'main.sidepanel';
import type { Popup } from 'main.popup';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { TaskCard, type Params } from 'tasks.v2.application.task-card';
import { Core } from 'tasks.v2.core';
import { EventName, Model } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { TaskMappers } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { App } from './component/app';
import { ClosePopup } from './lib/close-popup';

const openedCards = new Set();

export class TaskFullCard
{
	#params: Params;
	#slider: Slider;
	#application: ?VueCreateAppResult;
	#handlers: { [eventName: string]: Function };
	#needToReloadGrid: boolean = false;
	#isCloseConfirmed: boolean = false;
	#shouldCloseComplete: boolean = true;

	constructor(params: Params = {})
	{
		this.#params = Object.fromEntries(Object.entries(params).filter(([, value]) => !Type.isUndefined(value)));

		this.#params.taskId ||= Text.getRandom();
		if (this.#params.taskId === 'template0')
		{
			this.#params.taskId = idUtils.boxTemplate(Text.getRandom());
		}
	}

	static isCardOpened(taskId: number): boolean
	{
		const task = Core.getStore()?.getters[`${Model.Tasks}/getById`](taskId);

		return openedCards.has(task?.id);
	}

	async mount(slider: Slider): Promise<void>
	{
		if (!slider.isOpen())
		{
			return;
		}

		const queryParams = new Uri(this.#params.link?.url ?? this.#params.url).getQueryParams();
		this.#params = {
			...TaskMappers.mapSliderDataToModel({ ...queryParams, ...slider.getRequestParams() }),
			...this.#params,
			...(['tasks_planning', 'tasks_kanban_sprint'].includes(queryParams.SCOPE) ? { deadlineTs: 0 } : {}),
		};

		this.#params.groupId ||= Core.getParams().defaultCollab?.id || undefined;

		this.#slider = slider;

		this.#updateSliderUrl();

		this.#subscribe();

		this.#application = await this.#mountApplication(slider.getContentContainer());

		openedCards.add(this.#params.taskId);
	}

	unmount(): void
	{
		this.#unmountApplication();

		this.#unsubscribe();

		if (this.#needToReloadGrid && BX.Tasks.Util)
		{
			const id = this.#params.taskId;
			BX.Tasks.Util.fireGlobalTaskEvent('UPDATE', { ID: id }, { STAY_AT_PAGE: true }, { id });
		}

		openedCards.delete(this.#params.taskId);
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

	onCloseComplete(): void
	{
		this.unmount();
		if (this.#shouldCloseComplete && this.#params.closeCompleteUrl)
		{
			location.href = this.#params.closeCompleteUrl;
		}
	}

	async #mountApplication(container: HTMLElement): Promise<VueCreateAppResult>
	{
		await Core.init();

		const { taskId, analytics, url, link, closeCompleteUrl, ...initialTask } = this.#params;

		const application = BitrixVue.createApp(App, {
			id: taskId,
			initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !Type.isNil(value))),
			analytics,
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
			[EventName.TaskAdded]: this.#handleTaskAdd,
			[EventName.TaskBeforeUpdate]: this.#handleTaskUpdate,
			[EventName.TemplateAdded]: this.#handleTemplateAdd,
			[EventName.TemplateBeforeUpdate]: this.#handleTemplateUpdate,
			[EventName.CloseFullCard]: this.#onClose,
			[EventName.TryCloseFullCard]: this.#onTryClose,
			[EventName.OpenViewSliderCard]: this.#openViewSliderCard,
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

		this.#updateSliderTitle(task.title);
	};

	#handleTaskCardInit = (event: BaseEvent): void => {
		const task: TaskModel = event.getData().task;

		this.#updateSliderTitle(task.title);
	};

	#handleTaskAdd = (event: BaseEvent): void => {
		const initialTask: TaskModel = event.getData().initialTask;
		if (initialTask.id !== this.#params.taskId)
		{
			return;
		}

		const task: TaskModel = event.getData().task;

		openedCards.delete(this.#params.taskId);
		this.#params.taskId = task.id;
		openedCards.add(this.#params.taskId);

		this.#isCloseConfirmed = true;

		this.#updateSliderTitle(task.title);
		this.#updateSliderUrl();
	};

	#handleTemplateAdd = (event: BaseEvent): void => {
		const initialTemplate: TaskModel = event.getData().initialTemplate;
		if (initialTemplate.id !== this.#params.taskId)
		{
			return;
		}

		const template: TaskModel = event.getData().template;

		this.#params.taskId = template.id;
		this.#isCloseConfirmed = true;

		this.#updateSliderTitle(template.title);
		this.#updateSliderUrl();
	};

	#handleTemplateUpdate = (event: BaseEvent): void => {
		const template: TaskModel = event.getData().template;

		this.#updateSliderTitle(template.title);
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

	#updateSliderTitle(title: string): void
	{
		if (Type.isStringFilled(title))
		{
			this.#slider.setTitle(title);
			SidePanel.Instance.updateBrowserTitle();
		}
	}

	#onTryClose = (event: BaseEvent): void => {
		if (event.getData().taskId === this.#params.taskId)
		{
			this.#slider.close();
		}
	};

	#onClose = (event: BaseEvent): void => {
		if (event.getData().taskId === this.#params.taskId)
		{
			this.#isCloseConfirmed = true;
			this.#slider.close();
		}
	};

	#openViewSliderCard = (baseEvent: BaseEvent): void => {
		const { taskId } = baseEvent.getData();

		this.#shouldCloseComplete = false;

		SidePanel.Instance.open(new Uri(TaskCard.getUrl(taskId)).setQueryParam('OLD_FORM', 'Y').toString(), {
			cacheable: false,
			requestMethod: 'post',
			events: {
				onCloseComplete: (): void => {
					if (this.#params.closeCompleteUrl)
					{
						location.href = this.#params.closeCompleteUrl;
					}
				},
			},
		});

		this.#slider.close(true);
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
