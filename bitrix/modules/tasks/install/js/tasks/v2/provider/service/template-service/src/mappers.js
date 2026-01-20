import { Type } from 'main.core';
import type { TaskRights } from 'tasks.v2.model.tasks';
import type { TaskDto, TemplatePermissionDto } from 'tasks.v2.provider.service.task-service';

import { permissionBuilder } from './mappers/permission-builder';
import type { TemplatePermission } from './types';

export const mapPermissionDtoToModel = (dto: TemplatePermissionDto): TemplatePermission => ({
	id: permissionBuilder.buildId(dto.accessEntity.type, dto.accessEntity.id),
	entityId: dto.accessEntity.id,
	entityType: dto.accessEntity.type,
	title: dto.accessEntity.name,
	image: dto.accessEntity?.image?.src,
	permission: dto.permissionId,
});

export const mapPermissionModelToDto = (permission: TemplatePermission): TemplatePermissionDto => ({
	accessEntity: {
		id: permission.entityId,
		type: permission.entityType,
	},
	permissionId: permission.permission,
});

export const mapRights = ({ read, edit, remove, create }: TaskRights): TaskRights => ({
	read,
	edit,
	remove,
	create,
	complete: edit,
	approve: edit,
	disapprove: edit,
	start: edit,
	take: edit,
	delegate: edit,
	defer: edit,
	renew: edit,
	deadline: edit,
	datePlan: edit,
	changeDirector: edit,
	changeResponsible: edit,
	changeAccomplices: edit,
	pause: edit,
	timeTracking: edit,
	rate: edit,
	changeStatus: edit,
	reminder: edit,
	addAuditors: edit,
	elapsedTime: edit,
	favorite: edit,
	checklistAdd: edit,
	checklistEdit: edit,
	checklistSave: edit,
	checklistToggle: edit,
	automate: edit,
	resultEdit: edit,
	completeResult: edit,
	removeResult: edit,
	resultRead: edit,
	admin: edit,
	watch: edit,
	mute: edit,
	createSubtask: edit,
	copy: edit,
	createFromTemplate: edit,
	saveAsTemplate: edit,
	attachFile: edit,
	detachFile: edit,
	detachParent: edit,
	detachRelated: edit,
	changeDependence: edit,
	createGanttDependence: edit,
	sort: edit,
});

export const mapDtoToTaskDto = (templateDto: TaskDto): TaskDto => ({
	title: templateDto.title,
	responsibleCollection: templateDto.responsibleCollection,
	deadlineTs: mapValue(templateDto.deadlineAfter, ceilTs(Date.now() + templateDto.deadlineAfter * 1000) / 1000),
});

const step = 60 * 1000;
const ceilTs = (timestamp: number): number => Math.ceil(timestamp / step) * step;

const mapValue = (value: any, mapped: any): any => (Type.isNil(value) ? value : mapped);
