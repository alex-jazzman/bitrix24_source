import { Browser } from 'main.core';

// OS-dependent modifier keys. Values render directly in UI shortcut combos.
export interface Hotkey
{
	readonly action: string;
	readonly option: string;
	readonly control: string;
}

const isMac = Browser.isMac();

export const hotkey: Hotkey = {
	action: isMac ? '⌘' : 'Ctrl',    // Cmd / Ctrl — primary action modifier (save, copy, paste, ...)
	option: isMac ? '⌥' : 'Alt',     // Option / Alt — secondary modifier
	control: 'Ctrl',                  // literal Control key (same label on both platforms)
};
