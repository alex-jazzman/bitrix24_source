/**
 * Builds the immutable snapshot read by the automatic diagram layout.
 *
 * The graph is untrusted - it comes from the server or from an import - so no identifier from the
 * input ever becomes an object key: every index is a Map or a Set. The module is pure: no DOM, no
 * store, no canvas, no exceptions. Any failure comes back as a rejected result with a static code.
 */

import { Type } from 'main.core';

import { BLOCK_TYPES, PORT_TYPES } from '../../../shared/constants';
import type { Block, BlockId, Connection, Port, PortId } from '../../../shared/types';
import { LAYOUT_REJECTED_REASON, LAYOUT_STATUS, isSafeLayoutValue, layoutRejected } from '../model/types';
import type {
	LayoutBlock,
	LayoutEdge,
	LayoutRect,
	LayoutRejectedReason,
	LayoutSnapshot,
	LayoutSnapshotResult,
	MeasuredBlocksGeometry,
	PlacementGroup,
} from '../model/types';

/** The trigger switcher is drawn to the left of the block box (block-diagram.js SWITCHER_WIDTH). */
const TRIGGER_LEFT_OVERHANG = 17;

const SWITCH_NODE_ACTIVITY = 'SwitchNode';
const SETUP_TEMPLATE_ACTIVITY = 'SetupTemplateActivity';
const AUX_CONNECTION_TYPE = 'aux';

/**
 * Rendered sizes of the block widgets, used when a block has no measurement yet. Mirrors
 * block-simple/trigger/tool (300x58), block-operator and block-service, which declare their size
 * inline instead of sharing a constant. Every value a widget declares is checked against this table
 * by diagram-layout-snapshot.test.ts, so the two cannot drift apart silently.
 *
 * The height of a complex node is derived rather than mirrored: block-complex declares no height at
 * all, its content builds one. So the table carries an upper bound of the drawn box instead - a box
 * shorter than the drawn one would let the layout pass an overlap as valid.
 */
const FALLBACK = Object.freeze({
	simpleWidth: 300,
	simpleHeight: 58,
	operatorWidth: 180,
	operatorBaseHeight: 58,
	operatorRowHeight: 36,
	complexWidth: 260,
	/**
	 * Covers the drawn chrome of a complex node, the optional relation section included: whether the
	 * section is drawn depends on server-owned availability the block model does not carry, and the
	 * fallback box has to stay an upper bound of the drawn one either way.
	 */
	complexBaseHeight: 122,
	complexRowHeight: 60,
	switchNodeWidth: 180,
	switchNodeMinRows: 3,
	/** block-complex.js MIN_RULE_ITEMS_COUNT: both rule columns always draw at least five rows. */
	complexMinRows: 5,
	serviceWidth: 260,
	serviceHeight: 96,
	setupTemplateServiceHeight: 162,
});

/**
 * Type-only sizes of the frame hit-test, independent of the port and rule counts. Mirrors
 * AgentBlockGeometry::hitTestSizeForType, so membership derived here matches the server.
 */
const HIT_TEST_SIZE = Object.freeze({
	simple: Object.freeze({ width: 300, height: 58 }),
	operators: Object.freeze({ width: 180, height: 58 }),
	complex: Object.freeze({ width: 260, height: 60 }),
	switchNode: Object.freeze({ width: 180, height: 60 }),
});

/**
 * Separator of the deduplication key of a connection, with its own escape character. The four
 * identifiers are untrusted, so a part carrying the separator is escaped instead of being trusted
 * not to carry it; only such a part pays for the escaping pass.
 */
const EDGE_KEY_SEPARATOR = '|';
const EDGE_KEY_ESCAPE = '\\';
const EDGE_KEY_ESCAPABLE = /[\\|]/g;

/** Main-flow port pairs (validate-connection-rules.js), without the aux and the reverse ones. */
const PRIMARY_TARGET_PORT_TYPES = new Map([
	[PORT_TYPES.output, new Set([PORT_TYPES.input, PORT_TYPES.inputRelation])],
	[PORT_TYPES.outputRelation, new Set([PORT_TYPES.inputRelation])],
]);

type Size = { +width: number, +height: number };

type IndexedBlock = {
	+block: Block,
	+index: number,
	+ports: Map<PortId, Port>,
};

type PlacedBlock = {
	+entry: IndexedBlock,
	+rect: LayoutRect,
};

