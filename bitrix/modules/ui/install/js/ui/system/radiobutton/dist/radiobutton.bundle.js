/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core) {
	'use strict';

	const RadioButtonSize = Object.freeze({
		Lg: 'lg',
		Md: 'md',
		Sm: 'sm'
	});

	const RadioButton$1 = {
		name: 'UiRadioButton',
		inheritAttrs: false,
		props: {
			modelValue: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			group: {
				type: String,
				required: true
			},
			size: {
				type: String,
				default: RadioButtonSize.Md,
				validator: value => Object.values(RadioButtonSize).includes(value)
			}
		},
		emits: ['update:modelValue'],
		computed: {
			rootClasses() {
				return ['ui-radio-button', `--size-${this.size}`, {
					'--checked': this.modelValue,
					'--disabled': this.disabled
				}];
			}
		},
		methods: {
			handleChange(event) {
				const input = event.target;
				this.$emit('update:modelValue', input.checked);
			}
		},
		template: `
		<label :class="rootClasses">
			<input
				v-bind="$attrs"
				type="radio"
				class="ui-radio-button__input"
				:name="group"
				:checked="modelValue"
				:disabled="disabled"
				@change="handleChange"
			/>
			<span class="ui-radio-button__box" aria-hidden="true">
				<span v-if="modelValue" class="ui-radio-button__dot"/>
			</span>
		</label>
	`
	};

	var vue = Object.freeze({
		__proto__: null,
		RadioButton: RadioButton$1,
		RadioButtonSize: RadioButtonSize
	});

	const RESERVED_ATTRIBUTES = new Set(['type', 'class', 'name', 'checked', 'disabled']);
	class RadioButton {
		#size;
		#checked;
		#disabled;
		#group;
		#attributes;
		#onChange;
		#wrapper = null;
		#input = null;
		#box = null;
		#dotElement = null;
		constructor(options) {
			if (!main_core.Type.isPlainObject(options) || !main_core.Type.isStringFilled(options.group)) {
				throw new Error('RadioButton: "group" option is required');
			}
			this.#size = options.size ?? RadioButtonSize.Md;
			this.#checked = options.checked === true;
			this.#disabled = options.disabled === true;
			this.#group = options.group;
			this.#attributes = main_core.Type.isPlainObject(options.attributes) ? {
				...options.attributes
			} : {};
			this.#onChange = main_core.Type.isFunction(options.onChange) ? options.onChange : null;
		}
		render() {
			if (this.#wrapper) {
				return this.#wrapper;
			}
			const input = main_core.Tag.render`<input type="radio" class="ui-radio-button__input">`;
			const box = main_core.Tag.render`<span class="ui-radio-button__box" aria-hidden="true"></span>`;
			const dotElement = main_core.Tag.render`<span class="ui-radio-button__dot"></span>`;
			const wrapper = main_core.Tag.render`
			<label class="ui-radio-button">
				${input}
				${box}
			</label>
		`;
			this.#input = input;
			this.#box = box;
			this.#dotElement = dotElement;
			this.#wrapper = wrapper;
			this.#applyUserAttributes();
			this.#applyControlledAttributes();
			this.#updateBoxContent();
			this.#updateModifierClasses();
			this.#bindEvents();
			return wrapper;
		}
		setSize(size) {
			if (!Object.values(RadioButtonSize).includes(size)) {
				return this;
			}
			this.#size = size;
			this.#updateModifierClasses();
			return this;
		}
		getSize() {
			return this.#size;
		}
		setChecked(checked = true) {
			this.#checked = checked === true;
			this.#applyControlledAttributes();
			this.#updateBoxContent();
			this.#updateModifierClasses();
			return this;
		}
		isChecked() {
			return this.#checked;
		}
		setDisabled(disabled = true) {
			this.#disabled = disabled === true;
			this.#applyControlledAttributes();
			this.#updateModifierClasses();
			return this;
		}
		isDisabled() {
			return this.#disabled;
		}
		setOnChange(callback) {
			this.#onChange = main_core.Type.isFunction(callback) ? callback : null;
			return this;
		}
		destroy() {
			if (this.#input) {
				main_core.Event.unbindAll(this.#input);
			}
			if (this.#wrapper) {
				main_core.Dom.remove(this.#wrapper);
			}
			this.#wrapper = null;
			this.#input = null;
			this.#box = null;
			this.#dotElement = null;
		}
		#applyUserAttributes() {
			if (!this.#input) {
				return;
			}
			for (const [key, rawValue] of Object.entries(this.#attributes)) {
				if (RESERVED_ATTRIBUTES.has(key)) {
					continue;
				}
				main_core.Dom.attr(this.#input, key, String(rawValue));
			}
		}
		#applyControlledAttributes() {
			if (!this.#input) {
				return;
			}
			main_core.Dom.attr(this.#input, 'name', this.#group);
			this.#input.checked = this.#checked;
			this.#input.disabled = this.#disabled;
		}
		#updateBoxContent() {
			if (!this.#box || !this.#dotElement) {
				return;
			}
			main_core.Dom.clean(this.#box);
			if (this.#checked) {
				main_core.Dom.append(this.#dotElement, this.#box);
			}
		}
		#updateModifierClasses() {
			if (!this.#wrapper) {
				return;
			}
			const classes = ['ui-radio-button', `--size-${this.#size}`];
			if (this.#checked) {
				classes.push('--checked');
			}
			if (this.#disabled) {
				classes.push('--disabled');
			}
			this.#wrapper.className = classes.join(' ');
		}
		#bindEvents() {
			if (!this.#input) {
				return;
			}
			main_core.Event.bind(this.#input, 'change', this.#handleChange.bind(this));
		}
		#handleChange(event) {
			if (!this.#input) {
				return;
			}
			this.#checked = this.#input.checked;
			this.#updateBoxContent();
			this.#updateModifierClasses();
			this.#applyControlledAttributes();
			if (main_core.Type.isFunction(this.#onChange)) {
				this.#onChange({
					checked: this.#checked,
					event
				});
			}
		}
	}

	exports.RadioButton = RadioButton;
	exports.RadioButtonSize = RadioButtonSize;
	exports.Vue = vue;

})(this.BX.UI.System.RadioButton = this.BX.UI.System.RadioButton || {}, BX);
//# sourceMappingURL=radiobutton.bundle.js.map
