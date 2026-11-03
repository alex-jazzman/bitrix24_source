import { defineComponent } from 'ui.vue3';

import { CallButtonSizes, CallButtonColors, CallButtonVariants, CallButtonLabelPositions } from './const';

import './css/button.css';

// Mirrors Vue's isNativeOn: a string under `on` + lowercase key goes to setAttribute and turns into live
// inline code. Vue routes its own listeners by isOn (`on` + non-lowercase), so the two never overlap.
const isNativeHandlerKey = (key: string): boolean => /^on[a-z]/.test(key);

export const CallButton = defineComponent({
	name: 'CallButton',
	inheritAttrs: false,
	props: {
		testId: {
			type: String,
			default: null,
			required: true,
		},
		testState: {
			type: String,
			default: null,
		},
		testMeta: {
			type: String,
			default: null,
		},
		label: {
			type: String,
			default: null,
		},
		labelPosition: {
			type: String,
			default: 'inline',
			validator: (value: string): boolean => (CallButtonLabelPositions as ReadonlySet<string>).has(value),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		cornerDisabled: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		cornerReadonly: {
			type: Boolean,
			default: false,
		},
		square: {
			type: Boolean,
			default: false,
		},
		hug: {
			type: Boolean,
			default: true,
		},
		size: {
			type: Number,
			default: 28,
			validator: (value: number): boolean => (CallButtonSizes as ReadonlySet<number>).has(value),
		},
		width: {
			type: Number,
			default: null,
		},
		corner: {
			type: Boolean,
			default: false,
		},
		circle: {
			type: Boolean,
			default: false,
		},
		animated: {
			type: Boolean,
			default: false,
		},
		border: {
			type: Boolean,
			default: false,
		},
		color: {
			type: String,
			default: 'blue',
			validator: (value: string): boolean => (CallButtonColors as ReadonlySet<string>).has(value),
		},
		variant: {
			type: String,
			default: 'primary',
			validator: (value: string): boolean => (CallButtonVariants as ReadonlySet<string>).has(value),
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click', 'corner-click'],
	computed: {
		rootClasses(): string[]
		{
			const classes: string[] = [`--${this.variant}`];

			if (this.corner || this.$slots.corner)
			{
				classes.push('--corner');
			}

			if (this.$slots.badge)
			{
				classes.push('--with-badge');
			}

			if (this.border)
			{
				classes.push('--border');
			}

			if (this.color)
			{
				classes.push(`--${this.color}`);
			}

			if (this.square)
			{
				classes.push('--square');
			}

			if (this.circle)
			{
				classes.push('--circle');
			}

			if (!this.hug)
			{
				classes.push('--full-width');
			}

			if (this.animated)
			{
				classes.push('--animated');
			}

			if (this.readonly)
			{
				classes.push('--readonly');
			}

			if (this.labelPosition === 'bottom' && this.label)
			{
				classes.push('--label-bottom');
			}

			if (this.labelPosition === 'bottom-block' && this.label)
			{
				classes.push('--label-bottom-block');
			}

			return classes;
		},
		hasBottomLabel(): boolean
		{
			return (this.labelPosition === 'bottom' || this.labelPosition === 'bottom-block') && Boolean(this.label);
		},
		hasInlineLabel(): boolean
		{
			return this.labelPosition === 'inline' && Boolean(this.label) && !this.collapsed;
		},
		// Single source of truth for "the label is on screen": both label templates render under it.
		hasVisibleLabel(): boolean
		{
			return (this.hasBottomLabel && !this.collapsed) || (this.hasInlineLabel && !this.$slots.default);
		},
		rootAttrs(): Record<string, unknown>
		{
			return {
				class: this.$attrs.class,
				style: this.$attrs.style,
			};
		},
		dropsExternalAriaLabel(): boolean
		{
			return this.hasVisibleLabel && 'aria-label' in this.$attrs;
		},
		buttonAttrs(): Record<string, unknown>
		{
			// A native button submits its form unless typed, and the consumer may still ask for another type.
			const attrs: Record<string, unknown> = { type: 'button', ...this.$attrs };
			delete attrs.class;
			delete attrs.style;

			Object.keys(attrs).forEach((key) => {
				if (isNativeHandlerKey(key))
				{
					delete attrs[key];
				}
			});

			if (this.dropsExternalAriaLabel)
			{
				delete attrs['aria-label'];
			}

			return attrs;
		},
		// Single source of truth for "the button refuses the click": both props block it, so both must be announced.
		isUnavailable(): boolean
		{
			return this.disabled || this.readonly;
		},
		bodyClasses(): string[]
		{
			const classes: string[] = [];

			if (this.disabled)
			{
				classes.push('--disabled');
			}

			return classes;
		},
		cornerClasses(): string[]
		{
			const classes: string[] = [];

			if (this.cornerDisabled)
			{
				classes.push('--disabled');
			}

			if (this.cornerReadonly)
			{
				classes.push('--readonly');
			}

			return classes;
		},
		additionalStyles(): Record<string, string | null>
		{
			return {
				'--call-button-width': this.width ? `${this.width}px` : null,
			};
		},
		bodyTestState(): string | null
		{
			const tokens: string[] = this.testState ? this.testState.split(/\s+/).filter(Boolean) : [];

			if (this.disabled && !tokens.includes('disabled'))
			{
				tokens.push('disabled');
			}

			if (this.readonly && !tokens.includes('readonly'))
			{
				tokens.push('readonly');
			}

			return tokens.length > 0 ? tokens.join(' ') : null;
		},
		cornerTestState(): string | null
		{
			const tokens: string[] = [];

			if (this.cornerDisabled)
			{
				tokens.push('disabled');
			}

			if (this.cornerReadonly)
			{
				tokens.push('readonly');
			}

			return tokens.length > 0 ? tokens.join(' ') : null;
		},
	},
	watch: {
		// A getter only computes: the warning belongs to the state being entered, not to every recompute.
		dropsExternalAriaLabel: {
			immediate: true,
			handler(dropped: boolean): void
			{
				if (dropped)
				{
					// eslint-disable-next-line no-console
					console.warn('[CallButton] aria-label is dropped: the visible label is the accessible name.');
				}
			},
		},
	},
	methods: {
		onClick(event: MouseEvent): void
		{
			if (this.isUnavailable)
			{
				return;
			}

			this.$emit('click', event);
		},
		onCornerClick(event: MouseEvent): void
		{
			if (this.cornerDisabled || this.cornerReadonly)
			{
				return;
			}

			this.$emit('corner-click', event);
		},
	},
	template: /* HTML */`
		<div class="call-button" :class="rootClasses" :data-size="String(size)" :style="additionalStyles" v-bind="rootAttrs">
			<button
				v-bind="buttonAttrs"
				:data-testid="testId"
				:data-test-state="bodyTestState"
				:data-test-meta="testMeta"
				class="call-button__body"
				:class="bodyClasses"
				:aria-disabled="isUnavailable ? 'true' : null"
				@click="onClick"
			>
				<span class="call-button__content">
					<slot name="prepend"></slot>
					<slot>
						<span v-if="hasVisibleLabel && hasInlineLabel" class="call-button__label">{{ label }}</span>
					</slot>
					<slot name="append"></slot>
				</span>
				<span v-if="hasVisibleLabel && hasBottomLabel" class="call-button__label-bottom">{{ label }}</span>
			</button>
			<div v-if="$slots.badge" :data-testid="testId + '-badge'" class="call-button__badge">
				<slot name="badge"></slot>
			</div>
			<div
				v-if="$slots.corner || corner"
				:data-testid="testId + '-corner'"
				:data-test-state="cornerTestState"
				class="call-button__corner"
				:class="cornerClasses"
				@click="onCornerClick"
			>
				<slot name="corner"></slot>
			</div>
		</div>
	`,
});
