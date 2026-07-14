// Height + opacity collapse/expand animation for a group of sibling blocks
// hidden under a heading. Uses the same timing as note.sidebar's
// ExpandTransition (DURATION_MS / EASING kept in sync).
//
// Built on the Web Animations API on purpose: WAAPI keyframes don't touch the
// elements' style attribute. In edit mode ProseMirror's DOM observer treats
// style mutations as potential input — it marks the mutated blocks dirty and
// redraws them, wiping inline styles mid-flight, so a transition-based
// animation never gets to run there (read mode ignores DOM mutations).

export const DURATION_MS = 275;
export const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
// Safety net if `finished` never settles (block redrawn/detached mid-flight).
const FALLBACK_MS = DURATION_MS + 100;

// Forwards-filling collapse animations, held until the collapse decoration
// hides the block with display:none (see cancelCollapseAnimation).
const heldAnimations: WeakMap<HTMLElement, Object> = new WeakMap();

function expandedKeyframe(el: HTMLElement): Object
{
	const computed = window.getComputedStyle(el);

	return {
		height: `${el.scrollHeight}px`,
		opacity: 1,
		marginTop: computed.marginTop,
		marginBottom: computed.marginBottom,
		paddingTop: computed.paddingTop,
		paddingBottom: computed.paddingBottom,
		overflow: 'hidden',
	};
}

function collapsedKeyframe(): Object
{
	return {
		height: '0px',
		opacity: 0,
		marginTop: '0px',
		marginBottom: '0px',
		paddingTop: '0px',
		paddingBottom: '0px',
		overflow: 'hidden',
	};
}

// Releases the filling collapse animation once the caller has hidden the
// block, handing the element back to CSS-driven layout.
export function cancelCollapseAnimation(el: HTMLElement): void
{
	if (!(el instanceof HTMLElement))
	{
		return;
	}

	const animation = heldAnimations.get(el);
	if (animation)
	{
		heldAnimations.delete(el);
		animation.cancel();
	}
}

// Animates `blocks` between expanded and collapsed.
//   collapsing=true  : current height -> 0, held at 0 (fill: forwards) until
//                      the caller hides the blocks and cancels the animations
//                      via cancelCollapseAnimation.
//   collapsing=false : 0 -> natural height; no fill, the block lands back on
//                      CSS-driven layout by itself.
// The caller must have already made the blocks renderable (no display:none)
// when expanding, so their natural height can be measured.
export function animateCollapse(blocks: HTMLElement[], { collapsing }: { collapsing: boolean }): Promise<void>
{
	const elements = (Array.isArray(blocks) ? blocks : []).filter((el) => el instanceof HTMLElement);
	if (elements.length === 0 || typeof window === 'undefined' || typeof Element.prototype.animate !== 'function')
	{
		return Promise.resolve();
	}

	const settled = elements.map((el) => {
		cancelCollapseAnimation(el);

		const expanded = expandedKeyframe(el);
		const animation = el.animate(
			collapsing ? [expanded, collapsedKeyframe()] : [collapsedKeyframe(), expanded],
			{ duration: DURATION_MS, easing: EASING, fill: collapsing ? 'forwards' : 'none' },
		);

		if (collapsing)
		{
			heldAnimations.set(el, animation);
		}

		return new Promise((resolve) => {
			const timer = setTimeout(resolve, FALLBACK_MS);
			const settle = () => {
				clearTimeout(timer);
				resolve();
			};
			// Settles on finish and on cancel alike — the caller only needs to
			// know the visual phase is over.
			animation.finished.then(settle, settle);
		});
	});

	return Promise.all(settled).then(() => {});
}
