export const ReplicationPeriod = Object.freeze({
	Daily: 'daily',
	Weekly: 'weekly',
	Monthly: 'monthly',
	Yearly: 'yearly',
});

export const ReplicationDayType = Object.freeze({
	DayOfMonth: 1,
	DayOfWeek: 2,
});

export const ReplicationWeekDayNum = Object.freeze({
	First: 0,
	Second: 1,
	Third: 2,
	Fourth: 3,
	Last: 4,
});

export const ReplicationRepeatTill = Object.freeze({
	Endless: 'endless',
	Times: 'times',
	Date: 'date',
});

export const ReplicationMonthlyType = Object.freeze({
	Absolute: 1,
	Relative: 2,
});

export const ReplicationYearlyType = Object.freeze({
	Absolute: 1,
	Relative: 2,
});

export const ReplicationWeekDayIndex = Object.freeze({
	Monday: 0,
	Tuesday: 1,
	Wednesday: 2,
	Thursday: 3,
	Friday: 4,
	Saturday: 5,
	Sunday: 6,
});

export const ReplicationYearlyWeekDayIndex = Object.freeze({
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
	Sunday: 7,
});
