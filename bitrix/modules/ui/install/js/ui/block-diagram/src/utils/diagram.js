import type { Point, DiagramPortPosition } from '../types';
import { PORT_POSITION } from '../constants';

const DIR_ACCESSOR_X = 'x';
const DIR_ACCESSOR_Y = 'y';

const DIRECTIONS_BY_POSITION: { [DiagramPortPosition]: Point } = {
	[PORT_POSITION.LEFT]: { x: -1, y: 0 },
	[PORT_POSITION.RIGHT]: { x: 1, y: 0 },
	[PORT_POSITION.TOP]: { x: 0, y: -1 },
	[PORT_POSITION.BOTTOM]: { x: 0, y: 1 },
};

export type PathInfo = {
	path: string;
	center: {
		x: number;
		y: number;
	}
};

export type LineRoutePrimitive = {
	type: 'line';
	start: Point;
	end: Point;
};

export type QuadraticRoutePrimitive = {
	type: 'quadratic';
	start: Point;
	control: Point;
	end: Point;
};

export type CubicRoutePrimitive = {
	type: 'cubic';
	start: Point;
	control1: Point;
	control2: Point;
	end: Point;
};

export type RoutePrimitive = LineRoutePrimitive | QuadraticRoutePrimitive | CubicRoutePrimitive;

export type RoutePathInfo = PathInfo & {
	primitives: RoutePrimitive[];
};

export type SmoothStepPathInfo = RoutePathInfo & {
	points: Point[];
};

export function getLinePath(start: Point, end: Point): RoutePathInfo
{
	const startPoint = { x: start.x, y: start.y };
	const endPoint = { x: end.x, y: end.y };
	const [x, y] = getConnectionCenter({
		sourceX: startPoint.x,
		sourceY: startPoint.y,
		targetX: endPoint.x,
		targetY: endPoint.y,
	});

	return {
		path: `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`,
		center: { x, y },
		primitives: [{
			type: 'line',
			start: startPoint,
			end: endPoint,
		}],
	};
}

export const BEZIER_DIR = {
	VERTICAL: 'vertical',
	HORIZONTAL: 'horizontal',
};

export function getBeziePath(
	start: Point,
	end: Point,
	dir: 'vertical' | 'horizontal' = BEZIER_DIR.VERTICAL,
): RoutePathInfo
{
	const startPoint = { x: start.x, y: start.y };
	const endPoint = { x: end.x, y: end.y };
	const midX: number = (startPoint.x + endPoint.x) / 2;
	const midY: number = (startPoint.y + endPoint.y) / 2;
	const [centerX, centerY] = getConnectionCenter({
		sourceX: startPoint.x,
		sourceY: startPoint.y,
		targetX: endPoint.x,
		targetY: endPoint.y,
	});

	const control1 = dir === BEZIER_DIR.HORIZONTAL
		? { x: midX, y: startPoint.y }
		: { x: startPoint.x, y: midY };
	const control2 = dir === BEZIER_DIR.HORIZONTAL
		? { x: midX, y: endPoint.y }
		: { x: endPoint.x, y: midY };
	const path = [
		`M ${startPoint.x} ${startPoint.y}`,
		`C ${control1.x} ${control1.y},`,
		`${control2.x} ${control2.y},`,
		`${endPoint.x} ${endPoint.y}`,
	].join(' ');

	return {
		path,
		center: {
			x: centerX,
			y: centerY,
		},
		primitives: [{
			type: 'cubic',
			start: startPoint,
			control1,
			control2,
			end: endPoint,
		}],
	};
}

export function transformPoint(point: Point, transform, viewport): Point
{
	let transformedX: number = Math.round((point.x - transform.x) / transform.zoom);
	let transformedY: number = Math.round((point.y - transform.y) / transform.zoom);

	transformedX -= Math.round(viewport.left / transform.zoom);
	transformedY -= Math.round(viewport.top / transform.zoom);

	return {
		x: transformedX,
		y: transformedY,
	};
}

export function getConnectionCenter({
	sourceX,
	sourceY,
	targetX,
	targetY,
}: {
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number,
}): [number, number, number, number]
{
	const xOffset = Math.abs(targetX - sourceX) / 2;
	const centerX = targetX < sourceX
		? targetX + xOffset
		: targetX - xOffset;

	const yOffset = Math.abs(targetY - sourceY) / 2;
	const centerY = targetY < sourceY
		? targetY + yOffset
		: targetY - yOffset;

	return [centerX, centerY, xOffset, yOffset];
}

