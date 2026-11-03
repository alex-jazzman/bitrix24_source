import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useTransientHighlightedBlocks } from './transient-highlighted-blocks';
import { useDisplacedBlocks } from './displaced-blocks';
import { getCanvasRect, getOwnRecord, shouldRetainGeometry, type CanvasRect } from '../utils';
import { BLOCK_INDEXES } from '../constants';
import type { DiagramBlock, DiagramBlockId } from '../types';

export type UseBlockStateOptions = {
	block: DiagramBlock,
	blockRef: HTMLElement,
	// A step of its own for a block that must not follow hover and selection - the backdrop. Left
	// out, the block goes through the usual branches.
	restingZIndex?: number | null,
};

// Under culling an off-screen block never mounts, so waitAllBlocksMounted never
// resolves and the deferred updatePortSegmentSizes in onMountedPort never runs — the
// port keeps zero-length segments and its retained routing geometry stays empty. The
// block's ports mount before it (children before parent) and its rect is written just
// above, so compute the segments here directly, bypassing the global barrier (the same
// direct-compute precedent as connections-queue-transition.js). The promise path stays
// and recomputes idempotently if the barrier ever resolves. Order comes from the rect
// captured at port mount, matching the order the drawing path uses.
function measurePortSegments(
	blockId: DiagramBlockId,
	portsRectMap: { [DiagramBlockId]: Object },
	updatePortSegmentSizes: (blockId: DiagramBlockId, portId: string, order: number) => void,
): void
{
	const portsRect = portsRectMap[blockId];
	if (!portsRect)
	{
		return;
	}

	for (const portId of Object.keys(portsRect))
	{
		updatePortSegmentSizes(blockId, portId, portsRect[portId].order ?? 0);
	}
}

export type UseBlockState = {
	isHiglitedBlock: boolean;
	isDisplacedBlock: boolean;
	isPlacementRefusedBlock: boolean;
	isDisabled: boolean;
	blockZindex: number;
	updatePortsPositions: () => void;
	onMountedBlock: () => void;
	onUnmountedBlock: () => void;
};

// Whether the rect a mount just measured is the one already stored.
function isMeasuredAgain(blocksRectMap: Object, blockId: string, rect: CanvasRect): boolean
{
	const stored = getOwnRecord(blocksRectMap, blockId);

	return (
		stored?.x === rect.x
		&& stored.y === rect.y
		&& stored.width === rect.width
		&& stored.height === rect.height
	);
}

export type BlockZIndexState = {
	hoveredBlockId: DiagramBlockId | null;
	movingBlockId: DiagramBlockId | null;
	isHighlighted: boolean;
	isElevated?: boolean;
	restingZIndex?: number | null;
};

// The only place turning block state into a stacking step. Hover is checked before the drag: the
// node being dragged is under the cursor anyway and has to stand above the rest, so the hovered
// step replaces MOVABLE for it. The raise is one and the same addition for every participant, so
// the order inside a raised set is the order it already had.
export function resolveBlockZIndex(block: DiagramBlock, state: BlockZIndexState): number
{
	const elevation = state.isElevated === true ? BLOCK_INDEXES.ELEVATION_OFFSET : 0;

	// A block with a resting step of its own skips hover and selection: the backdrop passed through
	// them would cover the very nodes it stands behind on a plain move of the pointer.
	if (Number.isFinite(state.restingZIndex))
	{
		return state.restingZIndex + elevation;
	}

	if (state.hoveredBlockId === block.id)
	{
		return BLOCK_INDEXES.HOVERED + elevation;
	}

	if (state.movingBlockId === block.id)
	{
		return BLOCK_INDEXES.MOVABLE + elevation;
	}

	if (state.isHighlighted)
	{
		return BLOCK_INDEXES.HIGHLITED + elevation;
	}

	return BLOCK_INDEXES.STANDING + elevation;
}

