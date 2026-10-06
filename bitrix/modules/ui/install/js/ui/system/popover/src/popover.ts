import { Type, Tag, Dom, Event, ZIndexManager } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { autoUpdate, computePosition, platform } from 'ui.floating-ui';

import { POINTER_PROTRUSION, PopoverDesignContext, type PopoverPosition } from './const';
import {
	type PopoverClassName,
	type PopoverContent,
	type PopoverOptions,
	type PopoverPositioning,
	type PopoverRect,
	type PopoverState,
	type PopoverStateChangePayload,
	type PopoverTarget,
} from './types';
import {
	arrowGeometryFromRadii,
	buildConfigFromPlan,
	buildPositioningPlan,
	buildTrackingOptions,
	computeAreaCss,
	crossAxisOf,
	getSide,
	isPointTarget,
	isRectTarget,
	isUnwatchedRectTarget,
	normalizePositioning,
	parseArrowRadii,
	referenceHasContext,
	resolvePointer,
	selectOnAxisFlip,
	toReference,
	warnOnce,
	windowOffsetParentOrigin,
} from './positioning/map-options';
import {
	type AreaTranslation,
	type ArrowRadii,
	type ComputePositionReturn,
	type Direction,
	type MappingHooks,
	type NormalizedPositioning,
	type PositioningPlan,
	type Reference,
	type SizeApplyArgs,
	type WarnOnce,
} from './positioning/types';
import { hasVisibleLayerAbove, isClosingClick, isInBodyLayerTree, isVisible, layerChain } from './lib/top-layer';

import './popover.css';

const EVENT_NAMESPACE = 'BX.UI.System.Popover';

// The arrow sits on the side opposite to the final placement, so it survives a flip.
const STATIC_SIDE: Record<string, string> = {
	top: 'bottom',
	right: 'left',
	bottom: 'top',
	left: 'right',
};

// The events a pointer gesture opens and closes with, and the click of the browser follows them. A popover
// shown from a handler of one of these is shown by that very gesture: the press is already past the capture
// phase the close handlers subscribe to, so the gesture cannot be recognised from its own events any more and
// the moment of the show() is the only place left to see it. A click handler is not on the list - the gesture
// it belongs to ends with that very click, and the next one is a gesture of its own.
const GESTURE_EVENTS = new Set(['mousedown', 'pointerdown', 'touchstart', 'mouseup', 'pointerup', 'touchend']);

const AREA_INLINE_PROPS = ['left', 'top', 'right', 'bottom', 'transform', 'width', 'minWidth', 'height', 'maxWidth', 'maxHeight'];
const SIZE_INLINE_PROPS = ['width', 'minWidth', 'height', 'maxWidth', 'maxHeight'];

// Marks the node of the consumer as the bubble of this popover: the address popover.css writes the layout
// defaults to. An attribute and not a class - the node stays free of classes of the extension.
const BUBBLE_ATTRIBUTE = 'data-ui-system-popover-bubble';

// What the content has to resolve to, whatever form it is given in. Repeated by every message about a
// content of the wrong shape, so all of them name the same requirement.
const CONTENT_SHAPE = 'the "content" option must resolve to exactly one element - that element becomes the '
	+ 'bubble of the popover and belongs to the consumer entirely';

// Root nodes of a markup string, the whitespace between them left aside. Parsed inside a <template>, whose
// content is an inert fragment: that keeps the examination itself from touching the page, and that is all it
// keeps. The markup is not looked through and nothing is taken out of it; the node becomes the bubble and
// reaches the live document on show(), so a string of the consumer is as safe as the consumer escaped it.
const parseMarkupRoots = (markup: string): Node[] => {
	const template: HTMLTemplateElement = document.createElement('template');
	template.innerHTML = markup;

	return [...template.content.childNodes].filter((node) => {
		return !Type.isTextNode(node) || (node.textContent ?? '').trim() !== '';
	});
};

// Watches the size of one element and nothing else. It stands in for the elementResize part of autoUpdate,
// which observes the floating element as well: that one is already watched by the subscription of the cycle,
// and a second observer of it turns every size the cycle writes into a second full recomputation. Where
// ResizeObserver is missing there is nothing to watch with, and autoUpdate leaves elementResize off for the
// very same reason.
const observeResize = (element: Element, callback: () => void): (() => void) | null => {
	if (!Type.isFunction(window.ResizeObserver))
	{
		return null;
	}

	const observer = new ResizeObserver(() => callback());
	observer.observe(element);

	return (): void => observer.disconnect();
};

// What is enough to tell that the target has moved: its viewport position and size.
type TargetRect = { left: number; top: number; width: number; height: number };

const sameRect = (a: TargetRect, b: TargetRect): boolean => {
	return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
};

const isTransparentColor = (color: string): boolean => {
	if (color === '' || color === 'transparent')
	{
		return true;
	}

	// Only the rgba() form can be see-through: a computed background-color serialises as rgb() while it is
	// fully opaque and grows a fourth component, the alpha, otherwise. Both separator styles land the same.
	const components = color.startsWith('rgb') ? color.match(/[\d.]+/g) : null;

	return components !== null && components.length === 4 && Number.parseFloat(components[3]) === 0;
};

// What one tick of the anchor cycle reads off the bubble. Both answers come from one and the same computed
// style, and one tick needs them more than once: the middleware chain asks for the arrow geometry, the vendor
// runs that chain again whenever the size plan changes the dimensions, and the arrow asks once more on the way
// out. Every ask beyond the first would be a forced style recalculation for an answer already known. Nothing
// is read upfront - the first ask keeps the moment of the read the one it has always been - and nothing
// outlives the tick, so a theme or a font switch is picked up by the next one exactly as it was before.
type BubbleReader = {
	style: () => CSSStyleDeclaration;
	radii: () => ArrowRadii;
};

const bubbleReader = (body: HTMLElement): BubbleReader => {
	let style: CSSStyleDeclaration | null = null;
	let radii: ArrowRadii | null = null;

	const readStyle = (): CSSStyleDeclaration => {
		if (style === null)
		{
			style = getComputedStyle(body);
		}

		return style;
	};

	return {
		style: readStyle,
		radii: (): ArrowRadii => {
			if (radii === null)
			{
				radii = parseArrowRadii(readStyle());
			}

			return radii;
		},
	};
};

// The language an element speaks: the nearest ancestor-or-self carrying lang is the whole answer, and null
// means nothing in the chain declares one. An empty value is a declaration of its own - lang="" says the
// language is unknown, which is not the same as the absence of the attribute.
const declaredLanguage = (element: Element): string | null => {
	const owner = element.closest('[lang]');

	return owner === null ? null : (owner.getAttribute('lang') ?? '');
};

// Language tags are case-insensitive; an undeclared language matches nothing but another undeclared one.
const sameLanguage = (one: string | null, other: string | null): boolean => {
	if (one === null || other === null)
	{
		return one === other;
	}

	return one.toLowerCase() === other.toLowerCase();
};

// State of a popover that has computed nothing: what a hidden one holds, and what a shown one holds until
// its first cycle is through - only the shown flag tells those two apart.
const buildState = (shown: boolean): PopoverState => ({
	shown,
	positioned: false,
	position: null,
	alignment: 'center',
	flipped: false,
	slide: { x: 0, y: 0 },
	anchorHidden: false,
	pointerHidden: false,
	constrained: null,
	rect: null,
});

