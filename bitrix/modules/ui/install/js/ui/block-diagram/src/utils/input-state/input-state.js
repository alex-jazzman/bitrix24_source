import { Browser, Event, Type } from 'main.core';

import { INPUT_TAGS, MOUSE_BUTTON } from '../../constants';
import { type ActionRegistry } from '../action-registry/action-registry.ts';
import { type Point } from '../../types';

// Key tokens a consumer subscribes by, so the spelling lives in one place on both sides.
export const KEY_TOKEN = Object.freeze({
	SPACE: 'space',
	ESCAPE: 'escape',
});

// A key pressed while an IME composes carries this legacy code in browsers that predate
// `KeyboardEvent.isComposing`.
const IME_PROCESSING_KEY_CODE = 229;

const MOUSE_BUTTON_TOKEN = Object.freeze({
	LEFT: 'lmb',
	MIDDLE: 'mmb',
	RIGHT: 'rmb',
});

export type InputStateOptions = {
	isMac?: boolean,
	// Without it the state knows no actions at all and the action channel stays silent.
	actionRegistry?: ActionRegistry | null,
};

export type InputStateHandler = (event: KeyboardEvent | PointerEvent, inputState: InputState) => void;

// The reset passes null: no event stands behind a forced release.
export type HoldHandler = (isPressed: boolean, event: KeyboardEvent | PointerEvent | null) => void;

type ComboSubscription = {
	handler: InputStateHandler,
	preventDefault: boolean,
};

type SubscriptionRegistry = Map<string, Array<ComboSubscription | HoldHandler | InputStateHandler>>;

// Order is fixed: it makes one combo string out of every way the same combo can be written.
const MODIFIERS = ['ctrl', 'alt', 'shift', 'meta'];

const MODIFIER_EVENT_FLAGS = Object.freeze({
	ctrl: 'ctrlKey',
	alt: 'altKey',
	shift: 'shiftKey',
	meta: 'metaKey',
});

const ALIASES = new Map([
	['control', 'ctrl'],
	['option', 'alt'],
	['cmd', 'meta'],
	['command', 'meta'],
	['win', 'meta'],
	['esc', 'escape'],
	['del', 'delete'],
	['ins', 'insert'],
	['left', 'arrowleft'],
	['right', 'arrowright'],
	['up', 'arrowup'],
	['down', 'arrowdown'],
	[MOUSE_BUTTON_TOKEN.LEFT, `mouse${MOUSE_BUTTON.LEFT}`],
	[MOUSE_BUTTON_TOKEN.MIDDLE, `mouse${MOUSE_BUTTON.MIDDLE}`],
	[MOUSE_BUTTON_TOKEN.RIGHT, `mouse${MOUSE_BUTTON.RIGHT}`],
	// A punctuation key written as its character has to meet the physical code of the same key in
	// one token, or a record spelled with the character would never match the event. Both the plain
	// character and the one the same key types under Shift lead to that single code: a record reads
	// as '?' or as '/', the event says Slash, and all three have to mean the same key.
	['-', 'minus'],
	['_', 'minus'],
	['=', 'equal'],
	['+', 'equal'],
	['[', 'bracketleft'],
	['{', 'bracketleft'],
	[']', 'bracketright'],
	['}', 'bracketright'],
	[',', 'comma'],
	['<', 'comma'],
	['.', 'period'],
	['>', 'period'],
	['/', 'slash'],
	['?', 'slash'],
	[';', 'semicolon'],
	[':', 'semicolon'],
	["'", 'quote'],
	['"', 'quote'],
	['`', 'backquote'],
	['~', 'backquote'],
	['\\', 'backslash'],
	['|', 'backslash'],
	// The digit row under Shift, same rule.
	['!', 'digit1'],
	['@', 'digit2'],
	['#', 'digit3'],
	['$', 'digit4'],
	['%', 'digit5'],
	['^', 'digit6'],
	['&', 'digit7'],
	['*', 'digit8'],
	['(', 'digit9'],
	[')', 'digit0'],
	// The numeric keypad carries physical codes of its own, and a combo is matched by code: without
	// these the keypad would answer no record written for the key of the main row.
	['numpadadd', 'equal'],
	['numpadsubtract', 'minus'],
]);

