/* eslint-disable flowtype/require-return-type */
/* eslint-disable bitrix-rules/no-bx */
/* eslint-disable bitrix-rules/no-pseudo-private */
/* eslint-disable  no-param-reassign */
/**
 * @module im/messenger/lib/parser/functions/quote
 */
jn.define('im/messenger/lib/parser/functions/quote', (require, exports, module) => {

	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { parsedElements, PLACEHOLDER } = require('im/messenger/lib/parser/utils/parsed-elements');
	const { MessageText } = require('im/messenger/lib/parser/elements/dialog/message/text');
	const { QuoteActive } = require('im/messenger/lib/parser/elements/dialog/message/quote-active');
	const { QuoteInactive } = require('im/messenger/lib/parser/elements/dialog/message/quote-inactive');
	const { Code } = require('im/messenger/lib/parser/elements/dialog/message/code');
	const { Table } = require('im/messenger/lib/parser/elements/dialog/message/table');
	const { parserUrl } = require('im/messenger/lib/parser/functions/url');
	const { parserImage } = require('im/messenger/lib/parser/functions/image');
	const { getLogger } = require('im/messenger/lib/logger');
	const { NEW_LINE } = require('im/messenger/lib/parser/const');
	const { FileType, MessageComponent } = require('im/messenger/const');
	const logger = getLogger('parser');

	const QUOTE_SIGN = '>>';
	const QUOTE_SIGN_PATTERN = new RegExp(`^${QUOTE_SIGN}\\s*`);

	/**
	 * Build a structured media preview object for the quote block.
	 * The preview is additive — native renders it if supported; older native
	 * falls back to the existing text field (no regression).
	 *
	 * Preview shape (QuotePreview): field names match the native ChatMessageQuoteFactory contract:
	 *   { type: string, urlPreview?: string, name?: string, size?: number, galleryCount?: number }
	 *
	 * Possible type values:
	 *   Contract types (sent to native): 'contact' | 'image' | 'video' | 'videoNote' | 'audio' | 'file' | 'files' | 'sticker' | 'gallery'.
	 *   'deleted_sticker' is an INTERNAL-ONLY marker, NOT a contract type and never sent to native. Callers consume
	 *   it to place the DELETED_STICKER phrase into the quote text, then drop the preview so no out-of-enum type
	 *   reaches native (see createQuote and ReplyManager.#attachMediaPreview).
	 *
	 * @param {string|number} messageId — original message id (replyId)
	 * @return {object|null} preview object or null if no structured preview is applicable
	 */
	function buildQuotePreview(messageId)
	{
		if (!messageId)
		{
			return null;
		}

		const point = new PerfPoint('IM Reply With Media', 'buildQuotePreview').start();
		const store = serviceLocator.get('core').getStore();
		const modelMessage = store.getters['messagesModel/getById'](Number(messageId));
		if (!Type.isObject(modelMessage) || !('id' in modelMessage))
		{
			point.end();

			return null;
		}

		const { stickerParams } = modelMessage;

		// --- Sticker (must check before files) ---
		if (Type.isPlainObject(stickerParams))
		{
			const stickerData = store.getters['stickerPackModel/getStickerData'](stickerParams);
			if (Type.isPlainObject(stickerData))
			{
				point.end();

				return {
					type: 'sticker',
					urlPreview: stickerData?.uri || null,
				};
			}

			// No sticker data. Distinguish a genuinely deleted sticker (pack loaded, sticker removed)
			// from a pack that is not cached yet; for the latter return null so the plaque keeps its
			// text fallback and refreshQuoteMediaPreviewIfNeeded rebuilds the preview once the pack loads.
			const isPackLoaded = store.getters['stickerPackModel/isPackLoaded'](
				stickerParams.packId,
				stickerParams.packType,
			);
			point.end();

			if (!isPackLoaded)
			{
				return null;
			}

			// Deleted sticker: use the DELETED_STICKER phrase
			return {
				type: 'deleted_sticker',
			};
		}

		const files = store.getters['messagesModel/getMessageFiles'](modelMessage.id);
		point.end();

		if (modelMessage.params?.componentId === MessageComponent.contact)
		{
			const image = Type.isArray(files) ? files.find((file) => file.type === FileType.image) : null;

			return {
				type: 'contact',
				urlPreview: image?.urlPreview || null,
			};
		}

		if (Type.isArray(files) && files.length > 0)
		{
			if (files.length === 1)
			{
				const file = files[0];

				// Priority: videoNote > video
				if (file.isVideoNote)
				{
					return {
						type: 'videoNote',
						urlPreview: file.urlPreview || null,
					};
				}

				if (file.type === FileType.video)
				{
					return {
						type: 'video',
						urlPreview: file.urlPreview || null,
					};
				}

				if (file.type === FileType.image)
				{
					return {
						type: 'image',
						urlPreview: file.urlPreview || null,
					};
				}

				if (file.type === FileType.audio)
				{
					// duration is not available on the client-side file model; native fills it separately
					return { type: 'audio' };
				}

				// Generic file: icon + name + size (metadata only, no full download)
				return {
					type: 'file',
					name: file.name || null,
					size: file.size ?? null,
				};
			}

			// Multiple files: classify by the FIRST file:
			// first is media -> gallery (first thumbnail + count); otherwise -> files (several files whose first is
			// not media: group icon + count). Native supports 'files'; the contract enum covers it.
			const firstFile = files[0];
			const isFirstMedia = firstFile?.type === FileType.image || firstFile?.type === FileType.video;
			if (isFirstMedia)
			{
				return {
					type: 'gallery',
					galleryCount: files.length,
					urlPreview: firstFile.urlPreview || null,
				};
			}

			return {
				type: 'files',
				galleryCount: files.length,
				urlPreview: null,
			};
		}

		return null;
	}

	const parserQuote = {
		patterns: {
			DECODE_QUOTE_CONTENT_PATTERN: /-{54}[\r\n\\n]*([\s\S]*?)[\r\n\\n]*-{54}/g,
		},

		decodeArrowQuote(text)
		{
			if (!text.includes(QUOTE_SIGN))
			{
				return text;
			}

			let isProcessed = false;

			let textLines = text.split(NEW_LINE);
			for (let i = 0; i < textLines.length; i++)
			{
				if (!textLines[i].startsWith(QUOTE_SIGN))
				{
					continue;
				}

				const quoteStartIndex = i;
				let quoteText = textLines[quoteStartIndex].replace(QUOTE_SIGN_PATTERN, '');
				// remove >> and leading whitespace from all next lines
				while (++i < textLines.length && textLines[i].startsWith(QUOTE_SIGN))
				{
					textLines[i] = textLines[i].replace(QUOTE_SIGN_PATTERN, '');
					quoteText += NEW_LINE + textLines[i];
				}

				quoteText = parserImage.simplifyIcon(quoteText);
				quoteText = parserImage.simplifyImage(quoteText);
				const quoteEndIndex = i - 1;

				textLines.splice(quoteStartIndex, quoteEndIndex - quoteStartIndex);
				const inactiveQuoteId = parsedElements.add(new QuoteInactive('', quoteText));
				textLines[quoteStartIndex] = `${PLACEHOLDER}${inactiveQuoteId}`;
				i = quoteStartIndex;

				isProcessed = true;
			}

			if (!isProcessed)
			{
				return text;
			}

			return textLines.join(NEW_LINE);
		},

		/**
		 * @param {string} text
		 * @param {object} options
		 * @return {string}
		 */
		decodeQuote(text, options)
		{
			logger.log('Parser.decodeQuote text:', text, options);
			text = text.replace(this.patterns.DECODE_QUOTE_CONTENT_PATTERN, (whole, content, offset) => {
				const textWithoutTags = parsedElements.cutTags(content);
				logger.log('Parser.decodeQuote textWithoutTags:', textWithoutTags);

				const userNameMatch = textWithoutTags.match(/^(.*?)\[/s);
				const userName = userNameMatch ? userNameMatch[1].trim() : '';
				logger.log('Parser.decodeQuote userName:', userName);

				const timeTagMatch = textWithoutTags.match(/\[([^\]]*?)]/s);
				const timeTag = timeTagMatch ? timeTagMatch[1].trim() : '';
				logger.log('Parser.decodeQuote timeTag:', timeTag);

				const contextTagMatch = textWithoutTags.match(/(\s+#(?:chat\d+|\d+:\d+)\/\d+)/);
				let contextTag = contextTagMatch ? contextTagMatch[1].trim() : '';
				logger.log('Parser.decodeQuote contextTag:', contextTag);

				let userNameWithData = '';
				if (userName && timeTag)
				{
					userNameWithData = `${userName} ${timeTag}`;
				}
				else
				{
					userNameWithData = textWithoutTags.split(/\s+#(?:chat\d+|\d+:\d+)\/\d+/s)[0]?.trim() || '';
				}
				logger.log('Parser.decodeQuote userNameWithData:', userNameWithData);

				let quoteText = textWithoutTags;
				if (contextTag)
				{
					const lines = textWithoutTags
						.split(/\r?\n/)
						.map((line) => line.trim())
						.filter(Boolean);

					quoteText = lines.length > 1 ? lines.slice(1).join(NEW_LINE) : '';
				}

				const hasUserBlock = userName && timeTag;
				if (!hasUserBlock && !quoteText)
				{
					// the case, when inside the quote we have only some string in square brackets
					quoteText = timeTag;
				}

				let title = '';
				if (userName)
				{
					title = userName;
				}

				if (userName && !contextTag)
				{
					// the case, for compatibility with web behavior
					title = '';
				}

				if (!userName && userNameWithData && contextTag)
				{
					// the case, for compatibility with web behavior
					title += `${userNameWithData} ${contextTag}`;
					contextTag = '';
				}

				if (!userName && userNameWithData === `[${timeTag}]`)
				{
					/*
					* the case, for compatibility with web behavior (pin own pinned system message in group chat)
					* removes this case, when backend will be sending quote with username on the start string
					*/
					title = '';
				}

				logger.log('Parser.decodeQuote title and quoteText:', { title, quoteText });

				const quoteMark = this.createQuote(title, contextTag, quoteText, userNameWithData, options);

				const charBefore = offset > 0 ? text[offset - 1] : '';
				const charAfter = text[offset + whole.length] || '';
				const prefix = charBefore && charBefore !== '\n' ? NEW_LINE : '';
				const suffix = charAfter && charAfter !== '\n' ? NEW_LINE : '';

				return `${prefix}${quoteMark}${suffix}`;
			});

			parsedElements.cleanTags();

			return text;
		},

		/**
		 * @param {string} contextTag
		 * @param {object} options
		 * @return {object}
		 */
		getQuoteContextData(contextTag, options)
		{
			let contextDialogId = '';
			let contextMessageId = '';
			let isActiveQuote = false;

			if (contextTag)
			{
				contextTag = contextTag.trim().slice(1);

				// eslint-disable-next-line prefer-const
				let [, dialogId, user1, user2, messageId] = contextTag
					.match(/((?:chat)?\d+|(\d+):(\d+))\/(\d+)/i);

				contextDialogId = dialogId;
				contextMessageId = messageId;
				const currentDialogId = options.dialogId || serviceLocator.get('core').getStore().getters['applicationModel/getCurrentOpenedDialogId']();
				const isCurrenDialog = [dialogId, String(user1), String(user2)].includes(String(currentDialogId));

				if (isCurrenDialog)
				{
					isActiveQuote = true;
				}

				if (!dialogId.toString().startsWith('chat'))
				{
					user1 = Number.parseInt(user1, 10);
					user2 = Number.parseInt(user2, 10);

					if (MessengerParams.getUserId() === user1)
					{
						contextDialogId = user2;
					}
					else if (MessengerParams.getUserId() === user2)
					{
						contextDialogId = user1;
					}
				}
			}

			return { isActiveQuote, contextDialogId, contextMessageId };
		},

		/**
		 * @param {string} title
		 * @param {string} contextTag
		 * @param {string} quoteText
		 * @param {string} userNameWithData
		 * @param {object} options
		 * @return {string}
		 */
		createQuote(title, contextTag, quoteText, userNameWithData, options)
		{
			const { isActiveQuote, contextDialogId, contextMessageId } = this.getQuoteContextData(contextTag, options);

			if (!isActiveQuote && contextTag)
			{
				title = userNameWithData;
			}

			/**
				Replacement below bb code is needed because native does not support clicking on a mention
				in a quote title yet.
				And there is no product development.
				As needed, remove.
			 */
			let restoredTagTitle = parsedElements.restoreTags(title);
			if (restoredTagTitle)
			{
				restoredTagTitle = restoredTagTitle.replaceAll(/\[USER=\d+](.*?)\[\/USER]/g, '$1').trim();
			}

			let restoredTagQuoteText = parsedElements.restoreTags(quoteText);
			if (restoredTagQuoteText.includes(PLACEHOLDER))
			{
				restoredTagQuoteText = restoredTagQuoteText.replace(
					/####REPLACEMENT_(\d+)/g,
					(match, id) => {
						const element = parsedElements._list[Number(id)];
						// A table carries no text of its own, so it degrades to the label simplify uses.
						if (element?.type === Table.getType())
						{
							return `[${Loc.getMessage('IMMOBILE_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
						}

						return element?.text || '';
					},
				);
			}
			restoredTagQuoteText = parserImage.decodeIcon(restoredTagQuoteText);
			restoredTagQuoteText = parserImage.simplifyImage(restoredTagQuoteText);

			// Build structured media preview for native layer.
			// preview is additive — native renders it if CAP-01 is supported;
			// older native ignores the unknown field and falls back to restoredTagQuoteText (degradation).
			// We only build a preview when we know the original message id (contextMessageId).
			const rawPreview = contextMessageId ? buildQuotePreview(contextMessageId) : null;

			// For deleted sticker: replace text with the reserved phrase and drop the preview.
			// 'deleted_sticker' is an internal marker, never sent to native: the quote degrades to a plain text quote.
			let preview = rawPreview;
			let finalQuoteText = restoredTagQuoteText;
			if (rawPreview?.type === 'deleted_sticker')
			{
				finalQuoteText = Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_DELETED_STICKER');
				preview = null;
			}

			let quoteMark = '';
			if (isActiveQuote)
			{
				finalQuoteText = parserUrl.simplify(finalQuoteText);
				const activeQuote = new QuoteActive(
					restoredTagTitle,
					finalQuoteText,
					contextDialogId,
					contextMessageId,
					preview,
				);
				const activeQuoteId = parsedElements.add(activeQuote);
				quoteMark = `${PLACEHOLDER}${activeQuoteId}`;
			}
			else
			{
				const inactiveQuote = new QuoteInactive(restoredTagTitle, finalQuoteText, preview);
				const inactiveQuoteId = parsedElements.add(inactiveQuote);
				quoteMark = `${PLACEHOLDER}${inactiveQuoteId}`;
			}

			return quoteMark;
		},

		decodeTextAroundQuotes(text)
		{
			let textLines = text.split(NEW_LINE);

			textLines.forEach((line, index, lines) => {
				if (index === lines.length - 1)
				{
					return;
				}

				lines[index] += NEW_LINE;
			});

			text = '';
			let currentTextId = -1;
			for (let i = 0; i < textLines.length; i++)
			{
				if (textLines[i].startsWith(PLACEHOLDER))
				{
					currentTextId = -1;
					text += textLines[i] + NEW_LINE;
					continue;
				}

				let endOfLine = '';
				if (textLines[i] === '')
				{
					endOfLine = NEW_LINE;
				}

				if (currentTextId === -1)
				{
					const line = textLines[i] + endOfLine;
					const messageText = new MessageText(line);
					currentTextId = parsedElements.add(messageText);
					text += `${PLACEHOLDER}${currentTextId}` + NEW_LINE;

					continue;
				}

				parsedElements._list[currentTextId].text += textLines[i] + endOfLine;
			}

			return text;
		},

		decodeCode(text)
		{
			let result = text;
			let prevPhraseFirstIndex = 0;

			result = result.replaceAll(
				/(?:^ +)?\[code](.*?)\[\/code]?/gims,
				(textWithTag, context, index) => {
					const textBeforeTag = text.slice(prevPhraseFirstIndex, index);
					const textAfterTag = text.slice(index + textWithTag.length).replaceAll(' ', '');

					const startsOnNewLine = textBeforeTag === '' || textBeforeTag.endsWith(NEW_LINE);
					const startTag = startsOnNewLine ? '' : NEW_LINE;
					const endTag = /^(?:\r\n|\n|$)/.test(textAfterTag) ? '' : NEW_LINE;
					const formattedContext = context.replace(/(^\n\s*)|(\n\s*$)/, '');
					const code = new Code(formattedContext);
					const codeId = parsedElements.add(code);

					prevPhraseFirstIndex = index + textWithTag.length;

					return `${startTag}${PLACEHOLDER}${codeId}${endTag}`;
				},
			);

			return result;
		},

		simplifyCode(text, spaceLetter = ' ')
		{
			return text.replace(
				/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code]/gi,
				`[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_CODE')}]` + spaceLetter
			);
		},

		simplifyQuote(text, spaceLetter = ' ')
		{
			return text.replace(
				/-{54}(.*?)-{54}/gims,
				`[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_QUOTE')}]` + spaceLetter
			);
		},

		simplifyArrowQuote(text, spaceLetter = ' ')
		{
			text = text.replace(
				new RegExp(`^(${QUOTE_SIGN}(.*))`, 'gim'),
				`[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_QUOTE')}]` + spaceLetter
			);

			return text;
		},

		truncateDoubleLineBreak(text)
		{
			return text.replaceAll(/\n[\t ]*\n/g, '\n');
		},
	};

	module.exports = {
		parserQuote,
		buildQuotePreview,
	};
});
