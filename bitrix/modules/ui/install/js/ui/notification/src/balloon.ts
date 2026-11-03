import {
	Type,
	Loc,
	Text,
	Dom,
	Tag,
	Event,
	Extension,
	ZIndexManager,
	addCustomEvent,
	onCustomEvent,
	removeCustomEvent,
} from 'main.core';

import { FocusMonitor, FocusNavigator, InteractivityChecker } from 'ui.a11y';

import { NotificationEvent } from './event';
import { Action } from './action';
import { announce, getAnnouncerDocument } from './announcer';
import { Stack } from './stack';
import { State, ACTION_MIN_AUTO_HIDE_DELAY, type BalloonOptions, type StateValue, type BalloonRender, type BalloonEventHandler } from './types';

// Marks the control the balloon moved the focus to by itself, so the stylesheet can
// draw the focus ring on it even where `:focus-visible` stays off (see `focusElement`).
const AUTOFOCUS_ATTRIBUTE = 'data-a11y-autofocus';

// The class every action control carries — `Action.getContainer()` puts it on the `<button>`
// and on the `<a>` alike — and the only thing left in the markup that says «this is an action»
// once the objects behind the drawn controls are gone (see `findRenderedActionIndex()`).
const ACTION_CLASS_NAME = 'ui-notification-balloon-action';

// A live region reaches the reader as one flat string, so the pieces the balloon puts there
// need a boundary of their own: without it the message and the first action title merge into
// a single word («Изменения сохраненыВыполнить действие»). A full stop is the boundary a
// reader actually pauses on, and it is what ui.uploader already puts between an error message
// and its description (uploader/tile-widget/src/components/tile-item.js). A piece that ends
// with punctuation of its own keeps it and gets a plain space instead.
const ANNOUNCEMENT_SEPARATOR = '. ';
const ANNOUNCEMENT_PART_END = /[!,.:;?…]$/;

// How long after the transition was due to end the safety net of `runTransition()` gives up
// waiting for `transitionend`. A transition that did start reports itself well inside this
// window — the event is dispatched at the end of the same frame the transition finishes in —
// so the net stays a net and never outruns the picture.
const TRANSITION_END_GRACE_MS = 50;

/**
 * The documents of the page the balloon may look at: its own and every document holding a
 * frame above it, the highest one last.
 *
 * The walk stops at the boundary of another origin on its own: `window.frameElement` is
 * null there just as it is at the very top.
 */
function getDocumentChain(container: HTMLElement): Document[]
{
	const documents: Document[] = [container.ownerDocument];
	let frame: Element | null = container.ownerDocument.defaultView?.frameElement ?? null;

	while (frame !== null)
	{
		const doc: Document = frame.ownerDocument;
		documents.push(doc);
		frame = doc.defaultView?.frameElement ?? null;
	}

	return documents;
}

/**
 * The element the focus is really on — the one inside a frame of the page included.
 *
 * A document never names an element of another document: a page whose focus is inside a
 * frame reports the `<iframe>` element itself, and the element with the caret in it is only
 * reached by descending into `contentDocument`. The balloon and the caret do end up in
 * different documents — `showOnTopWindow: true` moves the balloon into the top document
 * while the user keeps typing in the frame it was created in, and a balloon left inside a
 * frame sees the same picture the other way round. So the search starts at the highest
 * document the page may read, which is the one that knows about every frame below it, and
 * `FocusNavigator.getActiveElement()` walks down the chain of focused frames from there.
 *
 * Both walks stop at the boundary of another origin on their own: the chain of documents
 * ends there, and `contentDocument` is null as well, so the frame element is the answer —
 * which is all the page is allowed to know about it.
 */
function getFocusedElement(container: HTMLElement): HTMLElement | null
{
	const documents = getDocumentChain(container);

	return FocusNavigator.getActiveElement(documents[documents.length - 1].documentElement);
}

/**
 * The element the focus really leaves when a document reports that it is leaving `target`.
 *
 * A document names the frame below it — the `<iframe>` element — and never the control
 * inside it, so that is what its `focusout` carries when the user steps out of the frame.
 * The document of the frame still holds the control the focus was on at that moment, and
 * descending into it names the element the user actually left. A frame of another origin
 * keeps that to itself: there the frame element is the answer, and it is a usable one —
 * focusing a frame hands the focus back to whatever is inside it.
 */
function resolveFocusOrigin(target: EventTarget | null): HTMLElement | null
{
	if (!Type.isElementNode(target))
	{
		return null;
	}

	const element = target as HTMLElement;
	if (element.tagName !== 'IFRAME')
	{
		return element;
	}

	const framedDocument = (element as HTMLIFrameElement).contentDocument;
	if (framedDocument === null)
	{
		return element;
	}

	const framed = FocusNavigator.getActiveElement(framedDocument.documentElement);

	return framed === null || framed === framedDocument.body ? element : framed;
}

/**
 * Whether the document can still tell the balloon anything.
 *
 * A document of a frame taken off the page — a slider closed under a notification that stays
 * — loses its window, and a document whose frame is no longer in the page above it will never
 * dispatch a focus event again. Both are dead weight in two ways: listening to them is
 * pointless, and holding them holds the whole detached DOM of that slider out of the reach of
 * the collector for as long as the balloon lives.
 */
function isLiveDocument(doc: Document): boolean
{
	const view = doc.defaultView;
	if (view === null)
	{
		return false;
	}

	// Null at the top of the page, and at the boundary of another origin — where the document
	// is not this one's to read anyway, so it cannot be in the list at all.
	const frame = view.frameElement;

	return frame === null || frame.isConnected;
}

/**
 * Whether the focus can still be given back to the element.
 *
 * `isFocusable` answers for an element of a living document, and the element the balloon
 * remembers may outlive its own: a frame taken off the page — a slider closed under a
 * notification that stays — loses its window, while the element inside it goes on calling
 * itself connected to a document nobody can show any more. A document without a window has
 * nowhere to put the focus, and `focus()` on such an element does nothing at all, silently:
 * the balloon has to see that for itself and fall back to the focus monitor.
 */
function canReceiveFocus(element: HTMLElement): boolean
{
	return element.ownerDocument.defaultView !== null && InteractivityChecker.isFocusable(element);
}

/**
 * Whether the focus sits inside the container — in a frame of it as well.
 *
 * `Node.contains()` stops at the boundary of its own document, so an element inside a frame
 * of the balloon is «not in it» for it. The chain of frame elements answers the question the
 * balloon is really asking: the element belongs to the container when the container holds
 * the frame the element lives in. The focus trap of ui.a11y decides it the same way.
 */
function containsFocus(container: HTMLElement, element: HTMLElement | null): boolean
{
	if (!Type.isElementNode(element))
	{
		return false;
	}

	if (container.contains(element))
	{
		return true;
	}

	let doc: Document | null = element.ownerDocument;
	while (doc?.defaultView?.frameElement)
	{
		const frame: Element = doc.defaultView.frameElement;
		if (container.contains(frame))
		{
			return true;
		}

		doc = frame.ownerDocument;
	}

	return false;
}

