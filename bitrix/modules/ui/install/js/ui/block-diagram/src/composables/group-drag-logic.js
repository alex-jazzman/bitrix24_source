import { Event } from 'main.core';
import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

type UseGroupDragLogic = {
	onGroupMouseDown: MouseEvent;
};

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
	} = useBlockDiagram();

	let checkBoxDragStartX = 0;
	let checkBoxDragStartY = 0;
	let lastDeltaX = 0;
	let lastDeltaY = 0;
	let movingItems = [];

	function onGroupMouseDown(event: MouseEvent): void
	{
		event.stopPropagation();
		closeContextMenu();
		if (event.button !== 0)
		{
			return;
		}

		checkBoxDragStartX = event.clientX;
		checkBoxDragStartY = event.clientY;
		lastDeltaX = 0;
		lastDeltaY = 0;

		movingItems = [];
		const ids = toValue(highlitedBlockIds);
		const blocks = toValue(uiBlocksRef);

		ids.forEach((id) => {
			const block = blocks.find((item) => item.id === id);
			if (block)
			{
				movingItems.push({
					block,
					startX: Number(block.position.x),
					startY: Number(block.position.y),
				});
			}
		});

		Event.bind(window, 'mousemove', onGroupMouseMove);
		Event.bind(window, 'mouseup', onGroupMouseUp);
	}

	function onGroupMouseMove(event: MouseEvent): void
	{
		event.preventDefault();

		const currentZoom = toValue(zoom);
		if (!currentZoom)
		{
			return;
		}

		const totalDeltaX = (event.clientX - checkBoxDragStartX) / currentZoom;
		const totalDeltaY = (event.clientY - checkBoxDragStartY) / currentZoom;

		const stepX = totalDeltaX - lastDeltaX;
		const stepY = totalDeltaY - lastDeltaY;
		lastDeltaX = totalDeltaX;
		lastDeltaY = totalDeltaY;

		for (const item of movingItems)
		{
			const { block, startX, startY } = item;

			block.position.x = startX + totalDeltaX;
			block.position.y = startY + totalDeltaY;

			if (setPortOffsetByBlockId)
			{
				setPortOffsetByBlockId(block.id, { x: -stepX, y: -stepY });
			}
		}
	}

	function onGroupMouseUp(): void
	{
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

			updateBlock({ ...block });
		}

		movingItems = [];
	}

	return { onGroupMouseDown };
}
