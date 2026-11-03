import { Event, Type } from 'main.core';
import { toValue, ref, computed } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useBlockPlacement } from './block-placement';
import { useDisplacedBlocks } from './displaced-blocks';
import { useGestureRunner } from './gesture';
import { replaceSelection } from './highlighted-blocks';
import { getBoundsByStartEdge, getSizeByEndEdge } from '../utils';
import { type PlacementRect } from '../utils';
import { CURSOR_TYPES } from '../constants';
import { type DiagramBlockId, type Point } from '../types';

type ResizeHandler = (point: Point, isSnapRequested: boolean) => void;

// eslint-disable-next-line max-lines-per-function
export function useResizableBlock(options): {...}
{
	const {
		cursorType,
		resizingBlock,
		transformMouseEventToPoint,
		snapValue,
		updateBlock,
		getBlockById,
		blocksRectMap,
		updateBlockRectById,
		highlitedBlockIds,
	} = useBlockDiagram();
	const { resolvePlacementDelta } = useBlockPlacement();
	const { mark: markDisplacedBlocks } = useDisplacedBlocks();
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
	// Whether the edge the commit works with was put on the grid: the rule rounds its own corrections
	// the same way only when it is told the operation snaps.
	let isLastFrameSnapped = false;
	// The handle the press landed on: the gesture opens on its cursor and its edge handlers.
	let pressedCursorType = CURSOR_TYPES.EW_RESIZE;
	let pressedResizeHandlers: ResizeHandler[] = [];

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

	// While resizing the model block keeps its old size, so slot content reads the staged one.
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

	// The gesture itself is torn down by the core, which owns the unmount of this very instance.
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
	}

	// A handle belongs to one block, so the gesture leads that block alone whatever was selected
	// before the press.
	function resolveTargets(): Array<DiagramBlockId>
	{
		return [toValue(block).id];
	}

	// Edge under the cursor in canvas coordinates, rounded before snapping so that even an
	// unsnapped edge leaves the model with whole-pixel geometry at any zoom.
	function getEdge(value: number, isSnapRequested: boolean): number
	{
		return snapValue(Math.round(value), isSnapRequested);
	}

	function resizeTopSide(point: Point, isSnapRequested: boolean): void
	{
		const edgeY = getEdge(point.y, isSnapRequested);
		const { position, size } = getBoundsByStartEdge(
			edgeY,
			prevBlockY + prevBlockHeight,
			toValue(minHeight),
		);

		resizingBlock.value.position.y = position;
		resizingBlock.value.dimensions.height = size;
	}

	function resizeRightSide(point: Point, isSnapRequested: boolean): void
	{
		const edgeX = getEdge(point.x, isSnapRequested);

		resizingBlock.value.dimensions.width = getSizeByEndEdge(edgeX, prevBlockX, toValue(minWidth));
	}

	function resizeBottomSide(point: Point, isSnapRequested: boolean): void
	{
		const edgeY = getEdge(point.y, isSnapRequested);

		resizingBlock.value.dimensions.height = getSizeByEndEdge(edgeY, prevBlockY, toValue(minHeight));
	}

	function resizeLeftSide(point: Point, isSnapRequested: boolean): void
	{
		const edgeX = getEdge(point.x, isSnapRequested);
		const { position, size } = getBoundsByStartEdge(
			edgeX,
			prevBlockX + prevBlockWidth,
			toValue(minWidth),
		);

		resizingBlock.value.position.x = position;
		resizingBlock.value.dimensions.width = size;
	}

	// The pointer is taken through the live camera, which already holds the travel of the
	// autoscroll - hence `client` rather than the point the core has shifted itself.
	function applyFrame(point: Point, isSnapRequested: boolean, source: string, client: Point): boolean
	{
		const canvasPoint = transformMouseEventToPoint({ clientX: client.x, clientY: client.y });

		isLastFrameSnapped = isSnapRequested;

		for (const resize of activeResizeHandlers)
		{
			resize(canvasPoint, isSnapRequested);
		}

		return true;
	}

	// The pre-gesture geometry comes back because `onClose` throws the working copy away; the write
	// below guards an order of teardown that ever puts a render in between.
	function revert(): void
	{
		const staged = toValue(resizingBlock);

		if (staged === null)
		{
			return;
		}

		staged.position.x = prevBlockX;
		staged.position.y = prevBlockY;
		staged.dimensions.width = prevBlockWidth;
		staged.dimensions.height = prevBlockHeight;
	}

	// The areas the gesture has added to the block, in model coordinates - the staged geometry less the
	// one the press found. The rule judges the bounds it is given as they stand, so the whole staged
	// rect would answer for overlaps the resize did not make: a block already lying on its neighbour
	// could then not even be shrunk, because any size still leaving part of that overlap reads exactly
	// like a block stretched onto it. Asked about the added areas alone, the rule refuses an overlap
	// this gesture creates or deepens and says nothing about one it inherited.
	function grownPlacementRects(): PlacementRect[]
	{
		const { position, dimensions } = toValue(resizingBlock);
		const blockId = toValue(block).id;
		const left = position.x;
		const top = position.y;
		const right = left + dimensions.width;
		const bottom = top + dimensions.height;
		const prevRight = prevBlockX + prevBlockWidth;
		const prevBottom = prevBlockY + prevBlockHeight;
		const grown: PlacementRect[] = [];

		if (left < prevBlockX)
		{
			grown.push({ id: blockId, x: left, y: top, width: prevBlockX - left, height: bottom - top });
		}

		if (right > prevRight)
		{
			grown.push({ id: blockId, x: prevRight, y: top, width: right - prevRight, height: bottom - top });
		}

		if (top < prevBlockY)
		{
			grown.push({ id: blockId, x: left, y: top, width: right - left, height: prevBlockY - top });
		}

		if (bottom > prevBottom)
		{
			grown.push({ id: blockId, x: left, y: prevBottom, width: right - left, height: bottom - prevBottom });
		}

		return grown;
	}

	function commit(): boolean
	{
		// A click on a handle without a move stages nothing: the command would ask the consumer to
		// save an unchanged block.
		if (!isGeometryStaged())
		{
			return false;
		}

		const placementDelta = resolvePlacementDelta(
			grownPlacementRects(),
			{ followsGrid: isLastFrameSnapped },
		);

		// The rule answers with the shift that would make the new bounds an allowed neighbour, but a
		// resize has no right to move the block it is sizing: any answer other than "stay" - a shift or
		// no free room at all - means those bounds lie over a block they may not, and the whole gesture
		// is given up, so the model never comes to hold a forbidden overlap.
		if (placementDelta === null || placementDelta.x !== 0 || placementDelta.y !== 0)
		{
			revert();
			// A block that came back to its own size looks exactly like a gesture that never
			// happened, so the size it was brought back to is marked - the outline points at the
			// geometry the rule left standing, not at a gesture given up with nothing to show.
			// The same refusal reads as `--displaced` here and as `--placement-refused` in the node
			// drag on purpose: a drag leaves the pointer far from the block it gave up, which needs
			// the louder signal, while a resize ends on the very edge the user is holding.
			markDisplacedBlocks([toValue(block).id]);

			return false;
		}

		updateResizableBlock();

		return true;
	}

	// After the gesture the measured rect is brought to the model geometry: a consumer may refuse
	// the resize. The entry is updated, never created - geometry purged on purpose stays purged.
	function alignToModel(): void
	{
		const blockId = toValue(block).id;
		const modelBlock = getBlockById(blockId);

		if (modelBlock === null || !Type.isObjectLike(toValue(blocksRectMap)?.[blockId]))
		{
			return;
		}

		const { position, dimensions } = toValue(modelBlock);

		if (!Type.isObjectLike(position) || !Type.isObjectLike(dimensions))
		{
			return;
		}

		// A non-finite coordinate would turn every port of the node into NaN and take all its
		// connections off the canvas.
		const rect = { x: position.x, y: position.y, width: dimensions.width, height: dimensions.height };

		if (Object.values(rect).some((value) => !Number.isFinite(value)))
		{
			return;
		}

		updateBlockRectById(blockId, rect);
	}

	function onOpen(): void
	{
		cursorType.value = pressedCursorType;
		// Geometry is staged in its own objects: shared with the model block, every resize step
		// would be a deep mutation of props.blocks, which rebuilds the intersections index and
		// unmounts the block mid-gesture under render optimization.
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
		isLastFrameSnapped = false;
		activeResizeHandlers = pressedResizeHandlers;
	}

	function onClose(): void
	{
		cursorType.value = 'default';
		isResize.value = false;
		resizingBlock.value = null;
		activeResizeHandlers = [];
	}

	const gesture = useGestureRunner({
		// A handle is 4 px wide, so a press on it is unambiguous: there is no click on the
		// selection to tell the gesture from.
		threshold: 0,
		resolveTargets,
		applyFrame,
		revert,
		commit,
		alignToModel,
		onOpen,
		onClose,
	});

	function startResize(event: MouseEvent, curType: string, resizeHandlers: ResizeHandler[]): void
	{
		// The press stops here whatever the gesture decides about it: otherwise it would reach the
		// root of the block, which starts a node drag, and the canvas, which starts a frame.
		event.stopPropagation();
		// A handle belongs to one block, so the selection collapses to it whatever the guards of
		// the gesture say.
		replaceSelection(highlitedBlockIds, [toValue(block).id]);
		pressedCursorType = curType;
		pressedResizeHandlers = resizeHandlers;

		gesture.start(event);
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
