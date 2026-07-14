import { Type } from 'main.core';
import { defaultProjectFeatures, type ProjectFeatures } from 'socialnetwork.v2.model.project';

import { type ProjectFeaturesDto } from '../types';

const dtoToModelFeatureIdMap = Object.freeze({
	tasks: 'tasks',
	chat: 'chat',
	calendar: 'calendar',
	files: 'files',
	landing_knowledge: 'landingKnowledge',
	blog: 'blog',
	forum: 'forum',
	photo: 'photo',
	search: 'search',
	marketplace: 'marketplace',
	group_lists: 'groupLists',
	wiki: 'wiki',
});

const modelToDtoFeatureIdMap = Object.freeze(
	Object.entries(dtoToModelFeatureIdMap).reduce((acc, [dtoFeatureId, modelFeatureId]) => {
		acc[modelFeatureId] = dtoFeatureId;

		return acc;
	}, {}),
);

export function mapDtoFeatures(featuresDto: ?ProjectFeaturesDto): ProjectFeatures
{
	const features = { ...defaultProjectFeatures };
	if (!Type.isPlainObject(featuresDto))
	{
		return features;
	}

	Object.entries(featuresDto).forEach(([dtoFeatureId, isActive]) => {
		const modelFeatureId = dtoToModelFeatureIdMap[dtoFeatureId];
		if (!modelFeatureId || !Type.isBoolean(isActive))
		{
			return;
		}

		features[modelFeatureId] = isActive;
	});

	return features;
}

export function mapDtoToggleableFeatures(toggleableFeatures: ?string[]): string[]
{
	if (!Array.isArray(toggleableFeatures))
	{
		return [];
	}

	return toggleableFeatures.reduce((result, dtoFeatureId) => {
		const modelFeatureId = dtoToModelFeatureIdMap[dtoFeatureId];
		if (!modelFeatureId || result.includes(modelFeatureId))
		{
			return result;
		}

		result.push(modelFeatureId);

		return result;
	}, []);
}

export function mapModelFeaturesToDto(
	features: ProjectFeatures,
	toggleableFeatures: string[],
): ?ProjectFeaturesDto
{
	if (!Array.isArray(toggleableFeatures) || toggleableFeatures.length === 0)
	{
		return undefined;
	}

	const result = toggleableFeatures.reduce((acc, modelFeatureId) => {
		const dtoFeatureId = modelToDtoFeatureIdMap[modelFeatureId];
		const isActive = features?.[modelFeatureId];
		if (!dtoFeatureId || !Type.isBoolean(isActive))
		{
			return acc;
		}

		acc[dtoFeatureId] = isActive;

		return acc;
	}, {});

	return Object.keys(result).length > 0 ? result : undefined;
}
