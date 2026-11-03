// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
// lone .ts source inside this extension would not resolve.
import type {
	DiagramBlockDimensions,
	DiagramBlockId,
	DigramBlockPosition,
	DiagramSearchBlockRect,
	Point,
	Rect,
} from '../../types';

// A rectangle of the working form tied to the block that owns it: the search needs the id to tell a
// participant from an obstacle and to ask whether either side of a pair is a container.
export type PlacementRect = {
	id: DiagramBlockId,
	x: number,
	y: number,
	width: number,
	height: number,
};

// The form the capture of a container works in.
export type RectBounds = {
	left: number,
	top: number,
	right: number,
	bottom: number,
};

export type SearchObstacles = (rect: Rect) => PlacementRect[];

export type IsBackdrop = (blockId: DiagramBlockId) => boolean;

export type PlacementQueue = {
	isEmpty: () => boolean,
	push: (delta: Point) => void,
	takeShortest: () => Point,
};

const EDGE_LEFT = 'left';
const EDGE_TOP = 'top';
const EDGE_RIGHT = 'right';
const EDGE_BOTTOM = 'bottom';

const PLACEMENT_EDGES = [EDGE_LEFT, EDGE_TOP, EDGE_RIGHT, EDGE_BOTTOM];

// The clearance a correction leaves between the moved rect and the block it was pushed off: a
// design constant of the rule itself, not a diagram setting - two nodes freed from an overlap read
// as neighbours rather than as a seam, at any zoom.
export const PLACEMENT_GAP_PX = 20;

// Frozen because it leaves the module as the answer of the search: a consumer writing into the
// result would otherwise change the answer of every later call.
const ZERO_DELTA: Point = Object.freeze({ x: 0, y: 0 });

// A size the model does not state is an unknown size, not a zero one: a block may reach the diagram
// with empty `dimensions` fields, and a number taken out of an empty field would shrink the rect to
// its own top-left corner. Such a rect answers "inside" for a block that is not, so a block without
// a stated size takes no part in the rules built on this geometry - neither as the moved node nor as
// an obstacle to it.
export function isUsableRect(rect: Rect): boolean
{
	return Number.isFinite(rect?.x)
		&& Number.isFinite(rect?.y)
		&& Number.isFinite(rect?.width)
		&& Number.isFinite(rect?.height)
		&& rect.width > 0
		&& rect.height > 0;
}

// The area a block takes in the model - the very space the intersections index is built in. The
// measured geometry is deliberately not read: it depends on what has managed to mount and be
// measured, so the same schema would answer differently at another zoom or camera position.
export function modelBlockRect(
	position: DigramBlockPosition | null,
	dimensions: DiagramBlockDimensions | null,
): Rect | null
{
	const rect = {
		x: Number(position?.x),
		y: Number(position?.y),
		width: Number(dimensions?.width),
		height: Number(dimensions?.height),
	};

	return isUsableRect(rect) ? rect : null;
}

export function toSearchRect(rect: Rect): DiagramSearchBlockRect
{
	return {
		minX: rect.x,
		minY: rect.y,
		maxX: rect.x + rect.width,
		maxY: rect.y + rect.height,
	};
}

export function toRectBounds(rect: Rect): RectBounds
{
	return {
		left: rect.x,
		top: rect.y,
		right: rect.x + rect.width,
		bottom: rect.y + rect.height,
	};
}

// Strict on every side: two blocks that only touch by an edge do not overlap.
export function rectsOverlap(first: Rect, second: Rect): boolean
{
	return first.x < second.x + second.width
		&& first.x + first.width > second.x
		&& first.y < second.y + second.height
		&& first.y + first.height > second.y;
}

function addDelta(delta: Point, other: Point): Point
{
	return {
		x: delta.x + other.x,
		y: delta.y + other.y,
	};
}

function applyDelta(participants: PlacementRect[], delta: Point): PlacementRect[]
{
	return participants.map((participant: PlacementRect) => {
		return {
			...participant,
			x: participant.x + delta.x,
			y: participant.y + delta.y,
		};
	});
}

// The shift that clears `rect` off the named edge of `other` by the placement gap, along that edge
// axis alone.
function flushToEdge(rect: PlacementRect, other: PlacementRect, edge: string): Point
{
	switch (edge)
	{
		case EDGE_LEFT:
			return { x: other.x - PLACEMENT_GAP_PX - (rect.x + rect.width), y: 0 };
		case EDGE_RIGHT:
			return { x: (other.x + other.width + PLACEMENT_GAP_PX) - rect.x, y: 0 };
		case EDGE_TOP:
			return { x: 0, y: other.y - PLACEMENT_GAP_PX - (rect.y + rect.height) };
		case EDGE_BOTTOM:
			return { x: 0, y: (other.y + other.height + PLACEMENT_GAP_PX) - rect.y };
		default:
			return ZERO_DELTA;
	}
}

function floorToStep(value: number, step: number): number
{
	return Math.floor(value / step) * step;
}

function ceilToStep(value: number, step: number): number
{
	return Math.ceil(value / step) * step;
}

// Snapping never walks a candidate back into the block it was just pushed out of: the position the
// candidate puts the moved rect at is rounded away from that block, so both rules hold at once. It
// is the position and not the shift that lands on a grid line - a shift rounded on its own would
// bring the block to the grid only from a place that already stood on it. A step the diagram does
// not state leaves the candidate where the edge put it.
function snapOutward(origin: Point, delta: Point, edge: string, snapStep: number | null): Point
{
	if (!Number.isFinite(snapStep) || snapStep <= 0)
	{
		return delta;
	}

	switch (edge)
	{
		case EDGE_LEFT:
			return { x: floorToStep(origin.x + delta.x, snapStep) - origin.x, y: delta.y };
		case EDGE_RIGHT:
			return { x: ceilToStep(origin.x + delta.x, snapStep) - origin.x, y: delta.y };
		case EDGE_TOP:
			return { x: delta.x, y: floorToStep(origin.y + delta.y, snapStep) - origin.y };
		case EDGE_BOTTOM:
			return { x: delta.x, y: ceilToStep(origin.y + delta.y, snapStep) - origin.y };
		default:
			return delta;
	}
}

