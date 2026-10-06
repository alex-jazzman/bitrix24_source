import { PORT_POSITION } from '../constants';
import {
	BEZIER_DIR,
	distance,
	getBeziePath,
	getSmoothStepPath,
} from './diagram';

const MIN_DISTANCE_DISPLAY_BEZIER_LINE = 100;
const PORT_POSITIONS = Object.values(PORT_POSITION);

function isFiniteNumber(value)
{
	return Number.isFinite(value);
}

function resolvePortPosition(options)
{
	const {
		connectionId,
		blockId,
		portId,
		portsRectMap,
		connectionsOffsetMap,
		bendOffset,
	} = options;
	const portRect = portsRectMap?.[blockId]?.[portId];

	if (portRect === null || typeof portRect !== 'object')
	{
		return null;
	}

	const {
		x,
		y,
		width,
		height,
		position,
		firstSegmentSize,
		secondSegmentSize,
		secondSegmentSizeWithoutOffset,
	} = portRect;

	if (
		!PORT_POSITIONS.includes(position)
		|| ![x, y, width, height].every(isFiniteNumber)
	)
	{
		return null;
	}

	const portOffsets = connectionsOffsetMap?.[blockId]?.[portId] ?? {};
	const hasManyConnections = Object.keys(portOffsets).length > 1;
	const {
		firstSegmentSize: connectionFirstSegmentSize = 0,
		secondSegmentOrder = 0,
	} = portOffsets?.[connectionId] ?? {};
	const resolvedFirstSegmentSize = hasManyConnections
		? connectionFirstSegmentSize
		: firstSegmentSize;
	const resolvedSecondSegmentSize = hasManyConnections
		? secondSegmentSizeWithoutOffset + (bendOffset * secondSegmentOrder)
		: secondSegmentSize;
	const centerX = x + (width / 2);
	const centerY = y + (height / 2);

	if (
		!isFiniteNumber(resolvedFirstSegmentSize)
		|| !isFiniteNumber(resolvedSecondSegmentSize)
		|| !isFiniteNumber(centerX)
		|| !isFiniteNumber(centerY)
	)
	{
		return null;
	}

	return {
		x: centerX,
		y: centerY,
		position,
		firstSegmentSize: resolvedFirstSegmentSize,
		secondSegmentSize: resolvedSecondSegmentSize,
	};
}

function isVerticalPosition(position)
{
	return position === PORT_POSITION.TOP || position === PORT_POSITION.BOTTOM;
}

function isHorizontalPosition(position)
{
	return position === PORT_POSITION.LEFT || position === PORT_POSITION.RIGHT;
}

export function resolveConnectionPortsPosition(options)
{
	const {
		connection,
		portsRectMap,
		connectionsOffsetMap,
		bendOffset,
	} = options;

	if (connection === null || typeof connection !== 'object')
	{
		return null;
	}

	const {
		id: connectionId,
		sourceBlockId,
		sourcePortId,
		targetBlockId,
		targetPortId,
	} = connection;
	const sourcePort = resolvePortPosition({
		connectionId,
		blockId: sourceBlockId,
		portId: sourcePortId,
		portsRectMap,
		connectionsOffsetMap,
		bendOffset,
	});
	const targetPort = resolvePortPosition({
		connectionId,
		blockId: targetBlockId,
		portId: targetPortId,
		portsRectMap,
		connectionsOffsetMap,
		bendOffset,
	});

	if (sourcePort === null || targetPort === null)
	{
		return null;
	}

	return { sourcePort, targetPort };
}

export function resolveRenderedConnectionRoute(options)
{
	const {
		offset,
		borderRadius,
	} = options;

	if (!isFiniteNumber(offset) || !isFiniteNumber(borderRadius))
	{
		return null;
	}

	const portsPosition = resolveConnectionPortsPosition(options);

	if (portsPosition === null)
	{
		return null;
	}

	return resolveConnectionRoute({
		...portsPosition,
		offset,
		borderRadius,
	});
}

export function resolveConnectionRoute(options)
{
	const {
		sourcePort,
		targetPort,
		offset,
		borderRadius,
	} = options;
	const sourcePosition = sourcePort.position;
	const targetPosition = targetPort.position;
	const isVerticalDirection = sourcePosition !== targetPosition
		&& isVerticalPosition(sourcePosition)
		&& isVerticalPosition(targetPosition);
	const isHorizontalDirection = sourcePosition !== targetPosition
		&& isHorizontalPosition(sourcePosition)
		&& isHorizontalPosition(targetPosition);

	const initialPath = getSmoothStepPath({
		sourceX: sourcePort.x,
		sourceY: sourcePort.y,
		sourcePosition,
		targetX: targetPort.x,
		targetY: targetPort.y,
		targetPosition,
		borderRadius,
		offset,
	});
	const [p1, p2, p3, p4, p5, p6] = initialPath.points;
	const isDisplayBezierLineByDistance = distance(p1, p6) < MIN_DISTANCE_DISPLAY_BEZIER_LINE;
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
			sourcePort,
			targetPort,
			isVerticalDirection ? BEZIER_DIR.VERTICAL : BEZIER_DIR.HORIZONTAL,
		);
	}

	const firstSegmentTargetX = isHorizontalDirection
		? (sourcePort.x + targetPort.x) / 2
		: sourcePort.x + sourcePort.secondSegmentSize;
	const firstSegmentTargetY = isHorizontalDirection
		? sourcePort.y + sourcePort.secondSegmentSize
		: (sourcePort.y + targetPort.y) / 2;
	const firstSegmentPath = getSmoothStepPath({
		sourceX: sourcePort.x,
		sourceY: sourcePort.y,
		targetX: firstSegmentTargetX,
		targetY: firstSegmentTargetY,
		sourcePosition,
		targetPosition: isHorizontalDirection ? PORT_POSITION.RIGHT : PORT_POSITION.BOTTOM,
		borderRadius,
		offset: sourcePort.firstSegmentSize,
	});
	const secondSegmentPath = getSmoothStepPath({
		sourceX: firstSegmentTargetX,
		sourceY: firstSegmentTargetY,
		targetX: targetPort.x,
		targetY: targetPort.y,
		sourcePosition: isHorizontalDirection ? PORT_POSITION.LEFT : PORT_POSITION.TOP,
		targetPosition,
		borderRadius,
		offset: targetPort.firstSegmentSize,
	});

	return {
		path: `${firstSegmentPath.path} ${secondSegmentPath.path}`,
		center: {
			x: firstSegmentTargetX,
			y: firstSegmentTargetY,
		},
		primitives: [
			...firstSegmentPath.primitives,
			...secondSegmentPath.primitives,
		],
	};
}
