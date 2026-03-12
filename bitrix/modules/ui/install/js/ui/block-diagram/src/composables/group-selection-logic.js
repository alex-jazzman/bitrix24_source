import { Type } from 'main.core';
import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

type UseGroupSelectionLogic = {
	onCanvasSelect: ?{ x: number, y: number, width: number, height: number },
	onSelectionStart: Function,
	groupSelectionStyle: {
		left: string,
		top: string,
		width: string,
		height: string,
	},
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

export function useGroupSelectionLogic(closeContextMenu, options: UseGroupSelectionLogicOptions): UseGroupSelectionLogic
{
	const {
		blocks: uiBlocksRef,
		transformLayoutRef,
		highlitedBlockIds,
		setSelectionActive,
		isSelectionActive,
	} = useBlockDiagram();

	const width = options.defaultBlockSize.width;
	const height = options.defaultBlockSize.height;

	const getBlockDimensions = (block, container) => {
		let w = block.dimensions?.width;
		let h = block.dimensions?.height;

		if (!w || !h)
		{
			const el = container?.querySelector(`[data-id="${block.id}"]`);
			if (el)
			{
				w = el.offsetWidth;
				h = el.offsetHeight;
			}
			else
			{
				w = width;
				h = height;
			}
		}

		return { w, h };
	};

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

	function onCanvasSelect(worldRect): void
	{
		if (!worldRect)
		{
			setSelectionActive(false);

			return;
		}

		const blocks = toValue(uiBlocksRef);
		const container = toValue(transformLayoutRef);

		const intersectingIds = new Set();

		blocks.forEach((block) => {
			const { x, y } = block.position;
			const { w, h } = getBlockDimensions(block, container);

			const isIntersecting = worldRect.x < x + w
				&& worldRect.x + worldRect.width > x
				&& worldRect.y < y + h
				&& worldRect.y + worldRect.height > y;

			if (isIntersecting)
			{
				intersectingIds.add(block.id);
			}
		});

		const currentIds = toValue(highlitedBlockIds) || [];
		const nextIds = currentIds.filter((id) => intersectingIds.has(id));

		intersectingIds.forEach((id) => {
			if (!nextIds.includes(id))
			{
				nextIds.push(id);
			}
		});

		highlitedBlockIds.value = nextIds;
	}

	function onSelectionStart(): void
	{
		setSelectionActive(true);
		closeContextMenu();
		highlitedBlockIds.value = [];
	}

	const groupSelectionStyle = computed(() => {
		if (toValue(isSelectionActive))
		{
			return null;
		}

		const ids = toValue(highlitedBlockIds) || [];

		if (ids.length <= 1)
		{
			return null;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		let hasBlocks = false;
		const blocks = toValue(uiBlocksRef);
		const container = toValue(transformLayoutRef);

		ids.forEach((id) => {
			const block = blocks.find((item) => item.id === id);
			if (block)
			{
				hasBlocks = true;
				const { x, y } = block.position;
				const { w, h } = getBlockDimensions(block, container);

				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x + w);
				maxY = Math.max(maxY, y + h);
			}
		});

		if (!hasBlocks)
		{
			return null;
		}

		const padding = getSelectionBoxPadding();

		return {
			left: `${minX - padding.left}px`,
			top: `${minY - padding.top}px`,
			width: `${maxX - minX + padding.left + padding.right}px`,
			height: `${maxY - minY + padding.top + padding.bottom}px`,
		};
	});

	return {
		onCanvasSelect,
		onSelectionStart,
		groupSelectionStyle,
	};
}