function parseStyleList(value: string): string[]
{
	return value.split(',').map((item: string) => item.trim()).filter((item: string) => item !== '');
}

function parseStyleTime(value: string | undefined): number
{
	const time = Number.parseFloat(value ?? '');
	if (!Number.isFinite(time))
	{
		return 0;
	}

	return value!.endsWith('ms') ? time : time * 1000;
}

/**
 * How long the transition of `property` on the element runs, in milliseconds, its delay
 * included — read off the style the browser actually computed for this very element.
 *
 * The duration is not a constant the code may keep a copy of: the stylesheet says `.25s`,
 * `prefers-reduced-motion` says `1ms`, and a consumer restyling the balloon says something
 * else again. A property nothing transitions gives 0 — and a transition that never runs has
 * no end to wait for.
 */
function getTransitionTime(element: HTMLElement, property: string): number
{
	const view = element.ownerDocument.defaultView;
	if (view === null)
	{
		return 0;
	}

	const style = view.getComputedStyle(element);
	const durations = parseStyleList(style.transitionDuration);
	if (durations.length === 0)
	{
		return 0;
	}

	const delays = parseStyleList(style.transitionDelay);

	return parseStyleList(style.transitionProperty).reduce((time: number, name: string, index: number): number => {
		if (name !== property && name !== 'all')
		{
			return time;
		}

		const duration = parseStyleTime(durations[index % durations.length]);
		const delay = delays.length === 0 ? 0 : Math.max(parseStyleTime(delays[index % delays.length]), 0);

		return Math.max(time, duration + delay);
	}, 0);
}

function joinAnnouncementParts(parts: string[]): string
{
	return parts.reduce((announcement: string, part: string): string => {
		const piece = part.replaceAll(/\s+/g, ' ').trim();
		if (piece === '')
		{
			return announcement;
		}

		if (announcement === '')
		{
			return piece;
		}

		const separator = ANNOUNCEMENT_PART_END.test(announcement) ? ' ' : ANNOUNCEMENT_SEPARATOR;

		return `${announcement}${separator}${piece}`;
	}, '');
}

/**
 * Reads the balloon text the way it is laid out. Nodes in `skipped` — the action controls,
 * whose titles are announced as parts of their own — drop out, and two element siblings that
 * touch without whitespace, say two lines of DOM content, are parted by a space so that the
 * last word of one does not merge with the first word of the next.
 */
function readAnnouncementText(node: Node, skipped: Set<Node>): string
{
	if (skipped.has(node))
	{
		return '';
	}

	if (node.nodeType === Node.TEXT_NODE)
	{
		return node.nodeValue ?? '';
	}

	let text = '';
	let previousWasElement = false;

	node.childNodes.forEach((child: Node) => {
		const childText = readAnnouncementText(child, skipped);
		if (childText === '')
		{
			return;
		}

		const isElement = child.nodeType === Node.ELEMENT_NODE;
		if (isElement && previousWasElement && !/\s$/.test(text) && !/^\s/.test(childText))
		{
			text += ' ';
		}

		text += childText;
		previousWasElement = isElement;
	});

	return text;
}

// Fields and methods on Balloon are intentionally public (not `#private`) so that
// existing subclasses such as ui.notification-manager's BrowserNotification and
// intranet's PushInvitations — which write to `this.container`, `this.actions`,
// `this.animationClassName` and read `balloon.category` directly — keep working.
export class Balloon
{
	id: string;
	stack: Stack;
	state: StateValue = State.INIT;

	showOnTopWindow: boolean;
	announcement: string | false | null = null;
	announcementPoliteness: 'polite' | 'assertive' = 'polite';
	hasAnnounced = false;
	autofocus = false;
	hasFocusedActions = false;
	lastAnnouncementText: string | null = null;
	rerendering = false;
	focusedActionId: string | null = null;
	focusedActionIndex = -1;
	a11yBoundContainer: HTMLElement | null = null;
	pausedByHover = false;
	pausedByFocus = false;
	pausedByHidden = false;
	visibilityDocument: Document | null = null;
	visibilityChangeHandler: (() => void) | null = null;
	focusReturnTarget: HTMLElement | null = null;
	framedFocusOrigin: HTMLElement | null = null;
	focusOriginDocuments: Document[] = [];
	focusOriginHandlers: { focusin: (event: FocusEvent) => void, focusout: (event: FocusEvent) => void } | null = null;
	autofocusedElement: HTMLElement | null = null;
	container: HTMLElement | null = null;
	measuredHeight = 0;
	heightNeedsMeasurement = false;
	wasAppended = false;
	content: string | Element | null = null;
	actions: Action[] = [];
	animationClassName = 'ui-notification-balloon-animate';
	// The property the animation class switches, and the only one whose transition tells the
	// balloon that it has appeared or disappeared. The container transitions its place in the
	// stack at the same time — `left/top/right/bottom .5s` against `opacity .25s` — and that
	// transition ends with the balloon barely faded. A subclass animating something else of
	// its own names it here, next to its class.
	animationPropertyName = 'opacity';
	customRender: BalloonRender | null = null;
	category: string | null = null;

	autoHide = true;
	autoHideDelay = 8000;
	autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

	useAirDesign: boolean;
	data: Record<string, unknown> = {};
	testId: string | null = null;
	width: number | 'auto' = 400;

	closeButton: HTMLElement | null = null;
	closeButtonVisibility = true;

	constructor(options: BalloonOptions = {})
	{
		const opts = Type.isPlainObject(options) ? options : ({} as BalloonOptions);

		if (!(opts.stack instanceof Stack))
		{
			throw new TypeError("BX.UI.Notification.Balloon: 'stack' parameter is required.");
		}

		this.id = Type.isStringFilled(opts.id) ? (opts.id as string) : Text.getRandom(8).toLowerCase();
		this.stack = opts.stack;

		this.showOnTopWindow = opts.showOnTopWindow === true;
		this.useAirDesign = opts.useAirDesign === true;

		if (this.useAirDesign)
		{
			this.width = 339;
		}

		if (Type.isPlainObject(opts.events))
		{
			for (const [eventName, handler] of Object.entries(opts.events!))
			{
				this.addEvent(eventName, handler);
			}
		}

		this.setOptions(opts);
	}

