import { Type } from 'main.core';
import { type DiagramBlockIdMap } from 'ui.block-diagram';

import { type ActivityData, type Block, type Connection } from '../../../shared/types';
import { createUniqueId } from '../../../shared/utils/index.js';

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

/**
 * Rewrites the domain references of a fragment the canvas has already re-identified: its blocks and
 * connections carry new ids, and blockIdMap says which block id replaced which. Seeding the
 * replacement map with that map is what keeps an activity named exactly like the block it belongs
 * to; the nested activity names, which the canvas knows nothing about, get ids of their own.
 */
export function rewriteActivityIds(target: BlocksContent, blockIdMap: DiagramBlockIdMap): BlocksContent
{
	return replaceActivityIds(target, makeReplaceMap(target.blocks, blockIdMap));
}

function makeReplaceMap(blocks: Array<Block>, blockIdMap: DiagramBlockIdMap): ActivityIdsReplaceMap
{
	const replaceMap: ActivityIdsReplaceMap = new Map();

	blockIdMap.forEach((newId: ActivityId, oldId: ActivityId): void => {
		if (Type.isStringFilled(oldId))
		{
			replaceMap.set(oldId, newId);
		}
	});

	const activityIds: ActivityIds = new Set();
	blocks.forEach((block: Block): void => addActivityIdsToSet(block?.activity, activityIds));

	activityIds.forEach((id: ActivityId): void => {
		if (!replaceMap.has(id))
		{
			replaceMap.set(id, createUniqueId());
		}
	});

	return replaceMap;
}

function replaceActivityIds(target: BlocksContent, replaceMap: ActivityIdsReplaceMap): BlocksContent
{
	let serialized = JSON.stringify(target);

	for (const [pattern, replacement] of replaceMap.entries())
	{
		// Quoted on both sides on purpose: a whole string equal to the id is rewritten wherever it
		// sits, while a reference inside an expression keeps pointing at the original block.
		serialized = serialized.replaceAll(`"${pattern}"`, `"${replacement}"`);
	}

	return JSON.parse(serialized);
}
