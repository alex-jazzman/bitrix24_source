import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import type { DiagramBlockId } from '../types';

export type UseTransientHighlightedBlocks = {
	transientHighlightedBlockIds: Array<DiagramBlockId>;
	add: (blockId: DiagramBlockId) => void;
	clear: () => void;
	isBlockVisuallyHighlighted: (blockId: DiagramBlockId) => boolean;
};

export function useTransientHighlightedBlocks(): UseTransientHighlightedBlocks
{
	const {
		highlitedBlockIds,
		transientHighlightedBlockIds,
	} = useBlockDiagram();

	function add(blockId: DiagramBlockId): void
	{
		if (!toValue(transientHighlightedBlockIds).includes(blockId))
		{
			toValue(transientHighlightedBlockIds).push(blockId);
		}
	}

	function clear(): void
	{
		transientHighlightedBlockIds.value = [];
	}

	function isBlockVisuallyHighlighted(blockId: DiagramBlockId): boolean
	{
		return toValue(highlitedBlockIds).includes(blockId)
			|| toValue(transientHighlightedBlockIds).includes(blockId);
	}

	return {
		transientHighlightedBlockIds,
		add,
		clear,
		isBlockVisuallyHighlighted,
	};
}
