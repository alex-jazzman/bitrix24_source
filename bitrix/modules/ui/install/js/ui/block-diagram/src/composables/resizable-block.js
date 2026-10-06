import { Event } from 'main.core';
import { toValue, ref, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useSnapModifier } from './snap-modifier';
import { getBoundsByStartEdge, getSizeByEndEdge } from '../utils';
import { CURSOR_TYPES } from '../constants';

type ResizeHandler = (event: MouseEvent) => void;

// eslint-disable-next-line max-lines-per-function
export function useResizableBlock(options): {...}
{
	const {
		cursorType,
		resizingBlock,
		transformMouseEventToPoint,
		snapValue,
		updateBlock,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
	} = useBlockDiagram();
	const snapModifier = useSnapModifier();
	const {
		block,
		minWidth,
		minHeight,
		leftSideRef,
		topSideRef,
		rightSideRef,
		bottomSideRef,
		leftTopCornerRef,
		rightTopCornerRef,
		rightBottomCornerRef,
		leftBottomCornerRef,
	} = options;

	const isResize = ref(false);
	let prevBlockX = 0;
	let prevBlockY = 0;
	let prevBlockWidth = 0;
	let prevBlockHeight = 0;
	let activeResizeHandlers: ResizeHandler[] = [];
	let lastResizeEvent: MouseEvent | null = null;

	const sizeBlockStyle = computed(() => {
		if (toValue(isResize))
		{
			const { position, dimensions } = toValue(resizingBlock);

			// Staged position has to win over blockPositionStyle: the model block keeps its
			// own position until mouseup, so left/top resize would not move the block.
			return {
				top: `${position.y}px`,
				left: `${position.x}px`,
				width: `${dimensions.width}px`,
				height: `${dimensions.height}px`,
				cursor: toValue(cursorType),
			};
		}

		return {
			width: `${toValue(block).dimensions.width}px`,
			height: `${toValue(block).dimensions.height}px`,
			cursor: toValue(cursorType),
		};
	});

	// While resizing the model block keeps its old size, so slot content has to read the
	// staged geometry to stay in step with the frame it lives in.
	const blockDimensions = computed(() => {
		const staged = toValue(resizingBlock);

		return toValue(isResize) && staged !== null
			? staged.dimensions
			: toValue(block).dimensions;
	});

	function isGeometryStaged(): boolean
	{
		const staged = toValue(resizingBlock);

		if (staged === null)
		{
			return false;
		}

		const { position, dimensions } = toValue(block);

		return staged.position.x !== position.x
			|| staged.position.y !== position.y
			|| staged.dimensions.width !== dimensions.width
			|| staged.dimensions.height !== dimensions.height;
	}

	function updateResizableBlock(): void
	{
		updateBlock({
			...toValue(block),
			position: {
				x: toValue(resizingBlock).position.x,
				y: toValue(resizingBlock).position.y,
			},
			dimensions: {
				width: toValue(resizingBlock).dimensions.width,
				height: toValue(resizingBlock).dimensions.height,
			},
		});
	}

	function onMounted(): void
	{
		Event.bind(toValue(rightSideRef), 'mousedown', onMouseDownRightSide);
		Event.bind(toValue(bottomSideRef), 'mousedown', onMouseDownBottomSide);
		Event.bind(toValue(leftSideRef), 'mousedown', onMouseDownLeftSide);
		Event.bind(toValue(topSideRef), 'mousedown', onMouseDownTopSide);

		Event.bind(toValue(rightTopCornerRef), 'mousedown', onMouseDownRightTopCorner);
		Event.bind(toValue(rightBottomCornerRef), 'mousedown', onMouseDownRightBottomCorner);
		Event.bind(toValue(leftTopCornerRef), 'mousedown', onMouseDownLeftTopCorner);
		Event.bind(toValue(leftBottomCornerRef), 'mousedown', onMouseDownLeftBottomCorner);
	}

	function onUnmounted(): void
	{
		Event.unbind(toValue(rightSideRef), 'mousedown', onMouseDownRightSide);
		Event.unbind(toValue(bottomSideRef), 'mousedown', onMouseDownBottomSide);
		Event.unbind(toValue(leftSideRef), 'mousedown', onMouseDownLeftSide);
		Event.unbind(toValue(topSideRef), 'mousedown', onMouseDownTopSide);

		Event.unbind(toValue(rightTopCornerRef), 'mousedown', onMouseDownRightTopCorner);
		Event.unbind(toValue(rightBottomCornerRef), 'mousedown', onMouseDownRightBottomCorner);
		Event.unbind(toValue(leftTopCornerRef), 'mousedown', onMouseDownLeftTopCorner);
		Event.unbind(toValue(leftBottomCornerRef), 'mousedown', onMouseDownLeftBottomCorner);

		// Autoscroll and the staged geometry belong to the whole diagram, so only the instance
		// that owns the gesture may wind it down: under render optimization neighbour blocks
		// are culled and unmounted exactly while the camera pans for this gesture.
		if (!toValue(isResize))
		{
			return;
		}

		// The block is gone, so the staged geometry is dropped without reaching the model.
		teardownGesture();
	}

	function teardownGesture(): void
	{
		stopAutoScroll();
		snapModifier.stopTracking();
		Event.unbind(document, 'mousemove', onMouseMove);
		Event.unbind(document, 'mouseup', endResize);
		cursorType.value = 'default';
		isResize.value = false;
		resizingBlock.value = null;
		activeResizeHandlers = [];
		lastResizeEvent = null;
	}

	function startResize(event: MouseEvent, curType: string, resizeHandlers: ResizeHandler[]): void
	{
		event.stopPropagation();
		cursorType.value = curType;
		// Geometry is staged in its own objects. Sharing position/dimensions with the model
		// block turns every resize step into a deep mutation of props.blocks, which makes
		// useWatchProps rebuild the intersections index; under render optimization that
		// unmounts the block mid-gesture and onUnmounted then tears the gesture down.
		resizingBlock.value = {
			...toValue(block),
			position: { ...toValue(block).position },
			dimensions: { ...toValue(block).dimensions },
		};
		prevBlockX = toValue(block).position.x;
		prevBlockY = toValue(block).position.y;
		prevBlockWidth = toValue(block).dimensions.width;
		prevBlockHeight = toValue(block).dimensions.height;
		isResize.value = true;
		activeResizeHandlers = resizeHandlers;

		snapModifier.sync(event);
		snapModifier.startTracking();
		startAutoScroll(event, applyResize);

		Event.bind(document, 'mousemove', onMouseMove);
		Event.bind(document, 'mouseup', endResize);
	}

	function endResize(event: MouseEvent): void
	{
		event.stopPropagation();

		// A click on a handle without a move stages nothing: emitting the command anyway would
		// mark the document dirty and wake autosave for an unchanged block.
		if (isGeometryStaged())
		{
			// The staged geometry is dropped as soon as the command is out, so the consumer has
			// to apply update:blocks synchronously: until the model catches up the block is drawn
			// with its pre-gesture position and size.
			updateResizableBlock();
		}

		teardownGesture();
	}

	function applyResize(): void
	{
		if (!toValue(isResize) || !lastResizeEvent)
		{
			return;
		}

		for (const resize of activeResizeHandlers)
		{
			resize(lastResizeEvent);
		}
	}

	function onMouseMove(event: MouseEvent): void
	{
		event.stopPropagation();

		if (!toValue(isResize))
		{
			return;
		}

		lastResizeEvent = event;
		snapModifier.sync(event);

		// Autoscroll moves the camera, so the same cursor point maps to a new world point. The
		// gesture reports the pointer on every move and the autoscroll itself holds the loop back
		// until this first report - the wait no longer belongs here.
		updateMousePosition(event);

		applyResize();
	}

	// Edge under the cursor in canvas coordinates. It is rounded before snapping, so an
	// unsnapped edge still leaves the model with whole-pixel geometry at any zoom.
	function getEdgeX(event: MouseEvent): number
	{
		return snapValue(Math.round(transformMouseEventToPoint(event).x), snapModifier.isPressed());
	}

	function getEdgeY(event: MouseEvent): number
	{
		return snapValue(Math.round(transformMouseEventToPoint(event).y), snapModifier.isPressed());
	}

	function resizeTopSide(event: MouseEvent): void
	{
		const edgeY = getEdgeY(event);
		const { position, size } = getBoundsByStartEdge(
			edgeY,
			prevBlockY + prevBlockHeight,
			toValue(minHeight),
		);

		resizingBlock.value.position.y = position;
		resizingBlock.value.dimensions.height = size;
	}

	function resizeRightSide(event: MouseEvent): void
	{
		const edgeX = getEdgeX(event);

		resizingBlock.value.dimensions.width = getSizeByEndEdge(edgeX, prevBlockX, toValue(minWidth));
	}

	function resizeBottomSide(event: MouseEvent): void
	{
		const edgeY = getEdgeY(event);

		resizingBlock.value.dimensions.height = getSizeByEndEdge(edgeY, prevBlockY, toValue(minHeight));
	}

	function resizeLeftSide(event: MouseEvent): void
	{
		const edgeX = getEdgeX(event);
		const { position, size } = getBoundsByStartEdge(
			edgeX,
			prevBlockX + prevBlockWidth,
			toValue(minWidth),
		);

		resizingBlock.value.position.x = position;
		resizingBlock.value.dimensions.width = size;
	}

	function onMouseDownRightSide(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.EW_RESIZE, [resizeRightSide]);
	}

	function onMouseDownBottomSide(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NS_RESIZE, [resizeBottomSide]);
	}

	function onMouseDownLeftSide(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.EW_RESIZE, [resizeLeftSide]);
	}

	function onMouseDownTopSide(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NS_RESIZE, [resizeTopSide]);
	}

	function onMouseDownRightBottomCorner(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NWSE_RESIZE, [resizeRightSide, resizeBottomSide]);
	}

	function onMouseDownRightTopCorner(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NESW_RESIZE, [resizeTopSide, resizeRightSide]);
	}

	function onMouseDownLeftBottomCorner(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NESW_RESIZE, [resizeLeftSide, resizeBottomSide]);
	}

	function onMouseDownLeftTopCorner(event: MouseEvent): void
	{
		startResize(event, CURSOR_TYPES.NWSE_RESIZE, [resizeLeftSide, resizeTopSide]);
	}

	return {
		isResize,
		sizeBlockStyle,
		blockDimensions,
		onMounted,
		onUnmounted,
	};
}
