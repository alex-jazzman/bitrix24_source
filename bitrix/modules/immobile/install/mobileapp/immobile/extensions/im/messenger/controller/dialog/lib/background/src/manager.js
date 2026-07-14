/**
 * @module im/messenger/controller/dialog/lib/background/manager
 */
jn.define('im/messenger/controller/dialog/lib/background/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { Theme } = require('im/lib/theme');

	const { DialogBackgroundId } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { BackgroundConfiguration } = require('im/messenger/controller/dialog/lib/background/configuration');

	const logger = getLogger('dialog--dialog');

	/**
	 * @class BackgroundManager
	 */
	class BackgroundManager
	{
		/**
		 * @constructor
		 * @param {DialogId} dialogId
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogId, dialogLocator })
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;
			/** @type {DialogId} */
			this.dialogId = dialogId;
			/** @type {MessengerCoreStore} */
			this.store = this.dialogLocator.get('store');
			/** @type {string} */
			this.themeId = Theme.getInstance().getId();
		}

		/**
		 * @param {string} chatType
		 * @return {BackgroundConfiguration}
		 */
		static getOptimisticConfiguration(chatType)
		{
			if (!Feature.isDialogBackgroundAvailable || !Feature.isBitrixGptV2Available)
			{
				return {};
			}

			const themeId = Theme.getInstance().getId();

			return BackgroundConfiguration[themeId][chatType] ?? {};
		}

		/**
		 * @return {BackgroundConfiguration}
		 */
		getConfiguration()
		{
			if (!Feature.isDialogBackgroundAvailable || !this.isAvailableByDialogType())
			{
				return {};
			}

			const id = this.resolveBackgroundId();

			return Type.isStringFilled(id) ? this.getBackgroundById(id) : {};
		}

		/**
		 * @return {string|null}
		 */
		resolveBackgroundId()
		{
			const helper = DialogHelper.createByDialogId(this.dialogId);
			if (helper?.isAiAssistant)
			{
				return DialogBackgroundId.aiAssistant;
			}

			if (helper?.isCopilot)
			{
				return DialogBackgroundId.copilot;
			}

			if (helper?.isCollab)
			{
				return helper.hasCollaber
					? DialogBackgroundId.collab
					: DialogBackgroundId.collabWithoutCollaber;
			}

			return this.getValidStoreBackgroundId();
		}

		/**
		 * @return {string|null}
		 */
		getValidStoreBackgroundId()
		{
			const dialogBackgroundId = this.store.getters['dialoguesModel/getBackgroundId'](this.dialogId);
			if (this.hasBackground(dialogBackgroundId))
			{
				return dialogBackgroundId;
			}

			const userBackgroundId = this.store.getters['usersModel/getBotBackgroundId'](this.dialogId);
			if (this.hasBackground(userBackgroundId))
			{
				return userBackgroundId;
			}

			return null;
		}

		/**
		 * @param {string} id
		 * @return {boolean}
		 */
		hasBackground(id)
		{
			return Boolean(BackgroundConfiguration[this.themeId][id]);
		}

		/**
		 * @param {string} id
		 * @return {BackgroundConfiguration}
		 */
		getBackgroundById(id)
		{
			return BackgroundConfiguration[this.themeId][id] ?? {};
		}

		/**
		 * @return {boolean}
		 */
		isAvailableByDialogType()
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			if (!dialogHelper)
			{
				return false;
			}

			if (Feature.isBitrixGptV2Available)
			{
				return true;
			}

			if (!Feature.isNestedChatAvailable && dialogHelper.isCollab)
			{
				return false;
			}

			return !dialogHelper.isCopilot;
		}

		/**
		 * @void
		 */
		update()
		{
			if (!Feature.isDialogBackgroundAvailable || !this.isAvailableByDialogType())
			{
				return;
			}

			try
			{
				const newConfiguration = this.getConfiguration();
				const view = this.dialogLocator.get('view');
				view.setBackground(newConfiguration);
			}
			catch (error)
			{
				logger.warn(`${this.constructor.name}.update.catch:`, error);
			}
		}
	}

	module.exports = {
		BackgroundManager,
	};
});
