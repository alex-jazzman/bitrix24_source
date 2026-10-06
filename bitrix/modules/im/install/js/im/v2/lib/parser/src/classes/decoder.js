import { Type, Text} from 'main.core';

import { DesktopApi } from 'im.v2.lib.desktop-api';
import { type ImModelMessage, type ImModelNotification } from 'im.v2.model';

import { MarkdownConverter } from '../markdown/converter.js';

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
import { ParserHeading } from '../functions/heading.js';
import { ParserList } from '../functions/list.js';
import { ParserTable } from '../functions/table.js';
import { ParserUrl } from '../functions/url.js';
import { type ParserConfig } from '../types/parser-config.js';
import { getCore, getLogger, isMarkdownFeatureEnabled } from '../utils/core-proxy.js';
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

	decodeInlineText(text: string): string
	{
		return this.decode({ text, inlineOnlyMarkdown: true });
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
			inlineOnlyMarkdown = false,
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

		const isMarkdownAvailable = isMarkdownFeatureEnabled();
		if (isMarkdownAvailable)
		{
			text = inlineOnlyMarkdown ? MarkdownConverter.decodeInline(text) : MarkdownConverter.decode(text);
		}

		text = Text.encode(text.trim());

		text = ParserCommon.decodeNewLine(text);
		text = ParserCommon.decodeTabulation(text);

		text = NestedTagHandler.cutPutTag(text);
		text = NestedTagHandler.cutSendTag(text);
		text = NestedTagHandler.cutCodeTag(text);
		if (isMarkdownAvailable)
		{
			text = NestedTagHandler.cutTableTag(text);
		}

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

		// Structural decode (inline-code / table / list) MUST run while [code] blocks
		// are still cut away, and before they are recovered + rendered below:
		//  - Direction A: a literal [table]/[list]/[icode] typed inside a code block
		//    stays inert — it is hidden in the code placeholder here, so decodeTable/
		//    decodeList/decodeInlineCode never see it and never render a live element
		//    inside <code>.
		//  - Direction B: a [code] block nested in a table cell is recovered AFTER the
		//    table is rebuilt (recoverCodeTag below), so its placeholder renders as a
		//    real code block instead of leaking raw ####REPLACEMENT_CODE_N#### text.
		if (isMarkdownAvailable)
		{
			text = ParserQuote.decodeInlineCode(text);
			text = NestedTagHandler.recoverTableTag(text);
			text = ParserTable.decodeTable(text, { urlTarget });
			text = ParserList.decodeList(text);
			text = ParserHeading.decodeHeading(text);

			// A list keeps a single blank line's worth of spacing from adjacent content, like
			// tables below: collapse 2+ adjacent <br> down to one. (Lists no longer carry the
			// large typography margins that once justified dropping every <br>, so stripping
			// them all would glue a following paragraph straight onto the list.)
			text = text.replace(/(<\/(?:ul|ol)>)(?:<br \/>){2,}/gi, '$1<br />');
			text = text.replace(/(?:<br \/>){2,}(<(?:ul|ol)\b)/gi, '<br />$1');

			// Tables keep a SINGLE blank line's worth of spacing — like plain text — never a
			// double one: collapse 2+ adjacent <br> down to one (headings/rules strip their
			// own in decodeHeading).
			text = text.replace(/(<\/table><\/div>)(?:<br \/>){2,}/gi, '$1<br />');
			text = text.replace(/(?:<br \/>){2,}(<div class="bx-im-message-content-table")/gi, '<br />$1');
		}

		text = NestedTagHandler.recoverCodeTag(text);
		text = ParserQuote.decodeCode(text);

		text = NestedTagHandler.recoverRecursionTag(text);

		text = ParserCommon.removeDuplicateTags(text);

		NestedTagHandler.clean();

		return text;
	},
};
