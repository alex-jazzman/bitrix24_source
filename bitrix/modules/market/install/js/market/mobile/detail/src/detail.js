import { MarketMobileHelper } from 'market.mobile.utils';

import { AppData } from './components/app-data';
import { Description } from './components/description';
import { HeaderInfo } from './components/header-info';
import { MainInfo } from './components/main-info';
import { Gallery } from './components/gallery';
import { Rating } from './components/rating';
import { Reviews } from './components/reviews';

import './detail.css';

export const Detail = {
	components: {
		HeaderInfo,
		MainInfo,
		Gallery,
		Description,
		Rating,
		Reviews,
		AppData,
	},
	props: {
		params: {
			type: Object,
			default: () => ({}),
		},
		result: {
			type: Object,
			default: () => ({}),
		},
	},
	data(): Object
	{
		return {
			app: this.result?.APP || {},
		};
	},
	computed: {
		toolbarTitle(): string
		{
			return this.result?.TITLE || this.app?.NAME || '';
		},
	},
	mounted()
	{
		this.syncMobileUi();
	},
	methods: {
		syncMobileUi(): void
		{
			this.$emit('mobile-ui-update', {
				title: this.toolbarTitle,
				menu: this.prepareNativeMenuData(),
			});
		},

		prepareNativeMenuData(): Object
		{
			const app = MarketMobileHelper.cloneObject(this.app);
			const buttons = MarketMobileHelper.cloneObject(app.BUTTONS);
			const openAppUrl = MarketMobileHelper.normalizeString(app.BUTTON_OPEN_APP, '');
			const canUpdate = buttons.UPDATE === 'Y';

			return {
				isAvailable: true,
				shareUrl: this.prepareShareUrl(app),
				contactDeveloperUrl: MarketMobileHelper.normalizeString(app.CONTACT_DEVELOPER, ''),
				requestDemoUrl: MarketMobileHelper.normalizeString(app.REQUEST_DEMO, ''),
				partnerPageUrl: MarketMobileHelper.normalizeString(app.PARTNER_URL, ''),
				openAppUrl,
				canOpenApp: openAppUrl !== '',
				canUpdate,
				canDelete: buttons.DELETE === 'Y',
				installInfo: canUpdate ? this.prepareInstallInfo(app.INSTALL_INFO, app) : null,
			};
		},

		prepareShareUrl(app = {}): string
		{
			const appCode = MarketMobileHelper.resolveAppCode(app);
			if (appCode === '')
			{
				return '';
			}

			return MarketMobileHelper.buildAbsoluteUrl(`/market/detail/${encodeURIComponent(appCode)}/`);
		},

		prepareInstallInfo(installInfo = {}, app = {})
		{
			const preparedInstallInfo = MarketMobileHelper.cloneObject(installInfo);
			const code = MarketMobileHelper.normalizeString(preparedInstallInfo.CODE || app.CODE, '');
			if (code === '')
			{
				return null;
			}

			return {
				code,
				version: MarketMobileHelper.normalizeNonNegativeInt(
					preparedInstallInfo.VERSION || app.VERSION || app.VER,
					0,
				),
				checkHash: MarketMobileHelper.normalizeString(preparedInstallInfo.CHECK_HASH, ''),
				installHash: MarketMobileHelper.normalizeString(preparedInstallInfo.INSTALL_HASH, ''),
			};
		},
	},
	template: `
		<div class="market-mobile-detail-page">
			<HeaderInfo :app/>
			<MainInfo :app/>
			<Gallery :images="app.SLIDER_IMAGES"/>
			<Description :desc="app.SHORT_DESC"/>
			<Rating :reviews="app.REVIEWS"/>
			<Reviews :reviews="app.REVIEWS"/>
			<AppData :app/>
		</div>
	`,
};
