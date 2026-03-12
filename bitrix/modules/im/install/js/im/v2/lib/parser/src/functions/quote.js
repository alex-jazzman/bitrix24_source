import { Dom, Tag, Loc, Type } from 'main.core';

import { ParserUtils } from '../utils/utils';
import { getUtils, getConst } from '../utils/core-proxy';
import { ParserIcon } from './icon';

import type { ApplicationContext } from 'im.v2.const';

const { EventType } = getConst();

const QUOTE_SIGN = '&gt;&gt;';
const NO_CONTEXT_TAG = 'none';
const PREVIEW_LINE_LIMIT = 4;
const PREVIEW_CHARS_PER_LINE = 80;
const BR_HTML_TAG = '<br />';
const CLASS_QUOTE_BASE = 'bx-im-message-quote';
const CLASS_QUOTE_WRAP = 'bx-im-message-quote__wrap';
const CLASS_QUOTE_TEXT = 'bx-im-message-quote__text';
const CLASS_QUOTE_TOGGLE = 'bx-im-message-quote__toggle';
const CLASS_EXPANDED = '--expanded';
const CLASS_COLLAPSED = '--collapsed';
const CLASS_CLICKABLE = '--clickable';

export const ParserQuote = {

	decodeArrowQuote(text: string): string
	{
		if (!text.includes(QUOTE_SIGN))
		{
			return text;
		}

		let isProcessed = false;
		const quoteStartIndexes = new Set();
		const quoteEndIndexes = new Set();

		const textLines = text.split(BR_HTML_TAG);
		for (let i = 0; i < textLines.length; i++)
		{
			if (!textLines[i].startsWith(QUOTE_SIGN))
			{
				continue;
			}

			const quoteStartIndex = i;
			quoteStartIndexes.add(quoteStartIndex);

			textLines[quoteStartIndex] = textLines[quoteStartIndex].replace(QUOTE_SIGN, '');
			while (++i < textLines.length && textLines[i].startsWith(QUOTE_SIGN))
			{
				textLines[i] = textLines[i].replace(QUOTE_SIGN, '');
			}
			const quoteEndIndex = i - 1;
			quoteEndIndexes.add(quoteEndIndex);

			const quoteTextLines = textLines.slice(quoteStartIndex, quoteEndIndex + 1);
			const quoteText = quoteTextLines.join(BR_HTML_TAG);
			const collapsedClass = isQuoteExpandableByText(quoteText) ? ` ${CLASS_COLLAPSED}` : '';
			const containerEnd = '</div>';

			textLines[quoteStartIndex] = `<div data-context="${NO_CONTEXT_TAG}" class="${CLASS_QUOTE_BASE}${collapsedClass}"><div class="${CLASS_QUOTE_WRAP}"><div class="${CLASS_QUOTE_TEXT}">${textLines[quoteStartIndex]}`;
			textLines[quoteEndIndex] += `${containerEnd}${getToggleButton({ quoteText })}${containerEnd}${containerEnd}`;

			isProcessed = true;
		}

		if (!isProcessed)
		{
			return text;
		}

		return joinArrowQuoteLines(textLines, quoteStartIndexes, quoteEndIndexes);
	},

	purifyArrowQuote(text, spaceLetter = ' '): string
	{
		return text.replaceAll(
			new RegExp(`^(${QUOTE_SIGN}(.*))`, 'gim'),
			ParserIcon.getQuoteBlock() + spaceLetter,
		);
	},

	decodeQuote(text, { contextDialogId = '' } = {}): string
	{
		return text.replaceAll(
			/-{54}(<br \/>(.*?)\[(.*?)]( #(?:chat\d+|\d+:\d+)\/\d+)?)?<br \/>(.*?)-{54}(<br \/>)?/gs,
			(whole, userBlock, userName, timeTag, contextTag, quoteText): string => {
				const preparedQuoteText = getQuoteText(userName, timeTag, quoteText);
				const userContainer = getUserBlock(userName, timeTag);
				const finalContextTag = getFinalContextTag(contextTag, contextDialogId);

				const clickableClass = finalContextTag === NO_CONTEXT_TAG ? '' : ` ${CLASS_CLICKABLE}`;
				const collapsedClass = isQuoteExpandableByText(preparedQuoteText) ? ` ${CLASS_COLLAPSED}` : '';
				const layout = Tag.render`
					<div class='${CLASS_QUOTE_BASE}${collapsedClass}${clickableClass}' data-context='${finalContextTag}'>
						<div class='${CLASS_QUOTE_WRAP}'>
							${userContainer}
							<div class='${CLASS_QUOTE_TEXT}'>${preparedQuoteText}</div>
							${getToggleButton({ quoteText: preparedQuoteText })}
						</div>
					</div>
				`;

				return layout.outerHTML;
			},
		);
	},

	purifyQuote(text: string, spaceLetter: string = ' '): string
	{
		return text.replaceAll(
			/-{54}(.*?)-{54}/gims,
			ParserIcon.getQuoteBlock() + spaceLetter,
		);
	},

	decodeCode(text: string): string
	{
		return text.replaceAll(/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code](<br \/>)?/gis, (whole, br, code) => {
			return Dom.create({
				tag: 'div',
				attrs: { className: 'bx-im-message-content-code' },
				html: code,
			}).outerHTML;
		});
	},

	purifyCode(text: string, spaceLetter: string = ' '): string
	{
		return text.replaceAll(
			/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code]/gis,
			ParserIcon.getCodeBlock() + spaceLetter,
		);
	},

	executeClickEvent(
		event: PointerEvent,
		context: ApplicationContext,
	)
	{
		const target = getUtils().dom.recursiveBackwardNodeSearch(event.target, CLASS_QUOTE_BASE);
		if (!target)
		{
			return;
		}

		if (shouldStopQuoteClick(event))
		{
			event.stopPropagation();

			return;
		}

		const isExpandable = isQuoteExpandable(target);

		updateToggleButtonVisibility(target, isExpandable);

		if (target.dataset.context === NO_CONTEXT_TAG)
		{
			handleQuoteToggle(target, isExpandable);

			return;
		}

		const isToggleClick = isToggleButtonClick(event.target);
		if (isToggleClick)
		{
			if (!isExpandable)
			{
				return;
			}

			toggleQuoteState(target);

			return;
		}

		const [dialogId, messageId] = target.dataset.context.split('/');

		const { emitter } = context;
		emitter.emit(EventType.dialog.goToMessageContext, {
			messageId: Number.parseInt(messageId, 10),
			dialogId: dialogId.toString(),
		});
	},
};

