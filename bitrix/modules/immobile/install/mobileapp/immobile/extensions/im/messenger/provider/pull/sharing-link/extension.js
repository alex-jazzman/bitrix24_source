/**
 * @module im/messenger/provider/pull/sharing-link
 */
jn.define('im/messenger/provider/pull/sharing-link', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base/pull-handler');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');

	const logger = LoggerManager.getInstance().getLogger('pull-handler--sharing-link');

	/**
	 * @class SharingLinkPullHandler
	 */
	class SharingLinkPullHandler extends BasePullHandler
	{
		/**
		 * @param {Object} params
		 * @param {Object} params.sharingLink
		 * @param {PullExtraParams} extra
		 */
		handleSharingLinkGenerate(params, extra)
		{
			if (this.interceptEvent(extra) || !Feature.isChatSharingLinkAvailable)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleSharingLinkGenerate`, params);

			const { sharingLink } = params;
			if (!sharingLink)
			{
				return;
			}

			void this.store.dispatch('sidebarModel/sidebarSharedLinkModel/set', sharingLink);
		}

		/**
		 * @param {Object} params
		 * @param {Object} params.sharingLink
		 * @param {PullExtraParams} extra
		 */
		handleSharingLinkUpdate(params, extra)
		{
			if (this.interceptEvent(extra) || !Feature.isChatSharingLinkAvailable)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleSharingLinkUpdate`, params);

			const { sharingLink } = params;
			if (!sharingLink)
			{
				return;
			}

			if (sharingLink.isRevoked)
			{
				void this.store.dispatch('sidebarModel/sidebarSharedLinkModel/deleteByChatId', {
					chatId: sharingLink.entityId,
				});

				return;
			}

			void this.store.dispatch('sidebarModel/sidebarSharedLinkModel/set', sharingLink);
		}
	}

	module.exports = {
		SharingLinkPullHandler,
	};
});
