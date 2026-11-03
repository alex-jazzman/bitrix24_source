import { Dom, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Popover, type PopoverPositioning } from 'ui.system.popover';

// A custom property is no import the build can see, so the sets defining the ones the stylesheet reads are
// named here by hand: the air set answers for the background of the bubble, the base one for everything
// else. Without them the extension loaded on its own leaves every token undefined - the bubble transparent,
// and the pointer, which takes its fill off the computed background, with it.
import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { DEFAULT_MAX_WIDTH, DEFAULT_POSITION, DEFAULT_TRIGGER, TooltipPosition, TooltipTrigger } from './const';
import { assertTriggerCombination, TriggerBinding } from './trigger';
import { type TooltipOptions } from './types';

import './tooltip.css';

const EVENT_NAMESPACE = 'BX.UI.System.Tooltip';

// Block class of the bubble, and the whole of the public CSS surface of the extension: the look of the
// tooltip belongs here and is no setting of the place of use.
const BUBBLE_CLASS = 'ui-system-tooltip';

// Gap to the target on top of the protrusion of the pointer, px, and the range it is allowed in: the two
// together make the distance the cursor crosses on its way to the bubble, and that distance has to stay
// within the bridge window the trigger layer keeps the tooltip alive for.
const DEFAULT_OFFSET: number = 4;
const MIN_OFFSET: number = 0;
const MAX_OFFSET: number = 12;

const DESCRIBED_BY = 'aria-describedby';

let lastBubbleId: number = 0;

// The id has to be free in the document the element lives in: a reference of aria-describedby is resolved
// by the whole document, and the page is free to carry ids of its own.
const generateBubbleId = (ownerDocument: Document): string => {
	let id = '';

	do
	{
		lastBubbleId += 1;
		id = `ui-system-tooltip-${lastBubbleId}`;
	}
	while (ownerDocument.getElementById(id) !== null);

	return id;
};

const describedByTokens = (element: Element): string[] => {
	return (element.getAttribute(DESCRIBED_BY) ?? '').split(/\s+/).filter((token) => token !== '');
};

const writeDescribedBy = (element: Element, tokens: string[]): void => {
	if (tokens.length === 0)
	{
		element.removeAttribute(DESCRIBED_BY);

		return;
	}

	element.setAttribute(DESCRIBED_BY, tokens.join(' '));
};

// Options after normalisation: every field of the contract is in place.
type NormalizedOptions = {
	target: Element;
	content: string | HTMLElement;
	html: boolean;
	maxWidth: number;
	position: TooltipPosition;
	offset: number;
	crossOffset: number;
	trigger: TooltipTrigger[];
	showDelay: number;
	hideDelay: number;
};

// Everything setOptions() accepts: any subset of the contract but the subscriptions, which are given once.
type PartialOptions = Partial<Omit<TooltipOptions, 'events'>>;

// What a binding hands over to the one built to take its place. Every other reason the new binding reads off
// the element; for these two the DOM has no answer. Nothing marks a tooltip as pinned, and left behind the
// pinning would take a tooltip that is on the screen with it - a click outside would lower a reason already
// down and nothing would come off. And nothing tells who is holding the tooltip on the screen: the layer,
// whose reasons the new binding then has to answer for, or the place of use, whose show() it must not undo.
type CarriedState = {
	clickPinned: boolean;
	heldByLayer: boolean;
};

const NOTHING_CARRIED: CarriedState = Object.freeze({ clickPinned: false, heldByLayer: false });

const isPosition = (value: unknown): value is TooltipPosition => {
	return (Object.values(TooltipPosition) as unknown[]).includes(value);
};

const isTrigger = (value: unknown): value is TooltipTrigger => {
	return (Object.values(TooltipTrigger) as unknown[]).includes(value);
};

