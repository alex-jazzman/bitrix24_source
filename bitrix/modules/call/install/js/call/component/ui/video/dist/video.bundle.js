/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallVideo = ui_vue3.defineComponent({
		name: 'CallVideo',
		props: {
			testId: {
				type: String,
				default: null
			},
			srcObject: {
				type: Object,
				default: null
			},
			mirrored: {
				type: Boolean,
				default: false
			},
			muted: {
				type: Boolean,
				default: true
			},
			objectFit: {
				type: String,
				default: 'cover',
				validator: value => ['cover', 'contain'].includes(value)
			}
		},
		computed: {
			additionalClasses() {
				const classes = [`--fit-${this.objectFit}`];
				if (this.mirrored) {
					classes.push('--mirror');
				}
				return classes;
			}
		},
		template: `
		<video
			:data-testid="testId"
			:data-test-state="muted ? 'muted' : 'unmuted'"
			class="call-video"
			:class="additionalClasses"
			:srcObject.prop="srcObject"
			:muted="muted"
			autoplay
			playsinline
		/>
	`
	});

	exports.CallVideo = CallVideo;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=video.bundle.js.map