	show(): void
	{
		// A balloon can be shown again while it is still closing: `Manager` keeps it in its
		// list until `onClose`, and that event comes only at the end of the closing animation,
		// so a `notify()` with the same id or category arriving in between lands on this very
		// object. The cleanup deferred to the end of `close()` then bails out on its own state
		// check and never runs. `show()` is the one door every appearance comes through — first
		// or repeated, after a finished close or an interrupted one — so the memory of the
		// previous appearance is dropped right here, and so is its node: everything below —
		// the announcement and the focus among it — reads the node, and the one a closing
		// balloon still holds belongs to the appearance it was leaving.
		if (this.getState() === State.CLOSING || this.getState() === State.CLOSED)
		{
			this.resetAppearanceState();
			this.refreshContent();
		}

		this.bindContainerHandlers();
		if (this.getState() === State.OPENING)
		{
			return;
		}

		if (this.getState() === State.OPEN)
		{
			this.activateAutoHide();

			return;
		}

		let firstLaunch = false;
		if (!this.getContainer().parentNode)
		{
			firstLaunch = !this.wasAppended;
			this.wasAppended = true;
			const target = this.showOnTopWindow ? window.top!.document.body : document.body;
			Dom.append(this.getContainer(), target);

			ZIndexManager.register(this.getContainer(), { alwaysOnTop: true });

			if (!this.getStack().contains(this))
			{
				this.getStack().add(this);
			}

			if (this.getState() === State.QUEUED)
			{
				this.detachContainer();

				return;
			}

			// The container is appended to the end of the body, which for a bottom-anchored
			// stack is the reverse of what the user sees: the stack puts it next to the
			// balloon it stands under, so the keyboard walks the notifications top to bottom.
			this.getStack().placeContainer(this);
		}

		// Only now, past the exit of a balloon that stays in the queue: the handlers below are
		// the ones the documents of the page pay for, and a balloon nobody can see has no use
		// for them.
		this.bindDocumentHandlers();

		const paused = this.getState() === State.PAUSED;
		this.setState(State.OPENING);
		this.adjustPosition();
		ZIndexManager.bringToFront(this.getContainer());

		if (!paused && !this.hasAnnounced)
		{
			this.hasAnnounced = true;
			this.announceBalloon();
		}

		this.animateIn(() => {
			if (this.getState() !== State.OPENING)
			{
				return;
			}

			this.setState(State.OPEN);
			this.focusFirstAction();

			if (firstLaunch)
			{
				this.fireEvent('onOpen');
			}

			if (!paused)
			{
				this.activateAutoHide();
			}
		});
	}

	/**
	 * Moves the focus to the first action of the balloon — once per show, and only where
	 * the consumer asked for it with the `autofocus` option.
	 *
	 * Moving the focus is a change of context the user did not ask for, and `show()` is
	 * shared with every subclass: a browser notification of a chat message would otherwise
	 * pull the focus out of the field the user is typing in. So the balloon takes the focus
	 * only on demand — and even then it never takes it from a field with a caret in it,
	 * because the text being typed is exactly what must not be lost.
	 */
	focusFirstAction(): void
	{
		if (this.hasFocusedActions)
		{
			return;
		}

		this.hasFocusedActions = true;
		if (!this.getAutofocus())
		{
			return;
		}

		const container = this.getContainer();
		const activeElement = getFocusedElement(container);
		if (containsFocus(container, activeElement) || InteractivityChecker.isTextInput(activeElement))
		{
			return;
		}

		const action = this.getActions().find((item) => {
			const element = item.getContainer();

			return container.contains(element)
				&& !InteractivityChecker.isDisabled(element)
				&& InteractivityChecker.isFocusable(element);
		});

		if (action)
		{
			// The balloon takes the focus itself, so it knows exactly where it takes it from:
			// this very element, read across the frame boundaries a moment ago.
			this.rememberFramedFocusOrigin(activeElement);
			this.focusElement(action.getContainer());
		}
	}

	/**
	 * Moves the focus inside the balloon and makes sure the ring is drawn there.
	 *
	 * The balloon takes the focus on its own, without the user pressing a key, and a
	 * browser keeps `:focus-visible` off after a pointer interaction. The ring would
	 * then appear only on the next Tab — one control further than where the focus
	 * actually is — which reads as if the balloon had skipped the first action.
	 * `focusVisible` asks the browser for the ring; the marker attribute draws the same
	 * ring through plain `:focus` where that option is not supported.
	 */
	focusElement(element: HTMLElement): void
	{
		this.clearAutofocusRing();
		this.autofocusedElement = element;
		Dom.attr(element, AUTOFOCUS_ATTRIBUTE, 'true');
		FocusNavigator.focusTarget(element, { preventScroll: true, focusVisible: true });
	}

	/**
	 * Drops the forced ring. Without a target it clears whatever is marked; with one it
	 * clears only when that very element is the marked one.
	 */
	clearAutofocusRing(target: EventTarget | null = null): void
	{
		if (this.autofocusedElement === null || (target !== null && target !== this.autofocusedElement))
		{
			return;
		}

		Dom.attr(this.autofocusedElement, AUTOFOCUS_ATTRIBUTE, null);
		this.autofocusedElement = null;
	}

	setAutofocus(autofocus: unknown): void
	{
		if (Type.isBoolean(autofocus))
		{
			this.autofocus = autofocus as boolean;
		}
	}

	getAutofocus(): boolean
	{
		return this.autofocus;
	}

	getAnnouncementText(): string
	{
		if (this.announcement === false)
		{
			return '';
		}

		if (this.announcement !== null)
		{
			return this.announcement;
		}

		const container = this.getContainer();
		const actionElements = new Set<Node>();
		const titles: string[] = [];

		this.getActions().forEach((action) => {
			// `action.container` and not `getContainer()`: an action a custom render never drew
			// has no element in the balloon and nothing to announce.
			const element = action.container;
			if (element === null || !container.contains(element))
			{
				return;
			}

			actionElements.add(element);
			titles.push(action.getTitle() ?? element.textContent ?? '');
		});

		return joinAnnouncementParts([readAnnouncementText(container, actionElements), ...titles]);
	}

	announceBalloon(): void
	{
		this.lastAnnouncementText = this.getAnnouncementText();
		announce(this.lastAnnouncementText, {
			document: getAnnouncerDocument(this.showOnTopWindow),
			politeness: this.announcementPoliteness,
		});
	}

