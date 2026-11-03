import { Dom, Event, Loc, Tag, Text as TextUtil, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { Button, type ButtonOptions } from 'ui.buttons';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';
import { Headline, Text } from 'ui.system.typography';

import {
	WhatsNewActionsAlign,
	WhatsNewBackdrop,
	WhatsNewColor,
	WhatsNewGalleryNav,
	WhatsNewMediaPosition,
	WhatsNewSize,
} from './const';
import { Backdrop } from './backdrop/backdrop';
import { renderBleed } from './media/bleed';
import { Gallery } from './media/gallery';
import { renderVideo } from './media/video';
import { getSceneLayers, Scene, SceneVariant } from './scene/scene';
import { StepNav } from './step-nav';
import {
	type WhatsNewBackdropOrigin,
	type WhatsNewGallerySlide,
	type WhatsNewItem,
	type WhatsNewOptions,
	type WhatsNewScene,
	type WhatsNewVideo,
} from './types';

import './whats-new.css';

const EVENT_NAMESPACE = 'BX.UI.System.WhatsNew';

const BLOCK_CLASS = 'ui-system-whats-new';
const SCROLL_LOCK_CLASS = 'ui-system-whats-new__disable-scrolling';
/*
 * How many windows hold the scrolling of the page at this moment. The lock is one class on the body, so two
 * open announcements share it: the class goes on with the first of them and comes off with the last, and a
 * window that never took the lock - closed, destroyed, or asked not to lock at all - takes it from nobody.
 */
let scrollLockOwners = 0;

/*
 * The place the page stood at when the first of those windows took the lock. The lock takes the page out of
 * the flow, and a page out of the flow stands at its top: the offset is kept as a shift of the body while the
 * lock holds and given back to the page once the last owner lets it go.
 */
let scrollLockOffset = 0;

// The variable the shift of the locked page is written through. The styles of the lock read it, so the class
// stays the one surface the lock is drawn by.
const SCROLL_LOCK_OFFSET_VARIABLE = '--ui-system-whats-new-scroll-offset';

// The window paints its own solid background, so it declares the surface context it is coloured for. The
// palette of the filled design the card is drawn in is the one of this context.
const SURFACE_CONTEXT = '--ui-context-content-light';

// The tone of the surface is an invariant, not an axis: the card is always drawn on a backdrop, the mockup
// declares no variant without one, and no option of the component chooses the tone.
const SURFACE_TONE_CLASS = '--tone-vibrant';

// The parts of the card that stand on the coloured surface of it - the row of buttons and the cross - take
// the palette of a dark edge, so their controls come coloured by the design system and not by a substitution
// of tokens.
const EDGE_CONTEXT = '--ui-context-edge-dark';
/*
 * How many buttons the row of the wizard carries. The indicator shares the line with them, and a line holds
 * the two groups only while the buttons are two: the mockup draws the wizard with a step back and a step
 * forward, and a third button pushed the row out of the card or folded it into a pile. A consumer who hands
 * over more gets the last two of them - the target of the card and the one beside it.
 */
const WIZARD_ACTIONS_MAX = 2;

const ITEM_ICON_SIZE = 24;

// Steps of the designer scale the mockup uses, resolved to the scale of ui.system.typography by pixel size:
// the title is 21/29 and one step above it at the large size, the subtitle 14/19, an item 15 and 13/17.
const TITLE_SIZE = 'lg';
const LARGE_TITLE_SIZE = 'xl';
const SUBTITLE_SIZE = 'sm';
const ITEM_TITLE_SIZE = 'md';
const ITEM_DESCRIPTION_SIZE = 'xs';

// No token covers the colour of the overlay: the value is the one ui.system.dialog already uses.
const OVERLAY_BACKGROUND = 'rgba(0, 32, 78, 0.46)';

const oneOf = <T>(dictionary: Readonly<Record<string, T>>, value: unknown, fallback: T): T => {
	return Object.values(dictionary).includes(value as T) ? value as T : fallback;
};

// An empty list of layers is no scene: a frame with nothing in it would still take the room of the zone.
const toScene = (scene: WhatsNewScene | null | undefined): WhatsNewScene | null => {
	if (!scene)
	{
		return null;
	}

	return getSceneLayers(scene).length === 0 ? null : scene;
};

const toStepCount = (value: unknown): number => {
	return Type.isNumber(value) && value > 1 ? Math.trunc(value) : 1;
};

const toStepIndex = (value: unknown, stepCount: number): number => {
	const index = Type.isNumber(value) ? Math.trunc(value) : 0;

	return Math.min(Math.max(index, 0), stepCount - 1);
};

export class WhatsNew extends EventEmitter
{
	#size: WhatsNewSize;
	#mediaPosition: WhatsNewMediaPosition;
	#actionsAlign: WhatsNewActionsAlign;
	#stepCount: number;
	#currentStep: number;
	#label: string;
	#title: string;
	#titleBrand: string;
	#subtitle: string;
	#items: WhatsNewItem[];
	#scene: WhatsNewScene | null;
	#video: WhatsNewVideo | null;
	#gallery: WhatsNewGallerySlide[];
	#galleryNav: WhatsNewGalleryNav;
	// The slide of the gallery, or null while the consumer keeps no slide of its own and the gallery turns
	// by itself.
	#currentSlide: number | null;
	#parallax: boolean;
	#backdropEffect: WhatsNewBackdrop;
	#backdropColor: WhatsNewColor;
	#actions: Button[];
	#hasOverlay: boolean;
	#disableScrolling: boolean;
	// Whether this window is one of the owners of the lock of the page counted above.
	#scrollLocked: boolean = false;
	#closeByEsc: boolean;
	#closeByClickOutside: boolean;
	#hasCloseButton: boolean;
	// Whether the user may close the window right now: the cross, Esc and a click outside all answer to it.
	#closable: boolean = true;

	#popup: Popup | null = null;
	#closeButton: HTMLElement | null = null;
	#destroyed: boolean = false;

	// The zones a setter of the consumer draws anew, and the column they stand in. They belong to the content
	// of a shown window and are let go together with it.
	#bodyNode: HTMLElement | null = null;
	#listNode: HTMLElement | null = null;
	#actionsNode: HTMLElement | null = null;

	// Parts that outlive a rebuild of the content: the indicator keeps the dots the focus stands on, the
	// sprites of a scene are not worth fetching and decoding a second time, and the backdrop is the surface
	// the card stands on and not a piece of the content. All of them are let go by destroy().
	#stepNav: StepNav | null = null;
	#videoSlot: HTMLElement | null = null;
	#sceneSlot: Scene | null = null;
	#bleedSlot: Scene | null = null;
	#gallerySlot: Gallery | null = null;
	#backdrop: Backdrop | null = null;

	// Tells a close the consumer asked for from a close the user made: only the latter reports onClose.
	#closingByApi: boolean = false;

	constructor(options: WhatsNewOptions = {})
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#size = oneOf(WhatsNewSize, options.size, WhatsNewSize.Md);
		this.#mediaPosition = oneOf(WhatsNewMediaPosition, options.mediaPosition, WhatsNewMediaPosition.Top);
		this.#actionsAlign = oneOf(WhatsNewActionsAlign, options.actionsAlign, WhatsNewActionsAlign.Right);
		this.#stepCount = toStepCount(options.stepCount);
		this.#currentStep = toStepIndex(options.currentStep, this.#stepCount);
		this.#label = options.label ?? '';
		this.#title = options.title ?? '';
		this.#titleBrand = options.titleBrand ?? '';
		this.#subtitle = options.subtitle ?? '';
		this.#items = options.items ?? [];
		this.#scene = toScene(options.scene);
		this.#video = options.video ?? null;
		this.#gallery = options.gallery ?? [];
		this.#galleryNav = oneOf(WhatsNewGalleryNav, options.galleryNav, WhatsNewGalleryNav.Sides);
		this.#currentSlide = Type.isNumber(options.currentSlide) ? Math.trunc(options.currentSlide) : null;
		this.#parallax = options.parallax !== false;
		this.#backdropEffect = oneOf(WhatsNewBackdrop, options.backdrop, WhatsNewBackdrop.None);
		this.#backdropColor = oneOf(WhatsNewColor, options.backdropColor, WhatsNewColor.DarkBlue);
		this.#actions = options.actions ?? [];
		this.#hasOverlay = options.hasOverlay !== false;
		this.#disableScrolling = options.disableScrolling !== false;
		this.#closeByEsc = options.closeByEsc !== false;
		this.#closeByClickOutside = options.closeByClickOutside !== false;
		this.#hasCloseButton = options.hasCloseButton !== false;

		if (options.events)
		{
			this.subscribeFromOptions(options.events);
		}
	}

	show(): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: show() called on a destroyed instance.`);

			return;
		}

		this.#ensurePopup().show();
	}

	hide(): void
	{
		if (!this.#popup?.isShown())
		{
			return;
		}

		this.#closingByApi = true;
		this.#popup.close();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#closingByApi = true;

		/*
		 * A shown window destroyed by the consumer must end the way a closed one does. The window mechanism
		 * sends nothing of its own on destroy() - neither onClose nor onAfterClose - so the two events of the
		 * hide are ours to send, in the order a close sends them. Vue reaches this path on every unmount of an
		 * open card.
		 */
		const popup: Popup | null = this.#popup;
		const wasShown: boolean = popup?.isShown() === true;

		if (wasShown)
		{
			this.#handlePopupClose();
		}
		else
		{
			this.#forgetContent();
			this.#releaseScrollLock();
			this.#setTracking(false);
		}

		popup?.destroy();
		this.#popup = null;
		this.#stepNav?.destroy();
		this.#stepNav = null;
		this.#videoSlot = null;
		this.#sceneSlot?.destroy();
		this.#sceneSlot = null;
		this.#bleedSlot?.destroy();
		this.#bleedSlot = null;
		this.#gallerySlot?.destroy();
		this.#gallerySlot = null;
		this.#backdrop?.destroy();
		this.#backdrop = null;

		if (wasShown)
		{
			this.emit('onAfterHide');
		}

		this.unsubscribeAll();
	}

	// The window of the current show, or null while there is none: show() builds it and the instance lets it
	// go as soon as it closes, because a closed window destroys itself.
	getPopup(): Popup | null
	{
		return this.#popup;
	}

	setCurrentStep(currentStep: number): void
	{
		this.#currentStep = toStepIndex(currentStep, this.#stepCount);

		// The step moves the mark of the indicator and nothing else: rebuilding the content for it would drop
		// the focus off the control the user has just pressed and make the picture of the window load anew.
		this.#stepNav?.setCurrentStep(this.#currentStep);
	}

	/**
	 * Puts the gallery on another slide, counted from zero. A slide past either end of the list comes back on
	 * the other side of it: the carousel is a ring.
	 *
	 * The move is a move of the mark and of the shown slide and nothing else: rebuilding the content for it
	 * would drop the focus off the control the user has just pressed.
	 */
	/*
	 * A number turns the controlled mode on and null hands the ring back to itself: the axis is nullable in the
	 * options, and the setter of it carries the same two meanings. Null leaves the gallery standing where it
	 * stands - what changes is who moves it from now on.
	 */
	setCurrentSlide(currentSlide: number | null): void
	{
		this.#currentSlide = Type.isNumber(currentSlide) ? Math.trunc(currentSlide) : null;

		this.#gallerySlot?.setControlled(this.#currentSlide !== null);

		if (this.#currentSlide !== null)
		{
			this.#gallerySlot?.setCurrentSlide(this.#currentSlide);
		}
	}

	/**
	 * Puts the card on another colour scheme of the palette. The change is a reveal: the new scheme grows
	 * over the card by a circle from `origin`, a point in shares of the card, the bottom centre by default.
	 *
	 * A scheme the card already shows, a value outside the dictionary and a call made while a reveal runs
	 * change nothing and report nothing - the lock of the reveal is what keeps a hail of calls from stacking
	 * layer over layer.
	 */
	setBackdropColor(color: WhatsNewColor, origin?: WhatsNewBackdropOrigin): void
	{
		const requested: WhatsNewColor = oneOf(WhatsNewColor, color, this.#backdropColor);

		if (!this.#ensureBackdrop().setColor(requested, origin))
		{
			return;
		}

		this.#backdropColor = requested;
		this.emit('onBackdropColorChange', { color: requested });
	}

	setItems(items: WhatsNewItem[]): void
	{
		this.#items = items;

		if (!this.#bodyNode)
		{
			return;
		}

		const previous: HTMLElement | null = this.#listNode;
		this.#renderList();

		// The list stands in front of the row of buttons, and that is where it goes when the card had none.
		this.#placePart(previous, this.#listNode, this.#actionsNode);
	}

	setActions(actions: Button[]): void
	{
		this.#actions = actions;

		if (!this.#bodyNode)
		{
			return;
		}

		const previous: HTMLElement | null = this.#actionsNode;
		this.#renderActions();

		// The row of buttons closes the column, so it is appended when the card had none.
		this.#placePart(previous, this.#actionsNode, null);
	}

	/*
	 * Whether the user may close the window. The cross, Esc and a click outside are the three ways the user
	 * has, and all three answer to this one switch. A consumer holds the window closed while a request the
	 * press of a button started is on its way and cannot be taken back: a close recorded next to it would
	 * count as an answer the user never gave. The controls stay where they are and only report themselves
	 * unavailable - a cross taken out of the tab order would drop the focus to the page. hide() and destroy()
	 * are the consumer's own and are never held.
	 */
	setClosable(closable: boolean): void
	{
		this.#closable = closable;

		this.#popup?.setClosingByEsc(closable && this.#closeByEsc);
		this.#popup?.setAutoHide(closable && this.#closeByClickOutside);
		if (this.#closeButton)
		{
			Dom.attr(this.#closeButton, 'aria-disabled', closable ? null : 'true');
		}
	}

	isClosable(): boolean
	{
		return this.#closable;
	}

	#ensurePopup(): Popup
	{
		this.#popup ??= this.#createPopup();

		return this.#popup;
	}

	#createPopup(): Popup
	{
		return new Popup({
			className: this.#getWindowClassName(),
			content: this.#renderContent(),
			// The cross belongs to the markup of the component: it lies over the media, where the window
			// mechanism cannot put it.
			closeIcon: false,
			noAllPaddings: true,
			designSystemContext: SURFACE_CONTEXT,
			cacheable: false,
			autoHide: this.#closable && this.#closeByClickOutside,
			closeByEsc: this.#closable && this.#closeByEsc,
			overlay: this.#hasOverlay ? { backgroundColor: OVERLAY_BACKGROUND, opacity: 100 } : undefined,
			// The window keeps the focus inside itself and gives it back to the control it was opened from.
			// Left to the window mechanism the trap would depend on a portal-wide setting, and an announcement
			// the user cannot leave by keyboard is a defect regardless of that setting.
			focusTrap: true,
			// The window announces itself by a name of its own: the mechanism only names a window whose content
			// is plain text, and here the content is a node.
			ariaLabel: this.#getAriaLabel(),
			events: {
				onShow: () => {
					this.#applyScrollLock();
					this.#setTracking(true);
					this.emit('onShow');
				},
				onAfterShow: () => this.emit('onAfterShow'),
				onClose: () => this.#handlePopupClose(),
				onAfterClose: () => this.emit('onAfterHide'),
			},
		});
	}

	// A window with the role of a dialog is never left unnamed. The title names it best; without a title the
	// name is taken from the subtitle, the next line of the header that carries a meaning; and with neither of
	// them the window is named by what it is.
	#getAriaLabel(): string
	{
		if (this.#title !== '')
		{
			return this.#title;
		}

		if (this.#subtitle !== '')
		{
			return this.#subtitle;
		}

		return Loc.getMessage('UI_SYSTEM_WHATS_NEW_DIALOG_ARIA') ?? '';
	}

	#handlePopupClose(): void
	{
		// The window is not cacheable, so it destroys itself right after the close. The instance lets it go
		// together with the cross of the closed window - otherwise the next show() would call a destroyed
		// window, which quietly does nothing, and the detached content would be held until destroy().
		this.#forgetContent();
		this.#popup = null;

		this.#releaseScrollLock();
		this.#setTracking(false);

		if (!this.#closingByApi)
		{
			this.emit('onClose');
		}

		this.#closingByApi = false;

		this.emit('onHide');
	}

	/*
	 * Puts a zone drawn anew where the old one stood. A setter of the consumer never rebuilds the whole
	 * content: a rebuild would carry the zone of the media over to a new parent, and an embedded frame that
	 * changed its parent loads the player anew and drops the playback the user had started.
	 *
	 * `before` is the zone the new one goes in front of when the card had none of its own yet; its absence
	 * puts the zone at the end of the column.
	 */
	#placePart(current: HTMLElement | null, next: HTMLElement | null, before: HTMLElement | null): void
	{
		// A zone drawn anew takes the focus out of the document with the node it stood on, so what the user had
		// focused is looked up in the new zone afterwards.
		const focused = this.#getFocusedContentElement();

		if (current && next)
		{
			Dom.replace(current, next);
		}
		else if (current)
		{
			Dom.remove(current);
		}
		else if (next)
		{
			if (before)
			{
				Dom.insertBefore(next, before);
			}
			else
			{
				Dom.append(next, this.#bodyNode);
			}
		}

		this.#restoreFocus(focused);
	}

	// The content of a window that closed is let go with it: the window is not cacheable, and the next show()
	// draws the content anew.
	#forgetContent(): void
	{
		this.#unbindCloseButton();
		this.#bodyNode = null;
		this.#listNode = null;
		this.#actionsNode = null;
	}

	#getFocusedContentElement(): HTMLElement | null
	{
		const container = this.#popup?.getContentContainer();
		const active = document.activeElement;

		if (!container || !(active instanceof HTMLElement) || !container.contains(active))
		{
			return null;
		}

		return active;
	}

	// A node the rebuild carried over - a ready button of the consumer, a dot of the indicator - is focused
	// as it is; a node drawn anew is found again by the test id it is marked with.
	#restoreFocus(focused: HTMLElement | null): void
	{
		const container = this.#popup?.getContentContainer();

		if (!focused || !container)
		{
			return;
		}

		if (container.contains(focused))
		{
			focused.focus();

			return;
		}

		const testId = focused.dataset.testid;

		if (!testId)
		{
			return;
		}

		const nodes = container.querySelectorAll<HTMLElement>('[data-testid]');
		const analogue = [...nodes].find((node) => node.dataset.testid === testId);

		analogue?.focus();
	}

	// The frame holds the two floors of the window: the surface of the card and the layer the graphics of the
	// announcement flies out onto. The surface is where the backdrop and the content over it are cut to the
	// rounded corners; the content is what scrolls when it does not fit, and the backdrop stays out of that
	// scrolling floor - inside it, it would slide away from under the content.
	#renderContent(): HTMLElement
	{
		return Tag.render`
			<div class="${BLOCK_CLASS}__frame">
				<div class="${BLOCK_CLASS}__surface">
					${this.#ensureBackdrop().render()}
					${this.#renderCard()}
				</div>
				${this.#renderBleed()}
			</div>
		`;
	}

	// The graphics of the announcement leaves the card through a layer over it, while the zone it came from
	// keeps the room it took. The graphics of the layer and the graphics of the zone are two placements of one
	// and the same content, so the zone keeps whatever stays behind - the arrows and the dots of a gallery -
	// and neither placement draws what the other one draws.
	#renderBleed(): HTMLElement | string
	{
		if (!this.#hasBleed())
		{
			return '';
		}

		if (this.#hasGallery())
		{
			return renderBleed(this.#ensureGallery().renderStage());
		}

		this.#bleedSlot ??= new Scene({
			content: this.#scene as WhatsNewScene,
			variant: SceneVariant.Art,
			parallax: this.#parallax,
		});

		return renderBleed(this.#bleedSlot.render());
	}

	/*
	 * The flight over the top edge is an invariant and not an axis: the graphics of an announcement always
	 * leaves the card. Only such graphics flies out - a scene or the slides of a gallery - because the mockup
	 * declares no illustration standing inside the frame of the card.
	 */
	#hasBleed(): boolean
	{
		return this.#hasGallery() || this.#scene !== null;
	}

	#hasGallery(): boolean
	{
		return this.#gallery.length > 0;
	}

	#ensureBackdrop(): Backdrop
	{
		this.#backdrop ??= new Backdrop({ color: this.#backdropColor, effect: this.#backdropEffect });

		return this.#backdrop;
	}

	#renderCard(): HTMLElement
	{
		// The media on the right is the second column, so it is the second node too: the layout never moves a
		// zone against the order it is written in.
		const zones: Array<HTMLElement | string> = this.#mediaPosition === WhatsNewMediaPosition.Right
			? [this.#renderBody(), this.#renderMedia()]
			: [this.#renderMedia(), this.#renderBody()];

		return Tag.render`
			<div class="${BLOCK_CLASS}__content" data-testid="announce-dialog-root">
				${this.#hasCloseButton ? this.#renderCloseButton() : ''}
				${zones}
			</div>
		`;
	}

	// Everything but the media: on top it reads as a plain stack, at the side it is the wide column.
	#renderBody(): HTMLElement
	{
		const node: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__body">
				${this.#renderHeader()}
				${this.#renderList()}
				${this.#renderActions()}
			</div>
		`;

		this.#bodyNode = node;

		return node;
	}

	// The cross is a button of the design system in its plain style: the box, the states and the focus ring
	// come from there, and the styles of the card only say where it stands.
	#renderCloseButton(): HTMLElement
	{
		/*
		 * The cross of the mockup is a mark of the icon set, and the legacy list of marks the button carries
		 * `collapsedIcon` from has no cross in it. That option is optional to the constructor of the button
		 * and required by its typings, so the shape is asserted here instead of being filled with a mark the
		 * button would then draw a second time. The defect of the typings belongs to ui.buttons.
		 */
		const options = {
			useAirDesign: true,
			// The cross is dressed as the secondary button of the row below it: one plain style for the two
			// controls of the card a consumer never styles himself.
			style: Button.AirStyle.PLAIN,
			size: Button.Size.SMALL,
			// A button of the air design with no text of its own collapses to its mark by itself.
			icon: Outline.CROSS_L,
			className: `${BLOCK_CLASS}__close ${EDGE_CONTEXT}`,
			props: {
				type: 'button',
				// A control carrying a mark and no text is named for assistive technology by that name.
				'aria-label': Loc.getMessage('UI_SYSTEM_WHATS_NEW_CLOSE_ARIA') ?? '',
			},
			dataset: { testid: 'announce-dialog-close' },
		} as unknown as ButtonOptions;

		const button: Button = new Button(options);

		// The press is taken on the node and not through the option of the button: the handler of that option
		// is typed as one that answers with a value, and the press of the cross has none to answer with.
		const node: HTMLElement = button.render();

		Event.bind(node, 'click', this.#handleCloseClick);
		this.#closeButton = node;
		if (!this.#closable)
		{
			Dom.attr(node, 'aria-disabled', 'true');
		}

		return node;
	}

	#renderMedia(): HTMLElement | string
	{
		const content: HTMLElement | null = this.#renderMediaContent();

		if (!content)
		{
			return '';
		}

		return Tag.render`
			<div class="${BLOCK_CLASS}__media" data-testid="announce-dialog-media">${content}</div>
		`;
	}

	// The gallery, the scene and the video are three refinements of one and the same place: the zone shows the
	// carousel when there is one, the single scene next, and the video last.
	#renderMediaContent(): HTMLElement | null
	{
		if (this.#hasGallery())
		{
			return this.#ensureGallery().render();
		}

		if (this.#scene)
		{
			return this.#ensureScene(this.#scene).render();
		}

		return this.#video ? this.#ensureVideo(this.#video) : null;
	}

	// The video is built once and moved between rebuilds: a new frame would start the loading of the player
	// anew and take the playback the user had started away with the old one.
	#ensureVideo(video: WhatsNewVideo): HTMLElement
	{
		this.#videoSlot ??= renderVideo(video);

		return this.#videoSlot;
	}

	// The scene outlives a rebuild of the content: every sprite of it would otherwise be fetched and decoded
	// anew. The composition always goes out onto the layer of the flight, so the scene of the zone is the
	// reserved room of that composition and never draws it.
	#ensureScene(content: WhatsNewScene): Scene
	{
		this.#sceneSlot ??= new Scene({
			content,
			variant: SceneVariant.Reserve,
			parallax: this.#parallax,
		});

		return this.#sceneSlot;
	}

	/*
	 * The gallery outlives a rebuild of the content the same way a scene does, and for one more reason: the
	 * slide it stands on is a state of the carousel, and a gallery built anew would come back to the first
	 * slide of the ring.
	 */
	#ensureGallery(): Gallery
	{
		this.#gallerySlot ??= new Gallery({
			slides: this.#gallery,
			nav: this.#galleryNav,
			bleed: this.#hasBleed(),
			// A slide of layers follows the pointer the way the single scene of the zone does, so the axis of
			// the follow reaches the carousel as well.
			parallax: this.#parallax,
			currentSlide: this.#currentSlide,
			onSlideChange: (slide: number) => this.emit('onSlideChange', { slide }),
		});

		return this.#gallerySlot;
	}

	#renderHeader(): HTMLElement | string
	{
		if (this.#label === '' && this.#title === '' && this.#subtitle === '')
		{
			return '';
		}

		return Tag.render`
			<div class="${BLOCK_CLASS}__header" data-testid="announce-dialog-header">
				${this.#renderTitleRow()}
				${this.#renderSubtitle()}
			</div>
		`;
	}

	// The mark stands on the line of the title and after it, so the two share a row of their own.
	#renderTitleRow(): HTMLElement | string
	{
		if (this.#title === '' && this.#label === '')
		{
			return '';
		}

		return Tag.render`
			<div class="${BLOCK_CLASS}__title-row">
				${this.#renderTitle()}
				${this.#renderLabel()}
			</div>
		`;
	}

	#renderLabel(): HTMLElement | string
	{
		if (this.#label === '')
		{
			return '';
		}

		/*
		 * The mark of the design is a chip of the extra small size in the outlined design with square corners: so
		 * the WhatsNew library of the prototypes draws it. On the vibrant surface the stylesheet of the card paints
		 * it with the tokens the design names for the element - a tinted fill, a faint white stroke, white text.
		 *
		 * A chip is a control by nature: it comes focusable and answers the pointer. The mark is a badge and
		 * promises no action, so the focus stop is taken away here and the pointer in the stylesheet. The word is
		 * encoded first: the chip lays its text into the markup as it is, and a word of a consumer must stay a word.
		 */
		const chip: Chip = new Chip({
			text: TextUtil.encode(this.#label),
			size: ChipSize.Xs,
			design: ChipDesign.Outline,
		});
		const node: HTMLElement = chip.render();
		node.removeAttribute('tabindex');

		return Tag.render`
			<div class="${BLOCK_CLASS}__label" data-testid="announce-dialog-new-label">${node}</div>
		`;
	}

	#renderTitle(): HTMLElement | string
	{
		if (this.#title === '')
		{
			return '';
		}

		const node: HTMLElement = Headline.render(this.#title, {
			size: this.#size === WhatsNewSize.Lg ? LARGE_TITLE_SIZE : TITLE_SIZE,
			accent: true,
			className: `${BLOCK_CLASS}__title`,
		});

		node.dataset.testid = 'announce-dialog-title';
		this.#paintBrand(node);

		return node;
	}

	// The title stays the only source of the text: the word is marked up as the title is drawn, and a title
	// without that word keeps the single text node the typography gave it. The consumer names a word of the
	// title and not a slice of it, so the case of the letters is not part of the match - and every occurrence
	// is painted with the letters of the title itself, never with the ones of the option.
	#paintBrand(node: HTMLElement): void
	{
		const starts: number[] = this.#findBrandStarts();

		if (starts.length === 0)
		{
			return;
		}

		const length: number = this.#titleBrand.length;
		let cursor: number = 0;

		Dom.clean(node);

		starts.forEach((start: number) => {
			// A string given to append() becomes a text node and is never parsed as markup.
			if (start > cursor)
			{
				node.append(this.#title.slice(cursor, start));
			}

			node.append(this.#renderBrandWord(this.#title.slice(start, start + length)));
			cursor = start + length;
		});

		if (cursor < this.#title.length)
		{
			node.append(this.#title.slice(cursor));
		}
	}

	// The places of the title the word stands in, one after another and never overlapping. The comparison
	// goes slice against slice and not through a lowered copy of the whole title: the lowered form of a
	// letter is not always one letter long, and an index found in such a copy would point somewhere else in
	// the title itself.
	#findBrandStarts(): number[]
	{
		const starts: number[] = [];
		const length: number = this.#titleBrand.length;

		if (length === 0)
		{
			return starts;
		}

		const word: string = this.#titleBrand.toLowerCase();
		let at: number = 0;

		while ((at + length) <= this.#title.length)
		{
			if (this.#title.slice(at, at + length).toLowerCase() === word)
			{
				starts.push(at);
				at += length;
			}
			else
			{
				at++;
			}
		}

		return starts;
	}

	// The gradient of the word lives in the styles and is the one of the design system, so the markup carries
	// nothing but the class of the slot.
	#renderBrandWord(word: string): HTMLElement
	{
		return Dom.create('span', {
			props: { className: `${BLOCK_CLASS}__title-brand` },
			text: word,
		});
	}

	#renderSubtitle(): HTMLElement | string
	{
		if (this.#subtitle === '')
		{
			return '';
		}

		const node: HTMLElement = Text.render(this.#subtitle, {
			size: SUBTITLE_SIZE,
			className: `${BLOCK_CLASS}__subtitle`,
		});

		node.dataset.testid = 'announce-dialog-subtitle';

		return node;
	}

	#renderList(): HTMLElement | string
	{
		this.#listNode = this.#items.length === 0
			? null
			: Tag.render`
				<div class="${BLOCK_CLASS}__list" data-testid="announce-dialog-list">
					${this.#items.map((item, index) => this.#renderItem(item, index))}
				</div>
			`;

		return this.#listNode ?? '';
	}

	#renderItem(item: WhatsNewItem, index: number): HTMLElement
	{
		const testId = item.testId ?? `announce-dialog-list-cell-${index}`;

		// The colour of the mark is asked for by the option of the icon and not written into the internal
		// variable of the set: that variable is the inside of another component and may go at any release.
		const iconNode: HTMLElement = new Icon({
			icon: item.icon,
			size: ITEM_ICON_SIZE,
			color: 'var(--ui-color-design-filled-content)',
		}).render();
		iconNode.dataset.testid = `${testId}-icon`;

		// The icon stands on the plate of the row and not bare, and the plate stands by the title and not in the
		// middle of a two-line block: the wrapper is that plate, and the row is what aligns it by the top.
		const iconBox: HTMLElement = Tag.render`
			<span class="${BLOCK_CLASS}__item-icon">${iconNode}</span>
		`;

		const titleNode: HTMLElement = Text.render(item.title, {
			size: ITEM_TITLE_SIZE,
			accent: item.accent === true,
			className: `${BLOCK_CLASS}__item-title`,
		});
		titleNode.dataset.testid = `${testId}-title`;

		const body: HTMLElement = Tag.render`
			<span class="${BLOCK_CLASS}__item-body" data-testid="${testId}-body">
				${titleNode}
				${this.#renderItemDescription(item, testId)}
			</span>
		`;

		// A row the consumer gave a handler to is a control: a button, so it takes the focus, answers the
		// keyboard and reports itself to assistive technology. A row without one tells about a change and
		// nothing more - a cursor of a control and a place in the tab order would promise an action there is
		// none of.
		if (!item.onClick)
		{
			return Tag.render`
				<div class="${BLOCK_CLASS}__item" data-testid="${testId}">${iconBox}${body}</div>
			`;
		}

		return Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS}__item --clickable"
				data-testid="${testId}"
				onclick="${() => this.#handleItemClick(item, index)}"
			>${iconBox}${body}</button>
		`;
	}

	#handleItemClick(item: WhatsNewItem, index: number): void
	{
		item.onClick?.();
		this.emit('onItemClick', { index, item });
	}

	#renderItemDescription(item: WhatsNewItem, testId: string): HTMLElement | string
	{
		if (!item.description)
		{
			return '';
		}

		const node: HTMLElement = Text.render(item.description, {
			size: ITEM_DESCRIPTION_SIZE,
			className: `${BLOCK_CLASS}__item-desc`,
		});

		node.dataset.testid = `${testId}-desc`;

		return node;
	}

	#renderActions(): HTMLElement | string
	{
		if (this.#actions.length === 0 && !this.#isWizard())
		{
			this.#actionsNode = null;

			return '';
		}

		// Aligned to the left the row starts with the target button, and the swap happens in the markup: with
		// row-reverse the tab order would run against the visual one.
		const alignedLeft = this.#actionsAlign === WhatsNewActionsAlign.Left;
		const shown = this.#isWizard() ? this.#actions.slice(-WIZARD_ACTIONS_MAX) : this.#actions;
		const actions = alignedLeft ? [...shown].reverse() : shown;

		const buttons: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__buttons">${actions.map((action) => action.render())}</div>
		`;

		// In the wizard the row holds two groups pushed to the edges. Aligning the actions to the left mirrors
		// it - the buttons take the left edge and the indicator the right one - and the mirroring happens in
		// the markup, for the same reason the buttons swap there.
		const groups: HTMLElement[] = this.#isWizard()
			? (alignedLeft ? [buttons, this.#renderStepNav()] : [this.#renderStepNav(), buttons])
			: [buttons];

		const node: HTMLElement = Tag.render`
			<div
				class="${BLOCK_CLASS}__actions ${EDGE_CONTEXT}"
				data-testid="announce-dialog-actions"
			>${groups}</div>
		`;

		this.#actionsNode = node;

		return node;
	}

	/*
	 * The indicator reports three requests - a step back, a step forward and a step of the row - and the card
	 * turns all three into the one step it asks the consumer for. The surface of the indicator follows the tone
	 * of the card, which is a filled backdrop and nothing else.
	 */
	#renderStepNav(): HTMLElement
	{
		this.#stepNav ??= new StepNav({
			stepCount: this.#stepCount,
			currentStep: this.#currentStep,
			onPrev: () => this.#requestStep(this.#currentStep - 1),
			onNext: () => this.#requestStep(this.#currentStep + 1),
			onDot: (step: number) => this.#requestStep(step),
		});

		return this.#stepNav.render();
	}

	// The mode is a controlled one: the component reports the step the user asked for and leaves the move
	// itself to the consumer.
	#requestStep(step: number): void
	{
		this.emit('onStepChange', { step: toStepIndex(step, this.#stepCount) });
	}

	// The wizard turns on by itself as soon as there is more than one step.
	#isWizard(): boolean
	{
		return this.#stepCount > 1;
	}

	#handleCloseClick = (): void => {
		if (!this.#closable)
		{
			return;
		}

		this.#popup?.close();
	};

	#unbindCloseButton(): void
	{
		if (this.#closeButton)
		{
			Event.unbind(this.#closeButton, 'click', this.#handleCloseClick);
			this.#closeButton = null;
		}
	}

	#getWindowClassName(): string
	{
		const classes = [
			BLOCK_CLASS,
			SURFACE_TONE_CLASS,
			`--size-${this.#size}`,
			`--media-${this.#mediaPosition}`,
			`--actions-${this.#actionsAlign}`,
		];

		// What stands above the header decides how much room it gets, and the styles cannot see the zone of
		// another column, so the presence of the media is told by a modifier.
		if (this.#scene || this.#video || this.#hasGallery())
		{
			classes.push('--has-media');
		}

		// A video and a gallery over the header leave it more room than an illustration does, and the styles
		// have no other way to tell them apart.
		if (this.#hasGallery())
		{
			classes.push('--gallery');
		}
		else if (this.#video && !this.#scene)
		{
			classes.push('--video');
		}

		if (this.#isWizard())
		{
			classes.push('--wizard');
		}

		return classes.join(' ');
	}

	/*
	 * The follow of the pointer belongs to a shown card. The scene, the layer of the flight and the ring
	 * outlive a close - a rebuilt card must not fetch every sprite again - and until the next show there is
	 * nothing for them to answer the pointer with.
	 */
	#setTracking(active: boolean): void
	{
		this.#sceneSlot?.setTracking(active);
		this.#bleedSlot?.setTracking(active);
		this.#gallerySlot?.setShown(active);
	}

	#applyScrollLock(): void
	{
		if (!this.#disableScrolling || this.#scrollLocked)
		{
			return;
		}

		this.#scrollLocked = true;
		scrollLockOwners += 1;

		if (scrollLockOwners === 1)
		{
			scrollLockOffset = window.scrollY;
			Dom.style(document.body, SCROLL_LOCK_OFFSET_VARIABLE, `${scrollLockOffset}px`);
		}

		Dom.addClass(document.body, SCROLL_LOCK_CLASS);
	}

	#releaseScrollLock(): void
	{
		if (!this.#scrollLocked)
		{
			return;
		}

		this.#scrollLocked = false;
		scrollLockOwners -= 1;

		if (scrollLockOwners > 0)
		{
			return;
		}

		Dom.removeClass(document.body, SCROLL_LOCK_CLASS);
		Dom.style(document.body, SCROLL_LOCK_OFFSET_VARIABLE, null);

		// The page is back in the flow only now, so this is the first moment it can be scrolled to where it
		// stood.
		window.scrollTo(0, scrollLockOffset);
		scrollLockOffset = 0;
	}
}
