import { createUniqueId } from '../../../shared/utils';
import type { ActivityData, Block } from '../../../shared/types';
import { Type } from 'main.core';

type ActivityId = string;
type ActivityIds = Set<ActivityId>;
type ActivityIdsReplaceMap = Map<ActivityId, ActivityId>;

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

export function cloneSingleBlockWithNewIds(block: Block): Block
{
	return cloneBlocksWithNewIds([block])[0];
}

function cloneBlocksWithNewIds(blocks: Array<Block>): Array<Block>
{
	const activityIds: ActivityIds = findBlocksIds(blocks);
	const replaceMap: ActivityIdsReplaceMap = makeReplaceMap(activityIds);

	return cloneAndReplaceBlocksActivityIds(blocks, replaceMap);
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

function cloneAndReplaceBlocksActivityIds(blocks: Array<Block>, replaceMap: ActivityIdsReplaceMap): Array<Block>
{
	let serialized: string = JSON.stringify(blocks);

	for (const [pattern: string, replacement: string] of replaceMap.entries())
	{
		serialized = serialized.replaceAll(pattern, replacement);
	}

	return JSON.parse(serialized);
}
