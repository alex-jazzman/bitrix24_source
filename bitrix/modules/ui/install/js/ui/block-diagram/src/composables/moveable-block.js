import { Event } from 'main.core';
import {
	ref,
	toValue,
	onMounted,
	onBeforeUnmount,
	computed,
	watchEffect,
} from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

export type UseBlockReturnType = {
	isDragged: boolean,
	blockPositionStyle: {
		top: string,
		left: string,
		width: string,
	},
};

// eslint-disable-next-line max-lines-per-function
export function useMoveableBlock(blockRef, block): UseBlockReturnType
{
	const isDragged = ref(false);
	const {
		isDisabledBlockDiagram,
		zoom,
		updateBlock,
		hooks,
		setMovingBlock,
		updateMovingBlockPosition,
		resetMovingBlock,
		setPortOffsetByBlockId,
		blocks: allBlocksRef,
		highlitedBlockIds,
	} = useBlockDiagram();

	let prevValueBlockX = 0;
	let prevValueBlockY = 0;

	const offsetBlockX = ref(0);
	const offsetBlockY = ref(0);
	let cachedGroupBlocks = [];

	const x = ref(toValue(block).position.x);
	const y = ref(toValue(block).position.y);

	watchEffect(() => {
		x.value = toValue(block).position.x;
		y.value = toValue(block).position.y;
	});

	const blockPositionStyle = computed(() => {
		return {
			top: `${y.value}px`,
			left: `${x.value}px`,
		};
	});

	onMounted(() => {
		Event.bind(toValue(blockRef), 'mousedown', onMouseDown);
	});

	onBeforeUnmount(() => {
		Event.unbind(toValue(blockRef), 'mousedown', onMouseDown);
	});

	const onMouseDown = (event: MouseEvent): void => {
		if (event.button !== 0 || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		event.stopPropagation();

		const blockId = toValue(block).id;
		const selectedIds = toValue(highlitedBlockIds);
		const isSelected = selectedIds.includes(blockId);

		if (!isSelected)
		{
			highlitedBlockIds.value = [blockId];
		}

		setMovingBlock(toValue(block));
		hooks.startDragBlock.trigger(block);

		prevValueBlockX = toValue(block).position.x;
		prevValueBlockY = toValue(block).position.y;

		offsetBlockX.value = Math.round(event.clientX - (toValue(block).position.x * toValue(zoom)));
		offsetBlockY.value = Math.round(event.clientY - (toValue(block).position.y * toValue(zoom)));

		cachedGroupBlocks = [];
		const groupIds = toValue(highlitedBlockIds);
		if (groupIds.length > 1)
		{
			const allBlocks = toValue(allBlocksRef);
			cachedGroupBlocks = allBlocks.filter((b) => groupIds.includes(b.id) && b.id !== blockId);
		}

		isDragged.value = true;
		Event.bind(document, 'mousemove', onMouseMove);
		Event.bind(document, 'mouseup', onMouseUp);
	};

	const onMouseMove = (event: MouseEvent): void => {
		if (!toValue(isDragged) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		event.stopPropagation();
		hooks.moveDragBlock.trigger(block);

		const newX = Math.round((event.clientX - toValue(offsetBlockX)) / toValue(zoom));
		const newY = Math.round((event.clientY - toValue(offsetBlockY)) / toValue(zoom));

		const deltaX = newX - prevValueBlockX;
		const deltaY = newY - prevValueBlockY;

		x.value = newX;
		y.value = newY;

		for (const targetBlock of cachedGroupBlocks)
		{
			targetBlock.position.x += deltaX;
			targetBlock.position.y += deltaY;

			if (setPortOffsetByBlockId)
			{
				setPortOffsetByBlockId(targetBlock.id, { x: -deltaX, y: -deltaY });
			}
		}

		updateMovingBlockPosition(x.value, y.value);
		setPortOffsetByBlockId(
			toValue(block).id,
			{
				x: prevValueBlockX - x.value,
				y: prevValueBlockY - y.value,
			},
		);
		prevValueBlockX = x.value;
		prevValueBlockY = y.value;
	};

	const onMouseUp = (event: MouseEvent): void => {
		event.stopPropagation();

		if (!toValue(isDragged) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		const positionX: number = Math.round((event.clientX - toValue(offsetBlockX)) / toValue(zoom));
		const positionY: number = Math.round((event.clientY - toValue(offsetBlockY)) / toValue(zoom));

		const isMoved = toValue(block).position.x !== positionX || toValue(block).position.y !== positionY;

		if (isMoved)
		{
			cachedGroupBlocks.forEach((targetBlock) => {
				const finalX = targetBlock.position.x;
				const finalY = targetBlock.position.y;

				const newBlockState = {
					...targetBlock,
					position: { ...targetBlock.position, x: finalX, y: finalY },
				};

				if (setPortOffsetByBlockId)
				{
					setPortOffsetByBlockId(targetBlock.id, { x: 0, y: 0 });
				}

				updateBlock(newBlockState);
				hooks.endDragBlock.trigger(newBlockState);
			});

			const currentBlockState = {
				...toValue(block),
				position: { ...toValue(block).position, x: positionX, y: positionY },
			};

			if (setPortOffsetByBlockId)
			{
				setPortOffsetByBlockId(toValue(block).id, {
					x: prevValueBlockX - positionX,
					y: prevValueBlockY - positionY,
				});
			}

			updateBlock(currentBlockState);
			hooks.endDragBlock.trigger(currentBlockState);
		}

		resetMovingBlock();
		cachedGroupBlocks = [];

		offsetBlockX.value = 0;
		offsetBlockY.value = 0;
		isDragged.value = false;
		Event.unbind(document, 'mousemove', onMouseMove);
		Event.unbind(document, 'mouseup', onMouseUp);
	};

	return {
		isDragged,
		blockPositionStyle,
	};
}
