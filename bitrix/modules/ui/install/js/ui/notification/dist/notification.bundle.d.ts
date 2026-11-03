/* eslint-disable */
type PositionValue = typeof BX.UI.Notification.Position[keyof typeof BX.UI.Notification.Position];

type BalloonConstructor = new (options: BalloonOptions) => BX.UI.Notification.Balloon;

type BalloonOptions = {
	stack?: BX.UI.Notification.Stack;
	id?: string;
	content?: string | Element;
	autoHide?: boolean;
	autoHideDelay?: number;
	showOnTopWindow?: boolean;
	announce?: string | false;
	announcePoliteness?: 'polite' | 'assertive';
	autofocus?: boolean;
	closeButton?: boolean;
	category?: string | null;
	actions?: ActionOptions[] | null;
	render?: BalloonRender;
	width?: number | 'auto';
	data?: Record<string, unknown>;
	testId?: string;
	events?: Record<string, BalloonEventHandler>;
	useAirDesign?: boolean;
};

type ActionOptions = {
	id?: string;
	href?: string;
	title?: string;
	testId?: string;
	events?: Record<string, (event: Event, balloon: BX.UI.Notification.Balloon, action: BX.UI.Notification.Action) => void>;
};

type StateValue = typeof BX.UI.Notification.State[keyof typeof BX.UI.Notification.State];

type DomEventHandler = (event: globalThis.Event) => void;

type BalloonRender = (balloon: BX.UI.Notification.Balloon) => HTMLElement;

type BalloonEventHandler = (event: BX.UI.Notification.NotificationEvent) => void;

type StackOptions = {
	id?: string;
	position?: PositionValue | string;
	spacing?: number;
	offsetX?: number;
	offsetY?: number;
	newestOnTop?: boolean;
	balloonType?: string | (new (options: BalloonOptions) => BX.UI.Notification.Balloon);
};

type NotifyOptions = BalloonOptions & {
	position?: PositionValue | string;
	type?: string;
	blinkOnUpdate?: boolean;
};

declare namespace BX.UI.Notification {
	class Manager {
		stacks: Record<string, Stack>;
		balloons: Record<string, Balloon>;
		balloonDefaults: Partial<BalloonOptions>;
		stackDefaults: Partial<StackOptions>;
		defaultPosition: PositionValue | string;
		constructor();
		notify(options: NotifyOptions): Balloon | undefined;
		getBalloonById(balloonId: string): Balloon | null;
		getBalloonByCategory(category: string): Balloon | null;
		removeBalloon(balloon: Balloon): void;
		handleBalloonClose(event: NotificationEvent): void;
		getStack(stackId: string): Stack | null;
		getDefaultStack(): Stack;
		getStackByPosition(position: string): Stack;
		addStack(stack: Stack): void;
		setBalloonDefaults(options: BalloonOptions): void;
		getBalloonDefaults(): Partial<BalloonOptions>;
		setStackDefaults(position: unknown, options?: StackOptions): void;
		setDefaultPosition(position: string): void;
		getDefaultPosition(): PositionValue | string;
		getStackDefaults(): Partial<StackOptions>;
	}

	class Stack {
		id: string;
		position: PositionValue | string;
		spacing: number;
		offsetX: number;
		offsetY: number;
		newestOnTop: boolean;
		balloonType: BalloonConstructor;
		balloons: Balloon[];
		queueStack: Balloon[];
		constructor(options?: StackOptions);
		static getPositionCode(position: unknown): string | null;
		adjustPosition(balloon?: Balloon): void;
		/**
		 * The balloons of the stack the way the user reads them: from the top of the screen
		 * down. A bottom-anchored stack grows upwards, so the balloon that came last stands
		 * highest and opens the list.
		 */
		getVisualOrder(): Balloon[];
		isBottomPosition(): boolean;
		/**
		 * Lines the balloon container up with the neighbours it already has in the document,
		 * so that the document order of the stack repeats its visual order.
		 *
		 * Balloons are appended to the body one by one, which for a bottom-anchored stack is
		 * the reverse of what the user sees: the keyboard would then walk the notifications
		 * bottom-up and leave the stack right after the topmost one. Placing every container
		 * next to its visual neighbour keeps Tab going from one notification to the next and,
		 * after the last one, out to the usual order of the page — without a focus trap.
		 */
		placeContainer(balloon: Balloon): void;
		add(balloon: Balloon): void;
		contains(balloon: Balloon): boolean;
		clear(): void;
		push(balloon: Balloon): void;
		queue(balloon: Balloon): void;
		checkQueue(): void;
		getQueue(): Balloon[];
		isBalloonFitToViewport(balloon: Balloon): boolean;
		handleBalloonClose(event: NotificationEvent): void;
		setOptions(options: StackOptions | null | undefined): void;
		getId(): string;
		getBalloons(): Balloon[];
		getPosition(): PositionValue | string;
		getSpacing(): number;
		setSpacing(spacing: unknown): void;
		getOffsetX(): number;
		setOffsetX(offsetX: unknown): void;
		getOffsetY(): number;
		setOffsetY(offsetY: unknown): void;
		getHeight(): number;
		getBalloonType(className?: string | Function): BalloonConstructor;
		setBalloonType(balloonType: unknown): void;
		isNewestOnTop(): boolean;
		setNewestOnTop(onTop: unknown): void;
	}

