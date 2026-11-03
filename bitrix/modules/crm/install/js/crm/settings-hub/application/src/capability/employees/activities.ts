import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubActCalKeepReassignCallSetting } from '../../setting/activities/act-cal-keep-reassign-call';
import {
	CrmSettingsHubActCalKeepReassignMeetingSetting,
} from '../../setting/activities/act-cal-keep-reassign-meeting';
import { CrmSettingsHubActCalShowComplCallSetting } from '../../setting/activities/act-cal-show-compl-call';
import {
	CrmSettingsHubActCalShowComplMeetingSetting,
} from '../../setting/activities/act-cal-show-compl-meeting';
import {
	CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
} from '../../setting/activities/activity-remove-entity-badges-interval-days';
import {
	CrmSettingsHubIsCountersUseActivityResponsibleSetting,
} from '../../setting/activities/is-counters-use-activity-responsible';
import {
	CrmSettingsHubIsCreateCalendarEventForCallSetting,
} from '../../setting/activities/is-create-calendar-event-for-call';

export const CrmSettingsHubActivitiesCapability = defineComponent({
	name: 'CrmSettingsHubActivitiesCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubActCalShowComplCallSetting,
		CrmSettingsHubActCalShowComplMeetingSetting,
		CrmSettingsHubIsCountersUseActivityResponsibleSetting,
		CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
		CrmSettingsHubIsCreateCalendarEventForCallSetting,
		CrmSettingsHubActCalKeepReassignCallSetting,
		CrmSettingsHubActCalKeepReassignMeetingSetting,
	},
	props: capabilityPackProps,
	emits: capabilityPackEmits,
	template: `
		<CrmSettingsHubCapabilityPack
			:capability="capability"
			:active-capability-id="activeCapabilityId"
			:selected-section-id="selectedSectionId"
			:query="query"
			@select-capability="$emit('select-capability', $event)"
			@content-sections-change="$emit('content-sections-change', $event)"
			@activate="$emit('activate', $event)"
		>
			<CrmSettingsHubActCalShowComplCallSetting />
			<CrmSettingsHubActCalShowComplMeetingSetting />
			<CrmSettingsHubIsCountersUseActivityResponsibleSetting />
			<CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting />
			<CrmSettingsHubIsCreateCalendarEventForCallSetting />
			<CrmSettingsHubActCalKeepReassignCallSetting />
			<CrmSettingsHubActCalKeepReassignMeetingSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
