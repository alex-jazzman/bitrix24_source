import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import type { DiagramBlockId } from '../types';

type HighlitedBlockIdsRef = {
	value: Array<DiagramBlockId>,
};

export type UseHighlightedBlocks = {
	highlitedBlockIds: Array<DiagramBlockId>;
	replace: (blockIds: Array<DiagramBlockId>) => void;
	add: (blockId: DiagramBlockId) => void;
	remove: (blockId: DiagramBlockId) => void;
	clear: () => void;
};

// The selection is a set: a duplicate in it draws the group frame over a single block. These
// operations are the only writers of the list and take the ref itself, so that a caller already
// holding it writes by the same rules without a component context of its own.

export function replaceSelection(
	highlitedBlockIds: HighlitedBlockIdsRef,
	blockIds: Array<DiagramBlockId>,
): void
{
	// eslint-disable-next-line no-param-reassign
	highlitedBlockIds.value = [...new Set(blockIds)];
}

export function addToSelection(highlitedBlockIds: HighlitedBlockIdsRef, blockId: DiagramBlockId): void
{
	const selected = toValue(highlitedBlockIds);

	if (!selected.includes(blockId))
	{
		selected.push(blockId);
	}
}

export function removeFromSelection(highlitedBlockIds: HighlitedBlockIdsRef, blockId: DiagramBlockId): void
{
	const selected = toValue(highlitedBlockIds);
	const highlitedIndx: number = selected.indexOf(blockId);

	if (highlitedIndx > -1)
	{
		selected.splice(highlitedIndx, 1);
	}
}

export function clearSelection(highlitedBlockIds: HighlitedBlockIdsRef): void
{
	// eslint-disable-next-line no-param-reassign
	highlitedBlockIds.value = [];
}

export function useHighlightedBlocks(): UseHighlightedBlocks
{
	const { highlitedBlockIds } = useBlockDiagram();

	function replace(blockIds: Array<DiagramBlockId>): void
	{
		replaceSelection(highlitedBlockIds, blockIds);
	}

	function add(blockId: DiagramBlockId): void
	{
		addToSelection(highlitedBlockIds, blockId);
	}

	function remove(blockId: DiagramBlockId): void
	{
		removeFromSelection(highlitedBlockIds, blockId);
	}

	function clear(): void
	{
		clearSelection(highlitedBlockIds);
	}

	return {
		highlitedBlockIds,
		replace,
		add,
		remove,
		clear,
	};
}
