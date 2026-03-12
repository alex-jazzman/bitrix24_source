import type { Block, BlockId } from '../../../shared/types';
import { deepEqual } from '../../../shared/utils';

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

export function getBlockUserTitle(block: Block): ?string
{
	const activityTitle = block.activity?.Properties?.Title;
	const defaultNodeTitle = block.node?.title;

	return activityTitle === defaultNodeTitle ? null : activityTitle;
}
