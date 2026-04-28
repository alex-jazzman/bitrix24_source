/**
 * @module im/messenger/const/setting
 */
jn.define('im/messenger/const/setting', (require, exports, module) => {
	const Setting = {
		chat: {
			chatBetaEnable: 'chatBetaEnable',
		},
		application: {
			audioRate: 'audioRate',
		},
		option: {
			APP_SETTING_AUDIO_RATE: 'APP_SETTING_AUDIO_RATE',
			APP_SETTING_RECORD_MEDIA_TYPE: 'APP_SETTING_RECORD_MEDIA_TYPE',
		},
	};

	module.exports = { Setting };
});