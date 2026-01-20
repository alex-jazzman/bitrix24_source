import type { AnimationItem } from 'ui.block-diagram';
import { ANIMATED_TYPES } from 'ui.block-diagram';

import type { Block, Connection } from '../../../shared/types';

function getConnectionKey(connection: Connection): string
{
	return `${connection.sourceBlockId}_${connection.sourcePortId}_${connection.targetBlockId}_${connection.targetPortId}`;
}

function isBlockConnection(connection: Connection, block: Block): boolean
{
	return connection.sourceBlockId === block.id || connection.targetBlockId === block.id;
}

function getConnectionMap(connections: Array<Connection>): Map<string, Connection>
{
	return new Map(
		connections.map((conn: Connection): [string, Connection] => [getConnectionKey(conn), conn]),
	);
}

export function makeAnimationQueue(
	currentBlocks: Array<Block>,
	currentConnections: Array<Connection>,
	newBlocks: Array<Block>,
	newConnections: Array<Connection>,
): Array<AnimationItem>
{
	const animatedItems: Array<AnimationItem> = [];

	const currentBlockMap: Map<string, Block> = new Map(currentBlocks.map((block) => [block.id, block]));
	const newBlockMap: Map<string, Block> = new Map(newBlocks.map((block) => [block.id, block]));
	const currentConnectionMap: Map<string, Connection> = getConnectionMap(currentConnections);
	const newConnectionMap: Map<string, Connection> = getConnectionMap(newConnections);
	const handledConnections: Set<string> = new Set();

	// Remove not present in new blocks
	for (const [id: string, block: Block] of currentBlockMap.entries())
	{
		if (!newBlockMap.has(id))
		{
			animatedItems.push({ type: ANIMATED_TYPES.REMOVE_BLOCK, item: block });
			// Remove block dependent connections
			for (const [connectionId: string, conn: Connection] of currentConnectionMap.entries())
			{
				if (!handledConnections.has(connectionId) && isBlockConnection(conn, block))
				{
					handledConnections.add(connectionId);
				}
			}
		}
	}

	// remove other not present connections
	for (const [connectionId: string, conn: Connection] of currentConnectionMap.entries())
	{
		if (!handledConnections.has(connectionId) && !newConnectionMap.has(connectionId))
		{
			animatedItems.push({ type: ANIMATED_TYPES.REMOVE_CONNECTION, item: conn });
			handledConnections.add(connectionId);
		}
	}

	// Append new blocks
	for (const [id: string, block: Block] of newBlockMap.entries())
	{
		if (!currentBlockMap.has(id))
		{
			animatedItems.push({ type: ANIMATED_TYPES.BLOCK, item: block });
			// append dependent block connections
			for (const [connectionId: string, conn: Connection] of newConnectionMap.entries())
			{
				if (
					!currentConnectionMap.has(connectionId)
					&& !handledConnections.has(connectionId)
					&& isBlockConnection(conn, block)
				)
				{
					animatedItems.push({ type: ANIMATED_TYPES.CONNECTION, item: conn });
					handledConnections.add(connectionId);
				}
			}
		}
	}

	// append new connections for existed blocks
	for (const [connectionId: string, conn: Connection] of newConnectionMap.entries())
	{
		if (!currentConnectionMap.has(connectionId)	&& !handledConnections.has(connectionId))
		{
			animatedItems.push({ type: ANIMATED_TYPES.CONNECTION, item: conn });
			handledConnections.add(connectionId);
		}
	}

	return animatedItems;
}
