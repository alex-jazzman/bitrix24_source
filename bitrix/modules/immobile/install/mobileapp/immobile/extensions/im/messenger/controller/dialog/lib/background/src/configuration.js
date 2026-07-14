/**
 * @module im/messenger/controller/dialog/lib/background/configuration
 */
jn.define('im/messenger/controller/dialog/lib/background/configuration', (require, exports, module) => {
	const { DialogBackgroundId } = require('im/messenger/const');

	/**
	 * @type {BackgroundConfigurationRecord}
	 */
	const BackgroundConfiguration = {
		light: {
			[DialogBackgroundId.aiAssistant]: {
				bottomColor: '#FFFFFF',
				gradientColors: [
					'#C0DCEB',
					'#C1DCEB',
					'#BBD2EE',
				],
				angle: 45,
			},
			[DialogBackgroundId.copilot]: {
				bottomColor: '#FFFFFF',
				gradientColors: [
					'#8AA6E7',
					'#9497D7',
					'#A193D5',
					'#B49AC6',
					'#DBAFB2',
				],
				angle: 100,
			},
			[DialogBackgroundId.collabWithoutCollaber]: {
				bottomColor: '#89B5FF',
				gradientColors: [
					'#5E96F0',
					'#89B5FF',
					'#89B5FF',
				],
				angle: 90,
			},
			[DialogBackgroundId.collab]: {
				bottomColor: '#76C68B',
				gradientColors: [
					'#A8DC8A',
					'#76C68B',
					'#5BAE7A',
				],
				angle: 45,
			},
		},
		dark: {
			[DialogBackgroundId.aiAssistant]: {
				bottomColor: '#131313',
				gradientColors: [
					'#1A4752',
					'#003A71',
				],
				angle: 45,
			},
			[DialogBackgroundId.copilot]: {
				bottomColor: '#131313',
				gradientColors: [
					'#324771',
					'#373971',
					'#493162',
					'#613137',
				],
				angle: 100,
			},
			[DialogBackgroundId.collabWithoutCollaber]: {
				bottomColor: "#131313",
				gradientColors: [
					'#5F91F1',
					'#5F91F1'
				],
				angle: 45,
			},
			[DialogBackgroundId.collab]: {
				bottomColor: '#131313',
				gradientColors: [
					'#1E8D36',
					'#065217',
				],
				angle: 45,
			},
		},
	};

	module.exports = { BackgroundConfiguration };
});
