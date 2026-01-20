import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const resultsMeta = Object.freeze({
	id: TaskField.Results,
	title: Loc.getMessage('TASKS_V2_RESULT_TITLE_META'),
});
