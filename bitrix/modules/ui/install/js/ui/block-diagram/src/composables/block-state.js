import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
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
		highlitedBlockIds,
		isDisabledBlockDiagram,
		zoom,
		transformX,
		transformY,
		blockDiagramLeft,
		blockDiagramTop,
		movingBlock,
		blockMounted,
	} = useBlockDiagram();

	const isHiglitedBlock = computed(() => {
		return highlitedBlockIds.value.includes(toValue(block).id);
	});

	const isDisabled = computed(() => {
		return toValue(isDisabledBlockDiagram);
	});

	const blockZindex = computed(() => {
		if (toValue(movingBlock)?.id === toValue(block).id)
		{
			return { zIndex: BLOCK_INDEXES.MOVABLE };
		}

		if (toValue(isHiglitedBlock))
		{
			return { zIndex: BLOCK_INDEXES.HIGHLITED };
		}

		return { zIndex: BLOCK_INDEXES.STANDING };
	});

	function onMountedBlock()
	{
		if (!toValue(blockElMap).has(toValue(block).id))
		{
			toValue(blockElMap).set(toValue(block).id, toValue(blockRef));
		}

		const {
			x,
			y,
			width,
			height,
		} = toValue(blockRef)?.getBoundingClientRect() ?? {};

		blocksRectMap.value[toValue(block).id] = {
			x: (x / toValue(zoom)) + toValue(transformX) - (toValue(blockDiagramLeft) / toValue(zoom)),
			y: (y / toValue(zoom)) + toValue(transformY) - (toValue(blockDiagramTop) / toValue(zoom)),
			width,
			height,
		};

		blockMounted(toValue(block).id);
	}

	function onUnmountedBlock()
	{
		if (toValue(blockElMap).has(toValue(block).id))
		{
			toValue(blockElMap).delete(toValue(block).id);
		}

		delete blocksRectMap[toValue(block).id];
	}

	return {
		isHiglitedBlock,
		isDisabled,
		blockZindex,
		onMountedBlock,
		onUnmountedBlock,
	};
}
