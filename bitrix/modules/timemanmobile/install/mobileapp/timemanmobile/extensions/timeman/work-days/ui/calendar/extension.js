/**
 * @module timeman/work-days/ui/calendar
 */
jn.define('timeman/work-days/ui/calendar', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Color } = require('tokens');
	const { Moment } = require('utils/date');
	const { transparent } = require('utils/color');

	const FADE_OPACITY = 0.5;

	const isAndroid = Application.getPlatform() === 'android';

	const getMonthTimestamp = (timestamp) => new Moment(timestamp).startOfMonth.date.getTime();

	class WorkDayCalendar extends PureComponent
	{
		/**
		 * @param {WorkDayCalendarProps} props
		 */
		constructor(props)
		{
			super(props);

			this.calendarRef = null;
			this.timezoneOffset = isAndroid ? 0 : new Date().getTimezoneOffset() * 60 * 1000;
			this.isMonthSwitching = false;
			// The month left behind by a tap on a day of the neighbouring one: the native calendar finishes
			// the scroll itself and reports that month as the current one. Set on ios only - the android
			// view gives no such report. Cleared by the very first month report - that one is already
			// either the confirmation of a new month or a real swipe.
			this.staleMonthTimestamp = null;
		}

		componentDidMount()
		{
			this.updateCheckedDates();
		}

		componentWillReceiveProps(nextProps)
		{
			const nextSelectedTimestamp = nextProps.selectedTimestamp || nextProps.timestamp;
			const currentSelectedTimestamp = this.props.selectedTimestamp || this.props.timestamp;
			const selectedMonthChanged = new Moment(nextSelectedTimestamp).startOfMonth.date.getTime()
				!== new Moment(currentSelectedTimestamp).startOfMonth.date.getTime();

			if (
				this.calendarRef
				&& (
					nextProps.timestamp !== this.props.timestamp
					|| selectedMonthChanged
				)
			)
			{
				this.#suppressDateSelection();

				const date = Math.round((nextSelectedTimestamp - this.timezoneOffset) / 1000);
				this.calendarRef.setDate(date, true);
			}

			this.updateCheckedDates(nextProps);
		}

		render()
		{
			const { timestamp, selectedTimestamp } = this.props;
			const { todaySlotColor, todaySlotTextColor } = this.state;
			const initialTimestamp = selectedTimestamp || timestamp;

			return CalendarView({
				testId: this.props.testId,
				style: {
					backgroundColor: Color.bgNavigation.toHex(),
				},
				initialDate: Math.round((initialTimestamp - this.timezoneOffset) / 1000),
				firstWeekday: 2,
				onDateSelected: this.#onDateSelected,
				onMonthSwitched: this.#onMonthSwitched,
				ref: this.#bindCalendarRef,
				showWeekNumbers: true,
				textStyle: {
					selected: {
						textColor: isAndroid && Color.baseWhiteFixed.toHex(),
						backgroundColor: Color.techOverlay.toHex(),
					},
					currentWeekNumber: {
						textColor: Color.accentMainPrimary.toHex(),
					},
					today: {
						textColor: todaySlotTextColor || Color.base1.toHex(),
						backgroundColor: todaySlotColor,
					},
					todaySelected: {
						textColor: isAndroid && Color.baseWhiteFixed.toHex(),
						backgroundColor: Color.techOverlay.toHex(),
					},
				},
			});
		}

		#bindCalendarRef = (ref) => {
			this.calendarRef = ref;
			this.updateCheckedDates();
		};

		#onDateSelected = (timestamp) => {
			if (this.isMonthSwitching)
			{
				return;
			}

			const selectedTimestamp = timestamp * 1000;
			const monthTimestamp = getMonthTimestamp(this.props.timestamp);

			if (!isAndroid && getMonthTimestamp(selectedTimestamp) !== monthTimestamp)
			{
				this.staleMonthTimestamp = monthTimestamp;
			}

			const { onDateSelected } = this.props;

			if (onDateSelected)
			{
				onDateSelected(selectedTimestamp);
			}
		};

		#suppressDateSelection()
		{
			this.isMonthSwitching = true;
			setTimeout(() => {
				this.isMonthSwitching = false;
			}, 300);
		}

		#onMonthSwitched = (timestamp) => {
			const monthTimestamp = timestamp * 1000;
			const isStaleMonth = this.staleMonthTimestamp !== null
				&& getMonthTimestamp(monthTimestamp) === this.staleMonthTimestamp;

			this.staleMonthTimestamp = null;

			if (isStaleMonth)
			{
				return;
			}

			const { onMonthSwitched } = this.props;

			if (onMonthSwitched)
			{
				onMonthSwitched(monthTimestamp);
			}
		};

		updateCheckedDates(props = this.props)
		{
			if (!this.calendarRef)
			{
				return;
			}

			const todayKey = new Moment().date.toDateString();
			let todaySlotColor = null;
			let todaySlotTextColor = null;

			const currentMonthDate = new Moment(props.timestamp).startOfMonth.date;
			const currentMonth = currentMonthDate.getMonth();
			const currentYear = currentMonthDate.getFullYear();
			const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

			const { dayMap } = props;
			const slotDates = [];

			let currentSlot = null;

			dayMap.forEach(({ dayType }, dateKey) => {
				const date = new Date(dateKey);
				const ts = Math.round((date.getTime() - this.timezoneOffset) / 1000);

				if (!dayType)
				{
					currentSlot = null;

					return;
				}

				const isCurrentMonth = dateKey.slice(0, 7) === currentMonthPrefix;
				const slotColor = isCurrentMonth ? dayType.color : transparent(dayType.color, FADE_OPACITY);
				const slotTextColor = isCurrentMonth ? dayType.textColor : transparent(dayType.textColor, FADE_OPACITY);

				if (currentSlot && currentSlot.color === slotColor)
				{
					currentSlot.endTimestamp = ts;
				}
				else
				{
					currentSlot = { timestamp: ts, color: slotColor, textColor: slotTextColor };
					slotDates.push(currentSlot);
				}

				if (date.toDateString() === todayKey)
				{
					todaySlotColor = slotColor;
					todaySlotTextColor = slotTextColor;
				}
			});

			this.state.slotDates = slotDates;
			this.state.todaySlotColor = todaySlotColor;
			this.state.todaySlotTextColor = todaySlotTextColor;

			this.calendarRef.setSlotDates(slotDates);
		}
	}

	module.exports = { WorkDayCalendar };
});
