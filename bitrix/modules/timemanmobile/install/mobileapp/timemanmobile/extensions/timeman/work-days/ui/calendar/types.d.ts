declare type WorkDayCalendarProps = {
	testId?: string,
	timestamp: number,
	selectedTimestamp?: number,
	dayMap: DayMap,
	onMonthSwitched?: (timestamp: number) => void,
	onDateSelected?: (timestamp: number) => void,
};
