import { markRaw } from 'ui.vue3';

import { markSectionMotion, prefersReducedMotion } from '../utils/drop-motion';

// Height + opacity expand/collapse transition for a single v-if child.
//
// Behavior:
//   - Normal mount: animates 0 -> the height the open element actually renders at (opacity 0 -> 1).
//   - Normal unmount: animates that rendered height -> 0 (opacity 1 -> 0).
//   - `loading=true` at mount: skips the entrance and waits for `loading` to
//     flip to false, then animates the captured loader height → real content
//     height (no opacity fade — the loader was already fully visible).
//   - Empty content (measures 0 high) at mount or leave: no animation.
//
// Rendered height, never scrollHeight: every section this wraps scrolls inside itself and is capped
// (max-height, flex-shrink), so scrollHeight is the height of the CONTENT and can be several times the
// height on screen. Animating to it overshoots the visible box - the growth ends in a snap and the
// collapse spends most of its duration above the fold, which reads as lag rather than as motion.

const DURATION_MS = 275;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Safety net in case `transitionend` is swallowed (display:none, detached
// element mid-flight, browser quirks). Slightly longer than DURATION_MS.
const FALLBACK_MS = DURATION_MS + 100;

// Length of every motion below, and zero where less motion was asked for: the end state is the same one,
// reached at once. The waits are short-circuited along with it - a zero-length transition fires no
// `transitionend`, and nothing may be left holding an inline style.
function durationMs()
{
	return prefersReducedMotion() ? 0 : DURATION_MS;
}

// While the height is the animation's and not the content's, the areas inside overflow their share of
// the box and their scrollbars flash on. The class lets the stylesheet hold back the paint for exactly
// as long as that lasts; the boxes keep scrolling, which the sticky row controls depend on.
const ANIMATING_CLASS = 'is-expand-animating';

// Marks the box on its way out for the sidebar's share pass: what a section on its way out occupies is
// the height it is at, not the rows it still holds. Counted by its rows, it kept a full share of the
// panel for the whole animation and gave it up in one step at the end - the sections staying behind grew
// into the freed room abruptly instead of following it down.
const LEAVING_ATTRIBUTE = 'expandLeaving';

// Cropping the box to the height being animated, without turning it into a scroll container. That
// distinction is the whole point: `overflow: hidden` makes one, and a sticky element then holds to the
// edge of THAT box instead of the list's visible edge - so the controls of a row wider than the panel
// spent the animation off screen and snapped into place the moment the style was cleared. `clip` crops
// the same way and creates no scrollport. Only the height moves here, so the horizontal axis is left
// alone - which `clip` allows and `hidden` does not (it would force the other axis to scroll).
function clipToBox(el)
{
	el.style.overflowX = 'visible';
	el.style.overflowY = 'clip';
}

function releaseBox(el)
{
	el.style.overflowX = '';
	el.style.overflowY = '';
}

// A section of the panel, as opposed to a branch inside one of its lists. Both are opened by this
// transition and the difference decides when the panel's shares may be recounted: a section changes
// them by appearing, a branch only by the content it adds to the section it lives in.
function isSection(el)
{
	return el instanceof HTMLElement && el.classList.contains('collection-list');
}

// Same on the panel holding the sections, for the length of any section's motion: that is when the shares
// of the sections standing still glide to the ones the motion ends at, and outside it a share applies at
// once. Carried by a class rather than by `:has()` on the panel - the baseline this module builds against
// is older than that selector.
const PANEL_ANIMATING_CLASS = 'is-section-animating';

// Remembered while the section is in the panel: a section closing is out of the DOM by the time the
// transition is done with it, and the panel it hung under is no longer reachable from it.
const panels = new WeakMap();

function markPanel(el, animating)
{
	const panel = el.closest?.('.sidebar-sections') ?? panels.get(el);
	if (!(panel instanceof HTMLElement))
	{
		return;
	}

	if (animating)
	{
		panels.set(el, panel);
		panel.classList.add(PANEL_ANIMATING_CLASS);
	}
	else if (!panel.querySelector(`.${ANIMATING_CLASS}`))
	{
		panel.classList.remove(PANEL_ANIMATING_CLASS);
	}
}

// The property the sidebar's measure pass publishes a section's share of the panel in. It is also how a
// section is moved: the pass writes the shares of every section at once - the one opening, the one closing,
// the ones standing still - and one transition of the same length carries all of them there. Kept as two
// motions, a height animated here and the shares transitioned by the stylesheet, they could not be held in
// step: they were started by different events, and on the frames in between their sum was not the height of
// the panel, which is a scrollbar appearing and going away again.
const SHARE_PROPERTY = '--note-section-floor';

const pending = new WeakMap();

function cancelPending(el)
{
	const state = pending.get(el);
	if (!state)
	{
		return;
	}
	el.removeEventListener('transitionend', state.onEnd);
	clearTimeout(state.timer);
	pending.delete(el);
}

function clearInlineStyles(el)
{
	el.classList.remove(ANIMATING_CLASS);
	markPanel(el, false);
	delete el.dataset[LEAVING_ATTRIBUTE];
	el.style.transition = '';
	el.style.height = '';
	el.style.minHeight = '';
	el.style.flexShrink = '';
	releaseBox(el);
	el.style.opacity = '';
}

// The height the element would settle at if it were simply open: respects the max-height cap and the
// min-height floors the short-panel rules apply, so it is the end of the motion the user sees.
function measureOpenHeight(el)
{
	const previous = {
		transition: el.style.transition,
		height: el.style.height,
		minHeight: el.style.minHeight,
		overflowX: el.style.overflowX,
		overflowY: el.style.overflowY,
	};

	el.style.transition = 'none';
	el.style.minHeight = '';
	el.style.height = 'auto';
	clipToBox(el);
	const height = el.offsetHeight;

	el.style.transition = previous.transition;
	el.style.height = previous.height;
	el.style.minHeight = previous.minHeight;
	el.style.overflowX = previous.overflowX;
	el.style.overflowY = previous.overflowY;

	return height;
}

// Waits out the motion the published share started. Same safety net as the height animation below: a
// `transitionend` can be swallowed, and a section left half-open would never be unmounted.
function awaitShare(el, done)
{
	// The share is already published and the box already at it: there is nothing left to wait for.
	if (prefersReducedMotion())
	{
		done();

		return;
	}

	const finish = () => {
		cancelPending(el);
		done();
	};
	const onEnd = (event) => {
		if (event.target === el && event.propertyName === 'height')
		{
			finish();
		}
	};
	el.addEventListener('transitionend', onEnd);
	const timer = setTimeout(finish, FALLBACK_MS);
	pending.set(el, { onEnd, timer });
}

function animateHeight(el, { from, to, fade, done })
{
	cancelPending(el);
	el.classList.add(ANIMATING_CLASS);
	markPanel(el, true);

	if (from === to || prefersReducedMotion())
	{
		done();
		return;
	}

	const opening = to > from;
	const transitions = [`height ${durationMs()}ms ${EASING}`];

	clipToBox(el);
	el.style.transition = '';
	// The floors of the short-panel rules would clamp the small end of the motion and turn the first
	// (or last) frames into a jump; they belong to the settled layout, not to the animation.
	el.style.minHeight = '0px';
	// With the floor gone the flex layout was free to shrink the box below the height being animated -
	// and it did, sharing the shortfall with the section next to it, so the motion ended a long way short
	// of where it belonged and the floor coming back at the end covered the rest in one step. For the
	// length of the motion the height on this box is the height it gets; the sections around it give way,
	// which is what they do when it is open anyway.
	el.style.flexShrink = '0';
	el.style.height = `${from}px`;
	if (fade)
	{
		el.style.opacity = opening ? '0' : '1';
		transitions.push(`opacity ${durationMs()}ms ${EASING}`);
	}

	// Commit the starting frame before applying target values.
	void el.offsetHeight;

	el.style.transition = transitions.join(', ');
	el.style.height = `${to}px`;
	if (fade)
	{
		el.style.opacity = opening ? '1' : '0';
	}

	const finish = () => {
		cancelPending(el);
		done();
	};
	const onEnd = (event) => {
		if (event.target === el && event.propertyName === 'height')
		{
			finish();
		}
	};
	el.addEventListener('transitionend', onEnd);
	const timer = setTimeout(finish, FALLBACK_MS);
	pending.set(el, { onEnd, timer });
}

export const ExpandTransition = {
	name: 'ExpandTransition',
	props: {
		loading: { type: Boolean, default: false },
	},
	inject: {
		// The share of the panel this section settles at. Published by the sidebar's measure pass, which
		// this asks to run before every measurement: the share depends on which sections are open, and
		// this transition is what opens and closes them.
		noteRefreshSectionFloors: { default: null },
		// Whether the panel of sections is being drawn anew (the collapsed rail giving way to it). Then a
		// section is not opening - it was left open - and there is nothing here to animate.
		noteSectionsAppearing: { default: null },
	},
	data()
	{
		// Plain non-reactive container — we need identity stability for the
		// DOM ref and the in-flight flag, not change tracking.
		return {
			refs: markRaw({ el: null, transitioning: false }),
		};
	},
	methods: {
		onBeforeEnter(el)
		{
			this.refs.el = el;
			this.refs.transitioning = true;
			if (this.loading || this.appearsWithPanel())
			{
				return;
			}
			if (isSection(el))
			{
				el.classList.add(ANIMATING_CLASS);
				el.style.transition = `height ${durationMs()}ms ${EASING}, opacity ${durationMs()}ms ${EASING}`;
				el.style.setProperty(SHARE_PROPERTY, '0px');
				el.style.opacity = '0';

				return;
			}
			clipToBox(el);
			el.style.height = '0px';
			el.style.opacity = '0';
		},
		// A section drawn together with the panel around it: it was open before the panel was collapsed and
		// it is open now, so nothing here is a change of state. Answered for sections only - a branch
		// inside a list is opened by a press and that press is answered wherever the panel came from.
		appearsWithPanel(): boolean
		{
			return isSection(this.refs.el) && this.noteSectionsAppearing?.() === true;
		},
		onEnter(el, done)
		{
			// No mark on the panel and no inline styles left behind: the section is simply there, at the
			// share the panel's own pass gives it in this same tick.
			if (this.appearsWithPanel())
			{
				done();

				return;
			}
			if (this.loading)
			{
				// The loader is not animated - the motion worth showing here is the one the rows make when they
				// replace it - but it stands at its own height from the frame it appears, and the list under it
				// stepped that height in one frame. Marked after `done()`, because the after-enter hook runs
				// inside it and hands the panel's mark straight back; and marked before the share is published,
				// so the section carries everything below it there instead of dropping it.
				done();
				markSectionMotion(document.querySelector('.sidebar'));
				this.noteRefreshSectionFloors?.();

				return;
			}
			if (isSection(el))
			{
				// Marked here and not a hook earlier: before-enter runs while the element is still out of the
				// document, where the panel it belongs to cannot be reached - and without the mark the sections
				// standing still took the room this one is about to fill in one step instead of giving way.
				markPanel(el, true);
				// The zero frame has to be on the books before the share replaces it, or there is nothing
				// for the transition to start from and the section is simply there.
				void el.offsetHeight;
				this.noteRefreshSectionFloors?.();
				el.style.opacity = '1';
				awaitShare(el, done);

				return;
			}
			// A branch opens inside a list, and what it adds the list has to make room for - as the branch
			// takes it, not once it is done. So the pass is told the growth in advance and the section is set
			// off towards the height it ends at over the same time, by the same easing, as the branch itself.
			const target = measureOpenHeight(el);
			const section = el.closest('.collection-list');
			markPanel(el, true);
			// The frame the section starts from has to be on the books with the transition already in force,
			// or the share published next lands in one step: a style change and the rule that would carry it
			// arriving together leave nothing to transition from.
			void section?.offsetHeight;
			this.noteRefreshSectionFloors?.({ section, growth: target });
			animateHeight(el, { from: 0, to: target, fade: true, done });
		},
		onAfterEnter(el)
		{
			clearInlineStyles(el);
			this.refs.transitioning = false;
			// Now that the element stands at its settled height: a branch that opened inside a list added
			// to what the list holds, and the shares of the panel are counted from exactly that.
			this.noteRefreshSectionFloors?.();
		},
		onEnterCancelled(el)
		{
			cancelPending(el);
			clearInlineStyles(el);
			this.refs.el = null;
			this.refs.transitioning = false;
		},
		onBeforeLeave()
		{
			this.refs.transitioning = true;
		},
		onLeave(el, done)
		{
			el.dataset[LEAVING_ATTRIBUTE] = '1';
			if (isSection(el))
			{
				markPanel(el, true);
				el.classList.add(ANIMATING_CLASS);
				el.style.transition = `height ${durationMs()}ms ${EASING}, opacity ${durationMs()}ms ${EASING}`;
				// Its own height, from the share it still holds, is the frame the motion starts at; the pass
				// then hands its room to the sections staying behind, which set off at the same moment.
				void el.offsetHeight;
				this.noteRefreshSectionFloors?.();
				el.style.setProperty(SHARE_PROPERTY, '0px');
				el.style.opacity = '0';
				awaitShare(el, done);

				return;
			}
			const from = el.offsetHeight;
			const section = el.closest('.collection-list');
			markPanel(el, true);
			void section?.offsetHeight;
			this.noteRefreshSectionFloors?.({ section, growth: -from });
			animateHeight(el, { from, to: 0, fade: true, done });
		},
		onAfterLeave(el)
		{
			clearInlineStyles(el);
			this.refs.el = null;
			this.refs.transitioning = false;
			this.noteRefreshSectionFloors?.();
		},
		onLeaveCancelled(el)
		{
			cancelPending(el);
			clearInlineStyles(el);
			this.refs.transitioning = false;
		},
	},
	watch: {
		loading(next, prev)
		{
			// Only react to true → false while the element is mounted and idle.
			if (!prev || next || this.refs.transitioning)
			{
				return;
			}
			const el = this.refs.el;
			if (!el || !el.isConnected)
			{
				return;
			}
			const start = el.offsetHeight;
			// Lock the current height so Vue's content swap doesn't flash.
			el.classList.add(ANIMATING_CLASS);
			clipToBox(el);
			el.style.height = `${start}px`;
			this.$nextTick(() => {
				if (!el.isConnected)
				{
					clearInlineStyles(el);
					return;
				}
				markPanel(el, true);
				if (isSection(el))
				{
					// The loader gave way to the rows, and what the section holds is what its share is counted
					// from - so the share is the whole of the motion here too. The locked height is committed
					// with the transition already in force and then released: from that frame on the section is
					// back to being sized by its share, and the transition carries it there.
					el.style.transition = `height ${durationMs()}ms ${EASING}`;
					void el.offsetHeight;
					this.noteRefreshSectionFloors?.();
					el.style.height = '';
					awaitShare(el, () => {
						clearInlineStyles(el);
						this.noteRefreshSectionFloors?.();
					});

					return;
				}

				const target = measureOpenHeight(el);
				const section = el.closest('.collection-list');
				void section?.offsetHeight;
				this.noteRefreshSectionFloors?.({ section, growth: target - start });
				animateHeight(el, {
					from: start,
					to: target,
					fade: false,
					done: () => {
						clearInlineStyles(el);
						this.noteRefreshSectionFloors?.();
					},
				});
			});
		},
	},
	template: `
		<Transition
			:css="false"
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@after-enter="onAfterEnter"
			@enter-cancelled="onEnterCancelled"
			@before-leave="onBeforeLeave"
			@leave="onLeave"
			@after-leave="onAfterLeave"
			@leave-cancelled="onLeaveCancelled"
		>
			<slot />
		</Transition>
	`,
};
