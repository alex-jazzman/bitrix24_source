import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const responsibleMeta = Object.freeze({
	id: TaskField.Responsible,
	hint: Loc.getMessage('TASKS_V2_RESPONSIBLE_MANY_AHA'),
	getTitle: (isMany: boolean): string => {
		return isMany
			? Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE_MANY')
			: Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE')
		;
	},
});
