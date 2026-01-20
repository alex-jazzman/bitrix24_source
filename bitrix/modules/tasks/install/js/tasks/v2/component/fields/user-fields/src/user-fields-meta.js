import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const userFieldsMeta = Object.freeze({
	id: TaskField.UserFields,
	title: Loc.getMessage('TASKS_V2_USER_FIELDS_TITLE'),
});
