import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const creatorMeta = Object.freeze({
	id: TaskField.Creator,
	title: Loc.getMessage('TASKS_V2_CREATOR_TITLE'),
});
