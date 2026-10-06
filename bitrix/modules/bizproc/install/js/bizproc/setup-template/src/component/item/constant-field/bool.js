import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { Switcher } from 'ui.vue3.components.switcher';
import { BOOL_VALUES, isBoolValueChecked } from '../../../lib/constant-bool/constant-bool';

const SWITCHER_OPTIONS: SwitcherOptions = Object.freeze({
	size: SwitcherSize.small,
	showStateTitle: false,
});

// A single row: the switcher of one value and the name of the constant next to it, whether
// the constant is multiple or not.
// @vue/component
export const ConstantBoolControl = {
	name: 'ConstantBoolControl',
	components: {
		Switcher,
	},
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		labelledbyId: {
			type: String,
			default: '',
		},
		describedbyId: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
		// Key of the row this control belongs to, given by MultipleConstantField.
		rowKey: {
			type: [String, Number],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		return { SWITCHER_OPTIONS };
	},
	computed: {
		isChecked(): boolean
		{
			return isBoolValueChecked(this.modelValue);
		},
		/**
		 * The name of the constant is the label of the switcher itself, so the id the form names
		 * the field by is assigned to the label rendered here. A multiple constant has a row per
		 * value, and each of them needs an id of its own.
		 */
		labelId(): string
		{
			const fieldLabelId = this.labelledbyId || `bizproc-setup-template-bool-${this.item.id}`;

			return this.rowKey === null ? fieldLabelId : `${fieldLabelId}-${this.rowKey}`;
		},
	},
	methods: {
		emitValue(checked: boolean): void
		{
			this.$emit('update:modelValue', checked ? BOOL_VALUES.YES : BOOL_VALUES.NO);
		},
		handleToggle(checked: boolean): void
		{
			this.emitValue(checked);
		},
		handleKeyboardToggle(): void
		{
			if (this.disabled)
			{
				return;
			}

			this.emitValue(!this.isChecked);
		},
	},
	template: `
		<div
			class="bizproc-setup-template__switcher-row"
			data-test-id="bizproc-setup-template__form-bool-control"
		>
			<div
				class="bizproc-setup-template__switcher"
				role="switch"
				:tabindex="disabled ? -1 : 0"
				:aria-checked="isChecked ? 'true' : 'false'"
				:aria-labelledby="labelId"
				:aria-describedby="describedbyId || null"
				:aria-invalid="invalid ? 'true' : null"
				:aria-required="required ? 'true' : null"
				:aria-disabled="disabled ? 'true' : null"
				data-test-id="bizproc-setup-template__form-bool-value"
				@keydown.enter.prevent="!$event.repeat && handleKeyboardToggle()"
				@keydown.space.prevent="!$event.repeat && handleKeyboardToggle()"
			>
				<Switcher
					:isChecked="isChecked"
					:isDisabled="disabled"
					:options="SWITCHER_OPTIONS"
					@check="handleToggle(true)"
					@uncheck="handleToggle(false)"
				/>
			</div>
			<div class="bizproc-setup-template__switcher-label" :class="{ '--required': required }">
				<span :id="labelId" class="bizproc-setup-template__label-text">{{ item.name }}</span>
			</div>
		</div>
	`,
};
