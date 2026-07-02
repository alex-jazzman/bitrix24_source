/**
 * @module im/messenger/controller/selector/forward/tabbed/src/tab-config
 */
jn.define('im/messenger/controller/selector/forward/tabbed/src/tab-config', (require, exports, module) => {
	const { DialogType, RecentTab, MessengerInitRestMethod, NavigationTabId } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');

	const ForwardTab = Object.freeze({
		chats: 'chats',
		tasks: 'tasks',
		projects: 'projects',
		channels: 'channels',
		copilot: 'copilot',
	});

	class ForwardTabRegistry
	{
		/** @type {Map<string, Object>} */
		#tabs = new Map();

		/**
		 * @param {string} tabId
		 * @param {Object} config
		 */
		register(tabId, config)
		{
			this.#tabs.set(tabId, config);
		}

		/**
		 * @param {string} tabId
		 * @return {Object|undefined}
		 */
		get(tabId)
		{
			return this.#tabs.get(tabId);
		}

		/**
		 * @param {string} tabId
		 * @return {boolean}
		 */
		has(tabId)
		{
			return this.#tabs.has(tabId);
		}

		/**
		 * @return {string[]}
		 */
		getIds()
		{
			return [...this.#tabs.keys()];
		}
	}

	const forwardTabRegistry = new ForwardTabRegistry();

	forwardTabRegistry.register(ForwardTab.chats, {
		recentGetter: 'recentModel/getChatFirstPage',
		initMethod: MessengerInitRestMethod.chatsList,
		navigationTabId: NavigationTabId.chats,
		filter: {
			exceptDialogTypes: [
				DialogType.copilot,
				DialogType.lines,
				DialogType.comment,
				DialogType.tasksTask,
			],
		},
		recentTab: RecentTab.chat,
		title: Loc.getNavigationTabTitle(NavigationTabId.chats),
	});

	forwardTabRegistry.register(ForwardTab.tasks, {
		recentGetter: 'recentModel/getTaskFirstPage',
		initMethod: MessengerInitRestMethod.taskList,
		navigationTabId: NavigationTabId.task,
		filter: {
			dialogTypes: [DialogType.tasksTask],
		},
		recentTab: RecentTab.tasksTask,
		title: Loc.getNavigationTabTitle(NavigationTabId.task),
	});

	forwardTabRegistry.register(ForwardTab.projects, {
		recentGetter: 'recentModel/getCollabFirstPage',
		initMethod: MessengerInitRestMethod.collabList,
		navigationTabId: NavigationTabId.collab,
		filter: {
			dialogTypes: [DialogType.collab],
		},
		recentTab: RecentTab.collab,
		title: Loc.getNavigationTabTitle(NavigationTabId.collab),
	});

	forwardTabRegistry.register(ForwardTab.channels, {
		recentGetter: 'recentModel/getChannelFirstPage',
		initMethod: MessengerInitRestMethod.channelList,
		navigationTabId: NavigationTabId.channel,
		filter: {
			dialogTypes: [
				DialogType.channel,
				DialogType.openChannel,
				DialogType.generalChannel,
			],
		},
		recentTab: RecentTab.openChannel,
		title: Loc.getNavigationTabTitle(NavigationTabId.channel),
	});

	forwardTabRegistry.register(ForwardTab.copilot, {
		recentGetter: 'recentModel/getCopilotFirstPage',
		initMethod: MessengerInitRestMethod.copilotList,
		navigationTabId: NavigationTabId.copilot,
		isAvailable: false, // TODO: There is no support for forwarding to ForwardTab.copilot
		filter: {
			dialogTypes: [DialogType.copilot],
		},
		recentTab: RecentTab.copilot,
		title: Loc.getNavigationTabTitle(NavigationTabId.copilot),
	});

	module.exports = {
		ForwardTab,
		forwardTabRegistry,
	};
});