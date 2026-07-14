import { Loc, Extension, Type, Text } from 'main.core';

import { type ImModelMessage, type ImModelRecentItem, type ImModelNotification } from 'im.v2.model';

import { ParserFont } from '../functions/font';
import { ParserImage } from '../functions/image';
import { ParserDisk } from '../functions/disk';
import { ParserDate } from '../functions/date';
import { ParserAction } from '../functions/action';
import { ParserSlashCommand } from '../functions/slash-command';
import { ParserCall } from '../functions/call.js';
import { ParserCommon } from '../functions/common.js';
import { ParserLines } from '../functions/lines.js';
import { ParserMention } from '../functions/mention.js';
import { ParserQuote } from '../functions/quote.js';
import { ParserUrl } from '../functions/url.js';
import { getCore, getLogger, getConst } from '../utils/core-proxy.js';
import { type ParserConfig } from '../types/parser-config';

const { FileType, FileIconType, AttachDescription } = getConst();

type ResultRecentConfig = {
	files: boolean | Object[],
	attach: boolean | string | Object[],
	text: string,
	sticker?: boolean,
};

type TextPrefixPayload = {
	text: string,
	attach: AttachType,
	files: boolean | Array,
	isSticker: boolean,
};

type AttachType = boolean | string | Array;

export const Purifier = {
	purifyMessage(message: ImModelMessage): string
	{
		const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
		const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](message.id);

		return this.purify({
			text: message.text,
			attach: message.attach,
			files: messageFiles,
			isSticker,
		});
	},

	purifyNotification(notification: ImModelNotification): string
	{
		const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](notification.id);

		return this.purify({
			text: notification.text,
			attach: notification.params.attach ?? false,
			files: messageFiles,
		});
	},

	purifyRecent(recentMessage: ImModelRecentItem): string
	{
		const settings = Extension.getSettings('im.v2.lib.parser');
		const v2 = settings.get('v2');
		if (!v2)
		{
			const { files, attach, text } = prepareLegacyConfigForRecent(recentMessage);

			return this.purify({
				text,
				attach,
				files,
				showPhraseMessageWasDeleted: recentMessage.message.id !== 0,
			});
		}

		const { files, attach, text, isSticker } = prepareConfigForRecent(recentMessage);

		return this.purify({
			text,
			attach,
			files,
			showPhraseMessageWasDeleted: recentMessage.messageId !== 0,
			isSticker,
		});
	},

	purifyText(text: string): string
	{
		return this.purify({ text });
	},

	purify(config: ParserConfig): string
	{
		if (!Type.isPlainObject(config))
		{
			getLogger().error('Parser.purify: the first parameter must be a object', config);

			return 'Parser.purify: the first parameter must be a parameter object';
		}

		let { text } = config;
		const {
			attach = false,
			files = false,
			isSticker = false,
			showPhraseMessageWasDeleted = true,
			removeNewLines = true,
		} = config;

		if (!Type.isString(text))
		{
			text = Type.isNumber(text) ? text.toString() : '';
		}

		if (!text || isSticker)
		{
			text = this.addTextPrefix({ text, attach, files, isSticker });

			return text.trim();
		}

		text = Text.encode(text.trim());

		text = ParserCommon.purifyNewLine(text, '\n');
		text = ParserSlashCommand.purify(text);
		text = ParserQuote.purifyArrowQuote(text);
		text = ParserQuote.purifyQuote(text);
		text = ParserQuote.purifyCode(text);
		text = ParserAction.purifyPut(text);
		text = ParserAction.purifySend(text);
		text = ParserMention.purify(text);
		text = ParserFont.purify(text);
		text = ParserLines.purify(text);
		text = ParserCall.purify(text);
		text = ParserUrl.purify(text);
		text = ParserImage.purifyLink(text);
		text = ParserImage.purifyIcon(text);
		text = ParserImage.purifyImageBbCode(text);
		text = ParserDisk.purify(text);
		text = ParserDate.purify(text);
		if (removeNewLines)
		{
			text = ParserCommon.purifyNewLine(text);
		}
		text = this.addTextPrefix({ text, attach, files });

		if (text.length > 0)
		{
			text = Text.decode(text);
		}
		else if (showPhraseMessageWasDeleted)
		{
			text = Loc.getMessage('IM_PARSER_MESSAGE_DELETED');
		}

		return text.trim();
	},

	addTextPrefix(payload: TextPrefixPayload): string
	{
		const { text, attach, files, isSticker } = payload;

		if (isSticker)
		{
			return getTextForSticker();
		}

		if (isFile(payload))
		{
			return getTextForFile(text, files);
		}

		if (isAttach(payload))
		{
			return getTextForAttach(text, attach);
		}

		return text.trim();
	},
};

