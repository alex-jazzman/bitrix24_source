/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports) {
	'use strict';

	// @vue/component
	const CreateChatButton = {
		name: 'CreateChatButton',
		props: {
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div class="bx-im-list-container-create-chat__container">
			<div v-if="isLoading" class="bx-im-list-container-create-chat__spinner"></div>
			<div v-else class="bx-im-list-container-create-chat__icon"></div>
		</div>
	`
	};

	exports.CreateChatButton = CreateChatButton;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {});
//# sourceMappingURL=create-chat-button.bundle.js.map