const CAPTURE_LISTENER_OPTIONS = Object.freeze({ capture: true });

const COMBO_SEPARATOR = '+';
const PLATFORM_MODIFIER_TOKEN = 'mod';
const MOUSE_TOKEN_PREFIX = 'mouse';
const LETTER_TOKEN_PREFIX = 'key';
const DIGIT_TOKEN_PREFIX = 'digit';
const SIDE_SUFFIXES = ['left', 'right'];
const SPACE_KEY = ' ';
const HIDDEN_VISIBILITY_STATE = 'hidden';
const LETTER_PATTERN = /^[a-z]$/;
const DIGIT_PATTERN = /^\d$/;
// Every `KeyboardEvent.code`/`.key` name the DOM ever produces - physical or logical, side-suffixed
// or not - is plain ASCII letters and digits: no punctuation, no whitespace, no markup. A multi-
// character token that fails this is not a key a keyboard can send, canonical or otherwise: a
// personal setting travels through this same function on every load (hotkeys.js `sanitizeOverrides`),
// and one hand-crafted through the save API is the only way such a token could ever reach here.
const TOKEN_PATTERN = /^[a-z0-9]+$/;

// ShiftLeft answers a question about shift, ControlRight - about ctrl. A side suffix over anything
// but a modifier - ArrowLeft, BracketRight - is part of the key name and strips to nothing.
function stripSide(token: string): string | null
{
	const suffix = SIDE_SUFFIXES.find((side) => token.endsWith(side) && token.length > side.length);

	if (Type.isNil(suffix))
	{
		return null;
	}

	const base = token.slice(0, -suffix.length);
	const alias = ALIASES.get(base) ?? base;

	return MODIFIERS.includes(alias) ? alias : null;
}

/**
 * Whether a token names a modifier, written once for the class and for the shortcut adapter that
 * has to tell a modifier from the main key of a record. Accepts every spelling a record may use,
 * the platform-dependent `mod` included.
 */
export function isModifierToken(token: string): boolean
{
	if (!Type.isStringFilled(token))
	{
		return false;
	}

	const lowered = token.trim().toLowerCase();
	const alias = ALIASES.get(lowered) ?? lowered;

	return alias === PLATFORM_MODIFIER_TOKEN || MODIFIERS.includes(stripSide(alias) ?? alias);
}

/**
 * The canonical form of a single key: every spelling of the same key - the character, the synonym,
 * the physical code - answers with one token. The platform-dependent `mod` needs to know the
 * platform, which the class passes from its own; a caller outside it reads the platform of the page.
 */
export function normalizeToken(raw: string, isMac: boolean = Browser.isMac()): string
{
	if (!Type.isStringFilled(raw))
	{
		return '';
	}

	const lowered = raw.trim().toLowerCase();
	const token = ALIASES.get(lowered) ?? lowered;

	if (token === PLATFORM_MODIFIER_TOKEN)
	{
		return isMac ? 'meta' : 'ctrl';
	}

	// Both patterns describe a single character: a longer token never has to be matched.
	if (token.length === 1)
	{
		if (LETTER_PATTERN.test(token))
		{
			return `${LETTER_TOKEN_PREFIX}${token}`;
		}

		if (DIGIT_PATTERN.test(token))
		{
			return `${DIGIT_TOKEN_PREFIX}${token}`;
		}

		// A single character neither pattern above claims - '+', '=', a non-Latin letter - is one of
		// the rare keys the DOM names by their own printed character, and passes through as-is.
		return token;
	}

	return TOKEN_PATTERN.test(token) ? token : '';
}

