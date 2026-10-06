import { Headline, Text } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { MarketMobileHelper } from 'market.mobile.utils';

export const HeaderInfo = {
	components: {
		Text,
		Headline,
		UiButton,
	},
	props: {
		app: {
			type: Object,
		},
	},
	data(): Object
	{
		return {
			buttonSizeSmall: ButtonSize.SMALL,
			buttonStyleFilled: AirButtonStyle.FILLED,
		};
	},
	computed: {
		actionMode()
		{
			const buttons = this.app?.BUTTONS ?? {};

			if (buttons.UPDATE === 'Y')
			{
				return 'update';
			}

			if (buttons.INSTALL === 'Y')
			{
				return 'install';
			}

			if (buttons.NO_ACCESS_INSTALL === 'Y')
			{
				return 'noAccessInstall';
			}

			if (MarketMobileHelper.normalizeString(this.app?.BUTTON_OPEN_APP, '') !== '')
			{
				return 'open';
			}

			return 'none';
		},
		buttonText()
		{
			if (this.actionMode === 'update')
			{
				return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_UPDATE');
			}

			if (this.actionMode === 'install' || this.actionMode === 'noAccessInstall')
			{
				return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_INSTALL');
			}

			return this.$Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_OPEN');
		},
		isButtonDisabled()
		{
			return this.actionMode === 'none' || this.actionMode === 'noAccessInstall';
		},
	},
	methods: {
		buttonClick()
		{
			if (this.actionMode === 'install' || this.actionMode === 'update')
			{
				MarketMobileHelper.openAppInstall(this.app, {
					from: 'detail',
					title: this.app?.NAME ?? '',
				});

				return;
			}

			if (this.actionMode === 'open')
			{
				MarketMobileHelper.openApp(this.app?.BUTTON_OPEN_APP ?? '', {
					title: this.app?.NAME ?? '',
				});
			}
		},
	},
	template: `
		<div class="market-mobile-detail-page__header">
			<div class="market-mobile-detail-page__header-icon">
				<img :src="app.ICON" class="market-mobile-detail-page__header-img">
			</div>
			<div class="market-mobile-detail-page__header-info">
				<Headline size='sm'>
					{{ app.NAME }}
				</Headline>
				<Text
					v-if="app.PARTNER_NAME"
					tag="div"
					size="xs"
					className="market-mobile-detail-page__subtitle"
				>
					{{ app.PARTNER_NAME }}
				</Text>
				<div v-if="actionMode !== 'none'" class="market-mobile-detail-page__button">
					<UiButton
						:text="buttonText"
						:size="buttonSizeSmall"
						:style="buttonStyleFilled"
						:disabled="isButtonDisabled"
						@click="buttonClick"
					/>
				</div>
			</div>
		</div>
	`,
};
