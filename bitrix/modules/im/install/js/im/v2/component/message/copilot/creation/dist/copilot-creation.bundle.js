/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_v2_component_elements_avatar, im_v2_component_message_base, im_v2_const, im_v2_lib_analytics, im_v2_provider_service_sending) {
	'use strict';

	// @vue/component
	const ChatCopilotCreationMessage = {
		name: 'ChatCopilotCreationMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			MessageAvatar: im_v2_component_elements_avatar.MessageAvatar
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
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			message() {
				return this.item;
			},
			preparedTitle() {
				const phrase = this.message.componentParams?.copilotRoleUpdated ? 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE_AFTER_CHANGE' : 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE';
				return this.loc(phrase, {
					'#COPILOT_ROLE_NAME#': this.roleName
				});
			},
			promptList() {
				return this.$store.getters['copilot/messages/getPrompts'](this.message.id);
			},
			hasSuggestedPrompts() {
				return main_core.Type.isArrayFilled(this.promptList);
			},
			suggestsCount() {
				return this.promptList.length;
			},
			role() {
				return this.$store.getters['copilot/messages/getRole'](this.message.id);
			},
			roleName() {
				return this.role.name;
			}
		},
		mounted() {
			if (this.hasSuggestedPrompts) {
				this.subscribeToVisibility();
			}
		},
		beforeUnmount() {
			this.unsubscribeFromVisibility();
		},
		methods: {
			subscribeToVisibility() {
				this.$Bitrix.eventEmitter.subscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			},
			unsubscribeFromVisibility() {
				this.$Bitrix.eventEmitter.unsubscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			},
			onMessageIsVisible(event) {
				const {
					messageId,
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId || messageId !== this.message.id) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().copilot.onShowSuggestedPrompts(this.dialogId, this.message.id, this.suggestsCount);
			},
			onMessageClick(prompt) {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onClickSuggestedPrompt(this.dialogId, this.suggestsCount);
				void this.getSendingService().sendCopilotPrompt({
					text: prompt.text,
					copilot: {
						promptCode: prompt.code
					},
					dialogId: this.dialogId
				});
			},
			getSendingService() {
				if (!this.sendingService) {
					this.sendingService = im_v2_provider_service_sending.SendingService.getInstance();
				}
				return this.sendingService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
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
			<div class="bx-im-message-copilot-creation__container">
				<div class="bx-im-message-copilot-creation__header">
					<MessageAvatar 
						:messageId="message.id"
						:authorId="message.authorId"
						:size="AvatarSize.XXL"
					/>
					<div class="bx-im-message-copilot-creation__info">
						<div class="bx-im-message-copilot-creation__title" :title="preparedTitle">
							{{ preparedTitle }}
						</div>
						<div 
							class="bx-im-message-copilot-creation__text" 
							:title="loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC')"
						>
							{{ loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC') }}
						</div>
					</div>
				</div>
				<div class="bx-im-message-copilot-creation__separator"><div></div></div>
				<div class="bx-im-message-copilot-creation__actions">
					<div
						v-for="prompt in promptList"
						:key="prompt.code"
						@click="onMessageClick(prompt)"
						class="bx-im-message-copilot-creation__action"
					>
						<span class="bx-im-message-copilot-creation__action-text">
							{{ prompt.title }}
						</span>
					</div>
				</div>
			</div>
		</BaseMessage>
	`
	};

	exports.ChatCopilotCreationMessage = ChatCopilotCreationMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=copilot-creation.bundle.js.map