// The nested values are copied along with the object itself: a shallow copy would still hand the internal
// slide, constrained and rect out for editing.
const cloneState = (state: PopoverState): PopoverState => ({
	...state,
	slide: { ...state.slide },
	constrained: state.constrained === null ? null : { ...state.constrained },
	rect: state.rect === null ? null : { ...state.rect },
});

// Declaration order of PopoverState: it is the order the changed list comes out in.
const STATE_KEYS: Array<keyof PopoverState> = [
	'shown',
	'positioned',
	'position',
	'alignment',
	'flipped',
	'slide',
	'anchorHidden',
	'pointerHidden',
	'constrained',
	'rect',
];

const RECT_KEYS: Array<keyof PopoverRect> = ['top', 'right', 'bottom', 'left', 'width', 'height'];

const sameStateField = (key: keyof PopoverState, a: PopoverState, b: PopoverState): boolean => {
	switch (key)
	{
		case 'slide':
			return a.slide.x === b.slide.x && a.slide.y === b.slide.y;
		case 'constrained':
			return a.constrained === null || b.constrained === null
				? a.constrained === b.constrained
				: a.constrained.maxWidth === b.constrained.maxWidth && a.constrained.maxHeight === b.constrained.maxHeight;
		case 'rect':
			return a.rect === null || b.rect === null
				? a.rect === b.rect
				: RECT_KEYS.every((field) => (a.rect as PopoverRect)[field] === (b.rect as PopoverRect)[field]);
		default:
			return a[key] === b[key];
	}
};

const changedStateFields = (previous: PopoverState, next: PopoverState): Array<keyof PopoverState> => {
	return STATE_KEYS.filter((key) => !sameStateField(key, previous, next));
};

// Field by field: the geometry of a DOMRect lives on the prototype, and a spread would copy none of it.
const toPopoverRect = (source: DOMRect): PopoverRect => ({
	top: source.top,
	right: source.right,
	bottom: source.bottom,
	left: source.left,
	width: source.width,
	height: source.height,
});

// Standalone positioned container built on ui.floating-ui, without main.popup. The owner must call
// destroy(): removing the mount container does not tear the popover down.
export class Popover extends EventEmitter
{
	#content: PopoverContent;
	#target: PopoverTarget;
	#positioning: PopoverPositioning;
	#className: string | string[];
	#designContext: PopoverDesignContext | null;
	#mountContainer: HTMLElement | null;
	#closeByClickOutside: boolean;
	#closeByEsc: boolean;

	#element: HTMLElement | null = null;
	#pointer: HTMLElement | null = null;
	#body: HTMLElement | null = null;

	// Class names the option has actually put on the root, and only they: the root also carries the base
	// class, the lifecycle flags, the design context and whatever else the page has written there, and none
	// of those may leave with a change of the option.
	#appliedClassNames: string[] = [];

	#shown: boolean = false;
	#destroyed: boolean = false;
	#registered: boolean = false;
	#state: PopoverState = buildState(false);

	// Whether the last cycle that finished did so by failing. A failure changes no field of the state when it
	// comes first - the start of the cycle has already put the very same "shown, nothing computed" state in
	// place - and without this mark the consumer would hear of it from the console alone. Kept out of
	// PopoverState on purpose: the shape read by the consumer stays as it is, and the failure is told by the
	// event that carries it, not by a field of its own.
	#cycleFailed: boolean = false;

	// Whether the current click gesture started inside the popover. A boolean and not the node,
	// because the node may leave the DOM before the click arrives.
	#gestureStartedInside: boolean = false;

	// Whether the gesture the popover was shown from is still on its way to its click. A press of the pointer
	// runs through the capture phase of the document before any handler of the consumer sees it, so a popover
	// opened from a mousedown subscribes to a gesture already past it: the click that ends that gesture is
	// invisible as a gesture of its own and would read as a click of the user outside the popover.
	#openedByGesture: boolean = false;
	#outsideTreeWarned: boolean = false;

	// Target rect of the previous cycle and whether the running one was asked for by the consumer: together
	// they tell a target that moves on its own from one the consumer moves and reports.
	#targetRect: TargetRect | null = null;
	#consumerUpdate: boolean = false;
	#movingTargetWarned: boolean = false;
	#transparentBubbleWarned: boolean = false;

	// The same "once per instance" marks as the flags above, in the form the mapping layer can set. Both
	// warnings are given from inside a mapper call, and the mapper keeps nothing between ticks: without a
	// mark of the caller they would repeat on every scroll and resize frame.
	#ignoredAreaOptionsWarned: WarnOnce = warnOnce();
	#arrowRadiusWarned: WarnOnce = warnOnce();

	#direction: Direction = 'ltr';

	// Two-level guard for async recomputation: the show generation and a monotonic update id. Only the
	// current pair may touch the DOM, so a stale computation resolving after a newer run is dropped.
	#generation: number = 0;
	#runId: number = 0;

	#cleanups: Array<() => void> = [];

	// The recompute step of the running cycle. Kept aside so adjustPosition() can run it as is, without
	// re-creating the subscriptions; dropped together with them in #stopPositioning().
	#update: (() => void) | null = null;

	// The options of the running cycle, normalised once, and the part of the vendor configuration they alone
	// decide. Between the ticks of a cycle only the measurements move: the options are answered for by the two
	// setters that touch them, and both of those relaunch. So the work is done where the cycle starts and the
	// ticks read what is ready; #stopPositioning() drops it along with the subscriptions, and nothing but a
	// relaunch puts it back.
	#normalized: NormalizedPositioning | null = null;
	#plan: PositioningPlan | null = null;