/**
 * The canonical form of a whole combo: the one string a written record, a stored binding and a
 * press all have to arrive at. It lives here rather than in the registry of actions, because this
 * is where a press meets a record - the registry is handed canonical strings and normalizes nothing.
 *
 * A combo written as one string is split by the separator, which leaves no way to name the
 * separator itself as a key: '+' is passed as a list instead, and a list is never split.
 */
export function normalizeCombo(combo: string | Array<string>, isMac: boolean = Browser.isMac()): string
{
	let parts = [];

	if (Type.isArray(combo))
	{
		parts = combo;
	}
	else if (Type.isStringFilled(combo))
	{
		parts = combo.split(COMBO_SEPARATOR);
	}

	const tokens = parts
		.map((part) => normalizeToken(part, isMac))
		.filter((part) => Type.isStringFilled(part));

	const modifiers = MODIFIERS.filter((modifier) => tokens.includes(modifier));
	const keys = tokens.filter((token) => !MODIFIERS.includes(token)).sort();

	return [...modifiers, ...keys].join(COMBO_SEPARATOR);
}

/**
 * The rule about an input field holding the focus, written once: the class asks it about the event
 * it handles, a consumer of the state - about the event it was handed.
 */
export function isInputEventTarget(event: KeyboardEvent | PointerEvent | DragEvent | null): boolean
{
	const target = event?.target;

	if (Type.isNil(target))
	{
		return false;
	}

	return INPUT_TAGS[target.tagName] === true || target.isContentEditable === true;
}

/**
 * Single owner of the canvas input subscriptions and single source of truth about what is held
 * right now. Knows nothing about the diagram model: whether a shortcut may run is decided by the
 * subscriber.
 *
 * Plain subscriptions are heard on the bubbling phase only, so a popup mounted above the canvas
 * keeps its own Escape and Space. An exclusive subscription (`onExclusive`) raises a second,
 * capture-phase channel for as long as an operation holds the combo, and takes the event away from
 * those layers; with no such subscription that channel is not bound at all. The platform is
 * injected to keep the class testable without a browser.
 *
 * The state attaches itself to `window` on first use, so a consumer of the canvas works whether or
 * not the root diagram component has mounted. `detach` is the end of it: the owner of the canvas
 * calls it on unmount, only an explicit `attach` binds the listeners again, and the claims go down
 * with the channel that served them.
 */
export class InputState
{
	#isMac: boolean;
	#actionRegistry: ActionRegistry | null;
	#target: EventTarget | null = null;
	#pressedTokens: Set<string> = new Set();
	#pointer: Point = { x: 0, y: 0 };
	#comboSubscriptions: Map<string, Array<ComboSubscription>> = new Map();
	#actionSubscriptions: Map<string, Array<ComboSubscription>> = new Map();
	#holdSubscriptions: Map<string, Array<HoldHandler>> = new Map();
	#exclusiveStack: Map<string, Array<InputStateHandler>> = new Map();
	#listeners: { [string]: Function };
	#isCaptureListenerBound: boolean = false;
	#isReleased: boolean = false;

