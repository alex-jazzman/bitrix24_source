import { Dom, Text, Type } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import './style.css';

export type AirMessageBoxOptions = {
	title: string,
	message: string,
	maxWidth?: number,
	className?: string | null,
	popupOptions?: Object,
	buttonsFactory?: (messageBox: MessageBox) => Array<Object> | null,
};

const DEFAULT_MAX_WIDTH = 650;
const MIN_TAIL_LENGTH = 12;
const MAX_TAIL_LENGTH = 20;

export function showAirMessageBox(options: AirMessageBoxOptions): MessageBox | null
{
	const messageBox = MessageBox.create({
		title: options.title,
		message: options.message,
		modal: true,
		useAirDesign: true,
		maxWidth: options.maxWidth ?? DEFAULT_MAX_WIDTH,
		popupOptions: options.popupOptions ?? {},
	});

	if (Type.isFunction(options.buttonsFactory))
	{
		const buttons = options.buttonsFactory(messageBox);
		if (buttons === null)
		{
			return null;
		}

		messageBox.setButtons(buttons);
	}

	const popupContainer = messageBox.getPopupWindow().getPopupContainer();
	Dom.addClass(popupContainer, 'disk-air-message-box-fit-content');
	if (options.className)
	{
		Dom.addClass(popupContainer, options.className);
	}

	messageBox.show();

	return messageBox;
}

/**
 * Replaces the #NAME# placeholder with an overflow-safe file name: the head shrinks with an
 * ellipsis while the tail with the extension stays visible. Screen readers get the whole name.
 */
export function formatFileName(message: string, name: string): string
{
	const safeName = Text.encode(name);
	const chars = [...name];
	const dotIndex = chars.lastIndexOf('.');
	const extLength = dotIndex > 0 ? chars.length - dotIndex : 0;
	const tailLength = Math.min(chars.length, Math.max(MIN_TAIL_LENGTH, Math.min(extLength + 2, MAX_TAIL_LENGTH)));
	const head = Text.encode(chars.slice(0, chars.length - tailLength).join(''));
	const tail = Text.encode(chars.slice(chars.length - tailLength).join(''));

	const fileName = `<span class="disk-air-message-box-file-name-sr-only">${safeName}</span>`
		+ `<span class="disk-air-message-box-file-name" aria-hidden="true">${head}</span>`
		+ `<span class="disk-air-message-box-file-name-tail" aria-hidden="true">${tail}</span>`;

	const wrapFileName = (leftPart: string, rightPart: string): string => {
		return '<span class="disk-air-message-box-file-name-wrapper"'
			+ ' data-testid="disk-air-message-box-file-name"'
			+ ` title="${safeName}">${leftPart}${fileName}${rightPart}</span>`;
	};

	return message
		.replaceAll(/(["'])#NAME#\1(\?)/g, (match, quote, questionMark) => wrapFileName(quote, `${quote}&nbsp;${questionMark}`))
		.replaceAll(/(["'])#NAME#\1/g, (match, quote) => wrapFileName(quote, quote))
		.replaceAll(/#NAME#(\?)/g, (match, questionMark) => wrapFileName('', questionMark))
		.replaceAll('#NAME#', () => wrapFileName('', ''));
}
