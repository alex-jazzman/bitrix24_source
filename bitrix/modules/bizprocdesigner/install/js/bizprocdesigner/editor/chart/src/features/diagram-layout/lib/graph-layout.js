/**
 * Whole-diagram automatic layout.
 *
 * The passes run in a fixed order - collapse, satellites, components, back edges, ranks, ordering,
 * placement, packing - the model is never sorted, and every tie falls back to the placement-group
 * index, so one snapshot always yields one set of coordinates. Nothing here reads the DOM, the clock
 * or a random source, and no identifier from the graph becomes an object key.
 */

import type { BlockId, BlockPosition } from '../../../shared/types';
import {
	LAYOUT_REJECTED_REASON,
	LAYOUT_UNCHANGED_REASON,
	POSITION_EPSILON,
	isSafeLayoutValue,
	layoutApplied,
	layoutRejected,
	layoutUnchanged,
	normalizeCoordinate,
} from '../model/types';
import type {
	LayoutRect,
	LayoutRejectedReason,
	LayoutResult,
	LayoutSnapshot,
	PlacementGroup,
} from '../model/types';

/** Gaps of the automatic layout: between ranks, between groups of one rank, between components. */
const RANK_GAP = 160;
const ROW_GAP = 80;
const COMPONENT_GAP_X = 160;
const COMPONENT_GAP_Y = 120;

/** Barycentric sweeps per direction: two left to right, then two right to left. */
const ORDERING_PASSES = 2;

/** Width-to-height ratio the shelf packing aims at. */
const PACKING_RATIO = 16 / 9;

/** How far a whole placement group travels; both members and frame move by it. */
type GroupDelta = {
	+dx: number,
	+dy: number,
};

type Point = { x: number, y: number };

type CollapsedGraph = {
	+successors: number[][],
	+predecessors: number[][],
	+neighbours: number[][],
};

type DirectedGraph = {
	+successors: number[][],
	+predecessors: number[][],
};

/** A laid out component: its extent plus the offset of every member from its top left corner. */
type ComponentBox = {
	+width: number,
	+height: number,
	+offsetByGroup: Map<number, Point>,
};

/** The strip a row of tools occupies under its owner; both sides are zero when there is none. */
type Band = {
	+width: number,
	+height: number,
};

/**
 * Tools bound to their owner by an auxiliary connection alone, in both directions of the relation.
 * They carry no rank: the ranking passes never see them, and the owner takes them along instead.
 */
type Satellites = {
	+hostByGroup: Map<number, number>,
	+groupsByHost: Map<number, number[]>,
};

type Fallible<T> =
	| { +ok: true, +value: T }
	| { +ok: false, +reason: LayoutRejectedReason };

const DFS_WHITE = 0;
const DFS_GREY = 1;
const DFS_BLACK = 2;

/**
 * Lays the whole diagram out from its snapshot. Only the main flow shapes the result: the snapshot
 * has already reduced the connections to `primaryEdges`, so nothing is filtered again here. A tool
 * held by an auxiliary connection alone carries no main flow of its own and follows its owner.
 */
export function runGraphLayout(snapshot: LayoutSnapshot): LayoutResult
{
	const groups = snapshot.groups;

	if (groups.length === 1 && groups[0].frameId !== null)
	{
		return layoutUnchanged(LAYOUT_UNCHANGED_REASON.singleRigidFrame);
	}

	if (groups.length < 2)
	{
		return layoutUnchanged(LAYOUT_UNCHANGED_REASON.degenerateInput);
	}

	// Degeneracy is decided on the snapshot edges, not on the collapsed ones: a frame with a chain
	// inside carries a main flow the collapse drops as a loop of one rigid group, and the diagram is
	// still worth arranging around it.
	if (snapshot.primaryEdges.length === 0)
	{
		return layoutUnchanged(LAYOUT_UNCHANGED_REASON.degenerateInput);
	}

	const graph = collapseEdges(snapshot);
	const satellites = findSatellites(snapshot, graph);
	const dag = removeBackEdges(graph);
	const ranks = assignRanks(dag);
	const components = findComponents(graph, satellites);

	const boxes: ComponentBox[] = [];
	for (const members of components)
	{
		const box = placeComponent(members, ranks, dag, groups, satellites);
		if (!box.ok)
		{
			return layoutRejected(box.reason);
		}

		boxes.push(box.value);
	}

	const deltas = buildDeltas(groups, boxes, satellites);

	return deltas.ok ? applyGroupDeltas(snapshot, deltas.value) : layoutRejected(deltas.reason);
}