const prepareLegacyConfigForRecent = (recentMessage): ResultRecentConfig => {
	let files = false;
	const fileField = recentMessage.message.params.withFile;
	if (Type.isBoolean(fileField))
	{
		files = fileField;
	}
	else if (Type.isPlainObject(fileField))
	{
		files = [fileField];
	}

	let attach = false;
	const attachField = recentMessage.message.params.withAttach;
	if (
		Type.isBoolean(attachField)
		|| Type.isStringFilled(attachField)
		|| Type.isArray(attachField)
	)
	{
		attach = attachField;
	}
	else if (Type.isPlainObject(attachField))
	{
		attach = [attachField];
	}

	return { files, attach, text: recentMessage.message.text };
};

const prepareConfigForRecent = (recentMessage: ImModelRecentItem): ResultRecentConfig => {
	let files = getCore().getStore().getters['messages/getMessageFiles'](recentMessage.messageId);
	if (files.length === 0)
	{
		files = false;
	}

	const message = getCore().getStore().getters['messages/getById'](recentMessage.messageId);

	let attach = false;
	if (
		Type.isBoolean(message?.attach)
		|| Type.isStringFilled(message?.attach)
		|| Type.isArray(message?.attach)
	)
	{
		attach = message.attach;
	}
	else if (Type.isPlainObject(message?.attach))
	{
		attach = [message.attach];
	}
	const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](recentMessage.messageId);

	return { files, attach, text: message.text, isSticker };
};

const isFile = (payload: TextPrefixPayload) => {
	const { files } = payload;

	return Type.isArrayFilled(files) || files === true;
};

const isAttach = (payload: TextPrefixPayload) => {
	const { attach } = payload;

	return attach === true || Type.isArrayFilled(attach) || Type.isStringFilled(attach);
};

const getTextForFile = (rawText: string, files: boolean | Array): string => {
	let preparedText = rawText;
	if (Type.isArray(files) && files.length > 0)
	{
		preparedText = getTextByFile(rawText, files);
	}
	else if (files === true)
	{
		preparedText = getTextByFileType(rawText, FileIconType.file);
	}

	return preparedText.trim();
};

const getTextForAttach = (text: string, attach: AttachType): string => {
	let attachDescription = extractAttachDescription(attach);

	if (Type.isStringFilled(attachDescription))
	{
		const shouldSkipDescription = attachDescription === AttachDescription.skipMessage;
		if (shouldSkipDescription)
		{
			return text.trim();
		}

		attachDescription = Purifier.purifyText(attachDescription);
	}
	else
	{
		attachDescription = `[${Loc.getMessage('IM_PARSER_ICON_TYPE_ATTACH')}]`;
	}

	return `${text} ${attachDescription}`.trim();
};

const extractAttachDescription = (attach: AttachType): string => {
	let attachDescription = '';
	if (Type.isArray(attach) && attach.length > 0)
	{
		const [firstAttach] = attach;
		if (Type.isStringFilled(firstAttach.description))
		{
			attachDescription = firstAttach.description;
		}
	}
	else if (Type.isStringFilled(attach))
	{
		attachDescription = attach;
	}

	return attachDescription;
};

const getTextForSticker = (): string => {
	return `[${Loc.getMessage('IM_PARSER_ICON_TYPE_STICKER')}]`;
};

const getTextByFileType = (text: string, type: $Values<typeof FileIconType> = FileIconType.file): string => {
	const iconText = Loc.getMessage(`IM_PARSER_ICON_TYPE_${type.toUpperCase()}`);

	return `[${iconText}] ${text}`.trim();
};

const getTextByFile = (text: string, files: Array<Object>): string => {
	const [file] = files;

	// todo: remove this hack after fix receiving messages with files on P&P
	if (!file || !file.type)
	{
		return text;
	}

	const isGallery = files.every((item) => [FileIconType.image, FileIconType.video].includes(item.type));

	if (file.type === FileType.image && files.length === 1)
	{
		return getTextByFileType(text, FileIconType.image);
	}

	if (isGallery && files.length > 1)
	{
		return getTextByFileType(text, FileIconType.gallery);
	}

	if (file.type === FileType.audio)
	{
		return getTextByFileType(text, FileIconType.audio);
	}

	if (file.type === FileType.video)
	{
		return getTextByFileType(text, FileIconType.video);
	}

	return `${Loc.getMessage('IM_PARSER_ICON_TYPE_FILE')}: ${file.name} ${text}`.trim();
};
