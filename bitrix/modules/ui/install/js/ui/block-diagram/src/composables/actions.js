import { toValue, markRaw } from 'ui.vue3';
import { Type } from 'main.core';
import { PORT_POSITION } from '../constants';
import { commandToArray, promiseWithResolvers, getCanvasRect, snapValueToGrid, snapPointToGrid } from '../utils';
import { useAutoScroll } from './autoscroll';
import { type HandlerOptions } from './history';
import {
	type DiagramBlockId,
	type DiagramBlock,
	type DiagramConnectionId,
	type DiagramConnection,
	type DiagramAddConnection,
	type DiagramPortId,
	type DiagramConnectionPreview,
	type DiagramConnectionRouteHit,
	type DiagramConnectionOffset,
	type DiagramConnectionsOffsetMap,
	type Point,
	type Rect,
} from '../types';

export type UseActions = {
	setState: () => void,
	setUnmountedBlocks: (newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]) => void,
	blockMounted: (blockId: DiagramBlockId) => void,
	setUnmountedPorts: (newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]) => void,
	portMounted: (blockId: DiagramBlockId, portId: DiagramPortId) => void,
	setConnectionsOffsets: (connections: DiagramConnection[]) => void,
	findConnectionRouteHits: (rect: Rect) => DiagramConnectionRouteHit[],
	showConnectionPreview: (preview: DiagramConnectionPreview) => void,
	clearConnectionPreview: (expectedActivationKey?: string | null) => void,
	setHistoryBlocksCurrentState: (blocks: DiagramBlock[]) => void,
	setHistoryConnectionsCurrentState: (connections: DiagramConnection[]) => void,
	isExistConnection: (connection: DiagramConnection) => boolean,
	addConnection: (connection: DiagramAddConnection) => void,
	addConnections: (connections: DiagramConnection[]) => void,
	deleteConnectionById: (connectionId: DiagramConnectionId) => void,
	addBlock: (block: DiagramBlock) => void,
	addBlocks: (...blocks: DiagramBlock[]) => void,
	replaceBlocks: (blocks: DiagramBlock[]) => void,
	updateBlockPositionByIndex: (index: number, x: number, y: number) => void,
	updateBlock: (newBlock: DiagramBlock) => void,
	rollbackBlockUpdate: (attemptedBlock: DiagramBlock | null, actualBlock: DiagramBlock | null) => void,
	deleteBlockById: (blockId: DiagramBlockId) => void,
	transformEventToPoint: (point: { clientX: number, clientY: number }) => Point,
	setMovingBlock: (block: DiagramBlock) => void,
	updateMovingBlockPosition: (x: number, y: number) => void,
	resetMovingBlock: () => void,
	setGestureBlocks: (blockIds: DiagramBlockId[]) => void,
	resetGestureBlocks: () => void,
	setGroupDragOffset: (offset: Point) => void,
	resetGroupDragOffset: () => void,
	setHistoryHandlers: (HandlerOptions) => void,
	setPortOffsetByBlockId: (blockId: string, offsets: { x: number, y: number }) => void;
	touchPortsGeometry: () => void;
	translateBlockGeometry: (blockId: DiagramBlockId, offset: Point) => void;
	translateBlocksGeometry: (offsets: Map<DiagramBlockId, Point>) => void;
	purgeBlockGeometry: (blockId: DiagramBlockId) => void;
	purgeBlockGeometryExcept: (keepBlockIds: DiagramBlockId[]) => void;
	snapValue: (value: number, isSnapRequested?: boolean) => number;
	snapPoint: (point: Point, isSnapRequested?: boolean) => Point;
};

