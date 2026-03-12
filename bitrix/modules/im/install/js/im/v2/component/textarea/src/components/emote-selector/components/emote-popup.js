import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType, PromoId, LocalStorageKey } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { PulseAnimation } from 'im.v2.component.elements.pulse-animation';
import { PromoManager } from 'im.v2.lib.promo';
import { Analytics } from 'im.v2.lib.analytics';

import { TabEmoji } from './tab-emoji/tab-emoji';
import { TabStickers } from './tab-stickers/tab-stickers';

import '../css/emote-popup.css';

import type { PopupOptions } from 'main.popup';

const TabType = {
	emoji: 'emoji',
	stickers: 'stickers',
};

// @vue/component
export const EmotePopup = {
	name: 'EmotePopup',
	components: { MessengerPopup, TabEmoji, TabStickers, Chip, PulseAnimation },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): { currentTab: string }
	{
		return {
			currentTab: this.getInitialTab(),
			wasStickerTabOpened: false,
		};
	},
	computed: {
		TabType: () => TabType,
		PopupType: () => PopupType,
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		popupConfig(): PopupOptions
		{
			return {
				width: 365,
				bindElement: this.bindElement,
				bindOptions: {
					position: 'top',
				},
				offsetTop: 25,
				offsetLeft: -230,
				padding: 0,
				contentBorderRadius: '18px',
				background: 'transparent',
			};
		},
		needToShowPromo(): boolean
		{
			return PromoManager.getInstance().needToShow(PromoId.stickersAvailable);
		},
		needToShowPulse(): boolean
		{
			return this.needToShowPromo && !this.wasStickerTabOpened;
		},
	},
	created()
	{
		if (this.needToShowPromo)
		{
			void PromoManager.getInstance().markAsWatched(PromoId.stickersAvailable);
		}
	},
	methods: {
		getInitialTab(): string
		{
			return LocalStorageManager.getInstance().get(LocalStorageKey.emotePopupTab, TabType.emoji);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		selectTab(type: $Values<typeof TabType>): void
		{
			this.currentTab = type;
			LocalStorageManager.getInstance().set(LocalStorageKey.emotePopupTab, type);

			if (type === TabType.stickers)
			{
				this.wasStickerTabOpened = true;
				Analytics.getInstance().stickers.onOpenStickerTab(this.dialogId);
			}
		},
		getChipDesign(type: $Values<typeof TabType>): string
		{
			return this.currentTab === type ? ChipDesign.Filled : ChipDesign.Outline;
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.emoteSelector"
			@close="$emit('close')"
		>
			<div class="bx-im-emote-popup__container">
				<TabEmoji 
					v-if="currentTab === TabType.emoji" 
					:dialogId="dialogId" 
				/>
				<TabStickers 
					v-if="currentTab === TabType.stickers"
					:dialogId="dialogId"
					@close="$emit('close')"
				/>
				<div class="bx-im-emote-popup__buttons-container">
					<Chip
						:size="ChipSize.Sm"
						:design="getChipDesign(TabType.emoji)"
						:text="loc('IM_TEXTAREA_STICKER_SELECTOR_EMOJI_TAB')"
						:rounded="true"
						@click="selectTab(TabType.emoji)"
					/>
					<PulseAnimation
						:showPulse="needToShowPulse"
						:innerSize="65"
						:outerSize="113"
					>
						<Chip
							:size="ChipSize.Sm"
							:design="getChipDesign(TabType.stickers)"
							:text="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKER_TAB')"
							:rounded="true"
							@click="selectTab(TabType.stickers)"
						/>
					</PulseAnimation>
				</div>
			</div>
		</MessengerPopup>
	`,
};