	const Position: {
		readonly TOP_LEFT: "top-left";
		readonly TOP_CENTER: "top-center";
		readonly TOP_RIGHT: "top-right";
		readonly BOTTOM_LEFT: "bottom-left";
		readonly BOTTOM_CENTER: "bottom-center";
		readonly BOTTOM_RIGHT: "bottom-right";
	};

	class Balloon {
		id: string;
		stack: Stack;
		state: StateValue;
		showOnTopWindow: boolean;
		announcement: string | false | null;
		announcementPoliteness: 'polite' | 'assertive';
		hasAnnounced: boolean;
		autofocus: boolean;
		hasFocusedActions: boolean;
		lastAnnouncementText: string | null;
		rerendering: boolean;
		focusedActionId: string | null;
		focusedActionIndex: number;
		a11yBoundContainer: HTMLElement | null;
		pausedByHover: boolean;
		pausedByFocus: boolean;
		pausedByHidden: boolean;
		visibilityDocument: Document | null;
		visibilityChangeHandler: (() => void) | null;
		focusReturnTarget: HTMLElement | null;
		framedFocusOrigin: HTMLElement | null;
		focusOriginDocuments: Document[];
		focusOriginHandlers: {
			focusin: (event: FocusEvent) => void;
			focusout: (event: FocusEvent) => void;
		} | null;
		autofocusedElement: HTMLElement | null;
		container: HTMLElement | null;
		measuredHeight: number;
		heightNeedsMeasurement: boolean;
		wasAppended: boolean;
		content: string | Element | null;
		actions: Action[];
		animationClassName: string;
		animationPropertyName: string;
		customRender: BalloonRender | null;
		category: string | null;
		autoHide: boolean;
		autoHideDelay: number;
		autoHideTimeout: ReturnType<typeof setTimeout> | null;
		useAirDesign: boolean;
		data: Record<string, unknown>;
		testId: string | null;
		width: number | 'auto';
		closeButton: HTMLElement | null;
		closeButtonVisibility: boolean;
		constructor(options?: BalloonOptions);
		show(): void;
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
		focusFirstAction(): void;
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
		focusElement(element: HTMLElement): void;
		/**
		 * Drops the forced ring. Without a target it clears whatever is marked; with one it
		 * clears only when that very element is the marked one.
		 */
		clearAutofocusRing(target?: EventTarget | null): void;
		setAutofocus(autofocus: unknown): void;
		getAutofocus(): boolean;
		getAnnouncementText(): string;
		announceBalloon(): void;
		setOptions(options: BalloonOptions | null): void;
		update(options: BalloonOptions | null): void;
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
		refreshContent(): void;
		/**
		 * Finds the action the focus has to come back to after a redraw.
		 *
		 * `Manager.notify()` applies the new options — and with them rebuilds every action —
		 * before `update()` runs, so by then the focused action object is gone in the ordinary
		 * «the same notification once again» flow. An id the consumer gave survives that rebuild
		 * and is matched first; an id the action generated for itself does not, and then the only
		 * thing that still carries the meaning of the action is its place in the row.
		 */
		findFocusedAction(id: string | null, index: number): Action | null;
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
		findRenderedActionIndex(target: EventTarget | null): number;
		rememberFocusedAction(action: Action | null): void;
		close(): void;
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
		resetAppearanceState(): void;
		blink(): void;
		adjustPosition(): void;
		getId(): string;
		getCloseButton(): HTMLElement;
		setCloseButtonVisibility(visibility: unknown): void;
		isCloseButtonVisible(): boolean;
		getContent(): string | Element | null;
		setContent(content: unknown): void;
		getWidth(): number | 'auto';
		setWidth(width: unknown): void;
		getZIndex(): number;
		/**
		 * @deprecated
		 */
		setZIndex(_zIndex: number): void;
		getHeight(): number;
		detachContainer(): void;
		getCategory(): string | null;
		setCategory(category: unknown): void;
		setActions(actions: unknown): void;
		getActions(): Action[];
		getAction(id: string): Action | null;
		setTestId(testId: unknown): void;
		getTestId(): string | null;
		getContainer(): HTMLElement;
		render(): HTMLElement;
		setCustomRender(render: unknown): void;
		getCustomRender(): BalloonRender | null;
		getStack(): Stack;
		setState(state: unknown): void;
		getState(): StateValue;
		getStateCode(mode: unknown): string | null;
		activateAutoHide(): void;
		deactivateAutoHide(): void;
		setAutoHide(autoHide: unknown): void;
		getAutoHide(): boolean;
		setAutoHideDelay(delay: unknown): void;
		getAutoHideDelay(): number;
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
		animateIn(callback: () => void): void;
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
		animateOut(callback: () => void): void;
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
		runTransition(container: HTMLElement, startTransition: () => void, isEnd: () => boolean, callback: () => void): void;
		handleCloseBtnClick(): void;
		bindAccessibilityHandlers(): void;
		/**
		 * The handlers of the node of the balloon itself.
		 *
		 * They cost nothing while the node is off the page — nothing dispatches an event to it
		 * there — so they are bound as soon as the node exists and live as long as it does.
		 */
		bindContainerHandlers(): void;
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
		bindDocumentHandlers(): void;
		unbindDocumentHandlers(): void;
		bindVisibilityHandler(): void;
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
		rememberFramedFocusOrigin(element: HTMLElement | null): void;
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
		bindFocusOriginWatcher(): void;
		watchFocusOriginDocument(doc: Document): void;
		/**
		 * Lets go of the documents of the frames that are no longer on the page.
		 *
		 * The element the balloon has to give the focus back to is not touched: it may well live
		 * in a document that has just died, and that is a case of its own — `canReceiveFocus()`
		 * sees it and falls back to the focus monitor. It is one element, and it goes away with
		 * the balloon; what must not pile up is the list of documents.
		 */
		releaseDeadFocusOriginDocuments(): void;
		unbindFocusOriginWatcher(): void;
		/**
		 * Picks up the document of a frame the focus has just walked into — the only place its
		 * own `focusout` will ever be announced.
		 */
		handleDocumentFocusIn(event: FocusEvent): void;
		handleDocumentFocusOut(event: FocusEvent): void;
		unbindVisibilityHandler(): void;
		handleVisibilityChange(): void;
		handleFocusIn(event: FocusEvent): void;
		handleFocusOut(event: FocusEvent): void;
		resumeAutoHide(): void;
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
		handleContainerKeyDown(event: KeyboardEvent): void;
		restoreFocusOnClose(): void;
		handleMouseEnter(): void;
		handleMouseLeave(): void;
		fireEvent(eventName: string): NotificationEvent;
		addEvent(eventName: string, fn: BalloonEventHandler): void;
		removeEvent(eventName: string, fn: BalloonEventHandler): void;
		getEvent(eventName: string): NotificationEvent;
		getData(): Record<string, unknown>;
		setData(data: unknown): void;
	}

