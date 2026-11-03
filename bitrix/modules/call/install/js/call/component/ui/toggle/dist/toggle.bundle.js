/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallToggleColors = new Set([null, 'green', 'sky']);
	const CallToggleSizes = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

	const CallToggle = ui_vue3.defineComponent({
		name: 'CallToggle',
		props: {
			testId: {
				type: String,
				required: true
			},
			modelValue: {
				type: null,
				default: undefined
			},
			defaultValue: {
				type: null,
				default: undefined
			},
			name: {
				type: String,
				default: undefined
			},
			disabled: {
				type: Boolean,
				default: false
			},
			trueValue: {
				type: null,
				default: true
			},
			falseValue: {
				type: null,
				default: false
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			inputId: {
				type: String,
				default: null
			},
			size: {
				type: String,
				default: 'md',
				validator: value => CallToggleSizes.has(value)
			},
			color: {
				type: String,
				default: null,
				validator: value => CallToggleColors.has(value)
			}
		},
		emits: ['update:modelValue', 'value-change', 'change', 'focus', 'blur'],
		data() {
			return {
				dataValue: this.defaultValue === undefined ? this.modelValue : this.defaultValue
			};
		},
		computed: {
			inProps() {
				const nodePropKeys = Object.keys(this.$.vnode?.props || {});
				const result = {};
				const props = this.$props;
				for (const key of nodePropKeys) {
					if (key in props) {
						result[key] = props[key];
					}
				}
				return result;
			},
			controlled() {
				return Object.prototype.hasOwnProperty.call(this.inProps, 'modelValue') || !Object.prototype.hasOwnProperty.call(this.inProps, 'modelValue') && !Object.prototype.hasOwnProperty.call(this.inProps, 'defaultValue');
			},
			checked() {
				return this.dataValue === this.trueValue;
			},
			additionalClasses() {
				const classes = [`--${this.size}`];
				if (this.checked) {
					classes.push('--checked');
				}
				if (this.color) {
					classes.push(`--${this.color}`);
				}
				if (this.disabled) {
					classes.push('--disabled');
				}
				return classes;
			}
		},
		watch: {
			modelValue: {
				deep: true,
				handler(newValue) {
					this.dataValue = newValue;
				}
			},
			defaultValue(newValue) {
				this.dataValue = newValue;
			}
		},
		methods: {
			writeValue(value) {
				if (this.controlled) {
					this.dataValue = value;
					this.$emit('update:modelValue', value);
				}
				this.$emit('value-change', value);
			},
			onChange(event) {
				if (this.disabled || this.readOnly) {
					return;
				}
				const newValue = this.checked ? this.falseValue : this.trueValue;
				this.writeValue(newValue);
				this.$emit('change', {
					event,
					value: newValue
				});
			},
			onFocus(event) {
				this.$emit('focus', event);
			},
			onBlur(event) {
				this.$emit('blur', event);
			}
		},
		template: `
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
	`
	});

	exports.CallToggle = CallToggle;
	exports.CallToggleColors = CallToggleColors;
	exports.CallToggleSizes = CallToggleSizes;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=toggle.bundle.js.map
