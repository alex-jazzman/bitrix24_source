/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core) {
	'use strict';

	const UnreadModeManager = {
		removeItemFromList(params) {
			const {
				chatId,
				isMuted
			} = im_v2_application_core.Core.getStore().getters['chats/get'](params.dialogId);
			if (!isMuted && hasChatCounter(chatId)) {
				return;
			}
			this.removeDialogIdBySections(params);
		},
		removeDialogIdBySections(params) {
			const {
				recentSections,
				dialogId,
				parentChatId
			} = params;
			recentSections.forEach(type => {
				void im_v2_application_core.Core.getStore().dispatch('recent/clearByDialogId', {
					dialogId,
					parentChatId,
					type,
					unread: true
				});
			});
		},
		removeClosedChats(recentType) {
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
				this.removeDialogIdBySections({
					recentSections: [recentType],
					dialogId
				});
			});
		}
	};
	function hasChatCounter(chatId) {
		const hasUnreadMessage = im_v2_application_core.Core.getStore().getters['messages/getFirstUnread'](chatId);
		const hasUnreadStatus = im_v2_application_core.Core.getStore().getters['counters/getUnreadStatus'](chatId);
		const hasChildrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](chatId) > 0;
		return hasUnreadMessage || hasUnreadStatus || hasChildrenCounter;
	}

	exports.UnreadModeManager = UnreadModeManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application);
//# sourceMappingURL=unread-mode.bundle.js.map