export function createConnectionsOffsetMap(
	connections: DiagramConnection[],
	connectionOffset: number,
	connectionBendOffset: number,
): DiagramConnectionsOffsetMap
{
	const connectionsOffsetMap = Object.create(null);
	const connectionsCountMap = Object.create(null);
	const getPortOffsets = (
		blockId: DiagramBlockId,
		portId: DiagramPortId,
	): { [DiagramConnectionId]: DiagramConnectionOffset } => {
		if (!(blockId in connectionsOffsetMap))
		{
			connectionsOffsetMap[blockId] = Object.create(null);
			connectionsCountMap[blockId] = Object.create(null);
		}

		if (!(portId in connectionsOffsetMap[blockId]))
		{
			connectionsOffsetMap[blockId][portId] = Object.create(null);
			connectionsCountMap[blockId][portId] = 0;
		}

		return connectionsOffsetMap[blockId][portId];
	};

	connections.forEach((connection) => {
		const {
			id,
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		} = connection;
		const sourcePortOffsets = getPortOffsets(sourceBlockId, sourcePortId);
		const targetPortOffsets = getPortOffsets(targetBlockId, targetPortId);
		const sourceConnectionExists = id in sourcePortOffsets;
		const targetConnectionExists = id in targetPortOffsets;
		const sourceConnectionsCount = connectionsCountMap[sourceBlockId][sourcePortId] + 1;
		const targetConnectionsCount = connectionsCountMap[targetBlockId][targetPortId] + 1;

		sourcePortOffsets[id] = {
			firstSegmentSize: sourceConnectionsCount * connectionOffset,
			secondSegmentSize: connectionBendOffset * connectionOffset,
			secondSegmentOrder: sourceConnectionsCount,
		};

		targetPortOffsets[id] = {
			firstSegmentSize: targetConnectionsCount * connectionOffset,
			secondSegmentSize: connectionBendOffset * connectionOffset,
			secondSegmentOrder: targetConnectionsCount,
		};

		if (!sourceConnectionExists)
		{
			connectionsCountMap[sourceBlockId][sourcePortId] = sourceConnectionsCount;
		}

		if (!targetConnectionExists)
		{
			connectionsCountMap[targetBlockId][targetPortId] = targetConnectionsCount;
		}
	});

	return connectionsOffsetMap;
}

function isFilledString(value): boolean
{
	return Type.isStringFilled(value) && value.trim() !== '';
}

function isDiagramConnection(connection): boolean
{
	return Type.isObject(connection)
		&& [
			'id',
			'sourceBlockId',
			'sourcePortId',
			'targetBlockId',
			'targetPortId',
		].every((field) => isFilledString(connection[field]));
}

function prepareConnectionPreview(preview): DiagramConnectionPreview | null
{
	if (!Type.isObject(preview)
		|| !isFilledString(preview.activationKey)
		|| !isFilledString(preview.hiddenConnectionId)
		|| !Type.isArray(preview.temporaryConnections)
		|| preview.temporaryConnections.length !== 2
		|| !preview.temporaryConnections.every(isDiagramConnection)
		|| preview.temporaryConnections[0].id === preview.temporaryConnections[1].id
		|| !Type.isArray(preview.portMarkers)
		|| preview.portMarkers.length !== 2
		|| !preview.portMarkers.every((marker) => (
			Type.isObject(marker)
			&& isFilledString(marker.blockId)
			&& isFilledString(marker.portId)
		))
		|| !Type.isArray(preview.routingConnections)
		|| !preview.routingConnections.every(isDiagramConnection)
	)
	{
		return null;
	}

	const temporaryConnectionIds = new Set(
		preview.temporaryConnections.map((connection) => connection.id),
	);
	const routingConnectionIds = new Set(
		preview.routingConnections.map((connection) => connection.id),
	);
	const hasUniqueRoutingConnectionIds = routingConnectionIds.size === preview.routingConnections.length;
	const hasIndependentHiddenConnection = !temporaryConnectionIds.has(preview.hiddenConnectionId);

	const hasTemporaryConnections = [...temporaryConnectionIds]
		.every((connectionId) => routingConnectionIds.has(connectionId));

	if (!hasUniqueRoutingConnectionIds || !hasIndependentHiddenConnection || !hasTemporaryConnections)
	{
		return null;
	}

	return {
		hiddenConnectionId: preview.hiddenConnectionId,
		temporaryConnections: [
			{ ...preview.temporaryConnections[0] },
			{ ...preview.temporaryConnections[1] },
		],
		routingConnections: preview.routingConnections.map((connection) => ({ ...connection })),
		portMarkers: [
			{ ...preview.portMarkers[0] },
			{ ...preview.portMarkers[1] },
		],
		activationKey: preview.activationKey,
	};
}

