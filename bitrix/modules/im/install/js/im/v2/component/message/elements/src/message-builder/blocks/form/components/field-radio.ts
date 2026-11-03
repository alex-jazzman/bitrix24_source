import { Vue as RadioButtonVue } from 'ui.system.radiobutton';
import { defineComponent, type PropType } from 'ui.vue3';

import { type FormFieldBlockType, type FormFieldOption } from 'im.v2.const';

// Take the Vue component from the parent ui.system.radiobutton extension: it creates
// the BX.UI.System.RadioButton namespace and re-exports the Vue component (export * as Vue).
// A direct import from ui.system.radiobutton.vue crashes at runtime — it has an empty rel,
// so the BX.UI.System.RadioButton namespace stays undefined (same workaround as in safetools).
const RadioButton = RadioButtonVue.RadioButton;

// @vue/component
export const FormFieldRadio = defineComponent({
	name: 'FormFieldRadio',
	components: { RadioButton },
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
		options(): FormFieldOption[]
		{
			return this.field.options ?? [];
		},
		groupName(): string
		{
			return `field-${this.field.id}`;
		},
	},
	methods: {
		handleChange(optionId: string, checked: boolean): void
		{
			if (checked)
			{
				this.$emit('update:value', optionId);
			}
		},
	},
	template: `
		<div class="bx-im-message-block-form__field bx-im-message-block-form__field--group" :data-testid="'im-message-form-field-' + field.id">
			<div v-if="field.label" :id="'im-form-group-' + field.id" class="bx-im-message-block-form__field-label">{{ field.label }}</div>
			<div
				class="bx-im-message-block-form__options"
				role="radiogroup"
				:aria-labelledby="field.label ? 'im-form-group-' + field.id : null"
			>
				<div
					v-for="option in options"
					:key="option.id"
					class="bx-im-message-block-form__option"
					:data-testid="'im-message-form-option-' + option.id"
				>
					<RadioButton
						:modelValue="option.id === value"
						:group="groupName"
						:disabled="disabled"
						:aria-label="option.label"
						@update:modelValue="handleChange(option.id, $event)"
					/>
					<span class="bx-im-message-block-form__option-label">{{ option.label }}</span>
				</div>
			</div>
		</div>
	`,
});
