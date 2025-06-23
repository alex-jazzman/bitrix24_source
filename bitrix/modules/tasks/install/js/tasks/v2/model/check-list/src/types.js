import type { UserModel } from 'tasks.v2.model.users';

export type CheckListModelState = {
	collection: { [checkListId: string]: CheckListModel },
};

export type CheckListModel = {
	id: number | string,
	nodeId: number | string,
	title: string,
	creator: ?UserModel,
	toggledBy: ?UserModel,
	toggledDate: ?string,
	accomplices: ?UserModel[],
	auditors: ?UserModel[],
	attachments: [],
	isComplete: ?boolean,
	isImportant: ?boolean,
	parentId: ?number,
	parentNodeId: ?string,
	sortIndex: ?number,
	actions: {
		modify: boolean,
		remove: boolean,
		toggle: boolean
	},
	groupMode: {
		active: boolean,
		selected: boolean,
	},
};
