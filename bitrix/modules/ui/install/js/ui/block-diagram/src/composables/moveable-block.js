import { Dom, Event, Type } from 'main.core';
import {
	ref,
	toValue,
	onMounted,
	onBeforeUnmount,
	computed,
	nextTick,
	watch,
	watchEffect,
} from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useSnapModifier, isSnapModifier } from './snap-modifier';
import { DRAG_START_THRESHOLD } from '../constants';
import type { DiagramBlock, Point } from '../types';

export type UseBlockReturnType = {
	isDragged: boolean,
	blockPositionStyle: {
		top: string,
		left: string,
		width: string,
	},
};

type BlockPosition = {
	x: number,
	y: number,
};

type GestureBlock = {
	id: string,
	isPrimary: boolean,
	originalPosition: BlockPosition,
	currentPosition: BlockPosition,
	width: number,
	height: number,
};

type GestureHandlers = {
	mouseMove: (event: MouseEvent) => void,
	mouseUp: (event: MouseEvent) => void,
	pointerCancel: () => void,
	keyDown: (event: KeyboardEvent) => void,
	blur: () => void,
};

type MoveGesture = {
	token: number,
	primaryBlock: GestureBlock,
	groupBlocks: GestureBlock[],
	offsetX: number,
	offsetY: number,
	downClientX: number,
	downClientY: number,
	lastClientX: number,
	lastClientY: number,
	zoom: number,
	// Whether the pointer has travelled far enough from the press point for the gesture to count as
	// a drag. Until it has, the block does not follow the pointer at all.
	isDragStarted: boolean,
	// Whether the last applied frame was snapped: mouseup must commit exactly the position that
	// frame has drawn, even if the modifier changed between it and the release.
	isLastFrameSnapped: boolean,
	hasMoved: boolean,
	isClosing: boolean,
	handlers: GestureHandlers | null,
};

function copyPosition(position: BlockPosition): BlockPosition
{
	return {
		x: position.x,
		y: position.y,
	};
}

