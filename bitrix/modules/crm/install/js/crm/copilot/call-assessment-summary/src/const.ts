import type { SituationCode, SituationConfigItem, ThresholdBounds, WeekdayItem } from './types';

export const SAVE_AJAX_ACTION = 'crm.copilot.callassessmentsummary.saveSettings';
export const ENTITY_SELECTOR_CONTEXT = 'CRM_CALL_ASSESSMENT_SUMMARY_RECIPIENTS';

export const SITUATIONS_WITH_THRESHOLD_IN_UI: readonly SituationCode[] = Object.freeze(['badStreak', 'goodStreak']);

export const SITUATION_DEFAULT_THRESHOLDS: Readonly<Record<SituationCode, number>> = Object.freeze({
	badStreak: 3,
	goodStreak: 5,
	ratingDropped: 30,
	ratingRaised: 70,
});

export const SITUATION_THRESHOLD_BOUNDS: Readonly<Record<SituationCode, ThresholdBounds>> = Object.freeze({
	badStreak: { min: 1, max: 20 },
	goodStreak: { min: 1, max: 20 },
	ratingDropped: { min: 0, max: 100 },
	ratingRaised: { min: 0, max: 100 },
});

export const SITUATIONS_CONFIG: readonly SituationConfigItem[] = Object.freeze([
	{
		code: 'badStreak',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_DESCRIPTION',
		thresholdCode: 'CRM_COPILOT_SUMMARY_SITUATION_BADSTREAK_THRESHOLD',
	},
	{
		code: 'goodStreak',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_DESCRIPTION',
		thresholdCode: 'CRM_COPILOT_SUMMARY_SITUATION_GOODSTREAK_THRESHOLD',
	},
	{
		code: 'ratingDropped',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGDROPPED_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGDROPPED_DESCRIPTION',
	},
	{
		code: 'ratingRaised',
		titleCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGRAISED_TITLE',
		descriptionCode: 'CRM_COPILOT_SUMMARY_SITUATION_RATINGRAISED_DESCRIPTION',
	},
]);

export const WEEKDAYS: readonly WeekdayItem[] = Object.freeze([
	{ value: 1, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_MON' },
	{ value: 2, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_TUE' },
	{ value: 3, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_WED' },
	{ value: 4, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_THU' },
	{ value: 5, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_FRI' },
	{ value: 6, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_SAT' },
	{ value: 7, labelCode: 'CRM_COPILOT_SUMMARY_WEEKDAY_SUN' },
]);
