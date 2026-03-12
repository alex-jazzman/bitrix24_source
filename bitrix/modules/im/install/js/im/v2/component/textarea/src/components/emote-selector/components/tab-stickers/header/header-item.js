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
		<div 
			:title="packName"
			:class="{'--active': this.isActive}" 
			class="bx-im-stickers-header__item" 
		>
			<BIcon
				v-if="isRecentPack"
				:name="OutlineIcons.CLOCK"
			/>
			<BIcon
				v-else-if="!packCover"
				:name="OutlineIcons.STICKER"
			/>
			<img v-else :src="packCover" alt="" loading="lazy" draggable="false" />
		</div>
	`,
};
