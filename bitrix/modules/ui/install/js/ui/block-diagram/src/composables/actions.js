import { toValue, toRaw, markRaw } from 'ui.vue3';
import { PORT_POSITION } from '../constants';
import { commandToArray } from '../utils';
import { useAutoScroll } from './autoscroll';
import { HandlerOptions } from './history';
import type {
	DiagramBlockId,
	DiagramBlock,
	DiagramConnectionId,
	DiagramConnection,
	DiagramAddConnection,
	DiagramPortId,
	Point,
} from '../types';

export type UseActions = {
	setState: () => void,
	setUnmountedBlocks: (newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]) => void,
	blockMounted: (blockId: DiagramBlockId) => void,
	setUnmountedPorts: (newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]) => void,
	portMounted: (blockId: DiagramBlockId, portId: DiagramPortId) => void,
	setConnectionsOffsets: (connections: DiagramConnection[]) => void,
	setHistoryBlocksCurrentState: (blocks: DiagramBlock[]) => void,
	setHistoryConnectionsCurrentState: (connections: DiagramConnection[]) => void,
	isExistConnection: (connection: DiagramConnection) => boolean,
	addConnection: (connection: DiagramAddConnection) => void,
	deleteConnectionById: (connectionId: DiagramConnectionId) => void,
	addBlock: (block: DiagramBlock) => void,
	updateBlockPositionByIndex: (index: number, x: number, y: number) => void,
	updateBlock: (newBlock: DiagramBlock) => void,
	deleteBlockById: (blockId: DiagramBlockId) => void,
	transformEventToPoint: (point: { clientX: number, clientY: number }) => Point,
	setMovingBlock: (block: DiagramBlock) => void,
	updateMovingBlockPosition: (x: number, y: number) => void,
	resetMovingBlock: () => void,
	setHistoryHandlers: (HandlerOptions) => void,
	setPortOffsetByBlockId: (blockId: string, offsets: { x: number, y: number }) => void;
};

