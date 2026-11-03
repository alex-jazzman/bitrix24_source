import { defineComponent, type PropType } from 'ui.vue3';

import { type CapabilityGroup } from '../../model/types';

export const CrmSettingsHubCapabilityGroup = defineComponent({
	name: 'CrmSettingsHubCapabilityGroup',
	props: {
		group: {
			type: Object as PropType<CapabilityGroup>,
			required: true,
		},
		activeCapabilityId: {
			type: String as PropType<string | null>,
			default: null,
		},
		selectedSectionId: {
			type: String as PropType<string | null>,
			default: null,
		},
		query: {
			type: String,
			required: true,
		},
	},
	emits: ['select-capability', 'content-sections-change', 'activate'],
	computed: {
		captionId(): string
		{
			return `crm-settings-hub-cap-group-${this.group.id}`;
		},
	},
	template: `
		<section
			v-if="group.capabilities.length > 0"
			class="crm-settings-hub-application__cap-group"
			:data-testid="'crm-settings-hub-application-capability-group-' + group.id"
			:aria-labelledby="captionId"
		>
			<h2 :id="captionId" class="crm-settings-hub-application__cap-caption">{{ group.title }}</h2>
			<div
				class="crm-settings-hub-application__cap-grid"
				:data-testid="'crm-settings-hub-application-capability-grid-' + group.id"
			>
				<component
					v-for="capability in group.capabilities"
					:key="capability.id"
					:is="capability.component"
					:capability="capability"
					:active-capability-id="activeCapabilityId"
					:selected-section-id="selectedSectionId"
					:query="query"
					@select-capability="$emit('select-capability', $event)"
					@content-sections-change="$emit('content-sections-change', $event)"
					@activate="$emit('activate', $event)"
				/>
			</div>
		</section>
	`,
});
