/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue3, main_core, main_popup, main_polyfill_intersectionobserver, ui_iconSet_api_vue) {
	'use strict';

	const CONNECTION_OFFSET = 30;
	const CONNECTION_BEND_OFFSET = 30;
	const CONNECTION_BORDER_RADIUS = 10;

	// Screen distance the pointer has to travel before a press on a block turns into a drag.
	// A press below it stays a selection: with snapping on, treating the shake of a hand as a
	// drag would move a block of an old scheme to the nearest node and dirty the draft.
	const DRAG_START_THRESHOLD = 4;

	// Max never-measured connection ends mounted for measurement per render cycle, so a
	// large off-screen set drains over several frames instead of one long main-thread task.
	const FIRST_MEASURE_BATCH_SIZE = 12;
	const HOOK_NAMES = {
		CHANGED_BLOCKS: 'changedBlocks',
		CHANGED_CONNECTIONS: 'changedConnections',
		START_DRAG_BLOCK: 'startDragBlock',
		MOVE_DRAG_BLOCK: 'moveDragBlock',
		END_DRAG_BLOCK: 'endDragBlock',
		ADD_BLOCK: 'addBlock',
		ADD_BLOCKS: 'addBlocks',
		UPDATE_BLOCK: 'updateBlock',
		DELETE_BLOCK: 'deleteBlock',
		DELETE_BLOCKS: 'deleteBlocks',
		ADD_CONNECTION: 'addConnection',
		ADD_CONNECTIONS: 'addConnections',
		CREATE_CONNECTION: 'createConnection',
		DELETE_CONNECTION: 'deleteConnection',
		BLOCK_TRANSITION_START: 'blockTransitionStart',
		BLOCK_TRANSITION_END: 'blockTransitionEnd',
		CONNECTION_TRANSITION_START: 'connectionTransitionStart',
		CONNECTION_TRANSITION_END: 'connectionTransitionEnd',
		DROP_NEW_BLOCK: 'dropNewBlock',
		HISTORY_NEXT: 'historyNext',
		HISTORY_PREV: 'historyPrev'
	};
	const BLOCK_GROUP_DEFAULT_NAME = 'default';
	const CONNECTION_GROUP_DEFAULT_NAME = 'default';
	const PORT_POSITION = {
		TOP: 'top',
		BOTTOM: 'bottom',
		RIGHT: 'right',
		LEFT: 'left'
	};
	const ANIMATED_TYPES = {
		BLOCK: 'block',
		CONNECTION: 'connection',
		REMOVE_BLOCK: 'remove_block',
		REMOVE_CONNECTION: 'remove_connection'
	};
	const CURSOR_TYPES = {
		EW_RESIZE: 'ew-resize',
		NS_RESIZE: 'ns-resize',
		NWSE_RESIZE: 'nwse-resize',
		NESW_RESIZE: 'nesw-resize'
	};
	const BLOCK_INDEXES = {
		HIGHLITED: 4,
		MOVABLE: 3,
		STANDING: 2};
	const INPUT_TAGS = Object.freeze({
		INPUT: true,
		TEXTAREA: true,
		SELECT: true
	});
	const SOURCE_PORT_STUB_TELEPORT_NAME = 'sourcePortNewConnection';
	const TARGET_PORT_STUB_TELEPORT_NAME = 'targetPortNewConnection';

	const DIR_ACCESSOR_X = 'x';
	const DIR_ACCESSOR_Y = 'y';
	const DIRECTIONS_BY_POSITION = {
		[PORT_POSITION.LEFT]: {
			x: -1,
			y: 0
		},
		[PORT_POSITION.RIGHT]: {
			x: 1,
			y: 0
		},
		[PORT_POSITION.TOP]: {
			x: 0,
			y: -1
		},
		[PORT_POSITION.BOTTOM]: {
			x: 0,
			y: 1
		}
	};
	function getLinePath(start, end) {
		const startPoint = {
			x: start.x,
			y: start.y
		};
		const endPoint = {
			x: end.x,
			y: end.y
		};
		const [x, y] = getConnectionCenter({
			sourceX: startPoint.x,
			sourceY: startPoint.y,
			targetX: endPoint.x,
			targetY: endPoint.y
		});
		return {
			path: `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`,
			center: {
				x,
				y
			},
			primitives: [{
				type: 'line',
				start: startPoint,
				end: endPoint
			}]
		};
	}
	const BEZIER_DIR = {
		VERTICAL: 'vertical',
		HORIZONTAL: 'horizontal'
	};
	function getBeziePath(start, end, dir = BEZIER_DIR.VERTICAL) {
		const startPoint = {
			x: start.x,
			y: start.y
		};
		const endPoint = {
			x: end.x,
			y: end.y
		};
		const midX = (startPoint.x + endPoint.x) / 2;
		const midY = (startPoint.y + endPoint.y) / 2;
		const [centerX, centerY] = getConnectionCenter({
			sourceX: startPoint.x,
			sourceY: startPoint.y,
			targetX: endPoint.x,
			targetY: endPoint.y
		});
		const control1 = dir === BEZIER_DIR.HORIZONTAL ? {
			x: midX,
			y: startPoint.y
		} : {
			x: startPoint.x,
			y: midY
		};
		const control2 = dir === BEZIER_DIR.HORIZONTAL ? {
			x: midX,
			y: endPoint.y
		} : {
			x: endPoint.x,
			y: midY
		};
		const path = [`M ${startPoint.x} ${startPoint.y}`, `C ${control1.x} ${control1.y},`, `${control2.x} ${control2.y},`, `${endPoint.x} ${endPoint.y}`].join(' ');
		return {
			path,
			center: {
				x: centerX,
				y: centerY
			},
			primitives: [{
				type: 'cubic',
				start: startPoint,
				control1,
				control2,
				end: endPoint
			}]
		};
	}
	function transformPoint(point, transform, viewport) {
		let transformedX = Math.round((point.x - transform.x) / transform.zoom);
		let transformedY = Math.round((point.y - transform.y) / transform.zoom);
		transformedX -= Math.round(viewport.left / transform.zoom);
		transformedY -= Math.round(viewport.top / transform.zoom);
		return {
			x: transformedX,
			y: transformedY
		};
	}
	function getConnectionCenter({
		sourceX,
		sourceY,
		targetX,
		targetY
	}) {
		const xOffset = Math.abs(targetX - sourceX) / 2;
		const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
		const yOffset = Math.abs(targetY - sourceY) / 2;
		const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;
		return [centerX, centerY, xOffset, yOffset];
	}
	function getDirection({
		source,
		sourcePosition = PORT_POSITION.BOTTOM,
		target
	}) {
		if (sourcePosition === PORT_POSITION.LEFT || sourcePosition === PORT_POSITION.RIGHT) {
			return source.x < target.x ? {
				x: 1,
				y: 0
			} : {
				x: -1,
				y: 0
			};
		}
		return source.y < target.y ? {
			x: 0,
			y: 1
		} : {
			x: 0,
			y: -1
		};
	}
	function distance(a, b) {
		return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
	}
	// eslint-disable-next-line max-lines-per-function
	function getPoints({
		source,
		sourcePosition = PORT_POSITION.BOTTOM,
		target,
		targetPosition = PORT_POSITION.TOP,
		center,
		offset
	}) {
		const sourceDir = DIRECTIONS_BY_POSITION[sourcePosition];
		const targetDir = DIRECTIONS_BY_POSITION[targetPosition];
		const sourceGapped = {
			x: source.x + sourceDir.x * offset,
			y: source.y + sourceDir.y * offset
		};
		const targetGapped = {
			x: target.x + targetDir.x * offset,
			y: target.y + targetDir.y * offset
		};
		const dir = getDirection({
			source: sourceGapped,
			sourcePosition,
			target: targetGapped
		});
		const dirAccessor = dir.x !== 0 ? DIR_ACCESSOR_X : DIR_ACCESSOR_Y;
		const currDir = dir[dirAccessor];
		let points = [];
		let centerX = 0;
		let centerY = 0;
		const sourceGapOffset = {
			x: 0,
			y: 0
		};
		const targetGapOffset = {
			x: 0,
			y: 0
		};
		const [defaultCenterX, defaultCenterY, defaultOffsetX, defaultOffsetY] = getConnectionCenter({
			sourceX: source.x,
			sourceY: source.y,
			targetX: target.x,
			targetY: target.y
		});
		if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
			centerX = center.x ?? defaultCenterX;
			centerY = center.y ?? defaultCenterY;
			const verticalSplit = [{
				x: centerX,
				y: sourceGapped.y
			}, {
				x: centerX,
				y: targetGapped.y
			}];
			const horizontalSplit = [{
				x: sourceGapped.x,
				y: centerY
			}, {
				x: targetGapped.x,
				y: centerY
			}];
			if (sourceDir[dirAccessor] === currDir) {
				points = dirAccessor === DIR_ACCESSOR_X ? verticalSplit : horizontalSplit;
			} else {
				points = dirAccessor === DIR_ACCESSOR_X ? horizontalSplit : verticalSplit;
			}
		} else {
			const sourceTarget = [{
				x: sourceGapped.x,
				y: targetGapped.y
			}];
			const targetSource = [{
				x: targetGapped.x,
				y: sourceGapped.y
			}];
			if (dirAccessor === DIR_ACCESSOR_X) {
				points = sourceDir.x === currDir ? targetSource : sourceTarget;
			} else {
				points = sourceDir.y === currDir ? sourceTarget : targetSource;
			}
			if (sourcePosition === targetPosition) {
				const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
				if (diff <= offset) {
					const gapOffset = Math.min(offset - 1, offset - diff);
					if (sourceDir[dirAccessor] === currDir) {
						const dirSource = sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1;
						sourceGapOffset[dirAccessor] = dirSource * gapOffset;
					} else {
						const dirTarget = targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1;
						targetGapOffset[dirAccessor] = dirTarget * gapOffset;
					}
				}
			}
			if (sourcePosition !== targetPosition) {
				const dirAccessorOpposite = dirAccessor === DIR_ACCESSOR_X ? DIR_ACCESSOR_Y : DIR_ACCESSOR_X;
				const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
				const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
				const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
				const isFlipSourceTarget = sourceDir[dirAccessor] === 1 && (!isSameDir && sourceGtTargetOppo || isSameDir && sourceLtTargetOppo) || sourceDir[dirAccessor] !== 1 && (!isSameDir && sourceLtTargetOppo || isSameDir && sourceGtTargetOppo);
				if (isFlipSourceTarget) {
					points = dirAccessor === DIR_ACCESSOR_X ? sourceTarget : targetSource;
				}
			}
			const sourceGapPoint = {
				x: sourceGapped.x + sourceGapOffset.x,
				y: sourceGapped.y + sourceGapOffset.y
			};
			const targetGapPoint = {
				x: targetGapped.x + targetGapOffset.x,
				y: targetGapped.y + targetGapOffset.y
			};
			const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
			const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));
			if (maxXDistance >= maxYDistance) {
				centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
				centerY = points[0].y;
			} else {
				centerX = points[0].x;
				centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
			}
		}
		const pathPoints = [source, {
			x: sourceGapped.x + sourceGapOffset.x,
			y: sourceGapped.y + sourceGapOffset.y
		}, ...points, {
			x: targetGapped.x + targetGapOffset.x,
			y: targetGapped.y + targetGapOffset.y
		}, target];
		return {
			points: pathPoints,
			offsetX: defaultOffsetX,
			offsetY: defaultOffsetY,
			centerX,
			centerY
		};
	}
	function getBend(a, b, c, size, start) {
		const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
		const {
			x,
			y
		} = b;
		if (a.x === x && x === c.x || a.y === y && y === c.y) {
			const end = {
				x,
				y
			};
			return {
				path: `L${x} ${y}`,
				primitives: [{
					type: 'line',
					start,
					end
				}],
				end
			};
		}
		if (a.y === y) {
			const xDir = a.x < c.x ? -1 : 1;
			const yDir = a.y < c.y ? 1 : -1;
			const lineEnd = {
				x: x + bendSize * xDir,
				y
			};
			const end = {
				x,
				y: y + bendSize * yDir
			};
			return {
				path: `L ${lineEnd.x},${lineEnd.y}Q ${x},${y} ${end.x},${end.y}`,
				primitives: [{
					type: 'line',
					start,
					end: lineEnd
				}, {
					type: 'quadratic',
					start: lineEnd,
					control: {
						x,
						y
					},
					end
				}],
				end
			};
		}
		const xDir = a.x < c.x ? 1 : -1;
		const yDir = a.y < c.y ? -1 : 1;
		const lineEnd = {
			x,
			y: y + bendSize * yDir
		};
		const end = {
			x: x + bendSize * xDir,
			y
		};
		return {
			path: `L ${lineEnd.x},${lineEnd.y}Q ${x},${y} ${end.x},${end.y}`,
			primitives: [{
				type: 'line',
				start,
				end: lineEnd
			}, {
				type: 'quadratic',
				start: lineEnd,
				control: {
					x,
					y
				},
				end
			}],
			end
		};
	}
	function getSmoothStepPath(params) {
		const {
			sourceX,
			sourceY,
			sourcePosition = PORT_POSITION.BOTTOM,
			targetX,
			targetY,
			targetPosition = PORT_POSITION.TOP,
			borderRadius = 5,
			centerX,
			centerY,
			offset = 20
		} = params;
		const {
			points,
			centerX: pointsCenterX,
			centerY: pointsCenterY
		} = getPoints({
			source: {
				x: sourceX,
				y: sourceY
			},
			sourcePosition,
			target: {
				x: targetX,
				y: targetY
			},
			targetPosition,
			center: {
				x: centerX,
				y: centerY
			},
			offset
		});
		const route = points.reduce((result, point, index) => {
			if (index === 0) {
				return {
					path: `M${point.x} ${point.y}`,
					primitives: [],
					current: point
				};
			}
			if (index < points.length - 1) {
				const bend = getBend(points[index - 1], point, points[index + 1], borderRadius, result.current);
				return {
					path: result.path + bend.path,
					primitives: [...result.primitives, ...bend.primitives],
					current: bend.end
				};
			}
			return {
				path: `${result.path}L${point.x} ${point.y}`,
				primitives: [...result.primitives, {
					type: 'line',
					start: result.current,
					end: point
				}],
				current: point
			};
		}, {
			path: '',
			primitives: [],
			current: points[0]
		});
		return {
			path: route.path,
			points,
			primitives: route.primitives,
			center: {
				x: pointsCenterX,
				y: pointsCenterY
			}
		};
	}

	const MIN_DISTANCE_DISPLAY_BEZIER_LINE = 100;
	const PORT_POSITIONS = Object.values(PORT_POSITION);

	function isFiniteNumber$1(value)
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
			|| ![x, y, width, height].every(isFiniteNumber$1)
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
			!isFiniteNumber$1(resolvedFirstSegmentSize)
			|| !isFiniteNumber$1(resolvedSecondSegmentSize)
			|| !isFiniteNumber$1(centerX)
			|| !isFiniteNumber$1(centerY)
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

	function resolveConnectionPortsPosition(options)
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

	function resolveRenderedConnectionRoute(options)
	{
		const {
			offset,
			borderRadius,
		} = options;

		if (!isFiniteNumber$1(offset) || !isFiniteNumber$1(borderRadius))
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

	function resolveConnectionRoute(options)
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

	function createConnectionStructuralSignature(connection)
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

	function createConnectionRouteCacheKey(options)
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

	function flattenConnectionRoute(route, zoom, maxScreenError = 1)
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

	function expandRect(rect, tolerance)
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

	function distanceBetweenRectAndSegments(rect, segments)
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

	function sortConnectionRouteHits(hits, getSignature)
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

	const ARRAY_COMMANDS = Object.freeze({
		REPLACE: 'replace',
		PUSH: 'push',
		UPDATE_BY_INDEX: 'updateByIndex',
		DELETE_BY_INDEX: 'deleteByIndex',
		DELETE_BY_ID: 'deleteById',
		DELETE_BY_IDS: 'deleteByIds'
	});
	const commandExecMap = {
		[ARRAY_COMMANDS.REPLACE]: ({
			payload
		}) => {
			return [...payload];
		},
		[ARRAY_COMMANDS.PUSH]: ({
			source,
			payload
		}) => {
			let result = [...source];
			if (Array.isArray(payload)) {
				result = [...result, ...payload];
			} else {
				result.push(payload);
			}
			return result;
		},
		[ARRAY_COMMANDS.UPDATE_BY_INDEX]: ({
			source,
			payload,
			index
		}) => {
			const result = [...source];
			result[index] = {
				...result[index],
				...payload
			};
			return result;
		},
		[ARRAY_COMMANDS.DELETE_BY_INDEX]: ({
			source,
			index
		}) => {
			const result = [...source];
			result.splice(index, 1);
			return result;
		},
		[ARRAY_COMMANDS.DELETE_BY_ID]: ({
			source,
			payload
		}) => {
			return source.filter(item => item.id !== payload);
		},
		[ARRAY_COMMANDS.DELETE_BY_IDS]: ({
			source,
			payload
		}) => {
			const ids = payload instanceof Set ? payload : new Set(payload);
			return source.filter(item => !ids.has(item.id));
		}
	};
	function command(commandType, args) {
		return {
			commandType,
			...args
		};
	}
	function commandReplace(payload) {
		return command(ARRAY_COMMANDS.REPLACE, {
			payload
		});
	}
	function commandPush(payload) {
		return command(ARRAY_COMMANDS.PUSH, {
			payload
		});
	}
	function commandUpdateByIndex(index, payload) {
		return command(ARRAY_COMMANDS.UPDATE_BY_INDEX, {
			index,
			payload
		});
	}
	function commandDeleteById(id) {
		return command(ARRAY_COMMANDS.DELETE_BY_ID, {
			payload: id
		});
	}
	function commandDeleteByIds(ids) {
		return command(ARRAY_COMMANDS.DELETE_BY_IDS, {
			payload: ids
		});
	}
	function runCommand(sourceArray, commandPayload, callback) {
		const {
			commandType,
			payload,
			index
		} = commandPayload;
		const result = commandExecMap[commandType]({
			source: sourceArray,
			payload,
			index
		});
		callback(result);
	}

	function createHook() {
		const handlers = new Set();
		const on = handler => {
			if (main_core.Type.isFunction(handler) && !handlers.has(handler)) {
				handlers.add(handler);
			}
		};
		const off = handler => {
			handlers.delete(handler);
		};
		const trigger = (...args) => {
			for (const handler of handlers) {
				handler(...args);
			}
		};
		return {
			on,
			off,
			trigger
		};
	}

	function getGroupBlockSlotName(group) {
		return `block:${group}`;
	}
	function getGroupConnectionSlotName(group) {
		return `connection:${group}`;
	}

	/**
	 * Common utilities
	 * @module glMatrix
	 */
	// Configuration Constants
	var EPSILON = 0.000001;
	var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
	if (!Math.hypot) Math.hypot = function () {
		var y = 0,
			i = arguments.length;
		while (i--) {
			y += arguments[i] * arguments[i];
		}
		return Math.sqrt(y);
	};

	/**
	 * 3x3 Matrix
	 * @module mat3
	 */

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */

	function create$4() {
		var out = new ARRAY_TYPE(9);
		if (ARRAY_TYPE != Float32Array) {
			out[1] = 0;
			out[2] = 0;
			out[3] = 0;
			out[5] = 0;
			out[6] = 0;
			out[7] = 0;
		}
		out[0] = 1;
		out[4] = 1;
		out[8] = 1;
		return out;
	}
	/**
	 * Copy the values from one mat3 to another
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function copy(out, a) {
		out[0] = a[0];
		out[1] = a[1];
		out[2] = a[2];
		out[3] = a[3];
		out[4] = a[4];
		out[5] = a[5];
		out[6] = a[6];
		out[7] = a[7];
		out[8] = a[8];
		return out;
	}
	/**
	 * Set a mat3 to the identity matrix
	 *
	 * @param {mat3} out the receiving matrix
	 * @returns {mat3} out
	 */

	function identity(out) {
		out[0] = 1;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 1;
		out[5] = 0;
		out[6] = 0;
		out[7] = 0;
		out[8] = 1;
		return out;
	}
	/**
	 * Inverts a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function invert(out, a) {
		var a00 = a[0],
			a01 = a[1],
			a02 = a[2];
		var a10 = a[3],
			a11 = a[4],
			a12 = a[5];
		var a20 = a[6],
			a21 = a[7],
			a22 = a[8];
		var b01 = a22 * a11 - a12 * a21;
		var b11 = -a22 * a10 + a12 * a20;
		var b21 = a21 * a10 - a11 * a20; // Calculate the determinant

		var det = a00 * b01 + a01 * b11 + a02 * b21;
		if (!det) {
			return null;
		}
		det = 1.0 / det;
		out[0] = b01 * det;
		out[1] = (-a22 * a01 + a02 * a21) * det;
		out[2] = (a12 * a01 - a02 * a11) * det;
		out[3] = b11 * det;
		out[4] = (a22 * a00 - a02 * a20) * det;
		out[5] = (-a12 * a00 + a02 * a10) * det;
		out[6] = b21 * det;
		out[7] = (-a21 * a00 + a01 * a20) * det;
		out[8] = (a11 * a00 - a01 * a10) * det;
		return out;
	}
	/**
	 * Multiplies two mat3's
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the first operand
	 * @param {ReadonlyMat3} b the second operand
	 * @returns {mat3} out
	 */

	function multiply(out, a, b) {
		var a00 = a[0],
			a01 = a[1],
			a02 = a[2];
		var a10 = a[3],
			a11 = a[4],
			a12 = a[5];
		var a20 = a[6],
			a21 = a[7],
			a22 = a[8];
		var b00 = b[0],
			b01 = b[1],
			b02 = b[2];
		var b10 = b[3],
			b11 = b[4],
			b12 = b[5];
		var b20 = b[6],
			b21 = b[7],
			b22 = b[8];
		out[0] = b00 * a00 + b01 * a10 + b02 * a20;
		out[1] = b00 * a01 + b01 * a11 + b02 * a21;
		out[2] = b00 * a02 + b01 * a12 + b02 * a22;
		out[3] = b10 * a00 + b11 * a10 + b12 * a20;
		out[4] = b10 * a01 + b11 * a11 + b12 * a21;
		out[5] = b10 * a02 + b11 * a12 + b12 * a22;
		out[6] = b20 * a00 + b21 * a10 + b22 * a20;
		out[7] = b20 * a01 + b21 * a11 + b22 * a21;
		out[8] = b20 * a02 + b21 * a12 + b22 * a22;
		return out;
	}
	/**
	 * Translate a mat3 by the given vector
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to translate
	 * @param {ReadonlyVec2} v vector to translate by
	 * @returns {mat3} out
	 */

	function translate(out, a, v) {
		var a00 = a[0],
			a01 = a[1],
			a02 = a[2],
			a10 = a[3],
			a11 = a[4],
			a12 = a[5],
			a20 = a[6],
			a21 = a[7],
			a22 = a[8],
			x = v[0],
			y = v[1];
		out[0] = a00;
		out[1] = a01;
		out[2] = a02;
		out[3] = a10;
		out[4] = a11;
		out[5] = a12;
		out[6] = x * a00 + y * a10 + a20;
		out[7] = x * a01 + y * a11 + a21;
		out[8] = x * a02 + y * a12 + a22;
		return out;
	}
	/**
	 * Rotates a mat3 by the given angle
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */

	function rotate(out, a, rad) {
		var a00 = a[0],
			a01 = a[1],
			a02 = a[2],
			a10 = a[3],
			a11 = a[4],
			a12 = a[5],
			a20 = a[6],
			a21 = a[7],
			a22 = a[8],
			s = Math.sin(rad),
			c = Math.cos(rad);
		out[0] = c * a00 + s * a10;
		out[1] = c * a01 + s * a11;
		out[2] = c * a02 + s * a12;
		out[3] = c * a10 - s * a00;
		out[4] = c * a11 - s * a01;
		out[5] = c * a12 - s * a02;
		out[6] = a20;
		out[7] = a21;
		out[8] = a22;
		return out;
	}
	/**
	 * Scales the mat3 by the dimensions in the given vec2
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to rotate
	 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
	 * @returns {mat3} out
	 **/

	function scale(out, a, v) {
		var x = v[0],
			y = v[1];
		out[0] = x * a[0];
		out[1] = x * a[1];
		out[2] = x * a[2];
		out[3] = y * a[3];
		out[4] = y * a[4];
		out[5] = y * a[5];
		out[6] = a[6];
		out[7] = a[7];
		out[8] = a[8];
		return out;
	}
	/**
	 * Generates a 2D projection matrix with the given bounds
	 *
	 * @param {mat3} out mat3 frustum matrix will be written into
	 * @param {number} width Width of your gl context
	 * @param {number} height Height of gl context
	 * @returns {mat3} out
	 */

	function projection(out, width, height) {
		out[0] = 2 / width;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = -2 / height;
		out[5] = 0;
		out[6] = -1;
		out[7] = 1;
		out[8] = 1;
		return out;
	}

	/**
	 * 3 Dimensional Vector
	 * @module vec3
	 */

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */

	function create$3() {
		var out = new ARRAY_TYPE(3);
		if (ARRAY_TYPE != Float32Array) {
			out[0] = 0;
			out[1] = 0;
			out[2] = 0;
		}
		return out;
	}
	/**
	 * Calculates the length of a vec3
	 *
	 * @param {ReadonlyVec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */

	function length(a) {
		var x = a[0];
		var y = a[1];
		var z = a[2];
		return Math.hypot(x, y, z);
	}
	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */

	function fromValues(x, y, z) {
		var out = new ARRAY_TYPE(3);
		out[0] = x;
		out[1] = y;
		out[2] = z;
		return out;
	}
	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to normalize
	 * @returns {vec3} out
	 */

	function normalize$2(out, a) {
		var x = a[0];
		var y = a[1];
		var z = a[2];
		var len = x * x + y * y + z * z;
		if (len > 0) {
			//TODO: evaluate use of glm_invsqrt here?
			len = 1 / Math.sqrt(len);
		}
		out[0] = a[0] * len;
		out[1] = a[1] * len;
		out[2] = a[2] * len;
		return out;
	}
	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */

	function dot(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}
	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function cross(out, a, b) {
		var ax = a[0],
			ay = a[1],
			az = a[2];
		var bx = b[0],
			by = b[1],
			bz = b[2];
		out[0] = ay * bz - az * by;
		out[1] = az * bx - ax * bz;
		out[2] = ax * by - ay * bx;
		return out;
	}
	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */

	var len = length;
	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	(function () {
		var vec = create$3();
		return function (a, stride, offset, count, fn, arg) {
			var i, l;
			if (!stride) {
				stride = 3;
			}
			if (!offset) {
				offset = 0;
			}
			if (count) {
				l = Math.min(count * stride + offset, a.length);
			} else {
				l = a.length;
			}
			for (i = offset; i < l; i += stride) {
				vec[0] = a[i];
				vec[1] = a[i + 1];
				vec[2] = a[i + 2];
				fn(vec, vec, arg);
				a[i] = vec[0];
				a[i + 1] = vec[1];
				a[i + 2] = vec[2];
			}
			return a;
		};
	})();

	/**
	 * 4 Dimensional Vector
	 * @module vec4
	 */

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */

	function create$2() {
		var out = new ARRAY_TYPE(4);
		if (ARRAY_TYPE != Float32Array) {
			out[0] = 0;
			out[1] = 0;
			out[2] = 0;
			out[3] = 0;
		}
		return out;
	}
	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to normalize
	 * @returns {vec4} out
	 */

	function normalize$1(out, a) {
		var x = a[0];
		var y = a[1];
		var z = a[2];
		var w = a[3];
		var len = x * x + y * y + z * z + w * w;
		if (len > 0) {
			len = 1 / Math.sqrt(len);
		}
		out[0] = x * len;
		out[1] = y * len;
		out[2] = z * len;
		out[3] = w * len;
		return out;
	}
	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	(function () {
		var vec = create$2();
		return function (a, stride, offset, count, fn, arg) {
			var i, l;
			if (!stride) {
				stride = 4;
			}
			if (!offset) {
				offset = 0;
			}
			if (count) {
				l = Math.min(count * stride + offset, a.length);
			} else {
				l = a.length;
			}
			for (i = offset; i < l; i += stride) {
				vec[0] = a[i];
				vec[1] = a[i + 1];
				vec[2] = a[i + 2];
				vec[3] = a[i + 3];
				fn(vec, vec, arg);
				a[i] = vec[0];
				a[i + 1] = vec[1];
				a[i + 2] = vec[2];
				a[i + 3] = vec[3];
			}
			return a;
		};
	})();

	/**
	 * Quaternion in the format XYZW
	 * @module quat
	 */

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */

	function create$1() {
		var out = new ARRAY_TYPE(4);
		if (ARRAY_TYPE != Float32Array) {
			out[0] = 0;
			out[1] = 0;
			out[2] = 0;
		}
		out[3] = 1;
		return out;
	}
	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyVec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/

	function setAxisAngle(out, axis, rad) {
		rad = rad * 0.5;
		var s = Math.sin(rad);
		out[0] = s * axis[0];
		out[1] = s * axis[1];
		out[2] = s * axis[2];
		out[3] = Math.cos(rad);
		return out;
	}
	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */

	function slerp(out, a, b, t) {
		// benchmarks:
		//    http://jsperf.com/quaternion-slerp-implementations
		var ax = a[0],
			ay = a[1],
			az = a[2],
			aw = a[3];
		var bx = b[0],
			by = b[1],
			bz = b[2],
			bw = b[3];
		var omega, cosom, sinom, scale0, scale1; // calc cosine

		cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

		if (cosom < 0.0) {
			cosom = -cosom;
			bx = -bx;
			by = -by;
			bz = -bz;
			bw = -bw;
		} // calculate coefficients

		if (1.0 - cosom > EPSILON) {
			// standard case (slerp)
			omega = Math.acos(cosom);
			sinom = Math.sin(omega);
			scale0 = Math.sin((1.0 - t) * omega) / sinom;
			scale1 = Math.sin(t * omega) / sinom;
		} else {
			// "from" and "to" quaternions are very close
			//  ... so we can do a linear interpolation
			scale0 = 1.0 - t;
			scale1 = t;
		} // calculate final values

		out[0] = scale0 * ax + scale1 * bx;
		out[1] = scale0 * ay + scale1 * by;
		out[2] = scale0 * az + scale1 * bz;
		out[3] = scale0 * aw + scale1 * bw;
		return out;
	}
	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyMat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */

	function fromMat3(out, m) {
		// Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
		// article "Quaternion Calculus and Fast Animation".
		var fTrace = m[0] + m[4] + m[8];
		var fRoot;
		if (fTrace > 0.0) {
			// |w| > 1/2, may as well choose w > 1/2
			fRoot = Math.sqrt(fTrace + 1.0); // 2w

			out[3] = 0.5 * fRoot;
			fRoot = 0.5 / fRoot; // 1/(4w)

			out[0] = (m[5] - m[7]) * fRoot;
			out[1] = (m[6] - m[2]) * fRoot;
			out[2] = (m[1] - m[3]) * fRoot;
		} else {
			// |w| <= 1/2
			var i = 0;
			if (m[4] > m[0]) i = 1;
			if (m[8] > m[i * 3 + i]) i = 2;
			var j = (i + 1) % 3;
			var k = (i + 2) % 3;
			fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
			out[i] = 0.5 * fRoot;
			fRoot = 0.5 / fRoot;
			out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
			out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
			out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
		}
		return out;
	}
	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */

	var normalize = normalize$1;
	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {ReadonlyVec3} a the initial vector
	 * @param {ReadonlyVec3} b the destination vector
	 * @returns {quat} out
	 */

	(function () {
		var tmpvec3 = create$3();
		var xUnitVec3 = fromValues(1, 0, 0);
		var yUnitVec3 = fromValues(0, 1, 0);
		return function (out, a, b) {
			var dot$1 = dot(a, b);
			if (dot$1 < -0.999999) {
				cross(tmpvec3, xUnitVec3, a);
				if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
				normalize$2(tmpvec3, tmpvec3);
				setAxisAngle(out, tmpvec3, Math.PI);
				return out;
			} else if (dot$1 > 0.999999) {
				out[0] = 0;
				out[1] = 0;
				out[2] = 0;
				out[3] = 1;
				return out;
			} else {
				cross(tmpvec3, a, b);
				out[0] = tmpvec3[0];
				out[1] = tmpvec3[1];
				out[2] = tmpvec3[2];
				out[3] = 1 + dot$1;
				return normalize(out, out);
			}
		};
	})();
	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @param {ReadonlyQuat} c the third operand
	 * @param {ReadonlyQuat} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */

	(function () {
		var temp1 = create$1();
		var temp2 = create$1();
		return function (out, a, b, c, d, t) {
			slerp(temp1, a, d, t);
			slerp(temp2, b, c, t);
			slerp(out, temp1, temp2, 2 * t * (1 - t));
			return out;
		};
	})();
	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {ReadonlyVec3} view  the vector representing the viewing direction
	 * @param {ReadonlyVec3} right the vector representing the local "right" direction
	 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */

	(function () {
		var matr = create$4();
		return function (out, view, right, up) {
			matr[0] = right[0];
			matr[3] = right[1];
			matr[6] = right[2];
			matr[1] = up[0];
			matr[4] = up[1];
			matr[7] = up[2];
			matr[2] = -view[0];
			matr[5] = -view[1];
			matr[8] = -view[2];
			return normalize(out, fromMat3(out, matr));
		};
	})();

	/**
	 * 2 Dimensional Vector
	 * @module vec2
	 */

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */

	function create() {
		var out = new ARRAY_TYPE(2);
		if (ARRAY_TYPE != Float32Array) {
			out[0] = 0;
			out[1] = 0;
		}
		return out;
	}
	/**
	 * Transforms the vec2 with a mat3
	 * 3rd vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to transform
	 * @param {ReadonlyMat3} m matrix to transform with
	 * @returns {vec2} out
	 */

	function transformMat3(out, a, m) {
		var x = a[0],
			y = a[1];
		out[0] = m[0] * x + m[3] * y + m[6];
		out[1] = m[1] * x + m[4] * y + m[7];
		return out;
	}
	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	(function () {
		var vec = create();
		return function (a, stride, offset, count, fn, arg) {
			var i, l;
			if (!stride) {
				stride = 2;
			}
			if (!offset) {
				offset = 0;
			}
			if (count) {
				l = Math.min(count * stride + offset, a.length);
			} else {
				l = a.length;
			}
			for (i = offset; i < l; i += stride) {
				vec[0] = a[i];
				vec[1] = a[i + 1];
				fn(vec, vec, arg);
				a[i] = vec[0];
				a[i + 1] = vec[1];
			}
			return a;
		};
	})();

	class Camera {
		#x = 0;
		#y = 0;
		#rotation = 0;
		#zoom = 1;
		#width = 0;
		#height = 0;
		#matrix = create$4();
		#projectionMatrix = create$4();
		#viewMatrix = create$4();
		#viewProjectionMatrix = create$4();
		#viewProjectionMatrixInv = create$4();
		#changeCallback = null;
		constructor(options) {
			const {
				width,
				height,
				onChangeCallback
			} = options;
			this.#changeCallback = onChangeCallback;
			this.projection(width, height);
			this.updateMatrix();
			this.#onChangedTransformParams({
				width,
				height
			});
		}
		get projectionMatrix() {
			return this.#projectionMatrix;
		}
		get viewMatrix() {
			return this.#viewMatrix;
		}
		get viewProjectionMatrix() {
			return this.#viewProjectionMatrix;
		}
		get viewProjectionMatrixInv() {
			return this.#viewProjectionMatrixInv;
		}
		get matrix() {
			return this.#matrix;
		}
		get zoom() {
			return this.#zoom;
		}
		set zoom(zoom) {
			if (this.#zoom !== zoom) {
				this.#zoom = zoom;
				this.#onChangedTransformParams({
					zoom
				});
				this.updateMatrix();
			}
		}
		get x() {
			return this.#x;
		}
		set x(x) {
			if (this.#x !== x) {
				this.#x = x;
				this.#onChangedTransformParams({
					x
				});
				this.updateMatrix();
			}
		}
		get y() {
			return this.#y;
		}
		set y(y) {
			if (this.#y !== y) {
				this.#y = y;
				this.#onChangedTransformParams({
					y
				});
				this.updateMatrix();
			}
		}
		get rotation() {
			return this.#rotation;
		}
		set rotation(rotation) {
			if (this.#rotation !== rotation) {
				this.#rotation = rotation;
				this.updateMatrix();
			}
		}
		get width() {
			return this.#width;
		}
		get height() {
			return this.#height;
		}
		setChangeTransformCallback(callback) {
			this.#changeCallback = callback;
		}
		#onChangedTransformParams(params) {
			this.#changeCallback({
				x: this.#x,
				y: this.#y,
				zoom: this.#zoom,
				width: this.#width,
				height: this.#height,
				...params
			});
		}
		clone(width = null, height = null) {
			const camera = new Camera({
				width: width || this.#width,
				height: height || this.#height,
				onChangeCallback: this.#changeCallback
			});
			camera.#x = this.#x;
			camera.#y = this.#y;
			camera.#zoom = this.#zoom;
			camera.#rotation = this.#rotation;
			camera.updateMatrix();
			camera.#onChangedTransformParams({
				x: camera.#x,
				y: camera.#y,
				zoom: camera.#zoom
			});
			return camera;
		}
		projection(width, height) {
			this.#width = width;
			this.#height = height;
			projection(this.#projectionMatrix, width, height);
			this.updateViewProjectionMatrix();
		}
		updateMatrix() {
			const zoomScale = 1 / this.#zoom;
			identity(this.#matrix);
			translate(this.#matrix, this.#matrix, [this.#x, this.#y]);
			rotate(this.#matrix, this.#matrix, this.#rotation);
			scale(this.#matrix, this.#matrix, [zoomScale, zoomScale]);
			invert(this.#viewMatrix, this.#matrix);
			this.updateViewProjectionMatrix();
		}
		updateViewProjectionMatrix() {
			multiply(this.#viewProjectionMatrix, this.#projectionMatrix, this.#viewMatrix);
			invert(this.#viewProjectionMatrixInv, this.#viewProjectionMatrix);
		}
		createLandmark(params = {}) {
			return {
				zoom: this.#zoom,
				x: this.#x,
				y: this.#y,
				rotation: this.#rotation,
				...params
			};
		}
		viewportToCanvas({
			x,
			y
		}, camera) {
			const {
				width,
				height,
				viewProjectionMatrixInv
			} = camera || this;
			const canvas = transformMat3(create(), [x / width * 2 - 1, (1 - y / height) * 2 - 1], viewProjectionMatrixInv);
			return {
				x: canvas[0],
				y: canvas[1]
			};
		}
		applyLandmark(landmark) {
			const {
				x,
				y,
				zoom,
				rotation,
				viewportX,
				viewportY
			} = landmark;
			const useFixedViewport = viewportX || viewportY;
			let preZoomX = 0;
			let preZoomY = 0;
			if (useFixedViewport) {
				const canvas = this.viewportToCanvas({
					x: viewportX,
					y: viewportY
				});
				preZoomX = canvas.x;
				preZoomY = canvas.y;
			}
			this.#zoom = zoom;
			this.#rotation = rotation;
			this.#x = x;
			this.#y = y;
			this.updateMatrix();
			this.#onChangedTransformParams({
				x: this.#x,
				y: this.#y,
				zoom: this.#zoom
			});
			if (useFixedViewport) {
				const {
					x: postZoomX,
					y: postZoomY
				} = this.viewportToCanvas({
					x: viewportX,
					y: viewportY
				});
				this.#x += preZoomX - postZoomX;
				this.#y += preZoomY - postZoomY;
				this.updateMatrix();
				this.#onChangedTransformParams({
					x: this.#x,
					y: this.#y,
					zoom: this.#zoom
				});
			}
		}
	}

	class Canvas {
		#canvas = null;
		#dpr = window.devicePixelRatio || 1;
		#width = 0;
		#height = 0;
		#minZoom = 0.02;
		#maxZoom = 4;
		#camera = null;
		#canvasStyleInstance = null;
		#startInvertViewProjectionMatrix = create$4();
		#startCameraX = 0;
		#startCameraY = 0;
		#startPos = create();
		#resizeObserver = null;
		transform = ui_vue3.ref({
			x: 0,
			y: 0,
			zoom: 0
		});
		constructor(options) {
			const {
				canvas,
				canvasStyle,
				minZoom,
				maxZoom
			} = options;
			this.#minZoom = minZoom;
			this.#maxZoom = maxZoom;
			this.#initCanvas(canvas);
			this.#initCamera();
			this.#initCanvasStyle(canvasStyle);
			this.#initResizeObserver();
		}
		get viewMatrix() {
			return this.#camera?.viewMatrix ?? [];
		}
		get camera() {
			return this.#camera;
		}
		#initCanvas(canvas) {
			const {
				width,
				height
			} = canvas.getBoundingClientRect();
			this.#canvas = canvas;
			this.#canvas.width = width * this.#dpr;
			this.#canvas.height = height * this.#dpr;
			this.#width = this.#canvas.width;
			this.#height = this.#canvas.height;
		}
		#initCamera() {
			this.#camera = new Camera({
				width: this.#width / this.#dpr,
				height: this.#height / this.#dpr,
				onChangeCallback: ({
					x,
					y,
					zoom
				}) => {
					this.transform.x = x;
					this.transform.y = y;
					this.transform.zoom = zoom;
				}
			});
		}
		#initCanvasStyle(canvasStyle) {
			if (canvasStyle) {
				const StyleInstance = canvasStyle.instance;
				this.#canvasStyleInstance = new StyleInstance(this.#canvas, canvasStyle.options);
			}
		}
		#initResizeObserver() {
			this.#resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					this.#camera = this.#camera.clone(entry.contentRect.width, entry.contentRect.height);
				}
			});
			this.#resizeObserver.observe(this.#canvas);
		}
		clientToViewport({
			x,
			y
		}) {
			const {
				left,
				top
			} = this.#canvas.getBoundingClientRect();
			return {
				x: x - left,
				y: y - top
			};
		}
		viewportToClient({
			x,
			y
		}) {
			const {
				left,
				top
			} = this.#canvas.getBoundingClientRect();
			return {
				x: x + left,
				y: y + top
			};
		}
		render() {
			this.#canvasStyleInstance?.render({
				projectionMatrix: this.#camera.projectionMatrix,
				viewMatrix: this.#camera.viewMatrix,
				viewProjectionMatrixInv: this.#camera.viewProjectionMatrixInv,
				zoomScale: this.#camera.zoom
			});
		}
		setCamera(params) {
			this.#camera.applyLandmark(this.#camera.createLandmark({
				...params
			}));
		}
		#setCameraZoom(zoomStep) {
			const zoom = Number((this.#camera.zoom + zoomStep).toFixed(1));
			if (zoom < this.#minZoom || zoom > this.#maxZoom) {
				return;
			}
			this.#camera.applyLandmark(this.#camera.createLandmark({
				x: this.#camera.x,
				y: this.#camera.y,
				viewportX: this.#camera.width / 2,
				viewportY: this.#camera.height / 2,
				zoom
			}));
		}
		zoomIn(zoomStep) {
			this.#setCameraZoom(zoomStep);
		}
		zoomOut(zoomStep) {
			this.#setCameraZoom(zoomStep * -1);
		}
		setZoom(zoom) {
			this.#camera.applyLandmark(this.#camera.createLandmark({
				x: this.#camera.x,
				y: this.#camera.y,
				viewportX: this.#camera.width / 2,
				viewportY: this.#camera.height / 2,
				zoom
			}));
		}
		setCameraZoomByWheel(event, zoomChange = 0) {
			const newZoom = Math.max(this.#minZoom, Math.min(this.#maxZoom, this.#camera.zoom + zoomChange));
			const viewport = this.clientToViewport({
				x: event.clientX,
				y: event.clientY
			});
			this.#camera.applyLandmark(this.#camera.createLandmark({
				viewportX: viewport.x,
				viewportY: viewport.y,
				zoom: newZoom
			}));
		}
		setCameraPositionByWheel(event) {
			const lineStep = 40;
			const pixelStep = event.deltaMode === 1 ? lineStep : 1;
			let dx = event.deltaX * pixelStep;
			let dy = event.deltaY * pixelStep;
			if (event.shiftKey && Math.abs(dy) > Math.abs(dx)) {
				dx = dy;
				dy = 0;
			}
			this.#camera.x += dx / this.#camera.zoom;
			this.#camera.y += dy / this.#camera.zoom;
		}
		#getClipSpaceMousePosition(event) {
			const {
				left,
				top
			} = this.#canvas.getBoundingClientRect();
			const cssX = event.clientX - left;
			const cssY = event.clientY - top;
			const normalizedX = cssX / this.#canvas.clientWidth || this.#canvas.width / this.#dpr;
			const normalizedY = cssY / this.#canvas.clientHeight || this.#canvas.height / this.#dpr;
			const clipX = normalizedX * 2 - 1;
			const clipY = normalizedY * -2 + 1;
			return [clipX, clipY];
		}
		setCameraPositionByMouseDown(event) {
			copy(this.#startInvertViewProjectionMatrix, this.#camera.viewProjectionMatrixInv);
			this.#startCameraX = this.#camera.x;
			this.#startCameraY = this.#camera.y;
			transformMat3(this.#startPos, this.#getClipSpaceMousePosition(event), this.#startInvertViewProjectionMatrix);
		}
		setCameraPositionByMouseMove(event) {
			const pos = transformMat3(create(), this.#getClipSpaceMousePosition(event), this.#startInvertViewProjectionMatrix);
			this.#camera.x = this.#startCameraX + this.#startPos[0] - pos[0];
			this.#camera.y = this.#startCameraY + this.#startPos[1] - pos[1];
		}
		destroy() {
			this.#canvasStyleInstance?.destroy();
			this.#resizeObserver.unobserve(this.#canvas);
		}
	}

	const vertexShader = `
	#extension GL_OES_standard_derivatives : enable
	precision mediump float;

	attribute vec2 a_Position;
	uniform mat3 u_ViewProjectionInvMatrix;
	varying vec2 v_Position;

	vec2 project_clipspace(vec2 p) {
		return (u_ViewProjectionInvMatrix * vec3(p, 1)).xy;
	}

	void main() {
		v_Position = project_clipspace(a_Position);
		gl_Position = vec4(a_Position, 0, 1);
	}
`;
	const fragmentShader = `
	#extension GL_OES_standard_derivatives : enable

	// Cross-fade needs the coarse grid lines to land exactly on fine ones, and that
	// survives only while world coordinates keep their precision: a mediump float
	// (10-bit mantissa) drifts by a noticeable fraction of a cell a few thousand
	// world units away from the origin. highp in fragment shaders is optional in
	// GLSL ES 1.00, so it is taken when the implementation reports it.
	#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
	#else
	precision mediump float;
	#endif

	uniform vec4 u_BackgroundColor;
	uniform vec4 u_CoarseColor;
	uniform vec4 u_FineColor;
	uniform float u_CoarseSize;
	uniform float u_FineSize;
	uniform float u_Blend;
	varying vec2 v_Position;

	const float MAX_LINE_ALPHA = 0.222;

	float line_coverage(vec2 coord, float size) {
		vec2 grid = abs(fract(coord / size - 0.5) - 0.5) / fwidth(coord) * size / 0.95;

		return 1.0 - min(min(grid.x, grid.y), 1.0);
	}

	vec4 render_grid(vec2 coord) {
		// Each level is capped before the blend is applied: capping the product
		// instead would saturate the fine level once u_Blend reaches MAX_LINE_ALPHA
		// and collapse the rest of the fade into the antialiased edges.
		float coarse = clamp(line_coverage(coord, u_CoarseSize), 0.0, MAX_LINE_ALPHA);
		float fine = clamp(line_coverage(coord, u_FineSize), 0.0, MAX_LINE_ALPHA);
		float alpha = max(coarse, fine * u_Blend);
		// Coarse lines are a subset of the fine ones, so the visible grid belongs to
		// whichever level the blend currently favours - hence a single interpolated
		// color rather than one per level. Equal colors reduce to the plain case.
		vec4 gridColor = mix(u_CoarseColor, u_FineColor, u_Blend);

		return mix(u_BackgroundColor, gridColor, alpha);
	}

	void main() {
		gl_FragColor = render_grid(v_Position);
	}
`;

	function compileShader(gl, shaderSource, shaderType) {
		const shader = gl.createShader(shaderType);
		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);
		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!success) {
			throw new Error(`Error shader compilation: ${gl.getShaderInfoLog(shader)}`);
		}
		return shader;
	}
	function createProgram(gl, vertexShader, fragmentShader) {
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		const success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (!success) {
			throw new Error(`Error initializing shader program: ${gl.getProgramInfoLog(program)}`);
		}
		return program;
	}
	function createBufferFromTypedArray(gl, array, type, drawType) {
		const bufferType = gl.ARRAY_BUFFER;
		const buffer = gl.createBuffer();
		gl.bindBuffer(bufferType, buffer);
		gl.bufferData(bufferType, array, gl.STATIC_DRAW);
		return buffer;
	}
	function convHex(hex) {
		const preHex = hex.replace(/^#/, '');
		const r = parseInt(preHex.slice(0, 2), 16);
		const g = parseInt(preHex.slice(2, 4), 16);
		const b = parseInt(preHex.slice(4, 6), 16);
		return [r / 255, g / 255, b / 255];
	}

	// Divisor turning the base grid cell into the snap step. The default zoom ladder takes its
	// finest level from the same constant (src/utils/canvas/grid.js), so the step a block snaps
	// to and the finest line the canvas draws stay one and the same value by construction.
	const GRID_SUBDIVISION = 4;
	function snapValueToGrid(value, step) {
		// a disabled or broken step keeps the previous free positioning instead of dividing by zero
		if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
			return value;
		}
		return Math.round(value / step) * step;
	}
	function snapPointToGrid(point, step) {
		return {
			x: snapValueToGrid(point.x, step),
			y: snapValueToGrid(point.y, step)
		};
	}

	const GRID_DEFAULT_SIZE = 64;

	// Default ladder of discrete cell sizes. Adjacent sizes must be integer multiples
	// of each other so coarse grid lines stay a subset of the finer level - otherwise
	// the cross-fade shows duplicated lines. The step above 1.0 keeps the grid
	// detailing on zoom in: the cross-fade runs in the 0.99 - 2 band, above zoom 2 a
	// single level stays.
	// The finest level equals the snap step, so a snapped block lands on a line the
	// canvas actually draws instead of somewhere between two of them.
	const GRID_DEFAULT_ZOOM_STEPS = [{
		zoom: 2,
		size: GRID_DEFAULT_SIZE / GRID_SUBDIVISION
	}, {
		zoom: 0.99,
		size: GRID_DEFAULT_SIZE
	}, {
		zoom: 0.5,
		size: GRID_DEFAULT_SIZE * 5
	}, {
		zoom: 0.25,
		size: GRID_DEFAULT_SIZE * 25
	}, {
		zoom: 0.125,
		size: GRID_DEFAULT_SIZE * 125
	}];

	// A level of the built ladder. Keeps the logarithm of its threshold: blending is
	// logarithmic and render runs every frame, while the thresholds never change.

	// Normalizes the public canvasStyle zoom steps into levels sorted by zoom
	// descending, filling omitted size and color from the base grid options.
	// An empty ladder is a supported configuration: it degrades to a single base
	// level instead of leaving the grid without any level to render.
	function prepareZoomSteps(zoomSteps, base) {
		if (!Array.isArray(zoomSteps) || zoomSteps.length === 0) {
			return [base];
		}
		return [...zoomSteps].sort((stepA, stepB) => stepB.zoom - stepA.zoom).map(step => ({
			zoom: step.zoom,
			size: 'size' in step ? step.size : base.size,
			gridColor: 'gridColor' in step ? convHex(step.gridColor) : base.gridColor
		}));
	}

	// Names the adjacent sizes that break the cross-fade contract: a coarse level is
	// drawn on top of a finer one, so its lines must coincide with the finer grid,
	// which holds only while the sizes are integer multiples.
	function findNonMultipleLevels(levels) {
		const broken = [];
		for (let i = 1; i < levels.length; i++) {
			const ratio = levels[i].size / levels[i - 1].size;
			if (Math.abs(ratio - Math.round(ratio)) > 1e-9) {
				broken.push([levels[i].size, levels[i - 1].size]);
			}
		}
		return broken;
	}

	// Collapses zoom steps that share a discrete cell size into a single level and
	// keeps the lowest zoom threshold - the boundary at which that size takes over.
	// Steps of one size may declare different colors; the collapsed level keeps the
	// first one, since a single size is a single visual level.
	// The input must be sorted by zoom descending.
	function buildGridLevels(steps) {
		const levels = [];
		for (const step of steps) {
			const previous = levels[levels.length - 1];
			if (previous && previous.size === step.size) {
				previous.zoom = step.zoom;
				previous.logZoom = Math.log(step.zoom);
				continue;
			}
			levels.push({
				zoom: step.zoom,
				logZoom: Math.log(step.zoom),
				size: step.size,
				gridColor: step.gridColor
			});
		}
		const broken = findNonMultipleLevels(levels);
		if (broken.length > 0) {
			console.error('Invalid canvasStyle.zoomSteps: adjacent grid sizes are not integer multiples, ' + 'the grid will show duplicated lines while they cross-fade', broken.map(([coarse, fine]) => `${coarse} / ${fine}`).join(', '));
		}
		return levels;
	}

	// Position of zoom between the coarse (logLo) and fine (logHi) thresholds on a
	// logarithmic scale, since the thresholds form a geometric progression.
	// Thresholds come in as logarithms - they are precomputed with the ladder, so a
	// frame only pays for the logarithm of the current zoom.
	// Returns 0 at logLo (fully coarse) and 1 at logHi (fully fine).
	function getBlendFactor(logZoom, logLo, logHi) {
		const t = (logZoom - logLo) / (logHi - logLo);
		// Coinciding thresholds divide by zero, a zero threshold gives -Infinity;
		// either way the levels are effectively merged - show the fine one instead of
		// letting NaN reach the shader alpha.
		if (!Number.isFinite(t)) {
			return 1;
		}
		return Math.min(Math.max(t, 0), 1);
	}

	// Picks the two adjacent discrete levels around the current zoom together with
	// the blend factor between them. blend === 1 shows only the fine (smaller) level,
	// blend === 0 only the coarse (larger) one. Beyond the outermost thresholds it
	// degrades to a single level with a stable blend, so there is no jump.
	function getGridBlendState(levels, zoom) {
		const coarseIndex = levels.findIndex(level => level.zoom <= zoom);
		if (coarseIndex === -1) {
			const coarsest = levels[levels.length - 1];
			return {
				coarse: coarsest,
				fine: coarsest,
				blend: 0
			};
		}
		const coarse = levels[coarseIndex];
		if (coarseIndex === 0) {
			return {
				coarse,
				fine: coarse,
				blend: 1
			};
		}
		const fine = levels[coarseIndex - 1];
		return {
			coarse,
			fine,
			blend: getBlendFactor(Math.log(zoom), coarse.logZoom, fine.logZoom)
		};
	}
	class Grid {
		#gl;
		#program = null;
		#positionAttributeLocation = null;
		#vertexShader = null;
		#fragmentShader = null;
		#projectionMatrixLink = null;
		#viewMatrixLink = null;
		#viewProjectionInvMatrixLink = null;
		#backgroundColorLink = null;
		#backgroundColor = null;
		#coarseColorLink = null;
		#fineColorLink = null;
		#gridColor = [];
		#coarseSizeLink = null;
		#fineSizeLink = null;
		#blendLink = null;
		#gridSize = null;
		#gridPosition = [-1, -1, -1, 1, 1, -1, 1, 1];
		#gridPositionBuffer = null;
		#gridLevels = [];
		constructor(canvas, options) {
			this.#initParams(options);
			this.#initGrid(canvas);
		}
		#initGrid(canvas) {
			this.#gl = canvas.getContext('webgl');
			this.#gl.getExtension('OES_standard_derivatives');
			this.#gl.viewport(0, 0, this.#gl.canvas.width, this.#gl.canvas.height);
			this.#vertexShader = compileShader(this.#gl, vertexShader, this.#gl.VERTEX_SHADER);
			this.#fragmentShader = compileShader(this.#gl, fragmentShader, this.#gl.FRAGMENT_SHADER);
			this.#program = createProgram(this.#gl, this.#vertexShader, this.#fragmentShader);
			this.#positionAttributeLocation = this.#gl.getAttribLocation(this.#program, 'a_Position');
			this.#projectionMatrixLink = this.#gl.getUniformLocation(this.#program, 'u_ProjectionMatrix');
			this.#viewMatrixLink = this.#gl.getUniformLocation(this.#program, 'u_ViewMatrix');
			this.#viewProjectionInvMatrixLink = this.#gl.getUniformLocation(this.#program, 'u_ViewProjectionInvMatrix');
			this.#backgroundColorLink = this.#gl.getUniformLocation(this.#program, 'u_BackgroundColor');
			this.#coarseColorLink = this.#gl.getUniformLocation(this.#program, 'u_CoarseColor');
			this.#fineColorLink = this.#gl.getUniformLocation(this.#program, 'u_FineColor');
			this.#coarseSizeLink = this.#gl.getUniformLocation(this.#program, 'u_CoarseSize');
			this.#fineSizeLink = this.#gl.getUniformLocation(this.#program, 'u_FineSize');
			this.#blendLink = this.#gl.getUniformLocation(this.#program, 'u_Blend');
			this.#gridPositionBuffer = createBufferFromTypedArray(this.#gl, new Float32Array(this.#gridPosition));
		}
		#initParams(options) {
			const {
				size,
				gridColor,
				backgroundColor,
				zoomSteps
			} = options;
			this.#gridSize = size;
			this.#gridColor = convHex(gridColor);
			this.#backgroundColor = new Float32Array(convHex(backgroundColor));
			this.#gridLevels = buildGridLevels(prepareZoomSteps(zoomSteps, {
				zoom: 0,
				size: this.#gridSize,
				gridColor: this.#gridColor
			}));
		}
		render({
			projectionMatrix,
			viewMatrix,
			viewProjectionMatrixInv,
			zoomScale
		}) {
			this.#gl.clearColor(1, 1, 1, 1);
			this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
			this.#gl.useProgram(this.#program);
			const {
				coarse,
				fine,
				blend
			} = getGridBlendState(this.#gridLevels, zoomScale);
			this.#gl.uniformMatrix3fv(this.#projectionMatrixLink, false, projectionMatrix);
			this.#gl.uniformMatrix3fv(this.#viewMatrixLink, false, viewMatrix);
			this.#gl.uniformMatrix3fv(this.#viewProjectionInvMatrixLink, false, viewProjectionMatrixInv);
			this.#gl.uniform4f(this.#backgroundColorLink, ...this.#backgroundColor, 1);
			this.#gl.uniform4f(this.#coarseColorLink, ...coarse.gridColor, 1);
			this.#gl.uniform4f(this.#fineColorLink, ...fine.gridColor, 1);
			this.#gl.uniform1f(this.#coarseSizeLink, coarse.size);
			this.#gl.uniform1f(this.#fineSizeLink, fine.size);
			this.#gl.uniform1f(this.#blendLink, blend);
			this.#gl.enableVertexAttribArray(this.#positionAttributeLocation);
			this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#gridPositionBuffer);
			this.#gl.vertexAttribPointer(this.#positionAttributeLocation, 2, this.#gl.FLOAT, false, 0, 0);
			this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, 0, 4);
		}
		destroy() {
			this.#gl.deleteProgram(this.#program);
			this.#gl.deleteShader(this.#vertexShader);
			this.#gl.deleteShader(this.#fragmentShader);
		}
	}

	/*!
	 * quickselect v3.0.0
	 * (c) 2024, Vladimir Agafonkin
	 * Released under the ISC License.
	 *
	 * @source: https://github.com/mourner/quickselect
	 */

	/* eslint-disable unicorn/no-abusive-eslint-disable */
	/**
	 * Rearranges items so that all items in the [left, k] are the smallest.
	 * The k-th element will have the (k - left + 1)-th smallest value in [left, right].
	 *
	 * @template T
	 * @param {T[]} arr the array to partially sort (in place)
	 * @param {number} k middle index for partial sorting (as defined above)
	 * @param {number} [left=0] left index of the range to sort
	 * @param {number} [right=arr.length-1] right index
	 * @param {(a: T, b: T) => number} [compare = (a, b) => a - b] compare function
	 */

	/* eslint-disable */
	function quickselect(arr, k, left = 0, right = arr.length - 1, compare = defaultCompare) {
		while (right > left) {
			if (right - left > 600) {
				const n = right - left + 1;
				const m = k - left + 1;
				const z = Math.log(n);
				const s = 0.5 * Math.exp(2 * z / 3);
				const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
				const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
				const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
				quickselect(arr, k, newLeft, newRight, compare);
			}
			const t = arr[k];
			let i = left;
			/** @type {number} */
			let j = right;
			swap(arr, left, k);
			if (compare(arr[right], t) > 0) swap(arr, left, right);
			while (i < j) {
				swap(arr, i, j);
				i++;
				j--;
				while (compare(arr[i], t) < 0) i++;
				while (compare(arr[j], t) > 0) j--;
			}
			if (compare(arr[left], t) === 0) swap(arr, left, j);else {
				j++;
				swap(arr, j, right);
			}
			if (j <= k) left = j + 1;
			if (k <= j) right = j - 1;
		}
	}

	/**
	 * @template T
	 * @param {T[]} arr
	 * @param {number} i
	 * @param {number} j
	 */
	function swap(arr, i, j) {
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
	}

	/**
	 * @template T
	 * @param {T} a
	 * @param {T} b
	 * @returns {number}
	 */
	function defaultCompare(a, b) {
		return a < b ? -1 : a > b ? 1 : 0;
	}

	/*!
	 * rbush v4.0.1
	 * (c) 2024 Volodymyr Agafonkin
	 * Released under the MIT License.
	 *
	 * @source: https://github.com/mourner/rbush
	 */


	/* eslint-disable */
	class RBush {
		constructor(maxEntries = 9) {
			// max entries in a node is 9 by default; min node fill is 40% for best performance
			this._maxEntries = Math.max(4, maxEntries);
			this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
			this.clear();
		}
		all() {
			return this._all(this.data, []);
		}
		search(bbox) {
			let node = this.data;
			const result = [];
			if (!intersects(bbox, node)) return result;
			const toBBox = this.toBBox;
			const nodesToSearch = [];
			while (node) {
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i];
					const childBBox = node.leaf ? toBBox(child) : child;
					if (intersects(bbox, childBBox)) {
						if (node.leaf) result.push(child);else if (contains(bbox, childBBox)) this._all(child, result);else nodesToSearch.push(child);
					}
				}
				node = nodesToSearch.pop();
			}
			return result;
		}
		collides(bbox) {
			let node = this.data;
			if (!intersects(bbox, node)) return false;
			const nodesToSearch = [];
			while (node) {
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i];
					const childBBox = node.leaf ? this.toBBox(child) : child;
					if (intersects(bbox, childBBox)) {
						if (node.leaf || contains(bbox, childBBox)) return true;
						nodesToSearch.push(child);
					}
				}
				node = nodesToSearch.pop();
			}
			return false;
		}
		load(data) {
			if (!(data && data.length)) return this;
			if (data.length < this._minEntries) {
				for (let i = 0; i < data.length; i++) {
					this.insert(data[i]);
				}
				return this;
			}

			// recursively build the tree with the given data from scratch using OMT algorithm
			let node = this._build(data.slice(), 0, data.length - 1, 0);
			if (!this.data.children.length) {
				// save as is if tree is empty
				this.data = node;
			} else if (this.data.height === node.height) {
				// split root if trees have the same height
				this._splitRoot(this.data, node);
			} else {
				if (this.data.height < node.height) {
					// swap trees if inserted one is bigger
					const tmpNode = this.data;
					this.data = node;
					node = tmpNode;
				}

				// insert the small tree into the large tree at appropriate level
				this._insert(node, this.data.height - node.height - 1, true);
			}
			return this;
		}
		insert(item) {
			if (item) this._insert(item, this.data.height - 1);
			return this;
		}
		clear() {
			this.data = createNode([]);
			return this;
		}
		remove(item, equalsFn) {
			if (!item) return this;
			let node = this.data;
			const bbox = this.toBBox(item);
			const path = [];
			const indexes = [];
			let i, parent, goingUp;

			// depth-first iterative tree traversal
			while (node || path.length) {
				if (!node) {
					// go up
					node = path.pop();
					parent = path[path.length - 1];
					i = indexes.pop();
					goingUp = true;
				}
				if (node.leaf) {
					// check current node
					const index = findItem(item, node.children, equalsFn);
					if (index !== -1) {
						// item found, remove the item and condense tree upwards
						node.children.splice(index, 1);
						path.push(node);
						this._condense(path);
						return this;
					}
				}
				if (!goingUp && !node.leaf && contains(node, bbox)) {
					// go down
					path.push(node);
					indexes.push(i);
					i = 0;
					parent = node;
					node = node.children[0];
				} else if (parent) {
					// go right
					i++;
					node = parent.children[i];
					goingUp = false;
				} else node = null; // nothing found
			}
			return this;
		}
		toBBox(item) {
			return item;
		}
		compareMinX(a, b) {
			return a.minX - b.minX;
		}
		compareMinY(a, b) {
			return a.minY - b.minY;
		}
		toJSON() {
			return this.data;
		}
		fromJSON(data) {
			this.data = data;
			return this;
		}
		_all(node, result) {
			const nodesToSearch = [];
			while (node) {
				if (node.leaf) result.push(...node.children);else nodesToSearch.push(...node.children);
				node = nodesToSearch.pop();
			}
			return result;
		}
		_build(items, left, right, height) {
			const N = right - left + 1;
			let M = this._maxEntries;
			let node;
			if (N <= M) {
				// reached leaf level; return leaf
				node = createNode(items.slice(left, right + 1));
				calcBBox(node, this.toBBox);
				return node;
			}
			if (!height) {
				// target height of the bulk-loaded tree
				height = Math.ceil(Math.log(N) / Math.log(M));

				// target number of root entries to maximize storage utilization
				M = Math.ceil(N / Math.pow(M, height - 1));
			}
			node = createNode([]);
			node.leaf = false;
			node.height = height;

			// split the items into M mostly square tiles

			const N2 = Math.ceil(N / M);
			const N1 = N2 * Math.ceil(Math.sqrt(M));
			multiSelect(items, left, right, N1, this.compareMinX);
			for (let i = left; i <= right; i += N1) {
				const right2 = Math.min(i + N1 - 1, right);
				multiSelect(items, i, right2, N2, this.compareMinY);
				for (let j = i; j <= right2; j += N2) {
					const right3 = Math.min(j + N2 - 1, right2);

					// pack each entry recursively
					node.children.push(this._build(items, j, right3, height - 1));
				}
			}
			calcBBox(node, this.toBBox);
			return node;
		}
		_chooseSubtree(bbox, node, level, path) {
			while (true) {
				path.push(node);
				if (node.leaf || path.length - 1 === level) break;
				let minArea = Infinity;
				let minEnlargement = Infinity;
				let targetNode;
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i];
					const area = bboxArea(child);
					const enlargement = enlargedArea(bbox, child) - area;

					// choose entry with the least area enlargement
					if (enlargement < minEnlargement) {
						minEnlargement = enlargement;
						minArea = area < minArea ? area : minArea;
						targetNode = child;
					} else if (enlargement === minEnlargement) {
						// otherwise choose one with the smallest area
						if (area < minArea) {
							minArea = area;
							targetNode = child;
						}
					}
				}
				node = targetNode || node.children[0];
			}
			return node;
		}
		_insert(item, level, isNode) {
			const bbox = isNode ? item : this.toBBox(item);
			const insertPath = [];

			// find the best node for accommodating the item, saving all nodes along the path too
			const node = this._chooseSubtree(bbox, this.data, level, insertPath);

			// put the item into the node
			node.children.push(item);
			extend(node, bbox);

			// split on node overflow; propagate upwards if necessary
			while (level >= 0) {
				if (insertPath[level].children.length > this._maxEntries) {
					this._split(insertPath, level);
					level--;
				} else break;
			}

			// adjust bboxes along the insertion path
			this._adjustParentBBoxes(bbox, insertPath, level);
		}

		// split overflowed node into two
		_split(insertPath, level) {
			const node = insertPath[level];
			const M = node.children.length;
			const m = this._minEntries;
			this._chooseSplitAxis(node, m, M);
			const splitIndex = this._chooseSplitIndex(node, m, M);
			const newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
			newNode.height = node.height;
			newNode.leaf = node.leaf;
			calcBBox(node, this.toBBox);
			calcBBox(newNode, this.toBBox);
			if (level) insertPath[level - 1].children.push(newNode);else this._splitRoot(node, newNode);
		}
		_splitRoot(node, newNode) {
			// split root node
			this.data = createNode([node, newNode]);
			this.data.height = node.height + 1;
			this.data.leaf = false;
			calcBBox(this.data, this.toBBox);
		}
		_chooseSplitIndex(node, m, M) {
			let index;
			let minOverlap = Infinity;
			let minArea = Infinity;
			for (let i = m; i <= M - m; i++) {
				const bbox1 = distBBox(node, 0, i, this.toBBox);
				const bbox2 = distBBox(node, i, M, this.toBBox);
				const overlap = intersectionArea(bbox1, bbox2);
				const area = bboxArea(bbox1) + bboxArea(bbox2);

				// choose distribution with minimum overlap
				if (overlap < minOverlap) {
					minOverlap = overlap;
					index = i;
					minArea = area < minArea ? area : minArea;
				} else if (overlap === minOverlap) {
					// otherwise choose distribution with minimum area
					if (area < minArea) {
						minArea = area;
						index = i;
					}
				}
			}
			return index || M - m;
		}

		// sorts node children by the best axis for split
		_chooseSplitAxis(node, m, M) {
			const compareMinX = node.leaf ? this.compareMinX : compareNodeMinX;
			const compareMinY = node.leaf ? this.compareMinY : compareNodeMinY;
			const xMargin = this._allDistMargin(node, m, M, compareMinX);
			const yMargin = this._allDistMargin(node, m, M, compareMinY);

			// if total distributions margin value is minimal for x, sort by minX,
			// otherwise it's already sorted by minY
			if (xMargin < yMargin) node.children.sort(compareMinX);
		}

		// total margin of all possible split distributions where each node is at least m full
		_allDistMargin(node, m, M, compare) {
			node.children.sort(compare);
			const toBBox = this.toBBox;
			const leftBBox = distBBox(node, 0, m, toBBox);
			const rightBBox = distBBox(node, M - m, M, toBBox);
			let margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);
			for (let i = m; i < M - m; i++) {
				const child = node.children[i];
				extend(leftBBox, node.leaf ? toBBox(child) : child);
				margin += bboxMargin(leftBBox);
			}
			for (let i = M - m - 1; i >= m; i--) {
				const child = node.children[i];
				extend(rightBBox, node.leaf ? toBBox(child) : child);
				margin += bboxMargin(rightBBox);
			}
			return margin;
		}
		_adjustParentBBoxes(bbox, path, level) {
			// adjust bboxes along the given tree path
			for (let i = level; i >= 0; i--) {
				extend(path[i], bbox);
			}
		}
		_condense(path) {
			// go through the path, removing empty nodes and updating bboxes
			for (let i = path.length - 1, siblings; i >= 0; i--) {
				if (path[i].children.length === 0) {
					if (i > 0) {
						siblings = path[i - 1].children;
						siblings.splice(siblings.indexOf(path[i]), 1);
					} else this.clear();
				} else calcBBox(path[i], this.toBBox);
			}
		}
	}
	function findItem(item, items, equalsFn) {
		if (!equalsFn) return items.indexOf(item);
		for (let i = 0; i < items.length; i++) {
			if (equalsFn(item, items[i])) return i;
		}
		return -1;
	}

	// calculate node's bbox from bboxes of its children
	function calcBBox(node, toBBox) {
		distBBox(node, 0, node.children.length, toBBox, node);
	}

	// min bounding rectangle of node children from k to p-1
	function distBBox(node, k, p, toBBox, destNode) {
		if (!destNode) destNode = createNode(null);
		destNode.minX = Infinity;
		destNode.minY = Infinity;
		destNode.maxX = -Infinity;
		destNode.maxY = -Infinity;
		for (let i = k; i < p; i++) {
			const child = node.children[i];
			extend(destNode, node.leaf ? toBBox(child) : child);
		}
		return destNode;
	}
	function extend(a, b) {
		a.minX = Math.min(a.minX, b.minX);
		a.minY = Math.min(a.minY, b.minY);
		a.maxX = Math.max(a.maxX, b.maxX);
		a.maxY = Math.max(a.maxY, b.maxY);
		return a;
	}
	function compareNodeMinX(a, b) {
		return a.minX - b.minX;
	}
	function compareNodeMinY(a, b) {
		return a.minY - b.minY;
	}
	function bboxArea(a) {
		return (a.maxX - a.minX) * (a.maxY - a.minY);
	}
	function bboxMargin(a) {
		return a.maxX - a.minX + (a.maxY - a.minY);
	}
	function enlargedArea(a, b) {
		return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
	}
	function intersectionArea(a, b) {
		const minX = Math.max(a.minX, b.minX);
		const minY = Math.max(a.minY, b.minY);
		const maxX = Math.min(a.maxX, b.maxX);
		const maxY = Math.min(a.maxY, b.maxY);
		return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
	}
	function contains(a, b) {
		return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
	}
	function intersects(a, b) {
		return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
	}
	function createNode(children) {
		return {
			children,
			height: 1,
			leaf: true,
			minX: Infinity,
			minY: Infinity,
			maxX: -Infinity,
			maxY: -Infinity
		};
	}

	// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
	// combines selection algorithm with binary divide & conquer approach

	function multiSelect(arr, left, right, n, compare) {
		const stack = [left, right];
		while (stack.length) {
			right = stack.pop();
			left = stack.pop();
			if (right - left <= n) continue;
			const mid = left + Math.ceil((right - left) / n / 2) * n;
			quickselect(arr, mid, left, right, compare);
			stack.push(left, mid, mid, right);
		}
	}

	class BlockRBush extends RBush {
		toBBox({
			position,
			dimensions
		}) {
			return {
				minX: ui_vue3.toValue(position).x,
				minY: ui_vue3.toValue(position).y,
				maxX: ui_vue3.toValue(position).x + ui_vue3.toValue(dimensions).width,
				maxY: ui_vue3.toValue(position).y + ui_vue3.toValue(dimensions).height
			};
		}
		compareMinX({
			position: positionA
		}, {
			position: positionB
		}) {
			return ui_vue3.toValue(positionA).x - ui_vue3.toValue(positionB).x;
		}
		compareMinY({
			position: positionA
		}, {
			position: positionB
		}) {
			return ui_vue3.toValue(positionA).y - ui_vue3.toValue(positionB).y;
		}
	}

	// A connection item carrying its own routing-aware bounding box, so toBBox stays
	// self-contained (like BlockRBush reads position/dimensions off the block).

	// Routing parameters of a single connection, taken from state refs (not constants),
	// so the box matches the geometry actually produced in connection-state.js. The two
	// firstSegmentSize values are the real per-endpoint first-segment lengths (many-port
	// count * offset, or single-port (index + 1) * offset), resolved the same way drawing
	// resolves them (connection-state.js:75-140).

	// Safe minimum padding used when runtime routing values are unavailable. Equals the
	// single-connection extent (offset + borderRadius + one bend), the same 70px the box
	// used before routing params were threaded in.
	const CONNECTION_ROUTE_PADDING = CONNECTION_OFFSET + CONNECTION_BEND_OFFSET + CONNECTION_BORDER_RADIUS;

	// Orthogonal routing bends the path outside the raw union of the endpoint boxes. The
	// first segment extends by the endpoint's real firstSegmentSize (single-port
	// (index + 1) * offset, or many-port count * offset); the bend point is then pushed
	// perpendicular by the endpoint's secondSegmentSize (~block width/height, see
	// connection-state.js:208-213); the bend itself adds offset + bendOffset * (order + 1)
	// (connection-state.js:127, 138). We pad by the max of the two endpoints' first and
	// second segments and the bend extent, plus borderRadius, so no single excursion can
	// leave the box. The padding is applied symmetrically to every side, so taking the
	// largest excursion on any axis is safe (the box can only grow). At index 0 / order 0
	// with zero/absent second segments this equals offset + bendOffset + borderRadius (the
	// old 70px). Keeping the padding at least as large as the real geometry means culling
	// never hides a visible connection (a false hide is worse than an extra item in the set).
	function resolveRoutePadding(routing) {
		if (routing === null) {
			return CONNECTION_ROUTE_PADDING;
		}
		const {
			offset,
			bendOffset,
			borderRadius,
			secondSegmentOrder
		} = routing;
		if (!Number.isFinite(offset) || !Number.isFinite(bendOffset) || !Number.isFinite(borderRadius)) {
			return CONNECTION_ROUTE_PADDING;
		}
		const order = Number.isFinite(secondSegmentOrder) ? Math.max(secondSegmentOrder, 0) : 0;
		const sourceFirstSegmentSize = Number.isFinite(routing.sourceFirstSegmentSize) ? Math.max(routing.sourceFirstSegmentSize, 0) : 0;
		const targetFirstSegmentSize = Number.isFinite(routing.targetFirstSegmentSize) ? Math.max(routing.targetFirstSegmentSize, 0) : 0;
		const sourceSecondSegmentSize = Number.isFinite(routing.sourceSecondSegmentSize) ? Math.max(routing.sourceSecondSegmentSize, 0) : 0;
		const targetSecondSegmentSize = Number.isFinite(routing.targetSecondSegmentSize) ? Math.max(routing.targetSecondSegmentSize, 0) : 0;
		return Math.max(sourceFirstSegmentSize, targetFirstSegmentSize, sourceSecondSegmentSize, targetSecondSegmentSize, offset + bendOffset * (order + 1)) + borderRadius;
	}

	/**
	 * Both ends of the connection resolve to a block of the model. This is the admission rule of
	 * the connection index — a connection failing it has no route to draw — so every other set of
	 * connections shown on the canvas is held to the same rule.
	 */
	function hasBothEndpointsInModel(connection, getBlockById) {
		return getBlockById(connection.sourceBlockId) !== null && getBlockById(connection.targetBlockId) !== null;
	}

	/**
	 * ALG-02: box of a connection = union of its endpoint block boxes (taken from the
	 * MODEL position/dimensions), expanded by the routing padding. When routing params are
	 * given the padding follows the real geometry; otherwise it falls back to the safe
	 * minimum. Returns null when an endpoint block is absent from the model — such a
	 * connection is left out of the index.
	 */
	function computeConnectionBBox(connection, getBlockById, routing = null) {
		if (!hasBothEndpointsInModel(connection, getBlockById)) {
			return null;
		}
		const src = getBlockById(connection.sourceBlockId);
		const tgt = getBlockById(connection.targetBlockId);
		const srcPosition = ui_vue3.toValue(src.position);
		const srcDimensions = ui_vue3.toValue(src.dimensions);
		const tgtPosition = ui_vue3.toValue(tgt.position);
		const tgtDimensions = ui_vue3.toValue(tgt.dimensions);
		const minX = Math.min(srcPosition.x, tgtPosition.x);
		const minY = Math.min(srcPosition.y, tgtPosition.y);
		const maxX = Math.max(srcPosition.x + srcDimensions.width, tgtPosition.x + tgtDimensions.width);
		const maxY = Math.max(srcPosition.y + srcDimensions.height, tgtPosition.y + tgtDimensions.height);
		const padding = resolveRoutePadding(routing);
		return {
			minX: minX - padding,
			minY: minY - padding,
			maxX: maxX + padding,
			maxY: maxY + padding
		};
	}
	class ConnectionRBush extends RBush {
		toBBox({
			minX,
			minY,
			maxX,
			maxY
		}) {
			return {
				minX,
				minY,
				maxX,
				maxY
			};
		}
		compareMinX(a, b) {
			return a.minX - b.minX;
		}
		compareMinY(a, b) {
			return a.minY - b.minY;
		}
	}

	function isPortMeasured(portsRectMap, blockId, portId) {
		return blockId in portsRectMap && portId in portsRectMap[blockId];
	}

	// True when the port still exists in the model block and can actually render (and so be
	// measured). A connection pointing at a deleted/absent port would never write to
	// portsRectMap, so measuring it must not be requested — otherwise its endpoint block
	// would stay in the visible set forever and culling for it would be disabled.
	function isPortRenderable(blockById, blockId, portId) {
		const block = blockById?.get(blockId);
		if (block === undefined || block === null) {
			return false;
		}
		const ports = ui_vue3.toValue(block)?.ports ?? [];
		return ports.some(port => (ui_vue3.toValue(port)?.id ?? port?.id) === portId);
	}

	/**
	 * ALG-03 (Phase 3, P3.T1): endpoints of the viewport-crossing connections whose port
	 * coordinates were never measured (absent from portsRectMap) AND whose port still exists
	 * in the model (renderable). Such an endpoint started off-screen and was never mounted,
	 * so Phase 1 has no geometry to retain — it needs one pointed measure-mount. The
	 * "measured" check mirrors connection-state.js (both block id and port id must be
	 * present). A connection to a port absent from the model is inconsistent and skipped: it
	 * would never be measured, so requesting it would pin its block into the visible set.
	 * Only ends of the given connections are considered, so the set stays bounded by the
	 * connections that cross the viewport — culling is not disabled.
	 */
	function collectEndpointsToMeasure(connections, portsRectMap, blockById) {
		const endpoints = new Set();
		for (const connection of connections) {
			if (!isPortMeasured(portsRectMap, connection.sourceBlockId, connection.sourcePortId) && isPortRenderable(blockById, connection.sourceBlockId, connection.sourcePortId)) {
				endpoints.add(connection.sourceBlockId);
			}
			if (!isPortMeasured(portsRectMap, connection.targetBlockId, connection.targetPortId) && isPortRenderable(blockById, connection.targetBlockId, connection.targetPortId)) {
				endpoints.add(connection.targetBlockId);
			}
		}
		return endpoints;
	}

	/**
	 * P3.T2: up to batchSize never-measured ends to mount this cycle, skipping ends already
	 * visible and ids absent from the model. Iterates measureIds in insertion order so the
	 * batch boundary is deterministic; the caller drains the rest over the next cycles as
	 * measuring each batch drops its ends from measureIds.
	 */
	function takeFirstMeasureBatch(measureIds, visibleIds, blockById, batchSize) {
		const batch = [];
		for (const blockId of measureIds) {
			if (batch.length >= batchSize) {
				break;
			}
			if (visibleIds.has(blockId)) {
				continue;
			}
			const block = blockById.get(blockId);
			if (block !== undefined) {
				batch.push(block);
			}
		}
		return batch;
	}

	const CONNECTION_ROUTE_HIT_TOLERANCE = 12;
	class BlockIntersections {
		#tree = null;
		#connectionTree = null;
		#state = null;
		#selectVisibleBlocksRafId = null;
		#selectVisibleConnectionsRafId = null;
		#loadConnectionsRafId = null;
		#connectionRouteCache = new Map();
		#interactingBlocksCache = new Map();
		// Connections the running gesture keeps on the canvas, and the set of nodes they were derived
		// for. Null while nothing is derived.
		#gestureConnections = null;
		#gestureConnectionsHeldIds = null;
		visibleBlocks = ui_vue3.ref([]);
		visibleBlockIds = ui_vue3.computed(() => {
			return new Set(ui_vue3.toValue(this.visibleBlocks).map(block => block.id));
		});

		// P3.T1: ends of viewport-crossing connections whose geometry was never measured.
		blocksToMeasureIds = ui_vue3.computed(() => {
			if (!(this.#state?.isRenderOptimizationAvailable ?? false)) {
				return new Set();
			}
			return collectEndpointsToMeasure(ui_vue3.toValue(this.visibleConnections), this.#state?.portsRectMap ?? {}, this.#blockByIdMap(this.#state?.blocks ?? []));
		});
		groupedVisibleBlocks = ui_vue3.computed(() => {
			const blocks = this.#state?.isRenderOptimizationAvailable ?? false ? this.#visibleBlocksWithMeasureEndpoints() : this.#state?.blocks ?? [];
			return ui_vue3.toValue(blocks).reduce((acc, block) => {
				const type = block?.type ?? BLOCK_GROUP_DEFAULT_NAME;
				if (type in acc) {
					acc[type].push(block);
				} else {
					acc[type] = [block];
				}
				return acc;
			}, {
				[BLOCK_GROUP_DEFAULT_NAME]: []
			});
		});
		visibleBlockGroupNames = ui_vue3.computed(() => {
			return Object.keys(ui_vue3.toValue(this.groupedVisibleBlocks));
		});
		visiblePorts = ui_vue3.computed(() => {
			const portsMap = new Map();
			for (const block of ui_vue3.toValue(this.visibleBlocks)) {
				for (const port of block.ports) {
					if (!portsMap.has(block.id)) {
						portsMap.set(block.id, new Map());
					}
					portsMap.get(block.id).set(port.id, port);
				}
			}
			return portsMap;
		});
		visibleConnections = ui_vue3.ref([]);
		groupedVisibleConnections = ui_vue3.computed(() => {
			const connections = this.#state?.isRenderOptimizationAvailable ?? false ? this.visibleConnections : this.#state?.connections ?? [];
			return ui_vue3.toValue(connections).reduce((acc, connection) => {
				const type = connection?.type ?? CONNECTION_GROUP_DEFAULT_NAME;
				if (type in acc) {
					acc[type].push(connection);
				} else {
					acc[type] = [connection];
				}
				return acc;
			}, {
				[CONNECTION_GROUP_DEFAULT_NAME]: []
			});
		});
		visibleConnectionGroupNames = ui_vue3.computed(() => {
			return Object.keys(ui_vue3.toValue(this.groupedVisibleConnections));
		});
		constructor(ctx) {
			this.#state = ctx.state;
			this.#tree = new BlockRBush();
		}
		#shouldMaintainConnectionIndex() {
			return (this.#state?.isRenderOptimizationAvailable ?? false) || (this.#state?.connectionRouteHitTestEnabled ?? false);
		}
		#ensureConnectionTree() {
			this.#connectionTree ??= new ConnectionRBush();
			return this.#connectionTree;
		}
		#disableConnectionIndex() {
			if (this.#selectVisibleConnectionsRafId !== null) {
				cancelAnimationFrame(this.#selectVisibleConnectionsRafId);
				this.#selectVisibleConnectionsRafId = null;
			}
			if (this.#loadConnectionsRafId !== null) {
				cancelAnimationFrame(this.#loadConnectionsRafId);
				this.#loadConnectionsRafId = null;
			}
			this.#connectionTree?.clear();
			this.#connectionTree = null;
			this.#connectionRouteCache.clear();
			this.#resetGestureConnections();
			this.visibleConnections.value = [];
		}

		// P3.T2: for one render cycle, append the never-measured connection ends to the
		// visible set so their ports mount and onMountedPort measures them. After that
		// Phase 1 retention keeps the geometry, blocksToMeasureIds no longer returns them,
		// and they are culled again — the measure-mount is strictly one-time per end.
		//
		// At most FIRST_MEASURE_BATCH_SIZE ends are added per cycle. Measuring the batch
		// writes portsRectMap, which blocksToMeasureIds reads, so the computed re-runs, drops
		// the measured ends, and the next cycle takes the next batch — a large off-screen set
		// drains over several frames without a single long measure task (no explicit queue).
		#visibleBlocksWithMeasureEndpoints() {
			const visible = ui_vue3.toValue(this.visibleBlocks);
			const measureIds = ui_vue3.toValue(this.blocksToMeasureIds);
			if (measureIds.size === 0) {
				return visible;
			}
			const visibleIds = ui_vue3.toValue(this.visibleBlockIds);
			const blockById = this.#blockByIdMap(this.#state?.blocks ?? []);
			const measureBlocks = takeFirstMeasureBatch(measureIds, visibleIds, blockById, FIRST_MEASURE_BATCH_SIZE);
			return measureBlocks.length === 0 ? visible : [...visible, ...measureBlocks];
		}

		// Builds an O(1) id→block lookup once per index rebuild, so connection boxes resolve
		// their endpoints in O(C + B) instead of O(C × B) (a linear blocks.find per connection).
		#blockByIdMap(blocks) {
			return new Map(ui_vue3.toValue(blocks ?? []).map(block => [ui_vue3.toValue(block).id, block]));
		}

		// Connection index items (connection + routing-aware bbox), skipping any connection
		// whose endpoint block is absent from the given lookup. Routing params come from the
		// live state refs so the box matches the geometry connection-state.js actually draws.
		#buildConnectionItems(connections, blockById) {
			const offset = ui_vue3.toValue(this.#state?.connectionOffset);
			const bendOffset = ui_vue3.toValue(this.#state?.connectionBendOffset);
			const borderRadius = ui_vue3.toValue(this.#state?.connectionBorderRadius);
			const offsetMap = ui_vue3.toValue(this.#state?.connectionsOffsetMap) ?? {};
			const portsRectMap = ui_vue3.toValue(this.#state?.portsRectMap) ?? {};
			return ui_vue3.toValue(connections ?? []).map(connection => {
				const rawConnection = ui_vue3.toRaw(ui_vue3.unref(connection));
				const routing = {
					offset,
					bendOffset,
					borderRadius,
					secondSegmentOrder: this.#connectionSecondSegmentOrder(rawConnection, offsetMap),
					sourceFirstSegmentSize: this.#endpointFirstSegmentSize(rawConnection.sourceBlockId, rawConnection.sourcePortId, rawConnection.id, offsetMap, portsRectMap, offset, blockById),
					targetFirstSegmentSize: this.#endpointFirstSegmentSize(rawConnection.targetBlockId, rawConnection.targetPortId, rawConnection.id, offsetMap, portsRectMap, offset, blockById),
					sourceSecondSegmentSize: this.#endpointSecondSegmentSize(rawConnection.sourceBlockId, rawConnection.sourcePortId, rawConnection.id, offsetMap, portsRectMap, bendOffset, blockById),
					targetSecondSegmentSize: this.#endpointSecondSegmentSize(rawConnection.targetBlockId, rawConnection.targetPortId, rawConnection.id, offsetMap, portsRectMap, bendOffset, blockById)
				};
				const bbox = computeConnectionBBox(rawConnection, blockId => blockById.get(blockId) ?? null, routing);
				const hasFiniteBBox = bbox !== null && [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY].every(value => Number.isFinite(value));
				return hasFiniteBBox ? {
					...rawConnection,
					...bbox
				} : null;
			}).filter(connection => connection !== null);
		}

		// Real first-segment length of one connection end, resolved the same way drawing
		// resolves it (connection-state.js:75-140): a many-connection port uses the per-
		// connection firstSegmentSize (count * offset), a single-connection port uses the
		// measured/retained value in portsRectMap ((portIndex + 1) * offset). When the port
		// was never measured, fall back to a conservative estimate from its index in the
		// model block's ports, so the bbox never underestimates a high-index port.
		#endpointFirstSegmentSize(blockId, portId, connectionId, offsetMap, portsRectMap, offset, blockById) {
			const portOffsets = offsetMap?.[blockId]?.[portId];
			const hasManyConnection = Object.keys(portOffsets ?? {}).length > 1;
			if (hasManyConnection) {
				const size = portOffsets?.[connectionId]?.firstSegmentSize;
				if (Number.isFinite(size)) {
					return size;
				}
			}
			const measured = portsRectMap?.[blockId]?.[portId]?.firstSegmentSize;
			if (Number.isFinite(measured) && measured > 0) {
				return measured;
			}
			return this.#estimateFirstSegmentSize(blockId, portId, offset, blockById);
		}

		// Conservative first-segment estimate for a never-measured port: (portIndex + 1) *
		// offset, matching updatePortSegmentSizes (actions.js:508/514). Falls back to a single
		// offset when the port is not found in the model block.
		#estimateFirstSegmentSize(blockId, portId, offset, blockById) {
			const step = Number.isFinite(offset) ? offset : 0;
			const block = blockById.get(blockId);
			const ports = ui_vue3.toValue(block)?.ports ?? [];
			const index = ports.findIndex(port => (ui_vue3.toValue(port)?.id ?? port?.id) === portId);
			return (index >= 0 ? index + 1 : 1) * step;
		}

		// Real second-segment length of one connection end, resolved the same way drawing
		// resolves it (connection-state.js:126-128, 137-139): a many-connection port uses the
		// measured secondSegmentSizeWithoutOffset plus bendOffset * secondSegmentOrder, a
		// single-connection port uses the measured secondSegmentSize. When the port was never
		// measured, fall back to a conservative upper bound from the model block's dimensions,
		// so the bbox never underestimates the perpendicular bend excursion (~block size).
		#endpointSecondSegmentSize(blockId, portId, connectionId, offsetMap, portsRectMap, bendOffset, blockById) {
			const portRect = portsRectMap?.[blockId]?.[portId];
			const portOffsets = offsetMap?.[blockId]?.[portId];
			const hasManyConnection = Object.keys(portOffsets ?? {}).length > 1;
			const step = Number.isFinite(bendOffset) ? bendOffset : 0;
			if (hasManyConnection) {
				const withoutOffset = portRect?.secondSegmentSizeWithoutOffset;
				if (Number.isFinite(withoutOffset) && withoutOffset > 0) {
					const order = portOffsets?.[connectionId]?.secondSegmentOrder ?? 0;
					return withoutOffset + step * Math.max(order, 0);
				}
			} else {
				const measured = portRect?.secondSegmentSize;
				if (Number.isFinite(measured) && measured > 0) {
					return measured;
				}
			}
			return this.#estimateSecondSegmentSize(blockId, portId, connectionId, offsetMap, step, blockById);
		}

		// Conservative second-segment estimate for a never-measured port: the drawn value is
		// blockDimension - portOffset + bendOffset * (order + 1) (actions.js:519-520), and
		// portOffset >= 0, so max(blockWidth, blockHeight) + bendOffset * (order + 1) is a safe
		// upper bound regardless of the port's (still unknown) side. Direction is safe — the
		// padding only grows.
		#estimateSecondSegmentSize(blockId, portId, connectionId, offsetMap, bendStep, blockById) {
			const block = blockById.get(blockId);
			const dimensions = ui_vue3.toValue(block)?.dimensions ?? {};
			const width = Number.isFinite(dimensions.width) ? dimensions.width : 0;
			const height = Number.isFinite(dimensions.height) ? dimensions.height : 0;
			const order = offsetMap?.[blockId]?.[portId]?.[connectionId]?.secondSegmentOrder ?? 0;
			return Math.max(width, height) + bendStep * (Math.max(order, 0) + 1);
		}

		// Largest secondSegmentOrder among the connection's two endpoints — a port carrying
		// several connections fans each bend out by bendOffset * order (connection-state.js).
		#connectionSecondSegmentOrder(connection, offsetMap) {
			const {
				id,
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId
			} = connection;
			const sourceOrder = offsetMap?.[sourceBlockId]?.[sourcePortId]?.[id]?.secondSegmentOrder ?? 0;
			const targetOrder = offsetMap?.[targetBlockId]?.[targetPortId]?.[id]?.secondSegmentOrder ?? 0;
			return Math.max(sourceOrder, targetOrder);
		}

		// Clears and reloads the connection index from the given blocks/connections. Shared
		// by the coalesced current-model rebuild and the synchronous history-snapshot rebuild.
		#rebuildConnectionIndex(connections, blocks) {
			if (!this.#shouldMaintainConnectionIndex()) {
				this.#disableConnectionIndex();
				return;
			}
			const blockById = this.#blockByIdMap(blocks);
			const prepared = this.#buildConnectionItems(connections, blockById);

			// The connections held for a running gesture were derived from the model this rebuild
			// replaces, so they are derived again on the next pass.
			this.#resetGestureConnections();
			this.#pruneConnectionRouteCache(connections);
			const connectionTree = this.#ensureConnectionTree();
			connectionTree.clear();
			connectionTree.load(prepared);
			if (this.#state?.isRenderOptimizationAvailable ?? false) {
				this.#updateVisibleConnections();
			}
		}
		#pruneConnectionRouteCache(connections) {
			const activeIds = new Set(ui_vue3.toValue(connections ?? []).map(connection => ui_vue3.toRaw(ui_vue3.unref(connection)).id));
			for (const connectionId of this.#connectionRouteCache.keys()) {
				if (!activeIds.has(connectionId)) {
					this.#connectionRouteCache.delete(connectionId);
				}
			}
		}

		// Rebuilds the whole connection index from the current model. Connection boxes
		// derive from block positions, so a block move refreshes them here too; a full
		// rebuild avoids RBush remove-by-navigation, which is unsafe for items whose
		// geometry lives outside the item. Coalesced through a RAF so a drag (deep block
		// watcher firing per mousemove) triggers at most one rebuild per frame.
		loadConnections() {
			if (!this.#shouldMaintainConnectionIndex()) {
				this.#disableConnectionIndex();
				return;
			}
			if (this.#loadConnectionsRafId !== null) {
				return;
			}
			this.#loadConnectionsRafId = requestAnimationFrame(() => {
				this.#loadConnectionsRafId = null;
				this.#rebuildConnectionIndex(this.#state?.connections ?? [], this.#state?.blocks ?? []);
			});
		}

		// Rebuilds the connection index from an explicit snapshot (blocks + connections),
		// used by history undo/redo. On revert the props watcher empties the index through
		// clear() and its own loadConnections only lands on the next frame, so without an
		// immediate rebuild the index would stay empty for a frame while blocks are restored.
		// Resolves endpoint boxes from the snapshot's own blocks (state refs may not yet
		// reflect the snapshot at hook time).
		loadConnectionsFromSnapshot(connections, blocks) {
			if (!this.#shouldMaintainConnectionIndex()) {
				this.#disableConnectionIndex();
				return;
			}

			// A pending coalesced rebuild would repeat this same work one frame later, so the full
			// synchronous rebuild supersedes it. Dropping that frame used to be a side effect of
			// clear() in the history hooks; the dedup belongs to the rebuild itself.
			if (this.#loadConnectionsRafId !== null) {
				cancelAnimationFrame(this.#loadConnectionsRafId);
				this.#loadConnectionsRafId = null;
			}

			// Intentionally synchronous: closes the one-frame index gap left by the props
			// watcher's clear(); must not be coalesced through a RAF.
			this.#rebuildConnectionIndex(connections, blocks);
		}
		selectVisibleConnections() {
			if (!(this.#state?.isRenderOptimizationAvailable ?? false)) {
				return;
			}
			if (this.#selectVisibleConnectionsRafId !== null) {
				return;
			}
			this.#selectVisibleConnectionsRafId = requestAnimationFrame(() => {
				this.#selectVisibleConnectionsRafId = null;
				this.#updateVisibleConnections();
			});
		}
		#updateVisibleConnections() {
			const {
				transformX,
				transformY,
				zoom,
				canvasWidth,
				canvasHeight
			} = this.#state;
			this.visibleConnections.value = this.#withGestureConnections(this.#connectionTree?.search({
				minX: ui_vue3.toValue(transformX),
				minY: ui_vue3.toValue(transformY),
				maxX: ui_vue3.toValue(transformX) + ui_vue3.toValue(canvasWidth) / ui_vue3.toValue(zoom),
				maxY: ui_vue3.toValue(transformY) + ui_vue3.toValue(canvasHeight) / ui_vue3.toValue(zoom)
			}) ?? []);
		}

		// The connection index is frozen exactly like the block one: a connection box is computed from
		// the endpoint positions in the model, and a gesture reaches the model only on mouseup. Once
		// autoscroll pans the camera past a pre-gesture box, the culling pass drops the connection
		// although its nodes are retained, mounted and on screen and its route still follows the
		// gesture - the user sees nodes with nothing between them. Keep every connection with an end
		// among the nodes of the gesture, and only while those nodes are retained. Every writer of
		// visibleConnections goes through here, clear() included: it empties the set synchronously
		// while the refill waits for a RAF. Duplicates are ruled out by id.
		#withGestureConnections(connections) {
			if (!(this.#state?.isRenderOptimizationAvailable ?? false)) {
				return connections;
			}
			const interactingIds = this.#interactingBlockIds();
			if (interactingIds.size === 0) {
				this.#resetGestureConnections();
				return connections;
			}
			const gestureConnections = this.#heldGestureConnections(interactingIds);
			if (gestureConnections.length === 0) {
				return connections;
			}
			const presentIds = new Set();
			connections.forEach(connection => presentIds.add(ui_vue3.toValue(connection).id));
			const missing = gestureConnections.filter(connection => !presentIds.has(connection.id));
			return missing.length === 0 ? connections : [...connections, ...missing];
		}

		// Connections the gesture keeps on the canvas: those with an end among its nodes. The whole
		// point of the gesture is that the model is not written until mouseup, so this set is derived
		// once and then only filtered against what the culling pass already reports. It is dropped when
		// the nodes of the gesture change and when the connection index is rebuilt - the two events
		// that can change the model behind it.
		#heldGestureConnections(interactingIds) {
			if (this.#gestureConnections !== null && this.#isSameHeldIds(interactingIds)) {
				return this.#gestureConnections;
			}
			const blockById = this.#blockByIdMap(this.#state?.blocks ?? []);
			const getBlockById = blockId => blockById.get(blockId) ?? null;

			// The model is filtered before it is converted: only the connections kept for the gesture
			// are worth taking out of the reactive wrapper.
			this.#gestureConnections = ui_vue3.toValue(this.#state?.connections ?? []).filter(connection => {
				const candidate = ui_vue3.toValue(connection);
				return (interactingIds.has(candidate.sourceBlockId) || interactingIds.has(candidate.targetBlockId)

				// A connection the index refused has no route to draw: mounting it would put an
				// empty path and its delete button at the origin of the canvas.
				) && hasBothEndpointsInModel(candidate, getBlockById);
			}).map(connection => ui_vue3.toRaw(ui_vue3.unref(connection)));
			this.#gestureConnectionsHeldIds = new Set(interactingIds);
			return this.#gestureConnections;
		}
		#isSameHeldIds(interactingIds) {
			const heldIds = this.#gestureConnectionsHeldIds;
			if (heldIds === null || heldIds.size !== interactingIds.size) {
				return false;
			}
			for (const blockId of interactingIds) {
				if (!heldIds.has(blockId)) {
					return false;
				}
			}
			return true;
		}
		#resetGestureConnections() {
			this.#gestureConnections = null;
			this.#gestureConnectionsHeldIds = null;
		}

		// Nodes of the running gesture: the one being resized, the one leading a drag, the whole set
		// the gesture registered and the source of a new connection. Empty once the gesture ends, so
		// nothing is retained past it.
		#interactingBlockIds() {
			const interactingIds = new Set();
			const resizingId = this.#state?.resizingBlock?.id ?? null;
			const movingId = ui_vue3.toValue(this.#state?.movingBlockId) ?? null;
			const gestureIds = ui_vue3.toValue(this.#state?.gestureBlockIds) ?? null;
			if (resizingId !== null) {
				interactingIds.add(resizingId);
			}
			if (movingId !== null) {
				interactingIds.add(movingId);
			}
			gestureIds?.forEach(blockId => interactingIds.add(blockId));

			// The camera pans away from the source node while a new connection is drawn, and culling it
			// would take the source port marker off the screen mid-gesture.
			const connectionSourceId = ui_vue3.toValue(this.#state?.newConnection)?.sourceBlockId ?? null;
			if (connectionSourceId !== null) {
				interactingIds.add(connectionSourceId);
			}
			return interactingIds;
		}
		load(blocks) {
			this.#interactingBlocksCache.clear();
			this.#tree?.load(ui_vue3.toRaw(ui_vue3.unref(blocks)));
			this.selectVisibleBlocks();
		}
		search(searchRect) {
			return this.#tree.search(searchRect);
		}
		findConnectionRouteHits(rect) {
			if (!this.#shouldMaintainConnectionIndex()) {
				return [];
			}
			const zoom = ui_vue3.toValue(this.#state?.zoom);
			if (!Number.isFinite(zoom) || zoom <= 0) {
				return [];
			}
			const canvasTolerance = CONNECTION_ROUTE_HIT_TOLERANCE / zoom;
			const expandedRect = expandRect(rect, canvasTolerance);
			if (expandedRect === null) {
				return [];
			}
			const candidates = this.#connectionTree?.search({
				minX: expandedRect.x,
				minY: expandedRect.y,
				maxX: expandedRect.x + expandedRect.width,
				maxY: expandedRect.y + expandedRect.height
			}) ?? [];
			const hits = [];
			for (const candidate of candidates) {
				const connection = ui_vue3.toRaw(ui_vue3.unref(candidate));
				const segments = this.#getConnectionRouteSegments(connection, zoom);
				if (segments.length === 0) {
					continue;
				}
				const distancePx = distanceBetweenRectAndSegments(rect, segments) * zoom;
				if (Number.isFinite(distancePx) && distancePx <= CONNECTION_ROUTE_HIT_TOLERANCE) {
					hits.push({
						connection,
						distancePx
					});
				}
			}
			return sortConnectionRouteHits(hits, hit => createConnectionStructuralSignature(hit.connection));
		}
		#getConnectionRouteSegments(connection, zoom) {
			const options = {
				connection,
				portsRectMap: ui_vue3.toValue(this.#state?.portsRectMap) ?? {},
				connectionsOffsetMap: ui_vue3.toValue(this.#state?.connectionsOffsetMap) ?? {},
				bendOffset: ui_vue3.toValue(this.#state?.connectionBendOffset),
				offset: ui_vue3.toValue(this.#state?.connectionOffset),
				borderRadius: ui_vue3.toValue(this.#state?.connectionBorderRadius)
			};
			const portsPosition = resolveConnectionPortsPosition(options);
			const key = createConnectionRouteCacheKey({
				...options,
				portsPosition,
				zoom
			});
			if (portsPosition === null || key === null) {
				this.#connectionRouteCache.delete(connection.id);
				return [];
			}
			const cached = this.#connectionRouteCache.get(connection.id);
			if (cached?.key === key) {
				return cached.segments;
			}
			const route = resolveRenderedConnectionRoute(options);
			const segments = route === null ? [] : flattenConnectionRoute(route.primitives, zoom, 1);
			if (segments.length === 0) {
				this.#connectionRouteCache.delete(connection.id);
				return [];
			}
			this.#connectionRouteCache.set(connection.id, {
				key,
				segments
			});
			return segments;
		}
		selectVisibleBlocks() {
			if (this.#selectVisibleBlocksRafId !== null) {
				return;
			}
			this.#selectVisibleBlocksRafId = requestAnimationFrame(() => {
				this.#selectVisibleBlocksRafId = null;
				this.#updateVisibleBlocks();
			});
		}
		#updateVisibleBlocks() {
			const {
				transformX,
				transformY,
				zoom,
				canvasWidth,
				canvasHeight
			} = this.#state;
			const blocks = this.#withInteractingBlocks(this.#tree.search({
				minX: ui_vue3.toValue(transformX),
				minY: ui_vue3.toValue(transformY),
				maxX: ui_vue3.toValue(transformX) + ui_vue3.toValue(canvasWidth) / ui_vue3.toValue(zoom),
				maxY: ui_vue3.toValue(transformY) + ui_vue3.toValue(canvasHeight) / ui_vue3.toValue(zoom)
			}));
			if (this.#isSameVisibleBlocks(blocks)) {
				return;
			}
			this.visibleBlocks.value = blocks;
		}

		// A camera frame usually brings back the very same nodes, only in another order, and
		// reassigning the ref republishes visibleBlockIds, visiblePorts and everything watching
		// them on every frame of a pan. The set is compared by its composition - which block
		// answers for which id - so a pass that changed nothing leaves the ref untouched, while
		// a block replaced by a fresh object (insert, update, history restore) still goes through.
		// Object identity is the whole comparison, which leans on every write path replacing the
		// block object (insert, update, remove, load, clear): a node mutated in place - a changed
		// port list above all - would leave visibleBlockIds and visiblePorts stale.
		#isSameVisibleBlocks(blocks) {
			const current = ui_vue3.toValue(this.visibleBlocks);
			if (current.length !== blocks.length) {
				return false;
			}
			const currentById = new Map(current.map(block => [ui_vue3.toValue(block).id, ui_vue3.toRaw(ui_vue3.unref(block))]));
			return blocks.every(block => currentById.get(ui_vue3.toValue(block).id) === ui_vue3.toRaw(ui_vue3.unref(block)));
		}

		// The index holds the pre-gesture boxes of the blocks being moved or resized: staged geometry
		// reaches the model only on mouseup. Autoscroll can pan the camera past those boxes, and
		// culling such a block mid-gesture unmounts it, which tears the gesture down. Keep every node
		// of the gesture in the visible set until the gesture ends and the index catches up - a frame
		// drag moves a whole selection, so the retained set is the one the gesture registered, not a
		// single node. Every writer of visibleBlocks goes through here, not just the culling pass:
		// clear() empties the set synchronously while the refill waits for a RAF, so an unretained
		// block would unmount for a frame. Duplicates are ruled out by id.
		#withInteractingBlocks(blocks) {
			if (!(this.#state?.isRenderOptimizationAvailable ?? false)) {
				return blocks;
			}
			const interactingIds = this.#interactingBlockIds();
			this.#forgetInteractingBlocksExcept(interactingIds);
			const missingIds = new Set(interactingIds);
			blocks.forEach(block => missingIds.delete(ui_vue3.toValue(block).id));
			if (missingIds.size === 0) {
				return blocks;
			}
			const interactingBlocks = [...missingIds].map(blockId => this.#interactingBlock(blockId)).filter(block => block !== null);
			return interactingBlocks.length === 0 ? blocks : [...blocks, ...interactingBlocks];
		}

		// Once the camera has left the block behind, the retained block is missing from every
		// culling pass, and resolving it in the model would be a linear pass over the whole diagram
		// on every frame of the gesture. The model is read once per block and the answer is kept
		// until the gesture ends (#forgetInteractingBlocksExcept) or the block itself changes
		// (insert/remove/load).
		#interactingBlock(blockId) {
			const cached = this.#interactingBlocksCache.get(blockId) ?? null;
			if (cached !== null) {
				return cached;
			}
			const block = ui_vue3.toValue(this.#state?.blocks ?? []).find(stateBlock => ui_vue3.toValue(stateBlock).id === blockId) ?? null;
			if (block === null) {
				return null;
			}
			const rawBlock = ui_vue3.toRaw(ui_vue3.unref(block));
			this.#interactingBlocksCache.set(blockId, rawBlock);
			return rawBlock;
		}
		#forgetInteractingBlocksExcept(interactingIds) {
			this.#interactingBlocksCache.forEach((block, blockId) => {
				if (!interactingIds.has(blockId)) {
					this.#interactingBlocksCache.delete(blockId);
				}
			});
		}
		updateBlock(oldBlock, newBlock) {
			this.removeBlock(oldBlock);
			this.insertBlock(newBlock);
		}
		#preparedBlock(block) {
			return ui_vue3.toRaw(ui_vue3.unref({
				...block,
				position: ui_vue3.toRaw(ui_vue3.toValue(block).position),
				dimensions: ui_vue3.toRaw(ui_vue3.toValue(block).dimensions),
				ports: ui_vue3.toRaw(ui_vue3.unref(ui_vue3.toValue(block).ports))
			}));
		}
		insertBlock(block) {
			this.#interactingBlocksCache.delete(ui_vue3.toValue(block).id);
			this.#tree?.insert(this.#preparedBlock(block));
			this.selectVisibleBlocks();
		}
		removeBlock(block) {
			this.#interactingBlocksCache.delete(ui_vue3.toValue(block).id);
			this.#tree?.remove(this.#preparedBlock(block), (blockA, blockB) => {
				return ui_vue3.toValue(blockA).id === ui_vue3.toValue(blockB).id;
			});
			this.selectVisibleBlocks();
		}
		clear() {
			// The retained block is resolved from the model, so the answer must not outlive the
			// composition it was read from: clear() drops every block, and #withInteractingBlocks
			// below re-reads whatever is still interacting.
			this.#interactingBlocksCache.clear();
			if (this.#selectVisibleBlocksRafId !== null) {
				cancelAnimationFrame(this.#selectVisibleBlocksRafId);
				this.#selectVisibleBlocksRafId = null;
			}
			if (this.#selectVisibleConnectionsRafId !== null) {
				cancelAnimationFrame(this.#selectVisibleConnectionsRafId);
				this.#selectVisibleConnectionsRafId = null;
			}
			if (this.#loadConnectionsRafId !== null) {
				cancelAnimationFrame(this.#loadConnectionsRafId);
				this.#loadConnectionsRafId = null;
			}
			this.#tree?.clear();
			this.visibleBlocks.value = this.#withInteractingBlocks([]);
			this.#connectionTree?.clear();
			this.#connectionRouteCache.clear();
			// Dropped before the refill below: clear() answers a change of the model, and the held set
			// was derived from the model as it stood before it.
			this.#resetGestureConnections();
			this.visibleConnections.value = this.#withGestureConnections([]);
		}
	}

	class Node {
		constructor(obj, dimension, parent) {
			this.obj = obj;
			this.left = null;
			this.right = null;
			this.parent = parent;
			this.dimension = dimension;
		}
	}

	class BinaryHeap {
		content = [];
		scoreFunction = null;
		constructor(scoreFunction) {
			this.scoreFunction = scoreFunction;
		}
		push(element) {
			this.content.push(element);
			this.bubbleUp(this.content.length - 1);
		}
		pop() {
			const result = this.content[0];
			const end = this.content.pop();
			if (this.content.length > 0) {
				this.content[0] = end;
				this.sinkDown(0);
			}
			return result;
		}
		peek() {
			return this.content[0];
		}
		remove(node) {
			const len = this.content.length;
			for (let i = 0; i < len; i++) {
				if (this.content[i] === node) {
					const end = this.content.pop();
					if (i !== len - 1) {
						this.content[i] = end;
						if (this.scoreFunction(end) < this.scoreFunction(node)) {
							this.bubbleUp(i);
						} else {
							this.sinkDown(i);
						}
					}
					return;
				}
			}
			throw new Error('Node not found.');
		}
		size() {
			return this.content.length;
		}
		bubbleUp(n) {
			const element = this.content[n];
			while (n > 0) {
				const parentN = Math.floor((n + 1) / 2) - 1;
				const parent = this.content[parentN];
				if (this.scoreFunction(element) < this.scoreFunction(parent)) {
					this.content[parentN] = element;
					this.content[n] = parent;
					n = parentN;
				} else {
					break;
				}
			}
		}
		sinkDown(n) {
			const length = this.content.length;
			const element = this.content[n];
			const elemScore = this.scoreFunction(element);
			while (true) {
				const child2N = (n + 1) * 2;
				const child1N = child2N - 1;
				let swap = null;
				if (child1N < length) {
					const child1 = this.content[child1N];
					const child1Score = this.scoreFunction(child1);
					if (child1Score < elemScore) {
						swap = child1N;
					}
				}
				if (child2N < length) {
					const child2 = this.content[child2N];
					const child2Score = this.scoreFunction(child2);
					if (child2Score < (swap === null ? elemScore : child1Score)) {
						swap = child2N;
					}
				}
				if (swap === null) {
					break;
				} else {
					this.content[n] = this.content[swap];
					this.content[swap] = element;
					n = swap;
				}
			}
		}
	}

	class KdTree {
		#root = null;
		#dimensions = [];
		#metric = null;
		#bestNodes = new BinaryHeap(e => -e[1]);
		constructor(points, metric, dimensions) {
			this.#dimensions = dimensions;
			this.#metric = metric;
			if (Array.isArray(points)) {
				this.#root = this.buildTree(points, 0, null);
			} else {
				this.loadTree(points, metric, dimensions);
			}
		}
		buildTree(points, depth, parent) {
			const dim = depth % this.#dimensions.length;
			let median = 0;
			let node = null;
			if (points.length === 0) {
				return null;
			}
			if (points.length === 1) {
				return new Node(points[0], dim, parent);
			}
			points.sort((a, b) => {
				return a[this.#dimensions[dim]] - b[this.#dimensions[dim]];
			});
			median = Math.floor(points.length / 2);
			node = new Node(points[median], dim, parent);
			node.left = this.buildTree(points.slice(0, median), depth + 1, node);
			node.right = this.buildTree(points.slice(median + 1), depth + 1, node);
			return node;
		}
		#restoreParent(parentNode) {
			if (parentNode === null) {
				return;
			}
			if (this.#root.left) {
				this.#root.left.parent = this.#root;
				this.#restoreParent(this.#root.left);
			}
			if (this.#root.right) {
				this.#root.right.parent = this.#root;
				this.#restoreParent(this.#root.right);
			}
		}
		loadTree(data) {
			this.#root = data;
			this.#restoreParent(this.#root);
		}
		#nodeHeight(node) {
			if (node === null) {
				return 0;
			}
			return Math.max(this.#nodeHeight(node.left), this.#nodeHeight(node.right)) + 1;
		}
		#nodeCount(node) {
			if (node === null) {
				return 0;
			}
			return this.#nodeCount(node.left) + this.#nodeCount(node.right) + 1;
		}
		balanceFactor() {
			return this.#nodeHeight(this.#root) / (Math.log(this.#nodeCount(this.#root)) / Math.log(2));
		}
		#innerSearch(node, parent, point) {
			if (node === null) {
				return parent;
			}
			const dimension = this.#dimensions[node.dimension];
			if (point[dimension] < node.obj[dimension]) {
				return this.#innerSearch(node.left, node, point);
			}
			return this.#innerSearch(node.right, node, point);
		}
		insert(point) {
			const insertPosition = this.#innerSearch(this.#root, null, point);
			if (insertPosition === null) {
				this.#root = new Node(point, 0, null);
				return;
			}
			const newNode = new Node(point, (insertPosition.dimension + 1) % this.#dimensions.length, insertPosition);
			const dimension = this.#dimensions[insertPosition.dimension];
			if (point[dimension] < insertPosition.obj[dimension]) {
				insertPosition.left = newNode;
			} else {
				insertPosition.right = newNode;
			}
		}
		#nodeSearch(node, point) {
			if (node === null) {
				return null;
			}
			if (node.obj === point) {
				return node;
			}
			const dimension = this.#dimensions[node.dimension];
			if (point[dimension] < node.obj[dimension]) {
				return this.#nodeSearch(node.left, point);
			}
			return this.#nodeSearch(node.right, point);
		}
		#findMinNode(node, dim) {
			if (node === null) {
				return null;
			}
			const dimension = this.#dimensions[dim];
			if (node.dimension === dim) {
				if (node.left !== null) {
					return this.#findMinNode(node.left, dim);
				}
				return node;
			}
			const own = node.obj[dimension];
			const left = this.#findMinNode(node.left, dim);
			const right = this.#findMinNode(node.right, dim);
			let min = node;
			if (left !== null && left.obj[dimension] < own) {
				min = left;
			}
			if (right !== null && right.obj[dimension] < min.obj[dimension]) {
				min = right;
			}
			return min;
		}
		#removeNode(node) {
			const currentNode = node;
			if (currentNode.left === null && currentNode.right === null) {
				if (currentNode.parent === null) {
					this.#root = null;
					return;
				}
				const pDimension = this.#dimensions[currentNode.parent.dimension];
				if (currentNode.obj[pDimension] < currentNode.parent.obj[pDimension]) {
					currentNode.parent.left = null;
				} else {
					currentNode.parent.right = null;
				}
				return;
			}
			if (node.right === null) {
				const nextNode = this.#findMinNode(currentNode.left, node.dimension);
				const nextObj = nextNode.obj;
				this.#removeNode(nextNode);
				currentNode.right = node.left;
				currentNode.left = null;
				currentNode.obj = nextObj;
			} else {
				const nextNode = this.#findMinNode(currentNode.right, node.dimension);
				const nextObj = nextNode.obj;
				this.#removeNode(nextNode);
				currentNode.obj = nextObj;
			}
		}
		remove(point) {
			const node = this.#nodeSearch(this.#root, point);
			if (node === null) {
				return;
			}
			this.#removeNode(node);
		}
		#saveBestNode(node, distance, maxNodes) {
			this.#bestNodes.push([node, distance]);
			if (this.#bestNodes.size() > maxNodes) {
				this.#bestNodes.pop();
			}
		}
		#nearestSearch(node, point, maxNodes) {
			let bestChild = null;
			const dimension = this.#dimensions[node.dimension];
			const ownDistance = this.#metric(point, node.obj);
			const linearPoint = {};
			let linearDistance = 0;
			let otherChild = null;
			for (let i = 0; i < this.#dimensions.length; i += 1) {
				if (i === node.dimension) {
					linearPoint[this.#dimensions[i]] = point[this.#dimensions[i]];
				} else {
					linearPoint[this.#dimensions[i]] = node.obj[this.#dimensions[i]];
				}
			}
			linearDistance = this.#metric(linearPoint, node.obj);
			if (node.right === null && node.left === null) {
				if (this.#bestNodes.size() < maxNodes || ownDistance < this.#bestNodes.peek()[1]) {
					this.#saveBestNode(node, ownDistance, maxNodes);
				}
				return;
			}
			if (node.right === null) {
				bestChild = node.left;
			} else if (node.left === null) {
				bestChild = node.right;
			} else {
				bestChild = point[dimension] < node.obj[dimension] ? node.left : node.right;
			}
			this.#nearestSearch(bestChild, point, maxNodes);
			if (this.#bestNodes.size() < maxNodes || ownDistance < this.#bestNodes.peek()[1]) {
				this.#saveBestNode(node, ownDistance, maxNodes);
			}
			if (this.#bestNodes.size() < maxNodes || Math.abs(linearDistance) < this.#bestNodes.peek()[1]) {
				if (bestChild === node.left) {
					otherChild = node.right;
				} else {
					otherChild = node.left;
				}
				if (otherChild !== null) {
					this.#nearestSearch(otherChild, point, maxNodes);
				}
			}
		}
		nearest(point, maxNodes, maxDistance) {
			const result = [];
			this.#bestNodes = new BinaryHeap(e => -e[1]);
			if (maxDistance) {
				for (let i = 0; i < maxNodes; i += 1) {
					this.#bestNodes.push([null, maxDistance]);
				}
			}
			if (this.#root) {
				this.#nearestSearch(this.#root, point, maxNodes);
			}
			for (let i = 0; i < Math.min(maxNodes, this.#bestNodes.content.length); i += 1) {
				if (this.#bestNodes.content[i][0]) {
					result.push([this.#bestNodes.content[i][0].obj, this.#bestNodes.content[i][1]]);
				}
			}
			return result;
		}
	}

	const PORT_X_KEY = 'x';
	const PORT_Y_KEY = 'y';
	class PortsNearest {
		#portsKdTree = null;
		#state = null;
		constructor(ctx) {
			this.#state = ctx.state;
		}

		// Builds the index from scratch for the given set. This is also the rebuild path: insertion
		// does not rebalance, so a gesture that accumulated enough inserts comes back here.
		init(portsMap) {
			const {
				portsRectMap
			} = this.#state;
			const portsPoint = [];
			for (const [blockId, ports] of portsMap.entries()) {
				for (const [portId, port] of ports.entries()) {
					// Same invariant as addPort: an unmeasured port stays out of the index.
					const portRect = ui_vue3.toValue(portsRectMap)?.[blockId]?.[portId] ?? null;
					if (portRect === null) {
						continue;
					}
					const {
						x = 0,
						y = 0
					} = portRect;
					portsPoint.push({
						x,
						y,
						blockId,
						portId,
						port: {
							...port
						}
					});
				}
			}
			this.#portsKdTree = new KdTree(portsPoint, distance, [PORT_X_KEY, PORT_Y_KEY]);
		}

		// A port joins the visible set before its geometry is measured. Adding an unmeasured port
		// would plant a phantom target at the world origin, so it is refused here and picked up by a
		// later pass instead. A caller that has already resolved the rect passes it in; the lookup
		// here is the fallback, not a second check.
		addPort(blockId, portId, port, rect = null) {
			const {
				portsRectMap
			} = this.#state;
			const portRect = rect ?? ui_vue3.toValue(portsRectMap)?.[blockId]?.[portId] ?? null;
			if (portRect === null || this.#portsKdTree === null) {
				return false;
			}
			const {
				x = 0,
				y = 0
			} = portRect;
			this.#portsKdTree.insert({
				x,
				y,
				blockId,
				portId,
				port: {
					...port
				}
			});
			return true;
		}
		insert(point, blockId, port) {
			this.#portsKdTree?.insert({
				...point,
				blockId,
				portId: port.id,
				port: {
					...port
				}
			});
		}
		nearest(point, maxNodes = 1, maxDistance = 100) {
			return this.#portsKdTree?.nearest(point, maxNodes, maxDistance) ?? [];
		}
		remove(point) {
			return this.#portsKdTree?.remove(point);
		}
		clear() {
			this.#portsKdTree = null;
		}
	}

	// Merge registered block ports with opt-in virtual (placeholder) ports so both
	// participate as snap targets for a new connection. Virtual ports win on id
	// collision: a materializable placeholder must stay droppable even if a stale
	// real port with the same id still lingers in the diagram.
	function buildSnapCandidatePorts(visiblePorts, virtualPortsMap) {
		const merged = new Map();
		for (const [blockId, ports] of visiblePorts.entries()) {
			merged.set(blockId, new Map(ports));
		}
		for (const [blockId, entries] of virtualPortsMap.entries()) {
			if (!merged.has(blockId)) {
				merged.set(blockId, new Map());
			}
			for (const [portId, entry] of entries.entries()) {
				merged.get(blockId).set(portId, entry.port);
			}
		}
		return merged;
	}

	// Резервный таймаут (мс) на один шаг анимации. Должен быть заметно больше
	// длительности видимого перехода (opacity 0.7s в *-queue-transition.css), чтобы
	// таймер никогда не соперничал с экранным переходом: он срабатывает, только
	// когда продвигающего перехода не будет вовсе (отсечение блоков вне экрана,
	// добавление/удаление без изменений).
	const ANIMATION_STEP_FALLBACK_MS = 1200;
	/**
	 * Управляет продвижением очереди анимации так, чтобы каждый yield-шаг
	 * продвигался РОВНО ОДИН РАЗ — тем, что наступит первым: совпавшим экранным
	 * переходом или резервным таймером; проигравший игнорируется.
	 *
	 * Чистая логика (без Vue и DOM): таймеры инъектируются, поэтому класс
	 * тестируется с поддельными часами. Сопоставление элемента с текущим шагом (какой
	 * переход относится к текущему шагу) остаётся в компонентах переходов — этот
	 * контроллер лишь обеспечивает инвариант «одно продвижение на шаг» через
	 * монотонный токен шага.
	 */
	class AnimationStepController {
		#token = 0;
		#settledToken = 0;
		#timerId = null;
		#fallbackMs;
		#onAdvance;
		#setTimeoutFn;
		#clearTimeoutFn;
		constructor(options = {}) {
			const {
				fallbackMs = ANIMATION_STEP_FALLBACK_MS,
				onAdvance = null,
				// Таймеры по умолчанию связываем с глобальным объектом: нативные
				// setTimeout/clearTimeout требуют this === window, иначе браузер бросает
				// «Illegal invocation» при вызове как метода инстанса. Инъекция таймеров
				// для тестов (sinon) остаётся приоритетной и перекрывает значение по умолчанию.
				setTimeoutFn = globalThis.setTimeout.bind(globalThis),
				clearTimeoutFn = globalThis.clearTimeout.bind(globalThis)
			} = options;
			this.#fallbackMs = fallbackMs;
			this.#onAdvance = onAdvance;
			this.#setTimeoutFn = setTimeoutFn;
			this.#clearTimeoutFn = clearTimeoutFn;
		}
		setAdvanceHandler(onAdvance) {
			this.#onAdvance = onAdvance;
		}
		get currentToken() {
			return this.#token;
		}

		/**
		 * Открывает новый шаг: увеличивает токен и вооружает резервный таймер. Таймер
		 * от предыдущего незавершённого шага снимается. Возвращает токен нового шага.
		 */
		openStep() {
			this.#clearTimer();
			this.#token += 1;
			const token = this.#token;
			this.#timerId = this.#setTimeoutFn(() => {
				this.#settle(token);
			}, this.#fallbackMs);
			return token;
		}

		/**
		 * Запрашивает продвижение для указанного токена шага (вызывается совпавшим
		 * переходом). Продвигает, только если токен всё ещё соответствует текущему
		 * незавершённому шагу; иначе запрос игнорируется. Возвращает, произошло ли
		 * продвижение.
		 */
		settle(token) {
			return this.#settle(token);
		}
		#settle(token) {
			if (token !== this.#token) {
				// Устаревший токен: относится к уже сменённому шагу.
				return false;
			}
			if (this.#settledToken >= token) {
				// Этот шаг уже был продвинут (гонка таймера и перехода).
				return false;
			}
			this.#settledToken = token;
			this.#clearTimer();
			this.#onAdvance?.();
			return true;
		}
		#clearTimer() {
			if (this.#timerId !== null) {
				this.#clearTimeoutFn(this.#timerId);
				this.#timerId = null;
			}
		}
		stop() {
			this.#clearTimer();
			this.#token = 0;
			this.#settledToken = 0;
		}
	}

	// Чистая проверка: соответствует ли DOM-элемент завершившегося перехода текущему
	// элементу очереди. Точное сопоставление по data-id (MoveableBlock и Connection
	// кладут его на корень своего элемента). Вынесено из *-queue-transition, чтобы
	// логику можно было покрыть unit-тестами без Vue и DOM.
	//
	// Правила:
	//  - item отсутствует → false (переход относится к уже завершённой очереди);
	//  - у элемента нет data-id → true (грубая деградация к тип-фильтру и резервному
	//    таймеру контроллера, сохраняем прежнее поведение);
	//  - иначе сравниваем строковые представления data-id и item.id.
	function matchesTransitionEl(el, item) {
		if (!item) {
			return false;
		}
		const elId = el?.getAttribute?.('data-id');
		if (elId === null || elId === undefined) {
			return true;
		}
		return String(elId) === String(item.id);
	}

	function promiseWithResolvers() {
		let resolve = null;
		let reject = null;
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return {
			promise,
			resolve,
			reject
		};
	}

	const TRANSFORM_LAYOUT_SELECTOR = '.ui-block-diagram-canvas-transform__transform';
	function getCanvasRect(element) {
		const layout = element?.closest(TRANSFORM_LAYOUT_SELECTOR);
		if (!layout) {
			return null;
		}
		const layoutRect = layout.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();
		const {
			transform
		} = getComputedStyle(layout);
		const scale = transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
		return {
			x: (elementRect.x - layoutRect.x) / scale,
			y: (elementRect.y - layoutRect.y) / scale,
			width: elementRect.width / scale,
			height: elementRect.height / scale
		};
	}

	/**
	 * ALG-01: retain a node's measured geometry when its port/block unmounts only
	 * while render optimization culls the node out of the viewport yet it stays in
	 * the model. Any other unmount is a real removal and its geometry must be cleared.
	 */
	function shouldRetainGeometry(isRenderOptimizationAvailable, blockIdsInModel, blockId) {
		return isRenderOptimizationAvailable === true && blockIdsInModel.has(blockId);
	}

	/**
	 * ALG-01 (port level): retain a port's measured geometry only while the block stays
	 * in the model AND the port itself is still present in that block's ports. Culling
	 * unmounts an offscreen node but keeps its ports in the model — retain. Deleting a
	 * single port (setPorts without it) drops it from the model — clear, even though the
	 * block remains, so no connection is drawn to a port that no longer exists.
	 */
	function shouldRetainPortGeometry(isRenderOptimizationAvailable, blockIdsInModel, blockId, blockPortIdsInModel, portId) {
		return shouldRetainGeometry(isRenderOptimizationAvailable, blockIdsInModel, blockId) && blockPortIdsInModel.has(portId);
	}

	/**
	 * Port ids a block currently exposes in the LIVE model, read through getBlockById
	 * rather than a captured prop. An immutable setPorts swaps the block object, so an
	 * unmounting port that closed over the old block would still see the dropped port and
	 * wrongly retain its geometry; resolving the block from the current model instead makes
	 * the removed port absent here — so retention clears it. A block removed entirely yields
	 * an empty set (getBlockById returns null).
	 */
	function collectModelPortIds(getBlockById, blockId) {
		const block = getBlockById(blockId);
		const ports = ui_vue3.toValue(block?.ports) ?? [];
		return new Set(ports.map(port => ui_vue3.toValue(port)?.id));
	}

	// Chrome on Windows hands the custom drag image to the OS as a bitmap and degrades it into a blurred
	// blob once its longer side grows too large; the blur depends on the longer side only, not on the area.
	// DRAG_IMAGE_SIDE_LIMIT is not a measured-safe side (260 already blurred in the tests): it only marks
	// where previews that already worked are left untouched, so scaling applies to clearly oversized nodes only.
	// DRAG_IMAGE_TARGET_SIDE is the side measured as still sharp; a preview above the limit is zoomed down
	// so its longer side becomes the target.
	const DRAG_IMAGE_SIDE_LIMIT = 260;
	const DRAG_IMAGE_TARGET_SIDE = 240;
	function resolveDragImageScale(width, height) {
		const maxSide = Math.max(width, height);
		if (!Number.isFinite(maxSide) || maxSide <= DRAG_IMAGE_SIDE_LIMIT) {
			return 1;
		}
		return DRAG_IMAGE_TARGET_SIDE / maxSide;
	}

	// The dragged edge is snapped first, the opposite edge keeps its place; the minimum size
	// wins over the grid node.
	function getSizeByEndEdge(endEdge, fixedStart, minSize) {
		return Math.max(endEdge - fixedStart, minSize);
	}
	function getBoundsByStartEdge(startEdge, fixedEnd, minSize) {
		const size = fixedEnd - startEdge;
		return size < minSize ? {
			position: fixedEnd - minSize,
			size: minSize
		} : {
			position: startEdge,
			size
		};
	}

	const isRenderOptimizationAvailable = main_core.Extension.getSettings('ui.block-diagram').get('isRenderOptimizationAvailable');
	const RENDER_OPTIMIZATION = {
		enabled: 'Y'
	};
	function useState() {
		return {
			blockDiagramRef: null,
			blockDiagramTop: 0,
			blockDiagramLeft: 0,
			blockDiagramWidth: 0,
			blockDiagramHeight: 0,
			cursorType: 'default',
			isResizing: false,
			isDisabled: false,
			waitAllBlocksMounted: promiseWithResolvers(),
			waitedBlockIds: new Set(),
			waitAllPortsMounted: promiseWithResolvers(),
			waitedBlockPortsIds: new Set(),
			isRunUpdateBlocksCommand: false,
			blocks: [],
			connections: [],
			connectionOffset: CONNECTION_OFFSET,
			connectionBendOffset: CONNECTION_BEND_OFFSET,
			connectionBorderRadius: CONNECTION_BORDER_RADIUS,
			connectionsOffsetMap: Object.create(null),
			blockElMap: ui_vue3.markRaw(new Map()),
			blocksRectMap: {},
			portsElMap: ui_vue3.markRaw(new Map()),
			portsRectMap: {},
			// Bumped when a port registers or drops its own rect (addPortRect/deletePortRect); a
			// bulk purge of a culled block's geometry stays silent. Watching the map itself would
			// mean a structural walk of every block ever measured on each pass; a counter says
			// the same thing in one read.
			portsGeometryVersion: 0,
			portsValidationsFnMap: new Map(),
			validPortsMap: new Map(),
			virtualPortsMap: ui_vue3.markRaw(new Map()),
			newConnection: null,
			connectionPreview: null,
			movingBlockId: null,
			gestureBlockIds: new Set(),
			resizingBlock: null,
			canvasRef: null,
			transformLayoutRef: null,
			canvasInstance: null,
			canvasWidth: 0,
			canvasHeight: 0,
			transformX: 0,
			transformY: 0,
			viewportX: 0,
			viewportY: 0,
			zoom: 1,
			minZoom: 0.2,
			maxZoom: 4,
			snapToGrid: false,
			snapSize: null,
			// fallback for a canvasStyle without an explicit size: the same base cell the grid
			// style defaults to, so the snap step never diverges from the drawn grid
			canvasGridSize: GRID_DEFAULT_SIZE,
			contextMenuLayerRef: null,
			targetContainerRef: null,
			isOpenContextMenu: false,
			openedContextMenuName: null,
			contextMenuInstance: null,
			positionContextMenu: {
				top: 0,
				left: 0
			},
			historyCurrentState: ui_vue3.markRaw({
				blocks: [],
				connections: []
			}),
			headSnapshot: null,
			tailSnapshot: null,
			currentSnapshot: null,
			maxCountSnapshots: 20,
			snapshotHandler: null,
			revertHandler: null,
			highlitedBlockIds: [],
			transientHighlightedBlockIds: [],
			isSelectionActive: false,
			selectionWorldRect: null,
			groupDragOffset: {
				x: 0,
				y: 0
			},
			animationQueue: null,
			currentAnimationItem: null,
			isPauseAnimation: false,
			isStopAnimation: false,
			shortcuts: [],
			mousePosition: {
				x: 0,
				y: 0
			},
			isKeyboardInitialized: false,
			isRenderOptimizationAvailable: isRenderOptimizationAvailable === RENDER_OPTIMIZATION.enabled,
			connectionRouteHitTestEnabled: false
		};
	}

	function useInstances(ctx) {
		return {
			portsNearest: new PortsNearest(ctx),
			blockIntersections: new BlockIntersections(ctx),
			animationStep: new AnimationStepController()
		};
	}

	const SCROLL_THRESHOLD = 80;
	const BASE_SPEED = 8;
	const HARD_CAP = 20;
	function useAutoScroll(state, actions) {
		let rafId = null;
		let mouseX = 0;
		let mouseY = 0;
		let rect = null;
		let activeCallback = null;
		const getAxisSpeed = penetration => {
			if (penetration <= 0) {
				return 0;
			}
			const t = penetration / SCROLL_THRESHOLD;
			const speed = BASE_SPEED * t * t;
			return Math.min(speed, HARD_CAP);
		};
		const scrollLoop = () => {
			if (!rect || !activeCallback) {
				return;
			}
			let dx = 0;
			let dy = 0;
			const leftPenetration = rect.left + SCROLL_THRESHOLD - mouseX;
			const rightPenetration = mouseX - (rect.right - SCROLL_THRESHOLD);
			const topPenetration = rect.top + SCROLL_THRESHOLD - mouseY;
			const bottomPenetration = mouseY - (rect.bottom - SCROLL_THRESHOLD);
			if (leftPenetration > 0) {
				dx = -getAxisSpeed(leftPenetration);
			} else if (rightPenetration > 0) {
				dx = getAxisSpeed(rightPenetration);
			}
			if (topPenetration > 0) {
				dy = -getAxisSpeed(topPenetration);
			} else if (bottomPenetration > 0) {
				dy = getAxisSpeed(bottomPenetration);
			}
			if (dx !== 0 || dy !== 0) {
				const currentZoom = ui_vue3.toValue(state.zoom);
				actions.setCamera({
					x: ui_vue3.toValue(state.transformX) + dx / currentZoom,
					y: ui_vue3.toValue(state.transformY) + dy / currentZoom,
					zoom: currentZoom
				});
				activeCallback(dx, dy);
			}
			rafId = requestAnimationFrame(scrollLoop);
		};

		// The press only arms the autoscroll: the loop is left to the first move of the pointer.
		// Started here it would pan the camera under a gesture that has not begun - a plain click on a
		// block standing in the edge threshold carries the canvas away with the mouse never moving.
		// When the gesture begins is for the gesture to say, and it says it by reporting the pointer:
		// a drag reports it past its threshold, a selection frame or a resize from the first move.
		const start = (event, callback) => {
			mouseX = event.clientX;
			mouseY = event.clientY;
			activeCallback = callback;
		};
		const stop = () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			rect = null;
			activeCallback = null;
		};
		const updateMousePosition = event => {
			mouseX = event.clientX;
			mouseY = event.clientY;
			if (!activeCallback || rafId) {
				return;
			}

			// The canvas is measured here rather than on the press: between the two the panel of the
			// selected block opens and the canvas loses the width the press would have measured, so
			// the edge threshold would be counted from a border that has moved.
			const el = ui_vue3.toValue(state.canvasRef);
			if (!el) {
				// A frame without geometry would exit at once, leaving rafId set: every later move would
				// then read the loop as running and the autoscroll would stay dead for the whole gesture.
				return;
			}
			rect = el.getBoundingClientRect();
			rafId = requestAnimationFrame(scrollLoop);
		};
		return {
			start,
			stop,
			updateMousePosition
		};
	}

	function createConnectionsOffsetMap(connections, connectionOffset, connectionBendOffset) {
		const connectionsOffsetMap = Object.create(null);
		const connectionsCountMap = Object.create(null);
		const getPortOffsets = (blockId, portId) => {
			if (!(blockId in connectionsOffsetMap)) {
				connectionsOffsetMap[blockId] = Object.create(null);
				connectionsCountMap[blockId] = Object.create(null);
			}
			if (!(portId in connectionsOffsetMap[blockId])) {
				connectionsOffsetMap[blockId][portId] = Object.create(null);
				connectionsCountMap[blockId][portId] = 0;
			}
			return connectionsOffsetMap[blockId][portId];
		};
		connections.forEach(connection => {
			const {
				id,
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId
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
				secondSegmentOrder: sourceConnectionsCount
			};
			targetPortOffsets[id] = {
				firstSegmentSize: targetConnectionsCount * connectionOffset,
				secondSegmentSize: connectionBendOffset * connectionOffset,
				secondSegmentOrder: targetConnectionsCount
			};
			if (!sourceConnectionExists) {
				connectionsCountMap[sourceBlockId][sourcePortId] = sourceConnectionsCount;
			}
			if (!targetConnectionExists) {
				connectionsCountMap[targetBlockId][targetPortId] = targetConnectionsCount;
			}
		});
		return connectionsOffsetMap;
	}
	function isFilledString(value) {
		return main_core.Type.isStringFilled(value) && value.trim() !== '';
	}
	function isDiagramConnection(connection) {
		return main_core.Type.isObject(connection) && ['id', 'sourceBlockId', 'sourcePortId', 'targetBlockId', 'targetPortId'].every(field => isFilledString(connection[field]));
	}
	function prepareConnectionPreview(preview) {
		if (!main_core.Type.isObject(preview) || !isFilledString(preview.activationKey) || !isFilledString(preview.hiddenConnectionId) || !main_core.Type.isArray(preview.temporaryConnections) || preview.temporaryConnections.length !== 2 || !preview.temporaryConnections.every(isDiagramConnection) || preview.temporaryConnections[0].id === preview.temporaryConnections[1].id || !main_core.Type.isArray(preview.portMarkers) || preview.portMarkers.length !== 2 || !preview.portMarkers.every(marker => main_core.Type.isObject(marker) && isFilledString(marker.blockId) && isFilledString(marker.portId)) || !main_core.Type.isArray(preview.routingConnections) || !preview.routingConnections.every(isDiagramConnection)) {
			return null;
		}
		const temporaryConnectionIds = new Set(preview.temporaryConnections.map(connection => connection.id));
		const routingConnectionIds = new Set(preview.routingConnections.map(connection => connection.id));
		const hasUniqueRoutingConnectionIds = routingConnectionIds.size === preview.routingConnections.length;
		const hasIndependentHiddenConnection = !temporaryConnectionIds.has(preview.hiddenConnectionId);
		const hasTemporaryConnections = [...temporaryConnectionIds].every(connectionId => routingConnectionIds.has(connectionId));
		if (!hasUniqueRoutingConnectionIds || !hasIndependentHiddenConnection || !hasTemporaryConnections) {
			return null;
		}
		return {
			hiddenConnectionId: preview.hiddenConnectionId,
			temporaryConnections: [{
				...preview.temporaryConnections[0]
			}, {
				...preview.temporaryConnections[1]
			}],
			routingConnections: preview.routingConnections.map(connection => ({
				...connection
			})),
			portMarkers: [{
				...preview.portMarkers[0]
			}, {
				...preview.portMarkers[1]
			}],
			activationKey: preview.activationKey
		};
	}

	/* eslint-disable no-param-reassign */
	// eslint-disable-next-line max-lines-per-function
	function useActions({
		state,
		getters,
		hooks,
		instances = null
	}) {
		function setState(options) {
			state.blocks = ui_vue3.toValue(options.blocks);
			state.connections = ui_vue3.toValue(options.connections);
			state.transformX = options.transform.x;
			state.transformY = options.transfrom.y;
			state.zoom = ui_vue3.toValue(options.zoom);
		}
		function setUnmountedBlocks(newBlocks, oldBlocks = []) {
			const oldBlockIdsMap = new Set(oldBlocks.map(block => block.id));
			const arrWaitedBlockIds = newBlocks.filter(block => !oldBlockIdsMap.has(block.id)).map(block => block.id);
			state.waitAllBlocksMounted = promiseWithResolvers();
			state.waitedBlockIds = new Set(arrWaitedBlockIds);

			// Nothing new to mount: a replacement that only moves existing blocks. The graph
			// is ready right away, and no mount event is coming to resolve the barrier.
			if (state.waitedBlockIds.size === 0) {
				state.waitAllBlocksMounted.resolve();
			}
		}
		function blockMounted(blockId) {
			const {
				waitedBlockIds,
				waitAllBlocksMounted
			} = state;
			waitedBlockIds.delete(blockId);
			if (waitedBlockIds.size === 0) {
				waitAllBlocksMounted.resolve();
			}
		}
		function setUnmountedPorts(newBlocks, oldBlocks = []) {
			const oldBlockPortsIds = oldBlocks.reduce((accMap, block) => {
				block.ports.forEach(port => accMap.add(`${block.id}_${port.id}`));
				return accMap;
			}, new Set());
			const arrNewBlockPortIds = newBlocks.flatMap(block => block.ports.map(port => `${block.id}_${port.id}`)).filter(blockPortId => !oldBlockPortsIds.has(blockPortId));
			state.waitedBlockPortsIds = new Set(arrNewBlockPortIds);
			state.waitAllPortsMounted = promiseWithResolvers();
		}
		function portMounted(blockId, portId) {
			const {
				waitedBlockPortsIds,
				waitAllPortsMounted
			} = state;
			waitedBlockPortsIds.delete(`${blockId}_${portId}`);
			if (waitedBlockPortsIds.size === 0) {
				waitAllPortsMounted.resolve();
			}
		}
		function setConnectionsOffsets(connections) {
			const {
				connectionOffset,
				connectionBendOffset
			} = state;
			state.connectionsOffsetMap = createConnectionsOffsetMap(connections, connectionOffset, connectionBendOffset);
		}
		const findConnectionRouteHits = rect => {
			return instances?.blockIntersections?.findConnectionRouteHits(rect) ?? [];
		};
		const showConnectionPreview = preview => {
			state.connectionPreview = prepareConnectionPreview(preview);
		};
		const clearConnectionPreview = (expectedActivationKey = null) => {
			if (main_core.Type.isNil(expectedActivationKey)) {
				state.connectionPreview = null;
				return;
			}
			if (isFilledString(expectedActivationKey) && state.connectionPreview?.activationKey === expectedActivationKey) {
				state.connectionPreview = null;
			}
		};
		function setHistoryBlocksCurrentState(blocks) {
			state.historyCurrentState.blocks = ui_vue3.markRaw(JSON.parse(JSON.stringify(blocks)));
		}
		function setHistoryConnectionsCurrentState(connections) {
			state.historyCurrentState.connections = ui_vue3.markRaw(JSON.parse(JSON.stringify(connections)));
		}
		function updateCanvasTransform(transform) {
			const {
				x = 0,
				y = 0,
				zoom = 1,
				viewportX = 0,
				viewportY = 0
			} = transform;
			state.transformX = x;
			state.transformY = y;
			state.viewportX = viewportX;
			state.viewportY = viewportY;
			state.zoom = zoom;
		}
		const isExistConnection = connection => {
			const {
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId
			} = connection;
			return state.connections.some(({
				sourceBlockId: exSourceBlockId,
				sourcePortId: exSourcePortId,
				targetBlockId: exTargetBlockId,
				targetPortId: exTargetPortId
			}) => {
				const isSource = exSourceBlockId === sourceBlockId && exSourcePortId === sourcePortId && exTargetBlockId === targetBlockId && exTargetPortId === targetPortId;
				const isTarget = exSourceBlockId === targetBlockId && exSourcePortId === targetPortId && exTargetBlockId === sourceBlockId && exTargetPortId === sourcePortId;
				return isSource || isTarget;
			});
		};
		const addConnection = newConnection => {
			if (!isExistConnection(newConnection)) {
				hooks.changedConnections.trigger(commandPush(newConnection));
				hooks.createConnection.trigger(newConnection);
			}
		};
		const addConnections = newConnections => {
			const notExistConnections = ui_vue3.toValue(newConnections).filter(connection => !isExistConnection(connection));
			if (notExistConnections.length > 0) {
				setConnectionsOffsets(notExistConnections);
				hooks.changedConnections.trigger(commandPush(notExistConnections));
				hooks.addConnections.trigger(notExistConnections);
			}
		};
		const deleteConnectionById = connectionId => {
			hooks.changedConnections.trigger(commandDeleteById(connectionId));
			hooks.deleteConnection.trigger(connectionId);
		};
		const deleteConnectionByBlockIdAndPortId = (blockId, portId) => {
			const block = state.blocks.find(stateBlock => stateBlock.id === blockId);
			if (!block) {
				return;
			}
			const ports = main_core.Type.isArray(block.ports) ? block.ports : [];
			const portIdMap = new Set(ports.map(port => port.id));
			const removeConnectionIds = state.connections.filter(connection => {
				const {
					sourceBlockId,
					sourcePortId,
					targetBlockId,
					targetPortId
				} = connection;
				const isSource = sourceBlockId === blockId && portIdMap.has(sourcePortId);
				const isTarget = targetBlockId === blockId && portIdMap.has(targetPortId);
				return isSource || isTarget;
			}).map(connection => connection.id);
			if (removeConnectionIds.length === 0) {
				return;
			}
			hooks.changedConnections.trigger(commandDeleteByIds(removeConnectionIds));
		};
		const deleteBlockById = blockId => {
			const block = state.blocks.find(stateBlock => stateBlock.id === blockId);
			if (!block) {
				return;
			}
			deleteConnectionByBlockIdAndPortId(blockId);
			hooks.changedBlocks.trigger(commandDeleteById(blockId));
			hooks.deleteBlock.trigger(block);
		};
		const getBlockById = blockId => {
			return state.blocks.find(block => block.id === blockId) ?? null;
		};
		const addBlock = block => {
			setUnmountedPorts([block]);
			setUnmountedBlocks([block]);
			hooks.changedBlocks.trigger(commandPush(block));
			hooks.addBlock.trigger(block);
		};
		const addBlocks = blocks => {
			setUnmountedPorts(blocks);
			setUnmountedBlocks(blocks);
			hooks.changedBlocks.trigger(commandPush(blocks));
			hooks.addBlocks.trigger(blocks);
		};
		const replaceBlocks = blocks => {
			hooks.changedBlocks.trigger(commandReplace(blocks));
		};
		const deleteBlock = block => {
			deleteBlockById(ui_vue3.toValue(block).id);
		};
		const deleteBlocks = blocks => {
			const ids = ui_vue3.toValue(blocks).map(block => block.id);
			hooks.changedBlocks.trigger(commandDeleteByIds(ids));
			hooks.deleteBlocks.trigger(blocks);
		};
		const addBlocksAndConnections = (newBlocks, newConnections) => {
			addBlocks(newBlocks);
			addConnections(newConnections);
		};
		const updateBlockPositionByIndex = (index, x, y) => {
			state.blocks[index].position.x = x;
			state.blocks[index].position.y = y;
		};
		const updateBlock = newBlock => {
			const blockIndex = state.blocks.findIndex(block => block.id === newBlock.id);
			if (blockIndex === -1) {
				return;
			}
			hooks.updateBlock.trigger(state.blocks[blockIndex], newBlock);
			hooks.changedBlocks.trigger(commandUpdateByIndex(blockIndex, newBlock));
		};

		// Each side of the rollback is applied only for a block the caller could resolve: an update
		// intercepted after its block left the model carries no geometry, and passing it on would ask
		// the index for the box of a block that no longer has one. Releasing the command flag is
		// unconditional - the interception is over either way.
		const rollbackBlockUpdate = (attemptedBlock, actualBlock) => {
			if (main_core.Type.isObjectLike(attemptedBlock)) {
				instances?.blockIntersections?.removeBlock(attemptedBlock);
			}
			if (main_core.Type.isObjectLike(actualBlock)) {
				instances?.blockIntersections?.insertBlock(actualBlock);
			}
			state.isRunUpdateBlocksCommand = false;
		};
		const transformEventToPoint = point => {
			let transformedX = Math.round(point.clientX / ui_vue3.toValue(state.zoom));
			let transformedY = Math.round(point.clientY / ui_vue3.toValue(state.zoom));
			const {
				top,
				left
			} = ui_vue3.toValue(state.blockDiagramRef)?.getBoundingClientRect() ?? {
				top: 0,
				left: 0
			};
			transformedX -= Math.round(left / ui_vue3.toValue(state.zoom));
			transformedY -= Math.round(top / ui_vue3.toValue(state.zoom));
			return {
				x: transformedX,
				y: transformedY
			};
		};
		const setMovingBlock = blockId => {
			state.movingBlockId = ui_vue3.toValue(blockId);
		};
		const resetMovingBlock = () => {
			state.movingBlockId = null;
		};

		// Every node of the running gesture, whatever leads it: the frame drag moves a whole selection
		// and the node drag takes its group members along, while the model keeps their pre-gesture
		// positions until the commit. The set is replaced rather than mutated - a reactive Set read
		// inside an animation frame only needs its current value.
		const setGestureBlocks = blockIds => {
			state.gestureBlockIds = new Set(ui_vue3.toValue(blockIds).map(blockId => ui_vue3.toValue(blockId)));
		};
		const resetGestureBlocks = () => {
			state.gestureBlockIds = new Set();
		};

		// The shift the frame drag has drawn and not yet committed. It belongs to the diagram instance:
		// a page may hold several of them, and the box of one must not follow the gesture of another.
		const setGroupDragOffset = offset => {
			state.groupDragOffset = {
				x: offset.x,
				y: offset.y
			};
		};
		const resetGroupDragOffset = () => {
			state.groupDragOffset = {
				x: 0,
				y: 0
			};
		};
		const updateBlockRectById = (blockId, rect) => {
			state.blocksRectMap[blockId] = {
				...state.blocksRectMap[blockId],
				...rect
			};
		};

		// Reports that a port registered or dropped its own rect. Neither the coordinates of an
		// already measured port nor a bulk purge of a culled block's geometry count as a change
		// here: the signal only wakes the pass that adds targets, and a gesture never revokes one it
		// already earned. A purge does drop the rect, so its readers treat a missing one as no target.
		const touchPortsGeometry = () => {
			state.portsGeometryVersion += 1;
		};

		// Release geometry retained under culling. The only path that frees a retained
		// node's coordinates when it leaves the model without producing an unmount.
		const purgeBlockGeometry = blockId => {
			delete state.portsRectMap[blockId];
			delete state.blocksRectMap[blockId];
		};
		const purgeBlockGeometryExcept = keepBlockIds => {
			const keep = new Set(ui_vue3.toValue(keepBlockIds));
			const trackedIds = new Set([...Object.keys(state.blocksRectMap), ...Object.keys(state.portsRectMap)]);
			trackedIds.forEach(blockId => {
				if (!keep.has(blockId)) {
					purgeBlockGeometry(blockId);
				}
			});
		};
		const setHistoryHandlers = ({
			snapshotHandler: newSnapshotHandler = null,
			revertHandler: newRevertHandler = null
		}) => {
			state.snapshotHandler = newSnapshotHandler || state.snapshotHandler;
			state.revertHandler = newRevertHandler || state.revertHandler;
		};

		// Block ids come from an untrusted graph, so a rect is only ever taken as an own property.
		const getOwnRect = (rectMap, key) => {
			const map = ui_vue3.toValue(rectMap) ?? {};
			return Object.hasOwn(map, key) ? map[key] : null;
		};
		const translatePortRects = (blockId, offset) => {
			const ports = getOwnRect(state.portsRectMap, blockId) ?? {};
			Object.values(ports).forEach(portRect => {
				portRect.x += offset.x;
				portRect.y += offset.y;
			});
		};

		// Drag passes previous minus new position, so its offset is the negation of the move.
		const setPortOffsetByBlockId = (blockId, offsets) => {
			translatePortRects(blockId, {
				x: -offsets.x,
				y: -offsets.y
			});
		};

		// Moving a block by a known offset leaves its size and the placement of its ports relative
		// to it untouched, so measured geometry follows by arithmetic and the browser is never asked
		// to measure again. Records are moved, never dropped: consumers read them without an
		// existence check. Culled blocks are translated as well, but a moved one does not keep the
		// transfer: the props watcher flushing right after purges retained geometry whose model key
		// changed, and the first-measure path measures such a block again on its next mount. So for
		// blocks outside the viewport correctness rests on that path, not on this translation.
		const translateBlockGeometry = (blockId, offset) => {
			const blockRect = getOwnRect(state.blocksRectMap, blockId);
			if (blockRect) {
				blockRect.x += offset.x;
				blockRect.y += offset.y;
			}
			translatePortRects(blockId, offset);
		};
		const translateBlocksGeometry = offsets => {
			offsets.forEach((offset, blockId) => {
				translateBlockGeometry(blockId, offset);
			});
		};
		const updateBlockRect = blockId => {
			const {
				blockElMap,
				blocksRectMap,
				blocks
			} = state;
			const rect = getCanvasRect(ui_vue3.toValue(blockElMap).get(ui_vue3.toValue(blockId)));
			if (!rect) {
				return;
			}
			blocksRectMap[ui_vue3.toValue(blockId)] = {
				...rect
			};
			const block = ui_vue3.toValue(blocks).find(b => b.id === ui_vue3.toValue(blockId));
			updateBlock({
				...ui_vue3.toValue(block),
				position: {
					x: rect.x,
					y: rect.y
				},
				dimensions: {
					width: rect.width,
					height: rect.height
				}
			});
		};
		const updatePort = (blockId, portId, order = 0) => {
			updateBlockRect(blockId);
			updatePortRect(blockId, portId);
			updatePortSegmentSizes(blockId, portId, order);
		};
		const updatePortRect = (blockId, portId) => {
			const {
				portsElMap,
				portsRectMap
			} = state;
			const hasBlock = ui_vue3.toValue(portsElMap).has(blockId);
			const hasPort = hasBlock && ui_vue3.toValue(portsElMap).get(blockId).has(portId);
			if (!hasBlock || !hasPort) {
				return;
			}
			const rect = getCanvasRect(portsElMap.get(blockId)?.get(portId));
			if (!rect) {
				return;
			}
			portsRectMap[blockId][portId].x = rect.x;
			portsRectMap[blockId][portId].y = rect.y;
			portsRectMap[blockId][portId].width = rect.width;
			portsRectMap[blockId][portId].height = rect.height;
		};
		const updatePortSegmentSizes = (blockId, portId, order) => {
			const {
				connectionOffset,
				connectionBendOffset,
				blocksRectMap,
				portsRectMap
			} = state;
			if (!blocksRectMap[blockId] || !portsRectMap[blockId]?.[portId]) {
				return;
			}
			const {
				x: blockX,
				y: blockY,
				width: blockWidth,
				height: blockHeight
			} = blocksRectMap[blockId];
			const {
				x: portX,
				y: portY,
				width: portWidth,
				height: portHeight,
				position
			} = portsRectMap[blockId][portId];
			const isLeftOrRightPosition = position === PORT_POSITION.LEFT || position === PORT_POSITION.RIGHT;
			const additionalOffset = (order + 1) * connectionOffset;
			const additionalBendOffset = (order + 1) * connectionBendOffset;
			const offset = isLeftOrRightPosition ? Math.abs(blockY - (portY + portHeight / 2)) : Math.abs(blockX - (portX + portWidth / 2));
			portsRectMap[blockId][portId].firstSegmentSize = additionalOffset;
			portsRectMap[blockId][portId].secondSegmentSizeWithoutOffset = isLeftOrRightPosition ? blockHeight - offset : blockWidth - offset;
			portsRectMap[blockId][portId].secondSegmentSize = isLeftOrRightPosition ? blockHeight - offset + additionalBendOffset : blockWidth - offset + additionalBendOffset;
		};
		const setSelectionActive = value => {
			state.isSelectionActive = value;
		};
		const setSelectionWorldRect = rect => {
			state.selectionWorldRect = rect;
		};
		const setCamera = params => {
			ui_vue3.toValue(state.canvasInstance)?.setCamera(params);
		};
		const autoScroll = useAutoScroll(state, {
			setCamera
		});
		const transformMouseEventToPoint = event => {
			const {
				zoom,
				blockDiagramTop,
				blockDiagramLeft,
				transformX,
				transformY
			} = state;
			let x = event.clientX / ui_vue3.toValue(zoom);
			x -= ui_vue3.toValue(blockDiagramLeft) / ui_vue3.toValue(zoom);
			x += ui_vue3.toValue(transformX);
			let y = event.clientY / ui_vue3.toValue(zoom);
			y -= ui_vue3.toValue(blockDiagramTop) / ui_vue3.toValue(zoom);
			y += ui_vue3.toValue(transformY);
			return {
				x,
				y
			};
		};

		// Input points never align on their own: a point is snapped only where the caller reports the
		// modifier as held and only while the diagram allows snapping.
		const isSnapApplied = isSnapRequested => {
			return isSnapRequested === true && ui_vue3.toValue(getters.snapStep) !== null;
		};
		const snapValue = (value, isSnapRequested = false) => {
			return isSnapApplied(isSnapRequested) ? snapValueToGrid(value, ui_vue3.toValue(getters.snapStep)) : value;
		};
		const snapPoint = (point, isSnapRequested = false) => {
			return isSnapApplied(isSnapRequested) ? snapPointToGrid(point, ui_vue3.toValue(getters.snapStep)) : {
				x: point.x,
				y: point.y
			};
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
			snapPoint
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useGetters(state) {
		const transform = ui_vue3.computed(() => ({
			x: state.transformX,
			y: state.transformY,
			zoom: state.zoom,
			viewportX: state.viewportX,
			viewportY: state.viewportY
		}));
		const canvasId = ui_vue3.computed(() => {
			return state.canvasRef?.canvasId ?? null;
		});
		const isMakeNewConnection = ui_vue3.computed(() => {
			return state.newConnection !== null;
		});
		const groupedConnections = ui_vue3.computed(() => {
			return state.connections.reduce((acc, connection) => {
				const type = connection?.type ?? CONNECTION_GROUP_DEFAULT_NAME;
				if (type in acc) {
					acc[type] = [...acc[type], connection];
				} else {
					acc[type] = [connection];
				}
				return acc;
			}, {
				[CONNECTION_GROUP_DEFAULT_NAME]: []
			});
		});
		const connectionGroupNames = ui_vue3.computed(() => {
			return Object.keys(ui_vue3.toValue(groupedConnections));
		});
		const blockIdsInModel = ui_vue3.computed(() => {
			return new Set(state.blocks.map(block => block.id));
		});
		const isAnimate = ui_vue3.computed(() => {
			return state.animationQueue !== null;
		});
		const isDisabledBlockDiagram = ui_vue3.computed(() => {
			return state.isDisabled || ui_vue3.toValue(isAnimate);
		});

		// The only place deciding which snap step is in effect. A step other than null merely permits
		// snapping; whether a gesture applies it is decided by the caller together with the Shift
		// modifier (`isSnapApplied`).
		// Counted from the base grid size (`canvasStyle.size`), so the step ignores zoom by design.
		// The default zoom ladder derives its finest level from the same divisor, so the step is a
		// line the canvas draws rather than a value of its own; a consumer passing a ladder of its
		// own has to keep that agreement. `snapSize` sets the step explicitly.
		const snapStep = ui_vue3.computed(() => {
			if (!state.snapToGrid) {
				return null;
			}
			if (Number.isFinite(state.snapSize) && state.snapSize > 0) {
				return state.snapSize;
			}
			return state.canvasGridSize / GRID_SUBDIVISION;
		});
		return {
			transform,
			canvasId,
			groupedConnections,
			connectionGroupNames,
			blockIdsInModel,
			isAnimate,
			isDisabledBlockDiagram,
			isMakeNewConnection,
			snapStep
		};
	}

	function useHooks() {
		return {
			[HOOK_NAMES.START_DRAG_BLOCK]: createHook(),
			[HOOK_NAMES.MOVE_DRAG_BLOCK]: createHook(),
			[HOOK_NAMES.END_DRAG_BLOCK]: createHook(),
			[HOOK_NAMES.ADD_BLOCK]: createHook(),
			[HOOK_NAMES.ADD_BLOCKS]: createHook(),
			[HOOK_NAMES.UPDATE_BLOCK]: createHook(),
			[HOOK_NAMES.DELETE_BLOCK]: createHook(),
			[HOOK_NAMES.DELETE_BLOCKS]: createHook(),
			[HOOK_NAMES.ADD_CONNECTION]: createHook(),
			[HOOK_NAMES.ADD_CONNECTIONS]: createHook(),
			[HOOK_NAMES.CREATE_CONNECTION]: createHook(),
			[HOOK_NAMES.DELETE_CONNECTION]: createHook(),
			[HOOK_NAMES.CHANGED_BLOCKS]: createHook(),
			[HOOK_NAMES.CHANGED_CONNECTIONS]: createHook(),
			[HOOK_NAMES.BLOCK_TRANSITION_START]: createHook(),
			[HOOK_NAMES.BLOCK_TRANSITION_END]: createHook(),
			[HOOK_NAMES.CONNECTION_TRANSITION_START]: createHook(),
			[HOOK_NAMES.CONNECTION_TRANSITION_END]: createHook(),
			[HOOK_NAMES.DROP_NEW_BLOCK]: createHook(),
			[HOOK_NAMES.HISTORY_NEXT]: createHook(),
			[HOOK_NAMES.HISTORY_PREV]: createHook()
		};
	}

	function useBlockDiagram(options) {
		const app = ui_vue3.getCurrentInstance()?.appContext.app;
		const blockDiagramState = app?.config?.globalProperties?.$blockDiagram ?? null;
		if (blockDiagramState !== null) {
			return blockDiagramState;
		}
		const state = useState();
		const reactiveState = ui_vue3.reactive(state);
		const getters = useGetters(reactiveState);
		const hooks = useHooks();
		const instances = useInstances({
			state: reactiveState,
			getters
		});
		const actions = useActions({
			state: reactiveState,
			getters,
			hooks,
			instances
		});
		if (options) {
			actions.setState(options);
		}
		app.config.globalProperties.$blockDiagram = {
			...ui_vue3.toRefs(reactiveState),
			...getters,
			...actions,
			...instances,
			hooks
		};
		app.config.globalProperties.$blockDiagramTestId = (id, ...args) => {
			if (!id) {
				throw new Error('ui.block-diagram not found test id');
			}
			const preparedArgs = args.reduce((acc, arg) => {
				return `${acc}-${arg}`;
			}, '');
			return `${id}${preparedArgs}`;
		};
		return app.config.globalProperties?.$blockDiagram;
	}

	// eslint-disable-next-line max-lines-per-function
	function useContextMenu(contextMenuName = null) {
		const {
			contextMenuLayerRef,
			targetContainerRef,
			isOpenContextMenu,
			openedContextMenuName,
			positionContextMenu,
			contextMenuInstance,
			zoom
		} = useBlockDiagram();
		const isOpen = ui_vue3.ref(false);
		function setContextMenuName(newName) {
			openedContextMenuName.value = ui_vue3.toValue(newName);
		}
		function getItems(items = []) {
			return items.map(item => {
				return {
					...item,
					onclick: () => {
						if (main_core.Type.isFunction(item.onclick)) {
							const point = {
								x: positionContextMenu.value.left,
								y: positionContextMenu.value.top
							};
							item.onclick(point);
						}
						ui_vue3.toValue(contextMenuInstance)?.close();
					}
				};
			});
		}
		function getDefaultOptions(additionalOptions = {}) {
			const defaultOptions = {
				id: 'block-diagram-context-menu',
				bindElement: {
					left: 0,
					top: 0
				},
				minWidth: 200,
				autoHide: true,
				draggable: false,
				cacheable: false,
				targetContainer: ui_vue3.toValue(targetContainerRef),
				...additionalOptions
			};
			if ('items' in additionalOptions) {
				defaultOptions.items = getItems(additionalOptions.items);
			}
			return defaultOptions;
		}
		function updateContextMenuPosition(point) {
			const {
				clientX = 0,
				clientY = 0
			} = point;
			const {
				left,
				top
			} = ui_vue3.toValue(contextMenuLayerRef)?.getBoundingClientRect() ?? {
				top: 0,
				left: 0
			};
			positionContextMenu.value.top = (clientY - top) / ui_vue3.toValue(zoom);
			positionContextMenu.value.left = (clientX - left) / ui_vue3.toValue(zoom);
		}
		function showMenu(point, options = null) {
			setContextMenuName(contextMenuName);
			updateContextMenuPosition(point);
			ui_vue3.toValue(contextMenuInstance)?.destroy();
			contextMenuInstance.value = ui_vue3.shallowRef(new main_popup.Menu(getDefaultOptions(options)));
			ui_vue3.toValue(contextMenuInstance)?.popupWindow?.subscribeOnce('onDestroy', () => {
				isOpen.value = false;
			});
			ui_vue3.toValue(contextMenuInstance)?.show();
			isOpen.value = true;
			isOpenContextMenu.value = true;
		}
		function showPopup(point, options = null) {
			setContextMenuName(contextMenuName);
			updateContextMenuPosition(point);
			ui_vue3.toValue(contextMenuInstance)?.destroy();
			contextMenuInstance.value = ui_vue3.shallowRef(new main_popup.Popup(getDefaultOptions(options)));
			ui_vue3.toValue(contextMenuInstance)?.subscribeOnce('onDestroy', () => {
				isOpen.value = false;
			});
			ui_vue3.toValue(contextMenuInstance)?.show();
			isOpen.value = true;
			isOpenContextMenu.value = true;
		}
		function closeContextMenu() {
			isOpen.value = false;
			isOpenContextMenu.value = false;
			setContextMenuName(null);
			ui_vue3.toValue(contextMenuInstance)?.close();
		}
		return {
			isOpen,
			openedContextMenuName,
			showMenu,
			showPopup,
			closeContextMenu
		};
	}

	function blockGeometryKey(block) {
		const {
			x = 0,
			y = 0
		} = ui_vue3.toValue(block.position) ?? {};
		const {
			width = 0,
			height = 0
		} = ui_vue3.toValue(block.dimensions) ?? {};
		const ports = ui_vue3.toValue(block.ports) ?? [];
		return JSON.stringify({
			x,
			y,
			width,
			height,
			ports
		});
	}
	function buildBlockModel(list) {
		return new Map(ui_vue3.toValue(list ?? []).map(block => [block.id, blockGeometryKey(block)]));
	}

	// Free geometry that the model no longer backs: (a) blocks removed from the model,
	// (b) unmounted (culled) blocks whose position/size changed — their retained
	// coordinates are now stale and no unmount will fire to clear them.
	function purgeStaleGeometry(previousModel, newModel, blockElMap, purgeBlockGeometry) {
		for (const blockId of previousModel.keys()) {
			if (!newModel.has(blockId)) {
				purgeBlockGeometry(blockId);
			}
		}
		for (const [blockId, geometry] of newModel) {
			if (ui_vue3.toValue(blockElMap)?.has(blockId) ?? false) {
				continue;
			}
			const previous = previousModel.get(blockId);
			if (previous !== undefined && previous !== geometry) {
				purgeBlockGeometry(blockId);
			}
		}
	}

	// Selection is model state, not markup state: under render optimization a node culled out of
	// the viewport unmounts and must stay selected, while a node the model no longer has must not.
	// Unmount cannot tell the two apart, so the selection is trimmed here against the model, the
	// only source that knows a node is really gone. Shared with the slow revert path of the
	// history, which restores the selection it kept and trims it by the very same rule.
	function pruneSelection(highlitedBlockIds, blockIdsInModel) {
		const selected = ui_vue3.toValue(highlitedBlockIds) ?? [];
		const modelIds = ui_vue3.toValue(blockIdsInModel);
		const retained = selected.filter(blockId => modelIds.has(blockId));
		if (retained.length !== selected.length) {
			// The selection ref is handed in as an argument, same as in actions.js.
			// eslint-disable-next-line no-param-reassign
			highlitedBlockIds.value = retained;
		}
	}
	function useWatchProps(props) {
		const {
			blocks,
			connections,
			zoom,
			snapToGrid,
			snapSize,
			canvasGridSize,
			isDisabled,
			connectionOffset,
			connectionBendOffset,
			connectionBorderRadius,
			setUnmountedBlocks,
			setUnmountedPorts,
			setConnectionsOffsets,
			setHistoryBlocksCurrentState,
			setHistoryConnectionsCurrentState,
			blockIntersections,
			connectionPreview,
			clearConnectionPreview,
			isRunUpdateBlocksCommand,
			purgeBlockGeometry,
			blockElMap,
			isRenderOptimizationAvailable,
			highlitedBlockIds,
			blockIdsInModel,
			connectionRouteHitTestEnabled
		} = useBlockDiagram();
		const scope = ui_vue3.effectScope(true);
		const clearCurrentConnectionPreview = () => {
			clearConnectionPreview(ui_vue3.toValue(connectionPreview)?.activationKey);
		};

		// Own snapshot of the previous block model (id → geometry key). Independent of the
		// watcher's oldValue, which is unreliable: props.blocks mutated in place yields
		// oldBlocks === newBlocks, so a diff against it sees no change.
		let previousBlockModel = new Map();
		scope.run(() => {
			// Enabling builds the index right here instead of through the coalesced rAF path: a consumer
			// switches the hit test on at the start of a gesture, and the first frame of that gesture
			// already asks for hits. Watchers flush before the frame, so a synchronous build is ready in
			// time, while a scheduled one would miss exactly that frame. Disabling stays coalesced —
			// loadConnections frees the index when nothing maintains it any more.
			ui_vue3.watch(() => props.connectionRouteHitTestEnabled, enabled => {
				connectionRouteHitTestEnabled.value = enabled;
				if (enabled) {
					blockIntersections.loadConnectionsFromSnapshot(ui_vue3.toValue(props.connections), ui_vue3.toValue(props.blocks));
					return;
				}
				blockIntersections.loadConnections();
			}, {
				immediate: true
			});
			ui_vue3.watch([() => props.blocks, () => props.blocks.length], ([newBlocks = [], newLength = 0], [oldBlocks = [], oldLength = 0]) => {
				clearCurrentConnectionPreview();
				if (newBlocks && Array.isArray(newBlocks)) {
					setHistoryBlocksCurrentState(newBlocks);
					setUnmountedPorts(newBlocks, oldBlocks);
					setUnmountedBlocks(newBlocks, oldBlocks);
					blocks.value = newBlocks;
					pruneSelection(highlitedBlockIds, blockIdsInModel);
					const optimizationEnabled = ui_vue3.toValue(isRenderOptimizationAvailable);
					const newBlockModel = optimizationEnabled ? buildBlockModel(newBlocks) : null;
					if (!ui_vue3.toValue(isRunUpdateBlocksCommand)) {
						// Direct props.blocks mutation bypasses DELETE_BLOCK hooks, so retained
						// geometry of removed or shifted culled nodes would leak: purge via the
						// own snapshot instead of the unreliable oldBlocks diff.
						if (optimizationEnabled) {
							purgeStaleGeometry(previousBlockModel, newBlockModel, blockElMap, purgeBlockGeometry);
						}
						blockIntersections.clear();
						blockIntersections.load(blocks.value);
					}
					if (optimizationEnabled) {
						previousBlockModel = newBlockModel;
					}
					isRunUpdateBlocksCommand.value = false;

					// Connection boxes derive from block positions, so any block change
					// (move/add/delete) must rebuild the connection index too.
					blockIntersections.loadConnections();
				}
			}, {
				immediate: true,
				deep: true
			});
			ui_vue3.watch([() => props.connections, () => props.connections.length], ([newConnections]) => {
				clearCurrentConnectionPreview();
				setConnectionsOffsets(newConnections);
				setHistoryConnectionsCurrentState(newConnections);
				connections.value = [...newConnections];
				blockIntersections.loadConnections();
			}, {
				immediate: true,
				deep: true
			});
			ui_vue3.watch(() => props.zoom, newZoom => {
				zoom.value = newZoom;
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.minZoom, newMinZoom => {
				zoom.value = newMinZoom;
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.maxZoom, newMaxZoom => {
				zoom.value = newMaxZoom;
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.snapToGrid, newSnapToGrid => {
				snapToGrid.value = newSnapToGrid;
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.snapSize, newSnapSize => {
				snapSize.value = newSnapSize;
			}, {
				immediate: true
			});

			// The base size the snap step is counted from (see `snapStep` in getters.js for how that
			// step relates to the drawn grid).
			ui_vue3.watch(() => props.canvasStyle?.size, newCanvasGridSize => {
				// A broken grid size would turn the snap step into NaN and silently disable
				// snapping, so keep the last valid size instead.
				if (Number.isFinite(newCanvasGridSize) && newCanvasGridSize > 0) {
					canvasGridSize.value = newCanvasGridSize;
				}
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.connectionOffset, newConnectionOffset => {
				connectionOffset.value = newConnectionOffset;
				// Routing param feeds connection bbox padding: rebuild the index to match.
				blockIntersections.loadConnections();
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.connectionBendOffset, newConnectionOffsetBend => {
				connectionBendOffset.value = newConnectionOffsetBend;
				// Routing param feeds connection bbox padding: rebuild the index to match.
				blockIntersections.loadConnections();
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.connectionBorderRadius, newConnectionBorderRadius => {
				connectionBorderRadius.value = newConnectionBorderRadius;
				// Routing param feeds connection bbox padding: rebuild the index to match.
				blockIntersections.loadConnections();
			}, {
				immediate: true
			});
			ui_vue3.watch(() => props.disabled, disabled => {
				isDisabled.value = disabled;
				if (disabled) {
					clearCurrentConnectionPreview();
				}
			}, {
				immediate: true
			});
		});
		function dispose() {
			scope.stop();
		}
		return {
			dispose
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useHistory(options = {}) {
		const commonSnapshotHandler = newState => {
			return ui_vue3.markRaw({
				blocks: ui_vue3.markRaw(JSON.parse(JSON.stringify(newState.blocks))),
				connections: ui_vue3.markRaw(JSON.parse(JSON.stringify(newState.connections)))
			});
		};
		const commonRevertHandler = snapshot => {
			hooks.changedBlocks.trigger(commandReplace(snapshot.blocks));
			hooks.changedConnections.trigger(commandReplace(snapshot.connections));
		};
		const commonEmptyHistorySnapshot = {
			blocks: [],
			connections: []
		};
		const instance = useBlockDiagram();
		const {
			headSnapshot,
			tailSnapshot,
			currentSnapshot,
			maxCountSnapshots,
			hooks,
			snapshotHandler,
			revertHandler,
			setHistoryHandlers,
			historyCurrentState,
			translateBlocksGeometry,
			highlitedBlockIds,
			blockIdsInModel
		} = instance;
		const {
			snapshotHandler: newSnapshotHandler = null,
			revertHandler: newRevertHandler = null,
			emptyHistorySnapshot = commonEmptyHistorySnapshot,
			maxCount
		} = options;
		setHandlers({
			snapshotHandler: newSnapshotHandler,
			revertHandler: newRevertHandler
		});
		maxCountSnapshots.value = maxCount || ui_vue3.toValue(maxCountSnapshots);
		const hasNext = ui_vue3.computed(() => ui_vue3.toValue(currentSnapshot) && ui_vue3.toValue(currentSnapshot).next !== null);
		const hasPrev = ui_vue3.computed(() => ui_vue3.toValue(currentSnapshot) && ui_vue3.toValue(currentSnapshot).prev !== null);
		function setHandlers(newHandlerOptions) {
			const handlerOptions = {
				snapshotHandler: newHandlerOptions.snapshotHandler ?? ui_vue3.toValue(snapshotHandler) ?? commonSnapshotHandler,
				revertHandler: newHandlerOptions.revertHandler ?? ui_vue3.toValue(revertHandler) ?? commonRevertHandler
			};
			setHistoryHandlers(handlerOptions);
		}
		function getCountSnapshots() {
			let count = 0;
			let current = ui_vue3.toValue(headSnapshot);
			while (current) {
				current = current.next;
				count += 1;
			}
			return count;
		}
		let serializedSnapshot = null;
		let serializedSnapshotSource = null;

		// Serialized form of the current snapshot, cached by snapshot reference so a burst
		// of makeSnapshot calls (see dedup below) reuses the string instead of re-stringifying
		// the whole graph each time. Reference change (new snapshot, undo/redo, clear) invalidates it.
		function getSerializedCurrentSnapshot() {
			const current = ui_vue3.toValue(currentSnapshot);
			const snapshot = current?.snapshot ?? null;
			if (snapshot === null) {
				serializedSnapshotSource = null;
				serializedSnapshot = null;
				return null;
			}
			if (current !== serializedSnapshotSource) {
				serializedSnapshotSource = current;
				serializedSnapshot = JSON.stringify(snapshot);
			}
			return serializedSnapshot;
		}
		function makeSnapshot(options = {}) {
			const {
				snapshotHandler: newSnapshotHandler = null,
				revertHandler: newRevertHandler = null,
				emptySnapshot: newEmptySnapshot = null
			} = options;
			const snapshotHistoryHandler = newSnapshotHandler || ui_vue3.toValue(snapshotHandler);
			const revertHistoryHandler = newRevertHandler || ui_vue3.toValue(revertHandler);
			const emptySnapshot = newEmptySnapshot || emptyHistorySnapshot;
			const nextSnapshotState = snapshotHistoryHandler(ui_vue3.toValue(historyCurrentState));
			const nextSerializedState = JSON.stringify(nextSnapshotState);

			// Skip the history step when the serialized new state equals the current snapshot.
			// A single user action can trigger several hooks (endDragBlock/addBlock/deleteBlock/...),
			// each scheduling makeSnapshot; deferred to nextTick they all read the same final state
			// and would otherwise create identical snapshots that surface as dead empty undo steps.
			const currentSerializedState = getSerializedCurrentSnapshot();
			if (currentSerializedState !== null && nextSerializedState === currentSerializedState) {
				return;
			}
			const newSnapshot = ui_vue3.markRaw({
				snapshot: nextSnapshotState,
				revertHandler: revertHistoryHandler,
				emptySnapshot,
				next: null,
				prev: tailSnapshot.value
			});
			if (ui_vue3.toValue(currentSnapshot) && ui_vue3.toValue(currentSnapshot)?.next !== null) {
				currentSnapshot.value.next = newSnapshot;
				newSnapshot.prev = currentSnapshot.value;
				tailSnapshot.value.prev = null;
				tailSnapshot.value.next = null;
				tailSnapshot.value = newSnapshot;
			} else if (ui_vue3.toValue(headSnapshot) === null) {
				headSnapshot.value = newSnapshot;
				tailSnapshot.value = newSnapshot;
			} else {
				tailSnapshot.value.next = newSnapshot;
				tailSnapshot.value = newSnapshot;
			}
			currentSnapshot.value = newSnapshot;
			if (getCountSnapshots() <= ui_vue3.toValue(maxCountSnapshots) + 1) {
				return;
			}
			const firstSnapshot = headSnapshot.value;
			headSnapshot.value = firstSnapshot.next;
			headSnapshot.value.prev = null;
			firstSnapshot.next = null;
		}
		function toPortList(block) {
			return Array.isArray(block.ports) ? block.ports : [];
		}

		// A port is plain graph data, so its own keys are exactly the fields a serialized
		// comparison used to cover, and comparing them directly is indifferent to the order
		// the keys happen to have.
		function hasSamePortAttributes(current, target) {
			const currentKeys = Object.keys(current);
			return currentKeys.length === Object.keys(target).length && currentKeys.every(key => current[key] === target[key]);
		}

		// Ports of one side are laid out in the order of the array, and a measured rect keeps the
		// coordinates of its own row along with that order, so a reordered port list is a changed
		// measured shape. Hence the comparison is positional: such a pair of states must leave the
		// fast path for the slow one, which recreates the elements and measures them anew.
		function hasSamePorts(currentPorts, targetPorts) {
			if (currentPorts.length !== targetPorts.length) {
				return false;
			}
			return currentPorts.every((port, index) => {
				const targetPort = targetPorts[index];
				return targetPort !== undefined && targetPort.id === port.id && hasSamePortAttributes(port, targetPort);
			});
		}

		// Everything a measured rect depends on except the position, the only thing an
		// in-place revert is allowed to change. Compared field by field: a revert runs this
		// for every block, and a serialized form would cost a string per block.
		//
		// Hence the assumption this fast path makes about a consumer: the rendered size of a block
		// follows from its dimensions and its ports and from nothing else. A field outside them that
		// drives the size (a type mapped to its own height, say) must not change for an id that stays
		// in the graph — the keyed v-for would not remount the block, so its rect would keep the
		// translated value while the real size changed. Widening the comparison would cost that extra
		// work on every block of every undo instead.
		//
		// Known limitation of that assumption: the height of an ordinary block comes from its content
		// (useMoveableBlock styles top/left only), and content is invisible here, so an undo of a step
		// that changed the content alone — a title wrapping onto a second line, say — keeps the rect
		// measured before it. A rect is measured once per mount (useBlockState.onMountedBlock), so the
		// stale one lives until the block remounts: a slow-path revert, a cull/uncull under render
		// optimization, or the next mount of the diagram. Accepted as is, because the forward path never
		// re-measured such an edit either: the fast path drops an incidental refresh, it does not add a
		// new invariant.
		function hasSameBlockShape(current, target) {
			const {
				width: currentWidth = 0,
				height: currentHeight = 0
			} = current.dimensions ?? {};
			const {
				width: targetWidth = 0,
				height: targetHeight = 0
			} = target.dimensions ?? {};
			return currentWidth === targetWidth && currentHeight === targetHeight && hasSamePorts(toPortList(current), toPortList(target));
		}

		// Ids come from an untrusted graph, so membership is only ever kept in a Set.
		// Consuming the matched id keeps this a single pass over each side: a repeated id
		// finds nothing the second time, so a differing composition never passes.
		function hasSameIds(current, target) {
			if (current.length !== target.length) {
				return false;
			}
			const unmatchedIds = new Set();
			for (const {
				id
			} of current) {
				unmatchedIds.add(id);
			}
			for (const {
				id
			} of target) {
				if (!unmatchedIds.delete(id)) {
					return false;
				}
			}
			return true;
		}

		// How far every block has to move to reach the snapshot, or null when the snapshot is
		// not reachable by moving blocks alone: the composition of the graph differs, or a block
		// changed shape and its measured geometry no longer follows from a translation.
		function getRevertOffsets(snapshot) {
			const {
				blocks: currentBlocks,
				connections: currentConnections
			} = ui_vue3.toValue(historyCurrentState) ?? {};
			const isComparable = Array.isArray(currentBlocks) && Array.isArray(currentConnections) && Array.isArray(snapshot?.blocks) && Array.isArray(snapshot?.connections);
			if (!isComparable || currentBlocks.length !== snapshot.blocks.length || !hasSameIds(currentConnections, snapshot.connections)) {
				return null;
			}
			const unmatchedBlocks = new Map();
			for (const block of currentBlocks) {
				unmatchedBlocks.set(block.id, block);
			}
			const offsets = new Map();

			// One pass matches the composition, compares the shape and collects the offset.
			// The matched block is consumed, so with the lengths already equal a block the
			// snapshot does not know about leaves a later lookup empty.
			for (const block of snapshot.blocks) {
				const currentBlock = unmatchedBlocks.get(block.id);
				if (currentBlock === undefined || !hasSameBlockShape(currentBlock, block)) {
					return null;
				}
				unmatchedBlocks.delete(block.id);
				const offset = {
					x: (block.position?.x ?? 0) - (currentBlock.position?.x ?? 0),
					y: (block.position?.y ?? 0) - (currentBlock.position?.y ?? 0)
				};
				if (offset.x !== 0 || offset.y !== 0) {
					offsets.set(block.id, offset);
				}
			}
			return offsets;
		}

		// A snapshot that only moves blocks is restored by a single replacement: measured
		// geometry follows the move arithmetically, in the same step the coordinates change.
		// The empty snapshot in between recreates the whole graph, the historical way of
		// getting measurements refreshed, and the reason undo costs several applies. It stays
		// for the case the composition really changed and elements have to be recreated.
		//
		// Both paths end with the same selection rule: what was selected before the revert, minus
		// the blocks the model no longer has. The fast path keeps that by itself — the composition
		// does not change, so the selection survives untouched. The empty snapshot of the slow path
		// empties the model for a tick and useWatchProps trims the selection to nothing along with
		// it, so the selection is kept here and trimmed against the restored model instead.
		async function revertState({
			revertHandler,
			snapshot,
			emptySnapshot
		}) {
			const offsets = getRevertOffsets(snapshot);
			if (offsets !== null) {
				revertHandler(snapshot);
				translateBlocksGeometry(offsets);
				return;
			}
			const selectionBeforeRevert = [...(ui_vue3.toValue(highlitedBlockIds) ?? [])];
			revertHandler(emptySnapshot);
			await ui_vue3.nextTick();
			revertHandler(snapshot);
			if (selectionBeforeRevert.length === 0) {
				return;
			}

			// The restored model reaches the state on the next flush, together with the trimming
			// useWatchProps does, so the kept selection is put back only after that.
			await ui_vue3.nextTick();
			highlitedBlockIds.value = selectionBeforeRevert;
			pruneSelection(highlitedBlockIds, blockIdsInModel);
		}
		async function next() {
			if (ui_vue3.toValue(currentSnapshot) === null || ui_vue3.toValue(currentSnapshot).next === null) {
				return;
			}
			await revertState(ui_vue3.toValue(currentSnapshot).next);
			currentSnapshot.value = ui_vue3.toValue(currentSnapshot).next;
			hooks.historyNext.trigger(currentSnapshot.value);
		}
		async function prev() {
			if (ui_vue3.toValue(currentSnapshot) === null || ui_vue3.toValue(currentSnapshot).prev === null) {
				return;
			}
			await revertState(ui_vue3.toValue(currentSnapshot).prev);
			currentSnapshot.value = ui_vue3.toValue(currentSnapshot).prev;
			hooks.historyPrev.trigger(currentSnapshot.value);
		}
		function clear() {
			headSnapshot.value = null;
			tailSnapshot.value = null;
			currentSnapshot.value = null;
		}
		return {
			hasNext,
			hasPrev,
			setHandlers,
			makeSnapshot: () => ui_vue3.nextTick(() => makeSnapshot()),
			next,
			prev,
			clear,
			commonSnapshotHandler,
			commonRevertHandler
		};
	}

	// Point insertion does not rebalance the tree: targets arriving along a column come in almost
	// monotonic order and degrade it into a one-sided branch that nearest() walks on every frame of
	// the ride. The cap has to bound that walk by a constant rather than by the size of the diagram,
	// or the hot path grows with the schema exactly where the autoscroll is needed. A rebuild is paid
	// for by the inserts that asked for it, so the cap is what those inserts amortize.
	const SNAP_TARGETS_REBUILD_INSERTS_LIMIT = 50;
	// eslint-disable-next-line max-lines-per-function
	function useNewConnection(options) {
		const {
			isDisabledBlockDiagram,
			newConnection,
			portsRectMap,
			portsGeometryVersion,
			portsValidationsFnMap,
			validPortsMap,
			virtualPortsMap,
			addConnection,
			portsNearest,
			blockIntersections,
			transformMouseEventToPoint,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition
		} = useBlockDiagram();
		const {
			block,
			port,
			position,
			normalyzeConnectionFn = null,
			isVirtual = false
		} = options;
		const isSourcePort = ui_vue3.ref(false);
		// A candidate the rules turned down stays turned down for the whole gesture: the source port
		// is fixed, so re-running the rules on every pass only rebuilds the same probe connection.
		// Hence the contract on DiagramValidationPortRuleFn: a verdict must hold for the whole gesture.
		const rejectedTargets = new Map();
		let lastMouseEvent = null;
		let isAutoScrollStarted = false;
		let stopSnapTargetsWatch = null;
		let insertsSinceBuild = 0;
		const isTargetPort = ui_vue3.computed(() => {
			const {
				targetBlockId = null,
				targetPortId = null
			} = ui_vue3.toValue(newConnection) ?? {};
			return ui_vue3.toValue(block).id === targetBlockId && ui_vue3.toValue(port).id === targetPortId;
		});
		ui_vue3.watch(isDisabledBlockDiagram, isDisabled => {
			if (isDisabled) {
				closeGesture();
			}
		});

		// Only the owner's unmount winds the gesture down - closeGesture leaves every other instance
		// alone. That distinction is the whole point here: culling unmounts neighbour ports while the
		// camera pans for a live gesture, and an unowned close would kill it. For the owner the
		// opposite holds - leaving the document handlers bound would keep the composable, the index
		// and the port snapshots alive until a mouseup that would then commit on a dead context.
		ui_vue3.onUnmounted(closeGesture);
		function validateConnection(rules, connection) {
			if (rules === null) {
				return true;
			}
			if (main_core.Type.isArray(rules)) {
				return rules.every(rule => rule(ui_vue3.toValue(connection)));
			}
			if (!main_core.Type.isFunction(rules)) {
				return true;
			}
			return rules(ui_vue3.toValue(connection));
		}
		function isValidTargetPort(blockId, portId, targetPort, connection) {
			// Rules are missing here only for a port that unmounted mid-pass: a candidate whose rules
			// are not registered yet is held back by hasValidationRules before it gets here. Without
			// that guard validateConnection would read undefined rules as universally valid.
			const rules = ui_vue3.toValue(portsValidationsFnMap).get(blockId)?.get(portId);
			return validateConnection(rules, {
				...ui_vue3.toValue(connection),
				targetBlockId: blockId,
				targetPortId: portId,
				targetPort: {
					...ui_vue3.toValue(targetPort)
				}
			});
		}
		function hasValidationRules(blockId, portId) {
			return ui_vue3.toValue(portsValidationsFnMap).get(blockId)?.has(portId) ?? false;
		}
		function isRejectedTarget(blockId, portId) {
			return rejectedTargets.get(blockId)?.has(portId) ?? false;
		}
		function rememberRejectedTarget(blockId, portId) {
			if (!rejectedTargets.has(blockId)) {
				rejectedTargets.set(blockId, new Set());
			}
			rejectedTargets.get(blockId).add(portId);
		}
		function getPortRect(blockId, portId) {
			return ui_vue3.toValue(portsRectMap)?.[blockId]?.[portId] ?? null;
		}
		function getValidPorts(portsMap, connection) {
			const filteredPortsMap = new Map();
			for (const [blockId, ports] of ui_vue3.toValue(portsMap).entries()) {
				for (const [portId, targetPort] of ports.entries()) {
					// A port that has no measured geometry or no registered rules yet is no target: it
					// must stay out of the set and out of rejectedTargets, so a later pass can take it
					// once the port is mounted through.
					if (getPortRect(blockId, portId) === null || !hasValidationRules(blockId, portId)) {
						continue;
					}
					if (!isValidTargetPort(blockId, portId, targetPort, connection)) {
						rememberRejectedTarget(blockId, portId);
						continue;
					}
					if (!filteredPortsMap.has(blockId)) {
						filteredPortsMap.set(blockId, new Map());
					}
					filteredPortsMap.get(blockId).set(portId, targetPort);
				}
			}
			return filteredPortsMap;
		}
		function collectSnapCandidatePorts() {
			return buildSnapCandidatePorts(ui_vue3.toValue(blockIntersections.visiblePorts), ui_vue3.toValue(virtualPortsMap));
		}
		function hasSnapTarget(blockId, portId) {
			return ui_vue3.toValue(validPortsMap).get(blockId)?.has(portId) ?? false;
		}
		function addSnapTarget(blockId, portId, targetPort) {
			const targetsMap = ui_vue3.toValue(validPortsMap);
			if (!targetsMap.has(blockId)) {
				targetsMap.set(blockId, new Map());
			}
			targetsMap.get(blockId).set(portId, targetPort);
		}

		// A rebuild leaves out every target whose rect is gone, so the highlighted set drops it too:
		// what is highlighted stays exactly what accepts the connection. Culling alone never gets
		// here - it retains the geometry of a node that only left the viewport.
		function dropUnmeasuredSnapTargets() {
			const targetsMap = ui_vue3.toValue(validPortsMap);
			for (const [blockId, ports] of targetsMap.entries()) {
				for (const portId of ports.keys()) {
					if (getPortRect(blockId, portId) === null) {
						ports.delete(portId);
					}
				}
				if (ports.size === 0) {
					targetsMap.delete(blockId);
				}
			}
		}

		// A target joins the highlighted set only together with the index, so what is highlighted is
		// exactly what accepts the connection.
		function tryAppendSnapTarget(blockId, portId, candidatePort) {
			if (hasSnapTarget(blockId, portId) || isRejectedTarget(blockId, portId)) {
				return false;
			}
			const portRect = getPortRect(blockId, portId);
			if (portRect === null) {
				return false;
			}

			// A port whose node returned into the viewport already has its retained geometry, but its
			// rules are registered by the mount hook, which runs after this pass. Like a port without a
			// rect it is skipped without a rejection, so the pass after the mount takes it.
			if (!hasValidationRules(blockId, portId)) {
				return false;
			}
			if (!isValidTargetPort(blockId, portId, candidatePort, newConnection)) {
				rememberRejectedTarget(blockId, portId);
				return false;
			}
			if (!portsNearest.addPort(blockId, portId, candidatePort, portRect)) {
				return false;
			}
			addSnapTarget(blockId, portId, candidatePort);
			return true;
		}

		// The set of targets only grows over a gesture: a node that arrived into the viewport becomes
		// droppable, while one that left keeps the target it already earned. A port without measured
		// geometry is skipped and taken on a later pass, once the rect is there.
		function appendSnapTargets() {
			const candidatePortsMap = collectSnapCandidatePorts();
			let inserted = 0;
			for (const [blockId, ports] of candidatePortsMap.entries()) {
				for (const [portId, candidatePort] of ports.entries()) {
					if (tryAppendSnapTarget(blockId, portId, candidatePort)) {
						inserted += 1;
					}
				}
			}
			insertsSinceBuild += inserted;
			if (insertsSinceBuild > SNAP_TARGETS_REBUILD_INSERTS_LIMIT) {
				dropUnmeasuredSnapTargets();
				portsNearest.init(ui_vue3.toValue(validPortsMap));
				insertsSinceBuild = 0;
			}
		}

		// The watcher is created per gesture instead of per port instance: every mounted port runs this
		// composable, and a permanent subscription would fire in each of them on every camera frame.
		function startSnapTargetsWatch() {
			stopSnapTargetsWatch?.();
			// Two signals, neither of which walks a structure. The candidate set changes when a node
			// enters or leaves the viewport - that alone is what makes new ports droppable, and it
			// holds whether or not the nodes are virtualized. Port geometry is the second signal: a
			// port measured after its node was already counted visible would otherwise wait for the
			// next arrival. Post flush folds a whole mount batch into one pass and still lands before
			// the next autoscroll frame queries the index.
			stopSnapTargetsWatch = ui_vue3.watch([blockIntersections.visiblePorts, portsGeometryVersion], appendSnapTargets, {
				flush: 'post'
			});
		}
		function unwatchSnapTargets() {
			stopSnapTargetsWatch?.();
			stopSnapTargetsWatch = null;
		}
		function normalyzeNewConnection(connection, normalyzeFn = null) {
			if (main_core.Type.isFunction(normalyzeFn)) {
				return normalyzeFn(connection);
			}
			return {
				id: connection.id,
				sourceBlockId: connection.sourceBlockId,
				sourcePortId: connection.sourcePortId,
				targetBlockId: connection.targetBlockId,
				targetPortId: connection.targetPortId
			};
		}
		function onMouseDownPort(event) {
			event.stopPropagation();

			// Virtual (placeholder) ports are drop-only targets: they never originate
			// a connection, otherwise a drag would start from a not-yet-created port.
			if (ui_vue3.toValue(isDisabledBlockDiagram) || isVirtual) {
				return;
			}

			// A non-primary press opens a gesture whose mouseup the context menu eats, and a press
			// over a live gesture leaves its owner with bound handlers, a live watch and an unmount
			// that would stop the autoscroll of the gesture that replaced it.
			if (event.button !== 0 || ui_vue3.toValue(newConnection) !== null) {
				return;
			}
			const portRect = getPortRect(ui_vue3.toValue(block).id, ui_vue3.toValue(port).id);
			if (portRect === null) {
				return;
			}

			// Ownership is claimed only once the gesture is certain to start.
			isSourcePort.value = true;
			const start = {
				x: portRect.x + portRect.width / 2,
				y: portRect.y + portRect.height / 2
			};
			const center = transformMouseEventToPoint(event);
			newConnection.value = {
				id: main_core.Text.getRandom(),
				sourceBlockId: ui_vue3.toValue(block).id,
				sourcePortId: ui_vue3.toValue(port).id,
				sourcePort: {
					...ui_vue3.toValue(port)
				},
				sourcePortPosition: position,
				targetBlockId: null,
				targetPortId: null,
				targetPort: null,
				start,
				center,
				end: null
			};
			rejectedTargets.clear();
			validPortsMap.value = getValidPorts(collectSnapCandidatePorts(), newConnection);
			portsNearest.init(ui_vue3.toValue(validPortsMap));
			insertsSinceBuild = 0;
			bindGestureHandlers();
			startSnapTargetsWatch();
		}
		function bindGestureHandlers() {
			main_core.Event.bind(document, 'mousemove', onMouseMove);
			main_core.Event.bind(document, 'mouseup', onMouseUp);
			main_core.Event.bind(document, 'pointercancel', closeGesture);
			main_core.Event.bind(window, 'blur', closeGesture);
		}
		function unbindGestureHandlers() {
			main_core.Event.unbind(document, 'mousemove', onMouseMove);
			main_core.Event.unbind(document, 'mouseup', onMouseUp);
			main_core.Event.unbind(document, 'pointercancel', closeGesture);
			main_core.Event.unbind(window, 'blur', closeGesture);
		}

		// Winds the gesture down without committing anything. Only the instance that owns the
		// gesture may close it: under render optimization neighbour ports are unmounted by culling
		// exactly while the camera pans for this gesture, so an unowned close would kill a live one.
		function closeGesture() {
			if (!ui_vue3.toValue(isSourcePort)) {
				return;
			}

			// The autoscroll instance is shared by the whole diagram, so only a gesture that started
			// it may stop it.
			if (isAutoScrollStarted) {
				stopAutoScroll();
			}
			unbindGestureHandlers();
			unwatchSnapTargets();
			newConnection.value = null;
			isSourcePort.value = false;
			lastMouseEvent = null;
			isAutoScrollStarted = false;
			insertsSinceBuild = 0;
			rejectedTargets.clear();
			validPortsMap.value = new Map();
			portsNearest.clear();
			// Move and resize change the model as they end, and the write path itself asks culling to
			// catch up. This gesture changes nothing, so the retained source node would stay in the
			// visible set until the camera moves next.
			blockIntersections.selectVisibleBlocks();
		}
		function onMouseMove(event) {
			if (!ui_vue3.toValue(newConnection) || ui_vue3.toValue(isDisabledBlockDiagram)) {
				return;
			}
			lastMouseEvent = event;

			// Autoscroll waits for the first move on purpose: armed on mousedown it would pan the
			// camera on a plain click on a port that itself sits in the edge threshold, with no move
			// at all. start() only arms it - the loop is started by updateMousePosition(), so the very
			// move that arms the autoscroll must report the cursor to it as well. Otherwise the ride
			// begins one event late, and a gesture whose move is the only one never begins at all.
			if (!isAutoScrollStarted) {
				isAutoScrollStarted = true;
				startAutoScroll(event, onAutoScrollFrame);
			}
			updateMousePosition(event);
			updateConnectionTarget(event);
		}

		// The camera has already moved when autoscroll calls back, so the same cursor point maps to a
		// new world point and the connection follows without a mouse move. The pan delta is never
		// added to the gesture math - the recalculated point already carries it.
		function onAutoScrollFrame() {
			if (lastMouseEvent !== null) {
				onMouseMove(lastMouseEvent);
			}
		}
		function updateConnectionTarget(event) {
			const point = transformMouseEventToPoint(event);
			const [nearestPort] = portsNearest.nearest(point, 1, 100)?.[0] ?? [null];
			const isSamePorts = ui_vue3.toValue(newConnection).sourceBlockId === nearestPort?.blockId && ui_vue3.toValue(newConnection).sourcePortId === nearestPort?.portId;
			// The gesture never revokes a target, but the rect behind it can still go: culling drops a
			// virtual port's measurement, and a bulk purge takes a whole block's geometry. A target
			// that can no longer be drawn counts as no target at all.
			const portRect = nearestPort === null ? null : getPortRect(nearestPort.blockId, nearestPort.portId);

			// Fields are written in place: every mounted port watches newConnection through its own
			// isTargetPort, so replacing the object would wake all of them on every frame of a ride
			// that usually does not change the target at all.
			const connection = ui_vue3.toValue(newConnection);
			if (nearestPort && !isSamePorts && portRect !== null) {
				connection.targetBlockId = nearestPort.blockId;
				connection.targetPortId = nearestPort.portId;
				connection.targetPort = nearestPort.port;
				connection.center = point;
				connection.end = {
					x: portRect.x + portRect.width / 2,
					y: portRect.y + portRect.height / 2
				};
			} else {
				connection.targetBlockId = null;
				connection.targetPortId = null;
				connection.targetPort = null;
				connection.center = point;
				connection.end = null;
			}
		}
		function onMouseUp() {
			if (ui_vue3.toValue(newConnection) === null) {
				return;
			}
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				closeGesture();
				return;
			}
			const {
				sourceBlockId = null,
				sourcePortId = null,
				targetBlockId = null,
				targetPortId = null
			} = ui_vue3.toValue(newConnection);
			const isSamePort = sourceBlockId === targetBlockId && sourcePortId === targetPortId;
			const hasSourceIds = sourceBlockId !== null && sourcePortId !== null;
			// A target that lost its rect is unresolvable: a virtual one is gone from virtualPortsMap
			// as well, and committing it would wire the connection to the placeholder id.
			const hasResolvableTarget = targetBlockId !== null && targetPortId !== null && getPortRect(targetBlockId, targetPortId) !== null;
			if (!isSamePort && hasSourceIds && hasResolvableTarget) {
				const virtualEntry = ui_vue3.toValue(virtualPortsMap).get(targetBlockId)?.get(targetPortId) ?? null;
				if (virtualEntry) {
					// Virtual target: hand the drop intent to the consumer BEFORE
					// resetting the drag state so it materializes the real port and
					// wires the connection to its real id. A virtual target without a
					// handler is cancelled — the engine must never commit a connection
					// to the placeholder id itself.
					virtualEntry.onDrop?.({
						...ui_vue3.toValue(newConnection)
					});
				} else {
					// Real target: standard commit.
					addConnection(normalyzeNewConnection(ui_vue3.toValue(newConnection), normalyzeConnectionFn));
				}
			}
			closeGesture();
		}
		return {
			isSourcePort,
			isTargetPort,
			onMouseDownPort
		};
	}

	function useTransientHighlightedBlocks() {
		const {
			highlitedBlockIds,
			transientHighlightedBlockIds
		} = useBlockDiagram();
		function add(blockId) {
			if (!ui_vue3.toValue(transientHighlightedBlockIds).includes(blockId)) {
				ui_vue3.toValue(transientHighlightedBlockIds).push(blockId);
			}
		}
		function clear() {
			transientHighlightedBlockIds.value = [];
		}
		function isBlockVisuallyHighlighted(blockId) {
			return ui_vue3.toValue(highlitedBlockIds).includes(blockId) || ui_vue3.toValue(transientHighlightedBlockIds).includes(blockId);
		}
		return {
			transientHighlightedBlockIds,
			add,
			clear,
			isBlockVisuallyHighlighted
		};
	}

	function useBlockState(options) {
		const {
			block,
			blockRef
		} = options;
		const {
			blockElMap,
			blocksRectMap,
			isDisabledBlockDiagram,
			movingBlockId,
			blockMounted,
			isRenderOptimizationAvailable,
			blockIdsInModel,
			updatePortSegmentSizes,
			portsRectMap
		} = useBlockDiagram();
		const {
			isBlockVisuallyHighlighted
		} = useTransientHighlightedBlocks();
		const isHiglitedBlock = ui_vue3.computed(() => {
			return isBlockVisuallyHighlighted(ui_vue3.toValue(block)?.id);
		});
		const isDisabled = ui_vue3.computed(() => {
			return ui_vue3.toValue(isDisabledBlockDiagram);
		});
		const blockZindex = ui_vue3.computed(() => {
			if (ui_vue3.toValue(movingBlockId) === ui_vue3.toValue(block).id) {
				return {
					zIndex: BLOCK_INDEXES.MOVABLE
				};
			}
			if (ui_vue3.toValue(isHiglitedBlock)) {
				return {
					zIndex: BLOCK_INDEXES.HIGHLITED
				};
			}
			return {
				zIndex: BLOCK_INDEXES.STANDING
			};
		});

		// Under culling an off-screen block never mounts, so waitAllBlocksMounted never
		// resolves and the deferred updatePortSegmentSizes in onMountedPort never runs — the
		// port keeps zero-length segments and its retained routing geometry stays empty. The
		// block's ports mount before it (children before parent) and its rect is written just
		// above, so compute the segments here directly, bypassing the global barrier (the same
		// direct-compute precedent as connections-queue-transition.js). The promise path stays
		// and recomputes idempotently if the barrier ever resolves. Order comes from the rect
		// captured at port mount, matching the order the drawing path uses.
		function measurePortSegments(blockId) {
			const portsRect = ui_vue3.toValue(portsRectMap)[blockId];
			if (!portsRect) {
				return;
			}
			for (const portId of Object.keys(portsRect)) {
				updatePortSegmentSizes(blockId, portId, portsRect[portId].order ?? 0);
			}
		}
		function onMountedBlock() {
			const blockId = ui_vue3.toValue(block).id;
			if (!ui_vue3.toValue(blockElMap).has(blockId)) {
				ui_vue3.toValue(blockElMap).set(blockId, ui_vue3.toValue(blockRef));
			}
			const {
				x = 0,
				y = 0,
				width = 0,
				height = 0
			} = getCanvasRect(ui_vue3.toValue(blockRef)) ?? {};
			blocksRectMap.value[blockId] = {
				x,
				y,
				width,
				height
			};
			if (ui_vue3.toValue(isRenderOptimizationAvailable)) {
				measurePortSegments(blockId);
			}
			blockMounted(blockId);
		}
		function onUnmountedBlock() {
			const blockId = ui_vue3.toValue(block).id;
			ui_vue3.toValue(blockElMap).delete(blockId);

			// Retain measured rect while the node stays in the model under culling
			// (see onUnmountedPort). Real removal clears it via purgeBlockGeometry.
			const retain = shouldRetainGeometry(ui_vue3.toValue(isRenderOptimizationAvailable), ui_vue3.toValue(blockIdsInModel), blockId);
			if (!retain) {
				delete blocksRectMap.value[blockId];
			}
		}
		return {
			isHiglitedBlock,
			isDisabled,
			blockZindex,
			onMountedBlock,
			onUnmountedBlock
		};
	}

	// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
	// lone .ts source inside this extension would not resolve.
	// Shift asks for snapping. Both mouse and keyboard events carry the flag, so a single predicate
	// answers for a caller holding an event and for the state tracked below.
	function isSnapModifier(event) {
		return event?.shiftKey === true;
	}

	// The modifier is tracked for the window, not read off the frame event: a frame of the autoscroll
	// loop has no event of its own, so a key pressed over a motionless pointer would go unnoticed
	// until the pointer moves again.
	let isModifierPressed = false;
	let trackerCount = 0;
	const onKeyChange = event => {
		isModifierPressed = isSnapModifier(event);
	};

	// A window that loses focus never delivers the keyup, so a held modifier would stay pressed.
	const onWindowBlur = () => {
		isModifierPressed = false;
	};
	function addTracker() {
		trackerCount += 1;
		if (trackerCount > 1) {
			return;
		}
		main_core.Event.bind(window, 'keydown', onKeyChange);
		main_core.Event.bind(window, 'keyup', onKeyChange);
		main_core.Event.bind(window, 'blur', onWindowBlur);
	}
	function removeTracker() {
		trackerCount -= 1;
		if (trackerCount > 0) {
			return;
		}
		main_core.Event.unbind(window, 'keydown', onKeyChange);
		main_core.Event.unbind(window, 'keyup', onKeyChange);
		main_core.Event.unbind(window, 'blur', onWindowBlur);
		isModifierPressed = false;
	}
	function useSnapModifier() {
		// The listeners live only while a gesture needs them: every consumer keeps its own
		// subscription, so it is released exactly once whatever ends the gesture.
		let isTracking = false;
		return {
			isPressed: () => isModifierPressed,
			// A mouse event carries the modifier itself, so every frame corrects the tracked state -
			// including a Shift toggled while the window was out of focus.
			sync: event => {
				isModifierPressed = isSnapModifier(event);
			},
			startTracking: () => {
				if (isTracking) {
					return;
				}
				isTracking = true;
				addTracker();
			},
			stopTracking: () => {
				if (!isTracking) {
					return;
				}
				isTracking = false;
				removeTracker();
			}
		};
	}

	function copyPosition(position) {
		return {
			x: position.x,
			y: position.y
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useMoveableBlock(blockRef, block) {
		const isDragged = ui_vue3.ref(false);
		const {
			isDisabledBlockDiagram,
			zoom,
			updateBlock,
			hooks,
			setMovingBlock,
			resetMovingBlock,
			setGestureBlocks,
			resetGestureBlocks,
			setPortOffsetByBlockId,
			updateBlockRectById,
			getBlockById,
			blocks: allBlocksRef,
			blocksRectMap,
			blockElMap,
			highlitedBlockIds,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition,
			connectionPreview,
			clearConnectionPreview,
			snapPoint
		} = useBlockDiagram();
		const snapModifier = useSnapModifier();
		const x = ui_vue3.ref(ui_vue3.toValue(block).position.x);
		const y = ui_vue3.ref(ui_vue3.toValue(block).position.y);
		let activeGesture = null;
		let nextGestureToken = 0;
		let reconciliationToken = 0;
		ui_vue3.watchEffect(() => {
			x.value = ui_vue3.toValue(block).position.x;
			y.value = ui_vue3.toValue(block).position.y;
		});
		ui_vue3.watch(isDisabledBlockDiagram, isDisabled => {
			if (isDisabled && activeGesture !== null) {
				cancelGesture(activeGesture.token);
			}
		});
		const blockPositionStyle = ui_vue3.computed(() => {
			return {
				top: `${y.value}px`,
				left: `${x.value}px`
			};
		});
		function createGestureBlock(targetBlock, isPrimary) {
			const blockValue = ui_vue3.toValue(targetBlock);
			const storedRect = ui_vue3.toValue(blocksRectMap)?.[blockValue.id] ?? {};
			const dimensions = ui_vue3.toValue(blockValue.dimensions) ?? {};
			const position = copyPosition(ui_vue3.toValue(blockValue.position));
			return {
				id: blockValue.id,
				isPrimary,
				originalPosition: position,
				currentPosition: copyPosition(position),
				width: Number.isFinite(storedRect.width) ? storedRect.width : Number.isFinite(dimensions.width) ? dimensions.width : 0,
				height: Number.isFinite(storedRect.height) ? storedRect.height : Number.isFinite(dimensions.height) ? dimensions.height : 0
			};
		}

		// Geometry entries are updated, never created: the geometry of a node may have been purged on
		// purpose, and a merge over a missing entry would resurrect it. The size of the gesture snapshot
		// only fills an entry that has none - it falls back to zero when nothing was measured at the
		// press, and it goes stale as soon as the node is measured again during the gesture.
		function updateGestureBlockRect(gestureBlock, position) {
			const storedRect = ui_vue3.toValue(blocksRectMap)?.[gestureBlock.id];
			if (!main_core.Type.isObjectLike(storedRect)) {
				return;
			}
			const rect = {
				x: position.x,
				y: position.y
			};
			if (!Number.isFinite(storedRect.width)) {
				rect.width = gestureBlock.width;
			}
			if (!Number.isFinite(storedRect.height)) {
				rect.height = gestureBlock.height;
			}
			updateBlockRectById(gestureBlock.id, rect);
		}
		function updateLocalPosition(gestureBlock, position) {
			const deltaX = position.x - gestureBlock.currentPosition.x;
			const deltaY = position.y - gestureBlock.currentPosition.y;
			gestureBlock.currentPosition = copyPosition(position);
			if (gestureBlock.isPrimary) {
				x.value = position.x;
				y.value = position.y;
			} else {
				const blockElement = ui_vue3.toValue(blockElMap)?.get(gestureBlock.id);
				if (blockElement) {
					main_core.Dom.style(blockElement, 'left', `${position.x}px`);
					main_core.Dom.style(blockElement, 'top', `${position.y}px`);
				}
			}
			updateGestureBlockRect(gestureBlock, position);
			if (deltaX !== 0 || deltaY !== 0) {
				setPortOffsetByBlockId(gestureBlock.id, {
					x: -deltaX,
					y: -deltaY
				});
			}
		}
		function isBeyondDragThreshold(gesture, clientX, clientY) {
			return Math.abs(clientX - gesture.downClientX) >= DRAG_START_THRESHOLD || Math.abs(clientY - gesture.downClientY) >= DRAG_START_THRESHOLD;
		}
		function getPointerPosition(gesture, clientX, clientY, isSnapRequested) {
			return snapPoint({
				x: Math.round((clientX - gesture.offsetX) / gesture.zoom),
				y: Math.round((clientY - gesture.offsetY) / gesture.zoom)
			}, isSnapRequested);
		}
		function applyPointerPosition(gesture, clientX, clientY, notifyMove, notifyUnchanged = false, isSnapRequested = false) {
			const newPosition = getPointerPosition(gesture, clientX, clientY, isSnapRequested);
			const deltaX = newPosition.x - gesture.primaryBlock.currentPosition.x;
			const deltaY = newPosition.y - gesture.primaryBlock.currentPosition.y;
			const changed = deltaX !== 0 || deltaY !== 0;
			gesture.lastClientX = clientX;
			gesture.lastClientY = clientY;
			gesture.isLastFrameSnapped = isSnapRequested;
			if (changed) {
				updateLocalPosition(gesture.primaryBlock, newPosition);
				for (const groupBlock of gesture.groupBlocks) {
					updateLocalPosition(groupBlock, {
						x: groupBlock.currentPosition.x + deltaX,
						y: groupBlock.currentPosition.y + deltaY
					});
				}
				gesture.hasMoved = true;
			}
			if ((changed || notifyUnchanged)) {
				hooks.moveDragBlock.trigger(block);
			}
			return changed;
		}
		function getActiveGesture(token) {
			if (activeGesture?.token !== token || activeGesture.isClosing) {
				return null;
			}
			return activeGesture;
		}
		function bindGestureHandlers(gesture) {
			gesture.handlers = {
				mouseMove: event => handleMouseMove(gesture.token, event),
				mouseUp: event => finishGesture(gesture.token, event),
				pointerCancel: () => cancelGesture(gesture.token),
				keyDown: event => {
					if (event.key === 'Escape') {
						cancelGesture(gesture.token);
					}
				},
				blur: () => cancelGesture(gesture.token)
			};
			main_core.Event.bind(document, 'mousemove', gesture.handlers.mouseMove);
			main_core.Event.bind(document, 'mouseup', gesture.handlers.mouseUp);
			main_core.Event.bind(document, 'pointercancel', gesture.handlers.pointerCancel);
			main_core.Event.bind(document, 'keydown', gesture.handlers.keyDown);
			main_core.Event.bind(window, 'blur', gesture.handlers.blur);
		}
		function unbindGestureHandlers(gesture) {
			if (gesture.handlers === null) {
				return;
			}
			main_core.Event.unbind(document, 'mousemove', gesture.handlers.mouseMove);
			main_core.Event.unbind(document, 'mouseup', gesture.handlers.mouseUp);
			main_core.Event.unbind(document, 'pointercancel', gesture.handlers.pointerCancel);
			main_core.Event.unbind(document, 'keydown', gesture.handlers.keyDown);
			main_core.Event.unbind(window, 'blur', gesture.handlers.blur);
			gesture.handlers = null;
		}
		function getCurrentPreviewActivationKey() {
			const activationKey = ui_vue3.toValue(connectionPreview)?.activationKey;
			return main_core.Type.isStringFilled(activationKey) ? activationKey : null;
		}
		function clearGesturePreview(activationKey) {
			if (activationKey !== null) {
				clearConnectionPreview(activationKey);
			}
		}
		function closeGesture(gesture) {
			stopAutoScroll();
			snapModifier.stopTracking();
			unbindGestureHandlers(gesture);
			resetMovingBlock();
			resetGestureBlocks();
			isDragged.value = false;
			activeGesture = null;
		}
		function cancelGesture(token) {
			const gesture = getActiveGesture(token);
			if (gesture === null) {
				return;
			}
			gesture.isClosing = true;
			const previewActivationKey = getCurrentPreviewActivationKey();
			updateLocalPosition(gesture.primaryBlock, gesture.primaryBlock.originalPosition);
			for (const groupBlock of gesture.groupBlocks) {
				updateLocalPosition(groupBlock, groupBlock.originalPosition);
			}
			closeGesture(gesture);
			clearGesturePreview(previewActivationKey);
		}

		// The command carries the content of the live model and the position the gesture arrived at:
		// the content read from the component input would be the copy the visible-set selection took
		// on the previous frame, so a node edited during the gesture would be overwritten on commit.
		function createUpdatedBlock(gestureBlock) {
			const modelBlock = getBlockById(gestureBlock.id);
			if (modelBlock === null) {
				return null;
			}
			return {
				...ui_vue3.toValue(modelBlock),
				position: {
					...ui_vue3.toValue(modelBlock).position,
					...gestureBlock.currentPosition
				}
			};
		}

		// The end of the gesture is part of the public contract of the extension, so it is reported even
		// when the node has left the model and no command was built: a consumer waits for this event to
		// close a gesture of its own. With no model block the input is all there is to name the node by.
		function commitPrimaryBlock(gestureBlock) {
			const updatedBlock = createUpdatedBlock(gestureBlock);
			if (updatedBlock) {
				updateBlock(updatedBlock);
			}
			hooks.endDragBlock.trigger(updatedBlock ?? ui_vue3.toValue(block));
		}

		// The model is the truth about where a node stands, so after the gesture the measured
		// geometry is brought to the model position instead of arbitrating between the gesture
		// result and the component input: that input comes from the visible-set selection, which
		// lags the model by a frame under render optimization. A consumer that refused the move
		// left the previous position in the model, and the alignment returns the geometry to it.
		function alignGeometryToModel(gestureBlock) {
			const modelBlock = getBlockById(gestureBlock.id);
			if (modelBlock === null) {
				return;
			}
			const modelPosition = ui_vue3.toValue(modelBlock).position;
			if (!main_core.Type.isObjectLike(modelPosition)) {
				return;
			}

			// A non-finite coordinate would turn every port of the node into NaN and take all its
			// connections off the canvas.
			if (!Number.isFinite(modelPosition.x) || !Number.isFinite(modelPosition.y)) {
				return;
			}
			updateLocalPosition(gestureBlock, modelPosition);
		}

		// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
		// cycle - the model is read once here, and a command applied later misses the alignment.
		function schedulePositionReconciliation(gesture) {
			const token = ++reconciliationToken;
			void ui_vue3.nextTick(() => {
				if (token !== reconciliationToken || activeGesture !== null) {
					return;
				}
				for (const gestureBlock of [gesture.primaryBlock, ...gesture.groupBlocks]) {
					alignGeometryToModel(gestureBlock);
				}
			});
		}
		function finishGesture(token, event) {
			const gesture = getActiveGesture(token);
			if (gesture === null) {
				return;
			}
			event.stopPropagation();
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				cancelGesture(token);
				return;
			}

			// A mouseup can carry a position no mousemove has seen, so the threshold is judged against
			// the release point as well: a press that ends far from where it started is a drag even
			// without a single move frame. Below the threshold the press stays a selection - the block
			// never followed the pointer, and committing the release would move a block nobody dragged,
			// with snapping on onto a grid node it did not stand on.
			const hasDrawnFrame = gesture.isDragStarted;
			if (!hasDrawnFrame && isBeyondDragThreshold(gesture, event.clientX, event.clientY)) {
				gesture.isDragStarted = true;
			}
			if (gesture.isDragStarted) {
				// The modifier is taken from the last applied frame rather than from this mouseup: Shift
				// released an instant before the button would part the committed position from the drawn
				// one. With no frame drawn there is nothing to keep in step, so the release decides.
				applyPointerPosition(gesture, event.clientX, event.clientY, true, false, hasDrawnFrame ? gesture.isLastFrameSnapped : isSnapModifier(event));
			}
			gesture.isClosing = true;
			const previewActivationKey = getCurrentPreviewActivationKey();
			stopAutoScroll();
			unbindGestureHandlers(gesture);

			// The commands go out first and the gesture is released after them, but the release is not
			// theirs to skip: a consumer hook that throws would leave the moving node and the retention
			// standing for good, and the next press would find a gesture still active. The exception
			// itself is not the extension's to handle and goes on to the consumer.
			try {
				if (gesture.hasMoved) {
					for (const groupBlock of gesture.groupBlocks) {
						const updatedBlock = createUpdatedBlock(groupBlock);
						if (updatedBlock) {
							updateBlock(updatedBlock);
							hooks.endDragBlock.trigger(updatedBlock);
						}
					}
					commitPrimaryBlock(gesture.primaryBlock);
				}
			} finally {
				closeGesture(gesture);
				clearGesturePreview(previewActivationKey);
			}
			if (gesture.hasMoved) {
				schedulePositionReconciliation(gesture);
			}
		}
		function handleMouseMove(token, event) {
			const gesture = getActiveGesture(token);
			if (gesture === null) {
				return;
			}
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				cancelGesture(token);
				return;
			}
			event.stopPropagation();

			// Below the threshold the press is still a selection, so the block must not follow the
			// pointer: snapping would pull a block standing between grid nodes onto the nearest one on
			// the shake of a hand, which is a move nobody asked for.
			if (!gesture.isDragStarted) {
				if (!isBeyondDragThreshold(gesture, event.clientX, event.clientY)) {
					return;
				}
				gesture.isDragStarted = true;
			}
			snapModifier.sync(event);
			updateMousePosition(event);
			applyPointerPosition(gesture, event.clientX, event.clientY, true, true, snapModifier.isPressed());
		}
		function onMouseDown(event) {
			if (event.button !== 0 || ui_vue3.toValue(isDisabledBlockDiagram) || activeGesture !== null) {
				return;
			}
			event.stopPropagation();
			++reconciliationToken;
			const blockValue = ui_vue3.toValue(block);
			const blockId = blockValue.id;
			const selectedIds = ui_vue3.toValue(highlitedBlockIds);
			const isSelected = selectedIds.includes(blockId);
			if (!isSelected) {
				highlitedBlockIds.value = [blockId];
			}
			const currentZoom = ui_vue3.toValue(zoom);
			if (!Number.isFinite(currentZoom) || currentZoom <= 0) {
				return;
			}
			const groupIds = ui_vue3.toValue(highlitedBlockIds);
			const groupBlocks = groupIds.length > 1 ? ui_vue3.toValue(allBlocksRef).filter(item => groupIds.includes(ui_vue3.toValue(item).id) && ui_vue3.toValue(item).id !== blockId).map(item => createGestureBlock(item, false)) : [];
			const primaryBlock = createGestureBlock(blockValue, true);
			const gesture = {
				token: ++nextGestureToken,
				primaryBlock,
				groupBlocks,
				offsetX: Math.round(event.clientX - primaryBlock.originalPosition.x * currentZoom),
				offsetY: Math.round(event.clientY - primaryBlock.originalPosition.y * currentZoom),
				downClientX: event.clientX,
				downClientY: event.clientY,
				lastClientX: event.clientX,
				lastClientY: event.clientY,
				zoom: currentZoom,
				isDragStarted: false,
				isLastFrameSnapped: false,
				hasMoved: false,
				isClosing: false,
				handlers: null
			};
			activeGesture = gesture;
			isDragged.value = true;
			setMovingBlock(blockId);
			// The group members are led by the same gesture and reach the model only on mouseup, so
			// culling must judge none of them by the pre-gesture box the index still holds.
			setGestureBlocks([blockId, ...groupBlocks.map(groupBlock => groupBlock.id)]);
			snapModifier.sync(event);
			snapModifier.startTracking();
			hooks.startDragBlock.trigger(block);

			// The press only arms the autoscroll; the loop starts when the gesture first reports the
			// pointer, and it reports it past the drag threshold - so the camera cannot pan under a
			// press that is still a selection.
			startAutoScroll(event, (deltaX, deltaY) => {
				const currentGesture = getActiveGesture(gesture.token);
				if (currentGesture === null) {
					return;
				}
				currentGesture.offsetX -= deltaX;
				currentGesture.offsetY -= deltaY;
				applyPointerPosition(currentGesture, currentGesture.lastClientX, currentGesture.lastClientY, true, false, snapModifier.isPressed());
			});
			bindGestureHandlers(gesture);
		}
		ui_vue3.onMounted(() => {
			main_core.Event.bind(ui_vue3.toValue(blockRef), 'mousedown', onMouseDown);
		});
		ui_vue3.onBeforeUnmount(() => {
			main_core.Event.unbind(ui_vue3.toValue(blockRef), 'mousedown', onMouseDown);
			++reconciliationToken;
			if (activeGesture !== null) {
				cancelGesture(activeGesture.token);
			}
			snapModifier.stopTracking();
		});
		return {
			isDragged,
			blockPositionStyle
		};
	}

	function useModelValue(emit) {
		const {
			historyCurrentState,
			hooks
		} = useBlockDiagram();
		const handlersMap = {
			[HOOK_NAMES.CHANGED_BLOCKS]: handleChangeBlocks,
			[HOOK_NAMES.CHANGED_CONNECTIONS]: handleChangeConnections
		};
		Object.entries(handlersMap).forEach(([hookName, handler]) => {
			hooks[hookName].on(handler);
		});
		function handleChangeBlocks(command) {
			runCommand(ui_vue3.toValue(historyCurrentState.value.blocks), command, value => {
				historyCurrentState.value.blocks = value;
				emit('update:blocks', value);
			});
		}
		function handleChangeConnections(command) {
			runCommand(ui_vue3.toValue(historyCurrentState.value.connections), command, value => {
				historyCurrentState.value.connections = value;
				emit('update:connections', value);
			});
		}
		function dispose() {
			Object.entries(handlersMap).forEach(([hookName, handler]) => {
				hooks[hookName].off(handler);
			});
		}
		return {
			dispose
		};
	}

	function useRegisterHooks(...hooksMaps) {
		const {
			hooks
		} = useBlockDiagram();
		const mergedHookMaps = [...hooksMaps].reduce((accHookMaps, hookMap) => {
			const result = {
				...accHookMaps
			};
			Object.entries(hookMap).forEach(([hookName, handler]) => {
				if (hookName in accHookMaps) {
					result[hookName].push(...(main_core.Type.isFunction(handler) ? [handler] : handler));
				} else {
					result[hookName] = [...(main_core.Type.isFunction(handler) ? [handler] : handler)];
				}
			});
			return result;
		}, {});
		Object.entries(mergedHookMaps).forEach(([hookName, handlers]) => {
			handlers.forEach(handler => {
				hooks?.[hookName]?.on(handler);
			});
		});
		function dispose() {
			Object.entries(mergedHookMaps).forEach(([hookName, handlers]) => {
				handlers.forEach(handler => {
					hooks?.[hookName]?.off(handler);
				});
			});
		}
		return {
			dispose
		};
	}

	const DEFAULT_OPTIONS = {
		searchCallback: () => false,
		delay: 300
	};
	function useSearchBlocks(optionParams) {
		const {
			blocks
		} = useBlockDiagram();
		const options = {
			...DEFAULT_OPTIONS,
			...optionParams
		};
		const seachText = ui_vue3.ref('');
		const foundBlocks = ui_vue3.ref([]);
		function onSearchBlocks(searchText) {
			seachText.value = searchText;
			foundBlocks.value = [];
			if (ui_vue3.toValue(seachText).trim() === '') {
				return;
			}
			blocks.value.forEach(block => {
				if (options.searchCallback(block, ui_vue3.toValue(seachText))) {
					foundBlocks.value.push(block);
				}
			});
		}
		function onClearSearch() {
			seachText.value = '';
			foundBlocks.value = [];
		}
		return {
			seachText,
			foundBlocks,
			onSearchBlocks: main_core.debounce(onSearchBlocks, options.delay),
			onClearSearch
		};
	}

	function useCanvas() {
		const {
			zoom,
			blocks,
			canvasWidth,
			canvasHeight,
			blockDiagramTop,
			blockDiagramLeft,
			canvasInstance
		} = useBlockDiagram();
		function zoomIn(zoomStep) {
			ui_vue3.toValue(canvasInstance)?.zoomIn(zoomStep);
		}
		function zoomOut(zoomStep) {
			ui_vue3.toValue(canvasInstance)?.zoomOut(zoomStep);
		}
		function setZoom(zoomValue) {
			ui_vue3.toValue(canvasInstance)?.setZoom(zoomValue);
		}
		function setCamera(params) {
			ui_vue3.toValue(canvasInstance)?.setCamera(params);
		}
		function goToBlock(block) {
			if (!block?.position || !block?.dimensions) {
				return;
			}
			const {
				x,
				y
			} = block.position;
			const {
				width,
				height
			} = block.dimensions;
			const centerX = x + width / 2;
			const centerY = y + height / 2;
			setCamera({
				x: centerX - ui_vue3.toValue(canvasWidth) / 2 / ui_vue3.toValue(zoom) - ui_vue3.toValue(blockDiagramLeft) / ui_vue3.toValue(zoom),
				y: centerY - ui_vue3.toValue(canvasHeight) / 2 / ui_vue3.toValue(zoom) - ui_vue3.toValue(blockDiagramTop) / ui_vue3.toValue(zoom)
			});
		}
		function goToBlockById(id) {
			goToBlock(ui_vue3.toValue(blocks).find(block => block.id === id));
		}
		return {
			zoomIn,
			zoomOut,
			setZoom,
			setCamera,
			goToBlock,
			goToBlockById
		};
	}

	function useHighlightedBlocks() {
		const {
			highlitedBlockIds
		} = useBlockDiagram();
		function set(blockIds) {
			ui_vue3.toValue(highlitedBlockIds).push(...blockIds);
		}
		function add(blockId) {
			ui_vue3.toValue(highlitedBlockIds).push(blockId);
		}
		function remove(blockId) {
			const highlitedIndx = highlitedBlockIds.value.indexOf(blockId);
			if (highlitedIndx > -1) {
				highlitedBlockIds.value.splice(highlitedIndx, 1);
			}
		}
		function clear() {
			highlitedBlockIds.value = [];
		}
		return {
			highlitedBlockIds,
			set,
			add,
			remove,
			clear
		};
	}

	function useLoc() {
		const app = ui_vue3.getCurrentInstance()?.appContext.app;
		const bitrix = app?.config?.globalProperties?.$bitrix ?? null;
		return {
			getMessage: (messageId, replacements) => {
				return bitrix?.Loc?.getMessage(messageId, replacements);
			}
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function usePortState(options) {
		const {
			portRef,
			block,
			port,
			position = PORT_POSITION.LEFT,
			validationRules = [],
			index = 0,
			isVirtual = false,
			onVirtualDrop = null
		} = options;
		const {
			isMakeNewConnection,
			waitAllBlocksMounted,
			portsElMap,
			portsRectMap,
			portsValidationsFnMap,
			virtualPortsMap,
			movingBlockId,
			isDisabledBlockDiagram,
			updatePortSegmentSizes,
			touchPortsGeometry,
			portMounted,
			validPortsMap,
			isRenderOptimizationAvailable,
			blockIdsInModel,
			getBlockById
		} = useBlockDiagram();
		const {
			isBlockVisuallyHighlighted
		} = useTransientHighlightedBlocks();
		const isMaybePortForNewConnection = ui_vue3.computed(() => {
			const hasBlock = ui_vue3.toValue(validPortsMap).has(ui_vue3.toValue(block).id);
			const hasPort = ui_vue3.toValue(validPortsMap)?.get(ui_vue3.toValue(block).id)?.has(ui_vue3.toValue(port).id) ?? false;
			return ui_vue3.toValue(isMakeNewConnection) && hasBlock && hasPort;
		});
		const isDisabled = ui_vue3.computed(() => {
			return ui_vue3.toValue(isDisabledBlockDiagram);
		});

		// The ports follow the visual highlight of their block through both channels of it, the user
		// selection and the temporary highlight of a block being played back — the same check the block
		// itself uses (block-state.js). The name is kept: it belongs to the public usePortState API.
		const isIncludedPortInSelectedBlock = ui_vue3.computed(() => {
			return isBlockVisuallyHighlighted(ui_vue3.toValue(block).id);
		});
		const isIncludedPortInMovingBlock = ui_vue3.computed(() => {
			return ui_vue3.toValue(movingBlockId) !== null && ui_vue3.toValue(movingBlockId) === ui_vue3.toValue(block).id;
		});
		function addPortElement(blockId, portId, portEl) {
			if (!ui_vue3.toValue(portsElMap).has(blockId)) {
				ui_vue3.toValue(portsElMap).set(blockId, new Map());
			}
			ui_vue3.toValue(portsElMap).get(blockId).set(portId, ui_vue3.toValue(portEl));
		}
		function deletePortElement(blockId, portId) {
			if (!ui_vue3.toValue(portsElMap).has(blockId)) {
				return;
			}
			ui_vue3.toValue(portsElMap).get(blockId).delete(portId);
		}
		function addPortRect(blockId, portId, portEl) {
			if (!(blockId in ui_vue3.toValue(portsRectMap))) {
				ui_vue3.toValue(portsRectMap)[blockId] = {};
			}
			const {
				x = 0,
				y = 0,
				width = 0,
				height = 0
			} = getCanvasRect(ui_vue3.toValue(portEl)) ?? {};
			ui_vue3.toValue(portsRectMap)[blockId][portId] = {
				x,
				y,
				width,
				height,
				position,
				// The port's fan-out order within its side, captured here so onMountedBlock can
				// recompute the segments with the same order the drawing/promise path uses — under
				// culling that promise path never runs (see block-state.js onMountedBlock).
				order: index,
				firstSegmentSize: 0,
				secondSegmentSize: 0,
				secondSegmentSizeWithoutOffset: 0
			};
			touchPortsGeometry();
		}
		function deletePortRect(blockId, portId) {
			const portsMap = ui_vue3.toValue(portsRectMap)[blockId];
			if (!portsMap || !(portId in portsMap)) {
				return;
			}
			if (Object.keys(portsMap).length === 1) {
				delete ui_vue3.toValue(portsRectMap)[blockId];
			} else {
				delete portsMap[portId];
			}
			touchPortsGeometry();
		}
		function addValidationFn() {
			if (!ui_vue3.toValue(portsValidationsFnMap).has(ui_vue3.toValue(block).id)) {
				ui_vue3.toValue(portsValidationsFnMap).set(ui_vue3.toValue(block).id, new Map());
			}
			ui_vue3.toValue(portsValidationsFnMap).get(ui_vue3.toValue(block).id).set(ui_vue3.toValue(port.id), ui_vue3.toValue(validationRules));
		}
		function deleteValidationFn() {
			const portsCount = ui_vue3.toValue(portsValidationsFnMap)?.get(ui_vue3.toValue(block).id)?.size ?? 0;
			if (portsCount === 1) {
				ui_vue3.toValue(portsValidationsFnMap).delete(ui_vue3.toValue(block).id);
			}
			ui_vue3.toValue(portsValidationsFnMap)?.get(ui_vue3.toValue(block).id)?.delete(ui_vue3.toValue(port).id);
		}
		function addVirtualPort() {
			if (!isVirtual) {
				return;
			}
			if (!ui_vue3.toValue(virtualPortsMap).has(ui_vue3.toValue(block).id)) {
				ui_vue3.toValue(virtualPortsMap).set(ui_vue3.toValue(block).id, new Map());
			}
			ui_vue3.toValue(virtualPortsMap).get(ui_vue3.toValue(block).id).set(ui_vue3.toValue(port).id, {
				port: {
					...ui_vue3.toValue(port)
				},
				onDrop: onVirtualDrop
			});
		}
		function deleteVirtualPort() {
			if (!isVirtual) {
				return;
			}
			const ports = ui_vue3.toValue(virtualPortsMap).get(ui_vue3.toValue(block).id);
			if (!ports) {
				return;
			}
			ports.delete(ui_vue3.toValue(port).id);
			if (ports.size === 0) {
				ui_vue3.toValue(virtualPortsMap).delete(ui_vue3.toValue(block).id);
			}
		}
		function onMountedPort() {
			addPortElement(ui_vue3.toValue(block).id, ui_vue3.toValue(port).id, portRef);
			addPortRect(ui_vue3.toValue(block).id, ui_vue3.toValue(port).id, portRef);
			addValidationFn();
			addVirtualPort();
			waitAllBlocksMounted.value?.promise.then(() => {
				if (!(ui_vue3.toValue(block).id in ui_vue3.toValue(portsRectMap))) {
					return;
				}
				updatePortSegmentSizes(ui_vue3.toValue(block).id, ui_vue3.toValue(port).id, index);
				portMounted(ui_vue3.toValue(block).id, ui_vue3.toValue(port).id);
			});
		}
		function onUnmountedPort() {
			const blockId = ui_vue3.toValue(block).id;
			const portId = ui_vue3.toValue(port).id;
			deletePortElement(blockId, portId);
			deleteValidationFn();
			deleteVirtualPort();

			// Under render optimization culling unmounts the offscreen node while it
			// stays in the model: retain measured port coordinates so the connection
			// path can still be resolved. A real removal — the block gone, or this port
			// dropped from a surviving block's ports — clears them (see purgeBlockGeometry).
			// Read the port composition from the CURRENT model (getBlockById), not the prop
			// captured in setup: an immutable setPorts swaps the block, and the stale prop
			// would still list the removed port and wrongly retain its geometry.
			const blockPortIdsInModel = collectModelPortIds(getBlockById, blockId);
			const retain = shouldRetainPortGeometry(ui_vue3.toValue(isRenderOptimizationAvailable), ui_vue3.toValue(blockIdsInModel), blockId, blockPortIdsInModel, portId);
			if (!retain) {
				deletePortRect(blockId, portId);
			}
		}
		return {
			isDisabled,
			isMaybePortForNewConnection,
			isIncludedPortInSelectedBlock,
			isIncludedPortInMovingBlock,
			onMountedPort,
			onUnmountedPort
		};
	}

	const DEFAULT_PATH_INFO$1 = {
		path: '',
		center: {
			x: 0,
			y: 0
		}
	};

	// eslint-disable-next-line max-lines-per-function
	function useConnectionState(connection) {
		const {
			portsRectMap,
			isDisabledBlockDiagram,
			connectionsOffsetMap,
			connectionOffset,
			connectionBendOffset,
			connectionBorderRadius
		} = useBlockDiagram();
		const resolveRouteOptions = () => ({
			connection: ui_vue3.toValue(connection),
			portsRectMap: ui_vue3.toValue(portsRectMap),
			connectionsOffsetMap: ui_vue3.toValue(connectionsOffsetMap),
			bendOffset: ui_vue3.toValue(connectionBendOffset),
			offset: ui_vue3.toValue(connectionOffset),
			borderRadius: ui_vue3.toValue(connectionBorderRadius)
		});
		const connectionPortsPosition = ui_vue3.computed(() => {
			return resolveConnectionPortsPosition(resolveRouteOptions());
		});
		const connectionPathInfo = ui_vue3.computed(() => {
			return resolveRenderedConnectionRoute(resolveRouteOptions()) ?? DEFAULT_PATH_INFO$1;
		});
		const isDisabled = ui_vue3.computed(() => {
			return ui_vue3.toValue(isDisabledBlockDiagram);
		});
		return {
			connectionPortsPosition,
			connectionPathInfo,
			isDisabled
		};
	}

	function useInitAppElements(options) {
		const {
			blockDiagramRef: newBlockDiagramRef
		} = options;
		const {
			blockDiagramRef,
			blockDiagramTop,
			blockDiagramLeft,
			blockDiagramWidth,
			blockDiagramHeight
		} = useBlockDiagram();
		let observer = null;
		function handleInterObserver(entries) {
			entries.forEach(entry => {
				const {
					top,
					left,
					width,
					height
				} = entry.boundingClientRect;
				blockDiagramTop.value = top;
				blockDiagramLeft.value = left;
				blockDiagramWidth.value = width;
				blockDiagramHeight.value = height;
			});
		}
		function onMountedAppElements() {
			blockDiagramRef.value = ui_vue3.toValue(newBlockDiagramRef);
			const {
				left,
				top,
				width,
				height
			} = ui_vue3.toValue(newBlockDiagramRef).getBoundingClientRect();
			blockDiagramTop.value = top;
			blockDiagramLeft.value = left;
			blockDiagramWidth.value = width;
			blockDiagramHeight.value = height;
			observer = new IntersectionObserver(handleInterObserver);
			observer.observe(ui_vue3.toValue(blockDiagramRef));
		}
		function onUnmountedAppElements() {
			observer.unobserve(ui_vue3.toValue(blockDiagramRef));
		}
		return {
			onMountedAppElements,
			onUnmountedAppElements
		};
	}

	const DEFAULT_PATH_INFO = {
		path: '',
		center: {
			x: 0,
			y: 0
		}
	};
	function useNewConnectionState() {
		const {
			newConnection,
			portsRectMap
		} = useBlockDiagram();
		const hasNewConnection = ui_vue3.computed(() => {
			return ui_vue3.toValue(newConnection) !== null;
		});
		const hasSourcePort = ui_vue3.computed(() => {
			return ui_vue3.toValue(hasNewConnection) && ui_vue3.toValue(newConnection).sourceBlockId !== null && ui_vue3.toValue(newConnection).sourcePortId !== null;
		});
		const hasTargetPort = ui_vue3.computed(() => {
			return ui_vue3.toValue(hasNewConnection) && ui_vue3.toValue(newConnection).targetBlockId !== null && ui_vue3.toValue(newConnection).targetPortId !== null;
		});
		const sourcePortLayoutRect = ui_vue3.computed(() => {
			const {
				x = 0,
				y = 0,
				width = 0,
				height = 0
			} = ui_vue3.toValue(portsRectMap)?.[ui_vue3.toValue(newConnection)?.sourceBlockId]?.[ui_vue3.toValue(newConnection)?.sourcePortId] ?? {};
			return {
				x,
				y,
				width,
				height
			};
		});
		const targetPortLayoutRect = ui_vue3.computed(() => {
			const {
				x = 0,
				y = 0,
				width = 0,
				height = 0
			} = ui_vue3.toValue(portsRectMap)?.[ui_vue3.toValue(newConnection)?.targetBlockId]?.[ui_vue3.toValue(newConnection)?.targetPortId] ?? {};
			return {
				x,
				y,
				width,
				height
			};
		});
		const newConnectionPathInfo = ui_vue3.computed(() => {
			if (!ui_vue3.toValue(hasNewConnection)) {
				return DEFAULT_PATH_INFO;
			}
			return getLinePath(ui_vue3.toValue(newConnection).start, ui_vue3.toValue(newConnection).center);
		});
		const newTmpConnectionPathInfo = ui_vue3.computed(() => {
			if (ui_vue3.toValue(newConnection) === null || ui_vue3.toValue(newConnection).end === null) {
				return DEFAULT_PATH_INFO;
			}
			return getLinePath(ui_vue3.toValue(newConnection).center, ui_vue3.toValue(newConnection).end);
		});
		return {
			hasNewConnection,
			hasSourcePort,
			hasTargetPort,
			sourcePortLayoutRect,
			targetPortLayoutRect,
			newConnectionPathInfo,
			newTmpConnectionPathInfo,
			newConnection
		};
	}

	function useAnimationQueue() {
		const {
			zoom,
			isPauseAnimation,
			isStopAnimation,
			animationQueue,
			currentAnimationItem,
			isRenderOptimizationAvailable,
			blockIntersections,
			animationStep,
			addConnection,
			deleteConnectionById,
			addBlock,
			deleteBlockById
		} = useBlockDiagram();
		const {
			goToBlock
		} = useCanvas();
		const history = useHistory();

		// Единая точка продвижения очереди. Вызывается ровно один раз на каждый
		// yield-шаг — либо совпавшим экранным переходом (переходом отрисованного
		// элемента), либо резервным таймером (см. AnimationStepController). Гарантия
		// «ровно один advance на шаг» лежит на контроллере; здесь — само действие
		// продвижения генератора.
		function advance() {
			const queue = animationQueue.value;
			if (!queue) {
				return;
			}
			const {
				done = false
			} = queue.next() ?? {};
			if (done) {
				animationQueue.value = null;
				// Снимок истории делаем ОДИН раз при завершении очереди, а не на
				// каждом шаге — иначе O(N^2) клонов и засорение undo.
				history.makeSnapshot();
			}
		}
		animationStep.setAdvanceHandler(advance);

		// Отрисован ли блок сейчас. При выключенной оптимизации рендерятся все блоки;
		// при включённой — только попавшие в видимый набор (видимая область).
		function isBlockRendered(blockId) {
			return !ui_vue3.toValue(isRenderOptimizationAvailable) || ui_vue3.toValue(blockIntersections.visibleBlockIds).has(blockId);
		}

		// Возвращает true, если элемент даст переход (enter/leave), которым очередь
		// продвинется дальше через onAfter* в *-queue-transition. Если перехода не
		// будет (удаление неотрисованного блока), очередь не должна его ждать.
		function animateItem(animatedItem) {
			switch (animatedItem.type) {
				case ANIMATED_TYPES.BLOCK:
					{
						// Доводим камеру до блока ДО его отрисовки. При включённой
						// оптимизации рендерятся только блоки в видимой области: блок вне видимой
						// области не смонтируется, его enter-переход не сработает и очередь
						// встанет. Центрирование камеры синхронно обновляет transform, из-за
						// чего selectVisibleBlocks включит блок в видимый набор и он
						// отрисуется — очередь продолжится, а пользователь «доезжает» до
						// каждого блока независимо от размера графа. (onEnter в
						// blocks-queue-transition уточняет центрирование уже после монтажа.)
						goToBlock(animatedItem.item);
						addBlock(animatedItem.item);
						return true;
					}
				case ANIMATED_TYPES.CONNECTION:
					{
						addConnection(animatedItem.item);
						return true;
					}
				case ANIMATED_TYPES.REMOVE_BLOCK:
					{
						// Leave-переход возможен только для отрисованного блока. Блок вне экрана
						// (при оптимизации не в DOM) удаляется без перехода — ждать его
						// нельзя, иначе очередь встанет. Видимый удаляется с затуханием как обычно.
						const willAnimate = isBlockRendered(animatedItem.item.id);
						deleteBlockById(animatedItem.item.id);
						return willAnimate;
					}
				case ANIMATED_TYPES.REMOVE_CONNECTION:
					{
						deleteConnectionById(animatedItem.item.id);
						return true;
					}
				default:
					return false;
			}
		}
		function* animationQueueFn(animatedQueueItems) {
			for (const animatedItem of animatedQueueItems) {
				if (ui_vue3.toValue(isPauseAnimation)) {
					yield;
				}
				if (ui_vue3.toValue(isStopAnimation)) {
					break;
				}
				currentAnimationItem.value = animatedItem;
				if (animatedItem.type && animatedItem.item) {
					const willAnimate = animateItem(animatedItem);

					// Ждём завершения перехода только если он будет. Иначе (удаление
					// неотрисованного блока) сразу переходим к следующему элементу — так
					// удаления блоков вне экрана проходят мгновенно и очередь не зависает.
					if (willAnimate) {
						// Открываем шаг: вооружаем резервный таймер и получаем токен.
						// Продвинет шаг первый из {совпавший переход, таймер}, второй —
						// идемпотентно игнорируется контроллером.
						animationStep.openStep();
						yield animatedItem;
					}
				}
			}
			stop();
		}
		function start(options) {
			const {
				items: shouldAnimatedItems = []
			} = options ?? {};
			zoom.value = 1;
			isStopAnimation.value = false;
			animationStep.stop();
			animationQueue.value = animationQueueFn(shouldAnimatedItems);
			if (shouldAnimatedItems.length > 0) {
				setTimeout(() => play(), 100);
			} else {
				stop();
			}
		}
		function pause() {
			isPauseAnimation.value = true;
		}
		function play() {
			isPauseAnimation.value = false;
			animationQueue.value?.next();
		}
		function stop() {
			isStopAnimation.value = true;
			isPauseAnimation.value = false;
			currentAnimationItem.value = null;
			animationQueue.value = null;
			// Снимаем вооружённый резервный таймер и сбрасываем состояние шага.
			animationStep.stop();
		}
		return {
			start,
			pause,
			play,
			stop
		};
	}

	const CANVAS_STYLE_DEFAULT_OPTIONS = {
		grid: {
			options: {
				size: GRID_DEFAULT_SIZE,
				gridColor: '#A1B8D9',
				backgroundColor: '#ECF0F2',
				zoomSteps: GRID_DEFAULT_ZOOM_STEPS
			},
			instance: Grid
		}
	};

	// eslint-disable-next-line max-lines-per-function
	function useCanvasTransfrom(options) {
		const {
			canvasRef: newCanvasRef,
			transformLayoutRef: newTransformLayoutRef,
			canvasStyle: newCanvasStyle,
			zoomSensitivity,
			zoomSensitivityMouse
		} = options;
		const {
			isDisabledBlockDiagram,
			transformX,
			transformY,
			zoom,
			minZoom,
			maxZoom,
			canvasRef,
			transformLayoutRef,
			canvasWidth,
			canvasHeight,
			canvasInstance,
			blockIntersections
		} = useBlockDiagram();
		const dragOn = ui_vue3.ref(false);
		const isDragging = ui_vue3.ref(false);
		const zooming = ui_vue3.ref(false);
		let requestAnimationId = null;
		function getCanvasStyleOptions(canvasStyle) {
			if (canvasStyle && canvasStyle.style in CANVAS_STYLE_DEFAULT_OPTIONS) {
				return {
					instance: CANVAS_STYLE_DEFAULT_OPTIONS[canvasStyle.style].instance,
					options: {
						...CANVAS_STYLE_DEFAULT_OPTIONS[canvasStyle.style].options,
						...canvasStyle
					}
				};
			}
			return null;
		}
		function onMounted() {
			canvasRef.value = newCanvasRef;
			transformLayoutRef.value = newTransformLayoutRef;
			canvasInstance.value = ui_vue3.markRaw(new Canvas({
				canvas: ui_vue3.toValue(newCanvasRef),
				canvasStyle: getCanvasStyleOptions(newCanvasStyle),
				minZoom: ui_vue3.toValue(minZoom),
				maxZoom: ui_vue3.toValue(maxZoom)
			}));
			ui_vue3.toValue(canvasInstance).camera.setChangeTransformCallback(payload => {
				transformX.value = payload.x;
				transformY.value = payload.y;
				zoom.value = payload.zoom;
				canvasWidth.value = payload.width;
				canvasHeight.value = payload.height;
				blockIntersections.selectVisibleBlocks();
				blockIntersections.selectVisibleConnections();
			});
			render();
		}
		function onUnmounted() {
			ui_vue3.toValue(canvasInstance)?.destroy();
			cancelAnimationFrame(requestAnimationId);
		}
		function onMouseDown(event) {
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				return;
			}
			dragOn.value = true;
			ui_vue3.toValue(canvasInstance)?.setCameraPositionByMouseDown(event);
		}
		function onMouseMove(event) {
			if (!ui_vue3.toValue(dragOn) || ui_vue3.toValue(isDisabledBlockDiagram)) {
				return;
			}
			if (event.buttons !== 1 && event.buttons !== 4) {
				dragOn.value = false;
				isDragging.value = false;
				return;
			}
			isDragging.value = true;
			ui_vue3.toValue(canvasInstance)?.setCameraPositionByMouseMove(event);
		}
		function onMouseUp() {
			dragOn.value = false;
			isDragging.value = false;
		}
		function onWheel(event) {
			event.preventDefault();
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				return;
			}
			const isTrackpad = event.wheelDeltaY ? event.wheelDeltaY === -3 * event.deltaY : event.deltaMode === 0;
			const isCmd = main_core.Browser.isMac() && event.metaKey;
			if (event.ctrlKey || isCmd) {
				const zoomChange = isTrackpad ? -event.deltaY * ui_vue3.toValue(zoomSensitivity) : -Math.sign(event.deltaY) * ui_vue3.toValue(zoomSensitivityMouse);
				zooming.value = true;
				ui_vue3.toValue(canvasInstance)?.setCameraZoomByWheel(event, zoomChange);
				setTimeout(() => {
					zooming.value = false;
				}, 200);
			} else {
				ui_vue3.toValue(canvasInstance)?.setCameraPositionByWheel(event);
			}
		}
		function render() {
			if (canvasInstance) {
				ui_vue3.toValue(canvasInstance)?.render();
				const viewMatrix = ui_vue3.toValue(canvasInstance).viewMatrix;
				main_core.Dom.style(ui_vue3.toValue(transformLayoutRef), 'transform', `
					matrix(
						${viewMatrix[0]}, 0, 0, ${viewMatrix[4]}, ${viewMatrix[6]}, ${viewMatrix[7]}
					)
				`);
			}
			requestAnimationId = requestAnimationFrame(render);
		}
		return {
			isDragging,
			onMounted,
			onUnmounted,
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onWheel
		};
	}

	function useDragAndDrop() {
		const {
			zoom,
			blockDiagramRef,
			transformX,
			transformY,
			addBlock,
			snapPoint,
			hooks
		} = useBlockDiagram();
		function onDrop(event) {
			event.preventDefault();
			const dataString = event.dataTransfer.getData('text/plain');
			const receivedData = JSON.parse(dataString);
			const {
				width,
				height
			} = receivedData.dimensions;
			const el = ui_vue3.toValue(blockDiagramRef);
			const {
				left,
				top
			} = el?.getBoundingClientRect() ?? {
				left: 0,
				top: 0
			};
			receivedData.position.x = (event.clientX - width * ui_vue3.toValue(zoom) / 2) / ui_vue3.toValue(zoom);
			receivedData.position.y = (event.clientY - height * ui_vue3.toValue(zoom) / 2) / ui_vue3.toValue(zoom);
			receivedData.position.x += ui_vue3.toValue(transformX);
			receivedData.position.y += ui_vue3.toValue(transformY);
			receivedData.position.x -= left / ui_vue3.toValue(zoom);
			receivedData.position.y -= top / ui_vue3.toValue(zoom);

			// Rounded before snapping: the divisions above leave fractions, and the model keeps
			// whole-pixel coordinates even when the drop is not snapped.
			receivedData.position = snapPoint({
				x: Math.round(receivedData.position.x),
				y: Math.round(receivedData.position.y)
			}, isSnapModifier(event));
			addBlock(receivedData);
			hooks.dropNewBlock.trigger(receivedData);
		}
		function setBlockData(event, addedBlock) {
			event.dataTransfer.setData('text/plain', JSON.stringify(addedBlock));
		}
		return {
			setBlockData,
			onDrop
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useResizableBlock(options) {
		const {
			cursorType,
			resizingBlock,
			transformMouseEventToPoint,
			snapValue,
			updateBlock,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition
		} = useBlockDiagram();
		const snapModifier = useSnapModifier();
		const {
			block,
			minWidth,
			minHeight,
			leftSideRef,
			topSideRef,
			rightSideRef,
			bottomSideRef,
			leftTopCornerRef,
			rightTopCornerRef,
			rightBottomCornerRef,
			leftBottomCornerRef
		} = options;
		const isResize = ui_vue3.ref(false);
		let prevBlockX = 0;
		let prevBlockY = 0;
		let prevBlockWidth = 0;
		let prevBlockHeight = 0;
		let activeResizeHandlers = [];
		let lastResizeEvent = null;
		const sizeBlockStyle = ui_vue3.computed(() => {
			if (ui_vue3.toValue(isResize)) {
				const {
					position,
					dimensions
				} = ui_vue3.toValue(resizingBlock);

				// Staged position has to win over blockPositionStyle: the model block keeps its
				// own position until mouseup, so left/top resize would not move the block.
				return {
					top: `${position.y}px`,
					left: `${position.x}px`,
					width: `${dimensions.width}px`,
					height: `${dimensions.height}px`,
					cursor: ui_vue3.toValue(cursorType)
				};
			}
			return {
				width: `${ui_vue3.toValue(block).dimensions.width}px`,
				height: `${ui_vue3.toValue(block).dimensions.height}px`,
				cursor: ui_vue3.toValue(cursorType)
			};
		});

		// While resizing the model block keeps its old size, so slot content has to read the
		// staged geometry to stay in step with the frame it lives in.
		const blockDimensions = ui_vue3.computed(() => {
			const staged = ui_vue3.toValue(resizingBlock);
			return ui_vue3.toValue(isResize) && staged !== null ? staged.dimensions : ui_vue3.toValue(block).dimensions;
		});
		function isGeometryStaged() {
			const staged = ui_vue3.toValue(resizingBlock);
			if (staged === null) {
				return false;
			}
			const {
				position,
				dimensions
			} = ui_vue3.toValue(block);
			return staged.position.x !== position.x || staged.position.y !== position.y || staged.dimensions.width !== dimensions.width || staged.dimensions.height !== dimensions.height;
		}
		function updateResizableBlock() {
			updateBlock({
				...ui_vue3.toValue(block),
				position: {
					x: ui_vue3.toValue(resizingBlock).position.x,
					y: ui_vue3.toValue(resizingBlock).position.y
				},
				dimensions: {
					width: ui_vue3.toValue(resizingBlock).dimensions.width,
					height: ui_vue3.toValue(resizingBlock).dimensions.height
				}
			});
		}
		function onMounted() {
			main_core.Event.bind(ui_vue3.toValue(rightSideRef), 'mousedown', onMouseDownRightSide);
			main_core.Event.bind(ui_vue3.toValue(bottomSideRef), 'mousedown', onMouseDownBottomSide);
			main_core.Event.bind(ui_vue3.toValue(leftSideRef), 'mousedown', onMouseDownLeftSide);
			main_core.Event.bind(ui_vue3.toValue(topSideRef), 'mousedown', onMouseDownTopSide);
			main_core.Event.bind(ui_vue3.toValue(rightTopCornerRef), 'mousedown', onMouseDownRightTopCorner);
			main_core.Event.bind(ui_vue3.toValue(rightBottomCornerRef), 'mousedown', onMouseDownRightBottomCorner);
			main_core.Event.bind(ui_vue3.toValue(leftTopCornerRef), 'mousedown', onMouseDownLeftTopCorner);
			main_core.Event.bind(ui_vue3.toValue(leftBottomCornerRef), 'mousedown', onMouseDownLeftBottomCorner);
		}
		function onUnmounted() {
			main_core.Event.unbind(ui_vue3.toValue(rightSideRef), 'mousedown', onMouseDownRightSide);
			main_core.Event.unbind(ui_vue3.toValue(bottomSideRef), 'mousedown', onMouseDownBottomSide);
			main_core.Event.unbind(ui_vue3.toValue(leftSideRef), 'mousedown', onMouseDownLeftSide);
			main_core.Event.unbind(ui_vue3.toValue(topSideRef), 'mousedown', onMouseDownTopSide);
			main_core.Event.unbind(ui_vue3.toValue(rightTopCornerRef), 'mousedown', onMouseDownRightTopCorner);
			main_core.Event.unbind(ui_vue3.toValue(rightBottomCornerRef), 'mousedown', onMouseDownRightBottomCorner);
			main_core.Event.unbind(ui_vue3.toValue(leftTopCornerRef), 'mousedown', onMouseDownLeftTopCorner);
			main_core.Event.unbind(ui_vue3.toValue(leftBottomCornerRef), 'mousedown', onMouseDownLeftBottomCorner);

			// Autoscroll and the staged geometry belong to the whole diagram, so only the instance
			// that owns the gesture may wind it down: under render optimization neighbour blocks
			// are culled and unmounted exactly while the camera pans for this gesture.
			if (!ui_vue3.toValue(isResize)) {
				return;
			}

			// The block is gone, so the staged geometry is dropped without reaching the model.
			teardownGesture();
		}
		function teardownGesture() {
			stopAutoScroll();
			snapModifier.stopTracking();
			main_core.Event.unbind(document, 'mousemove', onMouseMove);
			main_core.Event.unbind(document, 'mouseup', endResize);
			cursorType.value = 'default';
			isResize.value = false;
			resizingBlock.value = null;
			activeResizeHandlers = [];
			lastResizeEvent = null;
		}
		function startResize(event, curType, resizeHandlers) {
			event.stopPropagation();
			cursorType.value = curType;
			// Geometry is staged in its own objects. Sharing position/dimensions with the model
			// block turns every resize step into a deep mutation of props.blocks, which makes
			// useWatchProps rebuild the intersections index; under render optimization that
			// unmounts the block mid-gesture and onUnmounted then tears the gesture down.
			resizingBlock.value = {
				...ui_vue3.toValue(block),
				position: {
					...ui_vue3.toValue(block).position
				},
				dimensions: {
					...ui_vue3.toValue(block).dimensions
				}
			};
			prevBlockX = ui_vue3.toValue(block).position.x;
			prevBlockY = ui_vue3.toValue(block).position.y;
			prevBlockWidth = ui_vue3.toValue(block).dimensions.width;
			prevBlockHeight = ui_vue3.toValue(block).dimensions.height;
			isResize.value = true;
			activeResizeHandlers = resizeHandlers;
			snapModifier.sync(event);
			snapModifier.startTracking();
			startAutoScroll(event, applyResize);
			main_core.Event.bind(document, 'mousemove', onMouseMove);
			main_core.Event.bind(document, 'mouseup', endResize);
		}
		function endResize(event) {
			event.stopPropagation();

			// A click on a handle without a move stages nothing: emitting the command anyway would
			// mark the document dirty and wake autosave for an unchanged block.
			if (isGeometryStaged()) {
				// The staged geometry is dropped as soon as the command is out, so the consumer has
				// to apply update:blocks synchronously: until the model catches up the block is drawn
				// with its pre-gesture position and size.
				updateResizableBlock();
			}
			teardownGesture();
		}
		function applyResize() {
			if (!ui_vue3.toValue(isResize) || !lastResizeEvent) {
				return;
			}
			for (const resize of activeResizeHandlers) {
				resize(lastResizeEvent);
			}
		}
		function onMouseMove(event) {
			event.stopPropagation();
			if (!ui_vue3.toValue(isResize)) {
				return;
			}
			lastResizeEvent = event;
			snapModifier.sync(event);

			// Autoscroll moves the camera, so the same cursor point maps to a new world point. The
			// gesture reports the pointer on every move and the autoscroll itself holds the loop back
			// until this first report - the wait no longer belongs here.
			updateMousePosition(event);
			applyResize();
		}

		// Edge under the cursor in canvas coordinates. It is rounded before snapping, so an
		// unsnapped edge still leaves the model with whole-pixel geometry at any zoom.
		function getEdgeX(event) {
			return snapValue(Math.round(transformMouseEventToPoint(event).x), snapModifier.isPressed());
		}
		function getEdgeY(event) {
			return snapValue(Math.round(transformMouseEventToPoint(event).y), snapModifier.isPressed());
		}
		function resizeTopSide(event) {
			const edgeY = getEdgeY(event);
			const {
				position,
				size
			} = getBoundsByStartEdge(edgeY, prevBlockY + prevBlockHeight, ui_vue3.toValue(minHeight));
			resizingBlock.value.position.y = position;
			resizingBlock.value.dimensions.height = size;
		}
		function resizeRightSide(event) {
			const edgeX = getEdgeX(event);
			resizingBlock.value.dimensions.width = getSizeByEndEdge(edgeX, prevBlockX, ui_vue3.toValue(minWidth));
		}
		function resizeBottomSide(event) {
			const edgeY = getEdgeY(event);
			resizingBlock.value.dimensions.height = getSizeByEndEdge(edgeY, prevBlockY, ui_vue3.toValue(minHeight));
		}
		function resizeLeftSide(event) {
			const edgeX = getEdgeX(event);
			const {
				position,
				size
			} = getBoundsByStartEdge(edgeX, prevBlockX + prevBlockWidth, ui_vue3.toValue(minWidth));
			resizingBlock.value.position.x = position;
			resizingBlock.value.dimensions.width = size;
		}
		function onMouseDownRightSide(event) {
			startResize(event, CURSOR_TYPES.EW_RESIZE, [resizeRightSide]);
		}
		function onMouseDownBottomSide(event) {
			startResize(event, CURSOR_TYPES.NS_RESIZE, [resizeBottomSide]);
		}
		function onMouseDownLeftSide(event) {
			startResize(event, CURSOR_TYPES.EW_RESIZE, [resizeLeftSide]);
		}
		function onMouseDownTopSide(event) {
			startResize(event, CURSOR_TYPES.NS_RESIZE, [resizeTopSide]);
		}
		function onMouseDownRightBottomCorner(event) {
			startResize(event, CURSOR_TYPES.NWSE_RESIZE, [resizeRightSide, resizeBottomSide]);
		}
		function onMouseDownRightTopCorner(event) {
			startResize(event, CURSOR_TYPES.NESW_RESIZE, [resizeTopSide, resizeRightSide]);
		}
		function onMouseDownLeftBottomCorner(event) {
			startResize(event, CURSOR_TYPES.NESW_RESIZE, [resizeLeftSide, resizeBottomSide]);
		}
		function onMouseDownLeftTopCorner(event) {
			startResize(event, CURSOR_TYPES.NWSE_RESIZE, [resizeLeftSide, resizeTopSide]);
		}
		return {
			isResize,
			sizeBlockStyle,
			blockDimensions,
			onMounted,
			onUnmounted
		};
	}

	function useCanvasSelection(params) {
		const {
			zoom,
			setSelectionWorldRect,
			setSelectionActive,
			isSelectionActive,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition
		} = useBlockDiagram();
		const {
			rootRef,
			transformLayoutRef
		} = params;
		const selectionRect = ui_vue3.ref({
			x: 0,
			y: 0,
			width: 0,
			height: 0
		});
		let startClientX = 0;
		let startClientY = 0;
		let cachedRootRect = null;
		let cachedLayerRect = null;
		let scrollOffsetX = 0;
		let scrollOffsetY = 0;
		let lastClientX = 0;
		let lastClientY = 0;
		function updateRects(clientX, clientY) {
			if (!cachedRootRect || !cachedLayerRect) {
				return;
			}
			const currentZoom = ui_vue3.toValue(zoom);
			if (!currentZoom) {
				return;
			}
			const visualStartX = startClientX - cachedRootRect.left - scrollOffsetX;
			const visualStartY = startClientY - cachedRootRect.top - scrollOffsetY;
			const currentVisualX = clientX - cachedRootRect.left;
			const currentVisualY = clientY - cachedRootRect.top;
			selectionRect.value = {
				x: Math.min(visualStartX, currentVisualX),
				y: Math.min(visualStartY, currentVisualY),
				width: Math.abs(currentVisualX - visualStartX),
				height: Math.abs(currentVisualY - visualStartY)
			};
			const startLayerX = startClientX - cachedLayerRect.left;
			const startLayerY = startClientY - cachedLayerRect.top;
			const currentLayerX = clientX - cachedLayerRect.left + scrollOffsetX;
			const currentLayerY = clientY - cachedLayerRect.top + scrollOffsetY;
			setSelectionWorldRect({
				x: Math.min(startLayerX, currentLayerX) / currentZoom,
				y: Math.min(startLayerY, currentLayerY) / currentZoom,
				width: Math.abs(currentLayerX - startLayerX) / currentZoom,
				height: Math.abs(currentLayerY - startLayerY) / currentZoom
			});
		}
		function start(event) {
			const root = ui_vue3.toValue(rootRef);
			const layer = ui_vue3.toValue(transformLayoutRef);
			if (!root || !layer) {
				return;
			}
			startClientX = event.clientX;
			startClientY = event.clientY;
			lastClientX = event.clientX;
			lastClientY = event.clientY;
			scrollOffsetX = 0;
			scrollOffsetY = 0;
			cachedRootRect = root.getBoundingClientRect();
			cachedLayerRect = layer.getBoundingClientRect();
			const visualStartX = startClientX - cachedRootRect.left;
			const visualStartY = startClientY - cachedRootRect.top;
			setSelectionActive(true);
			selectionRect.value = {
				x: visualStartX,
				y: visualStartY,
				width: 0,
				height: 0
			};
			startAutoScroll(event, (dx, dy) => {
				scrollOffsetX += dx;
				scrollOffsetY += dy;
				updateRects(lastClientX, lastClientY);
			});
		}
		function move(event) {
			if (!ui_vue3.toValue(isSelectionActive) || !cachedRootRect || !cachedLayerRect) {
				return;
			}
			lastClientX = event.clientX;
			lastClientY = event.clientY;
			updateMousePosition(event);
			updateRects(event.clientX, event.clientY);
		}
		function end() {
			stopAutoScroll();
			if (ui_vue3.toValue(isSelectionActive)) {
				setSelectionActive(false);
				setSelectionWorldRect(null);
				selectionRect.value = {
					x: 0,
					y: 0,
					width: 0,
					height: 0
				};
			}
			cachedRootRect = null;
			cachedLayerRect = null;
		}
		return {
			isSelecting: isSelectionActive,
			selectionRect,
			start,
			move,
			end
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useGroupDragLogic(closeContextMenu) {
		const {
			blocks: uiBlocksRef,
			zoom,
			updateBlock,
			blockElMap,
			blocksRectMap,
			updateBlockRectById,
			setPortOffsetByBlockId,
			highlitedBlockIds,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition,
			snapPoint,
			setGestureBlocks,
			resetGestureBlocks,
			setGroupDragOffset,
			resetGroupDragOffset,
			isDisabledBlockDiagram
		} = useBlockDiagram();
		const snapModifier = useSnapModifier();
		let currentZoom = 1;
		let movingItems = [];
		let anchor = {
			x: 0,
			y: 0
		};
		// Where the button went down, in the coordinates of the pointer. Unlike the anchor it is never
		// compensated for autoscroll: the drag threshold is about the hand, not about the camera.
		let downClient = {
			x: 0,
			y: 0
		};
		let client = {
			x: 0,
			y: 0
		};
		let lastTotalDelta = {
			x: 0,
			y: 0
		};
		let gestureToken = 0;
		let isGestureActive = false;
		let isDragStarted = false;
		// Whether the last applied frame was snapped: the release must commit exactly the position that
		// frame has drawn, even if the modifier changed between it and the mouseup.
		let isLastFrameSnapped = false;
		const drawMarkup = (blockId, x, y) => {
			const blockElement = ui_vue3.toValue(blockElMap)?.get(blockId);
			if (blockElement) {
				main_core.Dom.style(blockElement, 'left', `${x}px`);
				main_core.Dom.style(blockElement, 'top', `${y}px`);
			}
		};

		// One node moved by hand, the way a dragged node moves its group members: the markup by style,
		// the cached rect and the port coordinates by the step of this frame. The model is left alone
		// until mouseup - a frame-by-frame write goes outside the command path, so the block watcher
		// clears the spatial index on every frame and the connections leave the canvas for the whole
		// gesture.
		const moveItem = (blockId, x, y, stepX, stepY) => {
			drawMarkup(blockId, x, y);

			// Only an existing entry is moved: a merge over a missing one would recreate geometry that
			// a purge removed on purpose, and without a measured size at that.
			if (main_core.Type.isObjectLike(ui_vue3.toValue(blocksRectMap)?.[blockId])) {
				updateBlockRectById(blockId, {
					x,
					y
				});
			}
			if (setPortOffsetByBlockId && (stepX !== 0 || stepY !== 0)) {
				setPortOffsetByBlockId(blockId, {
					x: -stepX,
					y: -stepY
				});
			}
		};

		// The same threshold the node gesture is held to (moveable-block.js): below it the press is a
		// click on the selection rather than a drag.
		const isBeyondDragThreshold = (clientX, clientY) => {
			return Math.abs(clientX - downClient.x) >= DRAG_START_THRESHOLD || Math.abs(clientY - downClient.y) >= DRAG_START_THRESHOLD;
		};
		const updatePositions = (clientX, clientY, isSnapRequested) => {
			// the whole group moves by one snapped delta, so distances inside it stay untouched;
			// the delta is whole-pixel even unsnapped, because the model keeps integer coordinates
			const {
				x: totalDeltaX,
				y: totalDeltaY
			} = snapPoint({
				x: Math.round((clientX - anchor.x) / currentZoom),
				y: Math.round((clientY - anchor.y) / currentZoom)
			}, isSnapRequested);

			// Nothing but a finite delta is ever applied: a NaN would spread over the rect cache, the
			// port coordinates and the model, and the coordinates it came from are past recovering by
			// the time the gesture is committed.
			if (!Number.isFinite(totalDeltaX) || !Number.isFinite(totalDeltaY)) {
				return;
			}
			const stepX = totalDeltaX - lastTotalDelta.x;
			const stepY = totalDeltaY - lastTotalDelta.y;
			isLastFrameSnapped = isSnapRequested;
			if (stepX === 0 && stepY === 0) {
				return;
			}
			for (const item of movingItems) {
				moveItem(item.id, item.startX + totalDeltaX, item.startY + totalDeltaY, stepX, stepY);
			}
			lastTotalDelta = {
				x: totalDeltaX,
				y: totalDeltaY
			};
			setGroupDragOffset({
				x: totalDeltaX,
				y: totalDeltaY
			});
		};
		const releaseGesture = () => {
			stopAutoScroll();
			snapModifier.stopTracking();
			resetGestureBlocks();
			main_core.Event.unbind(window, 'mousemove', onGroupMouseMove);
			main_core.Event.unbind(window, 'mouseup', onGroupMouseUp);
			main_core.Event.unbind(document, 'keydown', onGroupKeyDown);
			main_core.Event.unbind(document, 'pointercancel', onGroupGestureAbort);
			main_core.Event.unbind(window, 'blur', onGroupGestureAbort);
			isGestureActive = false;
			isDragStarted = false;
			movingItems = [];
			lastTotalDelta = {
				x: 0,
				y: 0
			};
			resetGroupDragOffset();
		};

		// A node whose model position is unusable stays out of the gesture: a non-finite coordinate
		// would poison the rect cache on the very first frame, write NaN into every port of the node on
		// the commit and reach the model from there.
		const createMovingItem = block => {
			const position = ui_vue3.toValue(block).position;
			if (!main_core.Type.isObjectLike(position)) {
				return null;
			}
			const startX = Number(position.x);
			const startY = Number(position.y);
			if (!Number.isFinite(startX) || !Number.isFinite(startY)) {
				return null;
			}
			return {
				id: ui_vue3.toValue(block).id,
				startX,
				startY
			};
		};
		const onGroupMouseDown = event => {
			// The frame is shown by the selection alone, so it stays on screen over a readonly template
			// and over an animation: without this the gesture would move the nodes there and write the
			// move into the model. A press over a gesture still open is refused as well: restarting the
			// gesture would lose the nodes the open one carries, leaving them shifted with nothing to
			// bring them back.
			if (event.button !== 0 || ui_vue3.toValue(isDisabledBlockDiagram) || isGestureActive) {
				return;
			}
			event.stopPropagation();
			closeContextMenu();
			const selectedIds = new Set(ui_vue3.toValue(highlitedBlockIds));
			const items = ui_vue3.toValue(uiBlocksRef).filter(block => selectedIds.has(block.id)).map(block => createMovingItem(block)).filter(item => item !== null);

			// Nothing is left to move once the unusable positions are filtered out. A gesture started over
			// such a selection would subscribe to the pointer, run autoscroll and carry the frame away
			// from the nodes it belongs to.
			if (items.length === 0) {
				return;
			}

			// The zoom divides the pointer delta, so a zero or non-finite one would turn every position
			// of the gesture into infinity or NaN and carry it into the rect cache, into the ports and
			// into the model on the commit.
			const gestureZoom = ui_vue3.toValue(zoom);
			if (!Number.isFinite(gestureZoom) || gestureZoom <= 0) {
				return;
			}
			currentZoom = gestureZoom;
			++gestureToken;
			anchor = {
				x: event.clientX,
				y: event.clientY
			};
			downClient = {
				x: event.clientX,
				y: event.clientY
			};
			client = {
				x: event.clientX,
				y: event.clientY
			};
			lastTotalDelta = {
				x: 0,
				y: 0
			};
			isGestureActive = true;
			isDragStarted = false;
			resetGroupDragOffset();
			snapModifier.sync(event);
			snapModifier.startTracking();
			isLastFrameSnapped = isSnapModifier(event);
			movingItems = items;

			// The model keeps the pre-gesture positions until mouseup, so culling would judge these
			// nodes by boxes the gesture has already left behind: autoscroll pans the camera past them
			// and unmounts a node that is in fact on screen.
			setGestureBlocks(movingItems.map(item => item.id));
			startAutoScroll(event, (dx, dy) => {
				anchor.x -= dx;
				anchor.y -= dy;
				updatePositions(client.x, client.y, snapModifier.isPressed());
			});
			main_core.Event.bind(window, 'mousemove', onGroupMouseMove);
			main_core.Event.bind(window, 'mouseup', onGroupMouseUp);
			main_core.Event.bind(document, 'keydown', onGroupKeyDown);
			main_core.Event.bind(document, 'pointercancel', onGroupGestureAbort);
			main_core.Event.bind(window, 'blur', onGroupGestureAbort);
		};
		const onGroupMouseMove = event => {
			client.x = event.clientX;
			client.y = event.clientY;
			snapModifier.sync(event);
			if (!isDragStarted) {
				isDragStarted = isBeyondDragThreshold(event.clientX, event.clientY);
			}

			// The press only arms the autoscroll, and the pointer is reported to it past the threshold, as
			// the node gesture reports it: below the threshold the press is still a click on the selection
			// and the camera must stand.
			if (isDragStarted) {
				updateMousePosition(event);
			}
			updatePositions(client.x, client.y, snapModifier.isPressed());
		};

		// The model is the truth about where a node stands, so after the gesture the markup and the
		// measured geometry are brought to the model position instead of being left on the result of the
		// gesture: a consumer may refuse the move or write a position of its own. The rect of a node is
		// written absolutely and would come back into agreement on the next gesture anyway, but the port
		// offsets are written as steps - nothing but this brings them back into step.
		const alignGeometryToModel = ({
			id,
			x,
			y
		}, blockById) => {
			const block = blockById.get(id) ?? null;
			if (block === null) {
				return;
			}
			const position = ui_vue3.toValue(block).position;
			if (!main_core.Type.isObjectLike(position)) {
				return;
			}

			// A non-finite coordinate would turn every port of the node into NaN and take all its
			// connections off the canvas.
			if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
				return;
			}
			moveItem(id, position.x, position.y, position.x - x, position.y - y);
		};

		// One pass over the model instead of a linear lookup per node: the commit and the
		// reconciliation each walk the whole selection, and the model of a large diagram is long.
		const buildBlockByIdMap = () => {
			return new Map(ui_vue3.toValue(uiBlocksRef).map(block => [ui_vue3.toValue(block).id, block]));
		};
		const onGroupMouseUp = event => {
			// The watcher below is flushed before the render, so a diagram disabled in this very tick is
			// still to reach it: without this check the release would carry the gesture into the model
			// over a readonly template or an animation.
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				cancelGesture();
				return;
			}

			// A mouseup can arrive with no coordinates at all - a plain `Event('mouseup')` from a
			// consumer, or the core `BX.fireEvent`. Applying it as a frame would make the release delta
			// NaN, and a NaN passes the "moved nothing" check below straight into the model.
			if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
				cancelGesture();
				return;
			}

			// A mouseup can carry a position no mousemove has seen, so the release point is applied as
			// the last frame of the gesture - but only once it is past the threshold that separates a
			// drag from a click, the same one the node gesture uses. Otherwise the shake of a hand over
			// the frame writes a command per selected node. A gesture that has already moved the nodes
			// is past that question: its release point is a frame like any other. The modifier is taken
			// from the last frame rather than from this event: Shift released an instant before the
			// button would part the committed position from the drawn one.
			if (lastTotalDelta.x !== 0 || lastTotalDelta.y !== 0 || isBeyondDragThreshold(event.clientX, event.clientY)) {
				updatePositions(event.clientX, event.clientY, isLastFrameSnapped);
			}

			// A gesture that left the nodes where they started is a click on the selection, not a drag:
			// committing it would write a command per selected node, with the pre-gesture coordinates,
			// and ask the consumer to save a diagram nothing changed in. A pointer that wandered off and
			// came back to the press point ends there just as a press that never moved does.
			if (lastTotalDelta.x === 0 && lastTotalDelta.y === 0) {
				releaseGesture();
				return;
			}

			// The markup and the geometry are brought to the whole-pixel position first, so all three
			// describe the same place: the model keeps integer coordinates.
			const committedPositions = movingItems.map(item => {
				const currentX = item.startX + lastTotalDelta.x;
				const currentY = item.startY + lastTotalDelta.y;
				const x = Math.round(currentX);
				const y = Math.round(currentY);
				moveItem(item.id, x, y, x - currentX, y - currentY);
				return {
					id: item.id,
					x,
					y
				};
			});
			const token = gestureToken;
			const blockById = buildBlockByIdMap();

			// The commands go out first and the gesture is released after them, but the release is not
			// theirs to skip: a consumer hook that throws would leave the gesture live - the window
			// listeners bound, the nodes held and the frame offset standing, so the next pointer move
			// would drag them with no button held. The exception itself is not the extension's to handle
			// and goes on to the consumer, taking the reconciliation below with it: a torn commit leaves
			// the model in a state there is nothing to align the geometry to.
			try {
				for (const {
					id,
					x,
					y
				} of committedPositions) {
					const block = blockById.get(id) ?? null;
					if (block === null) {
						continue;
					}
					updateBlock({
						...ui_vue3.toValue(block),
						position: {
							...ui_vue3.toValue(block).position,
							x,
							y
						}
					});
				}
			} finally {
				// The nodes are held in the visible set until the last command has gone out: released
				// earlier, they would be judged by the pre-gesture boxes the spatial index still holds
				// for as long as the write takes.
				releaseGesture();
			}

			// Rendering a node rewrites its markup from the block input, and under render optimization
			// that input still carries the pre-gesture position on the render of this very commit. The
			// position is put back once that render has flushed, so the nodes do not blink back to where
			// the gesture started while the visible set catches up.
			// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
			// cycle - the model is read once here, and a command applied later misses the alignment.
			void ui_vue3.nextTick(() => {
				if (token !== gestureToken) {
					return;
				}

				// The lookup is built again rather than reused: the consumer applies the commands by
				// replacing the model, so the map of the commit holds the pre-commit blocks, and the
				// whole point here is to read where the consumer has put the nodes.
				const committedBlockById = buildBlockByIdMap();
				for (const committedPosition of committedPositions) {
					alignGeometryToModel(committedPosition, committedBlockById);
				}
			});
		};
		const cancelGesture = () => {
			if (!isGestureActive) {
				return;
			}
			for (const item of movingItems) {
				moveItem(item.id, item.startX, item.startY, -lastTotalDelta.x, -lastTotalDelta.y);
			}
			releaseGesture();
		};
		const onGroupKeyDown = event => {
			if (event.key === 'Escape') {
				cancelGesture();
			}
		};

		// The pointer can be lost without a mouseup: released outside the browser window, or taken away
		// by the system. Left alone the gesture would stay live - the markup shifted, the model on the
		// pre-gesture positions, and the next pointer move dragging the nodes with no button held.
		const onGroupGestureAbort = () => {
			cancelGesture();
		};
		ui_vue3.watch(isDisabledBlockDiagram, isDisabled => {
			if (isDisabled) {
				cancelGesture();
			}
		});

		// A gesture torn down without a mouseup would leave the markup and the geometry where the
		// pointer left them while the model still holds the pre-gesture positions. The token is bumped
		// on top of that: the reconciliation of a release is a microtask, and a teardown between the two
		// would otherwise let it write geometry and markup on a diagram that is gone. `cancelGesture`
		// cannot do it - by then the gesture is already released and it returns at once.
		ui_vue3.onBeforeUnmount(() => {
			++gestureToken;
			cancelGesture();
		});
		return {
			onGroupMouseDown
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useGroupSelectionLogic(closeContextMenu, options) {
		const {
			blocks: uiBlocksRef,
			transformLayoutRef,
			highlitedBlockIds,
			setSelectionActive,
			isSelectionActive,
			groupDragOffset
		} = useBlockDiagram();
		const width = options.defaultBlockSize.width;
		const height = options.defaultBlockSize.height;
		const getBlockDimensions = (block, container) => {
			const el = container?.querySelector(`[data-id="${block.id}"]`);
			if (el) {
				return {
					w: el.offsetWidth,
					h: el.offsetHeight
				};
			}
			const w = block.dimensions?.width || width;
			const h = block.dimensions?.height || height;
			return {
				w,
				h
			};
		};

		// A node whose model position is unusable is left out of the bounds: a single non-finite
		// coordinate would spread NaN over the whole box, and the browser drops such a style outright.
		const getUsablePosition = block => {
			const position = block.position;
			if (!main_core.Type.isObjectLike(position)) {
				return null;
			}
			const x = Number(position.x);
			const y = Number(position.y);
			if (!Number.isFinite(x) || !Number.isFinite(y)) {
				return null;
			}
			return {
				x,
				y
			};
		};
		const getSelectionBoxPadding = () => {
			const pad = ui_vue3.toValue(options.padding);
			if (main_core.Type.isNumber(pad)) {
				return {
					top: pad,
					right: pad,
					bottom: pad,
					left: pad
				};
			}
			return {
				top: pad.top,
				right: pad.right,
				bottom: pad.bottom,
				left: pad.left
			};
		};
		function onCanvasSelect(worldRect) {
			if (!worldRect) {
				setSelectionActive(false);
				return;
			}
			const blocks = ui_vue3.toValue(uiBlocksRef);
			const container = ui_vue3.toValue(transformLayoutRef);
			const intersectingIds = new Set();
			blocks.forEach(block => {
				const {
					x,
					y
				} = block.position;
				const {
					w,
					h
				} = getBlockDimensions(block, container);
				const isIntersecting = worldRect.x < x + w && worldRect.x + worldRect.width > x && worldRect.y < y + h && worldRect.y + worldRect.height > y;
				if (isIntersecting) {
					intersectingIds.add(block.id);
				}
			});
			const currentIds = ui_vue3.toValue(highlitedBlockIds) || [];
			const nextIds = currentIds.filter(id => intersectingIds.has(id));
			intersectingIds.forEach(id => {
				if (!nextIds.includes(id)) {
					nextIds.push(id);
				}
			});
			highlitedBlockIds.value = nextIds;
		}
		function onSelectionStart() {
			setSelectionActive(true);
			closeContextMenu();
			highlitedBlockIds.value = [];
		}
		const groupSelectionStyle = ui_vue3.computed(() => {
			if (ui_vue3.toValue(isSelectionActive)) {
				return null;
			}
			const ids = ui_vue3.toValue(highlitedBlockIds) || [];
			if (ids.length <= 1) {
				return null;
			}
			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;
			let hasBlocks = false;
			const blocks = ui_vue3.toValue(uiBlocksRef);
			const container = ui_vue3.toValue(transformLayoutRef);
			ids.forEach(id => {
				const block = blocks.find(item => item.id === id);
				if (block) {
					const position = getUsablePosition(block);
					if (position === null) {
						return;
					}
					hasBlocks = true;
					const {
						x,
						y
					} = position;
					const {
						w,
						h
					} = getBlockDimensions(block, container);
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x + w);
					maxY = Math.max(maxY, y + h);
				}
			});
			if (!hasBlocks) {
				return null;
			}
			const padding = getSelectionBoxPadding();
			// Positions come from the model, which the frame drag leaves untouched until mouseup, so
			// the box follows the shift the gesture has drawn and stands on the model in between.
			const {
				x: dragOffsetX,
				y: dragOffsetY
			} = ui_vue3.toValue(groupDragOffset);
			return {
				left: `${minX + dragOffsetX - padding.left}px`,
				top: `${minY + dragOffsetY - padding.top}px`,
				width: `${maxX - minX + padding.left + padding.right}px`,
				height: `${maxY - minY + padding.top + padding.bottom}px`
			};
		});
		return {
			onCanvasSelect,
			onSelectionStart,
			groupSelectionStyle
		};
	}

	const MODIFIER_KEYS = new Set(['control', 'meta', 'shift', 'alt', 'command', 'option', 'ctrl', 'mod']);
	const KEY_CODE_PREFIX = 'Key';
	function useKeyboardShortcuts(shortcutsConfig) {
		const {
			shortcuts,
			mousePosition,
			isKeyboardInitialized
		} = useBlockDiagram();
		const isMac = main_core.Browser.isMac();
		const prepareShortcut = ({
			keys,
			handler
		}) => {
			const lowerKeys = keys.map(k => k.toLowerCase());
			const keySet = new Set(lowerKeys);
			const hasMod = keySet.has('mod');
			const needCtrl = keySet.has('ctrl') || hasMod && !isMac;
			const needMeta = keySet.has('meta') || hasMod && isMac;
			const mainKey = lowerKeys.find(k => !MODIFIER_KEYS.has(k));
			if (!mainKey) {
				console.error('Invalid shortcut config: no main key found', keys);
			}
			return {
				id: Math.random().toString(36).slice(2, 11),
				mainKey: mainKey || '',
				requiredModifiers: {
					ctrl: needCtrl,
					meta: needMeta,
					shift: keySet.has('shift'),
					alt: keySet.has('alt')
				},
				handler
			};
		};
		const localPrepared = shortcutsConfig.map(element => prepareShortcut(element));
		const onMouseMove = event => {
			mousePosition.x = event.clientX;
			mousePosition.y = event.clientY;
		};
		const onKeyDown = event => {
			const target = event.target;
			const pressedKey = event.code.startsWith(KEY_CODE_PREFIX) ? event.code.slice(KEY_CODE_PREFIX.length).toLowerCase() : event.key.toLowerCase();
			if (MODIFIER_KEYS.has(pressedKey)) {
				return;
			}
			const isInputActive = target.tagName in INPUT_TAGS || target.isContentEditable;
			if (isInputActive) {
				return;
			}
			for (const {
				mainKey,
				requiredModifiers,
				handler
			} of ui_vue3.toValue(shortcuts)) {
				if (mainKey !== pressedKey) {
					continue;
				}
				const {
					ctrl,
					meta,
					shift,
					alt
				} = requiredModifiers;
				const isMatch = event.ctrlKey === ctrl && event.metaKey === meta && event.shiftKey === shift && event.altKey === alt;
				if (isMatch) {
					event.preventDefault();
					handler(event, {
						x: mousePosition.x,
						y: mousePosition.y
					});
					return;
				}
			}
		};
		ui_vue3.onMounted(() => {
			shortcuts.value.push(...localPrepared);
			if (!isKeyboardInitialized.value) {
				main_core.Event.bind(window, 'keydown', onKeyDown);
				main_core.Event.bind(window, 'mousemove', onMouseMove);
				isKeyboardInitialized.value = true;
			}
		});
		ui_vue3.onUnmounted(() => {
			const idsToRemove = new Set(localPrepared.map(item => item.id));
			shortcuts.value = shortcuts.value.filter(item => !idsToRemove.has(item.id));
		});
	}

	const CANVAS_TRANSFORM_CLASS_NAMES = {
		base: 'ui-block-diagram-canvas-transform',
		dragging: '--dragging',
		grabbing: '--grabbing',
		grab: '--grab'
	};
	const KEY_SPACE = 'Space';

	// @vue/component
	const CanvasTransform = {
		name: 'canvas-transform',
		props: {
			canvasStyle: {
				type: Object,
				required: true
			},
			zoomSensitivity: {
				type: Number,
				default: 0.01
			},
			zoomSensitivityMouse: {
				type: Number,
				default: 0.04
			},
			selectionEnabled: {
				type: Boolean,
				default: true
			}
		},
		emits: ['openContextMenu'],
		// eslint-disable-next-line max-lines-per-function
		setup(props, {
			emit
		}) {
			const rootRef = ui_vue3.useTemplateRef('rootRef');
			const canvasRef = ui_vue3.useTemplateRef('canvasLayout');
			const transformLayoutRef = ui_vue3.useTemplateRef('transformLayout');
			const isSpacePressed = ui_vue3.ref(false);
			const isPanning = ui_vue3.ref(false);
			const {
				isDragging,
				onMounted: onMountedCanvasTransform,
				onUnmounted: onUnmountedCanvasTransform,
				onMouseDown: onPanStart,
				onMouseMove: onPanMove,
				onMouseUp: onPanEnd,
				onWheel
			} = useCanvasTransfrom({
				canvasRef,
				transformLayoutRef,
				canvasStyle: props.canvasStyle,
				zoomSensitivity: props.zoomSensitivity,
				zoomSensitivityMouse: props.zoomSensitivityMouse
			});
			const {
				isSelecting,
				selectionRect,
				start: onSelectionStart,
				move: onSelectionMove,
				end: onSelectionEnd
			} = useCanvasSelection({
				rootRef,
				transformLayoutRef
			});
			const canvasTransformClassNames = ui_vue3.computed(() => ({
				[CANVAS_TRANSFORM_CLASS_NAMES.base]: true,
				[CANVAS_TRANSFORM_CLASS_NAMES.dragging]: ui_vue3.toValue(isDragging),
				[CANVAS_TRANSFORM_CLASS_NAMES.grabbing]: ui_vue3.toValue(isPanning),
				[CANVAS_TRANSFORM_CLASS_NAMES.grab]: ui_vue3.toValue(isSpacePressed) && !ui_vue3.toValue(isPanning)
			}));
			ui_vue3.onMounted(() => {
				onMountedCanvasTransform();
				main_core.Event.bind(window, 'keydown', onKeyDown);
				main_core.Event.bind(window, 'keyup', onKeyUp);
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedCanvasTransform();
				main_core.Event.unbind(window, 'keydown', onKeyDown);
				main_core.Event.unbind(window, 'keyup', onKeyUp);
			});
			function onMouseDown(event) {
				if (event.button === 2) {
					return;
				}
				const isMiddleClick = event.button === 1;
				const isLeftClick = event.button === 0;
				const isSpace = ui_vue3.toValue(isSpacePressed);
				const shouldPan = isMiddleClick || isLeftClick && (isSpace || !props.selectionEnabled);
				const shouldSelect = isLeftClick && !isSpace && props.selectionEnabled;
				if (shouldPan) {
					if (ui_vue3.toValue(isSelecting)) {
						onSelectionEnd();
					}
					isPanning.value = true;
					if (isMiddleClick || isLeftClick && !props.selectionEnabled) {
						event.preventDefault();
					}
					onPanStart(event);
				} else if (shouldSelect) {
					isPanning.value = false;
					event.preventDefault();
					onSelectionStart(event);
				}
				main_core.Event.bind(document, 'mouseup', onMouseUp);
			}
			function onMouseMove(event) {
				if (ui_vue3.toValue(isSelecting) && ui_vue3.toValue(isSpacePressed)) {
					onSelectionEnd();
					isPanning.value = true;
					onPanStart(event);
				}
				if (ui_vue3.toValue(isSelecting)) {
					onSelectionMove(event);
				} else if (ui_vue3.toValue(isPanning)) {
					onPanMove(event);
				}
			}
			function onMouseUp() {
				main_core.Event.unbind(document, 'mouseup', onMouseUp);
				if (ui_vue3.toValue(isSelecting)) {
					onSelectionEnd();
				}
				if (ui_vue3.toValue(isPanning)) {
					isPanning.value = false;
					onPanEnd();
				}
			}
			const onKeyDown = event => {
				if (event.code !== KEY_SPACE) {
					return;
				}
				if (event.repeat) {
					return;
				}
				const target = event.target;
				const isInputActive = target.tagName in INPUT_TAGS || target.isContentEditable;
				if (isInputActive) {
					return;
				}
				isSpacePressed.value = true;
			};
			const onKeyUp = event => {
				if (event.code === KEY_SPACE) {
					isSpacePressed.value = false;
				}
			};
			function openContextMenu(event) {
				if (event.target === ui_vue3.toValue(canvasRef) || event.target?.parentElement === ui_vue3.toValue(transformLayoutRef)) {
					emit('openContextMenu', event);
				}
			}
			return {
				rootRef,
				canvasRef,
				transformLayoutRef,
				canvasTransformClassNames,
				onMouseDown,
				onMouseMove,
				onMouseUp,
				onWheel,
				openContextMenu,
				isSelecting,
				selectionRect
			};
		},
		template: `
		<div
			ref="rootRef"
			:class="canvasTransformClassNames"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
			@wheel="onWheel"
			@contextmenu.prevent="openContextMenu"
		>
			<canvas
				ref="canvasLayout"
				class="ui-block-diagram-canvas-transform__canvas"
			/>
			<div
				ref="transformLayout"
				class="ui-block-diagram-canvas-transform__transform"
			>
				<slot/>
			</div>
			<div v-if="isSelecting" class="ui-block-diagram-selection-rect"
				 :style="{
					left: selectionRect.x + 'px',
					top: selectionRect.y + 'px',
					width: selectionRect.width + 'px',
					height: selectionRect.height + 'px'
				}"
			>
			</div>
		</div>
	`
	};

	const CONNECTION_CLASS_NAME = {
		base: 'ui-block-diagram-connection',
		active: '--active'
	};
	const TARGET_CONNECTION_CLASS_NAMES = {
		base: 'ui-block-diagram-connection__target',
		active: '--active'
	};

	// @vue/component
	const Connection = {
		name: 'diagram-connection',
		props: {
			/** @type DiagramConnection */
			connection: {
				type: Object,
				required: true
			},
			barWidth: {
				type: Number,
				default: 22
			},
			barHeight: {
				type: Number,
				default: 22
			},
			contextMenuItems: {
				type: Array,
				default: () => []
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				connectionPathInfo,
				isDisabled
			} = useConnectionState(props.connection);
			const {
				deleteConnectionById
			} = useBlockDiagram();
			const loc = useLoc();
			const {
				isOpen,
				showMenu
			} = useContextMenu();
			const preparedContextMenuItems = ui_vue3.computed(() => {
				const defaultItems = [{
					id: 'deleteConnection',
					text: loc.getMessage('UI_BLOCK_DIAGRAM_DELETE_CONNECTION_CONTEXT_MENU_ITEM'),
					onclick: () => {
						deleteConnectionById(props.connection.id);
					}
				}];
				if (props.contextMenuItems.length > 0) {
					return props.contextMenuItems;
				}
				return defaultItems;
			});
			const connectionClassNames = ui_vue3.computed(() => {
				return {
					[CONNECTION_CLASS_NAME.base]: true,
					[CONNECTION_CLASS_NAME.active]: ui_vue3.toValue(isOpen)
				};
			});
			const targetConnectionClasses = ui_vue3.computed(() => ({
				[TARGET_CONNECTION_CLASS_NAMES.base]: true,
				[TARGET_CONNECTION_CLASS_NAMES.active]: ui_vue3.toValue(isOpen)
			}));
			const barPosition = ui_vue3.computed(() => {
				const {
					x: centerX = 0,
					y: centerY = 0
				} = ui_vue3.toValue(connectionPathInfo).center ?? {};
				return {
					x: centerX - props.barWidth / 2,
					y: centerY - props.barHeight / 2
				};
			});
			function onOpenContextMenu(event) {
				if (ui_vue3.toValue(isDisabled) || props.disabled) {
					return;
				}
				event.preventDefault();
				showMenu(event, {
					items: ui_vue3.toValue(preparedContextMenuItems)
				});
			}
			return {
				isDisabled,
				connectionPathInfo,
				connectionClassNames,
				targetConnectionClasses,
				barPosition,
				onOpenContextMenu,
				loc,
				deleteConnectionById
			};
		},
		template: `
		<svg :class="connectionClassNames" :data-id="connection.id">
			<g class="ui-block-diagram-connection__group">
				<path
					:d="connectionPathInfo.path"
					:class="targetConnectionClasses"
					:data-test-id="$blockDiagramTestId('connectionLine', connection.id)"
				/>
				<path
					:d="connectionPathInfo.path"
					:data-test-id="$blockDiagramTestId('connectionHoveredLine', connection.id)"
					class="ui-block-diagram-connection__hovered"
					stroke="transparent"
					fill="transparent"
					@contextmenu.stop="onOpenContextMenu"
				/>
				<foreignObject
					:x="barPosition.x"
					:y="barPosition.y"
					:width="barWidth"
					:height="barHeight"
					class="ui-block-diagram-connection__bar"
				>
					<slot :isDisabled="isDisabled || disabled" />
				</foreignObject>
			</g>
		</svg>
	`
	};

	// @vue/component
	const DeleteConnectionBtn = {
		name: 'delete-connection-btn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			connectionId: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				deleteConnectionById
			} = useBlockDiagram();
			function onDeleteConnection() {
				if (props.disabled) {
					return;
				}
				deleteConnectionById(props.connectionId);
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				onDeleteConnection
			};
		},
		template: `
		<button
			class="ui-block-diagram-delete-connection-btn"
			:data-test-id="$blockDiagramTestId('connectionDeleteBtn', connectionId)"
			@click="onDeleteConnection"
		>
			<div class="ui-block-diagram-delete-connection-btn__icon-wrap">
				<BIcon
					:name="iconSet.TRASHCAN"
					:size="14"
					class="ui-block-diagram-delete-connection-btn__icon"
				/>
			</div>
		</button>
	`
	};

	// @vue/component
	const ContextMenuLayout = {
		name: 'ContextMenuLayout',
		setup() {
			const instance = useBlockDiagram();
			const targetContainerStyle = ui_vue3.computed(() => ({
				top: `${ui_vue3.toValue(instance.positionContextMenu).top}px`,
				left: `${ui_vue3.toValue(instance.positionContextMenu).left}px`
			}));
			return {
				instance,
				targetContainerStyle
			};
		},
		template: `
		<div
			:ref="instance.contextMenuLayerRef"
			class="ui-block-diagram-context-menu__layout"
		>
			<slot/>
			<div
				:ref="instance.targetContainerRef"
				:style="targetContainerStyle"
				class="ui-block-diagram-context-menu__target-container"
				@mousedown.stop
			/>
		</div>
	`
	};

	// @vue/component
	const BlocksQueueTransition = {
		name: 'blocks-queue-transition',
		setup() {
			const {
				isAnimate,
				currentAnimationItem,
				animationStep,
				hooks
			} = useBlockDiagram();
			const canvas = useCanvas();
			const transientHighlightedBlocks = useTransientHighlightedBlocks();

			// The temporary highlight is set on enter here, so it is dropped here too — and with the
			// lifetime of this component, not of the diagram state. Sync flush keeps the drop in the
			// same tick as the stop() that ends the queue, so no code that runs right after it sees
			// a block still highlighted by a queue that is already over.
			ui_vue3.watch(() => ui_vue3.toValue(isAnimate), animating => {
				if (animating === false) {
					transientHighlightedBlocks.clear();
				}
			}, {
				flush: 'sync'
			});

			// The other way a queue ends is this component going away mid-queue: the watcher above never
			// fires then, so drop the highlight here as well and let nothing of it outlive the component.
			ui_vue3.onUnmounted(() => {
				transientHighlightedBlocks.clear();
			});

			// Совпадает ли завершившийся переход с текущим элементом очереди. Логика
			// сопоставления вынесена в чистую matchesTransitionEl; здесь только достаём
			// текущий элемент очереди. Без сопоставления по data-id отсечение при
			// движении камеры выталкивает соседние блоки из этой же TransitionGroup, их
			// сторонние enter/leave продвинули бы чужой шаг рывками.
			function isCurrentTransitionEl(el) {
				return matchesTransitionEl(el, ui_vue3.toValue(currentAnimationItem)?.item);
			}
			function advanceForCurrent() {
				// Продвигаем шаг через контроллер: он гарантирует ровно одно
				// продвижение на шаг (переход vs резервный таймер) по токену шага.
				animationStep.settle(animationStep.currentToken);
			}
			function onBeforeEnter() {
				hooks.blockTransitionStart.trigger(ui_vue3.toValue(currentAnimationItem)?.item);
			}
			function onEnter() {
				// Сторонний enter-переход (отсечение при движении камеры) может сработать
				// уже ПОСЛЕ завершения очереди, когда stop() обнулил currentAnimationItem.
				// В этом случае подсвечивать и двигать камеру нечего — просто выходим.
				const current = ui_vue3.toValue(currentAnimationItem);
				if (!current?.item) {
					return;
				}
				transientHighlightedBlocks.clear();
				transientHighlightedBlocks.add(current.item.id);
				// Наводим камеру по уже готовому объекту блока из очереди, без линейного
				// поиска по id (O(N) на каждый блок).
				canvas.goToBlock(current.item);
			}
			function onAfterEnter(el) {
				hooks.blockTransitionEnd.trigger(ui_vue3.toValue(currentAnimationItem)?.item);
				// Продвигаем очередь только для перехода текущего элемента-блока. При
				// включённой оптимизации центрирование камеры выталкивает ранее
				// показанные блоки из видимой области, отсечение убирает их из этой же
				// TransitionGroup и запускает сторонние enter/leave-переходы. Тип-фильтр
				// плюс сопоставление по id отсекают их; контроллер — двойное продвижение.
				if (ui_vue3.toValue(currentAnimationItem)?.type === ANIMATED_TYPES.BLOCK && isCurrentTransitionEl(el)) {
					advanceForCurrent();
				}
			}
			function onAfterLeave(el) {
				if (ui_vue3.toValue(currentAnimationItem)?.type === ANIMATED_TYPES.REMOVE_BLOCK && isCurrentTransitionEl(el)) {
					advanceForCurrent();
				}
			}
			return {
				isAnimate,
				onBeforeEnter,
				onEnter,
				onAfterEnter,
				onAfterLeave
			};
		},
		template: `
		<TransitionGroup
			v-if="isAnimate"
			name="ui-block-diagram-blocks-queue-transition"
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@after-enter="onAfterEnter"
			@after-leave="onAfterLeave"
		>
			<slot/>
		</TransitionGroup>
		<template v-else>
			<slot/>
		</template>
	`
	};

	// @vue/component
	const GroupedBlocks = {
		name: 'GroupedBlocks',
		components: {
			BlocksQueueTransition
		},
		setup() {
			const {
				blockIntersections
			} = useBlockDiagram();
			return {
				getGroupBlockSlotName,
				visibleBlockGroupNames: blockIntersections.visibleBlockGroupNames,
				groupedVisibleBlocks: blockIntersections.groupedVisibleBlocks
			};
		},
		template: `
		<BlocksQueueTransition>
			<slot
				v-for="group in visibleBlockGroupNames"
				:key="group"
				:name="getGroupBlockSlotName(group)"
				:blocks="groupedVisibleBlocks[group]"
			/>
		</BlocksQueueTransition>
	`
	};

	const NEW_CONNECTION_CLASS_NAME = {
		base: 'ui-block-diagram-new-connection',
		up: '--up'
	};

	// @vue/component
	const NewConnection = {
		name: 'NewConnection',
		props: {
			stubSize: {
				type: Number,
				default: 50
			},
			duration: {
				type: Number,
				default: 3000
			}
		},
		// eslint-disable-next-line max-lines-per-function
		setup(props) {
			const {
				zoom
			} = useBlockDiagram();
			const {
				hasNewConnection,
				hasSourcePort,
				hasTargetPort,
				sourcePortLayoutRect,
				targetPortLayoutRect,
				hasTmpConnection,
				newConnectionPathInfo,
				newTmpConnectionPathInfo,
				newConnection
			} = useNewConnectionState();
			const tmpPathRef = ui_vue3.useTemplateRef('tmpPath');
			let animateTmpPath = null;
			const newConnectionClassNames = ui_vue3.computed(() => {
				return {
					[NEW_CONNECTION_CLASS_NAME.base]: true,
					[NEW_CONNECTION_CLASS_NAME.up]: ui_vue3.toValue(hasNewConnection)
				};
			});
			const sourceForeignObjectPosition = ui_vue3.computed(() => {
				return getForeignObjectPosition(sourcePortLayoutRect);
			});
			const targetForeignObjectPosition = ui_vue3.computed(() => {
				return getForeignObjectPosition(targetPortLayoutRect);
			});
			const stubContainerStyle = ui_vue3.computed(() => {
				return {
					width: `${props.stubSize / ui_vue3.toValue(zoom)}px`,
					height: `${props.stubSize / ui_vue3.toValue(zoom)}px`
				};
			});
			const circleCenterPosition = ui_vue3.computed(() => {
				return {
					cx: ui_vue3.toValue(newConnection)?.center?.x ?? 0,
					cy: ui_vue3.toValue(newConnection)?.center?.y ?? 0
				};
			});
			const hasConnectionEndPoint = ui_vue3.computed(() => {
				return ui_vue3.toValue(newConnection)?.end !== null;
			});
			ui_vue3.watch(hasConnectionEndPoint, () => {
				animateTmpPath?.cancel();
				animateTmpPath?.play();
			});
			ui_vue3.onMounted(() => {
				initAnimateTmpPath();
			});
			function initAnimateTmpPath() {
				animateTmpPath = ui_vue3.toValue(tmpPathRef)?.animate([{
					strokeDasharray: '5, 5',
					strokeDashoffset: '100'
				}, {
					strokeDasharray: '5, 5',
					strokeDashoffset: '0'
				}], {
					duration: props.duration,
					easing: 'linear',
					iterations: Infinity
				});
			}
			function getForeignObjectPosition(rect) {
				const {
					x,
					y,
					width,
					height
				} = ui_vue3.toValue(rect);
				const centerPoint = {
					x: x + width / 2,
					y: y + height / 2
				};
				return {
					x: centerPoint.x - props.stubSize / ui_vue3.toValue(zoom) / 2,
					y: centerPoint.y - props.stubSize / ui_vue3.toValue(zoom) / 2
				};
			}
			return {
				SOURCE_PORT_STUB_TELEPORT_NAME,
				TARGET_PORT_STUB_TELEPORT_NAME,
				hasNewConnection,
				hasSourcePort,
				hasTargetPort,
				sourcePortLayoutRect,
				targetPortLayoutRect,
				hasTmpConnection,
				newConnectionPathInfo,
				newTmpConnectionPathInfo,
				newConnectionClassNames,
				sourceForeignObjectPosition,
				targetForeignObjectPosition,
				stubContainerStyle,
				circleCenterPosition
			};
		},
		template: `
		<svg :class="newConnectionClassNames">
			<g
				v-show="hasNewConnection"
				stroke="none"
				stroke-width="1"
				fill="none"
				fill-rule="evenodd"
			>
				<path
					:d="newConnectionPathInfo.path"
					class="ui-block-diagram-new-connection__path"
				/>

				<path
					ref="tmpPath"
					:d="newTmpConnectionPathInfo.path"
					class="ui-block-diagram-new-connection__tmp-path"
				/>

				<circle
					:cx="circleCenterPosition.cx"
					:cy="circleCenterPosition.cy"
					:r="4"
					class="ui-block-diagram-new-connection__cursor"
				/>
			</g>

			<foreignObject
				:x="sourceForeignObjectPosition.x"
				:y="sourceForeignObjectPosition.y"
				:width="stubSize"
				:height="stubSize"
			>
				<div
					:style="stubContainerStyle"
					:id="SOURCE_PORT_STUB_TELEPORT_NAME"
					class="ui-block-diagram-new-connection__port-stub-container"
				/>
			</foreignObject>

			<foreignObject
				:x="targetForeignObjectPosition.x"
				:y="targetForeignObjectPosition.y"
				:width="stubSize"
				:height="stubSize"
			>
				<div
					:style="stubContainerStyle"
					:id="TARGET_PORT_STUB_TELEPORT_NAME"
					class="ui-block-diagram-new-connection__port-stub-container"
				/>
			</foreignObject>
		</svg>
	`
	};

	// @vue/component
	const ConnectionsQueueTransition = {
		name: 'connections-queue-transition',
		setup() {
			const {
				isAnimate,
				currentAnimationItem,
				animationStep,
				updatePort,
				hooks
			} = useBlockDiagram();

			// Совпадает ли завершившийся переход с текущим элементом-связью. Логика
			// сопоставления по data-id корня связи (Connection кладёт его на <svg>)
			// вынесена в чистую matchesTransitionEl. Если data-id недоступен — грубый
			// тип-фильтр + резервный таймер контроллера.
			function isCurrentTransitionEl(el) {
				return matchesTransitionEl(el, ui_vue3.toValue(currentAnimationItem)?.item);
			}
			function advanceForCurrent() {
				// Контроллер гарантирует ровно одно продвижение на шаг (переход vs
				// резервный таймер) по токену шага.
				animationStep.settle(animationStep.currentToken);
			}
			function onBeforeEnter() {
				const {
					item: connection
				} = ui_vue3.toValue(currentAnimationItem) ?? {};
				// Сторонний enter-переход может сработать после завершения очереди, когда
				// stop() обнулил currentAnimationItem — тогда connection отсутствует и
				// деструктуризация/updatePort ниже упали бы. Просто выходим.
				if (!connection) {
					return;
				}
				hooks.connectionTransitionStart.trigger(connection);
				const {
					sourceBlockId,
					sourcePortId,
					targetBlockId,
					targetPortId
				} = connection;

				// Полный рефреш геометрии обоих портов перед входом связи: rect + segment
				// sizes. Во время поблочной анимации updatePortSegmentSizes ещё не отработал
				// (он ждёт waitAllBlocksMounted), поэтому одного updatePortRect мало —
				// связь отрисуется без сегментов. updatePort покрывает block rect + port
				// rect + segment sizes самодостаточно.
				updatePort(sourceBlockId, sourcePortId);
				updatePort(targetBlockId, targetPortId);
			}
			function onAfterEnter(el) {
				hooks.connectionTransitionEnd.trigger(ui_vue3.toValue(currentAnimationItem)?.item);
				// Как и в blocks-queue-transition: продвигаем очередь только для перехода
				// текущего элемента-связи, чтобы сторонний переход (в т.ч. вызванный
				// отсечением при движении камеры) не дал лишнее продвижение.
				if (ui_vue3.toValue(currentAnimationItem)?.type === ANIMATED_TYPES.CONNECTION && isCurrentTransitionEl(el)) {
					advanceForCurrent();
				}
			}
			function onAfterLeave(el) {
				if (ui_vue3.toValue(currentAnimationItem)?.type === ANIMATED_TYPES.REMOVE_CONNECTION && isCurrentTransitionEl(el)) {
					advanceForCurrent();
				}
			}
			return {
				isAnimate,
				onBeforeEnter,
				onAfterEnter,
				onAfterLeave
			};
		},
		template: `
		<TransitionGroup
			v-if="isAnimate"
			name="ui-block-diagram-connections-queue-transition"
			@before-enter="onBeforeEnter"
			@after-enter="onAfterEnter"
			@after-leave="onAfterLeave"
		>
			<slot/>
		</TransitionGroup>
		<template v-else>
			<slot/>
		</template>
	`
	};

	// @vue/component
	const GroupedConnections = {
		name: 'grouped-connections',
		components: {
			Connection,
			NewConnection,
			ConnectionsQueueTransition
		},
		setup() {
			const {
				blockIntersections,
				connectionPreview
			} = useBlockDiagram();
			const groupedVisibleConnections = ui_vue3.computed(() => {
				const hiddenConnectionId = ui_vue3.toValue(connectionPreview)?.hiddenConnectionId;
				const groups = ui_vue3.toValue(blockIntersections.groupedVisibleConnections);
				if (!hiddenConnectionId) {
					return groups;
				}
				return Object.fromEntries(Object.entries(groups).map(([groupName, connections]) => [groupName, connections.filter(connection => connection.id !== hiddenConnectionId)]));
			});
			return {
				groupedVisibleConnections,
				visibleConnectionGroupNames: blockIntersections.visibleConnectionGroupNames,
				getGroupConnectionSlotName
			};
		},
		template: `
		<ConnectionsQueueTransition>
			<slot
				v-for="connection in visibleConnectionGroupNames"
				:key="connection"
				:name="getGroupConnectionSlotName(connection)"
				:connections="groupedVisibleConnections[connection]"
			/>
			<NewConnection/>
		</ConnectionsQueueTransition>
	`
	};

	const MARKER_RADIUS = 4;

	function isFiniteNumber(value)
	{
		return typeof value === 'number' && Number.isFinite(value);
	}

	function resolvePortCenter(marker, portsRectMap)
	{
		const rect = portsRectMap?.[marker.blockId]?.[marker.portId];

		if (rect === null || typeof rect !== 'object')
		{
			return null;
		}

		const { x, y, width, height } = rect;
		if (![x, y, width, height].every(isFiniteNumber) || width < 0 || height < 0)
		{
			return null;
		}

		const center = {
			x: x + (width / 2),
			y: y + (height / 2),
		};

		return [center.x, center.y].every(isFiniteNumber) ? center : null;
	}

	function isValidPath(path)
	{
		return typeof path === 'string'
			&& path.trim() !== ''
			&& !/(?:NaN|Infinity)/.test(path);
	}

	function createConnectionPreviewRender(
		{
			connectionPreview,
			portsRectMap,
			connectionOffset,
			connectionBendOffset,
			connectionBorderRadius,
		},
		createOffsetMap = createConnectionsOffsetMap,
	)
	{
		const previewOffsets = ui_vue3.computed(() => {
			const preview = ui_vue3.toValue(connectionPreview);
			const offset = ui_vue3.toValue(connectionOffset);
			const bendOffset = ui_vue3.toValue(connectionBendOffset);

			if (preview === null || ![offset, bendOffset].every(isFiniteNumber))
			{
				return null;
			}

			return {
				activationKey: preview.activationKey,
				connectionsOffsetMap: createOffsetMap(
					preview.routingConnections,
					offset,
					bendOffset,
				),
				offset,
				bendOffset,
			};
		});

		return ui_vue3.computed(() => {
			const preview = ui_vue3.toValue(connectionPreview);
			const currentPortsRectMap = ui_vue3.toValue(portsRectMap);
			const borderRadius = ui_vue3.toValue(connectionBorderRadius);
			const offsets = previewOffsets.value;

			if (
				preview === null
				|| offsets === null
				|| preview.activationKey !== offsets.activationKey
				|| !isFiniteNumber(borderRadius)
			)
			{
				return null;
			}

			const {
				connectionsOffsetMap,
				offset,
				bendOffset,
			} = offsets;
			const [firstRoute, secondRoute] = preview.temporaryConnections.map((connection) => {
				return resolveRenderedConnectionRoute({
					connection,
					portsRectMap: currentPortsRectMap,
					connectionsOffsetMap,
					bendOffset,
					offset,
					borderRadius,
				});
			});
			const [firstMarker, secondMarker] = preview.portMarkers.map((marker) => {
				return resolvePortCenter(marker, currentPortsRectMap);
			});

			if (
				firstRoute === null
				|| secondRoute === null
				|| !isValidPath(firstRoute.path)
				|| !isValidPath(secondRoute.path)
				|| firstMarker === null
				|| secondMarker === null
			)
			{
				return null;
			}

			return {
				activationKey: preview.activationKey,
				paths: [firstRoute.path, secondRoute.path],
				markers: [firstMarker, secondMarker],
			};
		});
	}

	// @vue/component
	const ConnectionPreview = ui_vue3.defineComponent({
		name: 'UiBlockDiagramConnectionPreview',
		setup()
		{
			const {
				connectionPreview,
				portsRectMap,
				connectionOffset,
				connectionBendOffset,
				connectionBorderRadius,
			} = useBlockDiagram();
			const previewRender = createConnectionPreviewRender({
				connectionPreview,
				portsRectMap,
				connectionOffset,
				connectionBendOffset,
				connectionBorderRadius,
			});

			return {
				previewRender,
				markerRadius: MARKER_RADIUS,
			};
		},
		template: `
		<svg
			v-if="previewRender"
			class="ui-block-diagram-connection-preview"
			:data-test-id="$blockDiagramTestId('connectionPreview')"
			aria-hidden="true"
			focusable="false"
		>
			<g
				:key="previewRender.activationKey"
				class="ui-block-diagram-connection-preview__group"
			>
				<path
					v-for="(path, index) in previewRender.paths"
					:key="'path-' + index"
					:d="path"
					class="ui-block-diagram-connection-preview__path"
				/>
				<circle
					v-for="(marker, index) in previewRender.markers"
					:key="'marker-' + index"
					:cx="marker.x"
					:cy="marker.y"
					:r="markerRadius"
					class="ui-block-diagram-connection-preview__marker"
				/>
			</g>
		</svg>
	`,
	});

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const MoveableBlock = {
		name: 'moveable-block',
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			highlighted: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				block
			} = ui_vue3.toRefs(props);
			const blockRef = ui_vue3.useTemplateRef('blockEl');
			const {
				isMakeNewConnection
			} = useBlockDiagram();
			const {
				blockZindex,
				isHiglitedBlock,
				isDisabled,
				onMountedBlock,
				onUnmountedBlock
			} = useBlockState({
				block,
				blockRef
			});
			const highlightedBlocks = useHighlightedBlocks();
			const {
				isDragged,
				blockPositionStyle
			} = useMoveableBlock(blockRef, block);
			ui_vue3.watch(() => props.highlighted, value => {
				if (value) {
					highlightedBlocks.add(props.block.id);
				} else {
					highlightedBlocks.remove(props.block.id);
				}
			});
			const blockStyle = ui_vue3.computed(() => ({
				...ui_vue3.toValue(blockPositionStyle),
				...ui_vue3.toValue(blockZindex)
			}));
			ui_vue3.onMounted(() => {
				onMountedBlock();
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedBlock();
			});
			function onMouseDownSelectBlock() {
				highlightedBlocks.clear();
				highlightedBlocks.add(props.block.id);
			}
			return {
				isHiglitedBlock,
				isDisabled,
				isDragged,
				isMakeNewConnection,
				blockStyle,
				blockZindex,
				blockPositionStyle,
				onMouseDownSelectBlock
			};
		},
		template: `
		<div
			class="ui-block-diagram-moveable-block"
			:style="blockStyle"
			ref="blockEl"
			:data-test-id="$blockDiagramTestId('block', block.id)"
			:data-id="block.id"
			@mousedown="onMouseDownSelectBlock"
		>
			<slot
				:block="block"
				:isHighlighted="isHiglitedBlock"
				:isDragged="isDragged"
				:isDisabled="isDisabled"
				:isMakeNewConnection="isMakeNewConnection"
			/>
		</div>
	`
	};

	const PORT_CLASS_NAMES = {
		base: 'ui-block-diagram-port',
		disabled: '--disabled',
		active: '--active'};
	const SOURCE_PORT_STUB_SLOT_NAME = 'sourcePortStub';
	const TARGET_PORT_STUB_SLOT_NAME = 'targetPortStub';

	// @vue/component
	const Port = {
		name: 'DiagramPort',
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			/** @type DiagramPort */
			port: {
				type: Object,
				required: true
			},
			/** @type DiagramPortPosition */
			position: {
				type: String,
				required: true,
				validator(position) {
					return Object.values(PORT_POSITION).includes(position);
				}
			},
			index: {
				type: Number,
				required: true
			},
			/** @type Array<DiagramValidationPortRuleFn> */
			validationRules: {
				type: Array,
				default: () => []
			},
			/** @type DiagramNormalyzeConnectionFn | null */
			normalyzeConnectionFn: {
				type: Function,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			/** Opt-in: a placeholder port that is a valid drop target but never a source. */
			isVirtual: {
				type: Boolean,
				default: false
			},
			/** @type DiagramVirtualPortDropFn | null - invoked on drop when isVirtual. */
			onVirtualDrop: {
				type: Function,
				default: null
			}
		},
		setup(props, {
			slots
		}) {
			const {
				isDisabled,
				isMaybePortForNewConnection,
				isIncludedPortInSelectedBlock,
				isIncludedPortInMovingBlock,
				onMountedPort,
				onUnmountedPort
			} = usePortState({
				portRef: ui_vue3.useTemplateRef('port'),
				block: props.block,
				port: props.port,
				position: props.position,
				validationRules: props.validationRules,
				index: props.index,
				isVirtual: props.isVirtual,
				onVirtualDrop: props.onVirtualDrop
			});
			const {
				isSourcePort,
				isTargetPort,
				onMouseDownPort
			} = useNewConnection({
				block: props.block,
				port: props.port,
				position: props.position,
				index: props.index,
				normalyzeConnectionFn: props.normalyzeConnectionFn,
				isVirtual: props.isVirtual
			});
			const isActive = ui_vue3.computed(() => {
				return (ui_vue3.toValue(isSourcePort) || ui_vue3.toValue(isMaybePortForNewConnection) || ui_vue3.toValue(isTargetPort) || ui_vue3.toValue(isIncludedPortInSelectedBlock)) && !ui_vue3.toValue(isIncludedPortInMovingBlock);
			});
			const portClassNames = ui_vue3.computed(() => ({
				[PORT_CLASS_NAMES.base]: true,
				[PORT_CLASS_NAMES.active]: ui_vue3.toValue(isSourcePort) || ui_vue3.toValue(isMaybePortForNewConnection),
				[PORT_CLASS_NAMES.disabled]: ui_vue3.toValue(isDisabled)
			}));
			ui_vue3.onMounted(() => {
				onMountedPort();
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedPort();
			});
			return {
				sourcePortStubTeleportName: `#${SOURCE_PORT_STUB_TELEPORT_NAME}`,
				targetPortStubTeleportName: `#${TARGET_PORT_STUB_TELEPORT_NAME}`,
				sourcePortStubSlotName: SOURCE_PORT_STUB_SLOT_NAME,
				targetPortStubSlotName: TARGET_PORT_STUB_SLOT_NAME,
				isSourcePort,
				isTargetPort,
				isActive,
				isDisabled,
				isIncludedPortInSelectedBlock,
				isIncludedPortInMovingBlock,
				portClassNames,
				onMouseDownPort
			};
		},
		template: `
		<div
			ref="port"
			:class="portClassNames"
			:data-test-id="$blockDiagramTestId('port', port.id)"
			@mousedown="onMouseDownPort"
		>
			<slot
				:isActive="isActive"
				:isDisabled="isDisabled"
				name="port"
			/>

			<teleport
				v-if="isSourcePort"
				:to="sourcePortStubTeleportName"
			>
				<slot :name="sourcePortStubSlotName">
					<div class="ui-block-diagram-port__stub"/>
				</slot>
			</teleport>

			<teleport
				v-if="isTargetPort"
				:to="targetPortStubTeleportName"
			>
				<slot :name="targetPortStubSlotName">
					<div class="ui-block-diagram-port__stub"/>
				</slot>
			</teleport>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const BLOCK_CONTENT_STUB_CLASS_NAMES = {
		base: 'ui-block-diagram-block-content-stub',
		highlighted: '--highlighted'
	};

	// @vue/component
	const BlockContentStub = {
		name: 'block-content-stub',
		components: {
			Port
		},
		props: {
			/* @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			highlighted: {
				type: Boolean,
				default: false
			},
			dragged: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				deleteBlockById
			} = useBlockDiagram();
			const loc = useLoc();
			const {
				showMenu
			} = useContextMenu();
			const blockContentClassNames = ui_vue3.computed(() => ({
				[BLOCK_CONTENT_STUB_CLASS_NAMES.base]: true,
				[BLOCK_CONTENT_STUB_CLASS_NAMES.highlighted]: props.highlighted
			}));
			function onShowContextMenu(event) {
				event.preventDefault();
				if (props.disabled) {
					return;
				}
				const {
					clientX,
					clientY
				} = event;
				showMenu({
					clientX,
					clientY
				}, {
					items: [{
						id: 'deleteConnection',
						text: loc.getMessage('UI_BLOCK_DIAGRAM_DELETE_BLOCK_CONTEXT_MENU_ITEM'),
						onclick: () => {
							deleteBlockById(props.block.id);
						}
					}]
				});
			}
			return {
				blockContentClassNames,
				onShowContextMenu
			};
		},
		template: `
		<div
			:class="blockContentClassNames"
			@contextmenu="onShowContextMenu"
		>
			<div class="ui-block-diagram-block-content-stub__id">
				{{ block.id }}
			</div>

			<div class="ui-block-diagram-block-content-stub__left-column">
				<div
					v-for="port in block.ports.input"
					:key="port.id"
					class="ui-block-diagram-block-content-stub__port-line"
				>
					<div class="ui-block-diagram-block-content-stub__port --left">
						<Port
							:block="block"
							:port="port"
							:styled="false"
							:portsToShow="null"
							position="left"
						/>
					</div>
				</div>
			</div>

			<div class="ui-block-diagram-block-content-stub__right-column">
				<div
					v-for="port in block.ports.output"
					:key="port.id"
					class="ui-block-diagram-block-content-stub__port-line"
				>
					<div class="ui-block-diagram-block-content-stub__port --right">
						<Port
							:block="block"
							:port="port"
							:styled="false"
							:portsToShow="null"
							position="right"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const UI_CANVAS_GRID_COLOR = '#A1B8D9';
	const UI_CANVAS_BACKGROUND_COLOR = '#ECF0F2';
	const BLOCK_DIAGRAM_CLASS_NAMES = {
		base: 'ui-block-diagram',
		ewResize: '--cursor-ew-resize',
		nsResize: '--cursor-ns-resize',
		nwSeResize: '--cursor-nwse-resize',
		neSwResize: '--cursor-nesw-resize',
		grabbing: '--grabbing',
		disabled: '--disabled'
	};
	// @vue/component
	const BlockDiagram = {
		name: 'block-diagram',
		components: {
			CanvasTransform,
			ContextMenuLayout,
			GroupedBlocks,
			GroupedConnections,
			ConnectionPreview,
			Connection,
			DeleteConnectionBtn,
			MoveableBlock,
			BlockContentStub
		},
		props: {
			/** @type Array<DiagramBlock> */
			blocks: {
				type: Array,
				required: true
			},
			/** @type Array<DiagramConnection> */
			connections: {
				type: Array,
				required: true
			},
			canvasStyle: {
				type: Object,
				default: () => ({
					style: 'grid',
					size: GRID_DEFAULT_SIZE,
					gridColor: UI_CANVAS_GRID_COLOR,
					backgroundColor: UI_CANVAS_BACKGROUND_COLOR
				})
			},
			// Allows snapping rather than turns it on: a gesture is aligned to the grid only while
			// Shift is held, and with the prop off Shift changes nothing.
			snapToGrid: {
				type: Boolean,
				default: false
			},
			snapSize: {
				type: Number,
				default: null
			},
			zoomSensitivity: {
				type: Number,
				default: 0.01
			},
			zoomSensitivityMouse: {
				type: Number,
				default: 0.04
			},
			zoom: {
				type: Number,
				default: 1
			},
			minZoom: {
				type: Number,
				default: 0.2
			},
			maxZoom: {
				type: Number,
				default: 4
			},
			connectionOffset: {
				type: Number,
				default: CONNECTION_OFFSET
			},
			connectionBendOffset: {
				type: Number,
				default: CONNECTION_BEND_OFFSET
			},
			connectionBorderRadius: {
				type: Number,
				default: CONNECTION_BORDER_RADIUS
			},
			historyHooks: {
				type: Array,
				default: () => [HOOK_NAMES.END_DRAG_BLOCK, HOOK_NAMES.ADD_BLOCK, HOOK_NAMES.DELETE_BLOCK, HOOK_NAMES.CREATE_CONNECTION, HOOK_NAMES.DELETE_CONNECTION]
			},
			snapshotHandler: {
				type: Function,
				default: null
			},
			revertHandler: {
				type: Function,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			connectionRouteHitTestEnabled: {
				type: Boolean,
				default: false
			},
			enableGrouping: {
				type: Boolean,
				default: false
			},
			/** @type Array<MenuItemOptions> */
			contextMenuItems: {
				type: Array,
				default: () => []
			}
		},
		emits: ['update:blocks', 'update:connections', HOOK_NAMES.CHANGED_BLOCKS, HOOK_NAMES.CHANGED_CONNECTIONS, HOOK_NAMES.START_DRAG_BLOCK, HOOK_NAMES.MOVE_DRAG_BLOCK, HOOK_NAMES.END_DRAG_BLOCK, HOOK_NAMES.ADD_BLOCK, HOOK_NAMES.ADD_BLOCKS, HOOK_NAMES.UPDATE_BLOCK, HOOK_NAMES.DELETE_BLOCK, HOOK_NAMES.CREATE_CONNECTION, HOOK_NAMES.ADD_CONNECTIONS, HOOK_NAMES.DELETE_CONNECTION, HOOK_NAMES.BLOCK_TRANSITION_START, HOOK_NAMES.BLOCK_TRANSITION_END, HOOK_NAMES.CONNECTION_TRANSITION_START, HOOK_NAMES.CONNECTION_TRANSITION_END, HOOK_NAMES.DROP_NEW_BLOCK],
		// eslint-disable-next-line max-lines-per-function
		setup(props, {
			emit
		}) {
			const {
				connectionGroupNames,
				groupedConnections,
				cursorType,
				blockIntersections,
				isRunUpdateBlocksCommand,
				blockElMap,
				purgeBlockGeometry,
				purgeBlockGeometryExcept,
				isRenderOptimizationAvailable,
				connectionPreview,
				clearConnectionPreview
			} = useBlockDiagram(props);
			const initAppElements = useInitAppElements({
				blockDiagramRef: ui_vue3.useTemplateRef('blockDiagram')
			});
			const {
				makeSnapshot
			} = useHistory();
			const {
				dispose: disposeModelValue
			} = useModelValue(emit);
			const {
				dispose: disposeWatchProps
			} = useWatchProps(props);
			const {
				dispose: disposeRegisterHooks
			} = useRegisterHooks({
				...Object.entries(HOOK_NAMES).reduce((acc, [name, hookName]) => {
					acc[hookName] = (...args) => {
						emit(hookName, ...args);
					};
					return acc;
				}, {})
			}, {
				[HOOK_NAMES.ADD_BLOCK](block) {
					isRunUpdateBlocksCommand.value = true;
					blockIntersections.insertBlock(block);
				},
				[HOOK_NAMES.ADD_BLOCKS](blocks) {
					isRunUpdateBlocksCommand.value = true;
					ui_vue3.toValue(blocks).forEach(block => {
						blockIntersections.insertBlock(block);
					});
				},
				[HOOK_NAMES.UPDATE_BLOCK](oldBlock, newBlock) {
					isRunUpdateBlocksCommand.value = true;
					blockIntersections.updateBlock(oldBlock, newBlock);

					// Geometry retention/purge only exists under render optimization; under N
					// nothing is retained (unmount clears rects) — strict no-op. Under Y a
					// culled node moved programmatically keeps stale retained coordinates with
					// no remount to refresh them: invalidate so the next mount re-measures.
					if (ui_vue3.toValue(isRenderOptimizationAvailable) && !ui_vue3.toValue(blockElMap).has(ui_vue3.toValue(newBlock).id)) {
						purgeBlockGeometry(ui_vue3.toValue(newBlock).id);
					}
				},
				[HOOK_NAMES.DELETE_BLOCK](block) {
					isRunUpdateBlocksCommand.value = true;
					blockIntersections.removeBlock(ui_vue3.toValue(block));
					// Under Y, deleting an already-culled node has no unmount to clear its
					// retained rect, so purge explicitly. Under N unmount clears it → no-op.
					if (ui_vue3.toValue(isRenderOptimizationAvailable)) {
						purgeBlockGeometry(ui_vue3.toValue(block).id);
					}
				},
				[HOOK_NAMES.DELETE_BLOCKS](blocks) {
					isRunUpdateBlocksCommand.value = true;
					const renderOptimization = ui_vue3.toValue(isRenderOptimizationAvailable);
					ui_vue3.toValue(blocks).forEach(block => {
						blockIntersections.removeBlock(ui_vue3.toValue(block));
						if (renderOptimization) {
							purgeBlockGeometry(ui_vue3.toValue(block).id);
						}
					});
				},
				// Unlike the block hooks above, this one fires AFTER the props watcher of the same
				// change: the revert emits update:blocks first and the watcher flushes before
				// useHistory() gets here. So isRunUpdateBlocksCommand must NOT be raised because the run
				// it would suppress is already over, nothing would clear it, and it would suppress
				// the index rebuild of the next, unrelated change instead.
				[HOOK_NAMES.HISTORY_NEXT]({
					snapshot
				}) {
					// The block index is left to that watcher pass: it clears and reloads the very
					// model this snapshot restores, so rebuilding it here would build the whole
					// index a second time on every history step.
					//
					// The connection index still needs an immediate rebuild: the watcher's clear()
					// empties it and its own loadConnections only lands on the next frame, so a
					// restored connection would render culled for that frame. The synchronous
					// rebuild supersedes that pending frame.
					blockIntersections.loadConnectionsFromSnapshot(ui_vue3.toValue(snapshot.connections), ui_vue3.toValue(snapshot.blocks));
					// Purge retained geometry of culled nodes dropped by the restore (no
					// unmount to clear them). Under N nothing is retained → no-op.
					if (ui_vue3.toValue(isRenderOptimizationAvailable)) {
						purgeBlockGeometryExcept(ui_vue3.toValue(snapshot.blocks).map(block => block.id));
					}
				},
				// Same ordering as HISTORY_NEXT: the flag would outlive its own change.
				[HOOK_NAMES.HISTORY_PREV]({
					snapshot
				}) {
					// Same split as HISTORY_NEXT: the block index comes from the props watcher.
					blockIntersections.loadConnectionsFromSnapshot(ui_vue3.toValue(snapshot.connections), ui_vue3.toValue(snapshot.blocks));
					if (ui_vue3.toValue(isRenderOptimizationAvailable)) {
						purgeBlockGeometryExcept(ui_vue3.toValue(snapshot.blocks).map(block => block.id));
					}
				}
			}, {
				...props.historyHooks.reduce((acc, hookName) => {
					acc[hookName] = () => makeSnapshot();
					return acc;
				}, {})
			});
			const {
				onDrop
			} = useDragAndDrop();
			const isGrabbing = ui_vue3.ref(false);
			const blockDiagramClassNames = ui_vue3.computed(() => ({
				[BLOCK_DIAGRAM_CLASS_NAMES.base]: true,
				[BLOCK_DIAGRAM_CLASS_NAMES.grabbing]: isGrabbing.value,
				[BLOCK_DIAGRAM_CLASS_NAMES.disabled]: props.disabled,
				[BLOCK_DIAGRAM_CLASS_NAMES.ewResize]: ui_vue3.toValue(cursorType) === CURSOR_TYPES.EW_RESIZE,
				[BLOCK_DIAGRAM_CLASS_NAMES.nsResize]: ui_vue3.toValue(cursorType) === CURSOR_TYPES.NS_RESIZE,
				[BLOCK_DIAGRAM_CLASS_NAMES.nwSeResize]: ui_vue3.toValue(cursorType) === CURSOR_TYPES.NWSE_RESIZE,
				[BLOCK_DIAGRAM_CLASS_NAMES.neSwResize]: ui_vue3.toValue(cursorType) === CURSOR_TYPES.NESW_RESIZE
			}));
			const {
				showMenu
			} = useContextMenu();
			ui_vue3.onMounted(() => {
				initAppElements.onMountedAppElements();
			});
			ui_vue3.onUnmounted(() => {
				clearConnectionPreview(ui_vue3.toValue(connectionPreview)?.activationKey);
				disposeModelValue();
				disposeWatchProps();
				disposeRegisterHooks();
				blockIntersections.clear();
				initAppElements.onUnmountedAppElements();
			});
			function onDragEnter(event) {
				isGrabbing.value = true;
			}
			function onDragLeave(event) {
				isGrabbing.value = false;
			}
			function onDragDrop(event) {
				isGrabbing.value = false;
				onDrop(event);
			}
			function openContextMenu(event) {
				if (props.contextMenuItems.length > 0) {
					showMenu({
						clientX: event.clientX,
						clientY: event.clientY
					}, {
						items: props.contextMenuItems
					});
				}
			}
			return {
				blockDiagramClassNames,
				visibleBlockGroupNames: blockIntersections.visibleBlockGroupNames,
				groupedConnections,
				connectionGroupNames,
				getGroupBlockSlotName,
				getGroupConnectionSlotName,
				onDragDrop,
				onDragEnter,
				onDragLeave,
				openContextMenu
			};
		},
		template: `
		<div
			:class="blockDiagramClassNames"
			:data-test-id="$blockDiagramTestId('blockDiagram')"
			ref="blockDiagram"
			@dragover.prevent
			@dragenter="onDragEnter"
			@dragleave="onDragLeave"
			@drop="onDragDrop"
		>
			<CanvasTransform
				:canvasStyle="canvasStyle"
				:zoomSensitivity="zoomSensitivity"
				:zoomSensitivityMouse="zoomSensitivityMouse"
				:selectionEnabled="enableGrouping"
				@contextmenu.prevent="openContextMenu"
			>
				<slot name="group-selection-box"/>
				<ContextMenuLayout>
					<GroupedConnections>
						<template
							v-for="groupName in connectionGroupNames"
							#[getGroupConnectionSlotName(groupName)]="{ connections }"
							:key="groupName"
						>
							<slot
								v-for="connection in connections"
								:name="getGroupConnectionSlotName(groupName)"
								:key="connection.id"
								:connection="connection"
							>
								<Connection
									:connection="connection"
									:key="connection.id"
								>
									<template #default="{ isDisabled }">
										<DeleteConnectionBtn
											:connectionId="connection.id"
											:disabled="isDisabled"
										/>
									</template>
								</Connection>
							</slot>
						</template>

						<template #new-connection>
							<slot name="new-connection"/>
						</template>
					</GroupedConnections>
					<ConnectionPreview/>
					<GroupedBlocks>
						<template
							v-for="groupName in visibleBlockGroupNames"
							#[getGroupBlockSlotName(groupName)]="{ blocks }"
							:key="groupName"
						>
							<slot
								v-for="block in blocks"
								:name="getGroupBlockSlotName(groupName)"
								:key="block.id"
								:block="block"
							>
								<MoveableBlock
									:block="block"
									:key="block.id"
								>
									<template #default="{ isHighlighted, isDragged, isDisabled }">
										<BlockContentStub
											:block="block"
											:highlighted="isHighlighted"
											:dragged="isDragged"
											:disabled="isDisabled"
										/>
									</template>
								</MoveableBlock>
							</slot>
						</template>
					</GroupedBlocks>
				</ContextMenuLayout>
			</CanvasTransform>
		</div>
	`
	};

	// @vue/component
	const IconButton = {
		name: 'icon-button',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				default: ''
			},
			size: {
				type: [Number, String],
				default: 16
			},
			color: {
				type: String,
				default: '#959CA4'
			},
			active: {
				type: Boolean,
				default: false
			},
			activeColor: {
				type: String,
				default: '#4A9DFF'
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				size,
				active,
				disabled
			} = ui_vue3.toRefs(props);
			const buttonClassNames = ui_vue3.computed(() => ({
				'ui-block-diagram-icon-button': true,
				'--disabled': ui_vue3.toValue(disabled)
			}));
			const buttonStyle = ui_vue3.computed(() => ({
				width: `${ui_vue3.toValue(size)}px`,
				height: `${ui_vue3.toValue(size)}px`
			}));
			const iconClassNames = ui_vue3.computed(() => ({
				'ui-block-diagram-icon-button__icon': true,
				'--active': ui_vue3.toValue(active)
			}));
			return {
				buttonClassNames,
				buttonStyle,
				iconClassNames
			};
		},
		template: `
		<button
			:class="buttonClassNames"
			:style="buttonStyle"
		>
			<slot>
				<BIcon
					:class="iconClassNames"
					:name="iconName"
					:color="color"
					:size="size"
				/>
			</slot>
		</button>
	`
	};

	// @vue/component
	const HistoryBar = {
		name: 'history-bar',
		components: {
			IconButton
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				isDisabledBlockDiagram
			} = useBlockDiagram();
			const {
				hasNext,
				hasPrev,
				next,
				prev
			} = useHistory();
			const isMac = main_core.Browser.isMac();
			useKeyboardShortcuts([{
				keys: ['Mod', 'z'],
				handler: prev
			}, {
				keys: isMac ? ['Mod', 'Shift', 'z'] : ['Mod', 'y'],
				handler: next
			}]);
			function onNext() {
				if (props.disabled || ui_vue3.toValue(isDisabledBlockDiagram)) {
					return;
				}
				next();
			}
			function onPrev() {
				if (props.disabled || ui_vue3.toValue(isDisabledBlockDiagram)) {
					return;
				}
				prev();
			}
			return {
				hasNext,
				hasPrev,
				onNext,
				onPrev,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<div class="ui-block-diagram-histoy-bar">
			<slot>
				<IconButton
					class="ui-block-diagram-histoy-bar__prev-button"
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasPrev"
					:data-test-id="$blockDiagramTestId('historyPrevBtn')"
					@click="onPrev"
				/>
				<IconButton
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasNext"
					:data-test-id="$blockDiagramTestId('historyNextBtn')"
					@click="onNext"
				/>
			</slot>
		</div>
	`
	};

	const ZOOM_TYPES = {
		in: 'in',
		out: 'out'
	};

	// @vue/component
	const ZoomBtn = {
		name: 'zoom-btn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			stepZoom: {
				type: Number,
				default: 0.2
			},
			/** @type ZoomType */
			typeZoom: {
				type: String,
				default: ZOOM_TYPES.in,
				validator(value) {
					return value === ZOOM_TYPES.in || value === ZOOM_TYPES.out;
				}
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['zoom-change'],
		setup(props, {
			emit
		}) {
			const {
				isDisabledBlockDiagram
			} = useBlockDiagram();
			const {
				zoomIn,
				zoomOut
			} = useCanvas();
			const loc = useLoc();
			const {
				stepZoom,
				typeZoom
			} = ui_vue3.toRefs(props);
			const isDisabled = ui_vue3.computed(() => props.disabled || ui_vue3.toValue(isDisabledBlockDiagram));
			const ariaLabel = ui_vue3.computed(() => {
				const messageId = ui_vue3.toValue(typeZoom) === ZOOM_TYPES.in ? 'UI_BLOCK_DIAGRAM_ZOOM_IN' : 'UI_BLOCK_DIAGRAM_ZOOM_OUT';
				return loc.getMessage(messageId);
			});
			function onZoom() {
				if (ui_vue3.toValue(isDisabled)) {
					return;
				}
				if (ui_vue3.toValue(typeZoom) === ZOOM_TYPES.in) {
					zoomIn(ui_vue3.toValue(stepZoom));
				} else if (ui_vue3.toValue(typeZoom) === ZOOM_TYPES.out) {
					zoomOut(ui_vue3.toValue(stepZoom));
				}
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				zoomTypes: ZOOM_TYPES,
				ariaLabel,
				isDisabled,
				onZoom
			};
		},
		template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId(typeZoom === zoomTypes.in ? 'zoomInBtn' : 'zoomOutBtn')"
			class="ui-block-diagram-control-btn__btn"
			:aria-label="ariaLabel"
			:disabled="isDisabled"
			@click="onZoom"
		>
			<BIcon
				v-if="typeZoom === zoomTypes.in"
				:name="iconSet.PLUS_M"
				:size="22"
				aria-hidden="true"
				class="ui-block-diagram-control-btn__icon"
			/>
			<BIcon
				v-else
				:name="iconSet.MINUS_M"
				:size="22"
				aria-hidden="true"
				class="ui-block-diagram-control-btn__icon"
			/>
		</button>
	`
	};

	const ZOOM_PRESET = [0.5, 0.7, 1, 2];

	// @vue/component
	const ZoomPercent = {
		name: 'zoom-percent',
		props: {
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				zoom,
				isDisabledBlockDiagram
			} = useBlockDiagram();
			const {
				setZoom
			} = useCanvas();
			const loc = useLoc();
			const percent = ui_vue3.computed(() => {
				return ((ui_vue3.toValue(zoom) ?? 0) * 100).toFixed(0);
			});
			const {
				showMenu,
				isOpen
			} = useContextMenu();
			const isDisabled = ui_vue3.computed(() => props.disabled || ui_vue3.toValue(isDisabledBlockDiagram));
			const buttonLabel = ui_vue3.computed(() => {
				return `${loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_PRESET_BUTTON')}: ${ui_vue3.toValue(percent)}%`;
			});
			const root = ui_vue3.ref(null);
			function onOpenZoomPresetMenu() {
				const rootElement = ui_vue3.toValue(root);
				if (ui_vue3.toValue(isDisabled) || !rootElement) {
					return;
				}
				const options = {
					className: 'ui-block-diagram-percent-menu',
					minWidth: 106,
					bindElement: rootElement,
					targetContainer: rootElement.parentElement,
					items: ZOOM_PRESET.map(value => {
						return {
							text: `${value * 100}%`,
							onclick: () => setZoom(value)
						};
					})
				};
				showMenu({
					clientX: 0,
					clientY: 0
				}, options);
			}
			return {
				percent,
				root,
				isOpen,
				isDisabled,
				buttonLabel,
				onOpenZoomPresetMenu
			};
		},
		template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId('zoomPercentBtn')"
			class="ui-block-diagram-percent"
			:class="{ '--selected': isOpen }"
			:aria-label="buttonLabel"
			aria-haspopup="menu"
			:aria-expanded="isOpen"
			:disabled="isDisabled"
			ref="root"
			@click="onOpenZoomPresetMenu"
		>
			{{ percent }}
		</button>
	`
	};

	const MAP_PADDING = 50;
	const KEYBOARD_PAN_STEP = 50;
	const DEFAULT_BLOCK_COLOR = 'var(--ui-color-palette-gray-15)';
	const DEFAULT_FRAME_BLOCK_COLOR = 'rgba(0,0,0,0.05)';
	const FRAME_BLOCK_TYPE = 'frame';
	const INTERACTION_STATE_MODES = {
		CURSOR: 'cursor',
		MAP: 'map'
	};

	// @vue/component
	const CanvasMap = {
		name: 'canvas-map',
		props: {
			mapWidth: {
				type: Number,
				default: 310
			},
			mapHeight: {
				type: Number,
				default: 183
			},
			blockColors: {
				type: Object,
				default: () => {}
			}
		},
		// eslint-disable-next-line max-lines-per-function
		setup(props, {
			expose
		}) {
			const {
				blocks,
				blocksRectMap,
				canvasWidth,
				canvasHeight,
				transformX,
				transformY,
				zoom
			} = useBlockDiagram();
			const {
				setCamera
			} = useCanvas();
			const loc = useLoc();
			const {
				mapWidth,
				mapHeight,
				blockColors
			} = ui_vue3.toRefs(props);
			const mapEl = ui_vue3.useTemplateRef('map');
			const mapRootEl = ui_vue3.useTemplateRef('mapRoot');
			const mapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_LABEL');
			const interactionState = ui_vue3.reactive({
				isDragging: false,
				mode: null,
				dragOffsetX: 0,
				dragOffsetY: 0,
				mapRect: null
			});
			const canvasMapStyle = ui_vue3.computed(() => ({
				width: `${ui_vue3.toValue(mapWidth)}px`,
				height: `${ui_vue3.toValue(mapHeight)}px`
			}));
			const layoutData = ui_vue3.computed(() => {
				const items = ui_vue3.toValue(blocks);
				if (!main_core.Type.isArrayFilled(items)) {
					const cWidth = ui_vue3.toValue(canvasWidth);
					const cHeight = ui_vue3.toValue(canvasHeight);
					return {
						sortedBlocks: [],
						minX: 0,
						minY: 0,
						width: cWidth ? 2 * cWidth : 1000,
						height: cHeight ? 2 * cHeight : 1000
					};
				}
				let minX = Infinity;
				let minY = Infinity;
				let maxX = -Infinity;
				let maxY = -Infinity;
				const frames = [];
				const content = [];
				items.forEach(block => {
					const {
						x,
						y
					} = block.position;
					const {
						width,
						height
					} = getBlockSize(block);
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x + width);
					maxY = Math.max(maxY, y + height);
					const renderBlock = {
						...block,
						dimensions: {
							width,
							height
						}
					};
					if (block?.type === FRAME_BLOCK_TYPE) {
						frames.push(renderBlock);
					} else {
						content.push(renderBlock);
					}
				});
				return {
					sortedBlocks: [...content, ...frames],
					minX: minX - MAP_PADDING,
					minY: minY - MAP_PADDING,
					width: maxX + MAP_PADDING - (minX - MAP_PADDING),
					height: maxY + MAP_PADDING - (minY - MAP_PADDING)
				};
			});
			const sortedBlocks = ui_vue3.computed(() => ui_vue3.toValue(layoutData).sortedBlocks);
			const contentOffsetX = ui_vue3.computed(() => ui_vue3.toValue(layoutData).minX);
			const contentOffsetY = ui_vue3.computed(() => ui_vue3.toValue(layoutData).minY);
			const renderScale = ui_vue3.computed(() => {
				const {
					width,
					height
				} = ui_vue3.toValue(layoutData);
				if (width <= 0 || height <= 0) {
					return 1;
				}
				return Math.min(ui_vue3.toValue(mapWidth) / width, ui_vue3.toValue(mapHeight) / height);
			});
			const viewportIndicator = ui_vue3.computed(() => {
				const scale = ui_vue3.toValue(renderScale);
				const currentZoom = ui_vue3.toValue(zoom);
				const width = ui_vue3.toValue(canvasWidth) * scale / currentZoom;
				const height = ui_vue3.toValue(canvasHeight) * scale / currentZoom;
				const x = (ui_vue3.toValue(transformX) - ui_vue3.toValue(contentOffsetX)) * scale;
				const y = (ui_vue3.toValue(transformY) - ui_vue3.toValue(contentOffsetY)) * scale;
				return {
					x,
					y,
					width,
					height
				};
			});
			function isPointInViewport(x, y) {
				const indicator = ui_vue3.toValue(viewportIndicator);
				return x >= indicator.x && x <= indicator.x + indicator.width && y >= indicator.y && y <= indicator.y + indicator.height;
			}
			function updateCamera(clientX, clientY) {
				if (!interactionState.mapRect) {
					return;
				}
				const mouseRelX = clientX - interactionState.mapRect.left;
				const mouseRelY = clientY - interactionState.mapRect.top;
				const indicator = ui_vue3.toValue(viewportIndicator);
				const scale = ui_vue3.toValue(renderScale);
				const currentZoom = ui_vue3.toValue(zoom);
				let targetMapX = mouseRelX - indicator.width;
				let targetMapY = mouseRelY - indicator.height;
				if (interactionState.mode === INTERACTION_STATE_MODES.CURSOR) {
					targetMapX = mouseRelX - interactionState.dragOffsetX - indicator.width / 2;
					targetMapY = mouseRelY - interactionState.dragOffsetY - indicator.height / 2;
				}
				const canvasX = targetMapX / scale + ui_vue3.toValue(contentOffsetX);
				const canvasY = targetMapY / scale + ui_vue3.toValue(contentOffsetY);
				setCamera({
					x: canvasX + ui_vue3.toValue(canvasWidth) / currentZoom / 2,
					y: canvasY + ui_vue3.toValue(canvasHeight) / currentZoom / 2,
					zoom: currentZoom,
					viewportX: 0,
					viewportY: 0
				});
			}
			function onMapMouseDown(event) {
				event.preventDefault();
				const el = ui_vue3.toValue(mapEl);
				if (!el) {
					return;
				}
				const rect = el.getBoundingClientRect();
				interactionState.mapRect = rect;
				interactionState.isDragging = true;
				const mouseRelX = event.clientX - rect.left;
				const mouseRelY = event.clientY - rect.top;
				if (isPointInViewport(mouseRelX, mouseRelY)) {
					const indicator = ui_vue3.toValue(viewportIndicator);
					interactionState.mode = INTERACTION_STATE_MODES.CURSOR;
					interactionState.dragOffsetX = mouseRelX - indicator.x;
					interactionState.dragOffsetY = mouseRelY - indicator.y;
				} else {
					interactionState.mode = INTERACTION_STATE_MODES.MAP;
					interactionState.dragOffsetX = 0;
					interactionState.dragOffsetY = 0;
					updateCamera(event.clientX, event.clientY);
				}
			}
			function onMapMouseMove(event) {
				if (!interactionState.isDragging) {
					return;
				}
				event.preventDefault();
				updateCamera(event.clientX, event.clientY);
			}
			function onMapMouseUp(event) {
				interactionState.isDragging = false;
				interactionState.mode = null;
			}
			function onMapKeyDown(event) {
				let deltaX = 0;
				let deltaY = 0;
				switch (event.key) {
					case 'ArrowLeft':
						deltaX = -1;
						break;
					case 'ArrowRight':
						deltaX = 1;
						break;
					case 'ArrowUp':
						deltaY = -1;
						break;
					case 'ArrowDown':
						deltaY = 1;
						break;
					default:
						return;
				}
				event.preventDefault();
				event.stopPropagation();
				const currentZoom = ui_vue3.toValue(zoom) || 1;
				setCamera({
					x: ui_vue3.toValue(transformX) + deltaX * KEYBOARD_PAN_STEP / currentZoom,
					y: ui_vue3.toValue(transformY) + deltaY * KEYBOARD_PAN_STEP / currentZoom,
					zoom: currentZoom
				});
			}
			function focus() {
				ui_vue3.toValue(mapRootEl)?.focus({
					preventScroll: true
				});
			}
			expose({
				focus
			});
			function getBlockColor(block) {
				const blockType = block?.node?.type;
				const colorIndex = block?.node?.colorIndex;
				if (blockType === FRAME_BLOCK_TYPE) {
					return DEFAULT_FRAME_BLOCK_COLOR;
				}
				if (colorIndex === null || colorIndex === false) {
					return DEFAULT_BLOCK_COLOR;
				}
				const palette = ui_vue3.toValue(blockColors) ?? {};
				return palette[colorIndex] || DEFAULT_BLOCK_COLOR;
			}
			function getBlockSize(block) {
				const dimensions = {
					width: block.dimensions.width,
					height: block.dimensions.height
				};
				if (!dimensions.width || !dimensions.height) {
					const blocksRectangleMap = ui_vue3.toValue(blocksRectMap);
					const blockDimensions = blocksRectangleMap[block.id];
					dimensions.width = blockDimensions.width ?? 200;
					dimensions.height = blockDimensions.height ?? 50;
				}
				return dimensions;
			}
			return {
				sortedBlocks,
				canvasMapStyle,
				contentOffsetX,
				contentOffsetY,
				renderScale,
				viewportIndicator,
				mapLabel,
				onMapMouseDown,
				onMapMouseMove,
				onMapMouseUp,
				onMapKeyDown,
				getBlockColor
			};
		},
		template: `
		<div
			ref="mapRoot"
			:data-test-id="$blockDiagramTestId('zoomCanvasMap')"
			:style="canvasMapStyle"
			class="ui-block-diagram-canvas-map__container"
			role="region"
			tabindex="0"
			:aria-label="mapLabel"
			@keydown="onMapKeyDown"
		>
			<svg
				:width="mapWidth"
				:height="mapHeight"
				aria-hidden="true"
				focusable="false"
				ref="map"
				class="ui-block-diagram-canvas-map"
				@mousedown="onMapMouseDown"
				@mousemove="onMapMouseMove"
				@mouseup="onMapMouseUp"
				@mouseleave="onMapMouseUp"
			>
				<rect
					v-for="block in sortedBlocks"
					:key="block.id"
					:x="(block.position.x - contentOffsetX) * renderScale"
					:y="(block.position.y - contentOffsetY) * renderScale"
					:width="block.dimensions.width * renderScale"
					:height="block.dimensions.height * renderScale"
					:rx="2"
					:fill="getBlockColor(block)"
					class="ui-block-diagram-canvas-map__block"
				/>
				<rect
					:x="viewportIndicator.x"
					:y="viewportIndicator.y"
					:width="viewportIndicator.width"
					:height="viewportIndicator.height"
					:rx="4"
					class="ui-block-diagram-canvas-map__cursor"
				/>
			</svg>
		</div>
	`
	};

	const DEFAULT_ICON_COLOR = 'var(--ui-color-base-4)';
	const DEFAULT_CLICKED_ICON_COLOR = 'var(--ui-color-accent-main-primary)';

	// @vue/component
	const CanvasMapBtn = {
		name: 'canvas-map-btn',
		props: {
			width: {
				type: Number,
				default: 28
			},
			height: {
				type: Number,
				default: 32
			},
			iconColor: {
				type: String,
				default: DEFAULT_ICON_COLOR
			},
			clickedIconColor: {
				type: String,
				default: DEFAULT_CLICKED_ICON_COLOR
			},
			isActive: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const loc = useLoc();
			const btnStyle = ui_vue3.computed(() => ({
				width: `${props.width}px`,
				height: `${props.height}px`
			}));
			const ariaLabel = ui_vue3.computed(() => {
				const messageId = props.isActive ? 'UI_BLOCK_DIAGRAM_CANVAS_MAP_CLOSE' : 'UI_BLOCK_DIAGRAM_CANVAS_MAP_OPEN';
				return loc.getMessage(messageId);
			});
			const currentIconColor = ui_vue3.computed(() => {
				return props.isActive ? props.clickedIconColor : props.iconColor;
			});
			return {
				btnStyle,
				ariaLabel,
				currentIconColor
			};
		},
		template: `
		<button
			type="button"
			:style="btnStyle"
			:aria-label="ariaLabel"
			class="ui-block-diagram-canvas-map-btn"
		>
			<svg
				width="24"
				height="24"
				aria-hidden="true"
				focusable="false"
				class="ui-block-diagram-canvas-map-btn__icon"
				:fill="currentIconColor"
			>
				<path
					d="M9.75 4.5498C9.8674 4.54983 9.97803 4.57878 10.0752 4.62988L14.25 6.7168L18.4365 4.62402C18.6535 4.51553 18.9118 4.52675 19.1182 4.6543C19.3244 4.78187 19.4502 5.00748 19.4502 5.25V16.5C19.4501 16.7651 19.2996 17.0074 19.0625 17.126L14.5752 19.3691C14.4835 19.4174 14.3796 19.4461 14.2695 19.4492C14.263 19.4494 14.2565 19.4502 14.25 19.4502C14.2419 19.4502 14.2337 19.4495 14.2256 19.4492C14.1172 19.4455 14.0143 19.4168 13.9238 19.3691L9.75 17.2822L5.5625 19.376C5.34565 19.4843 5.08807 19.4731 4.88184 19.3457C4.67552 19.2182 4.54987 18.9925 4.5498 18.75V7.5C4.5498 7.23498 4.69956 6.99266 4.93652 6.87402L9.42383 4.62988C9.52111 4.57866 9.63242 4.5498 9.75 4.5498ZM5.9502 7.93262V17.6172L9.0498 16.0674V6.38281L5.9502 7.93262ZM10.4502 16.0674L13.5498 17.6172V7.93262L10.4502 6.38281V16.0674ZM14.9502 7.93262V17.6172L18.0498 16.0674V6.38281L14.9502 7.93262Z"
				/>
			</svg>
		</button>
	`
	};

	const VERTICAL_MAP_POSITION = {
		left: 'left'};
	const HORIZONTAL_MAP_POSITION = {
		top: 'top'};
	const MAP_CLASSES = {
		base: 'ui-block-diagram-canvas-zoom-bar__map',
		top: '--top',
		bottom: '--bottom',
		left: '--left',
		right: '--right'
	};
	const POSITION_MAP_DEFAULT_VALUES = 'top right';

	// @vue/component
	const ZoomBar = {
		name: 'zoom-bar',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ZoomBtn,
			ZoomPercent,
			CanvasMap,
			CanvasMapBtn
		},
		props: {
			stepZoom: {
				type: Number,
				default: 0.2
			},
			positionMap: {
				type: String,
				default: POSITION_MAP_DEFAULT_VALUES
			},
			blockColors: {
				type: Object,
				default: () => {}
			},
			disabled: {
				type: Boolean,
				default: false
			},
			flat: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		setup(props) {
			const loc = useLoc();
			const {
				isDisabledBlockDiagram
			} = useBlockDiagram();
			const isShowMap = ui_vue3.ref(false);
			const mapButton = ui_vue3.ref(null);
			const canvasMap = ui_vue3.ref(null);
			const canvasMapPanelId = `ui-block-diagram-canvas-map-${main_core.Text.getRandom()}`;
			const closeMapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_CLOSE');
			const isDisabled = ui_vue3.computed(() => props.disabled || ui_vue3.toValue(isDisabledBlockDiagram));
			const mapPositionClasses = ui_vue3.computed(() => {
				const isTop = props.positionMap.toLowerCase().includes(HORIZONTAL_MAP_POSITION.top);
				const isLeft = props.positionMap.toLowerCase().includes(VERTICAL_MAP_POSITION.left);
				return {
					[MAP_CLASSES.base]: true,
					[MAP_CLASSES.top]: isTop,
					[MAP_CLASSES.bottom]: !isTop,
					[MAP_CLASSES.left]: isLeft,
					[MAP_CLASSES.right]: !isLeft
				};
			});
			function focusMapButton() {
				ui_vue3.toValue(mapButton)?.$el?.focus();
			}
			function closeMap(restoreFocus) {
				isShowMap.value = false;
				if (restoreFocus) {
					ui_vue3.nextTick(focusMapButton);
				}
			}
			function onCloseMap() {
				closeMap(true);
			}
			function onToggleMap() {
				if (ui_vue3.toValue(isDisabled)) {
					return;
				}
				if (ui_vue3.toValue(isShowMap)) {
					closeMap(true);
					return;
				}
				isShowMap.value = true;
				ui_vue3.nextTick(() => ui_vue3.toValue(canvasMap)?.focus());
			}
			ui_vue3.watch(isDisabled, disabled => {
				if (disabled && ui_vue3.toValue(isShowMap)) {
					closeMap(false);
				}
			});
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				mapPositionClasses,
				isShowMap,
				isDisabled,
				mapButton,
				canvasMap,
				canvasMapPanelId,
				closeMapLabel,
				onToggleMap,
				onCloseMap
			};
		},
		template: `
		<div
			class="ui-block-diagram-canvas-zoom-bar"
			:class="{ '--flat': flat }"
			:data-test-id="$blockDiagramTestId('zoomBar')"
		>
			<div class="ui-block-diagram-canvas-zoom-bar__locate">
				<CanvasMapBtn
					ref="mapButton"
					:isActive="isShowMap"
					:disabled="isDisabled"
					:aria-expanded="isShowMap"
					:aria-controls="canvasMapPanelId"
					:data-test-id="$blockDiagramTestId('zoomOpenMapBtn')"
					@click="onToggleMap"
				/>
				<transition name="editor-large-map-fade" mode="in-out">
					<div
						v-if="isShowMap"
						:id="canvasMapPanelId"
						:data-test-id="$blockDiagramTestId('zoomMapPanel')"
						class="ui-block-diagram-canvas-zoom-bar__map"
						:class="mapPositionClasses"
						@keydown.esc.stop.prevent="onCloseMap"
					>
						<div class="ui-block-diagram-canvas-zoom-bar__map-header">
							<button
								type="button"
								class="ui-block-diagram-canvas-zoom-bar__map-close-button"
								:aria-label="closeMapLabel"
								:data-test-id="$blockDiagramTestId('zoomCloseMapBtn')"
								@click="onCloseMap"
							>
								<BIcon
									:name="iconSet.CROSS_M"
									:size="24"
									aria-hidden="true"
									class="ui-block-diagram-canvas-zoom-bar__map-close-icon"
									color="#2FC6F6"
								/>
							</button>
						</div>
						<CanvasMap
							ref="canvasMap"
							:mapSize="310"
							:blockColors="blockColors"
						/>
					</div>
				</transition>
			</div>
			<div class="ui-block-diagram-canvas-zoom-bar__separator"/>
			<div class="ui-block-diagram-canvas-zoom-bar__zoom">
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					typeZoom="out"
				/>
				<ZoomPercent :disabled="disabled"/>
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					typeZoom="in"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SearchResult = {
		name: 'search-result',
		props: {
			title: {
				type: String,
				required: true
			},
			count: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="ui-block-diagram-search-result">
			<div class="ui-block-diagram-search-result__left-col">
				<p class="ui-block-diagram-search-result__title">{{ title }}</p>
			</div>
			<div class="ui-block-diagram-search-result__right-col">
				<span class="ui-block-diagram-search-result__count">{{ count }}</span>
				<div class="ui-block-diagram-search-result__nav">
					<slot/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SearchNavBtn = {
		name: 'search-nav-btn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				required: true
			}
		},
		template: `
		<button class="ui-block-diagram-search-nav-btn">
			<BIcon
				:name="iconName"
				:size="18"
				class="ui-block-diagram-search-nav-btn__icon"
			/>
		</button>
	`
	};

	// @vue/component
	const OpenSearchBtn = {
		name: 'open-search-btn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<button class="ui-block-diagram-open-search-btn">
			<BIcon
				:name="iconSet.SEARCH"
				:size="24"
				class="ui-block-diagram-open-search-btn__icon"
			/>
		</button>
	`
	};

	const SEARCH_INPUT_CLASS_NAMES = {
		base: 'ui-block-diagram-search-input',
		open: '--open',
		focus: '--focus'
	};

	// @vue/component
	const SearchInput = {
		name: 'SearchInput',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			OpenSearchBtn
		},
		props: {
			value: {
				type: String,
				default: ''
			},
			open: {
				type: Boolean,
				default: false
			},
			placeholder: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value', 'clear', 'update:open'],
		setup(props, {
			emit
		}) {
			const loc = useLoc();
			const searchInput = ui_vue3.useTemplateRef('searchInput');
			const showSearchBtn = ui_vue3.ref(true);
			const showSearchBar = ui_vue3.ref(false);
			const isFocus = ui_vue3.ref(false);
			const placeholderOrDefaultValue = ui_vue3.computed(() => {
				if (props.placeholder) {
					return props.placeholder;
				}
				return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_PLACEHOLDER');
			});
			const searchInputClassNames = ui_vue3.computed(() => ({
				[SEARCH_INPUT_CLASS_NAMES.base]: true,
				[SEARCH_INPUT_CLASS_NAMES.open]: ui_vue3.toValue(showSearchBar),
				[SEARCH_INPUT_CLASS_NAMES.focus]: ui_vue3.toValue(isFocus)
			}));
			function onInput(event) {
				if (props.disabled) {
					return;
				}
				emit('update:value', event.target.value);
			}
			function onClear(event) {
				event.stopPropagation();
				if (props.disabled) {
					return;
				}
				showSearchBar.value = false;
				emit('clear');
			}
			function onAfterEnterTransition() {
				ui_vue3.nextTick(() => {
					isFocus.value = true;
					ui_vue3.toValue(searchInput)?.focus();
				});
			}
			function onLeaveTransition() {
				showSearchBtn.value = true;
				emit('update:open', false);
			}
			function onOpenSearchBar() {
				showSearchBar.value = true;
				showSearchBtn.value = false;
				emit('update:open', true);
			}
			function onClickSearchInput() {
				isFocus.value = true;
				ui_vue3.toValue(searchInput)?.focus();
			}
			function onBlurSearchInput() {
				isFocus.value = false;
			}
			function collapseSearchBar() {
				showSearchBar.value = false;
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				showSearchBar,
				showSearchBtn,
				placeholderOrDefaultValue,
				searchInputClassNames,
				onInput,
				onClear,
				onAfterEnterTransition,
				onLeaveTransition,
				onOpenSearchBar,
				onClickSearchInput,
				onBlurSearchInput,
				collapseSearchBar
			};
		},
		template: `
		<OpenSearchBtn
			v-show="showSearchBtn"
			:data-test-id="$blockDiagramTestId('searchOpenBtn')"
			@click="onOpenSearchBar"
		/>
		<transition
			name="ui-block-diagram-search-bar-fade"
			enter-active-class="ui-block-diagram-open-search-bar"
			leave-active-class="ui-block-diagram-close-search-bar"
			@after-enter="onAfterEnterTransition"
			@after-leave="onLeaveTransition"
		>
			<div
				v-show="showSearchBar"
				:class="searchInputClassNames"
				ref="searchBar"
				@click="onClickSearchInput"
			>
				<BIcon
					:name="iconSet.SEARCH"
					:size="20"
					class="ui-block-diagram-search-input__icon"
				/>
				<input
					:value="value"
					:placeholder="placeholderOrDefaultValue"
					:data-test-id="$blockDiagramTestId('searchInput')"
					ref="searchInput"
					type="text"
					class="ui-block-diagram-search-input__input"
					@input="onInput"
					@blur="onBlurSearchInput"
				/>
				<button
					class="ui-block-diagram-search-input__clear-btn"
					:data-test-id="$blockDiagramTestId('searchClearInputBtn')"
					@click="onClear"
				>
					<BIcon
						:name="iconSet.CROSS_L"
						:size="20"
						class="ui-block-diagram-search-input__clear-btn-icon"
					/>
				</button>
			</div>
		</transition>
	`
	};

	const SEARCH_BAR_CLASS_NAMES = {
		base: 'ui-block-diagram-search-bar',
		opened: '--opened'
	};

	// @vue/component
	const SearchBar = {
		name: 'SearchBar',
		components: {
			SearchResult,
			SearchNavBtn,
			SearchInput,
			OpenSearchBtn
		},
		props: {
			searchResultTitle: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			searchCallback: {
				type: Function,
				required: true,
				default: (block, text) => {
					return block.node.title.toLowerCase().includes(text.toLowerCase());
				}
			},
			searchDelay: {
				type: Number,
				default: 300
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		// eslint-disable-next-line max-lines-per-function
		setup(props) {
			const {
				seachText,
				foundBlocks,
				onSearchBlocks,
				onClearSearch
			} = useSearchBlocks({
				searchCallback: props.searchCallback,
				delay: props.searchDelay
			});
			const {
				isDisabledBlockDiagram
			} = useBlockDiagram();
			const highlitedBlocks = useHighlightedBlocks();
			const loc = useLoc();
			const {
				goToBlockById
			} = useCanvas();
			const searchPanel = ui_vue3.useTemplateRef('searchPanel');
			const searchInputRef = ui_vue3.useTemplateRef('searchInput');
			const currentBlockIndex = ui_vue3.ref(0);
			const isOpenedSearchBar = ui_vue3.ref(false);
			const isDisabled = ui_vue3.computed(() => {
				return props.disabled || ui_vue3.toValue(isDisabledBlockDiagram);
			});
			const labelResult = ui_vue3.computed(() => {
				return `${currentBlockIndex.value + 1} / ${ui_vue3.toValue(foundBlocks).length}`;
			});
			const placeholderOrDefaultValue = ui_vue3.computed(() => {
				if (props.placeholder) {
					return props.placeholder;
				}
				return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_PLACEHOLDER');
			});
			const searchResultTitleOrDefaultValue = ui_vue3.computed(() => {
				if (props.searchResultTitle) {
					return props.searchResultTitle;
				}
				return loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_SEARCH_RESULT_TITLE');
			});
			const searchBarClassNames = ui_vue3.computed(() => ({
				[SEARCH_BAR_CLASS_NAMES.base]: true,
				[SEARCH_BAR_CLASS_NAMES.opened]: ui_vue3.toValue(isOpenedSearchBar)
			}));
			ui_vue3.watch(foundBlocks, newBlocks => {
				currentBlockIndex.value = 0;
				if (ui_vue3.toValue(newBlocks).length > 0) {
					const id = ui_vue3.toValue(newBlocks)[0].id;
					highlitedBlocks.clear();
					highlitedBlocks.add(id);
					goToBlockById(id);
				} else {
					highlitedBlocks.clear();
				}
			});
			ui_vue3.onMounted(() => {
				main_core.Event.bind(document, 'mousedown', onClickOutside);
			});
			ui_vue3.onUnmounted(() => {
				main_core.Event.unbind(document, 'mousedown', onClickOutside);
			});
			function onGoToNextBlock() {
				if (ui_vue3.toValue(isDisabled)) {
					return;
				}
				currentBlockIndex.value += 1;
				if (ui_vue3.toValue(currentBlockIndex) > ui_vue3.toValue(foundBlocks).length - 1) {
					currentBlockIndex.value = 0;
				}
				const id = ui_vue3.toValue(foundBlocks)[ui_vue3.toValue(currentBlockIndex)].id;
				highlitedBlocks.clear();
				highlitedBlocks.add(id);
				goToBlockById(id);
			}
			function onGoToPrevBlock() {
				if (ui_vue3.toValue(isDisabled)) {
					return;
				}
				currentBlockIndex.value -= 1;
				if (ui_vue3.toValue(currentBlockIndex) < 0) {
					currentBlockIndex.value = ui_vue3.toValue(foundBlocks).length - 1;
				}
				const id = ui_vue3.toValue(foundBlocks)[ui_vue3.toValue(currentBlockIndex)].id;
				highlitedBlocks.clear();
				highlitedBlocks.add(id);
				goToBlockById(ui_vue3.toValue(foundBlocks)[ui_vue3.toValue(currentBlockIndex)].id);
			}
			function closeAndResetSearch() {
				highlitedBlocks.clear();
				onClearSearch();
				currentBlockIndex.value = 0;
			}
			function onClickOutside(event) {
				if (ui_vue3.toValue(searchPanel) && !ui_vue3.toValue(searchPanel).contains(event.target) && ui_vue3.toValue(isOpenedSearchBar)) {
					closeAndResetSearch();
					ui_vue3.toValue(searchInputRef)?.collapseSearchBar();
				}
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				searchBarClassNames,
				isOpenedSearchBar,
				isDisabled,
				placeholderOrDefaultValue,
				searchResultTitleOrDefaultValue,
				seachText,
				labelResult,
				foundBlocks,
				onSearchBlocks,
				onClearSearch,
				closeAndResetSearch,
				onGoToNextBlock,
				onGoToPrevBlock
			};
		},
		template: `
		<div
			:class="searchBarClassNames"
			ref="searchPanel"
		>
			<SearchInput
				v-model:open="isOpenedSearchBar"
				:value="seachText"
				:placeholder="placeholderOrDefaultValue"
				:disabled="isDisabled"
				ref="searchInput"
				@update:value="onSearchBlocks"
				@clear="closeAndResetSearch"
			/>
			<div
				v-if="foundBlocks.length > 0"
				class="ui-block-diagram-search-bar__search-result"
			>
				<SearchResult
					:title="searchResultTitleOrDefaultValue"
					:count="labelResult"
				>
					<SearchNavBtn
						:iconName="iconSet.CHEVRON_LEFT_L"
						:data-test-id="$blockDiagramTestId('searchResultPrevBtn')"
						@click="onGoToPrevBlock"
					/>
					<SearchNavBtn
						:iconName="iconSet.CHEVRON_RIGHT_L"
						:data-test-id="$blockDiagramTestId('searchResultNextBtn')"
						@click="onGoToNextBlock"
					/>
				</SearchResult>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResizableBlock = {
		name: 'resizable-block',
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			minWidth: {
				type: Number,
				default: 100
			},
			minHeight: {
				type: Number,
				default: 100
			},
			highlighted: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				block,
				minWidth,
				minHeight
			} = ui_vue3.toRefs(props);
			const blockRef = ui_vue3.useTemplateRef('blockEl');
			const {
				isHiglitedBlock,
				isDisabled,
				onMountedBlock,
				onUnmountedBlock
			} = useBlockState({
				block,
				blockRef
			});
			const highlightedBlocks = useHighlightedBlocks();
			const {
				isDragged,
				blockPositionStyle
			} = useMoveableBlock(blockRef, block);
			const {
				isResize,
				sizeBlockStyle,
				blockDimensions,
				onMounted: onMountedResizableBlock,
				onUnmounted: onUnmountedResizableBlock
			} = useResizableBlock({
				block,
				minWidth,
				minHeight,
				leftSideRef: ui_vue3.useTemplateRef('leftSide'),
				topSideRef: ui_vue3.useTemplateRef('topSide'),
				rightSideRef: ui_vue3.useTemplateRef('rightSide'),
				bottomSideRef: ui_vue3.useTemplateRef('bottomSide'),
				leftTopCornerRef: ui_vue3.useTemplateRef('leftTopCorner'),
				rightTopCornerRef: ui_vue3.useTemplateRef('rightTopCorner'),
				rightBottomCornerRef: ui_vue3.useTemplateRef('rightBottomCorner'),
				leftBottomCornerRef: ui_vue3.useTemplateRef('leftBottomCorner')
			});
			const blockStyle = ui_vue3.computed(() => {
				return {
					...ui_vue3.toValue(blockPositionStyle),
					...ui_vue3.toValue(sizeBlockStyle)
				};
			});
			ui_vue3.watch(isResize, resizeStatus => {
				if (resizeStatus) {
					highlightedBlocks.clear();
					highlightedBlocks.add(props.block.id);
				}
			});
			ui_vue3.watch(() => props.highlighted, value => {
				if (value) {
					highlightedBlocks.add(props.block.id);
				} else {
					highlightedBlocks.remove(props.block.id);
				}
			});
			ui_vue3.onMounted(() => {
				onMountedBlock();
				onMountedResizableBlock();
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedBlock();
				onUnmountedResizableBlock();
			});
			function onMouseDownSelectBlock() {
				highlightedBlocks.clear();
				highlightedBlocks.add(props.block.id);
			}
			return {
				isHiglitedBlock,
				isDisabled,
				isResize,
				isDragged,
				blockStyle,
				blockDimensions,
				onMouseDownSelectBlock
			};
		},
		template: `
		<div
			:style="blockStyle"
			ref="blockEl"
			class="ui-block-diagram-resizable-block"
			@mousedown="onMouseDownSelectBlock"
		>
			<div class="ui-block-diagram-resizable-block__container">
				<div
					ref="leftSide"
					class="ui-block-diagram-resizable-block__left-side"
				/>
				<div
					ref="topSide"
					class="ui-block-diagram-resizable-block__top-side"
				/>
				<div
					ref="rightSide"
					class="ui-block-diagram-resizable-block__right-side"
				/>
				<div
					ref="bottomSide"
					class="ui-block-diagram-resizable-block__bottom-side"
				/>
				<div
					ref="leftTopCorner"
					class="ui-block-diagram-resizable-block__top-left-corner"
				/>
				<div
					ref="rightTopCorner"
					class="ui-block-diagram-resizable-block__top-right-corner"
				/>
				<div
					ref="rightBottomCorner"
					class="ui-block-diagram-resizable-block__bottom-right-corner"
				/>
				<div
					ref="leftBottomCorner"
					class="ui-block-diagram-resizable-block__bottom-left-corner"
				/>

				<slot
					:block="block"
					:isHighlighted="isHiglitedBlock"
					:isDragged="isDragged"
					:isResize="isResize"
					:isDisabled="isDisabled"
					:width="blockDimensions.width"
					:height="blockDimensions.height"
				/>
			</div>
		</div>
	`
	};

	const DEFAULT_SELECTION_PADDING = 17;
	const DEFAULT_BLOCK_SIZE = {
		width: 150,
		height: 100
	};
	const GroupSelectionBox = {
		name: 'GroupSelectionBox',
		props: {
			menuItems: {
				type: Array,
				default: () => []
			},
			padding: {
				type: [Number, Object],
				default: DEFAULT_SELECTION_PADDING
			},
			defaultBlockSize: {
				type: Object,
				default: DEFAULT_BLOCK_SIZE
			}
		},
		setup(props) {
			const highlightedBlocks = useHighlightedBlocks();
			const {
				selectionWorldRect,
				isSelectionActive
			} = useBlockDiagram();
			const {
				showMenu,
				closeContextMenu
			} = useContextMenu();
			const {
				onCanvasSelect,
				onSelectionStart,
				groupSelectionStyle
			} = useGroupSelectionLogic(closeContextMenu, {
				padding: ui_vue3.computed(() => props.padding),
				defaultBlockSize: props.defaultBlockSize
			});
			ui_vue3.watch(selectionWorldRect, newRect => {
				onCanvasSelect(newRect);
			});
			ui_vue3.watch(isSelectionActive, isActive => {
				if (isActive) {
					onSelectionStart();
				}
			});
			const {
				onGroupMouseDown
			} = useGroupDragLogic(closeContextMenu);
			function onGroupContextMenu(event) {
				const ids = ui_vue3.toValue(highlightedBlocks.highlitedBlockIds);
				if (!ids || ids.length === 0 || props.menuItems.length === 0) {
					return;
				}
				showMenu({
					clientX: event.clientX,
					clientY: event.clientY
				}, {
					items: props.menuItems
				});
			}
			return {
				groupSelectionStyle,
				onGroupMouseDown,
				onGroupContextMenu
			};
		},
		template: `
		<div
			v-if="groupSelectionStyle"
			:style="groupSelectionStyle"
			class="ui-block-diagram-group-box"
			data-testid="ui-block-diagram-group-box"
			@mousedown.stop="onGroupMouseDown"
		>
			<div
				class="ui-block-diagram-group-box__layout"
				@contextmenu.prevent.stop="onGroupContextMenu"
			>
			</div>
		</div>
	`
	};

	let copiedDragItem = null;
	function onDragStart(event, value) {
		const {
			dragData,
			dragImage
		} = main_core.Type.isFunction(value) ? value() : value;
		copiedDragItem = ui_vue3.toValue(dragImage).cloneNode(true).children[0];
		const wrapper = document.getElementById('blockDiagramDragWrapper');
		main_core.Dom.append(copiedDragItem, wrapper);
		main_core.Dom.style(copiedDragItem, {
			display: 'block',
			position: 'absolute',
			top: 0,
			left: 0
		});
		const {
			width,
			height
		} = copiedDragItem.getBoundingClientRect();
		const dragImageScale = resolveDragImageScale(width, height);
		if (dragImageScale < 1) {
			main_core.Dom.style(copiedDragItem, {
				zoom: dragImageScale
			});
		}

		// anchor on the size the bitmap is actually rendered at, which also keeps the anchor correct
		// in browsers that ignore zoom (Firefox below 126)
		const rendered = copiedDragItem.getBoundingClientRect();
		event.dataTransfer.setDragImage(copiedDragItem, rendered.width / 2, rendered.height / 2);
		event.dataTransfer.setData('text/plain', JSON.stringify({
			...ui_vue3.toValue(dragData),
			dimensions: {
				width,
				height
			}
		}));
	}
	function onDragEnd(event) {
		main_core.Dom.remove(copiedDragItem);
		copiedDragItem = null;
	}
	function initDragItemWrapper() {
		const hasWrapper = document.getElementById('blockDiagramDragWrapper');
		if (hasWrapper) {
			return;
		}
		const wrapper = main_core.Tag.render`
		<div>
			<div
				id="blockDiagramDragWrapper"
				style="position: relative; width: 100%; height: 100%;"
			>
			</div>
		</div>
	`;
		main_core.Dom.append(wrapper, document.body);
		main_core.Dom.style(wrapper, {
			position: 'absolute',
			transform: 'translate(-100%, -100%)',
			top: 0,
			right: 0
		});
	}
	const DragBlock = {
		mounted(el, {
			arg,
			value
		}) {
			initDragItemWrapper();
			main_core.Dom.attr(el, 'draggable', 'true');
			main_core.Event.bind(el, 'dragstart', event => onDragStart(event, value));
			main_core.Event.bind(el, 'dragend', event => onDragEnd());
		},
		unmounted(el, {
			arg,
			value
		}) {
			main_core.Event.unbind(el, 'dragstart', event => onDragStart(event, value));
			main_core.Event.unbind(el, 'dragend', event => onDragEnd());
		}
	};

	exports.ANIMATED_TYPES = ANIMATED_TYPES;
	exports.BlockDiagram = BlockDiagram;
	exports.Connection = Connection;
	exports.DeleteConnectionBtn = DeleteConnectionBtn;
	exports.DragBlock = DragBlock;
	exports.GroupSelectionBox = GroupSelectionBox;
	exports.HistoryBar = HistoryBar;
	exports.MoveableBlock = MoveableBlock;
	exports.PORT_POSITION = PORT_POSITION;
	exports.Port = Port;
	exports.ResizableBlock = ResizableBlock;
	exports.SOURCE_PORT_STUB_SLOT_NAME = SOURCE_PORT_STUB_SLOT_NAME;
	exports.SearchBar = SearchBar;
	exports.TARGET_PORT_STUB_SLOT_NAME = TARGET_PORT_STUB_SLOT_NAME;
	exports.ZoomBar = ZoomBar;
	exports.transformPoint = transformPoint;
	exports.useAnimationQueue = useAnimationQueue;
	exports.useAutoScroll = useAutoScroll;
	exports.useBlockDiagram = useBlockDiagram;
	exports.useBlockState = useBlockState;
	exports.useCanvas = useCanvas;
	exports.useConnectionState = useConnectionState;
	exports.useContextMenu = useContextMenu;
	exports.useDragAndDrop = useDragAndDrop;
	exports.useGroupDragLogic = useGroupDragLogic;
	exports.useGroupSelectionLogic = useGroupSelectionLogic;
	exports.useHighlightedBlocks = useHighlightedBlocks;
	exports.useHistory = useHistory;
	exports.useKeyboardShortcuts = useKeyboardShortcuts;
	exports.useMoveableBlock = useMoveableBlock;
	exports.useNewConnectionState = useNewConnectionState;
	exports.usePortState = usePortState;
	exports.useResizableBlock = useResizableBlock;
	exports.useSearchBlocks = useSearchBlocks;

})(this.BX.UI = this.BX.UI || {}, BX.Vue3, BX, BX.Main, BX, BX.UI.IconSet);
//# sourceMappingURL=block-diagram.bundle.js.map
