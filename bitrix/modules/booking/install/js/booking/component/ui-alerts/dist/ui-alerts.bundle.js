/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_alerts) {
	'use strict';

	// @vue/component
	const UiAlerts = {
		name: 'UiAlert',
		props: {
			text: {
				type: String,
				required: true
			},
			color: {
				type: String,
				default: null
			},
			size: {
				type: String,
				default: null
			},
			icon: {
				type: String,
				default: null
			},
			closeBtn: {
				type: Boolean,
				default: false
			},
			animated: {
				type: Boolean,
				default: false
			},
			customClass: {
				type: String,
				default: null
			}
		},
		watch: {
			text: {
				handler(text) {
					this.alert?.setText(text);
				}
			}
		},
		created() {
			this.createAlert();
		},
		mounted() {
			this.renderAlert();
		},
		unmount() {
			this.alert?.destroy();
		},
		methods: {
			createAlert() {
				this.alert = new ui_alerts.Alert({
					text: this.text,
					color: this.color,
					size: this.size,
					icon: this.icon,
					closeBtn: this.closeBtn,
					animated: this.animated,
					customClass: this.customClass
				});
			},
			renderAlert() {
				if (!this.alert) {
					this.createAlert();
				}
				this.alert.renderTo(this.$refs.alert);
			}
		},
		template: `
		<div ref="alert"></div>
	`
	};

	exports.AlertColor = ui_alerts.AlertColor;
	exports.AlertIcon = ui_alerts.AlertIcon;
	exports.AlertSize = ui_alerts.AlertSize;
	exports.UiAlerts = UiAlerts;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX.UI);
//# sourceMappingURL=ui-alerts.bundle.js.map
