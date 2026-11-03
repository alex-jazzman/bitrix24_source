import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';

import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import {
	Popover,
	type PopoverDesignContext,
	type PopoverOptions,
	type PopoverPositioning,
	type PopoverStateChangePayload,
} from 'ui.system.popover';
import { Headline, Text as TextElement } from 'ui.system.typography';

import 'ui.icon-set.outline';

import { DEFAULT_DESIGN_CONTEXT, DEFAULT_POSITIONING, DEFAULT_WIDTH, MIN_WIDTH, POPOVER_CLASS } from './const';
import {
	type CalloutApplyOptions,
	type CalloutButton,
	type CalloutContent,
	type CalloutMode,
	type CalloutNode,
	type CalloutOptions,
	type CalloutTarget,
} from './types';

import './callout.css';

const NAMESPACE = 'BX.UI.System.Callout';

// Structural list of potentially interactive elements, carried over from the focus-navigator of ui.a11y.
// Structural on purpose: it answers on a card that has never reached the document, where the interactivity
// checker of ui.a11y cannot, so a disabled control counts as interactive content all the same. What carries no
// focus by its very shape is left out of the list instead: an input of type hidden is data and no control, and
// 'false' is the switched-off value of contenteditable - an element standing on a tabindex of its own is
// caught by that entry whatever its contenteditable says.
const FOCUSABLE_SELECTOR = [
	'button',
	'a[href]',
	'area[href]',
	'input:not([type="hidden" i])',
	'select',
	'textarea',
	'summary',
	'iframe',
	'object',
	'embed',
	'audio[controls]',
	'video[controls]',
	'[tabindex]',
	'[contenteditable]:not([contenteditable="false" i])',
].join(',');

// Subtrees nothing inside can take the focus in, the attribute standing on the candidate itself included.
const UNREACHABLE_SELECTOR = '[hidden], [hidden] *, [inert], [inert] *';

// Every key of PopoverPositioning. The effective snapshot names all of them, so an option the consumer has
// dropped is overwritten in the popover instead of surviving the Object.assign of its setter.
const POSITIONING_KEYS: Array<keyof PopoverPositioning> = [
	'position',
	'alignment',
	'offset',
	'flip',
	'slide',
	'stretch',
	'constrainSize',
	'pointer',
	'onAxisFlip',
	'boundary',
	'boundaryPadding',
	'whenAnchorHidden',
	'strategy',
	'tracking',
];

// What only an anchor cycle of the popover reads. In the area mode they are sent as an explicit undefined,
// which the normaliser of the substrate counts as an absent key: a value standing in any of them would be
// answered with a warning about the anchor-only options the area ignores.
const ANCHOR_ONLY_KEYS: ReadonlySet<keyof PopoverPositioning> = new Set([
	'flip',
	'slide',
	'stretch',
	'pointer',
	'onAxisFlip',
	'whenAnchorHidden',
	'tracking',
]);

// Gesture listeners of the focus tracker: they only watch, and they watch before anything can stop them.
const CAPTURE_PASSIVE = { capture: true, passive: true };

type CalloutLifecycle = 'idle' | 'showing' | 'shown' | 'hiding' | 'destroying' | 'destroyed';

type CalloutEventName = 'onShow' | 'onHide' | 'onClose' | 'onDestroy';

type HideReason = 'programmatic' | 'user' | 'anchor';

// Content regions of the card: the areas the consumer owns, and the ones the focus tracker knows by name.
type CalloutRegion = 'description' | 'leftSlot' | 'footer' | 'footerLeft' | 'buttons';

// The three regions of the footer. They are rendered together: which of them carries content is a question
// about all three at once.
const FOOTER_REGIONS: CalloutRegion[] = ['buttons', 'footer', 'footerLeft'];

// What a region that lost the priority of the footer carries: the content of another owner standing in it is
// taken out of sight rather than away, because removing it belongs to that owner alone.
const SUPPRESSED_CLASS = '--suppressed';

const sameRegions = (left: Set<CalloutRegion>, right: Set<CalloutRegion>): boolean => {
	return left.size === right.size && [...left].every((region) => right.has(region));
};

// Puts the content of the options into the tracked subcontainer of a region; null means the region carries
// no content of the options at all.
type RegionFill = ((owned: HTMLElement) => void) | null;

// What a CalloutButton turns into. The size and the design of the card are settled here, so the options of
// ui.buttons a callout ever writes are these and no others.
type ButtonRenderOptions = {
	text: string;
	useAirDesign: boolean;
	size: string;
	style: string;
	// Required by the options of ui.buttons; blank keeps the collapsed icon out.
	collapsedIcon: string;
	icon?: string;
	iconPosition?: 'left' | 'right';
};

// A button standing in the region right now: the instance and a copy of the item it was built from. A copy
// because the item belongs to the consumer, who changes it in place - the item itself is no record of what
// was rendered.
type RenderedButton = {
	instance: Button;
	item: CalloutButton;
};

type CalloutRegionNodes = {
	// Stable node of the region: the address of the consumer content and the teleport target of BCallout.
	container: HTMLElement;
	// Subcontainer holding what the options have put into the region, and only it: clearing a region takes
	// this node away and never the DOM another owner - a teleported slot of BCallout - has put beside it.
	owned: HTMLElement | null;
};

type PendingContent = CalloutRegion | 'title' | 'width';

type FocusSnapshot = { region: CalloutRegion; index: number; roleKey: string };

// What the options have moved of everything the popover learns through #commitSubstrate alone; the content
// regions are marked separately.
type TouchedOptions = {
	closeByClickOutside: boolean;
	closeByEsc: boolean;
	designContext: boolean;
	positioning: boolean;
	target: boolean;
};

const nothingTouched = (): TouchedOptions => ({
	closeByClickOutside: false,
	closeByEsc: false,
	designContext: false,
	positioning: false,
	target: false,
});

let instanceCounter = 0;

// How an element is recognised after the DOM of its region has been replaced: an explicit role wins, the tag
// name stands in for it, and an input is told apart by its type as well.
const roleKeyOf = (element: Element): string => {
	const explicit = element.getAttribute('role');
	if (explicit !== null)
	{
		return explicit;
	}

	const { localName } = element;

	return localName === 'input' ? `${localName}:${(element as HTMLInputElement).type}` : localName;
};

const focusableOf = (container: HTMLElement): Element[] => [...container.querySelectorAll(FOCUSABLE_SELECTOR)];

// Whether the element is rendered where it stands: display: none - its own or that of an ancestor - is what
// takes it out, and a class of the consumer says that as much as the style attribute a v-show writes. Only
// that, and never the visibility or the opacity: the card is laid out hidden while the popover measures it
// and comes out of full transparency as it appears, and the content of the consumer must not read as gone
// along with the card carrying it. Answers on a rendered element alone - a node outside the document has no
// CSS to be asked about, and the rects of the fallback would call every one of them hidden.
const isRendered = (element: Element): boolean => {
	return Type.isFunction(element.checkVisibility)
		? element.checkVisibility()
		: element.getClientRects().length > 0;
};

// Whether the CSS of the page answers for what stands inside the card. A card outside the document has no CSS
// to be asked about; a card inside the root the popover keeps hidden between its shows answers for the whole of
// its content at once - everything there is out of the render tree, the part the consumer can see included.
// Neither answer says anything about the content, and both are asked once more at the mount of the popover -
// see #recomputeMountedMode.
const cssAppliesTo = (card: HTMLElement): boolean => card.isConnected && isRendered(card);

// Whether the container carries content that can take the focus. The structural list answers for the shape of
// an element alone, and a candidate standing in a hidden or inert subtree is out of reach whatever its shape.
// Where the CSS applies it is asked as well: what the consumer took out with display: none carries no focus
// either. Where it does not, the structure is the whole answer, and that reading is the conservative one.
const holdsFocusableContent = (container: HTMLElement, cssApplies: boolean): boolean => {
	return focusableOf(container).some((element) => {
		return !element.matches(UNREACHABLE_SELECTOR) && (!cssApplies || isRendered(element));
	});
};

// Whether the element can hold the focus where it stands. An element out of the render tree holds none, and
// neither does one the visibility takes out - but that part of the question is only put where the card itself
// is visible by it: the popover lays the card out hidden while it measures it and while the anchor is out of
// sight, and everything inside would read as unfocusable at once there, so a cycle of the positioning would
// pull the focus onto the card. The opacity is no part of the question either way - a transparent element
// still takes the focus and is still announced, and the card comes out of full transparency as it appears.
const holdsFocus = (element: Element | null, visibilityApplies: boolean = true): boolean => {
	if (element === null || !element.isConnected)
	{
		return false;
	}

	// :disabled catches an input inside a disabled fieldset as well; hidden and inert take the subtree out.
	if (element.matches(':disabled') || element.matches(UNREACHABLE_SELECTOR) || !isRendered(element))
	{
		return false;
	}

	if (visibilityApplies && !isVisibleForFocus(element, false))
	{
		return false;
	}

	// An SVG with tabindex is focusable and worth returning to; without one it is not.
	return element.matches(FOCUSABLE_SELECTOR) || element.hasAttribute('tabindex');
};

