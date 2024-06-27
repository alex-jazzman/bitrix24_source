/**
 * @module im/messenger/lib/ui/notification/messenger-toast
 */
jn.define('im/messenger/lib/ui/notification/messenger-toast', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('loc');
	const { showSafeToast } = require('toast');

	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('notifications');

	const ToastType = {
		unsubscribeFromComments: 'unsubscribeFromComments',
		subscribeToComments: 'subscribeToComments',
	};

	const InlineSvg = {
		eye: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M26.8616 16.2202C25.9886 17.4679 21.5168 23.4581 16.1314 23.4581C10.7461 23.4581 6.27429 17.4679 5.40127 16.2202C5.30427 16.0815 5.30427 15.9068 5.40127 15.7682C6.27429 14.5205 10.7461 8.53027 16.1314 8.53027C21.5167 8.53027 25.9886 14.5205 26.8616 15.7682C26.9586 15.9068 26.9586 16.0815 26.8616 16.2202ZM19.9386 15.9942C19.9386 18.0969 18.234 19.8015 16.1313 19.8015C14.0285 19.8015 12.3239 18.0969 12.3239 15.9942C12.3239 13.8914 14.0285 12.1868 16.1313 12.1868C18.234 12.1868 19.9386 13.8914 19.9386 15.9942Z" fill="${Theme.colors.chatOverallBaseWhite2}" fill-opacity="0.7"/></svg>`,
		crossedEye: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.57764 7.00781L24.0532 23.4834L22.583 24.9536L20.1403 22.5106L20.041 22.5565C18.7903 23.1099 17.4974 23.3866 16.1624 23.3866C12.2146 23.3866 8.63582 20.9672 5.42596 16.1283C5.36246 16.0326 5.35187 15.9129 5.3942 15.8092L5.42596 15.7492L5.64533 15.423C6.74337 13.8137 7.88417 12.4846 9.06766 11.4357L6.1074 8.47804L7.57764 7.00781ZM16.1624 8.49079C20.1101 8.49079 23.6889 10.9102 26.8988 15.7491C26.9623 15.8448 26.9729 15.9645 26.9305 16.0682L26.8988 16.1282L26.6794 16.4544C25.6054 18.0284 24.4906 19.3343 23.3349 20.3722L19.8439 16.8805C19.9208 16.5793 19.9616 16.2638 19.9616 15.9387C19.9616 13.8405 18.2606 12.1395 16.1624 12.1395C15.837 12.1395 15.5211 12.1804 15.2197 12.2574L12.2827 9.32139C13.5337 8.76766 14.8269 8.49079 16.1624 8.49079ZM12.3632 15.9387C12.3632 18.0369 14.0641 19.7379 16.1624 19.7379C16.5287 19.7379 16.8828 19.6861 17.218 19.5893L12.5118 14.8831C12.415 15.2182 12.3632 15.5724 12.3632 15.9387Z" fill="${Theme.colors.chatOverallBaseWhite2}" fill-opacity="0.7"/></svg>`,
	};

	const ToastSvg = {
		unsubscribeFromComments: InlineSvg.crossedEye,
		subscribeToComments: InlineSvg.eye,
	};

	const ToastPhrase = {
		get unsubscribeFromComments() { return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_UNSUBSCRIBE_COMMENTS'); },
		get subscribeToComments() { return Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_SUBSCRIBE_COMMENTS'); },
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
		 */
		static show(toastType, layoutWidget = null)
		{
			if (!(toastType in ToastType))
			{
				logger.error('MessengerToast.show error: unknown toast type', toastType);

				return;
			}

			const toastParams = {
				message: ToastPhrase[toastType],
				offset: 75,
				backgroundColor: Theme.colors.chatOverallFixedBlack,
				backgroundOpacity: 0.5,
			};

			if (ToastSvg[toastType])
			{
				toastParams.svg = {
					content: ToastSvg[toastType],
				};
			}

			showSafeToast(
				toastParams,
				layoutWidget,
			);
		}
	}

	module.exports = { MessengerToast, ToastType };
});