	constructor(options: InputStateOptions = {})
	{
		this.#isMac = Type.isBoolean(options?.isMac) ? options.isMac : Browser.isMac();
		this.#actionRegistry = options?.actionRegistry ?? null;
		this.#listeners = {
			keydown: this.#handleKeyDown,
			keyup: this.#handleKeyUp,
			pointerdown: this.#handlePointerDown,
			pointerup: this.#handlePointerUp,
			pointermove: this.#handlePointerMove,
			blur: this.#handleBlur,
			visibilitychange: this.#handleVisibilityChange,
		};
	}

	attach(target: EventTarget = window): void
	{
		this.#isReleased = false;

		if (!Type.isNil(this.#target))
		{
			return;
		}

		this.#target = target;
		Object.entries(this.#listeners).forEach(([eventName, handler]) => {
			Event.bind(target, eventName, handler);
		});
		this.#ensureCaptureListener();
	}

	detach(): void
	{
		this.#isReleased = true;

		if (Type.isNil(this.#target))
		{
			return;
		}

		Object.entries(this.#listeners).forEach(([eventName, handler]) => {
			Event.unbind(this.#target, eventName, handler);
		});
		this.#unbindCaptureListener();
		this.#target = null;
		this.reset();
		// A claim lives as long as the operation that took it, and detach ends every operation on
		// this state: kept here, the registry would raise the channel again on the next attach and
		// hand the key to owners that are gone.
		this.#exclusiveStack.clear();
	}

	isPressed(token: string): boolean
	{
		this.#autoAttach();

		const normalized = normalizeToken(token, this.#isMac);

		if (!Type.isStringFilled(normalized))
		{
			return false;
		}

		return this.#hasToken(normalized);
	}

	get pointer(): Point
	{
		this.#autoAttach();

		return { ...this.#pointer };
	}

	reset(): void
	{
		const holdStates = this.#captureHoldStates();
		this.#pressedTokens.clear();
		this.#notifyHoldChanges(holdStates, null);
	}

	on(
		combo: string | Array<string>,
		handler: InputStateHandler,
		options: { preventDefault?: boolean } = {},
	): () => void
	{
		this.#autoAttach();

		const key = normalizeCombo(combo, this.#isMac);

		if (!Type.isStringFilled(key) || !Type.isFunction(handler))
		{
			return () => {};
		}

		const subscription: ComboSubscription = {
			handler,
			preventDefault: Type.isBoolean(options?.preventDefault) ? options.preventDefault : true,
		};
		this.#addSubscription(this.#comboSubscriptions, key, subscription);

		return () => {
			this.#removeSubscription(this.#comboSubscriptions, key, subscription);
		};
	}

	/**
	 * Subscribes by what the press does rather than by which keys do it: which combo runs the action
	 * is the answer of the registry handed to the state, and it may change while the subscription
	 * lives. A state with no registry behind it never resolves an action and this channel stays
	 * silent. The channels are independent - the same press reaches a record of each - and the rules
	 * of `on()` hold here too: an input field with the focus takes the key, and the browser action is
	 * suppressed unless the record opts out.
	 */
	onAction(
		actionId: string,
		handler: InputStateHandler,
		options: { preventDefault?: boolean } = {},
	): () => void
	{
		this.#autoAttach();

		if (!Type.isStringFilled(actionId) || !Type.isFunction(handler))
		{
			return () => {};
		}

		const subscription: ComboSubscription = {
			handler,
			preventDefault: Type.isBoolean(options?.preventDefault) ? options.preventDefault : true,
		};
		this.#addSubscription(this.#actionSubscriptions, actionId, subscription);

		return () => {
			this.#removeSubscription(this.#actionSubscriptions, actionId, subscription);
		};
	}

	/**
	 * Claims the combo for one operation: the record goes on a stack, only its top handler runs, and
	 * the event stops before the layers above the canvas see it. The record lives exactly as long as
	 * the operation - the returned function is the only way to drop it - so with nothing running the
	 * combo behaves as it always did. Suppressing the browser action is never part of the deal.
	 */
	onExclusive(combo: string | Array<string>, handler: InputStateHandler): () => void
	{
		this.#autoAttach();

		const key = normalizeCombo(combo, this.#isMac);

		if (!Type.isStringFilled(key) || !Type.isFunction(handler))
		{
			return () => {};
		}

		this.#addSubscription(this.#exclusiveStack, key, handler);
		this.#ensureCaptureListener();

		return () => {
			this.#removeSubscription(this.#exclusiveStack, key, handler);
			this.#releaseCaptureListenerIfEmpty();
		};
	}

	/**
	 * Whether the combo is claimed right now. A tool that has just given its own claim back asks
	 * about what is left under it: with the stack empty the combo belongs to the canvas again, and
	 * with anything still on it the layer holding the key decides what happens next.
	 */
	hasExclusiveClaims(combo: string | Array<string>): boolean
	{
		const key = normalizeCombo(combo, this.#isMac);

		return Type.isStringFilled(key) && this.#exclusiveStack.has(key);
	}

	onChange(token: string, handler: HoldHandler): () => void
	{
		this.#autoAttach();

		const key = normalizeToken(token, this.#isMac);

		if (!Type.isStringFilled(key) || !Type.isFunction(handler))
		{
			return () => {};
		}

		this.#addSubscription(this.#holdSubscriptions, key, handler);

		return () => {
			this.#removeSubscription(this.#holdSubscriptions, key, handler);
		};
	}

	// Auto repeat runs the action again, the way holding an undo shortcut has always worked. Hold
	// subscribers stay silent through it: #notifyHoldChanges reports edges, and a repeat is none.
	#handleKeyDown = (event: KeyboardEvent): void => {
		const token = this.#keyToken(event);
		this.#applyInputEvent(event, () => {
			this.#press(token);
		});

		if (isInputEventTarget(event))
		{
			return;
		}

		const combo = this.#comboFromEvent(event, token);
		// The action channel answers first: a record that named what it does must not depend on
		// whether a neighbour still names the keys.
		this.#trigger(this.#actionSubscriptions, this.#resolveAction(combo), event);
		this.#trigger(this.#comboSubscriptions, combo, event);
	};

	// The exclusive channel. It runs before everything above the canvas, so the bookkeeping comes
	// first and unconditionally: the bubbling handler never sees an event this one takes away, and
	// the held set must not depend on which channel delivered it.
	#handleCaptureKeyDown = (event: KeyboardEvent): void => {
		const token = this.#keyToken(event);
		this.#applyInputEvent(event, () => {
			this.#press(token);
		});

		// While an IME composes, the press belongs to the composition: Escape ends it, and taking
		// the key away here would spend one press on two different things.
		if (event.isComposing === true || event.keyCode === IME_PROCESSING_KEY_CODE)
		{
			return;
		}

		// A suspended registry means a panel above the canvas has taken the keyboard - the settings
		// panel recording a combo does exactly that. This channel listens on the window, above every
		// listener of that panel, so staying silent with the registry is what lets the press reach it.
		if (this.#actionRegistry?.isSuspended === true)
		{
			return;
		}

		const key = this.#comboFromEvent(event, token);
		const stack = Type.isStringFilled(key) ? this.#exclusiveStack.get(key) : null;

		if (Type.isNil(stack))
		{
			return;
		}

		// Escape types nothing, so a focused field has no claim on it; every other combo keeps the
		// rule of the bubbling channel.
		if (isInputEventTarget(event) && key !== KEY_TOKEN.ESCAPE)
		{
			return;
		}

		// The key is taken from the layers above, not from the browser: preventDefault stays out.
		event.stopPropagation();
		stack[stack.length - 1](event, this);
	};

	#handleKeyUp = (event: KeyboardEvent): void => {
		const token = this.#keyToken(event);
		this.#applyInputEvent(event, () => {
			// While the command key is down macOS delivers no keyup for regular keys, so releasing
			// it leaves the rest of the set stale.
			if (this.#isMac && this.#matchToken(token, 'meta'))
			{
				this.#pressedTokens.clear();

				return;
			}

			this.#pressedTokens.delete(token);
		});
	};

	#handlePointerDown = (event: PointerEvent): void => {
		const token = this.#mouseToken(event.button);
		this.#applyInputEvent(event, () => {
			this.#press(token);
			this.#updatePointer(event);
		});

		if (isInputEventTarget(event))
		{
			return;
		}

		this.#trigger(this.#comboSubscriptions, this.#comboFromEvent(event, token), event);
	};

	#handlePointerUp = (event: PointerEvent): void => {
		this.#applyInputEvent(event, () => {
			this.#pressedTokens.delete(this.#mouseToken(event.button));
			this.#updatePointer(event);
		});
	};

	// Movement holds nothing down: the only holds it can change are the modifiers of the event.
	#handlePointerMove = (event: PointerEvent): void => {
		this.#applyInputEvent(event, () => {
			this.#updatePointer(event);
		}, true);
	};

	// A window that loses focus never delivers the keyup of a held key.
	#handleBlur = (): void => {
		this.reset();
	};

	// Bound on the same target as the rest, `window` by default, and that is enough: the HTML
	// standard fires visibilitychange at the document with bubbles set to true, so it reaches a
	// listener on the window. Binding a document of its own would be the class holding a second
	// target to unbind from.
	#handleVisibilityChange = (event: { target?: { visibilityState?: string } }): void => {
		// The event bubbles from the document, so the state is read off the event itself: the class
		// keeps no reference to a document of its own.
		if (event?.target?.visibilityState === HIDDEN_VISIBILITY_STATE)
		{
			this.reset();
		}
	};

	// Anyone who touches the state gets it live, whether the owner of the canvas has mounted yet or
	// not: a consumer that only reads the holds never subscribes, so subscriptions alone would not
	// cover it. A released state stays released - only an explicit attach revives it, or a read
	// after unmount would bring the listeners back with nothing to own them.
	#autoAttach(): void
	{
		if (!Type.isNil(this.#target) || this.#isReleased)
		{
			return;
		}

		this.attach();
	}

	// An empty registry leaves the target exactly as it was before the class learned about exclusive
	// subscriptions at all.
	#ensureCaptureListener(): void
	{
		if (this.#isCaptureListenerBound || this.#exclusiveStack.size === 0 || Type.isNil(this.#target))
		{
			return;
		}

		Event.bind(this.#target, 'keydown', this.#handleCaptureKeyDown, CAPTURE_LISTENER_OPTIONS);
		this.#isCaptureListenerBound = true;
	}

	#releaseCaptureListenerIfEmpty(): void
	{
		if (this.#exclusiveStack.size > 0)
		{
			return;
		}

		this.#unbindCaptureListener();
	}

	#unbindCaptureListener(): void
	{
		if (!this.#isCaptureListenerBound)
		{
			return;
		}

		Event.unbind(this.#target, 'keydown', this.#handleCaptureKeyDown, CAPTURE_LISTENER_OPTIONS);
		this.#isCaptureListenerBound = false;
	}

	#applyInputEvent(event: KeyboardEvent | PointerEvent, mutate: () => void, modifiersOnly: boolean = false): void
	{
		const holdStates = this.#captureHoldStates(modifiersOnly);
		mutate();
		this.#syncModifiers(event);
		this.#notifyHoldChanges(holdStates, event);
	}

	// Every input event carries the modifier flags, so each of them corrects the tracked set -
	// including a modifier toggled while the window was out of focus.
	#syncModifiers(event: KeyboardEvent | PointerEvent): void
	{
		MODIFIERS.forEach((modifier) => {
			const isDown = event[MODIFIER_EVENT_FLAGS[modifier]] === true;

			if (isDown === this.#hasToken(modifier))
			{
				return;
			}

			if (isDown)
			{
				this.#pressedTokens.add(modifier);

				return;
			}

			[...this.#pressedTokens]
				.filter((pressed) => this.#matchToken(pressed, modifier))
				.forEach((pressed) => this.#pressedTokens.delete(pressed));
		});
	}

	// Runs several times per input event, so the set is read in place: no copy, no re-normalization
	// of a token the caller has already normalized.
	#hasToken(normalizedToken: string): boolean
	{
		if (this.#pressedTokens.has(normalizedToken))
		{
			return true;
		}

		for (const pressed of this.#pressedTokens)
		{
			if (stripSide(pressed) === normalizedToken)
			{
				return true;
			}
		}

		return false;
	}

	// A key an input method sends without a code would land in the set as an empty token.
	#press(token: string): void
	{
		if (Type.isStringFilled(token))
		{
			this.#pressedTokens.add(token);
		}
	}

	#updatePointer(event: PointerEvent): void
	{
		this.#pointer.x = event.clientX;
		this.#pointer.y = event.clientY;
	}

	#trigger(
		registry: Map<string, Array<ComboSubscription>>,
		key: string | null,
		event: KeyboardEvent | PointerEvent,
	): void
	{
		const subscriptions = Type.isStringFilled(key) ? registry.get(key) : null;

		if (Type.isNil(subscriptions))
		{
			return;
		}

		[...subscriptions].forEach((subscription) => {
			if (subscription.preventDefault)
			{
				event.preventDefault();
			}

			subscription.handler(event, this);
		});
	}

	// The combo of an event is built from its own key: a shortcut fires on the key that arrived,
	// not on everything held at that moment.
	#comboFromEvent(event: KeyboardEvent | PointerEvent, token: string): string | null
	{
		if (isModifierToken(token))
		{
			return null;
		}

		const modifiers = MODIFIERS.filter((modifier) => event[MODIFIER_EVENT_FLAGS[modifier]] === true);

		return [...modifiers, token].join(COMBO_SEPARATOR);
	}

	// A suspended registry resolves nothing: the settings panel takes the keyboard for itself while
	// it captures a combo, and the state keeps tracking the held keys throughout. A combo of null is
	// a press of a bare modifier, which names no action either.
	#resolveAction(combo: string | null): string | null
	{
		if (Type.isNil(this.#actionRegistry) || this.#actionRegistry.isSuspended)
		{
			return null;
		}

		return Type.isStringFilled(combo) ? this.#actionRegistry.getAction(combo) : null;
	}

	// An empty registry is answered with null: nothing to compare against, nothing to allocate.
	#captureHoldStates(modifiersOnly: boolean = false): Map<string, boolean> | null
	{
		if (this.#holdSubscriptions.size === 0)
		{
			return null;
		}

		const states: Map<string, boolean> = new Map();
		this.#holdSubscriptions.forEach((handlers, token) => {
			if (modifiersOnly && !isModifierToken(token))
			{
				return;
			}

			states.set(token, this.#hasToken(token));
		});

		return states;
	}

	#notifyHoldChanges(previousStates: Map<string, boolean> | null, event: KeyboardEvent | PointerEvent | null): void
	{
		if (Type.isNil(previousStates))
		{
			return;
		}

		previousStates.forEach((wasPressed, token) => {
			const isPressed = this.#hasToken(token);
			const handlers = this.#holdSubscriptions.get(token);

			if (isPressed === wasPressed || Type.isNil(handlers))
			{
				return;
			}

			[...handlers].forEach((handler) => handler(isPressed, event));
		});
	}

	#addSubscription(
		registry: SubscriptionRegistry,
		key: string,
		subscription: ComboSubscription | HoldHandler | InputStateHandler,
	): void
	{
		const subscriptions = registry.get(key) ?? [];
		subscriptions.push(subscription);
		registry.set(key, subscriptions);
	}

	#removeSubscription(
		registry: SubscriptionRegistry,
		key: string,
		subscription: ComboSubscription | HoldHandler | InputStateHandler,
	): void
	{
		const subscriptions = registry.get(key);

		if (Type.isNil(subscriptions))
		{
			return;
		}

		const index = subscriptions.indexOf(subscription);

		if (index === -1)
		{
			return;
		}

		subscriptions.splice(index, 1);

		if (subscriptions.length === 0)
		{
			registry.delete(key);
		}
	}

	#mouseToken(button: number): string
	{
		return `${MOUSE_TOKEN_PREFIX}${button}`;
	}

	// The physical code keeps a shortcut independent of the layout, but a synthesized event may
	// carry none: assistive technologies and input bridges send the key alone.
	#keyToken(event: KeyboardEvent): string
	{
		if (Type.isStringFilled(event.code))
		{
			return normalizeToken(event.code, this.#isMac);
		}

		// The space arrives as its character, which the trim of the normalization would eat.
		return event.key === SPACE_KEY ? KEY_TOKEN.SPACE : normalizeToken(event.key, this.#isMac);
	}

	#matchToken(pressedToken: string, token: string): boolean
	{
		return pressedToken === token || stripSide(pressedToken) === token;
	}
}
