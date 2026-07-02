/**
 * @module mail/mailbox/settings/src/calendar-card
 */
jn.define('mail/mailbox/settings/src/calendar-card', (require, exports, module) => {
	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { renderToggleRow } = require('mail/mailbox/settings/src/settings-ui');

	/**
	 * @class CalendarCard
	 */
	class CalendarCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.handleCalendarToggle = this.handleCalendarToggle.bind(this);
		}

		render()
		{
			const isCalendarEnabled = this.props.calendarEnabled && this.props.calendarAutoAdd;

			return View(
				{
					testId: 'mail-connector-settings-calendar-card',
				},
				renderToggleRow({
					testId: 'mail-connector-settings-calendar-auto-add',
					checked: isCalendarEnabled,
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CALENDAR_AUTO_ADD'),
					alignItems: 'flex-start',
					onToggle: this.handleCalendarToggle,
				}),
			);
		}

		handleCalendarToggle(checked)
		{
			this.props.onStateChange({
				calendarEnabled: checked,
				calendarAutoAdd: checked,
			});
		}
	}

	module.exports = { CalendarCard };
});
