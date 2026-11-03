import { Event, Type } from 'main.core';

import { DEFAULT_POSITION, DEFAULT_TRIGGER, TooltipPosition, TooltipTrigger } from './const';
import { Tooltip } from './tooltip';
import { buildingFrom } from './trigger';
import { type TooltipOptions } from './types';

const LABEL = 'BX.UI.System.Tooltip';

// The markup contract. The names meet none of the taken ones: data-hint* belongs to ui.hint, bx-tooltip-*
// to ui.tooltip.
const TEXT_ATTRIBUTE = 'data-ui-tooltip';
const TRIGGER_ATTRIBUTE = 'data-ui-tooltip-trigger';

const TRIGGER_SEPARATOR = ',';

// The modes the markup may ask for. Manual is not among them - it stands for a tooltip shown and hidden by
// the place of use alone, and a marked element has no place of use to do that. Left through, it would also
// reach the trigger layer as a combination it refuses by a TypeError, thrown from a listener on the document.
const MARKUP_TRIGGERS: TooltipTrigger[] = [TooltipTrigger.Hover, TooltipTrigger.Click, TooltipTrigger.Focus];

const isMarkupPosition = (value: unknown): value is TooltipPosition => {
	return (Object.values(TooltipPosition) as unknown[]).includes(value);
};

const isMarkupTrigger = (value: unknown): value is TooltipTrigger => {
	return (MARKUP_TRIGGERS as unknown[]).includes(value);
};

const readTrigger = (raw: string | undefined): TooltipTrigger[] => {
	return (raw ?? '')
		.split(TRIGGER_SEPARATOR)
		.map((mode) => mode.trim())
		.filter((mode): mode is TooltipTrigger => isMarkupTrigger(mode));
};

// A reason of visibility a marked element carries by itself: the mode its markup has to name for the reason
// to count at all, the state of the element the reason is read from, and the gesture that raises it anew. The
// cursor over the bubble is none of them - the bubble belongs to an instance, and there is none to speak of
// while the element carries no tooltip.
type Reason = {
	mode: TooltipTrigger;
	state: string;
	gesture: string;
};

const REASONS: Reason[] = [
	{ mode: TooltipTrigger.Hover, state: ':hover', gesture: 'pointerover' },
	{ mode: TooltipTrigger.Focus, state: ':focus-visible', gesture: 'focusin' },
];

// The gesture that raises an instance, mode by mode: the two of the reasons above, and the click - the one
// mode no state of the element answers for, so it carries none and takes no part in the hold below.
const RAISING_GESTURES: { mode: TooltipTrigger, gesture: string }[] = [
	...REASONS.map(({ mode, gesture }) => ({ mode, gesture })),
	{ mode: TooltipTrigger.Click, gesture: 'click' },
];

// The modes the markup asked for. An empty list means it named none at all, and the default pair takes over.
const askedModes = (element: HTMLElement): TooltipTrigger[] => {
	const trigger = readTrigger(element.dataset.uiTooltipTrigger);

	return trigger.length > 0 ? trigger : [...DEFAULT_TRIGGER];
};

// Whether the gesture at hand is one the markup of this element asked for. A gesture outside them raises
// nothing: the reason machine gives the choice by mode, so an instance built by such a gesture is never shown
// - and never hidden either, while the surface takes an instance down on the hiding alone.
const raisesInstance = (element: HTMLElement, event: UIEvent): boolean => {
	const asked = askedModes(element);

	return RAISING_GESTURES.some(({ mode, gesture }) => gesture === event.type && asked.includes(mode));
};

// The reasons standing on the element right now, among the ones its markup asked for. They are read from the
// state the element is in, which is what the moment a tooltip leaves the screen has to tell them by: no gesture
// is at hand there.
const standingReasons = (element: HTMLElement): Set<Reason> => {
	const asked = askedModes(element);

	return new Set(REASONS.filter((reason) => asked.includes(reason.mode) && element.matches(reason.state)));
};