type ValidatedEdges = {
	+all: LayoutEdge[],
	+primary: LayoutEdge[],
	+aux: LayoutEdge[],
};

type FrameMembership = {
	+frameIdByBlockId: Map<BlockId, BlockId>,
	+memberIdsByFrameId: Map<BlockId, BlockId[]>,
};

type ComposedBlocks = {
	+blocks: LayoutBlock[],
	+blockById: Map<BlockId, LayoutBlock>,
};

type GroupedBlocks = {
	+groups: PlacementGroup[],
	+groupByBlockId: Map<BlockId, PlacementGroup>,
};

type Fallible<T> =
	| { +ok: true, +value: T }
	| { +ok: false, +reason: LayoutRejectedReason };

/**
 * Validates the model and derives everything the automatic layout needs from it. Any unexpected
 * input rejects the whole layout.
 */
export function buildLayoutSnapshot(
	blocks: $ReadOnlyArray<Block>,
	connections: $ReadOnlyArray<Connection>,
	geometry: MeasuredBlocksGeometry | null | void,
): LayoutSnapshotResult
{
	const indexed = indexBlocks(blocks);
	if (!indexed.ok)
	{
		return layoutRejected(indexed.reason);
	}

	const edges = buildEdges(connections, indexed.value);
	if (!edges.ok)
	{
		return layoutRejected(edges.reason);
	}

	const placed = placeBlocks(indexed.value, geometry);
	if (!placed.ok)
	{
		return layoutRejected(placed.reason);
	}

	const membership = deriveFrameMembership(placed.value);
	if (!membership.ok)
	{
		return layoutRejected(membership.reason);
	}

	const composed = composeBlocks(placed.value, membership.value.frameIdByBlockId);
	const grouped = buildGroups(composed, membership.value.memberIdsByFrameId);
	if (!grouped.ok)
	{
		return layoutRejected(grouped.reason);
	}

	const snapshot: LayoutSnapshot = {
		blocks: Object.freeze(composed.blocks),
		blockById: composed.blockById,
		groups: Object.freeze(grouped.value.groups),
		groupByBlockId: grouped.value.groupByBlockId,
		edges: Object.freeze(edges.value.all),
		primaryEdges: Object.freeze(edges.value.primary),
		auxEdges: Object.freeze(edges.value.aux),
	};

	return Object.freeze({ status: LAYOUT_STATUS.ok, snapshot: Object.freeze(snapshot) });
}

function indexBlocks(blocks: $ReadOnlyArray<Block>): Fallible<Map<BlockId, IndexedBlock>>
{
	if (!Array.isArray(blocks))
	{
		return fail(LAYOUT_REJECTED_REASON.invalidGraph);
	}

	const index: Map<BlockId, IndexedBlock> = new Map();

	for (const [order, block] of blocks.entries())
	{
		if (!isRecord(block) || !isFilledString(block.id) || !isFilledString(block.type) || index.has(block.id))
		{
			return fail(LAYOUT_REJECTED_REASON.invalidGraph);
		}

		if (!isRecord(block.position) || !isSafeLayoutValue(block.position.x) || !isSafeLayoutValue(block.position.y))
		{
			return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
		}

		const ports = indexPorts(block);
		if (!ports.ok)
		{
			return ports;
		}

		index.set(block.id, { block, index: order, ports: ports.value });
	}

	return succeed(index);
}

function indexPorts(block: Block): Fallible<Map<PortId, Port>>
{
	const ports: Map<PortId, Port> = new Map();

	if (block.ports === null || block.ports === undefined)
	{
		return succeed(ports);
	}

	if (!Array.isArray(block.ports))
	{
		return fail(LAYOUT_REJECTED_REASON.invalidGraph);
	}

	for (const port of block.ports)
	{
		if (!isRecord(port) || !isFilledString(port.id) || ports.has(port.id))
		{
			return fail(LAYOUT_REJECTED_REASON.invalidGraph);
		}

		ports.set(port.id, port);
	}

	return succeed(ports);
}

