/* eslint-disable */
this.BX = this.BX || {};
this.BX.IM = this.BX.IM || {};
this.BX.IM.V2 = this.BX.IM.V2 || {};
this.BX.IM.V2.Component = this.BX.IM.V2.Component || {};
this.BX.IM.V2.Component.Message = this.BX.IM.V2.Component.Message || {};
(function (exports, main_core, ui_iconSet_api_vue, im_v2_component_message_base, im_v2_lib_copilot, im_v2_lib_feature) {
	'use strict';

	// @vue/component
	const ConvertToCollabMessage = {
		name: 'ConvertToCollabMessage',
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
			listItems() {
				return [{
					icon: ui_iconSet_api_vue.Outline.TASK_LIST,
					text: this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_WORKFLOW_UNITY')
				}, {
					icon: ui_iconSet_api_vue.Outline.CHATS,
					text: this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_CHAT_BENEFIT')
				}, {
					icon: ui_iconSet_api_vue.Outline.BITRIX_GPT,
					text: this.copilotItemText
				}];
			},
			copilotItemText() {
				if (!this.isCopilotAvailable) {
					return this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_INVITE_PARTICIPANTS');
				}
				return this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_BITRIX_GPT', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			},
			preparedTitle() {
				return this.loc('IM_MESSAGE_PROJECT_CONVERT_TITLE', {
					'[br/]': '\n'
				});
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return main_core.Loc.getMessage(phraseCode, replacements);
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
			<div class="bx-im-message-collab-convert">
				<div class="bx-im-message-collab-convert__image"/>
				<div class="bx-im-message-collab-convert__content">
					<div class="bx-im-message-collab-convert__title">
						{{ preparedTitle }}
					</div>
					<div class="bx-im-message-collab-convert__description">
						<template v-for="listItem in listItems">
							<div class="bx-im-message-collab-convert__item">
								<BIcon
									class="bx-im-message-collab-convert__item-icon"
									:name="listItem.icon"
								/>
								<div class="bx-im-message-collab-convert__item-text">{{ listItem.text }}</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</BaseMessage>
	`
	};

	exports.ConvertToCollabMessage = ConvertToCollabMessage;

})(this.BX.IM.V2.Component.Message.Collab = this.BX.IM.V2.Component.Message.Collab || {}, BX, BX.UI.IconSet, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=convert.bundle.js.map
