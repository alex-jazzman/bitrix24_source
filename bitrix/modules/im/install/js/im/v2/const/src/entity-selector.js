export const SelectorEntity = {
	user: 'user',
	bot: 'im-bot',
	department: 'department',
	structureNode: 'structure-node',
	recent: 'im-recent-v2',
};

export type SelectorEntityItem = [$Values<typeof SelectorEntity>, number | string];
