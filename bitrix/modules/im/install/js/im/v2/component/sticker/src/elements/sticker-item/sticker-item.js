import 'im.v2.css.classes';

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
		// The sticker itself carries no text, so the name comes from the surface around it.
		label: {
			type: String,
			default: '',
		},
	},
	computed: {
		stickerItem(): ImModelSticker
		{
			return this.sticker;
		},
		// A label comes only from the emote popup grid, where the item is a gridcell wrapping the button
		// its roving focus lands on. Without a label there is no grid around it - the pack popup of a
		// sticker message - and the item keeps its plain markup.
		isGridCell(): boolean
		{
			return this.label !== '';
		},
	},
	template: `
		<div
			v-if="isGridCell"
			:data-sticker-id="stickerItem.id"
			:data-sticker-pack-id="stickerItem.packId"
			:data-sticker-pack-type="stickerItem.packType"
			role="gridcell"
			class="bx-im-sticker-item__container"
			data-testid="im-sticker-item"
		>
			<button
				type="button"
				class="bx-im-sticker-item__button --focus-visible"
				tabindex="-1"
				:aria-label="label"
				data-testid="im-sticker-item-btn"
			>
				<img :src="stickerItem.uri" alt="" loading="lazy" draggable="false" />
			</button>
		</div>
		<div
			v-else
			:data-sticker-id="stickerItem.id"
			:data-sticker-pack-id="stickerItem.packId"
			:data-sticker-pack-type="stickerItem.packType"
			class="bx-im-sticker-item__container --focus-visible"
			data-testid="im-sticker-item"
		>
			<img :src="stickerItem.uri" alt="" loading="lazy" draggable="false" />
		</div>
	`,
};
