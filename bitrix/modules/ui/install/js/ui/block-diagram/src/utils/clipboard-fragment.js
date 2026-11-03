import { Text } from 'main.core';
import {
	type DiagramBlock,
	type DiagramBlockId,
	type DiagramClipboardContent,
	type DiagramConnection,
	type Point,
} from '../types';

export type DiagramBlockIdMap = Map<DiagramBlockId, DiagramBlockId>;

export type DiagramFragmentWithNewIds = {
	content: DiagramClipboardContent;
	blockIdMap: DiagramBlockIdMap;
};

export type DiagramBlockIdFactory = () => DiagramBlockId;

export function createDiagramBlockId(): DiagramBlockId
{
	return Text.getRandom();
}

/**
 * Gives every block and every connection of the fragment a fresh id and rebinds the connection
 * ends through the block id map. The rebinding is explicit: an end that leads outside the fragment
 * keeps its id, and port ids are never touched - they are unique only inside their own block.
 * Only the block id format is an extension point: a connection id is always issued by the core,
 * because connections belong to the core while a block may carry a format of its own.
 */
export function issueNewFragmentIds(
	content: DiagramClipboardContent,
	createBlockId: DiagramBlockIdFactory = createDiagramBlockId,
): DiagramFragmentWithNewIds
{
	const blockIdMap: DiagramBlockIdMap = new Map();

	const blocks: DiagramBlock[] = content.blocks.map((block: DiagramBlock): DiagramBlock => {
		const id: DiagramBlockId = createBlockId();
		blockIdMap.set(block.id, id);

		return { ...block, id };
	});

	const connections: DiagramConnection[] = content.connections.map(
		(connection: DiagramConnection): DiagramConnection => ({
			...connection,
			id: Text.getRandom(),
			sourceBlockId: blockIdMap.get(connection.sourceBlockId) ?? connection.sourceBlockId,
			targetBlockId: blockIdMap.get(connection.targetBlockId) ?? connection.targetBlockId,
		}),
	);

	return {
		content: { blocks, connections },
		blockIdMap,
	};
}

/**
 * Places the fragment against the paste point. The point is only rounded, never aligned to the
 * grid, so the fragment lands exactly where it was aimed at even while snapToGrid is on. Origin is
 * the position of the first block, the rest keep their offsets from it, so the fragment moves as a
 * whole. Every field other than position carries over untouched.
 */
export function layoutFragmentBlocks(blocks: DiagramBlock[], point: Point): DiagramBlock[]
{
	if (blocks.length === 0)
	{
		return [];
	}

	const pastePoint: Point = { x: Math.round(point.x), y: Math.round(point.y) };
	const origin: Point = { ...blocks[0].position };

	return blocks.map((block: DiagramBlock): DiagramBlock => ({
		...block,
		position: {
			x: pastePoint.x + (block.position.x - origin.x),
			y: pastePoint.y + (block.position.y - origin.y),
		},
	}));
}
