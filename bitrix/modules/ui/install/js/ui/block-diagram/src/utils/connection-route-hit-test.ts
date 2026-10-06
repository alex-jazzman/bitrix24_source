const MAX_FLATTEN_DEPTH = 18;

function getEndpointOffsetData(connection, connectionsOffsetMap, endpoint)
{
	const isSource = endpoint === 'source';
	const blockId = isSource ? connection?.sourceBlockId : connection?.targetBlockId;
	const portId = isSource ? connection?.sourcePortId : connection?.targetPortId;
	const portOffsets = connectionsOffsetMap?.[blockId]?.[portId] ?? {};
	const connectionOffset = portOffsets?.[connection?.id] ?? {};

	return {
		connectionCount: Object.keys(portOffsets).length,
		firstSegmentSize: connectionOffset.firstSegmentSize ?? 0,
		secondSegmentOrder: connectionOffset.secondSegmentOrder ?? 0,
	};
}

function getPortGeometryKey(port)
{
	return [
		port?.x,
		port?.y,
		port?.position,
		port?.firstSegmentSize,
		port?.secondSegmentSize,
	];
}

export function createConnectionStructuralSignature(connection)
{
	return JSON.stringify([
		connection?.id ?? null,
		connection?.type ?? null,
		connection?.sourceBlockId ?? null,
		connection?.sourcePortId ?? null,
		connection?.targetBlockId ?? null,
		connection?.targetPortId ?? null,
	]);
}

export function createConnectionRouteCacheKey(options)
{
	const {
		connection,
		portsPosition,
		connectionsOffsetMap,
		offset,
		bendOffset,
		borderRadius,
		zoom,
	} = options;
	const sourceOffset = getEndpointOffsetData(connection, connectionsOffsetMap, 'source');
	const targetOffset = getEndpointOffsetData(connection, connectionsOffsetMap, 'target');
	const sourceGeometry = getPortGeometryKey(portsPosition?.sourcePort);
	const targetGeometry = getPortGeometryKey(portsPosition?.targetPort);
	const numericValues = [
		sourceGeometry[0],
		sourceGeometry[1],
		sourceGeometry[3],
		sourceGeometry[4],
		targetGeometry[0],
		targetGeometry[1],
		targetGeometry[3],
		targetGeometry[4],
		sourceOffset.connectionCount,
		sourceOffset.firstSegmentSize,
		sourceOffset.secondSegmentOrder,
		targetOffset.connectionCount,
		targetOffset.firstSegmentSize,
		targetOffset.secondSegmentOrder,
		offset,
		bendOffset,
		borderRadius,
		zoom,
	];

	if (
		portsPosition?.sourcePort === null
		|| portsPosition?.sourcePort === undefined
		|| portsPosition?.targetPort === null
		|| portsPosition?.targetPort === undefined
		|| !numericValues.every((value) => Number.isFinite(value))
	)
	{
		return null;
	}

	return JSON.stringify([
		connection?.id ?? null,
		connection?.type ?? null,
		connection?.sourceBlockId ?? null,
		connection?.sourcePortId ?? null,
		connection?.targetBlockId ?? null,
		connection?.targetPortId ?? null,
		sourceGeometry,
		targetGeometry,
		[
			sourceOffset.connectionCount,
			sourceOffset.firstSegmentSize,
			sourceOffset.secondSegmentOrder,
		],
		[
			targetOffset.connectionCount,
			targetOffset.firstSegmentSize,
			targetOffset.secondSegmentOrder,
		],
		offset,
		bendOffset,
		borderRadius,
		zoom,
	]);
}

