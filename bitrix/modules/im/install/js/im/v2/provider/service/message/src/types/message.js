import type { RunActionError } from 'im.v2.lib.rest';

import type {
	RawCopilot,
	RawFile,
	RawMessage,
	RawCommentInfo,
	RawUser,
	RawReaction,
	RawShortUser,
	RawTariffRestrictions,
	RawSticker,
} from 'im.v2.provider.service.types';

export type PaginationRestResult = {
	chat_id: number,
	files: RawFile[],
	messages: RawMessage[],
	commentInfo: RawCommentInfo[],
	additionalMessages: RawMessage[],
	users: RawUser[],
	usersShort: RawShortUser[],
	reactions: RawReaction[],
	hasPrevPage?: boolean,
	hasNextPage?: boolean,
	copilot: RawCopilot,
	tariffRestrictions: RawTariffRestrictions,
	stickers: RawSticker[],
};

export type EditMessageResult = {
	success: boolean,
	// false when a newer attempt for the same message has already started
	isLatestAttempt: boolean,
	// the snapshot the optimistic update overwrote; both fields are restored on a rollback
	textBeforeEdit: string,
	isEditedBeforeEdit: boolean,
	reason: ?RunActionError,
};

export type TranscriptionResponse = {
	fileId: number,
	status: 'Success' | 'Pending' | 'Error',
	transcriptText: string | null,
};