/* eslint-disable no-param-reassign */
// eslint-disable-next-line max-lines-per-function
export function useActions({ state, getters, hooks, instances = null }): UseActions
{
	function setState(options): void
	{
		state.blocks = toValue(options.blocks);
		state.connections = toValue(options.connections);
		state.transformX = options.transform.x;
		state.transformY = options.transfrom.y;
		state.zoom = toValue(options.zoom);
	}

	function setUnmountedBlocks(newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[] = []): void
	{
		const oldBlockIdsMap = new Set(oldBlocks.map((block) => block.id));
		const arrWaitedBlockIds = newBlocks
			.filter((block) => !oldBlockIdsMap.has(block.id))
			.map((block) => block.id);

		state.waitAllBlocksMounted = promiseWithResolvers();
		state.waitedBlockIds = new Set(arrWaitedBlockIds);

		// Nothing new to mount: a replacement that only moves existing blocks. The graph
		// is ready right away, and no mount event is coming to resolve the barrier.
		if (state.waitedBlockIds.size === 0)
		{
			state.waitAllBlocksMounted.resolve();
		}
	}

	function blockMounted(blockId: DiagramBlockId): void
	{
		const { waitedBlockIds, waitAllBlocksMounted } = state;

		waitedBlockIds.delete(blockId);

		if (waitedBlockIds.size === 0)
		{
			waitAllBlocksMounted.resolve();
		}
	}

	function setUnmountedPorts(newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[] = []): void
	{
		const oldBlockPortsIds = oldBlocks.reduce((accMap, block) => {
			block.ports.forEach((port) => accMap.add(`${block.id}_${port.id}`));

			return accMap;
		}, new Set());

		const arrNewBlockPortIds = newBlocks
			.flatMap((block) => block.ports.map((port) => `${block.id}_${port.id}`))
			.filter((blockPortId) => !oldBlockPortsIds.has(blockPortId));
		state.waitedBlockPortsIds = new Set(arrNewBlockPortIds);

		state.waitAllPortsMounted = promiseWithResolvers();
	}

	function portMounted(blockId: DiagramBlockId, portId: DiagramPortId): void
	{
		const { waitedBlockPortsIds, waitAllPortsMounted } = state;

		waitedBlockPortsIds.delete(`${blockId}_${portId}`);

		if (waitedBlockPortsIds.size === 0)
		{
			waitAllPortsMounted.resolve();
		}
	}

	function setConnectionsOffsets(connections: DiagramConnection[]): void
	{
		const { connectionOffset, connectionBendOffset } = state;

		state.connectionsOffsetMap = createConnectionsOffsetMap(
			connections,
			connectionOffset,
			connectionBendOffset,
		);
	}

	const findConnectionRouteHits = (rect: Rect): DiagramConnectionRouteHit[] => {
		return instances?.blockIntersections?.findConnectionRouteHits(rect) ?? [];
	};

	const showConnectionPreview = (preview: DiagramConnectionPreview): void => {
		state.connectionPreview = prepareConnectionPreview(preview);
	};

	const clearConnectionPreview = (expectedActivationKey: string | null = null): void => {
		if (Type.isNil(expectedActivationKey))
		{
			state.connectionPreview = null;

			return;
		}

		if (isFilledString(expectedActivationKey)
			&& state.connectionPreview?.activationKey === expectedActivationKey)
		{
			state.connectionPreview = null;
		}
	};

	function setHistoryBlocksCurrentState(blocks: DiagramBlock[]): void
	{
		state.historyCurrentState.blocks = markRaw(JSON.parse(JSON.stringify(blocks)));
	}

	function setHistoryConnectionsCurrentState(connections: DiagramConnection[]): void
	{
		state.historyCurrentState.connections = markRaw(JSON.parse(JSON.stringify(connections)));
	}

	function updateCanvasTransform(transform: Transform): void
	{
		const {
			x = 0,
			y = 0,
			zoom = 1,
			viewportX = 0,
			viewportY = 0,
		} = transform;
		state.transformX = x;
		state.transformY = y;
		state.viewportX = viewportX;
		state.viewportY = viewportY;
		state.zoom = zoom;
	}

	const isExistConnection = (connection: DiagramConnection): boolean => {
		const {
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		} = connection;

		return state.connections.some(({
			sourceBlockId: exSourceBlockId,
			sourcePortId: exSourcePortId,
			targetBlockId: exTargetBlockId,
			targetPortId: exTargetPortId,
		}) => {
			const isSource = (
				exSourceBlockId === sourceBlockId
				&& exSourcePortId === sourcePortId
				&& exTargetBlockId === targetBlockId
				&& exTargetPortId === targetPortId
			);
			const isTarget = (
				exSourceBlockId === targetBlockId
				&& exSourcePortId === targetPortId
				&& exTargetBlockId === sourceBlockId
				&& exTargetPortId === sourcePortId
			);

			return isSource || isTarget;
		});
	};

	const addConnection = (newConnection: DiagramAddConnection): void => {
		if (!isExistConnection(newConnection))
		{
			hooks.changedConnections.trigger(commandToArray.commandPush(newConnection));
			hooks.createConnection.trigger(newConnection);
		}
	};

	const addConnections = (newConnections: DiagramAddConnection[]): void => {
		const notExistConnections = toValue(newConnections)
			.filter((connection) => !isExistConnection(connection));

		if (notExistConnections.length > 0)
		{
			setConnectionsOffsets(notExistConnections);
			hooks.changedConnections.trigger(
				commandToArray.commandPush(notExistConnections),
			);
			hooks.addConnections.trigger(notExistConnections);
		}
	};

	const deleteConnectionById = (connectionId: DiagramConnectionId): void => {
		hooks.changedConnections.trigger(
			commandToArray.commandDeleteById(connectionId),
		);
		hooks.deleteConnection.trigger(connectionId);
	};

	const deleteConnectionByBlockIdAndPortId = (blockId: DiagramBlockId, portId: DiagramPortId): void => {
		const block = state.blocks.find((stateBlock) => stateBlock.id === blockId);

		if (!block)
		{
			return;
		}

		const ports = Type.isArray(block.ports) ? block.ports : [];
		const portIdMap = new Set(
			ports.map((port) => port.id),
		);
		const removeConnectionIds = state.connections
			.filter((connection) => {
				const {
					sourceBlockId,
					sourcePortId,
					targetBlockId,
					targetPortId,
				} = connection;
				const isSource = sourceBlockId === blockId && portIdMap.has(sourcePortId);
				const isTarget = targetBlockId === blockId && portIdMap.has(targetPortId);

				return isSource || isTarget;
			})
			.map((connection) => connection.id);

		if (removeConnectionIds.length === 0)
		{
			return;
		}

		hooks.changedConnections.trigger(
			commandToArray.commandDeleteByIds(removeConnectionIds),
		);
	};

	const deleteBlockById = (blockId: DiagramBlockId): void => {
		const block = state.blocks.find((stateBlock) => stateBlock.id === blockId);

		if (!block)
		{
			return;
		}

		deleteConnectionByBlockIdAndPortId(blockId);

		hooks.changedBlocks.trigger(
			commandToArray.commandDeleteById(blockId),
		);
		hooks.deleteBlock.trigger(block);
	};

	const getBlockById = (blockId: DiagramBlockId): DiagramBlock | null => {
		return state.blocks
			.find((block) => block.id === blockId) ?? null;
	};

	const addBlock = (block: DiagramBlock): void => {
		setUnmountedPorts([block]);
		setUnmountedBlocks([block]);
		hooks.changedBlocks.trigger(
			commandToArray.commandPush(block),
		);
		hooks.addBlock.trigger(block);
	};

	const addBlocks = (blocks: DiagramBlock[]): void => {
		setUnmountedPorts(blocks);
		setUnmountedBlocks(blocks);
		hooks.changedBlocks.trigger(
			commandToArray.commandPush(blocks),
		);
		hooks.addBlocks.trigger(blocks);
	};

	const replaceBlocks = (blocks: DiagramBlock[]): void => {
		hooks.changedBlocks.trigger(commandToArray.commandReplace(blocks));
	};

	const deleteBlock = (block: DiagramBlock[]): void => {
		deleteBlockById(toValue(block).id);
	};

	const deleteBlocks = (blocks: DiagramBlock[]): void => {
		const ids = toValue(blocks).map((block) => block.id);

		hooks.changedBlocks.trigger(
			commandToArray.commandDeleteByIds(ids),
		);
		hooks.deleteBlocks.trigger(blocks);
	};

	const addBlocksAndConnections = (newBlocks: DiagramBlocks[], newConnections: DiagramConnection[]): void => {
		addBlocks(newBlocks);
		addConnections(newConnections);
	};

	const updateBlockPositionByIndex = (index: number, x: number, y: number): void => {
		state.blocks[index].position.x = x;
		state.blocks[index].position.y = y;
	};

	const updateBlock = (newBlock: DiagramBlock): void => {
		const blockIndex = state.blocks.findIndex((block) => block.id === newBlock.id);

		if (blockIndex === -1)
		{
			return;
		}

		hooks.updateBlock.trigger(state.blocks[blockIndex], newBlock);
		hooks.changedBlocks.trigger(
			commandToArray.commandUpdateByIndex(blockIndex, newBlock),
		);
	};

	// Each side of the rollback is applied only for a block the caller could resolve: an update
	// intercepted after its block left the model carries no geometry, and passing it on would ask
	// the index for the box of a block that no longer has one. Releasing the command flag is
	// unconditional - the interception is over either way.
	const rollbackBlockUpdate = (
		attemptedBlock: DiagramBlock | null,
		actualBlock: DiagramBlock | null,
	): void => {
		if (Type.isObjectLike(attemptedBlock))
		{
			instances?.blockIntersections?.removeBlock(attemptedBlock);
		}

		if (Type.isObjectLike(actualBlock))
		{
			instances?.blockIntersections?.insertBlock(actualBlock);
		}

		state.isRunUpdateBlocksCommand = false;
	};

	const transformEventToPoint = (point: { clientX: number, clientY: number }): Point => {
		let transformedX: number = Math.round(point.clientX / toValue(state.zoom));
		let transformedY: number = Math.round(point.clientY / toValue(state.zoom));

		const { top, left } = toValue(state.blockDiagramRef)?.getBoundingClientRect() ?? { top: 0, left: 0 };

		transformedX -= Math.round(left / toValue(state.zoom));
		transformedY -= Math.round(top / toValue(state.zoom));

		return { x: transformedX, y: transformedY };
	};

	const setMovingBlock = (blockId: DiagramBlockId): void => {
		state.movingBlockId = toValue(blockId);
	};

	const resetMovingBlock = (): void => {
		state.movingBlockId = null;
	};

	// Every node of the running gesture, whatever leads it: the frame drag moves a whole selection
	// and the node drag takes its group members along, while the model keeps their pre-gesture
	// positions until the commit. The set is replaced rather than mutated - a reactive Set read
	// inside an animation frame only needs its current value.
	const setGestureBlocks = (blockIds: DiagramBlockId[]): void => {
		state.gestureBlockIds = new Set(
			toValue(blockIds).map((blockId) => toValue(blockId)),
		);
	};

	const resetGestureBlocks = (): void => {
		state.gestureBlockIds = new Set();
	};

	// The shift the frame drag has drawn and not yet committed. It belongs to the diagram instance:
	// a page may hold several of them, and the box of one must not follow the gesture of another.
	const setGroupDragOffset = (offset: Point): void => {
		state.groupDragOffset = { x: offset.x, y: offset.y };
	};

	const resetGroupDragOffset = (): void => {
		state.groupDragOffset = { x: 0, y: 0 };
	};

	const updateBlockRectById = (blockId: DiagramBlockId, rect): void => {
		state.blocksRectMap[blockId] = {
			...state.blocksRectMap[blockId],
			...rect,
		};
	};

	// Reports that a port registered or dropped its own rect. Neither the coordinates of an
	// already measured port nor a bulk purge of a culled block's geometry count as a change
	// here: the signal only wakes the pass that adds targets, and a gesture never revokes one it
	// already earned. A purge does drop the rect, so its readers treat a missing one as no target.
	const touchPortsGeometry = (): void => {
		state.portsGeometryVersion += 1;
	};

	// Release geometry retained under culling. The only path that frees a retained
	// node's coordinates when it leaves the model without producing an unmount.
	const purgeBlockGeometry = (blockId: DiagramBlockId): void => {
		delete state.portsRectMap[blockId];
		delete state.blocksRectMap[blockId];
	};

	const purgeBlockGeometryExcept = (keepBlockIds: DiagramBlockId[]): void => {
		const keep = new Set(toValue(keepBlockIds));
		const trackedIds = new Set([
			...Object.keys(state.blocksRectMap),
			...Object.keys(state.portsRectMap),
		]);

		trackedIds.forEach((blockId) => {
			if (!keep.has(blockId))
			{
				purgeBlockGeometry(blockId);
			}
		});
	};

	const setHistoryHandlers = ({
		snapshotHandler: newSnapshotHandler = null,
		revertHandler: newRevertHandler = null,
	}: HandlerOptions): void => {
		state.snapshotHandler = newSnapshotHandler || state.snapshotHandler;
		state.revertHandler = newRevertHandler || state.revertHandler;
	};

	// Block ids come from an untrusted graph, so a rect is only ever taken as an own property.
	const getOwnRect = (rectMap, key) => {
		const map = toValue(rectMap) ?? {};

		return Object.hasOwn(map, key) ? map[key] : null;
	};

	const translatePortRects = (blockId: DiagramBlockId, offset: Point): void => {
		const ports = getOwnRect(state.portsRectMap, blockId) ?? {};

		Object.values(ports).forEach((portRect) => {
			portRect.x += offset.x;
			portRect.y += offset.y;
		});
	};

	// Drag passes previous minus new position, so its offset is the negation of the move.
	const setPortOffsetByBlockId = (blockId: string, offsets: { x: number, y: number }): void => {
		translatePortRects(blockId, { x: -offsets.x, y: -offsets.y });
	};

	// Moving a block by a known offset leaves its size and the placement of its ports relative
	// to it untouched, so measured geometry follows by arithmetic and the browser is never asked
	// to measure again. Records are moved, never dropped: consumers read them without an
	// existence check. Culled blocks are translated as well, but a moved one does not keep the
	// transfer: the props watcher flushing right after purges retained geometry whose model key
	// changed, and the first-measure path measures such a block again on its next mount. So for
	// blocks outside the viewport correctness rests on that path, not on this translation.
	const translateBlockGeometry = (blockId: DiagramBlockId, offset: Point): void => {
		const blockRect = getOwnRect(state.blocksRectMap, blockId);

		if (blockRect)
		{
			blockRect.x += offset.x;
			blockRect.y += offset.y;
		}

		translatePortRects(blockId, offset);
	};

	const translateBlocksGeometry = (offsets: Map<DiagramBlockId, Point>): void => {
		offsets.forEach((offset, blockId) => {
			translateBlockGeometry(blockId, offset);
		});
	};

	const updateBlockRect = (blockId: DiagramBlockId): void => {
		const {
			blockElMap,
			blocksRectMap,
			blocks,
		} = state;
		const rect = getCanvasRect(toValue(blockElMap).get(toValue(blockId)));

		if (!rect)
		{
			return;
		}

		blocksRectMap[toValue(blockId)] = { ...rect };

		const block = toValue(blocks).find((b) => b.id === toValue(blockId));

		updateBlock({
			...toValue(block),
			position: {
				x: rect.x,
				y: rect.y,
			},
			dimensions: {
				width: rect.width,
				height: rect.height,
			},
		});
	};

	const updatePort = (
		blockId: DigramBlockId,
		portId: DiagramPortId,
		order: number = 0,
	): void => {
		updateBlockRect(blockId);
		updatePortRect(blockId, portId);
		updatePortSegmentSizes(blockId, portId, order);
	};

	const updatePortRect = (blockId: DigramBlockId, portId: DiagramPortId): void => {
		const {
			portsElMap,
			portsRectMap,
		} = state;
		const hasBlock = toValue(portsElMap).has(blockId);
		const hasPort = hasBlock && toValue(portsElMap).get(blockId).has(portId);

		if (!hasBlock || !hasPort)
		{
			return;
		}

		const rect = getCanvasRect(portsElMap.get(blockId)?.get(portId));

		if (!rect)
		{
			return;
		}

		portsRectMap[blockId][portId].x = rect.x;
		portsRectMap[blockId][portId].y = rect.y;
		portsRectMap[blockId][portId].width = rect.width;
		portsRectMap[blockId][portId].height = rect.height;
	};

	const updatePortSegmentSizes = (
		blockId: DigramBlockId,
		portId: DiagramPortId,
		order: number,
	): void => {
		const {
			connectionOffset,
			connectionBendOffset,
			blocksRectMap,
			portsRectMap,
		} = state;
		if (!blocksRectMap[blockId] || !portsRectMap[blockId]?.[portId])
		{
			return;
		}
		const {
			x: blockX,
			y: blockY,
			width: blockWidth,
			height: blockHeight,
		} = blocksRectMap[blockId];
		const {
			x: portX,
			y: portY,
			width: portWidth,
			height: portHeight,
			position,
		} = portsRectMap[blockId][portId];

		const isLeftOrRightPosition = position === PORT_POSITION.LEFT || position === PORT_POSITION.RIGHT;
		const additionalOffset = (order + 1) * connectionOffset;
		const additionalBendOffset = (order + 1) * connectionBendOffset;
		const offset = isLeftOrRightPosition
			? Math.abs(blockY - (portY + (portHeight / 2)))
			: Math.abs(blockX - (portX + (portWidth / 2)));

		portsRectMap[blockId][portId].firstSegmentSize = additionalOffset;
		portsRectMap[blockId][portId].secondSegmentSizeWithoutOffset = isLeftOrRightPosition
			? blockHeight - offset
			: blockWidth - offset;
		portsRectMap[blockId][portId].secondSegmentSize = isLeftOrRightPosition
			? blockHeight - offset + additionalBendOffset
			: blockWidth - offset + additionalBendOffset;
	};

	const setSelectionActive = (value: boolean): void => {
		state.isSelectionActive = value;
	};

	const setSelectionWorldRect = (rect: Rect | null): void => {
		state.selectionWorldRect = rect;
	};

	const setCamera = (params): void => {
		toValue(state.canvasInstance)?.setCamera(params);
	};

	const autoScroll = useAutoScroll(state, { setCamera });

	const transformMouseEventToPoint = (event: MouseEvent): Point => {
		const {
			zoom,
			blockDiagramTop,
			blockDiagramLeft,
			transformX,
			transformY,
		} = state;

		let x = event.clientX / toValue(zoom);
		x -= toValue(blockDiagramLeft) / toValue(zoom);
		x += toValue(transformX);

		let y = event.clientY / toValue(zoom);
		y -= toValue(blockDiagramTop) / toValue(zoom);
		y += toValue(transformY);

		return { x, y };
	};

	// Input points never align on their own: a point is snapped only where the caller reports the
	// modifier as held and only while the diagram allows snapping.
	const isSnapApplied = (isSnapRequested: boolean): boolean => {
		return isSnapRequested === true && toValue(getters.snapStep) !== null;
	};

	const snapValue = (value: number, isSnapRequested: boolean = false): number => {
		return isSnapApplied(isSnapRequested)
			? snapValueToGrid(value, toValue(getters.snapStep))
			: value;
	};

	const snapPoint = (point: Point, isSnapRequested: boolean = false): Point => {
		return isSnapApplied(isSnapRequested)
			? snapPointToGrid(point, toValue(getters.snapStep))
			: { x: point.x, y: point.y };
	};

	return {
		setState,
		setConnectionsOffsets,
		findConnectionRouteHits,
		showConnectionPreview,
		clearConnectionPreview,
		setHistoryBlocksCurrentState,
		setHistoryConnectionsCurrentState,
		setUnmountedBlocks,
		blockMounted,
		setUnmountedPorts,
		portMounted,
		updateCanvasTransform,
		isExistConnection,
		addConnection,
		addConnections,
		deleteConnectionById,
		getBlockById,
		addBlock,
		addBlocks,
		replaceBlocks,
		deleteBlock,
		deleteBlocks,
		addBlocksAndConnections,
		updateBlockPositionByIndex,
		updateBlock,
		rollbackBlockUpdate,
		deleteBlockById,
		transformEventToPoint,
		setMovingBlock,
		resetMovingBlock,
		setGestureBlocks,
		resetGestureBlocks,
		setGroupDragOffset,
		resetGroupDragOffset,
		setHistoryHandlers,
		setPortOffsetByBlockId,
		touchPortsGeometry,
		translateBlockGeometry,
		translateBlocksGeometry,
		purgeBlockGeometry,
		purgeBlockGeometryExcept,
		updatePort,
		updatePortRect,
		updateBlockRectById,
		updatePortSegmentSizes,
		setSelectionActive,
		setSelectionWorldRect,
		startAutoScroll: autoScroll.start,
		stopAutoScroll: autoScroll.stop,
		updateMousePosition: autoScroll.updateMousePosition,
		setCamera,
		transformMouseEventToPoint,
		snapValue,
		snapPoint,
	};
}
