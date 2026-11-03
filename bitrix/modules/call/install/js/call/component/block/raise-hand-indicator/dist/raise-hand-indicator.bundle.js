/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallRaiseHandIndicator = ui_vue3.defineComponent({
		name: 'CallRaiseHandIndicator',
		components: {},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		template: `
		<div class="call-raise-hand-indicator"></div>
	`
	});

	exports.CallRaiseHandIndicator = CallRaiseHandIndicator;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3);
//# sourceMappingURL=raise-hand-indicator.bundle.js.map
