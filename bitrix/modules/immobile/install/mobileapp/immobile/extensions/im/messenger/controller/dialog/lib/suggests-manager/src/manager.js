/**
 * @module im/messenger/controller/dialog/lib/suggests-manager/manager
 */
jn.define('im/messenger/controller/dialog/lib/suggests-manager/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { EventType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const logger = getLoggerWithContext('dialog--suggests-manager', 'Suggest');

	const SuggestDesign = Object.freeze({
		primary: 'primary',
		success: 'success',
		alert: 'alert',
		grey: 'grey',
		black: 'black',
		disabledAlike: 'disabled-alike',
		bitrixGpt: 'bitrix-gpt',
	});

	const SuggestSize = Object.freeze({
		S: 'S',
		M: 'M',
		L: 'L',
	});

	const SuggestMode = Object.freeze({
		solid: 'solid',
		outline: 'outline',
		tinted: 'tinted',
	});

	/**
	 * @class SuggestsManager
	 */
	class SuggestsManager
	{
		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = this.dialogLocator.get('dialogId');
		}

		/**
		 * @return {SuggestsShowParams|null}
		 */
		static getParams(dialogId)
		{
			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper)
			{
				return null;
			}

			if (dialogHelper.isCopilot)
			{
				return SuggestsManager.getCopilotParams();
			}

			return null;
		}

		get view()
		{
			return this.dialogLocator.get('view');
		}

		get isShown()
		{
			return this.view.suggests.isShown;
		}

		subscribeViewEvents()
		{
			this.view.suggests.on(EventType.dialog.suggests.itemTap, this.#onItemTap);
		}

		unsubscribeViewEvents()
		{
			this.view.suggests.off(EventType.dialog.suggests.itemTap, this.#onItemTap);
		}

		subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('messagesModel/setChatCollection', this.#onChatCollectionChanged)
			;
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('messagesModel/setChatCollection', this.#onChatCollectionChanged)
			;
		}

		show()
		{
			const params = SuggestsManager.getParams(this.dialogId);
			if (!params)
			{
				return;
			}

			logger.log(`${this.constructor.name}.show`);

			this.view.suggests.show(params);

			AnalyticsService.getInstance().sendSuggestsShow({
				dialogId: this.dialogId,
				modesState: this.#getSettingsSnapshot(),
			});
		}

		hide()
		{
			logger.log(`${this.constructor.name}.hide`);

			this.view.suggests.hide();
		}

		/**
		 * @param {MutationPayload<MessagesSetChatCollectionData, MessagesSetChatCollectionActions>} payload
		 */
		#onChatCollectionChanged = ({ payload }) => {
			if (!this.isShown)
			{
				return;
			}

			const chatId = DialogHelper.createByDialogId(this.dialogId)?.chatId;
			if (!chatId)
			{
				return;
			}

			const messageList = payload?.data?.messageList ?? [];
			const hasMessageForCurrentChat = messageList.some((message) => message.chatId === chatId);
			if (hasMessageForCurrentChat)
			{
				this.hide();
			}
		};

		/**
		 * @param {string} itemId
		 */
		#onItemTap = (itemId) => {
			const items = SuggestsManager.getParams(this.dialogId)?.items ?? [];
			const item = items.find((suggestItem) => suggestItem.id === itemId);
			if (!item)
			{
				return;
			}

			logger.log(`${this.constructor.name}.#onItemTap`, item);

			AnalyticsService.getInstance().sendSuggestsClick({
				dialogId: this.dialogId,
				suggestText: item.text,
				modesState: this.#getSettingsSnapshot(),
			});

			this.hide();
			this.dialogLocator.get('message-sender').sendTextMessage(item.text);
		};

		/**
		 * @return {ModesState|null}
		 */
		#getSettingsSnapshot()
		{
			return this.dialogLocator.get('assistant-button-manager')?.getSettingsSnapshot() ?? null;
		}

		/**
		 * @return {SuggestsShowParams|null}
		 */
		static getCopilotParams()
		{
			const phrases = Loc.getCopilotSuggests();
			if (!Type.isArrayFilled(phrases))
			{
				return null;
			}

			const defaultItemProps = {
				iconName: null,
				imageUrl: null,
				size: SuggestSize.M,
				design: SuggestDesign.grey,
				mode: SuggestMode.solid,
				rounded: true,
				dropdown: false,
				customStyle: {
					backgroundColor: Color.chatOverallOverlay.toHex(),
				},
			};

			return {
				title: {
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SUGGESTS_COPILOT_TITLE'),
				},
				items: phrases.map((text, index) => {
					const id = `copilot_suggest_${index + 1}`;

					return {
						...defaultItemProps,
						id,
						testId: id,
						text,
					};
				}),
			};
		}
	}

	module.exports = { SuggestsManager };
});
