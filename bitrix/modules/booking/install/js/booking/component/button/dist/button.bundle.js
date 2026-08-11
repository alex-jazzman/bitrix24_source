/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_buttons, main_core) {
	'use strict';

	const Button = {
		name: 'UiButton',
		emits: ['click'],
		props: {
			text: {
				type: String,
				default: ''
			},
			rightCounter: Object,
			size: String,
			state: {
				type: String,
				default: undefined,
				validator(val) {
					return main_core.Type.isUndefined(val) || Object.values(ui_buttons.ButtonState).includes(val);
				}
			},
			id: String,
			color: String,
			round: Boolean,
			icon: String,
			style: String,
			iconPosition: {
				type: String,
				validator(position) {
					return !position || ['left', 'right'].includes(position);
				}
			},
			useAirDesign: Boolean,
			noCaps: Boolean,
			disabled: Boolean,
			clocking: Boolean,
			waiting: Boolean,
			dataset: Object,
			buttonClass: [String, Array]
		},
		computed: {},
		created() {
			this.button = new ui_buttons.Button({
				id: this.id,
				text: this.text,
				size: this.size,
				color: this.color,
				round: this.round,
				icon: this.icon,
				style: this.style,
				iconPosition: this.iconPosition,
				useAirDesign: Boolean(this.useAirDesign),
				noCaps: this.noCaps,
				onclick: () => {
					this.$emit('click');
				},
				dataset: this.dataset,
				className: main_core.Type.isArray(this.buttonClass) ? this.buttonClass.join(' ') : this.buttonClass
			});
			if (this.useAirDesign) {
				this.button.setAirDesign(true);
			}
		},
		mounted() {
			const button = this.button?.render();
			const slot = this.$refs.button.firstElementChild;
			if (slot) {
				button.append(slot);
			}
			this.$refs.button.replaceWith(button);
			if (this.disabled) {
				this.button.setDisabled(this.disabled);
			}
		},
		watch: {
			rightCounter: {
				handler(rightCounterNew) {
					const rightCounterFiltered = rightCounterNew?.value ? rightCounterNew : null;
					this.button?.setRightCounter(rightCounterFiltered);
				}
			},
			text: {
				handler(text) {
					this.button?.setText(text);
				}
			},
			size: {
				handler(size) {
					this.button?.setSize(size);
				}
			},
			color: {
				handler(color) {
					this.button?.setState(color);
				}
			},
			state: {
				handler(state) {
					this.button?.setState(state);
				}
			},
			icon: {
				handler(icon) {
					this.button?.setIcon(icon, this.iconPosition);
				}
			},
			disabled: {
				handler(disabled) {
					this.button?.setDisabled(Boolean(disabled));
				},
				immediate: true,
				flush: 'sync'
			},
			waiting: {
				handler(waiting) {
					if (waiting !== this.button?.isWaiting()) {
						this.button?.setWaiting(waiting);
						if (!waiting && this.disabled) {
							this.button?.setDisabled(true);
						}
					}
				},
				immediate: true
			},
			style: {
				handler(style) {
					this.button?.setStyle(style);
				}
			},
			clocking: {
				handler(clocking) {
					if (clocking !== this.button?.isClocking()) {
						this.button?.setClocking(clocking);
					}
				},
				immediate: true
			}
		},
		template: `
		<span>
			<button ref="button">
				<slot></slot>
			</button>
		</span>
	`
	};

	exports.AirButtonStyle = ui_buttons.AirButtonStyle;
	exports.ButtonColor = ui_buttons.ButtonColor;
	exports.ButtonIcon = ui_buttons.ButtonIcon;
	exports.ButtonSize = ui_buttons.ButtonSize;
	exports.ButtonStyle = ui_buttons.ButtonStyle;
	exports.Button = Button;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX.UI, BX);
//# sourceMappingURL=button.bundle.js.map
