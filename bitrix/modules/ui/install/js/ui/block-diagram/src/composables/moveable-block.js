import { Dom, Event, Type } from 'main.core';
import {
	ref,
	toValue,
	onMounted,
	onBeforeUnmount,
	computed,
	watchEffect,
} from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useBlockPlacement } from './block-placement';
import { useDisplacedBlocks } from './displaced-blocks';
import { useGroupable, isCaptureCancelModifier } from './groupable';
import { GESTURE_FRAME, useGestureRunner } from './gesture';
import { replaceSelection } from './highlighted-blocks';
import { DRAG_START_THRESHOLD } from '../constants';
import { type PlacementRect } from '../utils';
import { type DiagramBlock, type DiagramBlockId, type Point } from '../types';

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

type UseMoveableBlockOptions = {
	canStartMove?: (event: MouseEvent) => boolean,
};

function copyPosition(position: BlockPosition): BlockPosition
{
	return {
		x: position.x,
		y: position.y,
	};
}

// eslint-disable-next-line max-lines-per-function
export function useMoveableBlock(
	blockRef: HTMLElement,
	block: DiagramBlock,
	options: UseMoveableBlockOptions = {},
): UseBlockReturnType
{
	const isDragged = ref(false);
	const {
		zoom,
		updateBlock,
		hooks,
		setMovingBlock,
		resetMovingBlock,
		setPortOffsetByBlockId,
		updateBlockRectById,
		getBlockById,
		blocks: allBlocksRef,
		blocksRectMap,
		blockElMap,
		highlitedBlockIds,
		connectionPreview,
		clearConnectionPreview,
		snapPoint,
	} = useBlockDiagram();
	const { captureContainedBlockIds, hasGroupableBlock } = useGroupable();
	const { resolvePlacementDelta } = useBlockPlacement();
	const { mark: markDisplacedBlocks, markRefused: markRefusedBlocks } = useDisplacedBlocks();

	const x = ref(toValue(block).position.x);
	const y = ref(toValue(block).position.y);

	let primaryBlock: GestureBlock | null = null;
	let groupBlocks: GestureBlock[] = [];
	let offsetX = 0;
	let offsetY = 0;
	let gestureZoom = 1;
	// Whether the last drawn frame snapped the position: the release commits the position that frame
	// drew, so the correction of the placement rule is rounded to the grid on the very same terms.
	let isLastFrameSnapped = false;
	let stagedPreviewKey = null;
	let isPreviewKeyStaged = false;

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

	// Nodes lying inside a container that takes part in the press. They join the gesture as ordinary
	// members, so no second mechanism carries them: the union goes by block id, and a node already
	// taking part - the pressed one or a selected one - is not taken a second time. With an empty
	// container registry the capture answers without a single lookup in the intersections index.
	function collectCapturedBlocks(
		containers: DiagramBlock[],
		participantIds: DiagramBlockId[],
	): DiagramBlock[]
	{
		const capturedIds = new Set();

		for (const container of containers)
		{
			for (const capturedId of captureContainedBlockIds(container))
			{
				capturedIds.add(capturedId);
			}
		}

		for (const participantId of participantIds)
		{
			capturedIds.delete(participantId);
		}

		if (capturedIds.size === 0)
		{
			return [];
		}

		return toValue(allBlocksRef).filter((item) => capturedIds.has(toValue(item).id));
	}

	// Geometry entries are updated, never created: the geometry of a node may have been purged on
	// purpose, and a merge over a missing entry would resurrect it. The size of the gesture snapshot
	// only fills an entry that has none.
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

	function drawBlockMarkup(blockId: DiagramBlockId, position: BlockPosition): void
	{
		const blockElement = toValue(blockElMap)?.get(blockId);

		if (blockElement)
		{
			Dom.style(blockElement, 'left', `${position.x}px`);
			Dom.style(blockElement, 'top', `${position.y}px`);
		}
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
			drawBlockMarkup(gestureBlock.id, position);
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

	// Read before the commands go out: a consumer applying them may activate a preview of its own,
	// and this gesture must not put out an activation newer than the one it opened.
	function stagePreviewActivationKey(): void
	{
		if (isPreviewKeyStaged)
		{
			return;
		}

		const activationKey = toValue(connectionPreview)?.activationKey;

		stagedPreviewKey = Type.isStringFilled(activationKey) ? activationKey : null;
		isPreviewKeyStaged = true;
	}

	function clearStagedPreview(): void
	{
		const activationKey = stagedPreviewKey;

		stagedPreviewKey = null;
		isPreviewKeyStaged = false;

		if (activationKey !== null)
		{
			clearConnectionPreview(activationKey);
		}
	}

	// The content comes from the live model: the component input lags it by a frame under render
	// optimization, so a node edited during the gesture would be overwritten on commit.
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

	// Reported even when the node has left the model and no command was built: a consumer closes a
	// gesture of its own by this event.
	function reportGestureEnd(updatedBlock: DiagramBlock | null): void
	{
		hooks.endDragBlock.trigger(updatedBlock ?? toValue(block));
	}

	// After the gesture the measured geometry is brought to the model position: a consumer that
	// refused the move left the previous position there.
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

	function hasLeftStartPosition(): boolean
	{
		return primaryBlock.currentPosition.x !== primaryBlock.originalPosition.x
			|| primaryBlock.currentPosition.y !== primaryBlock.originalPosition.y;
	}

	// The pressed node plus the rest of the selection it belongs to. The pressed node leads: it is
	// the one whose position is written reactively.
	function resolveTargets(event: MouseEvent): Array<DiagramBlockId>
	{
		const blockValue = toValue(block);
		const blockId = blockValue.id;
		const groupIds = toValue(highlitedBlockIds);
		const selectedBlocks = groupIds.length > 1
			? toValue(allBlocksRef)
				.filter((item) => groupIds.includes(toValue(item).id) && toValue(item).id !== blockId)
			: [];
		// The set is taken once, here: neither a move frame nor an autoscroll frame recounts it. The
		// modifier is read off this very press for the same reason - Alt taken or let go later in the
		// gesture finds the set already fixed.
		const capturedBlocks = isCaptureCancelModifier(event)
			? []
			: collectCapturedBlocks([blockValue, ...selectedBlocks], groupIds);

		groupBlocks = [...selectedBlocks, ...capturedBlocks]
			.map((item) => createGestureBlock(item, false));
		primaryBlock = createGestureBlock(blockValue, true);

		gestureZoom = toValue(zoom);
		isLastFrameSnapped = false;
		offsetX = Math.round(event.clientX - (primaryBlock.originalPosition.x * gestureZoom));
		offsetY = Math.round(event.clientY - (primaryBlock.originalPosition.y * gestureZoom));

		return [blockId, ...groupBlocks.map((groupBlock) => groupBlock.id)];
	}

	// The pressed node is left out: its position is written reactively, so the render puts it where
	// the gesture last left it anyway.
	function redrawMarkup(): void
	{
		for (const groupBlock of groupBlocks)
		{
			drawBlockMarkup(groupBlock.id, groupBlock.currentPosition);
		}
	}

	function applyFrame(point: Point, isSnapRequested: boolean, source: string): boolean
	{
		isLastFrameSnapped = isSnapRequested;

		// The coordinates are rounded before the snapping, so the model keeps whole pixels at any
		// zoom even when nothing is aligned.
		const newPosition = snapPoint({
			x: Math.round((point.x - offsetX) / gestureZoom),
			y: Math.round((point.y - offsetY) / gestureZoom),
		}, isSnapRequested);
		const deltaX = newPosition.x - primaryBlock.currentPosition.x;
		const deltaY = newPosition.y - primaryBlock.currentPosition.y;
		const isChanged = deltaX !== 0 || deltaY !== 0;

		if (isChanged)
		{
			updateLocalPosition(primaryBlock, newPosition);

			for (const groupBlock of groupBlocks)
			{
				updateLocalPosition(groupBlock, {
					x: groupBlock.currentPosition.x + deltaX,
					y: groupBlock.currentPosition.y + deltaY,
				});
			}
		}

		// A frame that gained no pixel is still reported when the pointer itself moved: the
		// consumer subscribes to the move, not to the pixel.
		if (isChanged || source === GESTURE_FRAME.POINTER)
		{
			hooks.moveDragBlock.trigger(block);
		}

		return isChanged;
	}

	function revert(): void
	{
		stagePreviewActivationKey();

		updateLocalPosition(primaryBlock, primaryBlock.originalPosition);

		for (const groupBlock of groupBlocks)
		{
			updateLocalPosition(groupBlock, groupBlock.originalPosition);
		}
	}

	// The rectangle the placement rule works in: the position the gesture aims at, and the size the
	// model states. The measured size of the gesture snapshot is deliberately not taken - it comes
	// from another space, while the index the rule asks is built over the model. A block the model no
	// longer holds keeps its place among the participants without a usable rect: the rule leaves it
	// out of the geometry but still knows it is not an obstacle to the rest of the gesture.
	function toPlacementRect(gestureBlock: GestureBlock): PlacementRect
	{
		const dimensions = toValue(toValue(getBlockById(gestureBlock.id))?.dimensions) ?? {};

		return {
			id: gestureBlock.id,
			x: gestureBlock.currentPosition.x,
			y: gestureBlock.currentPosition.y,
			width: dimensions.width,
			height: dimensions.height,
		};
	}

	function shiftGestureBy(gestureBlocks: GestureBlock[], delta: Point): void
	{
		for (const gestureBlock of gestureBlocks)
		{
			updateLocalPosition(gestureBlock, {
				x: gestureBlock.currentPosition.x + delta.x,
				y: gestureBlock.currentPosition.y + delta.y,
			});
		}
	}

	function commit(): boolean
	{
		stagePreviewActivationKey();

		// A gesture that came back to where it started is a click on the selection: the command
		// would ask the consumer to save a diagram nothing changed in. The end is reported anyway.
		if (!hasLeftStartPosition())
		{
			reportGestureEnd(createUpdatedBlock(primaryBlock));

			return false;
		}

		const gestureBlocks = [primaryBlock, ...groupBlocks];
		// Asked before the first write: the intersections index refreshes inside every `updateBlock`,
		// so after the first one the rule would answer about a picture that no longer stands.
		const placementDelta = resolvePlacementDelta(
			gestureBlocks.map((gestureBlock: GestureBlock) => toPlacementRect(gestureBlock)),
			{ followsGrid: isLastFrameSnapped },
		);

		// No free room within the budget: the gesture is given up whole, so the model never comes to
		// hold a forbidden overlap. The feedback still goes out - on the positions the participants
		// have just come back to, so the refusal is not a silent one.
		if (placementDelta === null)
		{
			revert();
			markRefusedBlocks(gestureBlocks.map((gestureBlock) => gestureBlock.id));
			reportGestureEnd(createUpdatedBlock(primaryBlock));

			return false;
		}

		const isCorrected = placementDelta.x !== 0 || placementDelta.y !== 0;

		if (isCorrected)
		{
			shiftGestureBy(gestureBlocks, placementDelta);
		}

		// A participant the model has lost is written nowhere, so it has not moved either.
		const committedBlockIds = [];

		for (const groupBlock of groupBlocks)
		{
			const updatedBlock = createUpdatedBlock(groupBlock);

			if (updatedBlock)
			{
				updateBlock(updatedBlock);
				hooks.endDragBlock.trigger(updatedBlock);
				committedBlockIds.push(updatedBlock.id);
			}
		}

		const updatedPrimaryBlock = createUpdatedBlock(primaryBlock);

		if (updatedPrimaryBlock)
		{
			updateBlock(updatedPrimaryBlock);
			committedBlockIds.push(updatedPrimaryBlock.id);
		}

		if (isCorrected)
		{
			markDisplacedBlocks(committedBlockIds);
		}

		reportGestureEnd(updatedPrimaryBlock);

		return true;
	}

	function alignToModel(): void
	{
		for (const gestureBlock of [primaryBlock, ...groupBlocks])
		{
			alignGeometryToModel(gestureBlock);
		}
	}

	function onOpen(): void
	{
		isDragged.value = true;
		setMovingBlock(toValue(block).id);
		hooks.startDragBlock.trigger(block);
	}

	function onClose(): void
	{
		stagePreviewActivationKey();
		resetMovingBlock();
		isDragged.value = false;
		clearStagedPreview();
	}

	const gesture = useGestureRunner({
		threshold: DRAG_START_THRESHOLD,
		resolveTargets,
		elevatesTargets: hasGroupableBlock,
		redrawMarkup,
		applyFrame,
		revert,
		commit,
		alignToModel,
		onOpen,
		onClose,
	});

	// The press picks the selection whatever the guards of the gesture say: a press the gesture
	// refuses still selects the block it landed on. A node already selected keeps the whole
	// selection, so the gesture that follows leads a group.
	function onMouseDown(event: MouseEvent): void
	{
		const blockId = toValue(block).id;

		if (!toValue(highlitedBlockIds).includes(blockId))
		{
			replaceSelection(highlitedBlockIds, [blockId]);
		}

		const canStartMove = toValue(options.canStartMove);
		if (Type.isFunction(canStartMove) && !canStartMove(event))
		{
			return;
		}

		gesture.start(event);
	}

	onMounted(() => {
		Event.bind(toValue(blockRef), 'mousedown', onMouseDown);
	});

	onBeforeUnmount(() => {
		Event.unbind(toValue(blockRef), 'mousedown', onMouseDown);
	});

	return {
		isDragged,
		blockPositionStyle,
	};
}
