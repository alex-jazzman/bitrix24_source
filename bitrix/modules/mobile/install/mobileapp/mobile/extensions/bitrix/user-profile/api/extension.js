/**
 * @module user-profile/api
 */
jn.define('user-profile/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { TabType } = require('user-profile/const');

	const cacheTtl = 86400;

	const fetchTabs = ({
		ownerId,
		selectedTabId,
	}) => {
		const cacheId = `user-profile-tabs-${env.userId}-${ownerId}-${selectedTabId}`;

		return new Promise((resolve) => {
			new RunActionExecutor(
				'mobile.Profile.getTabs',
				{
					ownerId,
					selectedTabId,
				},
			)
				.enableJson()
				.setCacheId(cacheId)
				.setCacheTtl(cacheTtl)
				.setHandler(resolve)
				.setCacheHandler(resolve)
				.setSkipRequestIfCacheExists()
				.call(true);
		});
	};

	const fetchTabData = ({
		tabType = TabType.COMMON,
		ownerId,
	}) => {
		const cacheId = `user-profile-tab-content-${env.userId}-${ownerId}-${tabType}`;

		return new Promise((resolve) => {
			new RunActionExecutor(
				'mobile.Profile.getTabData',
				{
					tabType,
					ownerId,
				},
			)
				.enableJson()
				.setCacheId(cacheId)
				.setCacheTtl(cacheTtl)
				.setHandler(resolve)
				.setCacheHandler(resolve)
				.setSkipRequestIfCacheExists()
				.call(true);
		});
	};

	const fetchNewProfileFeatureEnabled = () => {
		return new Promise((resolve) => {
			const handler = (response) => {
				if (response.status === 'success')
				{
					resolve(response.data);

					return;
				}

				resolve(false);
			};

			new RunActionExecutor(
				'mobile.Profile.isNewProfileFeatureEnabled',
				{},
			)
				.enableJson()
				.setCacheTtl(cacheTtl)
				.setHandler(handler)
				.setCacheHandler(handler)
				.setSkipRequestIfCacheExists()
				.call(true);
		});
	};

	module.exports = {
		fetchTabs,
		fetchTabData,
		fetchNewProfileFeatureEnabled,
	};
});