function deltaKey(delta: Point): string
{
	return `${delta.x}:${delta.y}`;
}

function deltaLength(delta: Point): number
{
	return Math.hypot(delta.x, delta.y);
}

function shortestFirstQueue(initial: Point[]): PlacementQueue
{
	const items: Point[] = [...initial];

	return {
		isEmpty: (): boolean => items.length === 0,
		push: (delta: Point): void => {
			items.push(delta);
		},
		takeShortest: (): Point => {
			let shortest = 0;

			for (let index = 1; index < items.length; index++)
			{
				if (deltaLength(items[index]) < deltaLength(items[shortest]))
				{
					shortest = index;
				}
			}

			return items.splice(shortest, 1)[0];
		},
	};
}

function unionRect(rects: PlacementRect[]): Rect | null
{
	if (rects.length === 0)
	{
		return null;
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const rect of rects)
	{
		minX = Math.min(minX, rect.x);
		minY = Math.min(minY, rect.y);
		maxX = Math.max(maxX, rect.x + rect.width);
		maxY = Math.max(maxY, rect.y + rect.height);
	}

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function containsRect(outer: Rect, inner: Rect): boolean
{
	return inner.x >= outer.x
		&& inner.y >= outer.y
		&& (inner.x + inner.width) <= (outer.x + outer.width)
		&& (inner.y + inner.height) <= (outer.y + outer.height);
}

/**
 * The obstacles stand still while the search runs - only the participants move over them. So the
 * index is asked once for an area around the participants instead of once per participant per
 * candidate, and every candidate that keeps them inside that area is answered from what came back.
 * A candidate that steps outside asks the index again for an area grown around itself, so the count
 * of index queries follows the reach of the wave and not the count of candidates.
 */
function areaObstacles(searchObstacles: SearchObstacles): (moved: PlacementRect[]) => PlacementRect[]
{
	let covered: Rect | null = null;
	let obstacles: PlacementRect[] = [];

	return (moved: PlacementRect[]): PlacementRect[] => {
		const wanted = unionRect(moved);

		if (wanted === null)
		{
			return [];
		}

		if (covered === null || !containsRect(covered, wanted))
		{
			covered = {
				x: wanted.x - wanted.width,
				y: wanted.y - wanted.height,
				width: wanted.width * 3,
				height: wanted.height * 3,
			};
			obstacles = searchObstacles(covered);
		}

		return obstacles;
	};
}

// Pairs the rule forbids: the participants of one operation never block each other, and a pair of a
// node and a container is allowed by the rule itself.
function collectBlockers(
	moved: PlacementRect[],
	obstacles: PlacementRect[],
	isBackdrop: IsBackdrop,
	participantIds: Set<DiagramBlockId>,
): Array<[PlacementRect, PlacementRect]>
{
	const blockers = [];

	for (const rect of moved)
	{
		for (const other of obstacles)
		{
			if (participantIds.has(other.id))
			{
				continue;
			}

			// Exactly one container in the pair, never two: a node lies on a container freely, but two
			// containers overlapping would leave the node in the shared area belonging to both, and
			// every gesture over either of them would carry it away.
			if (isBackdrop(rect.id) !== isBackdrop(other.id))
			{
				continue;
			}

			if (rectsOverlap(rect, other))
			{
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
export function findPlacementDelta(
	participants: PlacementRect[],
	searchObstacles: SearchObstacles,
	isBackdrop: IsBackdrop,
	snapStep: number | null,
	budget: number,
): Point | null
{
	const placed = participants.filter((participant: PlacementRect) => isUsableRect(participant));
	const participantIds = new Set(participants.map((participant: PlacementRect) => participant.id));
	const obstaclesAround = areaObstacles(searchObstacles);
	const queue = shortestFirstQueue([ZERO_DELTA]);
	const seen = new Set([deltaKey(ZERO_DELTA)]);

	while (!queue.isEmpty())
	{
		const delta = queue.takeShortest();
		const moved = applyDelta(placed, delta);
		const blockers = collectBlockers(
			moved,
			obstaclesAround(moved),
			isBackdrop,
			participantIds,
		);

		if (blockers.length === 0)
		{
			return delta;
		}

		// The budget stops the generating of candidates, not the walking of them: a candidate already
		// queued is examined whatever the count says, so `null` means "every candidate found was
		// tried" and not "the count ran out while the queue still held untried ones".
		if (seen.size >= budget)
		{
			continue;
		}

		for (const [rect, other] of blockers)
		{
			// The shift is counted from the rect as it stands under the current delta, so the place
			// it started from - the one the grid rounds the candidate against - is that rect less
			// the delta.
			const origin = { x: rect.x - delta.x, y: rect.y - delta.y };

			for (const edge of PLACEMENT_EDGES)
			{
				const candidate = snapOutward(
					origin,
					addDelta(delta, flushToEdge(rect, other, edge)),
					edge,
					snapStep,
				);
				const key = deltaKey(candidate);

				// The budget is counted here and not only before the wave: one pass over the blockers of a
				// large group generates four candidates per conflicting pair, so a check made only at the
				// top of the wave would let a single pass overshoot the budget many times over.
				if (!seen.has(key) && seen.size < budget)
				{
					seen.add(key);
					queue.push(candidate);
				}
			}
		}
	}

	return null;
}
