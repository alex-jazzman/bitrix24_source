/**
 * @module navigator/base
 */
jn.define('navigator/base', (require, exports, module) => {
	const { EntityReady } = require('entity-ready');

	const ACTION_DELAY = 300;
	const announcedSubscriptions = new Set();

	/**
	 * @class BaseNavigator
	 */
	class BaseNavigator
	{
		constructor(props)
		{
			this.navigator = PageManager.getNavigator();
		}

		/**
		 * @return {boolean}
		 */
		isActiveTab()
		{
			return this.navigator.isActiveTab();
		}

		isVisible()
		{
			return this.navigator.isVisible();
		}

		makeTabActive()
		{
			return new Promise((resolve) => {
				this.navigator.makeTabActive()
					.then(() => {
						resolve(true);
					})
					.catch((error) => {
						console.error('PageManager.makeTabActive error:', error);
						resolve(false);
					});
			});
		}

		/**
		 * @param {string} eventName
		 * @param {object} params
		 */
		onSubscribeToPushNotification(eventName, params = {})
		{
			BX.postComponentEvent(eventName, [params]);

			if (!announcedSubscriptions.has(eventName))
			{
				announcedSubscriptions.add(eventName);
				EntityReady.addCondition(eventName, () => true);
				EntityReady.ready(eventName);
			}
		}
	}

	module.exports = {
		BaseNavigator,
		ACTION_DELAY,
	};
});
