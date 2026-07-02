import { Type, Text} from 'main.core';

import { DesktopApi } from 'im.v2.lib.desktop-api';
import { type ImModelMessage, type ImModelNotification } from 'im.v2.model';

import { ParserAction } from '../functions/action.js';
import { ParserCall } from '../functions/call.js';
import { ParserCommon } from '../functions/common.js';
import { ParserDate } from '../functions/date.js';
import { ParserDisk } from '../functions/disk.js';
import { ParserFont } from '../functions/font.js';
import { ParserImage } from '../functions/image.js';
import { ParserLines } from '../functions/lines.js';
import { ParserMention } from '../functions/mention.js';
import { ParserQuote } from '../functions/quote.js';
import { ParserSlashCommand } from '../functions/slash-command.js';
import { ParserSmile } from '../functions/smile.js';
import { ParserUrl } from '../functions/url.js';
import { type ParserConfig } from '../types/parser-config.js';
import { getCore, getLogger } from '../utils/core-proxy.js';
import { NestedTagHandler } from '../utils/nested-tag-handler.js';
import { ParserUtils } from '../utils/utils.js';
import { Purifier } from './purifier.js';

export const Decoder = {
	decodeMessage(message: ImModelMessage): string
	{
		const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
		const contextDialogId = ParserUtils.getDialogIdByChatId(message.chatId);

		return this.decode({
			text: message.text,
			attach: message.attach,
			files: messageFiles,
			showIconIfEmptyText: false,
			contextDialogId,
		});
	},

	decodeNotification(notification: ImModelNotification): string
	{
		return this.decode({
			text: notification.text,
			attach: notification.params.attach ?? false,
			showIconIfEmptyText: false,
			showImageFromLink: false,
			urlTarget: DesktopApi.isDesktop() ? '_blank' : '_self',
		});
	},

	decodeNotificationParam(text: string): string
	{
		return this.decode({
			text,
			urlTarget: DesktopApi.isDesktop() ? '_blank' : '_self',
		});
	},

	decodeText(text: string): string
	{
		return this.decode({ text });
	},

	decodeHtml(text: string): string
	{
		return this.decode({ text });
	},

	decodeSmile(text: string, options: {}): string
	{
		return ParserSmile.decodeSmile(text, options);
	},

	decodeSmileForLegacyCore(text: string, options: {}): string
	{
		const legacyConfig = { ...options };
		legacyConfig.ratioConfig = Object.freeze({
			Default: 1,
			Big: 1.6,
		});

		return ParserSmile.decodeSmile(text, legacyConfig);
	},

	decode(config: ParserConfig): string
	{
		if (!Type.isPlainObject(config))
		{
			getLogger().error('Parser.decode: the first parameter must be object', config);

			return '<b style="color:red">Parser.decode: the first parameter must be a parameter object</b';
		}

		let { text } = config;
		const {
			attach = false,
			files = false,
			removeLinks = false,
			showIconIfEmptyText = true,
			showImageFromLink = true,
			contextDialogId = '',
			urlTarget = '_blank',
		} = config;

		if (!Type.isString(text))
		{
			if (Type.isNumber(text))
			{
				return text.toString();
			}

			return '';
		}

		if (!text)
		{
			return showIconIfEmptyText ? Purifier.addTextPrefix({ text, attach, files }) : '';
		}

		text = Text.encode(text.trim());

		text = ParserCommon.decodeNewLine(text);
		text = ParserCommon.decodeTabulation(text);

		text = NestedTagHandler.cutPutTag(text);
		text = NestedTagHandler.cutSendTag(text);
		text = NestedTagHandler.cutCodeTag(text);

		text = ParserSmile.decodeSmile(text);
		text = ParserSlashCommand.decode(text);
		text = ParserImage.decodeImageBbCode(text, { contextDialogId });
		text = ParserUrl.decode(text, { urlTarget, removeLinks });
		text = ParserFont.decode(text);
		text = ParserLines.decode(text);
		text = ParserMention.decode(text);
		text = ParserCall.decode(text);
		text = ParserImage.decodeIcon(text);
		if (showImageFromLink)
		{
			text = ParserImage.decodeLink(text);
		}
		text = ParserDisk.decode(text);
		text = ParserDate.decode(text);

		text = ParserQuote.decodeArrowQuote(text);
		text = ParserQuote.decodeQuote(text, { contextDialogId });

		text = NestedTagHandler.recoverSendTag(text);
		text = ParserAction.decodeSend(text);

		text = NestedTagHandler.recoverPutTag(text);
		text = ParserAction.decodePut(text);

		text = NestedTagHandler.recoverCodeTag(text);
		text = ParserQuote.decodeCode(text);

		text = NestedTagHandler.recoverRecursionTag(text);

		text = ParserCommon.removeDuplicateTags(text);

		NestedTagHandler.clean();

		return text;
	},
};
