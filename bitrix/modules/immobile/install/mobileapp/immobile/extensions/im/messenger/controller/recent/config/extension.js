/**
 * @module im/messenger/controller/recent/config
 */
jn.define('im/messenger/controller/recent/config', (require, exports, module) => {
	const { NavigationTabId } = require('im/messenger/const');
	// global navigation configs
	const { ChannelConfig } = require('im/messenger/controller/recent/config/src/global/channel');
	const { ChatsConfig } = require('im/messenger/controller/recent/config/src/global/chats');
	const { CopilotConfig } = require('im/messenger/controller/recent/config/src/global/copilot');
	const { CollabConfig } = require('im/messenger/controller/recent/config/src/global/collab');
	const { OpenlinesConfig } = require('im/messenger/controller/recent/config/src/global/openlines');
	const { TaskConfig } = require('im/messenger/controller/recent/config/src/global/task');
	const { resolveFolderConfig } = require('im/messenger/controller/recent/config/src/global/folder');

	// nested navigation configs
	const { CollabDefaultConfig } = require('im/messenger/controller/recent/config/src/nested/collab-default');
	const { TasksTasksConfig } = require('im/messenger/controller/recent/config/src/nested/tasks-tasks');
	const { CollabChatConfig } = require('im/messenger/controller/recent/config/src/nested/collab-chat');
	const { CollabCopilotConfig } = require('im/messenger/controller/recent/config/src/nested/collab-copilot');
	const { CalendarConfig } = require('im/messenger/controller/recent/config/src/nested/calendar');

	const RecentConfig = {
		[NavigationTabId.chats]: ChatsConfig,
		[NavigationTabId.channel]: ChannelConfig,
		[NavigationTabId.copilot]: CopilotConfig,
		[NavigationTabId.collab]: CollabConfig,
		[NavigationTabId.openlines]: OpenlinesConfig,
		[NavigationTabId.task]: TaskConfig,
	};

	const NestedRecentConfig = {
		[NavigationTabId.collabDefault]: CollabDefaultConfig,
		[NavigationTabId.task]: TasksTasksConfig,
		[NavigationTabId.collabChat]: CollabChatConfig,
		[NavigationTabId.collabCopilot]: CollabCopilotConfig,
		[NavigationTabId.calendar]: CalendarConfig,
	};

	module.exports = { RecentConfig, NestedRecentConfig, resolveFolderConfig };
});
