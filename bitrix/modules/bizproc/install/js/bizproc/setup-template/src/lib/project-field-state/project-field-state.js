import { Type } from 'main.core';

import { CONSTANT_TYPES } from '../../constants';

const PROJECT_FIELD_STATE_DELETED = 'deleted';

export function normalizeProjectValues(value: mixed): Array<string>
{
	const values = Type.isArray(value) ? value : [value];

	return values
		.map((item) => String(item ?? ''))
		.filter((item: string) => Type.isStringFilled(item))
	;
}

export function getDeletedProjectIds(projectState: ?Object): Array<string>
{
	const projectIds = Type.isArray(projectState?.deletedValues)
		? projectState.deletedValues
		: [projectState?.resolvedValue]
	;

	return normalizeProjectValues(projectIds);
}

export function isDeletedProjectState(projectState: ?Object): boolean
{
	return projectState?.type === CONSTANT_TYPES.PROJECT && projectState?.state === PROJECT_FIELD_STATE_DELETED;
}

export function isDeletedProjectSelected(projectState: ?Object, value: mixed): boolean
{
	if (!isDeletedProjectState(projectState))
	{
		return false;
	}

	const deletedProjectIds = getDeletedProjectIds(projectState);

	return deletedProjectIds.length > 0
		&& normalizeProjectValues(value).some((projectId: string) => deletedProjectIds.includes(projectId))
	;
}
