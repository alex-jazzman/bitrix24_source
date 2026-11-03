import {
	PortsNearest,
	BlockIntersections,
	AnimationStepController,
	Camera,
	Canvas,
	MapRenderer,
	InputState,
	ActionRegistry,
	CopyPasteBuffer,
	getCanvasActionDefaults,
} from '../utils';
import type { DiagramInstances, DiagramInstancesContext } from '../types';

export function useInstances(ctx: DiagramInstancesContext): DiagramInstances
{
	const camera = new Camera(ctx);
	// The registry answers which press runs which action, so the input state is given it at birth:
	// the consumer of the canvas replaces the set of bindings on the same instance later.
	const actionRegistry = new ActionRegistry();
	// The canvas is self-sufficient: its own actions answer to their default combos with no consumer
	// involved. A consumer replacing the set is expected to merge these defaults into its own.
	actionRegistry.applyBindings(getCanvasActionDefaults());

	return {
		portsNearest: new PortsNearest(ctx),
		blockIntersections: new BlockIntersections(ctx),
		camera,
		canvas: new Canvas({ ...ctx, camera }),
		mapRenderer: new MapRenderer(ctx),
		animationStep: new AnimationStepController(),
		inputState: new InputState({ actionRegistry }),
		actionRegistry,
		copyPasteBuffer: new CopyPasteBuffer(),
	};
}
