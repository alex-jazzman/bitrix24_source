import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { IconButton } from 'im.v2.component.elements.icon-button';
import { StickerPackForm } from 'im.v2.component.sticker';
import { Analytics } from 'im.v2.lib.analytics';

import '../css/header/header-add-button.css';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 32;

// @vue/component
export const HeaderAddButton = {
	name: 'HeaderAddButton',
	components: { IconButton, StickerPackForm },
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
		ICON_SIZE: () => ICON_SIZE,
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
		<div class="bx-im-stickers-header-add-button__container" role="presentation">
			<IconButton
				:iconName="OutlineIcons.PLUS_S"
				:label="loc('IM_TEXTAREA_STICKER_SELECTOR_CREATE_PACK_ARIA')"
				:iconSize="ICON_SIZE"
				aria-haspopup="dialog"
				data-testid="im-textarea-sticker-pack-create-btn"
				@click="onAddClick"
			/>
			<StickerPackForm v-if="showPackForm" @close="onPackFormClose" />
		</div>
	`,
};
