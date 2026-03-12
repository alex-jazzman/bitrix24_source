import { Dom, Tag, Text, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import type { Popup } from 'main.popup';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { settings } from 'tasks.v2.lib.analytics';
import { TaskCard, type Params } from 'tasks.v2.application.task-card';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { TaskMappers } from 'tasks.v2.provider.service.task-service';
import { Core } from 'tasks.v2.core';
import { EventName, GroupType, Model, Analytics } from 'tasks.v2.const';
import { UserTypes } from 'tasks.v2.model.users';

import { App } from './component/app';

export class TaskCompactCard
{
	#params: Params;
	#popup: Popup;
	#application: ?VueCreateAppResult;
	#handlers: { [eventName: string]: Function };
	#openingFullCard: boolean;

	constructor(params: Params = {})
	{
		this.#params = params;

		this.#params.taskId ||= Text.getRandom();
		if (this.#params.taskId === 'template0')
		{
			this.#params.taskId = idUtils.boxTemplate(Text.getRandom());
		}
		this.#params.groupId = this.#getInitialGroupId();
	}

	async mount(popup: Popup): Promise<void>
	{
		if (popup.isDestroyed())
		{
			return;
		}

		this.#popup = popup;

		await this.#mountApplication(popup.getContentContainer());

		this.#adjustPosition();
		this.#subscribe();

		const dragHandle = Tag.render`<div class="tasks-compact-card-popup-drag-handle"/>`;
		Dom.append(dragHandle, popup.getContentContainer());
		this.#popup.setDraggable({
			element: dragHandle,
			restrict: true,
		});
	}

	unmount(): void
	{
		this.#unmountApplication();

		this.#unsubscribe();
	}

	async #mountApplication(container: HTMLElement): Promise<void>
	{
		await Core.init();

		const { taskId, analytics, url, closeCompleteUrl, ...initialTask } = this.#params;

		const application = BitrixVue.createApp(App, {
			id: taskId,
			initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !Type.isNil(value))),
			analytics,
		});

		application.mixin(locMixin);
		application.use(Core.getStore());
		application.mount(container);

		this.#application = application;
	}

	#unmountApplication(): void
	{
		this.#application.unmount();

		if (!this.#openingFullCard)
		{
			EventEmitter.emit(EventName.CardClosed, this.#params);
		}
	}

	#subscribe(): void
	{
		this.#handlers = {
			[`${EventName.CloseCard}:${this.#params.taskId}`]: this.#closeCard,
			[`${EventName.OpenFullCard}:${this.#params.taskId}`]: this.#openFullCard,
			[`${EventName.OpenSliderCard}:${this.#params.taskId}`]: this.#openSliderCard,
			[`${EventName.ShowOverlay}:${this.#params.taskId}`]: this.#showOverlay,
			[`${EventName.HideOverlay}:${this.#params.taskId}`]: this.#hideOverlay,
			[`${EventName.AdjustPosition}:${this.#params.taskId}`]: this.#handleAdjustPosition,
			'BX.Main.Popup:onShow': this.#handlePopupShow,
		};

		Object.entries(this.#handlers).forEach(([event, handler]) => EventEmitter.subscribe(event, handler));
	}

	#unsubscribe(): void
	{
		Object.entries(this.#handlers).forEach(([event, handler]) => EventEmitter.unsubscribe(event, handler));
	}

	#openFullCard = (): void => {
		this.#openingFullCard = true;

		this.#closeCard();

		TaskCard.showFullCard(this.#params);
	};

	#openSliderCard = (baseEvent: BaseEvent): void => {
		const task = baseEvent.getData().task;
		const checkLists = baseEvent.getData().checkLists;

		const data = TaskMappers.mapModelToSliderData(task, checkLists);
		// Analytic data
		// ta_sec=tasks&ta_sub=list&ta_el=create_button&p1=isDemo_N&p2=user_intranet
		const path = BX.Uri.addParam(Core.getParams().paths.editPath, {
			SCOPE: 'tasks_grid',
			ta_sec: this.#params.analytics?.context,
			ta_sub: this.#params.analytics?.additionalContext,
			ta_el: this.#params.analytics?.element,
			p1: Analytics.Params.IsDemo(settings.isDemo),
			p2: settings.userType,
		});

		BX.SidePanel.Instance.open(path, {
			requestMethod: 'post',
			requestParams: data,
			cacheable: false,
		});

		this.#closeCard();
	};

	#closeCard = (): void => {
		this.#popup.close();
	};

	#showOverlay = (): void => {
		Dom.addClass(this.#popup.getPopupContainer(), '--overlay');
	};

	#hideOverlay = (): void => {
		Dom.removeClass(this.#popup.getPopupContainer(), '--overlay');
	};

	#handleAdjustPosition = (baseEvent?: BaseEvent): void => {
		const { innerPopup, titleFieldHeight, animate } = baseEvent?.getData() ?? {};
		if (!innerPopup)
		{
			this.#popup.setOffset({
				offsetTop: 0,
			});
			this.#adjustPosition();

			return;
		}

		const innerPopupContainer = innerPopup.getPopupContainer();
		const popupContainer = this.#popup.getPopupContainer();

		const heightDifference = innerPopupContainer.offsetHeight - popupContainer.offsetHeight;
		const popupPaddingTop = 20;
		const offset = titleFieldHeight + heightDifference / 2 + popupPaddingTop * 2;

		Dom.style(popupContainer, '--overlay-offset-top', `-${offset}px`);
		if (!animate)
		{
			this.#adjustPosition();
			Dom.style(popupContainer, 'transition', 'none');
			setTimeout(() => Dom.style(popupContainer, 'transition', null));
		}
	};

	#adjustPosition(): void
	{
		this.#popup.adjustPosition({
			forceBindPosition: true,
		});
	}

	#handlePopupShow = (event): void => {
		this.#handlePopupShow.openedPopupsCount ??= 0;

		const popup: Popup = event.getCompatData()[0];
		const popupContainer = this.#popup.getPopupContainer();

		const onClose = (): void => {
			popup.unsubscribe('onClose', onClose);
			popup.unsubscribe('onDestroy', onClose);

			this.#handlePopupShow.openedPopupsCount--;
			if (this.#handlePopupShow.openedPopupsCount === 0)
			{
				Dom.removeClass(popupContainer, '--disable-drag');
			}
		};

		popup.subscribe('onClose', onClose);
		popup.subscribe('onDestroy', onClose);

		this.#handlePopupShow.openedPopupsCount++;
		Dom.addClass(popupContainer, '--disable-drag');
	};

	#getInitialGroupId(): number | null
	{
		if (this.#params.groupId && Core.getParams().currentUser?.type === UserTypes.Collaber)
		{
			const group = Core.getStore()?.getters[`${Model.Groups}/getById`](this.#params.groupId);
			if (group && group.type !== GroupType.Collab)
			{
				return Core.getParams().defaultCollab?.id;
			}
		}

		return this.#params.groupId || Core.getParams().defaultCollab?.id || undefined;
	}
}
