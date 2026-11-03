/**
 * @module qrauth/show-code/src/code-timer
 */
jn.define('qrauth/show-code/src/code-timer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color, Indent, Typography } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');

	const SECONDS_IN_MINUTE = 60;
	const TIME_PLACEHOLDER = '#TIME#';
	const TIME_WIDTH_IN_FONT_SIZES = 2.2;

	/**
	 * @typedef {object} QrCodeTimerProps
	 * @property {string} testId
	 * @property {function(function(number)): function(): void} subscribeToTick
	 * @property {function(): number} [getSecondsLeft]
	 *
	 * @class QrCodeTimer
	 */
	class QrCodeTimer extends LayoutComponent
	{
		#unsubscribeFromTick = null;

		/**
		 * @param {QrCodeTimerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				secondsLeft: props.getSecondsLeft?.() ?? 0,
			};
		}

		componentDidMount()
		{
			this.#unsubscribeFromTick = this.props.subscribeToTick?.(this.#handleTick);
		}

		componentWillUnmount()
		{
			this.#unsubscribeFromTick?.();
			this.#unsubscribeFromTick = null;
		}

		#handleTick = (secondsLeft) => {
			if (secondsLeft === this.state.secondsLeft)
			{
				return;
			}

			this.setState({ secondsLeft });
		};

		render()
		{
			const [textBeforeTime, textAfterTime] = Loc
				.getMessage('M_QRAUTH_SHOW_CODE_CODE_TIMER')
				.split(TIME_PLACEHOLDER);

			return View(
				{
					testId: this.props.testId,
					style: {
						flexDirection: 'row',
						flexWrap: 'wrap',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: Indent.XL3.toNumber(),
					},
				},
				this.#renderText(textBeforeTime, Color.base3),
				View(
					{
						style: {
							width: this.#getTimeWidth(),
							alignItems: 'flex-start',
						},
					},
					this.#renderText(this.#formatSecondsLeft(), Color.accentMainPrimary),
				),
				this.#renderText(textAfterTime, Color.base3),
			);
		}

		#renderText(text, color)
		{
			if (!Type.isStringFilled(text))
			{
				return null;
			}

			return Text4({
				text,
				color,
				style: {
					textAlign: 'center',
				},
			});
		}

		#getTimeWidth()
		{
			const { fontSize } = Typography.text4.getStyle();

			return Math.ceil(fontSize * TIME_WIDTH_IN_FONT_SIZES);
		}

		/**
		 * @return {string}
		 */
		#formatSecondsLeft()
		{
			const { secondsLeft } = this.state;
			const minutes = Math.floor(secondsLeft / SECONDS_IN_MINUTE);
			const seconds = secondsLeft % SECONDS_IN_MINUTE;

			return `${minutes}:${String(seconds).padStart(2, '0')}`;
		}
	}

	module.exports = {
		/**
		 * @param {QrCodeTimerProps} props
		 * @return {QrCodeTimer}
		 */
		QrCodeTimer: (props) => new QrCodeTimer(props),
	};
});
