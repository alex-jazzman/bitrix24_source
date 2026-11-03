/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator
 */
jn.define(
	'im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator',
	(require, exports, module) => {
		const { Text4 } = require('ui-system/typography/text');
		const { Color } = require('tokens');

		/**
		 * @param {{ currentTime?: number, duration?: number, testId: string }} props
		 */
		const playbackTimeIndicator = (props) => {
			const { currentTime, duration, testId } = props;

			return View(
				{
					style: {
						flexDirection: 'row',
					},
				},
				Text4({
					text: toTimeText(currentTime),
					color: Color.base3,
					testId: `${testId}-timing`,
				}),
				Text4({
					text: ' / ',
					color: Color.base2,
					testId: `${testId}-duration-divider`,
				}),
				Text4({
					text: toTimeText(duration),
					color: Color.base2,
					testId: `${testId}-duration`,
				}),
			);
		};

		/**
		 * @param {number} seconds
		 * @returns {string} MM:SS, or HH:MM:SS for an hour and longer
		 */
		const toTimeText = (seconds) => {
			const total = Number(seconds);
			if (!Number.isFinite(total) || total <= 0)
			{
				return '00:00';
			}

			const pad = (n) => String(n).padStart(2, '0');
			const hours = Math.floor(total / 3600);
			const minutes = Math.floor((total % 3600) / 60);
			const secs = Math.floor(total % 60);

			if (hours > 0)
			{
				return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
			}

			return `${pad(minutes)}:${pad(secs)}`;
		};

		module.exports = {
			playbackTimeIndicator,
			toTimeText,
		};
	},
);
