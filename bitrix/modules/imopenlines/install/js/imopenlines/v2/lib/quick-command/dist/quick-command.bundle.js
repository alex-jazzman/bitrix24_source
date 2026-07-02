/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, main_core, main_core_events, im_v2_provider_service_chat, im_v2_lib_utils, im_v2_const, im_v2_component_textarea) {
	'use strict';

	const COMMAND_PREFIX = '/';
	const AUTO_HIDE_DELAY = 5000;
	const QuickCommand = {
		getDialogId: 'getDialogId',
		getChatId: 'getChatId',
		rename: 'rename'
	};
	class QuickCommandManager {
		#dialogId;
		#chatService;
		constructor(dialogId) {
			this.#dialogId = dialogId;
			this.#chatService = new im_v2_provider_service_chat.ChatService();
			this.#subscribe();
		}
		destroy() {
			this.#unsubscribe();
		}
		#subscribe() {
			this.onBeforeSendMessageHandler = this.#onBeforeSendMessage.bind(this);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.onBeforeSendMessageHandler);
		}
		#unsubscribe() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.onBeforeSendMessageHandler);
		}
		#onBeforeSendMessage() {
			const text = this.#getText();
			const parsed = this.#parseCommand(text);
			if (parsed && this.#handleCommand(parsed.command, parsed.args)) {
				return im_v2_component_textarea.BeforeSendMessageAction.cancel;
			}
		}
		#getText() {
			const result = main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.getText, {
				dialogId: this.#dialogId
			});
			return result[0] ?? '';
		}
		#parseCommand(raw) {
			if (!raw || !raw.startsWith(COMMAND_PREFIX)) {
				return null;
			}
			const [command, ...args] = raw.slice(COMMAND_PREFIX.length).split(' ');
			return {
				command,
				args
			};
		}
		#getCommandMap() {
			return {
				[QuickCommand.getDialogId]: this.#executeGetDialogId.bind(this),
				[QuickCommand.getChatId]: this.#executeGetDialogId.bind(this),
				[QuickCommand.rename]: this.#executeRename.bind(this)
			};
		}
		#handleCommand(command, args) {
			const handler = this.#getCommandMap()[command];
			if (!handler) {
				return false;
			}
			handler(args);
			return true;
		}
		#executeGetDialogId() {
			const message = main_core.Loc.getMessage('IMOL_TEXTAREA_COMMAND_DIALOG_ID_COPIED').replace('#DIALOG_ID#', `<b>${this.#dialogId}</b>`);
			BX.UI.Notification.Center.notify({
				content: message,
				autoHideDelay: AUTO_HIDE_DELAY
			});
			void im_v2_lib_utils.Utils.text.copyToClipboard(this.#dialogId);
		}
		#executeRename(args) {
			const newName = args.join(' ');
			if (newName === '') {
				return;
			}
			void this.#chatService.renameChat(this.#dialogId, newName);
		}
	}

	exports.QuickCommandManager = QuickCommandManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Component);
//# sourceMappingURL=quick-command.bundle.js.map
