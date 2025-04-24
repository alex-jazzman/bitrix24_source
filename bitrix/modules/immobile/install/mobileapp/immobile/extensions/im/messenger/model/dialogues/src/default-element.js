/**
 * @module im/messenger/model/dialogues/default-element
 */

jn.define('im/messenger/model/dialogues/default-element', (require, exports, module) => {
	const { DialogType, UserRole, Color } = require('im/messenger/const');

	const dialogDefaultElement = Object.freeze({
		dialogId: '0',
		chatId: 0,
		type: DialogType.chat,
		name: '',
		description: '',
		avatar: '',
		color: Color.base,
		extranet: false,
		counter: 0,
		userCounter: 0,
		participants: [],
		lastLoadParticipantId: 0,
		lastReadId: 0,
		markedId: 0,
		lastMessageId: 0,
		lastMessageViews: {
			countOfViewers: 0,
			firstViewer: null,
			messageId: 0,
		},
		savedPositionMessageId: 0,
		managerList: [],
		readList: [],
		inputActions: [],
		muteList: [],
		textareaMessage: '',
		quoteId: 0,
		owner: 0,
		entityType: '',
		entityId: '',
		dateCreate: null,
		public: {
			code: '',
			link: '',
		},
		inited: false,
		loading: false,
		hasPrevPage: false,
		hasNextPage: false,
		diskFolderId: 0,
		role: UserRole.guest,
		permissions: {
			manageMessages: UserRole.none,
			manageUsersAdd: UserRole.none,
			manageUsersDelete: UserRole.none,
			manageUi: UserRole.none,
			manageSettings: UserRole.none,
			canPost: UserRole.none,
		},
		tariffRestrictions: {
			isHistoryLimitExceeded: false,
		},
		aiProvider: '',
		parentChatId: 0, // unsafe in local database
		parentMessageId: 0, // unsafe in local database
		messageCount: 0, // unsafe in local database
	});

	module.exports = {
		dialogDefaultElement,
	};
});