/**
 * Turns automatic-layout deltas into the public result shape.
 *
 * `positions` carries only the blocks that really moved - the coordinator merges it into the model -
 * so an empty map is never an applied result but `already-arranged`. A group whose delta stays within
 * the epsilon keeps its exact original coordinates instead of a re-rounded copy of them.
 */
function applyGroupDeltas(snapshot: LayoutSnapshot, deltas: $ReadOnlyMap<number, GroupDelta>): LayoutResult
{
	const positions: Map<BlockId, BlockPosition> = new Map();
	const movedGroups: Set<number> = new Set();

	for (const group of snapshot.groups)
	{
		const delta = deltas.get(group.index);

		if (!delta || (Math.abs(delta.dx) <= POSITION_EPSILON && Math.abs(delta.dy) <= POSITION_EPSILON))
		{
			continue;
		}

		movedGroups.add(group.index);

		for (const blockId of group.blockIds)
		{
			const block = snapshot.blockById.get(blockId);
			if (!block)
			{
				return layoutRejected(LAYOUT_REJECTED_REASON.invalidGraph);
			}

			const x = normalizeCoordinate(block.position.x + delta.dx);
			const y = normalizeCoordinate(block.position.y + delta.dy);

			if (!isSafeLayoutValue(x) || !isSafeLayoutValue(y))
			{
				return layoutRejected(LAYOUT_REJECTED_REASON.unsafeGeometry);
			}

			positions.set(blockId, { x, y });
		}
	}

	if (positions.size === 0)
	{
		return layoutUnchanged(LAYOUT_UNCHANGED_REASON.alreadyArranged);
	}

	const violation = validatePlacement(snapshot.groups, deltas, movedGroups);

	return violation === null ? layoutApplied(positions) : layoutRejected(violation);
}

/** Primary edges between blocks become edges between groups; loops of one group carry no order. */
function collapseEdges(snapshot: LayoutSnapshot): CollapsedGraph
{
	const size = snapshot.groups.length;
	const successors = createLists(size);
	const predecessors = createLists(size);
	const neighbours = createLists(size);
	const seen: Set<string> = new Set();

	for (const edge of snapshot.primaryEdges)
	{
		const source = snapshot.groupByBlockId.get(edge.sourceBlockId);
		const target = snapshot.groupByBlockId.get(edge.targetBlockId);

		if (!source || !target || source.index === target.index)
		{
			continue;
		}

		const identity = `${source.index}>${target.index}`;
		if (seen.has(identity))
		{
			continue;
		}
		seen.add(identity);

		successors[source.index].push(target.index);
		predecessors[target.index].push(source.index);
		neighbours[source.index].push(target.index);
		neighbours[target.index].push(source.index);
	}

	return { successors, predecessors, neighbours };
}

/**
 * Tools the layout must not tear away from their owner. A group qualifies only when it is a free
 * single block without a single main-flow edge: a tool that also carries the main flow keeps its own
 * rank, and one captured by a frame stays part of that rigid group.
 *
 * A tool hanging off another tool has no owner to follow, so it is left to the ordinary component
 * packing rather than chained; when several owners claim the same tool, the smallest placement-group
 * index wins, and the tools of one owner are ordered by the same index.
 */
