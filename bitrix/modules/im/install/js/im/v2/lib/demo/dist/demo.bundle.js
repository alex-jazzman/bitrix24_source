/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_user, im_v2_lib_utils) {
	'use strict';

	let nextChatId = Number.MIN_SAFE_INTEGER;
	let nextUserId = Number.MIN_SAFE_INTEGER;
	let nextMessageId = Number.MIN_SAFE_INTEGER;
	let nextFileId = Number.MIN_SAFE_INTEGER;
	const IdGenerator = {
		getDialogId() {
			return im_v2_lib_utils.Utils.text.getUuidV4();
		},
		getNextChatId() {
			nextChatId++;
			return nextChatId;
		},
		getNextUserId() {
			nextUserId++;
			return nextUserId;
		},
		getNextMessageId() {
			nextMessageId++;
			return nextMessageId;
		},
		getNextFileId() {
			nextFileId++;
			return nextFileId;
		}
	};

	class DemoChatBuilder {
		#chat = {};
		#messages = [];
		#users = [];
		#files = [];
		static isDemoDialogId(dialogId) {
			return im_v2_lib_utils.Utils.text.isUuidV4(dialogId);
		}
		addChat(fields) {
			this.#chat = {
				...this.#getDefaultChatFields(),
				...fields,
				dialogId: IdGenerator.getDialogId(),
				chatId: IdGenerator.getNextChatId()
			};
			return this.#chat;
		}
		addMessage(fields) {
			const newMessage = {
				id: fields.id ?? IdGenerator.getNextMessageId(),
				chatId: this.#chat.chatId ?? 0,
				...fields
			};
			this.#messages.push(newMessage);
			return newMessage;
		}
		getNextMessageId() {
			return IdGenerator.getNextMessageId();
		}
		addUser(fields) {
			const newUser = {
				id: IdGenerator.getNextUserId(),
				...fields
			};
			this.#users.push(newUser);
			return newUser;
		}
		addFile(fields) {
			const newFile = {
				id: IdGenerator.getNextFileId(),
				chatId: this.#chat.chatId ?? 0,
				...fields
			};
			this.#files.push(newFile);
			return newFile;
		}
		addFileTranscription(transcription) {
			im_v2_application_core.Core.getStore().dispatch('files/setTranscription', transcription);
		}
		save() {
			if (this.#messages.length > 0) {
				const [newestMessage] = this.#messages.slice(-1);
				this.#chat.lastMessageId = newestMessage.id;
			}
			void im_v2_application_core.Core.getStore().dispatch('chats/set', this.#chat);
			const userManager = new im_v2_lib_user.UserManager();
			void userManager.addUsersToModel(this.#users);
			void im_v2_application_core.Core.getStore().dispatch('files/set', this.#files);
			void im_v2_application_core.Core.getStore().dispatch('messages/setChatCollection', {
				messages: this.#messages
			});
		}
		getChat() {
			return this.#chat;
		}
		getUsers() {
			return this.#users;
		}
		getMessages() {
			return this.#messages;
		}
		getFiles() {
			return this.#files;
		}
		#getDefaultChatFields() {
			return {
				type: im_v2_const.ChatType.chat,
				inited: true,
				role: im_v2_const.UserRole.member,
				permissions: {
					manageUi: im_v2_const.UserRole.member,
					manageSettings: im_v2_const.UserRole.member,
					manageUsersAdd: im_v2_const.UserRole.member,
					manageUsersDelete: im_v2_const.UserRole.member,
					manageMessages: im_v2_const.UserRole.member
				}
			};
		}
	}

	exports.DemoChatBuilder = DemoChatBuilder;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=demo.bundle.js.map
