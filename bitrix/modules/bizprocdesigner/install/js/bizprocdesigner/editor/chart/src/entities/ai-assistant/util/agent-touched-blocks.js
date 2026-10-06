import type { AnimationItem } from 'ui.block-diagram';
import { ANIMATED_TYPES } from 'ui.block-diagram';

import type { Block, BlockId } from '../../../shared/types';
import { BLOCK_TYPES } from '../../blocks/constants';

type AgentTouchedBlocksInput = {
	changedBlockIds: Set<BlockId>,
	animatedItems: Array<AnimationItem>,
	newBlocks: Array<Block>,
};

function isFrame(block: ?Block): boolean
{
	return block?.type === BLOCK_TYPES.FRAME;
}

// Property diff is not computed here: changedBlockIds is reported by the graph store from the very
// pass that applies the properties, the only pass that still sees the previous values.
export function collectAgentTouchedBlockIds(
	{ changedBlockIds, animatedItems, newBlocks }: AgentTouchedBlocksInput,
): Set<BlockId>
{
	const newBlockById: Map<BlockId, Block> = new Map(
		newBlocks.map((block: Block): [BlockId, Block] => [block.id, block]),
	);
	const touchedBlockIds: Set<BlockId> = new Set();

	for (const item: AnimationItem of animatedItems)
	{
		if (item.type === ANIMATED_TYPES.BLOCK && !isFrame(item.item))
		{
			touchedBlockIds.add(item.item.id);
		}
	}

	for (const blockId: BlockId of changedBlockIds)
	{
		if (!isFrame(newBlockById.get(blockId)))
		{
			touchedBlockIds.add(blockId);
		}
	}

	return touchedBlockIds;
}
