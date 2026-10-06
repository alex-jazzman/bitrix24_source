import { PortsNearest, BlockIntersections, AnimationStepController } from '../utils';
import type { DiagramInstances, DiagramInstancesContext } from '../types';

export function useInstances(ctx: DiagramInstancesContext): DiagramInstances
{
	return {
		portsNearest: new PortsNearest(ctx),
		blockIntersections: new BlockIntersections(ctx),
		animationStep: new AnimationStepController(),
	};
}
