import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';

import { CallCheckboxColors, CallCheckboxSizes } from './const';

import './css/checkbox.css';

export const CallCheckbox = defineComponent({
	name: 'CallCheckbox',
	components: { CallIcon },
	props: {
		testId: {
			type: String,
			required: true,
		},
		modelValue: {
			type: null,
			default: undefined,
		},
		defaultValue: {
			type: null,
			default: undefined,
		},
		name: {
			type: String,
			default: undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		indeterminate: {
			type: Boolean,
			default: false,
		},
		trueValue: {
			type: null,
			default: true,
		},
		falseValue: {
			type: null,
			default: false,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		inputId: {
			type: String,
			default: null,
		},
		size: {
			type: String,
			default: 'md',
			validator: (value: string): boolean => (CallCheckboxSizes as ReadonlySet<string>).has(value),
		},
		color: {
			type: String,
			default: null,
			validator: (value: string | null): boolean => (CallCheckboxColors as ReadonlySet<string | null>).has(value),
		},
	},
	emits: ['update:modelValue', 'value-change', 'change', 'focus', 'blur', 'update:indeterminate'],
	data(): { dataValue: unknown; indeterminateValue: boolean }
	{
		return {
			dataValue: this.defaultValue === undefined ? this.modelValue : this.defaultValue,
			indeterminateValue: this.indeterminate,
		};
	},
	computed: {
		inProps(): Record<string, unknown>
		{
			const nodePropKeys = Object.keys(this.$.vnode?.props || {});

			const result: Record<string, unknown> = {};
			const props = this.$props as Record<string, unknown>;
			for (const key of nodePropKeys)
			{
				if (key in props)
				{
					result[key] = props[key];
				}
			}

			return result;
		},
		controlled(): boolean
		{
			return (
				Object.prototype.hasOwnProperty.call(this.inProps, 'modelValue')
				|| (
					!Object.prototype.hasOwnProperty.call(this.inProps, 'modelValue')
					&& !Object.prototype.hasOwnProperty.call(this.inProps, 'defaultValue')
				)
			);
		},
		additionalClasses(): string[]
		{
			const classes: string[] = [`--${this.size}`];

			if (this.checked)
			{
				classes.push('--checked');
			}

			if (this.indeterminateValue)
			{
				classes.push('--indeterminate');
			}

			if (this.color)
			{
				classes.push(`--${this.color}`);
			}

			if (this.disabled)
			{
				classes.push('--disabled');
			}

			return classes;
		},
		checked(): boolean
		{
			return this.indeterminateValue ? false : this.dataValue === this.trueValue;
		},
	},
	watch: {
		modelValue: {
			deep: true,
			handler(newValue: unknown): void
			{
				this.dataValue = newValue;
			},
		},
		defaultValue(newValue: unknown): void
		{
			this.dataValue = newValue;
		},
		indeterminate(newValue: boolean): void
		{
			this.indeterminateValue = newValue;
			this.updateIndeterminate();
		},
	},
	mounted(): void
	{
		this.$nextTick(() =>
		{
			this.updateIndeterminate();
		});
	},
	methods: {
		writeValue(value: unknown): void
		{
			if (this.controlled)
			{
				this.dataValue = value;
				this.$emit('update:modelValue', value);
			}

			this.$emit('value-change', value);
		},
		onChange(event: Event): void
		{
			if (this.disabled || this.readOnly)
			{
				return;
			}

			const newValue: unknown = this.indeterminateValue
				? this.trueValue
				: this.checked
					? this.falseValue
					: this.trueValue
			;

			if (this.indeterminateValue)
			{
				this.indeterminateValue = false;
				this.$emit('update:indeterminate', this.indeterminateValue);
			}

			this.writeValue(newValue);
			this.$emit('change', event);
		},
		onFocus(event: FocusEvent): void
		{
			this.$emit('focus', event);
		},
		onBlur(event: FocusEvent): void
		{
			this.$emit('blur', event);
		},
		updateIndeterminate(): void
		{
			const input = this.$refs.input as HTMLInputElement | null;

			if (input && input.indeterminate !== this.indeterminateValue)
			{
				input.indeterminate = this.indeterminateValue;
			}
		},
	},
	template: /* HTML */`
		<div class="call-checkbox" :class="additionalClasses">
			<input
				ref="input"
				type="checkbox"
				:id="inputId"
				:data-test-id="testId"
				:checked="checked"
				:readonly="readOnly"
				:disabled="disabled"
				:name="name"
				@change="onChange"
				@focus="onFocus"
				@blur="onBlur"
			>
			<div class="call-checkbox-box">
				<slot>
					<CallIcon v-if="checked" icon="check" size="xs"></CallIcon>
					<CallIcon v-else-if="indeterminateValue" icon="minus" size="xs"></CallIcon>
				</slot>
			</div>
		</div>
	`,
});
