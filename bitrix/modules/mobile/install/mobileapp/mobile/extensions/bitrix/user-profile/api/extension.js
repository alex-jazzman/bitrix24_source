/**
 * @module user-profile/api
 */
jn.define('user-profile/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { guid } = require('utils/guid');

	const cacheTtlOneWeek = 604_800;
	const sharedStorageKey = 'user-profile';
	const appSessionKey = 'appSessionId';

	const getTabsDataCacheId = (ownerId, selectedTabId) => {
		return `user-profile-tabs-${env.userId}-${ownerId}-${selectedTabId}-${getAppSessionId()}`;
	};

	const getAppSessionId = () => {
		const sessionId = Application.sharedStorage(sharedStorageKey).get(appSessionKey);
		if (sessionId)
		{
			return sessionId;
		}

		const newSessionId = guid();
		Application.sharedStorage(sharedStorageKey).set(appSessionKey, newSessionId);

		return newSessionId;
	};

	const fetchTabs = ({
		ownerId,
		selectedTabId,
		handler,
		cacheHandler,
	}) => {
		getTabsDataRunActionExecutor({
			ownerId,
			selectedTabId,
		})
			.enableJson()
			.setHandler(handler)
			.setCacheHandler(cacheHandler)
			.call(true)
			.catch(console.error);
	};

	const createTabsDataExecutor = ({
		ownerId,
		selectedTabId,
	}) => {
		return new RunActionExecutor(
			'mobile.Profile.getTabs',
			{
				ownerId,
				selectedTabId,
			},
		);
	};

	const getTabsDataRunActionExecutor = ({
		ownerId,
		selectedTabId,
	}) => {
		const cacheId = getTabsDataCacheId(ownerId, selectedTabId);

		return createTabsDataExecutor({ ownerId, selectedTabId })
			.setCacheId(cacheId)
			.setCacheTtl(cacheTtlOneWeek)
		;
	};

	const getTabsDataRunActionExecutorNoCache = ({
		ownerId,
		selectedTabId,
	}) => {
		return createTabsDataExecutor({ ownerId, selectedTabId });
	};

	const getChatId = (userId) => {
		return new Promise((resolve, reject) => {
			BX.rest.callMethod(
				'call.CallLog.getChat',
				{ userId },
				(result) => {
					if (result.error())
					{
						reject(result.error());

						return;
					}

					const data = result.data();
					resolve(data.chatId);
				},
			);
		});
	};

	module.exports = {
		fetchTabs,
		getTabsDataRunActionExecutor,
		getTabsDataRunActionExecutorNoCache,
		getChatId,
	};
});
