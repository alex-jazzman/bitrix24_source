import { type SelectorEntityItem } from 'im.v2.const';

export type AddSelectionConfig = {
	chatId: number,
	userIds: Array<string | number>,
	nodes: SelectorEntityItem[],
	showHistory: boolean,
};