	const State: {
		readonly INIT: 0;
		readonly OPENING: 1;
		readonly OPEN: 2;
		readonly CLOSING: 3;
		readonly CLOSED: 4;
		readonly PAUSED: 5;
		readonly QUEUED: 6;
	};

	class Action {
		balloon: Balloon;
		id: string;
		generatedId: boolean;
		href: string | null;
		title: string | null;
		testId: string | null;
		window: Window;
		container: HTMLElement | null;
		events: Record<string, DomEventHandler>;
		constructor(balloon: Balloon, options?: ActionOptions);
		getBalloon(): Balloon;
		getId(): string;
		hasGeneratedId(): boolean;
		getTitle(): string | null;
		getHref(): string | null;
		getTestId(): string | null;
		getContainer(): HTMLElement;
		handleKeyDown(event: KeyboardEvent): void;
		getWindow(): Window;
	}

	class NotificationEvent {
		static getFullName(eventName: string): string;
		getBalloon(): Balloon | null;
		setBalloon(balloon: unknown): void;
		getName(): string | null;
		setName(name: unknown): void;
		getFullName(): string;
	}

	class Event {
		static getFullName(eventName: string): string;
		getBalloon(): Balloon | null;
		setBalloon(balloon: unknown): void;
		getName(): string | null;
		setName(name: unknown): void;
		getFullName(): string;
	}

	const UI: Function | null;

	const Center: Manager;
}
