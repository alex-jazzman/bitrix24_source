import { Dom, Runtime, Tag, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';

import type { TaskCompactCard } from 'tasks.v2.application.task-compact-card';
import { TaskCardSkeleton } from './task-card-skeleton';
import './task-card.css';

export type Params = {
	taskId?: number,
	groupId?: number,
	deadlineTs?: number,
	analytics: AnalyticsParams,
};

export type AnalyticsParams = {
	context: string,
	additionalContext: string,
	element: string,
};

export class TaskCard
{
	#params: Params;
	#compactCardPopup: ?Popup = null;
	#layout: {
		popupContainer: HTMLElement,
		cardContainer: HTMLElement,
		dragHandle: HTMLElement,
	};

	#taskCardSkeleton: TaskCardSkeleton;
	#taskCompactCard: ?TaskCompactCard = null;

	constructor(params: Params = {})
	{
		this.#params = params;

		this.#layout = {};

		this.#params.taskId = Type.isUndefined(this.#params.taskId) ? 0 : this.#params.taskId;

		this.#taskCardSkeleton = new TaskCardSkeleton();
	}

	static async init(params: Params = {}): Promise
	{
		const {
			taskId = null,
			groupId = null,
			deadlineTs = null,
			analytics = {},
		} = params;

		const card = (taskId ? 'TaskFullCard' : 'TaskCompactCard');
		const extension = {
			TaskFullCard: 'tasks.v2.application.task-full-card',
			TaskCompactCard: 'tasks.v2.application.task-compact-card',
		};

		const exports = await Runtime.loadExtension([
			'tasks.v2.core',
			extension[card],
		]);

		return new (exports[card])({ taskId, groupId, deadlineTs, analytics });
	}

	showCompactCard(): void
	{
		const popupId = `tasks-compact-card-${this.#params.taskId}`;

		if (PopupManager.getPopupById(popupId))
		{
			return;
		}

		this.#compactCardPopup = new Popup({
			id: popupId,
			cacheable: false,
			width: 580,
			borderRadius: '16px',
			angle: false,
			content: this.#renderPopupContent(),
			closeByEsc: false,
			autoHide: false,
			closeIcon: false,
			noAllPaddings: true,
			contentBorderRadius: '8px',
			className: 'tasks-compact-card-popup',
			events: {
				onPopupAfterClose: async (popup: Popup) => {
					await this.#taskCompactCard.unmountCard();

					this.#unsubscribe(this.#taskCompactCard);

					popup.destroy();
				},
				onAfterPopupShow: async (popup: Popup) => {
					this.#layout.popupContainer = popup.getPopupContainer();

					this.#taskCompactCard = await TaskCard.init(this.#params);

					this.#taskCardSkeleton.removeCompactCardSkeleton();

					await this.#taskCompactCard.mountCard(this.#layout.cardContainer);

					Dom.append(this.#renderDragHandle(), this.#layout.cardContainer);

					this.#subscribe(this.#taskCompactCard);
				},
			},
			overlay: true,
			draggable: {
				element: this.#renderDragHandle(),
				restrict: true,
			},
		});

		this.#compactCardPopup.show();
	}

	#subscribe(taskCompactCard: TaskCompactCard): void
	{
		EventEmitter.subscribe('BX.Main.Popup:onShow', this.#handlePopupShow);

		taskCompactCard.subscribe('closeCard', this.#closeCompactCard);
		taskCompactCard.subscribe('openFullCard', this.#openFullCard);
		taskCompactCard.subscribe('adjustPosition', this.#adjustPosition);
		taskCompactCard.subscribe('showOverlay', this.#showOverlay);
		taskCompactCard.subscribe('hideOverlay', this.#hideOverlay);
	}

	#unsubscribe(taskCompactCard: TaskCompactCard): void
	{
		EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.#handlePopupShow);

		taskCompactCard.unsubscribe('closeCard', this.#closeCompactCard);
		taskCompactCard.unsubscribe('openFullCard', this.#openFullCard);
		taskCompactCard.unsubscribe('adjustPosition', this.#adjustPosition);
		taskCompactCard.unsubscribe('showOverlay', this.#showOverlay);
		taskCompactCard.unsubscribe('hideOverlay', this.#hideOverlay);
	}

	#renderPopupContent(): HTMLElement
	{
		this.#layout.cardContainer = Tag.render`
			<div class="tasks-task-compact-card-popup-content">
				${this.#taskCardSkeleton.renderCompactCardSkeleton()}
			</div>
		`;

		return this.#layout.cardContainer;
	}

	#renderDragHandle(): HTMLElement
	{
		this.#layout.dragHandle ??= Tag.render`
			<div class="tasks-compact-card-popup-drag-handle"></div>
		`;

		return this.#layout.dragHandle;
	}

	#handlePopupShow = (event): void => {
		this.#handlePopupShow.openedPopupsCount ??= 0;

		const popup: Popup = event.getCompatData()[0];

		const onClose = (): void => {
			popup.unsubscribe('onClose', onClose);
			popup.unsubscribe('onDestroy', onClose);

			this.#handlePopupShow.openedPopupsCount--;
			if (this.#handlePopupShow.openedPopupsCount === 0)
			{
				Dom.removeClass(this.#layout.dragHandle, '--disabled');
			}
		};

		popup.subscribe('onClose', onClose);
		popup.subscribe('onDestroy', onClose);

		this.#handlePopupShow.openedPopupsCount++;
		Dom.addClass(this.#layout.dragHandle, '--disabled');
	};

	#closeCompactCard = (): void => {
		this.#compactCardPopup.close();
	};

	#openFullCard = async (baseEvent: BaseEvent): void => {
		const { TaskFullCard } = await Runtime.loadExtension('tasks.v2.application.task-full-card');

		this.#params.taskId = baseEvent.getData();

		await (new TaskFullCard(this.#params)).showCard();

		this.#closeCompactCard();
	};

	#adjustPosition = (baseEvent: BaseEvent = null): void => {
		const { innerPopup, titleFieldHeight, animate } = baseEvent?.getData() ?? {};
		if (!innerPopup)
		{
			this.#compactCardPopup.setOffset({
				offsetTop: 0,
			});
			this.#compactCardPopup.adjustPosition({
				forceBindPosition: true,
			});

			return;
		}

		const innerPopupContainer = innerPopup.getPopupContainer();

		const heightDifference = innerPopupContainer.offsetHeight - this.#layout.popupContainer.offsetHeight;
		const popupPaddingTop = 20;
		const offset = titleFieldHeight + heightDifference / 2 + popupPaddingTop * 2;

		Dom.style(this.#layout.popupContainer, '--overlay-offset-top', `-${offset}px`);
		if (!animate)
		{
			this.#compactCardPopup.adjustPosition({
				forceBindPosition: true,
			});
			Dom.style(this.#layout.popupContainer, 'transition', 'none');
			setTimeout(() => Dom.style(this.#layout.popupContainer, 'transition', null));
		}
	};

	#showOverlay = (): void => {
		this.#compactCardPopup.adjustPosition({
			forceBindPosition: true,
		});
		Dom.addClass(this.#compactCardPopup.getPopupContainer(), '--overlay');
	};

	#hideOverlay = (): void => {
		Dom.removeClass(this.#compactCardPopup.getPopupContainer(), '--overlay');
	};
}
