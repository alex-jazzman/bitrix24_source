import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const responsibleMeta = Object.freeze({
	id: TaskField.Responsible,
	getTitle: (isMany: boolean): string => {
		if (isMany)
		{
			return Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE_MANY');
		}

		return Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE');
	},
});
