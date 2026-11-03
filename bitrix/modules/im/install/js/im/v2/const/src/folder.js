export const FolderType = {
	system: 'system',
	personal: 'personal',
};

export type FolderTypeItem = $Values<typeof FolderType>;

// Mirror of the system folder rest codes (`BaseFolder::getRestCode()`) - exactly what the server puts
// into the `code` field of a folder. Not the domain `CODE`: `OpenLineFolder` keeps `CODE = 'openlines'`
// but overrides `REST_CODE = 'lines'`, and the client only ever sees the rest code.
// Neither a subset nor a superset of recent sections: `all` has no section, `calendar` has no folder.
export const SystemFolderCode = {
	default: 'default',
	chat: 'chat',
	channel: 'channel',
	openChannel: 'openChannel',
	copilot: 'copilot',
	collab: 'collab',
	tasksTask: 'tasksTask',
	tasksTaskRoot: 'tasksTaskRoot',
	openlines: 'lines',
	all: 'all',
	vibecodeApp: 'vibecodeApp',
};

export type SystemFolderCodeItem = $Values<typeof SystemFolderCode>;
