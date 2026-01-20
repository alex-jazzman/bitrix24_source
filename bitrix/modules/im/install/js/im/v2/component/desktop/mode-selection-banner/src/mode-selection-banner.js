import { PromoId } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { PromoManager } from 'im.v2.lib.promo';
import { DesktopApi } from 'im.v2.lib.desktop-api';

import { SelectButton } from './components/select-button';
import { ModeOptionList } from './components/mode-option-list';

import type { JsonObject } from 'main.core';

import './css/mode-selection-banner.css';

// @vue/component
export const DesktopModeSelectionBanner = {
	name: 'ModeSelectionBanner',
	components: { SelectButton, ModeOptionList },
	emits: ['close'],
	data(): JsonObject
	{
		return {
			isTwoWindowModeSelected: true,
		};
	},
	computed: {
		isTwoWindowMode(): boolean
		{
			return DesktopApi.isTwoWindowMode();
		},
	},
	created()
	{
		this.isTwoWindowModeSelected = this.isTwoWindowMode;
	},
	methods: {
		onTwoWindowClick()
		{
			this.isTwoWindowModeSelected = true;
		},
		onOneWindowClick()
		{
			this.isTwoWindowModeSelected = false;
		},
		onSelectionConfirm()
		{
			void PromoManager.getInstance().markAsWatched(PromoId.desktopModeSelection);

			if (this.isTwoWindowModeSelected)
			{
				Analytics.getInstance().desktopMode.onBannerTwoWindowEnable();
			}
			else
			{
				Analytics.getInstance().desktopMode.onBannerOneWindowEnable();
			}

			if (this.isTwoWindowModeSelected !== this.isTwoWindowMode)
			{
				DesktopApi.setTwoWindowMode(this.isTwoWindowModeSelected);
				DesktopApi.restart();

				return;
			}

			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-desktop-mode-selection-banner__container">
			<div class="bx-im-desktop-mode-selection-banner__content-container">
				<h1 class="bx-im-desktop-mode-selection-banner__title">{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE') }}</h1>
				<ModeOptionList 
					@twoWindowClick="onTwoWindowClick"
					@oneWindowClick='onOneWindowClick'
					:isTwoWindowModeSelected="isTwoWindowModeSelected"
				/>
				<SelectButton @click="onSelectionConfirm" />
			</div>
		</div>
	`,
};
