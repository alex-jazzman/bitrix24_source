/**
 * @module im/messenger/controller/selector/forward
 */
jn.define('im/messenger/controller/selector/forward', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('loc');
	const REPLY_MANAGER_KEY = 'reply-manager';

	class ForwardSelector
	{
		/**
		 * @param {Object} props
		 * @param {number[]} props.messageIds
		 * @param {string} props.fromDialogId
		 * @param {Object} [props.locator]
		 * @param {() => void | Promise} [props.onDialogSelected]
		 */
		constructor(props)
		{
			this.onDialogSelected = props?.onDialogSelected;
			this.messageIds = props?.messageIds;
			this.fromDialogId = props?.fromDialogId;

			this.locator = props?.locator ?? null;
		}

		open()
		{
			openDialogSelector({
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TITLE'),
				providerOptions: {},
				onItemSelected: this.#onDialogSelected,
				closeOnSelect: true,
			});
		}

		/**
		 * @param {Object} item
		 * @param {string} item.id
		 */
		#onDialogSelected = async ({ item }) => {
			const dialogId = item.id;

			if (this.onDialogSelected)
			{
				await this.onDialogSelected();
			}

			if (String(dialogId) === String(this.fromDialogId) && this.locator)
			{
				this.locator.get(REPLY_MANAGER_KEY).startForwardingMessages(this.messageIds);

				return;
			}

			const openDialogParams = {
				dialogId,
				forwardMessageIds: this.messageIds,
			};

			MessengerEmitter.emit(EventType.messenger.openDialog, openDialogParams, 'im.messenger');
		};
	}

	module.exports = { ForwardSelector };
});
