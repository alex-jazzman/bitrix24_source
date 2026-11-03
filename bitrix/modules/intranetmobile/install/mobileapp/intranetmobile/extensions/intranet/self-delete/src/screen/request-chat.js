/**
 * @module intranet/self-delete/src/screen/request-chat
 */
jn.define('intranet/self-delete/src/screen/request-chat', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Alert, ButtonType } = require('alert');
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');
	const { BaseScreen } = require('intranet/self-delete/src/screen/base-screen');

	class RequestChatScreen extends BaseScreen
	{
		getTestIdPrefix()
		{
			return 'request-chat';
		}

		getDescription()
		{
			return [
				Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_DESC_1'),
				Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_DESC_2'),
			].join('\n\n');
		}

		getPrimaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_BTN_CREATE'),
				onClick: () => this.#openSelector(),
			};
		}

		#openSelector()
		{
			const { adminIds } = this.data;
			const initSelectedIds = (Array.isArray(adminIds) && adminIds.length > 0) ? [adminIds[0]] : [];

			SocialNetworkUserSelector
				.make({
					initSelectedIds,
					createOptions: {
						enableCreation: false,
					},
					allowMultipleSelection: true,
					closeOnSelect: true,
					provider: {
						options: {},
					},
					events: {
						onClose: (selectedEntities) => {
							const userIds = this.#extractUserIds(selectedEntities);
							if (userIds.length === 0)
							{
								// Selector closed with no participants selected — treated as cancel.
								return;
							}

							this.#callCreateRequestChat(userIds);
						},
					},
					widgetParams: {
						title: Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_SELECTOR_TITLE'),
						backdrop: {
							mediumPositionPercent: 70,
							horizontalSwipeAllowed: false,
						},
						sendButtonName: Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_BTN_CREATE'),
					},
				})
				.show({}, this.layoutWidget)
			;
		}

		/**
		 * `onClose` returns `getEntityItems()` = `{ ...item.params, imageUrl }`,
		 * i.e. params fields (id, type) are at the top level, with no nested `params`.
		 *
		 * @param {Array<{id: number|string, type: string}>} selectedEntities
		 * @returns {number[]}
		 */
		#extractUserIds(selectedEntities)
		{
			return (Array.isArray(selectedEntities) ? selectedEntities : [])
				.filter((item) => item?.type === 'user')
				.map((item) => Number(item.id))
				.filter((id) => id > 0);
		}

		/**
		 * @param {number[]} userIds
		 */
		#callCreateRequestChat(userIds)
		{
			new RunActionExecutor('intranet.v2.SelfDelete.createRequestChat', { userIds })
				.call()
				.then((response) => {
					const chatId = response?.data?.chatId;
					if (!chatId)
					{
						this.#showChatError(userIds);

						return;
					}

					this.#openDialog(chatId);
				})
				.catch(() => {
					this.#showChatError(userIds);
				});
		}

		/**
		 * @param {number} chatId
		 */
		#openDialog(chatId)
		{
			void requireLazy('im:messenger/api/dialog-opener').then(({ DialogOpener }) => {
				this.layoutWidget?.close(() => {
					void DialogOpener.open({ dialogId: `chat${chatId}` });
				});
			});
		}

		/**
		 * @param {number[]} retryUserIds
		 */
		#showChatError(retryUserIds)
		{
			Alert.confirm(
				Loc.getMessage('M_INTRANET_SELF_DELETE_ERROR_TITLE'),
				Loc.getMessage('M_INTRANET_SELF_DELETE_REQUEST_CHAT_ERROR_DESCRIPTION'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('M_INTRANET_SELF_DELETE_ERROR_RETRY'),
						onPress: () => {
							// Retry with the same selection; re-open the picker only if it was empty.
							if (retryUserIds && retryUserIds.length > 0)
							{
								this.#callCreateRequestChat(retryUserIds);
							}
							else
							{
								this.#openSelector();
							}
						},
					},
					{
						type: ButtonType.CANCEL,
					},
				],
			);
		}
	}

	module.exports = { RequestChatScreen };
});
