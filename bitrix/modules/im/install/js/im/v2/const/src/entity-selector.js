export const SelectorEntity = {
	user: 'user',
	department: 'department',
};

export type SelectorEntityItem = [$Values<typeof SelectorEntity>, number | string];
