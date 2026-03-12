import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model, PermissionType } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { Item, ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';

import type { TemplatePermission } from '../types';

export const permissionBuilder = new class
{
	getPermissions(task: TaskModel): TemplatePermission[]
	{
		const currentUserId = Core.getParams().currentUser.id;
		const permissions = (task.permissions ?? []).map((p) => ({ ...p }));

		this.#grantUser(currentUserId, permissions);

		if (!idUtils.isReal(task.id) && task.creatorId !== currentUserId)
		{
			this.#grantUser(task.creatorId, permissions);
		}

		return permissions;
	}

	buildFromItem(item: Item): TemplatePermission
	{
		const entityId = item.getId();
		let entityType = item.getEntityId();
		if ([EntitySelectorEntity.Group, EntitySelectorEntity.Project].includes(entityType))
		{
			entityType = EntitySelectorEntity.Group;
		}

		return {
			id: this.buildId(entityType, entityId),
			entityType,
			entityId,
			title: item.getTitle(),
			image: item.getAvatar(),
			permission: PermissionType.Full,
		};
	}

	buildItemId(permission: TemplatePermission): ItemId
	{
		const mainDepartmentId = Core.getParams().mainDepartmentUfId;

		let type = permission.entityType;
		let id = permission.entityId;

		if (type === EntitySelectorEntity.Group)
		{
			type = EntitySelectorEntity.Project;
		}

		if (type === EntitySelectorEntity.Department && permission.entityId === mainDepartmentId)
		{
			type = EntitySelectorEntity.MetaUser;
			id = EntitySelectorEntity.AllUser;
		}

		return [type, id];
	}

	buildId(entityType: string, entityId: number): string
	{
		return `${entityType}:${entityId}`;
	}

	#grantUser(userId: number, permissions: TemplatePermission[]): TemplatePermission[]
	{
		if (!this.#userGranted(userId, permissions))
		{
			permissions.push(this.#buildUser(userId));
		}

		return permissions;
	}

	#userGranted(userId: number, permissions: TemplatePermission[]): boolean
	{
		return permissions.find((it) => it.entityType === EntitySelectorEntity.User && it.entityId === userId);
	}

	#buildUser(userId: number): TemplatePermission
	{
		const user: UserModel = Core.getStore().getters[`${Model.Users}/getById`](userId);

		return {
			id: this.buildId(EntitySelectorEntity.User, user.id),
			entityType: EntitySelectorEntity.User,
			entityId: user.id,
			title: user.name,
			image: user.image,
			permission: PermissionType.Full,
		};
	}
}();
