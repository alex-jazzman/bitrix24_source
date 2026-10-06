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

	return {
		connectionPortsPosition,
		connectionPathInfo,
		isDisabled,
	};
}
