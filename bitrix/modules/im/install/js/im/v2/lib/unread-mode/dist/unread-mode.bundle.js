/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core) {
	'use strict';

	const UnreadModeManager = {
		removeItemFromList(recentType, dialogId) {
			const {
				chatId,
				isMuted
			} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			if (!isMuted && hasChatCounter(chatId)) {
				return;
			}
			this.clearByDialogId(recentType, dialogId);
		},
		clearClosedChats(recentType) {
			const collection = im_v2_application_core.Core.getStore().getters['recent/getUnreadCollection']({
				type: recentType
			});
			const dialogIds = collection.map(({
				dialogId
			}) => dialogId);
			const dialogIdsToRemove = dialogIds.filter(dialogId => {
				return !im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
			});
			dialogIdsToRemove.forEach(dialogId => {
				this.clearByDialogId(recentType, dialogId);
			});
		},
		clearDialogIdBySections(sections, dialogId) {
			sections.forEach(recentSection => {
				this.clearByDialogId(recentSection, dialogId);
			});
		},
		clearByDialogId(recentType, dialogId) {
			void im_v2_application_core.Core.getStore().dispatch('recent/clearByDialogId', {
				dialogId,
				type: recentType,
				unread: true
			});
		}
	};
	function hasChatCounter(chatId) {
		const hasUnreadMessage = im_v2_application_core.Core.getStore().getters['messages/getFirstUnread'](chatId);
		const hasUnreadStatus = im_v2_application_core.Core.getStore().getters['counters/getUnreadStatus'](chatId);
		return hasUnreadMessage || hasUnreadStatus;
	}

	exports.UnreadModeManager = UnreadModeManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application);
//# sourceMappingURL=unread-mode.bundle.js.map
