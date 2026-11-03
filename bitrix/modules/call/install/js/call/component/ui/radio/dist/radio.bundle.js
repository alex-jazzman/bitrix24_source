/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallRadioSizes = new Set(['sm', 'md', 'lg']);
	const CallRadioColors = new Set([null, 'green']);

	const CallRadio = ui_vue3.defineComponent({
		name: 'CallRadio',
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
			value: {
				type: null,
				default: undefined
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
				validator: value => CallRadioSizes.has(value)
			},
			color: {
				type: String,
				default: null,
				validator: value => CallRadioColors.has(value)
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
			additionalClasses() {
				const classes = [`--${this.size}`];
				if (this.disabled) {
					classes.push('--disabled');
				}
				if (this.checked) {
					classes.push('--checked');
				}
				if (this.color) {
					classes.push(`--${this.color}`);
				}
				return classes;
			},
			checked() {
				return this.value !== undefined && this.dataValue === this.value;
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
				if (this.dataValue !== this.value) {
					this.writeValue(this.value);
					this.$emit('change', event);
				}
			},
			onFocus(event) {
				this.$emit('focus', event);
			},
			onBlur(event) {
				this.$emit('blur', event);
			}
		},
		template: `
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
	`
	});

	exports.CallRadio = CallRadio;
	exports.CallRadioColors = CallRadioColors;
	exports.CallRadioSizes = CallRadioSizes;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=radio.bundle.js.map
