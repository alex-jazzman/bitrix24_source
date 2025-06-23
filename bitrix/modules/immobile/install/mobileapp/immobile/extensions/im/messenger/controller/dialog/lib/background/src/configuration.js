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
			[DialogBackgroundId.martaAi]: {
				bottomColor: '#4596F9',
				gradientColors: [
					'#4A86E6',
					'#598AE4',
					'#6598E4',
					'#79B1E7',
					'#6EB4E7',
				],
				angle: 45,
			},
			[DialogBackgroundId.copilot]: {
				bottomColor: '#738AB2',
				gradientColors: [
					'#728AB3',
					'#748DB7',
					'#ABA7BE',
					'#BCB4C3',
				],
				angle: 45,
			},
			[DialogBackgroundId.collab]: {
				bottomColor: '#4CB968',
				gradientColors: [
					'#9BDA98',
					'#82D796',
					'#54C075',
					'#4CB968',
				],
				angle: 45,
			},
		},
		dark: {
			[DialogBackgroundId.martaAi]: {
				bottomColor: '#1B1B1C',
				gradientColors: [
					'#642E61B5',
					'#643D6AB3',
					'#64336298',
					'#64316D99',
				],
				angle: 45,
			},
			[DialogBackgroundId.copilot]: {
				bottomColor: '#131313',
				gradientColors: [
					'#484B6EA8',
					'#48B300F5',
				],
				angle: 45,
			},
			[DialogBackgroundId.collab]: {
				bottomColor: '#1A1A1A',
				gradientColors: [
					'#6450964D',
					'#643A824B',
					'#6424703B',
					'#641E5D2F',
				],
				angle: 45,
			},
		},
	};

	module.exports = { BackgroundConfiguration };
});
