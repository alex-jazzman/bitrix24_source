export const RecentCallStatus = {
	waiting: 'waiting',
	joined: 'joined',
};

export const RecentType = {
	default: 'default',
	copilot: 'copilot',
	openChannel: 'openChannel',
	collab: 'collab',
	taskComments: 'tasksTask',
	openlines: 'lines',
};

export type RecentTypeItem = $Values<typeof RecentType>;
