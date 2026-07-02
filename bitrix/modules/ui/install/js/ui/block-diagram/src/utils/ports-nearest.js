import { toValue } from 'ui.vue3';
import { KdTree } from '../lib/kd-tree';
import { distance } from './diagram';
import type {
	Point,
	DiagramPort,
	DiagramBlockId,
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

	init(portsMap: DiagramPortsMap): void
	{
		const { portsRectMap } = this.#state;
		const portsPoint = [];

		for (const [blockId, ports] of portsMap.entries())
		{
			for (const [portId, port] of ports.entries())
			{
				const { x = 0, y = 0 } = toValue(portsRectMap)
					?.[blockId]
					?.[portId] ?? {};

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
