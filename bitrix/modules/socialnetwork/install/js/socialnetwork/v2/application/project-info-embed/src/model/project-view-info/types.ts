export type CalendarDate = {
	year: number,
	month: number,
	day: number,
};

export type ProjectDates = {
	start: CalendarDate | null,
	finish: CalendarDate | null,
};

export type ProjectViewInfo = {
	description: string,
	goal: string,
	dates: ProjectDates | null,
	tags: string[],
};
