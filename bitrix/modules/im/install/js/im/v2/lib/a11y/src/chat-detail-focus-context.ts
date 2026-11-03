import { Type } from 'main.core';
import { PopupWindowManager, type Popup } from 'main.popup';

import { FocusNavigator, InteractivityChecker } from 'ui.a11y';

/**
 * Injection key of the chat detail focus context. `MessengerRoot` provides the main instance,
 * `BaseChatContent` provides a fallback one for embedded content mounted without the messenger.
 */
export const CHAT_DETAIL_FOCUS_CONTEXT = 'chatDetailFocusContext';

/**
 * The areas of an open chat, in the order the document lays them out. The context knows the bounds
 * only: the walk inside an area belongs to the area itself.
 */
export const DetailArea = Object.freeze({
	header: 'header',
	preFeed: 'pre-feed',
	feed: 'feed',
	composerOrReplacement: 'composer-or-replacement',
	postComposer: 'post-composer',
	sidebar: 'sidebar',
} as const);

export type DetailAreaType = (typeof DetailArea)[keyof typeof DetailArea];

export const DetailLayer = Object.freeze({
	base: 'base',
	comments: 'comments',
} as const);

export type DetailLayerType = (typeof DetailLayer)[keyof typeof DetailLayer];

/**
 * `after` places a control that is not rendered inside the header itself - a teleported one - right
 * behind the key it logically follows. Every other control is ordered by its position in the document,
 * so a presentational rebuild keeps both the key and the place.
 */
export type HeaderControlRegistration = {
	key: string,
	element: HTMLElement,
	after?: string,
};

export type HeaderControlSnapshotEntry = {
	key: string,
	enabled: boolean,
};

/**
 * A single move of the focus the natural document order cannot make on its own: it is armed by the
 * keyboard activation that earns it, spent by the very next matching step, and dropped on anything else.
 */
export type DetailFocusIntent = {
	name: string,
	dialogId: string,
	openerKey: string,
};

type HeaderControl = {
	key: string,
	element: HTMLElement,
	after: string | null,
};

type HeaderFocusCapture = {
	focusedKey: string,
	order: string[],
};

/**
 * The header of one chat: its programmatically focusable root, the controls registered inside it and the
 * control that held the focus before the last update. A layer over a chat draws a header of its own while
 * the header underneath is still there, so every header keeps its own registry and the two never share a
 * cell - neither the root, nor a semantic key, nor the capture of ALG-01.
 */
type HeaderRegistry = {
	root: HTMLElement | null,
	controls: Map<string, HeaderControl>,
	capture: HeaderFocusCapture | null,
};

function isEnabled(element: HTMLElement): boolean
{
	return InteractivityChecker.isFocusable(element) && !InteractivityChecker.isDisabled(element);
}

