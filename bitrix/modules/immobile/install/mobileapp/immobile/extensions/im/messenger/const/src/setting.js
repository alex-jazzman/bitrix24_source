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
		general: {
			defaultReaction: 'defaultReaction',
		},
		option: {
			APP_SETTING_AUDIO_RATE: 'APP_SETTING_AUDIO_RATE',
			APP_SETTING_RECORD_MEDIA_TYPE: 'APP_SETTING_RECORD_MEDIA_TYPE',
			APP_SETTING_DEFAULT_REACTION: 'APP_SETTING_DEFAULT_REACTION',
		},
	};

	module.exports = { Setting };
});