// An invalid value keeps the value in force, exactly as an unset one does: this is the normalisation the
// whole family follows, and the compiler already stands against everything but a JS consumer.
const resolveTrigger = (raw: unknown, fallback: TooltipTrigger[]): TooltipTrigger[] => {
	if (Type.isUndefined(raw))
	{
		return fallback;
	}

	const values = Type.isArray(raw) ? raw : [raw];
	const modes = values.filter((mode, index): mode is TooltipTrigger => {
		return isTrigger(mode) && values.indexOf(mode) === index;
	});

	if (modes.length === 0)
	{
		return fallback;
	}

	// Checked here and not where the subscriptions are taken: nothing of the instance has moved yet, so a
	// combination the trigger layer refuses leaves the options exactly as they were.
	assertTriggerCombination(modes);

	return modes;
};

// Compared by value and not by reference: the list is built anew on every read of the options, and the markup
// surface reads them on every gesture. By reference, a text changed on its own would take the subscriptions of
// the element apart and build them again, modes and all.
const sameTrigger = (one: TooltipTrigger[], other: TooltipTrigger[]): boolean => {
	return one.length === other.length && one.every((mode, index) => mode === other[index]);
};

const isFiniteNumber = (value: unknown): value is number => {
	return Type.isNumber(value) && Number.isFinite(value);
};

const resolveDelay = (raw: unknown, fallback: number): number => {
	return isFiniteNumber(raw) ? Math.max(0, raw) : fallback;
};

// A bubble of no width shows nothing, so zero and below are refused like any other invalid value: the width
// in force stays, exactly as it does for an unset option.
const resolveMaxWidth = (raw: unknown, fallback: number): number => {
	return isFiniteNumber(raw) && raw > 0 ? raw : fallback;
};

const resolveOffset = (raw: unknown, fallback: number): number => {
	if (!isFiniteNumber(raw))
	{
		return fallback;
	}

	const limited = Math.min(Math.max(raw, MIN_OFFSET), MAX_OFFSET);
	if (limited !== raw)
	{
		console.warn(
			`${EVENT_NAMESPACE}: the "offset" option holds ${raw} and is brought to ${limited} - the gap to the `
			+ `target is limited to ${MIN_OFFSET}...${MAX_OFFSET} px, so that the cursor crosses it within the `
			+ 'window the tooltip stays alive for.',
		);
	}

	return limited;
};

// A tooltip without an owner does not exist: the element is the anchor of the position and the one the
// bubble is announced from. Hence the same message for a target absent and for a target of a wrong shape,
// and hence null being no way back - that is what destroy() is for.
const resolveTarget = (raw: unknown, fallback: Element | null): Element => {
	if (Type.isUndefined(raw))
	{
		if (fallback === null)
		{
			throw new TypeError(`${EVENT_NAMESPACE}: the "target" option is required and must be an element.`);
		}

		return fallback;
	}

	if (!Type.isElementNode(raw))
	{
		throw new TypeError(`${EVENT_NAMESPACE}: the "target" option is required and must be an element.`);
	}

	return raw;
};

// A tooltip with nothing to show does not exist, hence the same message for a content absent and for one of
// a wrong shape. The two forms replace one another: whichever arrives is the whole content of the bubble
// from then on.
const resolveContent = (raw: unknown, fallback: string | HTMLElement | null): string | HTMLElement => {
	if (Type.isUndefined(raw))
	{
		if (fallback === null)
		{
			throw new TypeError(
				`${EVENT_NAMESPACE}: the "content" option is required and must be a string or an element.`,
			);
		}

		return fallback;
	}

	if (!Type.isString(raw) && !Type.isElementNode(raw))
	{
		throw new TypeError(
			`${EVENT_NAMESPACE}: the "content" option is required and must be a string or an element.`,
		);
	}

	return raw as string | HTMLElement;
};

// Markup of the place of use turned into nodes, parsed inside a <template>, whose content is an inert
// fragment: nothing of the markup is fetched or run while it is built, and it reaches a live document only
// where it is put - inside the bubble. The markup is not looked through and nothing is taken out of it: what
// the place of use wrote is what the bubble shows, exactly as ui.system.popover treats a string content of
// its own.
const parseMarkup = (markup: string, ownerDocument: Document): DocumentFragment => {
	const template: HTMLTemplateElement = ownerDocument.createElement('template');
	template.innerHTML = markup;

	return template.content;
};

