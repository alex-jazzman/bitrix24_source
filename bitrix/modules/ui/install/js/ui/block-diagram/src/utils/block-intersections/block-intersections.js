import { toValue, ref, computed, toRaw, unref } from 'ui.vue3';
import { BlockRBush } from './block-rbush';
import { BLOCK_GROUP_DEFAULT_NAME } from '../../constants';
import {
	DiagramBlock,
	DiagramPortsMap,
	DiagramBlockGroupNames,
	DiagramGroupedBlocks,
	State,
	DiagramInstancesContext,
	DiagramSearchBlockRect,
} from '../../types';

export class BlockIntersections
{
	#throttleTimerId: number | null = null;
	#tree: typeof BlockRBush | null = null;
	#state: State | null = null;

	visibleBlocks: DiagramBlock[] = ref([]);

	visibleBlockIds: Set<string> = computed(() => {
		return new Set(toValue(this.visibleBlocks).map((block) => block.id));
	});

	groupedVisibleBlocks: DiagramGroupedBlocks = computed(() => {
		const blocks = (this.#state?.isRenderOptimizationAvailable ?? false)
			? this.visibleBlocks
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

	constructor(ctx: DiagramInstancesContext)
	{
		this.#state = ctx.state;
		this.#tree = new BlockRBush();
	}

	load(blocks: DiagramBlock[])
	{
		this.#tree?.load(toRaw(unref(blocks)));
		this.selectVisibleBlocks();
	}

	search(searchRect: DiagramSearchBlockRect): DiagramBlock[]
	{
		return this.#tree.search(searchRect);
	}

	selectVisibleBlocks(throttleDelay: number = 50): void
	{
		if (this.#throttleTimerId === null)
		{
			this.#throttleTimerId = setTimeout(() => {
				const {
					transformX,
					transformY,
					zoom,
					canvasWidth,
					canvasHeight,
				} = this.#state;

				this.visibleBlocks.value = this.#tree.search({
					minX: toValue(transformX),
					minY: toValue(transformY),
					maxX: toValue(transformX) + toValue(canvasWidth) / toValue(zoom),
					maxY: toValue(transformY) + toValue(canvasHeight) / toValue(zoom),
				});
				this.#throttleTimerId = null;
			}, throttleDelay);
		}
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
		this.#tree?.insert(this.#preparedBlock(block));
		this.selectVisibleBlocks();
	}

	removeBlock(block: DiagramBlock): void
	{
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
		this.#tree?.clear();
		this.visibleBlocks.value = [];
		clearTimeout(this.#throttleTimerId);
		this.#throttleTimerId = null;
	}
}
