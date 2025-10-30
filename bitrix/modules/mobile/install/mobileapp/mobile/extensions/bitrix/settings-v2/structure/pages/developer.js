/**
 * @module settings-v2/structure/pages/developer
 */
jn.define('settings-v2/structure/pages/developer', (require, exports, module) => {
	const {
		createSection,
		createToggle,
	} = require('settings-v2/structure/src/item-create-helper');
	const { SettingsPageId } = require('settings-v2/const');
	const { NativeDebugService } = require('settings-v2/services/native');
	const { NativeSettingController } = require('settings-v2/controller/native');

	const requestSettingsData = () => {
		return NativeDebugService.getDebugSettings();
	};

	const prepareItems = (debugSettings) => {
		return debugSettings.map((setting) => {
			return createToggle({
				id: setting.id,
				title: setting.id,
				controller: new NativeSettingController({
					settingId: setting.id,
					fallbackValue: false,
				}),
			});
		});
	};

	/** @type SettingPage */
	const DeveloperPage = {
		id: SettingsPageId.DEVELOPER,
		title: 'Developer',
		requestSettingsData,
		items: [
			createSection(
				{
					id: 'notifications-module-section',
					items: [],
					prepareItems,
				},
			),
		],
	};

	module.exports = {
		DeveloperPage,
	};
});
