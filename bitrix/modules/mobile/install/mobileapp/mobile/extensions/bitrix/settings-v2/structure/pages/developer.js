/**
 * @module settings-v2/structure/pages/developer
 */
jn.define('settings-v2/structure/pages/developer', (require, exports, module) => {
	const {
		createSection,
		createToggle,
		createLinkButton,
	} = require('settings-v2/structure/helpers/item-create-helper');
	const { SettingsPageId, REDUX_LOGGER_ID } = require('settings-v2/const');
	const { NativeDebugService } = require('settings-v2/services/native');
	const { NativeSettingController } = require('settings-v2/controller/native');
	const { ApplicationStorageSettingController } = require('settings-v2/controller/application-storage');
	const { Color } = require('tokens');

	const Platforms = {
		ANDROID: 'android',
		IOS: 'ios',
	};

	const NativeDebugSettingsIds = {
		[Platforms.IOS]: {
			ENABLED_INSPECTOR: 'debug_enabled_inspector',
			HOST_INSPECTOR: 'debug_host_inspector',
			ENABLED_POI: 'debug_enabled_poi',
			DROP_SESSID: 'debug_drop_sessid',
			SEPARATE_JS_EVENT_QUEUE: 'debug_separate_js_event_queue',
		},
		[Platforms.ANDROID]: {
			NETWORK_CLONE: 'debug_network_clone',
			JANATIVE_DEBUGGER: 'debug_janative_debugger',
			NETWORK_TAB: 'debug_network_tab',
			LAYOUT_INSPECTOR: 'debug_layout_inspector',
		},
	};

	const Titles = {
		[NativeDebugSettingsIds[Platforms.IOS].ENABLED_INSPECTOR]: 'Enable Inspector',
		[NativeDebugSettingsIds[Platforms.IOS].HOST_INSPECTOR]: 'Host Inspector',
		[NativeDebugSettingsIds[Platforms.IOS].ENABLED_POI]: 'Enable POI',
		[NativeDebugSettingsIds[Platforms.IOS].DROP_SESSID]: 'Drop Sessid',
		[NativeDebugSettingsIds[Platforms.IOS].SEPARATE_JS_EVENT_QUEUE]: 'Separate JS Event Queue',

		[NativeDebugSettingsIds[Platforms.ANDROID].NETWORK_CLONE]: 'Network Clone',
		[NativeDebugSettingsIds[Platforms.ANDROID].JANATIVE_DEBUGGER]: 'JA Native Debugger',
		[NativeDebugSettingsIds[Platforms.ANDROID].NETWORK_TAB]: 'Network Tab',
		[NativeDebugSettingsIds[Platforms.ANDROID].LAYOUT_INSPECTOR]: 'Layout Inspector',

		[REDUX_LOGGER_ID]: 'Enable Redux Logger',
	};

	const requestSettingsData = () => {
		return NativeDebugService.getDebugSettings();
	};

	const prepareItems = (debugSettings) => {
		const items = debugSettings.map(
			(setting) => createToggle({
				id: setting.id,
				title: Titles[setting.id] ?? setting.id,
				controller: new NativeSettingController({
					settingId: setting.id,
					fallbackValue: false,
				}),
			}),
		);

		items.push(
			/**
			 * @see statemanager/redux/store
			 */
			createToggle({
				id: REDUX_LOGGER_ID,
				title: Titles[REDUX_LOGGER_ID],
				controller: new ApplicationStorageSettingController({
					settingId: REDUX_LOGGER_ID,
					fallbackValue: true,
				}),
			}),
			createLinkButton({
				id: 'accept-debug-setting-data',
				title: 'Apply and re-login',
				color: Color.accentMainPrimary,
				onClick: () => {
					Application.relogin();
				},
			}),
		);

		return items;
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