/** Edge identity is the source/target block and port quadruple; `connection.id` is not used. */
function buildEdges(
	connections: $ReadOnlyArray<Connection>,
	index: Map<BlockId, IndexedBlock>,
): Fallible<ValidatedEdges>
{
	if (!Array.isArray(connections))
	{
		return fail(LAYOUT_REJECTED_REASON.invalidGraph);
	}

	const all: LayoutEdge[] = [];
	const primary: LayoutEdge[] = [];
	const aux: LayoutEdge[] = [];
	const seen: Set<string> = new Set();

	for (const connection of connections)
	{
		if (!isRecord(connection))
		{
			return fail(LAYOUT_REJECTED_REASON.invalidGraph);
		}

		const { sourceBlockId, sourcePortId, targetBlockId, targetPortId } = connection;
		const source = index.get(sourceBlockId);
		const target = index.get(targetBlockId);
		const sourcePort = source?.ports.get(sourcePortId);
		const targetPort = target?.ports.get(targetPortId);

		if (!source || !target || !sourcePort || !targetPort)
		{
			return fail(LAYOUT_REJECTED_REASON.invalidGraph);
		}

		const identity = edgeIdentity(sourceBlockId, sourcePortId, targetBlockId, targetPortId);
		if (seen.has(identity))
		{
			continue;
		}
		seen.add(identity);

		const edge = { sourceBlockId, sourcePortId, targetBlockId, targetPortId };
		all.push(edge);

		if (isPrimaryEdge(connection, sourcePort, targetPort))
		{
			primary.push(edge);
		}

		const attachment = auxAttachment(edge, sourcePort, targetPort);
		if (attachment !== null)
		{
			aux.push(attachment);
		}
	}

	return succeed({ all, primary, aux });
}

/** Identity of a connection: the four identifiers that make it, in one key no part can forge. */
function edgeIdentity(sourceBlockId: string, sourcePortId: string, targetBlockId: string, targetPortId: string): string
{
	return escapeEdgeKeyPart(sourceBlockId)
		+ EDGE_KEY_SEPARATOR + escapeEdgeKeyPart(sourcePortId)
		+ EDGE_KEY_SEPARATOR + escapeEdgeKeyPart(targetBlockId)
		+ EDGE_KEY_SEPARATOR + escapeEdgeKeyPart(targetPortId);
}

function escapeEdgeKeyPart(value: string): string
{
	if (!value.includes(EDGE_KEY_SEPARATOR) && !value.includes(EDGE_KEY_ESCAPE))
	{
		return value;
	}

	return value.replace(EDGE_KEY_ESCAPABLE, `${EDGE_KEY_ESCAPE}$&`);
}

function isPrimaryEdge(connection: Connection, sourcePort: Port, targetPort: Port): boolean
{
	if (connection.type === AUX_CONNECTION_TYPE || connection.sourceBlockId === connection.targetBlockId)
	{
		return false;
	}

	if (sourcePort.isActive === false || targetPort.isActive === false)
	{
		return false;
	}

	return PRIMARY_TARGET_PORT_TYPES.get(sourcePort.type)?.has(targetPort.type) ?? false;
}

/**
 * A tool attachment reduced to one direction: the `aux` port always belongs to the owner and the
 * `topAux` one to the tool (validate-connection-rules.js `validationAuxRule`), so an edge stored the
 * other way round is turned over here instead of being read twice later.
 */
function auxAttachment(edge: LayoutEdge, sourcePort: Port, targetPort: Port): LayoutEdge | null
{
	if (edge.sourceBlockId === edge.targetBlockId || sourcePort.isActive === false || targetPort.isActive === false)
	{
		return null;
	}

	if (sourcePort.type === PORT_TYPES.aux && targetPort.type === PORT_TYPES.topAux)
	{
		return edge;
	}

	if (sourcePort.type === PORT_TYPES.topAux && targetPort.type === PORT_TYPES.aux)
	{
		return {
			sourceBlockId: edge.targetBlockId,
			sourcePortId: edge.targetPortId,
			targetBlockId: edge.sourceBlockId,
			targetPortId: edge.sourcePortId,
		};
	}

	return null;
}

function placeBlocks(
	index: Map<BlockId, IndexedBlock>,
	geometry: MeasuredBlocksGeometry | null | void,
): Fallible<PlacedBlock[]>
{
	const measured = copyMeasuredSizes(geometry, index);
	const placed: PlacedBlock[] = [];

	for (const [id, entry] of index)
	{
		const size = resolveSize(entry, measured.get(id));
		if (!size.ok)
		{
			return size;
		}

		const rect = toVisualRect(entry.block, size.value);
		if (!isSafeRect(rect))
		{
			return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
		}

		placed.push({ entry, rect });
	}

	return succeed(placed);
}

