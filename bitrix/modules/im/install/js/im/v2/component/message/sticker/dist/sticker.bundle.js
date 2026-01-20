/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_component_message_base,im_v2_component_message_elements) {
	'use strict';

	// @vue/component
	const StickerMessage = {
	  name: 'StickerMessage',
	  components: {
	    BaseMessage: im_v2_component_message_base.BaseMessage,
	    MessageStatus: im_v2_component_message_elements.MessageStatus,
	    ReactionList: im_v2_component_message_elements.ReactionList,
	    MessageHeader: im_v2_component_message_elements.MessageHeader
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    message() {
	      return this.item;
	    },
	    stickerData() {
	      return this.$store.getters['messages/stickers/getStickerByMessageId'](this.message.id);
	    },
	    imageUri() {
	      var _this$stickerData;
	      return ((_this$stickerData = this.stickerData) == null ? void 0 : _this$stickerData.uri) || '';
	    },
	    isForwarded() {
	      return this.$store.getters['messages/isForward'](this.message.id);
	    }
	  },
	  template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withBackground="false"
			:afterMessageWidthLimit="false"
		>
			<div class="bx-im-message-sticker__container">
				<div class="bx-im-message-sticker__content-container">
					<MessageHeader v-if="isForwarded" :item="item" :isOverlay="true" />
					<div class="bx-im-message-sticker__image">
						<img :src="imageUri" alt="" loading="lazy" />
					</div>
					<div class="bx-im-message-sticker__message-status-container">
						<MessageStatus :item="message" :isOverlay="true" />
					</div>
				</div>
			</div>
			<template #after-message>
				<div class="bx-im-message-sticker__reactions-container">
					<ReactionList 
						:messageId="message.id"
						:contextDialogId="dialogId"
						class="bx-im-message-sticker__reactions"
					/>
				</div>
			</template>
		</BaseMessage>
	`
	};

	exports.StickerMessage = StickerMessage;

}((this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}),BX.Messenger.v2.Component.Message,BX.Messenger.v2.Component.Message));
//# sourceMappingURL=sticker.bundle.js.map
