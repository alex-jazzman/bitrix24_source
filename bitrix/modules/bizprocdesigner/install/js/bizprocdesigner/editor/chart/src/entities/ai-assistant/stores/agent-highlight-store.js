import { defineStore } from 'ui.vue3.pinia';

import type { BlockId } from '../../../shared/types';
import { AGENT_HIGHLIGHT_DURATION_MS } from '../constants';

type AgentHighlightBlockState = {
	remainingMs: number,
	timerId: ?number,
	isSeen: boolean,
	startedAt: ?number,
};

type AgentHighlightState = {
	highlightedBlockIds: Set<BlockId>,
	isTabActive: boolean,
	lastVisibleBlockIds: Set<BlockId>,
	pendingSeenBlockIds: Set<BlockId>,
	blockStates: Map<BlockId, AgentHighlightBlockState>,
};

type AgentHighlightStore = AgentHighlightState & {
	dismiss: (blockId: BlockId) => void,
};

function isSameBlockIdSet(left: Set<BlockId>, right: Set<BlockId>): boolean
{
	if (left.size !== right.size)
	{
		return false;
	}

	for (const blockId: BlockId of left)
	{
		if (!right.has(blockId))
		{
			return false;
		}
	}

	return true;
}

function clearTimer(store: AgentHighlightStore, blockId: BlockId): void
{
	const blockState: ?AgentHighlightBlockState = store.blockStates.get(blockId);
	if (!blockState)
	{
		return;
	}

	if (blockState.timerId !== null)
	{
		clearTimeout(blockState.timerId);
		blockState.timerId = null;
	}

	blockState.startedAt = null;
}

// A node starts its countdown once it has been seen on an active tab, and the running countdown
// is never taken back: the visible set of the diagram engine is empty for a frame after clear().
function schedule(store: AgentHighlightStore): void
{
	if (!store.isTabActive)
	{
		return;
	}

	for (const blockId: BlockId of store.highlightedBlockIds)
	{
		const blockState: ?AgentHighlightBlockState = store.blockStates.get(blockId);
		if (blockState && blockState.isSeen && blockState.timerId === null)
		{
			// Monotonic clock on purpose: a system clock jump (time sync, waking from sleep)
			// would distort the remainder of the countdown.
			blockState.startedAt = performance.now();
			blockState.timerId = setTimeout(() => store.dismiss(blockId), blockState.remainingMs);
		}
	}
}

