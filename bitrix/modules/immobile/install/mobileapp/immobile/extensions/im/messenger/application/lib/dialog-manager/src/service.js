/**
 * @module im/messenger/application/lib/dialog-manager/service
 */
jn.define('im/messenger/application/lib/dialog-manager/service', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatDataProvider } = require('im/messenger/provider/data');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class DialogManagerService
	 */
	class DialogManagerService
	{
		static #instance;

		/** @type {ChatDataProvider} */
		#chatDataProvider;
		/** @type {ChatService} */
		#chatService;

		/**
		 * @return {DialogManagerService}
		 */
		static getInstance()
		{
			if (!this.#instance)
			{
				this.#instance = new this();
			}

			return this.#instance;
		}

		constructor()
		{
			this.logger = getLoggerWithContext('messenger--dialog-manager', this);

			this.#chatDataProvider = new ChatDataProvider();
			this.#chatService = new ChatService();
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get #store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @param dialogId
		 * @return {Promise<DialoguesModelState|null>}
		 */
		async getDialogByDialogId(dialogId)
		{
			const result = await this.#chatDataProvider.get({ dialogId });
			if (result.hasData())
			{
				return result.getData();
			}

			const dialogFromServer = await this.#chatService.getByDialogId(dialogId);
			await this.#store.dispatch('dialoguesModel/set', dialogFromServer);
			const dialog = this.#store.getters['dialoguesModel/getById'](dialogId);

			this.logger.log('getDialog complete:', dialogId, dialog);

			return dialog;
		}
	}

	module.exports = { DialogManagerService };
});
