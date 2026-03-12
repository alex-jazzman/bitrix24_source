import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const createdDateMeta = Object.freeze({
	id: TaskField.CreatedDate,
	title: Loc.getMessage('TASKS_V2_CREATED_DATE_TITLE'),
});
