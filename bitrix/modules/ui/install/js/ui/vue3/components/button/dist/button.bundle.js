/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vue3 = this.BX.Vue3 || {};
(function (exports, main_core, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const allIcons = new Set([ui_buttons.ButtonIcon, ui_iconSet_api_core.Set, ui_iconSet_api_core.Outline].flatMap(it => Object.values(it)));
	const iconValidator = val => main_core.Type.isNil(val) || allIcons.has(val);

	// @vue/component
	const Button = {
		name: 'UiButton',
		props: {
			id: {
				type: String,
				default: ''
			},
			idKey: {
				type: String,
				default: ''
			},
			class: {
				type: String,
				default: undefined
			},
			text: {
				type: String,
				default: ''
			},
			link: {
				type: String,
				default: ''
			},
			tag: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: undefined,
				validator(val) {
					return main_core.Type.isNil(val) || Object.values(ui_buttons.ButtonSize).includes(val);
				}
			},
			state: {
				type: String,
				default: undefined,
				validator(val) {
					return main_core.Type.isNil(val) || Object.values(ui_buttons.ButtonState).includes(val);
				}
			},
			style: {
				type: String,
				required: false,
				default: null,
				validator(val) {
					return main_core.Type.isNil(val) || Object.values(ui_buttons.AirButtonStyle).includes(val);
				}
			},
			noCaps: {
				type: Boolean,
				default: true
			},
			disabled: Boolean,
			loading: Boolean,
			dropdown: Boolean,
			wide: Boolean,
			collapsed: Boolean,
			type: {
				type: String,
				required: false,
				default: 'button',
				validator: type => ['button', 'submit', 'reset'].includes(type)
			},
			dataset: {
				type: Object,
				default: () => ({})
			},
			leftIcon: {
				type: String,
				default: null,
				validator: iconValidator
			},
			rightIcon: {
				type: String,
				default: null,
				validator: iconValidator
			},
			collapsedIcon: {
				type: String,
				default: null,
				validator: iconValidator
			},
			leftCounterColor: {
				type: String,
				required: false,
				default: null
			},
			rightCounterColor: {
				type: String,
				required: false,
				default: null
			},
			leftCounterValue: {
				type: Number,
				default: 0
			},
			rightCounterValue: {
				type: Number,
				default: 0
			},
			removeLeftCorners: {
				type: Boolean,
				default: false
			},
			removeRightCorners: {
				type: Boolean,
				default: false
			},
			shimmer: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click', 'clickSecondary'],
		data() {
			return {
				isMounted: false
			};
		},
		watch: {
			text(text) {
				this.button?.setText(text);
			},
			size(size) {
				this.button?.setSize(size);
			},
			state(state) {
				this.button?.setState(state);
			},
			icon(icon) {
				this.button?.setIcon(icon);
			},
			collapsedIcon(collapsedIcon) {
				this.button?.setCollapsedIcon(collapsedIcon);
			},
			disabled(disabled) {
				this.button?.setDisabled(!disabled);
				this.button?.setDisabled(Boolean(disabled));
			},
			loading: {
				handler(loading) {
					if (loading !== this.button?.isWaiting()) {
						this.button?.setWaiting(loading);
					}
				},
				immediate: true
			},
			leftIcon(icon) {
				this.button?.setIcon(icon, 'left');
			},
			rightIcon(icon) {
				this.button?.setIcon(icon, 'right');
			},
			leftCounterColor(color) {
				this.button.getLeftCounter()?.setStyle(color);
			},
			rightCounterColor(color) {
				this.button.getRightCounter()?.setStyle(color);
			},
			leftCounterValue(value) {
				if (value === 0) {
					this.button.setLeftCounter(null);
				} else if (value > 0 && this.button.getLeftCounter()) {
					this.button.getLeftCounter().setValue(value);
				} else if (value > 0) {
					this.button.setLeftCounter({
						value,
						style: this.leftCounterColor
					});
				}
			},
			rightCounterValue(value) {
				if (value === 0) {
					this.button.setRightCounter(null);
				} else if (value > 0 && this.button.getRightCounter()) {
					this.button.getRightCounter().setValue(value);
				} else if (value > 0) {
					this.button.setRightCounter({
						value,
						style: this.rightCounterColor
					});
				}
			},
			wide(wide) {
				this.button.setWide(wide);
			},
			style(style) {
				this.button.setStyle(style);
			},
			dropdown(dropdown) {
				this.button.setDropdown(dropdown);
			},
			noCaps(noCaps) {
				this.button.setNoCaps(noCaps);
			},
			collapsed(collapsed) {
				this.button.setCollapsed(collapsed);
			},
			removeLeftCorners(remove) {
				this.button?.setLeftCorners(remove === false);
			},
			removeRightCorners(remove) {
				this.button?.setRightCorners(remove === false);
			},
			shimmer(shimmer) {
				if (shimmer) {
					this.button?.startShimmer();
				} else {
					this.button?.stopShimmer();
				}
			},
			type(type) {
				main_core.Dom.attr(this.button?.getContainer(), 'type', type);
			}
		},
		created() {
			const button = new ui_buttons.Button({
				id: this.idKey || this.id,
				className: this.class,
				props: {
					id: this.id
				},
				text: this.text,
				link: this.link,
				tag: this.tag,
				size: this.size,
				useAirDesign: true,
				noCaps: this.noCaps,
				collapsedIcon: this.collapsedIcon,
				onclick: () => {
					this.$emit('click');
				},
				dataset: this.dataset,
				dropdown: this.dropdown,
				disabled: this.disabled,
				style: this.style,
				wide: this.wide,
				removeLeftCorners: this.removeLeftCorners,
				removeRightCorners: this.removeRightCorners,
				state: this.state
			});
			if (this.collapsed) {
				button.setCollapsed(true);
			}
			if (this.leftIcon) {
				button.setIcon(this.leftIcon, 'left');
			}
			if (this.rightIcon) {
				button.setIcon(this.rightIcon, 'right');
			}
			if (this.leftCounterValue) {
				button.setLeftCounter({
					value: this.leftCounterValue,
					color: this.leftCounterColor
				});
			} else {
				button.setLeftCounter(null);
			}
			if (this.rightCounterValue) {
				button.setRightCounter({
					value: this.rightCounterValue,
					color: this.rightCounterColor
				});
			}
			if (this.shimmer) {
				button.startShimmer();
			}
			this.button = button;
		},
		mounted() {
			const button = this.button?.render();
			main_core.Dom.attr(button, 'type', this.type);
			this.$refs.button.after(button);
			this.isMounted = true;
		},
		unmounted() {
			this.button?.getContainer()?.remove();
		},
		template: `
		<button v-if="!isMounted" ref="button"></button>
	`
	};

	exports.AirButtonStyle = ui_buttons.AirButtonStyle;
	exports.ButtonColor = ui_buttons.ButtonColor;
	exports.ButtonCounterColor = ui_buttons.ButtonCounterColor;
	exports.ButtonIcon = ui_buttons.ButtonIcon;
	exports.ButtonSize = ui_buttons.ButtonSize;
	exports.ButtonState = ui_buttons.ButtonState;
	exports.ButtonTag = ui_buttons.ButtonTag;
	exports.Button = Button;

})(this.BX.Vue3.Components = this.BX.Vue3.Components || {}, BX, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=button.bundle.js.map
