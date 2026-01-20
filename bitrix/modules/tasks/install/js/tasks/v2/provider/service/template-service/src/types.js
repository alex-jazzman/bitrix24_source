import { EntitySelectorEntity, PermissionType } from 'tasks.v2.const';

export type TemplatePermission = {
	id: string,
	entityType: $Values<typeof EntitySelectorEntity>,
	entityId: number,
	title: string,
	image: string,
	permission: $Values<typeof PermissionType>,
};
