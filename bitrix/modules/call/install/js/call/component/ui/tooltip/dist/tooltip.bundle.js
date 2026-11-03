/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallTooltipPositions = new Set(['top', 'right', 'bottom', 'left']);
	const CALL_TOOLTIP_DEFAULT_POSITION = 'top';

	const CallTooltip = ui_vue3.defineComponent({
		name: 'CallTooltip',
		props: {
			value: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			testId: {
				type: String,
				default: ''
			},
			tooltipClass: {
				type: String,
				default: ''
			},
			position: {
				type: String,
				default: CALL_TOOLTIP_DEFAULT_POSITION,
				validator: value => CallTooltipPositions.has(value)
			}
		},
		computed: {
			tooltipClasses() {
				const classes = [`--${this.position}`];
				if (this.tooltipClass) {
					classes.push(this.tooltipClass);
				}
				return classes;
			},
			isTooltipVisible() {
				return !this.disabled && this.value.length > 0;
			}
		},
		template: `
		<div class="call-tooltip-container">
			<slot></slot>
			<div
				v-if="isTooltipVisible"
				class="call-tooltip"
				:class="tooltipClasses"
				:data-test-id="testId || null"
			>
				{{ value }}
			</div>
		</div>
	`
	});

	exports.CALL_TOOLTIP_DEFAULT_POSITION = CALL_TOOLTIP_DEFAULT_POSITION;
	exports.CallTooltip = CallTooltip;
	exports.CallTooltipPositions = CallTooltipPositions;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=tooltip.bundle.js.map