function isFinitePoint(point)
{
	return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

function copyPoint(point)
{
	return { x: point.x, y: point.y };
}

function midpoint(first, second)
{
	return {
		x: first.x / 2 + second.x / 2,
		y: first.y / 2 + second.y / 2,
	};
}

function pointDistance(first, second)
{
	return Math.hypot(second.x - first.x, second.y - first.y);
}

function pointToLineDistance(point, start, end)
{
	const deltaX = end.x - start.x;
	const deltaY = end.y - start.y;
	const lineLength = Math.hypot(deltaX, deltaY);

	if (lineLength === 0)
	{
		return pointDistance(point, start);
	}

	return Math.abs(deltaY * point.x - deltaX * point.y + end.x * start.y - end.y * start.x)
		/ lineLength;
}

function isQuadraticFlatEnough(primitive, tolerance)
{
	const chordLength = pointDistance(primitive.start, primitive.end);
	const controlPolygonLength = pointDistance(primitive.start, primitive.control)
		+ pointDistance(primitive.control, primitive.end);

	return pointToLineDistance(primitive.control, primitive.start, primitive.end) <= tolerance
		&& controlPolygonLength - chordLength <= tolerance;
}

function isCubicFlatEnough(primitive, tolerance)
{
	const chordLength = pointDistance(primitive.start, primitive.end);
	const controlPolygonLength = pointDistance(primitive.start, primitive.control1)
		+ pointDistance(primitive.control1, primitive.control2)
		+ pointDistance(primitive.control2, primitive.end);

	return Math.max(
		pointToLineDistance(primitive.control1, primitive.start, primitive.end),
		pointToLineDistance(primitive.control2, primitive.start, primitive.end),
	) <= tolerance
		&& controlPolygonLength - chordLength <= tolerance;
}

function appendQuadraticSegments(primitive, tolerance, depth, segments)
{
	if (depth >= MAX_FLATTEN_DEPTH || isQuadraticFlatEnough(primitive, tolerance))
	{
		segments.push({
			start: copyPoint(primitive.start),
			end: copyPoint(primitive.end),
		});

		return;
	}

	const startControl = midpoint(primitive.start, primitive.control);
	const controlEnd = midpoint(primitive.control, primitive.end);
	const split = midpoint(startControl, controlEnd);

	appendQuadraticSegments({
		start: primitive.start,
		control: startControl,
		end: split,
	}, tolerance, depth + 1, segments);
	appendQuadraticSegments({
		start: split,
		control: controlEnd,
		end: primitive.end,
	}, tolerance, depth + 1, segments);
}

function appendCubicSegments(primitive, tolerance, depth, segments)
{
	if (depth >= MAX_FLATTEN_DEPTH || isCubicFlatEnough(primitive, tolerance))
	{
		segments.push({
			start: copyPoint(primitive.start),
			end: copyPoint(primitive.end),
		});

		return;
	}

	const startControl = midpoint(primitive.start, primitive.control1);
	const firstSecondControl = midpoint(primitive.control1, primitive.control2);
	const secondControlEnd = midpoint(primitive.control2, primitive.end);
	const firstMiddle = midpoint(startControl, firstSecondControl);
	const secondMiddle = midpoint(firstSecondControl, secondControlEnd);
	const split = midpoint(firstMiddle, secondMiddle);

	appendCubicSegments({
		start: primitive.start,
		control1: startControl,
		control2: firstMiddle,
		end: split,
	}, tolerance, depth + 1, segments);
	appendCubicSegments({
		start: split,
		control1: secondMiddle,
		control2: secondControlEnd,
		end: primitive.end,
	}, tolerance, depth + 1, segments);
}

function isValidPrimitive(primitive)
{
	if (!isFinitePoint(primitive?.start) || !isFinitePoint(primitive?.end))
	{
		return false;
	}

	if (primitive.type === 'line')
	{
		return true;
	}

	if (primitive.type === 'quadratic')
	{
		return isFinitePoint(primitive.control);
	}

	if (primitive.type === 'cubic')
	{
		return isFinitePoint(primitive.control1) && isFinitePoint(primitive.control2);
	}

	return false;
}

export function flattenConnectionRoute(route, zoom, maxScreenError = 1)
{
	const primitives = Array.isArray(route) ? route : route?.primitives;
	if (
		!Array.isArray(primitives)
		|| !Number.isFinite(zoom)
		|| zoom <= 0
		|| !Number.isFinite(maxScreenError)
		|| maxScreenError <= 0
		|| !primitives.every((primitive) => isValidPrimitive(primitive))
	)
	{
		return [];
	}

	const tolerance = maxScreenError / zoom;
	const segments = [];

	for (const primitive of primitives)
	{
		if (primitive.type === 'line')
		{
			segments.push({
				start: copyPoint(primitive.start),
				end: copyPoint(primitive.end),
			});
		}
		else if (primitive.type === 'quadratic')
		{
			appendQuadraticSegments(primitive, tolerance, 0, segments);
		}
		else
		{
			appendCubicSegments(primitive, tolerance, 0, segments);
		}
	}

	return segments;
}

function normalizeRect(rect)
{
	if (
		!Number.isFinite(rect?.x)
		|| !Number.isFinite(rect?.y)
		|| !Number.isFinite(rect?.width)
		|| !Number.isFinite(rect?.height)
	)
	{
		return null;
	}

	const oppositeX = rect.x + rect.width;
	const oppositeY = rect.y + rect.height;
	if (!Number.isFinite(oppositeX) || !Number.isFinite(oppositeY))
	{
		return null;
	}

	return {
		left: Math.min(rect.x, oppositeX),
		top: Math.min(rect.y, oppositeY),
		right: Math.max(rect.x, oppositeX),
		bottom: Math.max(rect.y, oppositeY),
	};
}

export function expandRect(rect, tolerance)
{
	const normalizedRect = normalizeRect(rect);
	if (!normalizedRect || !Number.isFinite(tolerance) || tolerance < 0)
	{
		return null;
	}

	return {
		x: normalizedRect.left - tolerance,
		y: normalizedRect.top - tolerance,
		width: normalizedRect.right - normalizedRect.left + tolerance * 2,
		height: normalizedRect.bottom - normalizedRect.top + tolerance * 2,
	};
}

function segmentIntersectsRect(start, end, rect)
{
	let minRatio = 0;
	let maxRatio = 1;
	const dimensions = [
		{ start: start.x, delta: end.x - start.x, min: rect.left, max: rect.right },
		{ start: start.y, delta: end.y - start.y, min: rect.top, max: rect.bottom },
	];

	for (const dimension of dimensions)
	{
		if (dimension.delta === 0)
		{
			if (dimension.start < dimension.min || dimension.start > dimension.max)
			{
				return false;
			}

			continue;
		}

		const firstRatio = (dimension.min - dimension.start) / dimension.delta;
		const secondRatio = (dimension.max - dimension.start) / dimension.delta;
		minRatio = Math.max(minRatio, Math.min(firstRatio, secondRatio));
		maxRatio = Math.min(maxRatio, Math.max(firstRatio, secondRatio));

		if (minRatio > maxRatio)
		{
			return false;
		}
	}

	return true;
}

function pointToRectDistance(point, rect)
{
	const deltaX = Math.max(rect.left - point.x, 0, point.x - rect.right);
	const deltaY = Math.max(rect.top - point.y, 0, point.y - rect.bottom);

	return Math.hypot(deltaX, deltaY);
}

function pointToSegmentDistance(point, start, end)
{
	const deltaX = end.x - start.x;
	const deltaY = end.y - start.y;
	const squaredLength = deltaX * deltaX + deltaY * deltaY;

	if (squaredLength === 0)
	{
		return pointDistance(point, start);
	}

	if (!Number.isFinite(squaredLength))
	{
		return Number.POSITIVE_INFINITY;
	}

	const ratio = Math.max(
		0,
		Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / squaredLength),
	);

	return Math.hypot(
		point.x - (start.x + ratio * deltaX),
		point.y - (start.y + ratio * deltaY),
	);
}

