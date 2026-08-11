/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_public, im_v2_component_list_items_copilot, im_v2_const, im_v2_lib_analytics, im_v2_lib_copilot, im_v2_lib_feature, im_v2_lib_logger, im_v2_lib_permission, im_v2_provider_service_copilot, ui_iconSet_api_vue, im_v2_component_elements_loader) {
	'use strict';

	// @vue/component
	const AiAssistantCreateChatButton = {
		name: 'AiAssistantCreateChatButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			isCreating: {
				type: Boolean,
				default: false
			}
		},
		emits: ['newChat'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			isLegacyStyles() {
				return !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			},
			spinnerColor() {
				return this.isLegacyStyles ? im_v2_component_elements_loader.SpinnerColor.copilot : im_v2_component_elements_loader.SpinnerColor.grey;
			}
		},
		methods: {
			loc(phrase) {
				return this.$Bitrix.Loc.getMessage(phrase);
			}
		},
		template: `
		<div
			class="bx-im-ai-assistant-create-chat-button__scope bx-im-ai-assistant-create-chat-button"
			:class="{ '--legacy': isLegacyStyles, '--loading': !isLegacyStyles && isCreating }"
			:title="loc('IM_LIST_CONTAINER_AI_ASSISTANT_NEW_CHAT')"
			@click="!isCreating && $emit('newChat')"
		>
			<Spinner
				v-if="isCreating"
				:size="SpinnerSize.XS"
				:color="spinnerColor"
			/>
			<BIcon
				v-else
				class="bx-im-ai-assistant-create-chat-button__icon"
				:name="OutlineIcons.PLUS_L"
			/>
		</div>
	`
	};

	// @vue/component
	const AiAssistantListContainer = {
		name: 'AiAssistantListContainer',
		components: {
			CopilotList: im_v2_component_list_items_copilot.CopilotList,
			AiAssistantCreateChatButton
		},
		emits: ['selectChat'],
		data() {
			return {
				isCreating: false
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
			async createChat() {
				if (this.isCreating) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(im_v2_const.ChatType.copilot);
				if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable)) {
					this.isCreating = true;
					try {
						const newDialogId = await this.getCopilotService().createDefaultChat();
						im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChat(newDialogId);
						im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
						void im_public.Messenger.openCopilot(newDialogId);
					} catch (error) {
						im_v2_lib_logger.Logger.error('AiAssistantListContainer: createChat failed', error);
					} finally {
						this.isCreating = false;
					}
					return;
				}
				void im_public.Messenger.openCopilot();
			},
			getCopilotService() {
				if (!this.copilotService) {
					this.copilotService = new im_v2_provider_service_copilot.CopilotChatService();
				}
				return this.copilotService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">{{ headerTitle }}</div>
				<AiAssistantCreateChatButton
					v-if="canCreate"
					:isCreating="isCreating"
					@newChat="createChat"
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

	exports.AiAssistantCreateChatButton = AiAssistantCreateChatButton;
	exports.AiAssistantListContainer = AiAssistantListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI.IconSet, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=registry.bundle.js.map
