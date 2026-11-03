/**
 * @module im/messenger/lib/src/feature
 */
jn.define('im/messenger/lib/src/feature', (require, exports, module) => {
	const { Feature: MobileFeature } = require('feature');
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { NativeFeatureWrapper } = require('im/messenger/lib/src/native-feature');
	const { NativeFeatureName, UserType } = require('im/messenger/const');
	const { contacts } = require('native/contacts');

	const dynamicProperties = {
		localStorageEnable: true,
		localStorageReadOnlyModeEnable: false,
	};

	/**
	 * The leading numeric segments of a version. The application reports a build tail next to them
	 * ('5.23.0 (4299) debug'), and the tail orders nothing: reading stops at the first segment that
	 * does not start with a number.
	 *
	 * @param {string} version - e.g. '5.6.300'
	 * @return {Array<number>}
	 */
	function getVersionSegments(version)
	{
		const segments = [];

		for (const part of String(version).split('.'))
		{
			const segment = Number.parseInt(part, 10);
			if (Number.isNaN(segment))
			{
				break;
			}

			segments.push(segment);
		}

		return segments;
	}

	/**
	 * Segment by segment and numerically. A textual comparison holds only while the segments are of
	 * equal length: it reads '5.10.0' as lower than '5.6.300' and '5.6.4' as higher, so the bound
	 * would close the feature on the newest build and let through the very build it stands against.
	 * A version no number can be read from counts as below any bound - the guarded build is the one
	 * that has to prove itself.
	 *
	 * @param {string} minVersion - e.g. '5.6.300'
	 * @return {boolean}
	 */
	function isAppVersionAtLeast(minVersion)
	{
		const versionSegments = getVersionSegments(Application.getAppVersion());
		const minVersionSegments = getVersionSegments(minVersion);

		for (const [index, minSegment] of minVersionSegments.entries())
		{
			const segment = versionSegments[index] ?? 0;
			if (segment !== minSegment)
			{
				return segment > minSegment;
			}
		}

		return true;
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

		static get isHeicImageSupported()
		{
			if (Application.getPlatform() === 'ios')
			{
				return true;
			}

			return Application.getPlatform() === 'android'
				&& Feature.nativeFeature.isFeatureEnabled('converter_heic_support')
			;
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

		static get isForwardMultipleRecipientsAvailable()
		{
			return MessengerParams.getImFeatures().isForwardMultipleRecipientsAvailable === true;
		}

		static get isSidebarV2Enabled()
		{
			return Application.getApiVersion() >= 60;
		}

		static get isCollabAvailable()
		{
			return MessengerParams.getImFeatures().collabAvailable;
		}

		static get isCollabPreviewSourceAvailable()
		{
			return MessengerParams.getImFeatures().collabPreviewSourceEnabled;
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

		static get isBitrixGptStopGenerationAvailable()
		{
			return MessengerParams.getImFeatures().isBitrixGptStopGenerationAvailable === true;
		}

		/**
		 * Native capability for the send button stop state: the native 'chat_send_button_v2'
		 * feature exposes the DSButton state methods (setSendButton / setSendButtonState /
		 * setSendButtonToForcedState) used to drive the stop button.
		 *
		 * @return {boolean}
		 */
		static get isNativeStopSendButtonSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_send_button_v2');
		}

		/**
		 * Stop state of the send button during an active BitrixGPT generation.
		 *
		 * Double-gating (same as isReplyWithMediaAvailable):
		 *   - server flag isBitrixGptStopGenerationAvailable from getImFeatures()
		 *     (backend IM_FEATURES snapshot);
		 *   - native capability isNativeStopSendButtonSupported (send button stop state support).
		 */
		static get isStopGenerationAvailable()
		{
			return Feature.isBitrixGptStopGenerationAvailable
				&& Feature.isNativeStopSendButtonSupported;
		}

		/**
		 * Native capability for the AI glow animation applied to the copilot message bubble.
		 * Gated by the native 'chat_ai_glow_animation' feature; the JS side only mirrors the
		 * flag so the aiAnimation channel is not filled when the native glow is unavailable.
		 *
		 * @return {boolean}
		 */
		static get isBitrixGptAiGlowAnimationEnabled()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_ai_glow_animation') ?? false;
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

		static get isContactCardSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_contact_card')
				|| (
					Application.getPlatform() === 'ios'
					&& Type.isFunction(contacts?.saveContact)
				)
			;
		}

		static get isContactSaveSupported()
		{
			return Type.isFunction(contacts?.saveContact);
		}

		/**
		 * CAP-01: Reply with any media type (files, images, video notes, etc.).
		 *
		 * Gates the file/media reply path: when false, media is sent without reply_id (degradation),
		 * and reply-with-media menu scenarios are hidden.
		 * Regular text/sticker reply is NOT affected.
		 *
		 * Requires both:
		 *   - CAP-01 native flag 'chat_reply_with_media' — native build support for media reply link.
		 *   - Server FEAT-01 flag isReplyWithMediaAvailable from getImFeatures()
		 *     (backend Option im/reply_with_media_available).
		 *
		 * Double-gating: old native builds without 'chat_reply_with_media' return false even when
		 * the server FEAT-01 flag is enabled, preventing broken reply link on legacy clients.
		 */
		static get isReplyWithMediaAvailable()
		{
			return (
				Feature.nativeFeature.isFeatureEnabled('chat_reply_with_media')
				&& MessengerParams.getImFeatures().isReplyWithMediaAvailable === true
			);
		}

		static get isAddToChatPopupAvailable()
		{
			return MessengerParams.getImFeatures().isAddToChatPopupAvailable === true;
		}

		static get isChatBotCommandsAvailable()
		{
			// im.v2.Chat.Command.list is not in the guest controller allowlist, so a guest gets
			// neither the panel nor the "/" button: the request could only fail with ACCESS_DENIED
			if (MessengerParams.getUserInfo()?.type === UserType.guest)
			{
				return false;
			}

			return MessengerParams.getImFeatures().isChatBotCommandsAvailable === true;
		}

		static get isChatBotCommandsButtonAvailable()
		{
			return (
				Feature.nativeFeature.isFeatureEnabled('chat_input_buttons')
				&& Feature.isChatBotCommandsAvailable
			);
		}

		static get isChatMentionEmptyStateAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_mention_empty_state');
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

		static get isRecentContextMenuSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_recent_context_menu');
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

		/**
		 * Native BitrixGPT brand flag 'bitrix_gpt_brand_v1'. Gates the AI-task entry points
		 * (message menu item, selector panel button), not only the AI-task panel itself.
		 *
		 * @return {boolean}
		 */
		static get isBitrixGptBrandSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('bitrix_gpt_brand_v1');
		}

		static get isChatActionPanelMoreSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_action_panel_more') ?? false;
		}

		static get isTabsWidgetApiV2Supported()
		{
			return Feature.nativeFeature.isFeatureEnabled('tabswidget_api_v2');
		}

		static get isTabsWidgetApiV3Supported()
		{
			return Feature.nativeFeature.isFeatureEnabled('tabswidget_api_v3');
		}

		/**
		 * setTargetAsync() of the spotlight on these builds resolves outside the JS thread and takes the app
		 * down; fixed in 5.22.0.
		 *
		 * @return {boolean}
		 */
		static get isSpotlightTargetAsyncBroken()
		{
			return Application.getPlatform() === 'android'
				&& isAppVersionAtLeast('5.16.0')
				&& !isAppVersionAtLeast('5.22.0')
			;
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

		// A build without the native part ignores the rate field, draws no control and sends no
		// event, so the portal option is the only gate and no capability key is needed
		static get isVideoNotePlaybackRateAvailable()
		{
			return MessengerParams.isVideoNotePlaybackRateAvailable();
		}

		// both gates are needed: a build that does not render the caption would leave the text saved by
		// the edit invisible, so the server option alone must not open the edit of a video note
		static get isVideoNoteCaptionAvailable()
		{
			return (
				Feature.nativeFeature.isFeatureEnabled('chat_video_note_caption')
				&& MessengerParams.getImFeatures().isVideoNoteCaptionAvailable === true
			);
		}

		/**
		 * @desc If available, means (animations, methods, sizes, and multiple states) are available for chat.
		 */
		static get isChatReactionV2NativeSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_reaction_v2');
		}

		/**
		 * @desc If available, the native side supports the configurable main (quick) reaction:
		 * the settings entry, the primary-first quick row/picker and the native double-tap
		 * drawing (setPrimaryReaction). Purely native. There is no server flag.
		 */
		static get isDefaultReactionAvailable()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_primary_reaction') ?? false;
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
			return this.isAssistantButtonsSupported;
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

		static get isMarkdownNativeRendererAvailable()
		{
			return MessengerParams.isMarkdownNativeRendererAvailable();
		}

		static get isMarkdownNativeRendererSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_markdown_native_renderer_v1') ?? false;
		}

		/**
		 * Single source of the canonical native Markdown render mode.
		 * Conjunction of server parser rollout, server DTO-01 availability and native build capability;
		 * any false flag keeps the converter fully in fallback (no partial canonical contract).
		 */
		static get isMarkdownNativeRendererEnabled()
		{
			return Feature.isMarkdownParserEnabled
				&& Feature.isMarkdownNativeRendererAvailable
				&& Feature.isMarkdownNativeRendererSupported;
		}

		static get isOpenlinesInMessengerAvailable()
		{
			return MessengerParams.isOpenlinesInMessengerAvailable();
		}

		static get isAiTaskCreationUISupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_ai_task_create');
		}

		/**
		 * Native capability for the AI-task indication drawn around the message itself: the edge,
		 * the inner glow and the status row. Mirrors the native 'chat_ai_task_create_v2' flag only;
		 * the portal side of AI-task creation is read by separate getters over MessengerParams.
		 *
		 * @return {boolean}
		 */
		static get isAiTaskMessageIndicationSupported()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_ai_task_create_v2') ?? false;
		}

		static get isAiTaskCreationUIAvailable()
		{
			return MessengerParams.isAiTaskCreationUIAvailable();
		}

		static get isAiTaskCreationEnabled()
		{
			return MessengerParams.isAutoTasksEnabled();
		}

		static get isAiTaskCreationFromMessagesAvailable()
		{
			return MessengerParams.getImFeatures().isAiTaskCreationFromMessagesAvailable === true;
		}

		/**
		 * Gate of the AI-task entry points: the item of the message menu and the button of the selection
		 * action panel. The native gates are needed next to the portal options -- a build without the
		 * message indication draws nothing between the tap and the task card, so the entry point alone
		 * would offer an action that nothing on the screen answers.
		 *
		 * @return {boolean}
		 */
		static get isAiTaskCreationFromMessagesEntryPointAvailable()
		{
			return Feature.isAiTaskCreationFromMessagesAvailable
				&& Feature.isBitrixGptBrandSupported
				&& Feature.isAiTaskCreationUIAvailable
				&& Feature.isAiTaskMessageIndicationSupported;
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

		static get isCopilotDraftChatAvailable()
		{
			return MessengerParams.getImFeatures().isCopilotDraftChatAvailable;
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

		static get isVibecodeButtonAvailable()
		{
			return MessengerParams.getVibecodeButtonAvailable();
		}

		static get isVibecodeRecentActionAvailable()
		{
			return MessengerParams.isVibecodeRecentActionAvailable();
		}

		static get isVibecodeNewAppsBadgeAvailable()
		{
			return MessengerParams.isVibecodeNewAppsBadgeAvailable();
		}

		static get isVibecodeAppChatSendPermissionAvailable()
		{
			return MessengerParams.isVibecodeAppChatSendPermissionAvailable();
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

		static get isAddingUserByMentionAvailable()
		{
			return Feature.nativeFeature?.isFeatureEnabled('chat_mention_actions');
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
			return this.isBlockMessageSupported;
		}

		static get isBlockMessageSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_builder');
		}

		/**
		 * Server FEAT flag isMessageFormBlockAvailable from getImFeatures()
		 * (backend Option im/message_form_block_available, default off).
		 *
		 * Defensive client gate for the interactive form block: when false, mobile must not
		 * treat a `form` block element as supported and renders it through the unsupported-block
		 * path (see BlockMessage#gateUnsupportedFormBlock). The block message itself is already
		 * capability-gated by isBlockMessageAvailable (native 'chat_builder'); the form has no
		 * dedicated native capability, so no extra native flag is combined here.
		 */
		static get isMessageFormBlockAvailable()
		{
			return MessengerParams.getImFeatures().isMessageFormBlockAvailable === true;
		}

		/**
		 * Server FEAT flag isMessageFileAudioBlockAvailable from getImFeatures()
		 * (backend Option im/message_file_audio_block_available, default off).
		 *
		 * Defensive client gate for the `file` and `audio` block elements, the way
		 * isMessageFormBlockAvailable gates the form. It closes more than the rendering: the block
		 * files of the message menu (MessageHelper#getBlockFiles) and the block branch of the audio
		 * resolver (MessageHelper.resolveAudioFile) read it too.
		 *
		 * @return {boolean}
		 */
		static get isMessageFileAudioBlockAvailable()
		{
			return MessengerParams.getImFeatures().isMessageFileAudioBlockAvailable === true;
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

		static get isChatWithGuestsAvailable()
		{
			return MessengerParams.getImFeatures().isChatWithGuestsAvailable;
		}

		static get isNestedChatAvailable()
		{
			return MessengerParams.getImFeatures().isNestedChatAvailable;
		}

		static get isChatThreadsAvailable()
		{
			return MessengerParams.getImFeatures().isChatThreadsAvailable === true;
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

		static get isRecentItemButtonAvailable()
		{
			return Feature.nativeFeature.isFeatureEnabled(NativeFeatureName.chatRecentItemButton);
		}

		static get isChatRecentSubtitleAvatarSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('chat_recent_subtitle_avatar');
		}

		/**
		 * Why chat folders are closed. The build is told apart from the user on purpose: an
		 * application that cannot do folders is offered an update, while the application of a guest
		 * is fine and folders are closed to a guest by the portal.
		 *
		 * A reason added here reaches no screen by itself: the "All" tab lists the reasons that are
		 * offered the update one by one (config/src/global/all.js), so a new reason of the
		 * application falls into the greeting of an empty messenger - the silent refusal the update
		 * screen was built against. Add it to that list as well, or decide there that it belongs to
		 * the user and the greeting is right for it.
		 */
		static ChatFoldersUnavailabilityReason = Object.freeze({
			outdatedApplication: 'outdatedApplication',
			guest: 'guest',
			unsupportedTabsWidget: 'unsupportedTabsWidget',
		});

		/**
		 * @return {string|null} a value of Feature.ChatFoldersUnavailabilityReason, null when folders are available
		 */
		static getChatFoldersUnavailabilityReason()
		{
			// an iOS build below 5.6.300 crashes fatally on a tab added with selectable: false (daec57d40acb)
			if (Application.getPlatform() === 'ios' && !isAppVersionAtLeast('5.6.300'))
			{
				return Feature.ChatFoldersUnavailabilityReason.outdatedApplication;
			}

			if (MessengerParams.getUserInfo()?.type === UserType.guest)
			{
				return Feature.ChatFoldersUnavailabilityReason.guest;
			}

			if (!Feature.isTabsWidgetApiV3Supported)
			{
				return Feature.ChatFoldersUnavailabilityReason.unsupportedTabsWidget;
			}

			return null;
		}

		static get isChatFoldersAvailable()
		{
			return Feature.getChatFoldersUnavailabilityReason() === null;
		}

		static get isAttachChatToProjectAvailable()
		{
			return MessengerParams.getImFeatures().isAttachChatToProjectAvailable === true;
		}

		static get isMessageDateNavigationAvailable()
		{
			return MessengerParams.getImFeatures().isMessageDateNavigationAvailable === true;
		}

		/**
		 * Entry point of the chat date calendar. The server flag alone is not enough: the
		 * unavailable-day state and the ban on picking such a day live in the calendar of the
		 * native API v2, so a build without it cannot fulfil the feature at all.
		 *
		 * @return {boolean}
		 */
		static get isMessageDateNavigationEnabled()
		{
			return Feature.isMessageDateNavigationAvailable
				&& Feature.nativeFeature.isFeatureEnabled('jnlayout_calendar_api_v2');
		}

		/**
		 * Whether the build carries a button of its own in the search bar at all - a property of the
		 * application and of nothing else. It is what says whether the method may be called, so it
		 * must NOT depend on the feature: a button already on screen has to be removable after the
		 * server takes the feature away, and the removal goes through the very same method.
		 *
		 * @return {boolean}
		 */
		static get isSearchBarRightButtonSupported()
		{
			return Feature.nativeFeature.isFeatureEnabled('jnsearch_right_button_v1');
		}

		/**
		 * Shape of the entry point inside the chat search: builds with a button of their own in the
		 * search bar show it there, the rest keep the pinned row of the result list. Availability of
		 * the feature itself stays with isMessageDateNavigationEnabled.
		 *
		 * @return {boolean}
		 */
		static get isMessageDateNavigationSearchButtonEnabled()
		{
			return Feature.isMessageDateNavigationAvailable
				&& Feature.isSearchBarRightButtonSupported;
		}
	}

	module.exports = { Feature, MobileFeature };
});
