import { Type } from 'main.core';
import type { Block, BlockId } from '../../../shared/types';

function deepEqual(a: any, b: any): boolean
{
	if (a === b)
	{
		return true;
	}

	if (!Type.isPlainObject(a) || !Type.isPlainObject(b))
	{
		return false;
	}

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length)
	{
		return false;
	}

	for (const key of keysA)
	{
		if (!deepEqual(a[key], b[key]))
		{
			return false;
		}
	}

	return true;
}

export function isBlockPropertiesDifferent(currentBlock: Block, newBlock: Block): boolean
{
	if (currentBlock.node.title !== newBlock.node.title)
	{
		return true;
	}

	for (const [key: string] of Object.entries(newBlock?.activity?.Properties ?? {}))
	{
		const currentBlockProperty = currentBlock?.activity?.Properties?.[key] ?? null;
		const newBlockProperty = newBlock.activity.Properties[key];

		if (!deepEqual(currentBlockProperty, newBlockProperty))
		{
			return true;
		}
	}

	return false;
}

export function getBlockMap(blocks: Block[]): Map<BlockId, Block>
{
	return new Map(blocks.map((block: Block): [BlockId, Block] => [block.id, block]));
}

export function getChangedPropertiesBlockIds(currentBlocks: Block[], newBlocks: Block[]): Set<BlockId>
{
	const currentBlocksMap: Map<BlockId, Block> = getBlockMap(currentBlocks);
	const changedBlockIds: Set<BlockId> = new Set([]);
	for (const newBlock: Block of newBlocks)
	{
		const currentBlock: ?Block = currentBlocksMap.get(newBlock.id);
		if (currentBlock && isBlockPropertiesDifferent(currentBlock, newBlock))
		{
			changedBlockIds.add(currentBlock.id);
		}
	}

	return changedBlockIds;
}

export function isBlockActivated(block: Block): boolean
{
	if (!block?.activity?.Activated)
	{
		return true;
	}

	return block.activity.Activated !== 'N';
}
