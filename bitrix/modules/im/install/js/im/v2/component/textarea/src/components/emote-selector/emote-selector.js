import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Color } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import { EmotePopup } from './components/emote-popup';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// @vue/component
export const EmoteSelector = {
	name: 'EmoteSelector',
	components: { BIcon, EmotePopup },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showPopup: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		iconColor(): string
		{
			return Color.gray40;
		},
	},
	methods: {
		openSelector(): void
		{
			this.showPopup = true;
			Analytics.getInstance().stickers.onOpenEmoteSelector(this.dialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div ref="stickerSelectorIcon" class="bx-im-textarea__icon-container">
			<BIcon
				:name="OutlineIcons.SMILE"
				:title="loc('IM_TEXTAREA_ICON_EMOTE')"
				:size="ICON_SIZE"
				:color="iconColor"
				class="bx-im-textarea__icon"
				@click="openSelector"
			/>
		</div>
		<EmotePopup
			v-if="showPopup"
			:bindElement="$refs.stickerSelectorIcon"
			:dialogId="dialogId"
			@close="showPopup = false"
		/>
	`,
};
