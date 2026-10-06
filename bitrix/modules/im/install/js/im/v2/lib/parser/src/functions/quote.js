import { Dom, Tag, Loc, Type } from 'main.core';

import { type ApplicationContext } from 'im.v2.const';

import { getUtils, getConst } from '../utils/core-proxy';
import { ParserUtils } from '../utils/utils';

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

		const lines = text.split(BR_HTML_TAG);
		const parts = [];

		let i = 0;
		while (i < lines.length)
		{
			if (!lines[i].startsWith(QUOTE_SIGN))
			{
				parts.push({ html: lines[i], isQuote: false });
				i++;
				continue;
			}

			const runLines = [];
			while (i < lines.length && lines[i].startsWith(QUOTE_SIGN))
			{
				// Strip exactly one quote marker; any markers left over are a deeper level
				// and become a nested quote via the recursive call inside renderArrowQuote.
				runLines.push(lines[i].replace(QUOTE_SIGN, ''));
				i++;
			}
			parts.push({ html: renderArrowQuote(runLines), isQuote: true });
		}

		let result = '';
		for (let j = 0; j < parts.length; j++)
		{
			result += parts[j].html;
			const isLast = j === parts.length - 1;

			// A <br> is added between plain lines, but never right after a quote block
			// (the quote container already ends the line) — mirrors the old join logic.
			if (!isLast && !parts[j].isQuote)
			{
				result += BR_HTML_TAG;
			}
		}

		return result;
	},

	purifyArrowQuote(text, spaceLetter = ' '): string
	{
		return text.replaceAll(
			new RegExp(`^(${QUOTE_SIGN}(.*))`, 'gim'),
			getQuotePrefix() + spaceLetter,
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
			getQuotePrefix() + spaceLetter,
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
			`[${Loc.getMessage('IM_PARSER_ICON_TYPE_CODE')}]${spaceLetter}`,
		);
	},

	decodeInlineCode(text: string): string
	{
		return text.replaceAll(/\[icode]([\0-\uFFFF]*?)\[\/icode]/gi, (whole, code) => {
			return Dom.create({
				tag: 'code',
				attrs: { className: 'bx-im-message-content-code-inline' },
				html: code,
			}).outerHTML;
		});
	},

	purifyInlineCode(text: string): string
	{
		return text.replaceAll(/\[icode]([\0-\uFFFF]*?)\[\/icode]/gi, (whole, code) => code);
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

const getQuotePrefix = (): string => {
	return `[${Loc.getMessage('IM_PARSER_ICON_TYPE_QUOTE')}]`;
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

const renderArrowQuote = (runLines: Array<string>): string => {
	// runLines already had one quote marker stripped; recurse so any remaining markers
	// (a deeper level) render as a nested quote inside this one. A single-level run has
	// no remaining markers, so `inner` is just the joined text and the output is
	// byte-identical to the previous flat implementation.
	const inner = ParserQuote.decodeArrowQuote(runLines.join(BR_HTML_TAG));
	const collapsedClass = isQuoteExpandableByText(inner) ? ` ${CLASS_COLLAPSED}` : '';

	return `<div data-context="${NO_CONTEXT_TAG}" class="${CLASS_QUOTE_BASE}${collapsedClass}">`
		+ `<div class="${CLASS_QUOTE_WRAP}">`
		+ `<div class="${CLASS_QUOTE_TEXT}">${inner}</div>`
		+ getToggleButton({ quoteText: inner })
		+ '</div></div>';
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
