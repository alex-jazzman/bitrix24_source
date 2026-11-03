/* eslint-disable */
type DetailLayerType = (typeof BX.Messenger.v2.Lib.DetailLayer)[keyof typeof BX.Messenger.v2.Lib.DetailLayer];

type DetailAreaType = (typeof BX.Messenger.v2.Lib.DetailArea)[keyof typeof BX.Messenger.v2.Lib.DetailArea];

/**
 * `after` places a control that is not rendered inside the header itself - a teleported one - right
 * behind the key it logically follows. Every other control is ordered by its position in the document,
 * so a presentational rebuild keeps both the key and the place.
 */
type HeaderControlRegistration = {
	key: string;
	element: HTMLElement;
	after?: string;
};

type HeaderControlSnapshotEntry = {
	key: string;
	enabled: boolean;
};

/**
 * A single move of the focus the natural document order cannot make on its own: it is armed by the
 * keyboard activation that earns it, spent by the very next matching step, and dropped on anything else.
 */
type DetailFocusIntent = {
	name: string;
	dialogId: string;
	openerKey: string;
};

/**
 * A chat opened from the search results with the keyboard owes the focus back to the search it was opened
 * from: exiting that chat leaves the focus on nobody, and the collapsed search is where the walk started.
 *
 * The identity is the whole triple: the area says whose search waits, the layout that the user is still
 * looking at the list it belongs to, the dialog which chat exit is being waited for. One promise per area,
 * because the left column and the collab drawer over it can be waiting at once — a single record would let
 * the inner walk overwrite the outer one without a trace.
 *
 * A promise is spent when the last surface the same action opened is closed: a collab opens two, its chat
 * and the nested list, and while that list is on screen the promise waits for it instead.
 *
 * Kept outside the results component on purpose: the lists that also return the focus after a chat exit
 * have to see that the search is the one waiting for it, and stand down.
 */
type KeyboardFocusHandoff = {
	searchAreaId: string;
	layoutName: string;
	dialogId: string;
};

type NestedListHandoff = {
	layoutName: string;
	dialogId: string;
};

declare namespace BX.Messenger.v2.Lib {
	/**
	 * Creates a FocusZone preconfigured for a vertical list (roving tabindex):
	 * Up/Down arrows plus Home/End, focus stops at the list bounds (no wrapping).
	 *
	 * Callers from a different ARIA context (e.g. a menu) may override any option.
	 * Lifecycle is the caller's responsibility via `zone.activate()` / `zone.deactivate()`.
	 */
	function createListFocusZone(container: HTMLElement, options?: Partial<BX.UI.Accessibility.FocusZoneOptions>): BX.UI.Accessibility.FocusZone;

	/**
	 * True while a popup/menu is shown. Such surfaces own focus (usually via a focus trap and restore
	 * it themselves on close), so list components must not pull focus away. Gate programmatic focus
	 * moves with this - it mirrors the popup ownership check EscManager already relies on.
	 */
	function isFocusOwnedByPopup(): boolean;

	/**
	 * Injection key of the chat detail focus context. `MessengerRoot` provides the main instance,
	 * `BaseChatContent` provides a fallback one for embedded content mounted without the messenger.
	 */
	const CHAT_DETAIL_FOCUS_CONTEXT = "chatDetailFocusContext";

