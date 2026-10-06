import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useTransientHighlightedBlocks } from './transient-highlighted-blocks';
import { getCanvasRect, shouldRetainGeometry } from '../utils';
import { BLOCK_INDEXES } from '../constants';
import type { DiagramBlock } from '../types';

export type UseBlockStateOptions = {
	block: DiagramBlock,
	blockRef: HTMLElement,
};

export type UseBlockState = {
	isHiglitedBlock: boolean;
	isDisabled: boolean;
	updatePortsPositions: () => void;
	onMountedBlock: () => void;
	onUnmountedBlock: () => void;
};

export function useBlockState(options: UseBlockStateOptions): UseBlockState
{
	const {
		block,
		blockRef,
	} = options;
	const {
		blockElMap,
		blocksRectMap,
		isDisabledBlockDiagram,
		movingBlockId,
		blockMounted,
		isRenderOptimizationAvailable,
		blockIdsInModel,
		updatePortSegmentSizes,
		portsRectMap,
	} = useBlockDiagram();
	const { isBlockVisuallyHighlighted } = useTransientHighlightedBlocks();

	const isHiglitedBlock = computed(() => {
		return isBlockVisuallyHighlighted(toValue(block)?.id);
	});

	const isDisabled = computed(() => {
		return toValue(isDisabledBlockDiagram);
	});

	const blockZindex = computed(() => {
		if (toValue(movingBlockId) === toValue(block).id)
		{
			return { zIndex: BLOCK_INDEXES.MOVABLE };
		}

		if (toValue(isHiglitedBlock))
		{
			return { zIndex: BLOCK_INDEXES.HIGHLITED };
		}

		return { zIndex: BLOCK_INDEXES.STANDING };
	});

	// Under culling an off-screen block never mounts, so waitAllBlocksMounted never
	// resolves and the deferred updatePortSegmentSizes in onMountedPort never runs — the
	// port keeps zero-length segments and its retained routing geometry stays empty. The
	// block's ports mount before it (children before parent) and its rect is written just
	// above, so compute the segments here directly, bypassing the global barrier (the same
	// direct-compute precedent as connections-queue-transition.js). The promise path stays
	// and recomputes idempotently if the barrier ever resolves. Order comes from the rect
	// captured at port mount, matching the order the drawing path uses.
	function measurePortSegments(blockId)
	{
		const portsRect = toValue(portsRectMap)[blockId];
		if (!portsRect)
		{
			return;
		}

		for (const portId of Object.keys(portsRect))
		{
			updatePortSegmentSizes(blockId, portId, portsRect[portId].order ?? 0);
		}
	}

	function onMountedBlock()
	{
		const blockId = toValue(block).id;

		if (!toValue(blockElMap).has(blockId))
		{
			toValue(blockElMap).set(blockId, toValue(blockRef));
		}

		const {
			x = 0,
			y = 0,
			width = 0,
			height = 0,
		} = getCanvasRect(toValue(blockRef)) ?? {};

		blocksRectMap.value[blockId] = {
			x,
			y,
			width,
			height,
		};

		if (toValue(isRenderOptimizationAvailable))
		{
			measurePortSegments(blockId);
		}

		blockMounted(blockId);
	}

	function onUnmountedBlock()
	{
		const blockId = toValue(block).id;

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
		isDisabled,
		blockZindex,
		onMountedBlock,
		onUnmountedBlock,
	};
}
