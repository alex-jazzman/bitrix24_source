import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { MarketManager } from 'im.v2.lib.market';
import { type ImModelMarketApplication } from 'im.v2.model';

import { MarketShowMorePopupContent } from './market-show-more-popup-content';

import '../../css/market-apps-panel/market-show-more-popup.css';

// @vue/component
export const MarketShowMorePopup = {
	name: 'MarketShowMorePopup',
	components: { MessengerPopup, MarketShowMorePopupContent },
	props:
	{
		marketApps: {
			type: Array,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			showPopup: false,
		};
	},
	computed:
	{
		// an application from the collapsed list is anchored to the show more button
		openedApp(): ?ImModelMarketApplication
		{
			const openedAppId = this.$store.getters['market/getOpenedAppId'](this.dialogId);

			return this.marketApps.find((app) => app.id === openedAppId) ?? null;
		},
		popupConfig(): PopupOptions
		{
			return {
				titleBar: this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MARKET_OTHER_APPS'),
				closeIcon: true,
				width: 302,
				height: 422,
				bindElement: this.$refs['textarea-show-more-market-apps'],
				bindOptions: {
					position: 'top',
				},
				offsetTop: 0,
				offsetLeft: 0,
				padding: 0,
				contentPadding: 0,
				contentBackground: '#fff',
				className: 'bx-im-market-show-more-popup__scope',
			};
		},
		showMoreButtonText(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MARKET_APPS_SHOW_MORE_BUTTON')
				.replace('#NUMBER#', this.marketApps.length);
		},
	},
	methods:
	{
		onAppClick(app: ImModelMarketApplication)
		{
			this.showPopup = false;

			if (app.id === this.openedApp?.id)
			{
				MarketManager.getInstance().closePlacement(this.dialogId, app.id);

				return;
			}

			this.showPlacement(app);
		},
		showPlacement(app: ImModelMarketApplication)
		{
			MarketManager.getInstance().showPlacement({
				dialogId: this.dialogId,
				appId: app.id,
				bindElement: this.$refs['textarea-show-more-market-apps'],
				width: app.options.width,
				height: app.options.height,
			});
		},
	},
	template: `
		<div
			@click="showPopup = true"
			class="bx-im-market-apps-panel__more-items-button"
			:class="{'--active': showPopup, '--opened': openedApp !== null}"
			ref="textarea-show-more-market-apps"
		>
			{{ showMoreButtonText }}
		</div>
		<MessengerPopup
			v-if="showPopup"
			:config="popupConfig"
			@close="showPopup = false"
			id="im-market-apps-more-popup"
		>
			<MarketShowMorePopupContent
				:marketApps="marketApps"
				:dialogId="dialogId"
				@appClick="onAppClick"
			/>
		</MessengerPopup>
	`,
};
