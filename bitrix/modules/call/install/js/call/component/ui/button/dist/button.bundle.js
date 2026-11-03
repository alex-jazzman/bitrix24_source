/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallButtonSizes = new Set([20, 24, 28, 34, 38, 46, 54]);
	const CallButtonColors = new Set(['blue', 'red', 'green', 'purple', 'transparent', 'transparent-blue', 'transparent-yellow', 'transparent-red', 'transparent-black', 'gradient', 'copilot', 'hangup', 'none']);
	const CallButtonVariants = new Set(['primary', 'tine', 'outline']);
	const CallButtonLabelPositions = new Set(['inline', 'bottom', 'bottom-block']);

	const isNativeHandlerKey = key => /^on[a-z]/.test(key);
	const CallButton = ui_vue3.defineComponent({
		name: 'CallButton',
		inheritAttrs: false,
		props: {
			testId: {
				type: String,
				default: null,
				required: true
			},
			testState: {
				type: String,
				default: null
			},
			testMeta: {
				type: String,
				default: null
			},
			label: {
				type: String,
				default: null
			},
			labelPosition: {
				type: String,
				default: 'inline',
				validator: value => CallButtonLabelPositions.has(value)
			},
			disabled: {
				type: Boolean,
				default: false
			},
			cornerDisabled: {
				type: Boolean,
				default: false
			},
			readonly: {
				type: Boolean,
				default: false
			},
			cornerReadonly: {
				type: Boolean,
				default: false
			},
			square: {
				type: Boolean,
				default: false
			},
			hug: {
				type: Boolean,
				default: true
			},
			size: {
				type: Number,
				default: 28,
				validator: value => CallButtonSizes.has(value)
			},
			width: {
				type: Number,
				default: null
			},
			corner: {
				type: Boolean,
				default: false
			},
			circle: {
				type: Boolean,
				default: false
			},
			animated: {
				type: Boolean,
				default: false
			},
			border: {
				type: Boolean,
				default: false
			},
			color: {
				type: String,
				default: 'blue',
				validator: value => CallButtonColors.has(value)
			},
			variant: {
				type: String,
				default: 'primary',
				validator: value => CallButtonVariants.has(value)
			},
			collapsed: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click', 'corner-click'],
		computed: {
			rootClasses() {
				const classes = [`--${this.variant}`];
				if (this.corner || this.$slots.corner) {
					classes.push('--corner');
				}
				if (this.$slots.badge) {
					classes.push('--with-badge');
				}
				if (this.border) {
					classes.push('--border');
				}
				if (this.color) {
					classes.push(`--${this.color}`);
				}
				if (this.square) {
					classes.push('--square');
				}
				if (this.circle) {
					classes.push('--circle');
				}
				if (!this.hug) {
					classes.push('--full-width');
				}
				if (this.animated) {
					classes.push('--animated');
				}
				if (this.readonly) {
					classes.push('--readonly');
				}
				if (this.labelPosition === 'bottom' && this.label) {
					classes.push('--label-bottom');
				}
				if (this.labelPosition === 'bottom-block' && this.label) {
					classes.push('--label-bottom-block');
				}
				return classes;
			},
			hasBottomLabel() {
				return (this.labelPosition === 'bottom' || this.labelPosition === 'bottom-block') && Boolean(this.label);
			},
			hasInlineLabel() {
				return this.labelPosition === 'inline' && Boolean(this.label) && !this.collapsed;
			},
			hasVisibleLabel() {
				return this.hasBottomLabel && !this.collapsed || this.hasInlineLabel && !this.$slots.default;
			},
			rootAttrs() {
				return {
					class: this.$attrs.class,
					style: this.$attrs.style
				};
			},
			dropsExternalAriaLabel() {
				return this.hasVisibleLabel && 'aria-label' in this.$attrs;
			},
			buttonAttrs() {
				const attrs = {
					type: 'button',
					...this.$attrs
				};
				delete attrs.class;
				delete attrs.style;
				Object.keys(attrs).forEach(key => {
					if (isNativeHandlerKey(key)) {
						delete attrs[key];
					}
				});
				if (this.dropsExternalAriaLabel) {
					delete attrs['aria-label'];
				}
				return attrs;
			},
			isUnavailable() {
				return this.disabled || this.readonly;
			},
			bodyClasses() {
				const classes = [];
				if (this.disabled) {
					classes.push('--disabled');
				}
				return classes;
			},
			cornerClasses() {
				const classes = [];
				if (this.cornerDisabled) {
					classes.push('--disabled');
				}
				if (this.cornerReadonly) {
					classes.push('--readonly');
				}
				return classes;
			},
			additionalStyles() {
				return {
					'--call-button-width': this.width ? `${this.width}px` : null
				};
			},
			bodyTestState() {
				const tokens = this.testState ? this.testState.split(/\s+/).filter(Boolean) : [];
				if (this.disabled && !tokens.includes('disabled')) {
					tokens.push('disabled');
				}
				if (this.readonly && !tokens.includes('readonly')) {
					tokens.push('readonly');
				}
				return tokens.length > 0 ? tokens.join(' ') : null;
			},
			cornerTestState() {
				const tokens = [];
				if (this.cornerDisabled) {
					tokens.push('disabled');
				}
				if (this.cornerReadonly) {
					tokens.push('readonly');
				}
				return tokens.length > 0 ? tokens.join(' ') : null;
			}
		},
		watch: {
			dropsExternalAriaLabel: {
				immediate: true,
				handler(dropped) {
					if (dropped) {
						console.warn('[CallButton] aria-label is dropped: the visible label is the accessible name.');
					}
				}
			}
		},
		methods: {
			onClick(event) {
				if (this.isUnavailable) {
					return;
				}
				this.$emit('click', event);
			},
			onCornerClick(event) {
				if (this.cornerDisabled || this.cornerReadonly) {
					return;
				}
				this.$emit('corner-click', event);
			}
		},
		template: `
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
	`
	});

	const CallButtonGroup = ui_vue3.defineComponent({
		name: 'CallButtonGroup',
		template: `
		<span class="call-button-group">
			<slot></slot>
		</span>
	`
	});

	const CallButtonSplit = ui_vue3.defineComponent({
		name: 'CallButtonSplit',
		props: {
			testId: {
				type: String,
				default: null
			}
		},
		template: `
		<span class="call-button-split" :data-testid="testId">
			<slot></slot>
		</span>
	`
	});

	exports.CallButton = CallButton;
	exports.CallButtonColors = CallButtonColors;
	exports.CallButtonGroup = CallButtonGroup;
	exports.CallButtonLabelPositions = CallButtonLabelPositions;
	exports.CallButtonSizes = CallButtonSizes;
	exports.CallButtonSplit = CallButtonSplit;
	exports.CallButtonVariants = CallButtonVariants;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=button.bundle.js.map