function getDirection({ source, sourcePosition = PORT_POSITION.BOTTOM, target }: {
	source: XYPosition,
	sourcePosition: Position,
	target: XYPosition,
}): XYPosition
{
	if (sourcePosition === PORT_POSITION.LEFT || sourcePosition === PORT_POSITION.RIGHT)
	{
		return source.x < target.x
			? { x: 1, y: 0 }
			: { x: -1, y: 0 };
	}

	return source.y < target.y
		? { x: 0, y: 1 }
		: { x: 0, y: -1 };
}

export function distance(a: Point, b: Point): number
{
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export type GetPointsParams = {
	source: Point;
	sourcePosition: DiagramPortPosition;
	target: Point;
}

// eslint-disable-next-line max-lines-per-function
function getPoints({
	source,
	sourcePosition = PORT_POSITION.BOTTOM,
	target,
	targetPosition = PORT_POSITION.TOP,
	center,
	offset,
}: {
  source: Point,
  sourcePosition: DiagramPortPosition,
  target: Point,
  targetPosition: DiagramPortPosition,
  center: Partial<Point>,
  offset: number,
}): [Point[], number, number, number, number]
{
	const sourceDir = DIRECTIONS_BY_POSITION[sourcePosition];
	const targetDir = DIRECTIONS_BY_POSITION[targetPosition];
	const sourceGapped: Point = {
		x: source.x + sourceDir.x * offset,
		y: source.y + sourceDir.y * offset,
	};
	const targetGapped: Point = {
		x: target.x + targetDir.x * offset,
		y: target.y + targetDir.y * offset,
	};
	const dir = getDirection({
		source: sourceGapped,
		sourcePosition,
		target: targetGapped,
	});
	const dirAccessor = dir.x !== 0
		? DIR_ACCESSOR_X
		: DIR_ACCESSOR_Y;
	const currDir = dir[dirAccessor];

	let points: Point[] = [];
	let centerX = 0;
	let centerY = 0;

	const sourceGapOffset: Point = { x: 0, y: 0 };
	const targetGapOffset: Point = { x: 0, y: 0 };

	const [
		defaultCenterX,
		defaultCenterY,
		defaultOffsetX,
		defaultOffsetY,
	] = getConnectionCenter({
		sourceX: source.x,
		sourceY: source.y,
		targetX: target.x,
		targetY: target.y,
	});

	if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1)
	{
		centerX = center.x ?? defaultCenterX;
		centerY = center.y ?? defaultCenterY;

		const verticalSplit: Point[] = [
			{ x: centerX, y: sourceGapped.y },
			{ x: centerX, y: targetGapped.y },
		];

		const horizontalSplit: Point[] = [
			{ x: sourceGapped.x, y: centerY },
			{ x: targetGapped.x, y: centerY },
		];

		if (sourceDir[dirAccessor] === currDir)
		{
			points = dirAccessor === DIR_ACCESSOR_X
				? verticalSplit
				: horizontalSplit;
		}
		else
		{
			points = dirAccessor === DIR_ACCESSOR_X
				? horizontalSplit
				: verticalSplit;
		}
	}
	else
	{
		const sourceTarget: Point[] = [{
			x: sourceGapped.x,
			y: targetGapped.y,
		}];
		const targetSource: Point[] = [{
			x: targetGapped.x,
			y: sourceGapped.y,
		}];

		if (dirAccessor === DIR_ACCESSOR_X)
		{
			points = sourceDir.x === currDir
				? targetSource
				: sourceTarget;
		}
		else
		{
			points = sourceDir.y === currDir
				? sourceTarget
				: targetSource;
		}

		if (sourcePosition === targetPosition)
		{
			const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);

			if (diff <= offset)
			{
				const gapOffset = Math.min(offset - 1, offset - diff);

				if (sourceDir[dirAccessor] === currDir)
				{
					const dirSource = sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1;
					sourceGapOffset[dirAccessor] = dirSource * gapOffset;
				}
				else
				{
					const dirTarget = targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1;
					targetGapOffset[dirAccessor] = dirTarget * gapOffset;
				}
			}
		}

		if (sourcePosition !== targetPosition)
		{
			const dirAccessorOpposite = dirAccessor === DIR_ACCESSOR_X
				? DIR_ACCESSOR_Y
				: DIR_ACCESSOR_X;
			const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
			const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
			const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
			const isFlipSourceTarget =
				(sourceDir[dirAccessor] === 1 && ((!isSameDir && sourceGtTargetOppo) || (isSameDir && sourceLtTargetOppo))) ||
				(sourceDir[dirAccessor] !== 1 && ((!isSameDir && sourceLtTargetOppo) || (isSameDir && sourceGtTargetOppo)));

			if (isFlipSourceTarget)
			{
				points = dirAccessor === DIR_ACCESSOR_X
					? sourceTarget
					: targetSource;
			}
		}

		const sourceGapPoint = {
			x: sourceGapped.x + sourceGapOffset.x,
			y: sourceGapped.y + sourceGapOffset.y,
		};
		const targetGapPoint = {
			x: targetGapped.x + targetGapOffset.x,
			y: targetGapped.y + targetGapOffset.y,
		};
		const maxXDistance = Math.max(
			Math.abs(sourceGapPoint.x - points[0].x),
			Math.abs(targetGapPoint.x - points[0].x),
		);
		const maxYDistance = Math.max(
			Math.abs(sourceGapPoint.y - points[0].y),
			Math.abs(targetGapPoint.y - points[0].y),
		);

		if (maxXDistance >= maxYDistance)
		{
			centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
			centerY = points[0].y;
		}
		else
		{
			centerX = points[0].x;
			centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
		}
	}

	const pathPoints: Point[] = [
		source,
		{
			x: sourceGapped.x + sourceGapOffset.x,
			y: sourceGapped.y + sourceGapOffset.y,
		},
		...points,
		{
			x: targetGapped.x + targetGapOffset.x,
			y: targetGapped.y + targetGapOffset.y,
		},
		target,
	];

	return {
		points: pathPoints,
		offsetX: defaultOffsetX,
		offsetY: defaultOffsetY,
		centerX,
		centerY,
	};
}

