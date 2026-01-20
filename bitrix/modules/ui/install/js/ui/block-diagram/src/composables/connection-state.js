import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { getBeziePath, getSmoothStepPath, BEZIER_DIR } from '../utils';
import { PORT_POSITION } from '../constants';
import type { PathInfo } from '../utils';
import type { DiagramConnection, DiagramConnectionViewType } from '../../types';

type PortPosition = {
	x: number;
	y: number;
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
const SMOOTHSTEP_OFFSET = 30;
const SMOOTHSTEP_BORDER_RADIUS = 10;

// eslint-disable-next-line max-lines-per-function
export function useConnectionState(connection: DiagramConnection): UseConnectionState
{
	const {
		portsRectMap,
		isDisabledBlockDiagram,
	} = useBlockDiagram();

	const connectionPortsPosition = computed((): ConnectionPortPosition | null => {
		const {
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		} = toValue(connection);

		const hasSourceBlockId = sourceBlockId in toValue(portsRectMap);
		const hasSourcePortId = hasSourceBlockId && (sourcePortId in toValue(portsRectMap)[sourceBlockId]);
		const hasTargetBlockId = targetBlockId in toValue(portsRectMap);
		const hasTargetPortId = hasTargetBlockId && (targetPortId in toValue(portsRectMap)[targetBlockId]);

		if (
			!hasSourceBlockId
			|| !hasSourcePortId
			|| !hasTargetBlockId
			|| !hasTargetPortId
		)
		{
			return null;
		}

		const {
			x: sourceX,
			y: sourceY,
			width: sourceWidth,
			height: sourceHeight,
			position: sourcePosition,
		} = toValue(portsRectMap)[sourceBlockId][sourcePortId];
		const {
			x: targetX,
			y: targetY,
			width: targetWidth,
			height: targetHeight,
			position: targetPosition,
		} = toValue(portsRectMap)[targetBlockId][targetPortId];

		return {
			sourcePort: {
				x: sourceX + (sourceWidth / 2),
				y: sourceY + (sourceHeight / 2),
				position: sourcePosition,
			},
			targetPort: {
				x: targetX + (targetWidth / 2),
				y: targetY + (targetHeight / 2),
				position: targetPosition,
			},
		};
	});

	const connectionPathInfo = computed((): PathInfo => {
		if (toValue(connectionPortsPosition) === null)
		{
			return DEFAULT_PATH_INFO;
		}

		const sourcePosition = toValue(connectionPortsPosition).sourcePort.position;
		const targetPosition = toValue(connectionPortsPosition).targetPort.position;

		const isVerticalDirBezier = sourcePosition !== targetPosition
			&& ([PORT_POSITION.TOP, PORT_POSITION.BOTTOM]).includes(sourcePosition)
			&& ([PORT_POSITION.TOP, PORT_POSITION.BOTTOM]).includes(targetPosition);

		const isHorizontalDirBezier = sourcePosition !== targetPosition
			&& ([PORT_POSITION.LEFT, PORT_POSITION.RIGHT]).includes(sourcePosition)
			&& ([PORT_POSITION.LEFT, PORT_POSITION.RIGHT]).includes(targetPosition);

		const { path: smoothStepPath, center, points } = getSmoothStepPath({
			sourceX: toValue(connectionPortsPosition).sourcePort.x,
			sourceY: toValue(connectionPortsPosition).sourcePort.y,
			sourcePosition,
			targetX: toValue(connectionPortsPosition).targetPort.x,
			targetY: toValue(connectionPortsPosition).targetPort.y,
			targetPosition,
			borderRadius: SMOOTHSTEP_BORDER_RADIUS,
			offset: SMOOTHSTEP_OFFSET,
		});
		const [p1, p2, p3, p4, p5, p6] = points;

		const isXConsistOfThreeParts = p1.x === p2.x
			&& p1.x === p3.x
			&& p4.x === p5.x
			&& p4.x === p6.x;
		const isYConsistOfThreeParts = p1.y === p2.y
			&& p1.y === p3.y
			&& p4.y === p5.y
			&& p4.y === p6.y;

		if (
			(isXConsistOfThreeParts && isVerticalDirBezier)
			|| (isYConsistOfThreeParts && isHorizontalDirBezier)
		)
		{
			return getBeziePath(
				toValue(connectionPortsPosition).sourcePort,
				toValue(connectionPortsPosition).targetPort,
				isVerticalDirBezier ? BEZIER_DIR.VERTICAL : BEZIER_DIR.HORIZONTAL,
			);
		}

		return {
			path: smoothStepPath,
			center,
		};
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
