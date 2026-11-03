import { Dom, Event, Tag, Text, Type } from 'main.core';
import { Popup } from 'main.popup';
import { FocusNavigator, InteractivityChecker } from 'ui.a11y';
import 'ui.design-tokens.air';
import 'ui.system.typography';

import {
	CardSide,
	IMAGE_PATH,
	POINTER_EDGE_MARGIN,
	POINTER_SEAM,
	PointerShape,
	StepImageFit,
	WATER_SCHEME,
} from '../../const';
import { type CoachmarkOptions } from '../../types';
import { WaterBackdrop } from './water-backdrop';

import './coachmark.css';

const CARD_RADIUS = 16;
const TARGET_GAP = 12;
const POINTER_MODIFIERS = ['--up', '--left', '--right'];

type CardBox = { x: number, y: number, width: number, height: number };

function cardOutline(x: number, y: number, width: number, height: number, radius: number): string
{
	const right = x + width;
	const bottom = y + height;

	return (
		`M${x + radius} ${y}H${right - radius}`
		+ `A${radius} ${radius} 0 0 1 ${right} ${y + radius}V${bottom - radius}`
		+ `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}H${x + radius}`
		+ `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}V${y + radius}`
		+ `A${radius} ${radius} 0 0 1 ${x + radius} ${y}Z`
	);
}