	setOptions(options: BalloonOptions | null): void
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}

		const opts = options as BalloonOptions;
		if (Type.isString(opts.announce) || opts.announce === false)
		{
			this.announcement = opts.announce as string | false;
		}

		if (opts.announcePoliteness === 'polite' || opts.announcePoliteness === 'assertive')
		{
			this.announcementPoliteness = opts.announcePoliteness;
		}

		this.setAutofocus(opts.autofocus);

		this.setContent(opts.content);
		this.setWidth(opts.width);
		this.setData(opts.data);
		this.setTestId(opts.testId);
		this.setCloseButtonVisibility(opts.closeButton);
		this.setActions(opts.actions);
		this.setCategory(opts.category ?? undefined);
		this.setAutoHide(opts.autoHide);
		this.setCustomRender(opts.render);
		this.setAutoHideDelay(opts.autoHideDelay);
	}

	update(options: BalloonOptions | null): void
	{
		// The redraw draws into the node the balloon holds and leaves a balloon without one
		// alone, so an update of a balloon whose node is gone builds the node first.
		this.getContainer();

		const previousText = this.lastAnnouncementText ?? this.getAnnouncementText();
		this.setOptions(options);
		this.deactivateAutoHide();

		this.refreshContent();

		this.resumeAutoHide();
		if (this.hasAnnounced && this.getAnnouncementText() !== previousText)
		{
			this.announceBalloon();
		}
	}

	/**
	 * Draws the balloon anew from the options it holds right now.
	 *
	 * The node of a balloon matches its options only until the next `setOptions()`, and
	 * `Manager.notify()` applies the new options before anything is drawn. A balloon that
	 * finished closing builds its node from scratch — `close()` drops it and `getContainer()`
	 * renders it again — but one caught in `CLOSING` keeps the node of the appearance it was
	 * leaving, and a plain `setOptions()` leaves it there: the message is the old one, and the
	 * action elements are the old ones too, while `this.actions` already holds new objects with
	 * no element of their own. Reading it gives the previous notification to the reader, and
	 * searching it for a new action to focus finds nothing.
	 *
	 * Redrawing is what `update()` does on every repeated notification, so it asks nothing new
	 * of the consumers: `render()` is called exactly as they overrode it, a DOM node passed as
	 * `content` is moved into the fresh message, and the action elements and the close button
	 * are the same nodes with the same handlers still on them. What the redraw does throw away
	 * are the nodes of actions that no longer exist — which is the point.
	 *
	 * And the focus, if the user is inside. The redraw is the same redraw wherever it is
	 * called from, so it carries the focus over itself rather than leaving that to the caller:
	 * a balloon revived out of `CLOSING` is redrawn by `show()`, and the user may well be in
	 * it — the focus that walked in while it was closing is remembered nowhere, because
	 * `handleFocusIn()` leaves early in `CLOSING`. The control the focus is on has either a
	 * counterpart in the new markup — the same action, or the close button — or none at all,
	 * and then the focus goes back to whoever opened the balloon, the way a close returns it.
	 * Anywhere but on `<body>`, where the keyboard would have nothing left to walk from.
	 */
	refreshContent(): void
	{
		const container = this.container;
		if (container === null)
		{
			return;
		}

		const hadFocus = container.contains(container.ownerDocument.activeElement);
		const action = hadFocus ? this.findFocusedAction(this.focusedActionId, this.focusedActionIndex) : null;
		const focusTarget = hadFocus
			? (action?.getContainer() ?? (this.isCloseButtonVisible() ? this.getCloseButton() : null))
			: null;

		// The focus moves below are the balloon's own doing, not the user's: `handleFocusIn()`
		// and `handleFocusOut()` step aside while the flag is up, so the pause the user's focus
		// put on the auto hide survives the redraw. The previous value is put back rather than
		// the flag dropped, in case a caller is already holding it up around this redraw.
		const rerendering = this.rerendering;
		this.rerendering = true;
		try
		{
			if (hadFocus && focusTarget === null)
			{
				this.restoreFocusOnClose();
				this.pausedByFocus = false;
			}

			Dom.clean(container);
			Dom.append(this.render(), container);

			if (focusTarget !== null)
			{
				this.focusElement(focusTarget);
				this.rememberFocusedAction(action);
			}
		}
		finally
		{
			this.rerendering = rerendering;
		}

		this.heightNeedsMeasurement = !container.isConnected;
	}

	/**
	 * Finds the action the focus has to come back to after a redraw.
	 *
	 * `Manager.notify()` applies the new options — and with them rebuilds every action —
	 * before `update()` runs, so by then the focused action object is gone in the ordinary
	 * «the same notification once again» flow. An id the consumer gave survives that rebuild
	 * and is matched first; an id the action generated for itself does not, and then the only
	 * thing that still carries the meaning of the action is its place in the row.
	 */
	findFocusedAction(id: string | null, index: number): Action | null
	{
		if (id !== null)
		{
			return this.getAction(id);
		}

		return index < 0 ? null : (this.getActions()[index] ?? null);
	}

	/**
	 * The place of the control the focus is on among the action controls as they are drawn
	 * right now — or -1 when the focus is not on one of them.
	 *
	 * The balloon recognises an action by the object behind its control, and there is one
	 * window where no such object is left: `Manager.notify()` applies the new options — and
	 * with them a whole new set of `Action`s, whose controls are not built yet — while the
	 * markup is redrawn only a `blink()` later, some four hundred milliseconds on. A `focusin`
	 * arriving in between — a Tab from one action to the next, in markup that is still the old
	 * one — matches nothing, and forgetting the position there is exactly what P4 was made to
	 * prevent: the redraw would have nowhere to put the focus back and would send it to the
	 * close button, or right out of the balloon where the close button is hidden.
	 *
	 * What the markup does still say is the place, and the place is what carries the meaning
	 * of an action across a rebuild anyway — `findFocusedAction()` falls back to the index for
	 * every id an action generated for itself. The id is not read from the markup because it
	 * is not there: nothing writes it into the control.
	 *
	 * The anchor is the class of the control and not the row element around it. A consumer
	 * overriding `render()` — ui.notification-manager's BrowserNotification, intranet's
	 * PushInvitations — lays the controls out as it likes and may have no row at all, but it
	 * appends the very elements `Action.getContainer()` built, and those always carry the
	 * class. Counting children of the row would also count whatever else a custom render put
	 * there, and would answer for a control that is not an action at all.
	 */
	findRenderedActionIndex(target: EventTarget | null): number
	{
		const container = this.container;
		if (container === null || !Type.isElementNode(target))
		{
			return -1;
		}

		const element = (target as Element).closest(`.${ACTION_CLASS_NAME}`);
		if (element === null || !container.contains(element))
		{
			return -1;
		}

		return [...container.querySelectorAll(`.${ACTION_CLASS_NAME}`)].indexOf(element);
	}

	rememberFocusedAction(action: Action | null): void
	{
		this.focusedActionIndex = action === null ? -1 : this.getActions().indexOf(action);
		this.focusedActionId = action !== null && !action.hasGeneratedId() ? action.getId() : null;
	}

	close(): void
	{
		const startState = this.getState();
		if (startState === State.CLOSING || startState === State.CLOSED)
		{
			return;
		}

		this.setState(State.CLOSING);
		this.deactivateAutoHide();
		this.unbindDocumentHandlers();
		this.restoreFocusOnClose();
		this.clearAutofocusRing();

		const finalize = () => {
			if (this.getState() !== State.CLOSING)
			{
				return;
			}

			this.setState(State.CLOSED);

			this.detachContainer();
			this.container = null;
			this.a11yBoundContainer = null;
			this.wasAppended = false;
			this.measuredHeight = 0;
			this.heightNeedsMeasurement = false;
			this.resetAppearanceState();

			this.fireEvent('onClose');
		};

		if (startState === State.OPENING || !this.getContainer().isConnected)
		{
			finalize();
		}
		else
		{
			this.animateOut(() => finalize());
		}
	}

	/**
	 * Forgets everything the balloon remembered about the appearance that has just ended.
	 *
	 * `show()` after `close()` is a supported contract, and the node is built anew, so the
	 * memory of the previous appearance has to go with it. The pauses matter most: a balloon
	 * closed by Escape keeps the focus pause — `handleFocusOut()` leaves early once the state
	 * is `CLOSING` — and `activateAutoHide()` would never start a timer again.
	 *
	 * `pausedByHidden` is not here on purpose: it describes the tab, not the appearance, and
	 * `bindVisibilityHandler()` recomputes it from `document.hidden` for the new one.
	 */
	resetAppearanceState(): void
	{
		this.pausedByHover = false;
		this.pausedByFocus = false;
		this.hasAnnounced = false;
		this.lastAnnouncementText = null;
		this.hasFocusedActions = false;
		this.focusedActionId = null;
		this.focusedActionIndex = -1;
		this.focusReturnTarget = null;
		this.framedFocusOrigin = null;
		this.clearAutofocusRing();
	}

	blink(): void
	{
		this.animateOut(() => {
			setTimeout(() => {
				this.update(null);
				this.animateIn(() => {});
			}, 200);
		});
	}

	adjustPosition(): void
	{
		if (this.getStack().isNewestOnTop())
		{
			this.getStack().adjustPosition();
		}
		else
		{
			this.getStack().adjustPosition(this);
		}
	}

	getId(): string
	{
		return this.id;
	}

	getCloseButton(): HTMLElement
	{
		if (this.closeButton !== null)
		{
			return this.closeButton;
		}

		this.closeButton = Tag.render`<button type="button" class="ui-notification-balloon-close-btn" aria-label="${Loc.getMessage('UI_NOTIFICATION_BALLOON_CLOSE')}"></button>`;
		Event.bind(this.closeButton!, 'click', () => this.handleCloseBtnClick());

		return this.closeButton!;
	}

	setCloseButtonVisibility(visibility: unknown): void
	{
		this.closeButtonVisibility = visibility !== false;
	}

	isCloseButtonVisible(): boolean
	{
		return this.closeButtonVisibility;
	}

	getContent(): string | Element | null
	{
		return this.content;
	}

	setContent(content: unknown): void
	{
		if (Type.isString(content) || Type.isDomNode(content))
		{
			this.content = content as string | Element;
		}
	}

	getWidth(): number | 'auto'
	{
		return this.width;
	}

	setWidth(width: unknown): void
	{
		if (Type.isNumber(width) || width === 'auto')
		{
			this.width = width as number | 'auto';
		}
	}

	getZIndex(): number
	{
		const component = ZIndexManager.getComponent(this.getContainer());

		return component ? component.getZIndex() : 0;
	}

	/**
	 * @deprecated
	 */
	setZIndex(_zIndex: number): void
	{
		// Intentionally a no-op for backward compatibility.
	}

	getHeight(): number
	{
		const container = this.getContainer();
		if (container.isConnected)
		{
			this.measuredHeight = container.offsetHeight;
			this.heightNeedsMeasurement = false;
		}
		else if (this.heightNeedsMeasurement)
		{
			const originalStyle = container.getAttribute('style');
			const wasInert = container.inert;
			Dom.style(container, 'visibility', 'hidden');
			container.inert = true;
			try
			{
				Dom.append(container, container.ownerDocument.body);
				this.measuredHeight = container.offsetHeight;
				this.heightNeedsMeasurement = false;
			}
			finally
			{
				Dom.remove(container);
				Dom.attr(container, 'style', originalStyle);
				container.inert = wasInert;
			}
		}

		return this.measuredHeight;
	}

	detachContainer(): void
	{
		const container = this.getContainer();
		if (container.isConnected)
		{
			this.getHeight();
			ZIndexManager.unregister(container);
		}

		// The balloon is leaving the page — by a close, or by going back into the queue. The
		// documents around it have nothing to tell it any more, and keeping them keeps the
		// documents of frames that may already be gone.
		this.unbindDocumentHandlers();

		Dom.remove(container);
	}

	getCategory(): string | null
	{
		return this.category;
	}

	setCategory(category: unknown): void
	{
		if (Type.isStringFilled(category) || category === null)
		{
			this.category = category as string | null;
		}
	}

	setActions(actions: unknown): void
	{
		if (Type.isArray(actions))
		{
			this.actions = [];
			(actions as Array<Record<string, unknown>>).forEach((action) => {
				this.actions.push(new Action(this, action));
			});
		}
		else if (actions === null)
		{
			this.actions = [];
		}
	}

	getActions(): Action[]
	{
		return this.actions;
	}

	getAction(id: string): Action | null
	{
		for (const action of this.actions)
		{
			if (action.getId() === id)
			{
				return action;
			}
		}

		return null;
	}

	setTestId(testId: unknown): void
	{
		if (!Type.isStringFilled(testId))
		{
			return;
		}

		this.testId = testId as string;

		if (this.container !== null)
		{
			Dom.attr(this.container, 'data-testid', this.testId);
		}
	}

	getTestId(): string | null
	{
		return this.testId;
	}

	getContainer(): HTMLElement
	{
		if (this.container !== null)
		{
			return this.container;
		}

		this.container = Tag.render`<div class="ui-notification-balloon" data-a11y-ignore-inert="true"></div>`;

		if (this.testId !== null)
		{
			Dom.attr(this.container!, 'data-testid', this.testId);
		}

		Dom.append(this.render(), this.container!);
		Event.bind(this.container!, 'mouseenter', () => this.handleMouseEnter());
		Event.bind(this.container!, 'mouseleave', () => this.handleMouseLeave());

		return this.container!;
	}

	render(): HTMLElement
	{
		const customRender = this.getCustomRender();
		if (customRender !== null)
		{
			return customRender.call(this, this);
		}

		const content = this.getContent();
		const width = this.getWidth();
		const widthStyle = Type.isNumber(width) ? `${width}px` : width;

		const message: HTMLElement = Type.isDomNode(content)
			? Tag.render`<div class="ui-notification-balloon-message"></div>`
			: Tag.render`<div class="ui-notification-balloon-message">${content ?? ''}</div>`;

		if (Type.isDomNode(content))
		{
			Dom.append(content as HTMLElement, message);
		}

		const actionsContainer: HTMLElement = Tag.render`<div class="ui-notification-balloon-actions"></div>`;
		this.getActions().forEach((action) => Dom.append(action.getContainer(), actionsContainer));

		const wrapper: HTMLElement = Tag.render`<div class="ui-notification-balloon-content"></div>`;
		Dom.style(wrapper, 'width', widthStyle as string);
		Dom.append(message, wrapper);
		Dom.append(actionsContainer, wrapper);

		if (this.isCloseButtonVisible())
		{
			Dom.append(this.getCloseButton(), wrapper);
		}

		return wrapper;
	}

	setCustomRender(render: unknown): void
	{
		if (Type.isFunction(render))
		{
			this.customRender = render as BalloonRender;
		}
	}

	getCustomRender(): BalloonRender | null
	{
		return this.customRender;
	}

	getStack(): Stack
	{
		return this.stack;
	}

	setState(state: unknown): void
	{
		const code = this.getStateCode(state as StateValue);
		if (code !== null)
		{
			this.state = state as StateValue;
		}
	}

	getState(): StateValue
	{
		return this.state;
	}

	getStateCode(mode: unknown): string | null
	{
		const entry = Object.entries(State).find(([, value]) => value === mode);

		return entry ? entry[0] : null;
	}

	activateAutoHide(): void
	{
		if (!this.getAutoHide() || this.pausedByHover || this.pausedByFocus || this.pausedByHidden
			|| (this.getState() === State.QUEUED || this.getState() === State.CLOSING || this.getState() === State.CLOSED))
		{
			return;
		}

		this.deactivateAutoHide();

		this.autoHideTimeout = setTimeout(() => this.close(), this.getAutoHideDelay());
	}

	deactivateAutoHide(): void
	{
		if (this.autoHideTimeout !== null)
		{
			clearTimeout(this.autoHideTimeout);
			this.autoHideTimeout = null;
		}
	}

	setAutoHide(autoHide: unknown): void
	{
		this.autoHide = autoHide !== false;
	}

	getAutoHide(): boolean
	{
		return this.autoHide && Extension.getSettings('ui.notification').get('autoHide', true) !== false;
	}

	setAutoHideDelay(delay: unknown): void
	{
		if (Type.isNumber(delay) && (delay as number) > 0)
		{
			this.autoHideDelay = delay as number;
		}
	}

	getAutoHideDelay(): number
	{
		const delay = Math.max(this.autoHideDelay, this.getActions().length > 0 ? ACTION_MIN_AUTO_HIDE_DELAY : 0);
		const configuredFactor = Extension.getSettings('ui.notification').get('autoHideDelayFactor', 1);
		const factor = Type.isNumber(configuredFactor) && Number.isFinite(configuredFactor) && configuredFactor > 0
			? configuredFactor
			: 1;

		return delay * factor;
	}

	/**
	 * Brings the balloon in and reports back once it is there.
	 *
	 * The report is what turns the balloon into an open one: the state becomes `OPEN`, the
	 * auto hide starts counting and the focus moves inside. All three assume the user can see
	 * what they are given, so the callback waits for the transition that actually ends with
	 * the balloon on the screen — the one whose end finds the animation class in place.
	 *
	 * A balloon revived out of `CLOSING` has a transition of its own already running, and
	 * `Manager.notify()` follows `show()` with `blink()`, which takes the class off again in
	 * the same tick: the closing half is never interrupted and its `transitionend` arrives
	 * first, with the balloon invisible and a redraw still ahead of it. That is not the end of
	 * an appearance, so it is passed over and the handler keeps waiting — for the fade-in
	 * `blink()` runs once it has redrawn the balloon. A `transitionend` of a nested control
	 * (an action colouring its underline under the pointer) is not this balloon's appearance
	 * either, and only bubbled up to the container; neither is the end of the move the balloon
	 * makes when the stack shifts under it — `runTransition()` keeps them all out.
	 */
	animateIn(callback: () => void): void
	{
		const container = this.getContainer();
		if (Dom.hasClass(container, this.animationClassName))
		{
			callback();

			return;
		}

		this.runTransition(
			container,
			() => {
				Dom.addClass(container, this.animationClassName);

				if (this.useAirDesign === true)
				{
					// Preserve the original (pre-migration) class names including the em-dash
					// in '—ui-context-content-dark' — changing it would alter visual styling.
					Dom.addClass(container, ['--air', '—ui-context-content-dark']);
				}
			},
			() => Dom.hasClass(container, this.animationClassName),
			callback,
		);
	}

	/**
	 * Takes the balloon out and reports back at the end of the transition.
	 *
	 * Unlike `animateIn()`, the report is not tied to the balloon being gone: it is what
	 * finalizes the close — which checks the state of its own and bails out of a close that
	 * was called off — and what lets `blink()` redraw the balloon. Both have to happen even
	 * when the disappearance was turned back into an appearance halfway, so the first end of
	 * the container's own fade is the report — of the fade, and not of the move the balloon
	 * makes when the stack shifts under it, which would finalize the close early.
	 */
	animateOut(callback: () => void): void
	{
		const container = this.getContainer();
		if (!Dom.hasClass(container, this.animationClassName))
		{
			callback();

			return;
		}

		this.runTransition(
			container,
			() => Dom.removeClass(container, this.animationClassName),
			() => true,
			callback,
		);
	}

	/**
	 * Starts the transition and reports its end — reports it even where that end never comes.
	 *
	 * `transitionend` is the accurate signal and stays the first one: of everything that
	 * reaches the container only the balloon's own transition of `animationPropertyName` is
	 * taken, and `isEnd()` tells the half of it that ends where the caller is waiting. But the
	 * event is not promised. A class taken off and put back inside one tick — a `close()` met
	 * by the `notify({ blinkOnUpdate: false })` of the same notification — leaves the computed
	 * style exactly as it was, so no transition ever starts; a tab in the background animates
	 * nothing either. What follows the report is the whole life of the balloon — `OPEN` with
	 * its auto hide and its focus, or the cleanup at the end of `close()` — and it cannot be
	 * left hanging on an event that may not exist.
	 *
	 * So the wait is also timed, by the transition the browser computed for this very element
	 * rather than by a number kept here, and nothing to wait for at all is reported at once.
	 * Where the timer finds the balloon on its way somewhere else — `isEnd()` is false because
	 * the class changed again, as it does when `blink()` fades the balloon out and back in —
	 * a transition really is running and only its end is the one to report, so the timer steps
	 * aside and leaves the event to it. Whichever comes first, the callback runs exactly once.
	 */
	runTransition(container: HTMLElement, startTransition: () => void, isEnd: () => boolean, callback: () => void): void
	{
		let reported = false;
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const report = (): void => {
			if (reported)
			{
				return;
			}

			reported = true;
			if (timeout !== null)
			{
				clearTimeout(timeout);
				timeout = null;
			}

			callback();
		};

		const handleTransitionEnd = (event: TransitionEvent): void => {
			if (event.target !== container || event.propertyName !== this.animationPropertyName || !isEnd())
			{
				return;
			}

			Event.unbind(container, 'transitionend', handleTransitionEnd);
			report();
		};

		const finishWaiting = (): void => {
			timeout = null;
			if (!isEnd())
			{
				return;
			}

			Event.unbind(container, 'transitionend', handleTransitionEnd);
			report();
		};

		Event.bind(container, 'transitionend', handleTransitionEnd);

		startTransition();

		const time = getTransitionTime(container, this.animationPropertyName);
		if (time <= 0)
		{
			finishWaiting();

			return;
		}

		timeout = setTimeout(finishWaiting, time + TRANSITION_END_GRACE_MS);
	}

	handleCloseBtnClick(): void
	{
		this.close();
	}

	bindAccessibilityHandlers(): void
	{
		this.bindDocumentHandlers();
		this.bindContainerHandlers();
	}

	/**
	 * The handlers of the node of the balloon itself.
	 *
	 * They cost nothing while the node is off the page — nothing dispatches an event to it
	 * there — so they are bound as soon as the node exists and live as long as it does.
	 */
	bindContainerHandlers(): void
	{
		const container = this.getContainer();
		if (this.a11yBoundContainer === container)
		{
			return;
		}

		this.a11yBoundContainer = container;
		Event.bind(container, 'focusin', (event: FocusEvent) => this.handleFocusIn(event));
		Event.bind(container, 'focusout', (event: FocusEvent) => this.handleFocusOut(event));
		Event.bind(container, 'keydown', (event: KeyboardEvent) => this.handleContainerKeyDown(event));
	}

	/**
	 * The handlers of the documents around the balloon: the tab being hidden and the focus
	 * moving anywhere on the page.
	 *
	 * Unlike the ones on the node these are global — every balloon that has them pays on every
	 * focus move of the whole page, and keeps a reference to every document it listens to — so
	 * they are bound only while the balloon is really on the screen, and dropped in
	 * `detachContainer()` the moment it leaves it. A balloon waiting in the queue is not on the
	 * screen: `show()` takes its node off the page and returns before this, and a batch of
	 * notifications — a mass action, an import — keeps a couple of dozen of them waiting for
	 * the whole drain of the queue, which is tens of seconds.
	 */
	bindDocumentHandlers(): void
	{
		this.bindVisibilityHandler();
		this.bindFocusOriginWatcher();
	}

	unbindDocumentHandlers(): void
	{
		this.unbindVisibilityHandler();
		this.unbindFocusOriginWatcher();
	}

	bindVisibilityHandler(): void
	{
		const doc = this.getContainer().ownerDocument;
		if (this.visibilityDocument === doc)
		{
			return;
		}

		this.unbindVisibilityHandler();
		this.visibilityDocument = doc;
		this.pausedByHidden = doc.hidden;
		this.visibilityChangeHandler ??= () => this.handleVisibilityChange();
		Event.bind(doc, 'visibilitychange', this.visibilityChangeHandler);
	}

	/**
	 * Remembers the control the focus is about to leave — but only one living in another
	 * document of the page.
	 *
	 * Within one document nothing has to be remembered: `focusin` of the balloon names the
	 * element the focus came from itself. Across a frame boundary there is nothing to read —
	 * the event carries null, and by the time it arrives the element it came from is not the
	 * focused one any more, nor is its document the focused one. So the answer is written
	 * down while it is still true: at the moment the focus is leaving, not after it has left.
	 */
	rememberFramedFocusOrigin(element: HTMLElement | null): void
	{
		if (Type.isElementNode(element) && element.ownerDocument !== this.getContainer().ownerDocument)
		{
			this.framedFocusOrigin = element;
		}
	}

	/**
	 * Watches the focus leaving the documents around the balloon.
	 *
	 * The balloon moving the focus to itself is one way in, and there it remembers the way back
	 * on its own (`focusFirstAction()`). The user is the other: a Tab out of a frame and a click
	 * on a control of the balloon both arrive as a `focusin` with no `relatedTarget`, and by then
	 * neither the event nor the state of the page says where the user came from. It is said once,
	 * and in time, in one place only — the `focusout` of the document the focus is leaving. A
	 * document holding a frame stays silent about it: the focus walking out of a frame is
	 * announced by the document of that frame alone, and the one above it hears nothing at all.
	 *
	 * So the balloon listens where the focus can be: in its own document and in every document
	 * above it — that covers a balloon inside a frame the user tabs into from the page — and in
	 * the document the focus is in at the moment of binding, frames of the page included. A frame
	 * the focus walks into later announces itself on the way: its `<iframe>` element takes the
	 * focus in the document above, and that is where its own document is picked up from.
	 */
	bindFocusOriginWatcher(): void
	{
		const documents = getDocumentChain(this.getContainer());
		const focused = getFocusedElement(this.getContainer());
		if (focused !== null)
		{
			getDocumentChain(focused).forEach((doc: Document) => documents.push(doc));
		}

		documents.forEach((doc: Document) => this.watchFocusOriginDocument(doc));
	}

	watchFocusOriginDocument(doc: Document): void
	{
		// Every new document comes through here, so this is where the list is kept honest:
		// a frame the user visits is taken into it, and the frames that are gone by then go
		// out. Without it the list only grows — a `focusin` on an `<iframe>` adds a document
		// and two more subscriptions, and nothing ever took one back before `close()`.
		this.releaseDeadFocusOriginDocuments();

		if (this.focusOriginDocuments.includes(doc) || !isLiveDocument(doc))
		{
			return;
		}

		this.focusOriginHandlers ??= {
			focusin: (event: FocusEvent) => this.handleDocumentFocusIn(event),
			focusout: (event: FocusEvent) => this.handleDocumentFocusOut(event),
		};

		this.focusOriginDocuments.push(doc);
		Event.bind(doc, 'focusin', this.focusOriginHandlers.focusin);
		Event.bind(doc, 'focusout', this.focusOriginHandlers.focusout);
	}

	/**
	 * Lets go of the documents of the frames that are no longer on the page.
	 *
	 * The element the balloon has to give the focus back to is not touched: it may well live
	 * in a document that has just died, and that is a case of its own — `canReceiveFocus()`
	 * sees it and falls back to the focus monitor. It is one element, and it goes away with
	 * the balloon; what must not pile up is the list of documents.
	 */
	releaseDeadFocusOriginDocuments(): void
	{
		if (this.focusOriginDocuments.every((doc: Document) => isLiveDocument(doc)))
		{
			return;
		}

		const handlers = this.focusOriginHandlers;
		this.focusOriginDocuments = this.focusOriginDocuments.filter((doc: Document) => {
			if (isLiveDocument(doc))
			{
				return true;
			}

			if (handlers !== null)
			{
				Event.unbind(doc, 'focusin', handlers.focusin);
				Event.unbind(doc, 'focusout', handlers.focusout);
			}

			return false;
		});
	}

	unbindFocusOriginWatcher(): void
	{
		const handlers = this.focusOriginHandlers;
		if (handlers !== null)
		{
			this.focusOriginDocuments.forEach((doc: Document) => {
				Event.unbind(doc, 'focusin', handlers.focusin);
				Event.unbind(doc, 'focusout', handlers.focusout);
			});
		}

		this.focusOriginDocuments = [];
	}

	/**
	 * Picks up the document of a frame the focus has just walked into — the only place its
	 * own `focusout` will ever be announced.
	 */
	handleDocumentFocusIn(event: FocusEvent): void
	{
		const target = event.target as HTMLElement;
		if (!Type.isElementNode(target) || target.tagName !== 'IFRAME')
		{
			return;
		}

		const framedDocument = (target as HTMLIFrameElement).contentDocument;
		if (framedDocument !== null)
		{
			this.watchFocusOriginDocument(framedDocument);
		}
	}

	handleDocumentFocusOut(event: FocusEvent): void
	{
		this.rememberFramedFocusOrigin(resolveFocusOrigin(event.target));
	}

	unbindVisibilityHandler(): void
	{
		if (this.visibilityDocument !== null && this.visibilityChangeHandler !== null)
		{
			Event.unbind(this.visibilityDocument, 'visibilitychange', this.visibilityChangeHandler);
		}

		this.visibilityDocument = null;
	}

	handleVisibilityChange(): void
	{
		this.pausedByHidden = this.visibilityDocument?.hidden === true;
		if (this.pausedByHidden)
		{
			this.deactivateAutoHide();
		}
		else
		{
			this.resumeAutoHide();
		}
	}

	handleFocusIn(event: FocusEvent): void
	{
		if (this.rerendering || this.getState() === State.CLOSING || this.getState() === State.CLOSED)
		{
			return;
		}

		const action = this.getActions().find((item) => {
			// `item.container` and not `getContainer()`: an action whose control is not built
			// yet cannot be the one the focus is on, and asking would build it for nothing.
			return item.container !== null && item.container.contains(event.target as Node);
		}) ?? null;

		if (action === null)
		{
			// Nothing of the balloon's own is behind the control the focus is on: either it is
			// not an action at all — the close button, a link in the message — and then the
			// position is rightly forgotten, or the markup is a redraw behind the actions and
			// the place is all that is left of it. See `findRenderedActionIndex()`.
			this.focusedActionId = null;
			this.focusedActionIndex = this.findRenderedActionIndex(event.target);
		}
		else
		{
			this.rememberFocusedAction(action);
		}

		if (Type.isDomNode(event.relatedTarget) && this.getContainer().contains(event.relatedTarget as Node))
		{
			return;
		}

		// Where the focus came from. Within one document the event names it; across a frame
		// boundary it carries null — there the answer is the one written down while the focus
		// was still there, see `rememberFramedFocusOrigin()`.
		this.focusReturnTarget = Type.isElementNode(event.relatedTarget)
			? event.relatedTarget as HTMLElement
			: this.framedFocusOrigin;
		this.pausedByFocus = true;
		this.deactivateAutoHide();
	}

	handleFocusOut(event: FocusEvent): void
	{
		if (this.rerendering || this.getState() === State.CLOSING || this.getState() === State.CLOSED)
		{
			return;
		}

		// The forced ring belongs to the control the balloon focused itself: once the
		// user moves on — even to the next control of the same balloon — it goes away.
		this.clearAutofocusRing(event.target);

		if (Type.isDomNode(event.relatedTarget) && this.getContainer().contains(event.relatedTarget as Node))
		{
			return;
		}

		this.pausedByFocus = false;
		this.resumeAutoHide();
	}

	resumeAutoHide(): void
	{
		this.activateAutoHide();
	}

	/**
	 * Closes the balloon on Escape — everywhere but in a field with a caret in it.
	 *
	 * In a text field Escape belongs to the field: it cancels the input, closes the
	 * autocomplete of the browser, and the consumer decides what to do with it. The quick
	 * reply field of the browser notification of ui.notification-manager decides exactly
	 * that on `keyup` — it closes the notification only while the field is empty
	 * (views/browser-notification/browser-notification.js:315). `keydown` runs first, so
	 * a balloon that closes here takes the answer being typed with it, and the `keyup` of
	 * the consumer never arrives at all: by then the field is gone and the focus is back
	 * on the opener. `isTextInput` covers `<input>` of a text type, `<textarea>` and
	 * anything `contenteditable` — a custom editor included, since those are built on one
	 * of the three. `isEditable` of the same checker is wider — a `<select>` too — but a
	 * select has nothing to cancel: while its list is open the browser keeps the key to
	 * itself, and while it is closed Escape means the balloon.
	 */
	handleContainerKeyDown(event: KeyboardEvent): void
	{
		if (
			event.key !== 'Escape'
			|| InteractivityChecker.isTextInput(event.target as HTMLElement)
			|| (this.getState() === State.CLOSING || this.getState() === State.CLOSED)
		)
		{
			return;
		}

		this.close();
		if ((this.getState() === State.CLOSING || this.getState() === State.CLOSED))
		{
			event.preventDefault();
			event.stopPropagation();
		}
	}

	restoreFocusOnClose(): void
	{
		const container = this.getContainer();
		if (!container.contains(container.ownerDocument.activeElement))
		{
			return;
		}

		if (this.focusReturnTarget !== null && canReceiveFocus(this.focusReturnTarget))
		{
			this.focusReturnTarget.focus({ preventScroll: true });

			return;
		}

		const wasInert = container.inert;
		container.inert = true;
		try
		{
			FocusMonitor.Instance.restoreFocus();
		}
		finally
		{
			container.inert = wasInert;
		}
	}

	handleMouseEnter(): void
	{
		this.fireEvent('onMouseEnter');
		if ((this.getState() === State.QUEUED || this.getState() === State.CLOSING || this.getState() === State.CLOSED))
		{
			return;
		}

		this.pausedByHover = true;
		this.deactivateAutoHide();
		this.setState(State.PAUSED);
		this.show();
	}

	handleMouseLeave(): void
	{
		this.fireEvent('onMouseLeave');
		this.pausedByHover = false;
		this.resumeAutoHide();
	}

	fireEvent(eventName: string): NotificationEvent
	{
		const event = this.getEvent(eventName);
		onCustomEvent(this, event.getFullName(), [event]);

		return event;
	}

	addEvent(eventName: string, fn: BalloonEventHandler): void
	{
		if (Type.isFunction(fn))
		{
			addCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
		}
	}

	removeEvent(eventName: string, fn: BalloonEventHandler): void
	{
		if (Type.isFunction(fn))
		{
			removeCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
		}
	}

	getEvent(eventName: string): NotificationEvent
	{
		const event = new NotificationEvent();
		event.setBalloon(this);
		event.setName(eventName);

		return event;
	}

	getData(): Record<string, unknown>
	{
		return this.data;
	}

	setData(data: unknown): void
	{
		if (Type.isPlainObject(data))
		{
			this.data = data as Record<string, unknown>;
		}
	}
}
