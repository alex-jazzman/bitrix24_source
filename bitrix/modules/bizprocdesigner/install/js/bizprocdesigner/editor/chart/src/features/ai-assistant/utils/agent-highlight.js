import { Event } from 'main.core';
import { type AnimationItem, useBlockDiagram } from 'ui.block-diagram';
import { watch, toValue, getCurrentScope, onScopeDispose } from 'ui.vue3';

import { useAgentHighlightStore } from '../../../entities/ai-assistant/stores/agent-highlight-store';
import { collectAgentTouchedBlockIds } from '../../../entities/ai-assistant/util/agent-touched-blocks';
import { diagramStore } from '../../../entities/blocks';
import { type Block, type BlockId } from '../../../shared/types';

type AgentHighlightInput = {
	changedBlockIds: Set<BlockId>,
	animatedItems: Array<AnimationItem>,
	newBlocks: Array<Block>,
};

/**
 * The only touch point between the highlight feature and the graph-apply callback:
 * turns one applied agent graph into the set of nodes to highlight.
 *
 * changedBlockIds comes from updateExistedBlockProperties(): the applying reports the blocks it
 * found different, because it mutates the stored blocks in place and leaves nothing to compare.
 */
export function highlightAgentChanges(input: AgentHighlightInput): void
{
	const store = useAgentHighlightStore();

	const touchedBlockIds: Set<BlockId> = collectAgentTouchedBlockIds(input);
	if (touchedBlockIds.size > 0)
	{
		store.markTouched(touchedBlockIds);
	}

	// Runs on every apply and after markTouched(), so that a node this very apply highlighted is
	// cleaned up as well. The applied graph is always the whole node set, so a highlighted id
	// missing from it belongs to a node the agent has removed.
	store.retainBlocks(input.newBlocks.map((block: Block): BlockId => block.id));
}

/**
 * Initialization at editor startup: feeds the store with the visible set of the
 * diagram engine and with the tab activity, and clears the highlight when the
 * template changes or the editor unmounts.
 *
 * Must be called synchronously in the app setup(): outside an effect scope neither the watchers
 * below nor the visibilitychange listener can be stopped, and they would outlive the editor.
 */
export function initAgentHighlight(): void
{
	const store = useAgentHighlightStore();
	const { blockIntersections } = useBlockDiagram();

	const syncVisibleBlockIds = (): void => {
		store.setVisibleBlockIds(toValue(blockIntersections.visibleBlockIds));
	};

	// The handler closes over the store captured here: declared outside setup() it would resolve the
	// store on every call, through whichever pinia happens to be the active one by then.
	const handleVisibilityChange = (): void => {
		store.setTabActive(!document.hidden);
	};

	store.setTabActive(!document.hidden);
	Event.bind(document, 'visibilitychange', handleVisibilityChange);

	let stopVisibleBlockIdsWatch: ?(() => void) = null;

	// visibleBlockIds is a computed set of every visible id, and this is its only standing reader:
	// kept alive, it would rebuild and compare that set on every camera frame even with nothing
	// highlighted. So the subscription lives exactly as long as the highlight does.
	watch(
		() => store.highlightedBlockIds.size,
		(highlightedCount: number): void => {
			if (highlightedCount > 0 && stopVisibleBlockIdsWatch === null)
			{
				// Read at once: while unsubscribed the store has missed every camera move.
				syncVisibleBlockIds();
				stopVisibleBlockIdsWatch = watch(blockIntersections.visibleBlockIds, syncVisibleBlockIds);
			}
			else if (highlightedCount === 0 && stopVisibleBlockIdsWatch !== null)
			{
				stopVisibleBlockIdsWatch();
				stopVisibleBlockIdsWatch = null;
			}
		},
		// Synchronous on purpose: markTouched() itself brings the highlight set to life, and the
		// subscription has to be in place before that call returns, so that the first visible set
		// of the applied graph revision reaches the store and starts the countdowns.
		{ flush: 'sync' },
	);

	// A node can leave the graph outside an agent apply - deleted by hand, undone from history - and
	// retainBlocks() runs on an apply only. One still waiting for its first visibility signal has no
	// countdown to end it either, so its record would keep the highlight set non-empty, and with it the
	// subscription above, until the template changes. The count of blocks is the trigger; a change that
	// keeps it - a node deleted and another added in the same tick - is left to the next apply.
	watch(() => diagramStore().blocks.length, (): void => {
		if (store.highlightedBlockIds.size === 0)
		{
			return;
		}

		store.retainBlocks(diagramStore().blocks.map((block: Block): BlockId => block.id));
	});

	watch(() => diagramStore().templateId, (): void => {
		store.reset();
	});

	if (getCurrentScope())
	{
		onScopeDispose((): void => {
			Event.unbind(document, 'visibilitychange', handleVisibilityChange);
			// Stopped by hand: the watcher above is already stopped by the scope by now, so the
			// reset() below no longer takes the subscription off on its own.
			stopVisibleBlockIdsWatch?.();
			stopVisibleBlockIdsWatch = null;
			store.reset();
		});
	}
	else
	{
		// A broken contract, not a supported path: nothing here can be stopped without a scope.
		console.error(
			'initAgentHighlight() must be called synchronously in setup(): with no effect scope '
			+ 'the visibilitychange listener and the watchers live until the page is reloaded',
		);
	}
}
