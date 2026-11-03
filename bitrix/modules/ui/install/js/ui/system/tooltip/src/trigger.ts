import { Event, Type } from 'main.core';

import { TooltipTrigger } from './const';

const LABEL = 'BX.UI.System.Tooltip';

// The bridge across the gap between the element and the bubble. Between them lie the offset (4px of nothing)
// and the protrusion of the pointer (11px), and the pointer is a node of the popover, not ours: a pointerenter
// of the bubble never fires on it. So the cursor travels 15px of no man's land, and with hideDelay 0 the
// tooltip would be gone before it arrived. A hiding caused by the cursor leaving therefore waits at least this
// long, whatever hideDelay holds: a delay given by the place of use may widen the window, never take it away.
export const HOVER_BRIDGE_DELAY: number = 150;

// The click outside is only read, never answered: nothing is cancelled and nothing is stopped, so the click
// goes its way to whatever it landed on. On the way down, because a handler of the page stopping the
// propagation would otherwise leave the tooltip pinned for good.
const OUTSIDE_CLICK_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

// Why the tooltip is on the screen. The tooltip stays while at least one of them holds: the modes combine, so
// no single event may decide to hide. Without that, the default pair [Hover, Focus] would lose the tooltip of
// an element still holding the keyboard focus the moment the cursor left it.
type VisibilityReasons = {
	hovered: boolean;
	hoveredBubble: boolean;
	focused: boolean;
	clickPinned: boolean;
};

type ReasonName = keyof VisibilityReasons;

const NO_REASONS: VisibilityReasons = Object.freeze({
	hovered: false,
	hoveredBubble: false,
	focused: false,
	clickPinned: false,
});

// What the trigger layer asks of the tooltip and nothing besides: the layer decides when it is on the screen,
// never what it looks like.
export type TriggerHost = {
	show: () => void;
	hide: () => void;
	isShown: () => boolean;
};

export type TriggerOptions = {
	target: Element;
	trigger: TooltipTrigger[];
	showDelay: number;
	hideDelay: number;
	// The bubble, where one stands already: built by an earlier show. Given here and not through setBubble()
	// afterwards, because the cursor on it is a reason like any other and has to be among them before the
	// visibility is settled.
	bubble?: HTMLElement | null;
	// The pinning held by the binding this one takes the place of: a reason no state of the DOM answers for.
	clickPinned?: boolean;
	// Whether that binding was the one holding the tooltip on the screen. Nothing in the DOM answers for this
	// either, and it decides what happens to a tooltip that outlives the binding - see start().
	heldByLayer?: boolean;
};

// Manual is the absence of every automatic subscription, so combined with another mode it says nothing the
// place of use could have meant: a mistake of theirs, and not a state to normalise.
export const assertTriggerCombination = (modes: TooltipTrigger[]): void => {
	if (modes.includes(TooltipTrigger.Manual) && modes.length > 1)
	{
		throw new TypeError(
			`${LABEL}: the "${TooltipTrigger.Manual}" trigger cannot be combined with any other - it means the `
			+ 'tooltip is shown and hidden by the place of use alone.',
		);
	}
};

// The gesture a binding is being built from the middle of. A binding built by the handler of a gesture cannot
// always ask the element what that gesture has just done: Firefox applies :hover only after pointerover has
// been dispatched, so an element the cursor has just reached reads false there, and the show would be left to
// a race with the pointerenter that follows. The gesture itself answers the same in every browser.
let raisingGesture: UIEvent | null = null;

// Hands the gesture over for the length of the call, so that every binding built inside reads it. This is the
// whole channel: a surface that raises tooltips from gestures of its own has no other way to say which one it
// is answering, and the options of the tooltip are the contract of the place of use, not a place for this.
export const buildingFrom = (gesture: UIEvent, build: () => void): void => {
	raisingGesture = gesture;

	try
	{
		build();
	}
	finally
	{
		raisingGesture = null;
	}
};

// Whether the binding is being built from the named gesture, and from one that belongs to this element: a
// surface raising tooltips listens above the elements it serves, so the node the gesture reached is what tells
// an element of its own from any other.
const raisedBy = (gesture: string, element: Element): boolean => {
	const raising = raisingGesture;
	if (raising === null || raising.type !== gesture)
	{
		return false;
	}

	const reached = raising.target;

	return Type.isDomNode(reached) && element.contains(reached);
};

