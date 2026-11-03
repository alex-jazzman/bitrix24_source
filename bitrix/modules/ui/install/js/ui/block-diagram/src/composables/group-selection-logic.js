import { Type } from 'main.core';
import { computed, toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { getUsablePosition, isRectOverBlock, useGroupSelectionBounds } from './group-selection-bounds';
import { replaceSelection, clearSelection } from './highlighted-blocks';
import { type DiagramBlock, type DiagramBlockId, type Rect } from '../types';

type GroupSelectionStyle = {
	left: string,
	top: string,
	width: string,
	height: string,
};

type UseGroupSelectionLogic = {
	onCanvasSelect: (worldRect: Rect | null) => void,
	onSelectionStart: () => void,
	groupSelectionStyle: GroupSelectionStyle | null,
};

type PaddingConfig = {
	top: number,
	right: number,
	bottom: number,
	left: number,
};

type DefaultBlockSize = {
	width: number,
	height: number,
};

type UseGroupSelectionLogicOptions = {
	padding?: number | PaddingConfig,
	defaultBlockSize?: DefaultBlockSize,
};

// eslint-disable-next-line max-lines-per-function
export function useGroupSelectionLogic(closeContextMenu, options: UseGroupSelectionLogicOptions): UseGroupSelectionLogic
{
	const {
		blocks: uiBlocksRef,
		blocksRectMap,
		blockIntersections,
		highlitedBlockIds,
		setSelectionActive,
		isSelectionActive,
		groupDragOffset,
	} = useBlockDiagram();

	const {
		selectionBounds,
		blockOrderById,
		blockSize,
		selectionSearchPadding,
	} = useGroupSelectionBounds({
		blocks: uiBlocksRef,
		selectedIds: highlitedBlockIds,
		blocksRectMap,
		defaultBlockSize: options.defaultBlockSize,
	});

	const getSelectionBoxPadding = (): PaddingConfig => {
		const pad = toValue(options.padding);

		if (Type.isNumber(pad))
		{
			return { top: pad, right: pad, bottom: pad, left: pad };
		}

		return {
			top: pad.top,
			right: pad.right,
			bottom: pad.bottom,
			left: pad.left,
		};
	};

	// Nodes the rectangle stands over, in the order they have in the model. The spatial index only
	// narrows the candidates down - the strict rule below decides, and it measures a node by its
	// own geometry. The query is grown by how far a node may reach past its model box; both boxes
	// start at the same position, hence the growth on the near sides alone.
	const collectIntersectingIds = (worldRect: Rect): Set<DiagramBlockId> => {
		const padding = toValue(selectionSearchPadding);
		const candidates = blockIntersections.search({
			minX: worldRect.x - padding.width,
			minY: worldRect.y - padding.height,
			maxX: worldRect.x + worldRect.width,
			maxY: worldRect.y + worldRect.height,
		});

		const order = toValue(blockOrderById);
		const hits = candidates.filter((block: DiagramBlock) => {
			const position = getUsablePosition(block);

			return position !== null && isRectOverBlock(worldRect, position, blockSize(block));
		});

		hits.sort((left: DiagramBlock, right: DiagramBlock) => {
			return (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0);
		});

		return new Set(hits.map((block: DiagramBlock) => block.id));
	};

	function onCanvasSelect(worldRect: Rect | null): void
	{
		if (!worldRect)
		{
			setSelectionActive(false);

			return;
		}

		const intersectingIds = collectIntersectingIds(worldRect);

		const currentIds = toValue(highlitedBlockIds) || [];
		const nextIds = currentIds.filter((id) => intersectingIds.has(id));
		// Membership by set: a linear lookup per node would cost the square of the selection on
		// every frame.
		const nextIdSet = new Set(nextIds);

		intersectingIds.forEach((id) => {
			if (!nextIdSet.has(id))
			{
				nextIds.push(id);
				nextIdSet.add(id);
			}
		});

		// Every replacement wakes each subscriber of the selection, so a frame that kept the same
		// nodes in the same order publishes nothing. The set size tells that apart from a duplicate
		// the replacement would have dropped.
		const isSameSelection = nextIds.length === currentIds.length
			&& nextIdSet.size === nextIds.length
			&& nextIds.every((id: DiagramBlockId, index: number) => id === currentIds[index]);

		if (isSameSelection)
		{
			return;
		}

		replaceSelection(highlitedBlockIds, nextIds);
	}

	function onSelectionStart(): void
	{
		setSelectionActive(true);
		closeContextMenu();
		clearSelection(highlitedBlockIds);
	}

	const groupSelectionStyle = computed(() => {
		if (toValue(isSelectionActive))
		{
			return null;
		}

		const bounds = toValue(selectionBounds);

		if (bounds === null)
		{
			return null;
		}

		const padding = getSelectionBoxPadding();
		// The model keeps the pre-gesture positions until mouseup, so the box stands on the bounds
		// above and follows the drag by the shift it has drawn.
		const { x: dragOffsetX, y: dragOffsetY } = toValue(groupDragOffset);

		return {
			left: `${bounds.minX + dragOffsetX - padding.left}px`,
			top: `${bounds.minY + dragOffsetY - padding.top}px`,
			width: `${bounds.maxX - bounds.minX + padding.left + padding.right}px`,
			height: `${bounds.maxY - bounds.minY + padding.top + padding.bottom}px`,
		};
	});

	return {
		onCanvasSelect,
		onSelectionStart,
		groupSelectionStyle,
	};
}
