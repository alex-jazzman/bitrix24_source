import { Vue as CheckboxVue } from 'ui.system.checkbox';
import { defineComponent, type PropType } from 'ui.vue3';

import { type FormFieldBlockType, type FormFieldOption } from 'im.v2.const';

// Take the Vue component from the parent ui.system.checkbox extension: it creates
// the BX.UI.System.Checkbox namespace and re-exports the Vue component (export * as Vue).
// A direct import from ui.system.checkbox.vue crashes at runtime — it has an empty rel,
// so the BX.UI.System.Checkbox namespace stays undefined (same workaround as in safetools).
const Checkbox = CheckboxVue.Checkbox;

// @vue/component
export const FormFieldCheckbox = defineComponent({
	name: 'FormFieldCheckbox',
	components: { Checkbox },
	props: {
		field: {
			type: Object as PropType<FormFieldBlockType>,
			required: true,
		},
		value: {
			type: Array,
			default: () => [],
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
	},
	methods: {
		isChecked(optionId: string): boolean
		{
			return this.value.includes(optionId);
		},
		handleToggle(optionId: string, checked: boolean): void
		{
			const selected = new Set(this.value);
			if (checked)
			{
				selected.add(optionId);
			}
			else
			{
				selected.delete(optionId);
			}

			// Emit in backend option order (AC-015), not click order.
			const nextValue = this.options.filter((option) => selected.has(option.id)).map((option) => option.id);

			this.$emit('update:value', nextValue);
		},
	},
	template: `
		<div class="bx-im-message-block-form__field bx-im-message-block-form__field--group" :data-testid="'im-message-form-field-' + field.id">
			<div v-if="field.label" :id="'im-form-group-' + field.id" class="bx-im-message-block-form__field-label">{{ field.label }}</div>
			<div
				class="bx-im-message-block-form__options"
				role="group"
				:aria-labelledby="field.label ? 'im-form-group-' + field.id : null"
			>
				<div
					v-for="option in options"
					:key="option.id"
					class="bx-im-message-block-form__option"
					:data-testid="'im-message-form-option-' + option.id"
				>
					<Checkbox
						:modelValue="isChecked(option.id)"
						:disabled="disabled"
						:aria-label="option.label"
						@update:modelValue="handleToggle(option.id, $event)"
					/>
					<span class="bx-im-message-block-form__option-label">{{ option.label }}</span>
				</div>
			</div>
		</div>
	`,
});
