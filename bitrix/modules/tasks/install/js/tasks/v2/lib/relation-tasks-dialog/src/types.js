import type { RelationService } from 'tasks.v2.provider.service.relation-service';

export type RelationDialogMeta = {
	id: string,
	idsField: string,
	relationToField: string,
	footerText: string,
	service: RelationService,
	isTemplate: boolean,
};
