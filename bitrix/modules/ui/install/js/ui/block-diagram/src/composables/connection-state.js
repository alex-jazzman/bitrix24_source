import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { resolveConnectionPortsPosition, resolveRenderedConnectionRoute } from '../utils';
import type { PathInfo } from '../utils';
import type { DiagramConnection, DiagramConnectionViewType, DiagramPortPosition } from '../../types';

type PortPosition = {
	x: number;
	y: number;
	position: DiagramPortPosition;
	firstSegmentSize: number;
	secondSegmentSize: number;
};

type ConnectionPortPosition = {
	sourcePort: PortPosition;
	targetPort: PortPosition;
};

type UseConnectionState = {
	connectionPortsPosition: ConnectionPortPosition | null;
	connectionPathInfo: PathInfo;
	isDisabled: boolean;
	isElevatedConnection: boolean;
};

export type UseConnectionStateOptions = {
	connection: DiagramConnection;
	viewType: DiagramConnectionViewType;
};

const DEFAULT_PATH_INFO: PathInfo = {
	path: '',
	center: {
		x: 0,
		y: 0,
	},
};

// eslint-disable-next-line max-lines-per-function
export function useConnectionState(connection: DiagramConnection): UseConnectionState
{
	const {
		portsRectMap,
		isDisabledBlockDiagram,
		connectionsOffsetMap,
		connectionOffset,
		connectionBendOffset,
		connectionBorderRadius,
		gestureBlockIds,
		isGestureElevated,
	} = useBlockDiagram();

	const resolveRouteOptions = () => ({
		connection: toValue(connection),
		portsRectMap: toValue(portsRectMap),
		connectionsOffsetMap: toValue(connectionsOffsetMap),
		bendOffset: toValue(connectionBendOffset),
		offset: toValue(connectionOffset),
		borderRadius: toValue(connectionBorderRadius),
	});

	const connectionPortsPosition = computed((): ConnectionPortPosition | null => {
		return resolveConnectionPortsPosition(resolveRouteOptions());
	});

	const connectionPathInfo = computed((): PathInfo => {
		return resolveRenderedConnectionRoute(resolveRouteOptions()) ?? DEFAULT_PATH_INFO;
	});

	const isDisabled = computed((): boolean => {
		return toValue(isDisabledBlockDiagram);
	});

	// One end inside the raised composition is enough, so a connection leaving it for an outside node
	// goes up too: raising only the inner ones hid where the node being dragged leads, and losing
	// sight of that costs more than a line lying over a stray block on its way there. Only a
	// connection with both ends outside stays where it is. Read from the two values that change at
	// the press and at the close - the route is computed apart from this and nothing that moves
	// frame by frame reaches here.
	const isElevatedConnection = computed((): boolean => {
		if (toValue(isGestureElevated) !== true)
		{
			return false;
		}

		const blockIds = toValue(gestureBlockIds);

		if (blockIds.size === 0)
		{
			return false;
		}

		const { sourceBlockId, targetBlockId } = toValue(connection);

		return blockIds.has(sourceBlockId) || blockIds.has(targetBlockId);
	});

	return {
		connectionPortsPosition,
		connectionPathInfo,
		isDisabled,
		isElevatedConnection,
	};
}
