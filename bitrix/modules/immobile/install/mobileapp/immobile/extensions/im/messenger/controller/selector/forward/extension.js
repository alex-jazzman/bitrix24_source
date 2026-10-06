/**
 * @module im/messenger/controller/selector/forward
 */
jn.define('im/messenger/controller/selector/forward', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');
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
		async open({ parentWidget })
		{
			// Tabbed forward selector requires lazy-loading additional extensions (tasks,
			// channels, copilot list services) whose REST endpoints aren't whitelisted in
			// the guest scope (`MobileGuestApplication`). Fall back to the simple
			// openDialogSelector for guests — they only have access to one chat anyway.
			const canUseTabbed = !UserHelper.isCurrentUserGuest();
			const openSelector = canUseTabbed
				? await this.#getForwardDialogSelector()
				: openDialogSelector;

			const providerOptions = {
				withFavorite: true,
			};
			// Tabbed provider hardcodes guest filtering internally, so we only need to pass
			// excludeGuests when falling back to the simple openDialogSelector.
			if (!canUseTabbed)
			{
				providerOptions.excludeGuests = true;
			}

			return openSelector({
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TITLE'),
				providerOptions,
				onItemSelected: this.#onDialogSelected,
				closeOnSelect: this.props.closeOnSelect ?? true,
			}, parentWidget);
		}

		/**
		 * @return {Promise<Function>}
		 */
		async #getForwardDialogSelector()
		{
			const { openForwardDialogSelector } = await requireLazy('im:messenger/controller/selector/forward/tabbed', true);

			return openForwardDialogSelector;
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
