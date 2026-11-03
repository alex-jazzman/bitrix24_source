import { Browser } from 'main.core';

export type PlatformKeystroke = {
	mac: string,
	other: string,
};

/**
 * Whether the editor runs on an Apple platform, for shortcut purposes: the whole family, not the
 * desktop alone. Browser.isMac() answers for the Mac only -- an iPhone with a keyboard attached
 * takes Cmd where a Mac does, and reads Ctrl+K as the system delete-to-end-of-line just the same.
 */
export function isApplePlatform(): boolean
{
	return Browser.isMac() || Browser.isIPad() || Browser.isIPhone();
}

/** How a shortcut reads on the platform the editor runs on: the caption of a button, not its key handler. */
export function getKeystrokeCaption(keystroke: PlatformKeystroke): string
{
	return isApplePlatform() ? keystroke.mac : keystroke.other;
}

/**
 * Whether the event carries the modifier that turns a plain key into an editor command. Which of
 * the two a given shortcut then accepts is the shortcut's own business: Ctrl+K, for one, belongs
 * to the system on Apple and is not ours to take.
 */
export function hasCommandModifier(event: KeyboardEvent): boolean
{
	return event.ctrlKey || event.metaKey;
}
