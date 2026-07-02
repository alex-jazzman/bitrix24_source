/**
 * @module im/messenger/controller/messenger-header/src/config
 */
jn.define('im/messenger/controller/messenger-header/src/config', (require, exports, module) => {
	const { NavigationTabId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const {
		searchButton,
		notificationButton,
		moreButton,
		nestedSearchButton,
		nestedFilterButton,
		nestedMoreButton,
	} = require('im/messenger/controller/messenger-header/src/button');

	/** @type {HeaderButtonsConfig} */
	const chatsConfig = {
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const copilotConfig = {
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const channelConfig = {
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const collabConfig = {
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const openLinesConfig = {
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const taskConfig = {
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const nestedConfig = {
		rightButtons: [
			nestedSearchButton,
			nestedFilterButton,
			nestedMoreButton,
		],
	};

	const headerControllerConfig = {
		[NavigationTabId.chats]: chatsConfig,
		[NavigationTabId.copilot]: copilotConfig,
		[NavigationTabId.channel]: channelConfig,
		[NavigationTabId.collab]: collabConfig,
		[NavigationTabId.openlines]: openLinesConfig,
		[NavigationTabId.task]: taskConfig,
	};

	const nestedHeaderControllerConfig = {
		[NavigationTabId.collabDefault]: nestedConfig,
		[NavigationTabId.task]: nestedConfig,
		[NavigationTabId.collabChat]: nestedConfig,
		[NavigationTabId.calendar]: nestedConfig,
	};

	const systemFolderHeaderConfigMap = {
		default: chatsConfig,
		copilot: copilotConfig,
		openChannel: channelConfig,
		collab: collabConfig,
		openlines: openLinesConfig,
		tasksTask: taskConfig,
	};

	const personalFolderConfig = {
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/**
	 * @param {string} tabId
	 * @return {HeaderButtonsConfig|null}
	 */
	function resolveFolderHeaderConfig(tabId)
	{
		const folder = serviceLocator.get('core').getStore().getters['folderModel/getById'](Number(tabId));
		if (!folder)
		{
			return null;
		}

		if (folder.type === 'system')
		{
			return systemFolderHeaderConfigMap[folder.code] ?? null;
		}

		return personalFolderConfig;
	}

	module.exports = {
		headerControllerConfig,
		nestedHeaderControllerConfig,
		resolveFolderHeaderConfig,
	};
});
