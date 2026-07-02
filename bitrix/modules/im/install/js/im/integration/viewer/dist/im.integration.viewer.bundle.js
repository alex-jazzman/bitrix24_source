/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.Integration = this.BX.Messenger.Integration || {};
(function (exports, main_core, disk_viewer_onlyofficeItem) {
	'use strict';

	class OnlyOfficeChatItem extends disk_viewer_onlyofficeItem.OnlyOfficeItem {
		constructor(options) {
			options = options || {};
			super(options);
			this.chatId = options.imChatId;
		}
		setPropertiesByNode(node) {
			super.setPropertiesByNode(node);
			this.chatId = node.dataset.imChatId;
		}
		loadData() {
			/** @see BXIM.callController.currentCall */
			if (!main_core.Reflection.getClass('BXIM.callController.currentCall')) {
				return super.loadData();
			}
			const callController = BXIM.callController;
			const dialogId = callController.currentCall.associatedEntity.id;
			const chatId = this.getChatId(dialogId);
			if (!chatId || chatId != this.chatId) {
				return super.loadData();
			}
			callController.unfold();
			callController.showDocumentEditor({
				viewerItem: this,
				force: true
			});
			return new BX.Promise();
		}
		getChatId(dialogId) {
			return dialogId.toString().startsWith('chat') ? dialogId.substr(4) : BXIM.messenger.userChat[dialogId];
		}
	}

	class OnlyOfficeResumeItem extends OnlyOfficeChatItem {
		loadData() {
			/** @see BXIM.callController.currentCall */
			if (!main_core.Reflection.getClass('BXIM.callController.currentCall')) {
				return super.loadData();
			}
			const messageId = BX.MessengerCommon.diskGetMessageId(this.chatId, this.objectId);
			if (!messageId) {
				return super.loadData();
			}
			const callId = BX.MessengerCommon.getMessageParam(messageId, 'CALL_ID');
			const callController = BXIM.callController;
			if (!callId) {
				return super.loadData();
			}
			if (callId != callController.currentCall.id) {
				return super.loadData();
			} else {
				callController.unfold();
				callController.showDocumentEditor({
					type: BX.Call.Controller.DocumentType.Resume,
					force: true
				});
			}
			return new BX.Promise();
		}
	}

	exports.OnlyOfficeChatItem = OnlyOfficeChatItem;
	exports.OnlyOfficeResumeItem = OnlyOfficeResumeItem;

})(this.BX.Messenger.Integration.Viewer = this.BX.Messenger.Integration.Viewer || {}, BX, BX.Disk.Viewer);
//# sourceMappingURL=im.integration.viewer.bundle.js.map
