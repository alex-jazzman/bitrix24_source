/**
 * @module im/messenger/controller/selector/forward/tabbed/src/tab-config
 */
jn.define('im/messenger/controller/selector/forward/tabbed/src/tab-config', (require, exports, module) => {
	const { DialogType, RecentTab, MessengerInitRestMethod, NavigationTabId } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');

	const ForwardTab = Object.freeze({
		all: 'all',
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
		 * @description Availability is resolved on every call: feature flags are filled
		 * from the shared params and may change between picker sessions.
		 * @param {string} tabId
		 * @return {boolean}
		 */
		isAvailable(tabId)
		{
			const config = this.#tabs.get(tabId);
			if (!config)
			{
				return false;
			}

			return config.isAvailable?.() ?? true;
		}

		/**
		 * @description Resolved on every call, like isAvailable(): titles come from the
		 * server-side navigation params, and the copilot one is region-dependent.
		 * @param {string} tabId
		 * @return {?string}
		 */
		getTitle(tabId)
		{
			return this.#tabs.get(tabId)?.getTitle() ?? null;
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

	forwardTabRegistry.register(ForwardTab.all, {
		recentGetter: 'recentModel/getAllFirstPage',
		filter: {},
		getTitle: () => Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TAB_ALL'),
	});

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
		getTitle: () => Loc.getNavigationTabTitle(NavigationTabId.chats),
	});

	forwardTabRegistry.register(ForwardTab.tasks, {
		recentGetter: 'recentModel/getTaskFirstPage',
		initMethod: MessengerInitRestMethod.taskList,
		navigationTabId: NavigationTabId.task,
		filter: {
			dialogTypes: [DialogType.tasksTask],
		},
		recentTab: RecentTab.tasksTask,
		getTitle: () => Loc.getNavigationTabTitle(NavigationTabId.task),
	});

	forwardTabRegistry.register(ForwardTab.projects, {
		recentGetter: 'recentModel/getCollabFirstPage',
		initMethod: MessengerInitRestMethod.collabList,
		navigationTabId: NavigationTabId.collab,
		filter: {
			dialogTypes: [DialogType.collab],
		},
		recentTab: RecentTab.collab,
		getTitle: () => Loc.getNavigationTabTitle(NavigationTabId.collab),
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
		getTitle: () => Loc.getNavigationTabTitle(NavigationTabId.channel),
	});

	forwardTabRegistry.register(ForwardTab.copilot, {
		recentGetter: 'recentModel/getCopilotFirstPage',
		initMethod: MessengerInitRestMethod.copilotList,
		navigationTabId: NavigationTabId.copilot,
		// same gate as the server-side copilot navigation tab, so the picker never
		// offers a tab the portal has turned off (or that its zone forbids)
		isAvailable: () => Feature.isCopilotEnabled,
		filter: {
			dialogTypes: [DialogType.copilot],
		},
		recentTab: RecentTab.copilot,
		getTitle: () => Loc.getNavigationTabTitle(NavigationTabId.copilot),
	});

	module.exports = {
		ForwardTab,
		forwardTabRegistry,
	};
});