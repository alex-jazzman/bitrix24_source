import { useBlockDiagram } from 'ui.block-diagram';
import { diagramStore as useDiagramStore, useBufferStore } from '../../../entities/blocks';
import type { Point } from 'ui.block-diagram';
import type { Block, BlockId } from '../../../shared/types';

export function useCopyPaste(): { paste: (point: Point) => BlockId[] }
{
	const diagramStore = useDiagramStore();
	const bufferStore = useBufferStore();
	const blockDiagram = useBlockDiagram();

	function paste(point: Point): BlockId[]
	{
		const {
			blocks = [],
			connections = [],
		} = bufferStore.getBufferContent() ?? {};

		if (blocks.length === 0)
		{
			return [];
		}

		const addedBlockIds = pasteBlocks(blocks, point);
		pasteConnections(connections);

		return addedBlockIds;
	}

	function pasteBlocks(blocks: Block, point: Point): Block[]
	{
		const origin = { ...blocks[0].position };
		const newBlocks = blocks.map((block) => {
			return {
				...block,
				position: {
					x: point.x + (block.position.x - origin.x),
					y: point.y + (block.position.y - origin.y),
				},
			};
		});

		blockDiagram.addBlocks(newBlocks);

		for (const block of newBlocks)
		{
			diagramStore.updateBlockPublishStatus(block);
		}

		return newBlocks;
	}

	function pasteConnections(connections: Connection[]): void
	{
		blockDiagram.addConnections(connections);

		for (const connection of connections)
		{
			diagramStore.setConnectionCurrentTimestamp(connection.id);
		}
	}

	return { paste };
}
