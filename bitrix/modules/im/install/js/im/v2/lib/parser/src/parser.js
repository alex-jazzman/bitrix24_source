import { Text, Loc, Type } from 'main.core';

import { type ApplicationContext } from 'im.v2.const';
import { type ImModelMessage } from 'im.v2.model';

import { MarkdownConverter } from './markdown/converter.js';
import { Purifier } from './classes/purifier';
import { Decoder } from './classes/decoder';
import { ParserAction } from './functions/action';
import { ParserCall } from './functions/call';
import { ParserCommon } from './functions/common';
import { ParserLines } from './functions/lines';
import { ParserMention } from './functions/mention';
import { ParserQuote } from './functions/quote';
import { ParserUrl } from './functions/url';
import { getCore, isMarkdownFeatureEnabled } from './utils/core-proxy';
import { ParserUtils } from './utils/utils';
import { ParserInlineSourceLink } from './functions/inline-source-link.js';

import './parser.css';

export const Parser = {
	purify: (config) => Purifier.purify(config),
	purifyText: (text) => Purifier.purifyText(text),
	purifyRecent: (recentMessage) => Purifier.purifyRecent(recentMessage),
	purifyMessage: (message) => Purifier.purifyMessage(message),
	purifyNotification: (notification) => Purifier.purifyNotification(notification),

	decode: (config) => Decoder.decode(config),
	decodeText: (text) => Decoder.decodeText(text),
	decodeInlineText: (text) => Decoder.decodeInlineText(text),
	decodeMessage: (message) => Decoder.decodeMessage(message),
	decodeNotification: (notification) => Decoder.decodeNotification(notification),
	decodeNotificationParam: (text) => Decoder.decodeNotificationParam(text),
	decodeHtml: (text) => Decoder.decodeHtml(text),
	decodeSmile: (text, options) => Decoder.decodeSmile(text, options),
	decodeSmileForLegacyCore: (text, options) => Decoder.decodeSmileForLegacyCore(text, options),

	getContactPreviewText(message: ImModelMessage, includeCaption: boolean = false): string | null
	{
		const componentParams = message.componentParams;
		if (!componentParams)
		{
			return null;
		}

		const firstName = Type.isStringFilled(componentParams.firstName) ? componentParams.firstName.trim() : '';
		const lastName = Type.isStringFilled(componentParams.lastName) ? componentParams.lastName.trim() : '';
		const phone = Type.isArrayFilled(componentParams.phones) && Type.isString(componentParams.phones[0])
			? componentParams.phones[0].trim()
			: '';
		const name = [lastName, firstName].filter(Boolean).join(' ');
		const previewText = [name, phone].filter(Boolean).join('\n');
		if (!includeCaption || previewText === '')
		{
			return previewText;
		}

		const cardLine = name === '' ? phone : `${name}, ${phone}`;
		const cardLineSuffix = `\n${cardLine}`;
		const caption = message.text?.endsWith(cardLineSuffix)
			? message.text.slice(0, -cardLineSuffix.length)
			: '';

		return [caption, previewText].filter(Boolean).join('\n');
	},

	prepareQuote(message: ImModelMessage, quoteText: string = ''): string
	{
		const { id, attach } = message;

		let text = quoteText === '' ? message.text : quoteText;

		const files = getCore().getStore().getters['messages/getMessageFiles'](id);
		const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](id);

		const isMarkdownAvailable = isMarkdownFeatureEnabled();
		if (isMarkdownAvailable)
		{
			text = MarkdownConverter.simplify(text);
		}

		text = Text.encode(text.trim());

		if (isMarkdownAvailable)
		{
			text = ParserQuote.purifyInlineCode(text);
		}

		text = ParserMention.purify(text);
		text = ParserCall.purify(text);
		text = ParserLines.purify(text);
		text = ParserCommon.purifyBreakLine(text, '\n');
		text = ParserCommon.purifyNbsp(text);
		text = ParserUrl.removeSimpleUrlTag(text);
		text = ParserQuote.purifyCode(text, ' ');
		text = ParserQuote.purifyQuote(text, ' ');
		text = ParserQuote.purifyArrowQuote(text, ' ');
		if (quoteText === '' || isSticker)
		{
			text = Purifier.addTextPrefix({ text, attach, files, isSticker });
		}

		text = text.length > 0 ? Text.decode(text) : Loc.getMessage('IM_PARSER_MESSAGE_DELETED');

		return text.trim();
	},

	prepareEdit(message: ImModelMessage): string
	{
		let { text } = message;

		text = ParserUrl.removeSimpleUrlTag(text);
		text = ParserMention.purify(text);

		return text.trim();
	},

	prepareCopy(message: ImModelMessage): string
	{
		let { text } = message;

		text = ParserUrl.removeSimpleUrlTag(text);

		return text.trim();
	},

	prepareCopyFile(message: ImModelMessage): string
	{
		const { id } = message;

		const files = getCore().getStore().getters['messages/getMessageFiles'](id).map((file) => {
			return `[DISK=${file.id}]\n`;
		});

		return files.join('\n').trim();
	},

	executeClickEvent(event: PointerEvent, context: ApplicationContext)
	{
		ParserMention.executeClickEvent(event, context);
		ParserQuote.executeClickEvent(event, context);
		ParserAction.executeClickEvent(event, context);
	},

	getContextCodeFromForwardId(forwardId: string): string
	{
		return ParserUtils.getFinalContextTag(forwardId);
	},

	/**
	 * Decode [source=N]...[/source] tokens into inline source badges.
	 * Input MUST already be encoded HTML (output of decodeText / decodeInlineText),
	 * never raw user text: the result goes to v-html unescaped (XSS).
	 * See ParserInlineSourceLink.decode.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	decodeInlineSourceLinks(text: string): string
	{
		return ParserInlineSourceLink.decode(text);
	},
};