/**
 * Own measured sizes of known blocks. The stored `x`/`y` are deliberately ignored: a block moved
 * while off screen keeps a stale measured position, whereas its model position is always current.
 */
function copyMeasuredSizes(
	geometry: MeasuredBlocksGeometry | null | void,
	index: Map<BlockId, IndexedBlock>,
): Map<BlockId, Size>
{
	const sizes: Map<BlockId, Size> = new Map();

	if (!isRecord(geometry))
	{
		return sizes;
	}

	for (const [blockId, rect] of Object.entries(geometry))
	{
		if (!index.has(blockId) || !isRecord(rect))
		{
			continue;
		}

		if (isPositiveSafeValue(rect.width) && isPositiveSafeValue(rect.height))
		{
			sizes.set(blockId, { width: rect.width, height: rect.height });
		}
	}

	return sizes;
}

function resolveSize(entry: IndexedBlock, measured: Size | void): Fallible<Size>
{
	if (entry.block.type === BLOCK_TYPES.FRAME)
	{
		return frameSize(entry.block);
	}

	if (measured)
	{
		return succeed(measured);
	}

	const fallback = fallbackSize(entry);

	return fallback === null ? fail(LAYOUT_REJECTED_REASON.invalidGraph) : succeed(fallback);
}

/** A frame keeps the size it was resized to; it is never measured and never recomputed. */
function frameSize(block: Block): Fallible<Size>
{
	const dimensions = block.dimensions;

	if (!isRecord(dimensions) || !isPositiveSafeValue(dimensions.width) || !isPositiveSafeValue(dimensions.height))
	{
		return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
	}

	return succeed({ width: dimensions.width, height: dimensions.height });
}

function fallbackSize(entry: IndexedBlock): Size | null
{
	const { block } = entry;

	if (block.type === BLOCK_TYPES.SIMPLE || block.type === BLOCK_TYPES.TRIGGER || block.type === BLOCK_TYPES.TOOL)
	{
		return { width: FALLBACK.simpleWidth, height: FALLBACK.simpleHeight };
	}

	if (block.type === BLOCK_TYPES.OPERATORS)
	{
		const rows = Math.max(countPorts(entry, PORT_TYPES.input), countPorts(entry, PORT_TYPES.output));

		return {
			width: FALLBACK.operatorWidth,
			height: FALLBACK.operatorBaseHeight + Math.max(0, rows - 1) * FALLBACK.operatorRowHeight,
		};
	}

	if (block.type === BLOCK_TYPES.COMPLEX)
	{
		return complexSize(entry);
	}

	if (block.type === BLOCK_TYPES.SERVICES)
	{
		// A service is always drawn at a fixed width, unlike a complex node: block-service.js passes
		// the literal to BlockContainer and never reads `dimensions`, which a block still carries from
		// the catalog. Reading the stored width here would describe a box the canvas does not draw.
		return {
			width: FALLBACK.serviceWidth,
			height: block.activity?.Type === SETUP_TEMPLATE_ACTIVITY
				? FALLBACK.setupTemplateServiceHeight
				: FALLBACK.serviceHeight,
		};
	}

	return null;
}

/**
 * Both rule columns of a complex node are always drawn, so the taller one sets the height, and
 * neither ever falls below the minimum row count the widget reserves. Counting fewer rows than that
 * would place the boxes closer than they are drawn and let the layout pass an overlap as valid.
 */
function complexSize(entry: IndexedBlock): Size
{
	const switchNode = isSwitchNode(entry.block);
	const rows = Math.max(
		countPorts(entry, PORT_TYPES.output),
		countPorts(entry, PORT_TYPES.input),
		switchNode ? FALLBACK.switchNodeMinRows : FALLBACK.complexMinRows,
	);

	return {
		width: complexWidth(entry.block, switchNode),
		height: FALLBACK.complexBaseHeight + rows * FALLBACK.complexRowHeight,
	};
}

function complexWidth(block: Block, switchNode: boolean): number
{
	if (switchNode)
	{
		return FALLBACK.switchNodeWidth;
	}

	const dimensions = block.dimensions;

	return isRecord(dimensions) && isPositiveSafeValue(dimensions.width) ? dimensions.width : FALLBACK.complexWidth;
}

function countPorts(entry: IndexedBlock, type: string): number
{
	let count = 0;

	for (const port of entry.ports.values())
	{
		if (port.type === type)
		{
			count++;
		}
	}

	return count;
}

