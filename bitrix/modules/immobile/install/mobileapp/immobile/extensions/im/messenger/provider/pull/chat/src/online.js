/**
 * @module im/messenger/provider/pull/chat/online
 */
jn.define('im/messenger/provider/pull/chat/online', (require, exports, module) => {
	const { clone } = require('utils/object');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('pull-handler--online');

	/**
	 * @class OnlinePullHandler
	 */
	class OnlinePullHandler extends BasePullHandler
	{
		getModuleId()
		{
			return 'online';
		}

		getSubscriptionType()
		{
			return BX.PullClient.SubscriptionType.Online;
		}

		handleList(params, extra, command)
		{
			if (this.interceptEvent(params, extra, command))
			{
				return;
			}

			this.updateOnline(params, extra, command);
		}

		handleUserStatus(params, extra, command)
		{
			if (this.interceptEvent(params, extra, command))
			{
				return;
			}

			this.updateOnline(params, extra, command);
		}

		/**
		 *
		 * @param {OnlineUpdateParams} params
		 * @param extra
		 * @param command
		 */
		updateOnline(params, extra, command)
		{
			if (this.interceptEvent(params, extra, command))
			{
				return;
			}

			if (extra.server_time_ago > 30)
			{
				return;
			}

			logger.log('OnlinePullHandler.updateOnline', params);

			const userCollection = params.users;

			Object.keys(userCollection).forEach((userId) => {
				let recentItem = clone(this.store.getters['recentModel/getById'](userId));
				if (!recentItem)
				{
					return;
				}

				recentItem = ChatUtils.objectMerge(recentItem, {
					user: RecentDataConverter.getUserDataFormat(userCollection[userId]),
				});

				this.store.dispatch('recentModel/set', [recentItem]);
				this.store.dispatch('usersModel/update', userCollection[userId]);
			});

			this.store.dispatch('usersModel/update', Object.values(userCollection));
		}
	}

	module.exports = {
		OnlinePullHandler,
	};
});
