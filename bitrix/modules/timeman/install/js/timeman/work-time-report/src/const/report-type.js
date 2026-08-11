export const ReportType = Object.freeze({
	DAY: 'day',
	WEEK: 'week',
	MONTH: 'month',
	NONE: 'none',
});

export type ReportTypeValue = $Values<typeof ReportType>;

export const reportTypeFromValue = (value: ?string, fallback: ReportTypeValue = ReportType.WEEK): ReportTypeValue => {
	const lowered = String(value ?? '').toLowerCase();
	const known = Object.values(ReportType);

	return known.includes(lowered) ? lowered : fallback;
};
