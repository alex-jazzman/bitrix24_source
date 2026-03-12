import { Parser } from 'im.v2.lib.parser';
import { Quote } from 'im.v2.lib.quote';
import { Utils } from 'im.v2.lib.utils';

export { ResizeManager } from './classes/resize-manager';

type InsertTextConfig = {
	text: string,
	withNewLine?: boolean,
	replace?: boolean
};

type InsertMentionConfig = {
	textToInsert: string,
	textToReplace?: string
};

const TAB = '\t';
const NEW_LINE = '\n';
const LETTER_CODE_PREFIX = 'Key';

/* eslint-disable no-param-reassign */
export const Textarea = {
	prepareInlineQuote(textarea: HTMLTextAreaElement): string
	{
		const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
		if (!selectedText)
		{
			return textarea.value;
		}

		const quoteText = Parser.prepareQuote({}, selectedText);

		const textBefore = textarea.value.slice(0, textarea.selectionStart);
		const textAfter = textarea.value.slice(textarea.selectionEnd);

		return Quote.prepareInlineQuote(textBefore, textAfter, quoteText);
	},
	addTab(textarea: HTMLTextAreaElement): string
	{
		const newSelectionPosition = textarea.selectionStart + 1;

		const textBefore = textarea.value.slice(0, textarea.selectionStart);
		const textAfter = textarea.value.slice(textarea.selectionEnd);
		const textWithTab = `${textBefore}${TAB}${textAfter}`;

		textarea.value = textWithTab;
		textarea.selectionStart = newSelectionPosition;
		textarea.selectionEnd = newSelectionPosition;

		return textWithTab;
	},
	removeTab(textarea: HTMLTextAreaElement): string
	{
		const previousSymbol = textarea.value.slice(textarea.selectionStart - 1, textarea.selectionStart);
		if (previousSymbol !== TAB)
		{
			return textarea.value;
		}

		const newSelectionPosition = textarea.selectionStart - 1;

		const textBefore = textarea.value.slice(0, textarea.selectionStart - 1);
		const textAfter = textarea.value.slice(textarea.selectionEnd);
		const textWithoutTab = `${textBefore}${textAfter}`;

		textarea.value = textWithoutTab;
		textarea.selectionStart = newSelectionPosition;
		textarea.selectionEnd = newSelectionPosition;

		return textWithoutTab;
	},
	handleDecorationTag(textarea: HTMLTextAreaElement, decorationKey: 'KeyB' | 'KeyI' | 'KeyU' | 'KeyS' | 'code'): string
	{
		decorationKey = decorationKey.replace(LETTER_CODE_PREFIX, '').toLowerCase();
		const LEFT_TAG = `[${decorationKey}]`;
		const RIGHT_TAG = `[/${decorationKey}]`;

		const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
		if (!selectedText)
		{
			return textarea.value;
		}

		const hasDecorationTag = (
			selectedText.toLowerCase().startsWith(LEFT_TAG)
			&& selectedText.toLowerCase().endsWith(RIGHT_TAG)
		);
		if (hasDecorationTag)
		{
			return this.removeDecorationTag(textarea, decorationKey);
		}
		else
		{
			return this.addDecorationTag(textarea, decorationKey);
		}
	},
	addDecorationTag(textarea: HTMLTextAreaElement, decorationKey: 'b' | 'i' | 'u' | 's' | 'code'): string
	{
		const LEFT_TAG = `[${decorationKey}]`;
		const RIGHT_TAG = `[/${decorationKey}]`;

		return this.applyWrapping(textarea, LEFT_TAG, RIGHT_TAG);
	},
	removeDecorationTag(textarea: HTMLTextAreaElement, decorationKey: 'b' | 'i' | 'u' | 's' | 'code'): string
	{
		const LEFT_TAG = `[${decorationKey}]`;
		const RIGHT_TAG = `[/${decorationKey}]`;

		const decorationTagLength = LEFT_TAG.length + RIGHT_TAG.length;
		const newSelectionStart = textarea.selectionStart;
		const newSelectionEnd = textarea.selectionEnd - decorationTagLength;

		const textBefore = textarea.value.slice(0, textarea.selectionStart);

		const textInTagStart = textarea.selectionStart + LEFT_TAG.length;
		const textInTagEnd = textarea.selectionEnd - RIGHT_TAG.length;
		const textInTag = textarea.value.slice(textInTagStart, textInTagEnd);

		const textAfter = textarea.value.slice(textarea.selectionEnd);
		const textWithoutTag = `${textBefore}${textInTag}${textAfter}`;

		textarea.value = textWithoutTag;
		textarea.selectionStart = newSelectionStart;
		textarea.selectionEnd = newSelectionEnd;

		return textWithoutTag;
	},
	addNewLine(textarea: HTMLTextAreaElement): string
	{
		const newSelectionPosition = textarea.selectionStart + 1;

		const textBefore = textarea.value.slice(0, textarea.selectionStart);
		const textAfter = textarea.value.slice(textarea.selectionEnd);
		const textWithNewLine = `${textBefore}${NEW_LINE}${textAfter}`;

		textarea.value = textWithNewLine;
		textarea.selectionStart = newSelectionPosition;
		textarea.selectionEnd = newSelectionPosition;

		return textWithNewLine;
	},
	insertText(textarea: HTMLTextAreaElement, config: InsertTextConfig = {}): string
	{
		const { text, withNewLine = false, replace = false } = config;
		const newSelectionPosition: number = textarea.selectionStart + text.length + 1;
		let resultText = '';

		if (replace)
		{
			resultText = '';
			textarea.value = '';
			textarea.selectionStart = 0;
			textarea.selectionEnd = 0;
		}

		if (textarea.value.length === 0)
		{
			resultText = text;
		}
		else
		{
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			resultText = withNewLine ? `${textarea.value}${NEW_LINE}${text}` : `${textBefore} ${text} ${textAfter}`;
		}

		textarea.focus({ preventScroll: true });
		textarea.value = resultText;
		textarea.selectionStart = newSelectionPosition;
		textarea.selectionEnd = newSelectionPosition;

		return resultText;
	},
	insertMention(textarea: HTMLTextAreaElement, config: InsertMentionConfig = {}): string
	{
		const { textToInsert, textToReplace = '' } = config;
		const isMentionWithSymbol = textToReplace.length > 0;
		let resultText = '';
		let newSelectionPosition = textarea.selectionStart + textToInsert.length + 1;

		if (isMentionWithSymbol)
		{
			newSelectionPosition -= textToReplace.length;
			const textBefore = textarea.value.slice(0, textarea.selectionStart - textToReplace.length);
			const textAfter = textarea.value.slice(textarea.selectionStart);
			resultText = `${textBefore}${textToInsert} ${textAfter}`;
		}
		else
		{
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);

			resultText = `${textBefore}${textToInsert} ${textAfter}`;
		}

		textarea.focus({ preventScroll: true });
		textarea.value = resultText;
		textarea.selectionStart = newSelectionPosition;
		textarea.selectionEnd = newSelectionPosition;

		return resultText;
	},
	addUrlTag(textarea: HTMLTextAreaElement, linkUrl: string): string
	{
		if (!this.shouldHandleUrl(textarea, linkUrl))
		{
			return textarea.value;
		}

		return this.applyUrlWrapping(textarea, linkUrl);
	},
	handlePasteUrl(textarea: HTMLTextAreaElement, event: ClipboardEvent): string
	{
		const pastedLinkUrl = event.clipboardData?.getData('text/plain');

		if (!this.shouldHandleUrl(textarea, pastedLinkUrl))
		{
			return textarea.value;
		}

		event.preventDefault();

		return this.applyUrlWrapping(textarea, pastedLinkUrl);
	},
	shouldHandleUrl(textarea: HTMLTextAreaElement, linkUrl: string): boolean
	{
		const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
		const isUrl = Utils.text.checkUrl(linkUrl);

		return isUrl && selectedText;
	},
	applyUrlWrapping(textarea: HTMLTextAreaElement, linkUrl: string): string
	{
		const LEFT_TAG = `[URL=${linkUrl}]`;
		const RIGHT_TAG = '[/URL]';

		return this.applyWrapping(textarea, LEFT_TAG, RIGHT_TAG);
	},
	applyWrapping(textarea: HTMLTextAreaElement, leftTag: string, rightTag: string): string
	{
		const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
		const decorationTagLength = leftTag.length + rightTag.length;
		const newSelectionStart = textarea.selectionStart;
		const newSelectionEnd = textarea.selectionEnd + decorationTagLength;

		const textBefore = textarea.value.slice(0, textarea.selectionStart);
		const textAfter = textarea.value.slice(textarea.selectionEnd);
		const textWithTag = `${textBefore}${leftTag}${selectedText}${rightTag}${textAfter}`;

		textarea.value = textWithTag;
		textarea.selectionStart = newSelectionStart;
		textarea.selectionEnd = newSelectionEnd;

		return textWithTag;
	},
};
