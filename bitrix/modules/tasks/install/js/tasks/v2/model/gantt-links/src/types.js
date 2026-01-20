import type { GanttLinkType } from 'tasks.v2.provider.service.relation-service';

export type GanttLinksModelState = {
	collection: { [id: string]: GanttLinkModel },
};

export type GanttLinkId = {
	taskId: number,
	dependentId: number,
};

export type GanttLinkModel = {
	id: string,
	taskId: number,
	dependentId: number,
	type: GanttLinkType,
};