// The options given merged into the ones in force; null stands for the state before the constructor, where
// there is nothing to inherit and the required options have to arrive with the argument.
const mergeOptions = (current: NormalizedOptions | null, raw: PartialOptions): NormalizedOptions => {
	return {
		target: resolveTarget(raw.target, current?.target ?? null),
		content: resolveContent(raw.content, current?.content ?? null),
		html: Type.isBoolean(raw.html) ? raw.html : (current?.html ?? false),
		maxWidth: resolveMaxWidth(raw.maxWidth, current?.maxWidth ?? DEFAULT_MAX_WIDTH),
		position: isPosition(raw.position) ? raw.position : (current?.position ?? DEFAULT_POSITION),
		offset: resolveOffset(raw.offset, current?.offset ?? DEFAULT_OFFSET),
		crossOffset: isFiniteNumber(raw.crossOffset) ? raw.crossOffset : (current?.crossOffset ?? 0),
		trigger: resolveTrigger(raw.trigger, current?.trigger ?? [...DEFAULT_TRIGGER]),
		showDelay: resolveDelay(raw.showDelay, current?.showDelay ?? 0),
		hideDelay: resolveDelay(raw.hideDelay, current?.hideDelay ?? 0),
	};
};

// A hint on one element: the bubble belongs to the extension, the placing to ui.system.popover. The owner
// calls destroy(): removing the element of the tooltip from the page does not tear it down.
export class Tooltip extends EventEmitter
{
	#options: NormalizedOptions;
	#popover: Popover;

	// Null before the first binding is installed and between one being taken down and the next taking its
	// place. Nothing of the binding runs in either window: it is built in two steps, and the step that shows
	// or hides anything is taken by #installTriggers() once the field below is written.
	#triggers: TriggerBinding | null = null;

	// Built on the first show(), where the primitive asks for its content, and gone with destroy().
	#bubble: HTMLElement | null = null;

	// Kept between the shows: the element points at the bubble by this id, and a new one on every show
	// would leave the value of aria-describedby growing.
	#bubbleId: string | null = null;

	#destroyed: boolean = false;

	// True while the primitive is being replaced by one mounted in another document. The events of the swap are
	// none of the consumer's business: destroy() on a shown primitive reports a hiding, and the surface that
	// raises tooltips from the markup takes an instance down on exactly that.
	#swapping: boolean = false;

	constructor(options: TooltipOptions)
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		if (!Type.isPlainObject(options))
		{
			throw new TypeError(`${EVENT_NAMESPACE}: the options object is required.`);
		}

		this.#options = mergeOptions(null, options);

		this.#popover = this.#createPopover();

		// Before the triggers and not after: the binding reads the state of the DOM as it is built, so an element
		// already under the cursor is shown from right here - and a subscription taken afterwards would miss it.
		if (options.events)
		{
			this.subscribeFromOptions(options.events);
		}

