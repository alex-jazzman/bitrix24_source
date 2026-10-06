import { Browser } from 'main.core';

// Symbol per modifier for macOS vs. everything else. `Mod` is TipTap's
// platform-agnostic token that resolves to Cmd on macOS, Ctrl otherwise.
const MODIFIERS = {
	Mod: { mac: '⌘', other: 'Ctrl' },
	Ctrl: { mac: '⌃', other: 'Ctrl' },
	Alt: { mac: '⌥', other: 'Alt' },
	Shift: { mac: '⇧', other: 'Shift' },
};

/**
 * Render a TipTap mod-notation combo for the current OS.
 * macOS packs symbols with no separator (⌘⇧L); other platforms join with "+" (Ctrl+Shift+L).
 * Bare keys without modifiers (e.g. "?", "/") render as-is.
 */
export function formatShortcut(combo: string): string
{
	if (!combo)
	{
		return '';
	}

	const isMac = Browser.isMac();
	const parts = String(combo).split('-').map((token) => {
		const modifier = MODIFIERS[token];
		if (modifier)
		{
			return isMac ? modifier.mac : modifier.other;
		}

		// Single-letter keys are shown uppercase; symbols and digits are left untouched.
		return token.length === 1 ? token.toUpperCase() : token;
	});

	return isMac ? parts.join('') : parts.join('+');
}
