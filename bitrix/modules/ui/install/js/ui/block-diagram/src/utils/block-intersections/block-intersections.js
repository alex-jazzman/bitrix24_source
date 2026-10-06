import { toValue, ref, computed, toRaw, unref } from 'ui.vue3';
import { BlockRBush } from './block-rbush';
import { ConnectionRBush, computeConnectionBBox, hasBothEndpointsInModel } from './connection-rbush';
import { collectEndpointsToMeasure, takeFirstMeasureBatch } from './first-measure';
import {
	createConnectionRouteCacheKey,
	createConnectionStructuralSignature,
	distanceBetweenRectAndSegments,
	expandRect,
	flattenConnectionRoute,
	sortConnectionRouteHits,
} from '../connection-route-hit-test.ts';
import { resolveConnectionPortsPosition, resolveRenderedConnectionRoute } from '../connection-route.ts';
import {
	BLOCK_GROUP_DEFAULT_NAME,
	CONNECTION_GROUP_DEFAULT_NAME,
	FIRST_MEASURE_BATCH_SIZE,
} from '../../constants';
import {
	type ConnectionGroupNames,
	type DiagramBlock,
	type DiagramBlockGroupNames,
	type DiagramBlockId,
	type DiagramConnection,
	type DiagramConnectionRouteHit,
	type DiagramGroupedBlocks,
	type DiagramInstancesContext,
	type DiagramPortsMap,
	type DiagramSearchBlockRect,
	type GroupedConnections,
	type Point,
	type Rect,
	type State,
} from '../../types';

const CONNECTION_ROUTE_HIT_TOLERANCE = 12;

type ConnectionRouteSegment = {
	start: Point;
	end: Point;
};

type ConnectionRouteCacheEntry = {
	key: string;
	segments: ConnectionRouteSegment[];
};

export class BlockIntersections
{
	#tree: typeof BlockRBush | null = null;
	#connectionTree: typeof ConnectionRBush | null = null;
	#state: State | null = null;
	#selectVisibleBlocksRafId: number | null = null;
	#selectVisibleConnectionsRafId: number | null = null;
	#loadConnectionsRafId: number | null = null;
	#connectionRouteCache: Map<string, ConnectionRouteCacheEntry> = new Map();
	#interactingBlocksCache: Map<DiagramBlockId, DiagramBlock> = new Map();
	// Connections the running gesture keeps on the canvas, and the set of nodes they were derived
	// for. Null while nothing is derived.
	#gestureConnections: DiagramConnection[] | null = null;
	#gestureConnectionsHeldIds: Set<DiagramBlockId> | null = null;

	visibleBlocks: DiagramBlock[] = ref([]);

	visibleBlockIds: Set<string> = computed(() => {
		return new Set(toValue(this.visibleBlocks).map((block) => block.id));
	});

