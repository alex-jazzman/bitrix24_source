import { type Block, type BlockId } from '../../../shared/types';
import { deepEqual } from '../../../shared/utils/object';
import { BLOCK_TOP_CONTEXT_MENU_PREFIX_NAME } from '../constants';

export function isBlockPropertiesDifferent(currentBlock: Block, newBlock: Block): boolean
{
	// Defensive invariant: block.id and activity.Name are identical by construction.
	if (currentBlock?.activity?.Name !== newBlock?.activity?.Name)
	{
		return true;
	}

	if (currentBlock?.activity?.Type !== newBlock?.activity?.Type)
	{
		return true;
	}

	if (currentBlock?.node?.title !== newBlock?.node?.title)
	{
		return true;
	}

	const currentProperties = currentBlock?.activity?.Properties ?? {};
	const newProperties = newBlock?.activity?.Properties ?? {};

	// Union of both key sets: detects properties removed in the new block too.
	const keys: Set<string> = new Set([...Object.keys(currentProperties), ...Object.keys(newProperties)]);
	for (const key: string of keys)
	{
		if (!deepEqual(currentProperties[key] ?? null, newProperties[key] ?? null))
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

export function getContextMenuName(blockId: BlockId): string
{
	return `${BLOCK_TOP_CONTEXT_MENU_PREFIX_NAME}_${blockId}`;
}
