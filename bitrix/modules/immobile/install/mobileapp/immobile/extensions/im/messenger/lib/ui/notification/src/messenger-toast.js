/**
 * @module im/messenger/lib/ui/notification/messenger-toast
 */
jn.define('im/messenger/lib/ui/notification/messenger-toast', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { Icon } = require('assets/icons');
	const { showSafeToast, showOfflineToast, showErrorToast, Position } = require('toast');
	const { Color } = require('tokens');
	const { mergeImmutable } = require('utils/object');

	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('notifications');

	const ToastType = {
		unsubscribeFromComments: 'unsubscribeFromComments',
		subscribeToComments: 'subscribeToComments',
		deleteChat: 'deleteChat',
		deleteCollab: 'deleteCollab',
		deleteChannel: 'deleteChannel',
		chatAccessDenied: 'chatAccessDenied',
		messageNotFound: 'messageNotFound',
		selectMessageLimit: 'selectMessageLimit',
		sendFilesGalleryLimitExceeded: 'sendFilesGalleryLimitExceeded',
		autoDeleteActive: 'autoDeleteActive',
		autoDeleteNotActive: 'autoDeleteNotActive',
		messagesAutoDeleteDisabled: 'messagesAutoDeleteDisabled',
		clearMessagesHistory: 'clearMessagesHistory',
		errorConvertRoundVideo: 'errorConvertRoundVideo',
		reasoningDisabled: 'reasoningDisabled',
		copilotEngineChanged: 'copilotEngineChanged',
		forwardMessage: 'forwardMessage',
		forwardMessages: 'forwardMessages',
		sharingLinkCopied: 'sharingLinkCopied',
		sharingLinkRegenerated: 'sharingLinkRegenerated',
		sharingLinkRegenerateError: 'sharingLinkRegenerateError',
		sharingLinkInvalid: 'sharingLinkInvalid',
		sharingLinkChatNotFound: 'sharingLinkChatNotFound',
		folderUpdated: 'folderUpdated',
		folderCreated: 'folderCreated',
		folderDeleted: 'folderDeleted',
		folderSorted: 'folderSorted',
		folderSetChat: 'folderSetChat',
		marketAppsEmpty: 'marketAppsEmpty',
	};

	const ToastIconName = {
		[ToastType.subscribeToComments]: Icon.OBSERVER.getIconName(),
		[ToastType.unsubscribeFromComments]: Icon.CROSSED_EYE.getIconName(),
		[ToastType.autoDeleteActive]: Icon.TIMER.getIconName(),
		[ToastType.autoDeleteNotActive]: Icon.TIMER.getIconName(),
		[ToastType.sharingLinkCopied]: Icon.CHECK.getIconName(),
		[ToastType.sharingLinkRegenerated]: Icon.CHECK.getIconName(),
		[ToastType.sharingLinkInvalid]: Icon.LOCK.getIconName(),
		[ToastType.sharingLinkChatNotFound]: Icon.LOCK.getIconName(),
		[ToastType.folderUpdated]: Icon.CIRCLE_CHECK.getIconName(),
		[ToastType.folderCreated]: Icon.CIRCLE_CHECK.getIconName(),
		[ToastType.folderDeleted]: Icon.CIRCLE_CHECK.getIconName(),
		[ToastType.folderSorted]: Icon.CIRCLE_CHECK.getIconName(),
		[ToastType.folderSetChat]: Icon.CIRCLE_CHECK.getIconName(),
		[ToastType.marketAppsEmpty]: Icon.APPS.getIconName(),
	};

	const ToastPhrase = {
		get errorConvertRoundVideo()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_ERROR_CONVERT_ROUND_VIDEO');
		},
		get unsubscribeFromComments()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_UNSUBSCRIBE_COMMENTS');
		},
		get subscribeToComments()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SUBSCRIBE_COMMENTS');
		},
		get deleteChat()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_DELETE_CHAT');
		},
		get deleteCollab()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_DELETE_PROJECT');
		},
		get deleteChannel()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_DELETE_CHANNEL');
		},
		get chatAccessDenied()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_CHAT_ACCESS_DENIED');
		},
		get messageNotFound()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_MESSAGE_NOT_FOUND');
		},
		get sendFilesGalleryLimitExceeded()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SEND_FILES_GALLERY_LIMIT_EXCEEDED');
		},
		get selectMessageLimit()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SELECT_MESSAGE_LIMIT');
		},
		get autoDeleteActive()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_AUTO_DELETE_ENABLED');
		},
		get autoDeleteNotActive()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_AUTO_DELETE_DISABLED');
		},
		get messagesAutoDeleteDisabled()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_MESSAGES_AUTO_DELETE_DISABLED');
		},
		get clearMessagesHistory()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_MESSAGES_CLEAR_HISTORY');
		},
		get reasoningDisabled()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_REASONING_DISABLED');
		},
		get copilotEngineChanged()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_COPILOT_MODEL_CHANGED');
		},
		get forwardMessage()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FORWARD_MESSAGE');
		},
		get forwardMessages()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FORWARD_MESSAGES');
		},
		get sharingLinkCopied()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SHARING_LINK_COPIED');
		},
		get sharingLinkRegenerated()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SHARING_LINK_REGENERATED');
		},
		get sharingLinkRegenerateError()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SHARING_LINK_REGENERATE_ERROR');
		},
		get sharingLinkInvalid()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SHARING_LINK_INVALID');
		},
		get sharingLinkChatNotFound()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SHARING_LINK_CHAT_NOT_FOUND');
		},
		get folderUpdated()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FOLDER_UPDATED');
		},
		get folderCreated()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FOLDER_CREATED');
		},
		get folderDeleted()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FOLDER_DELETED');
		},
		get folderSorted()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FOLDER_SORTED');
		},
		get folderSetChat()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_FOLDER_SET_CHAT');
		},
		get marketAppsEmpty()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_MARKET_APPS_EMPTY');
		},
	};

	const ToastButtonText = {
		get forwardMessage()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_BUTTON_GOTO');
		},
		get forwardMessages()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_BUTTON_GOTO');
		},
	};

	const DEFAULT_MESSENGER_TOAST_OFFSET = 75;

	const customToastStyles = {
		unsubscribeFromComments: {
			backgroundColor: Theme.colors.chatOverallFixedBlack,
			backgroundOpacity: 0.5,
		},
		subscribeToComments: {
			backgroundColor: Theme.colors.chatOverallFixedBlack,
			backgroundOpacity: 0.5,
		},
		chatAccessDenied: {
			iconName: Icon.BAN.getIconName(),
		},
		messageNotFound: {
			iconName: Icon.BAN.getIconName(),
		},
		deleteChannel: {
			iconName: Icon.TRASHCAN.getIconName(),
		},
		deleteChat: {
			iconName: Icon.TRASHCAN.getIconName(),
		},
		selectMessageLimit: {
			iconName: Icon.CIRCLE_CHECK.getIconName(),
		},
		sendFilesGalleryLimitExceeded: {
			iconName: Icon.ALERT.getIconName(),
		},
		copilotEngineChanged: {
			iconName: Icon.COPILOT.getIconName(),
			offset: 30,
		},
		sharingLinkCopied: {
			position: Position.TOP,
			offset: 0,
		},
		sharingLinkRegenerated: {
			position: Position.TOP,
			offset: 0,
		},
		sharingLinkRegenerateError: {
			position: Position.TOP,
			offset: 0,
			backgroundColor: Color.accentMainAlert.toHex(),
		},
		sharingLinkInvalid: {
			position: Position.TOP,
			offset: 50,
			backgroundColor: Color.accentMainAlert.toHex(),
		},
		sharingLinkChatNotFound: {
			position: Position.TOP,
			offset: 50,
			backgroundColor: Color.accentMainAlert.toHex(),
		},
	};

	/**
	 * @class MessengerToast
	 */
	class MessengerToast
	{
		/**
		 *
		 * @param {ToastType} toastType
		 * @param layoutWidget
		 * @param {ShowToastParams} params
		 */
		static show(toastType, layoutWidget = null, params = {})
		{
			if (!(toastType in ToastType))
			{
				logger.error('MessengerToast.show error: unknown toast type', toastType);

				return;
			}

			let toastParams = {
				message: ToastPhrase[toastType],
				offset: DEFAULT_MESSENGER_TOAST_OFFSET,
			};

			if (customToastStyles[toastType])
			{
				toastParams = { ...toastParams, ...customToastStyles[toastType] };
			}

			if (ToastIconName[toastType])
			{
				toastParams.iconName = ToastIconName[toastType];
			}

			if (ToastButtonText[toastType])
			{
				toastParams.buttonText = ToastButtonText[toastType];
			}

			toastParams = { ...toastParams, ...params };

			showSafeToast(
				toastParams,
				layoutWidget,
			);
		}

		/**
		 * @param {ShowToastParams} params
		 * @param layoutWidget
		 */
		static showWithParams(params, layoutWidget = null)
		{
			if (!params.message)
			{
				logger.error(`${this.constructor.name}.showWithParams error: message not found`);

				return;
			}

			const toastParams = {
				message: params.message,
				offset: params.offset || 75,
				position: params.position || 'bottom',
			};

			if (params.svg)
			{
				toastParams.svg = {
					content: params.svg,
				};
			}

			if (params.icon && params.icon instanceof Icon)
			{
				toastParams.iconName = params.icon.getIconName();
			}

			if (params.backgroundColor)
			{
				toastParams.backgroundColor = params.backgroundColor;
			}

			if (params.backgroundOpacity)
			{
				toastParams.backgroundOpacity = params.backgroundOpacity;
			}

			showSafeToast(
				toastParams,
				layoutWidget,
			);
		}

		/**
		 * @param {ShowToastParams} params
		 * @param layoutWidget
		 */
		static showOfflineToast(params, layoutWidget = null)
		{
			showOfflineToast(params, layoutWidget);
		}

		/**
		 *
		 * @param {ShowToastParams} params
		 * @param layoutWidget
		 */
		static showErrorToast(params = {}, layoutWidget = null)
		{
			const toastParams = mergeImmutable(
				{
					message: Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_ERROR'),
					position: Position.BOTTOM,
					offset: DEFAULT_MESSENGER_TOAST_OFFSET,
				},
				params,
			);

			showErrorToast(toastParams, layoutWidget);
		}
	}

	module.exports = { MessengerToast, ToastType };
});
