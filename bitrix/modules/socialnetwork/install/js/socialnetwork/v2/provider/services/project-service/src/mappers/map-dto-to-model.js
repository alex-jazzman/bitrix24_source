import { Type } from 'main.core';

import { AccessRightsBoolKind, AccessRightsRoleKind } from 'socialnetwork.v2.const';
import { type ProjectModel, type ProjectDates, type ProjectPermissions } from 'socialnetwork.v2.model.project';

import { type ProjectDto } from '../types';
import { mapDtoFeatures, mapDtoToggleableFeatures } from './features';

const defaultProjectPermissions = Object.freeze({
	whoCanInvite: AccessRightsRoleKind.AllParticipants,
	manageMessages: AccessRightsRoleKind.AllParticipants,
	manageMessagesAutoDelete: AccessRightsRoleKind.OwnerAndModerators,
	messagesAutoDeleteDelay: '',
	showHistory: AccessRightsBoolKind.Yes,
	canGuestCopyText: AccessRightsBoolKind.Yes,
	canGuestScreenshot: AccessRightsBoolKind.Yes,
	allowGuestsInvitation: AccessRightsBoolKind.Yes,
});

export function mapDtoToModel(projectDto: ProjectDto): ProjectModel
{
	return {
		id: projectDto.id,
		avatar: { ...projectDto.avatar },
		title: projectDto.name,
		description: projectDto.description,
		goal: projectDto.goal,
		privacyType: projectDto.privacyType,
		ownerId: projectDto.ownerId,
		chatId: projectDto.chatId ?? null,
		members: projectDto.members,
		moderators: projectDto.moderatorMembers,
		features: mapDtoFeatures(projectDto.features),
		baseFeatureId: projectDto.baseFeatureId ?? 'chat',
		availableFeatures: projectDto.availableFeatures,
		toggleableFeatures: mapDtoToggleableFeatures(projectDto.toggleableFeatures),
		permissions: mapPermissionsFromDtoToModel(projectDto),
		dates: mapDates(projectDto.dates),
		tags: mapValue(projectDto.tags, [...projectDto.tags]),
		publication: mapValue(projectDto.publication, projectDto.publication || false),
		notifications: projectDto.notificationCatalog ?? null,
	};
}

function mapPermissionsFromDtoToModel(dto: ProjectDto): ProjectPermissions
{
	const mapProjectPermissions = (projectDto: ProjectDto) => {
		return {
			...defaultProjectPermissions,
			...(Type.isPlainObject(projectDto.options) ? projectDto.options : {}),
		};
	};

	const mapPermissions = (feature: string, projectDto: ProjectDto) => {
		return projectDto.permissions.find((item) => item.feature === feature)?.permissions || {};
	};

	function mapTaskPermissions(projectDto: ProjectDto): Object
	{
		const tasksPermissions = mapPermissions('tasks', projectDto);

		return {
			view: tasksPermissions.view ?? AccessRightsRoleKind.AllParticipants,
			view_all: tasksPermissions.view_all ?? AccessRightsRoleKind.AllParticipants,
			sort: tasksPermissions.sort,
			createTasks: tasksPermissions.create_tasks,
			editTasks: tasksPermissions.edit_tasks,
			deleteTasks: tasksPermissions.delete_tasks,
		};
	}

	return {
		project: mapProjectPermissions(dto),
		tasks: { ...mapTaskPermissions(dto) },
		blog: { ...mapPermissions('blog', dto) },
		landingKnowledge: { ...mapPermissions('landing_knowledge', dto) },
	};
}

function mapValue(value: any, mappedValue: any, checkIsEmpty = Type.isNil): any | undefined
{
	return checkIsEmpty(value) ? value : mappedValue;
}

function mapDates(dates: ProjectDates | null): ProjectDates | null
{
	if (!dates || (!dates.startTs && !dates.finishTs))
	{
		return {
			startTs: 0,
			finishTs: 0,
		};
	}

	return {
		startTs: dates.startTs * 1000,
		finishTs: dates.finishTs * 1000,
	};
}
