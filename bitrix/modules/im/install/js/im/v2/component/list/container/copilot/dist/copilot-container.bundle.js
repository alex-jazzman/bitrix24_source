/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_public, im_v2_component_list_items_copilot, im_v2_const, im_v2_lib_analytics, im_v2_lib_logger, im_v2_provider_service_copilot, im_v2_lib_permission, im_v2_component_list_container_elements_createChatButton, im_v2_lib_copilot) {
	'use strict';

	// @vue/component
	const CopilotListContainer = {
		name: 'CopilotListContainer',
		components: {
			CopilotList: im_v2_component_list_items_copilot.CopilotList,
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton
		},
		emits: ['selectChat'],
		data() {
			return {
				isCreatingChat: false
			};
		},
		computed: {
			canCreate() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCopilot);
			},
			headerTitle() {
				return this.loc('IM_LIST_CONTAINER_COPILOT_HEADER_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
			im_v2_lib_logger.Logger.warn('List: Copilot container created');
		},
		methods: {
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.copilot,
					dialogId
				});
			},
			getCopilotChatService() {
				if (!this.copilotService) {
					this.copilotService = new im_v2_provider_service_copilot.CopilotChatService();
				}
				return this.copilotService;
			},
			async createChat() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(im_v2_const.ChatType.copilot);
				this.isCreatingChat = true;
				const newDialogId = await this.getCopilotChatService().createDefaultChat().catch(() => {
					this.isCreatingChat = false;
				});
				this.isCreatingChat = false;
				void im_public.Messenger.openCopilot(newDialogId);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">{{ headerTitle }}</div>
				<CreateChatButton
					v-if="canCreate"
					:isLoading="isCreatingChat"
					@click="createChat"
					class="bx-im-list-container-copilot__create-chat"
				/>
			</div>
			<div class="bx-im-list-container-copilot__elements_container">
				<div class="bx-im-list-container-copilot__elements">
					<CopilotList @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`
	};

	exports.CopilotListContainer = CopilotListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib);
//# sourceMappingURL=copilot-container.bundle.js.map
