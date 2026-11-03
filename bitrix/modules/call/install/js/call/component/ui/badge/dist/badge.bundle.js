/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallBadgeSizes = new Set(['sm', 'md', 'lg']);
	const CallBadgeColors = new Set(['blue', 'red', 'yellow', 'green', 'gray']);

	const CallBadge = ui_vue3.defineComponent({
		name: 'CallBadge',
		props: {
			testId: {
				type: String,
				default: null,
				required: true
			},
			label: {
				type: [String, Number],
				default: null
			},
			size: {
				type: String,
				default: 'md',
				validator: value => CallBadgeSizes.has(value)
			},
			color: {
				type: [String],
				default: 'blue',
				validator: value => CallBadgeColors.has(value)
			}
		},
		computed: {
			additionalClasses() {
				const classes = [`--${this.size}`];
				if (this.color) {
					classes.push(`--${this.color}`);
				}
				return classes;
			}
		},
		template: `
		<span :data-testid="testId" class="call-badge" :class="additionalClasses">
			<slot>{{ label }}</slot>
		</span>
	`
	});

	exports.CallBadge = CallBadge;
	exports.CallBadgeColors = CallBadgeColors;
	exports.CallBadgeSizes = CallBadgeSizes;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=badge.bundle.js.map
