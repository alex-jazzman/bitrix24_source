import { Type } from 'main.core';
import { type ProjectModel, type ProjectDates } from 'socialnetwork.v2.model.project';

import {
	type ProjectDto,
	type ProjectNotificationPayloadDto,
	type ProjectPermissionsTasksValuesDto,
	type ProjectPermissionsBlogValuesDto,
	type ProjectPermissionsLandingKnowledgeValuesDto,
} from '../types';
import { mapModelFeaturesToDto } from './features';

export function mapModelToDto(project: ProjectModel): ProjectDto
{
	const dto: ProjectDto = {
		id: mapValue(project.id || undefined, project.id),
		name: project.title,
		description: project.description,
		goal: project.goal,
		privacyType: project.privacyType,
		ownerId: project.ownerId,
		members: project.members,
		moderatorMembers: project.moderators,
		permissions: {
			tasks: mapTaskPermissions(project.permissions.tasks),
			blog: mapBlogPermissions(project.permissions.blog),
			landingKnowledge: mapLandingKnowledgePermissions(project.permissions.landingKnowledge),
		},
		options: { ...project.permissions.project },
		dates: mapValue(project.dates, mapDates(project.dates)),
		tags: mapValue(project.tags, [...project.tags]),
	};

	if (Type.isBoolean(project.publication))
	{
		dto.publication = project.publication;
	}

	const features = mapModelFeaturesToDto(project.features, project.toggleableFeatures);
	if (features)
	{
		dto.features = features;
	}

	dto.baseFeatureId = project.baseFeatureId;

	const encodedFile = project.avatar?.encodedFile;
	if (encodedFile)
	{
		dto.avatar = { ...project.avatar };
	}

	if (project.notifications && isNotificationsDirty(project.notifications, project.notificationsInitial))
	{
		const notificationPayload: ProjectNotificationPayloadDto = {
			types: project.notifications.groups
				.flatMap((g) => g.types)
				.map((t) => ({ id: t.id, counterEnabled: t.counterEnabled })),
		};
		dto.notifications = notificationPayload;
	}

	return dto;
}

function isNotificationsDirty(current: Object, initial: ?Object): boolean
{
	if (!initial)
	{
		return true;
	}

	const toFlagsMap = (catalog: Object): Map<string, boolean> => {
		return new Map(
			catalog.groups
				.flatMap((g) => g.types)
				.map((t) => [t.id, t.counterEnabled]),
		);
	};

	const currentFlags = toFlagsMap(current);
	const initialFlags = toFlagsMap(initial);

	if (currentFlags.size !== initialFlags.size)
	{
		return true;
	}

	for (const [id, counterEnabled] of currentFlags)
	{
		if (!initialFlags.has(id) || initialFlags.get(id) !== counterEnabled)
		{
			return true;
		}
	}

	return false;
}

function mapValue(value: any, mappedValue: any, checkIsEmpty = Type.isNil): any | undefined
{
	return checkIsEmpty(value) ? value : mappedValue;
}

function mapTaskPermissions(tasks: Object): ProjectPermissionsTasksValuesDto
{
	return {
		view: tasks.view,
		view_all: tasks.view_all,
		sort: tasks.sort,
		create_tasks: tasks.createTasks,
		edit_tasks: tasks.editTasks,
		delete_tasks: tasks.deleteTasks,
	};
}

function mapBlogPermissions(blog: Object): ProjectPermissionsBlogValuesDto
{
	return {
		view_post: blog.view_post,
		premoderate_post: blog.premoderate_post,
		write_post: blog.write_post,
		moderate_post: blog.moderate_post,
		full_post: blog.full_post,
		view_comment: blog.view_comment,
		premoderate_comment: blog.premoderate_comment,
		write_comment: blog.write_comment,
		moderate_comment: blog.moderate_comment,
		full_comment: blog.full_comment,
	};
}

function mapLandingKnowledgePermissions(landingKnowledge: Object): ProjectPermissionsLandingKnowledgeValuesDto
{
	return {
		read: landingKnowledge.read,
		edit: landingKnowledge.edit,
		sett: landingKnowledge.sett,
		delete: landingKnowledge.delete,
	};
}

function mapDates({ startTs, finishTs }: ProjectDates): ProjectDates | null
{
	const convertTs = (ts: number | null): number | null => {
		return Type.isNumber(ts) && ts > 0 ? Math.floor(ts / 1000) : null;
	};

	return {
		startTs: convertTs(startTs),
		finishTs: convertTs(finishTs),
	};
}
