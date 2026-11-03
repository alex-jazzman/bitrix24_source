declare type CalendarLegendCounts = { [dayTypeId: string]: number };

declare type CalendarLegendProps = {
	testId?: string,
	counts: CalendarLegendCounts,
};