export const useAgentHighlightStore = defineStore('bizprocdesigner-editor-agent-highlight', {
	state: (): AgentHighlightState => ({
		highlightedBlockIds: new Set(),
		isTabActive: true,
		lastVisibleBlockIds: new Set(),
		pendingSeenBlockIds: new Set(),
		blockStates: new Map(),
	}),
	getters: {
		isBlockHighlighted: (state: AgentHighlightState): ((blockId: BlockId) => boolean) => {
			return (blockId: BlockId): boolean => state.highlightedBlockIds.has(blockId);
		},

		// Whether the ring of the node has to spin: the highlight itself lives until its countdown
		// ends, but the animation is worth its main-thread cost only inside the visible set.
		// The visible set is read after the highlight check, so an unlit card never depends on it.
		isBlockHighlightAnimated: (state: AgentHighlightState): ((blockId: BlockId) => boolean) => {
			return (blockId: BlockId): boolean => (
				state.highlightedBlockIds.has(blockId) && state.lastVisibleBlockIds.has(blockId)
			);
		},
	},
	actions: {
		// The highlighted set is filled before the countdown states below, and the order matters:
		// the visible-set bridge subscribes on this set becoming non-empty and hands the current
		// set over at once, while that set still describes the graph revision before this apply.
		markTouched(blockIds: Set<BlockId> | Array<BlockId>): void
		{
			for (const blockId: BlockId of blockIds)
			{
				this.highlightedBlockIds.add(blockId);
			}

			// Every node waits for a visibility signal of its own instead of trusting the last known
			// set: the index of the engine is rebuilt on requestAnimationFrame, so until the next
			// signal arrives the set still answers for the graph as it was before this apply.
			for (const blockId: BlockId of blockIds)
			{
				clearTimer(this, blockId);

				this.blockStates.set(blockId, {
					remainingMs: AGENT_HIGHLIGHT_DURATION_MS,
					timerId: null,
					isSeen: false,
					startedAt: null,
				});
				this.pendingSeenBlockIds.add(blockId);
			}
		},

		// Called on every camera frame: the engine hands over a new set even when its composition
		// did not change, so an unchanged composition must cost nothing beyond this comparison.
		// Pending nodes are the exception: one that was visible and stayed visible gets no changed
		// composition of its own, and dropping its signal would leave it without a countdown.
		setVisibleBlockIds(visibleBlockIds: Set<BlockId>): void
		{
			if (this.pendingSeenBlockIds.size === 0 && isSameBlockIdSet(this.lastVisibleBlockIds, visibleBlockIds))
			{
				return;
			}

			// The set is patched in place instead of replaced: the animation flag of a card reads
			// has(blockId), so only the cards whose own visibility changed are invalidated, not
			// every highlighted card on the canvas. The ids that left are collected first, because
			// the set being walked is the one being changed.
			const goneBlockIds: Array<BlockId> = [];
			for (const blockId: BlockId of this.lastVisibleBlockIds)
			{
				if (!visibleBlockIds.has(blockId))
				{
					goneBlockIds.push(blockId);
				}
			}

			for (const blockId: BlockId of goneBlockIds)
			{
				this.lastVisibleBlockIds.delete(blockId);
			}

			for (const blockId: BlockId of visibleBlockIds)
			{
				this.lastVisibleBlockIds.add(blockId);
			}

			// Only the nodes still waiting for a confirmation are walked, and the confirmed ones are
			// collected first: the set being walked is the one being changed.
			const seenBlockIds: Array<BlockId> = [];
			for (const blockId: BlockId of this.pendingSeenBlockIds)
			{
				if (this.lastVisibleBlockIds.has(blockId))
				{
					seenBlockIds.push(blockId);
				}
			}

			for (const blockId: BlockId of seenBlockIds)
			{
				this.pendingSeenBlockIds.delete(blockId);

				const blockState: ?AgentHighlightBlockState = this.blockStates.get(blockId);
				if (blockState)
				{
					blockState.isSeen = true;
				}
			}

			schedule(this);
		},

		setTabActive(isActive: boolean): void
		{
			this.isTabActive = isActive;

			if (!isActive)
			{
				for (const [blockId, blockState] of this.blockStates.entries())
				{
					if (blockState.timerId !== null)
					{
						const elapsedMs: number = performance.now() - blockState.startedAt;
						blockState.remainingMs = Math.max(blockState.remainingMs - elapsedMs, 0);
						clearTimer(this, blockId);
					}
				}
			}

			schedule(this);
		},

		dismiss(blockId: BlockId): void
		{
			clearTimer(this, blockId);

			this.blockStates.delete(blockId);
			this.pendingSeenBlockIds.delete(blockId);
			this.highlightedBlockIds.delete(blockId);
		},

		// A node gone from the diagram keeps no highlight state: without a countdown of its own
		// (nobody saw it) the record would live until reset(). The ids to drop are collected first,
		// because dismiss() deletes from the very set being walked.
		retainBlocks(existingBlockIds: Set<BlockId> | Array<BlockId>): void
		{
			const existing: Set<BlockId> = new Set(existingBlockIds);
			const missingBlockIds: Array<BlockId> = [];
			for (const blockId: BlockId of this.highlightedBlockIds)
			{
				if (!existing.has(blockId))
				{
					missingBlockIds.push(blockId);
				}
			}

			for (const blockId: BlockId of missingBlockIds)
			{
				this.dismiss(blockId);
			}
		},

		reset(): void
		{
			for (const blockId: BlockId of this.blockStates.keys())
			{
				clearTimer(this, blockId);
			}

			this.blockStates.clear();
			this.pendingSeenBlockIds.clear();
			this.highlightedBlockIds.clear();
			this.lastVisibleBlockIds.clear();
		},
	},
});
