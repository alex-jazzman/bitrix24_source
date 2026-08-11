import { Extension } from 'main.core';
import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import './css/marketplace-links-popup.css';

const POPUP_ID = 'imol-marketplace-links-popup';
const POPUP_CLASSNAME = 'bx-imol-marketplace-links-popup__container';

const settings = Extension.getSettings('imopenlines.v2.component.content.openlines');
const BOTS_CATEGORY_URL = settings.get('marketplaceBotsUrl');
const APPS_CATEGORY_URL = settings.get('marketplaceAppsUrl');

type MarketplaceLinkItem = {
	title: string,
	url: string,
};

// @vue/component
export const MarketplaceLinksPopup = {
	name: 'MarketplaceLinksPopup',
	components: { MessengerPopup },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		POPUP_ID: () => POPUP_ID,
		items(): MarketplaceLinkItem[]
		{
			return [
				{
					title: this.loc('IMOL_CONTENT_TEXTAREA_MARKETPLACE_BOTS'),
					url: BOTS_CATEGORY_URL,
				},
				{
					title: this.loc('IMOL_CONTENT_TEXTAREA_MARKETPLACE_APPS'),
					url: APPS_CATEGORY_URL,
				},
			];
		},
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				offsetTop: -5,
				offsetLeft: 14,
				width: 260,
				overlay: false,
				autoHide: true,
				bindOptions: { position: 'top' },
				angle: { offset: 14, position: 'bottom' },
				animation: 'fading',
			};
		},
	},
	methods: {
		openLinkInSlider(item: MarketplaceLinkItem): void
		{
			BX.SidePanel.Instance.open(item.url);
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-marketplace-links-popup__list">
				<div
					v-for="item in items"
					:key="item.url"
					class="bx-imol-marketplace-links-popup__item"
					:title="item.title"
					@click="openLinkInSlider(item)"
				>
					{{ item.title }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
