/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core_events, im_v2_application_core, im_v2_lib_layout, im_v2_const) {
	'use strict';

	const CreatableChatType = {
		chat: 'chat',
		videoconf: 'videoconf',
		channel: 'channel',
		collab: 'collab',
		collabChat: 'collabChat'
	};
	class CreateChatManager extends main_core_events.EventEmitter {
		static events = {
			creationStatusChange: 'creationStatusChange',
			titleChange: 'titleChange',
			avatarChange: 'avatarChange',
			chatTypeChange: 'chatTypeChange'
		};
		static #instance;
		#isCreating = false;
		#chatType = CreatableChatType.chat;
		#chatTitle = '';
		#chatAvatarFile = null;
		#chatFields;
		// preset fields - pre-configured one-time values
		#parentChatId;
		#preselectedMembers = [];
		#includeCurrentUser = true;
		#ownerId;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		constructor(props) {
			super(props);
			this.setEventNamespace('BX.Messenger.v2.CreateChatManager');
		}
		startChatCreation(chatTypeToCreate, params = {}) {
			const {
				clearCurrentCreation = true,
				preselectedMembers = [],
				includeCurrentUser = true,
				ownerId = null,
				parentChatId = 0
			} = params;
			if (clearCurrentCreation) {
				this.setCreationStatus(false);
			}
			this.#parentChatId = parentChatId;
			this.#preselectedMembers = preselectedMembers;
			this.#includeCurrentUser = includeCurrentUser;
			this.#ownerId = ownerId;
			return im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.createChat,
				entityId: chatTypeToCreate
			});
		}
		cancelChatCreation() {
			this.setCreationStatus(false);
			return im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout();
		}
		completeChatCreation(newDialogId) {
			this.setCreationStatus(false);
			if (!newDialogId) {
				return Promise.resolve();
			}
			return im_v2_lib_layout.LayoutManager.getInstance().restoreOriginLayout(newDialogId);
		}
		isCreating() {
			return this.#isCreating;
		}
		isCreationLayoutActive(type) {
			const {
				name: currentLayoutName,
				entityId: currentLayoutChatType
			} = im_v2_application_core.Core.getStore().getters['application/getLayout'];
			return currentLayoutName === im_v2_const.Layout.createChat && currentLayoutChatType === type;
		}
		getChatType() {
			return this.#chatType;
		}
		getChatTitle() {
			return this.#chatTitle;
		}
		getChatAvatar() {
			return this.#chatAvatarFile;
		}
		getParentChatId() {
			return this.#parentChatId;
		}
		setChatType(type) {
			this.#chatType = type;
			this.emit(CreateChatManager.events.chatTypeChange, type);
		}
		setCreationStatus(flag) {
			this.#isCreating = flag;
			this.clearFields();
			this.emit(CreateChatManager.events.creationStatusChange, flag);
		}
		setChatTitle(chatTitle) {
			this.#chatTitle = chatTitle;
			this.emit(CreateChatManager.events.titleChange, chatTitle);
		}
		setChatAvatar(chatAvatarFile) {
			this.#chatAvatarFile = chatAvatarFile;
			this.emit(CreateChatManager.events.avatarChange, chatAvatarFile);
		}
		saveFields(chatFields) {
			this.#chatFields = chatFields;
		}
		getFields() {
			return this.#chatFields;
		}
		clearFields() {
			this.#chatFields = null;
			this.setChatTitle('');
			this.setChatAvatar(null);
		}
		getChatMembers() {
			const mappedMembers = this.#preselectedMembers.map(item => [item.type, item.id]);
			if (this.#includeCurrentUser) {
				mappedMembers.push(['user', im_v2_application_core.Core.getUserId()]);
			}
			return mappedMembers;
		}
		getOwnerId() {
			return this.#ownerId ?? im_v2_application_core.Core.getUserId();
		}
		getUndeselectedItems() {
			if (this.#includeCurrentUser) {
				return [['user', im_v2_application_core.Core.getUserId()]];
			}
			return [];
		}
		clearPresetFields() {
			this.#ownerId = null;
			this.#includeCurrentUser = true;
			this.#preselectedMembers = [];
		}
	}

	exports.CreatableChatType = CreatableChatType;
	exports.CreateChatManager = CreateChatManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const);
//# sourceMappingURL=create-chat.bundle.js.map
