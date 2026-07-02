/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, main_core, ui_iconSet_api_core) {
	'use strict';

	const CheckboxSize = Object.freeze({
		Lg: 'lg',
		Md: 'md',
		Sm: 'sm'
	});

	const Checkbox$1 = {
		name: 'UiCheckbox',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		inheritAttrs: false,
		props: {
			modelValue: {
				type: Boolean,
				default: false
			},
			indeterminate: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			size: {
				type: String,
				default: CheckboxSize.Md,
				validator: value => Object.values(CheckboxSize).includes(value)
			}
		},
		emits: ['update:modelValue', 'update:indeterminate'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			ariaChecked() {
				return this.indeterminate ? 'mixed' : null;
			},
			rootClasses() {
				return ['ui-checkbox', `--size-${this.size}`, {
					'--checked': this.modelValue && !this.indeterminate,
					'--indeterminate': this.indeterminate,
					'--disabled': this.disabled
				}];
			}
		},
		mounted() {
			this.syncIndeterminate();
		},
		updated() {
			this.syncIndeterminate();
		},
		methods: {
			syncIndeterminate() {
				const input = this.$refs.input;
				if (input) {
					input.indeterminate = this.indeterminate;
				}
			},
			handleChange(event) {
				const input = event.target;
				if (this.indeterminate) {
					input.checked = true;
					this.$emit('update:indeterminate', false);
					this.$emit('update:modelValue', true);
					return;
				}
				this.$emit('update:modelValue', input.checked);
			}
		},
		template: `
		<label :class="rootClasses">
			<input
				v-bind="$attrs"
				ref="input"
				type="checkbox"
				class="ui-checkbox__input"
				:checked="modelValue"
				:disabled="disabled"
				:aria-checked="ariaChecked"
				@change="handleChange"
			/>
			<span class="ui-checkbox__box" aria-hidden="true">
				<span v-if="indeterminate" class="ui-checkbox__dash"/>
				<BIcon v-else-if="modelValue" class="ui-checkbox__icon" :name="Outline.CHECK_M"/>
			</span>
		</label>
	`
	};

	var vue = Object.freeze({
		__proto__: null,
		Checkbox: Checkbox$1,
		CheckboxSize: CheckboxSize
	});

	const RESERVED_ATTRIBUTES = new Set(['type', 'class', 'checked', 'disabled', 'indeterminate']);
	class Checkbox {
		#size;
		#checked;
		#indeterminate;
		#disabled;
		#attributes;
		#onChange;
		#wrapper = null;
		#input = null;
		#box = null;
		#iconElement = null;
		#dashElement = null;
		constructor(options = {}) {
			this.#size = options.size ?? CheckboxSize.Md;
			this.#checked = options.checked === true;
			this.#indeterminate = options.indeterminate === true;
			this.#disabled = options.disabled === true;
			this.#attributes = main_core.Type.isPlainObject(options.attributes) ? {
				...options.attributes
			} : {};
			this.#onChange = main_core.Type.isFunction(options.onChange) ? options.onChange : null;
		}
		render() {
			if (this.#wrapper) {
				return this.#wrapper;
			}
			const input = main_core.Tag.render`<input type="checkbox" class="ui-checkbox__input">`;
			const box = main_core.Tag.render`<span class="ui-checkbox__box" aria-hidden="true"></span>`;
			const dashElement = main_core.Tag.render`<span class="ui-checkbox__dash"></span>`;
			const iconElement = main_core.Tag.render`<span class="ui-checkbox__icon"></span>`;
			new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CHECK_M
			}).renderTo(iconElement);
			const wrapper = main_core.Tag.render`
			<label class="ui-checkbox">
				${input}
				${box}
			</label>
		`;
			this.#input = input;
			this.#box = box;
			this.#dashElement = dashElement;
			this.#iconElement = iconElement;
			this.#wrapper = wrapper;
			this.#applyUserAttributes();
			this.#applyControlledAttributes();
			this.#updateBoxContent();
			this.#updateModifierClasses();
			this.#bindEvents();
			return wrapper;
		}
		setSize(size) {
			if (!Object.values(CheckboxSize).includes(size)) {
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
			if (this.#checked) {
				this.#indeterminate = false;
			}
			this.#applyControlledAttributes();
			this.#updateBoxContent();
			this.#updateModifierClasses();
			return this;
		}
		isChecked() {
			return this.#checked;
		}
		setIndeterminate(flag = true) {
			this.#indeterminate = flag === true;
			this.#applyControlledAttributes();
			this.#updateBoxContent();
			this.#updateModifierClasses();
			return this;
		}
		isIndeterminate() {
			return this.#indeterminate;
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
			this.#iconElement = null;
			this.#dashElement = null;
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
			this.#input.checked = this.#checked;
			this.#input.disabled = this.#disabled;
			this.#input.indeterminate = this.#indeterminate;
			main_core.Dom.attr(this.#input, 'aria-checked', this.#indeterminate ? 'mixed' : null);
		}
		#updateBoxContent() {
			if (!this.#box || !this.#iconElement || !this.#dashElement) {
				return;
			}
			main_core.Dom.clean(this.#box);
			if (this.#indeterminate) {
				main_core.Dom.append(this.#dashElement, this.#box);
			} else if (this.#checked) {
				main_core.Dom.append(this.#iconElement, this.#box);
			}
		}
		#updateModifierClasses() {
			if (!this.#wrapper) {
				return;
			}
			const classes = ['ui-checkbox', `--size-${this.#size}`];
			if (this.#checked && !this.#indeterminate) {
				classes.push('--checked');
			}
			if (this.#indeterminate) {
				classes.push('--indeterminate');
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
			if (this.#indeterminate) {
				this.#input.checked = true;
				this.#checked = true;
			} else {
				this.#checked = this.#input.checked;
			}
			this.#indeterminate = false;
			this.#input.indeterminate = false;
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

	exports.Checkbox = Checkbox;
	exports.CheckboxSize = CheckboxSize;
	exports.Vue = vue;

})(this.BX.UI.System.Checkbox = this.BX.UI.System.Checkbox || {}, BX.UI.IconSet, window, BX, BX.UI.IconSet);
//# sourceMappingURL=checkbox.bundle.js.map
