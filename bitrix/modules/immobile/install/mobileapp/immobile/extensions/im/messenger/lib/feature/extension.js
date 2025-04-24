/**
 * @module im/messenger/lib/feature
 */
jn.define('im/messenger/lib/feature', (require, exports, module) => {
	const { Feature: MobileFeature } = require('feature');

	const { MessengerParams } = require('im/messenger/lib/params');

	const dynamicProperties = {
		localStorageEnable: true,
		localStorageReadOnlyModeEnable: false,
	};

	/**
	 * @class Feature
	 */
	class Feature
	{
		static getChatSettings()
		{
			return Application.storage.getObject('settings.chat', {
				chatBetaEnable: false,
				chatDevModeEnable: false,
				localStorageEnable: true,
				autoplayVideo: true,
			});
		}

		static get isChatBetaEnabled()
		{
			return Feature.getChatSettings().chatBetaEnable;
		}

		static get isChatV2Enabled()
		{
			return MessengerParams.isChatM1Enabled();
		}

		static get isLocalStorageEnabled()
		{
			return (
				isLocalStorageEnabledDuringApplicationStartup
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

		static get isCallMessageSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isMessageAttachSupported()
		{
			return Application.getApiVersion() >= 55;
		}

		static get isMessageKeyboardSupported()
		{
			return Application.getApiVersion() >= 55;
		}

		static get isAvatarBorderStylesSupported()
		{
			return Application.getApiVersion() >= 55;
		}

		static get isChatDialogWidgetSupportsSendPutCallBbCodes()
		{
			return Application.getApiVersion() >= 55;
		}

		static get isNavigationContextSupportsGetStack()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isChatDialogWidgetSupportsBots()
		{
			return (
				this.isMessageAttachSupported
				&& this.isMessageKeyboardSupported
				&& this.isChatDialogWidgetSupportsSendPutCallBbCodes
			);
		}

		static get isMessageMenuAirIconSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isGalleryMessageSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isChatDialogWidgetFileDownloadTapEventSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isChatComposerSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isSidebarFilesEnabled()
		{
			return MessengerParams.getImFeatures().sidebarFiles;
		}

		static get isSidebarLinksEnabled()
		{
			return MessengerParams.getImFeatures().sidebarLinks;
		}

		static get isCollabSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isCollabAvailable()
		{
			return MessengerParams.getImFeatures().collabAvailable;
		}

		static get isCollabCreationAvailable()
		{
			return MessengerParams.getImFeatures().collabCreationAvailable;
		}

		static get isMultiSelectAvailable()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isInstantPushEnabled()
		{
			return Feature.isChatBetaEnabled && Application.getApiVersion() >= 59;
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

		static get isImagePickerCustomFieldsSupported()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isLottieInChatTitleAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isNotesIconAvailable()
		{
			return Application.getApiVersion() >= 59;
		}

		static get isIconBoxWithLidAvailable()
		{
			return Application.getApiVersion() >= 56;
		}

		static get isSupportedAdditionalTextInStatusField()
		{
			return Application.getApiVersion() >= 57;
		}

		static get isIntranetInvitationAvaliable()
		{
			return MessengerParams.getImFeatures().intranetInviteAvailable;
		}
	}

	const isLocalStorageEnabledDuringApplicationStartup = (
		MessengerParams.isChatM1Enabled()
		&& MessengerParams.isChatLocalStorageAvailable()
		&& Feature.isLocalStorageSupported
		&& Feature.getChatSettings().localStorageEnable
	);

	module.exports = { Feature };
});
