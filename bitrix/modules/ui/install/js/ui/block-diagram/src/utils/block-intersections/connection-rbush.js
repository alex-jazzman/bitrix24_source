import { toValue } from 'ui.vue3';
import RBush from '../../lib/r-bush/r-bush';
import { CONNECTION_OFFSET, CONNECTION_BEND_OFFSET, CONNECTION_BORDER_RADIUS } from '../../constants';
import { type DiagramBlock, type DiagramBlockId, type DiagramConnection } from '../../types';

type BBox = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

// A connection item carrying its own routing-aware bounding box, so toBBox stays
// self-contained (like BlockRBush reads position/dimensions off the block).
export type ConnectionBBoxItem = DiagramConnection & BBox;

export type GetBlockById = (blockId: DiagramBlockId) => DiagramBlock | null;

// Routing parameters of a single connection, taken from state refs (not constants),
// so the box matches the geometry actually produced in connection-state.js. The two
// firstSegmentSize values are the real per-endpoint first-segment lengths (many-port
// count * offset, or single-port (index + 1) * offset), resolved the same way drawing
// resolves them (connection-state.js:75-140).
export type ConnectionRoutingParams = {
	offset: number;
	bendOffset: number;
	borderRadius: number;
	secondSegmentOrder: number;
	sourceFirstSegmentSize: number;
	targetFirstSegmentSize: number;
	sourceSecondSegmentSize: number;
	targetSecondSegmentSize: number;
};

// Safe minimum padding used when runtime routing values are unavailable. Equals the
// single-connection extent (offset + borderRadius + one bend), the same 70px the box
// used before routing params were threaded in.
export const CONNECTION_ROUTE_PADDING = CONNECTION_OFFSET + CONNECTION_BEND_OFFSET + CONNECTION_BORDER_RADIUS;

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
function resolveRoutePadding(routing: ConnectionRoutingParams | null): number
{
	if (routing === null)
	{
		return CONNECTION_ROUTE_PADDING;
	}

	const { offset, bendOffset, borderRadius, secondSegmentOrder } = routing;

	if (!Number.isFinite(offset) || !Number.isFinite(bendOffset) || !Number.isFinite(borderRadius))
	{
		return CONNECTION_ROUTE_PADDING;
	}

	const order = Number.isFinite(secondSegmentOrder) ? Math.max(secondSegmentOrder, 0) : 0;
	const sourceFirstSegmentSize = Number.isFinite(routing.sourceFirstSegmentSize)
		? Math.max(routing.sourceFirstSegmentSize, 0)
		: 0;
	const targetFirstSegmentSize = Number.isFinite(routing.targetFirstSegmentSize)
		? Math.max(routing.targetFirstSegmentSize, 0)
		: 0;
	const sourceSecondSegmentSize = Number.isFinite(routing.sourceSecondSegmentSize)
		? Math.max(routing.sourceSecondSegmentSize, 0)
		: 0;
	const targetSecondSegmentSize = Number.isFinite(routing.targetSecondSegmentSize)
		? Math.max(routing.targetSecondSegmentSize, 0)
		: 0;

	return Math.max(
		sourceFirstSegmentSize,
		targetFirstSegmentSize,
		sourceSecondSegmentSize,
		targetSecondSegmentSize,
		offset + bendOffset * (order + 1),
	) + borderRadius;
}

/**
 * Both ends of the connection resolve to a block of the model. This is the admission rule of
 * the connection index — a connection failing it has no route to draw — so every other set of
 * connections shown on the canvas is held to the same rule.
 */
export function hasBothEndpointsInModel(
	connection: DiagramConnection,
	getBlockById: GetBlockById,
): boolean
{
	return getBlockById(connection.sourceBlockId) !== null
		&& getBlockById(connection.targetBlockId) !== null;
}

/**
 * ALG-02: box of a connection = union of its endpoint block boxes (taken from the
 * MODEL position/dimensions), expanded by the routing padding. When routing params are
 * given the padding follows the real geometry; otherwise it falls back to the safe
 * minimum. Returns null when an endpoint block is absent from the model — such a
 * connection is left out of the index.
 */
export function computeConnectionBBox(
	connection: DiagramConnection,
	getBlockById: GetBlockById,
	routing: ConnectionRoutingParams | null = null,
): BBox | null
{
	if (!hasBothEndpointsInModel(connection, getBlockById))
	{
		return null;
	}

	const src = getBlockById(connection.sourceBlockId);
	const tgt = getBlockById(connection.targetBlockId);

	const srcPosition = toValue(src.position);
	const srcDimensions = toValue(src.dimensions);
	const tgtPosition = toValue(tgt.position);
	const tgtDimensions = toValue(tgt.dimensions);

	const minX = Math.min(srcPosition.x, tgtPosition.x);
	const minY = Math.min(srcPosition.y, tgtPosition.y);
	const maxX = Math.max(srcPosition.x + srcDimensions.width, tgtPosition.x + tgtDimensions.width);
	const maxY = Math.max(srcPosition.y + srcDimensions.height, tgtPosition.y + tgtDimensions.height);

	const padding = resolveRoutePadding(routing);

	return {
		minX: minX - padding,
		minY: minY - padding,
		maxX: maxX + padding,
		maxY: maxY + padding,
	};
}

export class ConnectionRBush extends RBush
{
	toBBox({ minX, minY, maxX, maxY }: ConnectionBBoxItem): BBox
	{
		return { minX, minY, maxX, maxY };
	}

	compareMinX(a: ConnectionBBoxItem, b: ConnectionBBoxItem): number
	{
		return a.minX - b.minX;
	}

	compareMinY(a: ConnectionBBoxItem, b: ConnectionBBoxItem): number
	{
		return a.minY - b.minY;
	}
}
