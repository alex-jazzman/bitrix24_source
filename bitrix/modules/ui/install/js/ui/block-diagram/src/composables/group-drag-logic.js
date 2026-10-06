import { Dom, Event, Type } from 'main.core';
import { nextTick, onBeforeUnmount, toValue, watch } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { isSnapModifier, useSnapModifier } from './snap-modifier';
import { DRAG_START_THRESHOLD } from '../constants';
import { type DiagramBlock, type DiagramBlockId } from '../types';

type UseGroupDragLogic = {
	onGroupMouseDown: MouseEvent;
};

type MovingItem = {
	id: string,
	startX: number,
	startY: number,
};

type CommittedPosition = {
	id: string,
	x: number,
	y: number,
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
		blockElMap,
		blocksRectMap,
		updateBlockRectById,
		setPortOffsetByBlockId,
		highlitedBlockIds,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
		snapPoint,
		setGestureBlocks,
		resetGestureBlocks,
		setGroupDragOffset,
		resetGroupDragOffset,
		isDisabledBlockDiagram,
	} = useBlockDiagram();
	const snapModifier = useSnapModifier();

	let currentZoom = 1;
	let movingItems: MovingItem[] = [];
	let anchor = { x: 0, y: 0 };
	// Where the button went down, in the coordinates of the pointer. Unlike the anchor it is never
	// compensated for autoscroll: the drag threshold is about the hand, not about the camera.
	let downClient = { x: 0, y: 0 };
	let client = { x: 0, y: 0 };
	let lastTotalDelta = { x: 0, y: 0 };
	let gestureToken = 0;
	let isGestureActive = false;
	let isDragStarted = false;
	// Whether the last applied frame was snapped: the release must commit exactly the position that
	// frame has drawn, even if the modifier changed between it and the mouseup.
	let isLastFrameSnapped = false;

	const drawMarkup = (blockId: string, x: number, y: number): void => {
		const blockElement = toValue(blockElMap)?.get(blockId);

		if (blockElement)
		{
			Dom.style(blockElement, 'left', `${x}px`);
			Dom.style(blockElement, 'top', `${y}px`);
		}
	};

	// One node moved by hand, the way a dragged node moves its group members: the markup by style,
	// the cached rect and the port coordinates by the step of this frame. The model is left alone
	// until mouseup - a frame-by-frame write goes outside the command path, so the block watcher
	// clears the spatial index on every frame and the connections leave the canvas for the whole
	// gesture.
	const moveItem = (blockId: string, x: number, y: number, stepX: number, stepY: number): void => {
		drawMarkup(blockId, x, y);

		// Only an existing entry is moved: a merge over a missing one would recreate geometry that
		// a purge removed on purpose, and without a measured size at that.
		if (Type.isObjectLike(toValue(blocksRectMap)?.[blockId]))
		{
			updateBlockRectById(blockId, { x, y });
		}

		if (setPortOffsetByBlockId && (stepX !== 0 || stepY !== 0))
		{
			setPortOffsetByBlockId(blockId, { x: -stepX, y: -stepY });
		}
	};

	// The same threshold the node gesture is held to (moveable-block.js): below it the press is a
	// click on the selection rather than a drag.
	const isBeyondDragThreshold = (clientX: number, clientY: number): boolean => {
		return Math.abs(clientX - downClient.x) >= DRAG_START_THRESHOLD
			|| Math.abs(clientY - downClient.y) >= DRAG_START_THRESHOLD;
	};

	const updatePositions = (clientX: number, clientY: number, isSnapRequested: boolean): void => {
		// the whole group moves by one snapped delta, so distances inside it stay untouched;
		// the delta is whole-pixel even unsnapped, because the model keeps integer coordinates
		const { x: totalDeltaX, y: totalDeltaY } = snapPoint({
			x: Math.round((clientX - anchor.x) / currentZoom),
			y: Math.round((clientY - anchor.y) / currentZoom),
		}, isSnapRequested);

		// Nothing but a finite delta is ever applied: a NaN would spread over the rect cache, the
		// port coordinates and the model, and the coordinates it came from are past recovering by
		// the time the gesture is committed.
		if (!Number.isFinite(totalDeltaX) || !Number.isFinite(totalDeltaY))
		{
			return;
		}

		const stepX = totalDeltaX - lastTotalDelta.x;
		const stepY = totalDeltaY - lastTotalDelta.y;

		isLastFrameSnapped = isSnapRequested;

		if (stepX === 0 && stepY === 0)
		{
			return;
		}

		for (const item of movingItems)
		{
			moveItem(item.id, item.startX + totalDeltaX, item.startY + totalDeltaY, stepX, stepY);
		}

		lastTotalDelta = { x: totalDeltaX, y: totalDeltaY };
		setGroupDragOffset({ x: totalDeltaX, y: totalDeltaY });
	};

	const releaseGesture = (): void => {
		stopAutoScroll();
		snapModifier.stopTracking();
		resetGestureBlocks();
		Event.unbind(window, 'mousemove', onGroupMouseMove);
		Event.unbind(window, 'mouseup', onGroupMouseUp);
		Event.unbind(document, 'keydown', onGroupKeyDown);
		Event.unbind(document, 'pointercancel', onGroupGestureAbort);
		Event.unbind(window, 'blur', onGroupGestureAbort);

		isGestureActive = false;
		isDragStarted = false;
		movingItems = [];
		lastTotalDelta = { x: 0, y: 0 };
		resetGroupDragOffset();
	};

	// A node whose model position is unusable stays out of the gesture: a non-finite coordinate
	// would poison the rect cache on the very first frame, write NaN into every port of the node on
	// the commit and reach the model from there.
	const createMovingItem = (block: DiagramBlock): MovingItem | null => {
		const position = toValue(block).position;

		if (!Type.isObjectLike(position))
		{
			return null;
		}

		const startX = Number(position.x);
		const startY = Number(position.y);

		if (!Number.isFinite(startX) || !Number.isFinite(startY))
		{
			return null;
		}

		return { id: toValue(block).id, startX, startY };
	};

	const onGroupMouseDown = (event: MouseEvent): void => {
		// The frame is shown by the selection alone, so it stays on screen over a readonly template
		// and over an animation: without this the gesture would move the nodes there and write the
		// move into the model. A press over a gesture still open is refused as well: restarting the
		// gesture would lose the nodes the open one carries, leaving them shifted with nothing to
		// bring them back.
		if (event.button !== 0 || toValue(isDisabledBlockDiagram) || isGestureActive)
		{
			return;
		}
		event.stopPropagation();
		closeContextMenu();

		const selectedIds = new Set(toValue(highlitedBlockIds));
		const items = toValue(uiBlocksRef)
			.filter((block) => selectedIds.has(block.id))
			.map((block) => createMovingItem(block))
			.filter((item) => item !== null);

		// Nothing is left to move once the unusable positions are filtered out. A gesture started over
		// such a selection would subscribe to the pointer, run autoscroll and carry the frame away
		// from the nodes it belongs to.
		if (items.length === 0)
		{
			return;
		}

		// The zoom divides the pointer delta, so a zero or non-finite one would turn every position
		// of the gesture into infinity or NaN and carry it into the rect cache, into the ports and
		// into the model on the commit.
		const gestureZoom = toValue(zoom);

		if (!Number.isFinite(gestureZoom) || gestureZoom <= 0)
		{
			return;
		}

		currentZoom = gestureZoom;
		++gestureToken;
		anchor = { x: event.clientX, y: event.clientY };
		downClient = { x: event.clientX, y: event.clientY };
		client = { x: event.clientX, y: event.clientY };
		lastTotalDelta = { x: 0, y: 0 };
		isGestureActive = true;
		isDragStarted = false;
		resetGroupDragOffset();

		snapModifier.sync(event);
		snapModifier.startTracking();
		isLastFrameSnapped = isSnapModifier(event);

		movingItems = items;

		// The model keeps the pre-gesture positions until mouseup, so culling would judge these
		// nodes by boxes the gesture has already left behind: autoscroll pans the camera past them
		// and unmounts a node that is in fact on screen.
		setGestureBlocks(movingItems.map((item) => item.id));

		startAutoScroll(event, (dx: number, dy: number) => {
			anchor.x -= dx;
			anchor.y -= dy;
			updatePositions(client.x, client.y, snapModifier.isPressed());
		});

		Event.bind(window, 'mousemove', onGroupMouseMove);
		Event.bind(window, 'mouseup', onGroupMouseUp);
		Event.bind(document, 'keydown', onGroupKeyDown);
		Event.bind(document, 'pointercancel', onGroupGestureAbort);
		Event.bind(window, 'blur', onGroupGestureAbort);
	};

	const onGroupMouseMove = (event: MouseEvent): void => {
		client.x = event.clientX;
		client.y = event.clientY;
		snapModifier.sync(event);

		if (!isDragStarted)
		{
			isDragStarted = isBeyondDragThreshold(event.clientX, event.clientY);
		}

		// The press only arms the autoscroll, and the pointer is reported to it past the threshold, as
		// the node gesture reports it: below the threshold the press is still a click on the selection
		// and the camera must stand.
		if (isDragStarted)
		{
			updateMousePosition(event);
		}

		updatePositions(client.x, client.y, snapModifier.isPressed());
	};

	// The model is the truth about where a node stands, so after the gesture the markup and the
	// measured geometry are brought to the model position instead of being left on the result of the
	// gesture: a consumer may refuse the move or write a position of its own. The rect of a node is
	// written absolutely and would come back into agreement on the next gesture anyway, but the port
	// offsets are written as steps - nothing but this brings them back into step.
	const alignGeometryToModel = (
		{ id, x, y }: CommittedPosition,
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): void => {
		const block = blockById.get(id) ?? null;

		if (block === null)
		{
			return;
		}

		const position = toValue(block).position;

		if (!Type.isObjectLike(position))
		{
			return;
		}

		// A non-finite coordinate would turn every port of the node into NaN and take all its
		// connections off the canvas.
		if (!Number.isFinite(position.x) || !Number.isFinite(position.y))
		{
			return;
		}

		moveItem(id, position.x, position.y, position.x - x, position.y - y);
	};

	// One pass over the model instead of a linear lookup per node: the commit and the
	// reconciliation each walk the whole selection, and the model of a large diagram is long.
	const buildBlockByIdMap = (): Map<DiagramBlockId, DiagramBlock> => {
		return new Map(
			toValue(uiBlocksRef).map((block) => [toValue(block).id, block]),
		);
	};

	const onGroupMouseUp = (event: MouseEvent): void => {
		// The watcher below is flushed before the render, so a diagram disabled in this very tick is
		// still to reach it: without this check the release would carry the gesture into the model
		// over a readonly template or an animation.
		if (toValue(isDisabledBlockDiagram))
		{
			cancelGesture();

			return;
		}

		// A mouseup can arrive with no coordinates at all - a plain `Event('mouseup')` from a
		// consumer, or the core `BX.fireEvent`. Applying it as a frame would make the release delta
		// NaN, and a NaN passes the "moved nothing" check below straight into the model.
		if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))
		{
			cancelGesture();

			return;
		}

		// A mouseup can carry a position no mousemove has seen, so the release point is applied as
		// the last frame of the gesture - but only once it is past the threshold that separates a
		// drag from a click, the same one the node gesture uses. Otherwise the shake of a hand over
		// the frame writes a command per selected node. A gesture that has already moved the nodes
		// is past that question: its release point is a frame like any other. The modifier is taken
		// from the last frame rather than from this event: Shift released an instant before the
		// button would part the committed position from the drawn one.
		if (
			lastTotalDelta.x !== 0
			|| lastTotalDelta.y !== 0
			|| isBeyondDragThreshold(event.clientX, event.clientY)
		)
		{
			updatePositions(event.clientX, event.clientY, isLastFrameSnapped);
		}

		// A gesture that left the nodes where they started is a click on the selection, not a drag:
		// committing it would write a command per selected node, with the pre-gesture coordinates,
		// and ask the consumer to save a diagram nothing changed in. A pointer that wandered off and
		// came back to the press point ends there just as a press that never moved does.
		if (lastTotalDelta.x === 0 && lastTotalDelta.y === 0)
		{
			releaseGesture();

			return;
		}

		// The markup and the geometry are brought to the whole-pixel position first, so all three
		// describe the same place: the model keeps integer coordinates.
		const committedPositions = movingItems.map((item) => {
			const currentX = item.startX + lastTotalDelta.x;
			const currentY = item.startY + lastTotalDelta.y;
			const x = Math.round(currentX);
			const y = Math.round(currentY);

			moveItem(item.id, x, y, x - currentX, y - currentY);

			return { id: item.id, x, y };
		});

		const token = gestureToken;
		const blockById = buildBlockByIdMap();

		// The commands go out first and the gesture is released after them, but the release is not
		// theirs to skip: a consumer hook that throws would leave the gesture live - the window
		// listeners bound, the nodes held and the frame offset standing, so the next pointer move
		// would drag them with no button held. The exception itself is not the extension's to handle
		// and goes on to the consumer, taking the reconciliation below with it: a torn commit leaves
		// the model in a state there is nothing to align the geometry to.
		try
		{
			for (const { id, x, y } of committedPositions)
			{
				const block = blockById.get(id) ?? null;

				if (block === null)
				{
					continue;
				}

				updateBlock({
					...toValue(block),
					position: {
						...toValue(block).position,
						x,
						y,
					},
				});
			}
		}
		finally
		{
			// The nodes are held in the visible set until the last command has gone out: released
			// earlier, they would be judged by the pre-gesture boxes the spatial index still holds
			// for as long as the write takes.
			releaseGesture();
		}

		// Rendering a node rewrites its markup from the block input, and under render optimization
		// that input still carries the pre-gesture position on the render of this very commit. The
		// position is put back once that render has flushed, so the nodes do not blink back to where
		// the gesture started while the visible set catches up.
		// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
		// cycle - the model is read once here, and a command applied later misses the alignment.
		void nextTick(() => {
			if (token !== gestureToken)
			{
				return;
			}

			// The lookup is built again rather than reused: the consumer applies the commands by
			// replacing the model, so the map of the commit holds the pre-commit blocks, and the
			// whole point here is to read where the consumer has put the nodes.
			const committedBlockById = buildBlockByIdMap();

			for (const committedPosition of committedPositions)
			{
				alignGeometryToModel(committedPosition, committedBlockById);
			}
		});
	};

	const cancelGesture = (): void => {
		if (!isGestureActive)
		{
			return;
		}

		for (const item of movingItems)
		{
			moveItem(item.id, item.startX, item.startY, -lastTotalDelta.x, -lastTotalDelta.y);
		}

		releaseGesture();
	};

	const onGroupKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape')
		{
			cancelGesture();
		}
	};

	// The pointer can be lost without a mouseup: released outside the browser window, or taken away
	// by the system. Left alone the gesture would stay live - the markup shifted, the model on the
	// pre-gesture positions, and the next pointer move dragging the nodes with no button held.
	const onGroupGestureAbort = (): void => {
		cancelGesture();
	};

	watch(isDisabledBlockDiagram, (isDisabled: boolean) => {
		if (isDisabled)
		{
			cancelGesture();
		}
	});

	// A gesture torn down without a mouseup would leave the markup and the geometry where the
	// pointer left them while the model still holds the pre-gesture positions. The token is bumped
	// on top of that: the reconciliation of a release is a microtask, and a teardown between the two
	// would otherwise let it write geometry and markup on a diagram that is gone. `cancelGesture`
	// cannot do it - by then the gesture is already released and it returns at once.
	onBeforeUnmount(() => {
		++gestureToken;
		cancelGesture();
	});

	return { onGroupMouseDown };
}