function prefersReducedMotion(): boolean
{
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Coachmark card of the report onboarding: an illustration column, a title with a description
 * and a footer with the step pagination and the actions. Stands next to its target and is held
 * to it by the card pointer only - the layout has no target highlight and no dimming.
 *
 * The card is deliberately not modal: its steps point at the page behind it, so the rest of the
 * document stays reachable and the keyboard is never locked inside. What the card does take is
 * the focus, and it gives it back to the opener when it closes.
 */
export class Coachmark
{
	#options: CoachmarkOptions;
	#popup: Popup | null = null;
	#water: WaterBackdrop | null = null;
	readonly #clipId: string;
	readonly #titleId: string;
	readonly #descriptionId: string;
	readonly #popupId: string;
	#wrapper: HTMLElement | null = null;
	#card: HTMLElement | null = null;
	#visual: HTMLElement | null = null;
	#title: HTMLElement | null = null;
	#description: HTMLElement | null = null;
	#counter: HTMLElement | null = null;
	#previousArrow: HTMLButtonElement | null = null;
	#actions: HTMLElement | null = null;
	#clipShape: SVGPathElement | null = null;
	#opener: HTMLElement | null = null;
	#isClosing: boolean = false;

	constructor(options: CoachmarkOptions)
	{
		const uid = options.id ?? Text.getRandom();

		this.#options = options;
		this.#popupId = `biconnector-dashboard-onboarding-${uid}`;
		this.#clipId = `biconnector-dashboard-onboarding-clip-${uid}`;
		this.#titleId = `biconnector-dashboard-onboarding-title-${uid}`;
		this.#descriptionId = `biconnector-dashboard-onboarding-description-${uid}`;
	}

	show(): void
	{
		if (this.#popup)
		{
			return;
		}

		this.#opener = FocusNavigator.getActiveElement();

		this.#popup = new Popup({
			id: this.#popupId,
			className: 'biconnector-dashboard-onboarding-popup',
			// Surface context of the card, set through the option and not through the class name:
			// main.popup puts a context class of its own on the same node, and two of them on one
			// node leave the winner to the order of rules in the token file.
			designSystemContext: '--ui-context-content-dark',
			bindElement: this.#options.target,
			content: this.#render(),
			padding: 0,
			contentPadding: 0,
			// No width option on purpose: main.popup answers it with overflow-x on the content
			// container, and that clips the pointer sticking out of the card. The card sets its
			// own width in CSS instead.

			autoHide: false,
			closeByEsc: true,
			closeIcon: false,
			cacheable: false,
			animation: prefersReducedMotion() ? false : 'fading-slide',
			angle: false,
			// The tour is not modal, so the keyboard must stay free to reach the page the steps
			// point at. Said explicitly: left out, the trap is decided by a portal setting.
			focusTrap: false,
			ariaLabelledBy: this.#titleId,
			ariaDescribedBy: this.#descriptionId,
			bindOptions: { forceBindPosition: true },
			events: {
				onShow: () => {
					this.#applyPosition();
					this.#water?.start();
					this.#focusCard();
				},
				onPopupClose: () => {
					// Closing takes an animation, and the splash has no business running through
					// it - the next card of the tour is already painting its own.
					this.#water?.stop();
					this.#restoreFocus();
					this.#handleClose();
				},
				onPopupDestroy: () => {
					this.#water?.destroy();
					this.#water = null;
					this.#popup = null;
					this.#releaseNodes();
				},
			},
		});

		this.#popup.show();
	}

	/**
	 * Moves the card on to another step in place of closing it and opening the next one. The
	 * dialog keeps its node, so the focus standing inside it survives, the accessibility tree
	 * never holds two cards of the same tour at once, and the water splash carries on.
	 *
	 * Only the filling changes: every tour step is the same card - a mascot, the step counter
	 * and one action - and the nodes of a card whose shape differs are rebuilt.
	 */
	update(options: CoachmarkOptions): void
	{
		this.#options = options;

		if (!this.#popup || !this.#card)
		{
			return;
		}

		Dom.attr(this.#card, 'data-card-id', options.id ?? '');
		this.#setText(this.#title, options.title);
		this.#setText(this.#description, options.text);
		this.#updateVisual();
		this.#updatePagination();
		this.#updateActions();

		this.#applyPointerMode();
		this.#popup.setBindElement(options.target);
		this.#applyPosition();
	}

	close(): void
	{
		this.#isClosing = true;
		this.#popup?.close();
		this.#isClosing = false;
	}

	#handleClose(): void
	{
		if (this.#isClosing)
		{
			return;
		}

		this.#options.onClose();
	}

	#focusCard(): void
	{
		const container = this.#popup?.getPopupContainer();
		if (container)
		{
			FocusNavigator.focusContainer(container, { preventScroll: true });
		}
	}

	/**
	 * Only the focus the card itself holds is given back: a visitor who has already moved on to
	 * the report keeps their place.
	 */
	#restoreFocus(): void
	{
		const opener = this.#opener;
		const container = this.#popup?.getPopupContainer();
		const active = FocusNavigator.getActiveElement();

		this.#opener = null;

		if (!container || !active || !container.contains(active))
		{
			return;
		}

		if (opener && InteractivityChecker.isFocusable(opener))
		{
			FocusNavigator.restoreFocus(opener, { preventScroll: true });
		}
	}

	/**
	 * The pointer sits on the card edge facing the target, so the card lands on the opposite
	 * side of it: side "left" means the card stands to the right of the target.
	 */
	#getPointerMode(): 'up' | 'left' | 'right'
	{
		if (this.#options.side === CardSide.Left)
		{
			return 'left';
		}

		return this.#options.side === CardSide.Right ? 'right' : 'up';
	}

	/**
	 * Strip the wrapper keeps for the beak on the pointer side. The beak sinks POINTER_SEAM into
	 * the card, so the strip is that much shorter than the beak itself.
	 */
	#getPointerReserve(): number
	{
		const shape = PointerShape[this.#getPointerMode()];
		const depth = this.#options.side === CardSide.Top ? shape.height : shape.width;

		return depth - POINTER_SEAM;
	}

	/**
	 * Where the card starts inside the wrapper: past the strip left to the beak.
	 */
	#getCardOrigin(): { x: number, y: number }
	{
		const reserve = this.#getPointerReserve();

		if (this.#options.side === CardSide.Top)
		{
			return { x: 0, y: reserve };
		}

		return { x: this.#options.side === CardSide.Left ? reserve : 0, y: 0 };
	}

	/**
	 * Box of the card inside the wrapper. The strip of the beak belongs to the wrapper, so on the
	 * pointer side the card is that much narrower - or shorter, for the top pointer - than the
	 * measured box. An outline as wide as the wrapper hangs past its right edge, and the rounded
	 * corners drawn there are never painted: the card ends in a straight cut.
	 */
	#getCardBox(box: DOMRect): CardBox
	{
		const origin = this.#getCardOrigin();
		const reserve = this.#getPointerReserve();
		const isSidePointer = this.#options.side !== CardSide.Top;

		return {
			x: origin.x,
			y: origin.y,
			width: Math.round(box.width - (isSidePointer ? reserve : 0)),
			height: Math.round(box.height - (isSidePointer ? 0 : reserve)),
		};
	}

	#applyPointerMode(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		const mode = this.#getPointerMode();
		const reserve = `${this.#getPointerReserve()}px`;

		Dom.removeClass(this.#wrapper, POINTER_MODIFIERS);
		Dom.addClass(this.#wrapper, `--${mode}`);
		Dom.style(this.#wrapper, {
			'padding-top': mode === 'up' ? reserve : '0',
			'padding-left': mode === 'left' ? reserve : '0',
			'padding-right': mode === 'right' ? reserve : '0',
		});
	}

	/**
	 * Places the card beside its target: below it for the top pointer, and vertically centered
	 * on the left or on the right for the side pointers. Offsets are measured to the wrapper,
	 * which starts a beak strip earlier than the card on the pointer side.
	 */
	#applyPosition(): void
	{
		if (!this.#popup)
		{
			return;
		}

		const target = this.#options.target.getBoundingClientRect();
		const origin = this.#getCardOrigin();
		const cardWidth = this.#popup.getPopupContainer().offsetWidth;

		if (this.#options.side === CardSide.Top)
		{
			this.#popup.setOffset({
				offsetLeft: Math.round((target.width / 2) - (cardWidth / 2)),
				offsetTop: TARGET_GAP - origin.y,
			});
		}
		else
		{
			const cardHeight = this.#popup.getPopupContainer().offsetHeight;
			const offsetLeft = this.#options.side === CardSide.Left
				? Math.round(target.width) + TARGET_GAP - origin.x
				: -(cardWidth + TARGET_GAP);

			this.#popup.setOffset({
				offsetLeft,
				offsetTop: -Math.round(target.height / 2 + (cardHeight / 2)),
			});
		}

		this.#popup.adjustPosition();
		this.#aimPointer();
	}

	/**
	 * Keeps the beak on the target center even when the card was shifted to stay on screen, and
	 * keeps the clipped card outline in sync with the measured card height.
	 */
	#aimPointer(): void
	{
		if (!this.#popup || !this.#clipShape)
		{
			return;
		}

		const target = this.#options.target.getBoundingClientRect();
		const box = this.#popup.getPopupContainer().getBoundingClientRect();
		const card = this.#getCardBox(box);
		const shape = PointerShape[this.#getPointerMode()];
		const { x, y } = this.#getPointerOffset(target, box, card);

		this.#clipShape.setAttribute(
			'd',
			`${cardOutline(card.x, card.y, card.width, card.height, CARD_RADIUS)} ${shape.path(x, y)}`,
		);
	}

	/**
	 * Where the beak sits in the wrapper coordinates. It starts at the very edge of the box and
	 * sinks POINTER_SEAM into the card: a beak that stops at the card edge leaves a hairline
	 * between the two, and Chromium drops it from the clip outright.
	 */
	#getPointerOffset(target: DOMRect, box: DOMRect, card: CardBox): { x: number, y: number }
	{
		const shape = PointerShape[this.#getPointerMode()];

		if (this.#options.side === CardSide.Top)
		{
			const left = target.left + (target.width / 2) - box.left - shape.apex;
			const maxLeft = card.width - shape.width - POINTER_EDGE_MARGIN;

			return {
				x: Math.round(Math.min(Math.max(left, POINTER_EDGE_MARGIN), maxLeft)),
				y: 0,
			};
		}

		const top = target.top + (target.height / 2) - box.top - shape.apex;
		const maxTop = card.height - shape.height - POINTER_EDGE_MARGIN;

		return {
			x: this.#options.side === CardSide.Left ? 0 : card.x + card.width - POINTER_SEAM,
			y: Math.round(Math.min(Math.max(top, POINTER_EDGE_MARGIN), maxTop)),
		};
	}

	/**
	 * The card and its pointer are one clipped surface: the water canvas spans the wrapper and
	 * a clip path cuts out the rounded card plus the beak, so the splash flows into the pointer
	 * instead of leaving it a flat silhouette.
	 *
	 * The wrapper opens a strip for the beak on the pointer side and the card starts past it:
	 * Safari intersects a clip path with the border box of the element it clips, so a beak
	 * hanging over the card edge is never painted there.
	 */
	#render(): HTMLElement
	{
		this.#water = new WaterBackdrop(WATER_SCHEME);

		this.#wrapper = (Tag.render`
			<div class="biconnector-dashboard-onboarding-wrapper">
				${this.#renderClipShape()}
				${this.#water.render()}
				${this.#renderCard()}
			</div>
		`) as HTMLElement;

		Dom.style(this.#wrapper, 'clip-path', `url(#${this.#clipId})`);
		this.#applyPointerMode();

		return this.#wrapper;
	}

	/**
	 * The card and the beak go into one single path, and that path is parsed together with its
	 * svg. Both matter:
	 *
	 * - a shape built as its own fragment lands in the HTML namespace, so the clip holds no
	 *   geometry at all and cuts the whole card away;
	 * - a clip made of two shapes loses the one lying outside the card box - the beak - in
	 *   Chromium and in WebKit, each on its own terms.
	 *
	 * The outline is filled in by #aimPointer, once the card has been measured.
	 */
	#renderClipShape(): SVGElement
	{
		const clip = (Tag.render`
			<svg class="biconnector-dashboard-onboarding__clip" width="0" height="0" aria-hidden="true">
				<clipPath id="${this.#clipId}" clipPathUnits="userSpaceOnUse">
					<path d=""></path>
				</clipPath>
			</svg>
		`) as SVGElement;

		this.#clipShape = clip.querySelector('path');

		return clip;
	}

	/**
	 * The close control comes first in the markup and is put back into the right top corner by
	 * the flex order: it is the way out of a card standing over the report, and a keyboard has
	 * no business walking the whole step to reach it.
	 */
	#renderCard(): HTMLElement
	{
		this.#title = (Tag.render`
			<span
				class="biconnector-dashboard-onboarding__title"
				id="${this.#titleId}"
				role="heading"
				aria-level="2"
				data-testid="biconnector-dashboard-onboarding-title"
			>${Text.encode(this.#options.title)}</span>
		`) as HTMLElement;

		this.#description = (Tag.render`
			<p
				class="biconnector-dashboard-onboarding__description"
				id="${this.#descriptionId}"
				data-testid="biconnector-dashboard-onboarding-text"
			>${Text.encode(this.#options.text)}</p>
		`) as HTMLElement;

		this.#card = (Tag.render`
			<div
				class="biconnector-dashboard-onboarding"
				data-testid="biconnector-dashboard-onboarding-card"
				data-card-id="${Text.encode(this.#options.id ?? '')}"
			>
				${this.#renderCloseButton()}
				${this.#renderVisual()}
				<div class="biconnector-dashboard-onboarding__content">
					<div class="biconnector-dashboard-onboarding__text">
						${this.#title}
						${this.#description}
					</div>
					<div class="biconnector-dashboard-onboarding__footer">
						${this.#renderPagination()}
						${this.#renderActions()}
					</div>
				</div>
			</div>
		`) as HTMLElement;

		return this.#card;
	}

	#renderVisual(): HTMLElement
	{
		if (Type.isDomNode(this.#options.illustrationNode))
		{
			// Fitted design system icon: used where the layout asks for a graphic library image.
			this.#visual = (Tag.render`
				<div class="biconnector-dashboard-onboarding__visual --icon">
					${this.#options.illustrationNode}
				</div>
			`) as HTMLElement;

			return this.#visual;
		}

		// Mascot: normalized to a single crop window and cut by the bottom edge of the card.
		const image = (Tag.render`
			<img
				class="biconnector-dashboard-onboarding__image"
				src="${Text.encode(IMAGE_PATH + this.#options.image)}"
				alt=""
				draggable="false"
			>
		`) as HTMLImageElement;

		this.#applyImageFit(image);

		this.#visual = (Tag.render`
			<div class="biconnector-dashboard-onboarding__visual">
				<div class="biconnector-dashboard-onboarding__visual-inner">
					${image}
				</div>
			</div>
		`) as HTMLElement;

		return this.#visual;
	}

	/**
	 * Zoom and shifts of a mascot whose frame differs from the rest of the set, see StepImageFit.
	 * The card hands them to the css, which holds the crop window itself.
	 */
	#applyImageFit(image: HTMLImageElement): void
	{
		const fit = StepImageFit[this.#options.image ?? ''];
		if (!fit)
		{
			return;
		}

		Dom.style(image, {
			'--biconnector-onboarding-mascot-scale': String(fit.scale),
			'--biconnector-onboarding-mascot-shift-x': `${fit.shiftX}px`,
			'--biconnector-onboarding-mascot-shift-y': `${fit.shiftY}px`,
		});
	}

	#updateVisual(): void
	{
		const previous = this.#visual;
		if (previous)
		{
			Dom.replace(previous, this.#renderVisual());
		}
	}

	#renderPagination(): HTMLElement | string
	{
		if (!this.#options.pagination)
		{
			return '';
		}

		this.#counter = (Tag.render`
			<span
				class="biconnector-dashboard-onboarding__counter"
				data-testid="biconnector-dashboard-onboarding-counter"
			></span>
		`) as HTMLElement;

		this.#previousArrow = this.#renderArrow('prev');
		const nextArrow = this.#renderArrow('next');

		Event.bind(this.#previousArrow, 'click', () => {
			if (this.#previousArrow?.getAttribute('aria-disabled') === 'true')
			{
				return;
			}

			this.#options.pagination?.onPrev();
		});
		Event.bind(nextArrow, 'click', () => this.#options.pagination?.onNext());

		const pagination = (Tag.render`
			<div class="biconnector-dashboard-onboarding__pagination">
				${this.#previousArrow}
				${this.#counter}
				${nextArrow}
			</div>
		`) as HTMLElement;

		this.#updatePagination();

		return pagination;
	}

	/**
	 * On the first step the back arrow leads nowhere: it used to rebuild the very same step,
	 * while staying a stop of the keyboard walk.
	 */
	#updatePagination(): void
	{
		const pagination = this.#options.pagination;
		if (!pagination)
		{
			return;
		}

		this.#setText(this.#counter, `${pagination.current} / ${pagination.total}`);

		if (this.#previousArrow)
		{
			// aria-disabled, not the native flag: disabling a focused button drops focus to body.
			this.#previousArrow.setAttribute('aria-disabled', String(pagination.current <= 1));
		}
	}

	#renderArrow(direction: 'prev' | 'next'): HTMLButtonElement
	{
		const path = direction === 'prev'
			? 'M12.08 14.59a.58.58 0 010 .82.58.58 0 01-.83 0l-5-5a.58.58 0 010-.82l5-5a.58.58 0 01.83.82L7.49 10l4.59 4.59z'
			: 'M7.92 5.41a.58.58 0 01.83-.82l5 5a.58.58 0 010 .82l-5 5a.58.58 0 01-.83-.82L12.51 10 7.92 5.41z'
		;

		return (Tag.render`
			<button
				type="button"
				class="biconnector-dashboard-onboarding__arrow"
				data-testid="biconnector-dashboard-onboarding-${direction}-btn"
				aria-label="${direction === 'prev' ? Text.encode(this.#options.previousLabel) : Text.encode(this.#options.nextLabel)}"
			>
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
					<path d="${path}" fill="currentColor"></path>
				</svg>
			</button>
		`) as HTMLButtonElement;
	}

	#renderActions(): HTMLElement
	{
		const container = (Tag.render`<div class="biconnector-dashboard-onboarding__actions"></div>`) as HTMLElement;

		this.#actions = container;
		this.#fillActions(container);

		return container;
	}

	#fillActions(container: HTMLElement): void
	{
		this.#options.actions.forEach((action, index) => {
			Dom.append(this.#renderAction(index), container);
		});
	}

	#updateActions(): void
	{
		const container = this.#actions;
		if (!container)
		{
			return;
		}

		const buttons = [...container.children] as HTMLElement[];
		if (buttons.length === this.#options.actions.length)
		{
			buttons.forEach((button, index) => this.#applyActionDesign(button, index));

			return;
		}

		Dom.clean(container);
		this.#fillActions(container);
	}

	/**
	 * The handler reaches for the action through the current options, so a card moved on to the
	 * next step keeps its buttons - and with them the focus standing on one of them.
	 */
	#renderAction(index: number): HTMLElement
	{
		const button = (Tag.render`
			<button type="button" class="biconnector-dashboard-onboarding__button"></button>
		`) as HTMLElement;

		this.#applyActionDesign(button, index);
		Event.bind(button, 'click', () => this.#options.actions[index]?.onClick());

		return button;
	}

	#applyActionDesign(button: HTMLElement, index: number): void
	{
		const action = this.#options.actions[index];
		if (!action)
		{
			return;
		}

		const isPrimary = action.primary === true;

		Dom.removeClass(button, ['--filled', '--plain']);
		Dom.addClass(button, isPrimary ? '--filled' : '--plain');
		Dom.attr(button, 'data-testid', `biconnector-dashboard-onboarding-${isPrimary ? 'primary' : 'secondary'}-btn`);
		Dom.adjust(button, { text: action.text });
	}

	#renderCloseButton(): HTMLElement
	{
		const button = (Tag.render`
			<button
				type="button"
				class="biconnector-dashboard-onboarding__close"
				data-testid="biconnector-dashboard-onboarding-close-btn"
				aria-label="${Text.encode(this.#options.closeLabel)}"
			>
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
					<path
						d="M5.7 5.7a.6.6 0 01.84 0L10 9.16l3.46-3.47a.6.6 0 01.84.85L10.84 10l3.46 3.46a.6.6 0 01-.84.84L10 10.84 6.54 14.3a.6.6 0 01-.84-.84L9.16 10 5.7 6.54a.6.6 0 010-.84z"
						fill="currentColor"
					></path>
				</svg>
			</button>
		`) as HTMLElement;

		Event.bind(button, 'click', () => this.#popup?.close());

		return (Tag.render`
			<div class="biconnector-dashboard-onboarding__close-column">
				${button}
			</div>
		`) as HTMLElement;
	}

	#setText(node: HTMLElement | null, text: string): void
	{
		if (node)
		{
			Dom.adjust(node, { text });
		}
	}

	#releaseNodes(): void
	{
		this.#wrapper = null;
		this.#card = null;
		this.#visual = null;
		this.#title = null;
		this.#description = null;
		this.#counter = null;
		this.#previousArrow = null;
		this.#actions = null;
		this.#clipShape = null;
	}
}
