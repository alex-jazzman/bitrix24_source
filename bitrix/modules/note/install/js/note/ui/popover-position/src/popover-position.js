// [#5] Shared "centered under the trigger, clamped to the viewport" positioning for every hub
// popover (views / subscription / filter) — previously each one anchored differently (views from
// the left edge, subscription from the right edge via plain CSS `left:0`/`right:0`), which read as
// inconsistent. Mirrors mockup-activity-line.html's showPop(): fixed position, horizontally
// centered on the trigger, flips above when there isn't enough room below.
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 10;

export function positionPopoverUnderTrigger(trigger: ?HTMLElement, popover: ?HTMLElement): void
{
	if (!(trigger instanceof HTMLElement) || !(popover instanceof HTMLElement))
	{
		return;
	}

	const anchorRect = trigger.getBoundingClientRect();
	const popoverWidth = popover.offsetWidth;
	const popoverHeight = popover.offsetHeight;

	let left = anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2);
	left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, window.innerWidth - popoverWidth - VIEWPORT_MARGIN_PX));

	let top = anchorRect.bottom + GAP_PX;
	if (top + popoverHeight > window.innerHeight - VIEWPORT_MARGIN_PX)
	{
		top = anchorRect.top - popoverHeight - GAP_PX;
	}

	popover.style.left = `${left}px`;
	popover.style.top = `${top}px`;
}

// Keeps a fixed-position popover glued to its trigger while the page scrolls or the window resizes.
// The hub popovers are `position: fixed`, so once opened they hang at their initial viewport spot
// while the trigger (which lives in the scrolling document body) drifts away. This re-runs the
// positioning on every scroll/resize so the popover tracks the trigger, and dismisses it once the
// trigger has scrolled out of view (following it to a clamped viewport edge would read as stuck).
//
// The scroll listener is on `document` in the CAPTURE phase on purpose: the editor content scrolls
// inside main.content (not the window), and only capture-phase document listeners see scroll events
// on inner containers. Returns a disposer — call it from closePopover().
export function keepPopoverAnchored(
	trigger: ?HTMLElement,
	popover: ?HTMLElement,
	onDismiss: () => void,
): () => void
{
	const reposition = () => {
		if (!(trigger instanceof HTMLElement) || !(popover instanceof HTMLElement))
		{
			return;
		}

		const rect = trigger.getBoundingClientRect();
		if (rect.bottom <= 0 || rect.top >= window.innerHeight)
		{
			if (typeof onDismiss === 'function')
			{
				onDismiss();
			}

			return;
		}

		positionPopoverUnderTrigger(trigger, popover);
	};

	// A capture-phase scroll listener on the document fires for every inner container the reader
	// scrolls, several times per frame — and reposition() reads the trigger's box and then writes the
	// popover's style, the pair that costs a forced layout each time it repeats inside one frame.
	// Coalescing to one run per frame keeps the popover glued to the trigger just as tightly (the
	// browser paints once per frame anyway) at one measurement instead of many.
	let frameId = null;
	const scheduleReposition = () => {
		if (frameId !== null)
		{
			return;
		}

		frameId = requestAnimationFrame(() => {
			frameId = null;
			reposition();
		});
	};

	document.addEventListener('scroll', scheduleReposition, true);
	window.addEventListener('resize', scheduleReposition);

	return () => {
		if (frameId !== null)
		{
			cancelAnimationFrame(frameId);
			frameId = null;
		}

		document.removeEventListener('scroll', scheduleReposition, true);
		window.removeEventListener('resize', scheduleReposition);
	};
}
