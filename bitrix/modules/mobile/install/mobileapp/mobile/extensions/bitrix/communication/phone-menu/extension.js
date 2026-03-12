/**
 * @module communication/phone-menu
 */
jn.define('communication/phone-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { copyToClipboard } = require('utils/copy');
	const { getFormattedNumber } = require('utils/phone');
	const { stringify } = require('utils/string');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { FeatureBanner } = require('layout/ui/feature-banner');
	const { Icon } = require('assets/icons');

	const pathToExtension = `${currentDomain}/bitrix/mobileapp/mobile/extensions/bitrix/communication/phone-menu/`;
	const imagePath = `${pathToExtension}images/banner.png`;

	let menu = null;

	/**
	 * @public
	 * @function openPhoneMenu
	 * @param {object} params
	 * @param {string} params.number
	 * @param {boolean} params.canUseTelephony
	 * @param {?object} params.params
	 * @param {PageManager} [params.layoutWidget]
	 * @param {boolean} [params.extraParams]
	 */
	function openPhoneMenu(params)
	{
		const {
			isNumberHidden = false,
		} = params;

		params = {
			...params,
			number: stringify(params.number).trim(),
		};

		if (params.number === '')
		{
			return;
		}

		menu = new ContextMenu({
			actions: getMenuActions(params),
			params: {
				showActionLoader: false,
				showCancelButton: true,
				title: isNumberHidden
					? Loc.getMessage('PHONE_HIDDEN')
					: Loc.getMessage('PHONE_CALL_TO_MSGVER_1', { '#PHONE#': getFormattedNumber(params.number) }),
			},
		});

		void menu.show(params.layoutWidget || PageManager);
	}

	function getMenuActions(params)
	{
		const { number, canUseTelephony, isNumberHidden, analyticsSection, extraParams = {} } = params;

		return [
			{
				title: Loc.getMessage('PHONE_CALL_MSGVER_2'),
				code: 'callNativePhone',
				icon: Icon.PHONE_OUT,
				onClickCallback: () => {
					const closeCallback = () => Application.openUrl(`tel:${number}`);

					return Promise.resolve({ closeCallback });
				},
				disabled: isNumberHidden,
			},
			{
				title: Loc.getMessage('PHONE_CALL_B24_MSGVER_1'),
				code: 'callUseTelephony',
				subtitle: !canUseTelephony && Loc.getMessage('PHONE_CALL_B24_DISABLED'),
				subtitleType: !canUseTelephony && 'warning',
				icon: Icon.CLOUD_TIME,
				onClickCallback: (action, itemId, { parentWidget }) => {
					if (canUseTelephony)
					{
						const closeCallback = () => BX.postComponentEvent('onPhoneTo', [params], 'calls');

						return Promise.resolve({ closeCallback });
					}

					showTelephonyBanner(parentWidget, analyticsSection, extraParams);

					return Promise.resolve({ closeMenu: false });
				},
			},
			{
				title: Loc.getMessage('PHONE_COPY'),
				code: 'copy',
				icon: Icon.COPY,
				onClickCallback: () => {
					const closeCallback = () => copyToClipboard(number, Loc.getMessage('PHONE_COPY_DONE'));

					return Promise.resolve({ closeCallback });
				},
				disabled: isNumberHidden,
			},
		];
	}

	function showTelephonyBanner(parentWidget, analyticsSection = '', extraParams = {})
	{
		const defaultFeatureItems = [
			Loc.getMessage('PHONE_CALL_B24_BANNER_FEATURE_1'),
			Loc.getMessage('PHONE_CALL_B24_BANNER_FEATURE_2'),
			Loc.getMessage('PHONE_CALL_B24_BANNER_FEATURE_3'),
		];

		const {
			featureItems = defaultFeatureItems,
			title = Loc.getMessage('PHONE_CALL_B24_BANNER_TITLE'),
			buttonText = Loc.getMessage('PHONE_CALL_B24_BANNER_BUTTON'),
			params: bannerParams = { title: Loc.getMessage('PHONE_CALL_B24_DISABLED') },
		} = extraParams;

		FeatureBanner.show(parentWidget, {
			featureItems,
			qrauth: {
				redirectUrl: '/telephony/',
				analyticsSection,
			},
			title,
			buttonText,
			params: bannerParams,
		});
	}

	module.exports = { openPhoneMenu };
});