type BendInfo = {
	path: string;
	primitives: RoutePrimitive[];
	end: Point;
};

function getBend(
	a: Point,
	b: Point,
	c: Point,
	size: number,
	start: Point,
): BendInfo
{
	const bendSize = Math.min(
		distance(a, b) / 2,
		distance(b, c) / 2,
		size,
	);
	const { x, y } = b;

	if ((a.x === x && x === c.x) || (a.y === y && y === c.y))
	{
		const end = { x, y };

		return {
			path: `L${x} ${y}`,
			primitives: [{ type: 'line', start, end }],
			end,
		};
	}

	if (a.y === y)
	{
		const xDir = a.x < c.x ? -1 : 1;
		const yDir = a.y < c.y ? 1 : -1;

		const lineEnd = { x: x + bendSize * xDir, y };
		const end = { x, y: y + bendSize * yDir };

		return {
			path: `L ${lineEnd.x},${lineEnd.y}Q ${x},${y} ${end.x},${end.y}`,
			primitives: [
				{ type: 'line', start, end: lineEnd },
				{ type: 'quadratic', start: lineEnd, control: { x, y }, end },
			],
			end,
		};
	}

	const xDir = a.x < c.x ? 1 : -1;
	const yDir = a.y < c.y ? -1 : 1;

	const lineEnd = { x, y: y + bendSize * yDir };
	const end = { x: x + bendSize * xDir, y };

	return {
		path: `L ${lineEnd.x},${lineEnd.y}Q ${x},${y} ${end.x},${end.y}`,
		primitives: [
			{ type: 'line', start, end: lineEnd },
			{ type: 'quadratic', start: lineEnd, control: { x, y }, end },
		],
		end,
	};
}

export type GetSmoothStepPathParams = {
	sourceX: number;
	sourceY: number;
	sourcePosition?: DiagramPortPosition;
	targetX: number;
	targetY: number;
	targetPosition?: DiagramPortPosition;
	borderRadius?: number;
	centerX?: number;
	centerY?: number;
	offset?: number;
};

export function getSmoothStepPath(params: GetSmoothStepPathParams): SmoothStepPathInfo
{
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
		offset = 20,
	} = params;

	const {
		points,
		centerX: pointsCenterX,
		centerY: pointsCenterY,
	} = getPoints({
		source: { x: sourceX, y: sourceY },
		sourcePosition,
		target: { x: targetX, y: targetY },
		targetPosition,
		center: { x: centerX, y: centerY },
		offset,
	});

	const route = points.reduce((result, point, index) => {
		if (index === 0)
		{
			return {
				path: `M${point.x} ${point.y}`,
				primitives: [],
				current: point,
			};
		}

		if (index < points.length - 1)
		{
			const bend = getBend(
				points[index - 1],
				point,
				points[index + 1],
				borderRadius,
				result.current,
			);

			return {
				path: result.path + bend.path,
				primitives: [...result.primitives, ...bend.primitives],
				current: bend.end,
			};
		}

		return {
			path: `${result.path}L${point.x} ${point.y}`,
			primitives: [
				...result.primitives,
				{ type: 'line', start: result.current, end: point },
			],
			current: point,
		};
	}, { path: '', primitives: [], current: points[0] });

	return {
		path: route.path,
		points,
		primitives: route.primitives,
		center: {
			x: pointsCenterX,
			y: pointsCenterY,
		},
	};
}
