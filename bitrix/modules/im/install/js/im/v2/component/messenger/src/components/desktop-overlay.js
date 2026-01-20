import { DesktopModeSelectionBanner } from 'im.v2.component.desktop.mode-selection-banner';
import { PromoId } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { DesktopApi } from 'im.v2.lib.desktop-api';
import { PromoManager } from 'im.v2.lib.promo';

import type { JsonObject } from 'main.core';

// @vue/component
export const DesktopOverlay = {
	name: 'DesktopOverlay',
	components: { DesktopModeSelectionBanner },
	data(): JsonObject
	{
		return {
			isBannerVisible: false,
		};
	},
	computed: {
		shouldShowBanner(): boolean
		{
			const promoManager = PromoManager.getInstance();
			const needToShow = promoManager.needToShow(PromoId.desktopModeSelection);

			return needToShow && DesktopApi.isChatWindow();
		},
	},
	created()
	{
		this.isBannerVisible = this.shouldShowBanner;

		if (this.isBannerVisible)
		{
			Analytics.getInstance().desktopMode.onBannerShow();
		}
	},
	methods: {
		onCloseBanner()
		{
			this.isBannerVisible = false;
		},
	},
	template: `
		<DesktopModeSelectionBanner v-if="isBannerVisible" @close="onCloseBanner" />
	`,
};