	constructor(options: PopoverOptions)
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		if (!Type.isPlainObject(options) || !this.#isValidContent(options.content))
		{
			throw new TypeError(`${EVENT_NAMESPACE}: the "content" option is required (string, HTMLElement or factory).`);
		}

		this.#content = options.content;
		this.#target = this.#isValidTarget(options.target) ? options.target : null;
		this.#positioning = Type.isPlainObject(options.positioning) ? { ...options.positioning } : {};
		this.#className = this.#normalizeClassName(options.className);
		this.#designContext = this.#normalizeDesignContext(options.designContext);
		this.#mountContainer = Type.isElementNode(options.container) ? options.container : null;
		this.#closeByClickOutside = options.closeByClickOutside !== false;
		this.#closeByEsc = options.closeByEsc !== false;

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

		if (this.#shown)
		{
			return;
		}

		const element = this.#ensureElement();
		Dom.append(element, this.#mountContainer ?? document.body);

		if (!this.#registered)
		{
			ZIndexManager.register(element);
			this.#registered = true;
		}

		ZIndexManager.bringToFront(element);
		Dom.removeClass(element, '--hidden');

		this.#bindCloseHandlers();
		// Window.event is the event being dispatched at this very moment, and there is nothing else to ask: a
		// handler of the consumer runs deep inside the dispatch of the press, long past the capture phase the
		// handlers above have just subscribed to. Read here and not in #bindCloseHandlers(), so that a change
		// of closeByEsc or closeByClickOutside in the same handler does not take the answer away.
		this.#openedByGesture = GESTURE_EVENTS.has(window.event?.type ?? '');
		this.#warnIfOutsideLayerTree(element);

		this.#shown = true;
		this.#relaunch();

		this.emit('onShow', {});
	}

	#warnIfOutsideLayerTree(element: HTMLElement): void
	{
		if (this.#outsideTreeWarned || (!this.#closeByClickOutside && !this.#closeByEsc))
		{
			return;
		}

		if (!isInBodyLayerTree(element))
		{
			this.#outsideTreeWarned = true;
			console.warn(
				`${EVENT_NAMESPACE}: mounted outside the body layer tree - cross-layer arbitration for `
				+ 'closeByClickOutside/closeByEsc degrades to conservative (any visible body-stack layer blocks closing).',
			);
		}
	}

	hide(): void
	{
		if (this.#destroyed || !this.#shown)
		{
			return;
		}

		this.#applyHiddenState();
		this.emit('onHide', {});
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		if (this.#shown)
		{
			this.#applyHiddenState();
			this.emit('onHide', {});
		}

		if (this.#element)
		{
			if (this.#registered)
			{
				ZIndexManager.unregister(this.#element);
				this.#registered = false;
			}

			Dom.remove(this.#element);
		}

		this.#element = null;
		this.#pointer = null;
		this.#body = null;
		this.#destroyed = true;
		this.#generation += 1;

		this.emit('onDestroy', {});
		this.unsubscribeAll();
	}

	isShown(): boolean
	{
		return this.#shown;
	}

	setTarget(target: PopoverTarget): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setTarget() called on a destroyed instance.`);

			return;
		}

		this.#target = this.#isValidTarget(target) ? target : null;
		this.#relaunch();
	}

	// Merges the options given into the ones in force rather than replacing them: a key left out of the argument
	// keeps the value it had, so no option is ever taken away by omission - hand over the value you want, the
	// default among them, instead of leaving the key out. That is where the two levels of the contract part
	// company: an option of the popover taken out of the options object reaches its own setter as undefined and
	// is applied as such, while a key taken out of positioning never reaches the class at all.
	//
	// The cycle is relaunched and not ticked, unlike the recompute in place of the two class setters: the
	// subscriptions are dropped and taken anew, the applied state is reset, and the next one costs a frame in
	// visibility: hidden before it lands.
	setPositioning(positioning: PopoverPositioning): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setPositioning() called on a destroyed instance.`);

			return;
		}

		if (Type.isPlainObject(positioning))
		{
			Object.assign(this.#positioning, positioning);
		}

		this.#relaunch();
	}

	// Replaces the consumer classes on the root and recomputes the position in place. The classes are an
	// address for the CSS of the page, and that CSS reaches the bubble: the arrow offset is built from the
	// radius of the bubble read on every cycle, so a class of the option can move the arrow. The recompute
	// is the one of adjustPosition() - the running cycle ticks once more, keeping its subscriptions and its
	// applied state, so the popover stays on the screen and there is never the blink of a relaunch. An empty
	// value in any of the three forms is the way back to a root carrying no class of the option.
	setClassName(className: PopoverClassName): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setClassName() called on a destroyed instance.`);

			return;
		}

		this.#className = this.#normalizeClassName(className);

		// No root built yet: the value waits for the first show(), where the element appears.
		if (this.#element === null)
		{
			return;
		}

		Dom.removeClass(this.#element, this.#appliedClassNames);
		this.#applyClassName(this.#element);

		// The classes are on the root by now, so the tick reads the bubble as the new CSS has left it. On a
		// hidden popover there is no cycle to tick and nothing to read: the next show() computes anew.
		this.adjustPosition();
	}

	// Replaces the design context class on the root and recomputes the position in place, for the reason
	// setClassName() does it: the context class is another address for the CSS that styles the bubble, and
	// the radius of the bubble is part of the arrow geometry. The previous class is known from the field, so
	// nothing but it is taken off; null is the way back to a popover with no context, the state the option
	// left out of the constructor gives, and an invalid value lands there as well, exactly as the same value
	// given to the constructor would.
	setDesignContext(designContext: PopoverDesignContext | null): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setDesignContext() called on a destroyed instance.`);

			return;
		}

		const previous = this.#designContext;
		this.#designContext = this.#normalizeDesignContext(designContext);

		if (this.#element === null || this.#designContext === previous)
		{
			return;
		}

		if (previous !== null)
		{
			Dom.removeClass(this.#element, `--ui-context-${previous}`);
		}

		if (this.#designContext !== null)
		{
			Dom.addClass(this.#element, `--ui-context-${this.#designContext}`);
		}

		this.adjustPosition();
	}

	setCloseByClickOutside(value: boolean): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setCloseByClickOutside() called on a destroyed instance.`);

			return;
		}

		this.#closeByClickOutside = value !== false;
		this.#rebindCloseHandlers();
	}

	setCloseByEsc(value: boolean): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: setCloseByEsc() called on a destroyed instance.`);

			return;
		}

		this.#closeByEsc = value !== false;
		this.#rebindCloseHandlers();
	}

	// The close handlers live between show() and hide(), so a shown popover is resubscribed at once and a
	// hidden one keeps the value for its next show(). Only the set of bound handlers changes here - what
	// they do once bound stays as it is.
	#rebindCloseHandlers(): void
	{
		if (!this.#shown)
		{
			return;
		}

		this.#unbindCloseHandlers();
		this.#bindCloseHandlers();
	}

	// Recomputes the position by the current target and options, and nothing else: the subscriptions, the
	// applied state and its data attributes survive, so the popover stays visible during the recomputation.
	// The way out for a target autoUpdate cannot watch - a virtual anchor without contextElement or a point
	// that follows the cursor: only the consumer knows when such a target has moved.
	adjustPosition(): void
	{
		if (this.#destroyed)
		{
			console.warn(`${EVENT_NAMESPACE}: adjustPosition() called on a destroyed instance.`);

			return;
		}

		// A hidden popover has no running cycle and nothing to position: the next show() computes anew.
		if (!this.#shown)
		{
			return;
		}

		// The flag lives for the synchronous part of the run, which is where the target rect is read.
		this.#consumerUpdate = true;
		try
		{
			this.#update?.();
		}
		finally
		{
			this.#consumerUpdate = false;
		}
	}

	// A copy and not the internal object: the state is read from outside, never written from there. A read is
	// not a command, so a destroyed instance answers with the state of a hidden popover and warns about nothing.
	getState(): PopoverState
	{
		return cloneState(this.#state);
	}

	#relaunch(): void
	{
		this.#stopPositioning();
		this.#generation += 1;

		if (!this.#shown || !this.#element)
		{
			return;
		}

		const element = this.#element;
		// A relaunch means the applied state is gone: the first cycle of the new one reports it back, so the
		// reset itself raises no event of its own. The failure of the cycle left behind goes with it: the
		// cycle starting here is an attempt of its own, and its own failure is worth an event of its own.
		this.#state = buildState(true);
		this.#cycleFailed = false;
		// The rect of the previous cycle says nothing about the new one: the target itself may be another.
		this.#targetRect = null;
		this.#clearAppliedState(element);
		// The size plan goes with the cycle that wrote it. The middleware behind it is added only for some
		// option sets, so a new cycle without that middleware would inherit the numbers of the previous one and
		// never overwrite them: a relaunch is the one place that can clear them for good.
		this.#resetInline(element, SIZE_INLINE_PROPS);
		Dom.addClass(element, '--measuring');

		this.#applyLocaleAttributes(element);

		if (this.#target === null)
		{
			this.#startAreaCycle(element);
		}
		else
		{
			this.#startAnchorCycle(element, this.#target);
		}
	}

	#stopPositioning(): void
	{
		this.#cleanups.forEach((cleanup) => cleanup());
		this.#cleanups = [];
		this.#update = null;
		this.#normalized = null;
		this.#plan = null;
	}

	// Both attributes are written for one and the same reason: the root leaves the place of the anchor for
	// document.body, and the inheritance of the locale breaks with the move. The direction has a second reason
	// of its own, since floating-ui reads rtl off the floating element itself (platform.isRTL(floating)) and
	// not off the anchor. Recomputed on every relaunch: setTarget() may hand over an anchor from another area.
	#applyLocaleAttributes(element: HTMLElement): void
	{
		const source = this.#directionSource();

		this.#direction = getComputedStyle(source).direction === 'rtl' ? 'rtl' : 'ltr';
		Dom.attr(element, 'dir', this.#direction);

		this.#applyLanguage(element, source);
	}

	// A language has no computed value to read, unlike a direction: the nearest ancestor carrying the
	// attribute is the whole answer. Written only while it differs from the language the root inherits where
	// it is mounted, because a language equal to the inherited one changes nothing for a speech synthesiser.
	// The comparison goes against the mount container and not against the document: a container of its own
	// may speak a language of its own, and then a root left bare would take that language over. Dropped
	// rather than left stale, because the anchor of the next cycle may live in another area.
	#applyLanguage(element: HTMLElement, source: Element): void
	{
		const language = declaredLanguage(source);
		const inherited = declaredLanguage(this.#mountContainer ?? document.body);

		if (sameLanguage(language, inherited))
		{
			element.removeAttribute('lang');

			return;
		}

		// The fallback is for an area that declares no language of its own while one is inherited at the place
		// of the mount: lang="" is the only way to say the language is unknown, and a bare root would speak the
		// language of the container instead.
		Dom.attr(element, 'lang', language ?? '');
	}

	#directionSource(): Element
	{
		if (Type.isElementNode(this.#target))
		{
			return this.#target;
		}

		if (isRectTarget(this.#target) && Type.isElementNode(this.#target.contextElement))
		{
			return this.#target.contextElement;
		}

		return this.#mountContainer ?? document.body;
	}

	// A subscription added next to the one a cycle already has. Every autoUpdate watches the popover along
	// with its own element, and one watcher of it is enough for the whole cycle: a second one would turn every
	// size the cycle itself writes into two full runs in one frame, of which only the last is kept. So the
	// element resize part is off here and an observer of the element alone takes its place - without it the
	// reason to subscribe, the size of that very element, would go unnoticed.
	#watchAlongside(reference: Element, element: HTMLElement, update: () => void): void
	{
		this.#cleanups.push(autoUpdate(reference, element, update, { elementResize: false }));

		const stopResize = observeResize(reference, update);
		if (stopResize !== null)
		{
			this.#cleanups.push(stopResize);
		}
	}

	#startAnchorCycle(element: HTMLElement, target: Exclude<PopoverTarget, null>): void
	{
		const reference = toReference(target);
		const generation = this.#generation;
		const update = (): void => {
			void this.#anchorUpdate(element, reference, generation);
		};

		this.#update = update;

		const normalized = normalizePositioning(this.#positioning, 'anchor');
		this.#normalized = normalized;
		// Built before the first tick: autoUpdate runs the update once as it subscribes.
		this.#plan = buildPositioningPlan(normalized, this.#direction, referenceHasContext(this.#target));

		this.#cleanups.push(autoUpdate(reference, element, update, buildTrackingOptions(normalized)));

		// autoUpdate watches the anchor and the popover only, so a boundary element needs its own
		// subscription - otherwise flip/shift/size go stale when it moves or resizes. The tracking mode is
		// not passed on: a boundary is always an Element, and the observers already reach it.
		if (Type.isElementNode(normalized.boundary))
		{
			this.#watchAlongside(normalized.boundary, element, update);
		}
	}

	async #anchorUpdate(element: HTMLElement, reference: Reference, generation: number): Promise<void>
	{
		const runId = ++this.#runId;
		const isCurrent = (): boolean => this.#generation === generation && this.#runId === runId;

		const normalized = this.#normalized;
		const plan = this.#plan;
		// Both are put in place by the start of the cycle and taken away by its end, so a tick without them is
		// a tick of a cycle that is already over.
		if (normalized === null || plan === null)
		{
			return;
		}

		const body = this.#body as HTMLElement;
		const bubble = bubbleReader(body);

		this.#warnIfTargetDrifted(normalized, reference);

		// The size plan is applied from inside computePosition, so the limits it wrote are picked up here, on
		// the way out of the run they belong to, and not from a field shared with the other runs.
		let constrained: PopoverState['constrained'] = null;

		const hooks: MappingHooks = {
			direction: this.#direction,
			referenceHasContext: referenceHasContext(this.#target),
			resolveGeometry: (floating, axis) => {
				return arrowGeometryFromRadii(
					bubble.radii(),
					floating.width,
					floating.height,
					axis,
					this.#arrowRadiusWarned,
				);
			},
			applySize: (args: SizeApplyArgs) => {
				if (isCurrent())
				{
					constrained = this.#applySizePlan(element, normalized, args);
				}
			},
		};

		try
		{
			const result = await computePosition(reference, element, buildConfigFromPlan(plan, hooks));
			if (!isCurrent())
			{
				return;
			}

			this.#applyAnchorResult(element, normalized, result, reference, constrained, bubble);
		}
		catch (error)
		{
			console.error(`${EVENT_NAMESPACE}: positioning failed.`, error);

			// A cycle that threw is over all the same, and its end is committed like any other. Committed under
			// the same guard as a result, so a failure of a run already superseded touches nothing, and
			// committed as a failure, so the consumer is told even when the fields of the state stay where they
			// were. What the popover looks like afterwards depends on what it had before: a failure after a
			// position has been applied leaves it exactly where that position put it, a failure before the
			// first one leaves it out of sight - the coordinates were never written, and the corner of the page
			// is no place to show it from. The subscriptions of the cycle stay either way, so the tick that
			// stops failing brings it back.
			if (isCurrent())
			{
				this.#commitState(element, buildState(this.#shown), true);
			}
		}
	}

	// A virtual target with no contextElement is watched by nobody, and that is fine while the consumer
	// drives it: a cursor point moves only on the consumer's own command. It is not fine when the target
	// turns out to have moved by itself - this run was started by a scroll or a resize of the surroundings,
	// and the popover has learnt of the move by pure luck. Warned once per instance.
	#warnIfTargetDrifted(normalized: NormalizedPositioning, reference: Reference): void
	{
		if (
			this.#movingTargetWarned
			|| normalized.tracking === 'animation-frame'
			|| !isUnwatchedRectTarget(this.#target)
		)
		{
			return;
		}

		const previous = this.#targetRect;
		// Read field by field: a DOMRect keeps its geometry on the prototype, and a spread would copy none.
		const source = reference.getBoundingClientRect();
		const rect: TargetRect = { left: source.left, top: source.top, width: source.width, height: source.height };
		this.#targetRect = rect;

		if (this.#consumerUpdate || previous === null || sameRect(previous, rect))
		{
			return;
		}

		this.#movingTargetWarned = true;
		console.warn(
			`${EVENT_NAMESPACE}: the virtual target has moved on its own and nothing is watching it - this `
			+ 'position was recomputed by chance. Give the target a contextElement, or call adjustPosition() '
			+ "when the target moves, or set positioning.tracking to 'animation-frame'.",
		);
	}

	#applyAnchorResult(
		element: HTMLElement,
		normalized: NormalizedPositioning,
		result: ComputePositionReturn,
		reference: Reference,
		constrained: PopoverState['constrained'],
		bubble: BubbleReader,
	): void
	{
		// Snap to the pixel grid as floating-ui recommends: fractional coordinates blur the content. The ratio
		// belongs to the window the popover is rendered in, and an iframe has a window of its own.
		const dpr = this.#defaultView()?.devicePixelRatio || 1;
		const snap = (value: number): string => `${Math.round(value * dpr) / dpr}px`;

		this.#resetInline(element, ['right', 'bottom', 'transform']);
		this.#css(element, 'position', result.strategy);
		this.#css(element, 'left', snap(result.x));
		this.#css(element, 'top', snap(result.y));

		// One read of the popover rect per cycle, taken once the coordinates are written: the arrow needs the
		// very same rect, and a second read would only cost another layout.
		const rect = element.getBoundingClientRect();

		const finalSide = getSide(result.placement);
		const anchorHidden = result.middlewareData.hide?.referenceHidden === true;
		const shift = result.middlewareData.shift;
		const pointerHidden = this.#applyPointer(element, normalized, result, reference, finalSide, rect, bubble);
		const state: PopoverState = {
			shown: this.#shown,
			positioned: true,
			position: finalSide,
			alignment: this.#alignmentOf(result.placement),
			flipped: finalSide !== normalized.position,
			// Without the shift middleware the vendor reports nothing, and nothing is exactly a zero shift.
			slide: { x: shift?.x ?? 0, y: shift?.y ?? 0 },
			anchorHidden,
			pointerHidden,
			constrained,
			rect: toPopoverRect(rect),
		};

		if (anchorHidden && normalized.whenAnchorHidden === 'close')
		{
			this.#commitState(element, state);
			this.hide();

			return;
		}

		// The close mode has left the method above, so the only mode left here follows the anchor both ways:
		// the same toggle that hid the popover brings it back once the anchor is in sight again.
		Dom.toggleClass(element, '--anchor-hidden', anchorHidden);
		this.#commitState(element, state);
	}

	// Returns whether the arrow ends up off the screen - by the option or by a side too short for the figure.
	#applyPointer(
		element: HTMLElement,
		normalized: NormalizedPositioning,
		result: ComputePositionReturn,
		reference: Reference,
		finalSide: PopoverPosition,
		rect: DOMRect,
		bubble: BubbleReader,
	): boolean
	{
		if (normalized.pointer === null)
		{
			Dom.removeClass(element, '--with-pointer');

			return true;
		}

		const pointer = this.#pointer as HTMLElement;
		const body = this.#body as HTMLElement;

		// Measurements first, writes after, and the two never take turns. Every read that follows a write of
		// the same cycle makes the browser bring the layout up to date before it can answer, so the reads are
		// all taken here, while the layout is still the one the rect above was read from. Nothing is lost by
		// waiting with the classes: the arrow is an absolutely positioned box, so building it or taking it off
		// the screen moves neither the bubble nor the root, and the arithmetic below asks about nothing else.

		// One read of the bubble style per tick: both the corner radii and the fill of the arrow come from it,
		// and the middleware chain of this very tick may have asked for the radii already.
		const bodyStyle = bubble.style();
		// The axis follows the applied side: with the flip-axis tactic it may differ from the requested one.
		const axis = crossAxisOf(finalSide);
		const aim = selectOnAxisFlip(normalized.pointer, normalized.position, finalSide);

		const geometry = arrowGeometryFromRadii(
			bubble.radii(),
			body.offsetWidth,
			body.offsetHeight,
			axis,
			this.#arrowRadiusWarned,
		);
		if (geometry.hidden)
		{
			Dom.addClass(element, '--with-pointer');
			Dom.addClass(element, '--pointer-hidden');

			return true;
		}

		// Taken here and written at the end: a computed style is live, and asking it for the colour after the
		// classes below would cost exactly the recalculation this order is here to spare.
		const { backgroundColor } = bodyStyle;

		// Viewport values are divided by the root scale to land in the CSS system of a transformed ancestor.
		const scaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
		const scaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
		const scale = axis === 'x' ? scaleX : scaleY;
		const anchorRect = reference.getBoundingClientRect();

		const floatingSize = axis === 'x' ? element.offsetWidth : element.offsetHeight;
		const floatingStart = (axis === 'x' ? rect.left : rect.top) / scale;
		const anchorStart = (axis === 'x' ? anchorRect.left : anchorRect.top) / scale;
		const anchorSize = (axis === 'x' ? anchorRect.width : anchorRect.height) / scale;

		// The offset set is chosen by the applied side, exactly as the aim above. floating-ui adds cross to
		// the very left/top written on this element, so it is already stated in the CSS pixels the division
		// by scale lands in - no conversion of its own.
		const cross = selectOnAxisFlip(normalized.offset, normalized.position, finalSide).cross;

		const edge = resolvePointer({
			pointer: aim,
			geometry,
			floatingSize,
			floatingStart,
			anchorStart,
			anchorSize,
			cross,
			axis,
			direction: this.#direction,
		});

		// Everything measured, so from here on it is writes alone, in the order they have always gone out in.
		Dom.addClass(element, '--with-pointer');
		Dom.removeClass(element, '--pointer-hidden');

		// The arrow takes the computed background of the bubble, so the consumer paints one node and gets
		// both. Rewritten on every cycle, which is what picks a theme switch up - no observer of its own.
		// A background-image never reaches backgroundColor: a gradient leaves the arrow a flat fill.
		this.#css(pointer, '--ui-popover-pointer-color', backgroundColor);
		this.#warnIfBubbleTransparent(backgroundColor);

		this.#resetInline(pointer, ['left', 'top', 'right', 'bottom']);
		// The box hangs by its protrusion alone, so the base of the figure sinks POINTER_OVERLAP into the
		// bubble: two separately rounded boxes would otherwise leave a hairline of the page on the joint.
		this.#css(pointer, STATIC_SIDE[finalSide], `${-POINTER_PROTRUSION}px`);
		this.#css(pointer, axis === 'x' ? 'left' : 'top', `${edge}px`);

		return false;
	}

	// The arrow is painted with the background of the bubble, so a bubble nobody painted leaves it nothing to
	// take: the figure is there, correct in every geometry, and invisible. Warned once per instance.
	#warnIfBubbleTransparent(color: string): void
	{
		if (this.#transparentBubbleWarned || !isTransparentColor(color))
		{
			return;
		}

		this.#transparentBubbleWarned = true;
		console.warn(
			`${EVENT_NAMESPACE}: the pointer is on, but the computed background of the bubble is fully `
			+ 'transparent - the arrow takes its colour from there and stays invisible. The appearance of the '
			+ 'popover belongs to the place of use: the bubble is the node given as content, so give that node '
			+ 'a background in your CSS.',
		);
	}

	// Returns the size limits it wrote, so the state carries the very numbers the popover was capped with.
	#applySizePlan(
		element: HTMLElement,
		normalized: NormalizedPositioning,
		args: SizeApplyArgs,
	): PopoverState['constrained']
	{
		this.#resetInline(element, SIZE_INLINE_PROPS);

		const reference = args.rects.reference;
		switch (normalized.stretch)
		{
			case 'width':
				this.#css(element, 'width', `${reference.width}px`);
				break;
			case 'min-width':
				this.#css(element, 'minWidth', `${reference.width}px`);
				break;
			case 'height':
				this.#css(element, 'height', `${reference.height}px`);
				break;
			default:
				break;
		}

		if (!normalized.constrainSize)
		{
			return null;
		}

		// Never below zero: the space left over is a difference, and the vendor hands it over as it comes out -
		// negative once the boundary is narrower than the padding taken off both its sides. A negative max-width
		// is no declaration at all, the browser drops it on the floor, and constrainSize would stop constraining
		// in the very case it is needed most. Zero is the honest floor: nothing fits, and the popover is capped
		// to nothing rather than left to grow.
		const maxWidth = Math.max(0, args.availableWidth);
		const maxHeight = Math.max(0, args.availableHeight);

		this.#css(element, 'maxWidth', `${maxWidth}px`);
		this.#css(element, 'maxHeight', `${maxHeight}px`);

		// The state carries the numbers the popover was actually capped with, so it reports the floor as well.
		return { maxWidth, maxHeight };
	}

	// Area mode never calls computePosition: only the vendor coordinate helpers and autoUpdate.
	#startAreaCycle(element: HTMLElement): void
	{
		const generation = this.#generation;
		const update = (): void => {
			void this.#areaUpdate(element, generation);
		};

		this.#update = update;
		this.#normalized = normalizePositioning(this.#positioning, 'area', this.#ignoredAreaOptionsWarned);

		void this.#setupAreaSubscriptions(element, generation, update);
		update();
	}

	async #setupAreaSubscriptions(element: HTMLElement, generation: number, update: () => void): Promise<void>
	{
		const normalized = this.#normalized;
		if (normalized === null)
		{
			return;
		}

		try
		{
			const offsetParent = await platform.getOffsetParent(element);
			if (this.#generation !== generation)
			{
				return;
			}

			// The vendor answers with the window of the element, so the window of the element is what it is
			// compared against: a container inside an iframe makes the two windows different objects, and the
			// global one would never match.
			const isWindow = offsetParent === this.#defaultView();
			const boundaryElement = Type.isElementNode(normalized.boundary) ? normalized.boundary : null;
			const isFixed = normalized.strategy === 'fixed';

			if (boundaryElement)
			{
				this.#cleanups.push(autoUpdate(boundaryElement, element, update));
			}

			if (isFixed && !isWindow)
			{
				// Transformed containing block: its moves and resizes invalidate the pixel coordinates. The
				// second reason to subscribe within one cycle, so the popover is left to the first of them.
				const containingBlock = offsetParent as Element;
				if (boundaryElement)
				{
					this.#watchAlongside(containingBlock, element, update);
				}
				else
				{
					this.#cleanups.push(autoUpdate(containingBlock, element, update));
				}
			}
			else if (isFixed && normalized.constrainSize && !boundaryElement)
			{
				// The declarative fixed position survives a resize, the viewport-derived max sizes do not:
				// an appearing scrollbar changes clientWidth.
				this.#cleanups.push(autoUpdate(this.#ownerDocument().documentElement, element, update));
			}
			// absolute against the viewport: a snapshot taken on show, no subscriptions at all.
		}
		catch (error)
		{
			console.error(`${EVENT_NAMESPACE}: area subscription setup failed.`, error);
		}
	}

	async #areaUpdate(element: HTMLElement, generation: number): Promise<void>
	{
		const runId = ++this.#runId;
		const isCurrent = (): boolean => this.#generation === generation && this.#runId === runId;

		const normalized = this.#normalized;
		// The same reading as in the anchor cycle: no options in place means no cycle left to tick.
		if (normalized === null)
		{
			return;
		}

		this.#css(element, 'position', normalized.strategy);

		try
		{
			const offsetParent = await platform.getOffsetParent(element);
			if (!isCurrent())
			{
				return;
			}

			const translation = await this.#resolveAreaTranslation(normalized, offsetParent);
			if (!isCurrent())
			{
				return;
			}

			this.#resetInline(element, AREA_INLINE_PROPS);

			const plan = computeAreaCss({
				area: this.#resolveArea(normalized.boundary),
				padding: normalized.boundaryPadding,
				position: normalized.position,
				alignment: normalized.alignment,
				offset: normalized.offset.base,
				constrainSize: normalized.constrainSize,
				direction: this.#direction,
				translation,
			});

			this.#css(element, 'left', plan.left);
			this.#css(element, 'top', plan.top);
			this.#css(element, 'right', plan.right);
			this.#css(element, 'bottom', plan.bottom);
			this.#css(element, 'transform', plan.transform);
			this.#css(element, 'maxWidth', plan.maxWidth);
			this.#css(element, 'maxHeight', plan.maxHeight);

			Dom.removeClass(element, '--with-pointer');

			// The plan writes the limits as pixel strings and only under constrainSize, so the state reads the
			// numbers back from it instead of repeating the arithmetic of the mapper.
			const constrained = plan.maxWidth === null || plan.maxHeight === null
				? null
				: { maxWidth: Number.parseFloat(plan.maxWidth), maxHeight: Number.parseFloat(plan.maxHeight) };

			this.#commitState(element, {
				shown: this.#shown,
				positioned: true,
				position: normalized.position,
				alignment: normalized.alignment,
				flipped: false,
				slide: { x: 0, y: 0 },
				anchorHidden: false,
				// The area mode never draws an arrow: there is no anchor for it to point at.
				pointerHidden: true,
				constrained,
				rect: toPopoverRect(element.getBoundingClientRect()),
			});
		}
		catch (error)
		{
			console.error(`${EVENT_NAMESPACE}: area positioning failed.`, error);

			// The same ending as in the anchor cycle: the state says that no position was applied, the consumer
			// is told about the failure by the event, and the popover stays where the last applied position put
			// it - out of sight, while there has been none.
			if (isCurrent())
			{
				this.#commitState(element, buildState(this.#shown), true);
			}
		}
	}

	async #resolveAreaTranslation(
		normalized: NormalizedPositioning,
		offsetParent: Element | Window,
	): Promise<AreaTranslation>
	{
		const boundaryIsViewport = !Type.isElementNode(normalized.boundary);
		const isWindow = offsetParent === this.#defaultView();

		if (normalized.strategy === 'fixed' && isWindow)
		{
			// Containing block is the viewport, so the fixed coordinate system is the viewport one.
			return boundaryIsViewport
				? { mode: 'declarative' }
				: { mode: 'pixel', origin: { x: 0, y: 0 }, scale: { x: 1, y: 1 } };
		}

		if (isWindow)
		{
			// absolute with a Window offset parent: origin follows the vendor getRectRelativeToOffsetParent.
			const root = this.#ownerDocument().documentElement;
			const scroll = { x: root.scrollLeft, y: root.scrollTop };
			const scrollBarX = root.getBoundingClientRect().left + root.scrollLeft;
			const htmlStyle = getComputedStyle(root);
			const htmlOffset = {
				x: Number.parseFloat(htmlStyle.marginLeft) || 0,
				y: Number.parseFloat(htmlStyle.marginTop) || 0,
			};

			return {
				mode: 'pixel',
				origin: windowOffsetParentOrigin(scroll, scrollBarX, htmlOffset),
				scale: { x: 1, y: 1 },
			};
		}

		// Always an Element here: the Window cases are handled by the branches above.
		const element = offsetParent as HTMLElement;
		const rect = await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
			rect: { x: 0, y: 0, width: 0, height: 0 },
			offsetParent: element,
			strategy: normalized.strategy,
		});
		const scale = await platform.getScale(element);

		return { mode: 'pixel', origin: { x: rect.x, y: rect.y }, scale };
	}

	#resolveArea(boundary: NormalizedPositioning['boundary']): { x: number; y: number; width: number; height: number }
	{
		if (Type.isElementNode(boundary))
		{
			const rect = boundary.getBoundingClientRect();

			return {
				x: rect.left + boundary.clientLeft,
				y: rect.top + boundary.clientTop,
				width: boundary.clientWidth,
				height: boundary.clientHeight,
			};
		}

		// The viewport of the document the popover lives in, which is the one of the iframe when the container
		// of the consumer is in one: an area measured against the outer viewport would be an area of another
		// screen entirely.
		const root = this.#ownerDocument().documentElement;

		return { x: 0, y: 0, width: root.clientWidth, height: root.clientHeight };
	}

	// The result of a cycle: the event tells about the computation and not about the show, so a cycle that
	// changed nothing stays silent - during a scroll only the rect keeps moving, and only it is reported. A
	// cycle that applied nothing takes the applied state off instead of writing it: the attributes and the
	// arrow flags answer for the same fact the positioned field carries, and the two never disagree.
	//
	// A failure is the one result reported even when no field of the state moved: the state of a computation
	// that failed and the state of one still running are the same, so the passage from the second into the
	// first is all there is to tell. Only the passage - a cycle failing on every frame of a scroll says so
	// once, and the next result that is not a failure opens the way for the report again.
	#commitState(element: HTMLElement, state: PopoverState, failed: boolean = false): void
	{
		const changed = changedStateFields(this.#state, state);
		const reportFailure = failed && !this.#cycleFailed;
		this.#cycleFailed = failed;
		this.#state = state;

		if (state.positioned)
		{
			this.#writeAppliedAttributes(element, state);
			// The one place the measuring flag comes off, and an applied position is what it comes off for: the
			// popover is shown where it belongs and never anywhere else. A result that applied nothing leaves
			// the flag as it found it - on, if no position has been applied since the cycle started, which
			// keeps a root with no coordinates of its own out of sight instead of showing it in the corner of
			// the page; off, if a position was applied earlier, and there the popover stays exactly where the
			// last cycle put it.
			Dom.removeClass(element, '--measuring');
		}
		else
		{
			this.#clearAppliedState(element);
		}

		if (changed.length > 0 || reportFailure)
		{
			const payload: PopoverStateChangePayload = { state: cloneState(state), changed };

			this.emit('onStateChange', payload);
		}
	}

	#writeAppliedAttributes(element: HTMLElement, state: PopoverState): void
	{
		if (state.position === null)
		{
			element.removeAttribute('data-position');
		}
		else
		{
			Dom.attr(element, 'data-position', state.position);
		}

		Dom.attr(element, 'data-alignment', state.alignment);
		Dom.attr(element, 'data-flipped', state.flipped ? 'true' : 'false');

		if (state.anchorHidden)
		{
			Dom.attr(element, 'data-anchor-hidden', 'true');
		}
		else
		{
			element.removeAttribute('data-anchor-hidden');
		}
	}

	// Everything an applied state leaves on the root, the flag classes among the attributes: they are written
	// by the pass that applies a computation, so a state that applied none carries none of them either. Both
	// classes outlive their own fact otherwise. The arrow is turned by [data-position], so a figure left on
	// after the attribute is gone would stand on the coordinate of the cycle before in the base orientation of
	// the bottom side; --anchor-hidden holds the root in visibility: hidden, which on a state saying
	// anchorHidden false is an instance invisible with nothing to say so. Invisible on a relaunch, where
	// --measuring keeps the root out of sight until the new cycle writes everything anew, and plain to see on
	// the failure path once a position has been applied, where the popover stays on the screen exactly where
	// the last cycle left it.
	#clearAppliedState(element: HTMLElement): void
	{
		['data-position', 'data-alignment', 'data-flipped', 'data-anchor-hidden'].forEach((name) => {
			element.removeAttribute(name);
		});

		Dom.removeClass(element, '--with-pointer');
		Dom.removeClass(element, '--pointer-hidden');
		Dom.removeClass(element, '--anchor-hidden');
	}

	#alignmentOf(placement: string): PopoverState['alignment']
	{
		const alignment = placement.split('-')[1];

		return alignment === 'start' || alignment === 'end' ? alignment : 'center';
	}

	// Dom.style drops the inline property on null and sets it on a string; property names are camelCase.
	#css(element: HTMLElement, property: string, value: string | null): void
	{
		Dom.style(element, property, value);
	}

	#resetInline(element: HTMLElement, properties: string[]): void
	{
		properties.forEach((property) => Dom.style(element, property, null));
	}

	#ensureElement(): HTMLElement
	{
		if (this.#element)
		{
			return this.#element;
		}

		// Built before a single field is written: a content of the wrong shape throws, and the instance is
		// left exactly as it was, with no half-made element for the next show() to find.
		const body = this.#resolveBody();

		const pointer: HTMLElement = Tag.render`<div class="ui-system-popover__pointer"></div>`;
		const element: HTMLElement = Tag.render`
			<div class="ui-system-popover">
				${pointer}
			</div>
		`;
		// The bubble joins the arrow as its sibling, and after it: the arrow stays first in the DOM, while
		// inside the bubble the overflow of the consumer would cut it off.
		Dom.append(body, element);
		this.#prepareBody(body);

		this.#element = element;
		this.#pointer = pointer;
		this.#body = body;

		this.#applyAppearance(element);

		return element;
	}

	// The bubble of the popover is the very node the consumer handed over: the extension wraps it in nothing
	// and puts no class on it, so the background, the radius, the padding and the overflow are theirs to write
	// on that node. Hence exactly one element - a bubble made of several nodes means nothing. The shape is
	// checked here, when the node is built on the first show(), and not in the constructor: a factory has
	// nothing to tell before it is called, and one moment of failure for every form of content is easier to
	// live with than a different moment per form. The type of the value stays the business of the constructor.
	#resolveBody(): HTMLElement
	{
		const value = this.#content;

		if (Type.isString(value))
		{
			const roots = parseMarkupRoots(value);
			const root = roots.length === 1 ? roots[0] : null;
			if (!Type.isElementNode(root))
			{
				throw new TypeError(
					`${EVENT_NAMESPACE}: ${CONTENT_SHAPE}. The markup carries ${roots.length} root node(s) `
					+ 'instead of a single root tag.',
				);
			}

			return root;
		}

		const node = Type.isFunction(value) ? value() : value;
		if (!Type.isElementNode(node))
		{
			const source = Type.isFunction(value) ? 'The factory returned' : 'The option holds';

			throw new TypeError(`${EVENT_NAMESPACE}: ${CONTENT_SHAPE}. ${source} no element.`);
		}

		return node;
	}

	// Everything the extension writes into the node of the consumer, and it writes it once. Two parts of
	// different weight. The soft one - the layout defaults that make the bubble follow the size plan of the
	// root - lives in popover.css behind this attribute and at zero specificity, so any rule of the consumer
	// outweighs it: a max-width of theirs on the bubble is a plain and expected thing to write. The hard one is
	// margin, and it stays inline because it is not a default at all: the root is sized by its content, so a
	// margin of the bubble would enter the size of the root and take the arrow, which hangs on the edge of the
	// root, away from the bubble by exactly that much. The outer gap is the offset option, not a margin of the
	// bubble, and this is the one place where the extension has to win the cascade.
	#prepareBody(body: HTMLElement): void
	{
		Dom.attr(body, BUBBLE_ATTRIBUTE, '');
		this.#css(body, 'margin', '0');
	}

	#applyAppearance(element: HTMLElement): void
	{
		this.#applyClassName(element);

		if (this.#designContext !== null)
		{
			Dom.addClass(element, `--ui-context-${this.#designContext}`);
		}
	}

	// Writes the classes of the option and records what it has written, so a later value takes off exactly
	// those. The record is the difference the write itself makes on the root, and not a list built from the
	// value: Dom.addClass splits and filters the value on its own, and a second reading of those rules here
	// would be a copy free to drift. A class the root already carried is left out of the record - this call
	// did not put it there, so nothing here may take it away.
	#applyClassName(element: HTMLElement): void
	{
		const before = new Set(element.classList);

		Dom.addClass(element, this.#className);

		this.#appliedClassNames = [...element.classList].filter((name) => !before.has(name));
	}

	#applyHiddenState(): void
	{
		this.#unbindCloseHandlers();
		this.#stopPositioning();

		this.#shown = false;
		// The gesture that opened the popover has nothing left to protect once the popover is gone; the next
		// show() reads the moment of its own.
		this.#openedByGesture = false;
		// Hiding is onHide business: the state goes back to the one of a hidden popover without an event of
		// its own, so the order of events never depends on whether the first cycle managed to finish. The
		// failure of the cycle being stopped is left behind with it - the next show() starts from scratch.
		this.#state = buildState(false);
		this.#cycleFailed = false;
		this.#generation += 1;

		if (this.#element)
		{
			Dom.addClass(this.#element, '--hidden');
			Dom.removeClass(this.#element, '--measuring');
			Dom.removeClass(this.#element, '--anchor-hidden');
		}
	}

	// Close handlers. Escape and click go on window in the capture phase so they run before the
	// document handlers of main.popup regardless of subscription order; the gesture listeners are passive.
	#bindCloseHandlers(): void
	{
		const view = this.#defaultView();
		if (view === null)
		{
			return;
		}

		const captureView = { capture: true };
		const capturePassive = { capture: true, passive: true };

		if (this.#closeByEsc)
		{
			Event.bind(view, 'keyup', this.#handleWindowKeyUp, captureView);
		}

		if (this.#closeByClickOutside)
		{
			Event.bind(view, 'click', this.#handleWindowClick, captureView);
			Event.bind(view.document, 'mousedown', this.#handleGestureStart, capturePassive);
			Event.bind(view.document, 'mouseup', this.#handleGestureEnd, capturePassive);
			Event.bind(view.document, 'pointercancel', this.#handleGestureEnd, capturePassive);
		}
	}

	#unbindCloseHandlers(): void
	{
		const view = this.#defaultView();
		if (view === null)
		{
			return;
		}

		const captureView = { capture: true };
		const capturePassive = { capture: true, passive: true };

		Event.unbind(view, 'keyup', this.#handleWindowKeyUp, captureView);
		Event.unbind(view, 'click', this.#handleWindowClick, captureView);
		Event.unbind(view.document, 'mousedown', this.#handleGestureStart, capturePassive);
		Event.unbind(view.document, 'mouseup', this.#handleGestureEnd, capturePassive);
		Event.unbind(view.document, 'pointercancel', this.#handleGestureEnd, capturePassive);
		this.#gestureStartedInside = false;
	}

	// The document the popover lives in. The root is mounted into the container of the consumer, and that
	// container may belong to an iframe: the viewport the area is measured against, the root element the
	// coordinates are counted from and the window the observers hang on all come from there. Without a
	// container of its own the popover mounts into the document this code was loaded into, and that one is
	// the answer.
	#ownerDocument(): Document
	{
		return this.#mountContainer === null ? document : this.#mountContainer.ownerDocument;
	}

	#defaultView(): (Window & typeof globalThis) | null
	{
		return this.#ownerDocument().defaultView;
	}

	#handleWindowKeyUp = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape' || this.#element === null)
		{
			return;
		}

		// An invisible popover stays transparent: the event is left to the visible layer below.
		if (!isVisible(this.#element))
		{
			return;
		}

		// Under a top layer we do not swallow Escape - that layer handles it itself.
		if (hasVisibleLayerAbove(this.#element))
		{
			return;
		}

		// Stops both the Escape queue of main.popup and the window handlers of sibling popovers.
		event.stopImmediatePropagation();
		this.hide();
	};

	#handleWindowClick = (event: MouseEvent): void => {
		// Read and reset synchronously: the gesture of this very click is no longer relevant.
		const startedInside = this.#gestureStartedInside;
		const openedByGesture = this.#openedByGesture;
		this.#gestureStartedInside = false;
		this.#openedByGesture = false;

		const target = event.target;
		if (this.#element === null || !Type.isElementNode(target))
		{
			return;
		}

		if (!isVisible(this.#element) || this.#element.contains(target))
		{
			return;
		}

		// Selecting text from inside and releasing outside fires the click on a common ancestor.
		if (startedInside)
		{
			return;
		}

		// The second half of the press that opened this popover, and no action of the user against it: the
		// consumer opened the popover on the way down of the pointer, and the way up is the same gesture. Only
		// for the pointer - a keyboard activation arrives as a synthetic click with detail 0 and belongs to
		// nothing that came before it.
		if (openedByGesture && event.detail !== 0)
		{
			return;
		}

		// One walk of the ancestors per click: the arbitration below and the closing rule after it both ask
		// for the layer chain of the popover, and between the two questions nothing can have moved it.
		const chain = layerChain(this.#element);

		if (hasVisibleLayerAbove(this.#element, chain))
		{
			return;
		}

		if (isClosingClick(this.#element, target, chain))
		{
			// preventDefault cancels the native action: the first click closes, the second one acts. Only for
			// the pointer, though. Enter or Space on a control outside dispatches a synthetic click, told apart
			// by detail 0, and there the user has already moved the focus out of the popover and can see it:
			// the activation passes and the very same keystroke closes the popover.
			if (event.detail !== 0)
			{
				event.stopImmediatePropagation();
				event.preventDefault();
			}

			this.hide();
		}
	};

	#handleGestureStart = (event: MouseEvent): void => {
		this.#gestureStartedInside = this.#element !== null
			&& Type.isElementNode(event.target)
			&& this.#element.contains(event.target);
	};

	#handleGestureEnd = (): void => {
		// Reset in a macrotask: the click of this gesture is dispatched earlier and still reads the flags. Both
		// of them are of the gesture that ends here, and a gesture that produced no click at all (a cancelled
		// press) must leave neither behind.
		setTimeout(() => {
			this.#gestureStartedInside = false;
			this.#openedByGesture = false;
		}, 0);
	};

	#isValidContent(content: unknown): boolean
	{
		return Type.isString(content) || Type.isDomNode(content) || Type.isFunction(content);
	}

	// The three shapes of the option and nothing besides, each of them read the way the type of the option
	// names it: an Element, a virtual anchor answering getBoundingClientRect(), a point of two coordinates.
	// The two virtual shapes are told by their shape alone, so an instance of a class of the consumer passes
	// here exactly as the type promises - anything else would turn a target the compiler accepted into a
	// silent null, and the popover would open in the area mode instead.
	#isValidTarget(target: unknown): target is Exclude<PopoverTarget, null>
	{
		return Type.isElementNode(target) || isRectTarget(target) || isPointTarget(target);
	}

	// Only the map form needs unwrapping: Dom.addClass itself splits space-separated strings and skips
	// blank and non-string entries, so invalid values land as no classes.
	#normalizeClassName(className: unknown): string | string[]
	{
		if (Type.isPlainObject(className))
		{
			return Object.keys(className).filter((name) => Boolean(className[name]));
		}

		return Type.isString(className) || Type.isArray(className) ? (className as string | string[]) : [];
	}

	#normalizeDesignContext(designContext: unknown): PopoverDesignContext | null
	{
		return (Object.values(PopoverDesignContext) as string[]).includes(designContext as string)
			? (designContext as PopoverDesignContext)
			: null;
	}
}
