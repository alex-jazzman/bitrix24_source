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

		// A group paste is one change of the diagram: a single save chain covers every pasted
		// block and connection instead of racing one chain per block.
		void diagramStore.autosave();

		return addedBlockIds;
	}

	function pasteBlocks(blocks: Block, point: Point): Block[]
	{
		// The fragment lands where it was aimed at: the paste point is never aligned to the grid,
		// and the rest of the buffer keeps its offsets from the first block. It is only rounded,
		// because both callers pass fractions and the model keeps whole-pixel coordinates.
		const pastePoint = { x: Math.round(point.x), y: Math.round(point.y) };
		const origin = { ...blocks[0].position };
		const newBlocks = blocks.map((block) => {
			return {
				...block,
				position: {
					x: pastePoint.x + (block.position.x - origin.x),
					y: pastePoint.y + (block.position.y - origin.y),
				},
			};
		});

		blockDiagram.addBlocks(newBlocks);

		for (const block of newBlocks)
		{
			diagramStore.setBlockCurrentTimestamp(block);
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
