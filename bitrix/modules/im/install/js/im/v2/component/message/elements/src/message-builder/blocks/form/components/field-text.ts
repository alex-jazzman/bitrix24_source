import { BInput, InputDesign } from 'ui.system.input.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { FormFieldType, type FormFieldBlockType } from 'im.v2.const';

const MULTILINE_ROWS = 4;

// @vue/component
export const FormFieldText = defineComponent({
	name: 'FormFieldText',
	components: { BInput },
	props: {
		field: {
			type: Object as PropType<FormFieldBlockType>,
			required: true,
		},
		value: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value'],
	computed: {
		fieldValue: {
			get(): string
			{
				return this.value;
			},
			set(nextValue: string): void
			{
				this.$emit('update:value', nextValue);
			},
		},
		rowsQuantity(): number
		{
			return this.field.type === FormFieldType.multilineText ? MULTILINE_ROWS : 1;
		},
		design(): string
		{
			return this.disabled ? InputDesign.Disabled : InputDesign.Grey;
		},
	},
	template: `
		<div class="bx-im-message-block-form__field" :data-testid="'im-message-form-field-' + field.id">
			<BInput
				v-model="fieldValue"
				:rowsQuantity="rowsQuantity"
				:label="field.label"
				:placeholder="field.placeholder"
				:design="design"
				stretched
			/>
		</div>
	`,
});
