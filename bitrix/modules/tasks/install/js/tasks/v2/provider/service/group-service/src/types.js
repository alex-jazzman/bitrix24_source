import { Type } from 'main.core';

export type GroupDto = {
	id: number,
	name: string,
	image: string,
	type: GroupType,
	stages: StageDto[],
	isRestrictedView: ?boolean,
};

export function createGroupDto(raw: Object): GroupDto
{
	return {
		id: raw.id ?? null,
		name: raw.name ?? '',
		image: raw.image ?? null,
		type: raw.type ?? null,
		isRestrictedView: raw.isRestrictedView ?? null,
		stages: Type.isArray(raw.stages) ? raw.stages.map((stage) => createStageDto(stage)) : [],
	};
}

type GroupType = 'group' | 'project' | 'scrum' | 'collab';

export type StageDto = {
	id: number,
	title: string,
	color: string,
	systemType: string,
	sort: number,
};

function createStageDto(raw: Object): StageDto
{
	return {
		id: raw.id ?? null,
		title: raw.title ?? '',
		color: raw.color ?? '',
		systemType: raw.systemType ?? '',
		sort: raw.sort ?? 0,
	};
}

export type GroupInfo = {
	ownerId: number,
	ownerName: string,
	dateCreate: string,
	subjectTitle: string,
	numberOfMembers: number,
};
