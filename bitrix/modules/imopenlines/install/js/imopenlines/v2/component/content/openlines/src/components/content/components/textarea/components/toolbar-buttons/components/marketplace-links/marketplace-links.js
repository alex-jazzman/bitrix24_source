import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { MarketplaceLinksPopup } from './marketplace-links-popup';

// @vue/component
export const MarketplaceLinks = {
	name: 'MarketplaceLinks',
	components: { BIcon, MarketplaceLinksPopup },
	data(): JsonObject
	{
		return {
			selectorElement: null,
			isPopupOpen: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	mounted()
	{
		this.selectorElement = this.$refs.marketplaceLinksButton;
	},
	methods: {
		togglePopup(): void
		{
			this.isPopupOpen = !this.isPopupOpen;
		},
		onPopupClose(): void
		{
			this.isPopupOpen = false;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span ref="marketplaceLinksButton">
			<BIcon
				:name="OutlineIcons.BROWSER"
				:class="{ '--active': isPopupOpen }"
				:title="loc('IMOL_CONTENT_TEXTAREA_MARKETPLACE')"
				class="bx-imol-textarea-icon"
				@click="togglePopup"
			/>
		</span>
		<MarketplaceLinksPopup
			v-if="isPopupOpen"
			:bindElement="selectorElement"
			@close="onPopupClose"
		/>
	`,
};