function toVisualRect(block: Block, size: Size): LayoutRect
{
	const overhang = block.type === BLOCK_TYPES.TRIGGER ? TRIGGER_LEFT_OVERHANG : 0;

	return {
		x: block.position.x - overhang,
		y: block.position.y,
		width: size.width + overhang,
		height: size.height,
	};
}

/**
 * Membership mirrors the server hit-test: coordinates are truncated the way PHP casts to int, the
 * centre comes from the type-only base size and the frame boundary counts as inside.
 *
 * What the members are to each other is not asked. A frame is an annotation the author draws over a
 * region of the canvas, so it may hold several unrelated flows or nothing at all, and neither makes
 * the grouping undecidable. Only an undecidable one is refused: a block claimed by two frames.
 *
 * Both passes over the frames are plain nested loops - every frame against every other one, then
 * every block against every frame. A frame is drawn by hand over a region of the canvas, so their
 * number stays in the units and an interval index over them would cost more than it saves.
 */
function deriveFrameMembership(placed: $ReadOnlyArray<PlacedBlock>): Fallible<FrameMembership>
{
	const boxes = collectFrameBoxes(placed);
	if (!boxes.ok)
	{
		return boxes;
	}

	const violation = validateFrames(boxes.value);
	if (violation !== null)
	{
		return fail(violation);
	}

	const frameIdByBlockId: Map<BlockId, BlockId> = new Map();
	const memberIdsByFrameId: Map<BlockId, BlockId[]> = new Map();

	for (const frameId of boxes.value.keys())
	{
		memberIdsByFrameId.set(frameId, []);
	}

	for (const { entry } of placed)
	{
		if (entry.block.type === BLOCK_TYPES.FRAME)
		{
			continue;
		}

		const owner = findOwningFrame(entry, boxes.value);
		if (!owner.ok)
		{
			return owner;
		}

		if (owner.value !== null)
		{
			frameIdByBlockId.set(entry.block.id, owner.value);
			memberIdsByFrameId.get(owner.value)?.push(entry.block.id);
		}
	}

	return succeed({ frameIdByBlockId, memberIdsByFrameId });
}

function collectFrameBoxes(placed: $ReadOnlyArray<PlacedBlock>): Fallible<Map<BlockId, LayoutRect>>
{
	const boxes: Map<BlockId, LayoutRect> = new Map();

	for (const { entry } of placed)
	{
		if (entry.block.type !== BLOCK_TYPES.FRAME)
		{
			continue;
		}

		const size = frameSize(entry.block);
		if (!size.ok)
		{
			return size;
		}

		boxes.set(entry.block.id, {
			x: Math.trunc(entry.block.position.x),
			y: Math.trunc(entry.block.position.y),
			width: Math.trunc(size.value.width),
			height: Math.trunc(size.value.height),
		});
	}

	return succeed(boxes);
}

function findOwningFrame(entry: IndexedBlock, boxes: Map<BlockId, LayoutRect>): Fallible<BlockId | null>
{
	const size = hitTestSize(entry.block);
	const centerX = Math.trunc(entry.block.position.x) + Math.trunc(size.width / 2);
	const centerY = Math.trunc(entry.block.position.y) + Math.trunc(size.height / 2);

	let owner: BlockId | null = null;

	for (const [frameId, box] of boxes)
	{
		const inside = centerX >= box.x
			&& centerX <= box.x + box.width
			&& centerY >= box.y
			&& centerY <= box.y + box.height;

		if (!inside)
		{
			continue;
		}

		if (owner !== null)
		{
			return fail(LAYOUT_REJECTED_REASON.invalidFrame);
		}

		owner = frameId;
	}

	return succeed(owner);
}

function hitTestSize(block: Block): Size
{
	if (block.type === BLOCK_TYPES.COMPLEX)
	{
		return isSwitchNode(block) ? HIT_TEST_SIZE.switchNode : HIT_TEST_SIZE.complex;
	}

	return block.type === BLOCK_TYPES.OPERATORS ? HIT_TEST_SIZE.operators : HIT_TEST_SIZE.simple;
}

/** Two frames sharing area leave the membership of the blocks between them undecidable. */
function validateFrames(boxes: Map<BlockId, LayoutRect>): LayoutRejectedReason | null
{
	for (const frameId of boxes.keys())
	{
		if (overlapsAnotherFrame(frameId, boxes))
		{
			return LAYOUT_REJECTED_REASON.invalidFrame;
		}
	}

	return null;
}

