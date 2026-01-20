import { SendingService } from 'im.v2.provider.service.sending';
import { StickerManager } from 'im.v2.lib.sticker-manager';

import '../css/sticker-item.css';

import type { ImModelSticker } from 'im.v2.model';

// @vue/component
export const StickerItem = {
	name: 'StickerItem',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		stickerKey: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		sticker(): ImModelSticker
		{
			return this.$store.getters['messages/stickers/getStickerByKey'](this.stickerKey);
		},
	},
	methods: {
		getSendingService(): SendingService
		{
			if (!this.sendingService)
			{
				this.sendingService = SendingService.getInstance();
			}

			return this.sendingService;
		},
		addRecentStickerToStore(): void
		{
			void this.$store.dispatch('messages/stickers/updateRecentStickers', this.stickerKey);
		},
		sendSticker(): void
		{
			const stickerParams = (new StickerManager()).parseStickerKey(this.stickerKey);
			void this.getSendingService().sendMessageWithSticker({
				dialogId: this.dialogId,
				stickerParams,
			});
		},
		onStickerClick(): void
		{
			this.addRecentStickerToStore();
			this.sendSticker();
			this.$emit('close');
		},
	},
	template: `
		<div class="bx-im-sticker-item" @click="onStickerClick">
			<img :src="sticker.uri" alt="" loading="lazy"/>
		</div>
	`,
};
