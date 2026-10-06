import { toValue } from 'ui.vue3';
import { KdTree } from '../lib/kd-tree';
import { distance } from './diagram';
import type {
	Point,
	DiagramPort,
	DiagramBlockId,
	DiagramPortId,
	DiagramPortRect,
	DiagramPortsMap,
	State,
	DiagramInstancesContext,
	DiagramNearestPort,
} from '../types';

const PORT_X_KEY = 'x';
const PORT_Y_KEY = 'y';

export class PortsNearest
{
	#portsKdTree: typeof KdTree | null = null;
	#state: State | null = null;

	constructor(ctx: DiagramInstancesContext)
	{
		this.#state = ctx.state;
	}

	// Builds the index from scratch for the given set. This is also the rebuild path: insertion
	// does not rebalance, so a gesture that accumulated enough inserts comes back here.
	init(portsMap: DiagramPortsMap): void
	{
		const { portsRectMap } = this.#state;
		const portsPoint = [];

		for (const [blockId, ports] of portsMap.entries())
		{
			for (const [portId, port] of ports.entries())
			{
				// Same invariant as addPort: an unmeasured port stays out of the index.
				const portRect = toValue(portsRectMap)?.[blockId]?.[portId] ?? null;

				if (portRect === null)
				{
					continue;
				}

				const { x = 0, y = 0 } = portRect;

				portsPoint.push({
					x,
					y,
					blockId,
					portId,
					port: { ...port },
				});
			}
		}

		this.#portsKdTree = new KdTree(
			portsPoint,
			distance,
			[PORT_X_KEY, PORT_Y_KEY],
		);
	}

	// A port joins the visible set before its geometry is measured. Adding an unmeasured port
	// would plant a phantom target at the world origin, so it is refused here and picked up by a
	// later pass instead. A caller that has already resolved the rect passes it in; the lookup
	// here is the fallback, not a second check.
	addPort(
		blockId: DiagramBlockId,
		portId: DiagramPortId,
		port: DiagramPort,
		rect: DiagramPortRect | null = null,
	): boolean
	{
		const { portsRectMap } = this.#state;
		const portRect = rect ?? (toValue(portsRectMap)?.[blockId]?.[portId] ?? null);

		if (portRect === null || this.#portsKdTree === null)
		{
			return false;
		}

		const { x = 0, y = 0 } = portRect;

		this.#portsKdTree.insert({
			x,
			y,
			blockId,
			portId,
			port: { ...port },
		});

		return true;
	}

	insert(point: Point, blockId: DiagramBlockId, port: DiagramPort): void
	{
		this.#portsKdTree?.insert({
			...point,
			blockId,
			portId: port.id,
			port: { ...port },
		});
	}

	nearest(
		point: Point,
		maxNodes: number = 1,
		maxDistance: number = 100,
	): [DiagramNearestPort, number][]
	{
		return this.#portsKdTree
			?.nearest(point, maxNodes, maxDistance) ?? [];
	}

	remove(point: Point): void
	{
		return this.#portsKdTree?.remove(point);
	}

	clear(): void
	{
		this.#portsKdTree = null;
	}
}
