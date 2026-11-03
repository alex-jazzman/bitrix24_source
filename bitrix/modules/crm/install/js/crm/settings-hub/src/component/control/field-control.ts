import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BInput } from 'ui.system.input.vue';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { type ScalarRecord } from '../../const/record';
import { resolveFieldInputType, type FieldInputType } from '../../lib/resolve-field-input/resolve-field-input';

export const CrmHubFieldControl = defineComponent({
	name: 'CrmHubFieldControl',
	components: { BInput, TextSm, TextXs },
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
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	emits: ['update'],
	computed: {
		value(): string
		{
			const raw = this.snapshot[this.descriptor.valueKey];

			return raw === null || raw === undefined ? '' : String(raw);
		},
		hintId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-hint`;
		},
		inputType(): FieldInputType
		{
			return resolveFieldInputType(this.descriptor);
		},
	},
	methods: {
		handleInput(value: string): void
		{
			this.$emit('update', value);
		},
	},
	template: `
		<div class="crm-settings-hub-field-control" :class="{ '--disabled': disabled }">
			<TextSm class="crm-settings-hub-field-control__label">{{ loc(descriptor.title) }}</TextSm>
			<BInput
				:model-value="value"
				:type="inputType"
				:aria-label="loc(descriptor.title)"
				:readonly="disabled"
				:aria-describedby="reason ? hintId : null"
				data-testid="crm-settings-hub-field-control-input"
				stretched
				@update:modelValue="handleInput"
			/>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-field-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`,
});