	// P3.T1: ends of viewport-crossing connections whose geometry was never measured.
	blocksToMeasureIds: Set<DiagramBlockId> = computed(() => {
		if (!(this.#state?.isRenderOptimizationAvailable ?? false))
		{
			return new Set();
		}

		return collectEndpointsToMeasure(
			toValue(this.visibleConnections),
			this.#state?.portsRectMap ?? {},
			this.#blockByIdMap(this.#state?.blocks ?? []),
		);
	});

	groupedVisibleBlocks: DiagramGroupedBlocks = computed(() => {
		const blocks = (this.#state?.isRenderOptimizationAvailable ?? false)
			? this.#visibleBlocksWithMeasureEndpoints()
			: this.#state?.blocks ?? [];

		return toValue(blocks)
			.reduce((acc, block) => {
				const type = block?.type ?? BLOCK_GROUP_DEFAULT_NAME;

				if (type in acc)
				{
					acc[type].push(block);
				}
				else
				{
					acc[type] = [block];
				}

				return acc;
			}, { [BLOCK_GROUP_DEFAULT_NAME]: [] });
	});

	visibleBlockGroupNames: DiagramBlockGroupNames = computed(() => {
		return Object.keys(toValue(this.groupedVisibleBlocks));
	});

	visiblePorts: DiagramPortsMap = computed(() => {
		const portsMap = new Map();

		for (const block of toValue(this.visibleBlocks))
		{
			for (const port of block.ports)
			{
				if (!portsMap.has(block.id))
				{
					portsMap.set(block.id, new Map());
				}

				portsMap.get(block.id).set(port.id, port);
			}
		}

		return portsMap;
	});

	visibleConnections: DiagramConnection[] = ref([]);

	groupedVisibleConnections: GroupedConnections = computed(() => {
		const connections = (this.#state?.isRenderOptimizationAvailable ?? false)
			? this.visibleConnections
			: this.#state?.connections ?? [];

		return toValue(connections)
			.reduce((acc, connection) => {
				const type = connection?.type ?? CONNECTION_GROUP_DEFAULT_NAME;

				if (type in acc)
				{
					acc[type].push(connection);
				}
				else
				{
					acc[type] = [connection];
				}

				return acc;
			}, { [CONNECTION_GROUP_DEFAULT_NAME]: [] });
	});

	visibleConnectionGroupNames: ConnectionGroupNames = computed(() => {
		return Object.keys(toValue(this.groupedVisibleConnections));
	});

	constructor(ctx: DiagramInstancesContext)
	{
		this.#state = ctx.state;
		this.#tree = new BlockRBush();
	}

	#shouldMaintainConnectionIndex(): boolean
	{
		return (this.#state?.isRenderOptimizationAvailable ?? false)
			|| (this.#state?.connectionRouteHitTestEnabled ?? false)
		;
	}

	#ensureConnectionTree(): typeof ConnectionRBush
	{
		this.#connectionTree ??= new ConnectionRBush();

		return this.#connectionTree;
	}

	#disableConnectionIndex(): void
	{
		if (this.#selectVisibleConnectionsRafId !== null)
		{
			cancelAnimationFrame(this.#selectVisibleConnectionsRafId);
			this.#selectVisibleConnectionsRafId = null;
		}

		if (this.#loadConnectionsRafId !== null)
		{
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
	#visibleBlocksWithMeasureEndpoints(): DiagramBlock[]
	{
		const visible = toValue(this.visibleBlocks);
		const measureIds = toValue(this.blocksToMeasureIds);

		if (measureIds.size === 0)
		{
			return visible;
		}

		const visibleIds = toValue(this.visibleBlockIds);
		const blockById = this.#blockByIdMap(this.#state?.blocks ?? []);
		const measureBlocks = takeFirstMeasureBatch(measureIds, visibleIds, blockById, FIRST_MEASURE_BATCH_SIZE);

		return measureBlocks.length === 0 ? visible : [...visible, ...measureBlocks];
	}

	// Builds an O(1) id→block lookup once per index rebuild, so connection boxes resolve
	// their endpoints in O(C + B) instead of O(C × B) (a linear blocks.find per connection).
	#blockByIdMap(blocks: DiagramBlock[]): Map<DiagramBlockId, DiagramBlock>
	{
		return new Map(
			toValue(blocks ?? []).map((block) => [toValue(block).id, block]),
		);
	}

	// Connection index items (connection + routing-aware bbox), skipping any connection
	// whose endpoint block is absent from the given lookup. Routing params come from the
	// live state refs so the box matches the geometry connection-state.js actually draws.
	#buildConnectionItems(
		connections: DiagramConnection[],
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): DiagramConnection[]
	{
		const offset = toValue(this.#state?.connectionOffset);
		const bendOffset = toValue(this.#state?.connectionBendOffset);
		const borderRadius = toValue(this.#state?.connectionBorderRadius);
		const offsetMap = toValue(this.#state?.connectionsOffsetMap) ?? {};

		const portsRectMap = toValue(this.#state?.portsRectMap) ?? {};

		return toValue(connections ?? [])
			.map((connection) => {
				const rawConnection = toRaw(unref(connection));
				const routing = {
					offset,
					bendOffset,
					borderRadius,
					secondSegmentOrder: this.#connectionSecondSegmentOrder(rawConnection, offsetMap),
					sourceFirstSegmentSize: this.#endpointFirstSegmentSize(
						rawConnection.sourceBlockId,
						rawConnection.sourcePortId,
						rawConnection.id,
						offsetMap,
						portsRectMap,
						offset,
						blockById,
					),
					targetFirstSegmentSize: this.#endpointFirstSegmentSize(
						rawConnection.targetBlockId,
						rawConnection.targetPortId,
						rawConnection.id,
						offsetMap,
						portsRectMap,
						offset,
						blockById,
					),
					sourceSecondSegmentSize: this.#endpointSecondSegmentSize(
						rawConnection.sourceBlockId,
						rawConnection.sourcePortId,
						rawConnection.id,
						offsetMap,
						portsRectMap,
						bendOffset,
						blockById,
					),
					targetSecondSegmentSize: this.#endpointSecondSegmentSize(
						rawConnection.targetBlockId,
						rawConnection.targetPortId,
						rawConnection.id,
						offsetMap,
						portsRectMap,
						bendOffset,
						blockById,
					),
				};
				const bbox = computeConnectionBBox(
					rawConnection,
					(blockId) => blockById.get(blockId) ?? null,
					routing,
				);
				const hasFiniteBBox = bbox !== null && [
					bbox.minX,
					bbox.minY,
					bbox.maxX,
					bbox.maxY,
				].every((value) => Number.isFinite(value));

				return hasFiniteBBox ? { ...rawConnection, ...bbox } : null;
			})
			.filter((connection) => connection !== null);
	}

	// Real first-segment length of one connection end, resolved the same way drawing
	// resolves it (connection-state.js:75-140): a many-connection port uses the per-
	// connection firstSegmentSize (count * offset), a single-connection port uses the
	// measured/retained value in portsRectMap ((portIndex + 1) * offset). When the port
	// was never measured, fall back to a conservative estimate from its index in the
	// model block's ports, so the bbox never underestimates a high-index port.
	#endpointFirstSegmentSize(
		blockId: DiagramBlockId,
		portId: string,
		connectionId: string,
		offsetMap: Object,
		portsRectMap: Object,
		offset: number,
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): number
	{
		const portOffsets = offsetMap?.[blockId]?.[portId];
		const hasManyConnection = Object.keys(portOffsets ?? {}).length > 1;

		if (hasManyConnection)
		{
			const size = portOffsets?.[connectionId]?.firstSegmentSize;
			if (Number.isFinite(size))
			{
				return size;
			}
		}

		const measured = portsRectMap?.[blockId]?.[portId]?.firstSegmentSize;
		if (Number.isFinite(measured) && measured > 0)
		{
			return measured;
		}

		return this.#estimateFirstSegmentSize(blockId, portId, offset, blockById);
	}

	// Conservative first-segment estimate for a never-measured port: (portIndex + 1) *
	// offset, matching updatePortSegmentSizes (actions.js:508/514). Falls back to a single
	// offset when the port is not found in the model block.
	#estimateFirstSegmentSize(
		blockId: DiagramBlockId,
		portId: string,
		offset: number,
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): number
	{
		const step = Number.isFinite(offset) ? offset : 0;
		const block = blockById.get(blockId);
		const ports = toValue(block)?.ports ?? [];
		const index = ports.findIndex((port) => (toValue(port)?.id ?? port?.id) === portId);

		return (index >= 0 ? index + 1 : 1) * step;
	}

	// Real second-segment length of one connection end, resolved the same way drawing
	// resolves it (connection-state.js:126-128, 137-139): a many-connection port uses the
	// measured secondSegmentSizeWithoutOffset plus bendOffset * secondSegmentOrder, a
	// single-connection port uses the measured secondSegmentSize. When the port was never
	// measured, fall back to a conservative upper bound from the model block's dimensions,
	// so the bbox never underestimates the perpendicular bend excursion (~block size).
	#endpointSecondSegmentSize(
		blockId: DiagramBlockId,
		portId: string,
		connectionId: string,
		offsetMap: Object,
		portsRectMap: Object,
		bendOffset: number,
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): number
	{
		const portRect = portsRectMap?.[blockId]?.[portId];
		const portOffsets = offsetMap?.[blockId]?.[portId];
		const hasManyConnection = Object.keys(portOffsets ?? {}).length > 1;
		const step = Number.isFinite(bendOffset) ? bendOffset : 0;

		if (hasManyConnection)
		{
			const withoutOffset = portRect?.secondSegmentSizeWithoutOffset;
			if (Number.isFinite(withoutOffset) && withoutOffset > 0)
			{
				const order = portOffsets?.[connectionId]?.secondSegmentOrder ?? 0;

				return withoutOffset + step * Math.max(order, 0);
			}
		}
		else
		{
			const measured = portRect?.secondSegmentSize;
			if (Number.isFinite(measured) && measured > 0)
			{
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
	#estimateSecondSegmentSize(
		blockId: DiagramBlockId,
		portId: string,
		connectionId: string,
		offsetMap: Object,
		bendStep: number,
		blockById: Map<DiagramBlockId, DiagramBlock>,
	): number
	{
		const block = blockById.get(blockId);
		const dimensions = toValue(block)?.dimensions ?? {};
		const width = Number.isFinite(dimensions.width) ? dimensions.width : 0;
		const height = Number.isFinite(dimensions.height) ? dimensions.height : 0;
		const order = offsetMap?.[blockId]?.[portId]?.[connectionId]?.secondSegmentOrder ?? 0;

		return Math.max(width, height) + bendStep * (Math.max(order, 0) + 1);
	}

	// Largest secondSegmentOrder among the connection's two endpoints — a port carrying
	// several connections fans each bend out by bendOffset * order (connection-state.js).
	#connectionSecondSegmentOrder(connection: DiagramConnection, offsetMap: Object): number
	{
		const {
			id,
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		} = connection;

		const sourceOrder = offsetMap?.[sourceBlockId]?.[sourcePortId]?.[id]?.secondSegmentOrder ?? 0;
		const targetOrder = offsetMap?.[targetBlockId]?.[targetPortId]?.[id]?.secondSegmentOrder ?? 0;

		return Math.max(sourceOrder, targetOrder);
	}

	// Clears and reloads the connection index from the given blocks/connections. Shared
	// by the coalesced current-model rebuild and the synchronous history-snapshot rebuild.
	#rebuildConnectionIndex(connections: DiagramConnection[], blocks: DiagramBlock[]): void
	{
		if (!this.#shouldMaintainConnectionIndex())
		{
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

		if (this.#state?.isRenderOptimizationAvailable ?? false)
		{
			this.#updateVisibleConnections();
		}
	}

	#pruneConnectionRouteCache(connections: DiagramConnection[]): void
	{
		const activeIds = new Set(
			toValue(connections ?? []).map((connection) => toRaw(unref(connection)).id),
		);

		for (const connectionId of this.#connectionRouteCache.keys())
		{
			if (!activeIds.has(connectionId))
			{
				this.#connectionRouteCache.delete(connectionId);
			}
		}
	}

	// Rebuilds the whole connection index from the current model. Connection boxes
	// derive from block positions, so a block move refreshes them here too; a full
	// rebuild avoids RBush remove-by-navigation, which is unsafe for items whose
	// geometry lives outside the item. Coalesced through a RAF so a drag (deep block
	// watcher firing per mousemove) triggers at most one rebuild per frame.
	loadConnections(): void
	{
		if (!this.#shouldMaintainConnectionIndex())
		{
			this.#disableConnectionIndex();

			return;
		}

		if (this.#loadConnectionsRafId !== null)
		{
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
	loadConnectionsFromSnapshot(connections: DiagramConnection[], blocks: DiagramBlock[]): void
	{
		if (!this.#shouldMaintainConnectionIndex())
		{
			this.#disableConnectionIndex();

			return;
		}

		// A pending coalesced rebuild would repeat this same work one frame later, so the full
		// synchronous rebuild supersedes it. Dropping that frame used to be a side effect of
		// clear() in the history hooks; the dedup belongs to the rebuild itself.
		if (this.#loadConnectionsRafId !== null)
		{
			cancelAnimationFrame(this.#loadConnectionsRafId);
			this.#loadConnectionsRafId = null;
		}

		// Intentionally synchronous: closes the one-frame index gap left by the props
		// watcher's clear(); must not be coalesced through a RAF.
		this.#rebuildConnectionIndex(connections, blocks);
	}

	selectVisibleConnections(): void
	{
		if (!(this.#state?.isRenderOptimizationAvailable ?? false))
		{
			return;
		}

		if (this.#selectVisibleConnectionsRafId !== null)
		{
			return;
		}

		this.#selectVisibleConnectionsRafId = requestAnimationFrame(() => {
			this.#selectVisibleConnectionsRafId = null;
			this.#updateVisibleConnections();
		});
	}

	#updateVisibleConnections(): void
	{
		const {
			transformX,
			transformY,
			zoom,
			canvasWidth,
			canvasHeight,
		} = this.#state;

		this.visibleConnections.value = this.#withGestureConnections(this.#connectionTree?.search({
			minX: toValue(transformX),
			minY: toValue(transformY),
			maxX: toValue(transformX) + toValue(canvasWidth) / toValue(zoom),
			maxY: toValue(transformY) + toValue(canvasHeight) / toValue(zoom),
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
	#withGestureConnections(connections: DiagramConnection[]): DiagramConnection[]
	{
		if (!(this.#state?.isRenderOptimizationAvailable ?? false))
		{
			return connections;
		}

		const interactingIds = this.#interactingBlockIds();

		if (interactingIds.size === 0)
		{
			this.#resetGestureConnections();

			return connections;
		}

		const gestureConnections = this.#heldGestureConnections(interactingIds);

		if (gestureConnections.length === 0)
		{
			return connections;
		}

		const presentIds = new Set();
		connections.forEach((connection) => presentIds.add(toValue(connection).id));

		const missing = gestureConnections.filter((connection) => !presentIds.has(connection.id));

		return missing.length === 0 ? connections : [...connections, ...missing];
	}

	// Connections the gesture keeps on the canvas: those with an end among its nodes. The whole
	// point of the gesture is that the model is not written until mouseup, so this set is derived
	// once and then only filtered against what the culling pass already reports. It is dropped when
	// the nodes of the gesture change and when the connection index is rebuilt - the two events
	// that can change the model behind it.
	#heldGestureConnections(interactingIds: Set<DiagramBlockId>): DiagramConnection[]
	{
		if (this.#gestureConnections !== null && this.#isSameHeldIds(interactingIds))
		{
			return this.#gestureConnections;
		}

		const blockById = this.#blockByIdMap(this.#state?.blocks ?? []);
		const getBlockById = (blockId: DiagramBlockId) => blockById.get(blockId) ?? null;

		// The model is filtered before it is converted: only the connections kept for the gesture
		// are worth taking out of the reactive wrapper.
		this.#gestureConnections = toValue(this.#state?.connections ?? [])
			.filter((connection) => {
				const candidate = toValue(connection);

				return (
					interactingIds.has(candidate.sourceBlockId)
					|| interactingIds.has(candidate.targetBlockId)
				)
					// A connection the index refused has no route to draw: mounting it would put an
					// empty path and its delete button at the origin of the canvas.
					&& hasBothEndpointsInModel(candidate, getBlockById)
				;
			})
			.map((connection) => toRaw(unref(connection)));
		this.#gestureConnectionsHeldIds = new Set(interactingIds);

		return this.#gestureConnections;
	}

	#isSameHeldIds(interactingIds: Set<DiagramBlockId>): boolean
	{
		const heldIds = this.#gestureConnectionsHeldIds;

		if (heldIds === null || heldIds.size !== interactingIds.size)
		{
			return false;
		}

		for (const blockId of interactingIds)
		{
			if (!heldIds.has(blockId))
			{
				return false;
			}
		}

		return true;
	}

	#resetGestureConnections(): void
	{
		this.#gestureConnections = null;
		this.#gestureConnectionsHeldIds = null;
	}

	// Nodes of the running gesture: the one being resized, the one leading a drag, the whole set
	// the gesture registered and the source of a new connection. Empty once the gesture ends, so
	// nothing is retained past it.
	#interactingBlockIds(): Set<DiagramBlockId>
	{
		const interactingIds = new Set();
		const resizingId = this.#state?.resizingBlock?.id ?? null;
		const movingId = toValue(this.#state?.movingBlockId) ?? null;
		const gestureIds = toValue(this.#state?.gestureBlockIds) ?? null;

		if (resizingId !== null)
		{
			interactingIds.add(resizingId);
		}

		if (movingId !== null)
		{
			interactingIds.add(movingId);
		}

		gestureIds?.forEach((blockId) => interactingIds.add(blockId));

		// The camera pans away from the source node while a new connection is drawn, and culling it
		// would take the source port marker off the screen mid-gesture.
		const connectionSourceId = toValue(this.#state?.newConnection)?.sourceBlockId ?? null;

		if (connectionSourceId !== null)
		{
			interactingIds.add(connectionSourceId);
		}

		return interactingIds;
	}

	load(blocks: DiagramBlock[])
	{
		this.#interactingBlocksCache.clear();
		this.#tree?.load(toRaw(unref(blocks)));
		this.selectVisibleBlocks();
	}

	search(searchRect: DiagramSearchBlockRect): DiagramBlock[]
	{
		return this.#tree.search(searchRect);
	}

	findConnectionRouteHits(rect: Rect): DiagramConnectionRouteHit[]
	{
		if (!this.#shouldMaintainConnectionIndex())
		{
			return [];
		}

		const zoom = toValue(this.#state?.zoom);
		if (!Number.isFinite(zoom) || zoom <= 0)
		{
			return [];
		}

		const canvasTolerance = CONNECTION_ROUTE_HIT_TOLERANCE / zoom;
		const expandedRect = expandRect(rect, canvasTolerance);
		if (expandedRect === null)
		{
			return [];
		}

		const candidates = this.#connectionTree?.search({
			minX: expandedRect.x,
			minY: expandedRect.y,
			maxX: expandedRect.x + expandedRect.width,
			maxY: expandedRect.y + expandedRect.height,
		}) ?? [];
		const hits: DiagramConnectionRouteHit[] = [];

		for (const candidate of candidates)
		{
			const connection = toRaw(unref(candidate));
			const segments = this.#getConnectionRouteSegments(connection, zoom);

			if (segments.length === 0)
			{
				continue;
			}

			const distancePx = distanceBetweenRectAndSegments(rect, segments) * zoom;
			if (Number.isFinite(distancePx) && distancePx <= CONNECTION_ROUTE_HIT_TOLERANCE)
			{
				hits.push({ connection, distancePx });
			}
		}

		return sortConnectionRouteHits(
			hits,
			(hit) => createConnectionStructuralSignature(hit.connection),
		);
	}

	#getConnectionRouteSegments(connection: DiagramConnection, zoom: number): ConnectionRouteSegment[]
	{
		const options = {
			connection,
			portsRectMap: toValue(this.#state?.portsRectMap) ?? {},
			connectionsOffsetMap: toValue(this.#state?.connectionsOffsetMap) ?? {},
			bendOffset: toValue(this.#state?.connectionBendOffset),
			offset: toValue(this.#state?.connectionOffset),
			borderRadius: toValue(this.#state?.connectionBorderRadius),
		};
		const portsPosition = resolveConnectionPortsPosition(options);
		const key = createConnectionRouteCacheKey({
			...options,
			portsPosition,
			zoom,
		});

		if (portsPosition === null || key === null)
		{
			this.#connectionRouteCache.delete(connection.id);

			return [];
		}

		const cached = this.#connectionRouteCache.get(connection.id);
		if (cached?.key === key)
		{
			return cached.segments;
		}

		const route = resolveRenderedConnectionRoute(options);
		const segments = route === null
			? []
			: flattenConnectionRoute(route.primitives, zoom, 1);

		if (segments.length === 0)
		{
			this.#connectionRouteCache.delete(connection.id);

			return [];
		}

		this.#connectionRouteCache.set(connection.id, { key, segments });

		return segments;
	}

	selectVisibleBlocks(): void
	{
		if (this.#selectVisibleBlocksRafId !== null)
		{
			return;
		}

		this.#selectVisibleBlocksRafId = requestAnimationFrame(() => {
			this.#selectVisibleBlocksRafId = null;
			this.#updateVisibleBlocks();
		});
	}

	#updateVisibleBlocks(): void
	{
		const {
			transformX,
			transformY,
			zoom,
			canvasWidth,
			canvasHeight,
		} = this.#state;

		const blocks = this.#withInteractingBlocks(this.#tree.search({
			minX: toValue(transformX),
			minY: toValue(transformY),
			maxX: toValue(transformX) + toValue(canvasWidth) / toValue(zoom),
			maxY: toValue(transformY) + toValue(canvasHeight) / toValue(zoom),
		}));

		if (this.#isSameVisibleBlocks(blocks))
		{
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
	#isSameVisibleBlocks(blocks: DiagramBlock[]): boolean
	{
		const current = toValue(this.visibleBlocks);

		if (current.length !== blocks.length)
		{
			return false;
		}

		const currentById = new Map(
			current.map((block) => [toValue(block).id, toRaw(unref(block))]),
		);

		return blocks.every((block) => currentById.get(toValue(block).id) === toRaw(unref(block)));
	}

	// The index holds the pre-gesture boxes of the blocks being moved or resized: staged geometry
	// reaches the model only on mouseup. Autoscroll can pan the camera past those boxes, and
	// culling such a block mid-gesture unmounts it, which tears the gesture down. Keep every node
	// of the gesture in the visible set until the gesture ends and the index catches up - a frame
	// drag moves a whole selection, so the retained set is the one the gesture registered, not a
	// single node. Every writer of visibleBlocks goes through here, not just the culling pass:
	// clear() empties the set synchronously while the refill waits for a RAF, so an unretained
	// block would unmount for a frame. Duplicates are ruled out by id.
	#withInteractingBlocks(blocks: DiagramBlock[]): DiagramBlock[]
	{
		if (!(this.#state?.isRenderOptimizationAvailable ?? false))
		{
			return blocks;
		}

		const interactingIds = this.#interactingBlockIds();

		this.#forgetInteractingBlocksExcept(interactingIds);

		const missingIds = new Set(interactingIds);
		blocks.forEach((block) => missingIds.delete(toValue(block).id));

		if (missingIds.size === 0)
		{
			return blocks;
		}

		const interactingBlocks = [...missingIds]
			.map((blockId) => this.#interactingBlock(blockId))
			.filter((block) => block !== null);

		return interactingBlocks.length === 0 ? blocks : [...blocks, ...interactingBlocks];
	}

	// Once the camera has left the block behind, the retained block is missing from every
	// culling pass, and resolving it in the model would be a linear pass over the whole diagram
	// on every frame of the gesture. The model is read once per block and the answer is kept
	// until the gesture ends (#forgetInteractingBlocksExcept) or the block itself changes
	// (insert/remove/load).
	#interactingBlock(blockId: DiagramBlockId): DiagramBlock | null
	{
		const cached = this.#interactingBlocksCache.get(blockId) ?? null;

		if (cached !== null)
		{
			return cached;
		}

		const block = toValue(this.#state?.blocks ?? [])
			.find((stateBlock) => toValue(stateBlock).id === blockId) ?? null;

		if (block === null)
		{
			return null;
		}

		const rawBlock = toRaw(unref(block));
		this.#interactingBlocksCache.set(blockId, rawBlock);

		return rawBlock;
	}

	#forgetInteractingBlocksExcept(interactingIds: Set<DiagramBlockId>): void
	{
		this.#interactingBlocksCache.forEach((block, blockId) => {
			if (!interactingIds.has(blockId))
			{
				this.#interactingBlocksCache.delete(blockId);
			}
		});
	}

	updateBlock(oldBlock: DiagramBlock, newBlock: DiagramBlock): void
	{
		this.removeBlock(oldBlock);
		this.insertBlock(newBlock);
	}

	#preparedBlock(block: DiagramBlock): DiagramBlock
	{
		return toRaw(unref({
			...block,
			position: toRaw(toValue(block).position),
			dimensions: toRaw(toValue(block).dimensions),
			ports: toRaw(unref(toValue(block).ports)),
		}));
	}

	insertBlock(block: DiagramBlock): void
	{
		this.#interactingBlocksCache.delete(toValue(block).id);
		this.#tree?.insert(this.#preparedBlock(block));
		this.selectVisibleBlocks();
	}

	removeBlock(block: DiagramBlock): void
	{
		this.#interactingBlocksCache.delete(toValue(block).id);
		this.#tree?.remove(
			this.#preparedBlock(block),
			(blockA: DiagramBlock, blockB: DiagramBlock): boolean => {
				return toValue(blockA).id === toValue(blockB).id;
			},
		);
		this.selectVisibleBlocks();
	}

	clear(): void
	{
		// The retained block is resolved from the model, so the answer must not outlive the
		// composition it was read from: clear() drops every block, and #withInteractingBlocks
		// below re-reads whatever is still interacting.
		this.#interactingBlocksCache.clear();

		if (this.#selectVisibleBlocksRafId !== null)
		{
			cancelAnimationFrame(this.#selectVisibleBlocksRafId);
			this.#selectVisibleBlocksRafId = null;
		}

		if (this.#selectVisibleConnectionsRafId !== null)
		{
			cancelAnimationFrame(this.#selectVisibleConnectionsRafId);
			this.#selectVisibleConnectionsRafId = null;
		}

		if (this.#loadConnectionsRafId !== null)
		{
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
