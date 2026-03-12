/**
 * @module im/messenger/lib/src/feature
 */
jn.define('im/messenger/lib/src/feature', (require, exports, module) => {
	const { Feature: MobileFeature } = require('feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { NativeFeatureWrapper } = require('im/messenger/lib/src/native-feature');

	const dynamicProperties = {
		localStorageEnable: true,
		localStorageReadOnlyModeEnable: false,
	};

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
				&& MessengerParams.getImFeatures().aiAssistantMcpSelectorAvailable
				&& MessengerParams.isAiAssistantMcpSelectorAvailable();
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

		static get isTasksRecentListAvailable()
		{
			return MessengerParams.getTasksRecentListAvailable();
		}

		static get isNativeStickerMessageSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_sticker_type') ?? false;
		}

		static get isBannerButtonNewlineSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_banner_button_newline') ?? false;
		}
	}

	module.exports = { Feature, MobileFeature };
});
