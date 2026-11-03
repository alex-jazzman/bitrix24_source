/**
 * @module settings-v2/structure/pages/theme
 */
jn.define('settings-v2/structure/pages/theme', (require, exports, module) => {
	const {
		createThemeSwitch,
		createFontSizeSwitch,
		createSection,
		createBanner,
		createStyleSwitch,
		createAppearanceBundleSwitch,
		createDescription,
	} = require('settings-v2/structure/helpers/item-create-helper');
	const { NativeSettingController } = require('settings-v2/controller/native');
	const { AppearanceAnalytics } = require('settings-v2/analytics');
	const {
		SettingsPageId,
		BannerImageName,
		NativeSettingsId,
		DEFAULT_APP_BUNDLE,
		AppearanceBundlesAvailability,
	} = require('settings-v2/const');
	const { appConfig } = require('native/config');
	const { Feature } = require('feature');
	const { Loc } = require('loc');

	/**
	 * @returns {NativeSettingController}
	 */
	const createThemeController = () => {
		return new NativeSettingController({
			settingId: NativeSettingsId.APP_THEME,
			fallbackValue: 'system',
			onChangeAlertTitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_ON_CHANGE_ALERT_TITLE'),
			onChangeAlertDescription: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_ON_CHANGE_ALERT_DESCRIPTION'),
			onChangeAlertOkButton: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_ON_CHANGE_ALERT_OK_BUTTON'),
		});
	};

	const createStyleController = () => {
		return new NativeSettingController({
			settingId: NativeSettingsId.APP_STYLE,
			fallbackValue: 'default',
		});
	};

	const createAppearanceBundleController = () => {
		return new NativeSettingController({
			settingId: NativeSettingsId.APP_BUNDLE,
			fallbackValue: DEFAULT_APP_BUNDLE,
		});
	};

	const createFontSizeController = () => {
		return new NativeSettingController({
			settingId: NativeSettingsId.APP_FONT_SIZE,
			fallbackValue: '1.0',
			onChangeAlertTitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_FONT_SIZE_ON_CHANGE_ALERT_TITLE'),
			onChangeAlertDescription: Loc.getMessage('SETTINGS_V2_STRUCTURE_FONT_SIZE_ON_CHANGE_ALERT_DESCRIPTION'),
			onChangeAlertOkButton: Loc.getMessage('SETTINGS_V2_STRUCTURE_FONT_SIZE_ON_CHANGE_ALERT_OK_BUTTON'),
		});
	};

	/**
	 * @param {Array<NativeSetting>} allSettings
	 * @return {boolean}
	 */
	const isAppearanceBundleCustomizationAvailable = (allSettings) => {
		const hasAppearanceBundleSetting = allSettings.some((setting) => setting.id === NativeSettingsId.APP_BUNDLE);

		return Feature.isAppearanceBundlesEnabled() && hasAppearanceBundleSetting;
	};

	/**
	 * @return {Promise<AppearanceBundlesAvailability>}
	 */
	const resolveBundlesAvailability = async () => {
		try
		{
			const allSettings = await appConfig.getSettings() ?? [];

			return isAppearanceBundleCustomizationAvailable(allSettings)
				? AppearanceBundlesAvailability.AVAILABLE
				: AppearanceBundlesAvailability.UNAVAILABLE;
		}
		catch (e)
		{
			console.error(e);

			return AppearanceBundlesAvailability.UNAVAILABLE;
		}
	};

	const requestSettingsData = async () => {
		const allSettings = await appConfig.getSettings() ?? [];

		const isStyleCustomizationEnabled = allSettings.some((setting) => setting.id === NativeSettingsId.APP_STYLE);
		const isAppearanceBundleCustomizationEnabled = isAppearanceBundleCustomizationAvailable(allSettings);
		const isFontSizeEnabled = Feature.isAppFontSizeEnabled();

		return {
			isStyleCustomizationEnabled,
			isAppearanceBundleCustomizationEnabled,
			isFontSizeEnabled,
		};
	};

	/** @type SettingPage */
	const ThemePage = {
		id: SettingsPageId.THEME,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_TITLE'),
		onOpen: async () => {
			AppearanceAnalytics.sendViewAppearance({
				bundlesAvailability: await resolveBundlesAvailability(),
			});
		},
		requestSettingsData,
		items: [
			createSection({
				id: 'theme-banner-section',
				divider: false,
				items: [
					createBanner({
						id: 'theme-banner',
						bannerImageName: BannerImageName.THEME,
						text: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_BANNER_TEXT'),
					}),
				],
			}),
			createSection({
				id: 'app-appearance-bundle-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_APPEARANCE_BUNDLE_SECTION'),
				divider: false,
				items: [
					createAppearanceBundleSwitch({
						id: 'appearance-bundle',
						controller: createAppearanceBundleController(),
					}),
				],
				prefilter: (settingsData) => settingsData.isAppearanceBundleCustomizationEnabled === true,
			}),
			createSection({
				id: 'app-theme-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_SECTION'),
				divider: false,
				items: [
					createThemeSwitch({
						id: 'theme',
						controller: createThemeController(),
						divider: false,
					}),
				],
			}),
			createSection({
				id: 'app-style-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME_STYLE_SECTION'),
				divider: false,
				items: [
					createStyleSwitch({
						id: 'style',
						controller: createStyleController(),
					}),
				],
				prefilter: (settingsData) => settingsData.isStyleCustomizationEnabled === true,
			}),
			createSection({
				id: 'app-font-size-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_FONT_SIZE_SECTION'),
				divider: false,
				items: [
					createFontSizeSwitch({
						id: 'font-size',
						controller: createFontSizeController(),
						divider: false,
					}),
				],
				prefilter: (settingsData) => settingsData.isFontSizeEnabled === true,
			}),
		],
	};

	module.exports = {
		ThemePage,
	};
});
