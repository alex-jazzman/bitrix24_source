import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { getBeziePath, getSmoothStepPath, BEZIER_DIR, distance } from '../utils';
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

const MIN_DISTANCE_DISPLAY_BIZIER_LINE = 100;

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

	const connectionPortsPosition = computed((): ConnectionPortPosition | null => {
		const {
			id: connectionId,
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

		const hasManyConnectionSourcePort = Object.keys(
			toValue(connectionsOffsetMap)?.[sourceBlockId]?.[sourcePortId] ?? {},
		).length > 1;

		const hasManyConnectionTargetPort = Object.keys(
			toValue(connectionsOffsetMap)?.[targetBlockId]?.[targetPortId] ?? {},
		).length > 1;

		const {
			firstSegmentSize: sourceConnectionFirstSegmentSize = 0,
			secondSegmentOrder: sourceSecondSegmentOrder = 0,
		} = toValue(connectionsOffsetMap)
			?.[sourceBlockId]
			?.[sourcePortId]
			?.[connectionId] ?? {};
		const {
			firstSegmentSize: targetConnectionFirstSegmentSize = 0,
			secondSegmentOrder: targetSecondSegmentOrder = 0,
		} = toValue(connectionsOffsetMap)
			?.[targetBlockId]
			?.[targetPortId]
			?.[connectionId] ?? {};
		const {
			x: sourceX,
			y: sourceY,
			width: sourceWidth,
			height: sourceHeight,
			position: sourcePosition,
			firstSegmentSize: sourceFirstSegmentSize,
			secondSegmentSize: sourceSecondSegmentSize,
			secondSegmentSizeWithoutOffset: sourceSecondSegmentSizeWithoutOffset,
		} = toValue(portsRectMap)[sourceBlockId][sourcePortId];
		const {
			x: targetX,
			y: targetY,
			width: targetWidth,
			height: targetHeight,
			position: targetPosition,
			firstSegmentSize: targetFirstSegmentSize,
			secondSegmentSize: targetSecondSegmentSize,
			secondSegmentSizeWithoutOffset: targetSecondSegmentSizeWithoutOffset,
		} = toValue(portsRectMap)[targetBlockId][targetPortId];

		return {
			sourcePort: {
				x: sourceX + (sourceWidth / 2),
				y: sourceY + (sourceHeight / 2),
				position: sourcePosition,
				firstSegmentSize: hasManyConnectionSourcePort
					? sourceConnectionFirstSegmentSize
					: sourceFirstSegmentSize,
				secondSegmentSize: hasManyConnectionSourcePort
					? sourceSecondSegmentSizeWithoutOffset + (toValue(connectionBendOffset) * sourceSecondSegmentOrder)
					: sourceSecondSegmentSize,
			},
			targetPort: {
				x: targetX + (targetWidth / 2),
				y: targetY + (targetHeight / 2),
				position: targetPosition,
				firstSegmentSize: hasManyConnectionTargetPort
					? targetConnectionFirstSegmentSize
					: targetFirstSegmentSize,
				secondSegmentSize: hasManyConnectionTargetPort
					? targetSecondSegmentSizeWithoutOffset + (toValue(connectionBendOffset) * targetSecondSegmentOrder)
					: targetSecondSegmentSize,
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

		const isVerticalDirection = sourcePosition !== targetPosition
			&& ([PORT_POSITION.TOP, PORT_POSITION.BOTTOM]).includes(sourcePosition)
			&& ([PORT_POSITION.TOP, PORT_POSITION.BOTTOM]).includes(targetPosition);

		const isHorizontalDirection = sourcePosition !== targetPosition
			&& ([PORT_POSITION.LEFT, PORT_POSITION.RIGHT]).includes(sourcePosition)
			&& ([PORT_POSITION.LEFT, PORT_POSITION.RIGHT]).includes(targetPosition);

		const { points } = getSmoothStepPath({
			sourceX: toValue(connectionPortsPosition).sourcePort.x,
			sourceY: toValue(connectionPortsPosition).sourcePort.y,
			sourcePosition,
			targetX: toValue(connectionPortsPosition).targetPort.x,
			targetY: toValue(connectionPortsPosition).targetPort.y,
			targetPosition,
			borderRadius: toValue(connectionBorderRadius),
			offset: toValue(connectionOffset),
		});
		const [p1, p2, p3, p4, p5, p6] = points;
		const isDisplayBezierLineByDistance = distance(p1, p6) < MIN_DISTANCE_DISPLAY_BIZIER_LINE;

		const isXConsistOfThreeParts = p1.x === p2.x
			&& p1.x === p3.x
			&& p4.x === p5.x
			&& p4.x === p6.x;
		const isYConsistOfThreeParts = p1.y === p2.y
			&& p1.y === p3.y
			&& p4.y === p5.y
			&& p4.y === p6.y;

		if (
			isDisplayBezierLineByDistance
			|| (isXConsistOfThreeParts && isVerticalDirection)
			|| (isYConsistOfThreeParts && isHorizontalDirection)
		)
		{
			return getBeziePath(
				toValue(connectionPortsPosition).sourcePort,
				toValue(connectionPortsPosition).targetPort,
				isVerticalDirection ? BEZIER_DIR.VERTICAL : BEZIER_DIR.HORIZONTAL,
			);
		}

		const {
			x: sourceX,
			y: sourceY,
			firstSegmentSize: sourceFirtsSegmentSize,
			secondSegmentSize,
		} = toValue(connectionPortsPosition).sourcePort;
		const {
			x: targetX,
			y: targetY,
			firstSegmentSize: targetFirstSegmentSize,
		} = toValue(connectionPortsPosition).targetPort;

		const firstSegmentTargetX = isHorizontalDirection
			? (sourceX + targetX) / 2
			: sourceX + secondSegmentSize;
		const firstSegmentTargetY = isHorizontalDirection
			? sourceY + secondSegmentSize
			: (sourceY + targetY) / 2;

		const firstSegmentPath = getSmoothStepPath({
			sourceX,
			sourceY,
			targetX: firstSegmentTargetX,
			targetY: firstSegmentTargetY,
			sourcePosition,
			targetPosition: isHorizontalDirection ? PORT_POSITION.RIGHT : PORT_POSITION.BOTTOM,
			borderRadius: toValue(connectionBorderRadius),
			offset: sourceFirtsSegmentSize,
		});

		const secondSegmentPath = getSmoothStepPath({
			sourceX: firstSegmentTargetX,
			sourceY: firstSegmentTargetY,
			targetX,
			targetY,
			sourcePosition: isHorizontalDirection ? PORT_POSITION.LEFT : PORT_POSITION.TOP,
			targetPosition,
			borderRadius: toValue(connectionBorderRadius),
			offset: targetFirstSegmentSize,
		});

		return {
			path: `${firstSegmentPath.path} ${secondSegmentPath.path}`,
			center: {
				x: firstSegmentTargetX,
				y: firstSegmentTargetY,
			},
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
