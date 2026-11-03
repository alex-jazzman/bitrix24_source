import { Text } from 'main.core';
import { nextTick, toValue } from 'ui.vue3';

import { fragmentLibraryApi } from '../../../entities/fragment-library';
import { handleResponseError } from '../../../shared/utils';

// Where a fragment lands when nobody pointed at a place: to the right of everything the scheme
// already has, so it never falls on top of existing nodes. The width stands for a node the canvas
// has not measured yet - the same default size the widget draws a selection box around.
const FALLBACK_INSERT_GAP = 200;
const DEFAULT_BLOCK_WIDTH = 150;

const refused = () => ({ isRefused: true, blocks: [] });
const inserted = (blocks) => ({ isRefused: false, blocks });

function getFallbackPoint(blocksOnScheme)
{
	if (blocksOnScheme.length === 0)
	{
		return { x: 0, y: 0 };
	}

	const right = Math.max(...blocksOnScheme.map(
		(block) => block.position.x + (block.dimensions?.width ?? DEFAULT_BLOCK_WIDTH),
	));

	return {
		x: right + FALLBACK_INSERT_GAP,
		y: Math.min(...blocksOnScheme.map((block) => block.position.y)),
	};
}

/**
 * The rule the paste from the buffer lays a fragment out by: origin is the position of the first
 * block, the rest keep their offsets from it, so the fragment moves as a whole. The point is only
 * rounded and never aligned to the grid, so the fragment lands exactly where it was aimed at.
 */
function layoutFragment(blocks, point)
{
	const insertPoint = { x: Math.round(point.x), y: Math.round(point.y) };
	const origin = { ...blocks[0].position };

	return blocks.map((block) => ({
		...block,
		position: {
			x: insertPoint.x + (block.position.x - origin.x),
			y: insertPoint.y + (block.position.y - origin.y),
		},
	}));
}

/**
 * Adds a fragment of the library to the canvas (ALG-01). It creates no copy machine of its own and
 * never touches the copy buffer: the fragment travels straight from the server to the public
 * interface of the canvas. The names of the nodes and the references between them are already
 * rewritten by the server, so the only ids issued here are the ones of the connections - those
 * belong to the canvas.
 *
 * The insertion answers with `{ isRefused, blocks }`: a refusal is not an empty insertion, and a
 * fragment whose every node was skipped is not a refusal either.
 */
export function useInsertFragment(options)
{
	const {
		diagramStore,
		blockDiagram,
		highlightedBlocks,
		history,
		afterFragmentAdded,
		createConnectionId = () => Text.getRandom(),
		reportOutcome = () => {},
	} = options;

	const { isDisabledBlockDiagram, addBlocks, addConnections } = blockDiagram;

	// The whole state of the canvas, not the ban on writing alone: the paste from the buffer refuses
	// a disabled canvas and a running animation as well, and an insertion looking at one flag would
	// pass where that one does not. `null` expects no insertion in flight at all.
	function canInsert(expectedInsertionId = null)
	{
		return !toValue(isDisabledBlockDiagram)
			&& diagramStore.isWriteLocked !== true
			&& diagramStore.insertingFragmentId === expectedInsertionId
		;
	}

	async function prepare(fragmentId)
	{
		try
		{
			return await fragmentLibraryApi.prepareInsert(
				fragmentId,
				diagramStore.templateId,
				diagramStore.documentTypeSigned,
			);
		}
		catch (error)
		{
			handleResponseError(error);

			return null;
		}
	}

	async function addFragment(fragmentId, point)
	{
		const prepared = await prepare(fragmentId);
		if (prepared === null)
		{
			return refused();
		}

		// Asked again after the request: the lock and the animation of the layout both start while it
		// is in flight, and the answer is not worth a write the canvas would refuse now.
		if (!canInsert(fragmentId))
		{
			return refused();
		}

		if (prepared.blocks.length === 0)
		{
			// Everything was skipped: the reasons are worth telling, the scheme is not touched.
			reportOutcome(prepared);

			return inserted([]);
		}

		const blocks = layoutFragment(prepared.blocks, point ?? getFallbackPoint(diagramStore.blocks ?? []));
		const connections = prepared.connections.map((connection) => ({
			...connection,
			id: createConnectionId(),
		}));

		highlightedBlocks.clear();
		addBlocks(blocks);
		addConnections(connections);
		afterFragmentAdded(blocks, connections);

		// The order of the canvas: the highlight is queued first and the snapshot, deferred to the
		// same queue, is registered after it, so the step of the history already carries the selection.
		void nextTick(() => {
			highlightedBlocks.replace(blocks.map((block) => block.id));
		});
		void history.makeSnapshot();

		reportOutcome(prepared);

		return inserted(blocks);
	}

	async function insertFragment(fragmentId, point = null)
	{
		if (!canInsert())
		{
			return refused();
		}

		diagramStore.startFragmentInsert(fragmentId);
		try
		{
			return await addFragment(fragmentId, point);
		}
		finally
		{
			diagramStore.finishFragmentInsert();
		}
	}

	return { insertFragment };
}
