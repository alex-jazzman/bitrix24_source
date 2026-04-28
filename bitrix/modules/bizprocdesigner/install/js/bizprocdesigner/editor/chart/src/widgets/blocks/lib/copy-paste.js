import { diagramStore as useDiagramStore, useBufferStore } from '../../../entities/blocks';
import type { Point } from 'ui.block-diagram';
import type { Block } from '../../../shared/types';

export class CopyPaste
{
	#diagramStore = null;
	#bufferStore = null;

	constructor()
	{
		this.#diagramStore = useDiagramStore();
		this.#bufferStore = useBufferStore();
	}

	paste(point: Point): Block[]
	{
		const data = this.#bufferStore.getBufferContent();
		if (!data)
		{
			return [];
		}

		return this.#pasteGroup(data, point);
	}

	#pasteGroup({ blocks, connections }, point: Point): Block[]
	{
		if (blocks.length === 0)
		{
			return [];
		}

		const origin = { ...blocks[0].position };

		const newBlocks = blocks.map((block) => {
			const targetPoint = {
				x: point.x + (block.position.x - origin.x),
				y: point.y + (block.position.y - origin.y),
			};

			return this.#pasteBlock(block, targetPoint);
		});

		this.#pasteConnections(connections);

		return newBlocks;
	}

	#pasteBlock(block: Block, point: Point): Block
	{
		const positionedBlock = {
			...block,
			position: point,
		};
		this.#diagramStore.addBlock(positionedBlock);
		this.#diagramStore.updateBlockPublishStatus(positionedBlock);

		return positionedBlock;
	}

	#pasteConnections(connections: Connection[]): void
	{
		if (connections.length === 0)
		{
			return;
		}

		this.#diagramStore.setConnections([
			...this.#diagramStore.connections,
			...connections,
		]);

		connections.forEach((item) => {
			this.#diagramStore.setConnectionCurrentTimestamp(item.id);
		});
	}
}
