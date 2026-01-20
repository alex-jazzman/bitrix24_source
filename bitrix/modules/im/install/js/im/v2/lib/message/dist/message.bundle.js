/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core) {
	'use strict';

	const MessageManager = {
	  isEditable(id) {
	    const isRealMessage = im_v2_application_core.Core.getStore().getters['messages/isRealMessage'](id);
	    const isExists = im_v2_application_core.Core.getStore().getters['messages/isExists'](id);
	    const isSticker = im_v2_application_core.Core.getStore().getters['messages/stickers/isStickerMessage'](id);
	    const isOwnMessage = this.isOwnMessage(id);
	    if (!isRealMessage || !isExists || !isOwnMessage || isSticker) {
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
	  }
	};

	exports.MessageManager = MessageManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Application));
//# sourceMappingURL=message.bundle.js.map
