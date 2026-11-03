'use strict';

import { Event, Loc, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import 'ui.design-tokens.air';

import './css/plannerlimithint.css';

type PlannerLimitHintOptions = {
	bindElement: HTMLElement;
	angleTarget?: () => HTMLElement | null;
	targetContainer?: HTMLElement | null;
	zIndex?: number;
	maxPlannerUsers?: number | string;
};

const POPUP_MAX_WIDTH = 425;
const POPUP_HORIZONTAL_GAP = 16;
const ANGLE_WIDTH = 33; // width of the main.popup angle element
const ANGLE_TARGET_OFFSET = 100;
const ANGLE_RIGHT_GAP = 40; // distance from the popup right edge to the angle

export class PlannerLimitHint extends EventEmitter
{
	#bindElement: HTMLElement;
	#angleTarget: (() => HTMLElement | null) | null;
	#targetContainer: HTMLElement | null;
	#zIndex: number;
	#maxPlannerUsers: number;
	#popup: Popup | null = null;
	#shouldBeShown = false;
	#titleId: string = `calendar-planner-limit-hint-title-${Text.getRandom().toLowerCase()}`;

	constructor(options: PlannerLimitHintOptions)
	{
		super();
		this.setEventNamespace('BX.Calendar.PlannerLimitHint');

		this.#bindElement = options.bindElement;
		this.#angleTarget = options.angleTarget ?? null;
		this.#targetContainer = options.targetContainer ?? null;
		this.#zIndex = options.zIndex ?? 0;
		this.#maxPlannerUsers = parseInt(String(options.maxPlannerUsers ?? 0), 10) || 0;
	}

	setMaxPlannerUsers(maxPlannerUsers: number | string): void
	{
		const normalizedMaxPlannerUsers = parseInt(String(maxPlannerUsers), 10) || 0;
		if (normalizedMaxPlannerUsers === this.#maxPlannerUsers)
		{
			return;
		}

		this.#maxPlannerUsers = normalizedMaxPlannerUsers;
		this.#popup?.setContent(this.#render());
	}

	show(): void
	{
		this.#shouldBeShown = true;
		this.#showPopup();
		LiveAnnouncer.announce(this.#getAnnouncementText(), 'polite');
	}

	close(): void
	{
		this.#shouldBeShown = false;
		this.#popup?.close();
	}

	destroy(): void
	{
		this.#shouldBeShown = false;
		Event.unbind(window, 'resize', this.#handleWindowResize);
		this.#popup?.destroy();
		this.#popup = null;
	}

	#getPopup(): Popup
	{
		if (!this.#popup)
		{
			const popupOptions = {
				bindElement: this.#bindElement,
				targetContainer: this.#targetContainer ?? undefined,
				zIndexOptions: { alwaysOnTop: this.#zIndex },
				bindOptions: { position: 'top', forceBindPosition: true },
				angle: true,
				borderRadius: '18px',
				background: 'var(--ui-color-accent-main-primary)',
				padding: 0,
				width: this.#getPopupWidth(),
				content: this.#render(),
				animation: 'fading-slide',
				ariaLabelledBy: this.#titleId,
				autoHide: false,
				closeByEsc: false,
				focusTrap: false,
				events: {
					onClose: () => {
						this.#shouldBeShown = false;
					},
					onAfterClose: () => {
						if (this.#shouldBeShown)
						{
							this.#showPopup();
						}
					},
				},
			};
			this.#popup = new Popup(popupOptions);

			Event.bind(window, 'resize', this.#handleWindowResize);
		}

		return this.#popup;
	}

	#showPopup(): void
	{
		this.#getPopup().show();
		this.#adjustToBindElement();
	}

	#getPopupWidth(): number
	{
		const viewportWidth = document.documentElement.clientWidth || window.innerWidth || POPUP_MAX_WIDTH;
		const containerWidth = this.#targetContainer?.clientWidth || viewportWidth;
		const availableWidth = Math.min(viewportWidth, containerWidth);

		return Math.max(1, Math.min(POPUP_MAX_WIDTH, availableWidth - POPUP_HORIZONTAL_GAP * 2));
	}

	#adjustToBindElement(): void
	{
		const popup = this.#popup;
		if (!popup)
		{
			return;
		}

		popup.setWidth(this.#getPopupWidth());

		const popupWidth = popup.getPopupContainer().offsetWidth;
		const elementWidth = this.#bindElement.offsetWidth;
		const angleTarget = this.#angleTarget?.();

		if (angleTarget)
		{
			this.#adjustToAngleTarget(popup, angleTarget);

			return;
		}

		popup.setOffset({ offsetLeft: elementWidth - popupWidth });
		popup.adjustPosition();
		popup.setAngle({ offset: Math.max(0, popupWidth - ANGLE_WIDTH - ANGLE_RIGHT_GAP) });
	}

	#getAngleTargetOffset(angleTarget: HTMLElement): number
	{
		const bindElementRect = this.#bindElement.getBoundingClientRect();
		const angleTargetRect = angleTarget.getBoundingClientRect();

		return angleTargetRect.left - bindElementRect.left + angleTargetRect.width / 2;
	}

	#adjustToAngleTarget(popup: Popup, angleTarget: HTMLElement): void
	{
		const angleTargetOffset = this.#getAngleTargetOffset(angleTarget);
		popup.setOffset({
			offsetLeft: angleTargetOffset
				- ANGLE_TARGET_OFFSET
				- ANGLE_WIDTH / 2
				+ Number(Popup.getOption('angleLeftOffset')),
		});
		popup.adjustPosition();

		const popupContainer = popup.getPopupContainer();
		const angleTargetRect = angleTarget.getBoundingClientRect();
		const targetCenter = angleTargetRect.left + angleTargetRect.width / 2;
		const adjustedPopupRect = popupContainer.getBoundingClientRect();
		popup.setAngle({
			offset: targetCenter - adjustedPopupRect.left - ANGLE_WIDTH / 2,
		});
	}

	#handleWindowResize = (): void => {
		if (this.#popup?.isShown())
		{
			this.#adjustToBindElement();
		}
	};

	#getTitle(): string
	{
		return Loc.getMessage('EC_PLANNER_LIMIT_TITLE', {
			'#COUNT#': this.#maxPlannerUsers,
		}) ?? '';
	}

	#getText(): string
	{
		return Loc.getMessage('EC_PLANNER_LIMIT_TEXT', {
			'#COUNT#': this.#maxPlannerUsers,
		}) ?? '';
	}

	#getAnnouncementText(): string
	{
		return [this.#getTitle(), this.#getText()].filter(Boolean).join('. ');
	}

	#render(): HTMLElement
	{
		return Tag.render`
			<div class="calendar-planner-limit-hint">
				<div class="calendar-planner-limit-hint__icon" aria-hidden="true"></div>
				<div class="calendar-planner-limit-hint__body">
					<div id="${this.#titleId}" class="calendar-planner-limit-hint__title">
						${this.#getTitle()}
					</div>
					<div class="calendar-planner-limit-hint__text">
						${this.#getText()}
					</div>
				</div>
				${this.#renderCloseButton()}
			</div>
		`;
	}

	#renderCloseButton(): HTMLButtonElement
	{
		const button: HTMLButtonElement = Tag.render`
			<button
				type="button"
				class="calendar-planner-limit-hint__close"
				aria-label="${Loc.getMessage('EC_PLANNER_LIMIT_CLOSE') ?? ''}"
			></button>
		`;

		Event.bind(button, 'mousedown', (event) => {
			event.stopPropagation();
		});

		Event.bind(button, 'click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.close();
			this.emit('onUserClose');
		});

		return button;
	}
}
