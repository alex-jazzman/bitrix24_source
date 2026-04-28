import { computed, toValue } from 'ui.vue3';
import { BLOCK_GROUP_DEFAULT_NAME, CONNECTION_GROUP_DEFAULT_NAME } from '../constants';
import type {
	GroupedBlocks,
	BlockGroupNames,
	GroupedConnections,
	ConnectionGroupNames,
	Transform,
} from '../types';

export type UseGetters = {
	transform: Transform;
	canvasId: string | null;
	groupedBlocks: GroupedBlocks;
	blockGroupNames: BlockGroupNames;
	groupedConnections: GroupedConnections;
	connectionGroupNames: ConnectionGroupNames;
	isAnimate: boolean;
	isDisabledBlockDiagram: boolean;
	isMakeNewConnection: boolean;
};

export function useGetters(state): UseGetters
{
	const transform = computed((): Transform => ({
		x: state.transformX,
		y: state.transformY,
		zoom: state.zoom,
		viewportX: state.viewportX,
		viewportY: state.viewportY,
	}));

	const canvasId = computed((): string | null => {
		return state.canvasRef?.canvasId ?? null;
	});

	const isMakeNewConnection = computed((): boolean => {
		return state.newConnection !== null;
	});

	const groupedBlocks = computed((): GroupedBlocks => {
		return state.blocks
			.reduce((acc, block) => {
				if (state.boxIntersection)
				{
					const intersectedBlocksIds = state.boxIntersection.intersectedBlocksIds;
					if (!intersectedBlocksIds.value.has(block.id))
					{
						return acc;
					}
				}

				const type = block?.type ?? BLOCK_GROUP_DEFAULT_NAME;

				if (type in acc)
				{
					acc[type] = [...acc[type], block];
				}
				else
				{
					acc[type] = [block];
				}

				return acc;
			}, { [BLOCK_GROUP_DEFAULT_NAME]: [] });
	});

	const blockGroupNames = computed((): BlockGroupNames => {
		return Object.keys(toValue(groupedBlocks));
	});

	const groupedConnections = computed((): GroupedConnections => {
		return state.connections
			.reduce((acc, connection) => {
				const type = connection?.type ?? CONNECTION_GROUP_DEFAULT_NAME;

				if (type in acc)
				{
					acc[type] = [...acc[type], connection];
				}
				else
				{
					acc[type] = [connection];
				}

				return acc;
			}, { [CONNECTION_GROUP_DEFAULT_NAME]: [] });
	});

	const connectionGroupNames = computed((): ConnectionGroupNames => {
		return Object.keys(toValue(groupedConnections));
	});

	const isAnimate = computed((): boolean => {
		return state.animationQueue !== null;
	});

	const isBoxIntersection = computed((): boolean => {
		return state.boxIntersection !== null;
	});

	const isDisabledBlockDiagram = computed((): boolean => {
		return state.isDisabled || toValue(isAnimate);
	});

	const connectionOffsets = computed(() => {
		return state.connections.reduce((connectionsMap, connection) => {
			const {
				sourceBlockId,
				sourcePortId,
			} = connection;

			const { height: blockHeight = 0, y: blockTop = 0 } = toValue(state.blocksRectMap)?.[sourceBlockId] ?? {};
			const { y: portTop = 0 } = toValue(state.portsRectMap)?.[sourceBlockId]?.[sourcePortId] ?? {};

			// state.blocksRectMap
			// state.portsRectMap

			connectionsMap[connection.id] = {
				offsetDown: blockHeight - (Math.abs(portTop - blockTop) + 9),
			};

			return connectionsMap;
		}, {});
	});

	return {
		transform,
		canvasId,
		groupedBlocks,
		blockGroupNames,
		groupedConnections,
		connectionGroupNames,
		isAnimate,
		isBoxIntersection,
		isDisabledBlockDiagram,
		isMakeNewConnection,
		connectionOffsets,
	};
}
