declare type WorkDaysListProps = {
	timestamp: number,
	dayMap: DayMap,
	userId?: number,
	layout?: object,
	scrollToTimestamp?: number,
	onDateScrolled?: (timestamp: number) => void,
};
