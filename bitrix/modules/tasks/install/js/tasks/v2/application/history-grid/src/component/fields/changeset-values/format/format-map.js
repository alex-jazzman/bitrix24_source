import { offsetDateTimeFormat } from './offset-date-time-format';
import { elapsedPreciseTimeFormat } from './elapsed-precise-time-format';
import { elapsedTimeFormat } from './elapsed-time-format';
import { tagsFormat } from './tags-format';
import { durationPlanFormat } from './duration-plan-format';
import { defaultFormat } from './default-format';

export const formatMap = {
	DEADLINE: offsetDateTimeFormat,
	TIME_SPENT_IN_LOGS: elapsedPreciseTimeFormat,
	TIME_ESTIMATE: elapsedPreciseTimeFormat,
	DURATION_FACT: elapsedTimeFormat,
	TAGS: tagsFormat,
	START_DATE_PLAN: offsetDateTimeFormat,
	END_DATE_PLAN: offsetDateTimeFormat,
	DURATION_PLAN_SECONDS: durationPlanFormat,
	STATUS: defaultFormat,
	MARK: defaultFormat,
	PRIORITY: defaultFormat,
	ADD_IN_REPORT: defaultFormat,
	STAGE: defaultFormat,
	TITLE: defaultFormat,
	CHECKLIST_ITEM_RENAME: defaultFormat,
	CHECKLIST_ITEM_CREATE: defaultFormat,
	CHECKLIST_ITEM_REMOVE: defaultFormat,
	CHECKLIST_ITEM_MAKE_UNIMPORTANT: defaultFormat,
	CHECKLIST_ITEM_MAKE_IMPORTANT: defaultFormat,
};
