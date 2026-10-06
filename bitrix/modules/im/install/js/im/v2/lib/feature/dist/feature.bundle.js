/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, ui_infoHelper, im_v2_const, im_v2_lib_feature, main_core) {
	'use strict';

	const CollabV2Manager = {
		isAvailable() {
			return im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isCollabV2Available'];
		},
		isCopyAvailable() {
			return im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isCollabV2CopyAvailable'];
		},
		openCopyFeatureSlider() {
			const promoter = new ui_infoHelper.FeaturePromoter({
				featureId: im_v2_const.SliderCode.collabV2CopyDisabled
			});
			promoter.show();
		},
		openFeatureSlider() {
			const promoter = new ui_infoHelper.FeaturePromoter({
				featureId: im_v2_const.SliderCode.collabV2Disabled
			});
			promoter.show();
		}
	};

	const CollabManager = {
		isAvailable() {
			return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabAvailable);
		},
		openFeatureSlider() {
			const promoter = new ui_infoHelper.FeaturePromoter({
				featureId: im_v2_const.SliderCode.collabDisabled
			});
			promoter.show();
		}
	};

	const MessagesAutoDelete = {
		openFeatureSlider() {
			const promoter = new ui_infoHelper.FeaturePromoter({
				code: im_v2_const.SliderCode.autoDeleteDisabled
			});
			promoter.show();
		}
	};

	const ChatHistoryManager = {
		isAvailable() {
			const {
				fullChatHistory
			} = this.getTariffRestrictions();
			return fullChatHistory.isAvailable;
		},
		getDaysLimit() {
			const {
				fullChatHistory
			} = this.getTariffRestrictions();
			return fullChatHistory.limitDays;
		},
		openFeatureSlider() {
			const promoter = new ui_infoHelper.FeaturePromoter({
				code: im_v2_const.SliderCode.historyLimited
			});
			promoter.show();
		},
		getLimitTitle() {
			return main_core.Loc.getMessage('IM_LIB_FEATURE_HISTORY_LIMIT_TITLE');
		},
		getLimitSubtitle(withEmphasis = false) {
			if (withEmphasis) {
				return main_core.Loc.getMessagePlural('IM_LIB_FEATURE_HISTORY_LIMIT_SUBTITLE', this.getDaysLimit(), {
					'#DAY_LIMIT#': this.getDaysLimit()
				});
			}
			return main_core.Loc.getMessagePlural('IM_LIB_FEATURE_HISTORY_LIMIT_SUBTITLE', this.getDaysLimit(), {
				'#DAY_LIMIT#': this.getDaysLimit(),
				'[action_emphasis]': '',
				'[/action_emphasis]': ''
			});
		},
		getLearnMoreText() {
			return main_core.Loc.getMessage('IM_LIB_FEATURE_HISTORY_LIMIT_LEARN_MORE');
		},
		getTooltipText() {
			return main_core.Loc.getMessage('IM_LIB_FEATURE_HISTORY_LIMIT_TOOLTIP');
		},
		getTariffRestrictions() {
			return im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/get'];
		}
	};

	const TariffManager = {
		collabV2: CollabV2Manager,
		collab: CollabManager,
		messagesAutoDelete: MessagesAutoDelete,
		chatHistory: ChatHistoryManager
	};

	const Feature = {
		chatV2: 'chatV2',
		openLinesV2: 'openLinesV2',
		chatDepartments: 'chatDepartments',
		copilotActive: 'copilotActive',
		copilotAvailable: 'copilotAvailable',
		sidebarLinks: 'sidebarLinks',
		sidebarFiles: 'sidebarFiles',
		sidebarBriefs: 'sidebarBriefs',
		zoomActive: 'zoomActive',
		zoomAvailable: 'zoomAvailable',
		collabAvailable: 'collabAvailable',
		collabCreationAvailable: 'collabCreationAvailable',
		enabledCollabersInvitation: 'enabledCollabersInvitation',
		changeInviteLanguageAvailable: 'changeInviteLanguageAvailable',
		inviteByLinkAvailable: 'inviteByLinkAvailable',
		inviteByPhoneAvailable: 'inviteByPhoneAvailable',
		documentSignAvailable: 'documentSignAvailable',
		intranetInviteAvailable: 'intranetInviteAvailable',
		voteCreationAvailable: 'voteCreationAvailable',
		messagesAutoDeleteEnabled: 'messagesAutoDeleteEnabled',
		teamsInStructureAvailable: 'teamsInStructureAvailable',
		isDesktopRedirectAvailable: 'isDesktopRedirectAvailable',
		aiAssistantBotAvailable: 'aiAssistantAvailable',
		isCopilotMentionAvailable: 'isCopilotMentionAvailable',
		aiAssistantChatAvailable: 'aiAssistantChatCreationAvailable',
		aiFileTranscriptionAvailable: 'aiFileTranscriptionAvailable',
		isTasksRecentListAvailable: 'isTasksRecentListAvailable',
		aiAssistantMcpSelectorAvailable: 'aiAssistantMcpSelectorAvailable',
		videoNoteTranscriptionAvailable: 'videoNoteTranscriptionAvailable',
		chatSharedLinkAvailable: 'chatSharingLinkAvailable',
		isCopilotFileUploadAvailable: 'isCopilotFileUploadAvailable',
		isTaskCardAvailable: 'isMountedTasksCardAvailable',
		isBitrixGptV2Available: 'isBitrixGptV2Available',
		isCopilotDraftChatAvailable: 'isCopilotDraftChatAvailable',
		isCollabV2Available: 'isNestedChatAvailable',
		isCollabPreviewSourceEnabled: 'collabPreviewSourceEnabled',
		isChatWithGuestsAvailable: 'isChatWithGuestsAvailable',
		isCopilotForceSearchAvailable: 'isCopilotForceSearchAvailable',
		isCopilotWebSearchEnabledByAdmin: 'isCopilotWebSearchEnabledByAdmin',
		isCopilotWebSearchAllowedByTariff: 'isCopilotWebSearchAllowedByTariff',
		isAiAssistantFeedbackAvailable: 'isAiAssistantFeedbackAvailable',
		isAiAssistantRegenerateAvailable: 'isAiAssistantRegenerateAvailable',
		isAiAssistantAgentModeAvailable: 'isAiAssistantAgentModeAvailable',
		isChatFoldersWebAvailable: 'isChatFoldersWebAvailable',
		isAttachToCollabV2Available: 'isAttachChatToProjectAvailable',
		isReplyWithMediaAvailable: 'isReplyWithMediaAvailable',
		isMarkdownAvailable: 'isMarkdownAvailable'
	};
	const FeatureManager = {
		isFeatureAvailable(featureName) {
			const {
				featureOptions = {}
			} = im_v2_application_core.Core.getApplicationData();
			return featureOptions[featureName] ?? false;
		}
	};

	exports.Feature = Feature;
	exports.FeatureManager = FeatureManager;
	exports.TariffManager = TariffManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.UI, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX);
//# sourceMappingURL=feature.bundle.js.map
