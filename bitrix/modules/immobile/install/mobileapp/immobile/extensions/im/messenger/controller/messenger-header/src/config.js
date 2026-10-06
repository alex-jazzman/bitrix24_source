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
		vibecodeButton,
		nestedSearchButton,
		nestedFilterButton,
		nestedMoreButton,
	} = require('im/messenger/controller/messenger-header/src/button');

	/** @type {HeaderButtonsConfig} */
	const chatsConfig = {
		leftButtons: [vibecodeButton],
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const copilotConfig = {
		leftButtons: [vibecodeButton],
		rightButtons: [
			searchButton,
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const channelConfig = {
		leftButtons: [vibecodeButton],
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const collabConfig = {
		leftButtons: [vibecodeButton],
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const openLinesConfig = {
		leftButtons: [vibecodeButton],
		rightButtons: [
			notificationButton,
			moreButton,
		],
	};

	/** @type {HeaderButtonsConfig} */
	const taskConfig = {
		leftButtons: [vibecodeButton],
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
		[NavigationTabId.collabCopilot]: nestedConfig,
		[NavigationTabId.calendar]: nestedConfig,
	};

	const systemFolderHeaderConfigMap = {
		default: chatsConfig,
		copilot: copilotConfig,
		openChannel: channelConfig,
		collab: collabConfig,
		lines: openLinesConfig,
		tasksTask: taskConfig,
	};

	const personalFolderConfig = {
		leftButtons: [vibecodeButton],
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