function findSatellites(snapshot: LayoutSnapshot, graph: CollapsedGraph): Satellites
{
	const claims: Map<number, number[]> = new Map();

	for (const edge of snapshot.auxEdges)
	{
		const host = snapshot.groupByBlockId.get(edge.sourceBlockId);
		const tool = snapshot.groupByBlockId.get(edge.targetBlockId);

		if (!host || !tool || host.index === tool.index || !isFreeOfMainFlow(tool, graph))
		{
			continue;
		}

		const owners = claims.get(tool.index);

		if (owners)
		{
			owners.push(host.index);
		}
		else
		{
			claims.set(tool.index, [host.index]);
		}
	}

	const hostByGroup: Map<number, number> = new Map();
	const groupsByHost: Map<number, number[]> = new Map();

	for (const [tool, owners] of claims)
	{
		// Folded in a loop rather than by a spread: one tool holds as many claims as the graph has
		// auxiliary edges into it, and `Math.min(...owners)` would put all of them on the call stack.
		let host = Number.POSITIVE_INFINITY;

		for (const index of owners)
		{
			if (!claims.has(index))
			{
				host = Math.min(host, index);
			}
		}

		if (!Number.isFinite(host))
		{
			continue;
		}

		hostByGroup.set(tool, host);
		const attached = groupsByHost.get(host);

		if (attached)
		{
			attached.push(tool);
		}
		else
		{
			groupsByHost.set(host, [tool]);
		}
	}

	for (const attached of groupsByHost.values())
	{
		attached.sort(byNumber);
	}

	return { hostByGroup, groupsByHost };
}

function isFreeOfMainFlow(group: PlacementGroup, graph: CollapsedGraph): boolean
{
	return group.frameId === null && graph.neighbours[group.index].length === 0;
}

/**
 * Weak components, isolated groups included, discovered in model order of the groups. Satellites are
 * left out: they are placed by their owner and would otherwise become components of their own.
 */
function findComponents(graph: CollapsedGraph, satellites: Satellites): number[][]
{
	const size = graph.neighbours.length;
	const visited: Array<boolean> = Array.from({ length: size }, () => false);
	const components: number[][] = [];

	for (let start = 0; start < size; start++)
	{
		if (visited[start] || satellites.hostByGroup.has(start))
		{
			continue;
		}

		const members = [start];
		visited[start] = true;

		for (let head = 0; head < members.length; head++)
		{
			for (const neighbour of graph.neighbours[members[head]])
			{
				if (!visited[neighbour])
				{
					visited[neighbour] = true;
					members.push(neighbour);
				}
			}
		}

		members.sort(byNumber);
		components.push(members);
	}

	return components;
}

/**
 * Drops the edges that close a cycle, so ranking works on a DAG. Detection is an iterative depth
 * first search over an explicit stack - a graph of hundreds of nodes must not touch the call stack -
 * and an edge is structural back edge when its target is still grey.
 */
function removeBackEdges(graph: CollapsedGraph): DirectedGraph
{
	const size = graph.successors.length;
	const color: Array<number> = Array.from({ length: size }, () => DFS_WHITE);
	const cursor: Array<number> = Array.from({ length: size }, () => 0);
	const backEdges: Set<string> = new Set();

	for (let start = 0; start < size; start++)
	{
		if (color[start] !== DFS_WHITE)
		{
			continue;
		}

		color[start] = DFS_GREY;
		const stack = [start];

		while (stack.length > 0)
		{
			const node = stack[stack.length - 1];
			const children = graph.successors[node];

			if (cursor[node] >= children.length)
			{
				color[node] = DFS_BLACK;
				stack.pop();

				continue;
			}

			const child = children[cursor[node]];
			cursor[node]++;

			if (color[child] === DFS_GREY)
			{
				backEdges.add(`${node}>${child}`);
			}
			else if (color[child] === DFS_WHITE)
			{
				color[child] = DFS_GREY;
				stack.push(child);
			}
		}
	}

	const successors = createLists(size);
	const predecessors = createLists(size);

	for (let node = 0; node < size; node++)
	{
		for (const child of graph.successors[node])
		{
			if (!backEdges.has(`${node}>${child}`))
			{
				successors[node].push(child);
				predecessors[child].push(node);
			}
		}
	}

	return { successors, predecessors };
}

/** Longest path ranking: a node sits one step behind its deepest predecessor. */
function assignRanks(dag: DirectedGraph): number[]
{
	const size = dag.successors.length;
	const ranks: Array<number> = Array.from({ length: size }, () => 0);
	const pending = dag.predecessors.map((list) => list.length);
	const queue: number[] = [];

	for (let node = 0; node < size; node++)
	{
		if (pending[node] === 0)
		{
			queue.push(node);
		}
	}

	for (let head = 0; head < queue.length; head++)
	{
		const node = queue[head];

		for (const child of dag.successors[node])
		{
			ranks[child] = Math.max(ranks[child], ranks[node] + 1);
			pending[child]--;

			if (pending[child] === 0)
			{
				queue.push(child);
			}
		}
	}

	return ranks;
}

