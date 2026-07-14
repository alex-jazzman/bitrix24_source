/**
 * @module im/messenger/lib/src/feature
 */
jn.define('im/messenger/lib/src/feature', (require, exports, module) => {
	const { Feature: MobileFeature } = require('feature');
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { NativeFeatureWrapper } = require('im/messenger/lib/src/native-feature');

	const dynamicProperties = {
		localStorageEnable: true,
		localStorageReadOnlyModeEnable: false,
	};

	/**
	 * @param {string} minVersion - e.g. '5.6.300'
	 * @return {boolean}
	 */
	function isAppVersionAtLeast(minVersion)
	{
		return Application.getAppVersion()
			.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) >= 0
		;
	}

	/**
	 * @class Feature
	 */
	class Feature
	{
		/**
		 * @protected
		 */
		static isLocalStorageEnabledDuringApplicationStartup = null;

		static get nativeFeature()
		{
			return NativeFeatureWrapper.getInstance();
		}

		static getIsLocalStorageEnabledDuringApplicationStartup()
		{
			if (this.isLocalStorageEnabledDuringApplicationStartup === null)
			{
				this.isLocalStorageEnabledDuringApplicationStartup = (
					MessengerParams.isChatLocalStorageAvailable()
					&& Feature.isLocalStorageSupported
					&& Feature.getChatSettings().localStorageEnable
				);
			}

			return this.isLocalStorageEnabledDuringApplicationStartup;
		}

		/**
		 * @param {Partial<ImFeatures>} features
		 */
		static updateExistingImFeatures(features)
		{
			return MessengerParams.updateExistingImFeatures(features);
		}

		static getChatSettings()
		{
			return Application.storage.getObject('settings.chat', {
				chatBetaEnable: false,
				chatDevModeEnable: false,
				localStorageEnable: true,
				autoplayVideo: true,
				autoSaveFiles: {
					enabled: true,
					maxSize: 10_485_760,
				},
			});
		}

		static get isChatBetaEnabled()
		{
			return Feature.getChatSettings().chatBetaEnable;
		}

		static get isLocalStorageEnabled()
		{
			return (
				Feature.getIsLocalStorageEnabledDuringApplicationStartup()
				&& dynamicProperties.localStorageEnable
			);
		}

		static get isLocalStorageSupported()
		{
			const isSupportedAndroid = (
				Application.getPlatform() === 'android'
				&& parseInt(Application.getBuildVersion(), 10) >= 2443
			);
			const isSupportedIos = device.platform === 'iOS'
				&& parseInt(device.version, 10) >= 15
			;

			return isSupportedAndroid || isSupportedIos;
		}

		static get isLocalStorageReadOnlyModeEnable()
		{
			return dynamicProperties.localStorageReadOnlyModeEnable;
		}

		static get isCopilotEnabled()
		{
			return MessengerParams.getImFeatures().copilotActive;
		}

		static get isAutoplayVideoEnabled()
		{
			return Feature.getChatSettings().autoplayVideo;
		}

		static get isAutoSaveFilesEnabled()
		{
			return Application.getApiVersion() >= 59 && Feature.getChatSettings().autoSaveFiles;
		}

		static disableLocalStorage()
		{
			dynamicProperties.localStorageEnable = false;
		}

		static enableLocalStorage()
		{
			dynamicProperties.localStorageEnable = true;
		}

		static disableLocalStorageReadOnlyMode()
		{
			dynamicProperties.localStorageReadOnlyModeEnable = false;
		}

		static enableLocalStorageReadOnlyMode()
		{
			dynamicProperties.localStorageReadOnlyModeEnable = true;
		}

		static get isChatDialogListSupportsSubtitleBbCodes()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isChatRecentItemTypeInSearchOverlayAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isSidebarFilesEnabled()
		{
			return MessengerParams.getImFeatures().sidebarFiles;
		}

		static get isSidebarLinksEnabled()
		{
			return MessengerParams.getImFeatures().sidebarLinks;
		}

		static get isChatSharingLinkAvailable()
		{
			return MessengerParams.getImFeatures().chatSharingLinkAvailable === true;
		}

		static get isSidebarV2Enabled()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isCollabAvailable()
		{
			return MessengerParams.getImFeatures().collabAvailable;
		}

		static get isCollabCreationAvailable()
		{
			return MessengerParams.getImFeatures().collabCreationAvailable;
		}

		static get isCopilotMentionAvailable()
		{
			return MessengerParams.getImFeatures().isCopilotMentionAvailable;
		}

		static get isInstantPushEnabled()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isDevelopmentEnvironment()
		{
			return (Application.isBeta() && MessengerParams.get('IS_DEVELOPMENT_ENVIRONMENT', false));
		}

		static get isDevModeEnabled()
		{
			return Feature.getChatSettings().chatDevModeEnable;
		}

		static get isBitrixGptV2Available()
		{
			return MessengerParams.getImFeatures().isBitrixGptV2Available;
		}

		static get isBitrixGptV2Enabled()
		{
			return Feature.isBitrixGptV2Available
				&& Feature.nativeFeature.isFeatureEnabled('bitrix_gpt_brand_v1');
		}

		static get isAvatarRadialGradientEnabled()
		{
			return Feature.isBitrixGptV2Available
				&& Feature.nativeFeature?.isFeatureEnabled('avatar_radial_gradient');
		}

		static showUnsupportedWidget(options = {}, parentWidget = PageManager)
		{
			const defaultOptions = {
				isOldBuild: false,
			};

			MobileFeature.showDefaultUnsupportedWidget({
				...defaultOptions,
				...options,
			}, parentWidget);
		}

		static get isLottieInChatTitleAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isNotesBannerAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isNotesIconAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isDialogBackgroundAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isIntranetInvitationAvailable()
		{
			return MessengerParams.getImFeatures().intranetInviteAvailable && env.installedModules?.intranetmobile;
		}

		static get isSupportedMediaCollection()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isMessagesAutoDeleteNativeAvailable()
		{
			return Feature.isTitleIconsInDialogHeaderAvailable
				&& Feature.isImageInRecentAvatarStyleAvailable;
		}

		static get isIOSChangeTabInBackgroundAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isTitleIconsInDialogHeaderAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isImageInRecentAvatarStyleAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isPinInRecentStyleAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isBackToReplyAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isMessagesAutoDeleteEnabled()
		{
			return MessengerParams.getImFeatures().messagesAutoDeleteEnabled;
		}

		static get isSpotlightIdInTabViewAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isVoteMessageAvailable()
		{
			return (
				Feature.nativeFeature.isFeatureEnabled('chat-vote')
				&& env.installedModules?.vote
				&& MessengerParams.getImFeatures().voteCreationAvailable
			);
		}

		static get isPinPanelNewAPIAvailable()
		{
			return Application.getApiVersion() >= 60 && Feature.nativeFeature.isFeatureEnabled('chat-multi-pin');
		}

		static get isChatAvatarAccentTypePurpleAvailable()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isFloatingButtonsBarAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat-like-mention-comments');
		}

		static get isAiAssistantMessageSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat-ai-assistant');
		}

		static get isErrorMessageAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat-error-message');
		}

		static get isRecentLikeAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat-recent-like');
		}

		static get isAsyncRecentOperationsAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('listwidget-api-v1');
		}

		static get isDialogHeaderButtonIconSupported()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isSetQuoteParamsSupported()
		{
			return Application.getApiVersion() >= 58;
		}

		static isAudioPanelSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('audioplayer_api_v1')
				&& MessengerParams.canUseAudioPanel();
		}

		static get isNotifyPanelAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_notify_panel');
		}

		static get isTabsWidgetApiV2Supported()
		{
			return Feature.nativeFeature.isFeatureEnabled('tabswidget_api_v2');
		}

		static get isTabsWidgetApiV3Supported()
		{
			return Feature.nativeFeature.isFeatureEnabled('tabswidget_api_v3');
		}

		static get isAiFileTranscriptionAvailable()
		{
			return MessengerParams.getImFeatures().aiFileTranscriptionAvailable;
		}

		static get isAudioRecordM4ASupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('audio_record_m4a_support');
		}

		static get isAudioRecordM4AEnabled()
		{
			return this.isAudioRecordM4ASupported && this.isAiFileTranscriptionAvailable;
		}

		static get isVideoNoteSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_video_record');
		}

		static get isVideoNoteTranscriptionNativeAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_transcribation_video');
		}

		static get isVideoNoteTranscriptionAvailable()
		{
			return this.isVideoNoteTranscriptionNativeAvailable
				&& MessengerParams.getImFeatures().videoNoteTranscriptionAvailable;
		}

		/**
		 * @desc If available, means (animations, methods, sizes, and multiple states) are available for chat.
		 */
		static get isChatReactionV2NativeSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_reaction_v2');
		}

		/**
		 * @desc If available, means size and animation changes for new reactions are available in application.
		 */
		static get isReactionV2NativeSupported()
		{
			return MobileFeature?.isNewReactionVersionSupported() ?? false;
		}

		/**
		 * @desc If enabled, then all functionality for new reactions is available (multiple, animations, sizes, quantity)
		 */
		static get isReactionsV2Enabled()
		{
			return this.isChatReactionV2NativeSupported
				&& this.isReactionV2NativeSupported;
		}

		static get isTranscribationBbcodeSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_transcribation_bbcode');
		}

		static get isTranscribationBbcodeEventsSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_transcribation_bbcode_events');
		}

		static get isStickersEnabled()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_stickers');
		}

		static get isCopilotSelectModelEnabled()
		{
			return MessengerParams.getCopilotSelectModelEnabled();
		}

		static get isAssistantButtonsSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_assistant_buttons');
		}

		static get isCopilotReasoningAvailable()
		{
			return MessengerParams.getImFeatures().isCopilotReasoningAvailable && this.isAssistantButtonsSupported;
		}

		static get isAiAssistantMCPSelectorAvailable()
		{
			return this.isAssistantButtonsSupported
				&& MessengerParams.getImFeatures().aiAssistantMcpSelectorAvailable;
		}

		static get isMarkdownParserEnabled()
		{
			return MessengerParams.isMarkdownParserEnabled();
		}

		static get isOpenlinesInMessengerAvailable()
		{
			return MessengerParams.isOpenlinesInMessengerAvailable();
		}

		static get isAiTaskCreationUISupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_ai_task_create');
		}

		static get isAiTaskCreationUIAvailable()
		{
			return MessengerParams.isAiTaskCreationUIAvailable();
		}

		static get isAiTaskCreationEnabled()
		{
			return MessengerParams.isAutoTasksEnabled();
		}

		static get isAttachPickerForBitrixGPTAvailable()
		{
			return MessengerParams.getImFeatures().isCopilotFileUploadAvailable;
		}

		static get isTasksRecentListAvailable()
		{
			return MessengerParams.getTasksRecentListAvailable();
		}

		static get isAiAssistantFeedbackAvailable()
		{
			return MessengerParams.getImFeatures().isAiAssistantFeedbackAvailable;
		}

		static get isAiAssistantRegenerateAvailable()
		{
			return MessengerParams.getImFeatures().isAiAssistantRegenerateAvailable;
		}

		static get isCopilotMCPButtonAvailable()
		{
			return MessengerParams.getImFeatures().aiAssistantMcpSelectorAvailable;
		}

		static get isSearchModeButtonAvailable()
		{
			const features = MessengerParams.getImFeatures();

			return features.isCopilotForceSearchAvailable
				&& features.isCopilotWebSearchEnabledByAdmin;
		}

		static get isAgentButtonAvailable()
		{
			return MessengerParams.getImFeatures().isAiAssistantAgentModeAvailable;
		}

		static get isAssistantMarketButtonAvailable()
		{
			return this.isAssistantButtonsSupported
				&& Feature.nativeFeature?.isFeatureEnabled('chat_mention_actions')
				&& MessengerParams.isMarketAvailable();
		}

		static get isNativeStickerMessageSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_sticker_type') ?? false;
		}

		static get isEmptyFilterIconSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('ws_empty_filter') ?? false;
		}

		static get isWelcomeScreenLayoutComponentSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('welcome_screen_layout_component') ?? false;
		}

		static get isRecentFilterAvailable()
		{
			return MessengerParams.isRecentFilterAvailable();
		}

		static get isAddingUserByMentionAvailable()
		{
			return MessengerParams.getImFeatures().isAddingUserByMentionAvailable
			&& Feature.nativeFeature?.isFeatureEnabled('chat_mention_actions');
		}

		static get isBannerButtonNewlineSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_banner_button_newline') ?? false;
		}

		static get isFootnoteMessageIdAvailable()
		{
			return Feature.nativeFeature?.isFeatureEnabled('footnote_message_id') ?? false;
		}

		static get isBlockMessageAvailable()
		{
			return MessengerParams.getImFeatures().isMessageBuilderAvailable && this.isBlockMessageSupported;
		}

		static get isBlockMessageSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_builder');
		}

		static get isCopilotAnimatedScrollSupported()
		{
			return Feature.isBitrixGptV2Available && (Feature.nativeFeature?.isFeatureEnabled('chat_bitrixgpt_scroll') ?? false);
		}

		static get isChatDialogTextFieldActionsSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_textfield_stylable');
		}

		static get isChatDialogTextFieldMultiLevelActionsSupported()
		{
			return Feature.isChatDialogTextFieldActionsSupported
				&& Application.getPlatform() === 'ios'
				&& parseInt(device.version, 10) >= 16
			;
		}

		static get isMultilevelMessageMenuSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_multilevel_menu') ?? false;
		}

		static get isChatDialogExpandingQuoteSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_message_quote_expanding');
		}

		static get isChatDialogCompactQuoteSupported()
		{
			return Feature.isChatDialogExpandingQuoteSupported;
		}

		static get isNestedChatAvailable()
		{
			return MessengerParams.getImFeatures().isNestedChatAvailable;
		}

		static get isExternalChatMessageForwardingAvailable()
		{
			return MessengerParams.isExternalChatMessageForwardingAvailable();
		}

		static get isMessageActionsSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_message_actions_v1') ?? false;
		}

		static get isSystemMessageStyleSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_additional_styles') ?? false;
		}

		static get isRecentMultiBadgeAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_recent_multi_badge');
		}

		static get isChatFoldersAvailable()
		{
			if (Application.getPlatform() === 'ios' && !isAppVersionAtLeast('5.6.300'))
			{
				return false;
			}

			return MessengerParams.getImFeatures().isChatFoldersAvailable === true
				&& Feature.isTabsWidgetApiV3Supported
			;
		}
	}

	module.exports = { Feature, MobileFeature };
});
