import { Dom, Type } from 'main.core';
import { toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useBlockPlacement } from './block-placement';
import { useDisplacedBlocks } from './displaced-blocks';
import { useGroupable, isCaptureCancelModifier } from './groupable';
import { useGestureRunner } from './gesture';
import { DRAG_START_THRESHOLD } from '../constants';
import { type PlacementRect } from '../utils';
import { type DiagramBlock, type DiagramBlockId, type Point } from '../types';

type UseGroupDragLogic = {
	onGroupMouseDown: (event: MouseEvent) => void,
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
		snapPoint,
		setGroupDragOffset,
		resetGroupDragOffset,
	} = useBlockDiagram();
	const { captureContainedBlockIds, hasGroupableBlock } = useGroupable();
	const { resolvePlacementDelta } = useBlockPlacement();
	const { mark: markDisplacedBlocks, markRefused: markRefusedBlocks } = useDisplacedBlocks();

	let currentZoom = 1;
	let movingItems: MovingItem[] = [];
	let committedPositions: CommittedPosition[] = [];
	// Where the button went down: the frame is measured from it, with the camera travel of the
	// autoscroll already added in by the core.
	let anchor = { x: 0, y: 0 };
	let lastTotalDelta = { x: 0, y: 0 };
	// Whether the last drawn frame snapped the delta: the release commits the position that frame
	// drew, so the correction of the placement rule is rounded to the grid on the very same terms.
	let isLastFrameSnapped = false;

	const drawMarkup = (blockId: string, x: number, y: number): void => {
		const blockElement = toValue(blockElMap)?.get(blockId);

		if (blockElement)
		{
			Dom.style(blockElement, 'left', `${x}px`);
			Dom.style(blockElement, 'top', `${y}px`);
		}
	};

	// The markup, the cached rect and the port coordinates of one node. The model is left alone
	// until mouseup: a per-frame write would clear the spatial index and take the connections off.
	const moveItem = (blockId: string, x: number, y: number, stepX: number, stepY: number): void => {
		drawMarkup(blockId, x, y);

		// Only an existing entry is moved: a merge over a missing one would recreate geometry that
		// a purge removed on purpose.
		if (Type.isObjectLike(toValue(blocksRectMap)?.[blockId]))
		{
			updateBlockRectById(blockId, { x, y });
		}

		if (setPortOffsetByBlockId && (stepX !== 0 || stepY !== 0))
		{
			setPortOffsetByBlockId(blockId, { x: -stepX, y: -stepY });
		}
	};

	// A node whose model position is unusable stays out of the gesture: a non-finite coordinate
	// would spread NaN over the rect cache, the ports and the model.
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

	// Nodes lying inside a container that took part in the selection. They join the gesture as
	// ordinary members and go through the same filtering the selected nodes do; the union goes by
	// block id, so a node that is both selected and contained is taken exactly once. With no
	// container among the selected blocks the capture answers without a single lookup in the
	// intersections index, and the selection itself stays the list of participants - nothing new is
	// built for a gesture that has no containers in it.
	const collectParticipantIds = (
		selectedBlocks: DiagramBlock[],
		selectedIds: Set<DiagramBlockId>,
	): Set<DiagramBlockId> => {
		let participantIds = null;

		for (const block of selectedBlocks)
		{
			for (const capturedId of captureContainedBlockIds(block))
			{
				if (participantIds === null)
				{
					participantIds = new Set(selectedIds);
				}

				participantIds.add(capturedId);
			}
		}

		return participantIds ?? selectedIds;
	};

	// After the gesture the markup and the measured geometry are brought to the model position: a
	// consumer may refuse the move or write a position of its own. The port offsets are written as
	// steps, so nothing but this brings them back into step.
	const alignItemToModel = (
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

	// One pass over the model instead of a linear lookup per node of the selection.
	const buildBlockByIdMap = (): Map<DiagramBlockId, DiagramBlock> => {
		return new Map(
			toValue(uiBlocksRef).map((block) => [toValue(block).id, block]),
		);
	};

	const resolveTargets = (event: MouseEvent): Array<DiagramBlockId> | null => {
		closeContextMenu();

		const selectedIds = new Set(toValue(highlitedBlockIds));
		const modelBlocks = toValue(uiBlocksRef);
		// The modifier is read off this very press: the set of a gesture is fixed here, so Alt taken
		// or let go later changes nothing. With it held the selection alone moves, as it did before
		// containers existed.
		const participantIds = isCaptureCancelModifier(event)
			? selectedIds
			: collectParticipantIds(
				modelBlocks.filter((block) => selectedIds.has(block.id)),
				selectedIds,
			);
		const items = modelBlocks
			.filter((block) => participantIds.has(block.id))
			.map((block) => createMovingItem(block))
			.filter((item) => item !== null);

		if (items.length === 0)
		{
			return null;
		}

		currentZoom = toValue(zoom);
		anchor = { x: event.clientX, y: event.clientY };
		lastTotalDelta = { x: 0, y: 0 };
		isLastFrameSnapped = false;
		movingItems = items;

		return movingItems.map((item) => item.id);
	};

	// Every node of this gesture keeps its position in the markup alone until mouseup, so all of
	// them are drawn again.
	const redrawMarkup = (): void => {
		for (const item of movingItems)
		{
			drawMarkup(item.id, item.startX + lastTotalDelta.x, item.startY + lastTotalDelta.y);
		}
	};

	const applyFrame = (point: Point, isSnapRequested: boolean): boolean => {
		isLastFrameSnapped = isSnapRequested;

		// the whole group moves by one snapped delta, so distances inside it stay untouched;
		// the delta is whole-pixel even unsnapped, because the model keeps integer coordinates
		const { x: totalDeltaX, y: totalDeltaY } = snapPoint({
			x: Math.round((point.x - anchor.x) / currentZoom),
			y: Math.round((point.y - anchor.y) / currentZoom),
		}, isSnapRequested);

		// Nothing but a finite delta is ever applied: a NaN would spread over the rect cache, the
		// port coordinates and the model.
		if (!Number.isFinite(totalDeltaX) || !Number.isFinite(totalDeltaY))
		{
			return false;
		}

		const stepX = totalDeltaX - lastTotalDelta.x;
		const stepY = totalDeltaY - lastTotalDelta.y;

		if (stepX === 0 && stepY === 0)
		{
			return false;
		}

		for (const item of movingItems)
		{
			moveItem(item.id, item.startX + totalDeltaX, item.startY + totalDeltaY, stepX, stepY);
		}

		lastTotalDelta = { x: totalDeltaX, y: totalDeltaY };
		setGroupDragOffset({ x: totalDeltaX, y: totalDeltaY });

		return true;
	};

	const revert = (): void => {
		for (const item of movingItems)
		{
			moveItem(item.id, item.startX, item.startY, -lastTotalDelta.x, -lastTotalDelta.y);
		}
	};

	// The rectangles the placement rule is asked about: the whole-pixel position the gesture aims at,
	// and the size the model states. The gesture itself knows no sizes - `MovingItem` carries only a
	// starting point - so the size comes from the block the model holds under the same id. A node the
	// model has lost keeps its place among the participants without a usable rect: the rule leaves it
	// out of the geometry but still knows it is not an obstacle to the rest of the gesture.
	const collectPlacementRects = (
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): Map<DiagramBlockId, PlacementRect> => {
		const rects = new Map();

		for (const item of movingItems)
		{
			const dimensions = toValue(toValue(blockById.get(item.id))?.dimensions) ?? {};

			rects.set(item.id, {
				id: item.id,
				x: Math.round(item.startX + lastTotalDelta.x),
				y: Math.round(item.startY + lastTotalDelta.y),
				width: dimensions.width,
				height: dimensions.height,
			});
		}

		return rects;
	};

	const commit = (): boolean => {
		// A gesture that left the nodes where they started is a click on the selection, not a drag:
		// committing it would ask the consumer to save a diagram nothing changed in.
		if (lastTotalDelta.x === 0 && lastTotalDelta.y === 0)
		{
			return false;
		}

		const blockById = buildBlockByIdMap();
		const placementRects = collectPlacementRects(blockById);
		// Asked before the first write: the intersections index refreshes inside every `updateBlock`,
		// so after the first one the rule would answer about a picture that no longer stands.
		const placementDelta = resolvePlacementDelta(
			[...placementRects.values()],
			{ followsGrid: isLastFrameSnapped },
		);

		// No free room within the budget: the gesture is given up whole, so the model never comes to
		// hold a forbidden overlap. The feedback still goes out - on the positions the participants
		// have just come back to, so the refusal is not a silent one.
		if (placementDelta === null)
		{
			revert();
			markRefusedBlocks(movingItems.map((item) => item.id));

			return false;
		}

		// Where the frame left the nodes, before the correction: the step given to the markup and to
		// the port offsets is counted from there.
		const drawnDelta = lastTotalDelta;

		// Added to the delta of the whole gesture rather than to the position of each node: the
		// selection travels by one value, so the layout inside it comes out of the correction as it
		// went in.
		lastTotalDelta = {
			x: drawnDelta.x + placementDelta.x,
			y: drawnDelta.y + placementDelta.y,
		};

		// The markup and the geometry are brought to the whole-pixel position of the model first, so
		// all three describe the same place. That position is the very rect the rule was asked about
		// plus the correction it answered with: rounding happens once, before the question, so the
		// model gets exactly the geometry the rule cleared. Rounding the corrected sum a second time
		// would leave a node with a fractional model position a pixel off that geometry - and a pixel
		// is enough to overlap the neighbour it was moved away from.
		committedPositions = movingItems.map((item) => {
			const { x, y } = placementRects.get(item.id);
			const correctedX = x + placementDelta.x;
			const correctedY = y + placementDelta.y;
			const drawnX = item.startX + drawnDelta.x;
			const drawnY = item.startY + drawnDelta.y;

			moveItem(item.id, correctedX, correctedY, correctedX - drawnX, correctedY - drawnY);

			return { id: item.id, x: correctedX, y: correctedY };
		});

		// A participant the model has lost is written nowhere, so it has not moved either.
		const committedBlockIds = [];

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
			committedBlockIds.push(id);
		}

		if (placementDelta.x !== 0 || placementDelta.y !== 0)
		{
			markDisplacedBlocks(committedBlockIds);
		}

		return true;
	};

	// Runs a tick after the commit: under render optimization the block input still carries the
	// pre-gesture position on the render of that commit, and the nodes would blink back to it.
	const alignToModel = (): void => {
		// Built again rather than reused: the consumer applies the commands by replacing the model,
		// and the point here is to read where it has put the nodes.
		const committedBlockById = buildBlockByIdMap();

		for (const committedPosition of committedPositions)
		{
			alignItemToModel(committedPosition, committedBlockById);
		}
	};

	const onOpen = (): void => {
		resetGroupDragOffset();
		// Not on close: the alignment runs a tick later and these positions are what it reads.
		committedPositions = [];
	};

	const onClose = (): void => {
		resetGroupDragOffset();
		movingItems = [];
		lastTotalDelta = { x: 0, y: 0 };
	};

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

	const onGroupMouseDown = (event: MouseEvent): void => {
		gesture.start(event);
	};

	return { onGroupMouseDown };
}