// Realm-safe: the anchor may live in another window, where instanceof against the local classes says nothing.
const canRestoreFocus = (element: Element | null): boolean => {
	if (element === null || !Type.isFunction((element as Partial<HTMLElement>).focus))
	{
		return false;
	}

	return holdsFocus(element) && isVisibleForFocus(element);
};

// Whether the element is visible where it stands. The opacity belongs to the question wherever the focus is
// about to be handed over - there is no sense in sending it to something fully transparent - and is left out
// wherever an element already holding the focus is judged, where the visibility alone answers. The fallback
// path reads the visibility in either case: it has no answer about the opacity to give.
const isVisibleForFocus = (element: Element, withOpacity: boolean = true): boolean => {
	if (Type.isFunction(element.checkVisibility))
	{
		return element.checkVisibility({ visibilityProperty: true, opacityProperty: withOpacity });
	}

	const view = element.ownerDocument.defaultView;
	const visibility = view === null ? 'visible' : view.getComputedStyle(element).visibility;

	return isRendered(element) && visibility === 'visible';
};

const describedByTokens = (element: Element): string[] => {
	return (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((token) => token !== '');
};

// The tokens of other owners stay where they are, both ways round.
const addDescribedBy = (element: HTMLElement, token: string): void => {
	const tokens = describedByTokens(element);
	if (tokens.includes(token))
	{
		return;
	}

	tokens.push(token);
	Dom.attr(element, 'aria-describedby', tokens.join(' '));
};

const removeDescribedBy = (element: HTMLElement, token: string): void => {
	if (!element.hasAttribute('aria-describedby'))
	{
		return;
	}

	const tokens = describedByTokens(element).filter((value) => value !== token);
	Dom.attr(element, 'aria-describedby', tokens.length === 0 ? null : tokens.join(' '));
};

// The literal 'area' beside the three shapes of the anchor, read the way the popover reads them: an Element, a
// virtual anchor answering getBoundingClientRect(), a point of two coordinates. Anything else is no target at
// all - it never reaches popover.setTarget(), which would take it for null and open the area mode nobody asked
// for.
const isValidTarget = (target: unknown): target is CalloutTarget => {
	if (target === 'area')
	{
		return true;
	}

	if (Type.isElementNode(target))
	{
		return true;
	}

	if (!Type.isObjectLike(target))
	{
		return false;
	}

	return Type.isFunction(target.getBoundingClientRect)
		|| (Type.isNumber(target.x) && Type.isNumber(target.y));
};

const contextElementOf = (target: Exclude<CalloutTarget, 'area'>): HTMLElement | null => {
	const context = (target as { contextElement?: unknown }).contextElement;

	return Type.isElementNode(context) ? context : null;
};

const resolveNode = (value: CalloutNode | null): HTMLElement | null => {
	if (value === null)
	{
		return null;
	}

	const node = Type.isFunction(value) ? value() : value;
	if (!Type.isElementNode(node))
	{
		console.warn(`${NAMESPACE}: the content of a region must be an element or a factory returning one.`);

		return null;
	}

	return node;
};

const appendContent = (node: HTMLElement | null): RegionFill => {
	if (node === null)
	{
		return null;
	}

	return (owned: HTMLElement): void => {
		Dom.append(node, owned);
	};
};

// Blank and whitespace-only strings count as no value: a name made of spaces is no name.
const filledText = (value: unknown): string | null => {
	return Type.isString(value) && value.trim() !== '' ? value : null;
};

// Whether content of an owner other than the options stands in the container: an element that is not the
// subcontainer of the options, or text of its own. Walked rather than collected - the answer is read on every
// commit, and a list of the children is built for nothing.
const holdsForeignContent = (container: HTMLElement, owned: HTMLElement | null): boolean => {
	for (let child = container.firstChild; child !== null; child = child.nextSibling)
	{
		if (Type.isElementNode(child))
		{
			if (child !== owned)
			{
				return true;
			}
		}
		else if (Type.isTextNode(child) && (child.textContent ?? '').trim() !== '')
		{
			return true;
		}
	}

	return false;
};

// The design of the option in the value the old buttons are drawn with: every ButtonDesign of ui.system.button
// carries the suffix of the AirButtonStyle standing for it. Whatever the old styles know nothing about - the
// two designs the new enum added among them - is drawn plain, and so is a value of the old domain: the option
// takes the new one alone. The whole translation goes when ui.system.button arrives, and the design of the item
// reaches the button as it is.
const AIR_STYLES: ReadonlySet<string> = new Set(Object.values(AirButtonStyle));

const DESIGN_PREFIX = 'design-';

const airStyleOf = (design: string | null): string => {
	if (design === null || !design.startsWith(DESIGN_PREFIX))
	{
		return AirButtonStyle.PLAIN;
	}

	const style = `--style-${design.slice(DESIGN_PREFIX.length)}`;

	return AIR_STYLES.has(style) ? style : AirButtonStyle.PLAIN;
};

// What the markup of a button is built from. Everything else an item carries - loading and disabled - is a
// state of the instance and moves without the DOM being touched. The handler is read out of the record rather
// than the record itself being compared: a consumer rebuilding the wrapper around the very same handler has
// moved nothing the button was built from.
const sameButtonMarkup = (left: CalloutButton, right: CalloutButton): boolean => {
	return left.text === right.text
		&& left.ariaLabel === right.ariaLabel
		&& left.design === right.design
		&& left.iconLeft === right.iconLeft
		&& left.iconRight === right.iconRight
		&& left.events?.click === right.events?.click;
};

// Waiting wins over disabled, and a button carries one visual state at a time: the one that goes is taken off
// before the one that comes is put on, and a state that already stands is not written anew.
const applyButtonState = (button: Button, item: CalloutButton): void => {
	const waiting = item.loading === true;
	if (button.isWaiting() !== waiting)
	{
		button.setWaiting(waiting);
	}

	const disabled = !waiting && item.disabled === true;
	if (button.isDisabled() !== disabled)
	{
		button.setDisabled(disabled);
	}
};

// Hint card anchored to a target, or standing against an area of the screen for a target of 'area': it owns
// the markup and hands the show, the position, the arrow and the closing over to a Popover of its own. The
// owner must call destroy() - hide() keeps the card alive.
export class Callout
{
	#state: CalloutLifecycle = 'idle';

	#target: CalloutTarget | null;
	#requestedPositioning: PopoverPositioning;
	#title: string | null;
	#description: CalloutContent | null;
	#leftSlot: CalloutNode | null;
	#buttons: CalloutButton[];
	#footer: CalloutNode | null;
	#footerLeft: CalloutNode | null;
	// null follows the effective mode; an explicit value is kept through every change of it.
	#requestedShowClose: boolean | null;
	#width: number;
	#ariaLabel: string | null;
	#requestedMode: CalloutMode;
	#effectiveMode: CalloutMode;
	#container: HTMLElement | null;
	#designContext: PopoverDesignContext;
	#closeByClickOutside: boolean;
	#closeByEsc: boolean;
	#autoFocus: boolean;

	#cardId: string;
	#card: HTMLElement | null = null;
	#body: HTMLElement | null = null;
	#titleNode: HTMLElement | null = null;
	#closeButton: HTMLElement | null = null;
	#regions: Map<CalloutRegion, CalloutRegionNodes> = new Map();
	#renderedButtons: RenderedButton[] = [];
	#pending: Set<PendingContent> = new Set();
	// Which footer regions carried the content of another owner - a slot BCallout teleported in - when the
	// footer was last rendered. Read off the DOM, because such content reaches a region past every setter, and
	// kept, because a slot that came or went moves the priority the same way an option does.
	#foreignFooter: Set<CalloutRegion> = new Set();

	#popover: Popover | null = null;
	// Whether the popover stands in the area right now. Kept beside the requested target rather than read off
	// it: a target written while the card was hiding is still owed to the substrate, and the order of the calls
	// of a commit is a question about what the popover has already been told.
	#substrateArea: boolean = false;
	// What is still owed to the popover. On the instance rather than on the commit that wrote it: a commit
	// made while hiding reaches no substrate, and the values it wrote are due at the next show().
	#pendingSubstrate: TouchedOptions = nothingTouched();
	#listeners: Map<CalloutEventName, Array<(event: BaseEvent) => void>> = new Map();

	#autoFocusPending: boolean = false;
	// Whether the mode of the show was decided on a card no CSS applied to, where the structure is the whole
	// answer. Written by every show and read once, by the mount of the popover.
	#modeDecidedUnrendered: boolean = false;

	// State of the focus tracker of ALG-01; boundDocument being set is what "bound" means.
	#focusInside: boolean = false;
	#outsideGesture: boolean = false;
	#resetTimer: ReturnType<typeof setTimeout> | null = null;
	#generation: number = 0;
	#lastFocus: FocusSnapshot | null = null;
	// The very node the focus stood on, beside the snapshot of its place: whether the content of the card is
	// what took the focus away is a question about this node and nothing else.
	#focusedElement: Element | null = null;
	#boundDocument: Document | null = null;

	// Why the card is being hidden, set around the calls of the callout itself; the reason of a hiding
	// nobody here asked for is read off the anchor state instead.
	#hideReason: HideReason | null = null;
	// Set the moment the popover reports an anchor it is about to close for, and only then: a card that
	// merely follows a hidden anchor out of sight (whenAnchorHidden: 'hide') stays shown, and the closing
	// that comes afterwards is the user's like any other.
	#anchorCloseArmed: boolean = false;

	#deferredHide: boolean = false;
	#deferredDestroy: boolean = false;
	#tearingDown: boolean = false;

	// What forces the effective mode away from the requested passive, so the warning is given once per spell
	// and not on every recomputation.
	#forcedModeReason: string | null = null;
	#namelessWarned: boolean = false;
	// The last width asked for below the minimum: the warning follows the value and not the commit, so a card
	// told the same too-small width again is clamped in silence.
	#clampedWidth: number | null = null;

	constructor(options: CalloutOptions = {})
	{
		const source: CalloutOptions = Type.isPlainObject(options) ? options : {};

		instanceCounter += 1;
		this.#cardId = `ui-system-callout-${instanceCounter}`;

		this.#target = this.#resolveTarget(source.target);
		this.#requestedPositioning = this.#normalizePositioning(source.positioning);
		this.#title = filledText(source.title);
		this.#description = source.description ?? null;
		this.#leftSlot = source.leftSlot ?? null;
		this.#buttons = Type.isArray<CalloutButton>(source.buttons) ? [...source.buttons] : [];
		this.#footer = source.footer ?? null;
		this.#footerLeft = source.footerLeft ?? null;
		this.#requestedShowClose = Type.isBoolean(source.showClose) ? source.showClose : null;
		this.#width = this.#normalizeWidth(source.width ?? DEFAULT_WIDTH);
		this.#ariaLabel = filledText(source.ariaLabel);
		this.#requestedMode = source.mode === 'passive' ? 'passive' : 'interactive';
		this.#effectiveMode = this.#requestedMode;
		this.#container = Type.isElementNode(source.container) ? source.container : null;
		this.#designContext = source.designContext ?? DEFAULT_DESIGN_CONTEXT;
		this.#closeByClickOutside = source.closeByClickOutside !== false;
		this.#closeByEsc = source.closeByEsc !== false;
		this.#autoFocus = source.autoFocus === true;

		this.#subscribeFromOptions(source);
	}

	show(): void
	{
		if (this.#state === 'destroyed' || this.#state === 'destroying')
		{
			console.warn(`${NAMESPACE}: show() called on a destroyed instance.`);

			return;
		}

		if (this.#state === 'hiding')
		{
			console.warn(`${NAMESPACE}: show() called while the card is hiding - the command is ignored.`);

			return;
		}

		if (this.#state !== 'idle' || this.#target === null)
		{
			return;
		}

		this.#state = 'showing';
		this.#hideReason = null;
		this.#anchorCloseArmed = false;
		this.#autoFocusPending = this.#autoFocus;

		try
		{
			// The invariant of every show: the effective mode is recomputed by the content actually in the
			// card, and the ARIA of that mode is in place before the popover mounts anything. The card comes
			// first - the commit works on the nodes, and the very first show has none of them yet. The commit
			// also hands over what a setter called while hiding left owed to the substrate, and it does so
			// before the popover is told to show.
			const card = this.#ensureCard();
			// Read before the commit and not after it: the commit below decides the mode, and on a card no CSS
			// applies to - one outside the document, one still inside the hidden root of its own popover - it
			// does so by the structure alone. The mount is what puts the card under the CSS of the page, and
			// the answer is due once more there - see #handlePopoverShow.
			this.#modeDecidedUnrendered = !cssAppliesTo(card);
			this.#commit({});
			this.#ensurePopover().show();
			this.#state = 'shown';
			this.#emit('onShow');
		}
		finally
		{
			// A content factory of the consumer that threw leaves the transition unfinished: the card is
			// back where it started rather than stuck in a state no command can leave.
			if (this.#state === 'showing')
			{
				this.#state = 'idle';
			}

			// The flag belongs to the show transition and to nothing after it: a mount that never came - the
			// factory above threw before it - leaves no commit of the future reading a card as unrendered.
			this.#modeDecidedUnrendered = false;

			this.#runDeferred();
		}
	}

	hide(): void
	{
		if (this.#state === 'destroyed')
		{
			console.warn(`${NAMESPACE}: hide() called on a destroyed instance.`);

			return;
		}

		if (this.#state === 'showing')
		{
			// The show transition owns the state until it is through.
			this.#deferredHide = true;

			return;
		}

		if (this.#state !== 'shown')
		{
			return;
		}

		this.#hideProgrammatically();
	}

	destroy(): void
	{
		if (this.#state === 'destroyed')
		{
			console.warn(`${NAMESPACE}: destroy() called on a destroyed instance.`);

			return;
		}

		if (this.#state === 'destroying')
		{
			return;
		}

		if (this.#state === 'showing' || this.#state === 'hiding')
		{
			this.#deferredDestroy = true;

			return;
		}

		this.#teardown();
	}

	isShown(): boolean
	{
		return this.#state === 'shown';
	}

	adjustPosition(): void
	{
		if (this.#state === 'destroyed')
		{
			console.warn(`${NAMESPACE}: adjustPosition() called on a destroyed instance.`);

			return;
		}

		if (this.#state !== 'shown')
		{
			return;
		}

		this.#popover?.adjustPosition();
	}

	// Builds the card on demand: BCallout needs the nodes before the first show to teleport its slots into.
	getCard(): HTMLElement | null
	{
		if (this.#state === 'destroyed' || this.#state === 'destroying')
		{
			console.warn(`${NAMESPACE}: getCard() called on a destroyed instance.`);

			return null;
		}

		return this.#ensureCard();
	}

	// The way in for content that reached the card past the setters - a teleported slot of BCallout. Everything
	// such content decides is recomputed: which region of the footer wins the priority, and the effective mode.
	refreshAccessibilityMode(): void
	{
		if (this.#state === 'destroyed' || this.#state === 'destroying')
		{
			console.warn(`${NAMESPACE}: refreshAccessibilityMode() called on a destroyed instance.`);

			return;
		}

		if (this.#state === 'hiding')
		{
			// Nothing to record and nothing to apply: the next show() recomputes everything anyway.
			return;
		}

		this.#commit({});
	}

	// One commit of several options: exactly one recomputation of the effective mode, one ARIA and focus
	// pass and one round of substrate calls, so no intermediate state is ever observable.
	applyOptions(partial: CalloutApplyOptions): void
	{
		if (this.#state === 'destroyed' || this.#state === 'destroying')
		{
			console.warn(`${NAMESPACE}: applyOptions() called on a destroyed instance.`);

			return;
		}

		if (!Type.isPlainObject(partial))
		{
			return;
		}

		this.#commit(partial);
	}

	setTitle(title?: string): void
	{
		this.applyOptions({ title });
	}

	setDescription(description?: CalloutContent): void
	{
		this.applyOptions({ description });
	}

	setLeftSlot(leftSlot?: CalloutNode): void
	{
		this.applyOptions({ leftSlot });
	}

	setFooter(footer?: CalloutNode): void
	{
		this.applyOptions({ footer });
	}

	setFooterLeft(footerLeft?: CalloutNode): void
	{
		this.applyOptions({ footerLeft });
	}

	setButtons(buttons?: CalloutButton[]): void
	{
		this.applyOptions({ buttons });
	}

	setShowClose(showClose?: boolean): void
	{
		this.applyOptions({ showClose });
	}

	setWidth(width?: number): void
	{
		this.applyOptions({ width });
	}

	setTarget(target: CalloutTarget | null): void
	{
		this.applyOptions({ target });
	}

	setPositioning(positioning?: PopoverPositioning): void
	{
		this.applyOptions({ positioning });
	}

	setDesignContext(designContext?: PopoverDesignContext): void
	{
		this.applyOptions({ designContext });
	}

	setCloseByClickOutside(closeByClickOutside: boolean): void
	{
		this.applyOptions({ closeByClickOutside });
	}

	setCloseByEsc(closeByEsc: boolean): void
	{
		this.applyOptions({ closeByEsc });
	}

	setAriaLabel(ariaLabel?: string): void
	{
		this.applyOptions({ ariaLabel });
	}

	setMode(mode: CalloutMode): void
	{
		this.applyOptions({ mode });
	}

	// Phased commit: snapshots, then the raw fields, then one recomputation, then one ARIA and focus pass,
	// and the substrate last of all - the anchor changes when every option is already in force.
	#commit(partial: CalloutApplyOptions): void
	{
		const previousAnchor = this.#accessibleAnchor();
		const previousMode = this.#effectiveMode;

		this.#writeOptions(partial);

		// While hiding only the requested state moves: what the substrate is owed waits in #pendingSubstrate
		// and reaches the card on the next show().
		if (this.#state === 'hiding')
		{
			return;
		}

		const focusReplaced = this.#renderPending();

		this.#recomputeEffectiveMode();

		this.#commitAccessibility(previousAnchor, focusReplaced);

		// Taken before the call and not after it: the substrate can hide the card from here, and a setter of a
		// subscriber of that hiding starts a set of its own instead of being wiped by this one.
		const touched = this.#pendingSubstrate;
		this.#pendingSubstrate = nothingTouched();
		this.#commitSubstrate(touched, previousMode !== this.#effectiveMode);
	}

	#writeOptions(partial: CalloutApplyOptions): void
	{
		this.#writeContent(partial);
		this.#writeState(partial);
	}

	// The options the card is filled from: every one of them marks the part #renderPending draws anew.
	#writeContent(partial: CalloutApplyOptions): void
	{
		const has = (key: keyof CalloutApplyOptions): boolean => Object.hasOwn(partial, key);

		if (has('title'))
		{
			this.#title = filledText(partial.title);
			this.#pending.add('title');
		}

		if (has('description'))
		{
			this.#description = partial.description ?? null;
			this.#pending.add('description');
		}

		if (has('leftSlot'))
		{
			this.#leftSlot = partial.leftSlot ?? null;
			this.#pending.add('leftSlot');
		}

		if (has('footer'))
		{
			this.#footer = partial.footer ?? null;
			this.#pending.add('footer');
		}

		if (has('footerLeft'))
		{
			this.#footerLeft = partial.footerLeft ?? null;
			this.#pending.add('footerLeft');
		}

		if (has('buttons'))
		{
			this.#buttons = Type.isArray<CalloutButton>(partial.buttons) ? [...partial.buttons] : [];
			this.#pending.add('buttons');
		}

		if (has('width'))
		{
			this.#width = this.#normalizeWidth(partial.width);
			this.#pending.add('width');
		}
	}

	// Everything the card is rather than shows: the state the effective mode is recomputed from, and the keys
	// the popover is owed, marked in #pendingSubstrate for #commit to hand over.
	#writeState(partial: CalloutApplyOptions): void
	{
		const touched = this.#pendingSubstrate;

		const has = (key: keyof CalloutApplyOptions): boolean => Object.hasOwn(partial, key);

		if (has('showClose'))
		{
			this.#requestedShowClose = Type.isBoolean(partial.showClose) ? partial.showClose : null;
		}

		if (has('ariaLabel'))
		{
			this.#ariaLabel = filledText(partial.ariaLabel);
		}

		if (has('mode'))
		{
			this.#requestedMode = partial.mode === 'passive' ? 'passive' : 'interactive';
		}

		if (has('positioning'))
		{
			this.#requestedPositioning = this.#normalizePositioning(partial.positioning);
			touched.positioning = true;
		}

		if (has('designContext'))
		{
			this.#designContext = partial.designContext ?? DEFAULT_DESIGN_CONTEXT;
			touched.designContext = true;
		}

		if (has('closeByClickOutside'))
		{
			this.#closeByClickOutside = partial.closeByClickOutside !== false;
			touched.closeByClickOutside = true;
		}

		if (has('closeByEsc'))
		{
			this.#closeByEsc = partial.closeByEsc !== false;
			touched.closeByEsc = true;
		}

		if (has('target'))
		{
			this.#target = this.#resolveTarget(partial.target);
			touched.target = true;
		}
	}

	// Returns whether a region that held the focus has been rendered anew.
	#renderPending(): boolean
	{
		const card = this.#card;
		if (card === null)
		{
			return false;
		}

		let focusReplaced = false;

		if (this.#pending.has('title'))
		{
			this.#renderTitle();
		}

		if (this.#pending.has('width'))
		{
			Dom.style(card, 'width', `${this.#width}px`);
		}

		if (this.#pending.has('description'))
		{
			focusReplaced = this.#renderRegion('description', appendContent(this.#descriptionContent())) || focusReplaced;
		}

		if (this.#pending.has('leftSlot'))
		{
			focusReplaced = this.#renderRegion('leftSlot', appendContent(resolveNode(this.#leftSlot))) || focusReplaced;
		}

		// A change of any of the three moves the footer as a whole: which region wins is decided by all of them
		// together, and a slot that came into one of them or left it counts for that as much as an option.
		const foreign = this.#readForeignFooter();

		if (FOOTER_REGIONS.some((region) => this.#pending.has(region)) || !sameRegions(foreign, this.#foreignFooter))
		{
			focusReplaced = this.#renderFooter(foreign) || focusReplaced;
		}

		this.#pending.clear();

		return focusReplaced;
	}

	#renderTitle(): void
	{
		if (this.#titleNode !== null)
		{
			Dom.remove(this.#titleNode);
			this.#titleNode = null;
		}

		if (this.#title === null)
		{
			return;
		}

		// The string reaches the DOM as text through Typography, so markup written in it stays text.
		const node: HTMLElement = Headline.render(this.#title, {
			size: 'sm',
			className: 'ui-system-callout__title',
		});
		Dom.attr(node, 'id', this.#titleId());

		this.#titleNode = node;
		Dom.prepend(node, this.#body);
	}

	#renderRegion(region: CalloutRegion, fill: RegionFill): boolean
	{
		const nodes = this.#regions.get(region);
		if (nodes === undefined)
		{
			return false;
		}

		// Only the subcontainer this class owns is taken away, so only the focus inside it is lost.
		const focusReplaced = nodes.owned !== null && this.#containsFocus(nodes.owned);

		if (nodes.owned !== null)
		{
			Dom.remove(nodes.owned);
			nodes.owned = null;
		}

		if (fill !== null)
		{
			const owned: HTMLElement = Tag.render`<div class="ui-system-callout__owned"></div>`;
			fill(owned);

			nodes.owned = owned;
			Dom.append(owned, nodes.container);
		}

		return focusReplaced;
	}

	// The one place the hierarchy of the footer lives: buttons win over footer, footer wins over footerLeft. A
	// region is taken whether an option or a slot filled it - both answer for the priority alike. What loses is
	// not rendered at all, so a container of options stays empty and takes no room; a container a slot filled
	// is hidden instead, because its DOM belongs to Vue and only Vue may take it away.
	#renderFooter(foreign: Set<CalloutRegion>): boolean
	{
		this.#foreignFooter = foreign;

		const withButtons = this.#buttons.length > 0;
		const withFooter = !withButtons && (this.#footer !== null || foreign.has('footer'));

		const replaced = [
			this.#renderButtonsRegion(withButtons),
			this.#renderRegion('footer', withFooter ? appendContent(resolveNode(this.#footer)) : null),
			this.#renderRegion('footerLeft', withFooter ? null : appendContent(resolveNode(this.#footerLeft))),
			// No slot addresses the buttons, so that region carries the content of the options and nothing else.
			this.#suppressRegion('footer', withButtons),
			this.#suppressRegion('footerLeft', withFooter),
		];

		return replaced.includes(true);
	}

	// Which footer regions carry the content of an owner other than the options. What a teleport leaves behind
	// when its slot renders nothing is no content - its anchors are empty text nodes and a `v-if` leaves a
	// comment. Read on every commit and never conditionally: content of another owner reaches a region past
	// every setter, so the DOM is the only place the answer stands.
	#readForeignFooter(): Set<CalloutRegion>
	{
		const filled = FOOTER_REGIONS.filter((region) => {
			const nodes = this.#regions.get(region);

			return nodes !== undefined && holdsForeignContent(nodes.container, nodes.owned);
		});

		return new Set(filled);
	}

	// Takes a region that lost the priority out of sight, and brings back one that won it. Returns whether the
	// focus stood in what has just been hidden: the browser drops such a focus onto the body and reports
	// nothing about it, so the card has to move it itself.
	#suppressRegion(region: CalloutRegion, suppressed: boolean): boolean
	{
		const nodes = this.#regions.get(region);
		if (nodes === undefined || Dom.hasClass(nodes.container, SUPPRESSED_CLASS) === suppressed)
		{
			return false;
		}

		const focusLost = suppressed && this.#containsFocus(nodes.container);

		if (suppressed)
		{
			Dom.addClass(nodes.container, SUPPRESSED_CLASS);
		}
		else
		{
			Dom.removeClass(nodes.container, SUPPRESSED_CLASS);
		}

		return focusLost;
	}

	// The DOM of the buttons is kept whenever it can be: a change of loading or disabled alone is written onto
	// the instances standing there, so a click that puts a button into waiting costs no rerender of the region -
	// and the focus, the hover and the click subscription stay where they are.
	#renderButtonsRegion(withButtons: boolean): boolean
	{
		if (withButtons && this.#applyButtonStates())
		{
			return false;
		}

		this.#renderedButtons = [];

		return this.#renderRegion('buttons', withButtons ? (owned) => this.#renderButtons(owned) : null);
	}

	// Whether the buttons standing in the region can carry the change themselves. Returns false for anything
	// the markup follows - the composition, the text, the icons, the design and the click handler of an item -
	// and the region is built anew for it.
	#applyButtonStates(): boolean
	{
		const rendered = this.#renderedButtons;
		const nodes = this.#regions.get('buttons');

		if (nodes === undefined || nodes.owned === null || rendered.length !== this.#buttons.length)
		{
			return false;
		}

		if (!this.#buttons.every((item, index) => sameButtonMarkup(item, rendered[index].item)))
		{
			return false;
		}

		this.#buttons.forEach((item, index) => {
			applyButtonState(rendered[index].instance, item);
			rendered[index].item = { ...item };
		});

		return true;
	}

	#renderButtons(owned: HTMLElement): void
	{
		this.#renderedButtons = this.#buttons.map((item) => {
			const instance = this.#createButton(item);
			instance.renderTo(owned);

			return { instance, item: { ...item } };
		});
	}

	#createButton(item: CalloutButton): Button
	{
		const { ariaLabel, design, events, iconLeft, iconRight, text } = item;

		const left = filledText(iconLeft);
		// Until ui.system.button arrives a button carries one icon, and the left one is it.
		const icon = left ?? filledText(iconRight);
		const label = filledText(text);
		const name = filledText(ariaLabel);

		// A button without text is an icon-only one and a legitimate case; the name it takes then is the
		// ariaLabel.
		const options: ButtonRenderOptions = {
			text: label ?? '',
			useAirDesign: true,
			size: ButtonSize.MEDIUM,
			style: airStyleOf(filledText(design)),
			collapsedIcon: '',
		};

		if (icon !== null)
		{
			options.icon = icon;
			options.iconPosition = left === null ? 'right' : 'left';
		}

		const button = new Button(options);

		// The options of ui.buttons carry no accessible name, so it goes onto the node by hand; the option of
		// ui.system.button writes the very same attribute.
		if (name !== null)
		{
			Dom.attr(button.getContainer(), 'aria-label', name);
		}
		else if (label === null)
		{
			console.warn(
				`${NAMESPACE}: a button carrying neither text nor an ariaLabel reaches assistive technology `
				+ 'unnamed - its icon is decorative. Give it one of the two.',
			);
		}

		const onClick = events?.click;

		if (Type.isFunction(onClick))
		{
			// The click is bound here rather than through the onclick option: the option hands the handler a
			// BaseButton, and the handler is promised the instance created for this very button. The card is
			// not closed by the click - what follows is the business of the consumer.
			Event.bind(button.getContainer(), 'click', (event: MouseEvent) => onClick(button, event));
		}

		// Waiting disables the button natively already, and Button carries one visual state at a time.
		applyButtonState(button, item);

		return button;
	}

	#descriptionContent(): HTMLElement | null
	{
		return Type.isString(this.#description)
			? TextElement.render(this.#description, { size: 'sm', className: 'ui-system-callout__text' })
			: resolveNode(this.#description as CalloutNode | null);
	}

	#containsFocus(node: HTMLElement): boolean
	{
		const active = this.#card?.ownerDocument.activeElement ?? null;

		return active !== null && node.contains(active);
	}

	#recomputeEffectiveMode(): void
	{
		const reason = this.#requestedMode === 'passive' ? this.#interactiveFactor() : null;

		this.#reportForcedMode(reason);
		this.#effectiveMode = this.#requestedMode === 'interactive' || reason !== null ? 'interactive' : 'passive';
	}

	// Names the factor keeping a card the consumer asked to be passive interactive, once per spell. A reading
	// the mount is about to answer anew names nothing: the factor it would give may be a control the CSS of the
	// page takes out, and the definitive answer follows a moment later. What was last named stays where it is
	// then, so the mount says neither what has already been said nor nothing at all.
	#reportForcedMode(reason: string | null): void
	{
		if (this.#modeDecidedUnrendered)
		{
			return;
		}

		if (reason !== null && reason !== this.#forcedModeReason)
		{
			console.warn(
				`${NAMESPACE}: the passive mode was requested, but ${reason} - the card stays interactive `
				+ '(role="dialog"). Remove the factor or request the interactive mode explicitly.',
			);
		}

		this.#forcedModeReason = reason;
	}

	// The one recomputation a show adds to the commit it has already made: that commit decided the mode on a
	// card no CSS applied to, where a control the consumer took out with display: none still reads as content
	// that can take the focus. The card stands where it will be read now, so the ARIA, the close button and the
	// reference from the anchor follow the answer the CSS gives - which takes candidates away and never adds
	// any, so the mode only ever moves from interactive to passive here. A card the CSS already answered for is
	// left alone, and the flag is dropped before the commit, so nothing here asks for a second pass.
	#recomputeMountedMode(): void
	{
		if (!this.#modeDecidedUnrendered)
		{
			return;
		}

		this.#modeDecidedUnrendered = false;

		this.#commit({});
	}

	// What keeps a card the consumer asked to be passive interactive all the same. The first answer wins:
	// the message names one reason, and one is enough to leave the tooltip role behind.
	#interactiveFactor(): string | null
	{
		if (this.#buttons.length > 0)
		{
			return 'the card carries buttons';
		}

		if (this.#requestedShowClose === true)
		{
			return 'the close button is switched on explicitly';
		}

		const target = this.#target;
		if (target === 'area')
		{
			return 'the card stands against an area, where there is no anchor to carry the description at all';
		}

		if (target !== null && !Type.isElementNode(target) && contextElementOf(target) === null)
		{
			return 'the target is a point or a rect without contextElement, which nothing can be described by';
		}

		const anchor = this.#accessibleAnchor();
		if (anchor !== null && anchor.ownerDocument !== this.#ownerDocument())
		{
			return 'the anchor belongs to another document, where an aria-describedby reference does not reach';
		}

		if (this.#hasFocusableContent())
		{
			return 'the content carries focusable elements';
		}

		return null;
	}

	// Only the containers of the consumer are scanned: the close button of the callout is its own business. A
	// region hidden after losing the priority of the footer is out of sight and out of reach, so what stands in
	// it is no content of the card either.
	#hasFocusableContent(): boolean
	{
		const card = this.#card;
		if (card === null)
		{
			return false;
		}

		// Asked of the card and not of every region: what takes the content out of the render tree stands above
		// all of them, and the regions the priority of the footer hid are left out below anyway.
		const cssApplies = cssAppliesTo(card);
		const scanned: CalloutRegion[] = ['description', 'leftSlot', 'footer', 'footerLeft'];

		return scanned.some((region) => {
			const nodes = this.#regions.get(region);

			return nodes !== undefined
				&& !Dom.hasClass(nodes.container, SUPPRESSED_CLASS)
				&& holdsFocusableContent(nodes.container, cssApplies);
		});
	}

	#commitAccessibility(previousAnchor: HTMLElement | null, focusReplaced: boolean): void
	{
		if (this.#card === null)
		{
			return;
		}

		this.#applyCardAria();
		this.#applyCloseButton();

		// The card counts as visible from the moment the show transition starts: onShow of the popover must
		// find the ARIA of the callout already in place.
		const visible = this.#state === 'shown' || this.#state === 'showing';
		// A target dropped to null takes the shown card down with it - the substrate phase does the hiding.
		const hides = visible && this.#target === null;

		this.#syncDescribedBy(previousAnchor, visible && !hides && this.#effectiveMode === 'passive');

		if (this.#state !== 'shown')
		{
			return;
		}

		if (hides || this.#effectiveMode === 'passive')
		{
			this.#autoFocusPending = false;
			this.#resolveCloseFocus(previousAnchor);

			return;
		}

		this.#enterShownInteractive();

		if (focusReplaced || this.#focusDropped())
		{
			this.#restoreRegionFocus();
		}
	}

	// Whether the content of the card is what took the focus away: the node it stood on is gone (a slot of
	// BCallout patched away by Vue, a region another owner took over) or cannot hold it where it stands any
	// more (disabled, inert). Nothing is reported about either - a focusout without a relatedTarget says as
	// much about a removed node as about a click on an empty spot of the page - so the node itself is asked
	// rather than the event. A node still standing and still focusable answers for a focus that left for
	// reasons of its own, and that one is not ours to take back.
	//
	// Where the focus ends up is a question of the browser: a removed node leaves it on the body, and a node
	// disabled where it stands keeps it in Firefox while Chromium drops it. Neither is a place the focus may
	// stay, so both are read as the same loss.
	#focusDropped(): boolean
	{
		const boundDocument = this.#boundDocument;
		const element = this.#focusedElement;

		if (!this.#focusInside || boundDocument === null || element === null)
		{
			return false;
		}

		// The visibility of the content is only read where the card itself is visible by it: a card the popover
		// holds hidden - while it measures it, and while the anchor is out of sight - hides everything inside at
		// once, and reading that as a loss would pull the focus onto the card on every cycle of the positioning.
		const visibilityApplies = this.#card !== null && isVisibleForFocus(this.#card, false);

		if (holdsFocus(element, visibilityApplies))
		{
			return false;
		}

		const active = boundDocument.activeElement;

		return !this.#isInsideCard(active) || !holdsFocus(active, visibilityApplies);
	}

	// The single entry point of the tracker for a shown interactive card; a second call adds no listeners.
	#enterShownInteractive(): void
	{
		if (this.#effectiveMode !== 'interactive' || this.#card === null)
		{
			return;
		}

		this.#bind();
	}

	// Focus tracker of ALG-01. It answers whether the focus is inside the card, whether the gesture that is
	// closing it started outside, and where inside a region the focus stood. Kept apart from
	// document.activeElement on purpose - the behaviour of that one after display: none is not the same across
	// browsers, and a focusout induced by hiding must not erase the fact that the focus was inside.
	#bind(): void
	{
		const card = this.#card;
		// Idempotent: the entry point above is reached from several sides.
		if (card === null || this.#boundDocument !== null)
		{
			return;
		}

		const boundDocument = card.ownerDocument;
		this.#boundDocument = boundDocument;
		// The focus may have reached the card before the tracker did - a teleported slot brings its own.
		this.#focusInside = card.contains(boundDocument.activeElement);
		this.#lastFocus = this.#focusInside ? this.#snapshotFocus(boundDocument.activeElement) : null;
		this.#focusedElement = this.#focusInside ? boundDocument.activeElement : null;

		Event.bind(card, 'focusin', this.#handleFocusIn);
		Event.bind(card, 'focusout', this.#handleFocusOut);
		Event.bind(boundDocument, 'pointerdown', this.#handlePointerDown, CAPTURE_PASSIVE);
		Event.bind(boundDocument, 'pointerup', this.#handleGestureEnd, CAPTURE_PASSIVE);
		Event.bind(boundDocument, 'pointercancel', this.#handleGestureEnd, CAPTURE_PASSIVE);
	}

	#unbind(): void
	{
		const card = this.#card;
		const boundDocument = this.#boundDocument;

		if (card !== null && boundDocument !== null)
		{
			Event.unbind(card, 'focusin', this.#handleFocusIn);
			Event.unbind(card, 'focusout', this.#handleFocusOut);
			Event.unbind(boundDocument, 'pointerdown', this.#handlePointerDown, CAPTURE_PASSIVE);
			Event.unbind(boundDocument, 'pointerup', this.#handleGestureEnd, CAPTURE_PASSIVE);
			Event.unbind(boundDocument, 'pointercancel', this.#handleGestureEnd, CAPTURE_PASSIVE);
		}

		if (this.#resetTimer !== null)
		{
			clearTimeout(this.#resetTimer);
			this.#resetTimer = null;
		}

		this.#generation += 1;
		this.#focusInside = false;
		this.#outsideGesture = false;
		this.#lastFocus = null;
		this.#focusedElement = null;
		this.#boundDocument = null;
	}

	// Where the element stood among the focusable elements of its region: enough to find its counterpart
	// after the region has been rendered anew.
	#snapshotFocus(element: Element | null): FocusSnapshot | null
	{
		if (element === null)
		{
			return null;
		}

		const entry = this.#regionEntries().find(([, container]) => container.contains(element));
		if (entry === undefined)
		{
			return null;
		}

		return {
			region: entry[0],
			index: focusableOf(entry[1]).indexOf(element),
			roleKey: roleKeyOf(element),
		};
	}

	#resolveCloseFocus(anchor: HTMLElement | null, forceDiscard: boolean = false): void
	{
		const boundDocument = this.#boundDocument;
		// Passive card, or a tracker that never bound: the focus is none of our business.
		if (boundDocument === null)
		{
			return;
		}

		const restored = !forceDiscard && this.#focusInside && !this.#outsideGesture && canRestoreFocus(anchor);

		if (restored && anchor !== null)
		{
			anchor.focus();
		}
		else
		{
			const active = boundDocument.activeElement;
			// The focus may not stay in a card that is hidden or turned into a tooltip.
			if (this.#isInsideCard(active) && Type.isFunction((active as Partial<HTMLElement>).blur))
			{
				(active as HTMLElement).blur();
			}
		}

		this.#unbind();
	}

	// An internal move of the focus after the DOM of a region has been replaced, not a close.
	#restoreRegionFocus(): void
	{
		const card = this.#card;
		const lastFocus = this.#lastFocus;
		if (card === null)
		{
			return;
		}

		if (!this.#focusInside || lastFocus === null)
		{
			card.focus();

			return;
		}

		const entry = this.#regionEntries().find(([region]) => region === lastFocus.region);
		const candidate = entry === undefined ? null : (focusableOf(entry[1])[lastFocus.index] ?? null);

		if (candidate !== null && roleKeyOf(candidate) === lastFocus.roleKey && canRestoreFocus(candidate))
		{
			(candidate as HTMLElement).focus();
		}
		else
		{
			card.focus();
		}

		this.#focusInside = true;
	}

	#isInsideCard(node: unknown): boolean
	{
		return this.#card !== null && Type.isDomNode(node) && this.#card.contains(node);
	}

	#handleFocusIn = (event: FocusEvent): void => {
		const target = Type.isElementNode(event.target) ? event.target : null;

		this.#focusInside = true;
		this.#lastFocus = this.#snapshotFocus(target);
		this.#focusedElement = target;
	};

	#handleFocusOut = (event: FocusEvent): void => {
		// A null relatedTarget says nothing about where the focus went: the node may simply have left the DOM.
		if (Type.isDomNode(event.relatedTarget) && !this.#isInsideCard(event.relatedTarget))
		{
			this.#focusInside = false;
		}
	};

	#handlePointerDown = (event: PointerEvent): void => {
		this.#outsideGesture = !this.#isInsideCard(event.target);
	};

	#handleGestureEnd = (): void => {
		// The reset waits a macrotask: the click handlers that close the card run earlier and still see the
		// flag, while a gesture that closed nothing does not stay on. The generation guards the next cycle.
		const cycle = this.#generation;

		this.#resetTimer = setTimeout(() => {
			this.#resetTimer = null;

			if (cycle === this.#generation)
			{
				this.#outsideGesture = false;
			}
		}, 0);
	};

	#applyCardAria(): void
	{
		const card = this.#card;
		if (card === null)
		{
			return;
		}

		if (this.#effectiveMode === 'passive')
		{
			Dom.attr(card, 'role', 'tooltip');
			Dom.attr(card, 'tabindex', null);
			// A name of its own would replace the content of the card in the description the anchor
			// announces: the description of aria-describedby is the text alternative of this very node.
			Dom.attr(card, 'aria-label', null);
			Dom.attr(card, 'aria-labelledby', null);

			return;
		}

		Dom.attr(card, 'role', 'dialog');
		// A dialog is focusable programmatically whatever it carries: the focus has to have a place to land.
		Dom.attr(card, 'tabindex', '-1');

		if (this.#titleNode !== null)
		{
			Dom.attr(card, 'aria-labelledby', this.#titleId());
			Dom.attr(card, 'aria-label', null);
			this.#namelessWarned = false;

			return;
		}

		Dom.attr(card, 'aria-labelledby', null);

		if (this.#ariaLabel !== null)
		{
			Dom.attr(card, 'aria-label', this.#ariaLabel);
			this.#namelessWarned = false;

			return;
		}

		if (!this.#namelessWarned)
		{
			this.#namelessWarned = true;
			console.warn(
				`${NAMESPACE}: an interactive card is a dialog and needs a name - give it a title or an `
				+ 'ariaLabel. The dialog stays nameless meanwhile.',
			);
		}

		Dom.attr(card, 'aria-label', null);
	}

	#applyCloseButton(): void
	{
		const card = this.#card;
		if (card === null)
		{
			return;
		}

		const wanted = this.#requestedShowClose ?? (this.#effectiveMode === 'interactive');

		if (wanted)
		{
			this.#closeButton = this.#closeButton ?? this.#renderCloseButton();
			// Only when it is not there yet: re-appending a button that holds the focus would lose it.
			if (this.#closeButton.parentElement !== card)
			{
				Dom.append(this.#closeButton, card);
			}
		}
		else if (this.#closeButton !== null)
		{
			Dom.remove(this.#closeButton);
		}

		Dom.toggleClass(card, '--with-close', wanted);
	}

	#renderCloseButton(): HTMLElement
	{
		// Tag.render writes the interpolation into the attribute as it comes: a quote in the phrase would
		// otherwise leave the markup of the button open.
		const label = Text.encode(Loc.getMessage('UI_SYSTEM_CALLOUT_CLOSE_BUTTON_LABEL_ARIA') ?? '');
		const icon = new Icon({ icon: Outline.CROSS_M, size: 24 });
		// type="button": the default of a button is submit, and the card is at home inside a form as well.
		const button: HTMLElement = Tag.render`
			<button
				class="ui-system-callout__close-button --ui-hoverable"
				type="button"
				aria-label="${label}"
				title="${label}"
			>
				${icon.render()}
			</button>
		`;

		Event.bind(button, 'click', this.#handleCloseClick);

		return button;
	}

	// The own id sits in the aria-describedby of the accessible anchor exactly while the card is shown and
	// passive; the tokens of other owners are left alone on both anchors.
	#syncDescribedBy(previousAnchor: HTMLElement | null, wanted: boolean): void
	{
		const anchor = this.#accessibleAnchor();

		if (previousAnchor !== null && previousAnchor !== anchor)
		{
			removeDescribedBy(previousAnchor, this.#cardId);
		}

		if (anchor === null)
		{
			return;
		}

		if (wanted)
		{
			addDescribedBy(anchor, this.#cardId);
		}
		else
		{
			removeDescribedBy(anchor, this.#cardId);
		}
	}

	#commitSubstrate(touched: TouchedOptions, modeChanged: boolean): void
	{
		const popover = this.#popover;
		// Nothing built yet: the values reach the popover through its constructor.
		if (popover === null)
		{
			return;
		}

		if (touched.closeByClickOutside)
		{
			popover.setCloseByClickOutside(this.#closeByClickOutside);
		}

		if (touched.closeByEsc)
		{
			popover.setCloseByEsc(this.#closeByEsc);
		}

		if (touched.designContext)
		{
			popover.setDesignContext(this.#designContext);
		}

		const wasArea = this.#substrateArea;
		const area = this.#target === 'area';
		// Leaving the area is the one case the target is committed before the positioning: the snapshot of an
		// anchor cycle names pointer and the rest of the anchor-only options, and an area cycle still running
		// would answer it with the warning about the options it ignores. Every other order is the usual one -
		// the target changes when every option is already in force.
		const targetFirst = wasArea && !area;

		if (touched.target && targetFirst)
		{
			this.#commitTarget();
		}

		// The mode carries a default of its own into the positioning, and the area takes every anchor-only
		// option out of it: a change of either is a change of the snapshot.
		if (touched.positioning || modeChanged || area !== wasArea)
		{
			popover.setPositioning(this.#effectivePositioning());
		}

		if (touched.target && !targetFirst)
		{
			this.#commitTarget();
		}
	}

	#commitTarget(): void
	{
		const target = this.#target;

		if (target !== null)
		{
			// null is what the area mode is to the popover. Showing is never started by a target: only an
			// explicit show() does that, in the area as much as at an anchor.
			this.#substrateArea = target === 'area';
			this.#popover?.setTarget(target === 'area' ? null : target);

			return;
		}

		// null is no target of the popover but the command to drop the anchor: the substrate keeps what it has
		// and the shown card goes down instead.
		if (this.#state === 'shown')
		{
			this.#hideProgrammatically();
		}
	}

	#hideProgrammatically(): void
	{
		this.#hideReason = 'programmatic';
		this.#state = 'hiding';
		this.#popover?.hide();
	}

	#completeHide(reason: HideReason): void
	{
		const anchor = this.#accessibleAnchor();

		this.#state = 'hiding';
		this.#autoFocusPending = false;

		try
		{
			if (this.#card !== null)
			{
				Dom.removeClass(this.#card, '--visible');
			}

			this.#syncDescribedBy(anchor, false);
			// An anchor scrolled out of sight passes the visibility check, and focusing it would scroll the
			// page back to a card that is already gone.
			this.#resolveCloseFocus(anchor, reason === 'anchor');

			if (reason === 'user')
			{
				this.#emit('onClose');
			}

			this.#emit('onHide');
		}
		finally
		{
			this.#state = 'idle';
			this.#anchorCloseArmed = false;
			this.#runDeferred();
		}
	}

	#teardown(): void
	{
		// A destroy() reaching here from a handler of its own teardown finds the work already under way.
		if (this.#tearingDown)
		{
			return;
		}

		this.#tearingDown = true;

		try
		{
			if (this.#state === 'shown')
			{
				this.#hideProgrammatically();
			}
		}
		finally
		{
			this.#state = 'destroying';

			try
			{
				this.#unbind();

				const anchor = this.#accessibleAnchor();
				if (anchor !== null)
				{
					removeDescribedBy(anchor, this.#cardId);
				}

				if (this.#closeButton !== null)
				{
					Event.unbind(this.#closeButton, 'click', this.#handleCloseClick);
				}

				this.#popover?.destroy();
				this.#popover = null;

				// A destroyed callout leaves nothing of itself standing anywhere: the card of a shown one goes
				// with the root the popover has just taken away, and the one the consumer placed themselves
				// through getCard() is taken out here. Detaching a node that is already detached costs nothing.
				if (this.#card !== null)
				{
					Dom.remove(this.#card);
				}

				this.#card = null;
				this.#body = null;
				this.#titleNode = null;
				this.#closeButton = null;
				this.#regions.clear();
				this.#renderedButtons = [];
				this.#pending.clear();
				this.#pendingSubstrate = nothingTouched();
			}
			finally
			{
				this.#state = 'destroyed';
				this.#emit('onDestroy');
				this.#listeners.clear();
			}
		}
	}

	#runDeferred(): void
	{
		if (this.#deferredDestroy)
		{
			// destroy() swallows a hide() asked for by another subscriber: one teardown, one onHide.
			this.#deferredDestroy = false;
			this.#deferredHide = false;
			this.#teardown();

			return;
		}

		if (this.#deferredHide)
		{
			this.#deferredHide = false;
			this.hide();
		}
	}

	#ensureCard(): HTMLElement
	{
		if (this.#card !== null)
		{
			return this.#card;
		}

		const left: HTMLElement = Tag.render`<div class="ui-system-callout__left"></div>`;
		const description: HTMLElement = Tag.render`<div class="ui-system-callout__description"></div>`;
		const footer: HTMLElement = Tag.render`<div class="ui-system-callout__footer"></div>`;
		const footerLeft: HTMLElement = Tag.render`<div class="ui-system-callout__footer-left"></div>`;
		const buttons: HTMLElement = Tag.render`<div class="ui-system-callout__buttons"></div>`;
		// The regions of the footer are laid out by the body itself: an empty container leaves the flow
		// together with its gap, and a row node of their own would have kept that gap.
		const body: HTMLElement = Tag.render`<div class="ui-system-callout__body">${description}${footerLeft}${footer}${buttons}</div>`;
		const card: HTMLElement = Tag.render`<div class="ui-system-callout" id="${this.#cardId}">${left}${body}</div>`;

		this.#card = card;
		this.#body = body;
		this.#regions.set('leftSlot', { container: left, owned: null });
		this.#regions.set('description', { container: description, owned: null });
		this.#regions.set('footer', { container: footer, owned: null });
		this.#regions.set('footerLeft', { container: footerLeft, owned: null });
		this.#regions.set('buttons', { container: buttons, owned: null });

		this.#pending = new Set<PendingContent>([
			'title',
			'width',
			'description',
			'leftSlot',
			'footer',
			'footerLeft',
			'buttons',
		]);
		this.#renderPending();

		// The card is born in the mode its content asks for: a card built and never shown still carries a
		// role and a name for whoever reads it.
		this.#recomputeEffectiveMode();
		this.#applyCardAria();
		this.#applyCloseButton();

		return card;
	}

	#ensurePopover(): Popover
	{
		if (this.#popover !== null)
		{
			return this.#popover;
		}

		const options: PopoverOptions = {
			content: this.#ensureCard(),
			// Addresses the group of this very popover from the CSS of the card: the appearance is written
			// there, where the arrow and the bubble are animated as one figure.
			className: POPOVER_CLASS,
			positioning: this.#effectivePositioning(),
			designContext: this.#designContext,
			closeByClickOutside: this.#closeByClickOutside,
			closeByEsc: this.#closeByEsc,
			events: {
				onShow: this.#handlePopoverShow,
				onHide: this.#handlePopoverHide,
				onStateChange: this.#handlePopoverStateChange,
			},
		};

		const target = this.#target;
		// A popover built without a target is a popover in the area mode, which is what 'area' asks for.
		if (target !== null && target !== 'area')
		{
			options.target = target;
		}

		if (this.#container !== null)
		{
			options.container = this.#container;
		}

		this.#popover = new Popover(options);
		this.#substrateArea = target === 'area';

		return this.#popover;
	}

	// The full snapshot of every positioning key: the setter of the popover merges what it is given, so a
	// key left out would keep the value of the previous consumer object instead of the default of the callout.
	#effectivePositioning(): PopoverPositioning
	{
		const area = this.#target === 'area';
		const defaults: PopoverPositioning = {
			...DEFAULT_POSITIONING,
			whenAnchorHidden: this.#effectiveMode === 'passive' ? 'hide' : 'close',
		};
		const requested = this.#requestedPositioning;
		const effective: Record<string, unknown> = {};

		POSITIONING_KEYS.forEach((key) => {
			// The area reads none of the anchor-only options, the defaults of the callout among them: they are
			// named as undefined, which is the absence of the key to the substrate.
			if (area && ANCHOR_ONLY_KEYS.has(key))
			{
				effective[key] = undefined;

				return;
			}

			// A key holding undefined counts as absent and never overwrites a default of the callout.
			effective[key] = requested[key] === undefined ? defaults[key] : requested[key];
		});

		// Nothing is normalised in the area: a card standing there follows no anchor out of sight.
		if (!area && this.#effectiveMode === 'interactive' && effective.whenAnchorHidden !== 'close')
		{
			console.warn(
				`${NAMESPACE}: an interactive card takes whenAnchorHidden: 'close' only - a dialog holding the `
				+ 'focus may not be hidden silently. The requested value is kept for the passive mode.',
			);
			effective.whenAnchorHidden = 'close';
		}

		return effective as PopoverPositioning;
	}

	// Whether a hidden anchor takes the card down with it. The whole snapshot is not built for the answer:
	// it is asked on every report of the substrate, and building it there would warn on every one of them.
	// An interactive card is normalised to 'close' whatever was requested; a passive one follows the request,
	// where anything but 'close' - the default among it - the popover reads as 'hide'.
	#closesOnHiddenAnchor(): boolean
	{
		return this.#effectiveMode === 'interactive' || this.#requestedPositioning.whenAnchorHidden === 'close';
	}

	#normalizePositioning(positioning: unknown): PopoverPositioning
	{
		return Type.isPlainObject(positioning) ? { ...positioning } as PopoverPositioning : {};
	}

	// Anything but a finite positive number is no width at all and leaves the default standing. A number the
	// card cannot be laid out in is another matter - it is a width, just too small a one, and it is clamped
	// rather than dropped: the consumer keeps the narrowest card there is instead of the widest.
	#normalizeWidth(value: unknown): number
	{
		if (!Type.isNumber(value) || !Number.isFinite(value) || value <= 0)
		{
			this.#clampedWidth = null;

			return DEFAULT_WIDTH;
		}

		if (value >= MIN_WIDTH)
		{
			this.#clampedWidth = null;

			return value;
		}

		if (this.#clampedWidth !== value)
		{
			this.#clampedWidth = value;
			console.warn(
				`${NAMESPACE}: a width of ${value}px is below the minimum of ${MIN_WIDTH}px the card is laid `
				+ 'out for - the minimum is applied instead.',
			);
		}

		return MIN_WIDTH;
	}

	#resolveTarget(target: unknown): CalloutTarget | null
	{
		if (target === null || target === undefined)
		{
			return null;
		}

		if (isValidTarget(target))
		{
			return target;
		}

		console.warn(
			`${NAMESPACE}: the target must be an element, a rect target, a point or 'area' - the value given `
			+ 'is treated as no anchor at all.',
		);

		return null;
	}

	#accessibleAnchor(): HTMLElement | null
	{
		const target = this.#target;
		// An area card is anchored to nothing, so there is no element to reference it from either.
		if (target === null || target === 'area')
		{
			return null;
		}

		return Type.isElementNode(target) ? target : contextElementOf(target);
	}

	// The document the card lives in: the container decides it, and the card follows the container there.
	#ownerDocument(): Document
	{
		if (this.#container !== null)
		{
			return this.#container.ownerDocument;
		}

		return this.#card?.ownerDocument ?? document;
	}

	#titleId(): string
	{
		return `${this.#cardId}-title`;
	}

	#regionEntries(): Array<[CalloutRegion, HTMLElement]>
	{
		return [...this.#regions].map(([region, nodes]) => [region, nodes.container]);
	}

	#handlePopoverShow = (): void => {
		// The root has reached the container, so the card is in its final document and the tracker binds to
		// the right one. A cycle already ended by hide() or destroy() has nothing to bind.
		if (this.#state !== 'showing')
		{
			return;
		}

		// Ahead of the tracker: what it binds for is the mode, and the mode is only now decided for good.
		this.#recomputeMountedMode();
		this.#enterShownInteractive();
	};

	#handlePopoverHide = (): void => {
		const reason = this.#hideReason ?? (this.#anchorCloseArmed ? 'anchor' : 'user');
		this.#hideReason = null;

		this.#completeHide(reason);
	};

	#handlePopoverStateChange = (event: BaseEvent<PopoverStateChangePayload>): void => {
		const payload = event.getData();
		if (payload === null)
		{
			return;
		}

		const { state } = payload;
		// Read before anything else: the popover reports a clipped anchor and hides itself right after, so
		// the reason of that hiding has to stand here already. Only a card that closes on a hidden anchor
		// arms it - the one that merely goes out of sight with the anchor is closed by the user afterwards.
		this.#anchorCloseArmed = state.anchorHidden && this.#closesOnHiddenAnchor();

		if (this.#state !== 'shown' || !state.positioned || state.anchorHidden || this.#card === null)
		{
			return;
		}

		Dom.addClass(this.#card, '--visible');

		if (this.#autoFocusPending && this.#effectiveMode === 'interactive')
		{
			this.#autoFocusPending = false;
			this.#card.focus();
		}
	};

	#handleCloseClick = (): void => {
		if (this.#state !== 'shown')
		{
			return;
		}

		this.#hideReason = 'user';
		this.#state = 'hiding';
		this.#popover?.hide();
	};

	#subscribeFromOptions(options: CalloutOptions): void
	{
		const events = Type.isPlainObject(options.events) ? options.events : {};
		const names: CalloutEventName[] = ['onShow', 'onHide', 'onClose', 'onDestroy'];

		names.forEach((name) => {
			const listener = events[name];
			if (Type.isFunction(listener))
			{
				this.#addListener(name, listener as (event: BaseEvent) => void);
			}
		});
	}

	#addListener(name: CalloutEventName, listener: (event: BaseEvent) => void): void
	{
		const listeners = this.#listeners.get(name) ?? [];
		listeners.push(listener);
		this.#listeners.set(name, listeners);
	}

	// Delivery of its own instead of the EventEmitter of the core: that one stops the dispatch on the first
	// throw, and every subscription of the callout has to be called whatever the one before it did.
	#emit(name: CalloutEventName): void
	{
		const listeners = this.#listeners.get(name);
		if (listeners === undefined || listeners.length === 0)
		{
			return;
		}

		const event = new BaseEvent({ data: {} });
		const errors: unknown[] = [];

		[...listeners].forEach((listener) => {
			try
			{
				listener(event);
			}
			catch (error)
			{
				errors.push(error);
			}
		});

		errors.forEach((error) => console.error(`${NAMESPACE}: a subscriber of ${name} threw.`, error));
	}
}