/* eslint-disable no-param-reassign */
// eslint-disable-next-line max-lines-per-function
export function useActions({ state, getters, hooks }): UseActions
{
	function setState(options): void
	{
		state.blocks = toValue(options.blocks);
		state.connections = toValue(options.connections);
		state.transformX = options.transform.x;
		state.transformY = options.transfrom.y;
		state.zoom = toValue(options.zoom);
	}

	function setUnmountedBlocks(newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]): void
	{
		const oldBlockIdsMap = new Set(oldBlocks.map((block) => block.id));
		const arrWaitedBlockIds = newBlocks
			.filter((block) => !oldBlockIdsMap.has(block.id))
			.map((block) => block.id);

		state.waitAllBlocksMounted = Promise.withResolvers();
		state.waitedBlockIds = new Set(arrWaitedBlockIds);
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

	function setUnmountedPorts(newBlocks: DiagramBlock[], oldBlocks: DiagramBlock[]): void
	{
		const oldBlockPortsIds = oldBlocks.reduce((accMap, block) => {
			block.ports.forEach((port) => accMap.add(`${block.id}_${port.id}`));

			return accMap;
		}, new Set());

		const arrNewBlockPortIds = newBlocks
			.flatMap((block) => block.ports.map((port) => `${block.id}_${port.id}`))
			.filter((blockPortId) => !oldBlockPortsIds.has(blockPortId));
		state.waitedBlockPortsIds = new Set(arrNewBlockPortIds);

		state.waitAllPortsMounted = Promise.withResolvers();
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

		state.connectionsOffsetMap = connections.reduce((accMap, connection) => {
			const {
				id,
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId,
			} = connection;

			accMap[sourceBlockId] = sourceBlockId in accMap
				? accMap[sourceBlockId]
				: {};
			accMap[sourceBlockId][sourcePortId] = sourcePortId in accMap[sourceBlockId]
				? accMap[sourceBlockId][sourcePortId]
				: {};
			accMap[targetBlockId] = targetBlockId in accMap
				? accMap[targetBlockId]
				: {};
			accMap[targetBlockId][targetPortId] = targetPortId in accMap[targetBlockId]
				? accMap[targetBlockId][targetPortId]
				: {};

			const sourceConnectionsCount = Object.keys(accMap[sourceBlockId][sourcePortId]).length + 1;
			const targetConnectionsCount = Object.keys(accMap[targetBlockId][targetPortId]).length + 1;

			accMap[sourceBlockId][sourcePortId][id] = {
				firstSegmentSize: sourceConnectionsCount * connectionOffset,
				secondSegmentSize: connectionBendOffset * connectionOffset,
				secondSegmentOrder: sourceConnectionsCount,
			};

			accMap[targetBlockId][targetPortId][id] = {
				firstSegmentSize: targetConnectionsCount * connectionOffset,
				secondSegmentSize: connectionBendOffset * connectionOffset,
				secondSegmentOrder: targetConnectionsCount,
			};

			return accMap;
		}, {});
	}

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

	const deleteConnectionById = (connectionId: DiagramConnectionId): void => {
		const connections = state.connections
			.filter((connection) => connection.id !== connectionId);

		hooks.changedConnections.trigger(
			commandToArray.commandReplace(connections),
		);
		hooks.deleteConnection.trigger(connectionId);
	};

	const deleteConnectionByBlockIdAndPortId = (blockId: DiagramBlockId, portId: DiagramPortId): void => {
		const block = state.blocks.find((stateBlock) => stateBlock.id === blockId);

		if (!block)
		{
			return;
		}

		const portIdMap = new Set(
			[
				...(block.ports?.input ?? []),
				...(block.ports?.output ?? []),
			].map((port) => port.id),
		);
		const newConnections = state.connections.filter((connection) => {
			const {
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId,
			} = connection;
			const isSource = sourceBlockId === blockId && portIdMap.has(sourcePortId);
			const isTarget = targetBlockId === blockId && portIdMap.has(targetPortId);

			return !isSource && !isTarget;
		});

		hooks.changedConnections.trigger(
			commandToArray.commandReplace(newConnections),
		);
	};

	const deleteBlockById = (blockId: DiagramBlockId): void => {
		const blockIndex = state.blocks.findIndex((block) => block.id === blockId);

		if (blockIndex === -1)
		{
			return;
		}

		deleteConnectionByBlockIdAndPortId(blockId);

		hooks.changedBlocks.trigger(
			commandToArray.commandDeleteByIndex(blockIndex),
		);
		hooks.deleteBlock.trigger(blockId);
	};

	const addBlock = (block: DiagramBlock): void => {
		hooks.changedBlocks.trigger(
			commandToArray.commandPush(block),
		);
		hooks.addBlock.trigger(block);
	};

	const updateBlockPositionByIndex = (index: number, x: number, y: nubmer): void => {
		state.blocks[index].position.x = x;
		state.blocks[index].position.y = y;
	};

	const updateBlock = (newBlock: DiagramBlock): void => {
		const blockIndex = state.blocks.findIndex((block) => block.id === newBlock.id);

		if (blockIndex === -1)
		{
			return;
		}

		hooks.changedBlocks.trigger(
			commandToArray.commandUpdateByIndex(blockIndex, newBlock),
		);
		hooks.updateBlock.trigger(newBlock);
	};

	const transformEventToPoint = (point: { clientX: number, clientY: number }): Point => {
		let transformedX: number = Math.round(point.clientX / toValue(state.zoom));
		let transformedY: number = Math.round(point.clientY / toValue(state.zoom));

		const { top, left } = toValue(state.blockDiagramRef)?.getBoundingClientRect() ?? { top: 0, left: 0 };

		transformedX -= Math.round(left / toValue(state.zoom));
		transformedY -= Math.round(top / toValue(state.zoom));

		return { x: transformedX, y: transformedY };
	};

	const setMovingBlock = (block: DiagramBlock): void => {
		state.movingBlock = toRaw({ ...block });
		const movingConnections = [];

		block.ports.forEach((port) => {
			const connections = state.connections.filter((connection) => {
				const {
					targetBlockId,
					targetPortId,
					sourceBlockId,
					sourcePortId,
				} = connection;
				const isTarget = targetBlockId === block.id && targetPortId === port.id;
				const isSource = sourceBlockId === block.id && sourcePortId === port.id;

				return isTarget || isSource;
			});

			movingConnections.push(...connections);
		});

		state.movingConnections = movingConnections;
	};

	const updateMovingBlockPosition = (x: number, y: number): void => {
		state.movingBlock.position.x = x;
		state.movingBlock.position.y = y;
	};

	const updateBlockRectById = (blockId: DiagramBlockId, rect): void => {
		state.blocksRectMap[blockId] = {
			...state.blocksRectMap[blockId],
			...rect,
		};
	};

	const resetMovingBlock = (): void => {
		state.movingBlock = null;
		state.movingConnections = [];
	};

	const setHistoryHandlers = ({
		snapshotHandler: newSnapshotHandler = null,
		revertHandler: newRevertHandler = null,
	}: HandlerOptions): void => {
		state.snapshotHandler = newSnapshotHandler || state.snapshotHandler;
		state.revertHandler = newRevertHandler || state.revertHandler;
	};

	const setPortOffsetByBlockId = (blockId: string, offsets: { x: number, y: number }): void => {
		const ports = toValue(state.portsRectMap)?.[blockId] ?? {};

		Object.entries(ports)
			.forEach(([id, portRect]) => {
				ports[id].x = portRect.x - offsets.x;
				ports[id].y = portRect.y - offsets.y;
			});
	};

	const updateBlockRect = (blockId: DiagramBlockId): void => {
		const {
			blockElMap,
			blocksRectMap,
			zoom,
			transformX,
			transformY,
			blockDiagramLeft,
			blockDiagramTop,
			boxIntersection,
			blocks,
		} = state;
		const {
			x = 0,
			y = 0,
			width = 0,
			height = 0,
		} = toValue(blockElMap).get(toValue(blockId))?.getBoundingClientRect() ?? {};

		blocksRectMap[toValue(blockId)] = {
			x: (x / toValue(zoom)) + toValue(transformX) - (toValue(blockDiagramLeft) / toValue(zoom)),
			y: (y / toValue(zoom)) + toValue(transformY) - (toValue(blockDiagramTop) / toValue(zoom)),
			width,
			height,
		};
		boxIntersection?.update(toValue(blockId), {
			width: width / zoom,
			height: height / zoom,
		});
		const block = toValue(blocks).find((b) => b.id === toValue(blockId));
		block.dimensions.width = width / zoom;
		block.dimensions.height = height / zoom;
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
			blockDiagramLeft,
			blockDiagramTop,
			zoom,
			transformX,
			transformY,
		} = state;
		const hasBlock = toValue(portsElMap).has(blockId);
		const hasPort = hasBlock && toValue(portsElMap).get(blockId).has(portId);

		if (!hasBlock || !hasPort)
		{
			return;
		}

		const {
			x = 0,
			y = 0,
			width = 0,
			height = 0,
		} = portsElMap.get(blockId)?.get(portId)?.getBoundingClientRect() ?? {};

		portsRectMap[blockId][portId].x = (x / zoom) + toValue(transformX) - (toValue(blockDiagramLeft) / zoom);
		portsRectMap[blockId][portId].y = (y / zoom) + toValue(transformY) - (toValue(blockDiagramTop) / zoom);
		portsRectMap[blockId][portId].width = width;
		portsRectMap[blockId][portId].height = height;
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

	const updateTree = (blocks: Array<DiagramBlock>) => {
		toValue(state.boxIntersection).updateTree(blocks);
	};

	const calculateIntersectedBlockIds = () => {
		const {
			transformX,
			transformY,
			zoom,
			canvasWidth,
			canvasHeight,
			boxIntersection,
		} = state;
		boxIntersection.calculateIntersectedBlockIds({
			transformX,
			transformY,
			zoom,
			width: canvasWidth,
			height: canvasHeight,
		});
	};

	const updateBlockRectangle = (blockId: DiagramBlockId, rect: Partial<DOMRect>) => {
		toValue(state.boxIntersection).updateRectangle(blockId, rect);
	};

	return {
		setState,
		setConnectionsOffsets,
		setHistoryBlocksCurrentState,
		setHistoryConnectionsCurrentState,
		setUnmountedBlocks,
		blockMounted,
		setUnmountedPorts,
		portMounted,
		updateCanvasTransform,
		isExistConnection,
		addConnection,
		deleteConnectionById,
		addBlock,
		updateBlockPositionByIndex,
		updateBlock,
		deleteBlockById,
		transformEventToPoint,
		setMovingBlock,
		updateMovingBlockPosition,
		resetMovingBlock,
		setHistoryHandlers,
		setPortOffsetByBlockId,
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
		updateTree,
		updateBlockRectangle,
		calculateIntersectedBlockIds,
	};
}
