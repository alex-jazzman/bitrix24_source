import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const titleMeta = Object.freeze({
	id: TaskField.Title,
	getTitle: (isTemplate: string): string => {
		if (isTemplate)
		{
			return Loc.getMessage('TASKS_V2_TEMPLATE_TITLE_PLACEHOLDER');
		}

		return Loc.getMessage('TASKS_V2_TITLE_PLACEHOLDER');
	},
});
