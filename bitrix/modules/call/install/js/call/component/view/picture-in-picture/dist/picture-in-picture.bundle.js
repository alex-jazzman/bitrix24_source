/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallPictureInPicture = ui_vue3.defineComponent({
		name: 'CallPictureInPicture',
		components: {},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		template: `
		<div class="call-picture-in-picture"></div>
	`
	});

	exports.CallPictureInPicture = CallPictureInPicture;

})(this.BX.Call.Component.View = this.BX.Call.Component.View || {}, BX.Vue3);
//# sourceMappingURL=picture-in-picture.bundle.js.map
