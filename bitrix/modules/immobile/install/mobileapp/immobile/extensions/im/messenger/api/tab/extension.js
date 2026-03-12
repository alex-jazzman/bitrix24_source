/**
 * @module im/messenger/api/tab
 */
jn.define('im/messenger/api/tab', (require, exports, module) => {
	const { Type } = require('type');

	const {
		EventType,
		ComponentCode,
		NavigationTabId,
	} = require('im/messenger/const');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openChatsTab(options)
	{
		return openTab(NavigationTabId.chats, options);
	}

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openTasksTab(options)
	{
		return openTab(NavigationTabId.task, options);
	}

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openCopilotTab(options)
	{
		return openTab(NavigationTabId.copilot, options);
	}

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openChannelsTab(options)
	{
		return openTab(NavigationTabId.channel, options);
	}

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openCollabsTab(options)
	{
		return openTab(NavigationTabId.collab, options);
	}

	/**
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openLinesTab(options)
	{
		return openTab(NavigationTabId.openlines, options);
	}

	/**
	 * @param {string} tabId
	 * @param {TabOptions} options
	 * @return {Promise}
	 */
	async function openTab(tabId, options)
	{
		if (!NavigationTabId[tabId])
		{
			const error = new Error(`im: Error changing tab, tab ${tabId} does not exist.`);

			return Promise.reject(error);
		}

		const {
			promise,
			resolve,
			reject,
		} = createPromiseWithResolvers();
		try
		{
			registerChangeTabResultHandler(
				tabId,
				resolve,
				reject,
			);

			sendChangeTabEvent(tabId, options);
		}
		catch (error)
		{
			reject(error);
		}

		return promise;
	}

	function registerChangeTabResultHandler(targetTabId, successHandler, errorHandler)
	{
		const handler = ({ tabId, errorText }) => {
			if (tabId !== targetTabId)
			{
				return;
			}

			BX.removeCustomEvent(EventType.navigation.changeTabResult, handler);

			if (Type.isStringFilled(errorText))
			{
				errorHandler(new Error(errorText));

				return;
			}

			successHandler();
		};

		BX.addCustomEvent(EventType.navigation.changeTabResult, handler);

		return handler;
	}

	function sendChangeTabEvent(tabId, options)
	{
		BX.postComponentEvent(
			EventType.navigation.changeTab,
			[tabId, options],
			ComponentCode.imMessenger,
		);
	}

	module.exports = {
		openChatsTab,
		openTasksTab,
		openCopilotTab,
		openChannelsTab,
		openCollabsTab,
		openLinesTab,
	};
});
