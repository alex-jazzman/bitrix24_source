import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { StickerPackForm } from 'im.v2.component.sticker';
import { Analytics } from 'im.v2.lib.analytics';

import '../css/header/header-add-button.css';

import type { JsonObject } from 'main.core';

// @vue/component
export const HeaderAddButton = {
	name: 'HeaderAddButton',
	components: { BIcon, StickerPackForm },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		dialogId: {
			type: String,
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
		onAddClick()
		{
			this.disableAutoHide();
			this.showPackForm = true;
			Analytics.getInstance().stickers.onShowCreateForm(this.dialogId);
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
		<div
			class="bx-im-stickers-header-add-button__container"
			@click="onAddClick"
		>
			<BIcon
				:name="OutlineIcons.PLUS_S"
				:title="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT')"
			/>
			<StickerPackForm v-if="showPackForm" @close="onPackFormClose" />
		</div>
	`,
};