		this.#installTriggers(this.#buildTriggers());
	}

	// Both of these settle the visibility, so the trigger layer is told before the primitive is touched: it may
	// have a transition in flight, and the primitive alone would not always answer for it. A show still waiting
	// out its delay stands over a primitive that is hidden, so hide() there hides nothing and the timer raises
	// the tooltip afterwards; a hiding still inside the bridge window stands over one that is shown, so show()
	// changes nothing and the timer takes the tooltip away afterwards. Either way the last word would go to a
	// transition decided before the call.
	show(): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: show() called on a destroyed instance.`);

			return;
		}

		this.#triggers?.settle(true);
		this.#popover.show();
	}

	hide(): void
	{
		this.#triggers?.settle(false);
		this.#popover.hide();
	}

	isShown(): boolean
	{
		return this.#popover.isShown();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		// Dead from here on, before a single step of the teardown is taken. Taking a shown primitive down reports
		// a hiding, the hiding goes out to the place of use, and the answer may be anything: a show() made from
		// there would raise the tooltip again over an instance about to lose its bubble, and the element would be
		// left pointing at an identifier the document no longer carries; a destroy() would run the whole teardown
		// a second time from the middle of the first.
		this.#destroyed = true;

		// The triggers go first: a show still waiting out its delay must not reach a primitive already torn down.
		this.#triggers?.destroy();
		this.#triggers = null;

		// The primitive owns the mounted node and the subscriptions of the cycle: dropping the element alone
		// would leave both behind. The hiding it reports still reaches the place of use, exactly as before - the
		// flag above stands against the calls coming back into the tooltip, not against the events leaving it.
		this.#popover.destroy();
		this.#bubble = null;

		this.emit('onDestroy', {});
		this.unsubscribeAll();
	}

	// The node of the bubble, to read and to mark for the autotests of the place of use. The look of the
	// tooltip is none of its business: that belongs to the extension and is written in its own stylesheet.
	// null until the first show(), where the bubble is built.
	getBubble(): HTMLElement | null
	{
		return this.#bubble;
	}

	// Recomputes the position against the bubble as it is now. Needed once anything the positioning reads has
	// changed without a change of the size: the pointer takes its colour from the computed background of the
	// bubble and its distance from the corners from the border radius, and no observer of the cycle sees
	// either of the two.
	adjustPosition(): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: adjustPosition() called on a destroyed instance.`);

			return;
		}

		this.#popover.adjustPosition();
	}

	// The one way to change anything after the constructor: the options given are merged into the ones in
	// force and applied in a fixed order, whatever order they arrive in.
	setOptions(options: PartialOptions): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setOptions() called on a destroyed instance.`);

			return;
		}

		if (!Type.isPlainObject(options))
		{
			return;
		}

		const previous = this.#options;
		this.#options = mergeOptions(previous, options);

		this.#applyChanges(previous);
	}

	// The content of the bubble first and the geometry last: the position is computed against a bubble that
	// already carries everything deciding its size.
	#applyChanges(previous: NormalizedOptions): void
	{
		const options = this.#options;

		if (options.content !== previous.content || options.html !== previous.html)
		{
			this.#applyContent();
		}

		if (options.maxWidth !== previous.maxWidth)
		{
			this.#applyMaxWidth();
		}

		if (options.showDelay !== previous.showDelay || options.hideDelay !== previous.hideDelay)
		{
			this.#triggers?.setDelays(options.showDelay, options.hideDelay);
		}

		if (
			options.position !== previous.position
			|| options.offset !== previous.offset
			|| options.crossOffset !== previous.crossOffset
		)
		{
			this.#popover.setPositioning(this.#buildPositioning());
		}

		if (options.target !== previous.target)
		{
			this.#unlinkTarget(previous.target);

			if (options.target.ownerDocument === previous.target.ownerDocument)
			{
				this.#popover.setTarget(options.target);
			}
			else
			{
				this.#relocate();
			}

			if (this.isShown())
			{
				this.#linkTarget();
			}
		}

		if (!sameTrigger(options.trigger, previous.trigger) || options.target !== previous.target)
		{
			this.#rebuildTriggers();
		}
	}

	#createPopover(): Popover
	{
		const target = this.#options.target;

		return new Popover({
			// A factory and not a node: the bubble is built where the primitive builds its own root, so a
			// tooltip that was never shown touches the DOM as little as the primitive does.
			content: () => this.#ensureBubble(),
			target,
			// The bubble belongs in the document of the element it describes. Left out, the mount lands in the
			// body of the document this code was loaded into, and that is another one as soon as the element
			// lives in a frame: aria-describedby is resolved within a single document and would point at
			// nothing, while the primitive would measure the viewport of the wrong window and listen for the
			// cancel key there. The stylesheet of the extension is another matter and stays with the document
			// it was loaded into - a frame showing a bubble of its own has to carry the extension as well.
			container: target.ownerDocument.body,
			positioning: this.#buildPositioning(),
			// The escape key is the only way left to a keyboard user to take the tooltip off the screen, so
			// it works in every mode.
			closeByEsc: true,
			// A click outside means something only where the tooltip stays on by itself - the click mode -
			// and there it is answered by the trigger layer, which owns the reason the click raised. The
			// primitive cancels the closing click and stops it before the handlers of the element, and the
			// element of a tooltip is an outsider to its own layer: the click that closes would never reach
			// the button it was aimed at. Explicitly false - the primitive takes this on by default.
			closeByClickOutside: false,
			events: {
				onShow: this.#handlePopoverShow,
				onHide: this.#handlePopoverHide,
			},
		});
	}

	// The primitive takes its mount container once, in the constructor, so an element from another document
	// needs a primitive of its own. Everything the tooltip is made of survives the swap: the bubble is ours and
	// is adopted by the new document as it is mounted, carrying its content and its role with it. The
	// identifier does not - it was picked to be free among the ids of the document the bubble is leaving.
	#relocate(): void
	{
		const shown = this.#popover.isShown();

		this.#swapping = true;
		try
		{
			this.#popover.destroy();
			this.#bubbleId = null;
			this.#popover = this.#createPopover();

			if (shown)
			{
				this.#popover.show();
			}
		}
		finally
		{
			this.#swapping = false;
		}
	}

	#buildTriggers(carried: CarriedState = NOTHING_CARRIED): TriggerBinding
	{
		const options = this.#options;

		return new TriggerBinding(this, {
			target: options.target,
			trigger: options.trigger,
			showDelay: options.showDelay,
			hideDelay: options.hideDelay,
			// The bubble may be there already, built by an earlier show. Handed over as an option and not
			// afterwards, so that a cursor standing on it counts among the reasons the binding settles by.
			bubble: this.#bubble,
			clickPinned: carried.clickPinned,
			heldByLayer: carried.heldByLayer,
		});
	}

	// The one door a binding reaches the instance through, and the order here is the whole of it. Starting the
	// binding settles the visibility, the tooltip reports that to the place of use, and the answer may be
	// anything - destroy() among the rest, which is what the markup surface does on every hiding. Written into
	// the field first, the binding is torn down with everything else and leaves the element clean; started
	// first, it would come back to an instance already dead and stay on the element with nobody to take it off.
	//
	// The bubble finds its way by the same order: a show made here builds one, and #ensureBubble() hands it to
	// whatever the field holds - which is this very binding.
	#installTriggers(triggers: TriggerBinding): void
	{
		this.#triggers = triggers;
		triggers.start();
	}

	// The subscriptions live on the element and follow the modes, so a change of either takes them anew.
	#rebuildTriggers(): void
	{
		const previous = this.#triggers;
		const carried: CarriedState = {
			clickPinned: previous?.isClickPinned() === true,
			heldByLayer: previous?.isHolding() === true,
		};

		this.#triggers = null;
		previous?.destroy();

		this.#installTriggers(this.#buildTriggers(carried));
	}

	#ensureBubble(): HTMLElement
	{
		if (this.#bubble !== null)
		{
			return this.#bubble;
		}

		const bubble: HTMLElement = Tag.render`<div class="${BUBBLE_CLASS}"></div>`;
		this.#bubble = bubble;
		this.#applyContent();
		this.#applyMaxWidth();
		this.#triggers?.setBubble(bubble);

		return bubble;
	}

	// A string is a text and goes into textContent as it is: nothing there is interpreted, so encoding it
	// would show the entities themselves instead of the characters. Under the html option the very same
	// string is markup instead and is put inside the bubble as it stands; its safety belongs to the place of
	// use. A node of theirs is put inside the bubble in the very place the text would have taken, whatever
	// the option says. Every form clears what the one before it left.
	#applyContent(): void
	{
		const bubble = this.#bubble;
		if (bubble === null)
		{
			return;
		}

		const content = this.#options.content;
		if (!Type.isString(content))
		{
			bubble.textContent = '';
			Dom.append(content, bubble);

			return;
		}

		if (this.#options.html)
		{
			bubble.textContent = '';
			// Not through Dom.append: the facade is typed for an element, and what goes in here is the whole
			// fragment - the bare text nodes between its elements among the rest, which is what keeps the breaks
			// of the markup string standing (see tooltip.css).
			bubble.append(parseMarkup(content, bubble.ownerDocument));

			return;
		}

		bubble.textContent = content;
	}

	// The ceiling of the width belongs to the stylesheet of the extension, and the option only overrules it
	// where the place of use asked for another one: a width equal to the default takes the declaration off
	// the node instead of writing the very same number onto it. Inline, because this is the one value of the
	// look the place of use decides, and no rule of the stylesheet may stand against it.
	#applyMaxWidth(): void
	{
		const bubble = this.#bubble;
		if (bubble === null)
		{
			return;
		}

		const maxWidth = this.#options.maxWidth;
		Dom.style(bubble, 'maxWidth', maxWidth === DEFAULT_MAX_WIDTH ? null : `${maxWidth}px`);
	}

	// The narrow set of the extension turned into the options of the primitive, in one place. Everything the
	// tooltip decides for itself is written here and never reaches the place of use: the pointer is off in
	// the primitive by default and is switched on explicitly, and it is given as true alone - both aims stay
	// 'auto', and only then does the pointer travel with the tooltip instead of sticking to the target.
	// A target out of sight closes the tooltip instead of waiting for it behind a class of its own: a hint is
	// worth nothing without the element it describes, and the reasons that put it on the screen - the cursor
	// and the focus - are long gone by the time the target has scrolled away or left the page. The default
	// mode would keep the bubble mounted in document.body, hidden, until somebody destroyed the instance.
	#buildPositioning(): PopoverPositioning
	{
		return {
			position: this.#options.position,
			offset: { main: this.#options.offset, cross: this.#options.crossOffset },
			pointer: true,
			flip: { fallbacks: ['flip-position'] },
			slide: true,
			constrainSize: true,
			tracking: 'observers',
			whenAnchorHidden: 'close',
		};
	}

	// The tooltip is announced from the element it belongs to, so the bubble takes the role and an id of its
	// own, and the element points at it. The id joins whatever aria-describedby already carries: the value
	// belongs to the page, and the tooltip is one describing node among the ones possibly already there.
	// The bubble stays out of the tab order - no tabindex is written on it.
	#linkTarget(): void
	{
		const bubble = this.#bubble;
		if (bubble === null)
		{
			return;
		}

		const target = this.#options.target;
		if (this.#bubbleId === null)
		{
			this.#bubbleId = generateBubbleId(target.ownerDocument);
		}

		Dom.attr(bubble, 'role', 'tooltip');
		Dom.attr(bubble, 'id', this.#bubbleId);

		const tokens = describedByTokens(target);
		if (!tokens.includes(this.#bubbleId))
		{
			tokens.push(this.#bubbleId);
		}

		writeDescribedBy(target, tokens);
	}

	// Only the id of this bubble leaves the list: everything else there was written by somebody else.
	#unlinkTarget(target: Element): void
	{
		const id = this.#bubbleId;
		if (id === null)
		{
			return;
		}

		writeDescribedBy(target, describedByTokens(target).filter((token) => token !== id));
	}

	#handlePopoverShow = (): void => {
		if (this.#swapping)
		{
			return;
		}

		this.#linkTarget();
		this.emit('onShow', {});
	};

	// The one place the trigger layer learns that the tooltip has left the screen, whichever hand took it off:
	// the escape key is answered by the primitive, and the reasons the layer kept would otherwise bring the
	// tooltip back the moment one of them was dropped.
	#handlePopoverHide = (): void => {
		if (this.#swapping)
		{
			return;
		}

		this.#unlinkTarget(this.#options.target);
		this.#triggers?.settle(false);
		this.emit('onHide', {});
	};
}