function placeComponent(
	members: $ReadOnlyArray<number>,
	ranks: $ReadOnlyArray<number>,
	dag: DirectedGraph,
	groups: $ReadOnlyArray<PlacementGroup>,
	satellites: Satellites,
): Fallible<ComponentBox>
{
	const rows = buildRows(members, ranks);
	orderRows(rows, dag);

	const offsetByGroup: Map<number, Point> = new Map();
	let x = 0;
	let width = 0;
	let height = 0;

	for (const row of rows)
	{
		if (row.length === 0)
		{
			continue;
		}

		let y = 0;
		let rowWidth = 0;

		for (const member of row)
		{
			const bounds = groups[member].bounds;
			offsetByGroup.set(member, { x, y });

			const band = placeSatellites(member, x, y + bounds.height + ROW_GAP, groups, satellites, offsetByGroup);

			y += bounds.height + band.height + ROW_GAP;
			rowWidth = Math.max(rowWidth, bounds.width, band.width);
		}

		height = Math.max(height, y - ROW_GAP);
		width = x + rowWidth;
		x += rowWidth + RANK_GAP;
	}

	if (!isSafeLayoutValue(width) || !isSafeLayoutValue(height))
	{
		return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
	}

	return succeed({ width, height, offsetByGroup });
}

/**
 * Hangs the tools of one group in a row right under it, at the vertical gap of a rank and at the
 * horizontal gap between ranks, and reports the band they take. The row starts at the left border of
 * the owner, so every offset stays inside the component box and the packing keeps components apart.
 */
function placeSatellites(
	host: number,
	x: number,
	top: number,
	groups: $ReadOnlyArray<PlacementGroup>,
	satellites: Satellites,
	offsetByGroup: Map<number, Point>,
): Band
{
	const attached = satellites.groupsByHost.get(host);

	if (!attached)
	{
		return { width: 0, height: 0 };
	}

	let cursor = x;
	let height = 0;

	for (const satellite of attached)
	{
		const bounds = groups[satellite].bounds;

		offsetByGroup.set(satellite, { x: cursor, y: top });
		cursor += bounds.width + RANK_GAP;
		height = Math.max(height, bounds.height);
	}

	return { width: cursor - x - RANK_GAP, height: height + ROW_GAP };
}

/** One row per rank of the component; every rank between the first and the last one is occupied. */
function buildRows(members: $ReadOnlyArray<number>, ranks: $ReadOnlyArray<number>): number[][]
{
	let minRank = Number.POSITIVE_INFINITY;
	let maxRank = Number.NEGATIVE_INFINITY;

	for (const member of members)
	{
		minRank = Math.min(minRank, ranks[member]);
		maxRank = Math.max(maxRank, ranks[member]);
	}

	const rows = createLists(maxRank - minRank + 1);

	for (const member of members)
	{
		rows[ranks[member] - minRank].push(member);
	}

	return rows;
}

/**
 * Fixed-pass barycentric ordering: two sweeps towards the predecessors, then two towards the
 * successors. A node without neighbours in the reference direction keeps its slot, and equal
 * barycenters are always resolved by the placement-group index.
 */
function orderRows(rows: number[][], dag: DirectedGraph): void
{
	const slots: Map<number, number> = new Map();

	for (const row of rows)
	{
		row.sort(byNumber);
		indexSlots(row, slots);
	}

	for (let pass = 0; pass < ORDERING_PASSES; pass++)
	{
		for (let row = 1; row < rows.length; row++)
		{
			sortByBarycenter(rows[row], dag.predecessors, slots);
		}
	}

	for (let pass = 0; pass < ORDERING_PASSES; pass++)
	{
		for (let row = rows.length - 2; row >= 0; row--)
		{
			sortByBarycenter(rows[row], dag.successors, slots);
		}
	}
}

