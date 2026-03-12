import './sticker-item.css';

import type { ImModelSticker } from 'im.v2.model';

// @vue/component
export const StickerItem = {
	name: 'StickerItem',
	props: {
		sticker: {
			type: Object,
			required: true,
		},
	},
	computed: {
		stickerItem(): ImModelSticker
		{
			return this.sticker;
		},
	},
	template: `
		<div
			:data-sticker-id="stickerItem.id"
			:data-sticker-pack-id="stickerItem.packId"
			:data-sticker-pack-type="stickerItem.packType"
			class="bx-im-sticker-item__container"
		>
			<img :src="stickerItem.uri" alt="" loading="lazy" draggable="false" />
		</div>
	`,
};
