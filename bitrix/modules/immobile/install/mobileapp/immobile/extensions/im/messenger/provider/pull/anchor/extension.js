/**
 * @module im/messenger/provider/pull/anchor
 */
jn.define('im/messenger/provider/pull/anchor', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	/**
	 * @class AnchorPullHandler
	 */
	class AnchorPullHandler extends BasePullHandler
	{
		constructor()
		{
			const logger = getLoggerWithContext('pull-handler--anchor', 'AnchorPullHandler');
			super({ logger });
		}

		handleAddAnchor(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleAddAnchor: ', params);
			this.store.dispatch('anchorModel/add', params)
				.catch((error) => this.logger.error('handleAddAnchor.catch error:', error))
			;
		}

		handleDeleteAnchor(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleDeleteAnchor: ', params);
			this.store.dispatch('anchorModel/delete', params)
				.catch((error) => this.logger.error('handleDeleteAnchor.catch error:', error))
			;
		}

		handleDeleteAnchors(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleDeleteAnchors: ', params);

			const { chatIds } = params;

			chatIds.forEach((chatId) => {
				this.store.dispatch('anchorModel/deleteByChatId', { chatId })
					.catch((error) => this.logger.error('handleDeleteAnchor.catch error:', error))
				;
			});
		}

		handleDeleteChatAnchors(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleDeleteChatAnchors: ', params);
			this.store.dispatch('anchorModel/deleteByChatId', params)
				.catch((error) => this.logger.error('handleDeleteChatAnchor.catch error:', error))
			;
		}
	}

	module.exports = {
		AnchorPullHandler,
	};
});
