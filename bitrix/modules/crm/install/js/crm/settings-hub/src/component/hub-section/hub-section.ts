import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { HeadlineXs } from 'ui.system.typography.vue';

import './hub-section.css';

export const CrmHubSection = defineComponent({
	name: 'CrmHubSection',
	components: { HeadlineXs },
	mixins: [locMixin],
	props: {
		sectionId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		hideTitle: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		titleId(): string
		{
			return `crm-settings-hub-section-${this.sectionId}-title`;
		},
		testId(): string
		{
			return `crm-settings-hub-section-${this.sectionId}`;
		},
	},
	template: `
		<section
			class="crm-settings-hub-section"
			tabindex="-1"
			role="region"
			:aria-labelledby="titleId"
			:data-testid="testId"
		>
			<HeadlineXs
				:id="titleId"
				class="crm-settings-hub-section__title"
				:class="{ '--visually-hidden': hideTitle }"
			>{{ loc(title) }}</HeadlineXs>
			<div class="crm-settings-hub-section__content">
				<slot/>
			</div>
		</section>
	`,
});
