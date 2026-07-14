/**
 * @module im/messenger/assets/icon/src/messenger-icon
 */
jn.define('im/messenger/assets/icon/src/messenger-icon', (require, exports, module) => {
	const AppTheme = require('apptheme');

	const pathToFolder = `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/icon`;

	const IconType = Object.freeze({
		calendar: 'calendar',
		groupChat: 'groupChat',
		channel: 'channel',
		task: 'task',
		copilot: 'copilot',
		project: 'project',
		folder: 'folder',
		folderCreate: 'folderCreate',
		folderSettings: 'folderSettings',
		calendarEmptyState: 'calendarEmptyState',
		channelEmptyState: 'channelEmptyState',
		chatEmptyState: 'chatEmptyState',
		copilotEmptyState: 'copilotEmptyState',
		projectEmptyState: 'projectEmptyState',
		taskEmptyState: 'taskEmptyState',
	});

	const IconRegistry = Object.freeze({
		[IconType.calendar]: 'calendar',
		[IconType.groupChat]: 'group-chat',
		[IconType.channel]: 'channel',
		[IconType.task]: 'task',
		[IconType.copilot]: 'copilot',
		[IconType.project]: 'project',
		[IconType.folder]: 'folder',
		[IconType.folderCreate]: 'folder-create',
		[IconType.folderSettings]: 'folder-settings',
		[IconType.calendarEmptyState]: 'calendar-empty-state',
		[IconType.channelEmptyState]: 'channel-empty-state',
		[IconType.chatEmptyState]: 'chat-empty-state',
		[IconType.copilotEmptyState]: 'copilot-empty-state',
		[IconType.projectEmptyState]: 'project-empty-state',
		[IconType.taskEmptyState]: 'task-empty-state',
	});

	class MessengerIcon
	{
		static #resolve(name)
		{
			return `${pathToFolder}/png/${AppTheme.id}/${name}.png`;
		}

		static getByType(type)
		{
			const name = IconRegistry[type];
			if (!name)
			{
				throw new Error(`MessengerIcon: unknown icon type "${type}"`);
			}

			return MessengerIcon.#resolve(name);
		}
	}

	module.exports = { MessengerIcon, IconType };
});
