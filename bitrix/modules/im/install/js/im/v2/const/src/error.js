export const ErrorCode = Object.freeze({
	collabV2: {
		tariffRestricted: 'COLLAB_TARIFF_RESTRICTED',
	},
	collab: {
		excludeFromStructure: 'EXCLUDE_DENIED_FROM_STRUCTURE',
		leaveFromStructure: 'LEAVE_DENIED_FROM_STRUCTURE',
	},
	chat: {
		accessDenied: 'ACCESS_DENIED',
		notFound: 'CHAT_NOT_FOUND',
	},
	structureLink: {
		chatTypeNotSupported: 'CHAT_TYPE_NOT_SUPPORTED',
		tooManyNodes: 'TOO_MANY_NODES',
		nodeNotAvailable: 'NODE_NOT_AVAILABLE',
		structureNotAvailable: 'STRUCTURE_NOT_AVAILABLE',
	},
	message: {
		accessDenied: 'MESSAGE_ACCESS_DENIED',
		accessDeniedByTariff: 'MESSAGE_ACCESS_DENIED_BY_TARIFF',
		notFound: 'MESSAGE_NOT_FOUND',
		// the stored composition is verified after the message is saved, so this refusal comes back on an
		// edit that went through
		filesMismatch: 'MESSAGE_FILES_MISMATCH',
	},
	user: {
		invitedFromStructure: 'USER_INVITED_FROM_STRUCTURE',
		notFound: 'USER_NOT_FOUND',
	},
	file: {
		maxFileSize: 'MAX_FILE_SIZE_EXCEEDED',
	},
	folder: {
		chatNotEligible: 'FOLDER_CHAT_NOT_ELIGIBLE',
	},
	sticker: {
		maxPacks: 'MAX_PACKS_ERROR',
		maxStickers: 'MAX_STICKERS_ERROR',
	},
	aiTask: {
		// the deduplication slot of the chat is still busy with this very selection
		creationInProgress: 'AI_TASK_CREATION_IN_PROGRESS',
		// no task can be made of such a source: a system message, a sticker, a deleted message,
		// an open line, a support chat, a network dialog
		sourceNotSupported: 'AI_TASK_SOURCE_NOT_SUPPORTED',
	},
});
