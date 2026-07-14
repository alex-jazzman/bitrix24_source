/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, im_v2_component_message_base, im_v2_lib_feature) {
	'use strict';

	// @vue/component
	const CollabCreationMessage = {
		name: 'CollabCreationMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			isCopilotAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			copilotItemText() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_INVITE_PARTICIPANTS');
				}
				return this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_BITRIX_GPT');
			},
			listItems() {
				return [{
					text: this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_CHATS'),
					iconName: ui_iconSet_api_vue.Outline.CHATS
				}, {
					text: this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_GROUP'),
					iconName: ui_iconSet_api_vue.Outline.GROUP
				}, {
					text: this.copilotItemText,
					iconName: ui_iconSet_api_vue.Outline.BITRIX_GPT
				}];
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withReactions="false"
			:withBackground="false"
		>
			<div class="bx-im-message-collab-create__container">
				<div class="bx-im-message-collab-create__image"/>
				<div class="bx-im-message-collab-create__content">
					<div class="bx-im-message-collab-create__title">
						{{ loc('IM_MESSAGE_COLLAB_CREATE_PROJECT_TITLE') }}
					</div>
					<div
						v-for="item in listItems"
						class="bx-im-message-collab-create__item"
					>
						<BIcon :name="item.iconName" />
						<span class="bx-im-message-collab-create__item-text">
							{{ item.text }}
						</span>
					</div>
				</div>
			</div>
		</BaseMessage>
	`
	};

	exports.CollabCreationMessage = CollabCreationMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.UI.IconSet, window, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Lib);
//# sourceMappingURL=collab-creation.bundle.js.map
