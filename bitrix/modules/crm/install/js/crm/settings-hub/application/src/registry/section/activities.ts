import { Loc } from 'main.core';

import {
	registration as isCountersUseActivityResponsibleRegistration,
} from '../../setting/activities/is-counters-use-activity-responsible';
import {
	registration as activityRemoveEntityBadgesIntervalDaysRegistration,
} from '../../setting/activities/activity-remove-entity-badges-interval-days';
import {
	registration as leadActCompletionCfgRegistration,
} from '../../setting/activities/lead-act-completion-cfg';
import {
	registration as isCreateCalendarEventForCallRegistration,
} from '../../setting/activities/is-create-calendar-event-for-call';
import {
	registration as actCalShowComplCallRegistration,
} from '../../setting/activities/act-cal-show-compl-call';
import {
	registration as actCalShowComplMeetingRegistration,
} from '../../setting/activities/act-cal-show-compl-meeting';
import {
	registration as actCalKeepReassignCallRegistration,
} from '../../setting/activities/act-cal-keep-reassign-call';
import {
	registration as actCalKeepReassignMeetingRegistration,
} from '../../setting/activities/act-cal-keep-reassign-meeting';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const activitiesSection: SettingsSectionRegistration = {
	id: 'activities',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_ACTIVITIES_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'activity',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_ACTIVITY_TITLE'),
			icon: 'o-activity',
			settings: [
				isCountersUseActivityResponsibleRegistration,
				activityRemoveEntityBadgesIntervalDaysRegistration,
				leadActCompletionCfgRegistration,
			],
		},
		{
			id: 'calendar',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_CALENDAR_TITLE'),
			icon: 'o-calendar',
			settings: [
				isCreateCalendarEventForCallRegistration,
				actCalShowComplCallRegistration,
				actCalShowComplMeetingRegistration,
				actCalKeepReassignCallRegistration,
				actCalKeepReassignMeetingRegistration,
			],
		},
	],
};