function rectToSegmentDistance(rect, segment)
{
	if (segmentIntersectsRect(segment.start, segment.end, rect))
	{
		return 0;
	}

	const corners = [
		{ x: rect.left, y: rect.top },
		{ x: rect.right, y: rect.top },
		{ x: rect.right, y: rect.bottom },
		{ x: rect.left, y: rect.bottom },
	];

	return Math.min(
		pointToRectDistance(segment.start, rect),
		pointToRectDistance(segment.end, rect),
		...corners.map((corner) => pointToSegmentDistance(corner, segment.start, segment.end)),
	);
}

export function distanceBetweenRectAndSegments(rect, segments)
{
	const normalizedRect = normalizeRect(rect);
	if (!normalizedRect || !Array.isArray(segments) || segments.length === 0)
	{
		return Number.POSITIVE_INFINITY;
	}

	let distance = Number.POSITIVE_INFINITY;
	for (const segment of segments)
	{
		if (!isFinitePoint(segment?.start) || !isFinitePoint(segment?.end))
		{
			return Number.POSITIVE_INFINITY;
		}

		distance = Math.min(distance, rectToSegmentDistance(normalizedRect, segment));
	}

	return distance;
}

export function sortConnectionRouteHits(hits, getSignature)
{
	return hits
		.map((hit, index) => ({ hit, index, signature: getSignature(hit) }))
		.sort((first, second) => {
			const distanceDifference = first.hit.distancePx - second.hit.distancePx;
			if (distanceDifference !== 0)
			{
				return distanceDifference;
			}

			if (first.signature < second.signature)
			{
				return -1;
			}

			if (first.signature > second.signature)
			{
				return 1;
			}

			return first.index - second.index;
		})
		.map(({ hit }) => hit)
	;
}