const getQuoteText = (userName, timeTag, text): string => {
	const hasUserBlock = userName && timeTag;
	if (!hasUserBlock && !text)
	{
		// the case, when inside the quote we have only some string in square brackets
		return String(timeTag);
	}

	if (text.endsWith(BR_HTML_TAG))
	{
		return text.slice(0, -BR_HTML_TAG.length);
	}

	return text;
};

const getUserBlock = (userName: string, timeTag: string): HTMLElement | '' => {
	const hasDataForUserBlock = userName && timeTag;
	if (!hasDataForUserBlock)
	{
		return '';
	}

	return Tag.render`
		<div class='bx-im-message-quote__name'>
			<div class="bx-im-message-quote__name-text">${userName.trim()}</div>
			<div class="bx-im-message-quote__name-time">${timeTag.trim()}</div>
		</div>
	`;
};

const getFinalContextTag = (contextTag: string, contextDialogId: string): string => {
	if (!contextTag)
	{
		return NO_CONTEXT_TAG;
	}

	const tagWithoutHashSign = contextTag.trim().slice(1);
	const finalContextTag = ParserUtils.getFinalContextTag(tagWithoutHashSign);
	if (!isQuoteFromTheSameChat(finalContextTag, contextDialogId))
	{
		return NO_CONTEXT_TAG;
	}

	return finalContextTag;
};

