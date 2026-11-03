export const Layout = {
	chat: 'chat',
	createChat: 'createChat',
	updateChat: 'updateChat',
	createFolder: 'createFolder',
	updateFolder: 'updateFolder',
	copyCollab: 'copyCollab',
	channel: 'channel',
	notification: 'notification',
	openlines: 'openlines',
	openlinesV2: 'openlinesV2',
	conference: 'conference',
	settings: 'settings',
	copilot: 'copilot',
	collab: 'collab',
	vibecodeApp: 'vibecodeApp',
	market: 'market',
	taskComments: 'tasksTask',
	folder: 'folder',
	// Distinct from the `all` server folder code on purpose: this value travels to the restored
	// layout in local storage and to analytics, so it must not collide with a folder code.
	folderAll: 'folderAll',
	folderAllSettings: 'folderAllSettings',
};

export type LayoutType = $Values<typeof Layout>;
