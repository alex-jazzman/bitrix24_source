import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

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
		<div class="bx-im-stickers-add-sticker-button__container" @click="onUpdatePackClick">
			<div class="bx-im-stickers-add-sticker-button__button">
				<BIcon
					:name="OutlineIcons.PLUS_L"
					:title="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT')"
				/>
			</div>
			<StickerPackForm v-if="showPackForm" :pack="pack" @close="onPackFormClose" />
		</div>
	`,
};
