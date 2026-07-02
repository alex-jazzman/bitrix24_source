import { PortsNearest, BlockIntersections } from '../utils';
import { DiagramInstances, DiagramInstancesContext } from '../types';

export function useInstances(ctx: DiagramInstancesContext): DiagramInstances
{
	return {
		portsNearest: new PortsNearest(ctx),
		blockIntersections: new BlockIntersections(ctx),
	};
}
