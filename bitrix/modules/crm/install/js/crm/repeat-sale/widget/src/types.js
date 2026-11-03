export const PeriodType = Object.freeze({
	day30: 0,
	quarter: 1,
	halfYear: 2,
	year: 3,
});

export const WidgetType = Object.freeze({
	start: 'start',
	forceStart: 'forceStart',
	statistics: 'statistics',
});

export type WidgetTypeEnum = WidgetType.start | WidgetType.forceStart | WidgetType.statistics;

export type WidgetParams = {
	showSettingsButton?: boolean,
	isGlowingSettingsButton?: boolean,
	showConfetti?: boolean,
	isRepeatSaleGrid?: boolean,
	dealListUrl?: ?string,
	periodTypeId?: PeriodType.day30 | PeriodType.quarter | PeriodType.halfYear | PeriodType.year,
};
