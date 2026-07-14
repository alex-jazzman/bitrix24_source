import { RelationTasksDialog } from './relation-tasks-dialog';
import { subTasksMeta, relatedTasksMeta, ganttMeta } from './meta';

export const subTasksDialog = new RelationTasksDialog(subTasksMeta);
export const relatedTasksDialog = new RelationTasksDialog(relatedTasksMeta);
export const ganttDialog = new RelationTasksDialog(ganttMeta);
export type { RelationTasksDialog };
