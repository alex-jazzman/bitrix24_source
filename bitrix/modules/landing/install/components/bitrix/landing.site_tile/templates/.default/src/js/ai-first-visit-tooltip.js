import { Tag, Type, ajax as Ajax } from 'main.core';
import { Popup } from 'main.popup';

const SHOW_DELAY = 3000;
const POPUP_WIDTH = 420;
const ARROW_OFFSET = 30;
const ARROW_WIDTH = 36;
const ARROW_HEIGHT = 13;
const ARROW_ANCHOR_HORIZONTAL_RATIO = 0.15;
const ARROW_ANCHOR_VERTICAL_OFFSET = 15;

export class LandingSitesAiFirstVisitTooltip
{
	static instance = null;

	static init(options)
	{
		this.instance = new this(options);
		this.instance.scheduleShow();

		return this.instance;
	}

	constructor(options)
	{
		this.options = options || {};
		this.anchor = this.options.bindElement || null;
		this.popup = null;
		this.content = null;
		this.hasShown = false;
		this.hasSeenRequestSent = false;
		this.isPositionUpdateEventsBound = false;
		this.showTimeout = null;
		this.handleAnchorTransitionEnd = this.handleAnchorTransitionEnd.bind(this);
	}

	scheduleShow()
	{
		if (!this.shouldShow())
		{
			return;
		}

		this.showTimeout = window.setTimeout(() => {
			this.showTimeout = null;
			this.show();
		}, SHOW_DELAY);
	}

	show()
	{
		if (!this.shouldShow())
		{
			return;
		}

		const popup = this.getPopup();
		this.updateArrowOffset();
		popup.show();
		this.hasShown = true;
		this.bindPositionUpdateEvents();
		this.scheduleAdjustPosition();
		this.markSeen();
	}

	shouldShow(): boolean
	{
		return this.options.shouldShow === true
			&& this.anchor instanceof HTMLElement
			&& !this.hasShown
		;
	}

	getPopup(): Popup
	{
		if (!this.popup)
		{
			this.popup = new Popup({
				id: 'landing-sites-ai-first-visit-tooltip',
				bindElement: this.anchor,
				content: this.getContent(),
				className: 'landing-sites-ai-first-visit-tooltip-popup ui-hint-popup ui-hint-popup-interactivity',
				darkMode: true,
				width: POPUP_WIDTH,
				minWidth: POPUP_WIDTH,
				maxWidth: POPUP_WIDTH,
				autoHide: true,
				closeByEsc: true,
				closeIcon: true,
				noAllPaddings: true,
				bindOptions: {
					forceTop: true,
					forceLeft: true,
				},
				angle: {
					position: 'top',
					offset: ARROW_OFFSET,
				},
				contentBackground: 'transparent',
				background: 'var(--ui-color-accent-soft-element-blue, #0056BF)',
			});
		}

		return this.popup;
	}

	getContent(): HTMLElement
	{
		if (!this.content)
		{
			this.content = Tag.render`
				<div class="landing-sites-ai-first-visit-tooltip" data-testid="landing-sites-ai-first-visit-tooltip">
					<div class="landing-sites-ai-first-visit-tooltip__image" aria-hidden="true"></div>
					<div class="landing-sites-ai-first-visit-tooltip__content">
						<div class="landing-sites-ai-first-visit-tooltip__title">
							${this.options.title || ''}
						</div>
						<div class="landing-sites-ai-first-visit-tooltip__text">
							${this.options.text || ''}
						</div>
					</div>
				</div>
			`;
		}

		return this.content;
	}

	bindPositionUpdateEvents()
	{
		if (this.isPositionUpdateEventsBound)
		{
			return;
		}

		this.anchor.addEventListener('transitionend', this.handleAnchorTransitionEnd);
		this.anchor.querySelector('[data-landing-sites-ai-input-box]')?.addEventListener(
			'transitionend',
			this.handleAnchorTransitionEnd,
		);
		this.isPositionUpdateEventsBound = true;
	}

	handleAnchorTransitionEnd()
	{
		this.scheduleAdjustPosition();
	}

	scheduleAdjustPosition()
	{
		this.adjustPosition();
		requestAnimationFrame(() => {
			this.adjustPosition();
			requestAnimationFrame(() => {
				this.adjustPosition();
			});
		});
	}

	adjustPosition()
	{
		if (!this.popup || !Type.isFunction(this.popup.adjustPosition))
		{
			return;
		}

		this.updateArrowOffset();
		this.popup.adjustPosition({
			forceTop: true,
			forceLeft: true,
			forceBindPosition: true,
		});
	}

	updateArrowOffset()
	{
		if (!Type.isFunction(this.popup.setOffset) || !this.anchor)
		{
			return;
		}

		const anchorWidth = this.anchor.offsetWidth;
		const anchorHeight = this.anchor.offsetHeight;
		const angleLeftOffset = Popup.getOption('angleLeftOffset');
		const angleHeight = Popup.getOption('angleTopOffset');

		this.popup.setOffset({
			offsetLeft: Math.round(
				anchorWidth * ARROW_ANCHOR_HORIZONTAL_RATIO
					- ARROW_OFFSET
					- ARROW_WIDTH / 2
					+ (Type.isNumber(angleLeftOffset) ? angleLeftOffset : 40),
			),
			offsetTop: Math.round(
				ARROW_HEIGHT
					- anchorHeight / 2
					+ ARROW_ANCHOR_VERTICAL_OFFSET
					- (Type.isNumber(angleHeight) ? angleHeight : 10),
			),
		});
	}

	markSeen()
	{
		if (
			this.hasSeenRequestSent
			|| !this.options.component
			|| !this.options.action
			|| !Ajax
			|| !Type.isFunction(Ajax.runComponentAction)
		)
		{
			return;
		}

		this.hasSeenRequestSent = true;
		Ajax.runComponentAction(this.options.component, this.options.action, {
			mode: 'class',
			data: {},
		}).catch(() => {});
	}
}
