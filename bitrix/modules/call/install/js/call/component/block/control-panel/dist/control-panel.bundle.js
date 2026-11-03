/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallControlPanel = ui_vue3.defineComponent({
		name: 'CallControlPanel',
		components: {},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		template: `
		<div class="call-control-panel"></div>
	`
	});

	exports.CallControlPanel = CallControlPanel;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3);
//# sourceMappingURL=control-panel.bundle.js.map