	/**
	 * The short-lived coordinator of an open chat. It holds the dialog the user is looking at, the layer on
	 * top of it, the bounds of the detail areas, a header registry per chat and the one-shot intents - and it
	 * never touches the ordinary `Tab`: the natural document order is the route, and the context only steps in
	 * where that order cannot answer for the product contract.
	 *
	 * The header registry is per chat because two headers can be alive at once - the layer of comments draws
	 * its own over the header of the chat underneath - and the two must not answer for each other: the walk
	 * asked for by a chat sees the controls, the root and the capture of that chat alone.
	 *
	 * ALG-01 is driven by that registry and not by the update of any one component: a control reports itself
	 * as it goes or as it may lose the ability to take the focus, and the answer is deferred to a microtask -
	 * past the whole update of Vue, and before the shared `FocusMonitor` answers for a lost focus.
	 *
	 * Its lifetime is the lifetime of the messenger instance that created it, so nothing is kept in a store,
	 * in `LocalStorage` or in module state, and no DOM reference outlives the registration that gave it.
	 */
	class ChatDetailFocusContext {
		/**
		 * The intents describe one walk, so another chat starts with none. Neither the area bounds nor the
		 * header of any chat outlives the switch by accident: the detail keeps its composition, and a header
		 * lets go of its own registry when it goes, not when another chat takes the screen.
		 */
		setActiveDialogId(dialogId: string): void;
		getActiveDialogId(): string;
		/**
		 * An intent is a promise about the next step of one walk, and a new layer over the chat is a walk of
		 * its own - the promise made under the previous one is not owed any more.
		 */
		setActiveLayer(layer: DetailLayerType): void;
		getActiveLayer(): DetailLayerType;
		registerArea(area: DetailAreaType, element: HTMLElement): void;
		unregisterArea(area: DetailAreaType, element: HTMLElement): void;
		getAreaElement(area: DetailAreaType): HTMLElement | null;
		/**
		 * The stop the area itself declares as the first one of a direct entry into it. The owner of the area
		 * knows which of its own controls that is, so a walk entering the area asks for it by the area alone
		 * and never by a selector of somebody else's markup. The technical root of the area stays out of it.
		 */
		registerAreaEntryTarget(area: DetailAreaType, element: HTMLElement): void;
		unregisterAreaEntryTarget(area: DetailAreaType, element: HTMLElement): void;
		getAreaEntryTarget(area: DetailAreaType): HTMLElement | null;
		/**
		 * The programmatically focusable root of the header: the last fallback of ALG-01, never an ordinary
		 * stop of the walk. It is not the `header` area bound, which the detail composition registers instead.
		 *
		 * The root is the anchor of the registry: a control drawn inside it belongs to this header whatever
		 * chat holds the screen. One element is the root of one header, so a header reused for another chat
		 * takes its controls along and leaves nothing behind in the registry of the chat it has left.
		 */
		registerHeaderRoot(element: HTMLElement): void;
		unregisterHeaderRoot(element: HTMLElement): void;
		registerHeaderControl(registration: HeaderControlRegistration): void;
		/**
		 * A rebuild that keeps the same root under the same key is no removal, and neither is a late removal
		 * of a root that has already been replaced - both are told apart by the element, not by the key alone.
		 *
		 * This is where the composition of a header really shrinks, whichever component was re-rendered to
		 * make it happen, so this is where the pass of ALG-01 opens.
		 */
		unregisterHeaderControl(key: string, element: HTMLElement): void;
		/**
		 * Opens the pass of ALG-01 for the header that owns the control: it remembers the focus now and asks
		 * the algorithm once the update is over. The owner of a registration calls it while its control is
		 * still in the document and still able to hold the focus - from `beforeUnmount`, and from `beforeUpdate`
		 * of an update that may take the ability to take the focus away (disabled, or out of the walk).
		 *
		 * Which component re-rendered does not matter here, and that is the point: on a live messenger a
		 * control leaves the header through the render of a descendant of the header just as often as through
		 * the render of the header itself.
		 */
		beforeHeaderControlChange(element: HTMLElement): void;
		getHeaderControlElement(key: string): HTMLElement | null;
		/**
		 * The header controls in the order the user walks them, each with whether it can be focused right now.
		 */
		getHeaderSnapshot(): HeaderControlSnapshotEntry[];
		/**
		 * Remembers which control holds the focus before the header changes, and arms the answer of ALG-01 for
		 * once the update is over. Called while the control that may be about to go is still there.
		 *
		 * One pass keeps one capture: several controls can leave a header in a single update, and only the
		 * first of them still sees the one that held the focus. The capture is spent by the restore that every
		 * capture arms, so nothing here outlives the update it was taken for.
		 *
		 * A header the focus is not standing in has nothing to capture whatever leaves it, and the ownership
		 * question is answered by one `contains` on the root - so it is asked before the order is built.
		 */
		captureHeaderFocus(dialogId: string): void;
		/**
		 * ALG-01, asked once the DOM is already the new one. Moves the focus only when the control that held it
		 * is really gone or cannot take it any more.
		 */
		restoreHeaderFocus(dialogId: string): void;
		armIntent(intent: DetailFocusIntent): void;
		getIntent(name: string): DetailFocusIntent | null;
		consumeIntent(name: string): DetailFocusIntent | null;
		clearIntent(name: string): void;
		destroy(): void;
	}

	const DetailLayer: Readonly<{
		readonly base: "base";
		readonly comments: "comments";
	}>;

	/**
	 * The areas of an open chat, in the order the document lays them out. The context knows the bounds
	 * only: the walk inside an area belongs to the area itself.
	 */
	const DetailArea: Readonly<{
		readonly header: "header";
		readonly preFeed: "pre-feed";
		readonly feed: "feed";
		readonly composerOrReplacement: "composer-or-replacement";
		readonly postComposer: "post-composer";
		readonly sidebar: "sidebar";
	}>;

	function armKeyboardFocusHandoff(handoff: KeyboardFocusHandoff): void;

	function clearKeyboardFocusHandoff(searchAreaId: string): void;

	/**
	 * A copy of the promise, field by field: the record itself stays inside, and so does the state of the walk
	 * kept next to it - the caller is told which walk is waiting, not how far it has got.
	 */
	function getKeyboardFocusHandoff(searchAreaId: string): KeyboardFocusHandoff | null;

	/**
	 * The nested list opened together with that chat is on screen: from now on the promise waits for the list,
	 * because it is the last surface that action opened.
	 */
	function holdKeyboardFocusHandoffForNestedList(nestedList: NestedListHandoff): void;

	function isKeyboardFocusHandoffHeldByNestedList(nestedList: NestedListHandoff): boolean;

	function isKeyboardFocusHandoffOfAreaHeldByNestedList(searchAreaId: string): boolean;

	function isKeyboardFocusHandoffPending(handoff: KeyboardFocusHandoff): boolean;

	/**
	 * The nested list is gone, and with it the last surface of the walk. Returns the area whose collapsed search
	 * is owed the focus back, or null when there is none to hand it to.
	 */
	function releaseKeyboardFocusHandoffFromNestedList(nestedList: NestedListHandoff): string | null;
}
