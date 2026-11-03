/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_feature, im_v2_lib_utils) {
	'use strict';

	const MessageManager = {
		isEditable(id) {
			return isEditableMessageType(id) && isExistingOwnMessage(id);
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
		isCallMessage(id) {
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](id);
			if (!message) {
				return false;
			}
			return message.componentId === im_v2_const.MessageComponent.callMessage;
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
	function messageHasError(message) {
		return Boolean(message.error || message.notDelivered);
	}
	function isEditableMessageType(id) {
		const isSticker = im_v2_application_core.Core.getStore().getters['stickers/messages/isSticker'](id);
		const isCheckIn = MessageManager.isCheckInMessage(id);
		const isCall = MessageManager.isCallMessage(id);
		const isBuilder = im_v2_application_core.Core.getStore().getters['messages/builder/hasBlocks'](id);
		const isForward = im_v2_application_core.Core.getStore().getters['messages/isForward'](id);
		const isContact = im_v2_application_core.Core.getStore().getters['messages/getById'](id)?.componentId === im_v2_const.MessageComponent.contactMessage;
		return !isSticker && !isCheckIn && !isCall && !isBuilder && !isForward && !isContact && isEditableVideoNote(id);
	}
	function isEditableVideoNote(id) {
		const isVideoNote = im_v2_application_core.Core.getStore().getters['messages/isVideoNote'](id);
		return !isVideoNote || im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVideoNoteCaptionAvailable);
	}
	function isExistingOwnMessage(id) {
		const isRealMessage = im_v2_application_core.Core.getStore().getters['messages/isRealMessage'](id);
		const isExists = im_v2_application_core.Core.getStore().getters['messages/isExists'](id);
		return isRealMessage && isExists && MessageManager.isOwnMessage(id);
	}

	exports.MessageManager = MessageManager;
	exports.messageHasError = messageHasError;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=message.bundle.js.map
