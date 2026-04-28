/**
 * @module im/messenger/provider/services/read/src/service
 */
jn.define('im/messenger/provider/services/read/src/service', (require, exports, module) => {
	const {
		RecentTab,
		DialogType,
		RestMethod,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { runAction, callMethod } = require('im/messenger/lib/rest');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	/**
	 * @class ReadMessageService
	 */
	class ReadMessageService
	{
		#core = serviceLocator.get('core');

		constructor()
		{
			this.logger = getLoggerWithContext('counters--read-message-service', this);
		}

		async readAllMessages()
		{
			await this.#core.getStore().dispatch('anchorModel/clear').catch((error) => {
				this.logger.error('readAllMessages anchorModel/clear error: ', error);
			});

			await this.#core.getStore().dispatch('counterModel/readAllChats').catch((error) => {
				this.logger.error('readAllMessages counterModel/readAllChats error: ', error);
			});

			await callMethod(RestMethod.imV2ChatReadAll, {}).catch((error) => {
				this.logger.error('readAllMessages imV2ChatReadAll error: ', error);
			});

			await serviceLocator.get('counters-update-system').readAllChats();
		}

		async readAllMessagesByDialogType(dialogType)
		{
			if (dialogType !== DialogType.tasksTask)
			{
				throw new Error('ReadMessageService.readAllMessagesByDialogType: unsupported dialogType', dialogType);
			}

			await this.#core.getStore().dispatch('counterModel/readByRecentSection', {
				recentSection: RecentTab.tasksTask,
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType anchorModel/clearByType error: ', error);
			});

			await this.#core.getStore().dispatch('anchorModel/clearByDialogType', {
				dialogType,
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType anchorModel/clearByDialogType error: ', error);
			});

			await runAction(RestMethod.imV2ChatReadAllByType, {
				data: {
					type: dialogType,
				},
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType imV2ChatReadAllByType error: ', error);
			});

			serviceLocator.get('counters-update-system').readByRecentSection(RecentTab.tasksTask)
				.catch((error) => {
					this.logger.error('readAllMessagesByDialogType readByRecentSection error', error);
				});
		}
	}

	module.exports = { ReadMessageService };
});
