import { Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useLoc } from './loc';
import type { DiagramBlockId } from '../types';

// Keep in step with the animation in moveable-block.css: the modifier has to outlive the flash,
// otherwise the outline is cut off mid-fade.
export const DISPLACED_STATE_DURATION_MS = 900;

// The outline says nothing to a screen reader, so the same two facts go out through the shared live
// region: a position was corrected, or there was no room and the operation was given up. Both are
// announced when the state is set, so the channel does not depend on the flash timer.
export const DISPLACED_MESSAGE_ID = 'UI_BLOCK_DIAGRAM_A11Y_BLOCK_DISPLACED';
export const PLACEMENT_REFUSED_MESSAGE_ID = 'UI_BLOCK_DIAGRAM_A11Y_PLACEMENT_REFUSED';

// The handle of the expiry timer: an implementation detail of this composable alone, so it is kept
// here and not in the state the consumer reads through `useBlockDiagram`. Keyed by the reference of
// the diagram it belongs to - every caller of `useDisplacedBlocks` builds a closure of its own, and
// the timer one of them started has to be cancellable by the next; two diagrams on one page keep
// their timers apart, exactly as they did while the handle was part of their state.
const resetTimerIdByChannel: WeakMap<Object, number> = new WeakMap();

export type UseDisplacedBlocksOptions = {
	durationMs?: number,
	setTimeoutFn?: typeof setTimeout,
	clearTimeoutFn?: typeof clearTimeout,
};

export type UseDisplacedBlocks = {
	displacedBlockIds: Array<DiagramBlockId>;
	mark: (blockIds: Array<DiagramBlockId>) => void;
	markRefused: (blockIds: Array<DiagramBlockId>) => void;
	announceRefusal: () => void;
	clear: () => void;
	isBlockDisplaced: (blockId: DiagramBlockId) => boolean;
	isBlockPlacementRefused: (blockId: DiagramBlockId) => boolean;
};

export function useDisplacedBlocks(options: UseDisplacedBlocksOptions = {}): UseDisplacedBlocks
{
	const {
		durationMs = DISPLACED_STATE_DURATION_MS,
		// Bound to the global object: the native timers throw on a bare reference. Injection for
		// tests with fake clocks takes precedence, as in AnimationStepController.
		setTimeoutFn = globalThis.setTimeout.bind(globalThis),
		clearTimeoutFn = globalThis.clearTimeout.bind(globalThis),
	} = options;
	const { displacedBlockIds, isPlacementRefused } = useBlockDiagram();
	const loc = useLoc();

	// Two identical announcements in a row do reach the reader: LiveAnnouncer empties the live region
	// and fills it again a frame later, and it drops a repeat only while the previous one is still
	// queued unspoken. So no counter or separator is added here on purpose - one would defeat that
	// very guard against a burst of gestures.
	function announce(messageId: string): void
	{
		const message = loc.getMessage(messageId);

		// A consumer that gave the application no localization plugin gets no announcement, not an
		// empty live region put into its page.
		if (!Type.isStringFilled(message))
		{
			return;
		}

		LiveAnnouncer.announce(message, 'polite');
	}

	function cancelReset(): void
	{
		const timerId = resetTimerIdByChannel.get(displacedBlockIds) ?? null;

		if (timerId !== null)
		{
			clearTimeoutFn(timerId);
			resetTimerIdByChannel.delete(displacedBlockIds);
		}
	}

	function clear(): void
	{
		cancelReset();
		displacedBlockIds.value = [];
		isPlacementRefused.value = false;
	}

	// A displacement has no lifecycle of its own to hang the reset on, so the state expires on a
	// timer. A newer answer replaces the whole set and restarts the countdown.
	function lightChannel(blockIds: Array<DiagramBlockId>, refused: boolean): void
	{
		if (blockIds.length === 0)
		{
			return;
		}

		cancelReset();
		displacedBlockIds.value = [...new Set(blockIds)];
		isPlacementRefused.value = refused;
		resetTimerIdByChannel.set(displacedBlockIds, setTimeoutFn((): void => {
			clear();
		}, durationMs));
	}

	function mark(blockIds: Array<DiagramBlockId>): void
	{
		if (blockIds.length === 0)
		{
			return;
		}

		lightChannel(blockIds, false);
		announce(DISPLACED_MESSAGE_ID);
	}

	// The refusal of an operation that never reached the model: a dropped or pasted node exists
	// nowhere, so there is nothing to outline and the announcement is the whole feedback.
	function announceRefusal(): void
	{
		announce(PLACEMENT_REFUSED_MESSAGE_ID);
	}

	// The refusal of an operation that has nodes to point at: they are marked where they came back
	// to, and the announcement tells why they stayed there.
	function markRefused(blockIds: Array<DiagramBlockId>): void
	{
		lightChannel(blockIds, true);
		announceRefusal();
	}

	function isInChannel(blockId: DiagramBlockId): boolean
	{
		return toValue(displacedBlockIds).includes(blockId);
	}

	// "Moved out of the way" and "there was no room" are two different answers, so they light two
	// different modifiers: a block that stayed where it was must not flash the same way as one the
	// rule has just carried aside.
	function isBlockDisplaced(blockId: DiagramBlockId): boolean
	{
		return isInChannel(blockId) && !toValue(isPlacementRefused);
	}

	function isBlockPlacementRefused(blockId: DiagramBlockId): boolean
	{
		return isInChannel(blockId) && toValue(isPlacementRefused) === true;
	}

	return {
		displacedBlockIds,
		mark,
		markRefused,
		announceRefusal,
		clear,
		isBlockDisplaced,
		isBlockPlacementRefused,
	};
}
