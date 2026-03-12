/**
 * @module im/messenger/controller/selector/forward
 */
jn.define('im/messenger/controller/selector/forward', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');

	const REPLY_MANAGER_KEY = 'reply-manager';
	const MESSAGE_SENDER_KEY = 'message-sender';

	class ForwardSelector
	{
		/**
		 * @param {ForwardSelectorInitProps} props
		 */
		constructor(props)
		{
			this.props = props;
		}

		/**
		 * @param {Object} parentWidget
		 * @returns {Promise}
		 */
		open({ parentWidget })
		{
			return openDialogSelector({
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TITLE'),
				providerOptions: {
					withFavorite: true,
				},
				onItemSelected: this.#onDialogSelected,
				closeOnSelect: this.props.closeOnSelect ?? true,
			}, parentWidget);
		}

		/**
		 * @param {Object} item
		 * @param {string} item.id
		 */
		#onDialogSelected = async ({ item }) => {
			const {
				onDialogSelected,
				messageIds,
				fromDialogId,
				locator,
			} = this.props;

			const dialogId = item.id;
			const dialogHelper = DialogHelper.createByDialogId(dialogId);

			if (onDialogSelected)
			{
				await onDialogSelected();
			}

			if (dialogHelper.isNotes && String(dialogId) !== String(fromDialogId))
			{
				const replyManager = locator.get(REPLY_MANAGER_KEY);

				replyManager.startForwardingMessages(messageIds, false);
				await locator.get(MESSAGE_SENDER_KEY).sendForwardMessageToNotes(dialogId);
				replyManager.finishForwardingMessage(false);

				const toastType = messageIds.length > 1 ? ToastType.forwardMessages : ToastType.forwardMessage;
				Notification.showToast(toastType, null, {
					onButtonTap() {
						MessengerEmitter.emit(EventType.messenger.openDialog, { dialogId });
					},
				});

				return;
			}

			if (String(dialogId) === String(fromDialogId) && locator)
			{
				locator.get(REPLY_MANAGER_KEY).startForwardingMessages(messageIds);

				return;
			}

			const openDialogParams = {
				dialogId,
				forwardMessageIds: messageIds,
			};

			MessengerEmitter.emit(EventType.messenger.openDialog, openDialogParams, 'im.messenger');
		};
	}

	module.exports = { ForwardSelector };
});
