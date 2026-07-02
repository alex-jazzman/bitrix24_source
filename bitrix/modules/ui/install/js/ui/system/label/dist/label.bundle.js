/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core) {
	'use strict';

	const LabelStyle = Object.freeze({
		FILLED_EXTRA: 'filledExtra',
		FILLED: 'filled',
		FILLED_ALERT: 'filledAlert',
		FILLED_WARNING: 'filledWarning',
		FILLED_SUCCESS: 'filledSuccess',
		FILLED_NO_ACCENT: 'filledNoAccent',
		FILLED_INVERTED: 'filledInverted',
		FILLED_ALERT_INVERTED: 'filledAlertInverted',
		FILLED_WARNING_INVERTED: 'filledWarningInverted',
		FILLED_SUCCESS_INVERTED: 'filledSuccessInverted',
		FILLED_NO_ACCENT_INVERTED: 'filledNoAccentInverted',
		TINTED: 'tinted',
		TINTED_SUCCESS: 'tintedSuccess',
		TINTED_WARNING: 'tintedWarning',
		TINTED_ALERT: 'tintedAlert',
		TINTED_VIOLET: 'tintedViolet',
		TINTED_NO_ACCENT: 'tintedNoAccent',
		COLLAB: 'collab',
		OUTLINE_NO_ACCENT: 'outlineNoAccent',
		FILLED_BITRIX_GPT: 'filledBitrixGpt',
		TINTED_BITRIX_GPT: 'tintedBitrixGpt',
		OUTLINE_BITRIX_GPT: 'outlineBitrixGpt'
	});

	const LabelSize = Object.freeze({
		MD: 'md',
		SM: 'sm',
		XS: 'xs'
	});

	const LabelIcon = Object.freeze({
		NONE: '',
		CHECK: 'check',
		ATTENTION: 'attention',
		CROSS: 'cross',
		QUESTION: 'question',
		CHECK_STROKE: 'checkStroke',
		CROSS_STROKE: 'crossStroke',
		PROCESS_STROKE: 'processStroke'
	});

	let Label$1 = class Label {
		#size;
		#value;
		#style;
		#border;
		#icon;
		#wrapper = null;
		constructor(options = {}) {
			this.setSize(options.size ?? LabelSize.MD);
			this.setStyle(options.style ?? LabelStyle.FILLED);
			this.#value = options.value ?? '';
			this.#border = options.border === true;
			this.#icon = options.icon ?? null;
		}
		render() {
			this.#wrapper = main_core.Tag.render`
			<div class="${this.#getClassname()}">
				<div class="ui-system-label__inner">
					<div class="ui-system-label__value"></div>
				</div>
			</div>
		`;
			this.setValue(this.#value);
			return this.#wrapper;
		}

		/*
		* @deprecated used only in vue extension
		* */
		renderOnNode(node) {
			// eslint-disable-next-line no-param-reassign
			node.className = '';
			// eslint-disable-next-line no-param-reassign
			node.innerHTML = '';

			// eslint-disable-next-line no-param-reassign
			node.className = this.#getClassname();
			const nodeInner = main_core.Tag.render`
			<div class="ui-system-label__inner">
				<div class="ui-system-label__value"></div>
			</div>
		`;
			main_core.Dom.append(nodeInner, node);
			this.#wrapper = node;
			this.setValue(this.#value);
		}
		getStyle() {
			return this.#style;
		}
		setStyle(style) {
			if (this.#validateStyle(style) === false) {
				return;
			}
			if (this.#wrapper) {
				main_core.Dom.removeClass(this.#wrapper, `--style-${this.#style}`);
				main_core.Dom.addClass(this.#wrapper, `--style-${style}`);
			}
			this.#style = style;
		}
		setSize(size) {
			if (this.#validateSize(size) === false) {
				return;
			}
			if (this.#wrapper) {
				main_core.Dom.removeClass(this.#wrapper, `--size-${this.#size}`);
				main_core.Dom.addClass(this.#wrapper, `--size-${size}`);
			}
			this.#size = size;
		}
		getSize() {
			return this.#size;
		}
		getValue() {
			return this.#value;
		}
		setValue(value) {
			this.#value = value;
			if (this.#wrapper) {
				const valueElement = this.#wrapper.querySelector('.ui-system-label__value');
				if (valueElement) {
					valueElement.innerText = value;
				}
				main_core.Dom.attr(this.#wrapper, 'title', this.#value);
			}
		}
		setIcon(icon) {
			main_core.Dom.removeClass(this.#wrapper, [`--icon-${this.#icon}`, '--icon-mode']);
			if (icon) {
				this.#icon = icon;
				main_core.Dom.addClass(this.#wrapper, [`--icon-${this.#icon}`, '--icon-mode']);
			} else {
				this.#icon = null;
			}
		}
		setBordered(flag = true) {
			this.#border = flag === true;
			if (!this.#wrapper) {
				return;
			}
			if (this.#border) {
				main_core.Dom.addClass(this.#wrapper, '--bordered');
			} else {
				main_core.Dom.removeClass(this.#wrapper, '--bordered');
			}
		}
		destroy() {
			main_core.Dom.remove(this.#wrapper);
			this.#wrapper = null;
		}
		#getClassname() {
			const classes = ['ui-system-label', `--size-${this.#size}`, `--style-${this.#style}`];
			if (this.#border) {
				classes.push('--bordered');
			}
			if (this.#icon) {
				classes.push(`--icon-mode --icon-${this.#icon}`);
			}
			return classes.join(' ');
		}
		#validateSize(size) {
			const isValid = Object.values(LabelSize).includes(size);
			if (isValid === false) {
				console.warn('UI.System.Label: invalid size', size);
			}
			return isValid;
		}
		#validateStyle(style) {
			const isValid = Object.values(LabelStyle).includes(style);
			if (isValid === false) {
				console.warn('UI.System.Label: invalid style', style);
			}
			return isValid;
		}
	};

	const Label = {
		name: 'UiLabel',
		props: {
			size: {
				type: String,
				required: false,
				default: LabelSize.MD,
				validator: value => {
					return Object.values(LabelSize).includes(value);
				}
			},
			style: {
				type: String,
				required: false,
				default: LabelStyle.FILLED,
				validator: value => {
					return Object.values(LabelStyle).includes(value);
				}
			},
			bordered: {
				type: Boolean,
				required: false,
				default: false
			},
			value: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				required: false,
				default: '',
				validator: value => Object.values(LabelIcon).includes(value)
			}
		},
		watch: {
			value(newValue) {
				this.label?.setValue(newValue);
			},
			size(newSize) {
				this.label?.setSize(newSize);
			},
			style(newStyle) {
				this.label?.setStyle(newStyle);
			},
			bordered(flag) {
				this.label?.setBordered(flag);
			},
			icon(iconName) {
				this.label?.setIcon(iconName);
			}
		},
		beforeMount() {
			this.label = new Label$1({
				size: this.size,
				style: this.style,
				bordered: this.bordered,
				value: this.value,
				icon: this.icon
			});
		},
		unmount() {
			this.label.destroy();
			this.label = null;
		},
		mounted() {
			this.label.renderOnNode(this.$refs.container);
		},
		template: `
		<div ref="container"></div>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Label: Label,
		UiLabel: Label
	});

	exports.Label = Label$1;
	exports.LabelIcon = LabelIcon;
	exports.LabelSize = LabelSize;
	exports.LabelStyle = LabelStyle;
	exports.Vue = vue;

})(this.BX.UI.System.Label = this.BX.UI.System.Label || {}, BX);
//# sourceMappingURL=label.bundle.js.map
