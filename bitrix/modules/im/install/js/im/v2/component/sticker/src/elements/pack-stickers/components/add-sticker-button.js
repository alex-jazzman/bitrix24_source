import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import 'im.v2.css.classes';

import { StickerPackForm } from '../../sticker-pack-form/sticker-pack-form';

import './css/add-sticker-button.css';

import type { JsonObject } from 'main.core';

// @vue/component
export const AddStickerButton = {
	name: 'AddStickerButton',
	components: { BIcon, StickerPackForm },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		pack: {
			type: Object,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showPackForm: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	methods: {
		onUpdatePackClick()
		{
			this.disableAutoHide();
			this.showPackForm = true;
		},
		onPackFormClose()
		{
			this.enableAutoHide();
			this.showPackForm = false;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div role="gridcell" class="bx-im-stickers-add-sticker-button__cell">
			<button
				type="button"
				class="bx-im-stickers-add-sticker-button__container --focus-visible"
				tabindex="-1"
				aria-haspopup="dialog"
				:aria-label="loc('IM_STICKER_PACK_ADD_STICKER_ARIA')"
				data-testid="im-sticker-add-sticker-btn"
				@click="onUpdatePackClick"
				@keydown.enter.prevent="onUpdatePackClick"
				@keydown.space.prevent="onUpdatePackClick"
			>
				<span class="bx-im-stickers-add-sticker-button__button">
					<BIcon :name="OutlineIcons.PLUS_L" :aria-hidden="true" />
				</span>
			</button>
		</div>
		<StickerPackForm v-if="showPackForm" :pack="pack" @close="onPackFormClose" />
	`,
};