export function useBlockState(options: UseBlockStateOptions): UseBlockState
{
	const {
		block,
		blockRef,
		restingZIndex = null,
	} = options;
	const {
		blockElMap,
		blocksRectMap,
		isDisabledBlockDiagram,
		movingBlockId,
		hoveredBlockId,
		gestureBlockIds,
		isGestureElevated,
		blockMounted,
		isRenderOptimizationAvailable,
		blockIdsInModel,
		updatePortSegmentSizes,
		portsRectMap,
		resetHoveredBlock,
	} = useBlockDiagram();
	const { isBlockVisuallyHighlighted } = useTransientHighlightedBlocks();
	const { isBlockDisplaced, isBlockPlacementRefused } = useDisplacedBlocks();

	const isHiglitedBlock = computed(() => {
		return isBlockVisuallyHighlighted(toValue(block)?.id);
	});

	const isDisplacedBlock = computed(() => {
		return isBlockDisplaced(toValue(block)?.id);
	});

	const isPlacementRefusedBlock = computed(() => {
		return isBlockPlacementRefused(toValue(block)?.id);
	});

	const isDisabled = computed(() => {
		return toValue(isDisabledBlockDiagram);
	});

	// Both values it reads change twice per gesture - at the press and at the close - so a raise
	// costs two recomputes, not one per frame.
	const isElevatedBlock = computed(() => {
		return toValue(isGestureElevated) === true
			&& toValue(gestureBlockIds).has(toValue(block)?.id);
	});

	// The step itself, not a style object: an unchanged number stops the change from spreading,
	// so a hover redraws only the nodes whose step actually moved. A fresh object literal never
	// compares equal and would redraw every mounted node of the canvas.
	const blockZindex = computed(() => {
		return resolveBlockZIndex(toValue(block), {
			hoveredBlockId: toValue(hoveredBlockId),
			movingBlockId: toValue(movingBlockId),
			isHighlighted: toValue(isHiglitedBlock),
			isElevated: toValue(isElevatedBlock),
			restingZIndex: toValue(restingZIndex),
		});
	});

	function onMountedBlock()
	{
		const blockId = toValue(block).id;

		if (!toValue(blockElMap).has(blockId))
		{
			toValue(blockElMap).set(blockId, toValue(blockRef));
		}

		const rect = getCanvasRect(toValue(blockRef)) ?? { x: 0, y: 0, width: 0, height: 0 };

		// A remount under culling measures the very same rect; writing a new object anyway wakes
		// every reader of the measured geometry - the overview map rebuilds all of its rectangles.
		if (!isMeasuredAgain(blocksRectMap.value, blockId, rect))
		{
			blocksRectMap.value[blockId] = rect;
		}

		if (toValue(isRenderOptimizationAvailable))
		{
			measurePortSegments(blockId, toValue(portsRectMap), updatePortSegmentSizes);
		}

		blockMounted(blockId);
	}

	function onUnmountedBlock()
	{
		const blockId = toValue(block).id;

		// The browser sends no mouseleave for an element taken out of the DOM, so a node unmounted
		// while raised (deleted, or culled off-screen) would keep the state and come back raised
		// with the cursor elsewhere. Guarded like the leave: only the raised node clears it.
		if (toValue(hoveredBlockId) === blockId)
		{
			resetHoveredBlock();
		}

		toValue(blockElMap).delete(blockId);

		// Retain measured rect while the node stays in the model under culling
		// (see onUnmountedPort). Real removal clears it via purgeBlockGeometry.
		const retain = shouldRetainGeometry(
			toValue(isRenderOptimizationAvailable),
			toValue(blockIdsInModel),
			blockId,
		);
		if (!retain)
		{
			delete blocksRectMap.value[blockId];
		}
	}

	return {
		isHiglitedBlock,
		isDisplacedBlock,
		isPlacementRefusedBlock,
		isDisabled,
		blockZindex,
		onMountedBlock,
		onUnmountedBlock,
	};
}
