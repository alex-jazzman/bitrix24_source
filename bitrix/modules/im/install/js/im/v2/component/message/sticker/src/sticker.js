import { Type } from 'main.core';

import { BaseMessage } from 'im.v2.component.message.base';
import { MessageHeader, MessageStatus, ReactionList, Reply } from 'im.v2.component.message.elements';

import { PackPopup } from './components/pack-popup/pack-popup';
import { StickerFallback } from './components/sticker-fallback';

import './css/sticker.css';

import type { ImModelMessage, ImModelSticker } from 'im.v2.model';
import type { JsonObject } from 'main.core';

// @vue/component
export const StickerMessage = {
	name: 'StickerMessage',
	components: { BaseMessage, MessageStatus, ReactionList, MessageHeader, StickerFallback, PackPopup, Reply },
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
	data(): JsonObject
	{
		return {
			showPackPopup: false,
		};
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		hasReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		isForward(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
		sticker(): ?ImModelSticker
		{
			const sticker = this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);

			return this.$store.getters['stickers/get'](sticker);
		},
		imageUri(): ?string
		{
			return this.sticker?.uri;
		},
		hasStickerUri(): boolean
		{
			return Type.isStringFilled(this.imageUri);
		},
		imageHeightStyles(): {height?: string}
		{
			if (!this.sticker.width || !this.sticker.height)
			{
				return {};
			}

			const STICKER_MAX_SIZE = 166;
			const currentRatio = this.sticker.width / this.sticker.height;
			const reducedHeight = Math.round(STICKER_MAX_SIZE / currentRatio);
			const finalHeight = Math.min(reducedHeight, STICKER_MAX_SIZE);

			return {
				height: `${finalHeight}px`,
			};
		},
	},
	methods: {
		onStickerClick()
		{
			if (!this.hasStickerUri)
			{
				return;
			}

			this.showPackPopup = true;
		},
		onClosePopup()
		{
			this.showPackPopup = false;
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withBackground="false"
			:afterMessageWidthLimit="false"
		>
			<template #before-message>
				<div class="bx-im-message-sticker__header-container">
					<MessageHeader :item="item" :isOverlay="true" />
				</div>
			</template>
			<Reply
				v-if="hasReply"
				class="bx-im-message-sticker__reply"
				:dialogId="dialogId"
				:replyId="message.replyId"
				:isForward="isForward"
			/>
			<div class="bx-im-message-sticker__container">
				<div
					v-if="hasStickerUri"
					class="bx-im-message-sticker__image"
					:style="imageHeightStyles"
					@click="onStickerClick"
				>
					<img :src="imageUri" alt="" loading="lazy"/>
				</div>
				<StickerFallback v-else />
				<div class="bx-im-message-sticker__message-status-container">
					<MessageStatus :item="message" :isOverlay="true" />
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
			<PackPopup
				v-if="showPackPopup"
				:dialogId="dialogId"
				:packId="sticker.packId"
				:packType="sticker.packType"
				@close="onClosePopup"
			/>
		</BaseMessage>
	`,
};
