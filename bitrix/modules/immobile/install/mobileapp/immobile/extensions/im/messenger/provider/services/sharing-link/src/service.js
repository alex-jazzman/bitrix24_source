/**
 * @module im/messenger/provider/services/sharing-link/src/service
 */
jn.define('im/messenger/provider/services/sharing-link/src/service', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('service--sharing-link');

	/**
	 * @class SharingLinkService
	 */
	class SharingLinkService
	{
		/** @type {Set<string>} */
		static #fetchedDialogs = new Set();

		/**
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		static isFetched(dialogId)
		{
			return SharingLinkService.#fetchedDialogs.has(dialogId);
		}

		/**
		 * @return {Object}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<Object>}
		 */
		async getIndividual(dialogId)
		{
			logger.log('SharingLinkService.getIndividual', dialogId);

			const result = await runAction(RestMethod.imV2ChatSharingLinkGetIndividual, {
				data: { dialogId },
			});

			const linkData = result?.sharingLink;
			if (linkData)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/set', linkData);
			}

			SharingLinkService.#fetchedDialogs.add(dialogId);

			return linkData;
		}

		/**
		 * @param {string} code
		 * @return {Promise<Object>}
		 */
		async regenerateIndividual(code)
		{
			logger.log('SharingLinkService.regenerateIndividual', code);

			const result = await runAction(RestMethod.imV2ChatSharingLinkRegenerateIndividual, {
				data: { code },
			});

			const newLink = result?.sharingLink;
			if (newLink)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/regenerate', { newLink });
			}

			return newLink;
		}

		/**
		 * @param {string} code
		 * @return {Promise<{dialogId: string}>}
		 */
		async joinByCode(code)
		{
			logger.log('SharingLinkService.joinByCode', code);

			const result = await runAction(RestMethod.imV2ChatJoinByCode, {
				data: { code },
			});

			return { dialogId: result.dialogId };
		}
	}

	module.exports = { SharingLinkService };
});
