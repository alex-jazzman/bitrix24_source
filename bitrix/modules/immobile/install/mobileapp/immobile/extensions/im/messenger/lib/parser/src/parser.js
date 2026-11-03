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
	const { parserTable } = require('im/messenger/lib/parser/functions/table');
	const { parserDisk } = require('im/messenger/lib/parser/functions/disk');
	const { parsedElements } = require('im/messenger/lib/parser/utils/parsed-elements');
	const { parserSmile } = require('im/messenger/lib/parser/functions/smile');
	const { parserContext } = require('im/messenger/lib/parser/functions/context');
	const { parserDate } = require('im/messenger/lib/parser/functions/date');
	const { QuoteActive } = require('im/messenger/lib/parser/elements/dialog/message/quote-active');
	const { QuoteInactive } = require('im/messenger/lib/parser/elements/dialog/message/quote-inactive');
	const { Code } = require('im/messenger/lib/parser/elements/dialog/message/code');
	const { Table } = require('im/messenger/lib/parser/elements/dialog/message/table');
	const { MessageText } = require('im/messenger/lib/parser/elements/dialog/message/text');
	const { MessageComponent } = require('im/messenger/const');
	const { NEW_LINE } = require('im/messenger/lib/parser/const');
	const { markdownConverter } = require('im/messenger/lib/parser/markdown/converter');
	const { createMarkdownNonce } = require('im/messenger/lib/parser/markdown/utils/nonce');
	const { repairVisualStyleBBCode } = require('im/messenger/lib/bbcode/style-canonicalizer');
	const CRLF = '\r\n';

	function removeExtraNewLinesAroundBlocks(elements)
	{
		const blockTypes = new Set([Code.getType()]);
		if (Feature.isChatDialogCompactQuoteSupported)
		{
			blockTypes.add(QuoteActive.getType());
			blockTypes.add(QuoteInactive.getType());
			blockTypes.add(Table.getType());
		}

		return elements.filter((element, index) => {
			if (element.type !== MessageText.getType())
			{
				return true;
			}

			const prevElement = elements[index - 1];
			const nextElement = elements[index + 1];
			const isAfterBlock = prevElement && blockTypes.has(prevElement.type);
			const isBeforeBlock = nextElement && blockTypes.has(nextElement.type);

			if (!isAfterBlock && !isBeforeBlock)
			{
				return true;
			}

			if (element.text === NEW_LINE || element.text === CRLF)
			{
				return false;
			}

			if (isAfterBlock && element.text.startsWith(CRLF))
			{
				element.text = element.text.slice(CRLF.length);
			}
			else if (isAfterBlock && element.text.startsWith(NEW_LINE))
			{
				element.text = element.text.slice(NEW_LINE.length);
			}

			if (isBeforeBlock && element.text.endsWith(CRLF))
			{
				element.text = element.text.slice(0, -CRLF.length);
			}
			else if (isBeforeBlock && element.text.endsWith(NEW_LINE))
			{
				element.text = element.text.slice(0, -NEW_LINE.length);
			}

			return true;
		});
	}

	function repairMessageTextElements(elements)
	{
		for (const element of elements)
		{
			if (element.type !== MessageText.getType())
			{
				continue;
			}

			try
			{
				const repair = repairVisualStyleBBCode(element.text);
				if (repair.status === 'failed')
				{
					Logger.error('Parser: incoming style repair failed');

					continue;
				}

				element.text = repair.result.newText;
			}
			catch (error)
			{
				Logger.error('Parser: incoming style repair failed');
			}
		}

		return elements;
	}

	const parser = {
		decodeMessageFromText(text, options = {})
		{
			if (!Type.isStringFilled(text))
			{
				return [];
			}

			let tableNonce;
			if (Feature.isMarkdownParserEnabled)
			{
				// Single source of the render mode (P1); no converter rule reads feature flags itself.
				const renderMode = Feature.isMarkdownNativeRendererEnabled ? 'canonical' : 'fallback';
				// Per-render nonce for the canonical table token; the same nonce is shared by the token
				// producer (markdown converter) and its consumer (parserTable.decodeTable below).
				tableNonce = createMarkdownNonce();
				text = markdownConverter.decode(text, { renderMode, tableNonce });
			}
			text = parserDate.decode(text);
			text = parserContext.decode(text);
			if (!Type.isStringFilled(text))
			{
				return [];
			}

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
			text = parserUrl.prepareImageUrls(text);
			text = parserSmile.decodeSmile(text, options);
			text = parserMention.decode(text);
			text = parserAction.decodePut(text);
			text = parserAction.decodeSend(text);
			text = parserCall.simplifyPch(text);
			text = parserCall.decode(text);
			text = parserQuote.decodeCode(text);
			text = parserQuote.decodeArrowQuote(text);
			// Canonical table tokens -> Table elements. No-op in fallback / without a nonce (self-guarded).
			// Runs before decodeQuote (like decodeCode) so a token inside a quote becomes a placeholder the
			// quote body inlines, instead of being captured as the raw token; and before
			// decodeTextAroundQuotes, so the placeholder outside a quote is picked up as an element.
			text = parserTable.decodeTable(text, tableNonce);
			text = parserQuote.decodeQuote(text, options);
			text = parserImage.decodeIcon(text);
			text = parserQuote.decodeTextAroundQuotes(text);

			const elementList = parsedElements.getOrderedList(text);
			parsedElements.clean();
			repairMessageTextElements(elementList);

			return removeExtraNewLinesAroundBlocks(elementList);
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
			const contactPreviewText = this.getContactPreviewText(modelMessage);
			if (contactPreviewText !== null)
			{
				return contactPreviewText;
			}

			if (!messageFiles)
			{
				messageFiles = serviceLocator.get('core').getStore().getters['messagesModel/getMessageFiles'](modelMessage.id);
			}

			if (this.isBlockWithoutText(modelMessage))
			{
				return `[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_ATTACH')}]`;
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

			if (Feature.isMarkdownParserEnabled)
			{
				text = markdownConverter.simplify(text);
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
			text = parserContext.simplify(text);
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
			const contactPreviewText = this.getContactPreviewText(modelMessage, true);
			if (contactPreviewText !== null)
			{
				return contactPreviewText;
			}

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

			if (this.isBlockWithoutText(modelMessage))
			{
				return `[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_ATTACH')}]`;
			}
			text = text.trim();

			if (Feature.isMarkdownParserEnabled)
			{
				// Markdown has to be converted BEFORE the body is wrapped into the quote (same order
				// as web im). Otherwise its block constructs are re-parsed inside the assembled quote,
				// where a `---`/`----` line turns the quote header (author/date/context) into a setext
				// heading and decodeQuote loses the author, the date and the link to the message.
				// A Markdown blockquote is left to the block rules on purpose: they turn `>` into the
				// BB-quote sign, which simplifyArrowQuote below replaces with the quote label - the
				// same two steps web im runs, so a quoted quote reads as a quote and not as plain text.
				// The quote body is baked into the message text by the sender, so unlike
				// decodeMessageFromText it cannot adapt to the reader's build. It follows the server
				// rollout flag alone, without the native-capability term: the portal picks one
				// contract for every reader, which is what keeps the quote identical to web im.
				const renderMode = Feature.isMarkdownNativeRendererAvailable ? 'canonical' : 'fallback';
				text = markdownConverter.simplify(text, { renderMode });
			}

			text = parserMention.simplify(text);
			text = parserCall.simplify(text);
			text = parserLines.simplify(text);
			text = parserCommon.simplifyBreakLine(text, '\n');
			text = parserCommon.simplifyNbsp(text);
			text = parserUrl.removeSimpleUrlTag(text);
			text = parserContext.simplify(text);
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

		getContactPreviewText(modelMessage, includeCaption = false)
		{
			if (modelMessage.params?.componentId !== MessageComponent.contact)
			{
				return null;
			}

			const params = modelMessage.params?.COMPONENT_PARAMS ?? {};
			const firstName = Type.isStringFilled(params.firstName) ? params.firstName.trim() : '';
			const lastName = Type.isStringFilled(params.lastName) ? params.lastName.trim() : '';
			const phone = Type.isArrayFilled(params.phones) && Type.isString(params.phones[0])
				? params.phones[0].trim()
				: '';
			const name = [lastName, firstName].filter(Boolean).join(' ');
			const previewText = [name, phone].filter(Boolean).join('\n');
			if (!includeCaption || previewText === '')
			{
				return previewText;
			}

			const cardLine = name === '' ? phone : `${name}, ${phone}`;
			const cardLineSuffix = `\n${cardLine}`;
			const caption = modelMessage.text?.endsWith(cardLineSuffix)
				? modelMessage.text.slice(0, -cardLineSuffix.length)
				: '';

			return [caption, previewText].filter(Boolean).join('\n');
		},

		/**
		 * @param {string} text
		 * @return {string[]}
		 */
		splitByUrlTag(text)
		{
			return parserUrl.splitByUrlTag(text);
		},

		/**
		 * @param {string} part
		 * @return {boolean}
		 */
		isUrlTag(part)
		{
			return parserUrl.isUrlTag(part);
		},

		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {boolean}
		 */
		isBlockWithoutText(modelMessage)
		{
			return Type.isPlainObject(modelMessage.block)
				&& Type.isArrayFilled(modelMessage.block?.elements)
				&& !Type.isStringFilled(modelMessage.text);
		},
	};

	module.exports = {
		parser,
	};
});
