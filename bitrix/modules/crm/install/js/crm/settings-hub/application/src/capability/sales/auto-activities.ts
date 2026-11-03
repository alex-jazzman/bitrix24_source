import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import {
	CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
} from '../../setting/activities/activity-remove-entity-badges-interval-days';
import {
	CrmSettingsHubIsCountersUseActivityResponsibleSetting,
} from '../../setting/activities/is-counters-use-activity-responsible';
import { CrmSettingsHubLeadActCompletionCfgSetting } from '../../setting/activities/lead-act-completion-cfg';
import { CrmSettingsHubActTaskKeepUnboundSetting } from '../../setting/sales/act-task-keep-unbound';

export const CrmSettingsHubAutoActivitiesCapability = defineComponent({
	name: 'CrmSettingsHubAutoActivitiesCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubIsCountersUseActivityResponsibleSetting,
		CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
		CrmSettingsHubLeadActCompletionCfgSetting,
		CrmSettingsHubActTaskKeepUnboundSetting,
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
			<CrmSettingsHubIsCountersUseActivityResponsibleSetting />
			<CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting />
			<CrmSettingsHubLeadActCompletionCfgSetting />
			<CrmSettingsHubActTaskKeepUnboundSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