// Whether the gesture at hand raised the reason anew, coming from outside the element. Both gestures listened
// to bubble - unlike the pointerenter and the focusin of the element the class surface takes - so they fire
// again on every move of the cursor and every change of the focus between the nodes inside a marked element,
// and the node the gesture came from is what tells those apart from a return to the element from elsewhere.
const raisedFromOutside = (reason: Reason, event: UIEvent, element: Element): boolean => {
	if (event.type !== reason.gesture)
	{
		return false;
	}

	const from = (event as PointerEvent | FocusEvent).relatedTarget;

	return !Type.isDomNode(from) || !element.contains(from);
};

// A value outside the ones listed is read as absent, and the default of the contract takes its place.
//
// Every option is written out, none left to the merge of the class: the markup is read again over an instance
// that already stands, and there an option left out keeps the value in force - an attribute taken off the
// element would go on working from memory.
const readOptions = (element: HTMLElement): TooltipOptions => {
	const data = element.dataset;
	const trigger = readTrigger(data.uiTooltipTrigger);

	return {
		target: element,
		// The value arrives from the markup already decoded by the browser and goes into textContent as it is.
		content: data.uiTooltip ?? '',
		position: isMarkupPosition(data.uiTooltipPosition) ? data.uiTooltipPosition : DEFAULT_POSITION,
		trigger: trigger.length > 0 ? trigger : [...DEFAULT_TRIGGER],
	};
};

// What the markup of an element said when it was last read. The gestures listened to fire on every move of the
// cursor and every change of the focus between the nodes inside a marked element, so an unchanged markup has
// to cost no more than these three comparisons.
type Markup = {
	content: string | undefined;
	position: string | undefined;
	trigger: string | undefined;
};

const readMarkup = (element: HTMLElement): Markup => {
	const data = element.dataset;

	return { content: data.uiTooltip, position: data.uiTooltipPosition, trigger: data.uiTooltipTrigger };
};

const sameMarkup = (one: Markup, other: Markup | undefined): boolean => {
	return other !== undefined
		&& one.content === other.content
		&& one.position === other.position
		&& one.trigger === other.trigger;
};

// The markup surface of the extension: two listeners on the document raise an instance for a marked element
// the first time a gesture reaches it. Nothing is walked through at load and no change of the DOM is watched -
// that is exactly what separates this surface from ui.hint.
export class Manager
{
	#instances: WeakMap<Element, Tooltip> = new WeakMap();

	// The reasons that stood on an element the moment its tooltip left the screen. With a reason still standing,
	// nothing but a hand outside the reason machine can take the tooltip off - the escape key or a click outside
	// - so the hiding is a dismissal, and a dismissed tooltip must not come back while any of those very reasons
	// still holds. Otherwise the very next gesture, and a move between the nodes inside the element is one,
	// would raise an instance reading them as standing and show the tooltip again on the spot.
	#held: WeakMap<Element, Set<Reason>> = new WeakMap();

	// Elements already spoken of. Every hiding takes the instance down, so the gesture raising the next one
	// would repeat the message over and over on the same element.
	#warned: WeakSet<Element> = new WeakSet();

	// The markup as it was read last, element by element, so that a gesture changing nothing costs nothing.
	#markup: WeakMap<Element, Markup> = new WeakMap();