function sortByBarycenter(row: number[], adjacency: number[][], slots: Map<number, number>): void
{
	const barycenters: Map<number, number> = new Map();

	for (const node of row)
	{
		let sum = 0;
		let count = 0;

		for (const neighbour of adjacency[node])
		{
			const slot = slots.get(neighbour);

			if (slot !== undefined)
			{
				sum += slot;
				count++;
			}
		}

		barycenters.set(node, count === 0 ? (slots.get(node) ?? 0) : sum / count);
	}

	row.sort((left, right) => {
		const shift = (barycenters.get(left) ?? 0) - (barycenters.get(right) ?? 0);

		return shift === 0 ? left - right : shift;
	});

	indexSlots(row, slots);
}

function indexSlots(row: $ReadOnlyArray<number>, slots: Map<number, number>): void
{
	for (const [slot, node] of row.entries())
	{
		slots.set(node, slot);
	}
}

/**
 * Packs the component boxes into stable shelves and anchors the result at the original visual top
 * left corner of the diagram, so an arranged diagram stays where the author put it.
 *
 * The anchor reads the ranked groups only. A satellite ends up wherever its owner leads it, so
 * letting it set the corner would move the whole diagram on the first run and again on the second.
 */
function buildDeltas(
	groups: $ReadOnlyArray<PlacementGroup>,
	boxes: $ReadOnlyArray<ComponentBox>,
	satellites: Satellites,
): Fallible<Map<number, GroupDelta>>
{
	const origins = packComponents(boxes);
	if (!origins.ok)
	{
		return origins;
	}

	let anchorX = Number.POSITIVE_INFINITY;
	let anchorY = Number.POSITIVE_INFINITY;

	for (const group of groups)
	{
		if (satellites.hostByGroup.has(group.index))
		{
			continue;
		}

		anchorX = Math.min(anchorX, group.bounds.x);
		anchorY = Math.min(anchorY, group.bounds.y);
	}

	const deltas: Map<number, GroupDelta> = new Map();

	for (const [component, box] of boxes.entries())
	{
		const origin = origins.value[component];

		for (const [member, offset] of box.offsetByGroup)
		{
			const dx = anchorX + origin.x + offset.x - groups[member].bounds.x;
			const dy = anchorY + origin.y + offset.y - groups[member].bounds.y;

			if (!isSafeLayoutValue(dx) || !isSafeLayoutValue(dy))
			{
				return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
			}

			deltas.set(member, { dx, dy });
		}
	}

	return succeed(deltas);
}

function packComponents(boxes: $ReadOnlyArray<ComponentBox>): Fallible<Point[]>
{
	let area = 0;
	let widest = 0;

	for (const box of boxes)
	{
		area += box.width * box.height;
		widest = Math.max(widest, box.width);
	}

	const shelfWidth = Math.max(widest, Math.sqrt(area * PACKING_RATIO));
	if (!isSafeLayoutValue(shelfWidth))
	{
		return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
	}

	const origins: Point[] = [];
	let x = 0;
	let y = 0;
	let shelfHeight = 0;

	for (const box of boxes)
	{
		if (x > 0 && x + box.width > shelfWidth)
		{
			y += shelfHeight + COMPONENT_GAP_Y;
			x = 0;
			shelfHeight = 0;
		}

		if (!isSafeLayoutValue(x) || !isSafeLayoutValue(y))
		{
			return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
		}

		origins.push({ x, y });
		x += box.width + COMPONENT_GAP_X;
		shelfHeight = Math.max(shelfHeight, box.height);
	}

	return succeed(origins);
}

/**
 * Rejects the outcome as a whole when the layout creates an overlap of independent groups. A pair
 * that already overlapped in the input is left alone: a diagram may come in with blocks on top of
 * each other, and an untouched pair must not fail a layout that never moved it.
 *
 * Any created overlap involving a rigid group is reported as `invalid-frame` - a frame capturing a
 * foreign block and two frames crossing are both special cases of it; everything else is a plain
 * `group-overlap`.
 *
 * Candidate pairs come from a sweep line rather than from every pair: the rectangles are ordered by
 * their leading border along one axis, and a rectangle leaves the sweep as soon as its trailing
 * border is behind the current leading one. The verdict itself is still `overlaps` on the same two
 * rectangles, so the sweep only decides what is worth asking about. Of the pairs that do violate,
 * the reported one is the smallest by placement-group index - the very pair the plain scan reached
 * first - so the reason the user sees does not depend on the order of the traversal.
 */
