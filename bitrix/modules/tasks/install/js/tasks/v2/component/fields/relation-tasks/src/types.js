import type { RelationService } from 'tasks.v2.provider.service.relation-service';

export type RelationFieldMeta = {
	id: string,
	icon: string,
	idsField: string,
	containsField: string,
	getTitle: (isTemplate: boolean) => string,
	getChipTitle: (isTemplate: boolean) => string,
	getCountLoc: (isTemplate: boolean) => string,
	getHint: (isTemplate: boolean) => string,
	service: RelationService,
	right: string,
};