// Events of the element turned into show() and hide() of the tooltip. The subscriptions of the element are
// taken when the binding is built and dropped in destroy(); which of them are taken is decided by the set of
// modes. The one outside the element - the click that lets the pinning go - lives by its reason instead.
//
// Built in two steps: the constructor assembles and touches the visibility with nothing, start() settles it.
// See start() for why the two are apart.
export class TriggerBinding
{
	#host: TriggerHost;
	#target: Element;
	#modes: TooltipTrigger[];
	#showDelay: number;
	#hideDelay: number;

	#bubble: HTMLElement | null = null;

	// The node the listener of the click outside sits on while the pinning stands, and null while it does not.
	// Kept and not computed again on the way out: the listener has to leave the very node it was taken on.
	#outsideClickHost: EventTarget | null = null;

	#reasons: VisibilityReasons;

	// Whether the binding this one takes the place of was the one holding the tooltip on the screen. Read by
	// start() and nowhere else.
	#heldByLayer: boolean = false;

	// Two fields and not one: every transition takes both off before it schedules its own.
	#showTimer: ReturnType<typeof setTimeout> | null = null;
	#hideTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(host: TriggerHost, options: TriggerOptions)
	{
		assertTriggerCombination(options.trigger);

		this.#host = host;
		this.#target = options.target;
		this.#modes = options.trigger;
		this.#showDelay = options.showDelay;
		this.#hideDelay = options.hideDelay;

		// The reasons are raised from the DOM as it stands and not from nothing: the binding may well be built
		// by the very handler of the gesture that has to show the tooltip.
		//
		// The cursor is the one the DOM does not always answer for, so the gesture is asked first - the state is
		// only read where there is no gesture to go by, as when the place of use builds a tooltip over an element
		// the cursor already sits on. The focus needs nothing of the kind: it is in place before its own events
		// go out, and would not bear it either - focusin says nothing about the keyboard, and :focus-visible is
		// what tells a keyboard focus from the one a click leaves behind.
		//
		// The pinning is the one reason no state of the DOM answers for, so it arrives from the binding being
		// replaced instead - and only while the click is still among the modes: a place of use that took the mode
		// away took the reason with it.
		this.#reasons = {
			...NO_REASONS,
			hovered: this.#has(TooltipTrigger.Hover)
				&& (raisedBy('pointerover', this.#target) || this.#target.matches(':hover')),
			focused: this.#has(TooltipTrigger.Focus) && this.#target.matches(':focus-visible'),
			clickPinned: this.#has(TooltipTrigger.Click) && options.clickPinned === true,
		};

		this.#bind();
		this.#watchOutsideClick(this.#reasons.clickPinned);

		// Written and not raised through set(): the visibility is settled by start() alone, and a reason that
		// synchronised on its own would settle it from the middle of the constructor.
		this.#reasons.hoveredBubble = this.#bindBubble(options.bubble ?? null);

		this.#heldByLayer = options.heldByLayer === true;
	}

	// The visibility settled for the first time. Kept out of the constructor on purpose, and this is the whole
	// reason the binding is built in two steps: settling shows or hides the tooltip, the tooltip reports that
	// to the place of use, and the place of use may answer with anything at all - destroy() of the instance
	// among the rest, which is what the markup surface does on every hiding. All of that would then reach an
	// owner that has not taken this binding over yet, because the constructor it is waiting on has not
	// returned. The owner calls this once it has, and never before.
	//
	// Who was holding the tooltip decides what happens to it here. A binding is built anew whenever the
	// element or the set of modes changes, and that may well happen over a tooltip already on the screen.
	//
	// Held by the binding this one replaces, it is now this one's to answer for, and the state is brought
	// in line whatever that costs. Where no reason answers the DOM any more, that means taking it off: a
	// tooltip left over from modes that are gone hangs on the screen with no subscription left to hide it -
	// the cursor standing on an element switched from hover to click is the plain case of it.
	//
	// Put there by the place of use, it is none of the layer's business: a layer that has just started has
	// nothing of its own to take it off with, and hiding it here would lose a tooltip on a change of the
	// target or of the modes - which DTO-01 says the tooltip survives.
	start(): void
	{
		if (this.#wanted() || this.#heldByLayer)
		{
			this.#sync();
		}
	}

	// The bubble is built on the first show, so it may arrive later than the subscriptions of the element - and
	// the cursor may be standing on it already, since a binding is built anew over a tooltip the cursor is
	// holding on the screen. The reason is read off the node the same way the constructor reads the element:
	// left down, it would be lowered by the cursor leaving the bubble, and a reason lowered twice hides nothing
	// at all.
	setBubble(bubble: HTMLElement | null): void
	{
		if (bubble === this.#bubble)
		{
			return;
		}

		this.#unbindBubble();
		this.#set('hoveredBubble', this.#bindBubble(bubble));
	}

	// The delays are read at the moment a transition is scheduled, so a new value reaches the next one without
	// taking the reasons apart, as building the binding anew would.
	setDelays(showDelay: number, hideDelay: number): void
	{
		this.#showDelay = showDelay;
		this.#hideDelay = hideDelay;
	}

	// Visibility settled by a hand other than the reason machine: show() or hide() of the place of use, and the
	// escape key, which the positioning primitive answers and reports back as a hiding. Whatever the layer had
	// in flight goes with it - the transition was decided before the call and its timer would undo the call the
	// moment it ran out.
	//
	// The reasons follow the settled state, and only the hidden one asks anything of them. None may be left
	// standing there: one would bring the tooltip back the moment another was dropped, while the cursor is
	// still on the element, and the pinning would go on holding a tooltip that is off the screen. Shown, they
	// are left exactly as they are - every one of them stands for what is on the screen, and dropping them
	// would leave nothing to take it off with: the cursor leaving an element whose reason was cleared lowers
	// nothing at all.
	settle(shown: boolean): void
	{
		this.#clearTimers();

		if (shown)
		{
			return;
		}

		this.#reasons = { ...NO_REASONS };
		this.#watchOutsideClick(false);
	}

	// The pinning, asked for by the binding built to take the place of this one.
	isClickPinned(): boolean
	{
		return this.#reasons.clickPinned;
	}

	// Whether the tooltip on the screen is the doing of this binding, asked for by the same one: what the layer
	// put there the layer takes away, and what the place of use put there it leaves alone.
	isHolding(): boolean
	{
		return this.#wanted();
	}

	destroy(): void
	{
		this.#clearTimers();
		this.#watchOutsideClick(false);
		this.#unbind();
	}

	#has(mode: TooltipTrigger): boolean
	{
		return this.#modes.includes(mode);
	}

	// The subscriptions of the element, built from the modes on every call: taking them and dropping them must
	// never fall out of step, and one list read by both is what keeps them together.
	#subscriptions(): Array<[string, EventListener]>
	{
		const subscriptions: Array<[string, EventListener]> = [];

		if (this.#has(TooltipTrigger.Hover))
		{
			subscriptions.push(
				['pointerenter', this.#handlePointerEnter],
				['pointerleave', this.#handlePointerLeave],
			);
		}

		if (this.#has(TooltipTrigger.Focus))
		{
			subscriptions.push(
				['focusin', this.#handleFocusIn],
				['focusout', this.#handleFocusOut],
			);
		}

		if (this.#has(TooltipTrigger.Click))
		{
			subscriptions.push(['click', this.#handleClick]);
		}

		return subscriptions;
	}

	#bind(): void
	{
		this.#subscriptions().forEach(([eventName, handler]) => Event.bind(this.#target, eventName, handler));
	}

	#unbind(): void
	{
		this.#subscriptions().forEach(([eventName, handler]) => Event.unbind(this.#target, eventName, handler));
		this.#unbindBubble();
	}

	// The listener follows the pinning and not the life of the binding. A binding is built by the first gesture
	// that reaches an element, whatever the mode, and one built in the click mode by a cursor alone shows
	// nothing - so nothing hides it either, and the surface takes an instance down on the hiding alone. A
	// listener taken once and for all would then stay for as long as the page lives, holding the element with it.
	#watchOutsideClick(watch: boolean): void
	{
		const host = this.#outsideClickHost;
		if (watch === (host !== null))
		{
			return;
		}

		if (host === null)
		{
			// Taken from the middle of the very click that raised the pinning, and that click is not caught by it:
			// the way down through the window is long past by the time a handler on the element runs.
			const view = this.#outsideClickTarget();

			Event.bind(view, 'click', this.#handleOutsideClick, OUTSIDE_CLICK_OPTIONS);
			this.#outsideClickHost = view;

			return;
		}

		Event.unbind(host, 'click', this.#handleOutsideClick, OUTSIDE_CLICK_OPTIONS);
		this.#outsideClickHost = null;
	}

	// The window of the element and not the one of the page: an element living in a frame of its own is clicked
	// in that frame. The window and not the document, because the primitive of the family listens for the
	// closing click there and stops it dead - a popover or a menu going down with the same click would take it
	// away before the document ever saw it, and the pinned tooltip would stay on the screen. A tree with no
	// window of its own is left with its document.
	#outsideClickTarget(): EventTarget
	{
		const owner = this.#target.ownerDocument;

		return owner.defaultView ?? owner;
	}

	// Takes the node and answers whether the cursor is standing on it. The node itself is kept whatever the
	// modes are - a click that landed on it is no click outside, and that question is asked in every mode the
	// click pins in.
	//
	// The subscriptions of the cursor are another matter: they are taken only where the cursor is a reason at
	// all. Everywhere else a pointer that came and went over the bubble would lower a reason nobody had
	// raised, and the manual mode is where that costs the most - the tooltip is shown and hidden by the place
	// of use alone, and the cursor would take away what it never put there.
	#bindBubble(bubble: HTMLElement | null): boolean
	{
		if (bubble === null)
		{
			return false;
		}

		this.#bubble = bubble;

		if (!this.#has(TooltipTrigger.Hover))
		{
			return false;
		}

		Event.bind(bubble, 'pointerenter', this.#handleBubblePointerEnter);
		Event.bind(bubble, 'pointerleave', this.#handleBubblePointerLeave);

		return bubble.matches(':hover');
	}

	// Unbound whatever the modes are: the subscriptions of the cursor are taken only in the hover mode, and
	// dropping a handler that was never bound costs nothing.
	#unbindBubble(): void
	{
		const bubble = this.#bubble;
		if (bubble === null)
		{
			return;
		}

		Event.unbind(bubble, 'pointerenter', this.#handleBubblePointerEnter);
		Event.unbind(bubble, 'pointerleave', this.#handleBubblePointerLeave);
		this.#bubble = null;
	}

	#set(reason: ReasonName, value: boolean): void
	{
		if (this.#reasons[reason] === value)
		{
			return;
		}

		this.#reasons[reason] = value;

		if (reason === 'clickPinned')
		{
			this.#watchOutsideClick(value);
		}

		this.#sync(reason === 'hovered' || reason === 'hoveredBubble');
	}

	#wanted(): boolean
	{
		const { hovered, hoveredBubble, focused, clickPinned } = this.#reasons;

		return hovered || hoveredBubble || focused || clickPinned;
	}

	#sync(fromHover: boolean = false): void
	{
		this.#clearTimers();

		const wanted = this.#wanted();
		if (wanted === this.#host.isShown())
		{
			return;
		}

		const delay = wanted
			? this.#showDelay
			: (fromHover ? Math.max(this.#hideDelay, HOVER_BRIDGE_DELAY) : this.#hideDelay);

		// An arrow and not a method reference: show handed to setTimeout as it is loses its this and falls on
		// the first private field it touches.
		const apply: () => void = wanted ? () => this.#host.show() : () => this.#host.hide();

		if (delay === 0)
		{
			apply();

			return;
		}

		const timer = setTimeout(apply, delay);
		if (wanted)
		{
			this.#showTimer = timer;
		}
		else
		{
			this.#hideTimer = timer;
		}
	}

	#clearTimers(): void
	{
		if (this.#showTimer !== null)
		{
			clearTimeout(this.#showTimer);
			this.#showTimer = null;
		}

		if (this.#hideTimer !== null)
		{
			clearTimeout(this.#hideTimer);
			this.#hideTimer = null;
		}
	}

	#handlePointerEnter = (): void => {
		this.#set('hovered', true);
	};

	#handlePointerLeave = (): void => {
		this.#set('hovered', false);
	};

	#handleBubblePointerEnter = (): void => {
		this.#set('hoveredBubble', true);
	};

	#handleBubblePointerLeave = (): void => {
		this.#set('hoveredBubble', false);
	};

	// Only a keyboard focus raises the reason: a click on a button leaves it focused as well, and the tooltip
	// would hang there until the focus moved on.
	#handleFocusIn = (): void => {
		if (this.#target.matches(':focus-visible'))
		{
			this.#set('focused', true);
		}
	};

	#handleFocusOut = (): void => {
		this.#set('focused', false);
	};

	// Pinning by a click stands equal to the other reasons and above none of them: a pinned tooltip does not go
	// with the cursor, and does not outlive the escape key either.
	#handleClick = (): void => {
		this.#set('clickPinned', !this.#reasons.clickPinned);
	};

	// A click that reached neither the element nor the bubble takes the pinning away, and that is all it does.
	// The positioning primitive can close on a click outside by itself, but its rule - the first click closes,
	// the second acts - is written for a layer with an opening element of its own. Here the element is both:
	// it opens the tooltip and lies outside the layer, so that rule would swallow the very click that closes,
	// leaving the button it was aimed at unpressed.
	#handleOutsideClick = (event: MouseEvent): void => {
		const clicked = event.target;
		if (!Type.isDomNode(clicked))
		{
			return;
		}

		if (this.#target.contains(clicked) || this.#bubble?.contains(clicked) === true)
		{
			return;
		}

		this.#set('clickPinned', false);
	};
}
