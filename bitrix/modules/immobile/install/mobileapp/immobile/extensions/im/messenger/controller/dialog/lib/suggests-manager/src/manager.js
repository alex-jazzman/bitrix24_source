/**
 * @module im/messenger/controller/dialog/lib/suggests-manager/manager
 */
jn.define('im/messenger/controller/dialog/lib/suggests-manager/manager', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

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

		show()
		{
			if (true) // TODO: Back not ready yet
			{
				return;
			}

			const params = SuggestsManager.getParams(this.dialogId);
			if (!params)
			{
				return;
			}

			logger.log(`${this.constructor.name}.show`);

			this.view.suggests.show(params);
		}

		hide()
		{
			logger.log(`${this.constructor.name}.hide`);

			this.view.suggests.hide();
		}

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

			this.hide();
			this.dialogLocator.get('message-sender').sendTextMessage(item.text);
		};

		/**
		 * @return {SuggestsShowParams}
		 */
		static getCopilotParams()
		{
			const defaultItemProps = {
				iconName: null,
				imageUrl: null,
				size: SuggestSize.M,
				design: SuggestDesign.bitrixGpt,
				mode: SuggestMode.solid,
				rounded: true,
				dropdown: false,
			};

			return {
				title: {
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SUGGESTS_COPILOT_TITLE'),
				},
				items: [
					{
						...defaultItemProps,
						id: 'copilot_suggest_1',
						testId: 'copilot_suggest_1',
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SUGGESTS_COPILOT_ITEM_1'),
					},
					{
						...defaultItemProps,
						id: 'copilot_suggest_2',
						testId: 'copilot_suggest_2',
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SUGGESTS_COPILOT_ITEM_2'),
					},
					{
						...defaultItemProps,
						id: 'copilot_suggest_3',
						testId: 'copilot_suggest_3',
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SUGGESTS_COPILOT_ITEM_3'),
					},
				],
			};
		}
	}

	module.exports = { SuggestsManager };
});
