/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/lib/parser/parser
 */
jn.define('im/messenger/lib/parser/parser', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Logger } = require('im/messenger/lib/logger');
	const { parserUrl } = require('im/messenger/lib/parser/functions/url');
	const { parserQuote } = require('im/messenger/lib/parser/functions/quote');
	const { parserCall } = require('im/messenger/lib/parser/functions/call');
	const { parserCommon } = require('im/messenger/lib/parser/functions/common');
	const { parserEmoji } = require('im/messenger/lib/parser/functions/emoji');
	const { parserLines } = require('im/messenger/lib/parser/functions/lines');
	const { parserMention } = require('im/messenger/lib/parser/functions/mention');
	const { parserSlashCommand } = require('im/messenger/lib/parser/functions/slash-command');
	const { parserAction } = require('im/messenger/lib/parser/functions/action');
	const { parserFont } = require('im/messenger/lib/parser/functions/font');
	const { parserImage } = require('im/messenger/lib/parser/functions/image');
	const { parserDisk } = require('im/messenger/lib/parser/functions/disk');
	const { parsedElements } = require('im/messenger/lib/parser/utils/parsed-elements');
	const { parserSmile } = require('im/messenger/lib/parser/functions/smile');
	const { parserContext } = require('im/messenger/lib/parser/functions/context');
	const { parserDate } = require('im/messenger/lib/parser/functions/date');
	const { QuoteActive } = require('im/messenger/lib/parser/elements/dialog/message/quote-active');
	const { QuoteInactive } = require('im/messenger/lib/parser/elements/dialog/message/quote-inactive');
	const { MessageText } = require('im/messenger/lib/parser/elements/dialog/message/text');
	const { NEW_LINE } = require('im/messenger/lib/parser/const');

	function removeExtraNewLinesAfterQuotes(elements)
	{
		const quoteTypes = new Set([QuoteActive.getType(), QuoteInactive.getType()]);

		return elements.filter((element, index) => {
			if (index === 0)
			{
				return true;
			}

			const prevElement = elements[index - 1];
			const isAfterQuote = quoteTypes.has(prevElement.type);
			if (!isAfterQuote || element.type !== MessageText.getType())
			{
				return true;
			}

			if (element.text === NEW_LINE)
			{
				return false;
			}

			if (element.text.startsWith(NEW_LINE))
			{
				element.text = element.text.slice(1);
			}

			return true;
		});
	}

	const parser = {
		decodeMessageFromText(text, options = {})
		{
			if (!Type.isStringFilled(text))
			{
				return [];
			}

			text = parserDate.decode(text);

			// TODO: support bb code [context]
			text = text.replaceAll(
				/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gi,
				(whole, dialogId, messageId, message) => message,
			);

			// TODO: support bb code [chat]
			text = text.replaceAll(/\[chat=(imol\|)?(\d+)](.*?)\[\/chat]/gi, (whole, imol, chatId, text) => {
				if (imol)
				{
					return text;
				}

				return whole;
			});

			text = parserCommon.decodeNewLine(text);
			text = parserImage.decodeImageWithSize(text);
			text = parserUrl.prepareGifUrl(text);
			text = parserSmile.decodeSmile(text, options);
			text = parserMention.decode(text);
			text = parserAction.decodePut(text);
			text = parserAction.decodeSend(text);
			text = parserCall.simplifyPch(text);
			text = parserCall.decode(text);
			text = parserQuote.decodeCode(text);
			text = parserQuote.decodeArrowQuote(text);
			text = parserQuote.decodeQuote(text, options);
			text = parserImage.decodeIcon(text);
			text = parserQuote.decodeTextAroundQuotes(text);

			const elementList = parsedElements.getOrderedList(text);
			parsedElements.clean();

			if (Feature.isChatDialogCompactQuoteSupported)
			{
				return removeExtraNewLinesAfterQuotes(elementList);
			}

			return elementList;
		},

		decodeTextForAttachBlock(text)
		{
			if (!Type.isStringFilled(text))
			{
				return [];
			}

			let blockText = text;
			blockText = parserCommon.collapseDuplicateBreaks(blockText);
			blockText = parserCommon.decodeNewLine(blockText);
			blockText = parserMention.decode(blockText);
			blockText = parserAction.decodePut(blockText);
			blockText = parserAction.decodeSend(blockText);
			blockText = parserCall.simplifyPch(blockText);
			blockText = parserCall.decode(blockText);

			return blockText;
		},

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {Array<FilesModelState> | null} [messageFiles]
		 * @return {string|*}
		 */
		simplifyMessage(modelMessage, messageFiles = null)
		{
			if (!messageFiles)
			{
				messageFiles = serviceLocator.get('core').getStore().getters['messagesModel/getMessageFiles'](modelMessage.id);
			}

			return this.simplify({
				text: modelMessage.text,
				attach: modelMessage.params && modelMessage.params.ATTACH ? modelMessage.params.ATTACH : false,
				files: messageFiles,
				sticker: Type.isPlainObject(modelMessage.stickerParams),
			});
		},

		simplify(config)
		{
			if (!Type.isPlainObject(config))
			{
				Logger.error('parser.simplify: the first parameter must be a object', config);

				return 'parser.simplify: the first parameter must be a parameter object';
			}

			let {
				text,
			} = config;
			const {
				attach = false,
				files = false,
				replaces = [],
				showIconIfEmptyText = true,
				showPhraseMessageWasDeleted = true,
				showFilePrefix = false,
				sticker = false,
				isReplaceNewLine = true,
			} = config;

			if (!Type.isString(text))
			{
				text = Type.isNumber(text) ? text.toString() : '';
			}

			if (!text || sticker)
			{
				text = parserEmoji.addIconToShortText({ text, attach, files, showFilePrefix, sticker });

				return text.trim();
			}

			text = text.trim();

			if (isReplaceNewLine)
			{
				text = parserCommon.simplifyNewLine(text, '\n');
			}

			text = parserSlashCommand.simplify(text);
			text = parserQuote.simplifyArrowQuote(text);
			text = parserQuote.simplifyQuote(text);
			text = parserQuote.simplifyCode(text);
			text = parserAction.simplifyPut(text);
			text = parserAction.simplifySend(text);
			text = parserMention.simplify(text);
			text = parserFont.simplify(text);
			text = parserLines.simplify(text);
			text = parserCall.simplify(text);
			text = parserImage.simplifyLink(text);
			text = parserImage.simplifyIcon(text);
			text = parserImage.simplifyImage(text);
			text = parserUrl.simplify(text);
			text = parserDisk.simplify(text);

			if (isReplaceNewLine)
			{
				text = parserCommon.simplifyNewLine(text);
			}

			text = parserEmoji.addIconToShortText({
				text,
				attach,
				files,
				showFilePrefix,
			});

			text = parserContext.simplify(text);
			text = parserDate.simplify(text);

			if (text.length === 0 && showPhraseMessageWasDeleted)
			{
				text = Loc.getMessage('IMMOBILE_PARSER_MESSAGE_DELETED');
			}

			return text.trim();
		},

		prepareCopy(modelMessage)
		{
			let text = modelMessage.text;
			text = parserUrl.simplify(text);
			text = parserUrl.removeBR(text);

			return text;
		},

		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {*}
		 */
		prepareQuote(modelMessage)
		{
			const {
				id,
				params,
				stickerParams,
			} = modelMessage;
			let {
				text,
			} = modelMessage;

			const attach = params.ATTACH || false;
			const files = serviceLocator.get('core').getStore().getters['messagesModel/getMessageFiles'](id);
			text = text.trim();

			text = parserMention.simplify(text);
			text = parserCall.simplify(text);
			text = parserLines.simplify(text);
			text = parserCommon.simplifyBreakLine(text, '\n');
			text = parserCommon.simplifyNbsp(text);
			text = parserUrl.removeSimpleUrlTag(text);
			text = parserQuote.simplifyCode(text, ' ');
			text = parserQuote.simplifyQuote(text, ' ');
			text = parserQuote.simplifyArrowQuote(text, ' ');
			text = parserEmoji.addIconToShortText({
				text,
				attach,
				files,
				showFilePrefix: false,
				sticker: Type.isPlainObject(stickerParams),
			});
			text = parserQuote.truncateDoubleLineBreak(text);

			return text.trim();
		},
	};

	module.exports = {
		parser,
	};
});