const joinArrowQuoteLines = (
	textLines: Array<string>,
	quoteStartIndexes: Set<number>,
	quoteEndIndexes: Set<number>,
): string => {
	let result = '';

	for (let i = 0; i < textLines.length; i++)
	{
		const isCompactQuoteSeparator = (
			textLines[i].trim() === ''
			&& quoteEndIndexes.has(i - 1)
			&& quoteStartIndexes.has(i + 1)
		);
		if (!isCompactQuoteSeparator)
		{
			result += textLines[i];
		}

		const isLastLine = i >= textLines.length - 1;
		if (isLastLine || quoteEndIndexes.has(i) || isCompactQuoteSeparator)
		{
			continue;
		}

		result += BR_HTML_TAG;
	}

	return result;
};

const getToggleButton = ({ quoteText, isExpanded = false }: { quoteText: string, isExpanded?: boolean }): string => {
	if (!Type.isStringFilled(quoteText))
	{
		return '';
	}

	if (!isQuoteExpandableByText(quoteText))
	{
		return '';
	}

	const label = getToggleLabel(isExpanded);

	return `<button type="button" class="${CLASS_QUOTE_TOGGLE}">${label}</button>`;
};

const getToggleLabel = (isExpanded: boolean): string => {
	const phraseCode = isExpanded ? 'IM_PARSER_QUOTE_COLLAPSE' : 'IM_PARSER_QUOTE_EXPAND';

	return Loc.getMessage(phraseCode);
};

const isQuoteFromTheSameChat = (finalContextTag: string, dialogId: string): boolean => {
	const contextDialogId = ParserUtils.getDialogIdFromFinalContextTag(finalContextTag);

	return contextDialogId === dialogId;
};

const isQuoteExpandable = (target: HTMLElement): boolean => {
	const textNode = target.querySelector(`.${CLASS_QUOTE_TEXT}`);
	if (!textNode)
	{
		return false;
	}

	const isExpanded = Dom.hasClass(target, CLASS_EXPANDED);

	return isExpanded || textNode.scrollHeight > textNode.clientHeight + 1;
};

const isQuoteExpandableByText = (quoteText: string): boolean => {
	const lines = quoteText.split(BR_HTML_TAG);
	let virtualLineCount = 0;

	for (const line of lines)
	{
		const plainText = line.replaceAll(/<[^>]+>/g, '').trim();
		virtualLineCount += Math.max(1, Math.ceil(plainText.length / PREVIEW_CHARS_PER_LINE));
		if (virtualLineCount > PREVIEW_LINE_LIMIT)
		{
			return true;
		}
	}

	return false;
};

const isToggleButtonClick = (target: EventTarget): boolean => {
	const targetElement = target instanceof HTMLElement ? target : null;
	if (!targetElement)
	{
		return false;
	}

	return Boolean(targetElement.closest(`.${CLASS_QUOTE_TOGGLE}`));
};

const shouldStopQuoteClick = (event: PointerEvent): boolean => {
	const isInteractiveClick = (
		event.target instanceof HTMLElement
		&& event.target.closest('a')
	);
	if (isInteractiveClick)
	{
		return true;
	}

	const selection = window.getSelection().toString().trim();

	return Type.isStringFilled(selection);
};

const handleQuoteToggle = (target: HTMLElement, isExpandable: boolean): boolean => {
	if (isExpandable)
	{
		Dom.addClass(target, CLASS_CLICKABLE);
	}
	else
	{
		Dom.removeClass(target, CLASS_CLICKABLE);
	}

	if (!Dom.hasClass(target, CLASS_CLICKABLE) || !isExpandable)
	{
		return true;
	}

	toggleQuoteState(target);

	return true;
};

const toggleQuoteState = (target: HTMLElement): void => {
	const isExpanded = Dom.hasClass(target, CLASS_EXPANDED);
	if (isExpanded)
	{
		Dom.removeClass(target, CLASS_EXPANDED);
		Dom.addClass(target, CLASS_COLLAPSED);
	}
	else
	{
		Dom.addClass(target, CLASS_EXPANDED);
		Dom.removeClass(target, CLASS_COLLAPSED);
	}

	const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
	if (toggleButton)
	{
		toggleButton.textContent = getToggleLabel(!isExpanded);
	}
};

const updateToggleButtonVisibility = (target: HTMLElement, isExpandable: boolean): void => {
	const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
	if (!toggleButton)
	{
		return;
	}

	Dom.style(toggleButton, 'display', isExpandable ? '' : 'none');
};
