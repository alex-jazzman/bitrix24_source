/**
 * @module settings-v2/structure/pages/root
 */
jn.define('settings-v2/structure/pages/root', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');
	const { copyToClipboard } = require('utils/copy');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');

	const { SettingsPageId } = require('settings-v2/const');
	const { NativeSettingController } = require('settings-v2/controller/native');
	const {
		createLink,
		createSection,
		createButton,
		createLocSelector,
	} = require('settings-v2/structure/src/item-create-helper');

	/**
	 * @returns {NativeSettingController}
	 */
	const createLocController = () => {
		return new NativeSettingController({
			settingId: 'app_language',
			fallbackValue: 'ru',
		});
	};

	const isAndroid = Application.getPlatform() === 'android';

	const requestSettingsData = async () => {
		const devMenuEnabled = await checkFeatureFlag(FeatureFlagType.DEVELOPER_MENU);

		return {
			devMenuEnabled,
		};
	};

	/** @type {SettingPage} */
	const RootPage = {
		id: SettingsPageId.ROOT,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_TITLE'),
		requestSettingsData,
		items: [
			createSection({
				id: 'application-settings',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_APP_SETTINGS'),
				items: [
					createLink({
						id: 'messenger',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_MESSENGER'),
						icon: Icon.MESSAGE,
						nextPage: SettingsPageId.MESSENGER,
					}),
					createLink({
						id: 'theme',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_THEME'),
						icon: Icon.THEME,
						nextPage: SettingsPageId.THEME,
					}),
					createLink({
						id: 'sync',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_SYNC'),
						icon: Icon.REFRESH,
						nextPage: SettingsPageId.SYNC,
						prefilter: () => isAndroid,
					}),
					createLink({
						id: 'memory',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_MEMORY'),
						icon: Icon.STORAGE,
						nextPage: SettingsPageId.MEMORY,
					}),
					createLink({
						id: 'video-quality',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_VIDEO_QUALITY'),
						icon: Icon.RECORD_VIDEO,
						nextPage: SettingsPageId.VIDEO_QUALITY,
						prefilter: () => isAndroid,
					}),
					createLocSelector({
						id: 'loc',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_LOC'),
						icon: Icon.EARTH,
						controller: createLocController(),
					}),
				],
			}),
			createSection({
				id: 'additionally-settings',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_ADDITIONAL_SETTINGS'),
				items: [
					createLink({
						id: 'license',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_LICENSE'),
						nextPage: SettingsPageId.LICENSE,
					}),
					createButton({
						id: 'feedback',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_FEEDBACK'),
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						onClick: () => {
							(new FeedbackForm({
								senderPage: 'settings_v2',
							})).open({
								title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_FEEDBACK'),
							});
						},
					}),
					createLink({
						id: 'debug',
						prefilter: () => isAndroid,
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_DEBUG'),
						nextPage: SettingsPageId.DEBUG,
					}),
					createButton({
						id: 'app-version',
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_APP_VERSION'),
						icon: Icon.COPY,
						subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_APP_VERSION_SUBTITLE', {
							'#APP_VERSION#': Application.getAppVersion(),
							'#API_VERSION#': String(Application.getApiVersion()),
						}),
						onClick: () => {
							void copyToClipboard(
								Loc.getMessage('SETTINGS_V2_STRUCTURE_ROOT_APP_VERSION_SUBTITLE', {
									'#APP_VERSION#': Application.getAppVersion(),
									'#API_VERSION#': String(Application.getApiVersion()),
								}),
							);
						},
					}),
					createLink({
						id: 'developer',
						title: 'Developer',
						nextPage: SettingsPageId.DEVELOPER,
						prefilter: (settingsData) => settingsData.devMenuEnabled,
					}),
				],
			}),
		],
	};

	module.exports = {
		RootPage,
	};
});
