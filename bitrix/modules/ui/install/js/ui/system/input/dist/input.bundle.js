/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,main_core,ui_iconSet_api_core,ui_system_chip) {
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
	      var _this$$refs$input;
	      (_this$$refs$input = this.$refs.input) == null ? void 0 : _this$$refs$input.focus({
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
	      if (this.modelValue && navigator.clipboard && window.isSecureContext) {
	        navigator.clipboard.writeText(this.modelValue);
	      }
	      const button = this.$refs.copyButton;
	      if (button) {
	        BX.UI.Hint.show(button, this.$Bitrix.Loc.getMessage('UI_SYSTEM_INPUT_COPIED'));
	        setTimeout(() => {
	          BX.UI.Hint.hide(button);
	        }, 1500);
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
			<div v-if="label" class="ui-system-input-label" :class="{ '--inline': labelInline }">{{ label }}</div>
			<div class="ui-system-input-container" ref="inputContainer" @click="handleClick">
				<div v-for="chip in chips" class="ui-system-input-chip">
					<Chip
						v-bind="chip"
						:design="disabled ? ChipDesign.Disabled : chip.design"
						:size="chipSize"
						@click="$emit('chipClick', chip)"
						@clear="$emit('chipClear', chip)"
					/>
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
	      var _this$$refs$input2;
	      (_this$$refs$input2 = this.$refs.input) == null ? void 0 : _this$$refs$input2.focus();
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
		InputSize: InputSize,
		InputDesign: InputDesign,
		BInput: BInput,
		PasswordField: PasswordField
	});

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11,
	  _t12,
	  _t13,
	  _t14;
	var _value = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("value");
	var _rows = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rows");
	var _resize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resize");
	var _label = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("label");
	var _labelInline = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("labelInline");
	var _placeholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("placeholder");
	var _type = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("type");
	var _error = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("error");
	var _size = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("size");
	var _design = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("design");
	var _icon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("icon");
	var _chips = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chips");
	var _center = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("center");
	var _withSearch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("withSearch");
	var _withClear = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("withClear");
	var _dropdown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dropdown");
	var _clickable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clickable");
	var _stretched = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stretched");
	var _active = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("active");
	var _copyable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyable");
	var _passwordVisible = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("passwordVisible");
	var _dataTestId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dataTestId");
	var _onClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClick");
	var _onFocus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onFocus");
	var _onBlur = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onBlur");
	var _onInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onInput");
	var _onClear = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClear");
	var _onCopy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCopy");
	var _onChipClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onChipClick");
	var _onChipClear = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onChipClear");
	var _wrapper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("wrapper");
	var _labelElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("labelElement");
	var _containerElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("containerElement");
	var _inputElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputElement");
	var _errorElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("errorElement");
	var _iconElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("iconElement");
	var _clearElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearElement");
	var _searchElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("searchElement");
	var _dropdownElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dropdownElement");
	var _passwordToggleElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("passwordToggleElement");
	var _copyElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyElement");
	var _chipsInstances = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chipsInstances");
	var _chipElements = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chipElements");
	var _chipsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chipsContainer");
	var _focused = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("focused");
	var _applyOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyOptions");
	var _updateClasses = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateClasses");
	var _renderLabel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLabel");
	var _renderChips = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderChips");
	var _updateChips = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateChips");
	var _renderIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderIcon");
	var _updateIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateIcon");
	var _renderPasswordToggle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderPasswordToggle");
	var _renderCopyButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCopyButton");
	var _renderSearchIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSearchIcon");
	var _renderClearIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderClearIcon");
	var _renderDropdownIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDropdownIcon");
	var _updateRightIconElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateRightIconElement");
	var _renderInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderInput");
	var _renderError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderError");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _handleContainerClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleContainerClick");
	var _handleInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleInput");
	var _handleFocus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleFocus");
	var _handleBlur = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleBlur");
	var _handleClear = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClear");
	var _handlePasswordToggle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePasswordToggle");
	var _handleCopy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCopy");
	var _getWrapperClasses = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWrapperClasses");
	var _getChipSize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChipSize");
	var _isDisabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDisabled");
	class Input {
	  constructor(_options = {}) {
	    Object.defineProperty(this, _isDisabled, {
	      value: _isDisabled2
	    });
	    Object.defineProperty(this, _getChipSize, {
	      value: _getChipSize2
	    });
	    Object.defineProperty(this, _getWrapperClasses, {
	      value: _getWrapperClasses2
	    });
	    Object.defineProperty(this, _handleCopy, {
	      value: _handleCopy2
	    });
	    Object.defineProperty(this, _handlePasswordToggle, {
	      value: _handlePasswordToggle2
	    });
	    Object.defineProperty(this, _handleClear, {
	      value: _handleClear2
	    });
	    Object.defineProperty(this, _handleBlur, {
	      value: _handleBlur2
	    });
	    Object.defineProperty(this, _handleFocus, {
	      value: _handleFocus2
	    });
	    Object.defineProperty(this, _handleInput, {
	      value: _handleInput2
	    });
	    Object.defineProperty(this, _handleContainerClick, {
	      value: _handleContainerClick2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _renderError, {
	      value: _renderError2
	    });
	    Object.defineProperty(this, _renderInput, {
	      value: _renderInput2
	    });
	    Object.defineProperty(this, _updateRightIconElement, {
	      value: _updateRightIconElement2
	    });
	    Object.defineProperty(this, _renderDropdownIcon, {
	      value: _renderDropdownIcon2
	    });
	    Object.defineProperty(this, _renderClearIcon, {
	      value: _renderClearIcon2
	    });
	    Object.defineProperty(this, _renderSearchIcon, {
	      value: _renderSearchIcon2
	    });
	    Object.defineProperty(this, _renderCopyButton, {
	      value: _renderCopyButton2
	    });
	    Object.defineProperty(this, _renderPasswordToggle, {
	      value: _renderPasswordToggle2
	    });
	    Object.defineProperty(this, _updateIcon, {
	      value: _updateIcon2
	    });
	    Object.defineProperty(this, _renderIcon, {
	      value: _renderIcon2
	    });
	    Object.defineProperty(this, _updateChips, {
	      value: _updateChips2
	    });
	    Object.defineProperty(this, _renderChips, {
	      value: _renderChips2
	    });
	    Object.defineProperty(this, _renderLabel, {
	      value: _renderLabel2
	    });
	    Object.defineProperty(this, _updateClasses, {
	      value: _updateClasses2
	    });
	    Object.defineProperty(this, _applyOptions, {
	      value: _applyOptions2
	    });
	    Object.defineProperty(this, _value, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _rows, {
	      writable: true,
	      value: 1
	    });
	    Object.defineProperty(this, _resize, {
	      writable: true,
	      value: 'both'
	    });
	    Object.defineProperty(this, _label, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _labelInline, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _placeholder, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _type, {
	      writable: true,
	      value: 'text'
	    });
	    Object.defineProperty(this, _error, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _size, {
	      writable: true,
	      value: InputSize.Lg
	    });
	    Object.defineProperty(this, _design, {
	      writable: true,
	      value: InputDesign.Grey
	    });
	    Object.defineProperty(this, _icon, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _chips, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _center, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _withSearch, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _withClear, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _dropdown, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _clickable, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _stretched, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _active, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _copyable, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _passwordVisible, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _dataTestId, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _onClick, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onFocus, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onBlur, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onInput, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onClear, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onCopy, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onChipClick, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onChipClear, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _wrapper, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _labelElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _containerElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _inputElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _errorElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _iconElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _clearElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _searchElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _dropdownElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _passwordToggleElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _copyElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _chipsInstances, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _chipElements, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _chipsContainer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _focused, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _applyOptions)[_applyOptions](_options);
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _containerElement)[_containerElement] = main_core.Tag.render(_t || (_t = _`
			<div class="ui-system-input-container">
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _renderChips)[_renderChips](), babelHelpers.classPrivateFieldLooseBase(this, _renderIcon)[_renderIcon](), babelHelpers.classPrivateFieldLooseBase(this, _renderInput)[_renderInput](), babelHelpers.classPrivateFieldLooseBase(this, _renderPasswordToggle)[_renderPasswordToggle](), babelHelpers.classPrivateFieldLooseBase(this, _renderCopyButton)[_renderCopyButton](), babelHelpers.classPrivateFieldLooseBase(this, _renderSearchIcon)[_renderSearchIcon](), babelHelpers.classPrivateFieldLooseBase(this, _renderClearIcon)[_renderClearIcon](), babelHelpers.classPrivateFieldLooseBase(this, _renderDropdownIcon)[_renderDropdownIcon]());
	    babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper] = main_core.Tag.render(_t2 || (_t2 = _`
			<div class="ui-system-input ${0}">
				${0}
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getWrapperClasses)[_getWrapperClasses](), babelHelpers.classPrivateFieldLooseBase(this, _renderLabel)[_renderLabel](), babelHelpers.classPrivateFieldLooseBase(this, _containerElement)[_containerElement], babelHelpers.classPrivateFieldLooseBase(this, _renderError)[_renderError]());
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] && !babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable]) {
	      this.focus();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper];
	  }
	  setValue(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _value)[_value] = value;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].value = value;
	    }
	  }
	  getValue() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _value)[_value];
	  }
	  setLabel(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _label)[_label] = value;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement].textContent = value;
	    }
	  }
	  getLabel() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _label)[_label];
	  }
	  setPlaceholder(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder] = value;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].placeholder = value;
	    }
	  }
	  getPlaceholder() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder];
	  }
	  setType(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _type)[_type] = value;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].type = value;
	    }
	  }
	  getType() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _type)[_type];
	  }
	  setError(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _error)[_error] = value;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement].textContent = value;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateClasses)[_updateClasses]();
	  }
	  getError() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _error)[_error];
	  }
	  setSize(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = value;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateClasses)[_updateClasses]();
	  }
	  getSize() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _size)[_size];
	  }
	  setDesign(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _design)[_design] = value;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateClasses)[_updateClasses]();
	    babelHelpers.classPrivateFieldLooseBase(this, _updateChips)[_updateChips]();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isDisabled)[_isDisabled]()) {
	      main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement], {
	        disabled: ''
	      });
	      main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement], {
	        hidden: ''
	      });
	    } else {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].removeAttribute('disabled');
	      }
	      if (babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement].removeAttribute('hidden');
	      }
	    }
	  }
	  getDesign() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _design)[_design];
	  }
	  setIcon(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] = value;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateIcon)[_updateIcon]();
	  }
	  getIcon() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon];
	  }
	  setWithSearch(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _withSearch)[_withSearch] = value === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _searchElement)[_searchElement], babelHelpers.classPrivateFieldLooseBase(this, _withSearch)[_withSearch]);
	  }
	  getWithSearch() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _withSearch)[_withSearch];
	  }
	  getWithClear() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _withClear)[_withClear];
	  }
	  setWithClear(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _withClear)[_withClear] = value === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement], babelHelpers.classPrivateFieldLooseBase(this, _withClear)[_withClear]);
	  }
	  isDropdown() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _dropdown)[_dropdown];
	  }
	  setDropdown(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _dropdown)[_dropdown] = value === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _dropdownElement)[_dropdownElement], babelHelpers.classPrivateFieldLooseBase(this, _dropdown)[_dropdown]);
	  }
	  isCopyable() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _copyable)[_copyable];
	  }
	  setCopyable(value = true) {
	    babelHelpers.classPrivateFieldLooseBase(this, _copyable)[_copyable] = value === true;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _copyable)[_copyable]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement].removeAttribute('hidden');
	      } else {
	        main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement], {
	          hidden: ''
	        });
	      }
	    }
	  }
	  isFocused() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _focused)[_focused];
	  }
	  setFocused(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _focused)[_focused] = value === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateClasses)[_updateClasses]();
	  }
	  isLabelInline() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _labelInline)[_labelInline];
	  }
	  setLabelInline(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _labelInline)[_labelInline] = value === true;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _labelInline)[_labelInline]) {
	      main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement], '--inline');
	    } else {
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement], '--inline');
	    }
	  }
	  addChip(chipOptions) {
	    babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips].push(chipOptions);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateChips)[_updateChips]();
	  }
	  removeChip(chipOptions) {
	    babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips] = babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips].filter(item => item !== chipOptions);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateChips)[_updateChips]();
	  }
	  removeChips() {
	    babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _updateChips)[_updateChips]();
	  }
	  getChips() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _chipsInstances)[_chipsInstances];
	  }
	  focus() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement] && !babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].focus({
	        preventScroll: true
	      });
	      if (!main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].setSelectionRange)) {
	        return;
	      }
	      const length = babelHelpers.classPrivateFieldLooseBase(this, _value)[_value].length;
	      babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].setSelectionRange(length, length);
	    }
	  }
	  blur() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) == null ? void 0 : _babelHelpers$classPr.blur();
	  }
	  destroy() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper]) {
	      return;
	    }
	    main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper]);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	      main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement]) {
	      main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement]);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]) {
	      main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]) {
	      main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _chipsInstances)[_chipsInstances].forEach(chip => chip.destroy());
	    babelHelpers.classPrivateFieldLooseBase(this, _chipsInstances)[_chipsInstances] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _chipElements)[_chipElements] = [];
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper]);
	    babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _containerElement)[_containerElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _searchElement)[_searchElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _dropdownElement)[_dropdownElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement] = null;
	  }
	}
	function _applyOptions2(options) {
	  var _options$value, _options$rowsQuantity, _options$resize, _options$label, _options$placeholder, _options$type, _options$error, _options$size, _options$design, _options$icon, _options$dataTestId, _options$onClick, _options$onFocus, _options$onBlur, _options$onInput, _options$onClear, _options$onCopy, _options$onChipClick, _options$onChipClear;
	  babelHelpers.classPrivateFieldLooseBase(this, _value)[_value] = (_options$value = options.value) != null ? _options$value : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _rows)[_rows] = (_options$rowsQuantity = options.rowsQuantity) != null ? _options$rowsQuantity : 1;
	  babelHelpers.classPrivateFieldLooseBase(this, _resize)[_resize] = (_options$resize = options.resize) != null ? _options$resize : 'both';
	  babelHelpers.classPrivateFieldLooseBase(this, _label)[_label] = (_options$label = options.label) != null ? _options$label : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _labelInline)[_labelInline] = options.labelInline === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder] = (_options$placeholder = options.placeholder) != null ? _options$placeholder : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _type)[_type] = (_options$type = options.type) != null ? _options$type : 'text';
	  babelHelpers.classPrivateFieldLooseBase(this, _error)[_error] = (_options$error = options.error) != null ? _options$error : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = (_options$size = options.size) != null ? _options$size : InputSize.Lg;
	  babelHelpers.classPrivateFieldLooseBase(this, _design)[_design] = (_options$design = options.design) != null ? _options$design : InputDesign.Grey;
	  babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] = (_options$icon = options.icon) != null ? _options$icon : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips] = Array.isArray(options.chips) ? options.chips : [];
	  babelHelpers.classPrivateFieldLooseBase(this, _center)[_center] = options.center === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _withSearch)[_withSearch] = options.withSearch === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _withClear)[_withClear] = options.withClear === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _dropdown)[_dropdown] = options.dropdown === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable] = options.clickable === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _stretched)[_stretched] = options.stretched === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] = options.active === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _copyable)[_copyable] = options.copyable === true;
	  babelHelpers.classPrivateFieldLooseBase(this, _dataTestId)[_dataTestId] = (_options$dataTestId = options.dataTestId) != null ? _options$dataTestId : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick] = (_options$onClick = options.onClick) != null ? _options$onClick : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onFocus)[_onFocus] = (_options$onFocus = options.onFocus) != null ? _options$onFocus : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onBlur)[_onBlur] = (_options$onBlur = options.onBlur) != null ? _options$onBlur : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onInput)[_onInput] = (_options$onInput = options.onInput) != null ? _options$onInput : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onClear)[_onClear] = (_options$onClear = options.onClear) != null ? _options$onClear : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onCopy)[_onCopy] = (_options$onCopy = options.onCopy) != null ? _options$onCopy : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onChipClick)[_onChipClick] = (_options$onChipClick = options.onChipClick) != null ? _options$onChipClick : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _onChipClear)[_onChipClear] = (_options$onChipClear = options.onChipClear) != null ? _options$onChipClear : null;
	}
	function _updateClasses2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper].className = `ui-system-input ${babelHelpers.classPrivateFieldLooseBase(this, _getWrapperClasses)[_getWrapperClasses]()}`;
	}
	function _renderLabel2() {
	  var _babelHelpers$classPr2;
	  babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement] = main_core.Tag.render(_t3 || (_t3 = _`
			<div class="ui-system-input-label ${0}">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _labelInline)[_labelInline] ? '--inline' : '', (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _label)[_label]) != null ? _babelHelpers$classPr2 : '');
	  return babelHelpers.classPrivateFieldLooseBase(this, _labelElement)[_labelElement];
	}
	function _renderChips2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _chipsContainer)[_chipsContainer] = main_core.Tag.render(_t4 || (_t4 = _`<div class="ui-system-input-chips"></div>`));
	  babelHelpers.classPrivateFieldLooseBase(this, _updateChips)[_updateChips]();
	  return babelHelpers.classPrivateFieldLooseBase(this, _chipsContainer)[_chipsContainer];
	}
	function _updateChips2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _chipElements)[_chipElements] = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _chipsInstances)[_chipsInstances] = [];
	  main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _chipsContainer)[_chipsContainer]);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips] && babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips].length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips].forEach(chipOptions => {
	      var _chipOptions$design;
	      const chip = new ui_system_chip.Chip({
	        ...chipOptions,
	        size: babelHelpers.classPrivateFieldLooseBase(this, _getChipSize)[_getChipSize](),
	        design: babelHelpers.classPrivateFieldLooseBase(this, _isDisabled)[_isDisabled]() ? ui_system_chip.ChipDesign.Disabled : (_chipOptions$design = chipOptions.design) != null ? _chipOptions$design : ui_system_chip.ChipDesign.Outline,
	        onClick: event => {
	          var _babelHelpers$classPr3, _babelHelpers$classPr4;
	          (_babelHelpers$classPr3 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _onChipClick))[_onChipClick]) == null ? void 0 : _babelHelpers$classPr3.call(_babelHelpers$classPr4, chipOptions, event);
	        },
	        onClear: event => {
	          var _babelHelpers$classPr5, _babelHelpers$classPr6;
	          (_babelHelpers$classPr5 = (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _onChipClear))[_onChipClear]) == null ? void 0 : _babelHelpers$classPr5.call(_babelHelpers$classPr6, chipOptions, event);
	        }
	      });
	      const chipWrapper = main_core.Tag.render(_t5 || (_t5 = _`<div class="ui-system-input-chip">${0}</div>`), chip.render());
	      main_core.Dom.append(chipWrapper, babelHelpers.classPrivateFieldLooseBase(this, _chipsContainer)[_chipsContainer]);
	      babelHelpers.classPrivateFieldLooseBase(this, _chipsInstances)[_chipsInstances].push(chip);
	      babelHelpers.classPrivateFieldLooseBase(this, _chipElements)[_chipElements].push(chipWrapper);
	    });
	  }
	}
	function _renderIcon2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement] = main_core.Tag.render(_t6 || (_t6 = _`<div class="ui-system-input-icon"></div>`));
	  babelHelpers.classPrivateFieldLooseBase(this, _updateIcon)[_updateIcon]();
	  return babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement];
	}
	function _updateIcon2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement]) {
	    return;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement].removeAttribute('hidden');
	    babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement].className = `ui-system-input-icon ui-icon-set --${babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon]}`;
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement].className = 'ui-system-input-icon';
	    main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _iconElement)[_iconElement], {
	      hidden: ''
	    });
	  }
	}
	function _renderPasswordToggle2() {
	  const isPassword = babelHelpers.classPrivateFieldLooseBase(this, _type)[_type] === 'password';
	  const icon = new ui_iconSet_api_core.Icon({
	    icon: ui_iconSet_api_core.Outline.OBSERVER
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement] = main_core.Tag.render(_t7 || (_t7 = _`
			<button
				type="button"
				tabindex="0"
				class="ui-system-input-action-btn"
				aria-label="${0}"
				${0}
			>
				${0}
			</button>
		`), main_core.Loc.getMessage('UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA'), isPassword ? '' : 'hidden', icon.render());
	  return babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement];
	}
	function _renderCopyButton2() {
	  const icon = new ui_iconSet_api_core.Icon({
	    icon: ui_iconSet_api_core.Outline.COPY
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement] = main_core.Tag.render(_t8 || (_t8 = _`
			<button
				type="button"
				tabindex="0"
				class="ui-system-input-action-btn"
				aria-label="${0}"
				${0}
			>
				${0}
			</button>
		`), main_core.Loc.getMessage('UI_SYSTEM_INPUT_COPY_TO_CLIPBOARD_ARIA'), babelHelpers.classPrivateFieldLooseBase(this, _copyable)[_copyable] ? '' : 'hidden', icon.render());
	  return babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement];
	}
	function _renderSearchIcon2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _searchElement)[_searchElement] = main_core.Tag.render(_t9 || (_t9 = _`<div class="ui-system-input-cross --${0}"></div>`), ui_iconSet_api_core.Outline.SEARCH);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _searchElement)[_searchElement], babelHelpers.classPrivateFieldLooseBase(this, _withSearch)[_withSearch]);
	  return babelHelpers.classPrivateFieldLooseBase(this, _searchElement)[_searchElement];
	}
	function _renderClearIcon2() {
	  const icon = new ui_iconSet_api_core.Icon({
	    icon: ui_iconSet_api_core.Outline.CROSS_L
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement] = main_core.Tag.render(_t10 || (_t10 = _`<div class="ui-system-input-cross --clear">${0}</div>`), icon.render());
	  babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement], babelHelpers.classPrivateFieldLooseBase(this, _withClear)[_withClear]);
	  return babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement];
	}
	function _renderDropdownIcon2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _dropdownElement)[_dropdownElement] = main_core.Tag.render(_t11 || (_t11 = _`
			<div class="ui-system-input-dropdown --${0}"></div>
		`), ui_iconSet_api_core.Outline.CHEVRON_DOWN_L);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateRightIconElement)[_updateRightIconElement](babelHelpers.classPrivateFieldLooseBase(this, _dropdownElement)[_dropdownElement], babelHelpers.classPrivateFieldLooseBase(this, _dropdown)[_dropdown]);
	  return babelHelpers.classPrivateFieldLooseBase(this, _dropdownElement)[_dropdownElement];
	}
	function _updateRightIconElement2(iconElement, isShow) {
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
	function _renderInput2() {
	  const commonAttrs = {
	    className: 'ui-system-input-value',
	    placeholder: babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder],
	    disabled: babelHelpers.classPrivateFieldLooseBase(this, _isDisabled)[_isDisabled](),
	    type: babelHelpers.classPrivateFieldLooseBase(this, _type)[_type],
	    value: babelHelpers.classPrivateFieldLooseBase(this, _value)[_value],
	    dataTestId: babelHelpers.classPrivateFieldLooseBase(this, _dataTestId)[_dataTestId]
	  };
	  if (babelHelpers.classPrivateFieldLooseBase(this, _rows)[_rows] > 1) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement] = main_core.Tag.render(_t12 || (_t12 = _`
				<textarea
					class="${0} --multi"
					style="resize: ${0};"
					placeholder="${0}"
					${0}
					rows="${0}"
				>${0}</textarea>
			`), commonAttrs.className, babelHelpers.classPrivateFieldLooseBase(this, _resize)[_resize], commonAttrs.placeholder, commonAttrs.disabled ? 'disabled' : '', babelHelpers.classPrivateFieldLooseBase(this, _rows)[_rows], commonAttrs.value);
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement] = main_core.Tag.render(_t13 || (_t13 = _`
				<input
					class="${0}"
					style="--placeholder-length: ${0}ch;"
					placeholder="${0}"
					${0}
					type="${0}"
					value="${0}"
					${0}
				/>
			`), commonAttrs.className, babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder].length, commonAttrs.placeholder, commonAttrs.disabled ? 'disabled' : '', commonAttrs.type, commonAttrs.value, commonAttrs.dataTestId ? `data-test-id="${commonAttrs.dataTestId}"` : '');
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement];
	}
	function _renderError2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement] = main_core.Tag.render(_t14 || (_t14 = _`
			<div ${0} class="ui-system-input-label --error" title="${0}">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _isDisabled)[_isDisabled]() ? 'hidden' : '', babelHelpers.classPrivateFieldLooseBase(this, _error)[_error], babelHelpers.classPrivateFieldLooseBase(this, _error)[_error]);
	  return babelHelpers.classPrivateFieldLooseBase(this, _errorElement)[_errorElement];
	}
	function _bindEvents2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper] || !babelHelpers.classPrivateFieldLooseBase(this, _containerElement)[_containerElement]) {
	    return;
	  }
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _containerElement)[_containerElement], 'click', babelHelpers.classPrivateFieldLooseBase(this, _handleContainerClick)[_handleContainerClick].bind(this));
	  if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement], 'input', babelHelpers.classPrivateFieldLooseBase(this, _handleInput)[_handleInput].bind(this));
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement], 'focus', babelHelpers.classPrivateFieldLooseBase(this, _handleFocus)[_handleFocus].bind(this));
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement], 'blur', babelHelpers.classPrivateFieldLooseBase(this, _handleBlur)[_handleBlur].bind(this));
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement]) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _clearElement)[_clearElement], 'click', babelHelpers.classPrivateFieldLooseBase(this, _handleClear)[_handleClear].bind(this));
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement], 'click', babelHelpers.classPrivateFieldLooseBase(this, _handlePasswordToggle)[_handlePasswordToggle].bind(this));
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement], 'click', babelHelpers.classPrivateFieldLooseBase(this, _handleCopy)[_handleCopy].bind(this));
	  }
	}
	function _handleContainerClick2(event) {
	  var _babelHelpers$classPr7, _babelHelpers$classPr8;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable] && babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].focus();
	  }
	  (_babelHelpers$classPr7 = (_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _onClick))[_onClick]) == null ? void 0 : _babelHelpers$classPr7.call(_babelHelpers$classPr8, event);
	}
	function _handleInput2(event) {
	  var _babelHelpers$classPr9, _babelHelpers$classPr10;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _value)[_value] = babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].value;
	  (_babelHelpers$classPr9 = (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _onInput))[_onInput]) == null ? void 0 : _babelHelpers$classPr9.call(_babelHelpers$classPr10, event);
	}
	function _handleFocus2(event) {
	  var _babelHelpers$classPr11, _babelHelpers$classPr12;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable]) {
	    event.target.blur();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _focused)[_focused] = true;
	  main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper], '--active');
	  (_babelHelpers$classPr11 = (_babelHelpers$classPr12 = babelHelpers.classPrivateFieldLooseBase(this, _onFocus))[_onFocus]) == null ? void 0 : _babelHelpers$classPr11.call(_babelHelpers$classPr12, event);
	}
	function _handleBlur2(event) {
	  var _babelHelpers$classPr13, _babelHelpers$classPr14;
	  babelHelpers.classPrivateFieldLooseBase(this, _focused)[_focused] = false;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _active)[_active]) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _wrapper)[_wrapper], '--active');
	  }
	  (_babelHelpers$classPr13 = (_babelHelpers$classPr14 = babelHelpers.classPrivateFieldLooseBase(this, _onBlur))[_onBlur]) == null ? void 0 : _babelHelpers$classPr13.call(_babelHelpers$classPr14, event);
	}
	function _handleClear2(event) {
	  var _babelHelpers$classPr15, _babelHelpers$classPr16;
	  event.stopPropagation();
	  this.setValue('');
	  (_babelHelpers$classPr15 = (_babelHelpers$classPr16 = babelHelpers.classPrivateFieldLooseBase(this, _onClear))[_onClear]) == null ? void 0 : _babelHelpers$classPr15.call(_babelHelpers$classPr16, event);
	}
	function _handlePasswordToggle2(event) {
	  event.stopPropagation();
	  babelHelpers.classPrivateFieldLooseBase(this, _passwordVisible)[_passwordVisible] = !babelHelpers.classPrivateFieldLooseBase(this, _passwordVisible)[_passwordVisible];
	  if (babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputElement)[_inputElement].type = babelHelpers.classPrivateFieldLooseBase(this, _passwordVisible)[_passwordVisible] ? 'text' : 'password';
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]) {
	    main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement], {
	      'aria-label': babelHelpers.classPrivateFieldLooseBase(this, _passwordVisible)[_passwordVisible] ? main_core.Loc.getMessage('UI_SYSTEM_INPUT_HIDE_PASSWORD_ARIA') : main_core.Loc.getMessage('UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA')
	    });
	    const nextIcon = babelHelpers.classPrivateFieldLooseBase(this, _passwordVisible)[_passwordVisible] ? ui_iconSet_api_core.Outline.CROSSED_EYE : ui_iconSet_api_core.Outline.OBSERVER;
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]);
	    new ui_iconSet_api_core.Icon({
	      icon: nextIcon
	    }).renderTo(babelHelpers.classPrivateFieldLooseBase(this, _passwordToggleElement)[_passwordToggleElement]);
	  }
	}
	function _handleCopy2(event) {
	  var _babelHelpers$classPr17, _babelHelpers$classPr18;
	  event.stopPropagation();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _value)[_value] && navigator.clipboard && window.isSecureContext) {
	    navigator.clipboard.writeText(babelHelpers.classPrivateFieldLooseBase(this, _value)[_value]);
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]) {
	    BX.UI.Hint.show(babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement], main_core.Loc.getMessage('UI_SYSTEM_INPUT_COPIED'));
	    setTimeout(() => {
	      BX.UI.Hint.hide(babelHelpers.classPrivateFieldLooseBase(this, _copyElement)[_copyElement]);
	    }, 1500);
	  }
	  (_babelHelpers$classPr17 = (_babelHelpers$classPr18 = babelHelpers.classPrivateFieldLooseBase(this, _onCopy))[_onCopy]) == null ? void 0 : _babelHelpers$classPr17.call(_babelHelpers$classPr18, event);
	}
	function _getWrapperClasses2() {
	  return [`--${babelHelpers.classPrivateFieldLooseBase(this, _design)[_design]}`, `--${babelHelpers.classPrivateFieldLooseBase(this, _size)[_size]}`, babelHelpers.classPrivateFieldLooseBase(this, _center)[_center] ? '--center' : '', babelHelpers.classPrivateFieldLooseBase(this, _chips)[_chips].length > 0 ? '--with-chips' : '', babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable] ? '--clickable' : '', babelHelpers.classPrivateFieldLooseBase(this, _stretched)[_stretched] ? '--stretched' : '', babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] || babelHelpers.classPrivateFieldLooseBase(this, _focused)[_focused] ? '--active' : '', babelHelpers.classPrivateFieldLooseBase(this, _error)[_error] && !babelHelpers.classPrivateFieldLooseBase(this, _isDisabled)[_isDisabled]() ? '--error' : ''].filter(Boolean).join(' ');
	}
	function _getChipSize2() {
	  var _InputSize$Lg$InputSi;
	  return (_InputSize$Lg$InputSi = {
	    [InputSize.Lg]: ui_system_chip.ChipSize.Md,
	    [InputSize.Md]: ui_system_chip.ChipSize.Md,
	    [InputSize.Sm]: ui_system_chip.ChipSize.Xs
	  }[babelHelpers.classPrivateFieldLooseBase(this, _size)[_size]]) != null ? _InputSize$Lg$InputSi : ui_system_chip.ChipSize.Md;
	}
	function _isDisabled2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _design)[_design] === InputDesign.Disabled;
	}

	var _input = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	class PasswordInput {
	  constructor(options = {}) {
	    Object.defineProperty(this, _input, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input] = new Input({
	      ...options,
	      type: 'password'
	    });
	  }
	  render() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].render();
	  }
	  setValue(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setValue(value);
	  }
	  getValue() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getValue();
	  }
	  setLabel(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setLabel(value);
	  }
	  getLabel() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getLabel();
	  }
	  setPlaceholder(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setPlaceholder(value);
	  }
	  getPlaceholder() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getPlaceholder();
	  }
	  setError(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setError(value);
	  }
	  getError() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getError();
	  }
	  setSize(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setSize(value);
	  }
	  getSize() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getSize();
	  }
	  setDesign(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setDesign(value);
	  }
	  getDesign() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].getDesign();
	  }
	  isCopyable() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].isCopyable();
	  }
	  setCopyable(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].setCopyable(value);
	  }
	  isFocused() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].isFocused();
	  }
	  focus() {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].focus();
	  }
	  blur() {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].blur();
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].destroy();
	  }
	}

	exports.Vue = vue;
	exports.InputSize = InputSize;
	exports.InputDesign = InputDesign;
	exports.Input = Input;
	exports.PasswordInput = PasswordInput;

}((this.BX.UI.System.Input = this.BX.UI.System.Input || {}),BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX,BX.UI.IconSet,BX.UI.System.Chip));
//# sourceMappingURL=input.bundle.js.map
