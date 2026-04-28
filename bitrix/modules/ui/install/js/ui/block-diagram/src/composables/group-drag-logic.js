import { Event } from 'main.core';
import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

type UseGroupDragLogic = {
	onGroupMouseDown: MouseEvent;
};

// eslint-disable-next-line max-lines-per-function
export function useGroupDragLogic(
	closeContextMenu: () => void,
): UseGroupDragLogic
{
	const {
		blocks: uiBlocksRef,
		zoom,
		updateBlock,
		setPortOffsetByBlockId,
		highlitedBlockIds,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
		updateBlockRectangle,
		isBoxIntersection,
	} = useBlockDiagram();

	let currentZoom = 1;
	let movingItems = [];
	let anchor = { x: 0, y: 0 };
	let client = { x: 0, y: 0 };
	let lastTotalDelta = { x: 0, y: 0 };

	const updatePositions = (clientX: number, clientY: number): void => {
		const totalDeltaX = (clientX - anchor.x) / currentZoom;
		const totalDeltaY = (clientY - anchor.y) / currentZoom;

		const stepX = totalDeltaX - lastTotalDelta.x;
		const stepY = totalDeltaY - lastTotalDelta.y;

		if (stepX === 0 && stepY === 0)
		{
			return;
		}

		for (const item of movingItems)
		{
			item.block.position.x = item.startX + totalDeltaX;
			item.block.position.y = item.startY + totalDeltaY;
			if (setPortOffsetByBlockId)
			{
				setPortOffsetByBlockId(item.block.id, { x: -stepX, y: -stepY });
			}
		}

		lastTotalDelta.x = totalDeltaX;
		lastTotalDelta.y = totalDeltaY;
	};

	const onGroupMouseDown = (event: MouseEvent): void => {
		if (event.button !== 0)
		{
			return;
		}
		event.stopPropagation();
		closeContextMenu();

		currentZoom = toValue(zoom);
		anchor = { x: event.clientX, y: event.clientY };
		client = { x: event.clientX, y: event.clientY };
		lastTotalDelta = { x: 0, y: 0 };

		const selectedIds = new Set(toValue(highlitedBlockIds));
		movingItems = toValue(uiBlocksRef)
			.filter((block) => selectedIds.has(block.id))
			.map((block) => ({
				block,
				startX: Number(block.position.x),
				startY: Number(block.position.y),
			}));

		startAutoScroll(event, (dx: number, dy: number) => {
			anchor.x -= dx;
			anchor.y -= dy;
			updatePositions(client.x, client.y);
		});

		Event.bind(window, 'mousemove', onGroupMouseMove);
		Event.bind(window, 'mouseup', onGroupMouseUp);
	};

	const onGroupMouseMove = (event: MouseEvent): void => {
		client.x = event.clientX;
		client.y = event.clientY;

		updateMousePosition(event);
		updatePositions(client.x, client.y);
	};

	const onGroupMouseUp = (): void => {
		stopAutoScroll();
		Event.unbind(window, 'mousemove', onGroupMouseMove);
		Event.unbind(window, 'mouseup', onGroupMouseUp);

		for (const item of movingItems)
		{
			const { block } = item;

			block.position.x = Math.round(block.position.x);
			block.position.y = Math.round(block.position.y);

			if (setPortOffsetByBlockId)
			{
				setPortOffsetByBlockId(block.id, { x: 0, y: 0 });
			}

			const newBlock = { ...block };
			updateBlock(newBlock);
			if (toValue(isBoxIntersection))
			{
				updateBlockRectangle(block.id, {
					x: block.position.x,
					y: block.position.y,
				});
			}
		}

		movingItems = [];
	};

	return { onGroupMouseDown };
}