/** Nesting and crossing are both a positive-area overlap; touching along a border is not. */
function overlapsAnotherFrame(frameId: BlockId, boxes: Map<BlockId, LayoutRect>): boolean
{
	const box = boxes.get(frameId);
	if (!box)
	{
		return false;
	}

	for (const [otherId, other] of boxes)
	{
		if (otherId === frameId)
		{
			continue;
		}

		const overlaps = box.x < other.x + other.width
			&& other.x < box.x + box.width
			&& box.y < other.y + other.height
			&& other.y < box.y + box.height;

		if (overlaps)
		{
			return true;
		}
	}

	return false;
}

function composeBlocks(placed: $ReadOnlyArray<PlacedBlock>, frameIdByBlockId: Map<BlockId, BlockId>): ComposedBlocks
{
	const blocks: LayoutBlock[] = [];
	const blockById: Map<BlockId, LayoutBlock> = new Map();

	for (const { entry, rect } of placed)
	{
		const layoutBlock: LayoutBlock = {
			id: entry.block.id,
			index: entry.index,
			type: entry.block.type,
			isFrame: entry.block.type === BLOCK_TYPES.FRAME,
			frameId: frameIdByBlockId.get(entry.block.id) ?? null,
			position: { x: entry.block.position.x, y: entry.block.position.y },
			rect,
		};

		blocks.push(layoutBlock);
		blockById.set(layoutBlock.id, layoutBlock);
	}

	return { blocks, blockById };
}

/**
 * One rigid group per frame and one per remaining block. The group index follows the model order of
 * its earliest block, so every later pass has a stable tiebreaker.
 */
function buildGroups(composed: ComposedBlocks, memberIdsByFrameId: Map<BlockId, BlockId[]>): Fallible<GroupedBlocks>
{
	const groups: PlacementGroup[] = [];
	const groupByBlockId: Map<BlockId, PlacementGroup> = new Map();

	for (const block of composed.blocks)
	{
		if (groupByBlockId.has(block.id))
		{
			continue;
		}

		const frameId = block.isFrame ? block.id : block.frameId;
		const blockIds = frameId === null
			? [block.id]
			: [frameId, ...(memberIdsByFrameId.get(frameId) ?? [])];

		const bounds = unionBounds(blockIds, composed.blockById);
		if (bounds === null)
		{
			return fail(LAYOUT_REJECTED_REASON.unsafeGeometry);
		}

		const group: PlacementGroup = { index: groups.length, frameId, blockIds, bounds };
		groups.push(group);

		for (const id of blockIds)
		{
			groupByBlockId.set(id, group);
		}
	}

	return succeed({ groups, groupByBlockId });
}

function unionBounds(blockIds: $ReadOnlyArray<BlockId>, blockById: Map<BlockId, LayoutBlock>): LayoutRect | null
{
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const id of blockIds)
	{
		const rect = blockById.get(id)?.rect;
		if (!rect)
		{
			return null;
		}

		minX = Math.min(minX, rect.x);
		minY = Math.min(minY, rect.y);
		maxX = Math.max(maxX, rect.x + rect.width);
		maxY = Math.max(maxY, rect.y + rect.height);
	}

	const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

	return isSafeRect(bounds) ? bounds : null;
}

function isSwitchNode(block: Block): boolean
{
	return block.activity?.Type === SWITCH_NODE_ACTIVITY;
}

function isRecord(value: mixed): boolean
{
	return Type.isObjectLike(value);
}

function isFilledString(value: mixed): boolean
{
	return Type.isStringFilled(value);
}

function isPositiveSafeValue(value: mixed): boolean
{
	return isSafeLayoutValue(value) && value > 0;
}

function isSafeRect(rect: LayoutRect): boolean
{
	return isSafeLayoutValue(rect.x)
		&& isSafeLayoutValue(rect.y)
		&& isPositiveSafeValue(rect.width)
		&& isPositiveSafeValue(rect.height)
		&& isSafeLayoutValue(rect.x + rect.width)
		&& isSafeLayoutValue(rect.y + rect.height);
}

function succeed<T>(value: T): Fallible<T>
{
	return { ok: true, value };
}

function fail<T>(reason: LayoutRejectedReason): Fallible<T>
{
	return { ok: false, reason };
}
