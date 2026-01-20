export type GanttLinksDto = { [ganttParentId: number]: GanttLinkType };

export type GanttLinkType = 'start_start' | 'start_finish' | 'finish_start' | 'finish_finish';

export type RelationMeta = {
	id: string,
	idsField: string,
	containsField: string,
	relationToField: string,
	controller: string,
	uniqueRight: string,
	addError: string,
	addErrorMany: string,
	overrideError: string,
	overrideErrorMany: string,
};
