/**
 * @module im/messenger/controller/chat-invite/feedback
 */
jn.define('im/messenger/controller/chat-invite/feedback', (require, exports, module) => {
	const { showToast } = require('toast');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @param {SuccessInvitationToastParams} params
	 */
	const showSuccessInvitationToast = ({
		dialogId,
		multipleInvitation,
		isTextForInvite = true,
	}) => {
		let message = '';
		if (isTextForInvite)
		{
			message = multipleInvitation
				? Loc.getMessage('IMMOBILE_CHAT_INVITE_MULTIPLE_SEND_SUCCESS_TOAST_TEXT')
				: Loc.getMessage('IMMOBILE_CHAT_INVITE_SINGLE_SEND_SUCCESS_TOAST_TEXT');
		}
		else
		{
			message = multipleInvitation
				? Loc.getMessage('IMMOBILE_CHAT_INVITE_MULTIPLE_ADD_SUCCESS_TOAST_TEXT')
				: Loc.getMessage('IMMOBILE_CHAT_INVITE_SINGLE_ADD_SUCCESS_TOAST_TEXT');
		}

		showToast(
			{
				message,
				icon: Icon.CHECK,
				buttonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_TOAST_INVITE_BUTTON_TEXT'),
				onButtonTap: async () => {
					const store = serviceLocator.get('core').getStore();

					const currentDialogId = store.getters['applicationModel/getCurrentOpenedDialogId']();
					if (String(currentDialogId) !== String(dialogId))
					{
						return;
					}

					const { ChatInviteController } = await requireLazy(
						'im:messenger/controller/chat-invite',
					);
					ChatInviteController.open({ dialogId, store });
				},
				time: 5,
			},
		);
	};

	/**
	 * @desc Toast shown after guest link is successfully regenerated.
	 */
	const showRegenerateLinkSuccessToast = () => {
		showToast({
			message: Loc.getMessage('IMMOBILE_CHAT_INVITE_REGENERATE_LINK_SUCCESS_TOAST'),
			icon: Icon.CHECK,
			time: 3,
		});
	};

	/**
	 * @desc Generic toast for unknown errors in invite flows.
	 */
	const showGenericErrorToast = () => {
		showToast({
			message: Loc.getMessage('IMMOBILE_CHAT_INVITE_GENERIC_ERROR_TOAST'),
			time: 3,
		});
	};

	module.exports = {
		showSuccessInvitationToast,
		showRegenerateLinkSuccessToast,
		showGenericErrorToast,
	};
});
