import { type RawSession } from 'imopenlines.v2.provider.service';

import {
	type RawChat,
	type RawCollabInfo,
	type RawCommentInfo,
	type RawCopilot,
	type RawFile,
	type RawMessage,
	type RawMessagesAutoDeleteConfig,
	type RawPin,
	type RawReaction,
	type RawShortUser,
	type RawTariffRestrictions,
	type RawUser,
} from 'im.v2.provider.service.types';

export type ChatLoadRestResult = {
	additionalMessages: RawMessage[],
	chat: RawChat,
	commentInfo: RawCommentInfo[],
	collabInfo?: RawCollabInfo,
	files: RawFile[],
	session?: RawSession,
	hasNextPage: boolean,
	hasPrevPage: boolean,
	messages?: RawMessage[],
	pins: RawPin[],
	reactions: RawReaction[],
	users: RawUser[],
	usersShort: RawShortUser[],
	copilot: RawCopilot,
	tariffRestrictions: RawTariffRestrictions,
	messagesAutoDeleteConfigs: RawMessagesAutoDeleteConfig[],
	stickers?: RawSticker[]
};

export type CommentInfoRestResult = {
	commentInfo: RawCommentInfo[],
	usersShort: RawShortUser[],
};

export type RawSticker = {
	id: number,
	packId: number,
	packType: string,
	type: string,
	uri: string,
	width: number,
	height: number,
}
