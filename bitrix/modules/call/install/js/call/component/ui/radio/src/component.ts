import { defineComponent } from 'ui.vue3';

import { CallRadioSizes, CallRadioColors } from './const';

import './css/radio.css';

export const CallRadio = defineComponent({
	name: 'CallRadio',
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
		value: {
			type: null,
			default: undefined,
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
			validator: (value: string): boolean => (CallRadioSizes as ReadonlySet<string>).has(value),
		},
		color: {
			type: String,
			default: null,
			validator: (value: string | null): boolean => (CallRadioColors as ReadonlySet<string | null>).has(value),
		},
	},
	emits: ['update:modelValue', 'value-change', 'change', 'focus', 'blur'],
	data(): { dataValue: unknown }
	{
		return {
			dataValue: this.defaultValue === undefined ? this.modelValue : this.defaultValue,
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

			if (this.disabled)
			{
				classes.push('--disabled');
			}

			if (this.checked)
			{
				classes.push('--checked');
			}

			if (this.color)
			{
				classes.push(`--${this.color}`);
			}

			return classes;
		},
		checked(): boolean
		{
			return this.value !== undefined && this.dataValue === this.value;
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

			if (this.dataValue !== this.value)
			{
				this.writeValue(this.value);
				this.$emit('change', event);
			}
		},
		onFocus(event: FocusEvent): void
		{
			this.$emit('focus', event);
		},
		onBlur(event: FocusEvent): void
		{
			this.$emit('blur', event);
		},
	},
	template: /* HTML */`
		<div class="call-radio" :class="additionalClasses">
			<input
				type="radio"
				:id="inputId"
				:data-test-id="testId"
				:value="value"
				:checked="checked"
				:readonly="readOnly"
				:disabled="disabled"
				:name="name"
				@change="onChange"
				@focus="onFocus"
				@blur="onBlur"
			>
			<div class="call-radio-box"/>
		</div>
	`,
});
