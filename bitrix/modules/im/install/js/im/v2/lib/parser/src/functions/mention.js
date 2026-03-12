import { Loc, Dom, Text, Type } from 'main.core';

import { Parser } from '../parser';
import { ParserUtils } from '../utils/utils';
import { getCore, getConst } from '../utils/core-proxy';
import { MentionHandler } from '../classes/mention-handler';

const { UserType, MessageMentionType, SpecialMentionDialogId = {} } = getConst();

const SpecialMentionHandlers = {
	[SpecialMentionDialogId.allParticipants]: (userName) => ParserMention.renderAllParticipantsMention(userName),
};

const MENTION_BASE_CLASS = 'bx-im-mention';
const MentionModifier = {
	highlight: '--highlight',
	extranet: '--extranet',
};

export const ParserMention = {
	decode(text): string
	{
		text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
			if (SpecialMentionHandlers[userId])
			{
				return SpecialMentionHandlers[userId](userName);
			}

			userId = Number.parseInt(userId, 10);
			if (!Type.isNumber(userId) || userId === 0)
			{
				return userName;
			}

			const user = getCore().getStore().getters['users/get'](userId);

			if (replace || !userName)
			{
				if (user)
				{
					userName = user.name;
				}
			}
			else
			{
				userName = Text.decode(userName);
			}

			if (!userName)
			{
				userName = `User ${userId}`;
			}

			let className = MENTION_BASE_CLASS;
			if (getCore().getUserId() === userId)
			{
				className += ` ${MentionModifier.highlight}`;
			}

			if (user && user.type === UserType.extranet)
			{
				className += ` ${MentionModifier.extranet}`;
			}

			return Dom.create({
				tag: 'span',
				attrs: {
					className,
					'data-type': MessageMentionType.user,
					'data-value': userId,
				},
				text: userName,
			}).outerHTML;
		});

		text = text.replace(/\[chat=(imol\|)?(\d+)](.*?)\[\/chat]/gi, (whole, isLines, chatId, chatNameParsed) => {
			if (chatId === 0)
			{
				return chatNameParsed;
			}

			let chatName = chatNameParsed;
			if (chatName)
			{
				chatName = Text.decode(chatName);
			}
			else
			{
				const dialog = getCore().getStore().getters['chats/get'](`chat${chatId}`);
				chatName = dialog ? dialog.name : `Chat ${chatId}`;
			}

			return Dom.create({
				tag: 'span',
				attrs: {
					className: MENTION_BASE_CLASS,
					'data-type': (isLines ? MessageMentionType.lines : MessageMentionType.chat),
					'data-value': (isLines ? `imol|${chatId}` : `chat${chatId}`),
				},
				text: chatName,
			}).outerHTML;
		});

		text = text.replace(/\[context=((?:chat\d+|\d+:\d+)\/(\d+))](.*?)\[\/context]/gis, (whole, contextTag, messageId, text) =>
		{
			if (!text)
			{
				return '';
			}

			text = Text.decode(text);
			contextTag = ParserUtils.getFinalContextTag(contextTag);
			if (!contextTag)
			{
				return text;
			}
			const dialogId = contextTag.split('/')[0];

			let title = '';
			messageId = Number.parseInt(messageId, 10);
			if (Type.isNumber(messageId) && messageId > 0)
			{
				const message = getCore().getStore().getters['messages/getById'](messageId);
				if (message)
				{
					title = Parser.purifyMessage(message);
					const user = getCore().getStore().getters['users/get'](message.authorId);
					if (user)
					{
						title = `${user.name}: ${title}`;
					}
				}
			}
			if (!Type.isStringFilled(title))
			{
				title = Loc.getMessage('IM_PARSER_MENTION_DIALOG');
			}

			return Dom.create({
				tag: 'span',
				attrs: {
					className: MENTION_BASE_CLASS,
					'data-type': MessageMentionType.context,
					'data-dialog-id': dialogId,
					'data-message-id': messageId,
					title,
				},
				text
			}).outerHTML;
		});

		return text;
	},

	purify(text): string
	{
		text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
			userId = Number.parseInt(userId, 10);

			if (!Type.isNumber(userId) || userId === 0)
			{
				return userName;
			}

			if (replace || !userName)
			{
				const user = getCore().getStore().getters['users/get'](userId);
				if (user)
				{
					userName = user.name;
				}
			}
			else
			{
				userName = Text.decode(userName);
			}

			if (!userName)
			{
				userName = `User ${userId}`;
			}

			return userName;
		});

		text = text.replace(/\[CHAT=(imol\|)?(\d+)](.*?)\[\/CHAT]/gi, (whole, openlines, chatId, chatName) => {
			chatId = Number.parseInt(chatId, 10);

			if (!chatName)
			{
				const dialog = getCore().getStore().getters['chats/get']('chat'+chatId);
				chatName = dialog? dialog.name: 'Chat '+chatId;
			}

			return chatName;
		});

		text = text.replace(/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gis, (whole, dialogId, messageId, text) => {
			if (!text)
			{
				const dialog = getCore().getStore().getters['chats/get'](dialogId);
				text = dialog? dialog.name: 'Dialog '+dialogId;
			}

			return text;
		});

		return text;
	},

	executeClickEvent(event: PointerEvent, context: ApplicationContext)
	{
		const mentionHandler = new MentionHandler(context);

		mentionHandler.handleClick(event);
	},

	renderAllParticipantsMention(userName: string): string
	{
		const className = `${MENTION_BASE_CLASS} ${MentionModifier.highlight}`;

		return Dom.create({
			tag: 'span',
			attrs: {
				className,
				'data-type': MessageMentionType.user,
				'data-value': SpecialMentionDialogId.allParticipants,
			},
			text: userName,
		}).outerHTML;
	},
};
