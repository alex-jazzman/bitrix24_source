import { watch, getCurrentScope, onScopeDispose } from 'ui.vue3';
import { useBlockDiagram } from 'ui.block-diagram';

/**
 * Highlights a collapsed browser tab while the graph from the external
 * AI agent is being applied: if the tab is inactive at the moment the
 * animation starts (document.hidden), a static marker prefix is prepended to document.title.
 * The marker is removed when the animation completes OR when the tab regains
 * focus — whichever comes first.
 *
 * Agent data is NOT put into the title — only a static marker on top of
 * the original document.title (security invariant).
 */

const MARKER: string = '● '; // '● ' is a layout detail, not agent data

let originalTitle: string | null = null;
let active: boolean = false;

/**
 * Prepends the marker to the current document.title. Idempotent — a repeated
 * call does not stack markers.
 */
export function activate(): void
{
	if (active)
	{
		return;
	}

	originalTitle = document.title;
	document.title = `${MARKER}${originalTitle}`;
	active = true;
}

/**
 * Removes the highlight. Idempotent — a call with no active highlight does
 * nothing.
 *
 * It strips the marker prefix off the CURRENT document.title rather than
 * restoring a saved title: if document.title was replaced entirely (without
 * the marker) while the highlight was active, that is a newer value —
 * we leave it as is. This way more recent title changes are not overwritten,
 * and the security invariant holds (the marker is only removed).
 */
export function deactivate(): void
{
	if (!active)
	{
		return;
	}

	if (document.title.startsWith(MARKER))
	{
		document.title = document.title.slice(MARKER.length);
	}

	originalTitle = null;
	active = false;
}

function onVisibility(): void
{
	if (!document.hidden)
	{
		deactivate();
	}
}

/**
 * Hook from the graph-apply callback (after the animation starts). The
 * highlight is set ONLY if the tab is inactive at the moment of the start.
 */
export function onAgentAnimationStart(): void
{
	if (!document.hidden)
	{
		return;
	}

	activate();
}

/**
 * Initialization at app startup: subscribes to the tab regaining focus and
 * to the animation completing (isStopAnimation from useBlockDiagram()).
 * Must be called synchronously in the app setup().
 *
 * Resilient to the editor being remounted: the animation-completion watch is
 * bound to the calling setup scope (on remount it is recreated together with
 * the new instance, and the previous instance watch is disposed automatically),
 * while the visibilitychange listener is removed when the owning scope is
 * disposed so it does not dangle. A repeated addEventListener with the same
 * handler reference does not create duplicates.
 */
export function init(): void
{
	document.addEventListener('visibilitychange', onVisibility);

	const scope = getCurrentScope();
	if (scope)
	{
		onScopeDispose((): void => {
			document.removeEventListener('visibilitychange', onVisibility);
		});
	}

	const { isStopAnimation } = useBlockDiagram();
	watch(isStopAnimation, (isStopped: boolean): void => {
		if (isStopped)
		{
			deactivate();
		}
	});
}
