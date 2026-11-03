import { Text } from 'main.core';
import { Popup } from 'main.popup';
import { markRaw } from 'ui.vue3';
import { FocusKeys } from 'ui.a11y';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType, LocalStorageKey } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Analytics } from 'im.v2.lib.analytics';
import { createListFocusZone } from 'im.v2.lib.a11y';

import { activateWhenVisible } from '../helpers/deferred-activation';
import { TabEmoji } from './tab-emoji/tab-emoji';
import { TabStickers } from './tab-stickers/tab-stickers';

import '../css/emote-popup.css';

import type { PopupOptions } from 'main.popup';

const TabType = {
	emoji: 'emoji',
	stickers: 'stickers',
};

// The two switcher chips share their container: horizontal arrows rove focus between them, selection
// stays on Enter/Space (deferred activation, matching the sticker pack toolbar below).
const TAB_SELECTOR = '[role="tab"]';

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
			currentTab: this.getInitialTab(),
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
				// main.popup renders the shell as role="dialog" and puts this on it as its aria-label, so
				// the dialog opened from the trigger has an accessible name.
				ariaLabel: this.loc('IM_TEXTAREA_EMOTE_POPUP_ARIA'),
				// Initial focus inside the popup is ours: the keyboard path lands on a grid cell, and a
				// mouse click has to leave the caret in the field, where the trap would park focus on the
				// dialog shell. Conditional: a non-empty option would create a trap even where the setting
				// keeps it off.
				focusTrap: Popup.shouldUseFocusTrapByDefault() ? { initialFocus: false } : undefined,
			};
		},
	},
	created()
	{
		// A per-instance prefix keeps the tab/panel ids unique if two popups ever coexist.
		this.tabIdPrefix = `bx-im-emote-tabs-${Text.getRandom(8)}`;
		// The zone holds DOM nodes and must stay out of reactive state.
		this.tabSwitcherFocusZone = null;
		this.cancelTabSwitcherActivation = null;
	},
	mounted()
	{
		this.initTabSwitcherFocusZone();
	},
	beforeUnmount()
	{
		this.destroyTabSwitcherFocusZone();
	},
	methods: {
		initTabSwitcherFocusZone(): void
		{
			const container = this.$refs.tabSwitcher;
			if (!container)
			{
				return;
			}

			this.tabSwitcherFocusZone = markRaw(createListFocusZone(container, {
				bindKeys: FocusKeys.ArrowHorizontal,
				focusableElementFilter: (element: HTMLElement): boolean => element.matches(TAB_SELECTOR),
			}));
			// The chips mount while the popup is still fading in; the zone takes over once it is visible.
			this.cancelTabSwitcherActivation = activateWhenVisible(this.tabSwitcherFocusZone, container);
		},
		destroyTabSwitcherFocusZone(): void
		{
			this.cancelTabSwitcherActivation?.();
			this.cancelTabSwitcherActivation = null;

			this.tabSwitcherFocusZone?.deactivate();
			this.tabSwitcherFocusZone = null;
		},
		tabId(type: $Values<typeof TabType>): string
		{
			return `${this.tabIdPrefix}-tab-${type}`;
		},
		panelId(type: $Values<typeof TabType>): string
		{
			return `${this.tabIdPrefix}-panel-${type}`;
		},
		// Only the selected panel is in the DOM (`v-if`), so the other tab controls nothing: no attribute
		// at all rather than one pointing at an id that does not resolve.
		controlledPanelId(type: $Values<typeof TabType>): string | null
		{
			return this.isTabSelected(type) ? this.panelId(type) : null;
		},
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
				Analytics.getInstance().stickers.onOpenStickerTab(this.dialogId);
			}
		},
		getChipDesign(type: $Values<typeof TabType>): string
		{
			return this.currentTab === type ? ChipDesign.Filled : ChipDesign.Outline;
		},
		isTabSelected(type: $Values<typeof TabType>): boolean
		{
			return this.currentTab === type;
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.emoteSelector"
			@close="$emit('close')"
		>
			<div class="bx-im-emote-popup__container" data-testid="im-textarea-emote-popup">
				<TabEmoji
					v-if="currentTab === TabType.emoji"
					:dialogId="dialogId"
					role="tabpanel"
					:id="panelId(TabType.emoji)"
					:aria-labelledby="tabId(TabType.emoji)"
					data-testid="im-textarea-emote-panel-emoji"
				/>
				<TabStickers
					v-if="currentTab === TabType.stickers"
					:dialogId="dialogId"
					role="tabpanel"
					:id="panelId(TabType.stickers)"
					:aria-labelledby="tabId(TabType.stickers)"
					data-testid="im-textarea-emote-panel-stickers"
					@close="$emit('close')"
				/>
				<div
					class="bx-im-emote-popup__buttons-container"
					role="tablist"
					:aria-label="loc('IM_TEXTAREA_EMOTE_TABS_ARIA')"
					ref="tabSwitcher"
					data-testid="im-textarea-emote-tabs"
				>
					<Chip
						role="tab"
						:id="tabId(TabType.emoji)"
						:aria-controls="controlledPanelId(TabType.emoji)"
						:aria-selected="isTabSelected(TabType.emoji)"
						:size="ChipSize.Sm"
						:design="getChipDesign(TabType.emoji)"
						:text="loc('IM_TEXTAREA_STICKER_SELECTOR_EMOJI_TAB')"
						:rounded="true"
						data-testid="im-textarea-emote-tab-emoji"
						@click="selectTab(TabType.emoji)"
						@keydown.space.prevent="selectTab(TabType.emoji)"
					/>
					<Chip
						role="tab"
						:id="tabId(TabType.stickers)"
						:aria-controls="controlledPanelId(TabType.stickers)"
						:aria-selected="isTabSelected(TabType.stickers)"
						:size="ChipSize.Sm"
						:design="getChipDesign(TabType.stickers)"
						:text="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKER_TAB')"
						:rounded="true"
						data-testid="im-textarea-emote-tab-stickers"
						@click="selectTab(TabType.stickers)"
						@keydown.space.prevent="selectTab(TabType.stickers)"
					/>
				</div>
			</div>
		</MessengerPopup>
	`,
};
