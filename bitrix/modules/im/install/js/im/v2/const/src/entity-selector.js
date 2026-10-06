export const SelectorEntity = {
	user: 'user',
	department: 'department',
	recent: 'im-recent-v2',
};

export type SelectorEntityItem = [$Values<typeof SelectorEntity>, number | string];
