import type { GanttLinkModel } from 'tasks.v2.model.gantt-links';
import type { GanttLinksDto } from './types';

export function mapGanttLinksToModels(dependentId: number, ganttLinks: GanttLinksDto): GanttLinkModel[]
{
	if (!ganttLinks)
	{
		return [];
	}

	return Object.entries(ganttLinks).map(([taskId, type]): GanttLinkModel => ({
		taskId,
		dependentId,
		type,
	}));
}
