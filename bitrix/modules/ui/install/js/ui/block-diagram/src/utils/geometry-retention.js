import { toValue } from 'ui.vue3';
import { type DiagramBlockId, type DiagramPortId, type DiagramBlock } from '../types';

/**
 * ALG-01: retain a node's measured geometry when its port/block unmounts only
 * while render optimization culls the node out of the viewport yet it stays in
 * the model. Any other unmount is a real removal and its geometry must be cleared.
 */
export function shouldRetainGeometry(
	isRenderOptimizationAvailable: boolean,
	blockIdsInModel: Set<DiagramBlockId>,
	blockId: DiagramBlockId,
): boolean
{
	return isRenderOptimizationAvailable === true && blockIdsInModel.has(blockId);
}

/**
 * ALG-01 (port level): retain a port's measured geometry only while the block stays
 * in the model AND the port itself is still present in that block's ports. Culling
 * unmounts an offscreen node but keeps its ports in the model — retain. Deleting a
 * single port (setPorts without it) drops it from the model — clear, even though the
 * block remains, so no connection is drawn to a port that no longer exists.
 */
export function shouldRetainPortGeometry(
	isRenderOptimizationAvailable: boolean,
	blockIdsInModel: Set<DiagramBlockId>,
	blockId: DiagramBlockId,
	blockPortIdsInModel: Set<DiagramPortId>,
	portId: DiagramPortId,
): boolean
{
	return shouldRetainGeometry(isRenderOptimizationAvailable, blockIdsInModel, blockId)
		&& blockPortIdsInModel.has(portId);
}

/**
 * Port ids a block currently exposes in the LIVE model, read through getBlockById
 * rather than a captured prop. An immutable setPorts swaps the block object, so an
 * unmounting port that closed over the old block would still see the dropped port and
 * wrongly retain its geometry; resolving the block from the current model instead makes
 * the removed port absent here — so retention clears it. A block removed entirely yields
 * an empty set (getBlockById returns null).
 */
export function collectModelPortIds(
	getBlockById: (blockId: DiagramBlockId) => DiagramBlock | null,
	blockId: DiagramBlockId,
): Set<DiagramPortId>
{
	const block = getBlockById(blockId);
	const ports = toValue(block?.ports) ?? [];

	return new Set(ports.map((port) => toValue(port)?.id));
}
