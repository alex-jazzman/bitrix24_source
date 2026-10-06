/**
 * Coordinator of automatic diagram layout.
 *
 * Availability is the state of the editor and nothing else, because the button reads it on every
 * render. Whether the graph has anything to order is answered by the run itself, from the layout
 * snapshot it builds once: the snapshot mirrors the hit-test of the server, so it is the single rule
 * of which frame owns which block, and a cheaper rule of the same thing kept here would disagree
 * with it at the borders of a frame and answer the click with the wrong reason.
 */

import { nextTick, toValue } from 'ui.vue3';
import { useBlockDiagram, useHistory } from 'ui.block-diagram';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import type { Block, BlockId, BlockPosition } from '../../../shared/types';
import { buildLayoutSnapshot } from '../lib/build-layout-snapshot';
import { runGraphLayout } from '../lib/graph-layout';
import {
	LAYOUT_REJECTED_REASON,
	LAYOUT_STATUS,
	LAYOUT_UNCHANGED_REASON,
	layoutRejected,
	layoutUnchanged,
} from './types';
import type { LayoutRejectedReason, LayoutResult } from './types';

/**
 * What a run reports to the user. Every rejection is reported; of the unchanged outcomes the single
 * rigid frame and the degenerate input are, because the button stays enabled for both and a silent
 * click would look like a dead control. `alreadyArranged` means the command had nothing to do.
 */
export type LayoutNoticeReason = LayoutRejectedReason
	| typeof LAYOUT_UNCHANGED_REASON.singleRigidFrame
	| typeof LAYOUT_UNCHANGED_REASON.degenerateInput;

export type UseDiagramLayoutOptions = {
	/** Receives the reason code of a run the user has to learn about; the text is the caller's. */
	+notify?: (reason: LayoutNoticeReason) => void,
};

export type UseDiagramLayout = {
	/** True while the editor accepts the command; whether the graph is layoutable is up to `run`. */
	+isAvailable: () => boolean,
	+run: () => Promise<LayoutResult>,
};

export function useDiagramLayout(options: UseDiagramLayoutOptions = {}): UseDiagramLayout
{
	const diagram = useBlockDiagram();
	const history = useHistory();
	const store = useDiagramStore();
	const notify = options.notify ?? ((): void => undefined);

	function isEditorDisabled(): boolean
	{
		return toValue(diagram.isDisabledBlockDiagram) || store.isTemplateNotFound || store.isEditorReadonly;
	}

	function isAvailable(): boolean
	{
		return !isEditorDisabled() && Array.isArray(store.blocks) && Array.isArray(store.connections);
	}

	async function run(): Promise<LayoutResult>
	{
		// A disabled editor is unreachable through the button, so this outcome stays silent; every
		// outcome of a real run is answered with a notice, `alreadyArranged` aside.
		if (!isAvailable())
		{
			return layoutUnchanged(LAYOUT_UNCHANGED_REASON.degenerateInput);
		}

		const blocks = store.blocks;
		const connections = store.connections;

		const snapshot = buildLayoutSnapshot(blocks, connections, toValue(diagram.blocksRectMap));
		if (snapshot.status === LAYOUT_STATUS.rejected)
		{
			notify(snapshot.reason);

			return snapshot;
		}

		const result = runGraphLayout(snapshot.snapshot);
		if (result.status === LAYOUT_STATUS.rejected)
		{
			notify(result.reason);

			return result;
		}

		if (result.status === LAYOUT_STATUS.unchanged)
		{
			if (result.reason !== LAYOUT_UNCHANGED_REASON.alreadyArranged)
			{
				notify(result.reason);
			}

			return result;
		}

		// The computation is synchronous, so the model can only have moved under a reentrant
		// command; the references are compared anyway, because a stale write is unrecoverable.
		if (isEditorDisabled() || store.blocks !== blocks || store.connections !== connections)
		{
			notify(LAYOUT_REJECTED_REASON.modelChanged);

			return layoutRejected(LAYOUT_REJECTED_REASON.modelChanged);
		}

		applyPositions(blocks, result.positions);
		await nextTick();
		await history.makeSnapshot();

		return result;
	}

	/**
	 * One replacement of the whole list in its original order, with a new object only for the blocks
	 * that moved. The measured geometry follows the same offsets by arithmetic: undo derives its own
	 * offsets from the model, so geometry left behind here would drift by one move on every cycle.
	 */
	function applyPositions(blocks: $ReadOnlyArray<Block>, positions: $ReadOnlyMap<BlockId, BlockPosition>): void
	{
		const offsets: Map<BlockId, BlockPosition> = new Map();

		const nextBlocks = blocks.map((block) => {
			const position = positions.get(block.id);

			if (!position)
			{
				return block;
			}

			offsets.set(block.id, { x: position.x - block.position.x, y: position.y - block.position.y });

			return { ...block, position: { x: position.x, y: position.y } };
		});

		diagram.replaceBlocks(nextBlocks);
		diagram.translateBlocksGeometry(offsets);
	}

	return {
		isAvailable,
		run,
	};
}
