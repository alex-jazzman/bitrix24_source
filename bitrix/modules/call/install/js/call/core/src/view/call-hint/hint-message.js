import { Loc, Text, Type } from 'main.core';

const SpaceHotkeyPhrase = 'IM_CALL_MIC_MUTED_WHILE_TALKING_HOTKEY';
const FoldedCallHotkeyPhrase = 'IM_CALL_MIC_MUTED_WHILE_TALKING_FOLDED_CALL_HOTKEY';

// U+2318 is the Command key
const MacHotkey = 'Shift + ⌘ + A';
const WindowsHotkey = 'Ctrl + Shift + A';

const HotkeyClassName = 'bx-call-view-popup-call-hint-text-hotkey';
const HotkeyTestId = 'call-hint-hotkey';

const BlockTag = /<\/?(?:br|div|li|p)\b[^>]*>/gi;
const AnyTag = /<[^>]*>/g;

/**
 * Both representations of one hint message, built in a single pass from the same source -
 * that is what makes the shown and the announced text impossible to diverge.
 *
 * @typedef {object} HintMessage
 * @property {string} html - marked-up representation, goes into the popup content
 * @property {string} text - flat text, goes to LiveAnnouncer.announce; never used as an accessible name
 */

/**
 * @typedef {object} HintMessageOptions
 * @property {string} title - message body; may arrive as ready-made markup
 * @property {boolean} isDesktop - desktop application, the only place the letter shortcut is bound
 * @property {boolean} isPushToTalkAvailable - hold-to-talk works here, so the space line makes sense
 * @property {boolean} isMac - macOS keyboard layout, passed in rather than read from the browser
 * @property {boolean} callFolded - call window is folded, so the hotkey is the one that unfolds it
 * @property {boolean} showSpaceHint - whether the hotkey hint is needed at all
 * @property {string} buttonsLayout - 'right' | 'bottom'
 */

/**
 * Builds the hint message. Pure: no DOM, no popup, no global state.
 *
 * @param {HintMessageOptions} options
 * @return {HintMessage}
 */
export function buildHintMessage(options = {})
{
	const {
		title = '',
		isDesktop = false,
		isPushToTalkAvailable = false,
		isMac = false,
		callFolded = false,
		showSpaceHint = false,
		buttonsLayout = 'right',
	} = options;

	const hotkeyMessage = showSpaceHint
		? resolveHotkeyMessage({ isDesktop, isPushToTalkAvailable, isMac, callFolded })
		: '';

	if (hotkeyMessage === '')
	{
		return {
			html: title,
			text: toPlainText(title),
		};
	}

	const lineBreak = buttonsLayout === 'bottom' ? '' : '<br>';

	return {
		html: `${title}${lineBreak}<span class="${HotkeyClassName}" data-testid="${HotkeyTestId}">`
			+ `${hotkeyMessage}</span>`,
		text: [toPlainText(title), toPlainText(hotkeyMessage)].filter(Boolean).join(' '),
	};
}

/**
 * Two lines, two conditions. Holding space works wherever the hold-to-talk mode is available, while
 * the letter shortcut that unfolds the window is bound in the desktop application alone - so in the
 * web a folded window says nothing at all.
 *
 * @param {object} params
 * @param {boolean} params.isDesktop
 * @param {boolean} params.isPushToTalkAvailable
 * @param {boolean} params.isMac
 * @param {boolean} params.callFolded
 * @return {string} the phrase, or an empty string when neither line applies
 */
function resolveHotkeyMessage({ isDesktop, isPushToTalkAvailable, isMac, callFolded })
{
	if (callFolded)
	{
		return isDesktop
			? Loc.getMessage(FoldedCallHotkeyPhrase, { '#HOTKEY#': isMac ? MacHotkey : WindowsHotkey })
			: '';
	}

	return isPushToTalkAvailable ? Loc.getMessage(SpaceHotkeyPhrase) : '';
}

/**
 * Part of the input arrives as ready-made markup and cannot be built otherwise: the title is
 * assembled with <p> by the notification service, and the hotkey phrase carries <b> in the
 * localization source itself. Block tags turn into a space so that sentences do not glue together;
 * entities are decoded only after the tags are gone, so encoded text is never taken for markup.
 *
 * @param {string} value
 * @return {string}
 */
function toPlainText(value)
{
	if (!Type.isStringFilled(value))
	{
		return '';
	}

	return Text.decode(value.replaceAll(BlockTag, ' ').replaceAll(AnyTag, ''))
		.replaceAll(/\s+/g, ' ')
		.trim();
}