	// The document the listeners go on. The singleton of the extension watches the one of the page; a document
	// given by hand is what a frame of its own needs - and a test, which has to reach this very manager and not
	// the copy of the extension the page around it carries.
	constructor(watched: Document = document)
	{
		// Passive throughout: the gestures are only read here, never answered.
		Event.bind(watched, 'pointerover', this.#handleGesture, { passive: true });
		Event.bind(watched, 'focusin', this.#handleGesture, { passive: true });
		// The click alone is taken on the way down, and that is what the click mode needs to work at all. The
		// instance is raised here and the subscriptions of the element are taken by the trigger layer inside it;
		// a listener added to the target while the event is still descending does receive that very event, so
		// the click that raised the instance goes on to pin the tooltip by itself. On the way up the same click
		// would arrive after the handler of the element: the second click of a pair would lower the pinning,
		// take the instance down with the hiding, and then be read here as a gesture raising a new one.
		Event.bind(watched, 'click', this.#handleGesture, { capture: true, passive: true });
	}

	// show() is never called from here. The first show is raised by the reason machine itself: the gesture that
	// created the instance is handed over to the trigger layer and becomes a reason of visibility there. A show()
	// in its stead would leave the reason down, and the answering event - pointerleave or focusout - would not
	// hide the tooltip: no reason would have changed. The same machine gives the choice by mode as well, so an
	// element asking for the click mode stays quiet under the cursor.
	//
	// The parameter is a UIEvent and not an Event: the name of the DOM interface is taken in this module by the
	// helper of main.core, and the two gestures listened to - a pointer one and a focus one - meet in UIEvent.
	#handleGesture = (event: UIEvent): void => {
		const source = event.target;
		if (!Type.isElementNode(source))
		{
			return;
		}

		const element = source.closest<HTMLElement>(`[${TEXT_ATTRIBUTE}]`);
		if (element === null)
		{
			return;
		}

		const standing = this.#instances.get(element);
		if (standing !== undefined)
		{
			this.#refresh(element, standing);

			// The markup read anew may take the instance down: the modes it now asks for may answer nothing of
			// what was holding the tooltip on the screen, and every hiding takes the instance with it. The
			// gesture at hand is then the one that has to raise the next instance, exactly as over an element
			// that never carried one. The click is where losing it shows: a press changing the mode to click
			// would pin nothing at all, and the tooltip would wait for the one after it.
			if (this.#instances.has(element))
			{
				return;
			}
		}

		if (!raisesInstance(element, event))
		{
			return;
		}

		if (!this.#freeOfHold(element, event))
		{
			return;
		}

		// A marked element carrying nothing has nothing to show.
		if (!Type.isStringFilled(element.dataset.uiTooltip))
		{
			return;
		}

		this.#raise(element, event);
	};

	// The markup read again over an instance that already stands. Nothing in the DOM is watched, so a value
	// changed after the instance was built reaches nobody otherwise: the next show would give the text and the
	// settings of the moment the element was first reached.
	#refresh(element: HTMLElement, instance: Tooltip): void
	{
		const markup = readMarkup(element);
		if (sameMarkup(markup, this.#markup.get(element)))
		{
			return;
		}

		this.#markup.set(element, markup);

		// An emptied value takes the tooltip off the element, the same way an empty one gets none raised for it.
		if (!Type.isStringFilled(markup.content))
		{
			this.#instances.delete(element);
			instance.destroy();

			return;
		}

		instance.setOptions(readOptions(element));
	}

	// Whether nothing of a dismissal holds the element back any more. A reason is let go once it has gone - the
	// state of the element no longer reads it - or once the gesture at hand has raised it anew from outside the
	// element. A gesture that did neither leaves the hold as it stood, and the element carries no tooltip.
	//
	// The state answers for itself here, unlike the moment a binding is built: the one gesture that finds it not
	// yet applied is the one bringing the cursor onto the element from outside, and that gesture lets the hold go
	// by the other condition anyway.
	#freeOfHold(element: HTMLElement, event: UIEvent): boolean
	{
		const held = this.#held.get(element);
		if (held === undefined)
		{
			return true;
		}

		[...held].forEach((reason) => {
			if (!element.matches(reason.state) || raisedFromOutside(reason, event, element))
			{
				held.delete(reason);
			}
		});

		// Only the gestures of the held reasons are held back. The click is none of them - no state of the
		// element carries it - and a press made on purpose asks for the tooltip anew, whatever the cursor or the
		// focus left behind by the dismissal is still doing.
		const blocked = held.size > 0 && REASONS.some((reason) => reason.gesture === event.type);

		if (held.size === 0)
		{
			this.#held.delete(element);
		}

		return !blocked;
	}

	// The gesture goes along with the raising: the trigger layer built inside takes it as a reason of visibility
	// of its own. Left to the state of the element alone, it would lose the first gesture in Firefox, where
	// :hover is applied only after pointerover has been dispatched.
	#raise(element: HTMLElement, gesture: UIEvent): void
	{
		this.#warnOutOfTabOrder(element);

		this.#markup.set(element, readMarkup(element));

		buildingFrom(gesture, () => {
			const instance = new Tooltip({
				...readOptions(element),
				events: { onHide: () => this.#drop(element) },
			});

			this.#instances.set(element, instance);
		});
	}

	// A mode the markup asked for and the element cannot answer. The reason of the focus needs :focus-visible
	// on the marked element itself, and a node outside the tab order never gets it - the tooltip would never
	// reach a user of the keyboard, in silence.
	//
	// Only where the markup named the mode itself, though. The default pair carries the focus too, but there
	// the element says nothing about the keyboard, and a page marking its icons would hear this on every one
	// of them; a mode written out by hand on a node that cannot take it is a contradiction of the markup.
	//
	// A tabindex written by hand is left alone whatever it holds. tabindex="-1" is how a toolbar, a list or a
	// tree keeps one stop in the tab order and moves the focus between the rest with the arrow keys: such a
	// node does take :focus-visible, so the tooltip reaches the keyboard - and the advice below would break the
	// very arrangement. What is left is the case the check was made for: a node nobody thought of at all.
	#warnOutOfTabOrder(element: HTMLElement): void
	{
		if (element.tabIndex >= 0 || element.hasAttribute('tabindex') || this.#warned.has(element))
		{
			return;
		}

		if (!readTrigger(element.dataset.uiTooltipTrigger).includes(TooltipTrigger.Focus))
		{
			return;
		}

		this.#warned.add(element);
		console.warn(
			`${LABEL}: the element below asks for the "${TooltipTrigger.Focus}" trigger of ${TRIGGER_ATTRIBUTE} `
			+ 'and lies outside the tab order, so the tooltip never reaches a user of the keyboard. Mark the '
			+ 'focusable element itself, or give this one a tabindex.',
			element,
		);
	}

	// Every hiding takes the instance down, not only the one an element gone from the page brings about: the
	// bubble is mounted in document.body and hide() does not take it out of there, so a hidden instance nobody
	// destroys stays in the document for good. Both ways of leaking are closed by that - an element removed
	// while the tooltip is shown is answered by the positioning primitive with a hiding, and an element removed
	// after it has been hidden has no instance of its own left by then. The next gesture raises a new one, and
	// that costs nothing: the bubble is built on the first show, so an instance never shown holds no node.
	#drop(element: HTMLElement): void
	{
		const instance = this.#instances.get(element);
		if (instance === undefined)
		{
			return;
		}

		this.#instances.delete(element);

		// A reason of the element still standing while its tooltip goes off the screen means the hiding came
		// from elsewhere: the element is held back until every one of those reasons has been raised anew.
		const standing = standingReasons(element);
		if (standing.size > 0)
		{
			this.#held.set(element, standing);
		}

		instance.destroy();
	}
}

// The markup surface answers no calls: it is switched on by the extension being loaded and works from the
// document alone. That is what the singleton is published as, and the class behind it stays module-local - the
// namespace of the extension carries no Manager to construct, and a declaration promising one would be a
// promise the bundle cannot keep. Publishing the class instead is no way out either: a second manager watching
// one document raises a second instance for every marked element, and with it a second bubble and a second
// identifier in aria-describedby. The document parameter above exists for the unit tests, which reach this
// class through the module and not through the namespace.
export type TooltipMarkupSurface = Record<never, never>;

export const TooltipManager: TooltipMarkupSurface = new Manager();
