import { defineComponent } from 'ui.vue3';

import { CallToggleColors, CallToggleSizes } from './const';

import './css/toggle.css';

export const CallToggle = defineComponent({
	name: 'CallToggle',
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
			validator: (value: string): boolean => (CallToggleSizes as ReadonlySet<string>).has(value),
		},
		color: {
			type: String,
			default: null,
			validator: (value: string | null): boolean => (CallToggleColors as ReadonlySet<string | null>).has(value),
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
		checked(): boolean
		{
			return this.dataValue === this.trueValue;
		},
		additionalClasses(): string[]
		{
			const classes: string[] = [`--${this.size}`];

			if (this.checked)
			{
				classes.push('--checked');
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

			const newValue: unknown = this.checked ? this.falseValue : this.trueValue;

			this.writeValue(newValue);
			this.$emit('change', { event, value: newValue });
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
		<div class="call-toggle" :class="additionalClasses">
			<input
				:id="inputId"
				:data-test-id="testId"
				type="checkbox"
				:checked="checked"
				:disabled="disabled"
				:readonly="readOnly"
				:name="name"
				@focus="onFocus"
				@blur="onBlur"
				@change="onChange"
			>
			<div class="call-toggle-slider">
				<div class="call-toggle-handle">
					<slot></slot>
				</div>
			</div>
		</div>
	`,
});
