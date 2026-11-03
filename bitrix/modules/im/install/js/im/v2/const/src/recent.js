export const RecentCallStatus = {
	waiting: 'waiting',
	joined: 'joined',
};

export const RecentType = {
	// `default` is the legacy Chats folder code, `chat` is the server chat section: not a duplicate.
	default: 'default',
	chat: 'chat',
	channel: 'channel',
	copilot: 'copilot',
	openChannel: 'openChannel',
	collab: 'collab',
	vibecodeApp: 'vibecodeApp',
	taskComments: 'tasksTask',
	openlines: 'lines',
	calendar: 'calendar',
	collabDefault: 'collabDefault',
	collabChat: 'collabChat',
};

export type RecentTypeItem = $Values<typeof RecentType>;
