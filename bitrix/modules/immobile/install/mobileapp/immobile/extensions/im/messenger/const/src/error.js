/**
 * @module im/messenger/const/error
 */
jn.define('im/messenger/const/error', (require, exports, module) => {
	const ErrorType = {
		dialog: {
			accessError: 'ACCESS_ERROR',
			accessDenied: 'ACCESS_DENIED',
			chatNotFound: 'CHAT_NOT_FOUND',
			delete: {
				userInvitedFromStructure: 'USER_INVITED_FROM_STRUCTURE',
			},
		},
		planLimit: {
			MESSAGE_ACCESS_DENIED_BY_TARIFF: 'MESSAGE_ACCESS_DENIED_BY_TARIFF',
			COLLAB_TARIFF_RESTRICTED: 'COLLAB_TARIFF_RESTRICTED',
		},
		project: {
			accessDenied: 'PROJECT_ACCESS_DENIED',
		},
		recent: {
			maxPin: 'MAX_PINNED_CHATS_ERROR',
		},
		networkError: 'NETWORK_ERROR',
		reaction: {
			reactionNotFound: 'REACTION_NOT_FOUND',
			reactionAlreadySet: 'REACTION_ALREADY_SET',
		},
		// Refusals of an AI task creation the user can be told apart: a slot of the chat already taken
		// by an operation over the same messages, and a source no task can be built out of.
		aiTask: {
			creationInProgress: 'AI_TASK_CREATION_IN_PROGRESS',
			sourceNotSupported: 'AI_TASK_SOURCE_NOT_SUPPORTED',
			creationNotAvailable: 'AI_TASK_CREATION_NOT_AVAILABLE',
		},
	};

	const ErrorCode = {
		/* region ajax (runAction) */
		NETWORK_ERROR: 404,
		INTERNAL_SERVER_ERROR: 500,
		/* region rest (BX.rest.callMethod) */
		NO_INTERNET_CONNECTION: -2,
	};

	module.exports = { ErrorType, ErrorCode };
});
