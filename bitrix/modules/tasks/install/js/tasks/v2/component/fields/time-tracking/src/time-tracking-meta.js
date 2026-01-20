import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const timeTrackingMeta = Object.freeze({
	id: TaskField.TimeTracking,
	title: Loc.getMessage('TASKS_V2_TIME_TRACKING_TITLE'),
});
