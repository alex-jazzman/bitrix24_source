/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core,im_v2_const,im_v2_lib_utils) {
	'use strict';

	const MessageManager = {
	  isEditable(id) {
	    const isRealMessage = im_v2_application_core.Core.getStore().getters['messages/isRealMessage'](id);
	    const isExists = im_v2_application_core.Core.getStore().getters['messages/isExists'](id);
	    const isSticker = im_v2_application_core.Core.getStore().getters['stickers/messages/isSticker'](id);
	    const isOwnMessage = MessageManager.isOwnMessage(id);
	    const isCheckIn = MessageManager.isCheckInMessage(id);
	    if (!isRealMessage || !isExists || !isOwnMessage || isSticker || isCheckIn) {
	      return false;
	    }
	    const isForward = im_v2_application_core.Core.getStore().getters['messages/isForward'](id);
	    const isVideoNote = im_v2_application_core.Core.getStore().getters['messages/isVideoNote'](id);
	    return !isForward && !isVideoNote;
	  },
	  isOwnMessage(id) {
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](id);
	    if (!message) {
	      return false;
	    }
	    return message.authorId === im_v2_application_core.Core.getUserId();
	  },
	  isCheckInMessage(id) {
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](id);
	    if (!message) {
	      return false;
	    }
	    return message.componentId === im_v2_const.MessageComponent.checkIn;
	  },
	  isTodayMessage(id) {
	    const message = im_v2_application_core.Core.getStore().getters['messages/getById'](id);
	    if (!message) {
	      return false;
	    }
	    if (MessageManager.isPlaceholderMessage(message.id)) {
	      return false;
	    }
	    return im_v2_lib_utils.Utils.date.isToday(message.date);
	  },
	  isTempMessage(messageId) {
	    return MessageManager.isPendingMessage(messageId) || MessageManager.isPlaceholderMessage(messageId);
	  },
	  isPendingMessage(messageId) {
	    return im_v2_lib_utils.Utils.text.isUuidV4(messageId);
	  },
	  isPlaceholderMessage(messageId) {
	    const preparedMessageId = String(messageId);
	    return preparedMessageId.startsWith(im_v2_const.FakeMessagePrefix) || preparedMessageId.startsWith(im_v2_const.FakeDraftMessagePrefix);
	  }
	};

	exports.MessageManager = MessageManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.Messenger.v2.Lib));
//# sourceMappingURL=message.bundle.js.map
