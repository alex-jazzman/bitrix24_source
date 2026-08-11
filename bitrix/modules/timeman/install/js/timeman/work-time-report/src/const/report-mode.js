export const ReportMode = Object.freeze({
	DAILY: 'daily',
	WEEKLY: 'weekly',
	PLAN: 'plan',
});

export type ReportModeValue = $Values<typeof ReportMode>;
