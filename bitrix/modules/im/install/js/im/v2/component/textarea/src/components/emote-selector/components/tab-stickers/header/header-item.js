import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { StickerManager } from 'im.v2.lib.sticker';

import '../css/header-item.css';

import type { ImModelStickerPack } from 'im.v2.model';

// @vue/component
export const HeaderItem = {
	name: 'HeaderItem',
	components: { BIcon },
	props: {
		pack: {
			type: Object,
			required: true,
		},
		isActive: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		packItem(): ImModelStickerPack
		{
			return this.pack;
		},
		isRecentPack(): boolean
		{
			return StickerManager.isRecentPack(this.packItem);
		},
		packName(): string
		{
			return this.packItem.name;
		},
		packCover(): string
		{
			return this.$store.getters['stickers/getPackCover']({
				id: this.packItem.id,
				type: this.packItem.type,
			});
		},
	},
	template: `
		<button
			type="button"
			tabindex="-1"
			:title="packName"
			:aria-label="packName"
			:aria-current="isActive ? 'true' : null"
			:class="{'--active': this.isActive}"
			class="bx-im-stickers-header__item --focus-visible"
		>
			<BIcon
				v-if="isRecentPack"
				:name="OutlineIcons.CLOCK"
				:aria-hidden="true"
			/>
			<BIcon
				v-else-if="!packCover"
				:name="OutlineIcons.STICKER"
				:aria-hidden="true"
			/>
			<img v-else :src="packCover" alt="" loading="lazy" draggable="false" />
		</button>
	`,
};
