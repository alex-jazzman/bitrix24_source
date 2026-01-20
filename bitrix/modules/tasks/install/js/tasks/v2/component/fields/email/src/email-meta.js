import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const emailMeta = Object.freeze({
	id: TaskField.Email,
	title: Loc.getMessage('TASKS_V2_EMAIL_TITLE'),
	fromTitle: Loc.getMessage('TASKS_V2_EMAIL_FROM_TITLE'),
	dateTitle: Loc.getMessage('TASKS_V2_EMAIL_DATE_TITLE'),
});
