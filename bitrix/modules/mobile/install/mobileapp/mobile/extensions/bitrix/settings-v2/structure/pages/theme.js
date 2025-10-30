/**
 * @module settings-v2/structure/pages/theme
 */
jn.define('settings-v2/structure/pages/theme', (require, exports, module) => {
	const { createThemeSwitch } = require('settings-v2/structure/src/item-create-helper');
	const { NativeSettingController } = require('settings-v2/controller/native');
	const { SettingsPageId } = require('settings-v2/const');
	const { Loc } = require('loc');

	/**
	 * @returns {NativeSettingController}
	 */
	const createThemeController = () => {
		return new NativeSettingController({
			settingId: 'app_theme',
			fallbackValue: 'system',
		});
	};

	/** @type SettingPage */
	const ThemePage = {
		id: SettingsPageId.THEME,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_THEME'),
		items: [
			createThemeSwitch({
				id: 'theme',
				controller: createThemeController(),
			}),
		],
	};

	module.exports = {
		ThemePage,
	};
});
