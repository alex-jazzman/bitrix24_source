import { EditAction } from './edit-action';
import { DeleteAction } from './delete-action';
import { RestartAction } from './restart-action';

import { GroupDeleteAction } from './group/group-delete-action';

export const actionMap = new Map([
	[EditAction.getActionId(), EditAction],
	[DeleteAction.getActionId(), DeleteAction],
	[RestartAction.getActionId(), RestartAction],
]);

export const groupActionMap = new Map([
	[GroupDeleteAction.getActionId(), GroupDeleteAction],
]);
