/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue3, main_core, main_popup, ui_a11y, main_polyfill_intersectionobserver, ui_iconSet_api_vue, ui_system_tooltip_vue, ui_system_tooltip) {
	'use strict';

	const CONNECTION_OFFSET = 30;
	const CONNECTION_BEND_OFFSET = 30;
	const CONNECTION_BORDER_RADIUS = 10;

	// Screen distance the pointer has to travel before a press on a block turns into a drag.
	// A press below it stays a selection: with snapping on, treating the shake of a hand as a
	// drag would move a block of an old scheme to the nearest node and dirty the draft.
	const DRAG_START_THRESHOLD = 4;

	// Screen pixels per second the camera travels while an arrow key is held. Screen, not world: the
	// picture travels the same way at any zoom.
	const KEYBOARD_PAN_SPEED = 700;

	// How long the camera takes to reach that speed, and to come back to a stop once the key is
	// released. Short on purpose: it takes the jolt out of both ends of a hold without letting the
	// speed grow the longer the key is down.
	const KEYBOARD_PAN_RAMP_DURATION = 120;

	// The combo the command that fits the whole scheme into the free part of the screen ships with.
	const FIT_TO_VIEW_SHORTCUT = ['Shift', '1'];

	// Max never-measured connection ends mounted for measurement per render cycle, so a
	// large off-screen set drains over several frames instead of one long main-thread task.
	const FIRST_MEASURE_BATCH_SIZE = 12;

	// Hard lower bound of the camera zoom, two orders below any plausible overview scale. It keeps the
	// inverse scale where the Float32Array matrices still represent whole canvas units exactly.
	const ZOOM_FLOOR = 1e-4;
	const HOOK_NAMES = {
		CHANGED_BLOCKS: 'changedBlocks',
		CHANGED_CONNECTIONS: 'changedConnections',
		START_DRAG_BLOCK: 'startDragBlock',
		MOVE_DRAG_BLOCK: 'moveDragBlock',
		END_DRAG_BLOCK: 'endDragBlock',
		// Raised once for a canvas gesture of any kind that reached the model. The three hooks above
		// stay what they are: only the node drag raises them.
		END_GESTURE: 'endGesture',
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
		PASTE_BLOCKS: 'pasteBlocks',
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

	// Stacking scale inside the canvas context, blocks and connections alike: the connection rests at
	// 0 and rises to 2 under the cursor, its preview stands at 6 and the one being created at 7, the
	// selection frame at 90 and the selection box at 9999.
	const BLOCK_INDEXES = {
		// Added on top of the step a participant already has, so a raised set keeps its inner order and
		// lands in the free band 9-15: whole above the connection being created, whole below the frame.
		ELEVATION_OFFSET: 10,
		HOVERED: 5,
		HIGHLITED: 4,
		MOVABLE: 3,
		STANDING: 2,
		// Resting step of the backdrop, the same value its stylesheet states.
		BACKDROP: -1
	};

	// The canvas publishes the addition on its root so the stylesheets of the extension raise by the
	// very number the resolver adds, instead of repeating it. Outside the canvas the variable is
	// undefined and nothing is raised.
	const ELEVATION_OFFSET_CSS_VARIABLE = '--ui-block-diagram-elevation-offset';

	// Published the same way, and for the same reason: the flash of the placement feedback and the
	// state behind it expire together, so the stylesheets take the duration from the timer that owns it
	// instead of stating a number of their own.
	const DISPLACED_DURATION_CSS_VARIABLE = '--ui-block-diagram-displaced-duration';
	const INPUT_TAGS = Object.freeze({
		INPUT: true,
		TEXTAREA: true,
		SELECT: true
	});
	const MOUSE_BUTTON = Object.freeze({
		LEFT: 0,
		MIDDLE: 1,
		RIGHT: 2
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

	// The lower bound is the one carrying the safety invariant, so the property validator and the
	// diagnostics of the pair have to judge it by one and the same rule.
	function isValidMinZoom(value) {
		return Number.isFinite(value) && value >= ZOOM_FLOOR;
	}

	// The floor of the scale, applied wherever a scale is written. An unreadable bound falls back to
	// its freest safe value and in an inverted pair the lower one wins: bounds come from the consumer,
	// and refusing to serve a gesture over a typo in a setting breaks more than it fixes. A request
	// that is not a number leaves the scale where it was.
	function clampZoom(zoom, minZoom, maxZoom, fallback) {
		if (!Number.isFinite(zoom)) {
			return fallback;
		}
		const lowerBound = Number.isFinite(minZoom) ? Math.max(minZoom, ZOOM_FLOOR) : ZOOM_FLOOR;
		const upperBound = Number.isFinite(maxZoom) ? Math.max(maxZoom, lowerBound) : Number.POSITIVE_INFINITY;
		return Math.min(upperBound, Math.max(lowerBound, zoom));
	}

	function viewportToCanvas({
		x,
		y
	}, {
		width,
		height
	}, viewProjectionMatrixInv) {
		const canvas = transformMat3(create(), [x / width * 2 - 1, (1 - y / height) * 2 - 1], viewProjectionMatrixInv);
		return {
			x: canvas[0],
			y: canvas[1]
		};
	}

	class Camera {
		#state = null;
		#x = 0;
		#y = 0;
		#zoom = 1;
		#width = 0;
		#height = 0;
		#matrix = create$4();
		#projectionMatrix = create$4();
		#viewMatrix = create$4();
		#viewProjectionMatrix = create$4();
		#viewProjectionMatrixInv = create$4();
		constructor(ctx) {
			this.#state = ctx.state;
			this.#updateMatrix();
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
		get zoom() {
			return this.#zoom;
		}
		set zoom(zoom) {
			const clampedZoom = this.#clampZoom(zoom);
			if (this.#zoom !== clampedZoom) {
				this.#zoom = clampedZoom;
				this.#updateMatrix();
				this.#publishTransform();
			}
		}
		get x() {
			return this.#x;
		}
		set x(x) {
			if (this.#x !== x) {
				this.#x = x;
				this.#updateMatrix();
				this.#publishTransform();
			}
		}
		get y() {
			return this.#y;
		}
		set y(y) {
			if (this.#y !== y) {
				this.#y = y;
				this.#updateMatrix();
				this.#publishTransform();
			}
		}
		get width() {
			return this.#width;
		}
		get height() {
			return this.#height;
		}
		resize(width, height) {
			this.#width = width;
			this.#height = height;
			projection(this.#projectionMatrix, width, height);
			this.#updateViewProjectionMatrix();
			this.#publishViewportSize();
		}
		createLandmark(params = {}) {
			return {
				zoom: this.#zoom,
				x: this.#x,
				y: this.#y,
				anchorToViewport: false,
				viewportX: 0,
				viewportY: 0,
				...params
			};
		}
		applyLandmark(landmark) {
			const {
				x,
				y,
				zoom,
				anchorToViewport,
				viewportX,
				viewportY
			} = landmark;
			// Anchoring needs a sized viewport: the reverse projection divides by it.
			const canAnchor = anchorToViewport && this.#width > 0 && this.#height > 0;
			const anchor = canAnchor ? this.#viewportToCanvas({
				x: viewportX,
				y: viewportY
			}) : null;
			this.#zoom = this.#clampZoom(zoom);
			this.#x = x;
			this.#y = y;
			this.#updateMatrix();
			if (anchor) {
				const shifted = this.#viewportToCanvas({
					x: viewportX,
					y: viewportY
				});
				this.#x += anchor.x - shifted.x;
				this.#y += anchor.y - shifted.y;
				this.#updateMatrix();
			}
			this.#publishTransform();
		}

		// Both axes at once: the pair of setters rebuilds the matrices and publishes the
		// state twice, and a drag asks for a new position on every pointer move.
		setPosition(x, y) {
			if (this.#x === x && this.#y === y) {
				return;
			}
			this.#x = x;
			this.#y = y;
			this.#updateMatrix();
			this.#publishTransform();
		}

		// Screen pixels in: the delta becomes world units inside the camera. Callers tick
		// every frame, so an idle delta must leave the matrices and the state untouched.
		panBy(dxScreen, dyScreen) {
			if (dxScreen === 0 && dyScreen === 0) {
				return;
			}
			this.#x += dxScreen / this.#zoom;
			this.#y += dyScreen / this.#zoom;
			this.#updateMatrix();
			this.#publishTransform();
		}
		#viewportToCanvas(point) {
			return viewportToCanvas(point, {
				width: this.#width,
				height: this.#height
			}, this.#viewProjectionMatrixInv);
		}

		// Bounds are re-read from the state on every call rather than cached: the consumer changes them
		// on the fly, and the clamp runs on every frame of a gesture.
		#clampZoom(zoom) {
			return clampZoom(zoom, this.#state.minZoom, this.#state.maxZoom, this.#zoom);
		}
		#publishTransform() {
			this.#state.transformX = this.#x;
			this.#state.transformY = this.#y;
			this.#state.zoom = this.#zoom;
		}
		#publishViewportSize() {
			this.#state.canvasWidth = this.#width;
			this.#state.canvasHeight = this.#height;
		}
		#updateMatrix() {
			const zoomScale = 1 / this.#zoom;
			identity(this.#matrix);
			translate(this.#matrix, this.#matrix, [this.#x, this.#y]);
			scale(this.#matrix, this.#matrix, [zoomScale, zoomScale]);
			invert(this.#viewMatrix, this.#matrix);
			this.#updateViewProjectionMatrix();
		}
		#updateViewProjectionMatrix() {
			multiply(this.#viewProjectionMatrix, this.#projectionMatrix, this.#viewMatrix);
			invert(this.#viewProjectionMatrixInv, this.#viewProjectionMatrix);
		}
	}

	// How long the overview takes to reach a new destination. A quarter of a second is long enough to be
	// read as a move rather than a jump - the point of the move is that a person sees where they were
	// taken - and short enough not to stand between them and the next thing they do. The value belongs
	// here and not to the caller: the length of the move is a property of the canvas, not of a command.
	const CAMERA_TRANSITION_DURATION_MS = 250;

	// Where the overview stands: the position of the camera and its scale. The anchored form of a
	// landmark has no meaning here - a move interpolates absolute states.

	function clampProgress(progress) {
		return Math.min(Math.max(progress, 0), 1);
	}

	// Ease-out cubic: the move leaves at full speed and settles into the destination, so the eye follows
	// where it lands instead of where it left.
	function easeOut(progress) {
		return 1 - (1 - progress) ** 3;
	}
	function interpolate(from, to, progress) {
		return from + (to - from) * progress;
	}
	function isPositiveScale(value) {
		return Number.isFinite(value) && value > 0;
	}

	/**
	 * The scale steps by a constant ratio rather than by a constant amount: to the eye a move from 0.25
	 * to 1 is the same size of change as one from 1 to 4, and a linear step would crawl through the
	 * first half of such a move and rush the second. A scale that is not positive has no ratio to step
	 * by - the camera repairs such a value itself - so the move falls back to the even step.
	 */
	function interpolateZoom(from, to, progress) {
		if (!isPositiveScale(from) || !isPositiveScale(to)) {
			return interpolate(from, to, progress);
		}
		return from * (to / from) ** progress;
	}

	/**
	 * A move of the overview to a destination over time. It keeps where the camera started, where it has
	 * to arrive and how far along it is; every frame it computes the state in between and hands it to
	 * the camera the same way every other operation of the canvas does - through a landmark.
	 *
	 * The move keeps no clock and no frame loop of its own: the timestamp comes from the caller, which
	 * is the loop the canvas already draws in. That is what makes the whole object testable without
	 * fake timers, and what keeps one loop in the extension instead of two.
	 *
	 * The bounds of the scale are not checked here at all: the camera owns them and applies them to
	 * every frame, exactly as it does to a jump.
	 */
	class CameraTransition {
		#camera;
		#from = null;
		#to = null;
		#startedAt = null;
		constructor(camera) {
			this.#camera = camera;
		}
		get isRunning() {
			return this.#to !== null;
		}

		/**
		 * Aims the camera at a new destination from wherever it stands now. At most one move is alive:
		 * a second destination replaces the first instead of racing it for the camera.
		 */
		start(target) {
			this.cancel();
			this.#from = {
				x: this.#camera.x,
				y: this.#camera.y,
				zoom: this.#camera.zoom
			};
			this.#to = {
				x: target.x,
				y: target.y,
				zoom: target.zoom
			};
			// The first frame sets the origin of the clock, so a move started long before it gets its full
			// length rather than arriving already finished.
			this.#startedAt = null;
		}

		// Stops where the camera stands and writes nothing more: the input of a person wins over a move
		// that is still running, and a stopped move must not drag the camera on afterwards.
		cancel() {
			this.#from = null;
			this.#to = null;
			this.#startedAt = null;
		}

		// One frame of the move. Answers whether the camera was written to, so a caller can tell an idle
		// frame from a moving one.
		step(now) {
			if (this.#to === null) {
				return false;
			}
			if (this.#startedAt === null) {
				this.#startedAt = now;
			}
			const progress = clampProgress((now - this.#startedAt) / CAMERA_TRANSITION_DURATION_MS);
			if (progress >= 1) {
				const target = this.#to;
				// Closed before the last write: the move ends exactly on the destination, never on the
				// frame before it, and leaves nothing running behind it.
				this.cancel();
				this.#apply(target);
				return true;
			}
			const eased = easeOut(progress);
			this.#apply({
				x: interpolate(this.#from.x, this.#to.x, eased),
				y: interpolate(this.#from.y, this.#to.y, eased),
				zoom: interpolateZoom(this.#from.zoom, this.#to.zoom, eased)
			});
			return true;
		}
		#apply(state) {
			this.#camera.applyLandmark(this.#camera.createLandmark(state));
		}
	}

	/**
	 * A record of a map read strictly as an own property: keys come from an untrusted graph owned
	 * by the consumer of the extension, so a plain lookup would answer an inherited prototype member
	 * (constructor, toString) where the map holds no record at all. A missing or non-object map
	 * reads as an empty one, so a reactive source and a plain object are both accepted. An own
	 * record holding null or undefined reads as a missing one, so a consumer filling the gaps
	 * overwrites such a key with a fresh record.
	 */
	function getOwnRecord(map, key) {
		const records = ui_vue3.toValue(map);
		if (!main_core.Type.isObjectLike(records) || !Object.hasOwn(records, key)) {
			return null;
		}
		return records[key] ?? null;
	}

	// A node whose model position is unusable is left out: one non-finite coordinate spreads NaN over
	// the whole box.
	function getUsablePosition(block) {
		const position = ui_vue3.toValue(block)?.position;
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
	}

	// Size of a node for the geometry of the selection: the geometry measured on its mount, then the
	// dimensions of the model, then the default size of the diagram. Reading it off the cache instead
	// of the markup keeps a frame of a gesture free of synchronous layout.
	function getSelectionBlockSize(block, blocksRectMap, defaultBlockSize) {
		const measured = getOwnRecord(blocksRectMap, ui_vue3.toValue(block).id);
		if (main_core.Type.isObjectLike(measured) && Number.isFinite(measured.width) && Number.isFinite(measured.height)) {
			return {
				width: measured.width,
				height: measured.height
			};
		}
		const dimensions = ui_vue3.toValue(block).dimensions;
		return {
			width: dimensions?.width || defaultBlockSize.width,
			height: dimensions?.height || defaultBlockSize.height
		};
	}

	const vertexShader$1 = `
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
	const fragmentShader$1 = `
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

	const vertexShader = `
	precision mediump float;

	attribute vec2 a_Position;
	attribute vec2 a_Center;
	attribute vec2 a_HalfSize;
	attribute vec4 a_Color;
	// x - corner radius, y - half of the outline width (zero means a filled shape)
	attribute vec2 a_Shape;

	uniform vec2 u_Resolution;

	varying vec2 v_Local;
	varying vec2 v_HalfSize;
	varying vec4 v_Color;
	varying vec2 v_Shape;

	void main() {
		v_Local = a_Position - a_Center;
		v_HalfSize = a_HalfSize;
		v_Color = a_Color;
		v_Shape = a_Shape;

		// Map pixels grow right and down, clip space grows right and up.
		vec2 clip = (a_Position / u_Resolution) * 2.0 - 1.0;
		gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
	}
`;
	const fragmentShader = `
	precision mediump float;

	// Half-width of the coverage ramp, in map pixels. It is driven by pixel density, so the
	// edge fades over the same distance on the screen whatever the density is.
	uniform float u_EdgeSoftness;

	varying vec2 v_Local;
	varying vec2 v_HalfSize;
	varying vec4 v_Color;
	varying vec2 v_Shape;

	// Signed distance to a rounded rectangle centered at the origin: negative inside,
	// positive outside, zero on the edge. This is what gives the corners their radius
	// without a single extra vertex.
	float rounded_box(vec2 point, vec2 halfSize, float radius) {
		vec2 corner = abs(point) - halfSize + radius;

		return min(max(corner.x, corner.y), 0.0) + length(max(corner, 0.0)) - radius;
	}

	void main() {
		float radius = min(v_Shape.x, min(v_HalfSize.x, v_HalfSize.y));
		float edge = rounded_box(v_Local, v_HalfSize, radius);
		// A non-zero outline width turns the shape into a band of that width centered on the
		// edge - the same way a stroked rectangle is drawn.
		float shape = v_Shape.y > 0.0 ? abs(edge) - v_Shape.y : edge;
		float coverage = 1.0 - smoothstep(-u_EdgeSoftness, u_EdgeSoftness, shape);

		gl_FragColor = vec4(v_Color.rgb, v_Color.a * coverage);
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
			this.#vertexShader = compileShader(this.#gl, vertexShader$1, this.#gl.VERTEX_SHADER);
			this.#fragmentShader = compileShader(this.#gl, fragmentShader$1, this.#gl.FRAGMENT_SHADER);
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

		// The context is the canvas's and outlives the grid on a rebinding, so everything built on
		// it goes back here rather than with the context being put out.
		destroy() {
			this.#gl.deleteProgram(this.#program);
			this.#gl.deleteShader(this.#vertexShader);
			this.#gl.deleteShader(this.#fragmentShader);
			this.#gl.deleteBuffer(this.#gridPositionBuffer);
			this.#program = null;
			this.#vertexShader = null;
			this.#fragmentShader = null;
			this.#gridPositionBuffer = null;
		}
	}

	// What the caller of the fit brings: the box of the scheme plus the optional settings of the
	// command. The size of the viewport is not among them - it belongs to the canvas.

	/**
	 * Where the overview has to end up: the canvas point `center` stands at the viewport pixel
	 * `viewportPoint` at scale `zoom`. The camera position is derived from it rather than carried in
	 * it, so a caller whose camera clamped the scale places the content by the scale it actually took.
	 */

	// The overview is not enlarged past the natural size of the scheme: a single small node blown up
	// to the whole screen reads as a breakage rather than as a fit.
	const NATURAL_ZOOM = 1;

	// The size the geometry of the group frame gives a node the model says nothing about.
	const DEFAULT_BLOCK_SIZE$1 = {
		width: 150,
		height: 100
	};
	const NO_INSETS = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};
	function isUsableSize(value) {
		return Number.isFinite(value) && value > 0;
	}
	function toFiniteNumber(value) {
		const number = Number(value);
		return Number.isFinite(number) ? number : 0;
	}

	// Insets come from a consumer that redraws its panels while the diagram stays mounted, so an
	// absent or half-filled set of edges is an ordinary input, not a programming error.
	function resolveInsets(insets) {
		const source = ui_vue3.toValue(insets);
		if (!main_core.Type.isObjectLike(source)) {
			return NO_INSETS;
		}
		return {
			top: toFiniteNumber(source.top),
			right: toFiniteNumber(source.right),
			bottom: toFiniteNumber(source.bottom),
			left: toFiniteNumber(source.left)
		};
	}

	/**
	 * Bounding box of the whole scheme in canvas coordinates. The source is the model of the scheme:
	 * under the render optimization the nodes outside the screen are not mounted and have no measured
	 * geometry at all, so a box built from the measured rectangles alone would cover the visible part
	 * only. Connections stay out of it - their route is derived from the nodes. A node whose position
	 * or size is unusable is left out, by the same rules the group frame follows.
	 */
	function getDiagramBounds(blocks, blocksRectMap = {}, defaultBlockSize = DEFAULT_BLOCK_SIZE$1) {
		const list = ui_vue3.toValue(blocks);
		if (!main_core.Type.isArray(list)) {
			return null;
		}
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		let hasBlocks = false;
		list.forEach(block => {
			const position = getUsablePosition(block);
			if (position === null) {
				return;
			}
			const size = getSelectionBlockSize(block, blocksRectMap, defaultBlockSize);
			const width = Number(size.width);
			const height = Number(size.height);

			// A node sized by a broken model value would spread that value over the whole box.
			if (!isUsableSize(width) || !isUsableSize(height)) {
				return;
			}
			hasBlocks = true;
			minX = Math.min(minX, position.x);
			minY = Math.min(minY, position.y);
			maxX = Math.max(maxX, position.x + width);
			maxY = Math.max(maxY, position.y + height);
		});
		if (!hasBlocks) {
			return null;
		}
		return {
			minX,
			minY,
			maxX,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}

	/**
	 * Target overview for the whole scheme: the largest scale at which the box still fits the free
	 * part of the viewport, and the point of that part the box is centred on. The free part is what
	 * the viewport keeps after the edges the panels of the consumer cover and a margin along every
	 * side. An empty scheme returns the starting overview of the editor - the natural scale with the
	 * origin of the scheme in the middle of the free part - and a free part that has no room left
	 * returns nothing at all, so the overview stays where the person put it.
	 *
	 * The scale is not bounded from below here: the camera owns the bounds of the scale and applies
	 * them on every path.
	 */
	function getFitToViewTarget(options) {
		const {
			bounds = null,
			viewportWidth = 0,
			viewportHeight = 0,
			insets,
			padding = GRID_DEFAULT_SIZE,
			maxFitZoom = NATURAL_ZOOM
		} = options ?? {};
		const edges = resolveInsets(insets);
		const margin = Math.max(toFiniteNumber(padding), 0);
		const viewWidth = toFiniteNumber(viewportWidth);
		const viewHeight = toFiniteNumber(viewportHeight);
		const freeWidth = viewWidth - edges.left - edges.right - 2 * margin;
		const freeHeight = viewHeight - edges.top - edges.bottom - 2 * margin;

		// An unmounted canvas and panels wider than the canvas itself come out the same way: there is
		// no area to fit anything into, so the overview is left alone.
		if (freeWidth <= 0 || freeHeight <= 0) {
			return null;
		}

		// The margin drops out of the centre of the free area: it is the same on both sides.
		const freeCenter = {
			x: (viewWidth + edges.left - edges.right) / 2,
			y: (viewHeight + edges.top - edges.bottom) / 2
		};
		if (bounds === null) {
			return {
				zoom: NATURAL_ZOOM,
				center: {
					x: 0,
					y: 0
				},
				viewportPoint: freeCenter
			};
		}
		const scaleX = freeWidth / bounds.width;
		const scaleY = freeHeight / bounds.height;
		const zoom = Math.min(scaleX, scaleY, maxFitZoom);
		return {
			zoom,
			center: {
				x: bounds.minX + bounds.width / 2,
				y: bounds.minY + bounds.height / 2
			},
			viewportPoint: freeCenter
		};
	}

	// Camera position the target asks for at the given scale: a viewport pixel is that many canvas
	// units away from the origin of the camera.
	function getFitCameraPosition(target, zoom) {
		return {
			x: target.center.x - target.viewportPoint.x / zoom,
			y: target.center.y - target.viewportPoint.y / zoom
		};
	}

	const ZOOM_FRACTION_DIGITS = 1;
	class Canvas {
		#camera = null;
		// The bounds of the scale live in the state of the diagram and the consumer changes them on the
		// fly; the canvas only reads them, and only where a destination has to be known in advance.
		#state = null;
		#cameraTransition = null;
		#dpr = window.devicePixelRatio || 1;
		#element = null;
		// The very same context object the canvas style works on: getContext answers one context
		// per pair of element and type. The canvas holds it for the drawing area alone - the style
		// sets that area once when it is built, and only the canvas hears about a resize - and puts
		// it out at detach, after the style has released what it built on it.
		#context = null;
		#width = 0;
		#height = 0;
		#canvasStyleInstance = null;
		#startInvertViewProjectionMatrix = create$4();
		#startCameraX = 0;
		#startCameraY = 0;
		#startPos = create();
		#resizeObserver = null;
		constructor(ctx) {
			this.#camera = ctx.camera;
			this.#state = ctx.state;
			this.#cameraTransition = new CameraTransition(ctx.camera);
		}
		get viewMatrix() {
			return this.#camera.viewMatrix;
		}
		get camera() {
			return this.#camera;
		}
		get isAttached() {
			return this.#element !== null;
		}

		// A repeated attach is a race of the lifecycle, not a programming error: the same element
		// changes nothing, another one rebinds the canvas. Only an argument that cannot carry a
		// drawing context throws.
		attach(element, canvasStyle = null) {
			if (!main_core.Type.isFunction(element?.getContext)) {
				throw new TypeError('ui.block-diagram: canvas needs a canvas element to attach to');
			}
			if (this.#element === element) {
				return;
			}
			this.detach();
			this.#element = element;
			this.#context = element.getContext('webgl');
			const {
				width,
				height
			} = element.getBoundingClientRect();
			this.#resize(width, height);
			this.#initCanvasStyle(canvasStyle);
			this.#initResizeObserver();
		}

		// The other half of that contract: a caller that names the element it attached to leaves a
		// binding made by someone else alone. Without an element the current binding is dropped.
		detach(element = null) {
			if (!this.isAttached || element !== null && this.#element !== element) {
				return;
			}

			// An unfinished move must not outlive the binding: its frames would go on writing into the
			// state of a diagram that is no longer on the page.
			this.#cameraTransition.cancel();
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#canvasStyleInstance?.destroy();
			this.#canvasStyleInstance = null;

			// The drawing context must not outlive the element it was created on.
			this.#context?.getExtension('WEBGL_lose_context')?.loseContext();
			this.#context = null;
			this.#element = null;
			this.#width = 0;
			this.#height = 0;
		}

		// The element is measured in logical pixels, the drawing buffer is sized in physical ones,
		// and the camera keeps working in logical pixels: the ratio between them is pixel density.
		//
		// Sizing recreates the buffer cleared, and the frame comes from the caller: render() draws
		// right after #syncSize(), and after attach() the frame arrives from the resize observer.
		#resize(width, height) {
			this.#width = Math.round(width * this.#dpr);
			this.#height = Math.round(height * this.#dpr);
			this.#element.width = this.#width;
			this.#element.height = this.#height;
			this.#context?.viewport(0, 0, this.#width, this.#height);
			this.#camera.resize(width, height);
		}

		// The resize observer speaks after the frame callbacks of the frame it belongs to, while the
		// element is laid out at its new size before them. A window being dragged by its edge changes
		// the size on every frame, so a frame that waits for the observer draws into a buffer already
		// smaller than the element, and the strip the buffer does not reach shows the element itself.
		// Measuring at the start of the frame closes that gap: by the time the observer speaks the
		// size is set and there is nothing left to change.
		//
		// The buffer is recreated only when it would come out a different size - a buffer recreated at
		// its own size is still a buffer cleared, and that would cost a cleared frame on every frame.
		#syncSize() {
			const {
				width,
				height
			} = this.#element.getBoundingClientRect();
			if (Math.round(width * this.#dpr) === this.#width && Math.round(height * this.#dpr) === this.#height) {
				return;
			}
			this.#resize(width, height);
		}

		// The style compiles shaders of its own and throws if they do not build. The canvas is more
		// than its background - the camera, the coordinates of a gesture and the drawing area all
		// hang on the binding - so a background that did not build costs the background alone: the
		// canvas stays bound, and render() already tolerates having no style.
		#initCanvasStyle(canvasStyle) {
			if (!canvasStyle) {
				return;
			}
			const StyleInstance = canvasStyle.instance;
			try {
				this.#canvasStyleInstance = new StyleInstance(this.#element, canvasStyle.options);
			} catch (error) {
				this.#canvasStyleInstance = null;
				console.error('ui.block-diagram: the canvas style did not build, the background is not drawn', error);
			}
		}

		// The observer calls render() from its own callback rather than sizing the buffer itself: the
		// draw is synchronous and lands inside the frame that changed the size, sizing stays in one
		// place, and going through render() keeps a canvas drawn on demand in step with its element.
		#initResizeObserver() {
			this.#resizeObserver = new ResizeObserver(() => {
				this.render();
			});
			this.#resizeObserver.observe(this.#element);
		}
		clientToViewport({
			x,
			y
		}) {
			const {
				left,
				top
			} = this.#element.getBoundingClientRect();
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
			} = this.#element.getBoundingClientRect();
			return {
				x: x + left,
				y: y + top
			};
		}

		/**
		 * One frame of the canvas. A running move of the overview is advanced first, so the background is
		 * drawn by the same camera state the layer above it is given. The timestamp comes from the frame
		 * loop that calls this - the canvas keeps no clock of its own.
		 */
		render(now = performance.now()) {
			// Stepped first and unconditionally: a transition is pure camera math, not a draw, so it
			// advances the same way whether or not there is a DOM element to paint into right now.
			this.#cameraTransition.step(now);
			if (!this.isAttached) {
				return;
			}
			this.#syncSize();
			this.#canvasStyleInstance?.render({
				projectionMatrix: this.#camera.projectionMatrix,
				viewMatrix: this.#camera.viewMatrix,
				viewProjectionMatrixInv: this.#camera.viewProjectionMatrixInv,
				zoomScale: this.#camera.zoom
			});
		}

		/**
		 * Drops a move of the overview that is still running. Every operation below that changes the
		 * overview starts with it: the input of a person always wins over a move, and the rule lives here
		 * rather than in every handler of the consumer. The frames of the move write to the camera
		 * directly and never come this way, so a move cannot cancel itself.
		 */
		cancelCameraTransition() {
			this.#cameraTransition.cancel();
		}
		setCamera(params) {
			this.cancelCameraTransition();
			this.#camera.applyLandmark(this.#camera.createLandmark({
				...params
			}));
		}
		panBy(dxScreen, dyScreen) {
			this.cancelCameraTransition();
			this.#camera.panBy(dxScreen, dyScreen);
		}

		// A step by the button is a discrete path and snaps to tenths, so that a chain of steps
		// stays on round values instead of drifting into 1.2000000000000002.
		#setCameraZoom(zoomStep) {
			this.setZoom(Number((this.#camera.zoom + zoomStep).toFixed(ZOOM_FRACTION_DIGITS)));
		}
		zoomIn(zoomStep) {
			this.#setCameraZoom(zoomStep);
		}
		zoomOut(zoomStep) {
			this.#setCameraZoom(zoomStep * -1);
		}

		// The value arrives as it was asked for: rounding lives on the discrete path alone. The
		// bounds of the zoom are the camera's business and hold on every path.
		setZoom(zoom) {
			this.cancelCameraTransition();
			this.#camera.applyLandmark(this.#camera.createLandmark({
				anchorToViewport: true,
				viewportX: this.#camera.width / 2,
				viewportY: this.#camera.height / 2,
				zoom
			}));
		}

		/**
		 * Brings the whole scheme into the free part of the viewport. The overview does not jump there:
		 * the canvas moves it over the frames that follow, so a person sees where they were taken. The
		 * size of the viewport is read off the camera rather than off the markup.
		 *
		 * The scale of the destination is trimmed by the same rule the camera applies to every write:
		 * the position of the destination is derived from the scale, so a scheme too wide for the lower
		 * bound has to be placed by the scale it will really get - otherwise it arrives off centre while
		 * the camera holds it at the bound. The bounds still belong to the camera and hold on every frame
		 * of the move; this is where the destination is read, not where the rule lives.
		 */
		fitToView(request) {
			const target = getFitToViewTarget({
				...request,
				viewportWidth: this.#camera.width,
				viewportHeight: this.#camera.height
			});
			if (target === null) {
				return;
			}
			const zoom = clampZoom(target.zoom, this.#state.minZoom, this.#state.maxZoom, this.#camera.zoom);
			this.#cameraTransition.start({
				zoom,
				...getFitCameraPosition(target, zoom)
			});
		}
		setCameraZoomByWheel(event, zoomChange = 0) {
			this.cancelCameraTransition();
			const viewport = this.clientToViewport({
				x: event.clientX,
				y: event.clientY
			});
			this.#camera.applyLandmark(this.#camera.createLandmark({
				anchorToViewport: true,
				viewportX: viewport.x,
				viewportY: viewport.y,
				zoom: this.#camera.zoom + zoomChange
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
			this.panBy(dx, dy);
		}

		// Zero is a valid pointer position, so the fallback belongs to a zero-sized element only:
		// substituting it for a pointer on the left or top edge jumps the camera.
		#getClipSpaceMousePosition(event) {
			const {
				left,
				top
			} = this.#element.getBoundingClientRect();
			const {
				clientWidth,
				clientHeight
			} = this.#element;
			const cssX = event.clientX - left;
			const cssY = event.clientY - top;
			const normalizedX = clientWidth > 0 ? cssX / clientWidth : this.#width / this.#dpr;
			const normalizedY = clientHeight > 0 ? cssY / clientHeight : this.#height / this.#dpr;
			const clipX = normalizedX * 2 - 1;
			const clipY = normalizedY * -2 + 1;
			return [clipX, clipY];
		}

		// The press itself moves nothing, but it is where a drag of the canvas begins: a move that went on
		// running under a held pointer would fight the hand that holds it.
		setCameraPositionByMouseDown(event) {
			this.cancelCameraTransition();
			copy(this.#startInvertViewProjectionMatrix, this.#camera.viewProjectionMatrixInv);
			this.#startCameraX = this.#camera.x;
			this.#startCameraY = this.#camera.y;
			transformMat3(this.#startPos, this.#getClipSpaceMousePosition(event), this.#startInvertViewProjectionMatrix);
		}
		setCameraPositionByMouseMove(event) {
			this.cancelCameraTransition();
			const pos = transformMat3(create(), this.#getClipSpaceMousePosition(event), this.#startInvertViewProjectionMatrix);
			this.#camera.setPosition(this.#startCameraX + this.#startPos[0] - pos[0], this.#startCameraY + this.#startPos[1] - pos[1]);
		}
	}

	// Color with alpha, components in the 0..1 range - the form the map renderer draws with.

	// A block as the map draws it: a snapshot of the few values the drawing path reads, and
	// nothing else. Keeping the block itself here would subscribe the layout to every property
	// of every node, and selecting a node or changing its status would rebuild the whole map.

	const MAP_PADDING = 50;
	const MAP_FRAME_BLOCK_TYPE = 'frame';

	// Extent of an empty map: twice the canvas, so the viewport frame takes a quarter of it and
	// the camera still has room to move around the origin.
	const MAP_EMPTY_EXTENT = 1000;
	const MAP_BLOCK_FALLBACK_WIDTH = 200;
	const MAP_BLOCK_FALLBACK_HEIGHT = 50;

	// Size of a block on the map: its own dimensions while they are known, the measured rect
	// otherwise. A half-known pair counts as unknown - a block with a width but no height has
	// never been measured as a whole.
	function getMapBlockSize(block, blocksRectMap = {}) {
		const dimensions = {
			width: block?.dimensions?.width,
			height: block?.dimensions?.height
		};
		if (!dimensions.width || !dimensions.height) {
			const measured = blocksRectMap?.[block?.id] ?? {};
			dimensions.width = measured.width ?? MAP_BLOCK_FALLBACK_WIDTH;
			dimensions.height = measured.height ?? MAP_BLOCK_FALLBACK_HEIGHT;
		}
		return dimensions;
	}

	// Bounding box of every block plus a padding, and the drawing order: frames first, because
	// their fill colors are opaque and a frame is the background under the nodes it groups, the
	// same way it lies on the canvas.
	function getMapLayout(blocks, source) {
		const {
			canvasWidth,
			canvasHeight,
			blocksRectMap
		} = source;
		if (!Array.isArray(blocks) || blocks.length === 0) {
			return {
				sortedBlocks: [],
				minX: 0,
				minY: 0,
				width: canvasWidth ? 2 * canvasWidth : MAP_EMPTY_EXTENT,
				height: canvasHeight ? 2 * canvasHeight : MAP_EMPTY_EXTENT
			};
		}
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		const frames = [];
		const content = [];
		blocks.forEach(block => {
			const {
				x,
				y
			} = block.position;
			const {
				width,
				height
			} = getMapBlockSize(block, blocksRectMap);
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x + width);
			maxY = Math.max(maxY, y + height);
			const renderBlock = {
				position: {
					x,
					y
				},
				node: {
					type: block?.node?.type,
					colorIndex: block?.node?.colorIndex,
					frameColorName: block?.node?.frameColorName
				},
				dimensions: {
					width,
					height
				}
			};
			if (block?.type === MAP_FRAME_BLOCK_TYPE) {
				frames.push(renderBlock);
			} else {
				content.push(renderBlock);
			}
		});
		return {
			sortedBlocks: [...frames, ...content],
			minX: minX - MAP_PADDING,
			minY: minY - MAP_PADDING,
			width: maxX + MAP_PADDING - (minX - MAP_PADDING),
			height: maxY + MAP_PADDING - (minY - MAP_PADDING)
		};
	}

	// Scale that fits the whole layout into the map: the smaller of the two axis ratios, so
	// nothing is cropped. A degenerate layout keeps the map at 1:1 instead of dividing by zero.
	function getMapScale(layout, size) {
		const {
			width,
			height
		} = layout;
		if (width <= 0 || height <= 0) {
			return 1;
		}
		return Math.min(size.width / width, size.height / height);
	}

	// Palettes are indexed by a name or an index taken from a saved template, so only own keys
	// count as a color: a member inherited from Object.prototype is truthy, slips past the
	// fallback and reaches the drawing path as something that is not a color.
	function getOwnColor(palette, key) {
		return Object.hasOwn(palette, key) ? palette[key] : null;
	}

	// Color of a block on the map. Note the two different type checks: the drawing order groups
	// by the block type, while the color is picked by the type of the node behind the block. The
	// consumer fills both from one value, and the map leans on that: the frame fill is opaque, so a
	// block whose node is a frame while its block type is not takes the color of a background and is
	// still drawn among the content, covering the blocks under it instead of lying beneath them.
	function getMapBlockColor(block, colors) {
		const blockType = block?.node?.type;
		const colorIndex = block?.node?.colorIndex;
		if (blockType === MAP_FRAME_BLOCK_TYPE) {
			const framePalette = colors.framePalette ?? {};
			return getOwnColor(framePalette, block?.node?.frameColorName) || colors.frame;
		}
		if (colorIndex === null || colorIndex === false) {
			return colors.block;
		}
		const palette = colors.palette ?? {};
		return getOwnColor(palette, colorIndex) || colors.block;
	}

	// Blocks of the layout as map rectangles, in drawing order.
	function getMapBlockRects(layout, scale, colors) {
		return layout.sortedBlocks.map(block => ({
			x: (block.position.x - layout.minX) * scale,
			y: (block.position.y - layout.minY) * scale,
			width: block.dimensions.width * scale,
			height: block.dimensions.height * scale,
			color: getMapBlockColor(block, colors)
		}));
	}

	// Frame of the current view on the map: the canvas seen through the camera, in map pixels.
	function getMapViewportRect(layout, scale, camera) {
		return {
			x: (camera.x - layout.minX) * scale,
			y: (camera.y - layout.minY) * scale,
			width: camera.canvasWidth * scale / camera.zoom,
			height: camera.canvasHeight * scale / camera.zoom
		};
	}

	// Edges belong to the rectangle: a press exactly on the frame border grabs the frame.
	function isPointInMapRect(point, rect) {
		return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
	}

	// Theme colors as they are written in the product: a design token reference or a plain
	// CSS color. The renderer resolves them to numbers, and it is the only place that does.

	// Everything the renderer needs for a frame. It knows nothing about the camera: block
	// rectangles and the frame of the current view arrive already in map pixels.

	const MAP_BLOCK_CORNER_RADIUS = 2;
	const MAP_VIEWPORT_CORNER_RADIUS = 4;
	const MAP_VIEWPORT_OUTLINE_WIDTH = 2;

	// Last resort for a color the theme resolves to nothing parseable - a missing token means
	// the design tokens are not loaded at all, and a neutral shape beats an empty map.
	const UNRESOLVED_COLOR = [0.9, 0.9, 0.9, 1];

	// a_Position, a_Center, a_HalfSize, a_Color, a_Shape
	const FLOATS_PER_VERTEX = 12;
	const VERTICES_PER_RECT = 6;
	const BYTES_PER_FLOAT = 4;
	const VERTEX_STRIDE = FLOATS_PER_VERTEX * BYTES_PER_FLOAT;

	// One vertex, attribute by attribute: name in the program, component count, offset in floats.
	const VERTEX_ATTRIBUTES = [['position', 2, 0], ['center', 2, 2], ['halfSize', 2, 4], ['color', 4, 6], ['shape', 2, 10]];

	// Coverage ramp of an edge, in device pixels. One pixel keeps the corners smooth without
	// visibly thinning the shape.
	const EDGE_SOFTNESS_PX = 0.5;
	const CSS_VAR_PATTERN = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]+))?\)$/;
	const RGB_PATTERN = /^rgba?\(([^)]+)\)$/i;
	const MAX_VAR_DEPTH = 8;

	// A color that leans on its surroundings rather than standing on its own. The numbers behind
	// it belong to the place it was resolved in, so they must not be remembered for the next one.
	const CONTEXTUAL_COLOR_PATTERN = /currentcolor|inherit|initial|unset|revert/i;

	// Colors already resolved by the browser. A plain CSS color always gives the same numbers, so
	// resolving it a second time only costs another style recalculation. Theme references are
	// resolved before the cache is reached, so a theme change never hands out a stale color.
	const resolvedColors = new Map();

	// Sentinel of the pixel readback: a color the palette is never going to be written in, so it
	// surviving the assignment means the drawing context refused the value.
	const READBACK_SENTINEL = '#010203';
	let readbackContext = null;

	// Follows a chain of design token references down to a plain CSS color. An undefined token
	// falls back to the value written inside var(), and then to the caller's constant.
	function resolveCssValue(style, value, depth = 0) {
		const trimmed = String(value ?? '').trim();
		const reference = CSS_VAR_PATTERN.exec(trimmed);
		if (!reference || depth >= MAX_VAR_DEPTH) {
			return trimmed;
		}
		const token = style.getPropertyValue(reference[1]).trim();
		return resolveCssValue(style, token === '' ? reference[2] : token, depth + 1);
	}
	function parseRgbComponent(part, scale) {
		const value = Number.parseFloat(part);
		if (!Number.isFinite(value)) {
			return Number.NaN;
		}
		return part.endsWith('%') ? value / 100 : value / scale;
	}

	// Reads back what the browser computed. Whatever notation the color was written in, a computed
	// color comes back as rgb() or rgba(), and that is the only notation parsed by hand here.
	function parseRgbNotation(value) {
		const notation = RGB_PATTERN.exec(value);
		if (!notation) {
			return null;
		}
		const parts = notation[1].split(/[\s,/]+/).filter(part => part !== '');
		if (parts.length < 3) {
			return null;
		}
		const color = [parseRgbComponent(parts[0], 255), parseRgbComponent(parts[1], 255), parseRgbComponent(parts[2], 255), parts.length > 3 ? parseRgbComponent(parts[3], 1) : 1];
		return color.some(component => !Number.isFinite(component)) ? null : color;
	}

	// Hands the color to the browser and reads the result back. The map is drawn by the video card,
	// but its palette stays a public contract written in CSS, so the renderer has no business
	// deciding which notations CSS has - hsl(), a color name, transparent and color-mix() are as
	// valid as a hexadecimal token.
	//
	// The probe stands where the markup of the map used to stand: next to the map element, inside a
	// carrier that wears the color of that element. That is what makes currentColor mean the same
	// thing it meant when the map was drawn by the browser - the color the map inherits.
	function resolveByBrowser(value, context) {
		const host = context?.parentNode ?? document.body;
		if (!host) {
			return '';
		}

		// Asking CSS itself whether this is a color is the whole validation there is: what the
		// browser rejects, the map has no numbers for.
		if (!window.CSS?.supports('color', value)) {
			return '';
		}
		const carrier = main_core.Dom.create('span', {
			style: {
				position: 'absolute',
				width: '0',
				height: '0',
				visibility: 'hidden',
				color: context ? main_core.Dom.style(context, 'color') : null
			}
		});
		const probe = main_core.Dom.create('span', {
			style: {
				color: value
			}
		});
		main_core.Dom.append(probe, carrier);
		main_core.Dom.append(carrier, host);
		const computed = main_core.Dom.style(probe, 'color');
		main_core.Dom.remove(carrier);
		return computed;
	}

	// A modern color - color-mix(), oklch(), color() - is computed by the browser but never lowered
	// to rgb() on the way out, so the notation reaches here as it was written. Painting one pixel
	// with it is the browser converting the color to screen values itself. The price is eight bits
	// per channel, which is the precision the map is drawn with anyway.
	function readColorBack(value) {
		if (!readbackContext) {
			const canvas = document.createElement('canvas');
			canvas.width = 1;
			canvas.height = 1;
			readbackContext = canvas.getContext('2d', {
				willReadFrequently: true
			});
		}
		if (!readbackContext) {
			return null;
		}
		readbackContext.fillStyle = READBACK_SENTINEL;
		readbackContext.fillStyle = value;
		if (readbackContext.fillStyle === READBACK_SENTINEL) {
			return null;
		}
		readbackContext.clearRect(0, 0, 1, 1);
		readbackContext.fillRect(0, 0, 1, 1);
		const pixel = readbackContext.getImageData(0, 0, 1, 1).data;
		return [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, pixel[3] / 255];
	}

	// Resolves a plain CSS color into four components in the 0..1 range. A value the browser does
	// not accept as a color gives null, and the caller falls back to a color it can draw.
	function parseCssColor(value, context = null) {
		const trimmed = String(value ?? '').trim();
		if (trimmed === '') {
			return null;
		}
		const isCacheable = !CONTEXTUAL_COLOR_PATTERN.test(trimmed);
		if (isCacheable && resolvedColors.has(trimmed)) {
			return resolvedColors.get(trimmed);
		}
		const computed = resolveByBrowser(trimmed, context);
		const color = computed === '' ? null : parseRgbNotation(computed) ?? readColorBack(computed);
		if (isCacheable) {
			resolvedColors.set(trimmed, color);
		}
		return color;
	}

	// Two triangles covering one rectangle. Every vertex carries the whole shape - center, half
	// size, color, corner radius and outline width - so the fragment shader can build it with a
	// signed distance field, and a rectangle costs no markup at all.
	function writeRect(target, offset, rect, color, radius, halfOutline, softness) {
		const halfWidth = Math.abs(rect.width) / 2;
		const halfHeight = Math.abs(rect.height) / 2;
		const centerX = rect.x + rect.width / 2;
		const centerY = rect.y + rect.height / 2;
		// The quad has to leave room for the outline and for the coverage ramp, otherwise the
		// shape is cut off by its own geometry.
		const padding = halfOutline + softness;
		const left = centerX - halfWidth - padding;
		const right = centerX + halfWidth + padding;
		const top = centerY - halfHeight - padding;
		const bottom = centerY + halfHeight + padding;
		const corners = [left, top, right, top, left, bottom, left, bottom, right, top, right, bottom];
		let cursor = offset;
		for (let corner = 0; corner < VERTICES_PER_RECT; corner++) {
			target[cursor] = corners[corner * 2];
			target[cursor + 1] = corners[corner * 2 + 1];
			target[cursor + 2] = centerX;
			target[cursor + 3] = centerY;
			target[cursor + 4] = halfWidth;
			target[cursor + 5] = halfHeight;
			target[cursor + 6] = color[0];
			target[cursor + 7] = color[1];
			target[cursor + 8] = color[2];
			target[cursor + 9] = color[3];
			target[cursor + 10] = radius;
			target[cursor + 11] = halfOutline;
			cursor += FLOATS_PER_VERTEX;
		}
		return cursor;
	}
	class MapRenderer {
		#element = null;
		#gl = null;
		#dpr = window.devicePixelRatio || 1;
		#edgeSoftness = EDGE_SOFTNESS_PX;
		#width = 0;
		#height = 0;
		#program = null;
		#vertexShader = null;
		#fragmentShader = null;
		#attributes = null;
		#uniforms = null;
		#vertexLayout = null;
		#blocksBuffer = null;
		#blocksVertexCount = 0;
		#uploadedBlocks = null;
		#viewportBuffer = null;
		// The frame of the current view is one rectangle and it goes up on every frame, so its
		// vertices live here instead of being allocated again for each of them.
		#viewportVertices = new Float32Array(VERTICES_PER_RECT * FLOATS_PER_VERTEX);
		#palette = null;
		#colors = null;
		#frame = null;
		#resizeObserver = null;
		#pixelRatioQuery = null;
		#onPixelRatioChange = null;
		#onContextLost = null;
		#onContextRestored = null;
		#isContextLost = false;

		// The context of the long-lived objects is part of the contract; the map renderer takes
		// nothing from it - both the geometry and the colors arrive from its owner.
		// eslint-disable-next-line no-unused-vars
		constructor(ctx) {
			this.#edgeSoftness = EDGE_SOFTNESS_PX / this.#dpr;
		}
		get isAttached() {
			return this.#element !== null;
		}

		// Resolved theme colors. They belong to the renderer alone, so the geometry layer picks a
		// block color from these numbers instead of resolving the theme a second time.
		get colors() {
			return this.#colors;
		}

		// A repeated attach is a race of the lifecycle, not a programming error: the same element
		// changes nothing, another one rebinds the renderer. Only an argument that cannot carry a
		// drawing context throws.
		attach(element, palette = null) {
			if (!main_core.Type.isFunction(element?.getContext)) {
				throw new TypeError('ui.block-diagram: map renderer needs a canvas element to attach to');
			}
			if (this.#element === element) {
				return;
			}
			this.detach();
			const gl = element.getContext('webgl', {
				alpha: true,
				premultipliedAlpha: false,
				antialias: false
			});

			// The map is drawn by the video card alone, so without a context it would be an empty
			// rectangle with nothing to diagnose it by. The attach does not happen at all: isAttached
			// keeps telling the truth and the owner can tell a blank map from a working one.
			if (!gl) {
				console.error('ui.block-diagram: no WebGL context for the map, the map is not drawn');
				return;
			}
			this.#element = element;
			this.#gl = gl;
			this.#palette = palette;
			this.#onContextLost = event => {
				// Without this the browser never restores the context.
				event.preventDefault();
				this.#handleContextLost();
			};
			this.#onContextRestored = () => this.#handleContextRestored();
			element.addEventListener('webglcontextlost', this.#onContextLost);
			element.addEventListener('webglcontextrestored', this.#onContextRestored);
			if (!this.#buildResources()) {
				return;
			}
			this.#resolveColors();
			const {
				width,
				height
			} = element.getBoundingClientRect();
			this.#resize(width, height);
			this.#initResizeObserver();
			this.#watchPixelRatio();
		}

		// The other half of that contract: a caller that names the element it attached to leaves a
		// binding made by someone else alone. Without an element the current binding is dropped.
		detach(element = null) {
			if (!this.isAttached || element !== null && this.#element !== element) {
				return;
			}
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#unwatchPixelRatio();
			this.#element.removeEventListener('webglcontextlost', this.#onContextLost);
			this.#element.removeEventListener('webglcontextrestored', this.#onContextRestored);
			this.#onContextLost = null;
			this.#onContextRestored = null;
			this.#releaseResources();

			// The drawing context must not outlive the element it was created on.
			this.#gl?.getExtension('WEBGL_lose_context')?.loseContext();
			this.#gl = null;
			this.#element = null;
			this.#palette = null;
			this.#colors = null;
			this.#frame = null;
			this.#isContextLost = false;
			this.#width = 0;
			this.#height = 0;
		}

		// The palette of the owner is not frozen at the attach: a consumer that changes the colors
		// of the blocks, or a theme that changes under the diagram, hands the new one over here and
		// the theme is read again.
		setPalette(palette) {
			this.#palette = palette;
			this.#resolveColors();
		}

		// Reads the theme once and keeps the numbers until the next call. Palette entries that
		// resolve to nothing fall back to the default block color, and entries of the frame palette
		// to the default frame color: a frame whose color did not resolve has to stay a frame.
		#resolveColors() {
			if (!this.isAttached) {
				return;
			}
			const source = this.#palette ?? {};
			const style = window.getComputedStyle(this.#element);
			const resolve = (value, fallback) => {
				return parseCssColor(resolveCssValue(style, value), this.#element) ?? fallback;
			};
			const block = resolve(source.block, UNRESOLVED_COLOR);
			const frame = resolve(source.frame, block);
			const palette = Object.create(null);
			const framePalette = Object.create(null);
			Object.keys(source.palette ?? {}).forEach(key => {
				palette[key] = resolve(source.palette[key], block);
			});
			Object.keys(source.framePalette ?? {}).forEach(key => {
				framePalette[key] = resolve(source.framePalette[key], frame);
			});
			this.#colors = {
				palette,
				framePalette,
				block,
				frame,
				viewport: resolve(source.viewport, block)
			};
		}

		// Draws one frame. The block buffer is rebuilt only when the blocks array is a different
		// array than the one drawn last: a gesture that moves the camera hands over the very same
		// array, so panning the map never pays for the geometry of the nodes.
		render(frame) {
			if (!this.isAttached) {
				return;
			}
			this.#frame = frame;
			this.#draw();
		}

		// compileShader and createProgram throw, and a program that did not build leaves the
		// renderer bound to a context it cannot draw with: isAttached would keep saying yes while
		// every frame of a camera gesture reads colors that were never resolved. The binding is
		// rolled back the same way a missing drawing context rolls it back - an empty map with a
		// complaint in the console, and the drawing path of the editor stays alive.
		#buildResources() {
			try {
				this.#createResources();
			} catch (error) {
				console.error('ui.block-diagram: the shader program of the map did not build, the map is not drawn', error);
				this.detach();
				return false;
			}
			return true;
		}
		#createResources() {
			const gl = this.#gl;
			if (!gl) {
				return;
			}
			this.#vertexShader = compileShader(gl, vertexShader, gl.VERTEX_SHADER);
			this.#fragmentShader = compileShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
			this.#program = createProgram(gl, this.#vertexShader, this.#fragmentShader);
			this.#attributes = {
				position: gl.getAttribLocation(this.#program, 'a_Position'),
				center: gl.getAttribLocation(this.#program, 'a_Center'),
				halfSize: gl.getAttribLocation(this.#program, 'a_HalfSize'),
				color: gl.getAttribLocation(this.#program, 'a_Color'),
				shape: gl.getAttribLocation(this.#program, 'a_Shape')
			};
			this.#uniforms = {
				resolution: gl.getUniformLocation(this.#program, 'u_Resolution'),
				edgeSoftness: gl.getUniformLocation(this.#program, 'u_EdgeSoftness')
			};
			this.#vertexLayout = VERTEX_ATTRIBUTES.map(([name, size, offset]) => [this.#attributes[name], size, offset * BYTES_PER_FLOAT]);
			this.#blocksBuffer = gl.createBuffer();
			this.#viewportBuffer = gl.createBuffer();
			this.#blocksVertexCount = 0;
			this.#uploadedBlocks = null;

			// Frames come first because they are the background the blocks sit on, the same way the
			// canvas stacks them. Blending is on for another reason: blocks carry transparency. The
			// alpha channel is kept separate, so the element itself stays transparent where nothing
			// is drawn.
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.clearColor(0, 0, 0, 0);
		}
		#releaseResources() {
			const gl = this.#gl;
			if (gl && !this.#isContextLost) {
				gl.deleteBuffer(this.#blocksBuffer);
				gl.deleteBuffer(this.#viewportBuffer);
				gl.deleteProgram(this.#program);
				gl.deleteShader(this.#vertexShader);
				gl.deleteShader(this.#fragmentShader);
			}
			this.#blocksBuffer = null;
			this.#viewportBuffer = null;
			this.#blocksVertexCount = 0;
			this.#uploadedBlocks = null;
			this.#program = null;
			this.#vertexShader = null;
			this.#fragmentShader = null;
			this.#attributes = null;
			this.#uniforms = null;
			this.#vertexLayout = null;
		}
		#handleContextLost() {
			this.#isContextLost = true;
			this.#releaseResources();
		}
		#handleContextRestored() {
			this.#isContextLost = false;

			// A throw from a DOM event handler reaches no one at all, so the restore degrades the
			// same way the attach does.
			if (!this.#buildResources()) {
				return;
			}
			this.#applyDrawingBufferSize();
			this.#draw();
		}
		#initResizeObserver() {
			this.#resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					this.#resize(entry.contentRect.width, entry.contentRect.height);
				}
			});
			this.#resizeObserver.observe(this.#element);
		}

		// The pixel density is not a constant of the page: browser zoom and a move to a screen of
		// another density change it while the logical size of the map stays the same, so the resize
		// observer never hears about it. A media query on the current density is the only event the
		// browser gives for that, and it only ever matches one value - hence the re-arming.
		#watchPixelRatio() {
			this.#unwatchPixelRatio();
			if (!window.matchMedia) {
				return;
			}
			this.#onPixelRatioChange = () => {
				if (!this.isAttached) {
					return;
				}
				this.#resize(this.#width, this.#height);
				this.#watchPixelRatio();
			};
			this.#pixelRatioQuery = window.matchMedia(`(resolution: ${this.#dpr}dppx)`);
			this.#pixelRatioQuery.addEventListener('change', this.#onPixelRatioChange);
		}
		#unwatchPixelRatio() {
			this.#pixelRatioQuery?.removeEventListener('change', this.#onPixelRatioChange);
			this.#pixelRatioQuery = null;
			this.#onPixelRatioChange = null;
		}
		#syncPixelRatio() {
			const ratio = window.devicePixelRatio || 1;
			if (ratio === this.#dpr) {
				return;
			}
			this.#dpr = ratio;
			this.#edgeSoftness = EDGE_SOFTNESS_PX / ratio;
			// The coverage ramp is built into the quads of the blocks, so they have to go up again.
			this.#uploadedBlocks = null;
		}

		// The element is measured in logical pixels and the drawing buffer is sized in physical
		// ones; the geometry of the map stays logical, so the ratio lives in the buffer alone.
		#resize(width, height) {
			this.#syncPixelRatio();
			this.#width = width;
			this.#height = height;
			this.#element.width = Math.round(width * this.#dpr);
			this.#element.height = Math.round(height * this.#dpr);
			this.#applyDrawingBufferSize();
			this.#draw();
		}
		#applyDrawingBufferSize() {
			this.#gl?.viewport(0, 0, this.#element.width, this.#element.height);
		}
		#draw() {
			const gl = this.#gl;
			if (!gl || this.#isContextLost || !this.#program || this.#width <= 0 || this.#height <= 0) {
				return;
			}
			gl.clear(gl.COLOR_BUFFER_BIT);
			const frame = this.#frame;
			if (!frame) {
				return;
			}
			gl.useProgram(this.#program);
			gl.uniform2f(this.#uniforms.resolution, this.#width, this.#height);
			gl.uniform1f(this.#uniforms.edgeSoftness, this.#edgeSoftness);
			if (frame.blocks !== this.#uploadedBlocks) {
				this.#uploadBlocks(frame.blocks);
			}
			this.#drawBuffer(this.#blocksBuffer, this.#blocksVertexCount);
			if (frame.viewport) {
				this.#uploadViewport(frame.viewport, frame.viewportColor);
				this.#drawBuffer(this.#viewportBuffer, VERTICES_PER_RECT);
			}
		}
		#uploadBlocks(blocks) {
			const gl = this.#gl;
			const rects = Array.isArray(blocks) ? blocks : [];
			const data = new Float32Array(rects.length * VERTICES_PER_RECT * FLOATS_PER_VERTEX);
			let cursor = 0;
			rects.forEach(rect => {
				cursor = writeRect(data, cursor, rect, rect.color ?? this.#colors?.block ?? UNRESOLVED_COLOR, MAP_BLOCK_CORNER_RADIUS, 0, this.#edgeSoftness);
			});
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#blocksBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
			this.#blocksVertexCount = rects.length * VERTICES_PER_RECT;
			this.#uploadedBlocks = blocks;
		}
		#uploadViewport(viewport, color) {
			const gl = this.#gl;
			const data = this.#viewportVertices;
			writeRect(data, 0, viewport, color ?? this.#colors?.viewport ?? UNRESOLVED_COLOR, MAP_VIEWPORT_CORNER_RADIUS, MAP_VIEWPORT_OUTLINE_WIDTH / 2, this.#edgeSoftness);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#viewportBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
		}

		// Blocks and the frame of the view share one program and one vertex layout: whatever the
		// number of nodes, the map is a couple of draw calls rather than a node's worth of markup.
		#drawBuffer(buffer, vertexCount) {
			if (vertexCount <= 0) {
				return;
			}
			const gl = this.#gl;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			this.#vertexLayout.forEach(([location, size, offset]) => {
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(location, size, gl.FLOAT, false, VERTEX_STRIDE, offset);
			});
			gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
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

		// Nodes of the running gesture and the source of a new connection. Every canvas gesture
		// registers its own nodes in one place, so there is a single set to read here. Empty once the
		// gesture ends, so nothing is retained past it.
		#interactingBlockIds() {
			const interactingIds = new Set();
			const gestureIds = ui_vue3.toValue(this.#state?.gestureBlockIds) ?? null;
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

	// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
	// lone .ts source inside this extension would not resolve.

	// A rectangle of the working form tied to the block that owns it: the search needs the id to tell a
	// participant from an obstacle and to ask whether either side of a pair is a container.

	// The form the capture of a container works in.

	const EDGE_LEFT = 'left';
	const EDGE_TOP = 'top';
	const EDGE_RIGHT = 'right';
	const EDGE_BOTTOM = 'bottom';
	const PLACEMENT_EDGES = [EDGE_LEFT, EDGE_TOP, EDGE_RIGHT, EDGE_BOTTOM];

	// The clearance a correction leaves between the moved rect and the block it was pushed off: a
	// design constant of the rule itself, not a diagram setting - two nodes freed from an overlap read
	// as neighbours rather than as a seam, at any zoom.
	const PLACEMENT_GAP_PX = 20;

	// Frozen because it leaves the module as the answer of the search: a consumer writing into the
	// result would otherwise change the answer of every later call.
	const ZERO_DELTA = Object.freeze({
		x: 0,
		y: 0
	});

	// A size the model does not state is an unknown size, not a zero one: a block may reach the diagram
	// with empty `dimensions` fields, and a number taken out of an empty field would shrink the rect to
	// its own top-left corner. Such a rect answers "inside" for a block that is not, so a block without
	// a stated size takes no part in the rules built on this geometry - neither as the moved node nor as
	// an obstacle to it.
	function isUsableRect(rect) {
		return Number.isFinite(rect?.x) && Number.isFinite(rect?.y) && Number.isFinite(rect?.width) && Number.isFinite(rect?.height) && rect.width > 0 && rect.height > 0;
	}

	// The area a block takes in the model - the very space the intersections index is built in. The
	// measured geometry is deliberately not read: it depends on what has managed to mount and be
	// measured, so the same schema would answer differently at another zoom or camera position.
	function modelBlockRect(position, dimensions) {
		const rect = {
			x: Number(position?.x),
			y: Number(position?.y),
			width: Number(dimensions?.width),
			height: Number(dimensions?.height)
		};
		return isUsableRect(rect) ? rect : null;
	}
	function toSearchRect(rect) {
		return {
			minX: rect.x,
			minY: rect.y,
			maxX: rect.x + rect.width,
			maxY: rect.y + rect.height
		};
	}
	function toRectBounds(rect) {
		return {
			left: rect.x,
			top: rect.y,
			right: rect.x + rect.width,
			bottom: rect.y + rect.height
		};
	}

	// Strict on every side: two blocks that only touch by an edge do not overlap.
	function rectsOverlap(first, second) {
		return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
	}
	function addDelta(delta, other) {
		return {
			x: delta.x + other.x,
			y: delta.y + other.y
		};
	}
	function applyDelta(participants, delta) {
		return participants.map(participant => {
			return {
				...participant,
				x: participant.x + delta.x,
				y: participant.y + delta.y
			};
		});
	}

	// The shift that clears `rect` off the named edge of `other` by the placement gap, along that edge
	// axis alone.
	function flushToEdge(rect, other, edge) {
		switch (edge) {
			case EDGE_LEFT:
				return {
					x: other.x - PLACEMENT_GAP_PX - (rect.x + rect.width),
					y: 0
				};
			case EDGE_RIGHT:
				return {
					x: other.x + other.width + PLACEMENT_GAP_PX - rect.x,
					y: 0
				};
			case EDGE_TOP:
				return {
					x: 0,
					y: other.y - PLACEMENT_GAP_PX - (rect.y + rect.height)
				};
			case EDGE_BOTTOM:
				return {
					x: 0,
					y: other.y + other.height + PLACEMENT_GAP_PX - rect.y
				};
			default:
				return ZERO_DELTA;
		}
	}
	function floorToStep(value, step) {
		return Math.floor(value / step) * step;
	}
	function ceilToStep(value, step) {
		return Math.ceil(value / step) * step;
	}

	// Snapping never walks a candidate back into the block it was just pushed out of: the position the
	// candidate puts the moved rect at is rounded away from that block, so both rules hold at once. It
	// is the position and not the shift that lands on a grid line - a shift rounded on its own would
	// bring the block to the grid only from a place that already stood on it. A step the diagram does
	// not state leaves the candidate where the edge put it.
	function snapOutward(origin, delta, edge, snapStep) {
		if (!Number.isFinite(snapStep) || snapStep <= 0) {
			return delta;
		}
		switch (edge) {
			case EDGE_LEFT:
				return {
					x: floorToStep(origin.x + delta.x, snapStep) - origin.x,
					y: delta.y
				};
			case EDGE_RIGHT:
				return {
					x: ceilToStep(origin.x + delta.x, snapStep) - origin.x,
					y: delta.y
				};
			case EDGE_TOP:
				return {
					x: delta.x,
					y: floorToStep(origin.y + delta.y, snapStep) - origin.y
				};
			case EDGE_BOTTOM:
				return {
					x: delta.x,
					y: ceilToStep(origin.y + delta.y, snapStep) - origin.y
				};
			default:
				return delta;
		}
	}
	function deltaKey(delta) {
		return `${delta.x}:${delta.y}`;
	}
	function deltaLength(delta) {
		return Math.hypot(delta.x, delta.y);
	}
	function shortestFirstQueue(initial) {
		const items = [...initial];
		return {
			isEmpty: () => items.length === 0,
			push: delta => {
				items.push(delta);
			},
			takeShortest: () => {
				let shortest = 0;
				for (let index = 1; index < items.length; index++) {
					if (deltaLength(items[index]) < deltaLength(items[shortest])) {
						shortest = index;
					}
				}
				return items.splice(shortest, 1)[0];
			}
		};
	}
	function unionRect(rects) {
		if (rects.length === 0) {
			return null;
		}
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;
		for (const rect of rects) {
			minX = Math.min(minX, rect.x);
			minY = Math.min(minY, rect.y);
			maxX = Math.max(maxX, rect.x + rect.width);
			maxY = Math.max(maxY, rect.y + rect.height);
		}
		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		};
	}
	function containsRect(outer, inner) {
		return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
	}

	/**
	 * The obstacles stand still while the search runs - only the participants move over them. So the
	 * index is asked once for an area around the participants instead of once per participant per
	 * candidate, and every candidate that keeps them inside that area is answered from what came back.
	 * A candidate that steps outside asks the index again for an area grown around itself, so the count
	 * of index queries follows the reach of the wave and not the count of candidates.
	 */
	function areaObstacles(searchObstacles) {
		let covered = null;
		let obstacles = [];
		return moved => {
			const wanted = unionRect(moved);
			if (wanted === null) {
				return [];
			}
			if (covered === null || !containsRect(covered, wanted)) {
				covered = {
					x: wanted.x - wanted.width,
					y: wanted.y - wanted.height,
					width: wanted.width * 3,
					height: wanted.height * 3
				};
				obstacles = searchObstacles(covered);
			}
			return obstacles;
		};
	}

	// Pairs the rule forbids: the participants of one operation never block each other, and a pair of a
	// node and a container is allowed by the rule itself.
	function collectBlockers(moved, obstacles, isBackdrop, participantIds) {
		const blockers = [];
		for (const rect of moved) {
			for (const other of obstacles) {
				if (participantIds.has(other.id)) {
					continue;
				}

				// Exactly one container in the pair, never two: a node lies on a container freely, but two
				// containers overlapping would leave the node in the shared area belonging to both, and
				// every gesture over either of them would carry it away.
				if (isBackdrop(rect.id) !== isBackdrop(other.id)) {
					continue;
				}
				if (rectsOverlap(rect, other)) {
					blockers.push([rect, other]);
				}
			}
		}
		return blockers;
	}

	/**
	 * The shortest shift that makes every participant an allowed neighbour, or null when the budget of
	 * examined candidates runs out before such a shift is found. Candidates come from the edges of the
	 * blocks that really stand in the way, so the shift lands a node against its neighbour rather than
	 * somewhere along an axis or a grid ray; the wave then spreads from the candidates themselves,
	 * because a shift out of one block may walk into another.
	 *
	 * The shift is one for the whole set, so a group, a container with its content and a pasted fragment
	 * keep their inner layout without a branch of their own.
	 */
	function findPlacementDelta(participants, searchObstacles, isBackdrop, snapStep, budget) {
		const placed = participants.filter(participant => isUsableRect(participant));
		const participantIds = new Set(participants.map(participant => participant.id));
		const obstaclesAround = areaObstacles(searchObstacles);
		const queue = shortestFirstQueue([ZERO_DELTA]);
		const seen = new Set([deltaKey(ZERO_DELTA)]);
		while (!queue.isEmpty()) {
			const delta = queue.takeShortest();
			const moved = applyDelta(placed, delta);
			const blockers = collectBlockers(moved, obstaclesAround(moved), isBackdrop, participantIds);
			if (blockers.length === 0) {
				return delta;
			}

			// The budget stops the generating of candidates, not the walking of them: a candidate already
			// queued is examined whatever the count says, so `null` means "every candidate found was
			// tried" and not "the count ran out while the queue still held untried ones".
			if (seen.size >= budget) {
				continue;
			}
			for (const [rect, other] of blockers) {
				// The shift is counted from the rect as it stands under the current delta, so the place
				// it started from - the one the grid rounds the candidate against - is that rect less
				// the delta.
				const origin = {
					x: rect.x - delta.x,
					y: rect.y - delta.y
				};
				for (const edge of PLACEMENT_EDGES) {
					const candidate = snapOutward(origin, addDelta(delta, flushToEdge(rect, other, edge)), edge, snapStep);
					const key = deltaKey(candidate);

					// The budget is counted here and not only before the wave: one pass over the blockers of a
					// large group generates four candidates per conflicting pair, so a check made only at the
					// top of the wave would let a single pass overshoot the budget many times over.
					if (!seen.has(key) && seen.size < budget) {
						seen.add(key);
						queue.push(candidate);
					}
				}
			}
		}
		return null;
	}

	let Node$1 = class Node {
		constructor(obj, dimension, parent) {
			this.obj = obj;
			this.left = null;
			this.right = null;
			this.parent = parent;
			this.dimension = dimension;
		}
	};

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
				return new Node$1(points[0], dim, parent);
			}
			points.sort((a, b) => {
				return a[this.#dimensions[dim]] - b[this.#dimensions[dim]];
			});
			median = Math.floor(points.length / 2);
			node = new Node$1(points[median], dim, parent);
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
				this.#root = new Node$1(point, 0, null);
				return;
			}
			const newNode = new Node$1(point, (insertPosition.dimension + 1) % this.#dimensions.length, insertPosition);
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

	// Key tokens a consumer subscribes by, so the spelling lives in one place on both sides.
	const KEY_TOKEN = Object.freeze({
		SPACE: 'space',
		ESCAPE: 'escape'
	});

	// A key pressed while an IME composes carries this legacy code in browsers that predate
	// `KeyboardEvent.isComposing`.
	const IME_PROCESSING_KEY_CODE = 229;
	const MOUSE_BUTTON_TOKEN = Object.freeze({
		LEFT: 'lmb',
		MIDDLE: 'mmb',
		RIGHT: 'rmb'
	});

	// The reset passes null: no event stands behind a forced release.

	// Order is fixed: it makes one combo string out of every way the same combo can be written.
	const MODIFIERS = ['ctrl', 'alt', 'shift', 'meta'];
	const MODIFIER_EVENT_FLAGS = Object.freeze({
		ctrl: 'ctrlKey',
		alt: 'altKey',
		shift: 'shiftKey',
		meta: 'metaKey'
	});
	const ALIASES = new Map([['control', 'ctrl'], ['option', 'alt'], ['cmd', 'meta'], ['command', 'meta'], ['win', 'meta'], ['esc', 'escape'], ['del', 'delete'], ['ins', 'insert'], ['left', 'arrowleft'], ['right', 'arrowright'], ['up', 'arrowup'], ['down', 'arrowdown'], [MOUSE_BUTTON_TOKEN.LEFT, `mouse${MOUSE_BUTTON.LEFT}`], [MOUSE_BUTTON_TOKEN.MIDDLE, `mouse${MOUSE_BUTTON.MIDDLE}`], [MOUSE_BUTTON_TOKEN.RIGHT, `mouse${MOUSE_BUTTON.RIGHT}`],
	// A punctuation key written as its character has to meet the physical code of the same key in
	// one token, or a record spelled with the character would never match the event. Both the plain
	// character and the one the same key types under Shift lead to that single code: a record reads
	// as '?' or as '/', the event says Slash, and all three have to mean the same key.
	['-', 'minus'], ['_', 'minus'], ['=', 'equal'], ['+', 'equal'], ['[', 'bracketleft'], ['{', 'bracketleft'], [']', 'bracketright'], ['}', 'bracketright'], [',', 'comma'], ['<', 'comma'], ['.', 'period'], ['>', 'period'], ['/', 'slash'], ['?', 'slash'], [';', 'semicolon'], [':', 'semicolon'], ["'", 'quote'], ['"', 'quote'], ['`', 'backquote'], ['~', 'backquote'], ['\\', 'backslash'], ['|', 'backslash'],
	// The digit row under Shift, same rule.
	['!', 'digit1'], ['@', 'digit2'], ['#', 'digit3'], ['$', 'digit4'], ['%', 'digit5'], ['^', 'digit6'], ['&', 'digit7'], ['*', 'digit8'], ['(', 'digit9'], [')', 'digit0'],
	// The numeric keypad carries physical codes of its own, and a combo is matched by code: without
	// these the keypad would answer no record written for the key of the main row.
	['numpadadd', 'equal'], ['numpadsubtract', 'minus']]);
	const CAPTURE_LISTENER_OPTIONS$1 = Object.freeze({
		capture: true
	});
	const COMBO_SEPARATOR$2 = '+';
	const PLATFORM_MODIFIER_TOKEN = 'mod';
	const MOUSE_TOKEN_PREFIX = 'mouse';
	const LETTER_TOKEN_PREFIX$2 = 'key';
	const DIGIT_TOKEN_PREFIX$2 = 'digit';
	const SIDE_SUFFIXES = ['left', 'right'];
	const SPACE_KEY = ' ';
	const HIDDEN_VISIBILITY_STATE = 'hidden';
	const LETTER_PATTERN = /^[a-z]$/;
	const DIGIT_PATTERN = /^\d$/;
	// Every `KeyboardEvent.code`/`.key` name the DOM ever produces - physical or logical, side-suffixed
	// or not - is plain ASCII letters and digits: no punctuation, no whitespace, no markup. A multi-
	// character token that fails this is not a key a keyboard can send, canonical or otherwise: a
	// personal setting travels through this same function on every load (hotkeys.js `sanitizeOverrides`),
	// and one hand-crafted through the save API is the only way such a token could ever reach here.
	const TOKEN_PATTERN = /^[a-z0-9]+$/;

	// ShiftLeft answers a question about shift, ControlRight - about ctrl. A side suffix over anything
	// but a modifier - ArrowLeft, BracketRight - is part of the key name and strips to nothing.
	function stripSide(token) {
		const suffix = SIDE_SUFFIXES.find(side => token.endsWith(side) && token.length > side.length);
		if (main_core.Type.isNil(suffix)) {
			return null;
		}
		const base = token.slice(0, -suffix.length);
		const alias = ALIASES.get(base) ?? base;
		return MODIFIERS.includes(alias) ? alias : null;
	}

	/**
	 * Whether a token names a modifier, written once for the class and for the shortcut adapter that
	 * has to tell a modifier from the main key of a record. Accepts every spelling a record may use,
	 * the platform-dependent `mod` included.
	 */
	function isModifierToken(token) {
		if (!main_core.Type.isStringFilled(token)) {
			return false;
		}
		const lowered = token.trim().toLowerCase();
		const alias = ALIASES.get(lowered) ?? lowered;
		return alias === PLATFORM_MODIFIER_TOKEN || MODIFIERS.includes(stripSide(alias) ?? alias);
	}

	/**
	 * The canonical form of a single key: every spelling of the same key - the character, the synonym,
	 * the physical code - answers with one token. The platform-dependent `mod` needs to know the
	 * platform, which the class passes from its own; a caller outside it reads the platform of the page.
	 */
	function normalizeToken(raw, isMac = main_core.Browser.isMac()) {
		if (!main_core.Type.isStringFilled(raw)) {
			return '';
		}
		const lowered = raw.trim().toLowerCase();
		const token = ALIASES.get(lowered) ?? lowered;
		if (token === PLATFORM_MODIFIER_TOKEN) {
			return isMac ? 'meta' : 'ctrl';
		}

		// Both patterns describe a single character: a longer token never has to be matched.
		if (token.length === 1) {
			if (LETTER_PATTERN.test(token)) {
				return `${LETTER_TOKEN_PREFIX$2}${token}`;
			}
			if (DIGIT_PATTERN.test(token)) {
				return `${DIGIT_TOKEN_PREFIX$2}${token}`;
			}

			// A single character neither pattern above claims - '+', '=', a non-Latin letter - is one of
			// the rare keys the DOM names by their own printed character, and passes through as-is.
			return token;
		}
		return TOKEN_PATTERN.test(token) ? token : '';
	}

	/**
	 * The canonical form of a whole combo: the one string a written record, a stored binding and a
	 * press all have to arrive at. It lives here rather than in the registry of actions, because this
	 * is where a press meets a record - the registry is handed canonical strings and normalizes nothing.
	 *
	 * A combo written as one string is split by the separator, which leaves no way to name the
	 * separator itself as a key: '+' is passed as a list instead, and a list is never split.
	 */
	function normalizeCombo(combo, isMac = main_core.Browser.isMac()) {
		let parts = [];
		if (main_core.Type.isArray(combo)) {
			parts = combo;
		} else if (main_core.Type.isStringFilled(combo)) {
			parts = combo.split(COMBO_SEPARATOR$2);
		}
		const tokens = parts.map(part => normalizeToken(part, isMac)).filter(part => main_core.Type.isStringFilled(part));
		const modifiers = MODIFIERS.filter(modifier => tokens.includes(modifier));
		const keys = tokens.filter(token => !MODIFIERS.includes(token)).sort();
		return [...modifiers, ...keys].join(COMBO_SEPARATOR$2);
	}

	/**
	 * The rule about an input field holding the focus, written once: the class asks it about the event
	 * it handles, a consumer of the state - about the event it was handed.
	 */
	function isInputEventTarget(event) {
		const target = event?.target;
		if (main_core.Type.isNil(target)) {
			return false;
		}
		return INPUT_TAGS[target.tagName] === true || target.isContentEditable === true;
	}

	/**
	 * Single owner of the canvas input subscriptions and single source of truth about what is held
	 * right now. Knows nothing about the diagram model: whether a shortcut may run is decided by the
	 * subscriber.
	 *
	 * Plain subscriptions are heard on the bubbling phase only, so a popup mounted above the canvas
	 * keeps its own Escape and Space. An exclusive subscription (`onExclusive`) raises a second,
	 * capture-phase channel for as long as an operation holds the combo, and takes the event away from
	 * those layers; with no such subscription that channel is not bound at all. The platform is
	 * injected to keep the class testable without a browser.
	 *
	 * The state attaches itself to `window` on first use, so a consumer of the canvas works whether or
	 * not the root diagram component has mounted. `detach` is the end of it: the owner of the canvas
	 * calls it on unmount, only an explicit `attach` binds the listeners again, and the claims go down
	 * with the channel that served them.
	 */
	class InputState {
		#isMac;
		#actionRegistry;
		#target = null;
		#pressedTokens = new Set();
		#pointer = {
			x: 0,
			y: 0
		};
		#comboSubscriptions = new Map();
		#actionSubscriptions = new Map();
		#holdSubscriptions = new Map();
		#exclusiveStack = new Map();
		#listeners;
		#isCaptureListenerBound = false;
		#isReleased = false;
		constructor(options = {}) {
			this.#isMac = main_core.Type.isBoolean(options?.isMac) ? options.isMac : main_core.Browser.isMac();
			this.#actionRegistry = options?.actionRegistry ?? null;
			this.#listeners = {
				keydown: this.#handleKeyDown,
				keyup: this.#handleKeyUp,
				pointerdown: this.#handlePointerDown,
				pointerup: this.#handlePointerUp,
				pointermove: this.#handlePointerMove,
				blur: this.#handleBlur,
				visibilitychange: this.#handleVisibilityChange
			};
		}
		attach(target = window) {
			this.#isReleased = false;
			if (!main_core.Type.isNil(this.#target)) {
				return;
			}
			this.#target = target;
			Object.entries(this.#listeners).forEach(([eventName, handler]) => {
				main_core.Event.bind(target, eventName, handler);
			});
			this.#ensureCaptureListener();
		}
		detach() {
			this.#isReleased = true;
			if (main_core.Type.isNil(this.#target)) {
				return;
			}
			Object.entries(this.#listeners).forEach(([eventName, handler]) => {
				main_core.Event.unbind(this.#target, eventName, handler);
			});
			this.#unbindCaptureListener();
			this.#target = null;
			this.reset();
			// A claim lives as long as the operation that took it, and detach ends every operation on
			// this state: kept here, the registry would raise the channel again on the next attach and
			// hand the key to owners that are gone.
			this.#exclusiveStack.clear();
		}
		isPressed(token) {
			this.#autoAttach();
			const normalized = normalizeToken(token, this.#isMac);
			if (!main_core.Type.isStringFilled(normalized)) {
				return false;
			}
			return this.#hasToken(normalized);
		}
		get pointer() {
			this.#autoAttach();
			return {
				...this.#pointer
			};
		}
		reset() {
			const holdStates = this.#captureHoldStates();
			this.#pressedTokens.clear();
			this.#notifyHoldChanges(holdStates, null);
		}
		on(combo, handler, options = {}) {
			this.#autoAttach();
			const key = normalizeCombo(combo, this.#isMac);
			if (!main_core.Type.isStringFilled(key) || !main_core.Type.isFunction(handler)) {
				return () => {};
			}
			const subscription = {
				handler,
				preventDefault: main_core.Type.isBoolean(options?.preventDefault) ? options.preventDefault : true
			};
			this.#addSubscription(this.#comboSubscriptions, key, subscription);
			return () => {
				this.#removeSubscription(this.#comboSubscriptions, key, subscription);
			};
		}

		/**
		 * Subscribes by what the press does rather than by which keys do it: which combo runs the action
		 * is the answer of the registry handed to the state, and it may change while the subscription
		 * lives. A state with no registry behind it never resolves an action and this channel stays
		 * silent. The channels are independent - the same press reaches a record of each - and the rules
		 * of `on()` hold here too: an input field with the focus takes the key, and the browser action is
		 * suppressed unless the record opts out.
		 */
		onAction(actionId, handler, options = {}) {
			this.#autoAttach();
			if (!main_core.Type.isStringFilled(actionId) || !main_core.Type.isFunction(handler)) {
				return () => {};
			}
			const subscription = {
				handler,
				preventDefault: main_core.Type.isBoolean(options?.preventDefault) ? options.preventDefault : true
			};
			this.#addSubscription(this.#actionSubscriptions, actionId, subscription);
			return () => {
				this.#removeSubscription(this.#actionSubscriptions, actionId, subscription);
			};
		}

		/**
		 * Claims the combo for one operation: the record goes on a stack, only its top handler runs, and
		 * the event stops before the layers above the canvas see it. The record lives exactly as long as
		 * the operation - the returned function is the only way to drop it - so with nothing running the
		 * combo behaves as it always did. Suppressing the browser action is never part of the deal.
		 */
		onExclusive(combo, handler) {
			this.#autoAttach();
			const key = normalizeCombo(combo, this.#isMac);
			if (!main_core.Type.isStringFilled(key) || !main_core.Type.isFunction(handler)) {
				return () => {};
			}
			this.#addSubscription(this.#exclusiveStack, key, handler);
			this.#ensureCaptureListener();
			return () => {
				this.#removeSubscription(this.#exclusiveStack, key, handler);
				this.#releaseCaptureListenerIfEmpty();
			};
		}

		/**
		 * Whether the combo is claimed right now. A tool that has just given its own claim back asks
		 * about what is left under it: with the stack empty the combo belongs to the canvas again, and
		 * with anything still on it the layer holding the key decides what happens next.
		 */
		hasExclusiveClaims(combo) {
			const key = normalizeCombo(combo, this.#isMac);
			return main_core.Type.isStringFilled(key) && this.#exclusiveStack.has(key);
		}
		onChange(token, handler) {
			this.#autoAttach();
			const key = normalizeToken(token, this.#isMac);
			if (!main_core.Type.isStringFilled(key) || !main_core.Type.isFunction(handler)) {
				return () => {};
			}
			this.#addSubscription(this.#holdSubscriptions, key, handler);
			return () => {
				this.#removeSubscription(this.#holdSubscriptions, key, handler);
			};
		}

		// Auto repeat runs the action again, the way holding an undo shortcut has always worked. Hold
		// subscribers stay silent through it: #notifyHoldChanges reports edges, and a repeat is none.
		#handleKeyDown = event => {
			const token = this.#keyToken(event);
			this.#applyInputEvent(event, () => {
				this.#press(token);
			});
			if (isInputEventTarget(event)) {
				return;
			}
			const combo = this.#comboFromEvent(event, token);
			// The action channel answers first: a record that named what it does must not depend on
			// whether a neighbour still names the keys.
			this.#trigger(this.#actionSubscriptions, this.#resolveAction(combo), event);
			this.#trigger(this.#comboSubscriptions, combo, event);
		};

		// The exclusive channel. It runs before everything above the canvas, so the bookkeeping comes
		// first and unconditionally: the bubbling handler never sees an event this one takes away, and
		// the held set must not depend on which channel delivered it.
		#handleCaptureKeyDown = event => {
			const token = this.#keyToken(event);
			this.#applyInputEvent(event, () => {
				this.#press(token);
			});

			// While an IME composes, the press belongs to the composition: Escape ends it, and taking
			// the key away here would spend one press on two different things.
			if (event.isComposing === true || event.keyCode === IME_PROCESSING_KEY_CODE) {
				return;
			}

			// A suspended registry means a panel above the canvas has taken the keyboard - the settings
			// panel recording a combo does exactly that. This channel listens on the window, above every
			// listener of that panel, so staying silent with the registry is what lets the press reach it.
			if (this.#actionRegistry?.isSuspended === true) {
				return;
			}
			const key = this.#comboFromEvent(event, token);
			const stack = main_core.Type.isStringFilled(key) ? this.#exclusiveStack.get(key) : null;
			if (main_core.Type.isNil(stack)) {
				return;
			}

			// Escape types nothing, so a focused field has no claim on it; every other combo keeps the
			// rule of the bubbling channel.
			if (isInputEventTarget(event) && key !== KEY_TOKEN.ESCAPE) {
				return;
			}

			// The key is taken from the layers above, not from the browser: preventDefault stays out.
			event.stopPropagation();
			stack[stack.length - 1](event, this);
		};
		#handleKeyUp = event => {
			const token = this.#keyToken(event);
			this.#applyInputEvent(event, () => {
				// While the command key is down macOS delivers no keyup for regular keys, so releasing
				// it leaves the rest of the set stale.
				if (this.#isMac && this.#matchToken(token, 'meta')) {
					this.#pressedTokens.clear();
					return;
				}
				this.#pressedTokens.delete(token);
			});
		};
		#handlePointerDown = event => {
			const token = this.#mouseToken(event.button);
			this.#applyInputEvent(event, () => {
				this.#press(token);
				this.#updatePointer(event);
			});
			if (isInputEventTarget(event)) {
				return;
			}
			this.#trigger(this.#comboSubscriptions, this.#comboFromEvent(event, token), event);
		};
		#handlePointerUp = event => {
			this.#applyInputEvent(event, () => {
				this.#pressedTokens.delete(this.#mouseToken(event.button));
				this.#updatePointer(event);
			});
		};

		// Movement holds nothing down: the only holds it can change are the modifiers of the event.
		#handlePointerMove = event => {
			this.#applyInputEvent(event, () => {
				this.#updatePointer(event);
			}, true);
		};

		// A window that loses focus never delivers the keyup of a held key.
		#handleBlur = () => {
			this.reset();
		};

		// Bound on the same target as the rest, `window` by default, and that is enough: the HTML
		// standard fires visibilitychange at the document with bubbles set to true, so it reaches a
		// listener on the window. Binding a document of its own would be the class holding a second
		// target to unbind from.
		#handleVisibilityChange = event => {
			// The event bubbles from the document, so the state is read off the event itself: the class
			// keeps no reference to a document of its own.
			if (event?.target?.visibilityState === HIDDEN_VISIBILITY_STATE) {
				this.reset();
			}
		};

		// Anyone who touches the state gets it live, whether the owner of the canvas has mounted yet or
		// not: a consumer that only reads the holds never subscribes, so subscriptions alone would not
		// cover it. A released state stays released - only an explicit attach revives it, or a read
		// after unmount would bring the listeners back with nothing to own them.
		#autoAttach() {
			if (!main_core.Type.isNil(this.#target) || this.#isReleased) {
				return;
			}
			this.attach();
		}

		// An empty registry leaves the target exactly as it was before the class learned about exclusive
		// subscriptions at all.
		#ensureCaptureListener() {
			if (this.#isCaptureListenerBound || this.#exclusiveStack.size === 0 || main_core.Type.isNil(this.#target)) {
				return;
			}
			main_core.Event.bind(this.#target, 'keydown', this.#handleCaptureKeyDown, CAPTURE_LISTENER_OPTIONS$1);
			this.#isCaptureListenerBound = true;
		}
		#releaseCaptureListenerIfEmpty() {
			if (this.#exclusiveStack.size > 0) {
				return;
			}
			this.#unbindCaptureListener();
		}
		#unbindCaptureListener() {
			if (!this.#isCaptureListenerBound) {
				return;
			}
			main_core.Event.unbind(this.#target, 'keydown', this.#handleCaptureKeyDown, CAPTURE_LISTENER_OPTIONS$1);
			this.#isCaptureListenerBound = false;
		}
		#applyInputEvent(event, mutate, modifiersOnly = false) {
			const holdStates = this.#captureHoldStates(modifiersOnly);
			mutate();
			this.#syncModifiers(event);
			this.#notifyHoldChanges(holdStates, event);
		}

		// Every input event carries the modifier flags, so each of them corrects the tracked set -
		// including a modifier toggled while the window was out of focus.
		#syncModifiers(event) {
			MODIFIERS.forEach(modifier => {
				const isDown = event[MODIFIER_EVENT_FLAGS[modifier]] === true;
				if (isDown === this.#hasToken(modifier)) {
					return;
				}
				if (isDown) {
					this.#pressedTokens.add(modifier);
					return;
				}
				[...this.#pressedTokens].filter(pressed => this.#matchToken(pressed, modifier)).forEach(pressed => this.#pressedTokens.delete(pressed));
			});
		}

		// Runs several times per input event, so the set is read in place: no copy, no re-normalization
		// of a token the caller has already normalized.
		#hasToken(normalizedToken) {
			if (this.#pressedTokens.has(normalizedToken)) {
				return true;
			}
			for (const pressed of this.#pressedTokens) {
				if (stripSide(pressed) === normalizedToken) {
					return true;
				}
			}
			return false;
		}

		// A key an input method sends without a code would land in the set as an empty token.
		#press(token) {
			if (main_core.Type.isStringFilled(token)) {
				this.#pressedTokens.add(token);
			}
		}
		#updatePointer(event) {
			this.#pointer.x = event.clientX;
			this.#pointer.y = event.clientY;
		}
		#trigger(registry, key, event) {
			const subscriptions = main_core.Type.isStringFilled(key) ? registry.get(key) : null;
			if (main_core.Type.isNil(subscriptions)) {
				return;
			}
			[...subscriptions].forEach(subscription => {
				if (subscription.preventDefault) {
					event.preventDefault();
				}
				subscription.handler(event, this);
			});
		}

		// The combo of an event is built from its own key: a shortcut fires on the key that arrived,
		// not on everything held at that moment.
		#comboFromEvent(event, token) {
			if (isModifierToken(token)) {
				return null;
			}
			const modifiers = MODIFIERS.filter(modifier => event[MODIFIER_EVENT_FLAGS[modifier]] === true);
			return [...modifiers, token].join(COMBO_SEPARATOR$2);
		}

		// A suspended registry resolves nothing: the settings panel takes the keyboard for itself while
		// it captures a combo, and the state keeps tracking the held keys throughout. A combo of null is
		// a press of a bare modifier, which names no action either.
		#resolveAction(combo) {
			if (main_core.Type.isNil(this.#actionRegistry) || this.#actionRegistry.isSuspended) {
				return null;
			}
			return main_core.Type.isStringFilled(combo) ? this.#actionRegistry.getAction(combo) : null;
		}

		// An empty registry is answered with null: nothing to compare against, nothing to allocate.
		#captureHoldStates(modifiersOnly = false) {
			if (this.#holdSubscriptions.size === 0) {
				return null;
			}
			const states = new Map();
			this.#holdSubscriptions.forEach((handlers, token) => {
				if (modifiersOnly && !isModifierToken(token)) {
					return;
				}
				states.set(token, this.#hasToken(token));
			});
			return states;
		}
		#notifyHoldChanges(previousStates, event) {
			if (main_core.Type.isNil(previousStates)) {
				return;
			}
			previousStates.forEach((wasPressed, token) => {
				const isPressed = this.#hasToken(token);
				const handlers = this.#holdSubscriptions.get(token);
				if (isPressed === wasPressed || main_core.Type.isNil(handlers)) {
					return;
				}
				[...handlers].forEach(handler => handler(isPressed, event));
			});
		}
		#addSubscription(registry, key, subscription) {
			const subscriptions = registry.get(key) ?? [];
			subscriptions.push(subscription);
			registry.set(key, subscriptions);
		}
		#removeSubscription(registry, key, subscription) {
			const subscriptions = registry.get(key);
			if (main_core.Type.isNil(subscriptions)) {
				return;
			}
			const index = subscriptions.indexOf(subscription);
			if (index === -1) {
				return;
			}
			subscriptions.splice(index, 1);
			if (subscriptions.length === 0) {
				registry.delete(key);
			}
		}
		#mouseToken(button) {
			return `${MOUSE_TOKEN_PREFIX}${button}`;
		}

		// The physical code keeps a shortcut independent of the layout, but a synthesized event may
		// carry none: assistive technologies and input bridges send the key alone.
		#keyToken(event) {
			if (main_core.Type.isStringFilled(event.code)) {
				return normalizeToken(event.code, this.#isMac);
			}

			// The space arrives as its character, which the trim of the normalization would eat.
			return event.key === SPACE_KEY ? KEY_TOKEN.SPACE : normalizeToken(event.key, this.#isMac);
		}
		#matchToken(pressedToken, token) {
			return pressedToken === token || stripSide(pressedToken) === token;
		}
	}

	// Combos the browser or the operating system takes for itself: a canvas action bound to one of them
	// would never see the press. There is no way to detect the interception at runtime, so the lists are
	// curated and grow as cases are found. Spelling is the canonical combo form of the input layer:
	// modifiers in the ctrl - alt - shift - meta order, then the key token.

	const COMMON_RESERVED_COMBOS = Object.freeze([
		'f5',
		'f11',
		'f12',
		// The second spelling of delete-block (block-diagram.js registers it as a plain combo record,
		// not through an action id, precisely because it is a fixed alias rather than an action of its
		// own). The registry has no entry to protect it with otherwise, and handing it to another action
		// would fire both on every press: the assigned action and the delete, at once.
		'backspace',
	]);

	const MAC_RESERVED_COMBOS = Object.freeze([
		'meta+keyd',
		'meta+keyh',
		'meta+keyl',
		'meta+keym',
		'meta+keyn',
		'meta+keyp',
		'meta+keyq',
		'meta+keyr',
		'meta+keyt',
		'meta+keyw',
		'meta+space',
		'meta+tab',
		'shift+meta+keyn',
		'shift+meta+keyt',
		'alt+meta+keyi',
	]);

	const OTHER_RESERVED_COMBOS = Object.freeze([
		'ctrl+keyd',
		'ctrl+keyl',
		'ctrl+keyn',
		'ctrl+keyp',
		'ctrl+keyq',
		'ctrl+keyr',
		'ctrl+keyt',
		'ctrl+keyw',
		'ctrl+shift+keyi',
		'ctrl+shift+keyj',
		'ctrl+shift+keyn',
		'ctrl+shift+keyt',
		'alt+tab',
		'alt+f4',
	]);

	/**
	 * Reserved combos of one platform. A fresh set per call: the caller owns what it gets and the
	 * registry asks once, when it is built.
	 *
	 * @param {boolean} isMac
	 * @returns {Set<string>}
	 */
	function getReservedCombos(isMac)
	{
		return new Set([
			...COMMON_RESERVED_COMBOS,
			...(isMac ? MAC_RESERVED_COMBOS : OTHER_RESERVED_COMBOS),
		]);
	}

	const ComboVerdict = Object.freeze({
		FREE: 'free',
		OCCUPIED: 'occupied',
		RESERVED: 'reserved',
	});

	/**
	 * Only the entries that actually hold a combo. A default of null declares an action that ships
	 * without one: it is a known action - an override may reach it - but nothing to index by combo.
	 *
	 * @param {Map<string, string | null>} bindings combo per action id
	 * @returns {Map<string, string>}
	 */
	function keepAssigned(bindings)
	{
		const assigned = new Map();

		bindings.forEach((combo, actionId) => {
			if (!main_core.Type.isNil(combo))
			{
				assigned.set(actionId, combo);
			}
		});

		return assigned;
	}

	/**
	 * Applies the overrides on top of the defaults. An override of an action the defaults do not declare
	 * is dropped, and a null combo takes the shortcut away from its action.
	 *
	 * @param {Map<string, string | null>} defaults canonical combo per action id, null for an action
	 *   that ships without one
	 * @param {Map<string, string | null>} overrides difference from the defaults
	 * @returns {Map<string, string>}
	 */
	function mergeOverrides(defaults, overrides)
	{
		const bindings = keepAssigned(defaults);

		overrides.forEach((combo, actionId) => {
			if (!defaults.has(actionId))
			{
				return;
			}

			if (main_core.Type.isNil(combo))
			{
				bindings.delete(actionId);

				return;
			}

			bindings.set(actionId, combo);
		});

		return bindings;
	}

	/**
	 * @param {Map<string, string>} bindings combo per action id
	 * @returns {Map<string, string>} action id per combo
	 */
	function invertBindings(bindings)
	{
		const actionByCombo = new Map();

		bindings.forEach((combo, actionId) => {
			actionByCombo.set(combo, actionId);
		});

		return actionByCombo;
	}

	/**
	 * Combos claimed by more than one action, each with the ids claiming it. Empty while the invariant
	 * holds.
	 *
	 * @param {Map<string, string>} bindings combo per action id
	 * @returns {string[]} one entry per conflicting combo
	 */
	function describeComboConflicts(bindings)
	{
		const actionsByCombo = new Map();

		bindings.forEach((combo, actionId) => {
			const actions = actionsByCombo.get(combo) ?? [];
			actions.push(actionId);
			actionsByCombo.set(combo, actions);
		});

		const conflicts = [];

		actionsByCombo.forEach((actions, combo) => {
			if (actions.length > 1)
			{
				conflicts.push(`${combo} -> ${actions.join(', ')}`);
			}
		});

		return conflicts;
	}

	/**
	 * Owns the link between an action id and its combo in both directions. The reverse index is the
	 * single answer to "is this combo taken": it is rebuilt with every set, never searched through.
	 * Combos arrive canonical - normalization stays with the input layer - and the registry knows nothing
	 * beyond the ids: no names, no groups, no localization.
	 *
	 * Suspension is a flag of the registry, not a detached listener: the input layer keeps tracking
	 * pressed keys throughout, or the modifiers it holds would drift apart from the keyboard by the time
	 * the registry resumes. The validator stands outside the flag on purpose - the settings panel
	 * suspends the registry exactly to capture a combo, and asks about that combo while the capture runs.
	 *
	 * The maps themselves are plain - a store keeps the registry markRaw - so the version is the only
	 * reactive thing it publishes, and reading a combo touches it: a computed built on a combo follows
	 * a reassignment of the set without knowing the version exists.
	 */
	class ActionRegistry
	{
		#comboByAction = new Map();
		#actionByCombo = new Map();
		#reservedCombos = getReservedCombos(main_core.Browser.isMac());
		#isSuspended = false;
		#version = ui_vue3.shallowRef(0);

		/**
		 * @param {Map<string, string | null>} defaults canonical combo per action id. An action declared
		 *   with null ships without a combo and is still known: this is how a user gives it the first one.
		 * @param {Map<string, string | null>} [overrides] difference from the defaults
		 */
		applyBindings(defaults, overrides = new Map())
		{
			const plainDefaults = keepAssigned(defaults);
			const bindings = mergeOverrides(defaults, overrides);
			const actionByCombo = invertBindings(bindings);
			// One combo belongs to at most one action. A set that breaks the invariant is a data error:
			// it is rejected whole, and the plain defaults take its place.
			const isAccepted = actionByCombo.size === bindings.size;

			if (!isAccepted)
			{
				console.error(
					'ui.block-diagram: personal shortcuts dropped, the defaults take their place. '
					+ `A combo is claimed by several actions: ${describeComboConflicts(bindings).join('; ')}`,
				);
			}

			this.#comboByAction = isAccepted ? bindings : plainDefaults;
			this.#actionByCombo = isAccepted ? actionByCombo : invertBindings(plainDefaults);
			// The rejected set counts too: the registry stands on the defaults now, and that is a change
			// of what every combo of it is.
			this.#version.value += 1;
		}

		/**
		 * The count of sets applied so far. `getCombo()` reads it on its own, so a caption or an
		 * announcement built on a combo already follows a reassignment; this is for a reader that has to
		 * follow the set without asking for a combo of any action.
		 *
		 * @returns {number}
		 */
		getVersion()
		{
			return this.#version.value;
		}

		/**
		 * @returns {string | null} canonical combo of the action, null when it holds none
		 */
		getCombo(actionId)
		{
			// Deliberate call with the result dropped, not a leftover line: reading the version is what
			// subscribes a computed built on this call to a reassignment of the set. The maps behind the
			// combos are plain, so the version is the only reactive thing such a computed can follow.
			this.getVersion();

			return this.#comboByAction.get(actionId) ?? null;
		}

		/**
		 * @returns {string | null} action the combo runs, null while the registry is suspended
		 */
		getAction(combo)
		{
			if (this.#isSuspended)
			{
				return null;
			}

			return this.#actionByCombo.get(combo) ?? null;
		}

		/**
		 * @param {string} combo canonical combo to assign
		 * @param {string | null} [forActionId] action the combo is meant for: its own combo reads as free
		 * @returns {string} one of ComboVerdict
		 */
		validate(combo, forActionId = null)
		{
			if (this.#reservedCombos.has(combo))
			{
				return ComboVerdict.RESERVED;
			}

			const occupant = this.#actionByCombo.get(combo) ?? null;

			if (occupant === null || occupant === forActionId)
			{
				return ComboVerdict.FREE;
			}

			return ComboVerdict.OCCUPIED;
		}

		suspend()
		{
			this.#isSuspended = true;
		}

		resume()
		{
			this.#isSuspended = false;
		}

		get isSuspended()
		{
			return this.#isSuspended;
		}
	}

	/**
	 * The actions the canvas owns itself. A consumer names them by these ids - in a catalog of its own
	 * and in the set of bindings it hands the registry - so the ids are part of the public surface.
	 */
	const CANVAS_ACTION_ID = Object.freeze({
		UNDO: 'canvas.undo',
		REDO: 'canvas.redo',
		COPY: 'canvas.copy',
		PASTE: 'canvas.paste',
		TOGGLE_SEARCH: 'canvas.toggleSearch',
		TOGGLE_MAP: 'canvas.toggleMap',
		ZOOM_IN: 'canvas.zoomIn',
		ZOOM_OUT: 'canvas.zoomOut',
		FIT_TO_VIEW: 'canvas.fitToView',
		NEXT_SEARCH_RESULT: 'canvas.nextSearchResult',
		PREV_SEARCH_RESULT: 'canvas.prevSearchResult',
	});

	/**
	 * The combos those actions ship with. Redo is the one that differs by platform, and the difference
	 * lives here rather than at the place of registration: a registration names the action it runs and
	 * never the keys that run it.
	 *
	 * A fresh map on every call, because a consumer merging its own actions into the set works on what
	 * it is given - the defaults of the layer are not its to write into.
	 *
	 * @param {boolean} [isMac]
	 * @returns {Map<string, string | null>} canonical combo per action id, null for an action that ships
	 *   without one on this platform
	 */
	function getCanvasActionDefaults(isMac = main_core.Browser.isMac())
	{
		return new Map([
			[CANVAS_ACTION_ID.UNDO, normalizeCombo(['Mod', 'z'], isMac)],
			[CANVAS_ACTION_ID.REDO, normalizeCombo(isMac ? ['Mod', 'Shift', 'z'] : ['Mod', 'y'], isMac)],
			[CANVAS_ACTION_ID.COPY, normalizeCombo(['Mod', 'c'], isMac)],
			[CANVAS_ACTION_ID.PASTE, normalizeCombo(['Mod', 'v'], isMac)],
			[CANVAS_ACTION_ID.TOGGLE_SEARCH, normalizeCombo(['Mod', 'f'], isMac)],
			// Shift keeps the combo away from Cmd+M, which minimizes the window on macOS before the page
			// ever sees the press (reserved-combos.ts lists 'meta+keym'): one and the same combo on both
			// platforms instead of an action that ships without a default on one of them.
			[CANVAS_ACTION_ID.TOGGLE_MAP, normalizeCombo(['Mod', 'Shift', 'm'], isMac)],
			[CANVAS_ACTION_ID.ZOOM_IN, normalizeCombo(['Mod', 'Equal'], isMac)],
			[CANVAS_ACTION_ID.ZOOM_OUT, normalizeCombo(['Mod', 'Minus'], isMac)],
			// The only action of the layer whose default types a character, and the one combo among them
			// that reads the same on every platform: no modifier of the platform takes part in it. The keys
			// come from the constant that declares this default, while what the panel and the canvas announce
			// through `aria-keyshortcuts` is read from the registry, so it follows a reassignment. A press
			// into a field being edited is left alone by the input state, as for every action here, and the
			// narrower rule - the command answers only while the focus stands on a surface of the diagram -
			// belongs to the place of registration (`components/zoom-bar/zoom-bar.js`).
			[CANVAS_ACTION_ID.FIT_TO_VIEW, normalizeCombo(FIT_TO_VIEW_SHORTCUT, isMac)],
			[CANVAS_ACTION_ID.NEXT_SEARCH_RESULT, normalizeCombo(['Mod', 'Shift', 'ArrowRight'], isMac)],
			[CANVAS_ACTION_ID.PREV_SEARCH_RESULT, normalizeCombo(['Mod', 'Shift', 'ArrowLeft'], isMac)],
		]);
	}

	const COMBO_SEPARATOR$1 = '+';
	const LETTER_TOKEN_PREFIX$1 = 'key';
	const DIGIT_TOKEN_PREFIX$1 = 'digit';
	const MAC_SEPARATOR = '';

	const MODIFIER_CAPTIONS = Object.freeze({
		ctrl: { mac: '⌃', other: 'Ctrl' },
		alt: { mac: '⌥', other: 'Alt' },
		shift: { mac: '⇧', other: 'Shift' },
		meta: { mac: '⌘', other: 'Meta' },
	});

	// Tokens whose canonical spelling is not a caption. Everything else is derived: a letter and a digit
	// lose their prefix, the rest is the token with a capital first letter.
	const KEY_CAPTIONS = Object.freeze({
		space: 'Space',
		escape: 'Esc',
		arrowleft: 'Left',
		arrowright: 'Right',
		arrowup: 'Up',
		arrowdown: 'Down',
		minus: '-',
		equal: '=',
		bracketleft: '[',
		bracketright: ']',
		comma: ',',
		period: '.',
		slash: '/',
		semicolon: ';',
		quote: '\'',
		backquote: '`',
		backslash: '\\',
	});

	function formatToken(token, isMac)
	{
		const modifier = MODIFIER_CAPTIONS[token];

		if (!main_core.Type.isNil(modifier))
		{
			return isMac ? modifier.mac : modifier.other;
		}

		const caption = KEY_CAPTIONS[token];

		if (!main_core.Type.isNil(caption))
		{
			return caption;
		}

		if (token.startsWith(LETTER_TOKEN_PREFIX$1))
		{
			return token.slice(LETTER_TOKEN_PREFIX$1.length).toUpperCase();
		}

		if (token.startsWith(DIGIT_TOKEN_PREFIX$1))
		{
			return token.slice(DIGIT_TOKEN_PREFIX$1.length);
		}

		return token.charAt(0).toUpperCase() + token.slice(1);
	}

	/**
	 * Single owner of how a combo reads on screen: a canonical combo in, the caption of the current
	 * platform out. macOS packs symbolic modifiers with no separator, every other platform spells them
	 * out and joins with a plus.
	 *
	 * The canonical form never spells a key as '+', so splitting the combo by the separator is safe.
	 *
	 * @param {string} combo canonical combo
	 * @returns {string}
	 */
	function formatComboCaption(combo)
	{
		if (!main_core.Type.isStringFilled(combo))
		{
			return '';
		}

		const isMac = main_core.Browser.isMac();

		return combo
			.split(COMBO_SEPARATOR$1)
			.map((token) => formatToken(token, isMac))
			.join(isMac ? MAC_SEPARATOR : COMBO_SEPARATOR$1);
	}

	const COMBO_SEPARATOR = '+';
	const LETTER_TOKEN_PREFIX = 'key';
	const DIGIT_TOKEN_PREFIX = 'digit';

	// `aria-keyshortcuts` is spelled in the key names of UI Events, and the canonical token of the input
	// layer is the physical code: the two part ways on every key that types a character, so the caption
	// of `formatComboCaption` (which reads for a person) cannot stand in for this one.
	const MODIFIER_KEY_NAMES = Object.freeze({
		ctrl: 'Control',
		alt: 'Alt',
		shift: 'Shift',
		meta: 'Meta',
	});

	const KEY_NAMES = Object.freeze({
		space: 'Space',
		escape: 'Escape',
		enter: 'Enter',
		tab: 'Tab',
		backspace: 'Backspace',
		delete: 'Delete',
		insert: 'Insert',
		arrowleft: 'ArrowLeft',
		arrowright: 'ArrowRight',
		arrowup: 'ArrowUp',
		arrowdown: 'ArrowDown',
		minus: '-',
		equal: '=',
		bracketleft: '[',
		bracketright: ']',
		comma: ',',
		period: '.',
		slash: '/',
		semicolon: ';',
		quote: '\'',
		backquote: '`',
		backslash: '\\',
	});

	function formatKeyName(token)
	{
		const modifier = MODIFIER_KEY_NAMES[token];

		if (!main_core.Type.isNil(modifier))
		{
			return modifier;
		}

		const name = KEY_NAMES[token];

		if (!main_core.Type.isNil(name))
		{
			return name;
		}

		if (token.startsWith(LETTER_TOKEN_PREFIX))
		{
			return token.slice(LETTER_TOKEN_PREFIX.length).toUpperCase();
		}

		if (token.startsWith(DIGIT_TOKEN_PREFIX))
		{
			return token.slice(DIGIT_TOKEN_PREFIX.length);
		}

		return token.charAt(0).toUpperCase() + token.slice(1);
	}

	/**
	 * The combo of an action as `aria-keyshortcuts` declares it. An action holding no combo announces
	 * nothing at all, and null is what leaves the attribute off the element.
	 *
	 * @param {string | null} combo canonical combo
	 * @returns {string | null}
	 */
	function formatComboKeyshortcuts(combo)
	{
		if (!main_core.Type.isStringFilled(combo))
		{
			return null;
		}

		return combo
			.split(COMBO_SEPARATOR)
			.map((token) => formatKeyName(token))
			.join(COMBO_SEPARATOR)
		;
	}

	const POPUP_MANAGER_CLASS_NAME = 'BX.Main.PopupManager';

	/**
	 * Whether a layer above the canvas holds the keyboard right now. Asked at the moment of the press
	 * and never remembered: a popup opens and closes without telling the canvas about it, so a
	 * subscription would have to be kept in step with a layer the canvas does not own.
	 *
	 * Public on purpose - the editor built over this extension answers the same question about the same
	 * popups, and one rule implemented twice is two rules.
	 *
	 * A page carrying no popup manager carries no such layer either, so the keyboard is free.
	 */
	function isKeyboardBusyByOverlay() {
		const popupManager = main_core.Reflection.getClass(POPUP_MANAGER_CLASS_NAME);
		if (!main_core.Type.isFunction(popupManager?.isAnyPopupBlockingBackgroundEscShown)) {
			return false;
		}
		return popupManager.isAnyPopupBlockingBackgroundEscShown() === true;
	}

	/**
	 * The document's own text selection, but only when it holds text. Both questions this file answers
	 * start here, so "there is a text selection" means the same thing to the guard that reads it and to
	 * the press that drops it.
	 *
	 * A caret carries no text, and neither does a run of whitespace: both read as no selection. A
	 * browser without the Selection API reads the same way, so the caller never has to guard the call.
	 */
	function getNonEmptyTextSelection()
	{
		const selection = main_core.Type.isFunction(window.getSelection) ? window.getSelection() : null;

		if (main_core.Type.isNil(selection) || selection.rangeCount === 0 || selection.isCollapsed)
		{
			return null;
		}

		return main_core.Type.isStringFilled(selection.toString().trim()) ? selection : null;
	}

	/**
	 * Answers one question: does the document hold a non-empty text selection lying outside the given
	 * boundary element? The function is pure - nothing is cached, nothing is subscribed to - so it is
	 * asked at the moment a key is handled.
	 *
	 * A boundary that is not an element - missing, or a reference to a node that has not mounted yet -
	 * means "not outside": with nothing to measure against, the answer stays with the caller.
	 */
	function hasTextSelectionOutside(boundaryElement)
	{
		if (!main_core.Type.isElementNode(boundaryElement))
		{
			return false;
		}

		const selection = getNonEmptyTextSelection();

		if (main_core.Type.isNil(selection))
		{
			return false;
		}

		const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;

		return !main_core.Type.isNil(commonAncestor) && !boundaryElement.contains(commonAncestor);
	}

	/**
	 * Drops the text selection of the document, if there is one to drop. A caret is left where it
	 * stands: it is a cursor, not a selection.
	 */
	function clearTextSelection()
	{
		getNonEmptyTextSelection()?.removeAllRanges();
	}

	// Both directions copy deeply, so the buffer neither follows later edits of the copied blocks nor
	// hands out a fragment that a caller can edit in place.
	function cloneContent(content) {
		return JSON.parse(JSON.stringify(content));
	}

	/**
	 * One buffer per diagram application: a fragment stays available to any canvas of that application
	 * and outlives the canvas it was copied from. It never enters a history snapshot and is never reset
	 * by time or by any event.
	 */
	class CopyPasteBuffer {
		// Only the reference swap has to stay reactive, that is all #isEmpty reads. A deep proxy over
		// every block of the fragment would just make reading and cloning the buffer more expensive.
		#copiedContent = ui_vue3.shallowRef(null);

		// "nothing has been copied", not "the fragment is empty": a fragment with empty arrays still
		// leaves the buffer filled.
		#isEmpty = ui_vue3.computed(() => this.#copiedContent.value === null);
		get isEmpty() {
			return this.#isEmpty;
		}
		setContent(content) {
			this.#copiedContent.value = cloneContent(content);
		}
		getContent() {
			if (this.#copiedContent.value === null) {
				return null;
			}
			return cloneContent(this.#copiedContent.value);
		}
		clear() {
			this.#copiedContent.value = null;
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

	function createDiagramBlockId() {
		return main_core.Text.getRandom();
	}

	/**
	 * Gives every block and every connection of the fragment a fresh id and rebinds the connection
	 * ends through the block id map. The rebinding is explicit: an end that leads outside the fragment
	 * keeps its id, and port ids are never touched - they are unique only inside their own block.
	 * Only the block id format is an extension point: a connection id is always issued by the core,
	 * because connections belong to the core while a block may carry a format of its own.
	 */
	function issueNewFragmentIds(content, createBlockId = createDiagramBlockId) {
		const blockIdMap = new Map();
		const blocks = content.blocks.map(block => {
			const id = createBlockId();
			blockIdMap.set(block.id, id);
			return {
				...block,
				id
			};
		});
		const connections = content.connections.map(connection => ({
			...connection,
			id: main_core.Text.getRandom(),
			sourceBlockId: blockIdMap.get(connection.sourceBlockId) ?? connection.sourceBlockId,
			targetBlockId: blockIdMap.get(connection.targetBlockId) ?? connection.targetBlockId
		}));
		return {
			content: {
				blocks,
				connections
			},
			blockIdMap
		};
	}

	/**
	 * Places the fragment against the paste point. The point is only rounded, never aligned to the
	 * grid, so the fragment lands exactly where it was aimed at even while snapToGrid is on. Origin is
	 * the position of the first block, the rest keep their offsets from it, so the fragment moves as a
	 * whole. Every field other than position carries over untouched.
	 */
	function layoutFragmentBlocks(blocks, point) {
		if (blocks.length === 0) {
			return [];
		}
		const pastePoint = {
			x: Math.round(point.x),
			y: Math.round(point.y)
		};
		const origin = {
			...blocks[0].position
		};
		return blocks.map(block => ({
			...block,
			position: {
				x: pastePoint.x + (block.position.x - origin.x),
				y: pastePoint.y + (block.position.y - origin.y)
			}
		}));
	}

	// A palette is a plain dictionary of CSS colors keyed by a name or an index from a saved template,
	// so anything else - a list, an instance, an entry that is not a color - is a mistake of the
	// consumer. Shared by the property validators of every component taking a palette, so the map and
	// the bar judge a palette by one and the same rule. It only reports: the drawing path keeps its own
	// fallbacks, and an empty palette is a valid one.
	function isValidColorPalette(palette) {
		if (!main_core.Type.isPlainObject(palette)) {
			return false;
		}
		return Object.values(palette).every(color => main_core.Type.isStringFilled(color));
	}

	// The single place the shape of "action (shortcut)" is written. A label with nothing in it - an empty
	// string, or the null of a phrase missing from the portal - is how a caller says there is no caption at
	// all, and an empty shortcut leaves the action named without an empty pair of brackets.
	function withShortcut(label, shortcut) {
		if (!label) {
			return '';
		}
		if (shortcut === '') {
			return label;
		}
		return `${label} (${shortcut})`;
	}

	// The half of the announcement that never moves: the arrows pan the camera and belong to the surface
	// itself rather than to the registry, so no one reassigns them.
	const PAN_KEY_SHORTCUTS = 'ArrowUp ArrowDown ArrowLeft ArrowRight';

	/**
	 * The `aria-keyshortcuts` of a surface of the canvas: the panning of the camera, which is its own, and
	 * the fit of the whole scheme, which runs here as well but is registered by the zoom bar the consumer
	 * mounts next to the diagram (`components/zoom-bar/zoom-bar.js`). The fit is an action of the registry:
	 * what announces it follows a reassignment, and an action left without a combo adds nothing to the list.
	 *
	 * @param {string | null} fitToViewCombo combo of the fit as `aria-keyshortcuts` spells it
	 * @returns {string}
	 */
	function buildCanvasKeyShortcuts(fitToViewCombo)
	{
		return fitToViewCombo === null
			? PAN_KEY_SHORTCUTS
			: `${PAN_KEY_SHORTCUTS} ${fitToViewCombo}`;
	}

	/**
	 * Whether the focus stands on one of the surfaces the diagram answers the keyboard on. The surfaces
	 * are named by the caller and not taken from the root alone: a consumer places the minimap and the
	 * zoom bar by hand and normally lands them outside the root, while both promise the keys of the
	 * diagram work there.
	 */
	function isFocusOnAnyOf(surfaces) {
		const activeElement = document.activeElement;
		return surfaces.some(surface => Boolean(surface) && surface.contains(activeElement));
	}

	// The canvas controls sit under the pointer during ordinary work, so their tooltips wait out the passing
	// cursor instead of flashing on every move across the panel.
	const TOOLTIP_SHOW_DELAY = 2000;

	const isRenderOptimizationAvailable = main_core.Extension.getSettings('ui.block-diagram').get('isRenderOptimizationAvailable');
	const RENDER_OPTIMIZATION = {
		enabled: 'Y'
	};
	function useState() {
		return {
			blockDiagramRef: null,
			// The panel of the minimap, registered as a focus surface of the diagram; why - see
			// `isFocusOnAnyOf` in composables/keyboard-pan.js.
			canvasMapRef: null,
			// The work area a consumer declares around the canvas: the catalog and the toolbars it places
			// next to the diagram belong to it, the page around the editor does not. Read by the
			// background Escape (composables/canvas-escape-fallback.js); null means the root itself.
			focusScopeRef: null,
			blockDiagramTop: 0,
			blockDiagramLeft: 0,
			blockDiagramWidth: 0,
			blockDiagramHeight: 0,
			cursorType: 'default',
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
			isGestureElevated: false,
			groupableBlockIds: new Set(),
			hoveredBlockId: null,
			resizingBlock: null,
			canvasRef: null,
			transformLayoutRef: null,
			canvasWidth: 0,
			canvasHeight: 0,
			// Edges of the viewport the panels of a consumer cover: the canvas is drawn under them and
			// knows nothing about them. The zoom bar publishes them, the fit reads them when it runs.
			viewportInsets: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
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
			displacedBlockIds: [],
			isPlacementRefused: false,
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
			isRenderOptimizationAvailable: isRenderOptimizationAvailable === RENDER_OPTIMIZATION.enabled,
			connectionRouteHitTestEnabled: false
		};
	}

	function useInstances(ctx) {
		const camera = new Camera(ctx);
		// The registry answers which press runs which action, so the input state is given it at birth:
		// the consumer of the canvas replaces the set of bindings on the same instance later.
		const actionRegistry = new ActionRegistry();
		// The canvas is self-sufficient: its own actions answer to their default combos with no consumer
		// involved. A consumer replacing the set is expected to merge these defaults into its own.
		actionRegistry.applyBindings(getCanvasActionDefaults());
		return {
			portsNearest: new PortsNearest(ctx),
			blockIntersections: new BlockIntersections(ctx),
			camera,
			canvas: new Canvas({
				...ctx,
				camera
			}),
			mapRenderer: new MapRenderer(ctx),
			animationStep: new AnimationStepController(),
			inputState: new InputState({
				actionRegistry
			}),
			actionRegistry,
			copyPasteBuffer: new CopyPasteBuffer()
		};
	}

	const SCROLL_THRESHOLD = 80;
	const BASE_SPEED = 8;
	const HARD_CAP = 20;
	function useAutoScroll(state, actions) {
		let rafId = null;
		let mouseX = 0;
		let mouseY = 0;
		let activeCallback = null;

		// Re-measured every frame: layout may shift or the page may scroll mid-gesture.
		const getCanvasRect = () => {
			return ui_vue3.toValue(state.canvasRef)?.getBoundingClientRect() ?? null;
		};
		const getAxisSpeed = penetration => {
			if (penetration <= 0) {
				return 0;
			}
			const t = penetration / SCROLL_THRESHOLD;
			const speed = BASE_SPEED * t * t;
			return Math.min(speed, HARD_CAP);
		};
		const scrollLoop = () => {
			const rect = getCanvasRect();
			if (!rect || !activeCallback) {
				// Leaving the loop must clear the frame id, otherwise the next start sees it as running.
				rafId = null;
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
				actions.panCamera(dx, dy);
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
			activeCallback = null;
		};
		const updateMousePosition = event => {
			mouseX = event.clientX;
			mouseY = event.clientY;
			if (!activeCallback || rafId) {
				return;
			}

			// Nothing to measure against yet: a later move arms the loop.
			if (!ui_vue3.toValue(state.canvasRef)) {
				return;
			}
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
			state.transformY = options.transform.y;
			// The scale is written straight into the state here, bypassing the camera, so the floor has
			// to be applied on the spot: everything that divides by the published scale reads this field.
			state.zoom = clampZoom(ui_vue3.toValue(options.zoom), state.minZoom, state.maxZoom, state.zoom);
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
			state.zoom = clampZoom(zoom, state.minZoom, state.maxZoom, state.zoom);
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

		// The node a single drag leads: it stands for the visual effects of that drag alone. What a
		// gesture holds is `setGestureBlocks` below.
		const setMovingBlock = blockId => {
			state.movingBlockId = ui_vue3.toValue(blockId);
		};
		const resetMovingBlock = () => {
			state.movingBlockId = null;
		};

		// A new value evicts the previous one: only the node the cursor is on stays raised.
		const setHoveredBlock = blockId => {
			state.hoveredBlockId = ui_vue3.toValue(blockId);
		};
		const resetHoveredBlock = () => {
			state.hoveredBlockId = null;
		};

		// Every node of the running gesture, whatever leads it: the model keeps their pre-gesture
		// geometry until the commit. The set is replaced rather than mutated - a reactive Set read
		// inside an animation frame only needs its current value.
		const setGestureBlocks = blockIds => {
			state.gestureBlockIds = new Set(ui_vue3.toValue(blockIds).map(blockId => ui_vue3.toValue(blockId)));
		};
		const resetGestureBlocks = () => {
			state.gestureBlockIds = new Set();
		};

		// Whether the running gesture raises the set above the rest of the canvas. No second set of ids:
		// the raised nodes are the ones above, and this answers only whether they are raised.
		const setGestureElevated = isElevated => {
			state.isGestureElevated = ui_vue3.toValue(isElevated) === true;
		};
		const resetGestureElevated = () => {
			state.isGestureElevated = false;
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

		// An existing record is merged in place: replacing it would republish every field of the rect
		// on a write that touched one of them, and a gesture writes the coordinates of its nodes on
		// every frame while their size stands still.
		const updateBlockRectById = (blockId, rect) => {
			const storedRect = getOwnRecord(state.blocksRectMap, blockId);
			if (storedRect === null) {
				state.blocksRectMap[blockId] = {
					...rect
				};
				return;
			}
			Object.assign(storedRect, rect);
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
		const translatePortRects = (blockId, offset) => {
			const ports = getOwnRecord(state.portsRectMap, blockId) ?? {};
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
			const blockRect = getOwnRecord(state.blocksRectMap, blockId);
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
			instances?.canvas.setCamera(params);
		};
		const panCamera = (dx, dy) => {
			instances?.canvas.panBy(dx, dy);
		};
		const autoScroll = useAutoScroll(state, {
			panCamera
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
			setHoveredBlock,
			resetHoveredBlock,
			setGestureBlocks,
			resetGestureBlocks,
			setGestureElevated,
			resetGestureElevated,
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
			panCamera,
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
			[HOOK_NAMES.END_GESTURE]: createHook(),
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
			[HOOK_NAMES.PASTE_BLOCKS]: createHook(),
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
		function markClosed() {
			isOpen.value = false;
			isOpenContextMenu.value = false;
			setContextMenuName(null);
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
				// Menu/Popup get a single options object below, so this id lands on the popup element
				// unprefixed - the legacy positional arguments would prefix it and break the e2e selector.
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
			updateContextMenuPosition(point);
			ui_vue3.toValue(contextMenuInstance)?.destroy();
			contextMenuInstance.value = ui_vue3.shallowRef(new main_popup.Menu(getDefaultOptions(options)));
			ui_vue3.toValue(contextMenuInstance)?.popupWindow?.subscribeOnce('onDestroy', markClosed);

			// A caller may override the cacheable default, and a cacheable popup closes without being
			// destroyed - the state has to come down on the close every menu goes through as well.
			ui_vue3.toValue(contextMenuInstance)?.popupWindow?.subscribeOnce('onClose', markClosed);
			ui_vue3.toValue(contextMenuInstance)?.show();

			// After the previous instance is gone: its closing lowers the very state raised here.
			setContextMenuName(contextMenuName);
			isOpen.value = true;
			isOpenContextMenu.value = true;
		}
		function showPopup(point, options = null) {
			updateContextMenuPosition(point);
			ui_vue3.toValue(contextMenuInstance)?.destroy();
			contextMenuInstance.value = ui_vue3.shallowRef(new main_popup.Popup(getDefaultOptions(options)));
			ui_vue3.toValue(contextMenuInstance)?.subscribeOnce('onDestroy', markClosed);

			// A caller may override the cacheable default, and a cacheable popup closes without being
			// destroyed - the state has to come down on the close every popup goes through as well.
			ui_vue3.toValue(contextMenuInstance)?.subscribeOnce('onClose', markClosed);
			ui_vue3.toValue(contextMenuInstance)?.show();

			// After the previous instance is gone: its closing lowers the very state raised here.
			setContextMenuName(contextMenuName);
			isOpen.value = true;
			isOpenContextMenu.value = true;
		}
		function closeContextMenu() {
			markClosed();
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

	// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
	// lone .ts source inside this extension would not resolve.
	// Alt asks the gesture to leave the content of a container behind, so the container travels alone.
	// It is answered from the press event and only from it: the set of a gesture is fixed at the press,
	// so a key pressed or released later changes nothing, and the keyboard state of the diagram is not
	// consulted - a frame of the autoscroll loop has no event of its own, and there is nothing for it to
	// decide anyway.
	function isCaptureCancelModifier(event) {
		return event?.altKey === true;
	}
	function modelRect(block) {
		const source = ui_vue3.toValue(block);
		const rect = modelBlockRect(ui_vue3.toValue(source?.position), ui_vue3.toValue(source?.dimensions));
		return rect === null ? null : toRectBounds(rect);
	}

	// The record of a container lives as long as the block lives in the model, not as long as its
	// component stays mounted: culling unmounts a block that keeps its record, so a block that left the
	// model while unmounted has no other way out of the registry. Called from the props watcher, right
	// where the selection is trimmed against the model by the very same rule.
	function pruneGroupableBlocks(groupableBlockIds, blockIdsInModel) {
		const registered = ui_vue3.toValue(groupableBlockIds) ?? null;
		const modelIds = ui_vue3.toValue(blockIdsInModel) ?? null;
		if (registered === null || modelIds === null) {
			return;
		}
		for (const blockId of registered) {
			if (!modelIds.has(blockId)) {
				registered.delete(blockId);
			}
		}
	}

	// `enabled` is what the wrapper of a block answers to a consumer flag: while it is false the block
	// is not written into the registry, so an empty registry keeps the diagram exactly as it was before
	// this feature.
	function useGroupable(block = null, enabled = true) {
		const {
			groupableBlockIds,
			blockIntersections,
			blockIdsInModel,
			isRenderOptimizationAvailable
		} = useBlockDiagram();
		function getOwnBlockId() {
			return ui_vue3.toValue(block)?.id ?? null;
		}

		// The node gesture asks this on every press, and it also runs over state a consumer raised
		// itself - state that may predate the registry. No registry means no containers, which is the
		// diagram exactly as it was before this feature.
		function isGroupableBlock(blockId) {
			return ui_vue3.toValue(groupableBlockIds)?.has(blockId) === true;
		}

		// A container among the participants is what the raise of a drag is for: a gesture leading
		// ordinary nodes alone leaves the canvas as flat as it is today. An empty registry never answers
		// yes, so the rule lives here, beside the registry itself.
		function hasGroupableBlock(blockIds) {
			return blockIds.some(blockId => isGroupableBlock(blockId));
		}

		// A block the model does not have is no part of the diagram: the same markup also mounts outside
		// the canvas - a consumer drags a preview of a block from its catalog - and the registry belongs
		// to the whole application. By the time a block of the diagram mounts the model already has it,
		// so the answer here is the state of the model, not a race with it.
		function registerGroupableBlock() {
			const blockId = getOwnBlockId();
			if (blockId === null) {
				return;
			}

			// A mount is the whole declaration of the block, so one that says "no container" takes back
			// the record of an earlier one. Under render optimization the record outlives the component
			// on purpose, and the watcher of the flag goes with that component: a flag switched off
			// while the block was culled has nothing else to answer it.
			if (ui_vue3.toValue(enabled) !== true) {
				ui_vue3.toValue(groupableBlockIds)?.delete(blockId);
				return;
			}
			if (ui_vue3.toValue(blockIdsInModel)?.has(blockId) !== true) {
				return;
			}
			ui_vue3.toValue(groupableBlockIds)?.add(blockId);
		}
		function unregisterGroupableBlock() {
			const blockId = getOwnBlockId();
			if (blockId === null) {
				return;
			}

			// Culling unmounts an offscreen block while it stays in the model, and a frame carried off
			// the screen has to keep carrying its content: the record goes only with the block itself.
			// A block that is no longer a container is another matter - there the record has nothing to
			// wait for and goes at once, whether the block is on screen or not.
			const retain = ui_vue3.toValue(enabled) === true && shouldRetainGeometry(ui_vue3.toValue(isRenderOptimizationAvailable), ui_vue3.toValue(blockIdsInModel), blockId);
			if (retain) {
				return;
			}
			ui_vue3.toValue(groupableBlockIds)?.delete(blockId);
		}
		function searchArea(area) {
			return blockIntersections.search({
				minX: area.left,
				minY: area.top,
				maxX: area.right,
				maxY: area.bottom
			});
		}

		// Nodes lying entirely inside the container area, compared in model coordinates with
		// non-strict bounds: a node pressed against the edge counts as inside.
		function captureContainedBlockIds(container) {
			const containerId = ui_vue3.toValue(container)?.id ?? null;
			if (containerId === null || !isGroupableBlock(containerId)) {
				return [];
			}
			const area = modelRect(container);
			if (area === null) {
				return [];
			}
			const captured = [];
			for (const candidate of searchArea(area)) {
				if (candidate.id === containerId) {
					continue;
				}
				if (isGroupableBlock(candidate.id)) {
					continue;
				}
				const rect = modelRect(candidate);
				if (rect === null) {
					continue;
				}
				if (rect.left >= area.left && rect.top >= area.top && rect.right <= area.right && rect.bottom <= area.bottom) {
					captured.push(candidate.id);
				}
			}
			return captured;
		}
		return {
			isGroupableBlock,
			hasGroupableBlock,
			captureContainedBlockIds,
			registerGroupableBlock,
			unregisterGroupableBlock
		};
	}

	// The selection is a set: a duplicate in it draws the group frame over a single block. These
	// operations are the only writers of the list and take the ref itself, so that a caller already
	// holding it writes by the same rules without a component context of its own.

	function replaceSelection(highlitedBlockIds, blockIds) {
		// eslint-disable-next-line no-param-reassign
		highlitedBlockIds.value = [...new Set(blockIds)];
	}
	function addToSelection(highlitedBlockIds, blockId) {
		const selected = ui_vue3.toValue(highlitedBlockIds);
		if (!selected.includes(blockId)) {
			selected.push(blockId);
		}
	}
	function removeFromSelection(highlitedBlockIds, blockId) {
		const selected = ui_vue3.toValue(highlitedBlockIds);
		const highlitedIndx = selected.indexOf(blockId);
		if (highlitedIndx > -1) {
			selected.splice(highlitedIndx, 1);
		}
	}
	function clearSelection(highlitedBlockIds) {
		// eslint-disable-next-line no-param-reassign
		highlitedBlockIds.value = [];
	}
	function useHighlightedBlocks() {
		const {
			highlitedBlockIds
		} = useBlockDiagram();
		function replace(blockIds) {
			replaceSelection(highlitedBlockIds, blockIds);
		}
		function add(blockId) {
			addToSelection(highlitedBlockIds, blockId);
		}
		function remove(blockId) {
			removeFromSelection(highlitedBlockIds, blockId);
		}
		function clear() {
			clearSelection(highlitedBlockIds);
		}
		return {
			highlitedBlockIds,
			replace,
			add,
			remove,
			clear
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
			replaceSelection(highlitedBlockIds, retained);
		}
	}

	// Reports a broken pair of bounds, it does not repair one: the state keeps mirroring what the
	// consumer set, and the camera clamps to its own floor. The property validator sees a single
	// value, so the pair can only be judged here, where both are visible at once.
	function warnOnInvalidZoomBounds(minZoom, maxZoom) {
		if (!isValidMinZoom(minZoom)) {
			console.error(`ui.block-diagram: minZoom has to be a finite number not below ${ZOOM_FLOOR}`, {
				minZoom,
				maxZoom
			});
			return;
		}

		// Infinity is a legal upper bound: it is what the camera itself falls back to for an unreadable
		// one, and it means the very thing a consumer asks for by it — not limited from above.
		if (!Number.isFinite(maxZoom) && maxZoom !== Number.POSITIVE_INFINITY) {
			console.error('ui.block-diagram: maxZoom has to be a finite number or Infinity', {
				minZoom,
				maxZoom
			});
			return;
		}
		if (minZoom > maxZoom) {
			console.error('ui.block-diagram: minZoom has to be not above maxZoom', {
				minZoom,
				maxZoom
			});
		}
	}
	function useWatchProps(props) {
		const {
			blocks,
			connections,
			camera,
			transformX,
			transformY,
			minZoom,
			maxZoom,
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
			groupableBlockIds,
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
					pruneGroupableBlocks(groupableBlockIds, blockIdsInModel);
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

			// The bounds go before the scale below: the camera reads them from the state on every clamp,
			// so the scale has to meet the bounds of the consumer rather than the defaults of the state.
			// The diagnostics close the callback because they decide nothing — they must not stand
			// between the bounds and the state.
			ui_vue3.watch([() => props.minZoom, () => props.maxZoom], ([newMinZoom, newMaxZoom]) => {
				minZoom.value = newMinZoom;
				maxZoom.value = newMaxZoom;
				warnOnInvalidZoomBounds(newMinZoom, newMaxZoom);
			}, {
				immediate: true
			});

			// The scale belongs to the camera, and the state only ever mirrors what the camera
			// publishes. Writing the property into the state alone would leave the camera at a scale
			// of its own until the first gesture, and everything counted off the camera - the frame
			// of the current view on the map, the shift of a camera move - would be counted at the
			// wrong one. The landmark carries the transform of the state along so that a consumer
			// which set it up before mounting does not lose it to the publication.
			ui_vue3.watch(() => props.zoom, newZoom => {
				camera.applyLandmark(camera.createLandmark({
					x: ui_vue3.toValue(transformX),
					y: ui_vue3.toValue(transformY),
					zoom: newZoom
				}));
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
			replaceSelection(highlitedBlockIds, selectionBeforeRevert);
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

	/**
	 * The cancellations a gesture hears from outside its own pointer stream: Escape, a pointer the
	 * browser took away and a window that lost focus. Escape belongs to the gesture for as long as it
	 * lives: the key is taken before the layers above the canvas see it, and they get it back the
	 * moment the gesture is over.
	 */
	function bindCancelPaths(inputState, cancel) {
		const onPointerCancel = () => cancel();
		const onBlur = () => cancel();
		const unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, () => cancel());
		main_core.Event.bind(document, 'pointercancel', onPointerCancel);
		main_core.Event.bind(window, 'blur', onBlur);
		return () => {
			main_core.Event.unbind(document, 'pointercancel', onPointerCancel);
			main_core.Event.unbind(window, 'blur', onBlur);
			unsubscribeEscape();
		};
	}

	// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
	// lone .ts source inside this extension would not resolve.
	const SNAP_MODIFIER_TOKEN = 'shift';

	// Shift asks for snapping. Both mouse and keyboard events carry the flag, so a single predicate
	// answers for a caller holding an event.
	function isSnapModifier(event) {
		return event?.shiftKey === true;
	}
	function useSnapModifier() {
		const {
			inputState
		} = useBlockDiagram();

		// The hold is read from the input state, not off the frame event: a frame of the autoscroll
		// loop has no event of its own, so a key pressed over a motionless pointer would go unnoticed
		// until the pointer moves again. The state listens to the window, so it stays current anyway.
		//
		// The gestures that ask are driven by mouse events while the state corrects its modifiers on
		// pointer ones. That is in order, not by luck: the browser fires pointerdown/pointermove/
		// pointerup ahead of their mouse counterparts, so the state is already current when the gesture
		// reads it. A synthesized mouse event with no pointer event before it would read a stale
		// modifier - dispatch the pointer event too rather than reading shiftKey off the frame again.
		return {
			isPressed: () => inputState.isPressed(SNAP_MODIFIER_TOKEN)
		};
	}

	// Where the frame came from: a real pointer move, the autoscroll loop with the pointer standing
	// still, or the release.
	const GESTURE_FRAME = Object.freeze({
		POINTER: 'pointer',
		CAMERA: 'camera',
		RELEASE: 'release'
	});
	/**
	 * The lifecycle every canvas gesture shares: entry guards, threshold, subscriptions, cancellation,
	 * release and commit. What each gesture does differently it says through its spec.
	 */
	// eslint-disable-next-line max-lines-per-function
	function useGestureRunner(spec) {
		const {
			isDisabledBlockDiagram,
			zoom,
			canvas,
			setGestureBlocks,
			resetGestureBlocks,
			setGestureElevated,
			resetGestureElevated,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition,
			inputState,
			hooks
		} = useBlockDiagram();
		const snapModifier = useSnapModifier();
		let activeGesture = null;
		// One counter for the gesture and for the reconciliation: a handler or a reconciliation left
		// over from a gesture that is gone finds the counter moved on and does nothing.
		let gestureToken = 0;
		function getActiveGesture(token) {
			if (activeGesture?.token !== token || activeGesture.isClosing) {
				return null;
			}
			return activeGesture;
		}
		function isBeyondThreshold(gesture, clientX, clientY) {
			if (spec.threshold <= 0) {
				return true;
			}
			return Math.abs(clientX - gesture.downClient.x) >= spec.threshold || Math.abs(clientY - gesture.downClient.y) >= spec.threshold;
		}
		function applyFrame(clientX, clientY, isSnapRequested, source) {
			activeGesture.lastClient = {
				x: clientX,
				y: clientY
			};
			activeGesture.isLastFrameSnapped = isSnapRequested;
			const point = {
				x: clientX + activeGesture.cameraOffset.x,
				y: clientY + activeGesture.cameraOffset.y
			};
			if (spec.applyFrame(point, isSnapRequested, source, {
				x: clientX,
				y: clientY
			}) === true) {
				activeGesture.hasAppliedFrame = true;
			}
		}
		function bindGestureHandlers() {
			const token = activeGesture.token;
			const handlers = {
				mouseMove: event => handleMouseMove(token, event),
				mouseUp: event => finishGesture(token, event),
				unbindCancelPaths: bindCancelPaths(inputState, () => cancelGesture(token))
			};
			activeGesture.handlers = handlers;

			// The window rather than the document: a mouseup dispatched on it by a consumer or by
			// `BX.fireEvent` never travels down, and a gesture that misses its release stays live.
			main_core.Event.bind(window, 'mousemove', handlers.mouseMove);
			main_core.Event.bind(window, 'mouseup', handlers.mouseUp);
		}
		function unbindGestureHandlers() {
			const handlers = activeGesture.handlers;
			if (handlers === null) {
				return;
			}
			main_core.Event.unbind(window, 'mousemove', handlers.mouseMove);
			main_core.Event.unbind(window, 'mouseup', handlers.mouseUp);
			handlers.unbindCancelPaths();
			activeGesture.handlers = null;
		}

		// The adapter winds its own side down first, while the shared machinery still stands - but the
		// teardown is not the adapter's to skip: the gesture holds Escape over the whole page, and a
		// spec hook that throws would leave that claim standing until the tab is reloaded.
		function closeGesture() {
			try {
				try {
					spec.onClose();
				} finally {
					// The loop of the autoscroll re-arms itself every frame and stops on nothing else:
					// left running, it carries the camera away until the tab is reloaded.
					stopAutoScroll();
				}
			} finally {
				unbindGestureHandlers();
				// The nodes are held in the visible set until the last command has gone out: released
				// earlier, they would be judged by the pre-gesture boxes the spatial index still holds.
				resetGestureBlocks();
				// Beside the composition on purpose: Escape, a lost pointer, a lost focus, a disabled
				// and an unmounted diagram all close here, and the raise must not outlive any of them.
				resetGestureElevated();
				activeGesture = null;
			}
		}
		function cancelActiveGesture() {
			if (activeGesture === null || activeGesture.isClosing) {
				return;
			}
			activeGesture.isClosing = true;

			// The cancellation is not the revert's to skip: a consumer hook that throws would leave the
			// gesture live, with the listeners bound and the key held.
			try {
				spec.revert();
			} finally {
				closeGesture();
			}
		}
		function cancelGesture(token) {
			if (getActiveGesture(token) === null) {
				return;
			}
			cancelActiveGesture();
		}

		// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
		// cycle - the model is read once here, and a command applied later misses the alignment.
		function scheduleAlignToModel(gesture) {
			const token = gesture.token;
			void ui_vue3.nextTick(() => {
				if (token !== gestureToken || activeGesture !== null) {
					return;
				}
				spec.alignToModel();
			});
		}

		// The press turns into a drag here, and only here does the raise reach the state: below the
		// threshold the press is still a click, and a click that raised its composition for as long as
		// the button is down would throw the backdrop over the schema and take it back at once.
		function startDrag(gesture) {
			gesture.isDragStarted = true;
			if (!gesture.isElevated) {
				return;
			}
			setGestureElevated(true);

			// The raise reaches the markup on the render that follows this task, and that render
			// re-applies the style object of every participant - its position among it. The frame drawn
			// in this same task lives in the markup alone for every participant the spec does not lead
			// through the model, so it is drawn again once the render is over.
			void ui_vue3.nextTick(() => {
				if (getActiveGesture(gesture.token) === null) {
					return;
				}
				spec.redrawMarkup?.();
			});
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

			// Below the threshold the press is still a click on the selection.
			if (!gesture.isDragStarted) {
				if (!isBeyondThreshold(gesture, event.clientX, event.clientY)) {
					return;
				}
				startDrag(gesture);
			}
			updateMousePosition(event);
			applyFrame(event.clientX, event.clientY, snapModifier.isPressed(), GESTURE_FRAME.POINTER);
		}
		function finishGesture(token, event) {
			const gesture = getActiveGesture(token);
			if (gesture === null) {
				return;
			}

			// The watcher on the disabled state is flushed before the render, so a diagram disabled in
			// this very tick has not reached it yet.
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				cancelGesture(token);
				return;
			}

			// A mouseup can arrive with no coordinates at all - a plain `Event('mouseup')` from a
			// consumer. Applied as a frame it would put NaN into the geometry, the ports and the model.
			if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
				cancelGesture(token);
				return;
			}

			// A mouseup can carry a position no mousemove has seen, so the threshold is judged against
			// the release point as well. A gesture with no threshold has nothing to promote.
			const hasDrawnFrame = gesture.isDragStarted;
			if (!hasDrawnFrame && spec.threshold > 0 && isBeyondThreshold(gesture, event.clientX, event.clientY)) {
				startDrag(gesture);
			}
			if (gesture.isDragStarted) {
				// The modifier is taken from the last drawn frame: Shift released an instant before the
				// button would part the committed position from the drawn one.
				applyFrame(event.clientX, event.clientY, hasDrawnFrame ? gesture.isLastFrameSnapped : isSnapModifier(event), GESTURE_FRAME.RELEASE);
			}
			gesture.isClosing = true;
			let hasWrittenModel = false;

			// The release is not the commit's to skip: a consumer hook that throws would leave the
			// gesture live, with the listeners bound and the nodes held.
			try {
				if (gesture.hasAppliedFrame) {
					hasWrittenModel = spec.commit() === true;
				}
			} finally {
				closeGesture();
			}
			if (hasWrittenModel) {
				// Every gesture reports its own end here; one that wrote nothing reports nothing.
				hooks.endGesture.trigger();
				scheduleAlignToModel(gesture);
			}
		}

		// A readonly template or an animation, any button but the left one, and a gesture still open:
		// restarting would lose the nodes the open one carries.
		function acceptsPress(event) {
			return event.button === MOUSE_BUTTON.LEFT && !ui_vue3.toValue(isDisabledBlockDiagram) && activeGesture === null;
		}
		function start(event) {
			if (!acceptsPress(event)) {
				return;
			}
			event.stopPropagation();

			// Must run before the gesture reads zoom and its anchor point below: a camera transition
			// still in flight would keep changing both and drag nodes out from under the pointer.
			canvas.cancelCameraTransition();
			const targets = spec.resolveTargets(event);
			if (targets === null || targets.length === 0) {
				return;
			}

			// The zoom divides the pointer delta: a zero or non-finite one turns it into NaN.
			const currentZoom = ui_vue3.toValue(zoom);
			if (!Number.isFinite(currentZoom) || currentZoom <= 0) {
				return;
			}
			const gesture = {
				token: ++gestureToken,
				downClient: {
					x: event.clientX,
					y: event.clientY
				},
				lastClient: {
					x: event.clientX,
					y: event.clientY
				},
				cameraOffset: {
					x: 0,
					y: 0
				},
				isDragStarted: false,
				isElevated: false,
				isLastFrameSnapped: false,
				hasAppliedFrame: false,
				isClosing: false,
				handlers: null
			};
			activeGesture = gesture;
			// The nodes of the gesture reach the model only on mouseup, so culling must judge none of
			// them by the pre-gesture box the spatial index still holds.
			setGestureBlocks(targets);
			// Asked once, here, over the composition just resolved - the answer waits for the threshold
			// and reaches the state in startDrag().
			gesture.isElevated = spec.elevatesTargets?.(targets) === true;
			spec.onOpen();

			// The press only arms the autoscroll; the loop starts when the gesture first reports the
			// pointer - so the camera cannot pan under a press that is still a click on the selection.
			startAutoScroll(event, (deltaX, deltaY) => {
				const currentGesture = getActiveGesture(gesture.token);
				if (currentGesture === null) {
					return;
				}
				currentGesture.cameraOffset.x += deltaX;
				currentGesture.cameraOffset.y += deltaY;
				applyFrame(currentGesture.lastClient.x, currentGesture.lastClient.y, snapModifier.isPressed(), GESTURE_FRAME.CAMERA);
			});
			bindGestureHandlers();
		}
		ui_vue3.watch(isDisabledBlockDiagram, isDisabled => {
			if (isDisabled) {
				cancelActiveGesture();
			}
		});

		// A gesture torn down without a mouseup would leave the markup where the pointer left it. The
		// token is bumped on top: the alignment of a release is a microtask and must not outlive it.
		ui_vue3.onBeforeUnmount(() => {
			++gestureToken;
			cancelActiveGesture();
		});
		return {
			start
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
			updateMousePosition,
			inputState
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
		let unbindCancelPaths = null;
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
			if (event.button !== MOUSE_BUTTON.LEFT || ui_vue3.toValue(newConnection) !== null) {
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

		// The pointer stream stays private - this gesture drives its own mouse - while everything that
		// cancels it from outside comes from the shared paths, Escape included.
		function bindGestureHandlers() {
			main_core.Event.bind(document, 'mousemove', onMouseMove);
			main_core.Event.bind(document, 'mouseup', onMouseUp);
			unbindCancelPaths = bindCancelPaths(inputState, closeGesture);
		}
		function unbindGestureHandlers() {
			main_core.Event.unbind(document, 'mousemove', onMouseMove);
			main_core.Event.unbind(document, 'mouseup', onMouseUp);
			unbindCancelPaths?.();
			unbindCancelPaths = null;
		}

		// Winds the gesture down without committing anything. Only the instance that owns the
		// gesture may close it: under render optimization neighbour ports are unmounted by culling
		// exactly while the camera pans for this gesture, so an unowned close would kill a live one.
		function closeGesture() {
			if (!ui_vue3.toValue(isSourcePort)) {
				return;
			}

			// The gesture holds Escape over the whole page and draws a connection nothing else clears, so
			// the teardown is nobody's to skip: whatever the shutdown above it throws, the key goes back
			// and the drawn connection goes with it - a connection left standing blocks every new one.
			try {
				// The autoscroll instance is shared by the whole diagram, so only a gesture that started
				// it may stop it.
				if (isAutoScrollStarted) {
					stopAutoScroll();
				}
			} finally {
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

	function useLoc() {
		const app = ui_vue3.getCurrentInstance()?.appContext.app;
		const bitrix = app?.config?.globalProperties?.$bitrix ?? null;
		return {
			getMessage: (messageId, replacements) => {
				return bitrix?.Loc?.getMessage(messageId, replacements);
			}
		};
	}

	// Keep in step with the animation in moveable-block.css: the modifier has to outlive the flash,
	// otherwise the outline is cut off mid-fade.
	const DISPLACED_STATE_DURATION_MS = 900;

	// The outline says nothing to a screen reader, so the same two facts go out through the shared live
	// region: a position was corrected, or there was no room and the operation was given up. Both are
	// announced when the state is set, so the channel does not depend on the flash timer.
	const DISPLACED_MESSAGE_ID = 'UI_BLOCK_DIAGRAM_A11Y_BLOCK_DISPLACED';
	const PLACEMENT_REFUSED_MESSAGE_ID = 'UI_BLOCK_DIAGRAM_A11Y_PLACEMENT_REFUSED';

	// The handle of the expiry timer: an implementation detail of this composable alone, so it is kept
	// here and not in the state the consumer reads through `useBlockDiagram`. Keyed by the reference of
	// the diagram it belongs to - every caller of `useDisplacedBlocks` builds a closure of its own, and
	// the timer one of them started has to be cancellable by the next; two diagrams on one page keep
	// their timers apart, exactly as they did while the handle was part of their state.
	const resetTimerIdByChannel = new WeakMap();
	function useDisplacedBlocks(options = {}) {
		const {
			durationMs = DISPLACED_STATE_DURATION_MS,
			// Bound to the global object: the native timers throw on a bare reference. Injection for
			// tests with fake clocks takes precedence, as in AnimationStepController.
			setTimeoutFn = globalThis.setTimeout.bind(globalThis),
			clearTimeoutFn = globalThis.clearTimeout.bind(globalThis)
		} = options;
		const {
			displacedBlockIds,
			isPlacementRefused
		} = useBlockDiagram();
		const loc = useLoc();

		// Two identical announcements in a row do reach the reader: LiveAnnouncer empties the live region
		// and fills it again a frame later, and it drops a repeat only while the previous one is still
		// queued unspoken. So no counter or separator is added here on purpose - one would defeat that
		// very guard against a burst of gestures.
		function announce(messageId) {
			const message = loc.getMessage(messageId);

			// A consumer that gave the application no localization plugin gets no announcement, not an
			// empty live region put into its page.
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}
			ui_a11y.LiveAnnouncer.announce(message, 'polite');
		}
		function cancelReset() {
			const timerId = resetTimerIdByChannel.get(displacedBlockIds) ?? null;
			if (timerId !== null) {
				clearTimeoutFn(timerId);
				resetTimerIdByChannel.delete(displacedBlockIds);
			}
		}
		function clear() {
			cancelReset();
			displacedBlockIds.value = [];
			isPlacementRefused.value = false;
		}

		// A displacement has no lifecycle of its own to hang the reset on, so the state expires on a
		// timer. A newer answer replaces the whole set and restarts the countdown.
		function lightChannel(blockIds, refused) {
			if (blockIds.length === 0) {
				return;
			}
			cancelReset();
			displacedBlockIds.value = [...new Set(blockIds)];
			isPlacementRefused.value = refused;
			resetTimerIdByChannel.set(displacedBlockIds, setTimeoutFn(() => {
				clear();
			}, durationMs));
		}
		function mark(blockIds) {
			if (blockIds.length === 0) {
				return;
			}
			lightChannel(blockIds, false);
			announce(DISPLACED_MESSAGE_ID);
		}

		// The refusal of an operation that never reached the model: a dropped or pasted node exists
		// nowhere, so there is nothing to outline and the announcement is the whole feedback.
		function announceRefusal() {
			announce(PLACEMENT_REFUSED_MESSAGE_ID);
		}

		// The refusal of an operation that has nodes to point at: they are marked where they came back
		// to, and the announcement tells why they stayed there.
		function markRefused(blockIds) {
			lightChannel(blockIds, true);
			announceRefusal();
		}
		function isInChannel(blockId) {
			return ui_vue3.toValue(displacedBlockIds).includes(blockId);
		}

		// "Moved out of the way" and "there was no room" are two different answers, so they light two
		// different modifiers: a block that stayed where it was must not flash the same way as one the
		// rule has just carried aside.
		function isBlockDisplaced(blockId) {
			return isInChannel(blockId) && !ui_vue3.toValue(isPlacementRefused);
		}
		function isBlockPlacementRefused(blockId) {
			return isInChannel(blockId) && ui_vue3.toValue(isPlacementRefused) === true;
		}
		return {
			displacedBlockIds,
			mark,
			markRefused,
			announceRefusal,
			clear,
			isBlockDisplaced,
			isBlockPlacementRefused
		};
	}

	// Under culling an off-screen block never mounts, so waitAllBlocksMounted never
	// resolves and the deferred updatePortSegmentSizes in onMountedPort never runs — the
	// port keeps zero-length segments and its retained routing geometry stays empty. The
	// block's ports mount before it (children before parent) and its rect is written just
	// above, so compute the segments here directly, bypassing the global barrier (the same
	// direct-compute precedent as connections-queue-transition.js). The promise path stays
	// and recomputes idempotently if the barrier ever resolves. Order comes from the rect
	// captured at port mount, matching the order the drawing path uses.
	function measurePortSegments(blockId, portsRectMap, updatePortSegmentSizes) {
		const portsRect = portsRectMap[blockId];
		if (!portsRect) {
			return;
		}
		for (const portId of Object.keys(portsRect)) {
			updatePortSegmentSizes(blockId, portId, portsRect[portId].order ?? 0);
		}
	}
	// Whether the rect a mount just measured is the one already stored.
	function isMeasuredAgain(blocksRectMap, blockId, rect) {
		const stored = getOwnRecord(blocksRectMap, blockId);
		return stored?.x === rect.x && stored.y === rect.y && stored.width === rect.width && stored.height === rect.height;
	}
	// The only place turning block state into a stacking step. Hover is checked before the drag: the
	// node being dragged is under the cursor anyway and has to stand above the rest, so the hovered
	// step replaces MOVABLE for it. The raise is one and the same addition for every participant, so
	// the order inside a raised set is the order it already had.
	function resolveBlockZIndex(block, state) {
		const elevation = state.isElevated === true ? BLOCK_INDEXES.ELEVATION_OFFSET : 0;

		// A block with a resting step of its own skips hover and selection: the backdrop passed through
		// them would cover the very nodes it stands behind on a plain move of the pointer.
		if (Number.isFinite(state.restingZIndex)) {
			return state.restingZIndex + elevation;
		}
		if (state.hoveredBlockId === block.id) {
			return BLOCK_INDEXES.HOVERED + elevation;
		}
		if (state.movingBlockId === block.id) {
			return BLOCK_INDEXES.MOVABLE + elevation;
		}
		if (state.isHighlighted) {
			return BLOCK_INDEXES.HIGHLITED + elevation;
		}
		return BLOCK_INDEXES.STANDING + elevation;
	}
	function useBlockState(options) {
		const {
			block,
			blockRef,
			restingZIndex = null
		} = options;
		const {
			blockElMap,
			blocksRectMap,
			isDisabledBlockDiagram,
			movingBlockId,
			hoveredBlockId,
			gestureBlockIds,
			isGestureElevated,
			blockMounted,
			isRenderOptimizationAvailable,
			blockIdsInModel,
			updatePortSegmentSizes,
			portsRectMap,
			resetHoveredBlock
		} = useBlockDiagram();
		const {
			isBlockVisuallyHighlighted
		} = useTransientHighlightedBlocks();
		const {
			isBlockDisplaced,
			isBlockPlacementRefused
		} = useDisplacedBlocks();
		const isHiglitedBlock = ui_vue3.computed(() => {
			return isBlockVisuallyHighlighted(ui_vue3.toValue(block)?.id);
		});
		const isDisplacedBlock = ui_vue3.computed(() => {
			return isBlockDisplaced(ui_vue3.toValue(block)?.id);
		});
		const isPlacementRefusedBlock = ui_vue3.computed(() => {
			return isBlockPlacementRefused(ui_vue3.toValue(block)?.id);
		});
		const isDisabled = ui_vue3.computed(() => {
			return ui_vue3.toValue(isDisabledBlockDiagram);
		});

		// Both values it reads change twice per gesture - at the press and at the close - so a raise
		// costs two recomputes, not one per frame.
		const isElevatedBlock = ui_vue3.computed(() => {
			return ui_vue3.toValue(isGestureElevated) === true && ui_vue3.toValue(gestureBlockIds).has(ui_vue3.toValue(block)?.id);
		});

		// The step itself, not a style object: an unchanged number stops the change from spreading,
		// so a hover redraws only the nodes whose step actually moved. A fresh object literal never
		// compares equal and would redraw every mounted node of the canvas.
		const blockZindex = ui_vue3.computed(() => {
			return resolveBlockZIndex(ui_vue3.toValue(block), {
				hoveredBlockId: ui_vue3.toValue(hoveredBlockId),
				movingBlockId: ui_vue3.toValue(movingBlockId),
				isHighlighted: ui_vue3.toValue(isHiglitedBlock),
				isElevated: ui_vue3.toValue(isElevatedBlock),
				restingZIndex: ui_vue3.toValue(restingZIndex)
			});
		});
		function onMountedBlock() {
			const blockId = ui_vue3.toValue(block).id;
			if (!ui_vue3.toValue(blockElMap).has(blockId)) {
				ui_vue3.toValue(blockElMap).set(blockId, ui_vue3.toValue(blockRef));
			}
			const rect = getCanvasRect(ui_vue3.toValue(blockRef)) ?? {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};

			// A remount under culling measures the very same rect; writing a new object anyway wakes
			// every reader of the measured geometry - the overview map rebuilds all of its rectangles.
			if (!isMeasuredAgain(blocksRectMap.value, blockId, rect)) {
				blocksRectMap.value[blockId] = rect;
			}
			if (ui_vue3.toValue(isRenderOptimizationAvailable)) {
				measurePortSegments(blockId, ui_vue3.toValue(portsRectMap), updatePortSegmentSizes);
			}
			blockMounted(blockId);
		}
		function onUnmountedBlock() {
			const blockId = ui_vue3.toValue(block).id;

			// The browser sends no mouseleave for an element taken out of the DOM, so a node unmounted
			// while raised (deleted, or culled off-screen) would keep the state and come back raised
			// with the cursor elsewhere. Guarded like the leave: only the raised node clears it.
			if (ui_vue3.toValue(hoveredBlockId) === blockId) {
				resetHoveredBlock();
			}
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
			isDisplacedBlock,
			isPlacementRefusedBlock,
			isDisabled,
			blockZindex,
			onMountedBlock,
			onUnmountedBlock
		};
	}

	// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
	// lone .ts source inside this extension would not resolve.
	// How many candidate corrections one operation may examine. A schema dense enough to exhaust this
	// has no free room near the point aimed at, and the answer "nowhere" comes sooner than a search
	// over the whole canvas would. The budget belongs to the rule, not to a diagram: a consumer able to
	// widen it would be able to trade a frozen canvas for a placement no user waits for.
	const PLACEMENT_SEARCH_BUDGET = 64;
	/**
	 * The rule of placement over the state of the canvas: it answers where a set of blocks may stand and
	 * writes nothing. Participants come in model coordinates, already at the position the operation aims
	 * at, and the answer is one shift for the whole set - zero when the set may stay, null when no free
	 * room was found within the budget.
	 */
	function useBlockPlacement() {
		const {
			blockIntersections,
			snapStep
		} = useBlockDiagram();
		const {
			isGroupableBlock
		} = useGroupable();
		function obstacleRect(block) {
			const source = ui_vue3.toValue(block);
			const rect = modelBlockRect(ui_vue3.toValue(source?.position), ui_vue3.toValue(source?.dimensions));
			return rect === null ? null : {
				id: source.id,
				...rect
			};
		}

		// The index is the broad phase alone: it boxes blocks non-strictly, and during a gesture it still
		// holds the pre-gesture boxes of the participants. The strict rule and the filter by participant
		// id run above, over what comes back from here.
		function searchObstacles(rect) {
			const obstacles = [];
			for (const block of blockIntersections.search(toSearchRect(rect))) {
				const obstacle = obstacleRect(block);
				if (obstacle !== null) {
					obstacles.push(obstacle);
				}
			}
			return obstacles;
		}
		function resolvePlacementDelta(participants, request = {}) {
			const {
				followsGrid = false,
				backdropIds = null
			} = request;
			const isBackdrop = backdropIds === null ? isGroupableBlock : blockId => isGroupableBlock(blockId) || backdropIds.has(blockId);
			return findPlacementDelta(participants, searchObstacles, isBackdrop, followsGrid ? ui_vue3.toValue(snapStep) : null, PLACEMENT_SEARCH_BUDGET);
		}
		return {
			resolvePlacementDelta
		};
	}

	function copyPosition(position) {
		return {
			x: position.x,
			y: position.y
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useMoveableBlock(blockRef, block, options = {}) {
		const isDragged = ui_vue3.ref(false);
		const {
			zoom,
			updateBlock,
			hooks,
			setMovingBlock,
			resetMovingBlock,
			setPortOffsetByBlockId,
			updateBlockRectById,
			getBlockById,
			blocks: allBlocksRef,
			blocksRectMap,
			blockElMap,
			highlitedBlockIds,
			connectionPreview,
			clearConnectionPreview,
			snapPoint
		} = useBlockDiagram();
		const {
			captureContainedBlockIds,
			hasGroupableBlock
		} = useGroupable();
		const {
			resolvePlacementDelta
		} = useBlockPlacement();
		const {
			mark: markDisplacedBlocks,
			markRefused: markRefusedBlocks
		} = useDisplacedBlocks();
		const x = ui_vue3.ref(ui_vue3.toValue(block).position.x);
		const y = ui_vue3.ref(ui_vue3.toValue(block).position.y);
		let primaryBlock = null;
		let groupBlocks = [];
		let offsetX = 0;
		let offsetY = 0;
		let gestureZoom = 1;
		// Whether the last drawn frame snapped the position: the release commits the position that frame
		// drew, so the correction of the placement rule is rounded to the grid on the very same terms.
		let isLastFrameSnapped = false;
		let stagedPreviewKey = null;
		let isPreviewKeyStaged = false;
		ui_vue3.watchEffect(() => {
			x.value = ui_vue3.toValue(block).position.x;
			y.value = ui_vue3.toValue(block).position.y;
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

		// Nodes lying inside a container that takes part in the press. They join the gesture as ordinary
		// members, so no second mechanism carries them: the union goes by block id, and a node already
		// taking part - the pressed one or a selected one - is not taken a second time. With an empty
		// container registry the capture answers without a single lookup in the intersections index.
		function collectCapturedBlocks(containers, participantIds) {
			const capturedIds = new Set();
			for (const container of containers) {
				for (const capturedId of captureContainedBlockIds(container)) {
					capturedIds.add(capturedId);
				}
			}
			for (const participantId of participantIds) {
				capturedIds.delete(participantId);
			}
			if (capturedIds.size === 0) {
				return [];
			}
			return ui_vue3.toValue(allBlocksRef).filter(item => capturedIds.has(ui_vue3.toValue(item).id));
		}

		// Geometry entries are updated, never created: the geometry of a node may have been purged on
		// purpose, and a merge over a missing entry would resurrect it. The size of the gesture snapshot
		// only fills an entry that has none.
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
		function drawBlockMarkup(blockId, position) {
			const blockElement = ui_vue3.toValue(blockElMap)?.get(blockId);
			if (blockElement) {
				main_core.Dom.style(blockElement, 'left', `${position.x}px`);
				main_core.Dom.style(blockElement, 'top', `${position.y}px`);
			}
		}
		function updateLocalPosition(gestureBlock, position) {
			const deltaX = position.x - gestureBlock.currentPosition.x;
			const deltaY = position.y - gestureBlock.currentPosition.y;
			gestureBlock.currentPosition = copyPosition(position);
			if (gestureBlock.isPrimary) {
				x.value = position.x;
				y.value = position.y;
			} else {
				drawBlockMarkup(gestureBlock.id, position);
			}
			updateGestureBlockRect(gestureBlock, position);
			if (deltaX !== 0 || deltaY !== 0) {
				setPortOffsetByBlockId(gestureBlock.id, {
					x: -deltaX,
					y: -deltaY
				});
			}
		}

		// Read before the commands go out: a consumer applying them may activate a preview of its own,
		// and this gesture must not put out an activation newer than the one it opened.
		function stagePreviewActivationKey() {
			if (isPreviewKeyStaged) {
				return;
			}
			const activationKey = ui_vue3.toValue(connectionPreview)?.activationKey;
			stagedPreviewKey = main_core.Type.isStringFilled(activationKey) ? activationKey : null;
			isPreviewKeyStaged = true;
		}
		function clearStagedPreview() {
			const activationKey = stagedPreviewKey;
			stagedPreviewKey = null;
			isPreviewKeyStaged = false;
			if (activationKey !== null) {
				clearConnectionPreview(activationKey);
			}
		}

		// The content comes from the live model: the component input lags it by a frame under render
		// optimization, so a node edited during the gesture would be overwritten on commit.
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

		// Reported even when the node has left the model and no command was built: a consumer closes a
		// gesture of its own by this event.
		function reportGestureEnd(updatedBlock) {
			hooks.endDragBlock.trigger(updatedBlock ?? ui_vue3.toValue(block));
		}

		// After the gesture the measured geometry is brought to the model position: a consumer that
		// refused the move left the previous position there.
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
		function hasLeftStartPosition() {
			return primaryBlock.currentPosition.x !== primaryBlock.originalPosition.x || primaryBlock.currentPosition.y !== primaryBlock.originalPosition.y;
		}

		// The pressed node plus the rest of the selection it belongs to. The pressed node leads: it is
		// the one whose position is written reactively.
		function resolveTargets(event) {
			const blockValue = ui_vue3.toValue(block);
			const blockId = blockValue.id;
			const groupIds = ui_vue3.toValue(highlitedBlockIds);
			const selectedBlocks = groupIds.length > 1 ? ui_vue3.toValue(allBlocksRef).filter(item => groupIds.includes(ui_vue3.toValue(item).id) && ui_vue3.toValue(item).id !== blockId) : [];
			// The set is taken once, here: neither a move frame nor an autoscroll frame recounts it. The
			// modifier is read off this very press for the same reason - Alt taken or let go later in the
			// gesture finds the set already fixed.
			const capturedBlocks = isCaptureCancelModifier(event) ? [] : collectCapturedBlocks([blockValue, ...selectedBlocks], groupIds);
			groupBlocks = [...selectedBlocks, ...capturedBlocks].map(item => createGestureBlock(item, false));
			primaryBlock = createGestureBlock(blockValue, true);
			gestureZoom = ui_vue3.toValue(zoom);
			isLastFrameSnapped = false;
			offsetX = Math.round(event.clientX - primaryBlock.originalPosition.x * gestureZoom);
			offsetY = Math.round(event.clientY - primaryBlock.originalPosition.y * gestureZoom);
			return [blockId, ...groupBlocks.map(groupBlock => groupBlock.id)];
		}

		// The pressed node is left out: its position is written reactively, so the render puts it where
		// the gesture last left it anyway.
		function redrawMarkup() {
			for (const groupBlock of groupBlocks) {
				drawBlockMarkup(groupBlock.id, groupBlock.currentPosition);
			}
		}
		function applyFrame(point, isSnapRequested, source) {
			isLastFrameSnapped = isSnapRequested;

			// The coordinates are rounded before the snapping, so the model keeps whole pixels at any
			// zoom even when nothing is aligned.
			const newPosition = snapPoint({
				x: Math.round((point.x - offsetX) / gestureZoom),
				y: Math.round((point.y - offsetY) / gestureZoom)
			}, isSnapRequested);
			const deltaX = newPosition.x - primaryBlock.currentPosition.x;
			const deltaY = newPosition.y - primaryBlock.currentPosition.y;
			const isChanged = deltaX !== 0 || deltaY !== 0;
			if (isChanged) {
				updateLocalPosition(primaryBlock, newPosition);
				for (const groupBlock of groupBlocks) {
					updateLocalPosition(groupBlock, {
						x: groupBlock.currentPosition.x + deltaX,
						y: groupBlock.currentPosition.y + deltaY
					});
				}
			}

			// A frame that gained no pixel is still reported when the pointer itself moved: the
			// consumer subscribes to the move, not to the pixel.
			if (isChanged || source === GESTURE_FRAME.POINTER) {
				hooks.moveDragBlock.trigger(block);
			}
			return isChanged;
		}
		function revert() {
			stagePreviewActivationKey();
			updateLocalPosition(primaryBlock, primaryBlock.originalPosition);
			for (const groupBlock of groupBlocks) {
				updateLocalPosition(groupBlock, groupBlock.originalPosition);
			}
		}

		// The rectangle the placement rule works in: the position the gesture aims at, and the size the
		// model states. The measured size of the gesture snapshot is deliberately not taken - it comes
		// from another space, while the index the rule asks is built over the model. A block the model no
		// longer holds keeps its place among the participants without a usable rect: the rule leaves it
		// out of the geometry but still knows it is not an obstacle to the rest of the gesture.
		function toPlacementRect(gestureBlock) {
			const dimensions = ui_vue3.toValue(ui_vue3.toValue(getBlockById(gestureBlock.id))?.dimensions) ?? {};
			return {
				id: gestureBlock.id,
				x: gestureBlock.currentPosition.x,
				y: gestureBlock.currentPosition.y,
				width: dimensions.width,
				height: dimensions.height
			};
		}
		function shiftGestureBy(gestureBlocks, delta) {
			for (const gestureBlock of gestureBlocks) {
				updateLocalPosition(gestureBlock, {
					x: gestureBlock.currentPosition.x + delta.x,
					y: gestureBlock.currentPosition.y + delta.y
				});
			}
		}
		function commit() {
			stagePreviewActivationKey();

			// A gesture that came back to where it started is a click on the selection: the command
			// would ask the consumer to save a diagram nothing changed in. The end is reported anyway.
			if (!hasLeftStartPosition()) {
				reportGestureEnd(createUpdatedBlock(primaryBlock));
				return false;
			}
			const gestureBlocks = [primaryBlock, ...groupBlocks];
			// Asked before the first write: the intersections index refreshes inside every `updateBlock`,
			// so after the first one the rule would answer about a picture that no longer stands.
			const placementDelta = resolvePlacementDelta(gestureBlocks.map(gestureBlock => toPlacementRect(gestureBlock)), {
				followsGrid: isLastFrameSnapped
			});

			// No free room within the budget: the gesture is given up whole, so the model never comes to
			// hold a forbidden overlap. The feedback still goes out - on the positions the participants
			// have just come back to, so the refusal is not a silent one.
			if (placementDelta === null) {
				revert();
				markRefusedBlocks(gestureBlocks.map(gestureBlock => gestureBlock.id));
				reportGestureEnd(createUpdatedBlock(primaryBlock));
				return false;
			}
			const isCorrected = placementDelta.x !== 0 || placementDelta.y !== 0;
			if (isCorrected) {
				shiftGestureBy(gestureBlocks, placementDelta);
			}

			// A participant the model has lost is written nowhere, so it has not moved either.
			const committedBlockIds = [];
			for (const groupBlock of groupBlocks) {
				const updatedBlock = createUpdatedBlock(groupBlock);
				if (updatedBlock) {
					updateBlock(updatedBlock);
					hooks.endDragBlock.trigger(updatedBlock);
					committedBlockIds.push(updatedBlock.id);
				}
			}
			const updatedPrimaryBlock = createUpdatedBlock(primaryBlock);
			if (updatedPrimaryBlock) {
				updateBlock(updatedPrimaryBlock);
				committedBlockIds.push(updatedPrimaryBlock.id);
			}
			if (isCorrected) {
				markDisplacedBlocks(committedBlockIds);
			}
			reportGestureEnd(updatedPrimaryBlock);
			return true;
		}
		function alignToModel() {
			for (const gestureBlock of [primaryBlock, ...groupBlocks]) {
				alignGeometryToModel(gestureBlock);
			}
		}
		function onOpen() {
			isDragged.value = true;
			setMovingBlock(ui_vue3.toValue(block).id);
			hooks.startDragBlock.trigger(block);
		}
		function onClose() {
			stagePreviewActivationKey();
			resetMovingBlock();
			isDragged.value = false;
			clearStagedPreview();
		}
		const gesture = useGestureRunner({
			threshold: DRAG_START_THRESHOLD,
			resolveTargets,
			elevatesTargets: hasGroupableBlock,
			redrawMarkup,
			applyFrame,
			revert,
			commit,
			alignToModel,
			onOpen,
			onClose
		});

		// The press picks the selection whatever the guards of the gesture say: a press the gesture
		// refuses still selects the block it landed on. A node already selected keeps the whole
		// selection, so the gesture that follows leads a group.
		function onMouseDown(event) {
			const blockId = ui_vue3.toValue(block).id;
			if (!ui_vue3.toValue(highlitedBlockIds).includes(blockId)) {
				replaceSelection(highlitedBlockIds, [blockId]);
			}
			const canStartMove = ui_vue3.toValue(options.canStartMove);
			if (main_core.Type.isFunction(canStartMove) && !canStartMove(event)) {
				return;
			}
			gesture.start(event);
		}
		ui_vue3.onMounted(() => {
			main_core.Event.bind(ui_vue3.toValue(blockRef), 'mousedown', onMouseDown);
		});
		ui_vue3.onBeforeUnmount(() => {
			main_core.Event.unbind(ui_vue3.toValue(blockRef), 'mousedown', onMouseDown);
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

		// A search given up inside the delay leaves a pass already scheduled, and `debounce` has no way
		// to drop it. Landing after the search is over, that pass refills the results, and whoever
		// watches them takes the highlight over and moves the camera with nobody searching any more.
		let isScheduledSearchDropped = false;
		function searchBlocks(searchText) {
			if (isScheduledSearchDropped) {
				return;
			}
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
		const runSearchBlocks = main_core.debounce(searchBlocks, options.delay);
		function onSearchBlocks(searchText) {
			isScheduledSearchDropped = false;
			runSearchBlocks(searchText);
		}
		function onClearSearch() {
			isScheduledSearchDropped = true;
			seachText.value = '';
			foundBlocks.value = [];
		}
		return {
			seachText,
			foundBlocks,
			onSearchBlocks,
			onClearSearch
		};
	}

	function useCanvas() {
		const {
			zoom,
			blocks,
			blocksRectMap,
			canvasWidth,
			canvasHeight,
			canvasGridSize,
			maxZoom,
			viewportInsets,
			blockDiagramTop,
			blockDiagramLeft,
			canvas
		} = useBlockDiagram();
		function zoomIn(zoomStep) {
			canvas.zoomIn(zoomStep);
		}
		function zoomOut(zoomStep) {
			canvas.zoomOut(zoomStep);
		}
		function setZoom(zoomValue) {
			canvas.setZoom(zoomValue);
		}
		function setCamera(params) {
			canvas.setCamera(params);
		}
		function panBy(dxScreen, dyScreen) {
			canvas.panBy(dxScreen, dyScreen);
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

		// Upper bound of the fitted scale: the natural size of the scheme, and never above the bound
		// the consumer set for the camera.
		function resolveMaxFitZoom(requested) {
			// Checked without a cast: `Number(null)` is a finite zero, and an explicit null would pass
			// for a scale of nothing instead of falling back to the natural size.
			const fitZoom = Number.isFinite(requested) ? requested : NATURAL_ZOOM;
			const consumerZoom = Number(ui_vue3.toValue(maxZoom));
			return Number.isFinite(consumerZoom) ? Math.min(fitZoom, consumerZoom) : fitZoom;
		}

		/**
		 * Fits the overview to the whole content of the scheme. Only the overview moves: the model of
		 * the scheme stays as it is and the history of changes is not written.
		 */
		function fitToView(params = {}) {
			canvas.fitToView({
				bounds: getDiagramBounds(ui_vue3.toValue(blocks), ui_vue3.toValue(blocksRectMap)),
				// Read at the moment of the call: a panel of the consumer opens and closes while the
				// diagram stays mounted, and the free part of the screen moves with it.
				insets: params.insets ?? ui_vue3.toValue(viewportInsets),
				padding: params.padding ?? ui_vue3.toValue(canvasGridSize),
				maxFitZoom: resolveMaxFitZoom(params.maxFitZoom)
			});
		}
		return {
			zoomIn,
			zoomOut,
			setZoom,
			setCamera,
			panBy,
			goToBlock,
			goToBlockById,
			fitToView
		};
	}

	/**
	 * The focus of the canvas as one rule for everyone who closes a tool of the diagram.
	 *
	 * Arrows, the shortcuts of the canvas and the reading order all start from the root: a tool closed
	 * from the keyboard leaves the focus nowhere unless it hands it back. The handing back is allowed
	 * only while nothing holds Escape - a claim still on the stack means a layer above the canvas is
	 * open, and taking the focus from it would close the next press into the wrong thing.
	 */
	function useCanvasFocus() {
		const {
			blockDiagramRef,
			focusScopeRef,
			inputState
		} = useBlockDiagram();

		/**
		 * The consumer names the area the diagram answers an unclaimed Escape inside - its own editor
		 * and not the page around it. Declared once and given back with `null`; without a declaration
		 * the area is the root of the canvas, and a consumer that never declares one sees no change.
		 */
		function registerFocusScope(element) {
			focusScopeRef.value = element;
		}
		function focusCanvas() {
			const root = ui_vue3.toValue(blockDiagramRef);
			if (!root) {
				return false;
			}
			root.focus({
				preventScroll: true
			});
			return true;
		}
		function returnFocusToCanvas() {
			if (inputState.hasExclusiveClaims(KEY_TOKEN.ESCAPE)) {
				return false;
			}
			return focusCanvas();
		}
		return {
			focusCanvas,
			returnFocusToCanvas,
			registerFocusScope
		};
	}

	/**
	 * The owner of an Escape nobody claimed.
	 *
	 * A tool closed by the key hands the focus back itself, but the press that closes nothing has no
	 * owner: a catalog collapsed by its own shortcut holds the focus on a button, claims Escape from
	 * nobody, and the next press used to land nowhere. The split by phases is the whole check of
	 * "nobody claimed it" - a claim on the stack is taken by the capture channel, which stops the
	 * propagation, so this handler is never even asked. Hence a plain subscription for the whole life
	 * of the canvas: there is no moment at which the stack announces it has gone empty.
	 *
	 * The answer is bounded by the work area the consumer declares, because the bubbling channel
	 * listens on the window and hears the page around the editor too. The area alone is not enough
	 * against a popup of the core: it closes on `keyup` and lets the `keydown` through a frame earlier,
	 * while the focus stands on the very trigger that opened it - a button of a toolbar inside the
	 * area. The same guard every exclusive consumer of Escape keeps is asked here too, so the press
	 * that closes the popup does not take the focus off the trigger it has to come back to.
	 *
	 * The browser action stays: Escape is a key of the browser, and the canvas claims nothing by moving
	 * its own focus.
	 */
	function useCanvasEscapeFallback() {
		const {
			blockDiagramRef,
			focusScopeRef,
			inputState
		} = useBlockDiagram();
		const {
			returnFocusToCanvas
		} = useCanvasFocus();
		let unsubscribeEscape = null;
		function handleEscape(event) {
			// A held key repeats, and a repeat is the same press: the focus moves once.
			if (event.repeat === true) {
				return;
			}
			if (isKeyboardBusyByOverlay()) {
				return;
			}
			if (!isFocusOnAnyOf([ui_vue3.toValue(focusScopeRef) ?? ui_vue3.toValue(blockDiagramRef)])) {
				return;
			}
			returnFocusToCanvas();
		}
		ui_vue3.onMounted(() => {
			unsubscribeEscape = inputState.on(KEY_TOKEN.ESCAPE, handleEscape, {
				preventDefault: false
			});
		});
		ui_vue3.onUnmounted(() => {
			unsubscribeEscape?.();
			unsubscribeEscape = null;
		});
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
			connectionBorderRadius,
			gestureBlockIds,
			isGestureElevated
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

		// One end inside the raised composition is enough, so a connection leaving it for an outside node
		// goes up too: raising only the inner ones hid where the node being dragged leads, and losing
		// sight of that costs more than a line lying over a stray block on its way there. Only a
		// connection with both ends outside stays where it is. Read from the two values that change at
		// the press and at the close - the route is computed apart from this and nothing that moves
		// frame by frame reaches here.
		const isElevatedConnection = ui_vue3.computed(() => {
			if (ui_vue3.toValue(isGestureElevated) !== true) {
				return false;
			}
			const blockIds = ui_vue3.toValue(gestureBlockIds);
			if (blockIds.size === 0) {
				return false;
			}
			const {
				sourceBlockId,
				targetBlockId
			} = ui_vue3.toValue(connection);
			return blockIds.has(sourceBlockId) || blockIds.has(targetBlockId);
		});
		return {
			connectionPortsPosition,
			connectionPathInfo,
			isDisabled,
			isElevatedConnection
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
			canvasRef,
			transformLayoutRef,
			canvasWidth,
			canvasHeight,
			canvas,
			blockIntersections
		} = useBlockDiagram();
		const dragOn = ui_vue3.ref(false);
		const isDragging = ui_vue3.ref(false);
		const zooming = ui_vue3.ref(false);
		let requestAnimationId = null;
		// The element the canvas was attached to. The detach names it so that a component unmounted
		// after a later one mounted does not drop the binding that later one made.
		let attachedCanvasElement = null;
		ui_vue3.watch([transformX, transformY, zoom, canvasWidth, canvasHeight], () => {
			blockIntersections.selectVisibleBlocks();
			blockIntersections.selectVisibleConnections();
		});
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
			attachedCanvasElement = ui_vue3.toValue(newCanvasRef);
			canvas.attach(attachedCanvasElement, getCanvasStyleOptions(newCanvasStyle));
			render();
		}
		function onUnmounted() {
			cancelAnimationFrame(requestAnimationId);
			canvas.detach(attachedCanvasElement);
			attachedCanvasElement = null;
		}
		function onMouseDown(event) {
			if (ui_vue3.toValue(isDisabledBlockDiagram)) {
				return;
			}
			dragOn.value = true;
			canvas.setCameraPositionByMouseDown(event);
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
			canvas.setCameraPositionByMouseMove(event);
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
				canvas.setCameraZoomByWheel(event, zoomChange);
				setTimeout(() => {
					zooming.value = false;
				}, 200);
			} else {
				canvas.setCameraPositionByWheel(event);
			}
		}

		// The timestamp of the frame is handed to the canvas: a move of the overview lives in this very
		// loop, and the clock of the loop is the one it has to step by.
		function render(now) {
			canvas.render(now);
			const viewMatrix = canvas.viewMatrix;
			main_core.Dom.style(ui_vue3.toValue(transformLayoutRef), 'transform', `
				matrix(
					${viewMatrix[0]}, 0, 0, ${viewMatrix[4]}, ${viewMatrix[6]}, ${viewMatrix[7]}
				)
			`);
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
		const {
			resolvePlacementDelta
		} = useBlockPlacement();
		const {
			mark: markDisplacedBlocks,
			announceRefusal
		} = useDisplacedBlocks();

		// Anything at all may be dropped onto the canvas - a selected piece of text, a link, a browser
		// tab - and all of it arrives as plain text through the very same channel a block does. So the
		// payload is parsed as untrusted input: what does not read as a block is not a block, and the
		// drop is over.
		function parseDroppedBlock(dataString) {
			let payload = null;
			try {
				payload = JSON.parse(dataString);
			} catch {
				return null;
			}
			if (!main_core.Type.isPlainObject(payload) || main_core.Type.isNil(payload.id)) {
				return null;
			}
			return main_core.Type.isPlainObject(payload.dimensions) && main_core.Type.isPlainObject(payload.position) ? payload : null;
		}
		function onDrop(event) {
			event.preventDefault();
			const payload = parseDroppedBlock(event.dataTransfer.getData('text/plain'));
			if (payload === null) {
				return;
			}

			// The declaration of a container travels with the drag and stops here: the canvas keeps of a
			// block its geometry and whatever the consumer put there, and from the mount of the block
			// onwards the registry answers the same question. Left in, the flag would sit on the blocks
			// dropped in this session and on no other, which is a field with no meaning at all.
			const {
				isBackdrop = false,
				...receivedData
			} = payload;
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
			const isSnapped = isSnapModifier(event);

			// Rounded before snapping: the divisions above leave fractions, and the model keeps
			// whole-pixel coordinates even when the drop is not snapped.
			receivedData.position = snapPoint({
				x: Math.round(receivedData.position.x),
				y: Math.round(receivedData.position.y)
			}, isSnapped);

			// Asked after the snapping and never before it: a correction taken first would be pulled
			// straight back into the occupied cell by the grid. The node is not in the index yet, so
			// there is nothing to strike out of the search - it is simply the only participant.
			//
			// What a block is made of is decided by the consumer markup, and the diagram learns of a
			// container only when its wrapper mounts - which happens after this write. Until then the only
			// word on it is the one the drag payload carries (see `DiagramDraggedBlock`), and the rule
			// takes it for this one operation. Pasting answers the same question its own way: there the
			// container was copied from one the canvas already knows.
			const placementDelta = resolvePlacementDelta([{
				id: receivedData.id,
				x: receivedData.position.x,
				y: receivedData.position.y,
				width,
				height
			}], {
				followsGrid: isSnapped,
				backdropIds: isBackdrop ? new Set([receivedData.id]) : null
			});

			// No free room within the budget: the node is not created at all, so the model never comes to
			// hold a forbidden overlap. There is nothing to revert here - the node has never reached it.
			// The refusal is still reported: the node the user aimed at simply not appearing is otherwise
			// indistinguishable from a drop that went nowhere.
			if (placementDelta === null) {
				announceRefusal();
				return;
			}
			receivedData.position = {
				x: receivedData.position.x + placementDelta.x,
				y: receivedData.position.y + placementDelta.y
			};
			addBlock(receivedData);
			hooks.dropNewBlock.trigger(receivedData);
			if (placementDelta.x !== 0 || placementDelta.y !== 0) {
				markDisplacedBlocks([receivedData.id]);
			}
		}
		return {
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
			getBlockById,
			blocksRectMap,
			updateBlockRectById,
			highlitedBlockIds
		} = useBlockDiagram();
		const {
			resolvePlacementDelta
		} = useBlockPlacement();
		const {
			mark: markDisplacedBlocks
		} = useDisplacedBlocks();
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
		// Whether the edge the commit works with was put on the grid: the rule rounds its own corrections
		// the same way only when it is told the operation snaps.
		let isLastFrameSnapped = false;
		// The handle the press landed on: the gesture opens on its cursor and its edge handlers.
		let pressedCursorType = CURSOR_TYPES.EW_RESIZE;
		let pressedResizeHandlers = [];
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

		// While resizing the model block keeps its old size, so slot content reads the staged one.
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

		// The gesture itself is torn down by the core, which owns the unmount of this very instance.
		function onUnmounted() {
			main_core.Event.unbind(ui_vue3.toValue(rightSideRef), 'mousedown', onMouseDownRightSide);
			main_core.Event.unbind(ui_vue3.toValue(bottomSideRef), 'mousedown', onMouseDownBottomSide);
			main_core.Event.unbind(ui_vue3.toValue(leftSideRef), 'mousedown', onMouseDownLeftSide);
			main_core.Event.unbind(ui_vue3.toValue(topSideRef), 'mousedown', onMouseDownTopSide);
			main_core.Event.unbind(ui_vue3.toValue(rightTopCornerRef), 'mousedown', onMouseDownRightTopCorner);
			main_core.Event.unbind(ui_vue3.toValue(rightBottomCornerRef), 'mousedown', onMouseDownRightBottomCorner);
			main_core.Event.unbind(ui_vue3.toValue(leftTopCornerRef), 'mousedown', onMouseDownLeftTopCorner);
			main_core.Event.unbind(ui_vue3.toValue(leftBottomCornerRef), 'mousedown', onMouseDownLeftBottomCorner);
		}

		// A handle belongs to one block, so the gesture leads that block alone whatever was selected
		// before the press.
		function resolveTargets() {
			return [ui_vue3.toValue(block).id];
		}

		// Edge under the cursor in canvas coordinates, rounded before snapping so that even an
		// unsnapped edge leaves the model with whole-pixel geometry at any zoom.
		function getEdge(value, isSnapRequested) {
			return snapValue(Math.round(value), isSnapRequested);
		}
		function resizeTopSide(point, isSnapRequested) {
			const edgeY = getEdge(point.y, isSnapRequested);
			const {
				position,
				size
			} = getBoundsByStartEdge(edgeY, prevBlockY + prevBlockHeight, ui_vue3.toValue(minHeight));
			resizingBlock.value.position.y = position;
			resizingBlock.value.dimensions.height = size;
		}
		function resizeRightSide(point, isSnapRequested) {
			const edgeX = getEdge(point.x, isSnapRequested);
			resizingBlock.value.dimensions.width = getSizeByEndEdge(edgeX, prevBlockX, ui_vue3.toValue(minWidth));
		}
		function resizeBottomSide(point, isSnapRequested) {
			const edgeY = getEdge(point.y, isSnapRequested);
			resizingBlock.value.dimensions.height = getSizeByEndEdge(edgeY, prevBlockY, ui_vue3.toValue(minHeight));
		}
		function resizeLeftSide(point, isSnapRequested) {
			const edgeX = getEdge(point.x, isSnapRequested);
			const {
				position,
				size
			} = getBoundsByStartEdge(edgeX, prevBlockX + prevBlockWidth, ui_vue3.toValue(minWidth));
			resizingBlock.value.position.x = position;
			resizingBlock.value.dimensions.width = size;
		}

		// The pointer is taken through the live camera, which already holds the travel of the
		// autoscroll - hence `client` rather than the point the core has shifted itself.
		function applyFrame(point, isSnapRequested, source, client) {
			const canvasPoint = transformMouseEventToPoint({
				clientX: client.x,
				clientY: client.y
			});
			isLastFrameSnapped = isSnapRequested;
			for (const resize of activeResizeHandlers) {
				resize(canvasPoint, isSnapRequested);
			}
			return true;
		}

		// The pre-gesture geometry comes back because `onClose` throws the working copy away; the write
		// below guards an order of teardown that ever puts a render in between.
		function revert() {
			const staged = ui_vue3.toValue(resizingBlock);
			if (staged === null) {
				return;
			}
			staged.position.x = prevBlockX;
			staged.position.y = prevBlockY;
			staged.dimensions.width = prevBlockWidth;
			staged.dimensions.height = prevBlockHeight;
		}

		// The areas the gesture has added to the block, in model coordinates - the staged geometry less the
		// one the press found. The rule judges the bounds it is given as they stand, so the whole staged
		// rect would answer for overlaps the resize did not make: a block already lying on its neighbour
		// could then not even be shrunk, because any size still leaving part of that overlap reads exactly
		// like a block stretched onto it. Asked about the added areas alone, the rule refuses an overlap
		// this gesture creates or deepens and says nothing about one it inherited.
		function grownPlacementRects() {
			const {
				position,
				dimensions
			} = ui_vue3.toValue(resizingBlock);
			const blockId = ui_vue3.toValue(block).id;
			const left = position.x;
			const top = position.y;
			const right = left + dimensions.width;
			const bottom = top + dimensions.height;
			const prevRight = prevBlockX + prevBlockWidth;
			const prevBottom = prevBlockY + prevBlockHeight;
			const grown = [];
			if (left < prevBlockX) {
				grown.push({
					id: blockId,
					x: left,
					y: top,
					width: prevBlockX - left,
					height: bottom - top
				});
			}
			if (right > prevRight) {
				grown.push({
					id: blockId,
					x: prevRight,
					y: top,
					width: right - prevRight,
					height: bottom - top
				});
			}
			if (top < prevBlockY) {
				grown.push({
					id: blockId,
					x: left,
					y: top,
					width: right - left,
					height: prevBlockY - top
				});
			}
			if (bottom > prevBottom) {
				grown.push({
					id: blockId,
					x: left,
					y: prevBottom,
					width: right - left,
					height: bottom - prevBottom
				});
			}
			return grown;
		}
		function commit() {
			// A click on a handle without a move stages nothing: the command would ask the consumer to
			// save an unchanged block.
			if (!isGeometryStaged()) {
				return false;
			}
			const placementDelta = resolvePlacementDelta(grownPlacementRects(), {
				followsGrid: isLastFrameSnapped
			});

			// The rule answers with the shift that would make the new bounds an allowed neighbour, but a
			// resize has no right to move the block it is sizing: any answer other than "stay" - a shift or
			// no free room at all - means those bounds lie over a block they may not, and the whole gesture
			// is given up, so the model never comes to hold a forbidden overlap.
			if (placementDelta === null || placementDelta.x !== 0 || placementDelta.y !== 0) {
				revert();
				// A block that came back to its own size looks exactly like a gesture that never
				// happened, so the size it was brought back to is marked - the outline points at the
				// geometry the rule left standing, not at a gesture given up with nothing to show.
				// The same refusal reads as `--displaced` here and as `--placement-refused` in the node
				// drag on purpose: a drag leaves the pointer far from the block it gave up, which needs
				// the louder signal, while a resize ends on the very edge the user is holding.
				markDisplacedBlocks([ui_vue3.toValue(block).id]);
				return false;
			}
			updateResizableBlock();
			return true;
		}

		// After the gesture the measured rect is brought to the model geometry: a consumer may refuse
		// the resize. The entry is updated, never created - geometry purged on purpose stays purged.
		function alignToModel() {
			const blockId = ui_vue3.toValue(block).id;
			const modelBlock = getBlockById(blockId);
			if (modelBlock === null || !main_core.Type.isObjectLike(ui_vue3.toValue(blocksRectMap)?.[blockId])) {
				return;
			}
			const {
				position,
				dimensions
			} = ui_vue3.toValue(modelBlock);
			if (!main_core.Type.isObjectLike(position) || !main_core.Type.isObjectLike(dimensions)) {
				return;
			}

			// A non-finite coordinate would turn every port of the node into NaN and take all its
			// connections off the canvas.
			const rect = {
				x: position.x,
				y: position.y,
				width: dimensions.width,
				height: dimensions.height
			};
			if (Object.values(rect).some(value => !Number.isFinite(value))) {
				return;
			}
			updateBlockRectById(blockId, rect);
		}
		function onOpen() {
			cursorType.value = pressedCursorType;
			// Geometry is staged in its own objects: shared with the model block, every resize step
			// would be a deep mutation of props.blocks, which rebuilds the intersections index and
			// unmounts the block mid-gesture under render optimization.
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
			isLastFrameSnapped = false;
			activeResizeHandlers = pressedResizeHandlers;
		}
		function onClose() {
			cursorType.value = 'default';
			isResize.value = false;
			resizingBlock.value = null;
			activeResizeHandlers = [];
		}
		const gesture = useGestureRunner({
			// A handle is 4 px wide, so a press on it is unambiguous: there is no click on the
			// selection to tell the gesture from.
			threshold: 0,
			resolveTargets,
			applyFrame,
			revert,
			commit,
			alignToModel,
			onOpen,
			onClose
		});
		function startResize(event, curType, resizeHandlers) {
			// The press stops here whatever the gesture decides about it: otherwise it would reach the
			// root of the block, which starts a node drag, and the canvas, which starts a frame.
			event.stopPropagation();
			// A handle belongs to one block, so the selection collapses to it whatever the guards of
			// the gesture say.
			replaceSelection(highlitedBlockIds, [ui_vue3.toValue(block).id]);
			pressedCursorType = curType;
			pressedResizeHandlers = resizeHandlers;
			gesture.start(event);
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

	// eslint-disable-next-line max-lines-per-function
	function useCanvasSelection(params) {
		const {
			zoom,
			setSelectionWorldRect,
			setSelectionActive,
			isSelectionActive,
			startAutoScroll,
			stopAutoScroll,
			updateMousePosition,
			highlitedBlockIds,
			inputState
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
		// The selection as it stood before the press cleared it, and the handle on the cancel paths:
		// the drag is open for exactly as long as that handle is held.
		let selectionBeforeDrag = [];
		let unbindCancelPaths = null;
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
			// A cancelled drag leaves the diagram the way it found it, so what stood selected is kept
			// until the drag ends one way or another.
			selectionBeforeDrag = [...ui_vue3.toValue(highlitedBlockIds)];
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

			// A drag whose release never arrived is still open when this press comes: a mouseup
			// dispatched on the window never travels down to the document. The handle is the only way
			// left to unbind its subscriptions.
			unbindCancelPaths?.();
			unbindCancelPaths = bindCancelPaths(inputState, cancel);
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
			unbindCancelPaths?.();
			unbindCancelPaths = null;
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

		// A cancelled gesture is one that never happened: the selection goes back to what the press
		// found. A release does not come here - what it selected is its result.
		function cancel() {
			if (unbindCancelPaths === null) {
				return;
			}
			replaceSelection(highlitedBlockIds, selectionBeforeDrag);
			end();
		}

		// The cancel paths listen on the document and the window: a diagram taken down mid-drag has to
		// take them with it.
		ui_vue3.onBeforeUnmount(() => {
			unbindCancelPaths?.();
			unbindCancelPaths = null;
		});
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
			snapPoint,
			setGroupDragOffset,
			resetGroupDragOffset
		} = useBlockDiagram();
		const {
			captureContainedBlockIds,
			hasGroupableBlock
		} = useGroupable();
		const {
			resolvePlacementDelta
		} = useBlockPlacement();
		const {
			mark: markDisplacedBlocks,
			markRefused: markRefusedBlocks
		} = useDisplacedBlocks();
		let currentZoom = 1;
		let movingItems = [];
		let committedPositions = [];
		// Where the button went down: the frame is measured from it, with the camera travel of the
		// autoscroll already added in by the core.
		let anchor = {
			x: 0,
			y: 0
		};
		let lastTotalDelta = {
			x: 0,
			y: 0
		};
		// Whether the last drawn frame snapped the delta: the release commits the position that frame
		// drew, so the correction of the placement rule is rounded to the grid on the very same terms.
		let isLastFrameSnapped = false;
		const drawMarkup = (blockId, x, y) => {
			const blockElement = ui_vue3.toValue(blockElMap)?.get(blockId);
			if (blockElement) {
				main_core.Dom.style(blockElement, 'left', `${x}px`);
				main_core.Dom.style(blockElement, 'top', `${y}px`);
			}
		};

		// The markup, the cached rect and the port coordinates of one node. The model is left alone
		// until mouseup: a per-frame write would clear the spatial index and take the connections off.
		const moveItem = (blockId, x, y, stepX, stepY) => {
			drawMarkup(blockId, x, y);

			// Only an existing entry is moved: a merge over a missing one would recreate geometry that
			// a purge removed on purpose.
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

		// A node whose model position is unusable stays out of the gesture: a non-finite coordinate
		// would spread NaN over the rect cache, the ports and the model.
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

		// Nodes lying inside a container that took part in the selection. They join the gesture as
		// ordinary members and go through the same filtering the selected nodes do; the union goes by
		// block id, so a node that is both selected and contained is taken exactly once. With no
		// container among the selected blocks the capture answers without a single lookup in the
		// intersections index, and the selection itself stays the list of participants - nothing new is
		// built for a gesture that has no containers in it.
		const collectParticipantIds = (selectedBlocks, selectedIds) => {
			let participantIds = null;
			for (const block of selectedBlocks) {
				for (const capturedId of captureContainedBlockIds(block)) {
					if (participantIds === null) {
						participantIds = new Set(selectedIds);
					}
					participantIds.add(capturedId);
				}
			}
			return participantIds ?? selectedIds;
		};

		// After the gesture the markup and the measured geometry are brought to the model position: a
		// consumer may refuse the move or write a position of its own. The port offsets are written as
		// steps, so nothing but this brings them back into step.
		const alignItemToModel = ({
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

		// One pass over the model instead of a linear lookup per node of the selection.
		const buildBlockByIdMap = () => {
			return new Map(ui_vue3.toValue(uiBlocksRef).map(block => [ui_vue3.toValue(block).id, block]));
		};
		const resolveTargets = event => {
			closeContextMenu();
			const selectedIds = new Set(ui_vue3.toValue(highlitedBlockIds));
			const modelBlocks = ui_vue3.toValue(uiBlocksRef);
			// The modifier is read off this very press: the set of a gesture is fixed here, so Alt taken
			// or let go later changes nothing. With it held the selection alone moves, as it did before
			// containers existed.
			const participantIds = isCaptureCancelModifier(event) ? selectedIds : collectParticipantIds(modelBlocks.filter(block => selectedIds.has(block.id)), selectedIds);
			const items = modelBlocks.filter(block => participantIds.has(block.id)).map(block => createMovingItem(block)).filter(item => item !== null);
			if (items.length === 0) {
				return null;
			}
			currentZoom = ui_vue3.toValue(zoom);
			anchor = {
				x: event.clientX,
				y: event.clientY
			};
			lastTotalDelta = {
				x: 0,
				y: 0
			};
			isLastFrameSnapped = false;
			movingItems = items;
			return movingItems.map(item => item.id);
		};

		// Every node of this gesture keeps its position in the markup alone until mouseup, so all of
		// them are drawn again.
		const redrawMarkup = () => {
			for (const item of movingItems) {
				drawMarkup(item.id, item.startX + lastTotalDelta.x, item.startY + lastTotalDelta.y);
			}
		};
		const applyFrame = (point, isSnapRequested) => {
			isLastFrameSnapped = isSnapRequested;

			// the whole group moves by one snapped delta, so distances inside it stay untouched;
			// the delta is whole-pixel even unsnapped, because the model keeps integer coordinates
			const {
				x: totalDeltaX,
				y: totalDeltaY
			} = snapPoint({
				x: Math.round((point.x - anchor.x) / currentZoom),
				y: Math.round((point.y - anchor.y) / currentZoom)
			}, isSnapRequested);

			// Nothing but a finite delta is ever applied: a NaN would spread over the rect cache, the
			// port coordinates and the model.
			if (!Number.isFinite(totalDeltaX) || !Number.isFinite(totalDeltaY)) {
				return false;
			}
			const stepX = totalDeltaX - lastTotalDelta.x;
			const stepY = totalDeltaY - lastTotalDelta.y;
			if (stepX === 0 && stepY === 0) {
				return false;
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
			return true;
		};
		const revert = () => {
			for (const item of movingItems) {
				moveItem(item.id, item.startX, item.startY, -lastTotalDelta.x, -lastTotalDelta.y);
			}
		};

		// The rectangles the placement rule is asked about: the whole-pixel position the gesture aims at,
		// and the size the model states. The gesture itself knows no sizes - `MovingItem` carries only a
		// starting point - so the size comes from the block the model holds under the same id. A node the
		// model has lost keeps its place among the participants without a usable rect: the rule leaves it
		// out of the geometry but still knows it is not an obstacle to the rest of the gesture.
		const collectPlacementRects = blockById => {
			const rects = new Map();
			for (const item of movingItems) {
				const dimensions = ui_vue3.toValue(ui_vue3.toValue(blockById.get(item.id))?.dimensions) ?? {};
				rects.set(item.id, {
					id: item.id,
					x: Math.round(item.startX + lastTotalDelta.x),
					y: Math.round(item.startY + lastTotalDelta.y),
					width: dimensions.width,
					height: dimensions.height
				});
			}
			return rects;
		};
		const commit = () => {
			// A gesture that left the nodes where they started is a click on the selection, not a drag:
			// committing it would ask the consumer to save a diagram nothing changed in.
			if (lastTotalDelta.x === 0 && lastTotalDelta.y === 0) {
				return false;
			}
			const blockById = buildBlockByIdMap();
			const placementRects = collectPlacementRects(blockById);
			// Asked before the first write: the intersections index refreshes inside every `updateBlock`,
			// so after the first one the rule would answer about a picture that no longer stands.
			const placementDelta = resolvePlacementDelta([...placementRects.values()], {
				followsGrid: isLastFrameSnapped
			});

			// No free room within the budget: the gesture is given up whole, so the model never comes to
			// hold a forbidden overlap. The feedback still goes out - on the positions the participants
			// have just come back to, so the refusal is not a silent one.
			if (placementDelta === null) {
				revert();
				markRefusedBlocks(movingItems.map(item => item.id));
				return false;
			}

			// Where the frame left the nodes, before the correction: the step given to the markup and to
			// the port offsets is counted from there.
			const drawnDelta = lastTotalDelta;

			// Added to the delta of the whole gesture rather than to the position of each node: the
			// selection travels by one value, so the layout inside it comes out of the correction as it
			// went in.
			lastTotalDelta = {
				x: drawnDelta.x + placementDelta.x,
				y: drawnDelta.y + placementDelta.y
			};

			// The markup and the geometry are brought to the whole-pixel position of the model first, so
			// all three describe the same place. That position is the very rect the rule was asked about
			// plus the correction it answered with: rounding happens once, before the question, so the
			// model gets exactly the geometry the rule cleared. Rounding the corrected sum a second time
			// would leave a node with a fractional model position a pixel off that geometry - and a pixel
			// is enough to overlap the neighbour it was moved away from.
			committedPositions = movingItems.map(item => {
				const {
					x,
					y
				} = placementRects.get(item.id);
				const correctedX = x + placementDelta.x;
				const correctedY = y + placementDelta.y;
				const drawnX = item.startX + drawnDelta.x;
				const drawnY = item.startY + drawnDelta.y;
				moveItem(item.id, correctedX, correctedY, correctedX - drawnX, correctedY - drawnY);
				return {
					id: item.id,
					x: correctedX,
					y: correctedY
				};
			});

			// A participant the model has lost is written nowhere, so it has not moved either.
			const committedBlockIds = [];
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
				committedBlockIds.push(id);
			}
			if (placementDelta.x !== 0 || placementDelta.y !== 0) {
				markDisplacedBlocks(committedBlockIds);
			}
			return true;
		};

		// Runs a tick after the commit: under render optimization the block input still carries the
		// pre-gesture position on the render of that commit, and the nodes would blink back to it.
		const alignToModel = () => {
			// Built again rather than reused: the consumer applies the commands by replacing the model,
			// and the point here is to read where it has put the nodes.
			const committedBlockById = buildBlockByIdMap();
			for (const committedPosition of committedPositions) {
				alignItemToModel(committedPosition, committedBlockById);
			}
		};
		const onOpen = () => {
			resetGroupDragOffset();
			// Not on close: the alignment runs a tick later and these positions are what it reads.
			committedPositions = [];
		};
		const onClose = () => {
			resetGroupDragOffset();
			movingItems = [];
			lastTotalDelta = {
				x: 0,
				y: 0
			};
		};
		const gesture = useGestureRunner({
			threshold: DRAG_START_THRESHOLD,
			resolveTargets,
			elevatesTargets: hasGroupableBlock,
			redrawMarkup,
			applyFrame,
			revert,
			commit,
			alignToModel,
			onOpen,
			onClose
		});
		const onGroupMouseDown = event => {
			gesture.start(event);
		};
		return {
			onGroupMouseDown
		};
	}

	// Whether a rectangle overlaps a node. Strict on every side: a node that only touches the
	// rectangle by an edge is not inside it.
	function isRectOverBlock(rect, position, size) {
		return rect.x < position.x + size.width && rect.x + rect.width > position.x && rect.y < position.y + size.height && rect.y + rect.height > position.y;
	}

	/**
	 * Geometry of the selection: where the selected nodes stand and how large the box around them is.
	 * The shift a running drag draws is kept out of it - nothing here changes between the frames of one
	 * gesture, and the frame only adds that shift on top.
	 */
	function useGroupSelectionBounds(options) {
		const {
			blocks,
			selectedIds,
			blocksRectMap,
			defaultBlockSize
		} = options;

		// One pass over the model instead of a linear lookup per selected node.
		const blockById = ui_vue3.computed(() => {
			return new Map(ui_vue3.toValue(blocks).map(block => [ui_vue3.toValue(block).id, block]));
		});
		const blockOrderById = ui_vue3.computed(() => {
			return new Map(ui_vue3.toValue(blocks).map((block, index) => [ui_vue3.toValue(block).id, index]));
		});
		function blockSize(block) {
			return getSelectionBlockSize(block, blocksRectMap, defaultBlockSize);
		}

		// The rule above measures a node by its drawn size, the spatial index boxes it by the model
		// dimensions, and both boxes start at the same position: a node reaches past its model box by
		// the excess of one size over the other, and the largest such excess is how far a search
		// rectangle has to grow. A node whose model size is not finite has no usable box in the index
		// at all, so its whole drawn size is taken. Only sizes are read here, so a frame of a gesture
		// leaves the value alone.
		const selectionSearchPadding = ui_vue3.computed(() => {
			let width = 0;
			let height = 0;
			ui_vue3.toValue(blocks).forEach(block => {
				const drawnSize = blockSize(block);
				const dimensions = ui_vue3.toValue(block).dimensions;
				const modelWidth = Number(dimensions?.width);
				const modelHeight = Number(dimensions?.height);
				width = Math.max(width, drawnSize.width - (Number.isFinite(modelWidth) ? modelWidth : 0));
				height = Math.max(height, drawnSize.height - (Number.isFinite(modelHeight) ? modelHeight : 0));
			});
			return {
				width,
				height
			};
		});
		const selectionBounds = ui_vue3.computed(() => {
			const ids = ui_vue3.toValue(selectedIds) ?? [];

			// A frame over a single node would only repeat its own outline.
			if (ids.length <= 1) {
				return null;
			}
			const byId = ui_vue3.toValue(blockById);
			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;
			let hasBlocks = false;
			ids.forEach(id => {
				const block = byId.get(id) ?? null;
				if (block === null) {
					return;
				}
				const position = getUsablePosition(block);
				if (position === null) {
					return;
				}
				hasBlocks = true;
				const size = blockSize(block);
				minX = Math.min(minX, position.x);
				minY = Math.min(minY, position.y);
				maxX = Math.max(maxX, position.x + size.width);
				maxY = Math.max(maxY, position.y + size.height);
			});
			return hasBlocks ? {
				minX,
				minY,
				maxX,
				maxY
			} : null;
		});
		return {
			selectionBounds,
			blockById,
			blockOrderById,
			blockSize,
			selectionSearchPadding
		};
	}

	// eslint-disable-next-line max-lines-per-function
	function useGroupSelectionLogic(closeContextMenu, options) {
		const {
			blocks: uiBlocksRef,
			blocksRectMap,
			blockIntersections,
			highlitedBlockIds,
			setSelectionActive,
			isSelectionActive,
			groupDragOffset
		} = useBlockDiagram();
		const {
			selectionBounds,
			blockOrderById,
			blockSize,
			selectionSearchPadding
		} = useGroupSelectionBounds({
			blocks: uiBlocksRef,
			selectedIds: highlitedBlockIds,
			blocksRectMap,
			defaultBlockSize: options.defaultBlockSize
		});
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

		// Nodes the rectangle stands over, in the order they have in the model. The spatial index only
		// narrows the candidates down - the strict rule below decides, and it measures a node by its
		// own geometry. The query is grown by how far a node may reach past its model box; both boxes
		// start at the same position, hence the growth on the near sides alone.
		const collectIntersectingIds = worldRect => {
			const padding = ui_vue3.toValue(selectionSearchPadding);
			const candidates = blockIntersections.search({
				minX: worldRect.x - padding.width,
				minY: worldRect.y - padding.height,
				maxX: worldRect.x + worldRect.width,
				maxY: worldRect.y + worldRect.height
			});
			const order = ui_vue3.toValue(blockOrderById);
			const hits = candidates.filter(block => {
				const position = getUsablePosition(block);
				return position !== null && isRectOverBlock(worldRect, position, blockSize(block));
			});
			hits.sort((left, right) => {
				return (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0);
			});
			return new Set(hits.map(block => block.id));
		};
		function onCanvasSelect(worldRect) {
			if (!worldRect) {
				setSelectionActive(false);
				return;
			}
			const intersectingIds = collectIntersectingIds(worldRect);
			const currentIds = ui_vue3.toValue(highlitedBlockIds) || [];
			const nextIds = currentIds.filter(id => intersectingIds.has(id));
			// Membership by set: a linear lookup per node would cost the square of the selection on
			// every frame.
			const nextIdSet = new Set(nextIds);
			intersectingIds.forEach(id => {
				if (!nextIdSet.has(id)) {
					nextIds.push(id);
					nextIdSet.add(id);
				}
			});

			// Every replacement wakes each subscriber of the selection, so a frame that kept the same
			// nodes in the same order publishes nothing. The set size tells that apart from a duplicate
			// the replacement would have dropped.
			const isSameSelection = nextIds.length === currentIds.length && nextIdSet.size === nextIds.length && nextIds.every((id, index) => id === currentIds[index]);
			if (isSameSelection) {
				return;
			}
			replaceSelection(highlitedBlockIds, nextIds);
		}
		function onSelectionStart() {
			setSelectionActive(true);
			closeContextMenu();
			clearSelection(highlitedBlockIds);
		}
		const groupSelectionStyle = ui_vue3.computed(() => {
			if (ui_vue3.toValue(isSelectionActive)) {
				return null;
			}
			const bounds = ui_vue3.toValue(selectionBounds);
			if (bounds === null) {
				return null;
			}
			const padding = getSelectionBoxPadding();
			// The model keeps the pre-gesture positions until mouseup, so the box stands on the bounds
			// above and follows the drag by the shift it has drawn.
			const {
				x: dragOffsetX,
				y: dragOffsetY
			} = ui_vue3.toValue(groupDragOffset);
			return {
				left: `${bounds.minX + dragOffsetX - padding.left}px`,
				top: `${bounds.minY + dragOffsetY - padding.top}px`,
				width: `${bounds.maxX - bounds.minX + padding.left + padding.right}px`,
				height: `${bounds.maxY - bounds.minY + padding.top + padding.bottom}px`
			};
		});
		return {
			onCanvasSelect,
			onSelectionStart,
			groupSelectionStyle
		};
	}

	// A record names the keys it fires on or the action it runs, never both: which keys run an action
	// is the answer of the action registry, and a record that also spelled them out would contradict it.

	// A record has to name a key to fire on: a modifier alone never triggers a shortcut. Which
	// spellings count as a modifier is InputState's answer, so the two never drift apart.
	function hasMainKey(keys) {
		return main_core.Type.isArrayFilled(keys) && keys.some(key => {
			if (!main_core.Type.isStringFilled(key) || !main_core.Type.isStringFilled(key.trim())) {
				return false;
			}
			return !isModifierToken(key);
		});
	}

	// A broken record is reported and dropped, the way a record without a main key always was: one
	// mistake in a list of shortcuts must not take the working neighbours down with it.
	function isValidConfig({
		keys,
		actionId
	}) {
		if (main_core.Type.isStringFilled(actionId)) {
			if (!main_core.Type.isArrayFilled(keys)) {
				return true;
			}
			console.error('ui.block-diagram: invalid shortcut config, keys and actionId are exclusive', actionId);
			return false;
		}
		if (hasMainKey(keys)) {
			return true;
		}
		console.error('ui.block-diagram: invalid shortcut config, no main key found', keys);
		return false;
	}

	/**
	 * Registers diagram shortcuts on the input state owned by the canvas. Kept as a thin adapter: the
	 * signature is public API, consumers live outside this repository.
	 *
	 * A record registers either by its combo, as it always did, or by the id of the action it runs -
	 * then which press reaches it is decided by the action registry of the canvas and may change
	 * without remounting the consumer.
	 */
	function useKeyboardShortcuts(shortcutsConfig) {
		const {
			inputState
		} = useBlockDiagram();
		const configs = shortcutsConfig.filter(isValidConfig);
		let unsubscribes = [];
		ui_vue3.onMounted(() => {
			unsubscribes = configs.map(({
				keys,
				actionId,
				handler,
				preventDefault
			}) => {
				const listener = event => handler(event, inputState.pointer);
				if (main_core.Type.isStringFilled(actionId)) {
					return inputState.onAction(actionId, listener, {
						preventDefault
					});
				}

				// The record goes as a list, not as a joined string: '+' is a key of its own and a
				// joined string has no way to tell it from the separator.
				return inputState.on(keys, listener, {
					preventDefault
				});
			});
		});
		ui_vue3.onUnmounted(() => {
			unsubscribes.forEach(unsubscribe => unsubscribe());
			unsubscribes = [];
		});
	}

	const PAN_KEYS = {
		ArrowLeft: {
			x: -1,
			y: 0
		},
		ArrowRight: {
			x: 1,
			y: 0
		},
		ArrowUp: {
			x: 0,
			y: -1
		},
		ArrowDown: {
			x: 0,
			y: 1
		}
	};
	const MILLISECONDS_IN_SECOND = 1000;

	// The spellings `InputState` normalizes a modifier to; `isModifierToken` accepts the same set.
	const MODIFIER_TOKENS = ['ctrl', 'alt', 'shift', 'meta'];
	// Closes the gap to the target by at most `maxDelta` of the velocity's own length, so the speed ramps
	// at a fixed rate instead of snapping. The vector is ramped as a whole and not axis by axis: ramped
	// side by side, the axes of a diagonal reach full speed in the time one axis takes to cover a shorter
	// distance, and a turn from one direction to another briefly carries the camera faster than the speed
	// it was promised. Landing exactly on the target is what lets the loop tell a finished stop from a
	// slow one.
	function approachVector(velocity, target, maxDelta) {
		const deltaX = target.x - velocity.x;
		const deltaY = target.y - velocity.y;
		const distance = Math.hypot(deltaX, deltaY);
		if (distance <= maxDelta) {
			return {
				x: target.x,
				y: target.y
			};
		}
		return {
			x: velocity.x + deltaX / distance * maxDelta,
			y: velocity.y + deltaY / distance * maxDelta
		};
	}

	// Two arrows at once hold a vector of length sqrt(2), so without normalizing the diagonal would run
	// some 40 per cent faster than an axis. What is normalized is the target speed, not the path the ramp
	// takes to it: the axes ramp side by side, so a diagonal reaches full speed a little sooner than an
	// axis does. Opposite arrows cancel out and hold nothing.
	function getTargetDirection(heldKeys) {
		let x = 0;
		let y = 0;
		heldKeys.forEach(key => {
			x += PAN_KEYS[key].x;
			y += PAN_KEYS[key].y;
		});
		const length = Math.hypot(x, y);
		if (length === 0) {
			return {
				x: 0,
				y: 0
			};
		}
		return {
			x: x / length,
			y: y / length
		};
	}

	// The rule about an editable surface is written once, in `isInputEventTarget`: it asks an event about
	// its target, and the target here is whatever holds the focus at this very moment.
	function isEditableActiveElement() {
		return isInputEventTarget({
			target: document.activeElement
		});
	}

	// An arrow under a modifier is somebody else's shortcut: the browser's, the system's or the screen
	// reader's - VoiceOver reads by Ctrl+Option+arrow. The hold channel of the input state matches by the
	// key token alone, so without this every one of them would read as a plain arrow.
	function hasModifier(event) {
		return event?.ctrlKey === true || event?.altKey === true || event?.metaKey === true || event?.shiftKey === true;
	}

	// A modifier pressed after the arrow finds no press edge to be refused at: the token of the arrow does
	// not change, so the hold channel stays silent about it. Watching the modifiers themselves closes the
	// other order of the same pair - the arrow stops moving the camera, and the combo goes back to the
	// browser, because `Ctrl+ArrowLeft` matches no record of ours.
	function subscribeModifiers(inputState, onModifierDown) {
		return MODIFIER_TOKENS.map(token => inputState.onChange(token, isPressed => {
			if (isPressed) {
				onModifierDown();
			}
		}));
	}

	/**
	 * The frame loop of the pan: a constant speed with a short ramp at both ends of a hold. It knows
	 * nothing about keys - where to go and whether it may go at all are asked through the callbacks, which
	 * keeps the frame bookkeeping out of the subscription code.
	 */
	function createPanLoop(options) {
		const {
			getTarget,
			canRun,
			onCannotRun,
			panBy
		} = options;
		let frameId = null;
		// The timestamp of the previous frame, so a frame moves the camera by the time it actually took.
		// Null until the loop has seen its first frame: there is nothing to measure against yet.
		let previousFrameTime = null;
		// The velocity the camera runs at right now, as a share of the full speed. It follows the target
		// through `approachVector`, which is what makes both ends of a hold gradual.
		let velocity = {
			x: 0,
			y: 0
		};
		function stop() {
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
				frameId = null;
			}
			previousFrameTime = null;
			velocity = {
				x: 0,
				y: 0
			};
		}
		function step(now) {
			if (!canRun()) {
				onCannotRun();
				stop();
				return;
			}
			const elapsed = previousFrameTime === null ? 0 : now - previousFrameTime;
			previousFrameTime = now;
			const target = getTarget();
			const maxDelta = elapsed / KEYBOARD_PAN_RAMP_DURATION;
			velocity = approachVector(velocity, target, maxDelta);

			// The speed is per second, so a frame owes its own share of it. A fixed number of pixels per
			// frame would hand the speed over to the refresh rate of the monitor instead.
			const seconds = elapsed / MILLISECONDS_IN_SECOND;
			const dx = velocity.x * KEYBOARD_PAN_SPEED * seconds;
			const dy = velocity.y * KEYBOARD_PAN_SPEED * seconds;
			if (dx !== 0 || dy !== 0) {
				panBy(dx, dy);
			}

			// Nowhere to go and nothing left to slow down: the soft stop has finished.
			if (target.x === 0 && target.y === 0 && velocity.x === 0 && velocity.y === 0) {
				stop();
				return;
			}
			frameId = requestAnimationFrame(step);
		}
		function start() {
			if (frameId !== null) {
				return;
			}
			frameId = requestAnimationFrame(step);
		}
		return {
			start,
			stop
		};
	}

	/**
	 * Arrow keys drive the camera while they are held: the loop runs on animation frames at a constant
	 * speed, with a short pull away on press and a soft stop on release. The keys belong to the diagram
	 * only while the focus stands on one of its surfaces - the root, or the minimap the consumer places on
	 * its own - so the arrows of the surrounding page stay the page's own, and a popup rendered into `body`
	 * keeps them too.
	 */
	function useKeyboardPan() {
		const {
			isDisabledBlockDiagram,
			inputState,
			blockDiagramRef,
			canvasMapRef
		} = useBlockDiagram();
		const {
			panBy
		} = useCanvas();
		const heldKeys = new Set();
		let unsubscribes = [];

		// The right to pan, re-asked every frame and not only at the press: while the arrow is down the
		// diagram can be switched off, lose the focus, or hand it to a field - and no press edge says so.
		function canPan() {
			return !ui_vue3.toValue(isDisabledBlockDiagram) && !isEditableActiveElement() && isFocusOnAnyOf([ui_vue3.toValue(blockDiagramRef), ui_vue3.toValue(canvasMapRef)]);
		}
		const panLoop = createPanLoop({
			getTarget: () => getTargetDirection(heldKeys),
			canRun: canPan,
			// Switched off or left behind mid-hold, the camera stops where it stands - no coasting out of a
			// diagram that can no longer hear the key released. The held set goes with it: the arrow that is
			// still down belongs to whoever holds the focus now.
			onCannotRun: () => heldKeys.clear(),
			panBy
		});
		function handleHold(key, isPressed, event) {
			if (isPressed) {
				if (hasModifier(event) || isInputEventTarget(event) || !canPan()) {
					return;
				}
				heldKeys.add(key);
			} else {
				// A release always applies, whatever the focus is on and whatever state the diagram is in,
				// or the key would stick down and carry the camera away with it.
				heldKeys.delete(key);
			}

			// A release can leave another arrow held: two opposite ones cancel out and end the loop, and
			// letting go of one of them has to bring it back.
			if (heldKeys.size > 0 && canPan()) {
				panLoop.start();
			}
		}

		// Runs on every keydown of an arrow, auto repeat included, and does the two things the edge channel
		// cannot. It answers the browser: edges alone would let the page under the diagram keep scrolling
		// through a hold, and the suppression is owed exactly while the canvas may pan - an arrow the
		// diagram does not use stays the property of the page. And it picks up a hold that began without
		// the right to pan: the focus came back to the canvas, or the diagram was switched on, while the
		// key was already down. No press edge is coming for that key, so without this it would stay dead
		// until released - taken from the page and moving nothing. Modifiers need no check here: a record
		// is matched by the whole combo, so `Ctrl+ArrowLeft` never reaches one made for `ArrowLeft`.
		function handleArrowKeyDown(key, event) {
			if (!canPan()) {
				return;
			}
			event.preventDefault();
			if (!heldKeys.has(key)) {
				heldKeys.add(key);
				panLoop.start();
			}
		}
		ui_vue3.onMounted(() => {
			unsubscribes = subscribeModifiers(inputState, () => heldKeys.clear());
			unsubscribes.push(...Object.keys(PAN_KEYS).flatMap(key => [
			// Edges only: the hold channel stays silent through the auto repeat of the keyboard, which
			// is what keeps the movement off the repeat rate of the operating system. A forced release -
			// the window losing focus, the tab going away, the input state being detached - arrives here
			// as a release as well.
			inputState.onChange(key, (isPressed, event) => handleHold(key, isPressed, event)),
			// Subscribed directly, not through `useKeyboardShortcuts`, which could take this record as
			// it stands: the two channels are one mechanism and the adapter owns only one of them, so
			// declaring half of it there would split a pair between two lifecycle owners. Direct
			// subscriptions are how the extension already does it - canvas-transform.js, search-bar.js.
			inputState.on([key], event => handleArrowKeyDown(key, event), {
				preventDefault: false
			})]));
		});
		ui_vue3.onUnmounted(() => {
			unsubscribes.forEach(unsubscribe => unsubscribe());
			unsubscribes = [];
			heldKeys.clear();
			panLoop.stop();
		});
	}

	const COPY_MENU_ITEM_ID = 'copyBlocks';
	const PASTE_MENU_ITEM_ID = 'pasteBlocks';
	function selectFragment(blocks, connections, selectedIds, isBackdrop) {
		const selected = new Set(selectedIds);
		return {
			blocks: blocks.filter(block => selected.has(block.id)),
			backdropIds: selectedIds.filter(blockId => isBackdrop(blockId)),
			// A connection with an end outside the selection is left out: pasted, it would hang on a
			// block that is not part of the fragment.
			connections: connections.filter(connection => {
				return selected.has(connection.sourceBlockId) && selected.has(connection.targetBlockId);
			})
		};
	}

	/**
	 * Sets up copying and pasting for the diagram it is called inside of. Called once per diagram
	 * application: a second call registers a second pair of Mod+C/Mod+V on the shared input state, and
	 * one keypress pastes twice. The signature is public API, consumers live outside this repository.
	 */
	// eslint-disable-next-line max-lines-per-function
	function useCopyPaste(options = {}) {
		const {
			createBlockId,
			cloneContent = content => content,
			canPaste = () => true,
			shortcuts = true
		} = options;
		const {
			blockDiagramRef,
			blocks,
			connections,
			highlitedBlockIds,
			transformX,
			transformY,
			addBlocks,
			addConnections,
			transformEventToPoint,
			isDisabledBlockDiagram,
			hooks,
			actionRegistry,
			copyPasteBuffer: buffer
		} = useBlockDiagram();
		const highlightedBlocks = useHighlightedBlocks();
		const history = useHistory();
		const {
			closeContextMenu
		} = useContextMenu();
		const {
			resolvePlacementDelta
		} = useBlockPlacement();
		const {
			isGroupableBlock
		} = useGroupable();
		const {
			mark: markDisplacedBlocks,
			announceRefusal
		} = useDisplacedBlocks();
		const loc = useLoc();
		function copy() {
			const selectedIds = ui_vue3.toValue(highlitedBlockIds);
			// An empty selection leaves the buffer untouched, so a previously copied fragment stays
			// available for pasting. Copying itself is never restricted by canPaste.
			if (selectedIds.length === 0) {
				return false;
			}
			buffer.setContent(selectFragment(ui_vue3.toValue(blocks), ui_vue3.toValue(connections), selectedIds, isGroupableBlock));
			closeContextMenu();
			return true;
		}

		// A pasted block has not mounted yet, so the registry of containers knows nothing of it. The copy
		// inherits what the original was - a pasted container lies over the nodes it covers instead of
		// pushing them away - and that is read from the buffer, where it was written while the original
		// was still on the canvas. The registry answers only for content copied before the buffer began
		// to carry the flag; asking it for a copied-then-deleted container would lose the flag.
		function collectPastedBackdropIds(blockIdMap, copiedBackdropIds) {
			const wasBackdrop = copiedBackdropIds === null ? isGroupableBlock : blockId => copiedBackdropIds.includes(blockId);
			const backdropIds = new Set();
			for (const [sourceBlockId, pastedBlockId] of blockIdMap) {
				if (wasBackdrop(sourceBlockId)) {
					backdropIds.add(pastedBlockId);
				}
			}
			return backdropIds;
		}
		function paste(point) {
			// Checked before the buffer is read and before the highlight is cleared: a forbidden paste
			// leaves the canvas exactly as it was. The canvas flag closes pasting the same way it
			// closes the other model-changing gestures; canPaste is the domain guard on top of it.
			if (ui_vue3.toValue(isDisabledBlockDiagram) || !canPaste()) {
				return [];
			}
			try {
				const content = buffer.getContent();
				if (content === null || content.blocks.length === 0) {
					// An empty paste drops the current selection too: the gesture did happen, it simply
					// had nothing to put on the canvas.
					highlightedBlocks.clear();
					return [];
				}
				const fragment = issueNewFragmentIds(content, createBlockId);
				const clonedContent = cloneContent(fragment.content, fragment.blockIdMap);
				const fragmentBlocks = layoutFragmentBlocks(clonedContent.blocks, point);
				// The whole fragment is one set of participants, so its blocks never block each other: the
				// overlaps it may carry came from the schema it was copied from, and sanitising those is
				// not what this rule is for. The grid is left out of the correction on purpose - the
				// fragment lands where it was aimed at, and the layout above never aligned it either.
				const placementDelta = resolvePlacementDelta(fragmentBlocks.map(block => ({
					id: block.id,
					x: block.position.x,
					y: block.position.y,
					width: block.dimensions?.width,
					height: block.dimensions?.height
				})), {
					followsGrid: false,
					backdropIds: collectPastedBackdropIds(fragment.blockIdMap, content.backdropIds ?? null)
				});

				// No free room within the budget: nothing is pasted at all, so the model never comes to
				// hold a forbidden overlap and no snapshot of a half-done paste is taken. The buffer keeps
				// its content and the selection keeps its blocks, so the user may aim somewhere else and
				// try again - which is worth saying out loud, as the canvas itself stays exactly as it was.
				if (placementDelta === null) {
					announceRefusal();
					return [];
				}

				// Dropped only once the paste is certain to happen, and strictly before the model changes:
				// what is pasted becomes the new selection, and a refusal above leaves the old one alone.
				highlightedBlocks.clear();

				// Applied before the write: after it the paste would owe the history a second state.
				const pastedBlocks = fragmentBlocks.map(block => ({
					...block,
					position: {
						...block.position,
						x: block.position.x + placementDelta.x,
						y: block.position.y + placementDelta.y
					}
				}));
				addBlocks(pastedBlocks);
				addConnections(clonedContent.connections);
				if (placementDelta.x !== 0 || placementDelta.y !== 0) {
					markDisplacedBlocks(pastedBlocks.map(block => block.id));
				}

				// The highlight is queued before the hook fires and the snapshot, which defers itself
				// to the same queue, is registered after it: a subscriber deferring its own work lands
				// between the two.
				void ui_vue3.nextTick(() => {
					highlightedBlocks.replace(pastedBlocks.map(block => block.id));
				});

				// Connections go out as proposed, not as accepted: addConnections silently drops the
				// ones duplicating an already existing block and port pair.
				const payload = {
					blocks: pastedBlocks,
					connections: clonedContent.connections,
					point
				};
				// Subscribers live outside the extension: a failing one must not cost the paste that
				// already reached the model its own undo step.
				try {
					hooks.pasteBlocks.trigger(payload);
				} catch (error) {
					console.error('Paste error:', error);
				}
				void history.makeSnapshot();
				return pastedBlocks;
			} catch (error) {
				console.error('Paste error:', error);
				return [];
			}
		}

		/**
		 * Turns the last known pointer position into a paste point. A menu item lands its point inside
		 * the transformed layer, so it is already in world coordinates; the pointer is in viewport
		 * ones, and the camera shift has to be added on top. The two entry points stay different on
		 * purpose: unifying them would move one of them by the pan of the camera.
		 */
		function getShortcutPastePoint(pointer) {
			const rawPoint = transformEventToPoint({
				clientX: pointer.x,
				clientY: pointer.y
			});
			return {
				x: rawPoint.x + (ui_vue3.toValue(transformX) || 0),
				y: rawPoint.y + (ui_vue3.toValue(transformY) || 0)
			};
		}

		/**
		 * Decides who the press belongs to. The browser action is not suppressed up front: text
		 * selected outside the canvas is the browser's to copy, and a press that copied no node has
		 * nothing to suppress it for. Only a copy that actually happened takes the key away.
		 */
		function onCopyShortcut(event) {
			if (hasTextSelectionOutside(ui_vue3.toValue(blockDiagramRef))) {
				return;
			}
			if (!copy()) {
				return;
			}
			event.preventDefault();
		}
		if (shortcuts) {
			useKeyboardShortcuts([{
				actionId: CANVAS_ACTION_ID.COPY,
				preventDefault: false,
				handler: onCopyShortcut
			}, {
				actionId: CANVAS_ACTION_ID.PASTE,
				// The shortcut never checks the buffer: the only guard on this path is canPaste.
				handler: (event, pointer) => {
					paste(getShortcutPastePoint(pointer));
				}
			}]);
		}

		// Descriptions, not markup: the consumer puts them into its own menu and overrides any field.
		// The canvas component does not mix them in on its own, so a consumer passing no items keeps
		// the canvas menu closed the way it is today.
		//
		// The combo is read through the version of the registry: the maps behind it are plain - a store
		// keeps the registry markRaw - and without that dependency the item would go on offering the
		// caption of its first build after a reassignment.
		const announcedCombo = actionId => {
			actionRegistry.getVersion();
			return formatComboCaption(actionRegistry.getCombo(actionId));
		};
		const copyMenuItem = ui_vue3.computed(() => ({
			id: COPY_MENU_ITEM_ID,
			text: loc.getMessage('UI_BLOCK_DIAGRAM_CONTEXT_MENU_ITEM_COPY'),
			hotkey: announcedCombo(CANVAS_ACTION_ID.COPY),
			// Copying is never restricted, the paste predicate does not reach it.
			disabled: false,
			onclick: () => {
				copy();
			}
		}));
		const pasteMenuItem = ui_vue3.computed(() => ({
			id: PASTE_MENU_ITEM_ID,
			text: loc.getMessage('UI_BLOCK_DIAGRAM_CONTEXT_MENU_ITEM_PASTE'),
			hotkey: announcedCombo(CANVAS_ACTION_ID.PASTE),
			// The same guards paste() checks, in the same order: an item announced as available has to
			// do something when clicked. A consumer passing a non-reactive canPaste keeps the value it
			// had at the last recomputation.
			disabled: ui_vue3.toValue(isDisabledBlockDiagram) || !canPaste() || ui_vue3.toValue(buffer.isEmpty),
			onclick: point => {
				paste(point);
			}
		}));
		return {
			copy,
			paste,
			isBufferEmpty: buffer.isEmpty,
			copyMenuItem,
			pasteMenuItem
		};
	}

	/**
	 * The caption of the combo an action runs, spelled for the current platform. The single place where
	 * "read the combo of an action, format it" lives: a place of display asks by action id and gets a
	 * string ready for the screen.
	 *
	 * The caption follows a replacement of the set of bindings - reading the combo makes the computed a
	 * follower of it - and an action holding no combo reads as an empty string. That is a regular path,
	 * not a failure: the map of the canvas ships without a combo on macOS, where the system takes the
	 * one it would use.
	 *
	 * Call it from `setup()`: it stands on the context of `useBlockDiagram()`, which is looked up
	 * through the instance of the Vue application.
	 *
	 * @param {string} actionId id of the action, an unknown one included: it reads as no combo
	 * @returns {ComputedRef<string>}
	 */
	function useActionShortcut(actionId)
	{
		const { actionRegistry } = useBlockDiagram();

		return ui_vue3.computed(() => formatComboCaption(actionRegistry.getCombo(actionId)));
	}

	/**
	 * The combo an action runs, spelled the way `aria-keyshortcuts` declares it. The counterpart of
	 * `useActionShortcut()`: the same combo, addressed to a screen reader instead of to the eye.
	 *
	 * The announcement follows a replacement of the set of bindings, and an action holding no combo reads
	 * as null - that is what leaves the attribute off the element.
	 *
	 * Call it from `setup()`: it stands on the context of `useBlockDiagram()`, which is looked up
	 * through the instance of the Vue application.
	 *
	 * @param {string} actionId id of the action, an unknown one included: it reads as no combo
	 * @returns {ComputedRef<string | null>}
	 */
	function useActionKeyshortcuts(actionId)
	{
		const { actionRegistry } = useBlockDiagram();

		return ui_vue3.computed(() => formatComboKeyshortcuts(actionRegistry.getCombo(actionId)));
	}

	const CAPTURE_LISTENER_OPTIONS = Object.freeze({
		capture: true
	});
	const CANVAS_TRANSFORM_CLASS_NAMES = {
		base: 'ui-block-diagram-canvas-transform',
		dragging: '--dragging',
		grabbing: '--grabbing',
		grab: '--grab'
	};

	/**
	 * Drops the text selection the way the browser would on a press. The canvas suppresses the browser
	 * action on mousedown - panning and the selection box both need it - and takes this with it, so
	 * the component gives it back. Bound on the capture phase: a node starting its gesture stops the
	 * press from propagating, so a bubbling handler on the root would never see such a press. A field
	 * on the canvas owns its own selection and is left alone.
	 */
	function clearTextSelectionOnCanvasPress(event) {
		if (isInputEventTarget(event)) {
			return;
		}
		clearTextSelection();
	}

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
				inputState,
				highlitedBlockIds,
				isOpenContextMenu
			} = useBlockDiagram();
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
			let unsubscribeSpaceHold = () => {};
			let unsubscribeEscape = () => {};
			let pressListenerTarget = null;
			ui_vue3.onMounted(() => {
				onMountedCanvasTransform();
				pressListenerTarget = ui_vue3.toValue(rootRef);
				main_core.Event.bind(pressListenerTarget, 'mousedown', clearTextSelectionOnCanvasPress, CAPTURE_LISTENER_OPTIONS);

				// A forced release - the window losing focus, the tab going away - arrives here as well,
				// so the panning cursor never outlives the hold that turned it on. Only the press is
				// ignored for a field: a release always applies, or the hold would stick.
				unsubscribeSpaceHold = inputState.onChange(KEY_TOKEN.SPACE, (isPressed, event) => {
					if (isPressed && isInputEventTarget(event)) {
						return;
					}
					isSpacePressed.value = isPressed;
				});

				// Plain, not exclusive: the component lives as long as the canvas is shown, so an exclusive
				// claim would hold Escape away from the layers above it even with nothing selected. On the
				// bubbling phase the key still reaches them, and an operation that claims Escape for itself
				// - a gesture, the search - runs before this handler is ever asked. The browser action is
				// left alone for the same reason: dropping a selection is not a claim on the key.
				unsubscribeEscape = inputState.on(KEY_TOKEN.ESCAPE, event => {
					// A held key repeats, and a repeat is the same press: the selection drops once.
					if (event.repeat === true) {
						return;
					}

					// The canvas menu listens for Escape on its own, outside the input state, so one press
					// closes it - and the selection it was opened on has to survive that press.
					if (ui_vue3.toValue(isOpenContextMenu)) {
						return;
					}
					if (ui_vue3.toValue(highlitedBlockIds).length === 0) {
						return;
					}
					clearSelection(highlitedBlockIds);
				}, {
					preventDefault: false
				});
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedCanvasTransform();
				main_core.Event.unbind(pressListenerTarget, 'mousedown', clearTextSelectionOnCanvasPress, CAPTURE_LISTENER_OPTIONS);
				pressListenerTarget = null;
				unsubscribeSpaceHold();
				unsubscribeEscape();
			});
			function onMouseDown(event) {
				if (event.button === MOUSE_BUTTON.RIGHT) {
					return;
				}
				const isMiddleClick = event.button === MOUSE_BUTTON.MIDDLE;
				const isLeftClick = event.button === MOUSE_BUTTON.LEFT;
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
		active: '--active',
		elevated: '--elevated'
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
				isDisabled,
				isElevatedConnection
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
					[CONNECTION_CLASS_NAME.active]: ui_vue3.toValue(isOpen),
					[CONNECTION_CLASS_NAME.elevated]: ui_vue3.toValue(isElevatedConnection)
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
		<svg
			:class="connectionClassNames"
			:data-id="connection.id"
			:data-test-id="$blockDiagramTestId('connection', connection.id)"
		>
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

	const MOVEABLE_BLOCK_CLASS_NAMES = {
		base: 'ui-block-diagram-moveable-block',
		placementFeedback: 'ui-block-diagram-placement-feedback',
		displaced: '--displaced',
		placementRefused: '--placement-refused'
	};

	// @vue/component
	const MoveableBlock = {
		name: 'moveable-block',
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const {
				block
			} = ui_vue3.toRefs(props);
			const blockRef = ui_vue3.useTemplateRef('blockEl');
			const {
				isMakeNewConnection,
				hoveredBlockId,
				setHoveredBlock,
				resetHoveredBlock
			} = useBlockDiagram();
			const {
				blockZindex,
				isHiglitedBlock,
				isDisplacedBlock,
				isPlacementRefusedBlock,
				isDisabled,
				onMountedBlock,
				onUnmountedBlock
			} = useBlockState({
				block,
				blockRef
			});
			const {
				isDragged,
				blockPositionStyle
			} = useMoveableBlock(blockRef, block);
			const blockStyle = ui_vue3.computed(() => ({
				...ui_vue3.toValue(blockPositionStyle),
				zIndex: ui_vue3.toValue(blockZindex)
			}));

			// The placement feedback lives on the wrapper the canvas owns, so it shows without a single
			// change in the consumer's block content.
			const blockClassNames = ui_vue3.computed(() => ({
				[MOVEABLE_BLOCK_CLASS_NAMES.base]: true,
				[MOVEABLE_BLOCK_CLASS_NAMES.placementFeedback]: true,
				[MOVEABLE_BLOCK_CLASS_NAMES.displaced]: ui_vue3.toValue(isDisplacedBlock),
				[MOVEABLE_BLOCK_CLASS_NAMES.placementRefused]: ui_vue3.toValue(isPlacementRefusedBlock)
			}));
			ui_vue3.onMounted(() => {
				onMountedBlock();
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedBlock();
			});
			function onMouseEnterHoverBlock() {
				setHoveredBlock(props.block.id);
			}

			// A quick move between neighbours brings the enter of the new node before the leave of the
			// old one, so the leave only clears the state while this node is still the raised one.
			function onMouseLeaveHoverBlock() {
				if (ui_vue3.toValue(hoveredBlockId) === props.block.id) {
					resetHoveredBlock();
				}
			}
			return {
				isHiglitedBlock,
				isDisplacedBlock,
				isPlacementRefusedBlock,
				isDisabled,
				isDragged,
				isMakeNewConnection,
				blockClassNames,
				blockStyle,
				onMouseEnterHoverBlock,
				onMouseLeaveHoverBlock
			};
		},
		template: `
		<div
			:class="blockClassNames"
			:style="blockStyle"
			ref="blockEl"
			:data-test-id="$blockDiagramTestId('block', block.id)"
			:data-id="block.id"
			@mouseenter="onMouseEnterHoverBlock"
			@mouseleave="onMouseLeaveHoverBlock"
		>
			<slot
				:block="block"
				:isHighlighted="isHiglitedBlock"
				:isDragged="isDragged"
				:isDisabled="isDisabled"
				:isMakeNewConnection="isMakeNewConnection"
				:isDisplaced="isDisplacedBlock"
				:isPlacementRefused="isPlacementRefusedBlock"
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

	// Everything that can hold the focus of its own inside the canvas. A disabled control is left out:
	// the browser gives it no focus either, so a press on one belongs to the canvas.
	const FOCUSABLE_SELECTOR = ['a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[contenteditable]:not([contenteditable="false"])', '[tabindex]'].join(',');
	const UI_CANVAS_GRID_COLOR = '#A1B8D9';
	const UI_CANVAS_BACKGROUND_COLOR = '#ECF0F2';

	// Built once: the canvas root carries it through every render of the diagram, and it says the same
	// thing on each of them.
	const CANVAS_ROOT_STYLE = Object.freeze({
		[ELEVATION_OFFSET_CSS_VARIABLE]: `${BLOCK_INDEXES.ELEVATION_OFFSET}`,
		[DISPLACED_DURATION_CSS_VARIABLE]: `${DISPLACED_STATE_DURATION_MS}ms`
	});
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
				default: 0.2,
				validator(value) {
					return isValidMinZoom(value);
				}
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
				default: () => [HOOK_NAMES.END_DRAG_BLOCK, HOOK_NAMES.END_GESTURE, HOOK_NAMES.ADD_BLOCK, HOOK_NAMES.DELETE_BLOCK, HOOK_NAMES.CREATE_CONNECTION, HOOK_NAMES.DELETE_CONNECTION]
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
		emits: ['update:blocks', 'update:connections', HOOK_NAMES.CHANGED_BLOCKS, HOOK_NAMES.CHANGED_CONNECTIONS, HOOK_NAMES.START_DRAG_BLOCK, HOOK_NAMES.MOVE_DRAG_BLOCK, HOOK_NAMES.END_DRAG_BLOCK, HOOK_NAMES.END_GESTURE, HOOK_NAMES.ADD_BLOCK, HOOK_NAMES.ADD_BLOCKS, HOOK_NAMES.UPDATE_BLOCK, HOOK_NAMES.DELETE_BLOCK, HOOK_NAMES.CREATE_CONNECTION, HOOK_NAMES.ADD_CONNECTIONS, HOOK_NAMES.DELETE_CONNECTION, HOOK_NAMES.BLOCK_TRANSITION_START, HOOK_NAMES.BLOCK_TRANSITION_END, HOOK_NAMES.CONNECTION_TRANSITION_START, HOOK_NAMES.CONNECTION_TRANSITION_END, HOOK_NAMES.DROP_NEW_BLOCK],
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
				clearConnectionPreview,
				inputState
			} = useBlockDiagram(props);
			const fitToViewKeyshortcuts = useActionKeyshortcuts(CANVAS_ACTION_ID.FIT_TO_VIEW);
			const keyShortcuts = ui_vue3.computed(() => {
				return buildCanvasKeyShortcuts(ui_vue3.toValue(fitToViewKeyshortcuts));
			});
			const blockDiagramRef = ui_vue3.useTemplateRef('blockDiagram');
			const initAppElements = useInitAppElements({
				blockDiagramRef
			});
			const {
				focusCanvas
			} = useCanvasFocus();
			const loc = useLoc();
			const canvasLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_LABEL');
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
			const {
				clear: clearDisplacedBlocks
			} = useDisplacedBlocks();
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
			useKeyboardPan();
			useCanvasEscapeFallback();
			ui_vue3.onMounted(() => {
				initAppElements.onMountedAppElements();
				inputState.attach();
			});
			ui_vue3.onUnmounted(() => {
				clearConnectionPreview(ui_vue3.toValue(connectionPreview)?.activationKey);
				disposeModelValue();
				disposeWatchProps();
				disposeRegisterHooks();
				blockIntersections.clear();
				// The flash of a corrected position expires on a timer of its own, and a canvas taken off
				// the page leaves it running: it would fire into a state nothing reads any more.
				clearDisplacedBlocks();
				initAppElements.onUnmountedAppElements();
				inputState.detach();
			});

			// The canvas takes native drag-and-drop from the outside - a catalog item is dropped onto
			// it - but never starts one of its own. A press on a port or a node opens a canvas gesture
			// and keeps the event to itself, so nothing is left to cancel the browser's own drag: it
			// starts alongside the gesture and drags a ghost that lands nowhere. An editable region
			// inside a node is not canvas - text there stays draggable.
			function onDragStart(event) {
				if (isInputEventTarget(event)) {
					return;
				}
				event.preventDefault();
			}
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

			// Arrows belong to the canvas only while the focus stands inside it, so a click has to hand the
			// focus over - otherwise panning would be reachable by Tab alone. A press that lands on
			// something able to take the focus itself - a field, or a link or a button a consumer put
			// inside a node - is left to that element: taking the focus here would blink through the
			// canvas, and in WebKit, which focuses no button on click, the canvas would simply keep it.
			function onCanvasMouseDown(event) {
				// The root itself matches the selector by its own tabindex, and it is the element the focus
				// is being handed to.
				const focusable = event.target?.closest?.(FOCUSABLE_SELECTOR) ?? null;
				if (focusable !== null && focusable !== ui_vue3.toValue(blockDiagramRef)) {
					return;
				}
				focusCanvas();
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
				canvasRootStyle: CANVAS_ROOT_STYLE,
				visibleBlockGroupNames: blockIntersections.visibleBlockGroupNames,
				groupedConnections,
				connectionGroupNames,
				getGroupBlockSlotName,
				getGroupConnectionSlotName,
				onDragDrop,
				onDragEnter,
				onDragLeave,
				onDragStart,
				openContextMenu,
				canvasLabel,
				onCanvasMouseDown,
				keyShortcuts
			};
		},
		template: `
		<div
			:class="blockDiagramClassNames"
			:style="canvasRootStyle"
			:data-test-id="$blockDiagramTestId('blockDiagram')"
			ref="blockDiagram"
			role="region"
			:tabindex="disabled ? -1 : 0"
			:aria-label="canvasLabel"
			:aria-keyshortcuts="keyShortcuts"
			@mousedown="onCanvasMouseDown"
			@dragstart="onDragStart"
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
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
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
			const loc = useLoc();
			const prevLabel = loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_PREV');
			const nextLabel = loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_NEXT');
			// The platform difference of the step forward lives in the defaults of the registry, so both
			// buttons read their combo the same way here.
			const prevShortcut = useActionShortcut(CANVAS_ACTION_ID.UNDO);
			const nextShortcut = useActionShortcut(CANVAS_ACTION_ID.REDO);
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

			// The shortcuts go through the handlers of the buttons: a disabled diagram is not undone
			// from the keyboard either.
			useKeyboardShortcuts([{
				actionId: CANVAS_ACTION_ID.UNDO,
				handler: onPrev
			}, {
				actionId: CANVAS_ACTION_ID.REDO,
				handler: onNext
			}]);
			return {
				hasNext,
				hasPrev,
				onNext,
				onPrev,
				prevLabel,
				nextLabel,
				// The bar hangs at the canvas top edge, so both bubbles open downwards: there is no room above.
				prevTooltip: ui_vue3.computed(() => ({
					content: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_PREV'), ui_vue3.toValue(prevShortcut)),
					position: ui_system_tooltip.TooltipPosition.Bottom,
					showDelay: TOOLTIP_SHOW_DELAY
				})),
				nextTooltip: ui_vue3.computed(() => ({
					content: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_HISTORY_NEXT'), ui_vue3.toValue(nextShortcut)),
					position: ui_system_tooltip.TooltipPosition.Bottom,
					showDelay: TOOLTIP_SHOW_DELAY
				})),
				prevKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.UNDO),
				nextKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.REDO),
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
					:aria-label="prevLabel"
					:aria-keyshortcuts="prevKeyshortcuts"
					v-b-tooltip="prevTooltip"
					@click="onPrev"
				/>
				<IconButton
					:icon-name="Outline.FORWARD"
					:size="22"
					:disabled="!hasNext"
					:data-test-id="$blockDiagramTestId('historyNextBtn')"
					:aria-label="nextLabel"
					:aria-keyshortcuts="nextKeyshortcuts"
					v-b-tooltip="nextTooltip"
					@click="onNext"
				/>
			</slot>
		</div>
	`
	};

	const DEFAULT_ICON_COLOR = 'var(--ui-color-base-4)';
	const DEFAULT_CLICKED_ICON_COLOR = 'var(--ui-color-accent-main-primary)';

	// @vue/component
	const CanvasMapBtn = {
		name: 'canvas-map-btn',
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
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
			const mapShortcut = useActionShortcut(CANVAS_ACTION_ID.TOGGLE_MAP);
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

			// The tooltip names the tool, so unlike the accessible name it does not follow the open state.
			// It does follow the combo: a reassignment reaches a button that stays mounted.
			const tooltip = ui_vue3.computed(() => ({
				content: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_TITLE'), ui_vue3.toValue(mapShortcut)),
				showDelay: TOOLTIP_SHOW_DELAY
			}));
			return {
				btnStyle,
				ariaLabel,
				tooltip,
				currentIconColor
			};
		},
		template: `
		<button
			type="button"
			:style="btnStyle"
			v-b-tooltip="tooltip"
			:aria-label="ariaLabel"
			class="ui-block-diagram-canvas-map-btn"
			:class="{ '--active': isActive }"
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

	const DEFAULT_BLOCK_COLOR = 'var(--ui-color-palette-gray-15)';
	const DEFAULT_FRAME_BLOCK_COLOR = 'rgba(0,0,0,0.05)';
	// The frame of the current view is drawn with a graphics context, so a CSS rule of a consumer
	// never reaches it - the token is the extension point instead, and it is deliberately left
	// undeclared: a value declared on the container would beat the same token declared by a consumer
	// on any ancestor. Behind it stands the default of the extension, a token of the design system.
	const VIEWPORT_COLOR = 'var(--ui-block-diagram-map-viewport-color, var(--ui-color-blue-57))';
	const INTERACTION_STATE_MODES = {
		CURSOR: 'cursor',
		MAP: 'map'
	};

	// Redraw levels. Geometry is the expensive one - it rebuilds the rectangles of every block;
	// viewport only moves the frame of the current view, which is what a gesture on the map does.
	const INVALIDATION_LEVELS = {
		NONE: 0,
		VIEWPORT: 1,
		GEOMETRY: 2
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
				default: () => ({}),
				validator(value) {
					return isValidColorPalette(value);
				}
			},
			frameColors: {
				type: Object,
				default: () => ({}),
				validator(value) {
					return isValidColorPalette(value);
				}
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
				zoom,
				mapRenderer,
				canvasMapRef
			} = useBlockDiagram();
			const {
				setCamera
			} = useCanvas();
			const loc = useLoc();
			const fitToViewKeyshortcuts = useActionKeyshortcuts(CANVAS_ACTION_ID.FIT_TO_VIEW);
			const keyShortcuts = ui_vue3.computed(() => {
				return buildCanvasKeyShortcuts(ui_vue3.toValue(fitToViewKeyshortcuts));
			});
			const {
				mapWidth,
				mapHeight,
				blockColors,
				frameColors
			} = ui_vue3.toRefs(props);
			const mapEl = ui_vue3.useTemplateRef('map');
			const mapRootEl = ui_vue3.useTemplateRef('mapRoot');
			const mapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_LABEL');
			const interactionState = ui_vue3.reactive({
				isDragging: false,
				mode: null,
				dragOffsetX: 0,
				dragOffsetY: 0
			});

			// Re-measured every frame of the gesture: layout may shift or the page may scroll while it runs.
			const getMapRect = () => {
				return ui_vue3.toValue(mapEl)?.getBoundingClientRect() ?? null;
			};

			// Rectangles of the last drawn frame. The array is handed to the renderer as is, and a
			// viewport-only redraw reuses the very same array - that is what keeps a drag on the
			// map from rebuilding the geometry of the blocks.
			let blockRects = [];
			let pendingLevel = INVALIDATION_LEVELS.NONE;
			let frameId = null;
			// The template ref is already cleared by the time the unmount hook runs, so the element the
			// map was attached to is kept here: the detach has to name it to leave a binding made by a
			// component that mounted earlier alone.
			let attachedElement = null;
			// The element registered as the focus surface. The unregistration names it so that a panel
			// unmounted after a later one mounted does not drop the registration that later one made.
			let registeredMapRoot = null;
			const canvasMapStyle = ui_vue3.computed(() => ({
				width: `${ui_vue3.toValue(mapWidth)}px`,
				height: `${ui_vue3.toValue(mapHeight)}px`
			}));
			const layout = ui_vue3.computed(() => getMapLayout(ui_vue3.toValue(blocks), {
				canvasWidth: ui_vue3.toValue(canvasWidth),
				canvasHeight: ui_vue3.toValue(canvasHeight),
				blocksRectMap: ui_vue3.toValue(blocksRectMap)
			}));
			const renderScale = ui_vue3.computed(() => getMapScale(ui_vue3.toValue(layout), {
				width: ui_vue3.toValue(mapWidth),
				height: ui_vue3.toValue(mapHeight)
			}));
			const viewportRect = ui_vue3.computed(() => getMapViewportRect(ui_vue3.toValue(layout), ui_vue3.toValue(renderScale), {
				x: ui_vue3.toValue(transformX),
				y: ui_vue3.toValue(transformY),
				zoom: ui_vue3.toValue(zoom),
				canvasWidth: ui_vue3.toValue(canvasWidth),
				canvasHeight: ui_vue3.toValue(canvasHeight)
			}));
			function flush() {
				frameId = null;
				if (!mapRenderer.isAttached) {
					pendingLevel = INVALIDATION_LEVELS.NONE;
					return;
				}
				if (pendingLevel === INVALIDATION_LEVELS.GEOMETRY) {
					blockRects = getMapBlockRects(ui_vue3.toValue(layout), ui_vue3.toValue(renderScale), mapRenderer.colors);
				}
				mapRenderer.render({
					blocks: blockRects,
					viewport: ui_vue3.toValue(viewportRect),
					viewportColor: mapRenderer.colors.viewport
				});
				pendingLevel = INVALIDATION_LEVELS.NONE;
			}
			function invalidate(level) {
				pendingLevel = Math.max(pendingLevel, level);
				if (frameId !== null) {
					return;
				}
				frameId = requestAnimationFrame(flush);
			}
			function getPalette() {
				return {
					palette: ui_vue3.toValue(blockColors) ?? {},
					framePalette: ui_vue3.toValue(frameColors) ?? {},
					block: DEFAULT_BLOCK_COLOR,
					frame: DEFAULT_FRAME_BLOCK_COLOR,
					viewport: VIEWPORT_COLOR
				};
			}
			ui_vue3.watch([layout, renderScale], () => invalidate(INVALIDATION_LEVELS.GEOMETRY));
			ui_vue3.watch(viewportRect, () => invalidate(INVALIDATION_LEVELS.VIEWPORT));

			// The colors of the blocks and of the frames are resolved into numbers once and live in the
			// renderer, so a consumer who changes either palette has to reach them. Repainting a single
			// entry in place is as much a palette change as handing over another object, and the map has
			// no other way to learn about it - hence the deep watch over a handful of colors. One watch
			// for both: they have the same effect, and two of them would call setPalette twice per frame.
			// It follows the palettes alone: the level it raises is the expensive one, and a gesture on
			// the map must not raise it.
			ui_vue3.watch([blockColors, frameColors], () => {
				if (!mapRenderer.isAttached) {
					return;
				}
				mapRenderer.setPalette(getPalette());
				invalidate(INVALIDATION_LEVELS.GEOMETRY);
			}, {
				deep: true
			});
			ui_vue3.onMounted(() => {
				// Registers the panel as a focus surface of the diagram; why - see `isFocusOnAnyOf` in
				// composables/keyboard-pan.js.
				registeredMapRoot = ui_vue3.toValue(mapRootEl);
				canvasMapRef.value = registeredMapRoot;
				const element = ui_vue3.toValue(mapEl);
				if (!element) {
					return;
				}
				mapRenderer.attach(element, getPalette());
				attachedElement = element;

				// An attach that did not happen leaves nothing to draw on - without a drawing context
				// the map stays empty, and asking for a frame would only hide that.
				if (!mapRenderer.isAttached) {
					return;
				}
				invalidate(INVALIDATION_LEVELS.GEOMETRY);
			});
			ui_vue3.onUnmounted(() => {
				if (frameId !== null) {
					cancelAnimationFrame(frameId);
					frameId = null;
				}
				pendingLevel = INVALIDATION_LEVELS.NONE;
				mapRenderer.detach(attachedElement);
				attachedElement = null;
				if (ui_vue3.toValue(canvasMapRef) === registeredMapRoot) {
					canvasMapRef.value = null;
				}
				registeredMapRoot = null;
			});
			function updateCamera(clientX, clientY) {
				const mapRect = getMapRect();
				if (!mapRect) {
					return;
				}
				const mouseRelX = clientX - mapRect.left;
				const mouseRelY = clientY - mapRect.top;
				const indicator = ui_vue3.toValue(viewportRect);
				const scale = ui_vue3.toValue(renderScale);
				const currentZoom = ui_vue3.toValue(zoom);
				let targetMapX = mouseRelX - indicator.width;
				let targetMapY = mouseRelY - indicator.height;
				if (interactionState.mode === INTERACTION_STATE_MODES.CURSOR) {
					targetMapX = mouseRelX - interactionState.dragOffsetX - indicator.width / 2;
					targetMapY = mouseRelY - interactionState.dragOffsetY - indicator.height / 2;
				}
				const canvasX = targetMapX / scale + ui_vue3.toValue(layout).minX;
				const canvasY = targetMapY / scale + ui_vue3.toValue(layout).minY;

				// No anchor point here on purpose: the gesture moves the camera to a place, and an
				// anchored landmark would compensate the move away entirely.
				setCamera({
					x: canvasX + ui_vue3.toValue(canvasWidth) / currentZoom / 2,
					y: canvasY + ui_vue3.toValue(canvasHeight) / currentZoom / 2,
					zoom: currentZoom
				});
			}
			function onMapMouseDown(event) {
				event.preventDefault();
				const rect = getMapRect();
				if (!rect) {
					return;
				}
				interactionState.isDragging = true;
				const mouseRelX = event.clientX - rect.left;
				const mouseRelY = event.clientY - rect.top;
				if (isPointInMapRect({
					x: mouseRelX,
					y: mouseRelY
				}, ui_vue3.toValue(viewportRect))) {
					const indicator = ui_vue3.toValue(viewportRect);
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
			function onMapMouseUp() {
				interactionState.isDragging = false;
				interactionState.mode = null;
			}
			function focus() {
				ui_vue3.toValue(mapRootEl)?.focus({
					preventScroll: true
				});
			}
			expose({
				focus
			});
			return {
				canvasMapStyle,
				mapLabel,
				keyShortcuts,
				onMapMouseDown,
				onMapMouseMove,
				onMapMouseUp
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
			:aria-keyshortcuts="keyShortcuts"
		>
			<canvas
				ref="map"
				class="ui-block-diagram-canvas-map"
				aria-hidden="true"
				@mousedown="onMapMouseDown"
				@mousemove="onMapMouseMove"
				@mouseup="onMapMouseUp"
				@mouseleave="onMapMouseUp"
			></canvas>
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
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
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
			// Which of the two zooms the button is comes from a property, and a property may change under
			// a mounted button, so both captions are asked for.
			const zoomInShortcut = useActionShortcut(CANVAS_ACTION_ID.ZOOM_IN);
			const zoomOutShortcut = useActionShortcut(CANVAS_ACTION_ID.ZOOM_OUT);
			const {
				stepZoom,
				typeZoom
			} = ui_vue3.toRefs(props);
			const isDisabled = ui_vue3.computed(() => props.disabled || ui_vue3.toValue(isDisabledBlockDiagram));
			const ariaLabel = ui_vue3.computed(() => {
				const messageId = ui_vue3.toValue(typeZoom) === ZOOM_TYPES.in ? 'UI_BLOCK_DIAGRAM_ZOOM_IN' : 'UI_BLOCK_DIAGRAM_ZOOM_OUT';
				return loc.getMessage(messageId);
			});
			const tooltip = ui_vue3.computed(() => {
				const shortcut = ui_vue3.toValue(typeZoom) === ZOOM_TYPES.in ? zoomInShortcut : zoomOutShortcut;
				return {
					content: withShortcut(ui_vue3.toValue(ariaLabel), ui_vue3.toValue(shortcut)),
					showDelay: TOOLTIP_SHOW_DELAY
				};
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
				tooltip,
				isDisabled,
				onZoom
			};
		},
		template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId(typeZoom === zoomTypes.in ? 'zoomInBtn' : 'zoomOutBtn')"
			class="ui-block-diagram-control-btn__btn"
			v-b-tooltip="tooltip"
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

	// Passed on purpose: without it `Menu` applies an `offsetTop` default of its own. Zero adds nothing
	// to the lift a popup opened above its bind element already gets from `positionTopXOffset`.
	const ZOOM_PRESET_MENU_OFFSET_TOP = 0;
	const ZOOM_PRESET_MENU_OFFSET_LEFT = 15;
	const FIT_TO_VIEW_MENU_ITEM_TEST_ID = 'zoomFitToViewMenuItem';
	const ZOOM_PRESET_MENU_ITEM_TEST_ID = 'zoomPresetMenuItem';

	// @vue/component
	const ZoomPercent = {
		name: 'zoom-percent',
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
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
				setZoom,
				fitToView
			} = useCanvas();
			const loc = useLoc();
			// The fit is an action of the canvas, so the keys named in its item are the ones the registry
			// holds for it - a personal binding included. The menu is built anew on every opening, so the
			// caption is read at that moment and needs no watcher of its own.
			const fitToViewShortcut = useActionShortcut(CANVAS_ACTION_ID.FIT_TO_VIEW);
			// The items of the menu are built in code rather than in the template, so the label of the
			// extension is taken straight from the global the templates spell it with.
			const testId = ui_vue3.getCurrentInstance().appContext.app.config.globalProperties.$blockDiagramTestId;
			const percent = ui_vue3.computed(() => {
				return ((ui_vue3.toValue(zoom) ?? 0) * 100).toFixed(0);
			});
			const {
				showMenu,
				isOpen,
				closeContextMenu
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
					// The zoom panel stands in a corner of the canvas, and a popup fits itself into
					// its target container: anything but the document leaves the menu cut off.
					targetContainer: document.body,
					bindOptions: {
						position: 'top'
					},
					offsetTop: ZOOM_PRESET_MENU_OFFSET_TOP,
					offsetLeft: ZOOM_PRESET_MENU_OFFSET_LEFT,
					items: [
					// The fit names no scale of its own: it is a command over all the fixed values
					// rather than one of them, so it opens the list apart from them. The click carries
					// the point of the menu, and the command takes settings - it is called without
					// arguments on purpose.
					{
						text: withShortcut(loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_FIT_TO_VIEW'), ui_vue3.toValue(fitToViewShortcut)),
						dataset: {
							testId: testId(FIT_TO_VIEW_MENU_ITEM_TEST_ID)
						},
						onclick: () => fitToView()
					}, ...ZOOM_PRESET.map(value => {
						const percentValue = `${value * 100}`;
						return {
							text: `${percentValue}%`,
							dataset: {
								testId: testId(ZOOM_PRESET_MENU_ITEM_TEST_ID, percentValue)
							},
							onclick: () => setZoom(value)
						};
					})]
				};
				showMenu({
					clientX: 0,
					clientY: 0
				}, options);
			}

			// The popup lives in `document.body` now and no longer goes away with the component. The
			// menu instance is shared across the diagram, so close it only while this button owns it.
			ui_vue3.onUnmounted(() => {
				if (ui_vue3.toValue(isOpen)) {
					closeContextMenu();
				}
			});
			return {
				percent,
				root,
				isOpen,
				isDisabled,
				buttonLabel,
				// The tooltip names the tool, so it stays the bare phrase while the accessible name carries
				// the current percent on top of it.
				tooltip: {
					content: loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_PRESET_BUTTON'),
					showDelay: TOOLTIP_SHOW_DELAY
				},
				onOpenZoomPresetMenu
			};
		},
		template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId('zoomPercentBtn')"
			class="ui-block-diagram-percent"
			:class="{ '--selected': isOpen }"
			v-b-tooltip="tooltip"
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

	const MAP_FOCUS_TARGET = {
		mapButton: 'mapButton',
		canvas: 'canvas'
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
	const VIEWPORT_INSET_EDGES = new Set(['top', 'right', 'bottom', 'left']);

	// The bare viewport: nothing of the consumer covers it once the panel that published the insets is
	// gone, and the state of the diagram says so again.
	const NO_VIEWPORT_INSETS = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};

	// An edge a consumer names has to be a number the free area can be measured with; an edge it says
	// nothing about stays zero, so a partial set is a valid one.
	function isValidViewportInsets(value) {
		return Object.entries(value).every(([edge, inset]) => {
			return VIEWPORT_INSET_EDGES.has(edge) && Number.isFinite(inset);
		});
	}

	/**
	 * The combo of the fit types a character by default, so the command belongs to the diagram only
	 * while the focus stands on one of its surfaces - the canvas, the panel itself, or the minimap the
	 * consumer places on its own. Everywhere else on the page the press is the page's own: the same rule
	 * the arrow keys of the canvas already follow, and the one WCAG 2.1.4 asks for from a shortcut
	 * written with a printable key. The guard stays whatever the combo becomes: a user may reassign it.
	 *
	 * That is what `preventDefault: false` is for: the browser goes on seeing the press as usual, and the
	 * default action is suppressed here and only when the command really runs, so a press left to the
	 * page still types its character there.
	 */
	function registerFitToViewShortcut(canFitToView, fitToView) {
		function onFitToView(event) {
			if (!canFitToView()) {
				return;
			}
			event.preventDefault();
			fitToView();
		}
		useKeyboardShortcuts([{
			actionId: CANVAS_ACTION_ID.FIT_TO_VIEW,
			handler: onFitToView,
			preventDefault: false
		}]);
	}

	// `isInputEventTarget()` of the extension answers about the target of an event, while a focus
	// change names the element itself, so the shared tag list is asked about the element here.
	function isFieldElement(element) {
		return element instanceof HTMLElement && (INPUT_TAGS[element.tagName] === true || element.isContentEditable === true);
	}

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
				default: () => ({}),
				validator(value) {
					return isValidColorPalette(value);
				}
			},
			frameColors: {
				type: Object,
				default: () => ({}),
				validator(value) {
					return isValidColorPalette(value);
				}
			},
			/**
			 * Edges of the viewport the panels of the consumer cover: the canvas is drawn under them and
			 * cannot measure them itself. The fit keeps the scheme out of the covered edges. Reactive: a
			 * panel that opens or closes changes the value without remounting the bar.
			 *
			 * One zoom bar per application. The bar registers the shortcut of the fit, so a second one
			 * mounted next to it would run the command twice on a single press.
			 */
			viewportInsets: {
				type: Object,
				default: () => ({}),
				validator(value) {
					return isValidViewportInsets(value);
				}
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
		// eslint-disable-next-line max-lines-per-function
		setup(props) {
			const loc = useLoc();
			const {
				isDisabledBlockDiagram,
				inputState,
				viewportInsets,
				blockDiagramRef,
				canvasMapRef,
				isOpenContextMenu
			} = useBlockDiagram();
			const {
				fitToView,
				zoomIn,
				zoomOut
			} = useCanvas();
			const {
				returnFocusToCanvas
			} = useCanvasFocus();
			const isShowMap = ui_vue3.ref(false);
			const root = ui_vue3.ref(null);
			const mapButton = ui_vue3.ref(null);
			const canvasMap = ui_vue3.ref(null);
			const canvasMapPanelId = `ui-block-diagram-canvas-map-${main_core.Text.getRandom()}`;
			const closeMapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_CLOSE');
			const isDisabled = ui_vue3.computed(() => props.disabled || ui_vue3.toValue(isDisabledBlockDiagram));
			let unsubscribeEscape = null;
			let isFieldFocused = isFieldElement(document.activeElement);
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

			// The claim of the panel goes away with the state it watches, so the canvas is asked for the
			// focus a tick later: by then the stack answers about the layers that are still open, not
			// about the map that is closing. A layer still holding Escape refuses the canvas, and the
			// panel the focus stood on is already gone, so the button it opens from takes it instead.
			function closeMap(focusTarget) {
				isShowMap.value = false;
				if (focusTarget === null) {
					return;
				}
				ui_vue3.nextTick(() => {
					if (focusTarget === MAP_FOCUS_TARGET.canvas && returnFocusToCanvas()) {
						return;
					}
					focusMapButton();
				});
			}
			function onCloseMap() {
				closeMap(MAP_FOCUS_TARGET.mapButton);
			}
			function isFocusInsideMapPanel() {
				return document.getElementById(canvasMapPanelId)?.contains(document.activeElement) === true;
			}

			// The panel closed from the keyboard hands the focus to the canvas, where the arrows and the
			// shortcuts of the diagram start from; the pointer paths keep the button they were aimed at.
			// The claim is page-wide, so the shortcut arrives with the focus anywhere: a close asked from
			// outside the panel moves no focus at all, the way Escape of the very same panel does not.
			function keyboardFocusTarget() {
				return isFocusInsideMapPanel() ? MAP_FOCUS_TARGET.canvas : null;
			}

			// The exclusive claim takes Escape on the capture phase, ahead of a popup that answers the
			// very same key on its own: without the guard one press would close both. The cross and the
			// button are aimed by the pointer and need no such check.
			// That claim is page-wide, so the press arrives with the focus anywhere on the page: a press
			// from outside the panel moves no focus at all.
			function onEscapeCloseMap() {
				if (isKeyboardBusyByOverlay()) {
					return;
				}
				closeMap(isFocusInsideMapPanel() ? MAP_FOCUS_TARGET.canvas : null);
			}
			function onToggleMap(focusTarget = MAP_FOCUS_TARGET.mapButton) {
				if (ui_vue3.toValue(isDisabled)) {
					return;
				}
				if (ui_vue3.toValue(isShowMap)) {
					closeMap(focusTarget);
					return;
				}
				isShowMap.value = true;
				ui_vue3.nextTick(() => ui_vue3.toValue(canvasMap)?.focus());
			}

			// The panel joins the same last-in-first-out stack of exclusive Escape claims that the catalog
			// and the settings panels hold: a map opened later answers the key before them, and a bubbling
			// handler on the panel would never see the press their capture-phase claim already took.
			// Both halves are idempotent: the bar asks for a key it may already hold and gives up one it
			// may have given up already.
			function claimEscape() {
				if (unsubscribeEscape === null) {
					unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, onEscapeCloseMap);
				}
			}
			function releaseEscapeClaim() {
				unsubscribeEscape?.();
				unsubscribeEscape = null;
			}

			// The capture-phase claim reaches past the layers above the canvas, so an open map held it
			// would take Escape from a text field being edited elsewhere on the page - the inline rename
			// of a node first of all, which cancels by the very same key.
			function syncEscapeClaim() {
				if (ui_vue3.toValue(isShowMap) && !isFieldFocused) {
					claimEscape();
					return;
				}
				releaseEscapeClaim();
			}

			// `focusout` names where the focus goes next and `focusin` where it landed. Reading
			// `activeElement` instead would miss a focus that fell to the body: no `focusin` follows it.
			function onFocusChanged(event) {
				isFieldFocused = isFieldElement(event.type === 'focusout' ? event.relatedTarget : event.target);
				syncEscapeClaim();
			}

			// The guard is the shortcuts' alone: a click on a button is aimed at it, while a press under a
			// popup belongs to the popup. The browser action goes off only once the press is taken - a
			// press the bar refuses belongs to the browser and to the layers above the canvas.
			function isKeyboardFree() {
				return !isKeyboardBusyByOverlay() && !ui_vue3.toValue(isDisabled);
			}

			// The keyboard goes through the handler of the button, so the map is as blocked as the button
			// and the focus travels the same way.
			function toggleMapFromKeyboard(event) {
				if (!isKeyboardFree()) {
					return;
				}
				event.preventDefault();
				onToggleMap(keyboardFocusTarget());
			}

			// The range is the camera's own business: it clamps on every path, and a second check here
			// would be a second source of truth about the same limits.
			function zoomInFromKeyboard(event) {
				if (!isKeyboardFree()) {
					return;
				}
				event.preventDefault();
				zoomIn(props.stepZoom);
			}
			function zoomOutFromKeyboard(event) {
				if (!isKeyboardFree()) {
					return;
				}
				event.preventDefault();
				zoomOut(props.stepZoom);
			}
			ui_vue3.watch(isDisabled, disabled => {
				if (disabled && ui_vue3.toValue(isShowMap)) {
					closeMap(null);
				}
			});
			ui_vue3.watch(isShowMap, syncEscapeClaim);
			ui_vue3.onMounted(() => {
				main_core.Event.bind(document, 'focusin', onFocusChanged);
				main_core.Event.bind(document, 'focusout', onFocusChanged);
			});
			ui_vue3.onUnmounted(() => {
				main_core.Event.unbind(document, 'focusin', onFocusChanged);
				main_core.Event.unbind(document, 'focusout', onFocusChanged);
				releaseEscapeClaim();
			});
			useKeyboardShortcuts([{
				actionId: CANVAS_ACTION_ID.TOGGLE_MAP,
				handler: toggleMapFromKeyboard,
				preventDefault: false
			}, {
				actionId: CANVAS_ACTION_ID.ZOOM_IN,
				handler: zoomInFromKeyboard,
				preventDefault: false
			}, {
				// On the layouts where plus is typed with Shift the modifier joins the combo - a second
				// spelling of the same gesture, not a second action, so it stays a plain record next to
				// the actionId one instead of living in the registry.
				keys: ['Mod', 'Shift', 'Equal'],
				handler: zoomInFromKeyboard,
				preventDefault: false
			}, {
				actionId: CANVAS_ACTION_ID.ZOOM_OUT,
				handler: zoomOutFromKeyboard,
				preventDefault: false
			}]);

			// The bar owns the property, the command reads it from the state of the diagram at the moment
			// it runs: the panels of the consumer come and go while the diagram stays mounted.
			ui_vue3.watch(() => props.viewportInsets, insets => {
				viewportInsets.value = insets;
			}, {
				immediate: true
			});

			// The panel goes away while the diagram stays: the insets it published leave with it, so the
			// next call of the command measures the free area by what is really on the screen. Only the
			// ones it published itself: the state belongs to the whole application, and a bar that leaves
			// while another one already stands there would otherwise clear edges that are still covered,
			// with no property change left to bring them back.
			ui_vue3.onUnmounted(() => {
				// The state hands its value out through a reactive proxy, the property is the bare object.
				if (ui_vue3.toRaw(viewportInsets.value) === ui_vue3.toRaw(props.viewportInsets)) {
					viewportInsets.value = {
						...NO_VIEWPORT_INSETS
					};
				}
			});

			// The panel is a surface of its own next to the root: a consumer mounts it beside the diagram
			// rather than inside it. An open menu of the panel takes the press as well - it answers the
			// key by its own typeahead, and a scheme moving under a menu that stays where it was is one
			// press answered twice.
			function canFitToView() {
				return !ui_vue3.toValue(isDisabled) && !ui_vue3.toValue(isOpenContextMenu) && isFocusOnAnyOf([ui_vue3.toValue(root), ui_vue3.toValue(blockDiagramRef), ui_vue3.toValue(canvasMapRef)]);
			}
			registerFitToViewShortcut(canFitToView, fitToView);
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				mapPositionClasses,
				isShowMap,
				isDisabled,
				root,
				mapButton,
				canvasMap,
				canvasMapPanelId,
				closeMapLabel,
				fitToViewKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.FIT_TO_VIEW),
				mapKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.TOGGLE_MAP),
				zoomInKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.ZOOM_IN),
				zoomOutKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.ZOOM_OUT),
				onToggleMap,
				onCloseMap
			};
		},
		template: `
		<div
			ref="root"
			class="ui-block-diagram-canvas-zoom-bar"
			:class="{ '--flat': flat }"
			:aria-keyshortcuts="fitToViewKeyshortcuts"
			:data-test-id="$blockDiagramTestId('zoomBar')"
		>
			<div class="ui-block-diagram-canvas-zoom-bar__locate">
				<CanvasMapBtn
					ref="mapButton"
					:isActive="isShowMap"
					:disabled="isDisabled"
					:aria-expanded="isShowMap"
					:aria-controls="canvasMapPanelId"
					:aria-keyshortcuts="mapKeyshortcuts"
					:data-test-id="$blockDiagramTestId('zoomOpenMapBtn')"
					@click="onToggleMap()"
				/>
				<transition name="editor-large-map-fade" mode="in-out">
					<div
						v-if="isShowMap"
						:id="canvasMapPanelId"
						:data-test-id="$blockDiagramTestId('zoomMapPanel')"
						class="ui-block-diagram-canvas-zoom-bar__map"
						:class="mapPositionClasses"
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
							:mapWidth="310"
							:mapHeight="183"
							:blockColors="blockColors"
							:frameColors="frameColors"
						/>
					</div>
				</transition>
			</div>
			<div class="ui-block-diagram-canvas-zoom-bar__separator"/>
			<div class="ui-block-diagram-canvas-zoom-bar__zoom">
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					:aria-keyshortcuts="zoomOutKeyshortcuts"
					typeZoom="out"
				/>
				<ZoomPercent :disabled="disabled"/>
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					:aria-keyshortcuts="zoomInKeyshortcuts"
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
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			const loc = useLoc();
			const button = ui_vue3.useTemplateRef('button');
			const ariaLabel = loc.getMessage('UI_BLOCK_DIAGRAM_SEARCH_BAR_OPEN');
			const searchShortcut = useActionShortcut(CANVAS_ACTION_ID.TOGGLE_SEARCH);
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				ariaLabel,
				shortcut: useActionKeyshortcuts(CANVAS_ACTION_ID.TOGGLE_SEARCH),
				tooltip: ui_vue3.computed(() => ({
					content: withShortcut(ariaLabel, ui_vue3.toValue(searchShortcut)),
					// The button hangs at the canvas top edge, so the bubble opens downwards: there is no room above.
					position: ui_system_tooltip.TooltipPosition.Bottom,
					showDelay: TOOLTIP_SHOW_DELAY
				})),
				// The panel closes back onto this button, so it has to be reachable from the outside.
				focus: () => {
					ui_vue3.toValue(button)?.focus();
				}
			};
		},
		template: `
		<button
			type="button"
			class="ui-block-diagram-open-search-btn"
			v-b-tooltip="tooltip"
			:aria-label="ariaLabel"
			:aria-keyshortcuts="shortcut"
			ref="button"
		>
			<BIcon
				:name="iconSet.SEARCH"
				:size="24"
				aria-hidden="true"
				class="ui-block-diagram-open-search-btn__icon"
			/>
		</button>
	`
	};

	// Directions the results are walked in, so the spelling lives in one place on both sides.
	const SEARCH_NAV_DIRECTION = Object.freeze({
		NEXT: 'next',
		PREV: 'prev'
	});
	// Where the focus goes once the panel has finished closing, so the spelling lives in one place on
	// both sides. Which target it is, the caller says: only the caller knows what kind of close it was.
	const SEARCH_FOCUS_TARGET = Object.freeze({
		OPEN_BUTTON: 'openButton',
		CANVAS: 'canvas'
	});
	const NAV_ACTION_DIRECTION = new Map([[CANVAS_ACTION_ID.NEXT_SEARCH_RESULT, SEARCH_NAV_DIRECTION.NEXT], [CANVAS_ACTION_ID.PREV_SEARCH_RESULT, SEARCH_NAV_DIRECTION.PREV]]);
	const SEARCH_INPUT_CLASS_NAMES = {
		base: 'ui-block-diagram-search-input',
		open: '--open',
		focus: '--focus'
	};
	function isFocusInside(element) {
		return element instanceof HTMLElement && element.contains(document.activeElement);
	}

	// The canvas skips its global action channel for a press inside an editable field (InputState:
	// `isInputEventTarget`), so a shortcut meant to fire while this very field holds focus can never go
	// through it - it is read here instead, straight off the registry the field belongs to, the same
	// source `useKeyboardShortcuts` reads for every shortcut that is not field-scoped. Reading the
	// registry rather than a fixed key keeps the combo reassignable through the settings panel like any
	// other action of the canvas.
	function comboFromEvent(event, isMac) {
		const modifiers = [event.ctrlKey && 'ctrl', event.altKey && 'alt', event.shiftKey && 'shift', event.metaKey && 'meta'].filter(Boolean);
		return normalizeCombo([...modifiers, event.code || event.key], isMac);
	}

	// The lower bound of what the field may be taken away for: a press none of these modifiers is held
	// on is plain typing, whatever the registry says about it. Shift is not one of them - it types a
	// character of its own, an uppercase letter or the symbol above the digit. The settings panel draws
	// the bound at the same three modifiers, so what may be assigned is what works here.
	function isCombinationPress(event) {
		return event.ctrlKey || event.metaKey || event.altKey;
	}
	function searchNavDirection(event, actionRegistry, isMac) {
		if (!isCombinationPress(event)) {
			return null;
		}
		const actionId = actionRegistry.getAction(comboFromEvent(event, isMac));
		return NAV_ACTION_DIRECTION.get(actionId) ?? null;
	}

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
			},
			hasResults: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value', 'clear', 'update:open', 'navigate', 'close-request'],
		setup(props, {
			emit
		}) {
			const loc = useLoc();
			const {
				actionRegistry
			} = useBlockDiagram();
			const {
				focusCanvas
			} = useCanvasFocus();
			const isMac = main_core.Browser.isMac();
			const searchInput = ui_vue3.useTemplateRef('searchInput');
			const searchBar = ui_vue3.useTemplateRef('searchBar');
			const openSearchBtn = ui_vue3.useTemplateRef('openSearchBtn');
			const showSearchBtn = ui_vue3.ref(true);
			const showSearchBar = ui_vue3.ref(false);
			const isFocus = ui_vue3.ref(false);
			const searchPanelId = `ui-block-diagram-search-panel-${main_core.Text.getRandom()}`;

			// The field is hidden the moment the panel starts closing, and the button it opened from is
			// rendered again only once the closing animation has played out. Between the two the focus
			// belongs to nobody, so the answer is decided while the field still holds it.
			let pendingFocusTarget = null;
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

			// With nothing found the press stays the field's: taking it away would cost the user the
			// native picking out of text and give nothing back.
			function onKeyDownSearchInput(event) {
				if (props.disabled || !props.hasResults) {
					return;
				}
				const direction = searchNavDirection(event, actionRegistry, isMac);
				if (direction === null) {
					return;
				}
				event.preventDefault();
				emit('navigate', direction);
			}
			function onClear(event) {
				event.stopPropagation();
				if (props.disabled) {
					return;
				}
				pendingFocusTarget = isFocusInside(ui_vue3.toValue(searchBar)) ? SEARCH_FOCUS_TARGET.OPEN_BUTTON : null;
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
				const target = pendingFocusTarget;
				pendingFocusTarget = null;
				if (target === null) {
					return;
				}
				ui_vue3.nextTick(() => {
					if (target === SEARCH_FOCUS_TARGET.CANVAS) {
						focusCanvas();
						return;
					}
					ui_vue3.toValue(openSearchBtn)?.focus();
				});
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

			// The canvas input state hands a focused field nothing but Escape, so the combo that opened
			// the panel would reach neither the canvas nor a preventDefault, and the browser would answer
			// it with its own find bar. What closing means is left to the parent, the same way `clear` is.
			// The combo is the one the registry holds for the action, the way the navigation beside it is
			// read: the press that opens the panel is the press that closes it, reassignment or not.
			function onSearchInputKeyDown(event) {
				if (props.disabled || !isCombinationPress(event)) {
					return;
				}
				if (actionRegistry.getAction(comboFromEvent(event, isMac)) !== CANVAS_ACTION_ID.TOGGLE_SEARCH) {
					return;
				}
				event.preventDefault();
				emit('close-request');
			}
			function onBlurSearchInput() {
				isFocus.value = false;
			}

			// A close the user asked for from inside the panel names where the focus goes next; a click
			// past the panel names nothing and leaves the focus where the click put it. The target is
			// the caller's to answer: the panel reaches past this field - the buttons that walk the
			// results are its own - and only the panel knows its whole extent.
			function collapseSearchBar({
				focusTarget = null
			} = {}) {
				pendingFocusTarget = focusTarget;
				showSearchBar.value = false;
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				showSearchBar,
				showSearchBtn,
				searchPanelId,
				placeholderOrDefaultValue,
				searchInputClassNames,
				onInput,
				onKeyDownSearchInput,
				onClear,
				onAfterEnterTransition,
				onLeaveTransition,
				onOpenSearchBar,
				onClickSearchInput,
				onBlurSearchInput,
				onSearchInputKeyDown,
				collapseSearchBar
			};
		},
		template: `
		<OpenSearchBtn
			v-show="showSearchBtn"
			:aria-expanded="open"
			:aria-controls="searchPanelId"
			:data-test-id="$blockDiagramTestId('searchOpenBtn')"
			ref="openSearchBtn"
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
				:id="searchPanelId"
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
					@keydown="[onKeyDownSearchInput, onSearchInputKeyDown]"
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

	// The diagram as it stood when the panel opened. Only the camera position is kept: a zoom the user
	// changed by hand while searching is theirs, and the search never touched it.

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
				isDisabledBlockDiagram,
				inputState,
				transform,
				blockIdsInModel
			} = useBlockDiagram();
			const highlitedBlocks = useHighlightedBlocks();
			const loc = useLoc();
			const {
				goToBlockById,
				setCamera
			} = useCanvas();
			const {
				returnFocusToCanvas
			} = useCanvasFocus();
			const searchPanel = ui_vue3.useTemplateRef('searchPanel');
			const searchInputRef = ui_vue3.useTemplateRef('searchInput');
			const currentBlockIndex = ui_vue3.ref(0);
			const isOpenedSearchBar = ui_vue3.ref(false);

			// The snapshot is not display data, so it stays out of the reactive state; it lives exactly
			// as long as the claim on Escape does.
			let snapshot = null;
			let unsubscribeEscape = null;
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

			// Opening claims Escape and remembers what to come back to. Every close gives the claim up as
			// it starts, so releasing it here is the backstop for a flag that fell some other way.
			ui_vue3.watch(isOpenedSearchBar, isOpened => {
				if (!isOpened) {
					releaseSearchClaim();
					return;
				}
				const {
					x,
					y
				} = ui_vue3.toValue(transform);
				snapshot = {
					highlighted: [...ui_vue3.toValue(highlitedBlocks.highlitedBlockIds)],
					camera: {
						x,
						y
					}
				};
				claimEscape();
			});
			ui_vue3.onMounted(() => {
				main_core.Event.bind(document, 'mousedown', onClickOutside);
			});
			ui_vue3.onUnmounted(() => {
				main_core.Event.unbind(document, 'mousedown', onClickOutside);
				releaseSearchClaim();
			});
			useKeyboardShortcuts([{
				actionId: CANVAS_ACTION_ID.TOGGLE_SEARCH,
				handler: toggleSearchBarFromKeyboard,
				preventDefault: false
			}]);
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

			// The keyboard reaches the results while the buttons that walk them are not even rendered:
			// they come with the results, and the field is the one place the search is done from.
			function onNavigateResults(direction) {
				if (ui_vue3.toValue(foundBlocks).length === 0) {
					return;
				}
				if (direction === SEARCH_NAV_DIRECTION.NEXT) {
					onGoToNextBlock();
				} else if (direction === SEARCH_NAV_DIRECTION.PREV) {
					onGoToPrevBlock();
				}
			}

			// Closing here is the user leaving the panel, not taking the search back, so it goes through
			// `closeSearchPanel()` and not through `cancelSearch()`: the highlight and the camera stay
			// where the search left them, and rolling them back stays the answer to Escape alone.
			// The browser action goes off only once the press is taken: a press the panel refuses belongs
			// to the browser and to the layers above the canvas.
			function toggleSearchBarFromKeyboard(event) {
				if (isKeyboardBusyByOverlay() || ui_vue3.toValue(isDisabled)) {
					return;
				}
				event.preventDefault();
				if (ui_vue3.toValue(isOpenedSearchBar)) {
					closeSearchPanel({
						focusTarget: keyboardFocusTarget(),
						keepHighlight: true
					});
					return;
				}
				ui_vue3.toValue(searchInputRef)?.onOpenSearchBar();
			}

			// Every way the panel closes ends the search itself, the clear button included, and the key
			// goes back at the start of the closing rather than when its animation ends a third of a
			// second later: the next press belongs to the layers above the canvas by then. The highlight
			// is kept only where the closing leaves the diagram as the search found it.
			function closeAndResetSearch(keepHighlight = false) {
				releaseSearchClaim();

				// Emptying the results wipes the highlight through the watcher on them, after this
				// synchronous block, so what is kept goes back once every watcher has had its say -
				// the way `cancelSearch()` puts its snapshot back.
				const kept = keepHighlight ? [...ui_vue3.toValue(highlitedBlocks.highlitedBlockIds)] : null;
				if (kept === null) {
					highlitedBlocks.clear();
				}
				onClearSearch();
				currentBlockIndex.value = 0;
				if (kept !== null) {
					void ui_vue3.nextTick(() => highlitedBlocks.replace(kept));
				}
			}

			// Both halves always go together: the panel and the input keep their own open flag, and
			// closing one without the other leaves them disagreeing about it.
			function closeSearchPanel({
				focusTarget = null,
				keepHighlight = false
			} = {}) {
				closeAndResetSearch(keepHighlight);
				ui_vue3.toValue(searchInputRef)?.collapseSearchBar({
					focusTarget
				});
			}

			// A close the user asked for from the keyboard leaves the focus nowhere: the panel takes its
			// field away, and with the results the buttons that walk them go too. The canvas takes the
			// focus back - the arrows and the shortcuts of the diagram all start from its root - but only
			// while nothing else holds Escape: a claim still on the stack means a layer above the canvas
			// is open, and the canvas is not the keyboard's owner then. The focus still has to land
			// somewhere, so it goes to the button the panel opened from. A close made from outside the
			// panel moves no focus at all: the user stands where they meant to.
			function keyboardFocusTarget() {
				const closedFromInsidePanel = isFocusInsidePanel();

				// The key goes back before the stack is asked about the rest, or the panel would find its
				// own claim on it and leave the focus to itself.
				releaseSearchClaim();
				if (!closedFromInsidePanel) {
					return null;
				}
				return returnFocusToCanvas() ? SEARCH_FOCUS_TARGET.CANVAS : SEARCH_FOCUS_TARGET.OPEN_BUTTON;
			}

			// The combo of the panel pressed while the cursor stands in the field never reaches the
			// canvas, so the field asks for the close itself. It is the same keyboard close as the
			// shortcut going through the canvas.
			function onCloseRequest() {
				closeSearchPanel({
					focusTarget: keyboardFocusTarget()
				});
			}

			// The claim comes and goes with the focus, so both halves are idempotent: the panel asks for
			// a key it may already hold and gives up one it may have given up already.
			function claimEscape() {
				if (unsubscribeEscape === null) {
					unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, cancelSearch);
				}
			}
			function releaseEscapeClaim() {
				unsubscribeEscape?.();
				unsubscribeEscape = null;
			}

			// Called from every path that ends the search itself: the key goes back and the diagram has
			// nothing left to come back to.
			function releaseSearchClaim() {
				releaseEscapeClaim();
				snapshot = null;
			}

			// The key is the panel's only while the work is in the panel. An open panel the keyboard
			// user has tabbed away from holds Escape over the whole page otherwise, and the layers above
			// the canvas - a slider around the diagram first of all - stop closing by it. A focus that
			// goes nowhere is not a departure: that is the panel hiding its own field as it closes.
			function onPanelFocusOut(event) {
				const nextTarget = event.relatedTarget;
				const staysInPanel = !(nextTarget instanceof Node) || ui_vue3.toValue(searchPanel)?.contains(nextTarget) === true;
				if (staysInPanel) {
					return;
				}
				releaseEscapeClaim();
			}
			function onPanelFocusIn() {
				if (ui_vue3.toValue(isOpenedSearchBar)) {
					claimEscape();
				}
			}
			function isFocusInsidePanel() {
				return ui_vue3.toValue(searchPanel)?.contains(document.activeElement) === true;
			}

			// Escape gives up the search: the panel closes the way it closes on a click past it, and the
			// diagram goes back to where the search found it.
			function cancelSearch() {
				// Read before the close: it gives up the snapshot along with the key, and the deferred
				// restoration below works off this copy.
				const taken = snapshot;
				closeSearchPanel({
					focusTarget: keyboardFocusTarget()
				});
				if (taken === null) {
					return;
				}

				// The watcher on the found blocks wipes the highlight after this synchronous block, so
				// the snapshot goes back only once every watcher has had its say.
				void ui_vue3.nextTick(() => {
					highlitedBlocks.replace(taken.highlighted);
					// A block deleted while the panel was open is gone from the model, and the selection
					// was trimmed of it by the very same rule: the snapshot must not bring it back.
					pruneSelection(highlitedBlocks.highlitedBlockIds, blockIdsInModel);
					setCamera(taken.camera);
				});
			}
			function onClickOutside(event) {
				if (ui_vue3.toValue(searchPanel) && !ui_vue3.toValue(searchPanel).contains(event.target) && ui_vue3.toValue(isOpenedSearchBar)) {
					closeSearchPanel();
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
				closeSearchPanel,
				onGoToNextBlock,
				onGoToPrevBlock,
				onNavigateResults,
				onPanelFocusIn,
				onPanelFocusOut,
				onCloseRequest
			};
		},
		template: `
		<div
			:class="searchBarClassNames"
			ref="searchPanel"
			@focusin="onPanelFocusIn"
			@focusout="onPanelFocusOut"
		>
			<SearchInput
				v-model:open="isOpenedSearchBar"
				:value="seachText"
				:placeholder="placeholderOrDefaultValue"
				:disabled="isDisabled"
				:hasResults="foundBlocks.length > 0"
				ref="searchInput"
				@update:value="onSearchBlocks"
				@navigate="onNavigateResults"
				@clear="closeAndResetSearch()"
				@close-request="onCloseRequest"
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

	const RESIZABLE_BLOCK_CLASS_NAMES = {
		base: 'ui-block-diagram-resizable-block',
		placementFeedback: 'ui-block-diagram-placement-feedback',
		displaced: '--displaced',
		placementRefused: '--placement-refused'
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
			canStartMove: {
				type: Function,
				default: null
			}
		},
		setup(props) {
			const {
				block,
				minWidth,
				minHeight,
				canStartMove
			} = ui_vue3.toRefs(props);
			const blockRef = ui_vue3.useTemplateRef('blockEl');
			const {
				isHiglitedBlock,
				isDisplacedBlock,
				isPlacementRefusedBlock,
				isDisabled,
				blockZindex,
				onMountedBlock,
				onUnmountedBlock
			} = useBlockState({
				block,
				blockRef,
				// The backdrop is a background, so it keeps its own resting step instead of following
				// hover and selection. The stylesheet states the same value for a consumer that mounts
				// this component outside the canvas.
				restingZIndex: BLOCK_INDEXES.BACKDROP
			});
			const {
				isDragged,
				blockPositionStyle
			} = useMoveableBlock(blockRef, block, {
				canStartMove
			});
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
					...ui_vue3.toValue(sizeBlockStyle),
					zIndex: ui_vue3.toValue(blockZindex)
				};
			});

			// The rule moves a backdrop as readily as a node, so the backdrop shows the same feedback:
			// without it a corrected backdrop would just jump aside with nothing said to the eye.
			const blockClassNames = ui_vue3.computed(() => ({
				[RESIZABLE_BLOCK_CLASS_NAMES.base]: true,
				[RESIZABLE_BLOCK_CLASS_NAMES.placementFeedback]: true,
				[RESIZABLE_BLOCK_CLASS_NAMES.displaced]: ui_vue3.toValue(isDisplacedBlock),
				[RESIZABLE_BLOCK_CLASS_NAMES.placementRefused]: ui_vue3.toValue(isPlacementRefusedBlock)
			}));
			ui_vue3.onMounted(() => {
				onMountedBlock();
				onMountedResizableBlock();
			});
			ui_vue3.onUnmounted(() => {
				onUnmountedBlock();
				onUnmountedResizableBlock();
			});
			return {
				isHiglitedBlock,
				isDisplacedBlock,
				isPlacementRefusedBlock,
				isDisabled,
				isResize,
				isDragged,
				blockClassNames,
				blockStyle,
				blockDimensions
			};
		},
		template: `
		<div
			:style="blockStyle"
			ref="blockEl"
			:class="blockClassNames"
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
					:isDisplaced="isDisplacedBlock"
					:isPlacementRefused="isPlacementRefusedBlock"
					:width="blockDimensions.width"
					:height="blockDimensions.height"
				/>
			</div>
		</div>
	`
	};

	// Wrapping a block in this component is what declares the block a container. It adds no markup, no
	// styles and no pointer handlers of its own and starts no gesture: the captured nodes are carried
	// by the gesture the wrapped block already runs.
	// @vue/component
	const Groupable = {
		name: 'Groupable',
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			// A consumer closing the ability behind a flag of its own keeps the wrapper in its template
			// and switches this instead.
			enabled: {
				type: Boolean,
				default: true
			}
		},
		setup(props) {
			const {
				block,
				enabled
			} = ui_vue3.toRefs(props);
			const {
				registerGroupableBlock,
				unregisterGroupableBlock
			} = useGroupable(block, enabled);

			// The flag may go off without a reload, and a record left behind would keep the block a
			// container for the rest of the session.
			ui_vue3.watch(enabled, isEnabled => {
				if (isEnabled) {
					registerGroupableBlock();
				} else {
					unregisterGroupableBlock();
				}
			});
			ui_vue3.onMounted(registerGroupableBlock);
			ui_vue3.onUnmounted(unregisterGroupableBlock);
		},
		template: `
		<slot/>
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

	// The handlers the element was bound with: they close over the value of the directive, so
	// unbinding cannot rebuild them and has to find the very functions that were bound.
	const boundHandlers = new WeakMap();
	const DragBlock = {
		mounted(el, {
			value
		}) {
			initDragItemWrapper();
			main_core.Dom.attr(el, 'draggable', 'true');
			const handlers = {
				dragStart: event => onDragStart(event, value),
				dragEnd: event => onDragEnd()
			};
			boundHandlers.set(el, handlers);
			main_core.Event.bind(el, 'dragstart', handlers.dragStart);
			main_core.Event.bind(el, 'dragend', handlers.dragEnd);
		},
		unmounted(el) {
			const handlers = boundHandlers.get(el) ?? null;
			if (handlers === null) {
				return;
			}
			boundHandlers.delete(el);
			main_core.Event.unbind(el, 'dragstart', handlers.dragStart);
			main_core.Event.unbind(el, 'dragend', handlers.dragEnd);
		}
	};

	exports.ANIMATED_TYPES = ANIMATED_TYPES;
	exports.ActionRegistry = ActionRegistry;
	exports.BlockDiagram = BlockDiagram;
	exports.CANVAS_ACTION_ID = CANVAS_ACTION_ID;
	exports.ComboVerdict = ComboVerdict;
	exports.Connection = Connection;
	exports.CopyPasteBuffer = CopyPasteBuffer;
	exports.DeleteConnectionBtn = DeleteConnectionBtn;
	exports.DragBlock = DragBlock;
	exports.GroupSelectionBox = GroupSelectionBox;
	exports.Groupable = Groupable;
	exports.HistoryBar = HistoryBar;
	exports.KEY_TOKEN = KEY_TOKEN;
	exports.MoveableBlock = MoveableBlock;
	exports.PORT_POSITION = PORT_POSITION;
	exports.Port = Port;
	exports.ResizableBlock = ResizableBlock;
	exports.SOURCE_PORT_STUB_SLOT_NAME = SOURCE_PORT_STUB_SLOT_NAME;
	exports.SearchBar = SearchBar;
	exports.TARGET_PORT_STUB_SLOT_NAME = TARGET_PORT_STUB_SLOT_NAME;
	exports.ZoomBar = ZoomBar;
	exports.formatComboCaption = formatComboCaption;
	exports.getCanvasActionDefaults = getCanvasActionDefaults;
	exports.getReservedCombos = getReservedCombos;
	exports.isInputEventTarget = isInputEventTarget;
	exports.isKeyboardBusyByOverlay = isKeyboardBusyByOverlay;
	exports.isModifierToken = isModifierToken;
	exports.normalizeCombo = normalizeCombo;
	exports.rectsOverlap = rectsOverlap;
	exports.transformPoint = transformPoint;
	exports.useActionShortcut = useActionShortcut;
	exports.useAnimationQueue = useAnimationQueue;
	exports.useBlockDiagram = useBlockDiagram;
	exports.useBlockState = useBlockState;
	exports.useCanvas = useCanvas;
	exports.useCanvasFocus = useCanvasFocus;
	exports.useConnectionState = useConnectionState;
	exports.useContextMenu = useContextMenu;
	exports.useCopyPaste = useCopyPaste;
	exports.useHighlightedBlocks = useHighlightedBlocks;
	exports.useHistory = useHistory;
	exports.useKeyboardShortcuts = useKeyboardShortcuts;
	exports.useNewConnectionState = useNewConnectionState;
	exports.usePortState = usePortState;
	exports.useSearchBlocks = useSearchBlocks;

})(this.BX.UI = this.BX.UI || {}, BX.Vue3, BX, BX.Main, BX.UI.Accessibility, BX, BX.UI.IconSet, BX.UI.System.Tooltip.Vue, BX.UI.System.Tooltip);
//# sourceMappingURL=block-diagram.bundle.js.map
