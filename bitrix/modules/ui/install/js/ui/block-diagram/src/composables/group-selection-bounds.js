import { computed, toValue } from 'ui.vue3';

import { getSelectionBlockSize, getUsablePosition, type BlockSize } from '../utils/block-geometry';
import { type DiagramBlock, type DiagramBlockId, type Point, type Rect } from '../types';

// The geometry itself lives in the utils layer - both the selection and the fit of the overview
// measure a node the same way.
export { getSelectionBlockSize, getUsablePosition };
export type { BlockSize };

export type SelectionBounds = {
	minX: number,
	minY: number,
	maxX: number,
	maxY: number,
};

export type UseGroupSelectionBoundsOptions = {
	blocks: Array<DiagramBlock>,
	selectedIds: Array<DiagramBlockId>,
	blocksRectMap: Object,
	defaultBlockSize: BlockSize,
};

export type UseGroupSelectionBounds = {
	// Bounding box of the selection, or null when there is nothing to draw a frame around.
	selectionBounds: SelectionBounds | null,
	blockById: Map<DiagramBlockId, DiagramBlock>,
	blockOrderById: Map<DiagramBlockId, number>,
	blockSize: (block: DiagramBlock) => BlockSize,
	// How far a node may reach past the box the model gives it.
	selectionSearchPadding: BlockSize,
};

// Whether a rectangle overlaps a node. Strict on every side: a node that only touches the
// rectangle by an edge is not inside it.
export function isRectOverBlock(rect: Rect, position: Point, size: BlockSize): boolean
{
	return rect.x < position.x + size.width
		&& rect.x + rect.width > position.x
		&& rect.y < position.y + size.height
		&& rect.y + rect.height > position.y;
}

/**
 * Geometry of the selection: where the selected nodes stand and how large the box around them is.
 * The shift a running drag draws is kept out of it - nothing here changes between the frames of one
 * gesture, and the frame only adds that shift on top.
 */
export function useGroupSelectionBounds(
	options: UseGroupSelectionBoundsOptions,
): UseGroupSelectionBounds
{
	const { blocks, selectedIds, blocksRectMap, defaultBlockSize } = options;

	// One pass over the model instead of a linear lookup per selected node.
	const blockById = computed(() => {
		return new Map(
			toValue(blocks).map((block: DiagramBlock) => [toValue(block).id, block]),
		);
	});

	const blockOrderById = computed(() => {
		return new Map(
			toValue(blocks).map((block: DiagramBlock, index: number) => [toValue(block).id, index]),
		);
	});

	function blockSize(block: DiagramBlock): BlockSize
	{
		return getSelectionBlockSize(block, blocksRectMap, defaultBlockSize);
	}

	// The rule above measures a node by its drawn size, the spatial index boxes it by the model
	// dimensions, and both boxes start at the same position: a node reaches past its model box by
	// the excess of one size over the other, and the largest such excess is how far a search
	// rectangle has to grow. A node whose model size is not finite has no usable box in the index
	// at all, so its whole drawn size is taken. Only sizes are read here, so a frame of a gesture
	// leaves the value alone.
	const selectionSearchPadding = computed(() => {
		let width = 0;
		let height = 0;

		toValue(blocks).forEach((block: DiagramBlock) => {
			const drawnSize = blockSize(block);
			const dimensions = toValue(block).dimensions;
			const modelWidth = Number(dimensions?.width);
			const modelHeight = Number(dimensions?.height);

			width = Math.max(width, drawnSize.width - (Number.isFinite(modelWidth) ? modelWidth : 0));
			height = Math.max(height, drawnSize.height - (Number.isFinite(modelHeight) ? modelHeight : 0));
		});

		return { width, height };
	});

	const selectionBounds = computed(() => {
		const ids = toValue(selectedIds) ?? [];

		// A frame over a single node would only repeat its own outline.
		if (ids.length <= 1)
		{
			return null;
		}

		const byId = toValue(blockById);

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		let hasBlocks = false;

		ids.forEach((id: DiagramBlockId) => {
			const block = byId.get(id) ?? null;

			if (block === null)
			{
				return;
			}

			const position = getUsablePosition(block);

			if (position === null)
			{
				return;
			}

			hasBlocks = true;
			const size = blockSize(block);

			minX = Math.min(minX, position.x);
			minY = Math.min(minY, position.y);
			maxX = Math.max(maxX, position.x + size.width);
			maxY = Math.max(maxY, position.y + size.height);
		});

		return hasBlocks ? { minX, minY, maxX, maxY } : null;
	});

	return {
		selectionBounds,
		blockById,
		blockOrderById,
		blockSize,
		selectionSearchPadding,
	};
}