function validatePlacement(
	groups: $ReadOnlyArray<PlacementGroup>,
	deltas: $ReadOnlyMap<number, GroupDelta>,
	movedGroups: $ReadOnlySet<number>,
): LayoutRejectedReason | null
{
	const placed = groups.map((group) => (
		movedGroups.has(group.index) ? shiftRect(group.bounds, deltas.get(group.index)) : group.bounds
	));

	const alongX = spreadsWiderAlongX(placed);
	const lead = placed.map((rect) => (alongX ? rect.x : rect.y));
	const trail = placed.map((rect) => (alongX ? rect.x + rect.width : rect.y + rect.height));
	const order = [...placed.keys()].sort((left, right) => (lead[left] - lead[right]) || (left - right));

	let rejectedFirst = -1;
	let rejectedSecond = -1;
	const active: number[] = [];

	for (const current of order)
	{
		let kept = 0;

		for (const other of active)
		{
			if (trail[other] - lead[current] <= POSITION_EPSILON)
			{
				continue;
			}

			active[kept] = other;
			kept++;

			const first = other < current ? other : current;
			const second = other < current ? current : other;

			if (rejectedFirst !== -1 && !precedes(first, second, rejectedFirst, rejectedSecond))
			{
				continue;
			}

			const touched = movedGroups.has(groups[first].index) || movedGroups.has(groups[second].index);

			if (!touched || !overlaps(placed[first], placed[second]))
			{
				continue;
			}

			if (overlaps(groups[first].bounds, groups[second].bounds))
			{
				continue;
			}

			rejectedFirst = first;
			rejectedSecond = second;
		}

		active.length = kept;
		active.push(current);
	}

	if (rejectedFirst === -1)
	{
		return null;
	}

	return groups[rejectedFirst].frameId !== null || groups[rejectedSecond].frameId !== null
		? LAYOUT_REJECTED_REASON.invalidFrame
		: LAYOUT_REJECTED_REASON.groupOverlap;
}

/**
 * Sweep axis: the one along which the rectangles are spread the widest relative to their own size.
 * Along the other one they may all share a coordinate - an alignment leaves them exactly there -
 * and every rectangle would then stay on the sweep at once.
 */
function spreadsWiderAlongX(placed: $ReadOnlyArray<LayoutRect>): boolean
{
	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	let totalWidth = 0;
	let totalHeight = 0;

	for (const rect of placed)
	{
		minX = Math.min(minX, rect.x);
		maxX = Math.max(maxX, rect.x + rect.width);
		minY = Math.min(minY, rect.y);
		maxY = Math.max(maxY, rect.y + rect.height);
		totalWidth += rect.width;
		totalHeight += rect.height;
	}

	return occupancy(totalWidth, maxX - minX) <= occupancy(totalHeight, maxY - minY);
}

/** How many times the rectangles cover their own extent along an axis; the lower, the better. */
function occupancy(total: number, span: number): number
{
	return span > 0 ? total / span : Number.POSITIVE_INFINITY;
}

/** Lexicographic order of a reported pair: the plain scan always met the smallest one first. */
function precedes(first: number, second: number, otherFirst: number, otherSecond: number): boolean
{
	return first < otherFirst || (first === otherFirst && second < otherSecond);
}

/** Touching along a border is allowed; only an intersection wider than the epsilon counts. */
function overlaps(first: LayoutRect, second: LayoutRect): boolean
{
	const width = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
	const height = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);

	return width > POSITION_EPSILON && height > POSITION_EPSILON;
}

function shiftRect(rect: LayoutRect, delta: GroupDelta | void): LayoutRect
{
	if (!delta)
	{
		return rect;
	}

	return { x: rect.x + delta.dx, y: rect.y + delta.dy, width: rect.width, height: rect.height };
}

function createLists(size: number): number[][]
{
	const lists: number[][] = [];

	for (let index = 0; index < size; index++)
	{
		lists.push([]);
	}

	return lists;
}

function byNumber(left: number, right: number): number
{
	return left - right;
}

function succeed<T>(value: T): Fallible<T>
{
	return { ok: true, value };
}

function fail<T>(reason: LayoutRejectedReason): Fallible<T>
{
	return { ok: false, reason };
}
