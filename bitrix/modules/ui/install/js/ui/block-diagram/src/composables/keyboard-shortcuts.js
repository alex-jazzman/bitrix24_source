import { Type } from 'main.core';
import { onMounted, onUnmounted } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { isModifierToken } from '../utils';
import { type ShortcutHandler } from '../types';

// A record names the keys it fires on or the action it runs, never both: which keys run an action
// is the answer of the action registry, and a record that also spelled them out would contradict it.
type ShortcutConfig = {
	keys?: string[],
	actionId?: string,
	handler: ShortcutHandler,
	// Omitted means the browser action is suppressed, as it always was. A record opts out when the
	// handler decides for itself whether the press belongs to the browser.
	preventDefault?: boolean,
};

// A record has to name a key to fire on: a modifier alone never triggers a shortcut. Which
// spellings count as a modifier is InputState's answer, so the two never drift apart.
function hasMainKey(keys: string[]): boolean
{
	return Type.isArrayFilled(keys) && keys.some((key) => {
		if (!Type.isStringFilled(key) || !Type.isStringFilled(key.trim()))
		{
			return false;
		}

		return !isModifierToken(key);
	});
}

// A broken record is reported and dropped, the way a record without a main key always was: one
// mistake in a list of shortcuts must not take the working neighbours down with it.
function isValidConfig({ keys, actionId }: ShortcutConfig): boolean
{
	if (Type.isStringFilled(actionId))
	{
		if (!Type.isArrayFilled(keys))
		{
			return true;
		}

		console.error('ui.block-diagram: invalid shortcut config, keys and actionId are exclusive', actionId);

		return false;
	}

	if (hasMainKey(keys))
	{
		return true;
	}

	console.error('ui.block-diagram: invalid shortcut config, no main key found', keys);

	return false;
}

/**
 * Registers diagram shortcuts on the input state owned by the canvas. Kept as a thin adapter: the
 * signature is public API, consumers live outside this repository.
 *
 * A record registers either by its combo, as it always did, or by the id of the action it runs -
 * then which press reaches it is decided by the action registry of the canvas and may change
 * without remounting the consumer.
 */
export function useKeyboardShortcuts(shortcutsConfig: ShortcutConfig[]): void
{
	const { inputState } = useBlockDiagram();

	const configs = shortcutsConfig.filter(isValidConfig);

	let unsubscribes: Array<() => void> = [];

	onMounted(() => {
		unsubscribes = configs.map(({ keys, actionId, handler, preventDefault }) => {
			const listener = (event) => handler(event, inputState.pointer);

			if (Type.isStringFilled(actionId))
			{
				return inputState.onAction(actionId, listener, { preventDefault });
			}

			// The record goes as a list, not as a joined string: '+' is a key of its own and a
			// joined string has no way to tell it from the separator.
			return inputState.on(keys, listener, { preventDefault });
		});
	});

	onUnmounted(() => {
		unsubscribes.forEach((unsubscribe) => unsubscribe());
		unsubscribes = [];
	});
}
