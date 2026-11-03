import { InteractivityChecker } from 'ui.a11y';

import type { FocusZone } from 'ui.a11y';

// Keeps a surface that never becomes visible from waiting forever.
const MAX_WAIT_FRAMES = 20;

/**
 * Runs `callback` once `container` is really visible and, when given, `isReady` holds too.
 *
 * Popup content is mounted while the popup is still fading in, and nothing inside an invisible
 * element is focusable: focus work done right away is silently lost. `isReady` covers what a visible
 * container does not hold yet - the sticker grid is a skeleton until its first page arrives. Both
 * share the frame budget, so a surface that never gets ready still runs its callback.
 *
 * Cancel on unmount, or a pending frame runs the callback for a surface that is already gone.
 */
export function runWhenVisible(
	container: HTMLElement,
	callback: () => void,
	isReady: (() => boolean) | null = null,
): () => void
{
	let frameId: number | null = null;

	const isSurfaceReady = (): boolean => {
		return InteractivityChecker.isVisible(container) && (isReady === null || isReady());
	};

	const runWhenReady = (attempt: number): void => {
		if (attempt >= MAX_WAIT_FRAMES || isSurfaceReady())
		{
			callback();

			return;
		}

		frameId = requestAnimationFrame(() => {
			frameId = null;
			runWhenReady(attempt + 1);
		});
	};

	runWhenReady(0);

	return () => {
		if (frameId !== null)
		{
			cancelAnimationFrame(frameId);
			frameId = null;
		}
	};
}

/**
 * Activates a focus zone once its container is really visible: a zone activated over an invisible
 * container collects an empty set and stays dead for the rest of its life - no roving tabindex, no
 * reaction to arrows.
 *
 * The frame budget of `runWhenVisible` lands on exactly that dead zone, so an activation it forced
 * refreshes the element set once the container does show up - markup that never changes again (the
 * emoji grid, the switcher chips) is collected no other way. A refresh over a container that stays
 * invisible collects the same empty set, so that second wait needs no exit of its own.
 */
export function activateWhenVisible(zone: FocusZone, container: HTMLElement): () => void
{
	let cancelRefresh: (() => void) | null = null;

	const cancelActivation = runWhenVisible(container, () => {
		const forcedByFrameBudget = !InteractivityChecker.isVisible(container);

		zone.activate();

		if (forcedByFrameBudget)
		{
			cancelRefresh = runWhenVisible(container, () => {
				zone.refreshElements();
			});
		}
	});

	return () => {
		cancelActivation();
		cancelRefresh?.();
	};
}
