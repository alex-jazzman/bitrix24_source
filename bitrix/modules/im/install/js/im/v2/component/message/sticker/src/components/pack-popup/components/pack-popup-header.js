import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Core } from 'im.v2.application.core';
import { Shimmer } from 'im.v2.component.elements.loader';
import { StickerPackType } from 'im.v2.const';

import type { ImModelStickerPack } from 'im.v2.model';

const SHIMMER_WIDTH = 178;
const SHIMMER_HEIGHT = 12;

// @vue/component
export const PackPopupHeader = {
	name: 'PackPopupHeader',
	components: { BIcon, Shimmer },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		isLoading: {
			type: Boolean,
			required: true,
		},
		packId: {
			type: Number,
			required: true,
		},
		packType: {
			type: String,
			required: true,
		},
	},
	emits: ['close', 'showPackMenu'],
	computed: {
		SHIMMER_WIDTH: () => SHIMMER_WIDTH,
		SHIMMER_HEIGHT: () => SHIMMER_HEIGHT,
		OutlineIcons: () => OutlineIcons,
		pack(): ?ImModelStickerPack
		{
			return this.$store.getters['stickers/packs/getByIdentifier']({ id: this.packId, type: this.packType });
		},
		isPackOwner(): boolean
		{
			return this.pack.authorId === Core.getUserId();
		},
		canShowContextMenu(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			if (!this.isPackOwner)
			{
				return false;
			}

			return this.pack.type === StickerPackType.custom;
		},
	},
	template: `
		<div class="bx-im-stickers-pack-popup__header">
			<Shimmer v-if="isLoading" :width="SHIMMER_WIDTH" :height="SHIMMER_HEIGHT"/>
			<div v-else class="bx-im-stickers-pack-popup__header-title --ellipsis">{{ pack.name }}</div>
			<div class="bx-im-stickers-pack-popup__header-controls">
				<BIcon
					v-if="canShowContextMenu"
					:name="OutlineIcons.MORE_M"
					:hoverable="true"
					class="bx-im-stickers-pack-popup__control-icon"
					@click="$emit('showPackMenu', $event)"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_M"
					:hoverable="true"
					class="bx-im-stickers-pack-popup__control-icon"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`,
};
