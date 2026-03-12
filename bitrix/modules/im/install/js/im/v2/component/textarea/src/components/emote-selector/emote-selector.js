import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Color, PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { PulseAnimation } from 'im.v2.component.elements.pulse-animation';
import { Analytics } from 'im.v2.lib.analytics';

import { EmotePopup } from './components/emote-popup';
import { StickersPromoPopup } from './stickers-promo-popup';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// @vue/component
export const EmoteSelector = {
	name: 'EmoteSelector',
	components: { BIcon, EmotePopup, PulseAnimation, StickersPromoPopup },
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
			wasSelectorOpened: false,
			selectorElement: null,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		needToShowPromo(): boolean
		{
			return PromoManager.getInstance().needToShow(PromoId.stickersAvailable);
		},
		needToShowPulse(): boolean
		{
			return this.needToShowPromo && !this.wasSelectorOpened;
		},
		iconColor(): string
		{
			if (this.needToShowPulse)
			{
				return Color.accentBlue;
			}

			return Color.gray40;
		},
	},
	mounted()
	{
		if (!this.needToShowPromo)
		{
			return;
		}

		this.selectorElement = this.$refs.stickerSelectorIcon;
	},
	methods: {
		openSelector(): void
		{
			this.showPopup = true;
			this.wasSelectorOpened = true;
			Analytics.getInstance().stickers.onOpenEmoteSelector(this.dialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div ref="stickerSelectorIcon" class="bx-im-textarea__icon-container">
			<PulseAnimation :showPulse="needToShowPulse">
				<BIcon
					:name="OutlineIcons.SMILE"
					:title="loc('IM_TEXTAREA_ICON_EMOTE')"
					:size="ICON_SIZE"
					:color="iconColor"
					class="bx-im-textarea__icon"
					@click="openSelector"
				/>
			</PulseAnimation>
		</div>
		<EmotePopup
			v-if="showPopup"
			:bindElement="$refs.stickerSelectorIcon"
			:dialogId="dialogId"
			@close="showPopup = false"
		/>
		<StickersPromoPopup v-if="selectorElement" :dialogId="dialogId" :bindElement="selectorElement" />
	`,
};
