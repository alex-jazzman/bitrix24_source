/**
 * @module timeman/layout/workday-intent-box-v3/src/autoupdating-date
 */
jn.define('timeman/layout/workday-intent-box-v3/src/autoupdating-date', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Text4 } = require('ui-system/typography/text');
	const { Loc } = require('loc');
	const { Moment } = require('utils/date');
	const { dayMonth, shortTime } = require('utils/date/formats');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	class AutoupdatingDate extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.timeoutId = null;
			this.intervalId = null;
			this.getTestId = createTestIdGenerator({ context: this });
			this.format = `${dayMonth()}, ${shortTime()}`;

			this.state = {
				moment: new Moment(),
			};
		}

		componentDidMount()
		{
			const refreshTimeout = 60 * 1000;
			const timeoutUntilNextTick = refreshTimeout - (Date.now() % refreshTimeout) + 1000;

			const refreshMoment = () => this.setState({ moment: new Moment() });

			this.timeoutId = setTimeout(
				() => {
					refreshMoment();
					this.intervalId = setInterval(refreshMoment, refreshTimeout);
				},
				timeoutUntilNextTick,
			);
		}

		componentWillUnmount()
		{
			clearTimeout(this.timeoutId);
			clearInterval(this.intervalId);
		}

		render()
		{
			return Text4({
				text: Loc.getMessage(
					'TIMEMANMOBILE_INTENT_SELECTION_DATETIME',
					{
						'#DATETIME#': this.state.moment.format(this.format),
					},
				),
				testId: this.getTestId(),
			});
		}
	}

	AutoupdatingDate.propTypes = {
		testId: PropTypes.string.isRequired,
	};

	module.exports = { AutoupdatingDate };
});
