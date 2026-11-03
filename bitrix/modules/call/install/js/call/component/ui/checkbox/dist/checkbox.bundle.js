/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_icon) {
	'use strict';

	const CallCheckboxSizes = new Set(['sm', 'md', 'lg']);
	const CallCheckboxColors = new Set([null, 'green']);

	const CallCheckbox = ui_vue3.defineComponent({
		name: 'CallCheckbox',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
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
			indeterminate: {
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
				validator: value => CallCheckboxSizes.has(value)
			},
			color: {
				type: String,
				default: null,
				validator: value => CallCheckboxColors.has(value)
			}
		},
		emits: ['update:modelValue', 'value-change', 'change', 'focus', 'blur', 'update:indeterminate'],
		data() {
			return {
				dataValue: this.defaultValue === undefined ? this.modelValue : this.defaultValue,
				indeterminateValue: this.indeterminate
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
				if (this.checked) {
					classes.push('--checked');
				}
				if (this.indeterminateValue) {
					classes.push('--indeterminate');
				}
				if (this.color) {
					classes.push(`--${this.color}`);
				}
				if (this.disabled) {
					classes.push('--disabled');
				}
				return classes;
			},
			checked() {
				return this.indeterminateValue ? false : this.dataValue === this.trueValue;
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
			},
			indeterminate(newValue) {
				this.indeterminateValue = newValue;
				this.updateIndeterminate();
			}
		},
		mounted() {
			this.$nextTick(() => {
				this.updateIndeterminate();
			});
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
				const newValue = this.indeterminateValue ? this.trueValue : this.checked ? this.falseValue : this.trueValue;
				if (this.indeterminateValue) {
					this.indeterminateValue = false;
					this.$emit('update:indeterminate', this.indeterminateValue);
				}
				this.writeValue(newValue);
				this.$emit('change', event);
			},
			onFocus(event) {
				this.$emit('focus', event);
			},
			onBlur(event) {
				this.$emit('blur', event);
			},
			updateIndeterminate() {
				const input = this.$refs.input;
				if (input && input.indeterminate !== this.indeterminateValue) {
					input.indeterminate = this.indeterminateValue;
				}
			}
		},
		template: `
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
	`
	});

	exports.CallCheckbox = CallCheckbox;
	exports.CallCheckboxColors = CallCheckboxColors;
	exports.CallCheckboxSizes = CallCheckboxSizes;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3, BX.Call.Component.Ui);
//# sourceMappingURL=checkbox.bundle.js.map
