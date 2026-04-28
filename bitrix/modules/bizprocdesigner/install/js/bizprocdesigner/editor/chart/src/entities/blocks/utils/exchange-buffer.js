import { createUniqueId } from '../../../shared/utils';
import type { ActivityData, Block } from '../../../shared/types';
import { Type } from 'main.core';

type ActivityId = string;
type ActivityIds = Set<ActivityId>;
type ActivityIdsReplaceMap = Map<ActivityId, ActivityId>;

type BlocksContent = {
	blocks: Block[],
	connections: Connection[],
};

function addActivityIdsToSet(activity: ActivityData, activityIds: ActivityIds): void
{
	if (!Type.isObject(activity))
	{
		return;
	}

	if (Type.isStringFilled(activity?.Name))
	{
		activityIds.add(activity.Name);
	}

	if (Type.isArrayFilled(activity?.Children))
	{
		activity.Children.forEach((child: ActivityData): void => addActivityIdsToSet(child, activityIds));
	}
}

export function cloneBLocksWithNewIds(target: BlocksContent): BlocksContent
{
	const { blocks } = target;
	const activityIds: ActivityIds = findBlocksIds(blocks);
	const replaceMap: ActivityIdsReplaceMap = makeReplaceMap(activityIds);

	return cloneAndReplaceBlocksActivityIds(target, replaceMap);
}

function findBlocksIds(blocks: Array<Block>): ActivityIds
{
	const activityIds: ActivityIds = new Set();

	blocks.forEach((block: Block): void => {
		if (Type.isStringFilled(block?.id))
		{
			activityIds.add(block.id);
		}

		addActivityIdsToSet(block?.activity, activityIds);
	});

	return activityIds;
}

function makeReplaceMap(activityIds: ActivityIds): ActivityIdsReplaceMap
{
	const replaceMap: ActivityIdsReplaceMap = new Map();

	activityIds.forEach((id: ActivityId): void => {
		replaceMap.set(id, createUniqueId());
	});

	return replaceMap;
}

function cloneAndReplaceBlocksActivityIds(target: BlocksContent, replaceMap: ActivityIdsReplaceMap): BlocksContent
{
	let serialized = JSON.stringify(target);

	for (const [pattern, replacement] of replaceMap.entries())
	{
		serialized = serialized.replaceAll(`"${pattern}"`, `"${replacement}"`);
	}

	return JSON.parse(serialized);
}
