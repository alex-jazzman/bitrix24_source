/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,im_v2_application_core,im_v2_const,im_v2_lib_channel,im_v2_lib_message,im_v2_lib_utils) {
	'use strict';

	const RecentManager = {
	  getSortDate(dialogId) {
	    const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
	    if (!recentItem) {
	      return null;
	    }
	    const {
	      messageId,
	      draft,
	      lastActivityDate
	    } = recentItem;
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
	    const messageDate = message == null ? void 0 : message.date;
	    if (main_core.Type.isDate(draft.date) && draft.date > messageDate) {
	      return draft.date;
	    }
	    if (this.needsBirthdayPlaceholder(dialogId)) {
	      return im_v2_lib_utils.Utils.date.getStartOfTheDay();
	    }
	    const lastActivity = lastActivityDate;
	    const shouldUseActivityDate = main_core.Type.isDate(lastActivity) && lastActivity > messageDate;
	    if (im_v2_lib_channel.ChannelManager.isChannel(dialogId) && shouldUseActivityDate) {
	      return lastActivity;
	    }
	    return messageDate != null ? messageDate : lastActivity;
	  },
	  needToShowItem(item) {
	    if (item.isBirthdayPlaceholder && !isBirthdayOptionEnabled()) {
	      return false;
	    }
	    if (item.isFakeElement) {
	      return needToShowFakeItem(item);
	    }
	    return true;
	  },
	  needsBirthdayPlaceholder(dialogId) {
	    if (!isBirthdayOptionEnabled()) {
	      return false;
	    }
	    const hasBirthday = im_v2_application_core.Core.getStore().getters['users/hasBirthday'](dialogId);
	    if (!hasBirthday) {
	      return false;
	    }
	    return needsPlaceholder(dialogId);
	  },
	  needsVacationPlaceholder(dialogId) {
	    const hasVacation = im_v2_application_core.Core.getStore().getters['users/hasVacation'](dialogId);
	    if (!hasVacation) {
	      return false;
	    }
	    return needsPlaceholder(dialogId);
	  }
	};
	const isBirthdayOptionEnabled = () => {
	  return im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.recent.showBirthday);
	};
	const isInvitedOptionEnabled = () => {
	  return im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.recent.showInvited);
	};
	const needsPlaceholder = dialogId => {
	  const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
	  if (!recentItem) {
	    return false;
	  }
	  const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	  if (!dialog || dialog.type !== im_v2_const.ChatType.user) {
	    return false;
	  }
	  const isSelfChat = im_v2_application_core.Core.getStore().getters['chats/isSelfChat'](dialogId);
	  if (isSelfChat) {
	    return false;
	  }
	  const hasTodayMessage = im_v2_lib_message.MessageManager.isTodayMessage(recentItem.messageId);
	  if (hasTodayMessage) {
	    return false;
	  }
	  const chatCounter = im_v2_application_core.Core.getStore().getters['counters/getCounterByChatId'](dialog.chatId);
	  return chatCounter === 0;
	};
	const needToShowFakeItem = item => {
	  if (isInvitedOptionEnabled()) {
	    return true;
	  }

	  // we show fake invited users only if it is their birthday
	  if (!isBirthdayOptionEnabled()) {
	    return false;
	  }
	  const isUser = im_v2_application_core.Core.getStore().getters['chats/isUser'](item.dialogId);
	  if (!isUser) {
	    return false;
	  }
	  return im_v2_application_core.Core.getStore().getters['users/hasBirthday'](item.dialogId);
	};

	exports.RecentManager = RecentManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=recent.bundle.js.map
