import { toValue } from 'ui.vue3';
import { type DiagramBlock, type DiagramBlockId, type DiagramConnection, type DiagramPortId, type DiagramPortRect } from '../../types';

type PortsRectMap = { [DiagramBlockId]: { [DiagramPortId]: DiagramPortRect } };

function isPortMeasured(portsRectMap: PortsRectMap, blockId: DiagramBlockId, portId: DiagramPortId): boolean
{
	return blockId in portsRectMap && portId in portsRectMap[blockId];
}

// True when the port still exists in the model block and can actually render (and so be
// measured). A connection pointing at a deleted/absent port would never write to
// portsRectMap, so measuring it must not be requested — otherwise its endpoint block
// would stay in the visible set forever and culling for it would be disabled.
function isPortRenderable(
	blockById: Map<DiagramBlockId, DiagramBlock>,
	blockId: DiagramBlockId,
	portId: DiagramPortId,
): boolean
{
	const block = blockById?.get(blockId);
	if (block === undefined || block === null)
	{
		return false;
	}

	const ports = toValue(block)?.ports ?? [];

	return ports.some((port) => (toValue(port)?.id ?? port?.id) === portId);
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
export function collectEndpointsToMeasure(
	connections: DiagramConnection[],
	portsRectMap: PortsRectMap,
	blockById: Map<DiagramBlockId, DiagramBlock>,
): Set<DiagramBlockId>
{
	const endpoints = new Set();

	for (const connection of connections)
	{
		if (
			!isPortMeasured(portsRectMap, connection.sourceBlockId, connection.sourcePortId)
			&& isPortRenderable(blockById, connection.sourceBlockId, connection.sourcePortId)
		)
		{
			endpoints.add(connection.sourceBlockId);
		}

		if (
			!isPortMeasured(portsRectMap, connection.targetBlockId, connection.targetPortId)
			&& isPortRenderable(blockById, connection.targetBlockId, connection.targetPortId)
		)
		{
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
export function takeFirstMeasureBatch(
	measureIds: Set<DiagramBlockId>,
	visibleIds: Set<DiagramBlockId>,
	blockById: Map<DiagramBlockId, DiagramBlock>,
	batchSize: number,
): DiagramBlock[]
{
	const batch = [];

	for (const blockId of measureIds)
	{
		if (batch.length >= batchSize)
		{
			break;
		}

		if (visibleIds.has(blockId))
		{
			continue;
		}

		const block = blockById.get(blockId);
		if (block !== undefined)
		{
			batch.push(block);
		}
	}

	return batch;
}