function byDocumentPosition(first: HeaderControl, second: HeaderControl): number
{
	const relation = first.element.compareDocumentPosition(second.element);

	if ((relation & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
	{
		return -1;
	}

	if ((relation & Node.DOCUMENT_POSITION_PRECEDING) !== 0)
	{
		return 1;
	}

	return 0;
}

/**
 * True while a shown popup really holds the focus: it keeps an active focus trap, or the active element
 * stands inside it. Being shown is another question, and the two part company in the ordinary case rather
 * than in a corner one - a hint is drawn without a trap under the mere pointer, and a trap is set up at
 * all only while the portal keeps `useFocusTrapInDialogs` on - so a shown popup stands beside the focus as
 * often as around it. The exported `isFocusOwnedByPopup` answers the presence question its own callers
 * ask, and this module is a leaf of the extension: importing the entry back would make the bundle cyclic.
 */
function isFocusHeldByPopup(): boolean
{
	const activeElement = FocusNavigator.getActiveElement();

	return PopupWindowManager.getPopups().some((popup: Popup) => {
		if (!popup.isShown())
		{
			return false;
		}

		const isTrapped = popup.getFocusTrap()?.isActive() === true;
		const holdsActiveElement = activeElement !== null
			&& popup.getPopupContainer().contains(activeElement);

		return isTrapped || holdsActiveElement;
	});
}

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
export class ChatDetailFocusContext
{
	#activeDialogId: string = '';
	#activeLayer: DetailLayerType = DetailLayer.base;
	#areas: Map<DetailAreaType, HTMLElement> = new Map();
	#areaEntryTargets: Map<DetailAreaType, HTMLElement> = new Map();
	#headers: Map<string, HeaderRegistry> = new Map();
	#intents: Map<string, DetailFocusIntent> = new Map();
	#armedRestores: Set<string> = new Set();

	/**
	 * The intents describe one walk, so another chat starts with none. Neither the area bounds nor the
	 * header of any chat outlives the switch by accident: the detail keeps its composition, and a header
	 * lets go of its own registry when it goes, not when another chat takes the screen.
	 */
	setActiveDialogId(dialogId: string): void
	{
		if (dialogId === this.#activeDialogId)
		{
			return;
		}

		this.#activeDialogId = dialogId;
		this.#intents.clear();
	}

	getActiveDialogId(): string
	{
		return this.#activeDialogId;
	}

	/**
	 * An intent is a promise about the next step of one walk, and a new layer over the chat is a walk of
	 * its own - the promise made under the previous one is not owed any more.
	 */
	setActiveLayer(layer: DetailLayerType): void
	{
		if (layer === this.#activeLayer)
		{
			return;
		}

		this.#activeLayer = layer;
		this.#intents.clear();
	}

	getActiveLayer(): DetailLayerType
	{
		return this.#activeLayer;
	}

	registerArea(area: DetailAreaType, element: HTMLElement): void
	{
		if (!Type.isElementNode(element))
		{
			return;
		}

		this.#areas.set(area, element);
	}

	// Only the owner of the current registration may drop it: an area remounted in place registers the new
	// element before the previous one is unmounted, and a late removal would erase the live registration.
	unregisterArea(area: DetailAreaType, element: HTMLElement): void
	{
		if (this.#areas.get(area) !== element)
		{
			return;
		}

		this.#areas.delete(area);
	}

	getAreaElement(area: DetailAreaType): HTMLElement | null
	{
		return this.#areas.get(area) ?? null;
	}

	/**
	 * The stop the area itself declares as the first one of a direct entry into it. The owner of the area
	 * knows which of its own controls that is, so a walk entering the area asks for it by the area alone
	 * and never by a selector of somebody else's markup. The technical root of the area stays out of it.
	 */
	registerAreaEntryTarget(area: DetailAreaType, element: HTMLElement): void
	{
		if (!Type.isElementNode(element))
		{
			return;
		}

		this.#areaEntryTargets.set(area, element);
	}

	// Told apart by the element for the same reason the area bound is: a target remounted in place must
	// survive the late removal of the root it replaced.
	unregisterAreaEntryTarget(area: DetailAreaType, element: HTMLElement): void
	{
		if (this.#areaEntryTargets.get(area) !== element)
		{
			return;
		}

		this.#areaEntryTargets.delete(area);
	}

	getAreaEntryTarget(area: DetailAreaType): HTMLElement | null
	{
		return this.#areaEntryTargets.get(area) ?? null;
	}

	/**
	 * The programmatically focusable root of the header: the last fallback of ALG-01, never an ordinary
	 * stop of the walk. It is not the `header` area bound, which the detail composition registers instead.
	 *
	 * The root is the anchor of the registry: a control drawn inside it belongs to this header whatever
	 * chat holds the screen. One element is the root of one header, so a header reused for another chat
	 * takes its controls along and leaves nothing behind in the registry of the chat it has left.
	 */
	registerHeaderRoot(element: HTMLElement): void
	{
		if (!Type.isElementNode(element))
		{
			return;
		}

		this.#releaseHeaderRoot(element);

		const registry = this.#takeHeaderRegistry(this.#activeDialogId);
		registry.root = element;
		this.#adoptControlsInside(this.#activeDialogId, element);
	}

	// Told apart by the element, so a late removal of a root that has already been replaced drops nothing.
	unregisterHeaderRoot(element: HTMLElement): void
	{
		this.#releaseHeaderRoot(element);
		this.#pruneEmptyRegistries();
	}

	registerHeaderControl(registration: HeaderControlRegistration): void
	{
		if (!Type.isStringFilled(registration.key) || !Type.isElementNode(registration.element))
		{
			return;
		}

		const owner = this.#resolveControlOwner(registration.element);

		// The registration has exactly one home: a control that has already registered elsewhere - the
		// same element under the same key - is moved rather than doubled.
		this.#dropHeaderControl(registration.key, registration.element);

		this.#takeHeaderRegistry(owner).controls.set(registration.key, {
			key: registration.key,
			element: registration.element,
			after: Type.isStringFilled(registration.after) ? registration.after : null,
		});
	}

	/**
	 * A rebuild that keeps the same root under the same key is no removal, and neither is a late removal
	 * of a root that has already been replaced - both are told apart by the element, not by the key alone.
	 *
	 * This is where the composition of a header really shrinks, whichever component was re-rendered to
	 * make it happen, so this is where the pass of ALG-01 opens.
	 */
	unregisterHeaderControl(key: string, element: HTMLElement): void
	{
		this.beforeHeaderControlChange(element);
		this.#dropHeaderControl(key, element);
	}

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
	beforeHeaderControlChange(element: HTMLElement): void
	{
		const owner = this.#findRegisteredControlOwner(element);
		if (owner !== null)
		{
			this.captureHeaderFocus(owner);
		}
	}

	getHeaderControlElement(key: string): HTMLElement | null
	{
		return this.#headers.get(this.#activeDialogId)?.controls.get(key)?.element ?? null;
	}

	/**
	 * The header controls in the order the user walks them, each with whether it can be focused right now.
	 */
	getHeaderSnapshot(): HeaderControlSnapshotEntry[]
	{
		return this.#buildOrder(this.#activeDialogId).map((control: HeaderControl) => {
			return { key: control.key, enabled: isEnabled(control.element) };
		});
	}

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
	captureHeaderFocus(dialogId: string): void
	{
		const registry = this.#headers.get(dialogId);
		const isNothingToCapture = registry === undefined
			|| registry.capture !== null
			|| dialogId !== this.#activeDialogId
			|| !this.#ownsActiveElement(registry);

		if (isNothingToCapture)
		{
			return;
		}

		const order = this.#buildOrder(dialogId);
		const focusedKey = this.#findFocusedKey(order);
		if (focusedKey === null)
		{
			return;
		}

		registry.capture = {
			focusedKey,
			order: order.map((control: HeaderControl) => control.key),
		};

		this.#armHeaderFocusRestore(dialogId);
	}

	/**
	 * ALG-01, asked once the DOM is already the new one. Moves the focus only when the control that held it
	 * is really gone or cannot take it any more.
	 */
	restoreHeaderFocus(dialogId: string): void
	{
		const registry = this.#headers.get(dialogId);
		if (registry === undefined)
		{
			return;
		}

		const capture = registry.capture;
		registry.capture = null;

		if (capture === null || dialogId !== this.#activeDialogId)
		{
			return;
		}

		const snapshot = this.getHeaderSnapshot();
		const isStillThere = snapshot.some((entry: HeaderControlSnapshotEntry) => {
			return entry.key === capture.focusedKey && entry.enabled;
		});
		if (isStillThere)
		{
			return;
		}

		// A popup holding the focus gives it back itself when it closes, so the restore keeps out of its
		// way. Only holding it counts: a popup shown beside the focus - a hint under the pointer - owes it
		// to nobody, and a restore called off for such a popup would leave the focus on `body` with no one
		// to place it.
		if (isFocusHeldByPopup())
		{
			return;
		}

		// An element outside the header that still holds the focus was chosen by somebody else, and only a
		// lost focus is ours to place.
		if (!this.#ownsActiveElement(registry) && !FocusNavigator.isFocusLost())
		{
			return;
		}

		this.#focusRestoreTarget(registry, capture, snapshot);
	}

	armIntent(intent: DetailFocusIntent): void
	{
		// Fail closed on an incomplete intent: an unnamed one would answer for every walk, an opener-less
		// one would fire from anywhere, and a foreign dialog is not the chat the user is looking at.
		const isComplete = Type.isStringFilled(intent.name)
			&& Type.isStringFilled(intent.dialogId)
			&& Type.isStringFilled(intent.openerKey);

		if (!isComplete || intent.dialogId !== this.#activeDialogId)
		{
			return;
		}

		this.#intents.set(intent.name, { ...intent });
	}

	// A copy: the record itself stays inside, so a reader cannot turn a spent intent into a standing one.
	getIntent(name: string): DetailFocusIntent | null
	{
		const intent = this.#intents.get(name);

		return intent ? { ...intent } : null;
	}

	consumeIntent(name: string): DetailFocusIntent | null
	{
		const intent = this.getIntent(name);
		this.#intents.delete(name);

		return intent;
	}

	clearIntent(name: string): void
	{
		this.#intents.delete(name);
	}

	destroy(): void
	{
		this.#activeDialogId = '';
		this.#activeLayer = DetailLayer.base;
		this.#areas.clear();
		this.#areaEntryTargets.clear();
		this.#headers.clear();
		this.#intents.clear();
		this.#armedRestores.clear();
	}

	/**
	 * The answer of ALG-01 belongs after the update of Vue and before the shared `FocusMonitor` answers
	 * for a lost focus. A microtask sits exactly between the two: Vue flushes its whole queue - the patch
	 * and every `mounted` and `updated` of it - inside one microtask, so a microtask queued from a hook of
	 * that flush runs once all of it is done, while the monitor restores from a `setTimeout`, a task later.
	 * That is why no scheduler of `ui.vue3` is pulled into this extension: the promise gives the same
	 * moment, and the context stays usable - and testable - without Vue.
	 */
	#armHeaderFocusRestore(dialogId: string): void
	{
		if (this.#armedRestores.has(dialogId))
		{
			return;
		}

		this.#armedRestores.add(dialogId);

		void Promise.resolve().then(() => {
			this.#armedRestores.delete(dialogId);
			this.restoreHeaderFocus(dialogId);
		});
	}

	#takeHeaderRegistry(dialogId: string): HeaderRegistry
	{
		const known = this.#headers.get(dialogId);
		if (known !== undefined)
		{
			return known;
		}

		const registry: HeaderRegistry = { root: null, controls: new Map(), capture: null };
		this.#headers.set(dialogId, registry);

		return registry;
	}

	/**
	 * A control belongs to the header whose root draws it. A control drawn outside every header - a
	 * teleported one, anchored to the key it follows - belongs to the walk of the chat on screen.
	 */
	#resolveControlOwner(element: HTMLElement): string
	{
		for (const [dialogId, registry] of this.#headers)
		{
			if (registry.root?.contains(element) === true)
			{
				return dialogId;
			}
		}

		return this.#activeDialogId;
	}

	/**
	 * The chat whose registry holds this very element right now, and nothing else: a late report about an
	 * element that has already been replaced belongs to no registry and opens no pass.
	 */
	#findRegisteredControlOwner(element: HTMLElement): string | null
	{
		for (const [dialogId, registry] of this.#headers)
		{
			for (const control of registry.controls.values())
			{
				if (control.element === element)
				{
					return dialogId;
				}
			}
		}

		return null;
	}

	#dropHeaderControl(key: string, element: HTMLElement): void
	{
		this.#headers.forEach((registry: HeaderRegistry) => {
			if (registry.controls.get(key)?.element === element)
			{
				registry.controls.delete(key);
			}
		});

		this.#pruneEmptyRegistries();
	}

	// The controls of a header register before it registers its own root, and a header reused for another
	// chat registers the root again: either way the root takes over what it draws.
	#adoptControlsInside(dialogId: string, root: HTMLElement): void
	{
		const registry = this.#takeHeaderRegistry(dialogId);

		this.#headers.forEach((other: HeaderRegistry, otherDialogId: string) => {
			if (otherDialogId === dialogId)
			{
				return;
			}

			other.controls.forEach((control: HeaderControl) => {
				if (!root.contains(control.element))
				{
					return;
				}

				other.controls.delete(control.key);
				registry.controls.set(control.key, control);
			});
		});

		this.#pruneEmptyRegistries();
	}

	#releaseHeaderRoot(element: HTMLElement): void
	{
		for (const registry of this.#headers.values())
		{
			if (registry.root === element)
			{
				registry.root = null;
			}
		}
	}

	// No record of a header outlives its registrations: the chat whose header has gone keeps no cell here.
	#pruneEmptyRegistries(): void
	{
		this.#headers.forEach((registry: HeaderRegistry, dialogId: string) => {
			if (registry.root === null && registry.controls.size === 0)
			{
				this.#headers.delete(dialogId);
			}
		});
	}

	#buildOrder(dialogId: string): HeaderControl[]
	{
		const anchored: HeaderControl[] = [];
		const logical: HeaderControl[] = [];

		this.#headers.get(dialogId)?.controls.forEach((control: HeaderControl) => {
			if (!control.element.isConnected)
			{
				return;
			}

			(control.after === null ? anchored : logical).push(control);
		});

		const order = anchored.sort(byDocumentPosition);

		logical.forEach((control: HeaderControl) => {
			const anchorIndex = order.findIndex((placed: HeaderControl) => placed.key === control.after);
			if (anchorIndex === -1)
			{
				return;
			}

			order.splice(anchorIndex + 1, 0, control);
		});

		return order;
	}

	#findFocusedKey(order: HeaderControl[]): string | null
	{
		const activeElement = FocusNavigator.getActiveElement();
		if (activeElement === null)
		{
			return null;
		}

		const focused = order.find((control: HeaderControl) => control.element.contains(activeElement));

		return focused?.key ?? null;
	}

	#ownsActiveElement(registry: HeaderRegistry): boolean
	{
		const activeElement = FocusNavigator.getActiveElement();
		if (activeElement === null)
		{
			return false;
		}

		if (registry.root?.contains(activeElement) === true)
		{
			return true;
		}

		return [...registry.controls.values()].some((control: HeaderControl) => {
			return control.element.contains(activeElement);
		});
	}

	#focusRestoreTarget(
		registry: HeaderRegistry,
		capture: HeaderFocusCapture,
		snapshot: HeaderControlSnapshotEntry[],
	): void
	{
		const target = this.#findRestoreTarget(registry, capture, snapshot);
		if (target !== null)
		{
			FocusNavigator.focusTarget(target, { preventScroll: true });

			return;
		}

		if (registry.root !== null)
		{
			FocusNavigator.focusContainer(registry.root, { preventScroll: true });
		}
	}

	#findRestoreTarget(
		registry: HeaderRegistry,
		capture: HeaderFocusCapture,
		snapshot: HeaderControlSnapshotEntry[],
	): HTMLElement | null
	{
		const focusedIndex = capture.order.indexOf(capture.focusedKey);
		if (focusedIndex === -1)
		{
			return null;
		}

		const enabledKeys: Set<string> = new Set(
			snapshot.filter((entry: HeaderControlSnapshotEntry) => entry.enabled)
				.map((entry: HeaderControlSnapshotEntry) => entry.key),
		);

		const toTheRight = capture.order.slice(focusedIndex + 1);
		const toTheLeft = capture.order.slice(0, focusedIndex).reverse();
		const targetKey = [...toTheRight, ...toTheLeft].find((key: string) => enabledKeys.has(key));

		return targetKey === undefined ? null : registry.controls.get(targetKey)?.element ?? null;
	}
}
