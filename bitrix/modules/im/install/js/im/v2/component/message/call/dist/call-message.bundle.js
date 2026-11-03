/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_message_default, call_widget_callMessage, ui_vue3) {
	'use strict';

	// @vue/component
	const CallMessage = ui_vue3.defineComponent({
		name: 'CallMessage',
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			messageComponentToRender() {
				return call_widget_callMessage.CallMessage || im_v2_component_message_default.DefaultMessage;
			}
		},
		template: `
		<component :is="messageComponentToRender" :item="item" :dialogId="dialogId" :withTitle="withTitle" />
	`
	});

	exports.CallMessage = CallMessage;
})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Call?.Widget??{}, BX?.Vue3??{});;
//# sourceMappingURL=call-message.bundle.js.map
