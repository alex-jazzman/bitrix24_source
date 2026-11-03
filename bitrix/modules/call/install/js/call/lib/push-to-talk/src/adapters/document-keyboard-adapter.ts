import { Event, Type } from 'main.core';
import { type KeyboardConfig, type KeyboardPort } from '../port/keyboard-port';
import { type KeyCycleOwnership } from './key-cycle-ownership';

const SPACE_CODE = 'Space';
const INPUT_TAG = 'INPUT';
const TEXTAREA_TAG = 'TEXTAREA';
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'SELECT', 'SUMMARY']);
// an input of any other type is a field
const ACTIVATABLE_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'image', 'file']);
// every role whose WAI-ARIA pattern makes space the activation key - `slider` is driven by the arrows,
// Home/End and PageUp/PageDown, and a widget on `aria-activedescendant` acts through a descendant this
// check never sees
export const ACTIVATABLE_ROLES = new Set([
	'button',
	'checkbox',
	'radio',
	'switch',
	'option',
	'menuitem',
	'menuitemcheckbox',
	'menuitemradio',
	'tab',
	'treeitem',
	'combobox',
]);
const MEDIA_TAGS = new Set(['VIDEO', 'AUDIO']);

// the capture phase is the only one that always reaches us: a stopPropagation() anywhere on the page
// would otherwise swallow the release and leave the microphone open until the liveness sensor
const LISTENER_OPTIONS = { capture: true };

function hasModifier(event: KeyboardEvent): boolean
{
	return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
}

/**
 * What counts as a field, for this adapter and for the indication one: a keystroke is never taken from
 * a field, and neither is the focus ring of one. An input of an unknown kind counts as text entry. The
 * type is read here and not through the activation check, where a role answers first and
 * `<input type="text" role="combobox">` would pass as activatable.
 */
export function isTextEntry(element: Element): boolean
{
	if (element.tagName === TEXTAREA_TAG || (element as HTMLElement).isContentEditable)
	{
		return true;
	}

	return element.tagName === INPUT_TAG && !ACTIVATABLE_INPUT_TYPES.has((element as HTMLInputElement).type);
}

/**
 * Turns space presses of one document into policy calls. The same class serves the call window
 * document and the document of the Picture-in-Picture window - the rules do not differ, only the
 * document does. A frame inside the call window is a document of its own and gets no adapter.
 */
export class DocumentKeyboardAdapter implements KeyboardPort
{
	readonly #targetDocument: Document;
	readonly #keyCycle: KeyCycleOwnership;
	readonly #onKeyDown: (repeat: boolean, targetActivatesOnSpace: boolean) => boolean;
	readonly #onKeyUp: () => boolean;

	constructor(targetDocument: Document, keyCycle: KeyCycleOwnership, config: KeyboardConfig)
	{
		this.#targetDocument = targetDocument;
		this.#keyCycle = keyCycle;
		this.#onKeyDown = config.onKeyDown;
		this.#onKeyUp = config.onKeyUp;
	}

	start(): void
	{
		Event.bind(this.#targetDocument, 'keydown', this.#handleKeyDown, LISTENER_OPTIONS);
		Event.bind(this.#targetDocument, 'keyup', this.#handleKeyUp, LISTENER_OPTIONS);
	}

	stop(): void
	{
		Event.unbind(this.#targetDocument, 'keydown', this.#handleKeyDown, LISTENER_OPTIONS);
		Event.unbind(this.#targetDocument, 'keyup', this.#handleKeyUp, LISTENER_OPTIONS);
	}

	readonly #handleKeyDown = (event: KeyboardEvent): void => {
		if (event.code !== SPACE_CODE || event.isComposing)
		{
			return;
		}

		// a combination with a modifier is somebody else's gesture, and the start of the cycle decides:
		// a modifier pressed mid-hold arrives on the auto-repeats and must not disown a hold already taken
		if (!event.repeat)
		{
			this.#keyCycle.begin(hasModifier(event));
		}

		if (this.#keyCycle.isForeign())
		{
			return;
		}

		const target = this.#resolveTarget(event);

		if (this.#isTypingTarget(target))
		{
			return;
		}

		if (this.#onKeyDown(event.repeat, this.#activatesOnSpace(target)))
		{
			event.preventDefault();
		}
	};

	// the target is not checked here: focus moved by mouse into a foreign field during a hold would
	// otherwise keep the microphone open until the liveness sensor
	readonly #handleKeyUp = (event: KeyboardEvent): void => {
		if (event.code !== SPACE_CODE)
		{
			return;
		}

		// the modifiers of the release say nothing - one can be pressed or let go mid-hold, leaving an
		// open microphone open; what decides is how the cycle started
		if (this.#keyCycle.isForeign())
		{
			this.#keyCycle.end();

			return;
		}

		if (this.#onKeyUp())
		{
			event.preventDefault();
		}
	};

	// an event that crossed a shadow boundary arrives retargeted to the host, whose tag and role say
	// nothing about the element the focus is actually on
	#resolveTarget(event: KeyboardEvent): EventTarget | null
	{
		return event.composedPath()[0] ?? event.target;
	}

	#isTypingTarget(target: EventTarget | null): boolean
	{
		return Type.isElementNode(target) && isTextEntry(target);
	}

	#activatesOnSpace(target: EventTarget | null): boolean
	{
		if (!Type.isElementNode(target))
		{
			return false;
		}

		if (ACTIVATABLE_ROLES.has(target.getAttribute('role') ?? ''))
		{
			return true;
		}

		if (target.tagName === INPUT_TAG)
		{
			return ACTIVATABLE_INPUT_TYPES.has((target as HTMLInputElement).type);
		}

		// space plays and pauses a media element only while the browser draws its own controls:
		// without them the press has no native action of the element to take away
		if (MEDIA_TAGS.has(target.tagName))
		{
			return (target as HTMLMediaElement).controls;
		}

		return ACTIVATABLE_TAGS.has(target.tagName);
	}
}
