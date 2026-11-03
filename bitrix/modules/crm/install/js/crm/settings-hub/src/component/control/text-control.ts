import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { type ScalarRecord } from '../../const/record';

export const CrmHubTextControl = defineComponent({
	name: 'CrmHubTextControl',
	components: { TextSm, TextXs },
	mixins: [locMixin],
	props: {
		descriptor: {
			type: Object as PropType<ScalarRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	computed: {
		value(): string
		{
			const raw = this.snapshot[this.descriptor.valueKey];

			return raw === null || raw === undefined ? '' : String(raw);
		},
		labelId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-label`;
		},
		hintId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-hint`;
		},
	},
	template: `
		<div
			class="crm-settings-hub-text-control"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="reason ? hintId : null"
		>
			<TextSm :id="labelId" class="crm-settings-hub-text-control__label">{{ loc(descriptor.title) }}</TextSm>
			<TextSm class="crm-settings-hub-text-control__value" data-testid="crm-settings-hub-text-control-value">{{ value }}</TextSm>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-text-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`,
});
