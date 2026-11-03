/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallConference = ui_vue3.defineComponent({
		name: 'CallConference',
		components: {},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		template: `
		<div class="call-conference"></div>
	`
	});

	exports.CallConference = CallConference;

})(this.BX.Call.Component.View = this.BX.Call.Component.View || {}, BX.Vue3);
//# sourceMappingURL=conference.bundle.js.map
