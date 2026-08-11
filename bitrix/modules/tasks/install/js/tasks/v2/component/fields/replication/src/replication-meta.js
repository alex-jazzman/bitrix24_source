import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';

export const replicationMeta = Object.freeze({
	id: TaskField.Replication,
	title: Loc.getMessage('TASKS_V2_REPLICATION_TITLE'),
});
