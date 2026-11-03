/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_icon) {
	'use strict';

	const CallRecordingIndicator = ui_vue3.defineComponent({
		name: 'CallRecordingIndicator',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
		props: {
			time: {
				type: Number,
				default: 0
			}
		},
		computed: {
			formattedTime() {
				const seconds = this.time;
				const hours = Math.floor(seconds / 3600);
				const minutes = Math.floor(seconds % 3600 / 60);
				const secs = seconds % 60;
				if (hours > 0) {
					return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
				}
				return `${minutes}:${String(secs).padStart(2, '0')}`;
			}
		},
		template: `
		<div class="call-record-indicator">
			<div class="call-record-indicator__icon">
				<CallIcon icon="record-solid" :size="12"/>
			</div>
			<div class="call-record-indicator__time">{{ formattedTime }}</div>
		</div>
	`
	});

	exports.CallRecordingIndicator = CallRecordingIndicator;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Ui);
//# sourceMappingURL=record-indicator.bundle.js.map
