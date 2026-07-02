import { markRaw } from 'ui.vue3';

// Height + opacity expand/collapse transition for a single v-if child.
//
// Behavior:
//   - Normal mount: animates 0 → scrollHeight (and opacity 0 → 1).
//   - Normal unmount: animates current height → 0 (opacity 1 → 0).
//   - `loading=true` at mount: skips the entrance and waits for `loading` to
//     flip to false, then animates the captured loader height → real content
//     height (no opacity fade — the loader was already fully visible).
//   - Empty content (scrollHeight === 0) at mount or leave: no animation.

const DURATION_MS = 275;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
// Safety net in case `transitionend` is swallowed (display:none, detached
// element mid-flight, browser quirks). Slightly longer than DURATION_MS.
const FALLBACK_MS = DURATION_MS + 100;

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
	el.style.transition = '';
	el.style.height = '';
	el.style.overflow = '';
	el.style.opacity = '';
}

function animateHeight(el, { from, to, fade, done })
{
	cancelPending(el);

	if (from === to)
	{
		done();
		return;
	}

	const opening = to > from;
	const transitions = [`height ${DURATION_MS}ms ${EASING}`];

	el.style.overflow = 'hidden';
	el.style.transition = '';
	el.style.height = `${from}px`;
	if (fade)
	{
		el.style.opacity = opening ? '0' : '1';
		transitions.push(`opacity ${DURATION_MS}ms ${EASING}`);
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
			if (this.loading)
			{
				return;
			}
			el.style.overflow = 'hidden';
			el.style.height = '0px';
			el.style.opacity = '0';
		},
		onEnter(el, done)
		{
			if (this.loading)
			{
				done();
				return;
			}
			animateHeight(el, { from: 0, to: el.scrollHeight, fade: true, done });
		},
		onAfterEnter(el)
		{
			clearInlineStyles(el);
			this.refs.transitioning = false;
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
			animateHeight(el, { from: el.scrollHeight, to: 0, fade: true, done });
		},
		onAfterLeave(el)
		{
			clearInlineStyles(el);
			this.refs.el = null;
			this.refs.transitioning = false;
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
			el.style.overflow = 'hidden';
			el.style.height = `${start}px`;
			this.$nextTick(() => {
				if (!el.isConnected)
				{
					clearInlineStyles(el);
					return;
				}
				animateHeight(el, {
					from: start,
					to: el.scrollHeight,
					fade: false,
					done: () => clearInlineStyles(el),
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
