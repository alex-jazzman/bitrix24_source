import { BaseMessage } from 'im.v2.component.message.base';
import { MessageStatus, MessageHeader, ReactionList } from 'im.v2.component.message.elements';

import './css/sticker.css';

import type { ImModelMessage, ImModelSticker } from 'im.v2.model';

// @vue/component
export const StickerMessage = {
	name: 'StickerMessage',
	components: { BaseMessage, MessageStatus, ReactionList, MessageHeader },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		stickerData(): ?ImModelSticker
		{
			return this.$store.getters['messages/stickers/getStickerByMessageId'](this.message.id);
		},
		imageUri(): string
		{
			return this.stickerData?.uri || '';
		},
		isForwarded(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
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
	`,
};