// eslint-disable-next-line max-lines-per-function
export function useMoveableBlock(blockRef: HTMLElement, block: DiagramBlock): UseBlockReturnType
{
	const isDragged = ref(false);
	const {
		isDisabledBlockDiagram,
		zoom,
		updateBlock,
		hooks,
		setMovingBlock,
		resetMovingBlock,
		setGestureBlocks,
		resetGestureBlocks,
		setPortOffsetByBlockId,
		updateBlockRectById,
		getBlockById,
		blocks: allBlocksRef,
		blocksRectMap,
		blockElMap,
		highlitedBlockIds,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
		connectionPreview,
		clearConnectionPreview,
		snapPoint,
	} = useBlockDiagram();
	const snapModifier = useSnapModifier();

	const x = ref(toValue(block).position.x);
	const y = ref(toValue(block).position.y);

	let activeGesture: MoveGesture | null = null;
	let nextGestureToken = 0;
	let reconciliationToken = 0;

	watchEffect(() => {
		x.value = toValue(block).position.x;
		y.value = toValue(block).position.y;
	});

	watch(isDisabledBlockDiagram, (isDisabled) => {
		if (isDisabled && activeGesture !== null)
		{
			cancelGesture(activeGesture.token);
		}
	});

	const blockPositionStyle = computed(() => {
		return {
			top: `${y.value}px`,
			left: `${x.value}px`,
		};
	});

	function createGestureBlock(targetBlock: DiagramBlock, isPrimary: boolean): GestureBlock
	{
		const blockValue = toValue(targetBlock);
		const storedRect = toValue(blocksRectMap)?.[blockValue.id] ?? {};
		const dimensions = toValue(blockValue.dimensions) ?? {};
		const position = copyPosition(toValue(blockValue.position));

		return {
			id: blockValue.id,
			isPrimary,
			originalPosition: position,
			currentPosition: copyPosition(position),
			width: Number.isFinite(storedRect.width)
				? storedRect.width
				: (Number.isFinite(dimensions.width) ? dimensions.width : 0),
			height: Number.isFinite(storedRect.height)
				? storedRect.height
				: (Number.isFinite(dimensions.height) ? dimensions.height : 0),
		};
	}

	// Geometry entries are updated, never created: the geometry of a node may have been purged on
	// purpose, and a merge over a missing entry would resurrect it. The size of the gesture snapshot
	// only fills an entry that has none - it falls back to zero when nothing was measured at the
	// press, and it goes stale as soon as the node is measured again during the gesture.
	function updateGestureBlockRect(gestureBlock: GestureBlock, position: BlockPosition): void
	{
		const storedRect = toValue(blocksRectMap)?.[gestureBlock.id];

		if (!Type.isObjectLike(storedRect))
		{
			return;
		}

		const rect = {
			x: position.x,
			y: position.y,
		};

		if (!Number.isFinite(storedRect.width))
		{
			rect.width = gestureBlock.width;
		}

		if (!Number.isFinite(storedRect.height))
		{
			rect.height = gestureBlock.height;
		}

		updateBlockRectById(gestureBlock.id, rect);
	}

	function updateLocalPosition(gestureBlock: GestureBlock, position: BlockPosition): void
	{
		const deltaX = position.x - gestureBlock.currentPosition.x;
		const deltaY = position.y - gestureBlock.currentPosition.y;

		gestureBlock.currentPosition = copyPosition(position);

		if (gestureBlock.isPrimary)
		{
			x.value = position.x;
			y.value = position.y;
		}
		else
		{
			const blockElement = toValue(blockElMap)?.get(gestureBlock.id);

			if (blockElement)
			{
				Dom.style(blockElement, 'left', `${position.x}px`);
				Dom.style(blockElement, 'top', `${position.y}px`);
			}
		}

		updateGestureBlockRect(gestureBlock, position);

		if (deltaX !== 0 || deltaY !== 0)
		{
			setPortOffsetByBlockId(gestureBlock.id, {
				x: -deltaX,
				y: -deltaY,
			});
		}
	}

	function isBeyondDragThreshold(gesture: MoveGesture, clientX: number, clientY: number): boolean
	{
		return Math.abs(clientX - gesture.downClientX) >= DRAG_START_THRESHOLD
			|| Math.abs(clientY - gesture.downClientY) >= DRAG_START_THRESHOLD;
	}

	function getPointerPosition(
		gesture: MoveGesture,
		clientX: number,
		clientY: number,
		isSnapRequested: boolean,
	): Point
	{
		return snapPoint({
			x: Math.round((clientX - gesture.offsetX) / gesture.zoom),
			y: Math.round((clientY - gesture.offsetY) / gesture.zoom),
		}, isSnapRequested);
	}

	function applyPointerPosition(
		gesture: MoveGesture,
		clientX: number,
		clientY: number,
		notifyMove: boolean,
		notifyUnchanged: boolean = false,
		isSnapRequested: boolean = false,
	): boolean
	{
		const newPosition = getPointerPosition(gesture, clientX, clientY, isSnapRequested);
		const deltaX = newPosition.x - gesture.primaryBlock.currentPosition.x;
		const deltaY = newPosition.y - gesture.primaryBlock.currentPosition.y;
		const changed = deltaX !== 0 || deltaY !== 0;

		gesture.lastClientX = clientX;
		gesture.lastClientY = clientY;
		gesture.isLastFrameSnapped = isSnapRequested;

		if (changed)
		{
			updateLocalPosition(gesture.primaryBlock, newPosition);

			for (const groupBlock of gesture.groupBlocks)
			{
				updateLocalPosition(groupBlock, {
					x: groupBlock.currentPosition.x + deltaX,
					y: groupBlock.currentPosition.y + deltaY,
				});
			}

			gesture.hasMoved = true;
		}

		if (notifyMove && (changed || notifyUnchanged))
		{
			hooks.moveDragBlock.trigger(block);
		}

		return changed;
	}

	function getActiveGesture(token: number): MoveGesture | null
	{
		if (activeGesture?.token !== token || activeGesture.isClosing)
		{
			return null;
		}

		return activeGesture;
	}

	function bindGestureHandlers(gesture: MoveGesture): void
	{
		gesture.handlers = {
			mouseMove: (event) => handleMouseMove(gesture.token, event),
			mouseUp: (event) => finishGesture(gesture.token, event),
			pointerCancel: () => cancelGesture(gesture.token),
			keyDown: (event) => {
				if (event.key === 'Escape')
				{
					cancelGesture(gesture.token);
				}
			},
			blur: () => cancelGesture(gesture.token),
		};

		Event.bind(document, 'mousemove', gesture.handlers.mouseMove);
		Event.bind(document, 'mouseup', gesture.handlers.mouseUp);
		Event.bind(document, 'pointercancel', gesture.handlers.pointerCancel);
		Event.bind(document, 'keydown', gesture.handlers.keyDown);
		Event.bind(window, 'blur', gesture.handlers.blur);
	}

	function unbindGestureHandlers(gesture: MoveGesture): void
	{
		if (gesture.handlers === null)
		{
			return;
		}

		Event.unbind(document, 'mousemove', gesture.handlers.mouseMove);
		Event.unbind(document, 'mouseup', gesture.handlers.mouseUp);
		Event.unbind(document, 'pointercancel', gesture.handlers.pointerCancel);
		Event.unbind(document, 'keydown', gesture.handlers.keyDown);
		Event.unbind(window, 'blur', gesture.handlers.blur);
		gesture.handlers = null;
	}

	function getCurrentPreviewActivationKey(): string | null
	{
		const activationKey = toValue(connectionPreview)?.activationKey;

		return Type.isStringFilled(activationKey) ? activationKey : null;
	}

	function clearGesturePreview(activationKey: string | null): void
	{
		if (activationKey !== null)
		{
			clearConnectionPreview(activationKey);
		}
	}

	function closeGesture(gesture: MoveGesture): void
	{
		stopAutoScroll();
		snapModifier.stopTracking();
		unbindGestureHandlers(gesture);
		resetMovingBlock();
		resetGestureBlocks();
		isDragged.value = false;
		activeGesture = null;
	}

	function cancelGesture(token: number): void
	{
		const gesture = getActiveGesture(token);

		if (gesture === null)
		{
			return;
		}

		gesture.isClosing = true;
		const previewActivationKey = getCurrentPreviewActivationKey();

		updateLocalPosition(gesture.primaryBlock, gesture.primaryBlock.originalPosition);
		for (const groupBlock of gesture.groupBlocks)
		{
			updateLocalPosition(groupBlock, groupBlock.originalPosition);
		}

		closeGesture(gesture);
		clearGesturePreview(previewActivationKey);
	}

	// The command carries the content of the live model and the position the gesture arrived at:
	// the content read from the component input would be the copy the visible-set selection took
	// on the previous frame, so a node edited during the gesture would be overwritten on commit.
	function createUpdatedBlock(gestureBlock: GestureBlock): DiagramBlock | null
	{
		const modelBlock = getBlockById(gestureBlock.id);

		if (modelBlock === null)
		{
			return null;
		}

		return {
			...toValue(modelBlock),
			position: {
				...toValue(modelBlock).position,
				...gestureBlock.currentPosition,
			},
		};
	}

	// The end of the gesture is part of the public contract of the extension, so it is reported even
	// when the node has left the model and no command was built: a consumer waits for this event to
	// close a gesture of its own. With no model block the input is all there is to name the node by.
	function commitPrimaryBlock(gestureBlock: GestureBlock): void
	{
		const updatedBlock = createUpdatedBlock(gestureBlock);

		if (updatedBlock)
		{
			updateBlock(updatedBlock);
		}

		hooks.endDragBlock.trigger(updatedBlock ?? toValue(block));
	}

	// The model is the truth about where a node stands, so after the gesture the measured
	// geometry is brought to the model position instead of arbitrating between the gesture
	// result and the component input: that input comes from the visible-set selection, which
	// lags the model by a frame under render optimization. A consumer that refused the move
	// left the previous position in the model, and the alignment returns the geometry to it.
	function alignGeometryToModel(gestureBlock: GestureBlock): void
	{
		const modelBlock = getBlockById(gestureBlock.id);

		if (modelBlock === null)
		{
			return;
		}

		const modelPosition = toValue(modelBlock).position;

		if (!Type.isObjectLike(modelPosition))
		{
			return;
		}

		// A non-finite coordinate would turn every port of the node into NaN and take all its
		// connections off the canvas.
		if (!Number.isFinite(modelPosition.x) || !Number.isFinite(modelPosition.y))
		{
			return;
		}

		updateLocalPosition(gestureBlock, modelPosition);
	}

	// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
	// cycle - the model is read once here, and a command applied later misses the alignment.
	function schedulePositionReconciliation(gesture: MoveGesture): void
	{
		const token = ++reconciliationToken;

		void nextTick(() => {
			if (token !== reconciliationToken || activeGesture !== null)
			{
				return;
			}

			for (const gestureBlock of [gesture.primaryBlock, ...gesture.groupBlocks])
			{
				alignGeometryToModel(gestureBlock);
			}
		});
	}

	function finishGesture(token: number, event: MouseEvent): void
	{
		const gesture = getActiveGesture(token);

		if (gesture === null)
		{
			return;
		}

		event.stopPropagation();

		if (toValue(isDisabledBlockDiagram))
		{
			cancelGesture(token);

			return;
		}

		// A mouseup can carry a position no mousemove has seen, so the threshold is judged against
		// the release point as well: a press that ends far from where it started is a drag even
		// without a single move frame. Below the threshold the press stays a selection - the block
		// never followed the pointer, and committing the release would move a block nobody dragged,
		// with snapping on onto a grid node it did not stand on.
		const hasDrawnFrame = gesture.isDragStarted;

		if (!hasDrawnFrame && isBeyondDragThreshold(gesture, event.clientX, event.clientY))
		{
			gesture.isDragStarted = true;
		}

		if (gesture.isDragStarted)
		{
			// The modifier is taken from the last applied frame rather than from this mouseup: Shift
			// released an instant before the button would part the committed position from the drawn
			// one. With no frame drawn there is nothing to keep in step, so the release decides.
			applyPointerPosition(
				gesture,
				event.clientX,
				event.clientY,
				true,
				false,
				hasDrawnFrame ? gesture.isLastFrameSnapped : isSnapModifier(event),
			);
		}

		gesture.isClosing = true;
		const previewActivationKey = getCurrentPreviewActivationKey();

		stopAutoScroll();
		unbindGestureHandlers(gesture);

		// The commands go out first and the gesture is released after them, but the release is not
		// theirs to skip: a consumer hook that throws would leave the moving node and the retention
		// standing for good, and the next press would find a gesture still active. The exception
		// itself is not the extension's to handle and goes on to the consumer.
		try
		{
			if (gesture.hasMoved)
			{
				for (const groupBlock of gesture.groupBlocks)
				{
					const updatedBlock = createUpdatedBlock(groupBlock);

					if (updatedBlock)
					{
						updateBlock(updatedBlock);
						hooks.endDragBlock.trigger(updatedBlock);
					}
				}

				commitPrimaryBlock(gesture.primaryBlock);
			}
		}
		finally
		{
			closeGesture(gesture);
			clearGesturePreview(previewActivationKey);
		}

		if (gesture.hasMoved)
		{
			schedulePositionReconciliation(gesture);
		}
	}

	function handleMouseMove(token: number, event: MouseEvent): void
	{
		const gesture = getActiveGesture(token);

		if (gesture === null)
		{
			return;
		}

		if (toValue(isDisabledBlockDiagram))
		{
			cancelGesture(token);

			return;
		}

		event.stopPropagation();

		// Below the threshold the press is still a selection, so the block must not follow the
		// pointer: snapping would pull a block standing between grid nodes onto the nearest one on
		// the shake of a hand, which is a move nobody asked for.
		if (!gesture.isDragStarted)
		{
			if (!isBeyondDragThreshold(gesture, event.clientX, event.clientY))
			{
				return;
			}

			gesture.isDragStarted = true;
		}

		snapModifier.sync(event);
		updateMousePosition(event);
		applyPointerPosition(
			gesture,
			event.clientX,
			event.clientY,
			true,
			true,
			snapModifier.isPressed(),
		);
	}

	function onMouseDown(event: MouseEvent): void
	{
		if (event.button !== 0 || toValue(isDisabledBlockDiagram) || activeGesture !== null)
		{
			return;
		}

		event.stopPropagation();
		++reconciliationToken;

		const blockValue = toValue(block);
		const blockId = blockValue.id;
		const selectedIds = toValue(highlitedBlockIds);
		const isSelected = selectedIds.includes(blockId);

		if (!isSelected)
		{
			highlitedBlockIds.value = [blockId];
		}

		const currentZoom = toValue(zoom);
		if (!Number.isFinite(currentZoom) || currentZoom <= 0)
		{
			return;
		}

		const groupIds = toValue(highlitedBlockIds);
		const groupBlocks = groupIds.length > 1
			? toValue(allBlocksRef)
				.filter((item) => groupIds.includes(toValue(item).id) && toValue(item).id !== blockId)
				.map((item) => createGestureBlock(item, false))
			: [];
		const primaryBlock = createGestureBlock(blockValue, true);
		const gesture: MoveGesture = {
			token: ++nextGestureToken,
			primaryBlock,
			groupBlocks,
			offsetX: Math.round(event.clientX - (primaryBlock.originalPosition.x * currentZoom)),
			offsetY: Math.round(event.clientY - (primaryBlock.originalPosition.y * currentZoom)),
			downClientX: event.clientX,
			downClientY: event.clientY,
			lastClientX: event.clientX,
			lastClientY: event.clientY,
			zoom: currentZoom,
			isDragStarted: false,
			isLastFrameSnapped: false,
			hasMoved: false,
			isClosing: false,
			handlers: null,
		};

		activeGesture = gesture;
		isDragged.value = true;
		setMovingBlock(blockId);
		// The group members are led by the same gesture and reach the model only on mouseup, so
		// culling must judge none of them by the pre-gesture box the index still holds.
		setGestureBlocks([blockId, ...groupBlocks.map((groupBlock) => groupBlock.id)]);
		snapModifier.sync(event);
		snapModifier.startTracking();
		hooks.startDragBlock.trigger(block);

		// The press only arms the autoscroll; the loop starts when the gesture first reports the
		// pointer, and it reports it past the drag threshold - so the camera cannot pan under a
		// press that is still a selection.
		startAutoScroll(event, (deltaX: number, deltaY: number) => {
			const currentGesture = getActiveGesture(gesture.token);

			if (currentGesture === null)
			{
				return;
			}

			currentGesture.offsetX -= deltaX;
			currentGesture.offsetY -= deltaY;

			applyPointerPosition(
				currentGesture,
				currentGesture.lastClientX,
				currentGesture.lastClientY,
				true,
				false,
				snapModifier.isPressed(),
			);
		});

		bindGestureHandlers(gesture);
	}

	onMounted(() => {
		Event.bind(toValue(blockRef), 'mousedown', onMouseDown);
	});

	onBeforeUnmount(() => {
		Event.unbind(toValue(blockRef), 'mousedown', onMouseDown);
		++reconciliationToken;

		if (activeGesture !== null)
		{
			cancelGesture(activeGesture.token);
		}

		snapModifier.stopTracking();
	});

	return {
		isDragged,
		blockPositionStyle,
	};
}
