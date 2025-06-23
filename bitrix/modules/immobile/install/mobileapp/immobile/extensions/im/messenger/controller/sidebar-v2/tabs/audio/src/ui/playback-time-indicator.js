/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator', (require, exports, module) => {
	const { Text4 } = require('ui-system/typography/text');
	const { Color } = require('tokens');

	/**
	 * @param {number} seconds
	 * @returns {string} - MM:SS
	 */
	function toTimeText(seconds)
	{
		const minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		const minutesText = minutes < 10 ? `0${minutes}` : minutes;
		const secondsText = seconds < 10 ? `0${seconds}` : seconds;

		return `${minutesText}:${secondsText}`;
	}

	/**
	 * @param {number} timing - seconds
	 * @param {number} length - seconds
	 * @param testId
	 * @returns {View} - timing / length
	 */
	function PlaybackTimeIndicator(timing, length, testId)
	{
		return View(
			{
				style: {
					flexDirection: 'row',
				},
			},
			Text4({
				text: toTimeText(timing),
				color: Color.base3,
				testId: `${testId}-timing`,
			}),
			Text4({
				text: ' / ',
				color: Color.base2,
				testId: `${testId}-duration-divider`,
			}),
			Text4({
				text: toTimeText(length),
				color: Color.base2,
				testId: `${testId}-duration`,
			}),
		);
	}

	module.exports = {
		PlaybackTimeIndicator,
	};
});
