import { Loc } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';

import { TabEmoji } from './tab-emoji/tab-emoji';
import { TabStickers } from './tab-stickers/tab-stickers';

import '../css/emote-popup.css';

import type { PopupOptions } from 'main.popup';

const TabType = {
	emoji: 'emoji',
	stickers: 'stickers',
};

const TabList: Tab[] = [
	{
		type: TabType.emoji,
		title: Loc.getMessage('IM_TEXTAREA_STICKER_SELECTOR_EMOJI_TAB'),
	},
	{
		type: TabType.stickers,
		title: Loc.getMessage('IM_TEXTAREA_STICKER_SELECTOR_STICKER_TAB'),
	},
];

type Tab = {
	title: string,
	type: $Values<typeof TabType>;
}

// @vue/component
export const EmotePopup = {
	name: 'EmotePopup',
	components: { MessengerPopup, TabEmoji, TabStickers, Chip },
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
			currentTab: TabType.stickers,
		};
	},
	computed: {
		TabType: () => TabType,
		TabList: () => TabList,
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
				offsetLeft: -110,
				padding: 0,
				contentBorderRadius: '18px',
			};
		},
	},
	methods: {
		selectTab(type: $Values<typeof TabType>): void
		{
			this.currentTab = type;
		},
		chipDesign(type: $Values<typeof TabType>): string
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
				<TabEmoji v-show="currentTab === TabType.emoji" :dialogId="dialogId" />
				<TabStickers v-show="currentTab === TabType.stickers" :dialogId="dialogId" @close="$emit('close')" />
				<div class="bx-im-emote-popup__tabs-controls">
					<Chip
						v-for="tab in TabList"
						:key="tab.type"
						:size="ChipSize.Sm"
						:design="chipDesign(tab.type)"
						:text="tab.title"
						:rounded="true"
						@click="selectTab(tab.type)"
					/>
				</div>
			</div>
		</MessengerPopup>
	`,
};
