import { SubTasksService } from './sub-tasks-service';
import { RelatedTasksService } from './related-tasks-service';
import { GanttService } from './gantt-service';
import { relatedTasksMeta, subTasksMeta, ganttMeta } from './meta';

export const subTasksService = new SubTasksService(subTasksMeta);
export const relatedTasksService = new RelatedTasksService(relatedTasksMeta);
export const ganttService = new GanttService(ganttMeta);
export type { RelationService } from './relation-service';
export type { GanttLinksDto, GanttLinkType } from './types';
