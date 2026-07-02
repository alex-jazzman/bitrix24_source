/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.Provider = this.BX.Messenger.Provider || {};
(function (exports, im_const, ui_vue_vuex, im_lib_logger, main_core_events) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * Base Rest Answer Handler
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	class BaseRestHandler {
		static create(params = {}) {
			return new this(params);
		}
		constructor(params = {}) {
			if (typeof params.controller === 'object' && params.controller) {
				this.controller = params.controller;
			}
			if (typeof params.store === 'object' && params.store) {
				this.store = params.store;
			}
		}
		execute(command, result, extra = {}) {
			command = 'handle' + command.split('.').map(element => {
				return element.charAt(0).toUpperCase() + element.slice(1);
			}).join('');
			if (result.error()) {
				if (typeof this[command + 'Error'] === 'function') {
					return this[command + 'Error'](result.error(), extra);
				}
			} else {
				if (typeof this[command + 'Success'] === 'function') {
					return this[command + 'Success'](result.data(), extra);
				}
			}
			return typeof this[command] === 'function' ? this[command](result, extra) : null;
		}
	}

	/**
	 * Bitrix Messenger
	 * Im rest answers (Rest Answer Handler)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	class CoreRestHandler extends BaseRestHandler {
		handleImUserListGetSuccess(data) {
			this.store.dispatch('users/set', ui_vue_vuex.VuexBuilderModel.convertToArray(data));
		}
		handleImUserGetSuccess(data) {
			this.store.dispatch('users/set', [data]);
		}
		handleImChatGetSuccess(data) {
			this.store.dispatch('dialogues/set', data);
		}
		handleImDialogMessagesGetSuccess(data) {
			this.store.dispatch('users/set', data.users);
			this.store.dispatch('files/setBefore', this.controller.application.prepareFilesBeforeSave(data.files));
			// this.store.dispatch('messages/setBefore', data.messages);
		}
		handleImDialogMessagesGetInitSuccess(data) {
			this.store.dispatch('users/set', data.users);
			this.store.dispatch('files/set', this.controller.application.prepareFilesBeforeSave(data.files));
			//handling messagesSet for empty chat
			if (data.messages.length === 0 && data.chat_id) {
				im_lib_logger.Logger.warn('setting messagesSet for empty chat', data.chat_id);
				setTimeout(() => {
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.messagesSet, {
						chatId: data.chat_id
					});
				}, 100);
			} else {
				this.store.dispatch('messages/set', data.messages.reverse());
			}
		}
		handleImDialogMessagesGetUnreadSuccess(data) {
			this.store.dispatch('users/set', data.users);
			this.store.dispatch('files/set', this.controller.application.prepareFilesBeforeSave(data.files));
			// this.store.dispatch('messages/setAfter', data.messages);
		}
		handleImDiskFolderGetSuccess(data) {
			this.store.commit('application/set', {
				dialog: {
					diskFolderId: data.ID
				}
			});
		}
		handleImMessageAddSuccess(messageId, message) {
			this.store.dispatch('messages/update', {
				id: message.id,
				chatId: message.chatId,
				fields: {
					id: messageId,
					sending: false,
					error: false
				}
			}).then(() => {
				this.store.dispatch('messages/actionFinish', {
					id: messageId,
					chatId: message.chatId
				});
			});
		}
		handleImMessageAddError(error, message) {
			this.store.dispatch('messages/actionError', {
				id: message.id,
				chatId: message.chatId
			});
		}
		handleImDiskFileCommitSuccess(result, message) {
			this.store.dispatch('messages/update', {
				id: message.id,
				chatId: message.chatId,
				fields: {
					id: result['MESSAGE_ID'],
					sending: false,
					error: false
				}
			}).then(() => {
				this.store.dispatch('messages/actionFinish', {
					id: result['MESSAGE_ID'],
					chatId: message.chatId
				});
			});
		}
		handleImDiskFileCommitError(error, message) {
			this.store.dispatch('files/update', {
				chatId: message.chatId,
				id: message.file.id,
				fields: {
					status: im_const.FileStatus.error,
					progress: 0
				}
			});
			this.store.dispatch('messages/actionError', {
				id: message.id,
				chatId: message.chatId,
				retry: false
			});
		}
		handleImRecentListSuccess(result, message) {
			im_lib_logger.Logger.warn('Provider.Rest.handleImRecentGetSuccess', result);
			const users = [];
			const dialogues = [];
			const recent = [];
			result.items.forEach(item => {
				let userId = 0;
				let chatId = 0;
				if (item.user && item.user.id > 0) {
					userId = item.user.id;
					users.push(item.user);
				}
				if (item.chat) {
					chatId = item.chat.id;
					dialogues.push(Object.assign(item.chat, {
						dialogId: item.id
					}));
				} else {
					dialogues.push(Object.assign({}, {
						dialogId: item.id
					}));
				}
				recent.push({
					...item,
					avatar: item.avatar.url,
					color: item.avatar.color,
					userId: userId,
					chatId: chatId
				});
			});
			this.store.dispatch('users/set', users);
			this.store.dispatch('dialogues/set', dialogues);
			this.store.dispatch('recent/set', recent);
		}
	}

	/**
	 * Bitrix Im
	 * Dialog Rest answers (Rest Answer Handler)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2023 Bitrix
	 */

	class DialogRestHandler extends BaseRestHandler {
		constructor(params) {
			super(params);
			this.application = params.application;
		}
		handleImChatGetSuccess(data) {
			this.store.commit('application/set', {
				dialog: {
					chatId: data.id,
					dialogId: data.dialog_id,
					diskFolderId: data.disk_folder_id
				}
			});
		}
		handleImCallGetCallLimitsSuccess(data) {
			this.store.commit('application/set', {
				call: {
					serverEnabled: data.callServerEnabled,
					maxParticipants: data.maxParticipants
				}
			});
		}
		handleImChatGetError(error) {
			if (error.ex.error === 'ACCESS_ERROR') {
				im_lib_logger.Logger.error('MobileRestAnswerHandler.handleImChatGetError: ACCESS_ERROR');
				//	app.closeController();
			}
		}
		handleImDialogMessagesGetInitSuccess(data) {
			// EventEmitter.emit(EventType.dialog.readVisibleMessages, {chatId: this.controller.application.getChatId()});
		}
		handleImMessageAddSuccess(messageId, message) {
			console.warn('im.message.add success in dialog handler');
			// this.application.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
		handleImMessageAddError(error, message) {
			// this.application.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
		handleImDiskFileCommitSuccess(result, message) {
			// this.application.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
	}

	exports.BaseRestHandler = BaseRestHandler;
	exports.CoreRestHandler = CoreRestHandler;
	exports.DialogRestHandler = DialogRestHandler;

})(this.BX.Messenger.Provider.Rest = this.BX.Messenger.Provider.Rest || {}, BX.Messenger.Const, BX, BX.Messenger.Lib, BX.Event);
//# sourceMappingURL=registry.bundle.js.map
