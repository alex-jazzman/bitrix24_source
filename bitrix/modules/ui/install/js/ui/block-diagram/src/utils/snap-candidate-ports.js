import type { DiagramPortsMap, DiagramVirtualPortsMap } from '../types';

// Merge registered block ports with opt-in virtual (placeholder) ports so both
// participate as snap targets for a new connection. Virtual ports win on id
// collision: a materializable placeholder must stay droppable even if a stale
// real port with the same id still lingers in the diagram.
export function buildSnapCandidatePorts(
	visiblePorts: DiagramPortsMap,
	virtualPortsMap: DiagramVirtualPortsMap,
): DiagramPortsMap
{
	const merged = new Map();

	for (const [blockId, ports] of visiblePorts.entries())
	{
		merged.set(blockId, new Map(ports));
	}

	for (const [blockId, entries] of virtualPortsMap.entries())
	{
		if (!merged.has(blockId))
		{
			merged.set(blockId, new Map());
		}

		for (const [portId, entry] of entries.entries())
		{
			merged.get(blockId).set(portId, entry.port);
		}
	}

	return merged;
}
