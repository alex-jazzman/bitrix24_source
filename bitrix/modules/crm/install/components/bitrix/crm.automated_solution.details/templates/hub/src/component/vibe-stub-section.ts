import { defineComponent, type PropType } from 'ui.vue3';
import { type NavigationRecord } from 'crm.settings-hub';

// Home-page placeholder: a static, non-interactive message about future
// availability. No CTA, no backend request; the node just occupies its place in the section tree.
export const CrmHubCrmVibeStubSection = defineComponent({
	name: 'CrmHubCrmVibeStubSection',
	props: {
		descriptor: {
			type: Object as PropType<NavigationRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	emits: ['update', 'action'],
	template: `
		<div class="crm-automated-solution-details-hub-vibe" data-testid="crm-automated-solution-vibe-stub">
			<span>{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_VIBE_STUB') }}</span>
		</div>
	`,
});
