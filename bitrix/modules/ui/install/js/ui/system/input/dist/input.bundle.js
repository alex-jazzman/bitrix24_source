/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, ui_system_chip_vue, ui_iconSet_api_vue, ui_iconSet_outline, ui_hint, main_core, ui_iconSet_api_core, ui_system_chip) {
	'use strict';

	const InputSize = Object.freeze({
		Lg: 'l',
		Md: 'm',
		Sm: 's'
	});
	const InputDesign = Object.freeze({
		Primary: 'primary',
		Grey: 'grey',
		LightGrey: 'light-grey',
		Disabled: 'disabled',
		Naked: 'naked'
	});

	// @vue/component
	const BInput = {
		name: 'BInput',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Chip: ui_system_chip_vue.Chip
		},
		expose: ['focus'],
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			rowsQuantity: {
				type: Number,
				default: 1
			},
			resize: {
				type: String,
				default: 'both',
				validator: value => ['none', 'both', 'horizontal', 'vertical'].includes(value)
			},
			label: {
				type: String,
				default: ''
			},
			labelInline: {
				type: Boolean,
				default: false
			},
			placeholder: {
				type: String,
				default: ''
			},
			error: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: InputSize.Lg
			},
			design: {
				type: String,
				default: InputDesign.Grey
			},
			icon: {
				type: String,
				default: ''
			},
			/**
			 * @type ChipProps[]
			 */
			chips: {
				type: Array,
				default: null
			},
			center: {
				type: Boolean,
				default: false
			},
			withSearch: {
				type: Boolean,
				default: false
			},
			withClear: {
				type: Boolean,
				default: false
			},
			dropdown: {
				type: Boolean,
				default: false
			},
			clickable: {
				type: Boolean,
				default: false
			},
			stretched: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			readonly: {
				type: Boolean,
				default: false
			},
			type: {
				type: String,
				default: 'text'
			},
			required: {
				type: Boolean,
				default: false
			},
			copyable: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue', 'click', 'focus', 'blur', 'input', 'clear', 'chipClick', 'chipClear'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign
			};
		},
		data() {
			return {
				focused: false,
				passwordVisible: false
			};
		},
		computed: {
			value: {
				get() {
					return this.modelValue;
				},
				set(value) {
					this.$emit('update:modelValue', value);
				}
			},
			disabled() {
				return this.design === InputDesign.Disabled;
			},
			chipSize() {
				return {
					[InputSize.Lg]: ui_system_chip_vue.ChipSize.Md,
					[InputSize.Md]: ui_system_chip_vue.ChipSize.Md,
					[InputSize.Sm]: ui_system_chip_vue.ChipSize.Xs
				}[this.size];
			},
			currentInputType() {
				if (this.type === 'password' && this.passwordVisible) {
					return 'text';
				}
				return this.type;
			},
			passwordToggleAriaLabel() {
				const key = this.passwordVisible ? 'UI_SYSTEM_INPUT_HIDE_PASSWORD_ARIA' : 'UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA';
				return this.$Bitrix.Loc.getMessage(key);
			}
		},
		mounted() {
			if (this.active && !this.clickable) {
				this.focus();
			}
		},
		methods: {
			focus() {
				this.$refs.input?.focus({
					preventScroll: true
				});
			},
			handleClick(event) {
				if (!this.clickable) {
					this.$refs.input.focus();
				}
				this.$emit('click', event);
			},
			handleFocus(event) {
				if (this.clickable) {
					event.target.blur();
					return;
				}
				this.focused = true;
				this.$emit('focus', event);
			},
			handleBlur(event) {
				this.focused = false;
				this.$emit('blur', event);
			},
			togglePasswordVisibility() {
				this.passwordVisible = !this.passwordVisible;
			},
			handleCopy() {
				if (!this.modelValue) {
					return;
				}
				const showHint = () => {
					const button = this.$refs.copyButton;
					if (button) {
						BX.UI.Hint.show(button, this.$Bitrix.Loc.getMessage('UI_SYSTEM_INPUT_COPIED'));
						setTimeout(() => {
							BX.UI.Hint.hide(button);
						}, 1500);
					}
				};
				if (navigator.clipboard && window.isSecureContext) {
					navigator.clipboard.writeText(this.modelValue).then(() => showHint());
				} else if (BX.clipboard?.copy(this.modelValue)) {
					showHint();
				}
			}
		},
		template: `
		<div
			class="ui-system-input"
			:class="[
				'--' + design,
				'--' + size,
				{
					'--center': center,
					'--with-chips': chips?.length > 0,
					'--clickable': clickable,
					'--stretched': stretched,
					'--active': active || focused,
					'--error': error && !disabled,
					'--readonly': readonly,
				},
			]">
			<div v-if="label" class="ui-system-input-label" :class="{ '--inline': labelInline }">{{ label }}<span v-if="required" class="ui-system-input-label-required">*</span></div>
			<div class="ui-system-input-container" ref="inputContainer" @click="handleClick">
				<div v-if="chips?.length > 0" class="ui-system-input-chips">
					<div v-for="chip in chips" class="ui-system-input-chip">
						<Chip
							v-bind="chip"
							:design="disabled ? ChipDesign.Disabled : chip.design"
							:size="chipSize"
							@click="$emit('chipClick', chip)"
							@clear="$emit('chipClear', chip)"
						/>
					</div>
				</div>
				<BIcon v-if="icon" class="ui-system-input-icon" :name="icon"/>
				<textarea
					v-if="rowsQuantity > 1"
					v-model="value"
					class="ui-system-input-value --multi"
					:style="{ resize }"
					:placeholder
					:disabled
					:rows="rowsQuantity"
					:readonly
					ref="input"
					@focus="handleFocus"
					@blur="handleBlur"
					@input="$emit('input', $event)"
				/>
				<input
					v-else
					v-model="value"
					class="ui-system-input-value"
					:style="{ '--placeholder-length': placeholder.length + 'ch' }"
					:placeholder
					:disabled
					:type="currentInputType"
					:readonly
					ref="input"
					@focus="handleFocus"
					@blur="handleBlur"
					@input="$emit('input', $event)"
				/>
				<button
					v-if="copyable"
					ref="copyButton"
					type="button"
					tabindex="0"
					class="ui-system-input-action-btn --ui-hoverable-overlay"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('UI_SYSTEM_INPUT_COPY_TO_CLIPBOARD_ARIA')"
					@click.stop="handleCopy"
				>
					<BIcon :name="Outline.COPY"/>
				</button>
				<button
					v-if="type === 'password'"
					type="button"
					tabindex="0"
					class="ui-system-input-action-btn --ui-hoverable-overlay"
					:disabled="disabled"
					:aria-label="passwordToggleAriaLabel"
					@click.stop="togglePasswordVisibility"
				>
					<BIcon :name="passwordVisible ? Outline.CROSSED_EYE : Outline.OBSERVER"/>
				</button>
				<BIcon v-if="withSearch" class="ui-system-input-cross" :name="Outline.SEARCH"/>
				<BIcon v-if="withClear" class="ui-system-input-cross" :name="Outline.CROSS_L" @click.stop="$emit('clear')"/>
				<BIcon v-if="dropdown" class="ui-system-input-dropdown" :name="Outline.CHEVRON_DOWN_L"/>
			</div>
			<div v-if="error?.trim() && !disabled" class="ui-system-input-label --error" :title="error">{{ error }}</div>
		</div>
	`
	};

	// @vue/component
	const PasswordField = {
		name: 'PasswordField',
		components: {
			BInput
		},
		expose: ['focus'],
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			label: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			error: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: InputSize.Lg
			},
			design: {
				type: String,
				default: InputDesign.Grey
			},
			copyable: {
				type: Boolean,
				default: false
			},
			stretched: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			readonly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue', 'focus', 'blur', 'input'],
		methods: {
			focus() {
				this.$refs.input?.focus();
			}
		},
		template: `
		<BInput
			ref="input"
			:modelValue="modelValue"
			@update:modelValue="$emit('update:modelValue', $event)"
			type="password"
			:label="label"
			:placeholder="placeholder"
			:error="error"
			:size="size"
			:design="design"
			:copyable="copyable"
			:stretched="stretched"
			:active="active"
			:readonly="readonly"
			@focus="$emit('focus', $event)"
			@blur="$emit('blur', $event)"
			@input="$emit('input', $event)"
		/>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		__proto__: null,
		BInput: BInput,
		InputDesign: InputDesign,
		InputSize: InputSize,
		PasswordField: PasswordField
	});

	class Input {
		#value = '';
		#rows = 1;
		#resize = 'both';
		#label = '';
		#labelInline = false;
		#placeholder = '';
		#type = 'text';
		#error = '';
		#size = InputSize.Lg;
		#design = InputDesign.Grey;
		#icon = null;
		#chips = [];
		#center = false;
		#withSearch = false;
		#withClear = false;
		#dropdown = false;
		#clickable = false;
		#stretched = false;
		#active = false;
		#readonly = false;
		#copyable = false;
		#required = false;
		#passwordVisible = false;
		#dataTestId = '';
		#onClick = null;
		#onFocus = null;
		#onBlur = null;
		#onInput = null;
		#onClear = null;
		#onCopy = null;
		#onChipClick = null;
		#onChipClear = null;
		#wrapper = null;
		#labelElement = null;
		#containerElement = null;
		#inputElement = null;
		#errorElement = null;
		#iconElement = null;
		#clearElement = null;
		#searchElement = null;
		#dropdownElement = null;
		#passwordToggleElement = null;
		#copyElement = null;
		#requiredElement = null;
		#chipsInstances = [];
		#chipElements = [];
		#chipsContainer = null;
		#focused = false;
		constructor(options = {}) {
			this.#applyOptions(options);
		}
		#applyOptions(options) {
			this.#value = options.value ?? '';
			this.#rows = options.rowsQuantity ?? 1;
			this.#resize = options.resize ?? 'both';
			this.#label = options.label ?? '';
			this.#labelInline = options.labelInline === true;
			this.#placeholder = options.placeholder ?? '';
			this.#type = options.type ?? 'text';
			this.#error = options.error ?? '';
			this.#size = options.size ?? InputSize.Lg;
			this.#design = options.design ?? InputDesign.Grey;
			this.#icon = options.icon ?? null;
			this.#chips = Array.isArray(options.chips) ? options.chips : [];
			this.#center = options.center === true;
			this.#withSearch = options.withSearch === true;
			this.#withClear = options.withClear === true;
			this.#dropdown = options.dropdown === true;
			this.#clickable = options.clickable === true;
			this.#stretched = options.stretched === true;
			this.#active = options.active === true;
			this.#readonly = options.readonly === true;
			this.#copyable = options.copyable === true;
			this.#required = options.required === true;
			this.#dataTestId = options.dataTestId ?? '';
			this.#onClick = options.onClick ?? null;
			this.#onFocus = options.onFocus ?? null;
			this.#onBlur = options.onBlur ?? null;
			this.#onInput = options.onInput ?? null;
			this.#onClear = options.onClear ?? null;
			this.#onCopy = options.onCopy ?? null;
			this.#onChipClick = options.onChipClick ?? null;
			this.#onChipClear = options.onChipClear ?? null;
		}
		render() {
			if (this.#wrapper) {
				return this.#wrapper;
			}
			this.#containerElement = main_core.Tag.render`
			<div class="ui-system-input-container">
				${this.#renderChips()}
				${this.#renderIcon()}
				${this.#renderInput()}
				${this.#renderPasswordToggle()}
				${this.#renderCopyButton()}
				${this.#renderSearchIcon()}
				${this.#renderClearIcon()}
				${this.#renderDropdownIcon()}
			</div>
		`;
			this.#wrapper = main_core.Tag.render`
			<div class="ui-system-input ${this.#getWrapperClasses()}">
				${this.#renderLabel()}
				${this.#containerElement}
				${this.#renderError()}
			</div>
		`;
			this.#bindEvents();
			if (this.#active && !this.#clickable) {
				this.focus();
			}
			return this.#wrapper;
		}
		setValue(value) {
			this.#value = value;
			if (this.#inputElement) {
				this.#inputElement.value = value;
			}
		}
		getValue() {
			return this.#value;
		}
		setLabel(value) {
			this.#label = value;
			if (this.#labelElement) {
				this.#labelElement.textContent = value;
				if (this.#requiredElement) {
					main_core.Dom.append(this.#requiredElement, this.#labelElement);
				}
			}
		}
		getLabel() {
			return this.#label;
		}
		setPlaceholder(value) {
			this.#placeholder = value;
			if (this.#inputElement) {
				this.#inputElement.placeholder = value;
			}
		}
		getPlaceholder() {
			return this.#placeholder;
		}
		setType(value) {
			this.#type = value;
			if (this.#inputElement) {
				this.#inputElement.type = value;
			}
		}
		getType() {
			return this.#type;
		}
		setError(value) {
			this.#error = value;
			if (this.#errorElement) {
				this.#errorElement.textContent = value;
			}
			this.#updateClasses();
		}
		getError() {
			return this.#error;
		}
		setSize(value) {
			this.#size = value;
			this.#updateClasses();
		}
		getSize() {
			return this.#size;
		}
		setDesign(value) {
			this.#design = value;
			this.#updateClasses();
			this.#updateChips();
			if (this.#isDisabled()) {
				main_core.Dom.attr(this.#inputElement, {
					disabled: ''
				});
				main_core.Dom.attr(this.#errorElement, {
					hidden: ''
				});
			} else {
				if (this.#inputElement) {
					this.#inputElement.removeAttribute('disabled');
				}
				if (this.#errorElement) {
					this.#errorElement.removeAttribute('hidden');
				}
			}
		}
		getDesign() {
			return this.#design;
		}
		setIcon(value) {
			this.#icon = value;
			this.#updateIcon();
		}
		getIcon() {
			return this.#icon;
		}
		setWithSearch(value) {
			this.#withSearch = value === true;
			this.#updateRightIconElement(this.#searchElement, this.#withSearch);
		}
		getWithSearch() {
			return this.#withSearch;
		}
		getWithClear() {
			return this.#withClear;
		}
		setWithClear(value) {
			this.#withClear = value === true;
			this.#updateRightIconElement(this.#clearElement, this.#withClear);
		}
		isDropdown() {
			return this.#dropdown;
		}
		setDropdown(value) {
			this.#dropdown = value === true;
			this.#updateRightIconElement(this.#dropdownElement, this.#dropdown);
		}
		isCopyable() {
			return this.#copyable;
		}
		setCopyable(value = true) {
			this.#copyable = value === true;
			if (this.#copyElement) {
				if (this.#copyable) {
					this.#copyElement.removeAttribute('hidden');
				} else {
					main_core.Dom.attr(this.#copyElement, {
						hidden: ''
					});
				}
			}
		}
		isFocused() {
			return this.#focused;
		}
		isReadonly() {
			return this.#readonly;
		}
		setReadonly(value) {
			this.#readonly = value === true;
			this.#updateClasses();
			if (this.#inputElement) {
				if (this.#readonly) {
					main_core.Dom.attr(this.#inputElement, {
						readonly: ''
					});
				} else {
					this.#inputElement.removeAttribute('readonly');
				}
			}
		}
		setFocused(value) {
			this.#focused = value === true;
			this.#updateClasses();
		}
		isLabelInline() {
			return this.#labelInline;
		}
		setLabelInline(value) {
			this.#labelInline = value === true;
			if (this.#labelInline) {
				main_core.Dom.addClass(this.#labelElement, '--inline');
			} else {
				main_core.Dom.removeClass(this.#labelElement, '--inline');
			}
		}
		isRequired() {
			return this.#required;
		}
		setRequired(value) {
			this.#required = value === true;
			if (this.#requiredElement) {
				if (this.#required) {
					this.#requiredElement.removeAttribute('hidden');
				} else {
					main_core.Dom.attr(this.#requiredElement, {
						hidden: ''
					});
				}
			}
		}
		addChip(chipOptions) {
			this.#chips.push(chipOptions);
			this.#updateChips();
		}
		removeChip(chipOptions) {
			this.#chips = this.#chips.filter(item => item !== chipOptions);
			this.#updateChips();
		}
		removeChips() {
			this.#chips = [];
			this.#updateChips();
		}
		getChips() {
			return this.#chipsInstances;
		}
		#updateClasses() {
			if (!this.#wrapper) {
				return;
			}
			this.#wrapper.className = `ui-system-input ${this.#getWrapperClasses()}`;
		}
		#renderLabel() {
			this.#requiredElement = main_core.Tag.render`
			<span class="ui-system-input-label-required" ${this.#required ? '' : 'hidden'}>*</span>
		`;
			this.#labelElement = main_core.Tag.render`
			<div class="ui-system-input-label ${this.#labelInline ? '--inline' : ''}">
				${this.#label ?? ''}${this.#requiredElement}
			</div>
		`;
			return this.#labelElement;
		}
		#renderChips() {
			this.#chipsContainer = main_core.Tag.render`<div class="ui-system-input-chips"></div>`;
			this.#updateChips();
			return this.#chipsContainer;
		}
		#updateChips() {
			this.#chipElements = [];
			this.#chipsInstances = [];
			main_core.Dom.clean(this.#chipsContainer);
			if (this.#chips && this.#chips.length > 0) {
				this.#chips.forEach(chipOptions => {
					const chip = new ui_system_chip.Chip({
						...chipOptions,
						size: this.#getChipSize(),
						design: this.#isDisabled() ? ui_system_chip.ChipDesign.Disabled : chipOptions.design ?? ui_system_chip.ChipDesign.Outline,
						onClick: event => {
							this.#onChipClick?.(chipOptions, event);
						},
						onClear: event => {
							this.#onChipClear?.(chipOptions, event);
						}
					});
					const chipWrapper = main_core.Tag.render`<div class="ui-system-input-chip">${chip.render()}</div>`;
					main_core.Dom.append(chipWrapper, this.#chipsContainer);
					this.#chipsInstances.push(chip);
					this.#chipElements.push(chipWrapper);
				});
			}
		}
		#renderIcon() {
			this.#iconElement = main_core.Tag.render`<div class="ui-system-input-icon"></div>`;
			this.#updateIcon();
			return this.#iconElement;
		}
		#updateIcon() {
			if (!this.#iconElement) {
				return;
			}
			if (this.#icon) {
				this.#iconElement.removeAttribute('hidden');
				this.#iconElement.className = `ui-system-input-icon ui-icon-set --${this.#icon}`;
			} else {
				this.#iconElement.className = 'ui-system-input-icon';
				main_core.Dom.attr(this.#iconElement, {
					hidden: ''
				});
			}
		}
		#renderPasswordToggle() {
			const isPassword = this.#type === 'password';
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.OBSERVER
			});
			this.#passwordToggleElement = main_core.Tag.render`
			<button
				type="button"
				tabindex="0"
				class="ui-system-input-action-btn"
				aria-label="${main_core.Loc.getMessage('UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA')}"
				${isPassword ? '' : 'hidden'}
			>
				${icon.render()}
			</button>
		`;
			return this.#passwordToggleElement;
		}
		#renderCopyButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.COPY
			});
			this.#copyElement = main_core.Tag.render`
			<button
				type="button"
				tabindex="0"
				class="ui-system-input-action-btn"
				aria-label="${main_core.Loc.getMessage('UI_SYSTEM_INPUT_COPY_TO_CLIPBOARD_ARIA')}"
				${this.#copyable ? '' : 'hidden'}
			>
				${icon.render()}
			</button>
		`;
			return this.#copyElement;
		}
		#renderSearchIcon() {
			this.#searchElement = main_core.Tag.render`<div class="ui-system-input-cross --${ui_iconSet_api_core.Outline.SEARCH}"></div>`;
			this.#updateRightIconElement(this.#searchElement, this.#withSearch);
			return this.#searchElement;
		}
		#renderClearIcon() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L
			});
			this.#clearElement = main_core.Tag.render`<div class="ui-system-input-cross --clear">${icon.render()}</div>`;
			this.#updateRightIconElement(this.#clearElement, this.#withClear);
			return this.#clearElement;
		}
		#renderDropdownIcon() {
			this.#dropdownElement = main_core.Tag.render`
			<div class="ui-system-input-dropdown --${ui_iconSet_api_core.Outline.CHEVRON_DOWN_L}"></div>
		`;
			this.#updateRightIconElement(this.#dropdownElement, this.#dropdown);
			return this.#dropdownElement;
		}
		#updateRightIconElement(iconElement, isShow) {
			if (isShow) {
				iconElement.removeAttribute('hidden');
				main_core.Dom.addClass(iconElement, 'ui-icon-set');
			} else {
				main_core.Dom.removeClass(iconElement, 'ui-icon-set');
				main_core.Dom.attr(iconElement, {
					hidden: ''
				});
			}
		}
		#renderInput() {
			const commonAttrs = {
				className: 'ui-system-input-value',
				placeholder: this.#placeholder,
				disabled: this.#isDisabled(),
				readonly: this.#readonly,
				type: this.#type,
				value: this.#value,
				dataTestId: this.#dataTestId
			};
			if (this.#rows > 1) {
				this.#inputElement = main_core.Tag.render`
				<textarea
					class="${commonAttrs.className} --multi"
					style="resize: ${this.#resize};"
					placeholder="${commonAttrs.placeholder}"
					${commonAttrs.disabled ? 'disabled' : ''}
					${commonAttrs.readonly ? 'readonly' : ''}
					rows="${this.#rows}"
				>${commonAttrs.value}</textarea>
			`;
			} else {
				this.#inputElement = main_core.Tag.render`
				<input
					class="${commonAttrs.className}"
					style="--placeholder-length: ${this.#placeholder.length}ch;"
					placeholder="${commonAttrs.placeholder}"
					${commonAttrs.disabled ? 'disabled' : ''}
					${commonAttrs.readonly ? 'readonly' : ''}
					type="${commonAttrs.type}"
					value="${commonAttrs.value}"
					${commonAttrs.dataTestId ? `data-test-id="${commonAttrs.dataTestId}"` : ''}
				/>
			`;
			}
			return this.#inputElement;
		}
		#renderError() {
			this.#errorElement = main_core.Tag.render`
			<div ${this.#isDisabled() ? 'hidden' : ''} class="ui-system-input-label --error" title="${this.#error}">
				${this.#error}
			</div>
		`;
			return this.#errorElement;
		}
		#bindEvents() {
			if (!this.#wrapper || !this.#containerElement) {
				return;
			}
			main_core.Event.bind(this.#containerElement, 'click', this.#handleContainerClick.bind(this));
			if (this.#inputElement) {
				main_core.Event.bind(this.#inputElement, 'input', this.#handleInput.bind(this));
				main_core.Event.bind(this.#inputElement, 'focus', this.#handleFocus.bind(this));
				main_core.Event.bind(this.#inputElement, 'blur', this.#handleBlur.bind(this));
			}
			if (this.#clearElement) {
				main_core.Event.bind(this.#clearElement, 'click', this.#handleClear.bind(this));
			}
			if (this.#passwordToggleElement) {
				main_core.Event.bind(this.#passwordToggleElement, 'click', this.#handlePasswordToggle.bind(this));
			}
			if (this.#copyElement) {
				main_core.Event.bind(this.#copyElement, 'click', this.#handleCopy.bind(this));
			}
		}
		#handleContainerClick(event) {
			if (!this.#clickable && this.#inputElement) {
				this.#inputElement.focus();
			}
			this.#onClick?.(event);
		}
		#handleInput(event) {
			if (!this.#inputElement) {
				return;
			}
			this.#value = this.#inputElement.value;
			this.#onInput?.(event);
		}
		#handleFocus(event) {
			if (this.#clickable) {
				event.target.blur();
				return;
			}
			this.#focused = true;
			main_core.Dom.addClass(this.#wrapper, '--active');
			this.#onFocus?.(event);
		}
		#handleBlur(event) {
			this.#focused = false;
			if (!this.#active) {
				main_core.Dom.removeClass(this.#wrapper, '--active');
			}
			this.#onBlur?.(event);
		}
		#handleClear(event) {
			event.stopPropagation();
			this.setValue('');
			this.#onClear?.(event);
		}
		#handlePasswordToggle(event) {
			event.stopPropagation();
			this.#passwordVisible = !this.#passwordVisible;
			if (this.#inputElement) {
				this.#inputElement.type = this.#passwordVisible ? 'text' : 'password';
			}
			if (this.#passwordToggleElement) {
				main_core.Dom.attr(this.#passwordToggleElement, {
					'aria-label': this.#passwordVisible ? main_core.Loc.getMessage('UI_SYSTEM_INPUT_HIDE_PASSWORD_ARIA') : main_core.Loc.getMessage('UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA')
				});
				const nextIcon = this.#passwordVisible ? ui_iconSet_api_core.Outline.CROSSED_EYE : ui_iconSet_api_core.Outline.OBSERVER;
				main_core.Dom.clean(this.#passwordToggleElement);
				new ui_iconSet_api_core.Icon({
					icon: nextIcon
				}).renderTo(this.#passwordToggleElement);
			}
		}
		#handleCopy(event) {
			event.stopPropagation();
			if (!this.#value) {
				this.#onCopy?.(event);
				return;
			}
			const showHint = () => {
				if (this.#copyElement) {
					BX.UI.Hint.show(this.#copyElement, main_core.Loc.getMessage('UI_SYSTEM_INPUT_COPIED'));
					setTimeout(() => {
						BX.UI.Hint.hide(this.#copyElement);
					}, 1500);
				}
			};
			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard.writeText(this.#value).then(() => showHint());
			} else if (BX.clipboard?.copy(this.#value)) {
				showHint();
			}
			this.#onCopy?.(event);
		}
		#getWrapperClasses() {
			return [`--${this.#design}`, `--${this.#size}`, this.#center ? '--center' : '', this.#chips.length > 0 ? '--with-chips' : '', this.#clickable ? '--clickable' : '', this.#stretched ? '--stretched' : '', this.#active || this.#focused ? '--active' : '', this.#readonly ? '--readonly' : '', this.#error && !this.#isDisabled() ? '--error' : ''].filter(Boolean).join(' ');
		}
		#getChipSize() {
			return {
				[InputSize.Lg]: ui_system_chip.ChipSize.Md,
				[InputSize.Md]: ui_system_chip.ChipSize.Md,
				[InputSize.Sm]: ui_system_chip.ChipSize.Xs
			}[this.#size] ?? ui_system_chip.ChipSize.Md;
		}
		#isDisabled() {
			return this.#design === InputDesign.Disabled;
		}
		focus() {
			if (this.#inputElement && !this.#clickable) {
				this.#inputElement.focus({
					preventScroll: true
				});
				if (!main_core.Type.isFunction(this.#inputElement.setSelectionRange)) {
					return;
				}
				const length = this.#value.length;
				this.#inputElement.setSelectionRange(length, length);
			}
		}
		blur() {
			this.#inputElement?.blur();
		}
		destroy() {
			if (!this.#wrapper) {
				return;
			}
			main_core.Event.unbindAll(this.#wrapper);
			if (this.#inputElement) {
				main_core.Event.unbindAll(this.#inputElement);
			}
			if (this.#clearElement) {
				main_core.Event.unbindAll(this.#clearElement);
			}
			if (this.#passwordToggleElement) {
				main_core.Event.unbindAll(this.#passwordToggleElement);
			}
			if (this.#copyElement) {
				main_core.Event.unbindAll(this.#copyElement);
			}
			this.#chipsInstances.forEach(chip => chip.destroy());
			this.#chipsInstances = [];
			this.#chipElements = [];
			main_core.Dom.remove(this.#wrapper);
			this.#wrapper = null;
			this.#labelElement = null;
			this.#containerElement = null;
			this.#inputElement = null;
			this.#errorElement = null;
			this.#iconElement = null;
			this.#clearElement = null;
			this.#searchElement = null;
			this.#dropdownElement = null;
			this.#passwordToggleElement = null;
			this.#copyElement = null;
			this.#requiredElement = null;
		}
	}

	class PasswordInput {
		#input;
		constructor(options = {}) {
			this.#input = new Input({
				...options,
				type: 'password'
			});
		}
		render() {
			return this.#input.render();
		}
		setValue(value) {
			this.#input.setValue(value);
		}
		getValue() {
			return this.#input.getValue();
		}
		setLabel(value) {
			this.#input.setLabel(value);
		}
		getLabel() {
			return this.#input.getLabel();
		}
		setPlaceholder(value) {
			this.#input.setPlaceholder(value);
		}
		getPlaceholder() {
			return this.#input.getPlaceholder();
		}
		setError(value) {
			this.#input.setError(value);
		}
		getError() {
			return this.#input.getError();
		}
		setSize(value) {
			this.#input.setSize(value);
		}
		getSize() {
			return this.#input.getSize();
		}
		setDesign(value) {
			this.#input.setDesign(value);
		}
		getDesign() {
			return this.#input.getDesign();
		}
		isCopyable() {
			return this.#input.isCopyable();
		}
		setCopyable(value) {
			this.#input.setCopyable(value);
		}
		isFocused() {
			return this.#input.isFocused();
		}
		focus() {
			this.#input.focus();
		}
		blur() {
			this.#input.blur();
		}
		destroy() {
			this.#input.destroy();
		}
	}

	exports.Input = Input;
	exports.InputDesign = InputDesign;
	exports.InputSize = InputSize;
	exports.PasswordInput = PasswordInput;
	exports.Vue = vue;

})(this.BX.UI.System.Input = this.BX.UI.System.Input || {}, BX.UI.System.Chip.Vue, BX.UI.IconSet, window, BX.UI, BX, BX.UI.IconSet, BX.UI.System.Chip);
//# sourceMappingURL=input.bundle.js.map
