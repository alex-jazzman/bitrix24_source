/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, ui_iconSet_solid, note_analytics, note_ui_loader, ui_vue3, main_core, note_ui_actionMenu, main_sidepanel, note_import, note_permissions, note_ui_themeContext, note_ui_documentHistory, main_core_events, ui_notification, note_ui_collectionPicker, pull_client, ui_buttons, ui_dialogs_messagebox, ui_system_dialog) {
	'use strict';

	const SidebarLoader = {
		name: 'SidebarLoader',
		components: {
			Loader: note_ui_loader.Loader
		},
		props: {
			level: {
				type: Number,
				default: 0
			}
		},
		computed: {
			indentStyle() {
				const normalized = Number.isFinite(Number(this.level)) ? Math.max(Number(this.level), 0) : 0;
				const padding = 16 + normalized * 24;
				return {
					paddingLeft: `${padding}px`
				};
			}
		},
		template: `
		<div class="sidebar-loader" :style="indentStyle">
			<Loader />
		</div>
	`
	};

	const TRAVEL_MS = 120;
	// How long the rows are given to appear in their new places before the travel is called off.
	const TRAVEL_FRAMES = 6;

	// The panel is marked while a section's share is moving, and the stylesheet transitions the share only
	// while it is. A drop is a share change with no transition of its own - the branch it left and the branch
	// it joined are not the same height - so the window is opened by hand around it. Same name the section
	// transition uses (ExpandTransition), one panel to a page.
	const PANEL_ANIMATING_CLASS$1 = 'is-section-animating';
	const BRANCH_ANIMATING_CLASS = 'is-expand-animating';
	const MOTION_MS = 320;

	// While the rows are in flight the area they scroll is longer than the list it holds - a transform counts
	// towards the scrollable overflow - and the vertical thumb would appear for the length of the flight.
	const TRAVELING_CLASS = 'is-row-traveling';
	let motionTimer = 0;

	/**
	 * Whether the page asked for less motion. Then every transition of the panel is given its end state and
	 * none of the time in between - the same styles, the same clean-up, no travel.
	 */
	function prefersReducedMotion() {
		return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	function markSectionMotion(root, ms = MOTION_MS) {
		if (!(root instanceof HTMLElement)) {
			return;
		}
		const panel = root.classList.contains('sidebar-sections') ? root : root.querySelector('.sidebar-sections');
		if (!(panel instanceof HTMLElement)) {
			return;
		}
		panel.classList.add(PANEL_ANIMATING_CLASS$1);
		// In force before the share it is to carry changes, or the change lands in one step.
		void panel.offsetHeight;
		clearTimeout(motionTimer);
		motionTimer = setTimeout(() => {
			motionTimer = 0;
			// A section of the panel may still be opening on its own account, and that motion owns the mark.
			if (!panel.querySelector(`.${BRANCH_ANIMATING_CLASS}`)) {
				panel.classList.remove(PANEL_ANIMATING_CLASS$1);
			}
		}, ms);
	}

	// What a drop moves is never one row. The dragged row is destroyed with the branch it left and created
	// inside the branch it joined - the move transition of a group only reaches rows that stayed in it, so
	// that row jumped from one place to the other - and every row below the place it vacated moves up by a
	// row, which no transition covers either: the gap simply closed in a single frame.
	//
	// So the list is measured before the move and its rows are sent from where they were afterwards: the
	// dragged row travels to its new level while the rows around it close the gap, all over the same 120ms.
	//
	// Held apart from the drag service on purpose: what it needs is where the rows are on screen, which is
	// known here and nowhere in the store.
	function captureRowTravel(docId) {
		if (typeof document === 'undefined') {
			return null;
		}
		const id = Number(docId);
		if (!Number.isFinite(id) || id <= 0) {
			return null;
		}

		// By id, not by the drag-source mark: releasing the pointer ends the drag, and the mark is gone from
		// the row before the move it started is through.
		const source = document.querySelector(`.sidebar .tree-row[data-doc-id="${id}"]`);
		if (!(source instanceof HTMLElement)) {
			return null;
		}
		const area = source.closest('.tree-scroll');
		const before = captureRows(area);
		return {
			play() {
				// After the render, still inside the frame that carries it: the store is patched by the time
				// this is called, the DOM is not, and the render is queued as a microtask ahead of this one.
				// A frame later would be a frame the rows spend at their new places before the travel starts,
				// which reads as a flicker. If the render has not landed after all, the retries below wait for
				// it frame by frame.
				void Promise.resolve().then(() => {
					playTravel(area, id, before, TRAVEL_FRAMES);
				});
			}
		};
	}

	// The same from the other end: a row created has nowhere on screen to come from, but every row under the
	// place it takes has a row of height to give up, and that was a step of exactly one row in a single frame.
	// The rows below travel down and the new one is faded in over the same 120ms.
	function captureRowArrival(parentId) {
		if (typeof document === 'undefined') {
			return null;
		}
		const parent = Number(parentId);
		const area = Number.isFinite(parent) && parent > 0 ? document.querySelector(`.sidebar .tree-row[data-doc-id="${parent}"]`)?.closest('.tree-scroll') : document.querySelector('.sidebar .tree-scroll--collections');
		if (!(area instanceof HTMLElement)) {
			return null;
		}
		const before = captureRows(area);
		return {
			play() {
				void Promise.resolve().then(() => {
					playTravel(area, null, before, TRAVEL_FRAMES);
				});
			}
		};
	}

	// Every row the drop moves, and not only the documents: a list holds the rows of its knowledge bases too,
	// and those stand below the documents of the base above them. Left out of the measurement they were left
	// out of the travel as well - the documents glided to their new places while every base under them stepped
	// a row in a single frame.
	const TRAVELLING_ROWS = '.tree-row[data-doc-id], .collection-row[data-collection-id]';

	// Identity across the two kinds, so a document and a knowledge base of the same number are not one row.
	function rowKey(row) {
		return row.dataset.docId ? `док:${row.dataset.docId}` : `база:${row.dataset.collectionId}`;
	}
	function captureRows(area) {
		const scope = area instanceof HTMLElement ? area : document;
		const before = new Map();
		for (const row of scope.querySelectorAll(TRAVELLING_ROWS)) {
			if (!(row instanceof HTMLElement) || before.has(rowKey(row))) {
				continue;
			}
			const rect = row.getBoundingClientRect();
			before.set(rowKey(row), {
				top: rect.top,
				left: rect.left,
				indent: indentOf(row)
			});
		}
		return before;
	}

	// The level a row is drawn at, in pixels. It is a spacer standing at the head of the row and not padding
	// on the row itself (see .tree-row__indent), so a row that only changed level has exactly the same box as
	// before and the travel below would find nothing to carry.
	function indentOf(row) {
		const spacer = row.querySelector('.tree-row__indent');
		return spacer instanceof HTMLElement ? spacer.getBoundingClientRect().width : null;
	}
	function playTravel(area, id, before, framesLeft) {
		// Nothing is sent anywhere when less motion is asked for: the rows are simply where the store put
		// them, which is where this would have carried them anyway. Left before anything is touched, so
		// there is no inline style and no hidden row to hand back.
		if (prefersReducedMotion()) {
			return;
		}
		const scope = area instanceof HTMLElement && area.isConnected ? area : document;
		// A row that was dragged: its old place is the one the travel starts from. Nothing dragged (a row
		// created) leaves this empty, and then the only motion is the rows around it making room.
		const from = id === null ? null : before.get(`док:${id}`);
		if (id !== null && !from) {
			return;
		}

		// Both places at once, for a frame or two: the row is in the branch it joined from the moment the
		// store is patched, and it leaves the one it came from when that branch is reloaded.
		const copies = [];
		for (const row of from === null ? [] : scope.querySelectorAll(`.tree-row[data-doc-id="${id}"]`)) {
			if (!(row instanceof HTMLElement)) {
				continue;
			}
			const rect = row.getBoundingClientRect();
			copies.push({
				row,
				indent: indentOf(row),
				distance: Math.abs(from.left - rect.left) + Math.abs(from.top - rect.top)
			});
		}

		// The level tells them apart before distance does. A row that changed level is drawn at its new indent
		// in the branch it joined, while the copy left behind is still drawn by the branch it came from, at the
		// indent it had - and distance would have picked the wrong one of the two: a row dropped one level down
		// right where it already stood does not move at all, while the copy behind it is pushed a row down by
		// the arrival and so looks like the one that travelled.
		const levelled = copies.filter(copy => typeof copy.indent === 'number' && typeof from?.indent === 'number' && Math.abs(copy.indent - from.indent) >= 1);
		let target = null;
		let travelled = 0;
		let stale = null;
		if (levelled.length === 1) {
			target = levelled[0].row;
			travelled = Math.max(levelled[0].distance, Math.abs(levelled[0].indent - from.indent));
			stale = copies.find(copy => copy.row !== target)?.row ?? null;
		} else {
			// Same level on both sides, so the one that travelled is the one that is NOT where the drag started.
			let staleDistance = Number.POSITIVE_INFINITY;
			for (const copy of copies) {
				if (copy.distance > travelled) {
					target = copy.row;
					travelled = copy.distance;
				}
				if (copy.distance < staleDistance) {
					stale = copy.row;
					staleDistance = copy.distance;
				}
			}
		}

		// A row dropped into a branch that is closed is not on screen at all afterwards, and there is nothing
		// to send anywhere - but the rows below the place it left still have a row of height to climb, and
		// that is the motion this is here for.
		if (travelled < 1) {
			target = null;
			stale = null;
		}

		// The copy left behind goes out of the flow before anything is measured: it holds a row of height the
		// list is about to lose, so measured against it every row below stands a row lower than where it ends
		// up. The travel would start off by the height of a row in the wrong direction and correct itself the
		// moment the copy went away - which is the jump this is here to remove.
		const staleHost = stale !== null && stale !== target ? stale.closest('li') ?? stale : null;
		if (staleHost instanceof HTMLElement) {
			staleHost.style.display = 'none';
		}
		const limit = scope === document ? window.innerHeight : scope.clientHeight;
		const moved = [];
		const arrived = [];
		const levelChanged = [];
		for (const row of scope.querySelectorAll(TRAVELLING_ROWS)) {
			if (!(row instanceof HTMLElement)) {
				continue;
			}
			const previous = row === target ? from : before.get(rowKey(row));
			if (!previous) {
				// A row that was not on screen a moment ago and has nowhere to travel from. One of them is the
				// row just created, and it is faded in while the rows around it make room; a whole branch that
				// opened at the same time is its own transition's business, so only single arrivals are faded.
				arrived.push(row);
				continue;
			}

			// A row that stayed inside its branch may already be travelling: its group measures the move and
			// plays it back on the row's list item. Sending it a second time would double the distance.
			const host = row.closest('li') ?? row;
			if (getComputedStyle(host).transform !== 'none') {
				continue;
			}

			// The level, before the box: a row can change one without the other. Dropped under the row above it,
			// a row keeps its place to the pixel and the whole of the change is 20px of indent - so with nothing
			// else moving on screen, this is the only thing there is to see. Sent from the indent it had, it
			// slides under its new parent over the same time a row takes to travel.
			const spacer = row.querySelector('.tree-row__indent');
			const indent = spacer instanceof HTMLElement ? spacer.getBoundingClientRect().width : null;
			if (spacer instanceof HTMLElement && typeof indent === 'number' && typeof previous.indent === 'number' && Math.abs(previous.indent - indent) >= 1) {
				spacer.style.transition = 'none';
				spacer.style.width = `${previous.indent}px`;
				levelChanged.push({
					spacer,
					to: indent
				});
			}
			const rect = row.getBoundingClientRect();
			const dx = previous.left - rect.left;
			const dy = previous.top - rect.top;
			if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
				continue;
			}

			// Where a row came from off screen - a branch that had to be scrolled to, a section of its own -
			// there is no travel to show, only a row flying in from beyond the edge.
			if (Math.abs(dx) > limit || Math.abs(dy) > limit) {
				continue;
			}
			row.style.transition = 'none';
			row.style.transform = `translate(${dx}px, ${dy}px)`;
			moved.push(row);
		}

		// A level changed with no row moving anywhere is motion too, and the only motion this drop has.
		if (moved.length === 0 && levelChanged.length === 0) {
			if (staleHost instanceof HTMLElement) {
				staleHost.style.display = '';
			}

			// Nothing has moved yet - the render is still to come. Given up on after a few frames: a drop that
			// changes nothing (the row put back where it was) has nothing to animate either.
			if (framesLeft > 0) {
				requestAnimationFrame(() => {
					playTravel(area, id, before, framesLeft - 1);
				});
			}
			return;
		}

		// A single row appearing among rows that are making room for it: it has no place to come from, so it
		// is faded in over the length of their travel. More than one at a time is a branch that opened, and
		// that is animated as a branch, not row by row.
		const faded = arrived.length === 1 ? arrived : [];
		for (const row of faded) {
			row.style.transition = 'none';
			row.style.opacity = '0';
		}
		if (scope instanceof HTMLElement) {
			scope.classList.add(TRAVELING_CLASS);
		}

		// One reflow for the whole list, so every row starts from where it was with no transition in force.
		void scope.offsetHeight;
		for (const row of moved) {
			row.style.transition = `transform ${TRAVEL_MS}ms ease-out`;
			row.style.transform = 'translate(0, 0)';
		}
		for (const row of faded) {
			row.style.transition = `opacity ${TRAVEL_MS}ms ease-out`;
			row.style.opacity = '1';
		}
		for (const {
			spacer,
			to
		} of levelChanged) {
			spacer.style.transition = `width ${TRAVEL_MS}ms ease-out`;
			spacer.style.width = `${to}px`;
		}

		// Whatever is moving carries the clean-up. A drop that only changed a level has no row travelling to
		// wait for, and then the indent that is sliding is what tells the motion is over.
		const anchor = target instanceof HTMLElement && moved.includes(target) ? target : moved[0] ?? levelChanged[0].spacer;
		const anchorProperty = moved.length > 0 ? 'transform' : 'width';
		let timer = 0;
		const finish = () => {
			clearTimeout(timer);
			anchor.removeEventListener('transitionend', onEnd);
			for (const row of moved) {
				row.style.transition = '';
				row.style.transform = '';
			}
			for (const row of faded) {
				row.style.transition = '';
				row.style.opacity = '';
			}
			for (const {
				spacer
			} of levelChanged) {
				spacer.style.transition = '';
				spacer.style.width = '';
			}
			if (scope instanceof HTMLElement) {
				scope.classList.remove(TRAVELING_CLASS);
			}

			// Handed back to whoever owns it: by now the branch it was in has been reloaded without it, and
			// if it is still there it is a row that belongs in the list.
			if (staleHost instanceof HTMLElement) {
				staleHost.style.display = '';
			}
		};
		const onEnd = event => {
			if (event.target === anchor && event.propertyName === anchorProperty) {
				finish();
			}
		};
		anchor.addEventListener('transitionend', onEnd);
		// Rows that never get their transition - a tab in the background, a row re-rendered mid-flight -
		// would keep an inline transform for good.
		timer = setTimeout(finish, TRAVEL_MS + 80);
	}

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
	function durationMs() {
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
	function clipToBox(el) {
		el.style.overflowX = 'visible';
		el.style.overflowY = 'clip';
	}
	function releaseBox(el) {
		el.style.overflowX = '';
		el.style.overflowY = '';
	}

	// A section of the panel, as opposed to a branch inside one of its lists. Both are opened by this
	// transition and the difference decides when the panel's shares may be recounted: a section changes
	// them by appearing, a branch only by the content it adds to the section it lives in.
	function isSection(el) {
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
	function markPanel(el, animating) {
		const panel = el.closest?.('.sidebar-sections') ?? panels.get(el);
		if (!(panel instanceof HTMLElement)) {
			return;
		}
		if (animating) {
			panels.set(el, panel);
			panel.classList.add(PANEL_ANIMATING_CLASS);
		} else if (!panel.querySelector(`.${ANIMATING_CLASS}`)) {
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
	function cancelPending(el) {
		const state = pending.get(el);
		if (!state) {
			return;
		}
		el.removeEventListener('transitionend', state.onEnd);
		clearTimeout(state.timer);
		pending.delete(el);
	}
	function clearInlineStyles(el) {
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
	function measureOpenHeight(el) {
		const previous = {
			transition: el.style.transition,
			height: el.style.height,
			minHeight: el.style.minHeight,
			overflowX: el.style.overflowX,
			overflowY: el.style.overflowY
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
	function awaitShare(el, done) {
		// The share is already published and the box already at it: there is nothing left to wait for.
		if (prefersReducedMotion()) {
			done();
			return;
		}
		const finish = () => {
			cancelPending(el);
			done();
		};
		const onEnd = event => {
			if (event.target === el && event.propertyName === 'height') {
				finish();
			}
		};
		el.addEventListener('transitionend', onEnd);
		const timer = setTimeout(finish, FALLBACK_MS);
		pending.set(el, {
			onEnd,
			timer
		});
	}
	function animateHeight(el, {
		from,
		to,
		fade,
		done
	}) {
		cancelPending(el);
		el.classList.add(ANIMATING_CLASS);
		markPanel(el, true);
		if (from === to || prefersReducedMotion()) {
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
		if (fade) {
			el.style.opacity = opening ? '0' : '1';
			transitions.push(`opacity ${durationMs()}ms ${EASING}`);
		}

		// Commit the starting frame before applying target values.
		void el.offsetHeight;
		el.style.transition = transitions.join(', ');
		el.style.height = `${to}px`;
		if (fade) {
			el.style.opacity = opening ? '1' : '0';
		}
		const finish = () => {
			cancelPending(el);
			done();
		};
		const onEnd = event => {
			if (event.target === el && event.propertyName === 'height') {
				finish();
			}
		};
		el.addEventListener('transitionend', onEnd);
		const timer = setTimeout(finish, FALLBACK_MS);
		pending.set(el, {
			onEnd,
			timer
		});
	}
	const ExpandTransition = {
		name: 'ExpandTransition',
		props: {
			loading: {
				type: Boolean,
				default: false
			}
		},
		inject: {
			// The share of the panel this section settles at. Published by the sidebar's measure pass, which
			// this asks to run before every measurement: the share depends on which sections are open, and
			// this transition is what opens and closes them.
			noteRefreshSectionFloors: {
				default: null
			},
			// Whether the panel of sections is being drawn anew (the collapsed rail giving way to it). Then a
			// section is not opening - it was left open - and there is nothing here to animate.
			noteSectionsAppearing: {
				default: null
			}
		},
		data() {
			// Plain non-reactive container — we need identity stability for the
			// DOM ref and the in-flight flag, not change tracking.
			return {
				refs: ui_vue3.markRaw({
					el: null,
					transitioning: false
				})
			};
		},
		methods: {
			onBeforeEnter(el) {
				this.refs.el = el;
				this.refs.transitioning = true;
				if (this.loading || this.appearsWithPanel()) {
					return;
				}
				if (isSection(el)) {
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
			appearsWithPanel() {
				return isSection(this.refs.el) && this.noteSectionsAppearing?.() === true;
			},
			onEnter(el, done) {
				// No mark on the panel and no inline styles left behind: the section is simply there, at the
				// share the panel's own pass gives it in this same tick.
				if (this.appearsWithPanel()) {
					done();
					return;
				}
				if (this.loading) {
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
				if (isSection(el)) {
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
				this.noteRefreshSectionFloors?.({
					section,
					growth: target
				});
				animateHeight(el, {
					from: 0,
					to: target,
					fade: true,
					done
				});
			},
			onAfterEnter(el) {
				clearInlineStyles(el);
				this.refs.transitioning = false;
				// Now that the element stands at its settled height: a branch that opened inside a list added
				// to what the list holds, and the shares of the panel are counted from exactly that.
				this.noteRefreshSectionFloors?.();
			},
			onEnterCancelled(el) {
				cancelPending(el);
				clearInlineStyles(el);
				this.refs.el = null;
				this.refs.transitioning = false;
			},
			onBeforeLeave() {
				this.refs.transitioning = true;
			},
			onLeave(el, done) {
				el.dataset[LEAVING_ATTRIBUTE] = '1';
				if (isSection(el)) {
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
				this.noteRefreshSectionFloors?.({
					section,
					growth: -from
				});
				animateHeight(el, {
					from,
					to: 0,
					fade: true,
					done
				});
			},
			onAfterLeave(el) {
				clearInlineStyles(el);
				this.refs.el = null;
				this.refs.transitioning = false;
				this.noteRefreshSectionFloors?.();
			},
			onLeaveCancelled(el) {
				cancelPending(el);
				clearInlineStyles(el);
				this.refs.transitioning = false;
			}
		},
		watch: {
			loading(next, prev) {
				// Only react to true → false while the element is mounted and idle.
				if (!prev || next || this.refs.transitioning) {
					return;
				}
				const el = this.refs.el;
				if (!el || !el.isConnected) {
					return;
				}
				const start = el.offsetHeight;
				// Lock the current height so Vue's content swap doesn't flash.
				el.classList.add(ANIMATING_CLASS);
				clipToBox(el);
				el.style.height = `${start}px`;
				this.$nextTick(() => {
					if (!el.isConnected) {
						clearInlineStyles(el);
						return;
					}
					markPanel(el, true);
					if (isSection(el)) {
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
					this.noteRefreshSectionFloors?.({
						section,
						growth: target - start
					});
					animateHeight(el, {
						from: start,
						to: target,
						fade: false,
						done: () => {
							clearInlineStyles(el);
							this.noteRefreshSectionFloors?.();
						}
					});
				});
			}
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
	`
	};

	// Room a row title leaves before the visible right edge on a hover device: the controls appear
	// only under the pointer and the mask under them dissolves the tail of the title, so a plain row
	// needs almost nothing - unlike one whose star stays lit without hover.
	const RESERVE_HIDDEN = 8;
	const RESERVE_ACTIVE_STAR = 32;
	// A bell that says something (notifications arrive, or they are muted) stays on screen next to the
	// star, so the title has to leave room for both. A bell that only appears on hover gets nothing -
	// like every other hover control it may cover the tail of the title (see isNotifyBellPersistent).
	const RESERVE_BELL = 24;

	/**
	 * Where there is no hover the row controls are on screen at all times. They ride with the row
	 * instead of hugging the visible edge, so nothing overlaps the title and it keeps its full width.
	 */
	function controlsAlwaysVisible() {
		return typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches;
	}

	/**
	 * Room the measure pass has to leave between a row title and the visible right edge.
	 */
	function rowNameReserve(options) {
		const base = options.isFavorite ? RESERVE_ACTIVE_STAR : RESERVE_HIDDEN;
		return String(options.hasBell === true ? base + RESERVE_BELL : base);
	}

	// Geometry of a level, shared by the indent a row is drawn at and by the guides that run down through the
	// levels above it. Held here in one place because the two have to agree to the pixel: a guide is only in
	// true when it passes through the middle of the chevron of the row it hangs under.
	const INDENT_BASE = 12;
	const INDENT_STEP = 20;
	// What the chevron shows: 16px of glyph. `.tree-disclosure` carries a tap target the height of the row and
	// pulls it back with negative margins, so the glyph sits where the 16px footprint is and not where the
	// button's own box starts.
	const GLYPH_SIZE = 16;
	// Distance from the end of the indent spacer to that glyph, and the gap the spacer itself gives back:
	// `.tree-row__indent` is the indent less one gap (--ui-space-inline-2xs), and the chevron follows it across
	// another gap of the row's own.
	const GLYPH_LEAD = 6;
	const ROW_GAP = 4;

	// The spacer at the head of a row of this level, exactly as `.tree-row__indent` works it out from `--indent`.
	function indentSpacerWidth(level) {
		return INDENT_BASE + level * INDENT_STEP - ROW_GAP;
	}
	const TreeNode = {
		name: 'TreeNode',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			SidebarLoader,
			ExpandTransition
		},
		props: {
			doc: {
				type: Object,
				required: true
			},
			level: {
				type: Number,
				default: 1
			},
			selectedDocId: {
				type: Number,
				default: null
			},
			expandedDocs: {
				type: Object,
				required: true
			},
			getChildren: {
				type: Function,
				required: true
			},
			isLoadingChildren: {
				type: Function,
				required: true
			},
			hasNextChildren: {
				type: Function,
				required: true
			},
			canEditDocument: {
				type: Function,
				required: true
			},
			canManageDocument: {
				type: Function,
				required: true
			},
			// [TPL-02] The star of the row: state and toggle both belong to the store, the row only asks.
			isDocumentFavorite: {
				type: Function,
				required: true
			},
			toggleDocumentFavorite: {
				type: Function,
				required: true
			},
			// [P4.T5] The bell of a row drawn inside the favorites block: its coverage state (DTO-02) and
			// the one gesture it offers. Absent in the tree - the tree draws no bells at all (AC-048).
			notifyStateOf: {
				type: Function,
				default: null
			},
			toggleNotify: {
				type: Function,
				default: null
			},
			// [ERR-005] The failure of the branch THIS row opened, asked for in the block's own space. Absent
			// in the tree: there a branch that fails to arrive is reported by the section, not by the row.
			branchErrorOf: {
				type: Function,
				default: null
			},
			messages: {
				type: Object,
				required: true
			},
			docDragItem: {
				type: Object,
				default: null
			},
			docDropTarget: {
				type: Object,
				default: null
			},
			fileDropTarget: {
				type: Object,
				default: null
			},
			renamingDocId: {
				type: Number,
				default: null
			},
			// Which tree this node belongs to. Only the load-more sentinel reads it: the sidebar
			// scroll handler routes a sentinel to the matching branch loader (collection vs shared).
			treeNamespace: {
				type: String,
				default: 'collection'
			},
			// [P2] Where the row is drawn: the tree ('tree') or a branch of the favorites block
			// ('favorites'). In the block the row keeps its title and its star, loses the gestures that do not
			// act there - dragging rows and creating a child - and gains the bell. Everything else lays out
			// identically in both: one row component for both contexts, never a copy.
			rowContext: {
				type: String,
				default: 'tree'
			}
		},
		inject: {
			noteScheduleTreeMetrics: {
				default: null
			}
		},
		data() {
			return {
				renameCancelled: false
			};
		},
		// A row's title is capped against the visible right edge by a measure pass in the sidebar
		// root. Only the row itself knows when it appeared or when its controls changed width.
		mounted() {
			this.noteScheduleTreeMetrics?.();
		},
		updated() {
			this.noteScheduleTreeMetrics?.();
		},
		emits: ['toggle', 'open', 'prefetch-children', 'load-more', 'start-drag', 'branch-drag-enter', 'branch-drag-over', 'branch-drop', 'end-drag', 'create-child', 'rename-doc', 'delete-doc', 'confirm-rename-doc', 'cancel-rename-doc', 'file-drag-over', 'file-drop', 'retry-branch'],
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			Solid: () => ui_iconSet_api_vue.Solid,
			isExpanded() {
				return Boolean(this.expandedDocs[this.doc.id]);
			},
			children() {
				return this.getChildren(this.doc.collectionId, this.doc.id);
			},
			dropClass() {
				const target = this.docDropTarget;
				if (!target || Number(target.targetId) !== Number(this.doc.id)) {
					return this.isFileDropTarget ? 'is-drop-inside' : '';
				}
				if (target.placement === 'before') {
					return 'is-drop-before';
				}
				if (target.placement === 'after') {
					if (this.isExpanded && this.children.length > 0) {
						return '';
					}
					return 'is-drop-after';
				}
				if (target.placement === 'inside') {
					return 'is-drop-inside';
				}
				return '';
			},
			isFileDropTarget() {
				return Boolean(this.fileDropTarget) && Number(this.fileDropTarget.parentId) === Number(this.doc.id);
			},
			isDropAfterExpanded() {
				const target = this.docDropTarget;
				if (!target || Number(target.targetId) !== Number(this.doc.id)) {
					return false;
				}
				return target.placement === 'after' && this.isExpanded && this.children.length > 0;
			},
			isDragSource() {
				return Boolean(this.docDragItem && Number(this.docDragItem.id) === Number(this.doc.id));
			},
			canExpand() {
				return Boolean(this.doc.hasChildren || this.children.length > 0 || this.isExpanded);
			},
			isFavoritesContext() {
				return this.rowContext === 'favorites';
			},
			// The branch of a row is a drop target of the tree. In the block there is nothing to drop into
			// it, and the listeners themselves have to go: they stop the drag events on their way up, and a
			// drag over the block would stop being seen by the sidebar underneath.
			branchDragHandlers() {
				if (this.isFavoritesContext) {
					return {};
				}
				return {
					dragenter: this.onChildrenDragEnter,
					dragover: event => {
						event.stopPropagation();
						this.onChildrenDragOver(event);
					},
					drop: event => {
						event.stopPropagation();
						this.onChildrenDrop(event);
					}
				};
			},
			canDragCurrentDocument() {
				return this.canManageCurrentDocument && !this.isRenaming && !this.isFavoritesContext;
			},
			canEditCurrentDocument() {
				return Boolean(this.canEditDocument(this.doc));
			},
			canManageCurrentDocument() {
				return Boolean(this.canManageDocument(this.doc));
			},
			normalizedLevel() {
				const level = Number.isFinite(Number(this.level)) ? Number(this.level) : 1;
				return Math.max(level, 1);
			},
			rowStyle() {
				// Depth is counted from the collection row, which sits one step above level 1.
				const indent = INDENT_BASE + this.normalizedLevel * INDENT_STEP;
				return {
					'--indent': `${indent}px`
				};
			},
			// Vertical guides under every ancestor level - the collection row plus each parent document. A guide
			// belongs to the row above it and has to run down the middle of that row's chevron: that is the line
			// the eye follows from a parent to its children, and a couple of pixels beside it read as a row that
			// is out of true rather than as a line that is.
			//
			// In the block the first ancestor is the row of the block, which stands exactly where a knowledge-base
			// row stands, so the same offsets serve both.
			guideOffsets() {
				// The knowledge base at the head of the list, then every parent document down to this row.
				const offsets = [INDENT_BASE + GLYPH_SIZE / 2];
				for (let level = 1; level < this.normalizedLevel; level++) {
					offsets.push(indentSpacerWidth(level) + GLYPH_LEAD + GLYPH_SIZE / 2);
				}
				return offsets;
			},
			isFavorite() {
				return this.isDocumentFavorite(this.doc) === true;
			},
			// [DTO-02] Coverage of this document, as the block read it for the whole branch at once.
			notifyState() {
				if (!this.isFavoritesContext || typeof this.notifyStateOf !== 'function') {
					return null;
				}
				return this.notifyStateOf(this.doc);
			},
			isNotified() {
				return this.notifyState?.notified === true;
			},
			// A mute is a negative override of coverage from above: once that coverage is gone (the
			// subscription on the knowledge base switched off, the subtree one lifted) the row it left behind
			// suppresses nothing. Drawing a bell for it would keep a control on a document that notifications
			// no longer reach.
			isMuteInEffect() {
				return this.notifyState?.muted === true && this.notifyState?.inherited === true;
			},
			// [AC-048] A bell appears where it has something to say: notifications reach this document,
			// they are muted on it, or the document is in the list itself. Nowhere else.
			hasNotifyBell() {
				return this.notifyState !== null && (this.isNotified || this.isMuteInEffect || this.isFavorite);
			},
			// Does the bell stay on screen with the pointer away. Only then does the title have to leave room
			// for it: a bell that shows up on hover behaves like the "create child" button of the tree and is
			// allowed to cover the tail of the title, and reserving room for it shortened the title of a row
			// of the block against the same row in the tree.
			isNotifyBellPersistent() {
				return this.hasNotifyBell && (this.isNotified || this.isMuteInEffect);
			},
			notifyIcon() {
				if (this.isMuteInEffect) {
					return ui_iconSet_api_vue.Outline.NOTIFICATION_OFF;
				}
				return this.isNotified ? ui_iconSet_api_vue.Solid.NOTIFICATION : ui_iconSet_api_vue.Outline.NOTIFICATION;
			},
			notifyLabel() {
				return this.isNotified ? this.messages.notifyOff : this.messages.notifyOn;
			},
			// Named and stateful like the chevron of a row of the favorites block, out of the same pair of
			// phrases: holding nothing but an icon, the button had no accessible name at all.
			disclosureLabel() {
				return this.isExpanded ? this.messages.favoriteCollapse : this.messages.favoriteExpand;
			},
			favoriteLabel() {
				return this.isFavorite ? this.messages.favoriteOff : this.messages.favoriteOn;
			},
			// Space kept free at the row's right edge when the title is measured against the visible
			// area. An active star stays visible without hover, so it needs room of its own; the rest
			// of the controls only show on hover and are allowed to overlap the title's tail.
			nameReserve() {
				return rowNameReserve({
					isFavorite: this.isFavorite,
					hasBell: this.isNotifyBellPersistent
				});
			},
			branchError() {
				if (!this.isFavoritesContext || typeof this.branchErrorOf !== 'function') {
					return null;
				}
				return this.branchErrorOf(this.doc);
			},
			// Level of the children of this row - the notice stands with them, not with the row above.
			branchErrorStyle() {
				return {
					paddingLeft: `${16 + (this.normalizedLevel + 1) * 24}px`
				};
			},
			isRenaming() {
				return this.renamingDocId === Number(this.doc.id);
			},
			docHref() {
				const id = Number(this.doc?.id);
				return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
			}
		},
		watch: {
			isRenaming(value) {
				this.renameCancelled = false;
				if (value) {
					this.$nextTick(() => {
						const input = this.$refs.renameInput;
						if (input) {
							input.focus();
							input.select();
						}
					});
				}
			}
		},
		methods: {
			getDocumentTitle(doc) {
				const title = String(doc?.title ?? '').trim();
				return title === '' ? null : title;
			},
			onToggle(event) {
				event.stopPropagation();
				this.$emit('toggle', this.doc);
			},
			onOpen() {
				note_analytics.NoteAnalytics.documentViewed('side_menu');
				this.$emit('open', this.doc);
				if (!this.canExpand) {
					return;
				}
				const isCurrent = Number(this.selectedDocId) === Number(this.doc.id);
				if (isCurrent || !this.isExpanded) {
					this.$emit('toggle', this.doc);
				}
			},
			onTitleClick(event) {
				if (this.isRenaming) {
					return;
				}
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.onOpen();
			},
			onPrefetchChildren() {
				this.$emit('prefetch-children', this.doc);
			},
			onCreateChild(event) {
				if (!this.canManageCurrentDocument || this.isFavoritesContext) {
					return;
				}
				event.stopPropagation();
				this.$emit('create-child', this.doc);
			},
			onToggleFavorite(event) {
				event.stopPropagation();
				// The namespace of the row goes with it: the block reads the branch of a starred document
				// through the tree the row was starred in (expandVia in DTO-01).
				this.toggleDocumentFavorite(this.doc, {
					expandVia: this.treeNamespace === 'shared' ? 'accessibleTree' : 'tree'
				});
			},
			onToggleNotify(event) {
				event.stopPropagation();
				if (typeof this.toggleNotify === 'function') {
					this.toggleNotify(this.doc);
				}
			},
			onDragStart(event) {
				if (!this.canDragCurrentDocument) {
					event.preventDefault();
					return;
				}
				this.$emit('start-drag', {
					doc: this.doc,
					nativeEvent: event
				});
			},
			onDragEnd() {
				this.$emit('end-drag');
			},
			onFileDragOver(event) {
				// A dropped file becomes a document inside the row it landed on - a tree gesture, and the
				// block is not the tree.
				if (this.isFavoritesContext || !event.dataTransfer?.types?.includes('Files')) {
					return;
				}
				event.preventDefault();
				this.$emit('file-drag-over', {
					doc: this.doc,
					nativeEvent: event
				});
			},
			onFileDrop(event) {
				if (this.isFavoritesContext || !event.dataTransfer?.types?.includes('Files')) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				this.$emit('file-drop', {
					doc: this.doc,
					nativeEvent: event
				});
			},
			onChildrenDragEnter(event) {
				this.$emit('branch-drag-enter', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onChildrenDragOver(event) {
				this.$emit('branch-drag-over', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onChildrenDrop(event) {
				this.$emit('branch-drop', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onRenameKeyEnter(event) {
				event.target.blur();
			},
			onRenameKeyEscape() {
				this.renameCancelled = true;
				this.$refs.renameInput?.blur();
			},
			onRenameBlur(event) {
				if (this.renameCancelled) {
					this.$emit('cancel-rename-doc');
					return;
				}
				const value = event.target.value.trim();
				if (!value) {
					this.$emit('cancel-rename-doc');
					return;
				}
				this.$emit('confirm-rename-doc', {
					doc: this.doc,
					title: value
				});
			}
		},
		template: `
		<li :class="{ 'is-drop-after': isDropAfterExpanded }" :style="isDropAfterExpanded ? rowStyle : null">
			<div
				class="tree-row"
				data-tree-row
				:data-doc-id="doc.id"
				:class="[
					{ 'is-active': selectedDocId === Number(doc.id) },
					dropClass,
					{ 'is-drag-source': isDragSource },
					{ 'has-actions': canManageCurrentDocument && !isRenaming }
					]"
				:style="rowStyle"
				:draggable="canDragCurrentDocument"
				@mouseenter="onPrefetchChildren"
				@dragstart="onDragStart"
				@dragend="onDragEnd"
				@dragover="onFileDragOver($event)"
				@drop="onFileDrop($event)"
			>
				<span class="tree-row__pill" aria-hidden="true"><span class="tree-row__pill-fill"></span></span>
				<span
					v-for="offset in guideOffsets"
					:key="offset"
					class="tree-row__guide"
					:style="{ left: offset + 'px' }"
					aria-hidden="true"
				></span>
				<span class="tree-row__peek" aria-hidden="true">
					<span class="tree-row__peek-inner">
						<span class="tree-row__peek-rest">
							<button
								v-if="canExpand"
								type="button"
								class="tree-row__peek-chevron"
								:class="{ 'is-expanded': isExpanded }"
								tabindex="-1"
								@click="onToggle"
							>
								<BIcon name="chevron-right-l" :size="16" />
							</button>
							<span class="tree-row__peek-title">{{ doc.title }}</span>
						</span>
					</span>
				</span>
				<span
					class="tree-item tree-button"
					:title="isRenaming ? null : getDocumentTitle(doc)"
				>
					<span class="tree-row__indent" aria-hidden="true"></span>
					<button v-if="canExpand" type="button" class="tree-disclosure"
							:class="{ 'is-expanded': isExpanded }"
							:aria-label="disclosureLabel"
							:aria-expanded="isExpanded.toString()"
							data-testid="note-sidebar-doc-disclosure"
							@click="onToggle">
						<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
					</button>
					<span v-else class="tree-disclosure-spacer"></span>
					<input
						v-if="isRenaming"
						class="tree-title-input"
						type="text"
						:value="doc.title"
						@keydown.enter="onRenameKeyEnter($event)"
						@keydown.escape="onRenameKeyEscape"
						@blur="onRenameBlur($event)"
						@click.stop
						ref="renameInput"
					/>
					<a
						v-else
						class="tree-title tree-title-link"
						:data-kb-name="nameReserve"
						:href="docHref"
						draggable="false"
						@click="onTitleClick"
					>{{ doc.title }}</a>
				</span>
				<span v-if="!isRenaming" class="tree-actions-anchor">
					<span class="tree-actions">
						<!-- [P4.T5] The bell of a row of the block: filled where notifications arrive,
								 struck through where they are muted. A row with neither draws nothing and holds
								 no room - exactly like the "create child" button of the tree, so a row of the
								 block lays out identically to the same row in the tree. -->
						<button
							v-if="hasNotifyBell"
							type="button"
							class="row-action-btn row-action-btn--notify"
							:class="{ 'is-on': isNotified, 'is-muted': isMuteInEffect }"
							:title="notifyLabel"
							:aria-label="messages.notifyState"
							:aria-pressed="isNotified.toString()"
							@click="onToggleNotify($event)"
						>
							<BIcon :name="notifyIcon" :size="16" />
						</button>
						<button
							v-if="canManageCurrentDocument && !isFavoritesContext"
							class="row-action-btn row-action-btn--create"
							type="button"
							:title="messages.createChildDocument"
							:aria-label="messages.createChildDocument"
							data-testid="note-sidebar-doc-create-child"
							@click="onCreateChild"
						>
							<BIcon name="plus-l" :size="20" />
						</button>
						<button
							class="row-action-btn row-action-btn--favorite"
							:class="{ 'is-on': isFavorite }"
							type="button"
							:title="favoriteLabel"
							:aria-label="messages.favoriteState"
							:aria-pressed="isFavorite.toString()"
							data-testid="note-sidebar-doc-favorite"
							@click="onToggleFavorite($event)"
						>
							<BIcon :name="isFavorite ? Solid.FAVORITE : Outline.FAVORITE" :size="16" />
						</button>
					</span>
				</span>
			</div>
			<ExpandTransition :loading="isLoadingChildren(doc.collectionId, doc.id)">
			<ul
				v-if="isExpanded"
				class="tree-branch tree-children"
				v-on="branchDragHandlers"
			>
				<!-- Move-only group: a row dragged to another place travels there instead of jumping (the
						 same 120ms the favorites block uses). No enter or leave here - appearing and
						 disappearing branches are already animated by ExpandTransition around this list. -->
				<TransitionGroup name="sidebar-row">
				<tree-node
					v-for="child in children"
					:key="child.id"
					:doc="child"
					:level="level + 1"
					:selected-doc-id="selectedDocId"
					:expanded-docs="expandedDocs"
					:get-children="getChildren"
					:is-loading-children="isLoadingChildren"
					:has-next-children="hasNextChildren"
					:can-edit-document="canEditDocument"
					:can-manage-document="canManageDocument"
					:is-document-favorite="isDocumentFavorite"
					:toggle-document-favorite="toggleDocumentFavorite"
					:notify-state-of="notifyStateOf"
					:toggle-notify="toggleNotify"
					:branch-error-of="branchErrorOf"
					:messages="messages"
					:doc-drag-item="docDragItem"
					:doc-drop-target="docDropTarget"
					:file-drop-target="fileDropTarget"
					:renaming-doc-id="renamingDocId"
					:tree-namespace="treeNamespace"
					:row-context="rowContext"
					@toggle="$emit('toggle', $event)"
					@open="$emit('open', $event)"
					@prefetch-children="$emit('prefetch-children', $event)"
					@load-more="$emit('load-more', $event)"
					@start-drag="$emit('start-drag', $event)"
					@branch-drag-enter="$emit('branch-drag-enter', $event)"
					@branch-drag-over="$emit('branch-drag-over', $event)"
					@branch-drop="$emit('branch-drop', $event)"
					@end-drag="$emit('end-drag')"
					@create-child="$emit('create-child', $event)"
					@rename-doc="$emit('rename-doc', $event)"
					@delete-doc="$emit('delete-doc', $event)"
					@confirm-rename-doc="$emit('confirm-rename-doc', $event)"
					@cancel-rename-doc="$emit('cancel-rename-doc')"
					@file-drag-over="$emit('file-drag-over', $event)"
					@file-drop="$emit('file-drop', $event)"
					@retry-branch="$emit('retry-branch', $event)"
				/>
				</TransitionGroup>
				<li v-if="isLoadingChildren(doc.collectionId, doc.id)" class="sidebar-muted">
					<SidebarLoader :level="level + 1" />
				</li>
				<!-- [ERR-005] The failure of a nested branch stays in the row that opened it, with the same
						 second attempt a top-level row of the block offers. -->
				<li
					v-if="branchError !== null"
					class="sidebar-muted sidebar-muted--flow favorites-empty"
					:style="branchErrorStyle"
				>
					{{ branchError }}
					<button type="button" class="favorites-retry" @click="$emit('retry-branch', doc)">
						{{ messages.favoritesRetry }}
					</button>
				</li>
				<li
					v-if="hasNextChildren(doc.collectionId, doc.id)"
					class="doc-load-more-sentinel js-doc-load-more-sentinel"
					:data-collection-id="doc.collectionId"
					:data-parent-id="doc.id"
					:data-tree-namespace="treeNamespace"
					aria-hidden="true"
				/>
			</ul>
			</ExpandTransition>
		</li>
	`
	};

	/**
	 * IME-safe v-model alternative for mobile inputs.
	 *
	 * Mobile IMEs (Android Gboard, iOS suggestions) update <input>.value via
	 * composition events. Vue's v-model defers reactive updates until
	 * `compositionend`, so the bound property lags behind the visible value
	 * during typing -- debounced search/validate logic never sees the in-flight
	 * characters.
	 *
	 * Read event.target.value on input/compositionend/change events and write it
	 * back to the component property. For non-IME input the values already match,
	 * so the guard makes the call a no-op.
	 *
	 * Usage (Options API):
	 *   methods: {
	 *     onInput(event) {
	 *       syncIMEModel(this, 'query', event);
	 *       // ... debounce, fetch, ...
	 *     },
	 *   }
	 *
	 * Template:
	 *   <input
	 *     :value="query"
	 *     @input="onInput"
	 *     @compositionend="onInput"
	 *     @change="onInput"
	 *   />
	 */
	function syncIMEModel(component, key, event) {
		const next = event?.target?.value ?? component[key];
		if (component[key] !== next) {
			component[key] = next;
		}
		return next;
	}

	const ACTION_QUICK_SEARCH = 'note.infrastructure.SearchController.quickSearch';
	const DEBOUNCE_MS = 300;
	const MIN_QUERY_LENGTH = 3;
	const SidebarSearchInput = {
		name: 'SidebarSearchInput',
		emits: ['navigate-document', 'navigate-search'],
		data() {
			return {
				query: '',
				results: [],
				status: 'idle',
				// idle | loading | results | empty | error
				dropdownVisible: false,
				focusedIndex: -1,
				analyticsClickTracked: false
			};
		},
		computed: {
			trimmedQuery() {
				return this.query.trim();
			},
			placeholderText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_PLACEHOLDER') || '';
			},
			showAllText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_SHOW_ALL') || '';
			},
			emptyText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_EMPTY') || '';
			},
			errorText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_ERROR') || '';
			},
			clearText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_CLEAR') || '';
			},
			hasQuery() {
				return this.query.length > 0;
			}
		},
		created() {
			this.debounceTimer = null;
			this.requestId = 0;
		},
		beforeUnmount() {
			this.cancelPending();
		},
		methods: {
			onInput(event) {
				syncIMEModel(this, 'query', event);
				clearTimeout(this.debounceTimer);
				if (this.trimmedQuery.length < MIN_QUERY_LENGTH) {
					this.cancelPending();
					this.results = [];
					this.status = 'idle';
					this.dropdownVisible = false;
					this.focusedIndex = -1;
					return;
				}
				this.debounceTimer = setTimeout(() => {
					this.fetchResults();
				}, DEBOUNCE_MS);
			},
			onKeydown(event) {
				if (event.key === 'ArrowDown') {
					event.preventDefault();
					if (!this.dropdownVisible || this.status !== 'results') {
						return;
					}
					const max = this.results.length; // last index = "show all"
					if (this.focusedIndex < max) {
						this.focusedIndex++;
					}
					return;
				}
				if (event.key === 'ArrowUp') {
					event.preventDefault();
					if (!this.dropdownVisible || this.status !== 'results') {
						return;
					}
					if (this.focusedIndex > -1) {
						this.focusedIndex--;
					}
					return;
				}
				if (event.key === 'Enter') {
					if (this.focusedIndex >= 0 && this.focusedIndex < this.results.length) {
						this.selectResult(this.results[this.focusedIndex]);
						return;
					}
					if (this.focusedIndex === this.results.length && this.results.length > 0) {
						this.showAll();
						return;
					}
					if (this.trimmedQuery.length >= MIN_QUERY_LENGTH) {
						const {
							trimmedQuery
						} = this;
						this.resetSearch();
						this.$emit('navigate-search', {
							query: trimmedQuery
						});
					}
					return;
				}
				if (event.key === 'Escape') {
					this.dropdownVisible = false;
					this.focusedIndex = -1;
				}
			},
			// Called from the sidebar root when the collapsed rail's search entry expands the panel:
			// the entry means "search", so the caret has to land in the field, not just open the panel.
			focusInput() {
				this.$refs.input?.focus();
			},
			onSearchRowClick() {
				this.$refs.input?.focus();
				// Emit click_search once per search session; the flag resets on resetSearch(),
				// not on blur/tab-switch, so re-focus/tab changes never re-fire it.
				if (!this.analyticsClickTracked) {
					note_analytics.NoteAnalytics.searchClicked(false);
					this.analyticsClickTracked = true;
				}
			},
			onFocus() {
				if (this.results.length > 0 || this.status === 'empty') {
					this.dropdownVisible = true;
				}
			},
			onBlur() {
				// Re-arm click_search: leaving the field and clicking back in counts as a new search.
				this.analyticsClickTracked = false;
				setTimeout(() => {
					this.dropdownVisible = false;
				}, 150);
			},
			async fetchResults() {
				const currentQuery = this.trimmedQuery;
				if (currentQuery.length < MIN_QUERY_LENGTH) {
					return;
				}
				const currentRequestId = ++this.requestId;
				this.status = 'loading';
				this.dropdownVisible = true;
				try {
					const response = await main_core.ajax.runAction(ACTION_QUICK_SEARCH, {
						data: {
							query: currentQuery
						}
					});
					if (currentRequestId !== this.requestId) {
						return;
					}
					const items = response?.data?.items;
					this.results = Array.isArray(items) ? items : [];
					this.status = this.results.length > 0 ? 'results' : 'empty';
					this.focusedIndex = -1;
					this.dropdownVisible = true;
				} catch {
					if (currentRequestId !== this.requestId) {
						return;
					}
					this.results = [];
					this.status = 'error';
				}
			},
			cancelPending() {
				clearTimeout(this.debounceTimer);
				this.requestId++;
			},
			resetSearch() {
				this.cancelPending();
				this.query = '';
				this.results = [];
				this.status = 'idle';
				this.dropdownVisible = false;
				this.analyticsClickTracked = false;
			},
			selectResult(item) {
				this.resetSearch();
				this.$emit('navigate-document', {
					documentId: Number(item.documentId)
				});
			},
			clearQuery() {
				this.resetSearch();
				this.$refs.input?.focus();
			},
			showAll() {
				const {
					trimmedQuery
				} = this;
				this.resetSearch();
				this.$emit('navigate-search', {
					query: trimmedQuery
				});
			}
		},
		// language=Vue
		template: `
		<div class="note-sidebar-search">
			<div class="note-sidebar-search-row" @click="onSearchRowClick">
				<div class="note-sidebar-search-bg"></div>
				<div class="note-sidebar-search-border"></div>
				<span v-if="!hasQuery" class="note-sidebar-search-icon" aria-hidden="true">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="7"></circle>
						<path d="m20 20-3.5-3.5"></path>
					</svg>
				</span>
				<input
					ref="input"
					type="text"
					class="note-sidebar-search-input"
					:placeholder="placeholderText"
					:value="query"
					@input="onInput"
					@compositionend="onInput"
					@change="onInput"
					@keydown="onKeydown"
					@focus="onFocus"
					@blur="onBlur"
				/>
				<span
					v-if="hasQuery"
					class="ui-icon-set --o-circle-cross note-sidebar-search-clear"
					role="button"
					:aria-label="clearText"
					@mousedown.prevent
					@click.stop="clearQuery"
				></span>
			</div>
			<div v-if="dropdownVisible" class="note-kb-search-popup" @mouseleave="focusedIndex = -1">
				<div v-if="status === 'loading'" class="note-kb-search-status">
					...
				</div>
				<div v-else-if="status === 'empty'" class="note-kb-search-empty">
					<img class="note-kb-search-empty-mascot" src="/bitrix/js/note/sidebar/src/images/empty-search.webp" srcset="/bitrix/js/note/sidebar/src/images/empty-search.webp 1x, /bitrix/js/note/sidebar/src/images/empty-search@2x.webp 2x" alt="" />
					<div class="note-kb-search-empty-caption">{{ emptyText }}</div>
				</div>
				<div v-else-if="status === 'error'" class="note-kb-search-status note-kb-search-status--error">
					{{ errorText }}
				</div>
				<div v-else-if="status === 'results'" class="note-kb-search-list">
					<div
						v-for="(item, index) in results"
						:key="item.documentId"
						class="note-kb-search-item"
						:class="{ 'is-focused': focusedIndex === index }"
						@mousedown.prevent="selectResult(item)"
						@mouseenter="focusedIndex = index"
					>
						<div class="note-kb-search-item-overlay"></div>
						<div class="note-kb-search-item-label">
							<span class="note-kb-search-item-name">{{ item.title }}</span>
						</div>
					</div>
					<button
						type="button"
						class="note-kb-search-cta"
						:class="{ 'is-focused': focusedIndex === results.length }"
						@mousedown.prevent="showAll"
						@mouseenter="focusedIndex = results.length"
					>
						{{ showAllText }}
					</button>
				</div>
			</div>
		</div>
	`
	};

	// Shared by the search row and the collapsed rail: both need the same rights branching -
	// two rights open a menu, a single right runs its action straight away.
	const SidebarCreateButton = {
		name: 'SidebarCreateButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			// `row` - square air button in the search row; `rail` - 44px icon button of the rail.
			variant: {
				type: String,
				default: 'row'
			}
		},
		data() {
			return {
				actionMenuService: ui_vue3.markRaw(new note_ui_actionMenu.ActionMenuService({
					popupClass: 'note-action-menu'
				}))
			};
		},
		computed: {
			canCreateCollection() {
				return Boolean(this.state?.permissions?.canEditCollections);
			},
			canCreateDocument() {
				return Boolean(this.state?.permissions?.hasManageableCollection);
			},
			isVisible() {
				return this.canCreateCollection || this.canCreateDocument;
			},
			label() {
				if (this.canCreateCollection && this.canCreateDocument) {
					return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_MENU') || '';
				}
				if (this.canCreateDocument) {
					return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '';
				}
				return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '';
			},
			buttonClass() {
				return this.variant === 'rail' ? 'sidebar-rail__btn' : 'sidebar-search-row__create ui-btn --air --with-icon ui-btn-md --style-plain-accent ui-btn-collapsed';
			},
			iconSize() {
				return this.variant === 'rail' ? 22 : 20;
			}
		},
		beforeUnmount() {
			if (this.actionMenuService) {
				this.actionMenuService.destroy();
			}
		},
		methods: {
			onClick(event) {
				if (this.canCreateCollection && this.canCreateDocument) {
					this.openCreateMenu(event.currentTarget);
					return;
				}
				if (this.canCreateDocument) {
					void this.actions?.createDocumentFromSidebar?.();
					return;
				}
				if (this.canCreateCollection) {
					void this.actions?.createCollection?.();
				}
			},
			openCreateMenu(bindElement) {
				const collectionIcon = main_core.Tag.render`
				<span class="note-action-menu-icon sidebar-search-row__menu-icon-collection note-collection-glyph"></span>
			`;
				const items = [{
					text: main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '',
					iconModifier: 'o-document-sign',
					testId: 'note-create-menu-document',
					onClick: () => {
						void this.actions?.createDocumentFromSidebar?.();
					}
				}, {
					text: main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '',
					iconElement: collectionIcon,
					testId: 'note-create-menu-collection',
					onClick: () => {
						void this.actions?.createCollection?.();
					}
				}];
				this.actionMenuService.open(items, bindElement, {
					key: 'sidebar-create-button'
				});
			}
		},
		template: `
		<button
			v-if="isVisible"
			type="button"
			:class="buttonClass"
			:title="label"
			:aria-label="label"
			data-testid="note-sidebar-create"
			@click="onClick($event)"
		>
			<BIcon name="plus-l" :size="iconSize" />
		</button>
	`
	};

	const SidebarSearchRow = {
		name: 'SidebarSearchRow',
		components: {
			SidebarSearchInput,
			SidebarCreateButton,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			}
		},
		emits: ['navigate-document', 'navigate-search'],
		methods: {
			focusInput() {
				this.$refs.searchInput?.focusInput();
			}
		},
		computed: {
			showCreateButton() {
				return Boolean(this.state?.permissions?.canEditCollections || this.state?.permissions?.hasManageableCollection);
			}
		},
		template: `
		<div class="sidebar-search-row" :class="{ 'sidebar-search-row--no-create': !showCreateButton }">
			<SidebarSearchInput
				ref="searchInput"
				@navigate-document="$emit('navigate-document', $event)"
				@navigate-search="$emit('navigate-search', $event)"
			/>
			<SidebarCreateButton :state="state" :actions="actions" variant="row" />
		</div>
	`
	};

	// Collapsed state is a 66px rail of top-level entries instead of an empty strip. Every entry
	// expands the panel; sections that own a global expansion action are opened along the way,
	// the archive and the recycle bin navigate as usual.
	const SidebarRail = {
		name: 'SidebarRail',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			SidebarCreateButton
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			}
		},
		emits: ['expand'],
		computed: {
			isSharedTreeEnabled() {
				return Boolean(this.state?.sharedTreeEnabled);
			},
			// The entry follows the section it opens: with nothing starred the expanded panel has no
			// favorites block, so the rail has nothing to lead to either.
			hasFavorites() {
				return this.state.favorites.items.length > 0;
			}
		},
		methods: {
			expand() {
				this.$emit('expand');
			},
			onSearch() {
				this.$emit('expand', {
					focusSearch: true
				});
			},
			onFavorites() {
				this.expand();
				if (!this.state.favorites.sectionExpanded) {
					this.actions.setFavoritesSectionExpanded(true);
				}
			},
			onShared() {
				this.expand();
				if (this.isSharedTreeEnabled) {
					if (!this.state.sharedSectionExpanded) {
						void this.actions.toggleSharedSection();
					}
					return;
				}
				this.actions.navigateToShared();
			},
			onCollections() {
				this.expand();
				if (!this.state.collectionsSectionExpanded) {
					this.actions.toggleCollectionsSection();
				}
			},
			onArchive() {
				this.actions.navigateToArchive();
			},
			onRecycleBin() {
				this.actions.navigateToRecycleBin();
			}
		},
		template: `
		<div class="sidebar-rail">
			<div class="sidebar-rail__group">
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.search"
					:aria-label="messages.search"
					@click="onSearch"
				>
					<BIcon name="o-search" :size="22" />
				</button>
				<SidebarCreateButton :state="state" :actions="actions" variant="rail" />
			</div>
			<div class="sidebar-rail__divider" aria-hidden="true"></div>
			<div class="sidebar-rail__group sidebar-rail__group--sections">
				<template v-if="hasFavorites">
					<button
						type="button"
						class="sidebar-rail__btn"
						:title="messages.favorites"
						:aria-label="messages.favorites"
						@click="onFavorites"
					>
						<BIcon name="o-favorite" :size="22" />
					</button>
					<div class="sidebar-rail__divider" aria-hidden="true"></div>
				</template>
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.sharedWithMe"
					:aria-label="messages.sharedWithMe"
					@click="onShared"
				>
					<BIcon name="o-forward" :size="22" />
				</button>
				<div class="sidebar-rail__divider" aria-hidden="true"></div>
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.collections"
					:aria-label="messages.collections"
					@click="onCollections"
				>
					<span class="sidebar-rail__glyph-collection note-collection-glyph" aria-hidden="true"></span>
				</button>
			</div>
			<!-- The archive stands with the recycle bin at the foot of the rail, the pair the expanded
				 panel keeps right above its footer. -->
			<div class="sidebar-rail__pinned">
				<button
					type="button"
					class="sidebar-rail__btn"
					:class="{ 'is-active': state.selectedArchiveView }"
					:title="messages.archive"
					:aria-label="messages.archive"
					data-testid="note-sidebar-rail-archive"
					@click="onArchive"
				>
					<BIcon name="o-box-with-lid" :size="22" />
				</button>
				<button
					type="button"
					class="sidebar-rail__btn"
					:class="{ 'is-active': state.selectedRecycleBinView }"
					:title="messages.recycleBin"
					:aria-label="messages.recycleBin"
					data-testid="note-sidebar-rail-recyclebin"
					@click="onRecycleBin"
				>
					<BIcon name="o-trashcan" :size="22" />
				</button>
			</div>
		</div>
	`
	};

	const SidebarFooter = {
		name: 'SidebarFooter',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			themeActions: {
				type: Object,
				default: null
			}
		},
		emits: ['toggle-collapsed'],
		computed: {
			canEditGlobalPermissions() {
				return Boolean(this.state?.permissions?.canEditGlobalPermissions);
			},
			isMobile() {
				return Boolean(this.state?.isMobile);
			},
			canImport() {
				return Boolean(this.state?.permissions?.canImport);
			},
			isCollapsed() {
				return Boolean(this.state?.sidebarCollapsed);
			},
			importLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_IMPORT_COLLECTION_MENU') || '';
			},
			permissionsLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_OPEN_PERMISSIONS') || '';
			},
			toggleLabel() {
				return main_core.Loc.getMessage(this.isCollapsed ? 'NOTE_SIDEBAR_TOGGLE_EXPAND' : 'NOTE_SIDEBAR_TOGGLE_COLLAPSE') || '';
			},
			toggleIconName() {
				return this.isCollapsed ? 'chevron-right-l' : 'chevron-left-l';
			},
			hasThemeToggle() {
				return main_core.Type.isPlainObject(this.themeActions) && main_core.Type.isFunction(this.themeActions.toggle);
			},
			isDarkTheme() {
				return this.themeActions?.state?.theme === 'dark';
			},
			themeIconName() {
				return this.isDarkTheme ? 'o-sun' : 'o-moon';
			},
			archiveLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_ARCHIVE') || '';
			},
			recycleBinLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_RECYCLE_BIN') || '';
			},
			themeLabel() {
				return main_core.Loc.getMessage(this.isDarkTheme ? 'NOTE_SIDEBAR_THEME_TO_LIGHT' : 'NOTE_SIDEBAR_THEME_TO_DARK') || '';
			}
		},
		methods: {
			openImportDialog() {
				try {
					if (!main_core.Type.isFunction(note_import.ImportDialog)) {
						throw new TypeError('note.import extension API is not available');
					}
					const dialog = new note_import.ImportDialog({
						wikiImportEnabled: Boolean(this.state?.permissions?.canImportWiki),
						onComplete: async () => {
							if (main_core.Type.isFunction(this.actions?.refreshCollections)) {
								await this.actions.refreshCollections();
							}
						}
					});
					dialog.show();
				} catch (error) {
					console.error('note.sidebar: failed to open import dialog', error);
				}
			},
			onToggleCollapsed() {
				this.$emit('toggle-collapsed');
			},
			onToggleTheme() {
				if (this.hasThemeToggle) {
					this.themeActions.toggle();
				}
			},
			async onOpenPermissions() {
				try {
					if (main_core.Type.isFunction(note_permissions.App?.openGlobalSettings)) {
						note_permissions.App.openGlobalSettings();
						return;
					}
				} catch (error) {
					console.error('note.sidebar: failed to open permissions', error);
				}
				const sidePanel = main_sidepanel.SidePanel?.Instance || null;
				if (sidePanel && main_core.Type.isFunction(sidePanel.open)) {
					sidePanel.open('/note/settings/permissions/', {
						cacheable: false
					});
				}
			}
		},
		template: `
		<footer class="sidebar-footer" :class="{ 'is-collapsed': isCollapsed }">
			<!-- On a phone these two are icons down here instead of full-width rows above: two rows of the
					 panel is a lot of a screen that short, and the footer strip carries nothing else there. -->
			<button
				v-if="isMobile"
				type="button"
				class="sidebar-footer__btn"
				:class="{ 'is-active': state.selectedArchiveView }"
				:title="archiveLabel"
				:aria-label="archiveLabel"
				data-testid="note-sidebar-archive"
				@click="actions.navigateToArchive()"
			>
				<BIcon class="sidebar-footer__icon" name="o-box-with-lid" :size="24" />
			</button>
			<button
				v-if="isMobile"
				type="button"
				class="sidebar-footer__btn"
				:class="{ 'is-active': state.selectedRecycleBinView }"
				:title="recycleBinLabel"
				:aria-label="recycleBinLabel"
				data-testid="note-sidebar-recyclebin"
				@click="actions.navigateToRecycleBin()"
			>
				<BIcon class="sidebar-footer__icon" name="o-trashcan" :size="24" />
			</button>
			<button
				v-if="canEditGlobalPermissions && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="permissionsLabel"
				:aria-label="permissionsLabel"
				data-testid="note-sidebar-permissions"
				@click="onOpenPermissions"
			>
				<BIcon class="sidebar-footer__icon" name="o-settings" :size="24" />
			</button>
			<button
				v-if="canImport && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="importLabel"
				:aria-label="importLabel"
				data-testid="note-sidebar-import"
				@click="openImportDialog"
			>
				<BIcon class="sidebar-footer__icon" name="o-download" :size="24" />
			</button>
			<button
				v-if="hasThemeToggle"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--theme"
				:title="themeLabel"
				:aria-label="themeLabel"
				:aria-pressed="isDarkTheme.toString()"
				data-testid="note-sidebar-theme"
				@click="onToggleTheme"
			>
				<BIcon class="sidebar-footer__icon" :name="themeIconName" :size="24" />
			</button>
			<button
				v-if="!isMobile"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--toggle"
				:title="toggleLabel"
				:aria-label="toggleLabel"
				:aria-pressed="isCollapsed.toString()"
				data-testid="note-sidebar-collapse"
				@click="onToggleCollapsed"
			>
				<BIcon class="sidebar-footer__icon" :name="toggleIconName" :size="24" />
			</button>
		</footer>
	`
	};

	function normalizeParentId(parentId) {
		if (parentId === null || parentId === undefined || parentId === '') {
			return null;
		}
		const normalized = Number(parentId);
		return Number.isFinite(normalized) ? normalized : null;
	}
	function keyOf(collectionId, parentId = null) {
		const normalizedCollectionId = Number(collectionId);
		const normalizedParentId = normalizeParentId(parentId);
		return `${normalizedCollectionId}:${normalizedParentId === null ? 'root' : normalizedParentId}`;
	}

	// Accessible-tree ("Shared with me") branch namespace. The `shared:` prefix keeps these keys from
	// ever colliding with the regular collection branches living in the parallel docsByParent store.
	function sharedKey(collectionId, parentId = null) {
		const normalizedCollectionId = Number(collectionId);
		const normalizedParentId = normalizeParentId(parentId);
		return `shared:${normalizedCollectionId}:${normalizedParentId === null ? 'root' : normalizedParentId}`;
	}
	function sharedRootKey(collectionId) {
		return sharedKey(collectionId, null);
	}

	// Inverse of sharedKey: a stored branch key back into the coordinates its readers speak. Kept next
	// to the builder so the two cannot drift apart. Returns null for anything not of this namespace.
	function parseSharedKey(key) {
		const match = /^shared:(\d+):(root|\d+)$/.exec(String(key));
		if (match === null) {
			return null;
		}
		return {
			collectionId: Number(match[1]),
			parentId: match[2] === 'root' ? null : Number(match[2])
		};
	}

	// Favorites block key. The block holds rows of two kinds whose ids come from different tables, so
	// the type is part of the key. One definition for the index and the pending toggles - they must never
	// disagree on the shape of a key.
	function favoriteKey(entityType, entityId) {
		return `${entityType}:${Number(entityId)}`;
	}

	// [P2] Expansion inside the block is a property of a PLACE, not of an object: the same document can
	// be a row of the block and, at the same time, hang inside the branch of an ancestor that is also in
	// the list. Keyed by the object alone, opening it in one of those places opened it in the other -
	// branches came apart somewhere else on the screen while the user was working inside one subtree.
	// `scope` is the key of the top-level row the place belongs to; a top-level row itself has none.
	function favoriteExpandKey(entityType, entityId, scope = '') {
		const key = favoriteKey(entityType, entityId);
		return scope === '' ? key : `${scope}/${key}`;
	}

	// [DTO-01] One row of the favorites block. The row carries no URL - the address is built here,
	// exactly as it is for every other tree row. A row with nested documents opens into its branch: the
	// branch is read from the namespace the server named in expandVia, and drawn by the tree's own row
	// component so nested rows behave like tree rows, stars included.
	const FavoriteRow = {
		name: 'FavoriteRow',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ExpandTransition,
			SidebarLoader,
			SubscriptionBellView: note_ui_documentHistory.SubscriptionBellView,
			TreeNode
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			isActive: {
				type: Boolean,
				default: false
			},
			// Design-system context for the teleported depth popover - see FavoritesSection.
			popoverClass: {
				type: String,
				default: ''
			},
			// The star of a nested row: one implementation, handed down from the sidebar root the same way
			// the tree hands it to TreeNode.
			isDocumentFavorite: {
				type: Function,
				required: true
			},
			toggleDocumentFavorite: {
				type: Function,
				required: true
			}
		},
		inject: {
			noteScheduleTreeMetrics: {
				default: null
			}
		},
		// The same pair of hooks a tree row keeps, and for the same reason: the title is capped against the
		// visible right edge by a measure pass in the sidebar root, and only the row knows when it appeared
		// or when its controls changed width. Rows of the block change without the root re-rendering - a
		// page loaded, the filter switched - and an uncapped title runs on under the star.
		mounted() {
			this.noteScheduleTreeMetrics?.();
		},
		updated() {
			this.noteScheduleTreeMetrics?.();
		},
		emits: ['open'],
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			Solid: () => ui_iconSet_api_vue.Solid,
			isCollection() {
				return this.item.entityType === 'collection';
			},
			href() {
				const id = Number(this.item?.entityId);
				if (!Number.isFinite(id) || id <= 0) {
					return '';
				}
				return this.isCollection ? `/note/workspace/${id}/` : `/note/document/${id}/`;
			},
			// [DTO-02] "Notifications actually arrive" - a direct subscription or coverage from above,
			// and not muted.
			isNotified() {
				return this.item?.notify?.notified === true;
			},
			notifyLabel() {
				if (this.isMuted) {
					return this.messages.notifyOn;
				}
				return this.isNotified ? this.messages.notifyOff : this.messages.notifyOn;
			},
			// Only while there is coverage to suppress: the negative row survives the covering subscription
			// being switched off, and on its own it mutes nothing (same rule in SubscriptionBellView).
			isMuted() {
				return this.item?.notify?.muted === true && this.item?.notify?.inherited === true;
			},
			// Room the title leaves before the visible right edge, by the same rule the tree rows follow: the
			// star of a block row never hides, and a bell with something to say stays next to it. A bell that
			// only shows under the pointer gets nothing - it may cover the tail of the title.
			nameReserve() {
				return rowNameReserve({
					isFavorite: true,
					hasBell: this.notificationsEnabled && (this.isNotified || this.isMuted)
				});
			},
			notificationsEnabled() {
				return this.state.notificationsEnabled === true;
			},
			notifyIcon() {
				if (this.isMuted) {
					return ui_iconSet_api_vue.Outline.NOTIFICATION_OFF;
				}
				return this.isNotified ? ui_iconSet_api_vue.Solid.NOTIFICATION : ui_iconSet_api_vue.Outline.NOTIFICATION;
			},
			// [P4.T1] A row with nested documents has a depth to choose, so its bell opens the popover of
			// the editor. Everything else - a document with nothing under it, a knowledge base - is one press.
			hasNotifyDepth() {
				return !this.isCollection && this.item?.hasChildren === true;
			},
			isNotifySaving() {
				return this.state.favorites.isNotifyPending(this.item.entityType, Number(this.item.entityId));
			},
			// [DTO-01] hasChildren is the whole answer about the chevron of a document; a branch already read
			// keeps it after the last child left, so the row can still be closed. A knowledge base carries its
			// chevron whether it holds anything or not - the row it has in the knowledge-bases block does, and
			// one base is not to be drawn two ways in one panel.
			canExpand() {
				return this.isCollection || this.item?.hasChildren === true || this.children.length > 0;
			},
			isExpanded() {
				return this.state.favorites.isExpanded(this.item.entityType, Number(this.item.entityId));
			},
			expandLabel() {
				return this.isExpanded ? this.messages.favoriteCollapse : this.messages.favoriteExpand;
			},
			// [P2] Scope of every expansion inside this row's branch. A document starred twice - as a row of
			// its own and as a descendant of another row - must open in one place without opening in the
			// other, and the scope is what tells the two places apart (see favoriteExpandKey).
			rowScope() {
				return favoriteKey(this.item.entityType, Number(this.item.entityId));
			},
			// Expansion of the documents inside THIS branch, in the shape TreeNode reads it.
			branchExpandedDocs() {
				return this.state.favorites.expandedDocsByRow[this.rowScope] ?? {};
			},
			// [DTO-01] expandVia: a document seen only through a personal grant lives in the accessible-tree
			// namespace, and the regular branch action would turn its owner down.
			isSharedBranch() {
				return !this.isCollection && this.item?.expandVia === 'accessibleTree';
			},
			// A knowledge base opens its root branch, a document its own.
			branchCollectionId() {
				return Number(this.isCollection ? this.item.entityId : this.item.collectionId);
			},
			branchParentId() {
				return this.isCollection ? null : Number(this.item.entityId);
			},
			children() {
				return this.getBranchChildren(this.branchCollectionId, this.branchParentId);
			},
			isBranchLoading() {
				return this.isBranchChildrenLoading(this.branchCollectionId, this.branchParentId);
			},
			hasNextBranchPage() {
				return this.hasNextBranchChildren(this.branchCollectionId, this.branchParentId);
			},
			// The top-level row of the block owns no scope: its place IS the scope of everything below it.
			branchError() {
				return this.state.favorites.branchError(this.item.entityType, Number(this.item.entityId));
			},
			// Routes the load-more sentinel of the branch to the loader of the matching namespace.
			treeNamespace() {
				return this.isSharedBranch ? 'shared' : 'collection';
			},
			sentinelParentId() {
				return this.branchParentId === null ? 'root' : String(this.branchParentId);
			},
			// [P3] Order is a property of the whole list, and under the notification filter part of it is
			// not on screen: a gap between two visible rows would mean something else once the filter is
			// off. So the block is reordered only when all of it is shown (ADR section 9).
			canDrag() {
				// A row the server has not named yet has no id to reorder by: the order is written in row ids.
				return this.state.favorites.onlyNotified !== true && this.item?.isProvisional !== true;
			},
			isDragSource() {
				const dragItem = this.state.favorites.dragItem;
				return Boolean(dragItem) && Number(dragItem.id) === Number(this.item.id);
			},
			isDropTarget() {
				const target = this.state.favorites.dropTarget;
				return Boolean(target) && Number(target.id) === Number(this.item.id);
			},
			dropClass() {
				if (!this.isDropTarget) {
					return '';
				}
				if (this.state.favorites.dropTarget.placement === 'before') {
					return 'is-drop-before';
				}

				// An open branch stands between this row and the next one: the line goes under the branch,
				// drawn on the wrapper, or it would promise a gap where there is none.
				return this.isExpanded ? '' : 'is-drop-after';
			},
			isDropAfterExpanded() {
				return this.isDropTarget && this.state.favorites.dropTarget.placement === 'after' && this.isExpanded;
			},
			canEditNestedDocument() {
				return this.isSharedBranch ? this.actions.canEditSharedDocument : this.actions.canEditDocument;
			},
			canManageNestedDocument() {
				return this.isSharedBranch ? this.actions.canManageSharedDocument : this.actions.canManageDocument;
			}
		},
		methods: {
			// One read path per namespace, shared by the row and by every level under it.
			getBranchChildren(collectionId, parentId) {
				return this.isSharedBranch ? this.state.getSharedChildren(collectionId, parentId) : this.state.getChildren(collectionId, parentId);
			},
			isBranchChildrenLoading(collectionId, parentId) {
				return this.isSharedBranch ? this.state.isSharedChildrenLoading(collectionId, parentId) : this.state.isLoadingChildren(collectionId, parentId);
			},
			hasNextBranchChildren(collectionId, parentId) {
				return this.isSharedBranch ? this.state.hasNextSharedChildren(collectionId, parentId) : this.state.hasNextChildren(collectionId, parentId);
			},
			onOpen(event) {
				// Modifier keys, middle and right click stay native - same rule as tree rows.
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.$emit('open', this.item);
			},
			onDragStart(event) {
				if (!this.canDrag) {
					event.preventDefault();
					return;
				}
				this.actions.startFavoriteDrag(this.item, event);
			},
			onRemove() {
				void this.actions.toggleFavorite({
					entityType: this.item.entityType,
					entityId: Number(this.item.entityId)
				});
			},
			notifyTarget() {
				return {
					entityType: this.item.entityType,
					entityId: Number(this.item.entityId)
				};
			},
			onToggleNotify() {
				void this.actions.toggleFavoriteNotify(this.notifyTarget());
			},
			onSelectNotifyMode(mode) {
				void this.actions.setFavoriteNotify(this.notifyTarget(), mode);
			},
			onClearNotify() {
				void this.actions.clearFavoriteNotify(this.notifyTarget());
			},
			// [AC-045] A document of the branch keeps only what it is allowed to do there: mute what
			// reaches it and lift that mute. The depth of the subscription above it is not its to change.
			nestedNotifyState(doc) {
				if (!this.notificationsEnabled) {
					// The only source of a bell for a row of the branch: no state, no bell, no room held
					// for one. Nothing else in tree-node has to know about the flag.
					return null;
				}
				return this.state.favorites.notifyOf('document', Number(doc?.id));
			},
			onToggleNestedNotify(doc) {
				void this.actions.toggleFavoriteNotify({
					entityType: 'document',
					entityId: Number(doc?.id)
				});
			},
			onToggleExpanded() {
				void this.actions.toggleFavoriteExpanded(this.item);
			},
			onRetryBranch() {
				void this.actions.retryFavoriteBranch(this.item);
			},
			// A nested row expands in the block's space too, along the path of the row it hangs under -
			// `scope` is what keeps that path apart from the same document's other places in the block.
			nestedTarget(doc) {
				return {
					entityType: 'document',
					entityId: Number(doc?.id),
					collectionId: Number(doc?.collectionId),
					expandVia: this.isSharedBranch ? 'accessibleTree' : 'tree',
					scope: this.rowScope
				};
			},
			onToggleNested(doc) {
				void this.actions.toggleFavoriteExpanded(this.nestedTarget(doc));
			},
			// [ERR-005] Read and written under one key: the branch of a nested row fails in this row's scope.
			nestedBranchError(doc) {
				return this.state.favorites.branchError('document', Number(doc?.id), this.rowScope);
			},
			onRetryNested(doc) {
				void this.actions.retryFavoriteBranch(this.nestedTarget(doc));
			},
			onOpenNested(doc) {
				void this.actions.openDocumentFromTree(doc);
			},
			onPrefetchNested(doc) {
				if (this.isSharedBranch) {
					this.actions.prefetchSharedDocumentChildren(doc);
					return;
				}
				this.actions.prefetchDocumentChildren(doc);
			}
		},
		template: `
		<div class="favorite-item" :class="{ 'is-favorite-drop-after': isDropAfterExpanded }">
			<div
				class="favorite-row"
				:class="[{ 'is-active': isActive, 'is-drag-source': isDragSource }, dropClass]"
				:data-favorite-row-id="item.id"
				:draggable="canDrag"
				@dragstart="onDragStart($event)"
				@dragend="actions.endFavoriteDrag()"
			>
				<!-- Holder of the highlight, the same one the knowledge-base and document rows carry: it
						 doubles as the row's leading inset and keeps the fill glued to the visible left edge. -->
				<span class="favorite-row__pill" aria-hidden="true"><span class="favorite-row__pill-fill"></span></span>
				<button
					v-if="canExpand"
					type="button"
					class="favorite-row__disclosure"
					:class="{ 'is-expanded': isExpanded }"
					:title="expandLabel"
					:aria-label="expandLabel"
					:aria-expanded="isExpanded.toString()"
					data-testid="note-sidebar-favorite-disclosure"
					@click.stop="onToggleExpanded"
				>
					<BIcon :name="Outline.CHEVRON_RIGHT_L" :size="16" color="var(--ui-color-base-1)" />
				</button>
				<span v-else class="favorite-row__disclosure-spacer" aria-hidden="true"></span>
				<span
					v-if="isCollection"
					class="favorite-row__icon favorite-row__icon--collection note-collection-glyph"
					aria-hidden="true"
				></span>
				<BIcon v-else class="favorite-row__icon" :name="Outline.FILE" :size="18" />
				<a
					class="favorite-row__title"
					:data-kb-name="nameReserve"
					:href="href"
					:title="item.title"
					draggable="false"
					@click="onOpen($event)"
				>{{ item.title }}</a>
				<!-- The same holder the tree rows use, so both are pinned to the visible right edge of the
						 one scroll area they share. In the flow they were pinned to the edge of the content
						 instead, and the two drifted apart by a few pixels the moment a nested row made the
						 block scroll sideways. -->
				<span class="tree-actions-anchor">
				<span class="favorite-row__actions">
					<!-- [P4.T1] Depth to choose - the popover of the editor, one and the same control.
							 Nothing to choose - one press. -->
					<SubscriptionBellView
						v-if="notificationsEnabled && hasNotifyDepth"
						:state="item.notify"
						:is-saving="isNotifySaving"
						:messages="messages.notifyPopover"
						trigger-class="favorite-row__btn favorite-row__btn--notify"
						active-class="is-on"
						muted-class="is-muted"
						teleport-to="body"
						:popover-class="popoverClass"
						icon-class="favorite-row__btn-icon"
						@select-mode="onSelectNotifyMode"
						@unsubscribe="onClearNotify"
						@mute="onSelectNotifyMode('muted')"
						@resume="onClearNotify"
					/>
					<button
						v-else-if="notificationsEnabled"
						type="button"
						class="favorite-row__btn favorite-row__btn--notify"
						:class="{ 'is-on': isNotified, 'is-muted': isMuted }"
						:title="notifyLabel"
						:aria-label="messages.notifyState"
						:aria-pressed="isNotified.toString()"
						@click.stop="onToggleNotify"
					>
						<BIcon :name="notifyIcon" :size="16" />
					</button>
					<button
						type="button"
						class="favorite-row__btn favorite-row__btn--favorite"
						:title="messages.favoriteOff"
						:aria-label="messages.favoriteState"
						aria-pressed="true"
						@click.stop="onRemove"
					>
						<BIcon :name="Solid.FAVORITE" :size="16" />
					</button>
				</span>
				</span>
			</div>
			<ExpandTransition :loading="isBranchLoading">
			<div v-if="isExpanded" class="favorite-branch">
				<ul class="tree-branch">
					<!-- Level 1, the same level a knowledge base gives its own root documents: the row above
							 stands where a knowledge-base row stands (its chevron on the left edge of the block),
							 not where a first-level document does. Handing the children the level they have in the
							 tree put them 43px from their parent's chevron instead of 20 and left the guide line
							 running down empty space. -->
					<tree-node
						v-for="child in children"
						:key="child.id"
						:doc="child"
						:level="1"
						:selected-doc-id="state.selectedDocId"
						:expanded-docs="branchExpandedDocs"
						:get-children="getBranchChildren"
						:is-loading-children="isBranchChildrenLoading"
						:has-next-children="hasNextBranchChildren"
						:can-edit-document="canEditNestedDocument"
						:can-manage-document="canManageNestedDocument"
						:is-document-favorite="isDocumentFavorite"
						:toggle-document-favorite="toggleDocumentFavorite"
						:notify-state-of="nestedNotifyState"
						:toggle-notify="onToggleNestedNotify"
						:branch-error-of="nestedBranchError"
						:messages="messages"
						:tree-namespace="treeNamespace"
						row-context="favorites"
						@toggle="onToggleNested"
						@open="onOpenNested"
						@prefetch-children="onPrefetchNested"
						@retry-branch="onRetryNested"
					/>
					<li v-if="isBranchLoading" class="sidebar-muted">
						<SidebarLoader :level="1" />
					</li>
					<li
						v-if="hasNextBranchPage"
						class="doc-load-more-sentinel js-doc-load-more-sentinel"
						:data-collection-id="branchCollectionId"
						:data-parent-id="sentinelParentId"
						:data-tree-namespace="treeNamespace"
						aria-hidden="true"
					/>
				</ul>
				<!-- [ERR-005] The failure of one branch stays in its own row. An empty branch is not a
						 failure: personal grants can leave a branch with nothing visible in it. -->
				<div v-if="branchError !== null" class="favorites-empty">
					{{ branchError }}
					<button type="button" class="favorites-retry" @click="onRetryBranch">
						{{ messages.favoritesRetry }}
					</button>
				</div>
			</div>
			</ExpandTransition>
		</div>
	`
	};

	// Distance from the edge of the list at which the next page is asked for.
	const SENTINEL_MARGIN = 24;

	// Name of the row transition group, and the name used for the one change that carries none: nothing is
	// styled for it, so enter and leave are over within a frame.
	const ROW_TRANSITION = 'favorite-row';
	const ROW_TRANSITION_INSTANT = 'favorite-row-instant';

	// A page: the rows that were there stand where they stood and more follow them. Anything else - a row
	// starred, a row gone, the filter answered - reaches the head of the list or takes something out of it.
	function isAppend(previous, next) {
		const before = Array.isArray(previous) ? previous : [];
		const after = Array.isArray(next) ? next : [];
		if (before.length === 0 || after.length <= before.length) {
			return false;
		}
		return before.every((row, index) => row.entityType === after[index]?.entityType && Number(row.entityId) === Number(after[index]?.entityId));
	}
	const FavoritesSection = {
		name: 'FavoritesSection',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ExpandTransition,
			FavoriteRow
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			selectedDocId: {
				type: Number,
				default: null
			},
			selectedCollectionId: {
				type: Number,
				default: null
			},
			// Handed through to the nested tree rows: the star of a document has one implementation and it
			// lives in the sidebar root.
			isDocumentFavorite: {
				type: Function,
				required: true
			},
			toggleDocumentFavorite: {
				type: Function,
				required: true
			}
		},
		emits: ['open'],
		// The height floor of the section is published by a pass scheduled from appearance hooks only, and
		// a row leaving triggers none of them - so the pass is asked for once the row is out of the DOM.
		inject: {
			noteScheduleTreeMetrics: {
				default: null
			},
			// Same bridge the section transition uses, and for the same reason: the share has to stand where
			// the content stands, in the frame the content changes (see the watcher on `items`).
			noteRefreshSectionFloors: {
				default: null
			}
		},
		data() {
			return {
				rowTransition: ROW_TRANSITION,
				scrollRaf: 0,
				// [P4.T1] The depth popover of a row is teleported out of the panel (which clips it and
				// stands in the way of viewport positioning), so it no longer inherits the design-system
				// context of the application - the block carries the class for it, one subscription for
				// every row instead of one per row.
				themeContextClass: note_ui_themeContext.NoteThemeContext.getDesignSystemContext()
			};
		},
		created() {
			this.unsubscribeTheme = note_ui_themeContext.NoteThemeContext.subscribe(event => {
				this.themeContextClass = note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(event?.data?.theme ?? note_ui_themeContext.NoteThemeContext.get());
			});
		},
		beforeUnmount() {
			this.unsubscribeTheme?.();
			this.unsubscribeTheme = null;
			if (this.scrollRaf) {
				cancelAnimationFrame(this.scrollRaf);
				this.scrollRaf = 0;
			}
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			Solid: () => ui_iconSet_api_vue.Solid,
			items() {
				return this.state.favorites.items;
			},
			// The row's depth popover is teleported to <body>, so it escapes the panel's stacking context.
			// Alongside the design-system context it carries a marker class that lets sidebar.css lift it
			// above the mobile nav drawer - teleported at its own z-index the popover lands behind the drawer.
			notifyPopoverClass() {
				return `${this.themeContextClass} note-sidebar-notify-popover`.trim();
			},
			// Kept in the store, not here: the rail of the collapsed panel is drawn instead of this component
			// and opens the block its entry leads to.
			isExpanded() {
				return this.state.favorites.sectionExpanded;
			},
			notifyFilter() {
				return this.state.favorites.onlyNotified;
			},
			// Hiding the filter cannot strand the list in a filtered state: onlyNotified is held in the
			// store for the life of the page, so the next load starts unfiltered.
			notificationsEnabled() {
				return this.state.notificationsEnabled === true;
			},
			loadError() {
				return this.state.favorites.error;
			},
			// The mockup has no empty favorites block: with nothing starred the section is not there.
			// "Nothing starred" means a page the server confirmed empty, not a page still on its way -
			// otherwise the block would blink on every load. A block emptied by the filter stays: the
			// filter has to remain reachable. A failed load stays too, to show its own error.
			isVisible() {
				if (this.loadError !== null) {
					return true;
				}
				if (!this.state.favorites.isLoaded) {
					return false;
				}

				// A filter switch flips the flag at once, its page arrives a request later: until then the
				// rows on screen still answer the PREVIOUS filter. Turning the filter off while it held
				// nothing would read as "empty and unfiltered" and collapse the whole block under the
				// pointer that is still on its button, so that one read keeps the block on screen - and only
				// that one. The composition of the block is re-read after every access push as well, and an
				// empty block held up by those appeared and went away again on every collection created,
				// archived or deleted.
				return this.items.length > 0 || this.notifyFilter || this.state.favorites.isFilterReloading;
			},
			// What the disclosure of the header points aria-controls at. One favorites block to a panel and one
			// panel to a page, so the id is a constant rather than a per-instance counter.
			listId() {
				return 'note-sidebar-favorites-list';
			},
			filterLabel() {
				return this.notifyFilter ? this.messages.favoritesShowAll : this.messages.favoritesShowNotified;
			},
			// Tinted while the filter is off, filled once it is on - the mockup's secondary button.
			filterClass() {
				const style = this.notifyFilter ? '--style-filled' : '--style-tinted';
				return `favorites-filter ui-btn --air --with-icon ui-btn-xs ${style} ui-btn-collapsed`;
			}
		},
		watch: {
			// Every composition of the block arrives in one render - a filter switch, a page, a row starred
			// elsewhere. The scheduled pass publishes the share a frame later, and in that frame the new rows
			// stood inside the box the previous composition was given: clipped, then stepped to their own
			// height. `flush: 'post'` puts this after the rows are in the DOM and before the frame is painted,
			// so the box is at the content in the same frame the content changes - and nothing is animated
			// about it, which is what makes the filter answer the press instead of playing something first.
			items: {
				flush: 'post',
				handler(next, previous) {
					// A row joins or leaves at its full height in one frame, and everything below the block - the
					// knowledge bases among it - stepped a row's worth in that same frame. Marked before the share
					// is published, so the section carries them instead: 275ms, the length every section of the
					// panel moves in. Two changes are left abrupt on purpose. A page appended to the tail arrives
					// while the reader is scrolling the list, and the glide would take the thumb from under the
					// pointer doing the scrolling (it is hidden for the length of a section's motion). And the
					// filter answers the press it was given, in the frame of the press.
					// Every row stands the same height, so the block asks for a different one only when it holds a
					// different number of rows. The answer to a press replacing the row it drew provisionally is
					// the same composition over again, and marking that would take the thumb away for nothing.
					const resized = (Array.isArray(next) ? next.length : 0) !== (Array.isArray(previous) ? previous.length : 0);
					if (resized && this.rowTransition !== ROW_TRANSITION_INSTANT && !isAppend(previous, next)) {
						markSectionMotion(document.querySelector('.sidebar'));
					}
					this.noteRefreshSectionFloors?.();
				}
			}
		},
		methods: {
			// After the leave transition, so the composition measured no longer counts the row that left: it
			// stays in flow for the length of its fade on purpose.
			onRowLeft() {
				// The row held its place for the length of its fade, so the height the block loses is lost here,
				// a fade later - by which time the mark the removal itself set has run out. Marked again, or the
				// panel would glide the row away and then drop everything below it in one frame.
				markSectionMotion(document.querySelector('.sidebar'));
				this.noteScheduleTreeMetrics?.();
			},
			isActiveItem(item) {
				return item.entityType === 'collection' ? Number(item.entityId) === this.selectedCollectionId && !this.selectedDocId : Number(item.entityId) === this.selectedDocId;
			},
			onToggle() {
				this.actions.toggleFavoritesSection();
			},
			onToggleFilter() {
				this.actions.setFavoritesSectionExpanded(true);
				// Rows leave without their fade for this one change: the box lands on the filtered composition
				// in the same frame, and a row still fading inside it would be a row hanging out of the box.
				this.rowTransition = ROW_TRANSITION_INSTANT;
				void this.actions.setFavoritesFilter(!this.notifyFilter);
				// Only the render the press itself causes is abrupt. The page that follows carries rows the
				// client could not know about, and those still arrive with the fade the block is drawn with.
				void this.$nextTick(() => {
					this.rowTransition = ROW_TRANSITION;
				});
			},
			onRetry() {
				void this.actions.retryFavorites();
			},
			// The list scrolls inside itself past its share of the panel, so paging is driven from here
			// rather than from the sidebar's tree areas. One measurement per frame: the sentinel check
			// forces a layout flush and the answer cannot change more often than that.
			onListScroll(event) {
				const container = event.currentTarget;
				if (!(container instanceof HTMLElement) || this.scrollRaf) {
					return;
				}
				this.scrollRaf = requestAnimationFrame(() => {
					this.scrollRaf = 0;
					this.tryAutoLoad(container);
				});
			},
			tryAutoLoad(container) {
				this.tryAutoLoadList(container);
				this.tryAutoLoadBranches(container);
			},
			tryAutoLoadList(container) {
				// A failed page is not asked for again by itself: the sentinel stays in view, so scrolling
				// would keep firing the same request. The next attempt is the user's.
				if (!this.state.favorites.hasNextPage || this.state.favorites.isLoading || this.loadError !== null) {
					return;
				}
				const sentinel = container.querySelector('.js-favorites-load-more-sentinel');
				if (!(sentinel instanceof HTMLElement) || !this.isSentinelInView(container, sentinel)) {
					return;
				}
				void this.actions.loadFavoritesPage();
			},
			// Branches expanded inside the block page the same way they do in the tree, only their
			// sentinels ride this list instead of a tree area - so they are routed from here, by the
			// namespace the sentinel carries.
			tryAutoLoadBranches(container) {
				for (const sentinel of container.querySelectorAll('.js-doc-load-more-sentinel')) {
					if (!(sentinel instanceof HTMLElement) || !this.isSentinelInView(container, sentinel)) {
						continue;
					}
					const collectionId = Number(sentinel.dataset.collectionId);
					if (!Number.isInteger(collectionId) || collectionId <= 0) {
						continue;
					}
					const rawParentId = sentinel.dataset.parentId || '';
					const parentId = rawParentId === 'root' ? null : Number(rawParentId);
					if (rawParentId !== 'root' && (!Number.isInteger(parentId) || parentId <= 0)) {
						continue;
					}
					const isShared = sentinel.dataset.treeNamespace === 'shared';
					const hasNext = isShared ? this.state.hasNextSharedChildren(collectionId, parentId) : this.state.hasNextChildren(collectionId, parentId);
					const isLoading = isShared ? this.state.isSharedChildrenLoading(collectionId, parentId) : this.state.isLoadingChildren(collectionId, parentId);
					if (!hasNext || isLoading) {
						continue;
					}
					const doc = {
						collectionId,
						id: parentId
					};
					const page = isShared ? this.actions.loadMoreSharedChildren(doc) : this.actions.loadMoreChildren(doc);
					// [API-06] The next page of a branch arrives without notification states - one request
					// per page brings them, or the new rows would show no bell where a bell belongs.
					void Promise.resolve(page).then(() => this.actions.refreshFavoriteCoverage({
						collectionId,
						parentId,
						expandVia: isShared ? 'accessibleTree' : 'tree'
					}));
					break;
				}
			},
			isSentinelInView(container, sentinel) {
				const containerRect = container.getBoundingClientRect();
				const rect = sentinel.getBoundingClientRect();
				return !(rect.bottom < containerRect.top - SENTINEL_MARGIN || rect.top > containerRect.bottom + SENTINEL_MARGIN);
			}
		},
		template: `
		<template v-if="isVisible">
			<!-- The row itself is a plain box holding two controls side by side: the disclosure is a native
					 button, as in every other section header of the panel, and the notification filter stands next
					 to it instead of inside it. The click on the row is kept, so the whole width still opens and
					 closes the block. -->
			<div
				class="sidebar-section-header"
				data-testid="note-sidebar-favorites-section"
				@click="onToggle"
			>
				<button
					type="button"
					class="sidebar-section-header__toggle"
					:aria-expanded="isExpanded.toString()"
					:aria-controls="isExpanded ? listId : null"
					@click.stop="onToggle"
				>
					<BIcon
						class="sidebar-section-header__glyph"
						:name="Outline.FAVORITE"
						:size="22"
						color="var(--ui-color-accent-main-primary)"
					/>
					<span class="sidebar-section-header__title">{{ messages.favorites }}</span>
				</button>
				<span v-if="notificationsEnabled" class="sidebar-section-header__filter">
					<button
						type="button"
						:class="filterClass"
						:title="filterLabel"
						:aria-label="filterLabel"
						:aria-pressed="notifyFilter.toString()"
						data-testid="note-sidebar-favorites-filter"
						@click.stop="onToggleFilter"
					>
						<BIcon :name="notifyFilter ? Solid.NOTIFICATION : Outline.NOTIFICATION" :size="16" />
					</button>
				</span>
			</div>
			<ExpandTransition>
				<!-- Two elements, the same pair every section of the panel is built from: the outer one is
						 what the height animation owns, the inner one is what scrolls. One element in both
						 roles is what set this block apart: the animation hides the overflow of the element it
						 animates, and that took the scrolling away from under the sticky row controls for the
						 length of every open and close. -->
				<div v-if="isExpanded" :id="listId" class="collection-list favorites-list">
					<!-- The gap a dragged row would go into is resolved from the pointer against the whole
							 area, so the area, not the row, owns the drag-over and the drop. -->
					<div
						class="tree-scroll tree-scroll--favorites"
						@scroll.passive="onListScroll"
						@dragover="actions.onFavoriteListDragOver($event)"
						@drop="actions.onFavoriteListDrop($event)"
					>
					<!-- Beside the rows, not among them: the box below is as wide as its widest row, and a
							 line of prose in there set the width of the whole area - the message was cut off and
							 the area grew a horizontal bar. This is where the other sections keep theirs. -->
					<div v-if="loadError !== null" class="sidebar-muted sidebar-muted--flow favorites-empty">
						{{ loadError }}
						<button type="button" class="favorites-retry" @click="onRetry">
							{{ messages.favoritesRetry }}
						</button>
					</div>
					<div
						v-else-if="!items.length"
						class="sidebar-muted sidebar-muted--flow favorites-empty"
					>{{ messages.favoritesEmptyNotified }}</div>
					<div class="tree-scroll__inner">
					<!-- A row appearing or leaving is smoothed over, nothing more: no wrapper tag, so the
							 structure the drag, the scroll sentinel and the height floors rest on is untouched. -->
					<TransitionGroup :name="rowTransition" @after-leave="onRowLeft">
						<FavoriteRow
							v-for="item in items"
							:key="item.entityType + ':' + item.entityId"
							:item="item"
							:state="state"
							:actions="actions"
							:messages="messages"
							:is-active="isActiveItem(item)"
							:popover-class="notifyPopoverClass"
							:is-document-favorite="isDocumentFavorite"
							:toggle-document-favorite="toggleDocumentFavorite"
							@open="$emit('open', $event)"
						/>
					</TransitionGroup>
					<div
						v-if="state.favorites.hasNextPage"
						class="doc-load-more-sentinel js-favorites-load-more-sentinel"
						aria-hidden="true"
					></div>
					</div>
					</div>
				</div>
			</ExpandTransition>
			<div class="sidebar-section-divider" aria-hidden="true"></div>
		</template>
	`
	};

	// The share of a section no other section may take from it, in rows. Five is what makes a list read as
	// a list: below that the section is a hint that something is there rather than a way to get to it.
	const SECTION_FLOOR_ROWS = 5;
	const SECTION_ROW_HEIGHT = 32;

	// How long the bar of an area stays up after the scrolling stops. Long enough to read as a fade of the
	// same gesture, short enough not to sit over the rows once the list is still.
	const SCROLLBAR_FLASH_MS = 900;

	// The height transition of a section plus slack, so the panel is unmarked after the motion and not in
	// the middle of it. Held here rather than read back from the stylesheet: the value the sections move
	// over is one and the same, and a share published while unmarked lands in one step.
	const SECTION_SHARE_MS = 320;
	const SidebarRootComponent = {
		name: 'SidebarRootComponent',
		components: {
			TreeNode,
			SidebarSearchRow,
			SidebarRail,
			SidebarFooter,
			SidebarLoader,
			BIcon: ui_iconSet_api_vue.BIcon,
			ExpandTransition,
			FavoritesSection
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			themeActions: {
				type: Object,
				default: null
			}
		},
		// Tree rows live in TreeNode children. A child re-render - a row appearing, a star toggling
		// and with it the room its title has to leave - never reaches this component's updated()
		// hook, so the measure pass has to be reachable from down there.
		provide() {
			return {
				noteScheduleTreeMetrics: () => {
					this.scheduleTreeMetrics();
					this.scheduleSectionShares();
				},
				// Synchronous on purpose: what opens and closes the sections of the panel is the transition, and
				// the shares this publishes are what it moves them by. They have to stand at their destination
				// in the frame the motion starts, not one frame later.
				noteRefreshSectionFloors: hint => {
					if (this.$el instanceof HTMLElement) {
						this.refreshSectionFloors(this.$el, hint);
					}
				},
				// Whether the panel of sections is itself being drawn for the first time - the rail giving way
				// to it. A section appearing along with the panel has no motion of its own to play: what the
				// user asked for is the panel, and it is already on its way.
				noteSectionsAppearing: () => this.sectionsAppearing
			};
		},
		data() {
			return {
				isSidebarResizing: false,
				sidebarResizeStartX: 0,
				sidebarResizeStartWidth: 0,
				renameCollectionCancelled: false,
				dragAutoScrollRaf: 0,
				dragAutoScrollSpeed: 0,
				dragLastClientX: 0,
				dragLastClientY: 0,
				dragOverCaptureHandler: null,
				dragScrollDuringDrag: null,
				dispatchingSyntheticDragOver: false,
				sidebarScrollRaf: 0,
				treeMetricsRaf: 0,
				sectionSharesRaf: 0,
				sectionSharesDragging: false,
				// Set for the one render in which the rail gives way to the sections (see the watcher below).
				sectionsAppearing: false,
				sidebarResizeObserver: null,
				sharedSentinelObserver: null,
				observedSharedSentinel: null,
				sharedSentinelVisible: false,
				sharedPumpRunning: false,
				pointerScrollArea: null,
				pointerScrollHandler: null,
				pointerScrollLeaveHandler: null,
				scrollFlashHandler: null,
				// Elements as keys, so nothing here outlives the area it belongs to; plain Map because the
				// timers still have to be cleared one by one when the panel goes away.
				scrollFlashTimers: ui_vue3.markRaw(new Map()),
				treeScrollLeft: ui_vue3.markRaw(new WeakMap())
			};
		},
		mounted() {
			const content = this.$refs.sidebarContent;
			if (content) {
				this.dragOverCaptureHandler = event => this.onDragOverCapture(event);
				content.addEventListener('dragover', this.dragOverCaptureHandler, true);
				// Scroll does not bubble, but the capture path still walks the ancestors, so one listener
				// here covers both tree areas below.
				this.dragScrollDuringDrag = () => this.onScrollDuringDrag();
				content.addEventListener('scroll', this.dragScrollDuringDrag, {
					passive: true,
					capture: true
				});

				// The accessible-tree section can page through windows that yield nothing showable (rows
				// the user is denied, or nodes deep inside an already-shared subtree). While that lasts
				// the section renders empty, so it never scrolls and the scroll-driven sentinel check can
				// never fire — paging would stop with a live cursor. Visibility, unlike scrolling, still
				// reports the sentinel, so an empty section keeps paging exactly while it is on screen.
				if (typeof IntersectionObserver === 'function') {
					this.sharedSentinelObserver = new IntersectionObserver(entries => {
						this.sharedSentinelVisible = entries.some(entry => entry.isIntersecting);
						void this.pumpSharedSection();
					},
					// Viewport as the root, not the panel: the section scrolls inside its own tree area
					// now, and intersection already accounts for every clipping ancestor on the way.
					{
						rootMargin: '24px'
					});
					this.syncSharedSentinelObserver();
				}
			}
			if (this.$el instanceof HTMLElement) {
				// Whole panel, not just the list area: the width handle sits right next to a tree's
				// scrollbar, and a slow exit over it has to drop the thumb too.
				this.pointerScrollHandler = event => this.syncPointerScrollArea(event);
				this.pointerScrollLeaveHandler = () => this.clearPointerScrollArea();
				// Where there is no pointer to be inside anything, the bar answers to the scrolling itself:
				// one listener for every area of the panel, capture phase because scroll does not bubble.
				this.scrollFlashHandler = event => this.flashScrollbar(event.target);
				this.$el.addEventListener('scroll', this.scrollFlashHandler, true);
				this.$el.addEventListener('pointermove', this.pointerScrollHandler, true);
				this.$el.addEventListener('pointerleave', this.pointerScrollLeaveHandler);
			}

			// Tree title widths and the highlight pill are measured against the visible area, so a
			// change of sidebar width has to re-run the pass.
			if (typeof ResizeObserver === 'function' && this.$el instanceof HTMLElement) {
				this.sidebarResizeObserver = new ResizeObserver(() => {
					this.scheduleTreeMetrics();
					this.scheduleSectionShares();
				});
				this.sidebarResizeObserver.observe(this.$el);
			}
			this.scheduleTreeMetrics();
			this.scheduleSectionShares();
		},
		updated() {
			this.scheduleTreeMetrics();
			this.syncDragSectionShares();
			this.scheduleSectionShares();
			// The sentinel is v-if'd on sharedHasNextPage and re-created with the section, so the
			// observed node has to be re-pointed after a render. Cheap: one querySelector and an
			// identity check.
			this.syncSharedSentinelObserver();
		},
		beforeUnmount() {
			this.clearPointerScrollArea();
			for (const timer of this.scrollFlashTimers.values()) {
				clearTimeout(timer);
			}
			this.scrollFlashTimers.clear();
			if (this.$el instanceof HTMLElement) {
				if (this.scrollFlashHandler) {
					this.$el.removeEventListener('scroll', this.scrollFlashHandler, true);
				}
				if (this.pointerScrollHandler) {
					this.$el.removeEventListener('pointermove', this.pointerScrollHandler, true);
				}
				if (this.pointerScrollLeaveHandler) {
					this.$el.removeEventListener('pointerleave', this.pointerScrollLeaveHandler);
				}
			}
			this.clearSidebarResizeState();
			// Not part of the drag state: a drag that ends with the pointer still on the handle leaves the
			// boundary lit on purpose, so only going away clears this one.
			this.onSidebarResizeHover(false);
			this.stopDragAutoScroll();
			if (this.sidebarScrollRaf) {
				cancelAnimationFrame(this.sidebarScrollRaf);
				this.sidebarScrollRaf = 0;
			}
			if (this.treeMetricsRaf) {
				cancelAnimationFrame(this.treeMetricsRaf);
				this.treeMetricsRaf = 0;
			}
			if (this.sectionSharesRaf) {
				cancelAnimationFrame(this.sectionSharesRaf);
				this.sectionSharesRaf = 0;
			}
			if (this.sidebarResizeObserver) {
				this.sidebarResizeObserver.disconnect();
				this.sidebarResizeObserver = null;
			}
			if (this.sharedSentinelObserver) {
				this.sharedSentinelObserver.disconnect();
				this.sharedSentinelObserver = null;
				this.observedSharedSentinel = null;
				this.sharedSentinelVisible = false;
			}
			const content = this.$refs.sidebarContent;
			if (content && this.dragOverCaptureHandler) {
				content.removeEventListener('dragover', this.dragOverCaptureHandler, true);
			}
			if (content && this.dragScrollDuringDrag) {
				content.removeEventListener('scroll', this.dragScrollDuringDrag, true);
			}
		},
		computed: {
			displayedCollections() {
				return this.state.collections;
			},
			displayedLoading() {
				return this.state.collectionsLoading;
			},
			childrenGetter() {
				return this.state.getChildren;
			},
			// Empty-state prose lives beside the scrolling tree, not inside it, so it wraps against
			// the panel width. Inside it would depend on the measured visible width and reflow to a
			// different line count right after the expand animation had already sized itself.
			isCollectionsEmpty() {
				return !this.displayedLoading && this.displayedCollections.length === 0;
			},
			isSharedEmpty() {
				return !this.state.sharedLoading && !this.state.sharedHasNextPage && this.state.sharedContainers.length === 0;
			}
		},
		watch: {
			// The handle is drawn only in the expanded panel, so collapsing takes it out from under the
			// pointer and no leave event follows: the boundary would stay lit with nothing to grab.
			'state.sidebarCollapsed': function (collapsed) {
				if (collapsed) {
					this.onSidebarResizeHover(false);
				}
			},
			'state.renamingCollectionId': function (value) {
				this.renameCollectionCancelled = false;
				if (value !== null) {
					this.$nextTick(() => {
						const input = this.$refs[`renameCollectionInput-${value}`];
						const el = Array.isArray(input) ? input[0] : input;
						if (el) {
							el.focus();
							el.select();
						}
					});
				}
			},
			// The panel of sections replaces the rail whole, so every section in it is drawn anew - and Vue
			// runs the enter transition of each, because the transition itself is new too. There is nothing
			// to open here: the sections were left as they stand, and one of them opening marks the panel, at
			// which point every section still finding its share is carried to it over 275ms instead of being
			// drawn at it. Set before the render (a watcher runs ahead of it) and cleared once it is over.
			'state.sidebarCollapsed': function (collapsed) {
				if (collapsed) {
					return;
				}
				this.sectionsAppearing = true;
				this.$nextTick(() => {
					this.sectionsAppearing = false;
					// The shares of a panel just drawn are published by a pass a frame away, and until it runs
					// every section stands at the height its own content gives it. Here instead, in the tick the
					// sections are in the document and before the frame is painted, so the panel is drawn at its
					// shares rather than stepping to them.
					if (this.$el instanceof HTMLElement) {
						this.refreshSectionFloors(this.$el);
					}
				});
			},
			// A load already in flight makes the pump a no-op, and the sentinel stays visible without
			// changing state, so nothing would re-arm it. Its completion is that re-arm.
			'state.sharedLoading': function (value) {
				if (!value) {
					void this.pumpSharedSection();
				}
			}
		},
		methods: {
			onSearchNavigateDocument(payload) {
				const documentId = Number(payload?.documentId);
				if (documentId > 0) {
					// Direct click on a quick-search result.
					note_analytics.NoteAnalytics.documentViewed('search');
					this.actions.openDocument({
						id: documentId
					});
				}
			},
			onSearchNavigateSearch(payload) {
				const query = String(payload?.query || '');
				if (query.length > 0) {
					// "Show all results" gesture navigating to the full search page.
					note_analytics.NoteAnalytics.searchResult(true);
					this.actions.navigateToSearch(query);
				}
			},
			onSidebarResizeStart(event) {
				if (!(event instanceof MouseEvent) || event.button !== 0) {
					return;
				}
				if (!main_core.Type.isFunction(this.actions.setSidebarWidth)) {
					return;
				}
				if (this.state.sidebarCollapsed) {
					return;
				}
				event.preventDefault();
				this.isSidebarResizing = true;
				this.sidebarResizeStartX = event.clientX;
				this.sidebarResizeStartWidth = Number(this.state.sidebarWidth) || 280;
				main_core.Dom.addClass(document.body, 'note-sidebar-resizing');
				main_core.Event.bind(document, 'mousemove', this.onSidebarResizeMove);
				main_core.Event.bind(document, 'mouseup', this.onSidebarResizeEnd);
				main_core.Event.bind(window, 'blur', this.onSidebarResizeCancel);
			},
			// Hover of the handle, published for the header: while a drag is on, the pointer may leave the
			// handle and the boundary must stay lit, so the drag class is the one that decides then.
			onSidebarResizeHover(over) {
				if (over) {
					main_core.Dom.addClass(document.body, 'note-sidebar-resize-hover');
					return;
				}
				main_core.Dom.removeClass(document.body, 'note-sidebar-resize-hover');
			},
			onSidebarResizeMove(event) {
				if (!this.isSidebarResizing || !main_core.Type.isFunction(this.actions.setSidebarWidth)) {
					return;
				}
				const deltaX = event.clientX - this.sidebarResizeStartX;
				const nextWidth = this.sidebarResizeStartWidth + deltaX;
				this.actions.setSidebarWidth(nextWidth);
			},
			onSidebarResizeEnd() {
				if (!this.isSidebarResizing) {
					return;
				}
				if (main_core.Type.isFunction(this.actions.saveSidebarWidth)) {
					this.actions.saveSidebarWidth(this.state.sidebarWidth);
				}
				this.clearSidebarResizeState();
			},
			onSidebarResizeCancel() {
				if (!this.isSidebarResizing) {
					return;
				}
				this.clearSidebarResizeState();
			},
			clearSidebarResizeState() {
				this.isSidebarResizing = false;
				main_core.Dom.removeClass(document.body, 'note-sidebar-resizing');
				main_core.Event.unbind(document, 'mousemove', this.onSidebarResizeMove);
				main_core.Event.unbind(document, 'mouseup', this.onSidebarResizeEnd);
				main_core.Event.unbind(window, 'blur', this.onSidebarResizeCancel);
			},
			// The rail's search entry expands the panel and asks for the caret: with the field only
			// rendered in the expanded panel, focus has to wait for that render.
			onRailExpand(payload) {
				this.onToggleSidebarCollapsed();
				if (!payload?.focusSearch || this.state.sidebarCollapsed) {
					return;
				}
				this.$nextTick(() => {
					this.$refs.searchRow?.focusInput();
				});
			},
			onToggleSidebarCollapsed() {
				if (!main_core.Type.isFunction(this.actions.toggleSidebarCollapsed)) {
					return;
				}
				this.clearSidebarResizeState();
				const isCollapsed = Boolean(this.actions.toggleSidebarCollapsed());
				if (main_core.Type.isFunction(this.actions.saveSidebarState)) {
					this.actions.saveSidebarState({
						width: this.state.sidebarWidth,
						collapsed: isCollapsed
					});
				}
			},
			getSidebarToggleLabel() {
				return this.state.sidebarCollapsed ? main_core.Loc.getMessage('NOTE_SIDEBAR_TOGGLE_EXPAND') : main_core.Loc.getMessage('NOTE_SIDEBAR_TOGGLE_COLLAPSE');
			},
			// Room the row's controls need at the right edge, so the measure pass stops the title
			// short of them instead of letting it slide underneath.
			collectionNameReserve(collection) {
				return rowNameReserve({
					isFavorite: this.isCollectionFavorite(collection)
				});
			},
			isCollectionFavorite(collection) {
				return this.state.favorites.isFavorite('collection', Number(collection?.id));
			},
			collectionFavoriteLabel(collection) {
				return this.isCollectionFavorite(collection) ? this.messages.favoriteOff : this.messages.favoriteOn;
			},
			onToggleCollectionFavorite(collection, event) {
				event.stopPropagation();
				void this.actions.toggleFavorite({
					entityType: 'collection',
					entityId: Number(collection?.id)
				},
				// What the row already knows, so the block draws it at once instead of after a read.
				{
					title: String(collection?.name ?? '')
				});
			},
			// Star of a tree row - passed down the recursive TreeNode instead of read there, so the store
			// stays the only owner of the state.
			isDocumentFavorite(doc) {
				return this.state.favorites.isFavorite('document', Number(doc?.id));
			},
			toggleDocumentFavorite(doc, hint = null) {
				void this.actions.toggleFavorite({
					entityType: 'document',
					entityId: Number(doc?.id)
				},
				// The row of the tree carries everything a row of the block needs except the values the
				// server assigns, so the block draws it at once instead of after a read.
				{
					...hint,
					title: String(doc?.title ?? ''),
					collectionId: Number(doc?.collectionId),
					parentId: doc?.parentId ?? null,
					hasChildren: doc?.hasChildren === true
				});
			},
			onOpenFavorite(item) {
				if (item?.entityType === 'collection') {
					this.onCollectionPlateClick({
						id: Number(item.entityId),
						name: String(item.title ?? '')
					});
					return;
				}
				note_analytics.NoteAnalytics.documentViewed('side_menu');
				this.actions.openDocument({
					id: Number(item.entityId)
				});
			},
			// The scrollbar thumbs are shown for one area at a time - the one the pointer is over.
			// Sitting on the area's own scrollbar counts: a hit there reports the area itself.
			syncPointerScrollArea(event) {
				const target = event.target instanceof Element ? event.target : null;
				const area = target ? target.closest('.tree-scroll') : null;
				const next = area instanceof HTMLElement ? area : null;
				if (next === this.pointerScrollArea) {
					return;
				}
				this.clearPointerScrollArea();
				this.pointerScrollArea = next;
				if (next) {
					next.classList.add('is-pointer-inside');
				}
			},
			// Shows the bar of the area being scrolled and takes it away once the scrolling stops. This is what
			// a touch screen has instead of the pointer condition above: a finger reports its position only
			// while it is down, so a bar tied to the pointer showed up under a finger resting on the list and
			// was gone the moment it lifted - the one time the bar has something to say is while the list moves.
			flashScrollbar(target) {
				const area = target instanceof Element ? target.closest('.tree-scroll') : null;
				if (!(area instanceof HTMLElement)) {
					return;
				}
				area.classList.add('is-scrolling');
				clearTimeout(this.scrollFlashTimers.get(area));
				this.scrollFlashTimers.set(area, setTimeout(() => {
					area.classList.remove('is-scrolling');
					this.scrollFlashTimers.delete(area);
				}, SCROLLBAR_FLASH_MS));
			},
			clearPointerScrollArea() {
				if (this.pointerScrollArea) {
					this.pointerScrollArea.classList.remove('is-pointer-inside');
					this.pointerScrollArea = null;
				}
			},
			// Both axes of a tree area come through here: the panel itself no longer scrolls, so this is
			// also where paging on approach to the end of a list is decided.
			onTreeAreaScroll(event) {
				const target = event.target;
				// What the measure pass writes answers to the horizontal offset alone, so scrolling a list
				// down changes nothing in it. Run on every frame of every scroll it re-measured every row
				// of every area of the panel for nothing.
				if (target instanceof HTMLElement && this.hasAreaScrolledSideways(target)) {
					this.scheduleTreeMetrics();
				}
				this.onScrollDuringDrag();
				if (!(target instanceof HTMLElement)) {
					return;
				}

				// Scroll fires several times per frame, and the sentinel walk below measures every
				// sentinel — each measurement forces a layout flush. One pass per frame is as often as
				// the answer can change, so extra events are dropped rather than queued.
				if (this.sidebarScrollRaf) {
					return;
				}
				this.sidebarScrollRaf = requestAnimationFrame(() => {
					this.sidebarScrollRaf = 0;
					this.processSidebarScroll(target);
				});
			},
			// Horizontal offset of an area as the measure pass last saw it. Areas as keys in a weak map, so
			// an area that goes away with its section takes its entry with it.
			hasAreaScrolledSideways(area) {
				const offset = area.scrollLeft;
				if (this.treeScrollLeft.get(area) === offset) {
					return false;
				}
				this.treeScrollLeft.set(area, offset);
				return true;
			},
			scheduleTreeMetrics() {
				if (this.treeMetricsRaf) {
					return;
				}
				this.treeMetricsRaf = requestAnimationFrame(() => {
					this.treeMetricsRaf = 0;
					this.refreshTreeMetrics();
				});
			},
			// Kept apart from the pass above, which runs on every scroll frame: the shares answer to WHAT the
			// panel holds, not to where a list is scrolled. Recounted on a scroll they moved the section under
			// the finger every time scrolling brought in another page of rows.
			//
			// Once per change, never per frame. What a section opening or closing changes is known the moment
			// it starts - the shares of the layout it ends in - and the stylesheet carries the sections there
			// over the time the motion takes. Counted every frame instead, the arithmetic itself became the
			// animation: rounding, a guard against rewriting a share by a hair, and a section measured while
			// in motion each turned what should be one glide into steps of their own size.
			// The shares are frozen for as long as a row is being dragged (see refreshSectionFloors), so the
			// layout the drop ends in is published here, once, when the drag is over - and published with the
			// panel marked, so the sections move to it over the same transition they open with instead of
			// stepping there in one frame.
			syncDragSectionShares() {
				const dragging = this.isAnyDragActive();
				if (dragging === this.sectionSharesDragging) {
					return;
				}
				this.sectionSharesDragging = dragging;
				if (dragging) {
					return;
				}
				const root = this.$el;
				if (!(root instanceof HTMLElement)) {
					return;
				}
				const panel = root.querySelector('.sidebar-sections');
				if (!(panel instanceof HTMLElement)) {
					return;
				}

				// Marked first, so the sections move to the shares published below over the transition they
				// open with; the mark lasts the length of the motion, so the passes that follow - a branch
				// rendered, a page of a list loaded - land through it too and not beside it.
				markSectionMotion(panel, SECTION_SHARE_MS);
				this.refreshSectionFloors(root);
			},
			scheduleSectionShares() {
				if (this.sectionSharesRaf) {
					return;
				}
				this.sectionSharesRaf = requestAnimationFrame(() => {
					this.sectionSharesRaf = 0;
					if (this.$el instanceof HTMLElement) {
						this.refreshSectionFloors(this.$el);
					}
				});
			},
			// Room the controls of this row take at the visible edge, for a device that shows them all at once.
			// Their box reaches further left than the buttons do - that overhang is where the fade is painted,
			// and a title is welcome to run under it, which is what the fade is for. The box ends at the edge
			// the cap is measured to, so the reserve is the whole of it less that overhang.
			// One measurement per shape of row, not per row: every document row with a bell has controls of
			// the same width, and the pass may walk hundreds of them.
			measureControlsReserve(name, cache) {
				const row = name.closest('.tree-row, .collection-row, .favorite-row');
				const box = row?.querySelector('.tree-actions, .collection-actions, .favorite-row__actions');
				if (!(box instanceof HTMLElement)) {
					return 0;
				}
				const shape = `${box.className}:${box.childElementCount}`;
				const known = cache.get(shape);
				if (known !== undefined) {
					return known;
				}
				const overhang = Number.parseFloat(getComputedStyle(box).paddingLeft) || 0;
				const reserve = Math.max(0, box.getBoundingClientRect().width - overhang);
				cache.set(shape, reserve);
				return reserve;
			},
			// One pass per frame over every tree area: publishes the visible width for the highlight
			// pill, caps each title at the visible right edge (minus the room its controls need) and
			// marks rows whose title has scrolled out of sight for the level hint to take over.
			// Every measurement is taken before anything is written, so the pass costs one layout flush
			// instead of one per row: a write between two reads makes the browser lay the panel out again
			// before the second read can answer. Nothing written here moves a title - the highlight pill is
			// out of flow, the travelling copy sits in a zero-width sticky box and the gutter reaches
			// section headers only - so the measurements stay true across the writes that follow.
			refreshTreeMetrics() {
				const root = this.$el;
				if (!(root instanceof HTMLElement) || !root.isConnected) {
					return;
				}
				// How much of that edge the controls need. On a hover device it is what the row declares, which
				// is little - the buttons show under the pointer and the fade dissolves the tail beneath them.
				// Without hover they are all on screen at all times, so the answer is the width of the box they
				// stand in. Measured once per shape - a row with a bell holds one button more than one without -
				// and reused for every row of that shape.
				const touchReserves = controlsAlwaysVisible() ? new Map() : null;

				// Every section scrolls in an area of the same kind, the block included, so one selector
				// reaches them all: without its own --kb-vw the highlight pill of a row falls back to the
				// width of its zero-width holder and the row hovers differently from section to section.
				const areas = [];
				for (const area of root.querySelectorAll('.tree-scroll')) {
					if (!(area instanceof HTMLElement)) {
						continue;
					}

					// One lane at the right is kept clear for the scroll bar. Where the bar is an overlay painted
					// over the content - a touch device - it would otherwise lie across the last tile, so the
					// pill, the fade and the row controls are all measured to end this much short of the
					// scrollport and the bar is left that strip to itself. Zero on a device whose bar takes its
					// own width beside the content, where `scrollbar-gutter` reserves the room instead.
					const lane = Number.parseFloat(getComputedStyle(area).getPropertyValue('--note-scroll-lane')) || 0;
					const visibleWidth = area.clientWidth - lane;

					// A collapsed section measures zero wide (less the lane). Publishing that would cap every
					// title and every line of prose inside it at nothing, so the section would open at the
					// height of text broken letter by letter.
					if (visibleWidth <= 0) {
						continue;
					}
					const areaRect = area.getBoundingClientRect();
					const rightLimit = areaRect.left + visibleWidth;
					const names = [];
					for (const name of area.querySelectorAll('[data-kb-name]')) {
						if (!(name instanceof HTMLElement)) {
							continue;
						}
						const rect = name.getBoundingClientRect();
						const row = name.closest('.tree-row, .collection-row, .favorite-row');
						const reserve = touchReserves === null ? Number.parseFloat(name.dataset.kbName) || 0 : this.measureControlsReserve(name, touchReserves);
						// One pixel of slack under the visible right edge. Capped exactly at the edge, the
						// row's content came out the width of the area to the pixel, and then rounding alone
						// decided whether the horizontal bar shows up - it appeared and vanished on a hair's
						// breadth of panel width. Overflow now comes only from the row's own floor (indent
						// plus the title slot), which is what makes deep levels reachable by panning.
						// Measured at the title's place in the list, not where the panning has carried it:
						// `rect.left` moves in by whatever the area is scrolled, so `+ scrollLeft` puts the
						// measurement back where the row sits. Without it the cap grew with every pixel panned,
						// the title widened as it was scrolled to and the row with it - the scrollable width
						// climbed in step with the scroll, so the end kept receding and, worse, the content
						// resized on every frame of the gesture. Resizing a scroller mid-scroll stalls momentum
						// in the iOS app WebView: the list froze under the finger. Fixed to its slot the title
						// ellipsises instead of unfurling as it is panned, and the width holds still.
						const edgeCap = Math.floor(rightLimit - reserve - rect.left - area.scrollLeft - 1);
						// The slot the row's own level was promised, which is the whole point of the row
						// standing wider than the area: a level deep enough to start past the visible edge got
						// an edge cap of nothing and wore its title down to one letter, with the room it was
						// promised sitting unused to the right of it and panning to it changing nothing. The
						// floor states that promise (`min-width`: indent plus the title slot), so it is read
						// off the row instead of counted here again, and the title's place inside the row -
						// `offsetLeft`, against the row it is positioned by, the same box the stretched link
						// answers to - is taken off it along with the room the controls keep at the end.
						// Both terms belong to the row rather than to the scrollport, so the cap holds still
						// while the list is panned, exactly as the one above it does.
						// The room the controls keep comes off the slot only where they lie over the title: on a
						// hover device they are out of the row's flow and hold to the visible edge, so the tail of
						// a title reaching the end of the row would run under them. Where they never leave they
						// stand in the flow after the title instead, and the row grows by their width - taking it
						// off the slot as well would charge the title for them twice.
						const floor = row instanceof HTMLElement ? Number.parseFloat(getComputedStyle(row).minWidth) || 0 : 0;
						const slotCap = Math.floor(floor - name.offsetLeft - (touchReserves === null ? reserve : 0));
						const cap = Math.max(16, slotCap, edgeCap);
						// The cap moves the right edge of the title and nothing else, so where the title
						// ends up is arithmetic on what has just been read - the mark needs no second walk
						// over the rows with the layout recomputed for it.
						const right = Math.min(rect.right, rect.left + cap) ;
						names.push({
							element: name,
							// The level hint belongs to document rows alone, so only those carry the mark.
							row: row instanceof HTMLElement && row.hasAttribute('data-tree-row') ? row : null,
							maxWidth: `${cap}px` ,
							isOff: right <= areaRect.left + 1 || rect.left >= rightLimit - 1
						});
					}
					areas.push({
						area,
						visibleWidth,
						// The strip the bar wants off the right edge - the width a classic bar reserves beside the
						// content, or the lane kept clear for an overlay one. The rows inside end before it; the
						// section headers above them run the full width, so a control in a header would stand
						// that much further right than the controls of every row under it unless it is inset by
						// the same amount. Measured as the box less the width just published, read back by the
						// header in the stylesheet.
						gutter: Math.max(0, area.offsetWidth - visibleWidth),
						names
					});
				}

				// Writes only, and only where the value actually moved: a title whose cap has not changed is
				// left alone rather than restyled every frame.
				for (const {
					area,
					visibleWidth,
					gutter,
					names
				} of areas) {
					const areaWidth = `${visibleWidth}px`;
					if (area.style.getPropertyValue('--kb-vw') !== areaWidth) {
						area.style.setProperty('--kb-vw', areaWidth);
					}
					const gutterWidth = `${gutter}px`;
					if (root.style.getPropertyValue('--note-area-gutter') !== gutterWidth) {
						root.style.setProperty('--note-area-gutter', gutterWidth);
					}
					for (const {
						element,
						row,
						maxWidth,
						isOff
					} of names) {
						if (element.style.maxWidth !== maxWidth) {
							element.style.maxWidth = maxWidth;
						}
						const mark = isOff ? '1' : '0';
						if (row instanceof HTMLElement && row.dataset.kbNameOff !== mark) {
							row.dataset.kbNameOff = mark;
						}
					}
				}
			},
			// How much of the panel each open section keeps. Flex alone cannot answer this: shrink is shared
			// out in proportion to how much a section HOLDS, so the longest list always wins and every other
			// section is squeezed to nothing - whichever section carries the outsized factor, the one across
			// from it is the one that loses. The share is fair instead: a section gets its content or an even
			// slice of the room, whichever is smaller, and what a short section does not need goes to the
			// others (largest-remainder fill, shortest section served first). Below SECTION_FLOOR_ROWS rows
			// nothing is served at all - the panel scrolls instead, which is what `.sidebar-sections` is for.
			// `hint` is what a branch opening or closing inside a section is about to add to it or take from it,
			// in pixels, before it has: a section only makes room for a branch in step with the branch if the
			// share it is heading for already counts what the branch will hold.
			refreshSectionFloors(root, hint = null) {
				const container = root.querySelector('.sidebar-sections');
				if (!(container instanceof HTMLElement)) {
					return;
				}

				// While a row is being dragged the shares stand still. A drag changes what the panel holds - a
				// branch opens under the pointer, a row is counted out of the branch it is leaving - and a share
				// published then carries no transition, so the section stepped 30px down the moment the row was
				// picked up and 30px back when it was dropped, both in a single frame. The layout the drop ends
				// in is published once the drag is over, through the same transition the sections open with.
				if (root.classList.contains('is-dragging')) {
					return;
				}
				const items = [];
				for (const section of root.querySelectorAll('.collection-list')) {
					const rows = section.querySelector('.tree-scroll__inner');
					if (!(section instanceof HTMLElement) || !(rows instanceof HTMLElement)) {
						continue;
					}

					// A section on its way out is counted out of the panel from the moment it starts leaving: the
					// room it still holds is room the others are about to get, and they may as well be on their way
					// into it while it empties. Counted by what it holds until it was gone, it handed the room over
					// in one step at the very end.
					if (section.dataset.expandLeaving) {
						continue;
					}

					// Measured from the row box, never from the area's own scrollHeight: that one reports the
					// height of the AREA once the area is the taller of the two, and a short list would hold
					// a band of empty space open under it. A line of prose - an empty section, a failed load -
					// sits beside the rows and is content of the section just the same.
					// Fractional heights, not `offsetHeight`: that one rounds, and a row box measured a
					// fraction short of what it holds leaves the area a pixel to scroll - a section with
					// nothing to scroll could be nudged up and down by it.
					let content = rows.getBoundingClientRect().height;
					for (const prose of section.querySelectorAll('.sidebar-muted--flow')) {
						content += prose instanceof HTMLElement ? prose.getBoundingClientRect().height : 0;
					}

					// The padding of the scrolling area belongs to the height the section needs. Without it a
					// list with room to spare still ended a few pixels short of its own contents, and a
					// section with nothing to scroll could be nudged up and down by exactly that much.
					const area = rows.closest('.tree-scroll');
					if (area instanceof HTMLElement) {
						const areaStyle = getComputedStyle(area);
						content += (Number.parseFloat(areaStyle.paddingTop) || 0) + (Number.parseFloat(areaStyle.paddingBottom) || 0);

						// The horizontal scrollbar stands INSIDE the area and takes its height off the room the rows
						// have - unlike the vertical one, whose width `scrollbar-gutter: stable` reserves whether it
						// is there or not. Counted out, a section was served exactly its content and the bar then ate
						// the last few pixels of it: every section with a title too long to fit ended up scrollable
						// down by the height of the bar, and a hover that nudged a row into view bounced it.
						content += area.offsetHeight - area.clientHeight;
					}
					const hinted = hint?.section === section && main_core.Type.isNumber(hint.growth);
					if (hinted) {
						content += hint.growth;
					}

					// A branch opening or closing inside the section was measured half-way there by any pass that
					// happened to run - a row rendered, a page of the list loaded - and the share the section was
					// already heading for was overwritten with one counted from a branch at no height at all. Then
					// the branch stood at its own height and the share came back in one step. While something in
					// there moves, the section keeps the share it was given when the motion started: it is the
					// share of the layout the motion ends in, which is where the section is on its way to anyway.
					const frozen = !hinted && section.querySelector('.is-expand-animating') !== null;
					items.push({
						section,
						frozen,
						content: frozen ? Number.parseFloat(section.style.getPropertyValue('--note-section-floor')) || content : Math.max(0, content)
					});
				}
				if (items.length === 0) {
					return;
				}

				// The room the lists share: the panel less its section headers, dividers and everything else in
				// the column. Fractional heights and rounded UP, both on purpose: `offsetHeight` rounds each
				// child to the nearest pixel, and half a pixel under-counted per child - eight of them in this
				// column - came back as a panel overflowing by a few pixels. Too little to see, enough to be
				// scrollable, and on a screen with a fractional pixel ratio there is such a remainder on every
				// row. Margins count too: the dividers carry them and the box does not, and flex items never
				// collapse margins, so summing them is exact.
				let fixed = 0;
				for (const child of container.children) {
					if (!(child instanceof HTMLElement) || child.classList.contains('collection-list')) {
						continue;
					}
					const style = getComputedStyle(child);
					fixed += child.getBoundingClientRect().height + (Number.parseFloat(style.marginTop) || 0) + (Number.parseFloat(style.marginBottom) || 0);
				}
				const style = getComputedStyle(container);
				fixed += (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);

				// Two pixels per section are spoken for below, where each share is rounded UP (one) and then
				// given a spare pixel (two). Left in the pot, they come back as a panel overflowing by a hair -
				// too little to see, enough to be scrollable, and it was scrollable by exactly one pixel.
				let remaining = Math.max(0, container.clientHeight - Math.ceil(fixed) - items.length * 2);
				let unserved = items.length;
				const minimum = SECTION_FLOOR_ROWS * SECTION_ROW_HEIGHT;
				for (const item of [...items].sort((a, b) => a.content - b.content)) {
					item.floor = Math.min(item.content, Math.max(remaining / unserved, minimum));
					remaining = Math.max(0, remaining - item.floor);
					unserved -= 1;
				}

				// Written in one go, after every read: the share of one section moves the others.
				for (const {
					section,
					floor,
					frozen
				} of items) {
					// Held at what it was given when the motion inside it started, and counted at that same
					// value above, so the sections around it are shared out against the room it really keeps.
					if (frozen) {
						continue;
					}

					// Inherited by the scrolling area inside, which carries the same floor. Rounded up and then
					// one pixel over: half a pixel short of the content is still something to scroll, and a
					// section with nothing to scroll that can be nudged up and down by a pixel reads as broken.
					// The spare pixel is under the last row, where nothing shows it.
					const value = floor > 0 ? Math.ceil(floor) + 1 : 0;
					const current = Number.parseFloat(section.style.getPropertyValue('--note-section-floor'));
					if (current === value || value === 0 && !Number.isFinite(current)) {
						continue;
					}

					// Nothing to serve is published as no share at all, not as a share of zero: the section is
					// sized by what it holds then, both at rest and while the panel is in motion, where the share
					// is the height itself and a zero would collapse a section whose content could not be
					// measured - one still loading, for instance.
					if (value === 0) {
						section.style.removeProperty('--note-section-floor');
						continue;
					}
					section.style.setProperty('--note-section-floor', `${value}px`);
				}
			},
			processSidebarScroll(target) {
				if (!target.isConnected) {
					return;
				}
				const offsetToBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
				// The next window of root collections belongs to the collections tree: the accessible-tree
				// area reaching its own end says nothing about it.
				if (offsetToBottom <= 64 && this.state.collectionsSectionExpanded && target.classList.contains('tree-scroll--collections')) {
					void this.actions.loadMoreCollections();
				}
				this.tryAutoLoadDocuments(target);
				this.tryAutoLoadShared(target);
				this.tryAutoLoadSharedChildren(target);
			},
			tryAutoLoadDocuments(container) {
				const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel:not([data-tree-namespace="shared"])');
				if (sentinels.length === 0) {
					return;
				}
				const containerRect = container.getBoundingClientRect();
				for (const sentinel of sentinels) {
					if (!(sentinel instanceof HTMLElement)) {
						continue;
					}
					const rect = sentinel.getBoundingClientRect();
					if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24) {
						continue;
					}
					const collectionId = Number(sentinel.dataset.collectionId);
					if (!Number.isFinite(collectionId) || collectionId <= 0) {
						continue;
					}
					const rawParentId = sentinel.dataset.parentId || '';
					const parentId = rawParentId === 'root' ? null : Number(rawParentId);
					if (rawParentId !== 'root' && (!Number.isFinite(parentId) || parentId <= 0)) {
						continue;
					}
					const hasNext = parentId === null ? this.state.hasRootNextPage(collectionId) : this.state.hasNextChildren(collectionId, parentId);
					if (!hasNext) {
						continue;
					}
					const isLoading = parentId === null ? this.state.isRootLoading(collectionId) : this.state.isLoadingChildren(collectionId, parentId);
					if (isLoading) {
						continue;
					}
					void this.actions.loadMoreChildren({
						collectionId,
						id: parentId
					});
					break;
				}
			},
			collectionDropClass(collection) {
				const target = this.state.collectionDropTarget;
				if (!target || Number(target.id) !== Number(collection.id)) {
					return '';
				}
				if (target.placement === 'before') {
					return 'is-drop-before';
				}
				if (this.actions.isCollectionExpanded(collection.id)) {
					return '';
				}
				return 'is-drop-after';
			},
			isCollectionDropAfterExpanded(collection) {
				const target = this.state.collectionDropTarget;
				if (!target || Number(target.id) !== Number(collection.id)) {
					return false;
				}
				return target.placement === 'after' && this.actions.isCollectionExpanded(collection.id);
			},
			onContentDragOver(event) {
				this.actions.onSidebarFileDragOver(event);
				this.actions.onCollectionViewportDragOver(event);
				this.actions.onDocViewportDragOver(event);
			},
			onContentDrop(event) {
				this.stopDragAutoScroll();
				// Unconditional: a drop on background/between rows must not leave fileDragItem stuck.
				this.actions.clearFileDrag();
				this.actions.onCollectionViewportDrop(event);
				this.actions.onDocViewportDrop(event);
			},
			isAnyDragActive() {
				return Boolean(this.state.docDragItem) || Boolean(this.state.collectionDragItem) || Boolean(this.state.fileDragItem)
				// [P3] A row of the favorites block is dragged inside the block, whose list scrolls on
				// its own - without this the auto-scroll never starts and a row cannot be carried past
				// the visible part of the block.
				|| Boolean(this.state.favorites.dragItem);
			},
			isFileDropInsideCollection(collection) {
				const target = this.state.fileDropTarget;
				return Boolean(target && Number(target.collectionId) === Number(collection.id) && target.parentId === null);
			},
			onDragOverCapture(event) {
				if (this.dispatchingSyntheticDragOver) {
					return;
				}
				if (!this.isAnyDragActive()) {
					this.stopDragAutoScroll();
					return;
				}
				this.dragLastClientX = event.clientX;
				this.dragLastClientY = event.clientY;
				this.updateDragAutoScrollSpeed();
			},
			onScrollDuringDrag() {
				if (!this.isAnyDragActive()) {
					return;
				}
				if (typeof this.actions.invalidateDndRectCache === 'function') {
					this.actions.invalidateDndRectCache();
				}
			},
			// The scroller is no longer the panel but the tree area the pointer is over. Past its bottom
			// edge - over "Archive", say - there is nothing under the pointer to resolve, and the tree the
			// drag is heading out of is the one that has to keep scrolling.
			getDragScrollContainer() {
				const root = this.$el;
				if (!(root instanceof HTMLElement)) {
					return null;
				}

				// A row of the block never leaves the block, so the block's own list is the only scroller
				// then: scrolling the tree of knowledge bases underneath would move a surface the drag
				// cannot drop on anyway.
				if (this.state.favorites.dragItem) {
					const list = root.querySelector('.tree-scroll--favorites');
					return list instanceof HTMLElement ? list : null;
				}
				const under = document.elementFromPoint(this.dragLastClientX, this.dragLastClientY);
				const area = under instanceof Element ? under.closest('.tree-scroll') : null;
				if (area instanceof HTMLElement && root.contains(area)) {
					return area;
				}
				const collections = root.querySelector('.tree-scroll--collections');
				return collections instanceof HTMLElement ? collections : null;
			},
			updateDragAutoScrollSpeed() {
				const content = this.getDragScrollContainer();
				if (!content) {
					return;
				}
				const rect = content.getBoundingClientRect();
				const EDGE = 56;
				const MAX_SPEED = 2;
				let speed = 0;
				if (this.dragLastClientY < rect.top + EDGE && content.scrollTop > 0) {
					const ratio = Math.min(1, (rect.top + EDGE - this.dragLastClientY) / EDGE);
					speed = -Math.max(1, Math.ceil(ratio * MAX_SPEED));
				} else if (this.dragLastClientY > rect.bottom - EDGE && content.scrollTop + content.clientHeight < content.scrollHeight) {
					const ratio = Math.min(1, (this.dragLastClientY - (rect.bottom - EDGE)) / EDGE);
					speed = Math.max(1, Math.ceil(ratio * MAX_SPEED));
				}
				this.dragAutoScrollSpeed = speed;
				if (speed !== 0) {
					this.runDragAutoScrollFrame();
				}
			},
			runDragAutoScrollFrame() {
				if (this.dragAutoScrollRaf !== 0) {
					return;
				}
				this.dragAutoScrollRaf = requestAnimationFrame(() => {
					this.dragAutoScrollRaf = 0;
					if (!this.isAnyDragActive() || this.dragAutoScrollSpeed === 0) {
						return;
					}
					const content = this.getDragScrollContainer();
					if (!content) {
						return;
					}
					const before = content.scrollTop;
					content.scrollTop = before + this.dragAutoScrollSpeed;
					if (content.scrollTop !== before) {
						this.refireDragOverAtLastPos();
					}
					this.updateDragAutoScrollSpeed();
				});
			},
			refireDragOverAtLastPos() {
				const el = document.elementFromPoint(this.dragLastClientX, this.dragLastClientY);
				if (!el) {
					return;
				}
				const evt = new DragEvent('dragover', {
					bubbles: true,
					cancelable: true,
					clientX: this.dragLastClientX,
					clientY: this.dragLastClientY
				});
				this.dispatchingSyntheticDragOver = true;
				try {
					el.dispatchEvent(evt);
				} finally {
					this.dispatchingSyntheticDragOver = false;
				}
			},
			stopDragAutoScroll() {
				this.dragAutoScrollSpeed = 0;
				if (this.dragAutoScrollRaf !== 0) {
					cancelAnimationFrame(this.dragAutoScrollRaf);
					this.dragAutoScrollRaf = 0;
				}
			},
			onCollectionRowDragOver(collection, event) {
				if (event.dataTransfer?.types?.includes('Files')) {
					event.preventDefault();
					this.actions.onFileDragOverCollection(collection);
					return;
				}
				if (this.state.docDragItem) {
					this.actions.onDocCollectionDragOver(collection, event);
					return;
				}
				this.actions.onCollectionDragOver(collection, event);
			},
			async onCollectionRowDrop(collection, event) {
				if (event.dataTransfer?.types?.includes('Files')) {
					event.preventDefault();
					await this.actions.onFileDropOnCollection(collection, event);
					return;
				}
				if (this.state.docDragItem) {
					this.actions.onDocCollectionDrop(collection, event);
					return;
				}
				this.actions.onCollectionDrop(collection, event);
			},
			onRootBranchDragEnter(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragEnter({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onRootBranchDragOver(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragOver({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onRootBranchDrop(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDrop({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onNestedBranchDragEnter(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragEnter(payload);
			},
			onNestedBranchDragOver(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragOver(payload);
			},
			onNestedBranchDrop(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDrop(payload);
			},
			isDocDropInsideCollection(collection) {
				const target = this.state.docDropTarget;
				if (!target) {
					return false;
				}
				return target.placement === 'inside' && Number(target.collectionId) === Number(collection.id) && (target.targetId === null || target.targetId === undefined);
			},
			canEditCollection(collection) {
				return this.actions.canEditCollection(collection);
			},
			getCollectionTitle(collection) {
				const title = String(collection?.name ?? '').trim();
				return title === '' ? null : title;
			},
			onCollectionDragStart(collection, event) {
				if (!this.canEditCollection(collection)) {
					event.preventDefault();
					return;
				}
				this.actions.startCollectionDrag(collection, event);
			},
			isRenamingCollection(collection) {
				return this.state.renamingCollectionId === Number(collection.id);
			},
			onRenameCollectionKeyEnter(event) {
				event.target.blur();
			},
			onRenameCollectionKeyEscape(collection) {
				this.renameCollectionCancelled = true;
				const input = this.$refs[`renameCollectionInput-${collection.id}`];
				const el = Array.isArray(input) ? input[0] : input;
				if (el) {
					el.blur();
				}
			},
			onRenameCollectionBlur(collection, event) {
				if (this.renameCollectionCancelled) {
					this.actions.cancelRenameCollection();
					return;
				}
				const value = event.target.value.trim();
				if (!value) {
					this.actions.cancelRenameCollection();
					return;
				}
				this.actions.confirmRenameCollection(Number(collection.id), value);
			},
			onCollectionPlateClick(collection) {
				const id = Number(collection?.id);
				if (!Number.isInteger(id) || id <= 0) {
					return;
				}
				const isExpanded = typeof this.actions.isCollectionExpanded === 'function' ? Boolean(this.actions.isCollectionExpanded(id)) : false;
				const isCurrent = Number(this.state.selectedCollectionId) === id && !this.state.selectedDocId;
				if (isCurrent || !isExpanded) {
					this.actions.toggleCollectionExpanded(collection);
				}
				note_analytics.NoteAnalytics.collectionViewed('side_menu');
				this.actions.openCollection(collection);
				if (typeof this.actions.navigateToWorkspace === 'function') {
					this.actions.navigateToWorkspace(id);
				}
			},
			collectionHref(collection) {
				const id = Number(collection?.id);
				return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
			},
			onCollectionTitleClick(collection, event) {
				if (this.isRenamingCollection(collection)) {
					return;
				}
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.onCollectionPlateClick(collection);
			},
			rootDocsFor(collection) {
				return this.state.getRootDocs(Number(collection?.id));
			},
			onToggleSharedSection() {
				void this.actions.toggleSharedSection();
			},
			sharedRootDocsFor(container) {
				return this.state.getSharedRootDocs(Number(container?.collectionId));
			},
			// Global flat pagination of the accessible tree: pull the next page when the section
			// sentinel scrolls into view (the section can sit above the collections list, so the
			// bottom-of-scroll trigger used for collections would never reach it).
			tryAutoLoadShared(container) {
				if (!this.state.sharedTreeEnabled || !this.state.sharedSectionExpanded || !this.state.sharedHasNextPage || this.state.sharedLoading) {
					return;
				}
				const sentinel = container.querySelector('.js-shared-load-more-sentinel');
				if (!(sentinel instanceof HTMLElement)) {
					return;
				}
				const containerRect = container.getBoundingClientRect();
				const rect = sentinel.getBoundingClientRect();
				if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24) {
					return;
				}
				void this.actions.loadMoreSharedTree();
			},
			syncSharedSentinelObserver() {
				const observer = this.sharedSentinelObserver;
				if (!observer) {
					return;
				}

				// updated() runs on every render of a busy sidebar; skip the DOM query outright whenever
				// the sentinel provably cannot be there.
				const content = this.$refs.sidebarContent;
				const mayExist = content && this.state.sharedTreeEnabled && this.state.sharedHasNextPage;
				const sentinel = mayExist ? content.querySelector('.js-shared-load-more-sentinel') : null;
				if (sentinel === this.observedSharedSentinel) {
					return;
				}
				if (this.observedSharedSentinel) {
					observer.unobserve(this.observedSharedSentinel);
				}
				this.observedSharedSentinel = sentinel instanceof HTMLElement ? sentinel : null;
				if (this.observedSharedSentinel) {
					observer.observe(this.observedSharedSentinel);
				} else {
					this.sharedSentinelVisible = false;
				}
			},
			// Keeps paging the section while its sentinel stays on screen and nothing showable has
			// arrived yet. One request at a time, and it stops the moment the section shows something,
			// runs out of cursor, gets collapsed, or is scrolled out of view — so an empty section
			// reaches its first visible branch without ever putting a burst on the wire.
			async pumpSharedSection() {
				if (this.sharedPumpRunning) {
					return;
				}
				this.sharedPumpRunning = true;
				try {
					while (this.sharedSentinelVisible && this.state.sharedTreeEnabled && this.state.sharedSectionExpanded && this.state.sharedHasNextPage && this.state.sharedContainers.length === 0) {
						const cursorBefore = this.state.sharedCursor;
						// eslint-disable-next-line no-await-in-loop
						await this.actions.loadMoreSharedTree();
						// eslint-disable-next-line no-await-in-loop
						await this.$nextTick();
						this.syncSharedSentinelObserver();

						// No movement means the call declined to run — a load was already in flight. Its
						// completion re-arms the pump through the sharedLoading watcher; spinning here
						// would just burn frames.
						if (this.state.sharedCursor === cursorBefore) {
							break;
						}
					}
				} finally {
					this.sharedPumpRunning = false;
				}
			},
			// Per-branch pagination inside the accessible tree. Root branches paginate through the
			// section sentinel above, so only nested (data-parent-id numeric) sentinels are handled.
			tryAutoLoadSharedChildren(container) {
				if (!this.state.sharedTreeEnabled || !this.state.sharedSectionExpanded) {
					return;
				}
				const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel[data-tree-namespace="shared"]');
				if (sentinels.length === 0) {
					return;
				}
				const containerRect = container.getBoundingClientRect();
				for (const sentinel of sentinels) {
					if (!(sentinel instanceof HTMLElement)) {
						continue;
					}
					const rect = sentinel.getBoundingClientRect();
					if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24) {
						continue;
					}
					const collectionId = Number(sentinel.dataset.collectionId);
					const parentId = Number(sentinel.dataset.parentId);
					if (!Number.isFinite(collectionId) || collectionId <= 0 || !Number.isFinite(parentId) || parentId <= 0) {
						continue;
					}
					if (!this.state.hasNextSharedChildren(collectionId, parentId) || this.state.isSharedChildrenLoading(collectionId, parentId)) {
						continue;
					}
					void this.actions.loadMoreSharedChildren({
						collectionId,
						id: parentId
					});
					break;
				}
			}
		},
		template: `
		<aside
			class="sidebar"
			:class="{ 'is-collapsed': state.sidebarCollapsed, 'is-dragging': isAnyDragActive() }"
			:style="{ '--note-sidebar-width': \`\${state.sidebarEffectiveWidth}px\` }"
		>
			<SidebarRail
				v-if="state.sidebarCollapsed"
				:state="state"
				:actions="actions"
				:messages="messages"
				@expand="onRailExpand"
			/>
			<SidebarSearchRow
				ref="searchRow"
				:state="state"
				:actions="actions"
				@navigate-document="onSearchNavigateDocument"
				@navigate-search="onSearchNavigateSearch"
			/>
			<div
				class="sidebar-layout"
				@dragenter="actions.onSidebarFileDragEnter($event)"
				@dragleave="actions.onSidebarFileDragLeave($event)"
				@dragover="onContentDragOver($event)"
				@drop="onContentDrop($event)"
			>
				<div
					class="sidebar-content"
					ref="sidebarContent"
				>
					<div class="sidebar-sections">
						<FavoritesSection
							:state="state"
							:actions="actions"
							:messages="messages"
							:selected-doc-id="state.selectedDocId"
							:selected-collection-id="state.selectedCollectionId"
							:is-document-favorite="isDocumentFavorite"
							:toggle-document-favorite="toggleDocumentFavorite"
							@open="onOpenFavorite"
						/>
						<template v-if="state.sharedTreeEnabled">
							<button
								type="button"
								class="sidebar-section-header"
								:title="state.sharedSectionExpanded ? messages.collapseShared : messages.expandShared"
								:aria-expanded="String(state.sharedSectionExpanded)"
								data-testid="note-sidebar-shared-section"
								@click="onToggleSharedSection()"
							>
								<span class="sidebar-section-header__icon sidebar-section-header__icon--shared" aria-hidden="true">
									<BIcon name="o-forward" :size="22" color="var(--ui-color-accent-main-primary)" />
								</span>
								<span class="sidebar-section-header__title">{{ messages.sharedWithMe }}</span>
							</button>
							<ExpandTransition :loading="state.sharedLoading && !state.sharedContainers.length">
							<div
								v-if="state.sharedSectionExpanded"
								class="collection-list shared-list"
							>
							<div class="tree-scroll tree-scroll--shared" @scroll.passive="onTreeAreaScroll">
							<div
								v-if="isSharedEmpty"
								class="sidebar-muted sidebar-muted--flow"
							>{{ messages.emptyShared }}</div>
							<div class="tree-scroll__inner">
								<div v-if="state.sharedLoading && !state.sharedContainers.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
								<div v-if="state.sharedContainers.length">
									<div
										v-for="container in state.sharedContainers"
										:key="container.collectionId"
									>
										<div
											class="collection-row is-shared-group"
											@click="actions.toggleSharedContainer(container.collectionId)"
										>
										<span class="collection-row__pill" aria-hidden="true"><span class="collection-row__pill-fill"></span></span>
											<span class="collection-link" :title="container.title">
												<button
													type="button"
													class="collection-disclosure"
													:class="{ 'is-expanded': state.isSharedContainerExpanded(container.collectionId) }"
													:title="state.isSharedContainerExpanded(container.collectionId) ? messages.collapseSharedContainer : messages.expandSharedContainer"
													:aria-expanded="state.isSharedContainerExpanded(container.collectionId)"
													@click.stop="actions.toggleSharedContainer(container.collectionId)"
												>
													<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
												</button>
												<span class="collection-row__icon note-collection-glyph" aria-hidden="true"></span>
												<span class="collection-title">{{ container.title }}</span>
											</span>
										</div>
										<ExpandTransition>
										<div v-if="state.isSharedContainerExpanded(container.collectionId)" class="collection-tree">
											<ul class="tree-branch">
												<tree-node
													v-for="doc in sharedRootDocsFor(container)"
													:key="doc.id"
													:doc="doc"
													:level="1"
													:selected-doc-id="state.selectedDocId"
													:expanded-docs="state.expandedDocs"
													:get-children="state.getSharedChildren"
													:is-loading-children="state.isSharedChildrenLoading"
													:has-next-children="state.hasNextSharedChildren"
													:can-edit-document="actions.canEditSharedDocument"
													:can-manage-document="actions.canManageSharedDocument"
													:is-document-favorite="isDocumentFavorite"
													:toggle-document-favorite="toggleDocumentFavorite"
													:messages="messages"
													tree-namespace="shared"
													@toggle="actions.toggleSharedDoc"
													@open="actions.openDocumentFromTree"
													@prefetch-children="actions.prefetchSharedDocumentChildren"
													@load-more="actions.loadMoreSharedChildren"
												/>
											</ul>
										</div>
										</ExpandTransition>
									</div>
								</div>
								<div
									v-if="state.sharedHasNextPage"
									class="doc-load-more-sentinel js-shared-load-more-sentinel"
									aria-hidden="true"
								/>
							</div>
							</div>
							</div>
							</ExpandTransition>
						</template>
						<button
							v-else
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedSharedView }"
							data-testid="note-sidebar-shared"
							@click="actions.navigateToShared()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-forward" :size="22" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.sharedWithMe }}</span>
						</button>
						<div class="sidebar-section-divider" aria-hidden="true"></div>
						<button
							type="button"
							class="sidebar-section-header"
							:title="state.collectionsSectionExpanded ? messages.collapseCollections : messages.expandCollections"
							:aria-expanded="String(state.collectionsSectionExpanded)"
							data-testid="note-sidebar-collections-section"
							@click="actions.toggleCollectionsSection()"
						>
							<span class="sidebar-section-header__icon note-collection-glyph" aria-hidden="true"></span>
							<span class="sidebar-section-header__title">{{ messages.collections }}</span>
						</button>
						<ExpandTransition :loading="displayedLoading && !displayedCollections.length">
						<div
							v-if="state.collectionsSectionExpanded"
							class="collection-list"
							@dragover="actions.onCollectionListDragOver($event)"
							@drop="actions.onCollectionListDrop($event)"
						>
						<div class="tree-scroll tree-scroll--collections" @scroll.passive="onTreeAreaScroll">
						<div
							v-if="isCollectionsEmpty"
							class="sidebar-muted sidebar-muted--flow"
						>{{ messages.emptyCollections }}</div>
						<div class="tree-scroll__inner">
							<div v-if="displayedLoading && !displayedCollections.length" class="sidebar-muted">
								<SidebarLoader :level="0" />
							</div>
							<div v-else>
								<!-- Move-only group: a knowledge base dragged to another place travels there, the
										 same as a document row and a row of the favorites block. -->
								<TransitionGroup name="sidebar-row">
								<div
									v-for="collection in displayedCollections"
									:key="collection.id"
									:class="{ 'is-collection-drop-after': isCollectionDropAfterExpanded(collection) }"
								>
									<div
										class="collection-row"
										:data-collection-id="collection.id"
										:class="[
										{ 'is-active': state.selectedCollectionId === Number(collection.id) && !state.selectedDocId },
										collectionDropClass(collection),
										{ 'is-drop-inside': isDocDropInsideCollection(collection) || isFileDropInsideCollection(collection) },
										{ 'is-drag-source': state.collectionDragItem && state.collectionDragItem.id === Number(collection.id) },
										{ 'has-actions': canEditCollection(collection) && !isRenamingCollection(collection) }
										]"
										:draggable="canEditCollection(collection)"
										@mouseenter="actions.prefetchCollectionChildren(collection)"
										@dragstart="onCollectionDragStart(collection, $event)"
										@dragover="onCollectionRowDragOver(collection, $event)"
										@drop="onCollectionRowDrop(collection, $event)"
										@dragend="actions.endCollectionDrag"
									>
									<span class="collection-row__pill" aria-hidden="true"><span class="collection-row__pill-fill"></span></span>
									<span
										class="collection-link"
										:title="isRenamingCollection(collection) ? null : getCollectionTitle(collection)"
									>
										<button
											v-if="!isRenamingCollection(collection)"
											type="button"
											class="collection-disclosure"
											:class="{ 'is-expanded': actions.isCollectionExpanded(collection.id) }"
											:aria-label="actions.isCollectionExpanded(collection.id) ? messages.collapseSharedContainer : messages.expandSharedContainer"
											:aria-expanded="String(actions.isCollectionExpanded(collection.id))"
											@click.stop="actions.toggleCollectionExpanded(collection)"
										>
											<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
										</button>
										<span class="collection-row__icon note-collection-glyph" aria-hidden="true"></span>
										<input
											v-if="isRenamingCollection(collection)"
											class="collection-title-input"
											type="text"
											:value="collection.name"
											@keydown.enter="onRenameCollectionKeyEnter($event)"
											@keydown.escape="onRenameCollectionKeyEscape(collection)"
											@blur="onRenameCollectionBlur(collection, $event)"
											@click.stop
											:ref="'renameCollectionInput-' + collection.id"
										/>
										<a
											v-else
											class="collection-title collection-title-link"
											:data-kb-name="collectionNameReserve(collection)"
											:href="collectionHref(collection)"
											draggable="false"
											@click="onCollectionTitleClick(collection, $event)"
										>{{ collection.name }}</a>
									</span>
									<div v-if="!isRenamingCollection(collection)" class="collection-actions-anchor">
									<div class="collection-actions">
										<button
											v-if="canEditCollection(collection)"
											class="row-action-btn"
											type="button"
											:title="messages.createDocument"
											:aria-label="messages.createDocument"
											@click.stop="actions.createDocumentForCollection(collection)"
										>
											<BIcon name="plus-l" :size="20" />
										</button>
										<button
											class="row-action-btn row-action-btn--favorite"
											:class="{ 'is-on': isCollectionFavorite(collection) }"
											type="button"
											:title="collectionFavoriteLabel(collection)"
											:aria-label="collectionFavoriteLabel(collection)"
											:aria-pressed="isCollectionFavorite(collection).toString()"
											@click="onToggleCollectionFavorite(collection, $event)"
										>
											<BIcon :name="isCollectionFavorite(collection) ? 's-favorite' : 'o-favorite'" :size="16" />
										</button>
									</div>
									</div>
									</div>
									<ExpandTransition :loading="state.isRootLoading(collection.id)">
									<div
										v-if="actions.isCollectionExpanded(collection.id)"
										class="collection-tree"
									>
										<ul
											class="tree-branch"
											@dragenter="onRootBranchDragEnter(collection, $event)"
											@dragover.stop="onRootBranchDragOver(collection, $event)"
											@drop.stop="onRootBranchDrop(collection, $event)"
										>
											<!-- Move-only group: see the branch of TreeNode. -->
											<TransitionGroup name="sidebar-row">
											<tree-node
												v-for="doc in rootDocsFor(collection)"
												:key="doc.id"
												:doc="doc"
												:level="1"
												:selected-doc-id="state.selectedDocId"
												:expanded-docs="state.expandedDocs"
												:get-children="childrenGetter"
												:is-loading-children="state.isLoadingChildren"
												:has-next-children="state.hasNextChildren"
												:can-edit-document="actions.canEditDocument"
												:can-manage-document="actions.canManageDocument"
												:is-document-favorite="isDocumentFavorite"
												:toggle-document-favorite="toggleDocumentFavorite"
												:messages="messages"
												:doc-drag-item="state.docDragItem"
												:doc-drop-target="state.docDropTarget"
												:file-drop-target="state.fileDropTarget"
												:renaming-doc-id="state.renamingDocId"
												@toggle="actions.toggleDoc"
												@open="actions.openDocumentFromTree"
												@prefetch-children="actions.prefetchDocumentChildren"
												@load-more="actions.loadMoreChildren"
												@create-child="actions.createChildDocument"
												@rename-doc="actions.renameDocument"
												@delete-doc="actions.deleteDocument"
												@start-drag="actions.startDocDrag($event.doc, $event.nativeEvent)"
												@branch-drag-enter="onNestedBranchDragEnter($event)"
												@branch-drag-over="onNestedBranchDragOver($event)"
												@branch-drop="onNestedBranchDrop($event)"
												@end-drag="actions.endDocDrag"
												@confirm-rename-doc="actions.confirmRenameDocument($event.doc.id, $event.title, $event.doc.collectionId)"
												@cancel-rename-doc="actions.cancelRenameDocument()"
												@file-drag-over="actions.onFileDragOverDocument($event.doc)"
												@file-drop="actions.onFileDropOnDocument($event.doc, $event.nativeEvent)"
											/>
											</TransitionGroup>
											<li v-if="state.isRootLoading(collection.id)" class="sidebar-muted">
												<SidebarLoader :level="1" />
											</li>
											<li
												v-if="state.hasRootNextPage(collection.id)"
												class="doc-load-more-sentinel js-doc-load-more-sentinel"
												:data-collection-id="collection.id"
												data-parent-id="root"
												aria-hidden="true"
											/>
										</ul>
									</div>
									</ExpandTransition>
								</div>
								</TransitionGroup>
								<div v-if="displayedLoading && displayedCollections.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
							</div>
						</div>
						</div>
						</div>
						</ExpandTransition>
				</div>
				</div>
			</div>
			<!-- "Archive" and "Recycle bin" stand together right above the footer, outside the scrolling
				 sections: pinned to the bottom edge of the sections, "Archive" left a band of empty panel
				 between itself and "Recycle bin" whenever the lists were shorter than the panel. On a phone
				 they are icons in the footer instead - see SidebarFooter - where they cost no rows. -->
			<div v-if="!state.isMobile" class="sidebar-pinned">
				<div class="sidebar-section-divider" aria-hidden="true"></div>
				<button
					type="button"
					class="sidebar-fixed-row"
					:class="{ 'is-active': state.selectedArchiveView }"
					:title="messages.archive"
					data-testid="note-sidebar-archive"
					@click="actions.navigateToArchive()"
				>
					<BIcon class="sidebar-fixed-row__icon" name="o-box-with-lid" :size="22" color="var(--ui-color-accent-main-primary)" />
					<span class="sidebar-fixed-row__title">{{ messages.archive }}</span>
				</button>
				<button
					type="button"
					class="sidebar-fixed-row"
					:class="{ 'is-active': state.selectedRecycleBinView }"
					:title="messages.recycleBin"
					data-testid="note-sidebar-recyclebin"
					@click="actions.navigateToRecycleBin()"
				>
					<BIcon class="sidebar-fixed-row__icon" name="o-trashcan" :size="22" color="var(--ui-color-accent-main-primary)" />
					<span class="sidebar-fixed-row__title">{{ messages.recycleBin }}</span>
				</button>
			</div>
			<SidebarFooter
				:state="state"
				:actions="actions"
				:theme-actions="themeActions"
				@toggle-collapsed="onToggleSidebarCollapsed"
			/>
			<!-- The pointer being over the handle is published on the body, because the line it lights up
					 runs higher than this panel: the header draws its own half of the same boundary and cannot
					 be reached from inside here by a selector. -->
			<div
				v-if="!state.sidebarCollapsed"
				class="sidebar-resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				@mousedown="onSidebarResizeStart"
				@mouseenter="onSidebarResizeHover(true)"
				@mouseleave="onSidebarResizeHover(false)"
			></div>
		</aside>
	`
	};

	function createInlineEditActions({
		collectionUseCases,
		documentUseCases
	}) {
		return {
			confirmRenameCollection: (id, name) => collectionUseCases.confirmRenameCollection(id, name),
			cancelRenameCollection: () => collectionUseCases.cancelRenameCollection(),
			confirmRenameDocument: (id, title, collectionId) => {
				return documentUseCases.confirmRenameDocument(id, title, collectionId);
			},
			cancelRenameDocument: () => documentUseCases.cancelRenameDocument()
		};
	}
	function createDndActions({
		collectionDndService,
		documentDndService,
		favoriteDndService
	}) {
		return {
			startFavoriteDrag: (row, event) => favoriteDndService.startDrag(row, event),
			onFavoriteListDragOver: event => favoriteDndService.onListDragOver(event),
			onFavoriteListDrop: event => favoriteDndService.onListDrop(event),
			endFavoriteDrag: () => favoriteDndService.endDrag(),
			startCollectionDrag: (collection, event) => collectionDndService.startDrag(collection, event),
			onCollectionDragOver: (collection, event) => collectionDndService.onDragOver(collection, event),
			onCollectionDrop: async (collection, event) => collectionDndService.onDrop(collection, event),
			onCollectionListDragOver: event => collectionDndService.onListDragOver(event),
			onCollectionListDrop: async event => collectionDndService.onListDrop(event),
			onCollectionViewportDragOver: event => collectionDndService.onViewportDragOver(event),
			onCollectionViewportDrop: async event => collectionDndService.onViewportDrop(event),
			endCollectionDrag: () => collectionDndService.endDrag(),
			startDocDrag: (doc, event) => documentDndService.startDrag(doc, event),
			onDocBranchDragEnter: payload => documentDndService.onBranchDragEnter(payload),
			onDocBranchDragOver: payload => documentDndService.onBranchDragOver(payload),
			onDocBranchDrop: async payload => documentDndService.onBranchDrop(payload),
			onDocCollectionDragOver: (collection, event) => documentDndService.onCollectionDragOver(collection, event),
			onDocCollectionDrop: async (collection, event) => documentDndService.onCollectionDrop(collection, event),
			onDocViewportDragOver: event => documentDndService.onViewportDragOver(event),
			onDocViewportDrop: async event => documentDndService.onViewportDrop(event),
			endDocDrag: () => documentDndService.clearDrag(),
			invalidateDndRectCache: () => {
				collectionDndService.invalidateDragRectCache();
				documentDndService.invalidateDragRectCache();
				favoriteDndService.invalidateDragRectCache();
			}
		};
	}
	function createFileDropActions({
		fileDropService
	}) {
		return {
			onSidebarFileDragEnter: event => fileDropService.onSidebarDragEnter(event),
			onSidebarFileDragOver: event => fileDropService.onSidebarDragOver(event),
			onSidebarFileDragLeave: event => fileDropService.onSidebarDragLeave(event),
			clearFileDrag: () => fileDropService.clearFileDrag(),
			onFileDragOverCollection: collection => fileDropService.resolveCollectionTarget(collection),
			onFileDropOnCollection: async (collection, event) => fileDropService.handleCollectionDrop(collection, event.dataTransfer.files),
			onFileDragOverDocument: doc => fileDropService.resolveDocumentTarget(doc),
			onFileDropOnDocument: async (doc, event) => fileDropService.handleDocumentDrop(doc, event.dataTransfer.files)
		};
	}
	function createSidebarActions({
		collectionUseCases,
		documentUseCases,
		collectionDndService,
		documentDndService,
		favoriteDndService,
		fileDropService,
		messages,
		router,
		routeNames = {},
		setSidebarWidth = () => {},
		saveSidebarWidth = () => {},
		setSidebarMinWidth = () => {},
		setSidebarCollapsed = () => {},
		toggleSidebarCollapsed = () => false,
		saveSidebarState = () => {},
		setAiChatOpen = () => false,
		suppressSelectionScrollOnce = () => {},
		favoriteActions = {}
	}) {
		return {
			// [TPL-02] The favorites block and all three stars go through the store, nothing else.
			...favoriteActions,
			canEditCollection: collection => collectionUseCases.canEditCollection(collection),
			canManageCollectionPermissions: collection => collectionUseCases.canManageCollectionPermissions(collection),
			canEditDocument: doc => documentUseCases.canEditDocument(doc),
			canManageDocument: doc => documentUseCases.canManageDocument(doc),
			openCollection: async collection => collectionUseCases.openCollection(collection),
			prefetchCollectionChildren: async collection => collectionUseCases.prefetchCollectionChildren(collection),
			isCollectionExpanded: collectionId => collectionUseCases.isCollectionExpanded(collectionId),
			toggleCollectionExpanded: async collection => collectionUseCases.toggleCollectionExpanded(collection),
			// Remembered the same way the width and the collapsed panel are: one write per press.
			toggleCollectionsSection: () => {
				collectionUseCases.toggleCollectionsSection();
				saveSidebarState();
			},
			toggleSharedSection: () => documentUseCases.toggleSharedSection(),
			ensureSharedLoaded: () => documentUseCases.ensureSharedLoaded(),
			loadMoreSharedTree: () => documentUseCases.loadMoreSharedTree(),
			toggleSharedDoc: doc => documentUseCases.toggleSharedDoc(doc),
			toggleSharedContainer: collectionId => documentUseCases.toggleSharedContainer(collectionId),
			prefetchSharedDocumentChildren: doc => documentUseCases.prefetchSharedDocumentChildren(doc),
			loadMoreSharedChildren: async doc => documentUseCases.loadMoreSharedChildren(doc),
			// Accessible-tree section forces DnD off; editing keeps its own per-doc gate.
			canManageSharedDocument: () => false,
			canEditSharedDocument: doc => documentUseCases.canEditDocument(doc),
			loadMoreCollections: async () => collectionUseCases.loadMoreCollections(),
			refreshCollections: async () => collectionUseCases.refreshCollections(),
			openDocument: async doc => documentUseCases.openDocument(doc),
			// Same navigation, minus the reveal: the row the user clicked is in frame already.
			openDocumentFromTree: async doc => {
				suppressSelectionScrollOnce();
				return documentUseCases.openDocument(doc);
			},
			prefetchDocumentChildren: async doc => documentUseCases.prefetchDocumentChildren(doc),
			toggleDoc: async doc => documentUseCases.toggleDoc(doc),
			loadMoreChildren: async doc => documentUseCases.loadMoreChildren(doc),
			createCollection: async () => collectionUseCases.createCollection(),
			createDocument: async () => documentUseCases.createDocument(),
			createDocumentFromSidebar: async () => documentUseCases.createDocumentFromSidebar(),
			createDocumentForCollection: async collection => documentUseCases.createDocumentForCollection(collection),
			createChildDocument: async doc => documentUseCases.createChildDocument(doc),
			renameCollection: async collection => collectionUseCases.renameCollection(collection),
			deleteCollection: async collection => collectionUseCases.deleteCollection(collection),
			renameDocument: async doc => documentUseCases.renameDocument(doc),
			deleteDocument: async doc => documentUseCases.deleteDocument(doc),
			archiveDocument: async doc => documentUseCases.archiveDocument(doc),
			restoreDocument: async doc => documentUseCases.restoreDocument(doc),
			...createDndActions({
				collectionDndService,
				documentDndService,
				favoriteDndService
			}),
			...createFileDropActions({
				fileDropService
			}),
			...createInlineEditActions({
				collectionUseCases,
				documentUseCases
			}),
			setSidebarWidth: width => setSidebarWidth(width),
			saveSidebarWidth: width => saveSidebarWidth(width),
			setSidebarMinWidth: minWidth => setSidebarMinWidth(minWidth),
			setSidebarCollapsed: collapsed => setSidebarCollapsed(collapsed),
			toggleSidebarCollapsed: () => toggleSidebarCollapsed(),
			saveSidebarState: payload => saveSidebarState(payload),
			// [ALG-01] The only way the shell flips the rail panel state — mutation goes through
			// actions everywhere in the module.
			setAiChatOpen: open => setAiChatOpen(open),
			navigateToSearch: query => {
				if (router && routeNames.search) {
					router.push({
						name: routeNames.search,
						query: {
							q: query
						}
					});
				}
			},
			navigateToShared: () => {
				if (router && routeNames.shared) {
					router.push({
						name: routeNames.shared
					});
				}
			},
			navigateToArchive: () => {
				if (router && routeNames.archive) {
					router.push({
						name: routeNames.archive
					});
				}
			},
			navigateToRecycleBin: () => {
				if (router && routeNames.recyclebin) {
					router.push({
						name: routeNames.recyclebin
					});
				}
			},
			navigateToWorkspace: collectionId => {
				const id = Number(collectionId);
				if (!router || !routeNames.workspace || !Number.isInteger(id) || id <= 0) {
					return;
				}
				router.push({
					name: routeNames.workspace,
					params: {
						id
					}
				});
			}
		};
	}

	class CollectionDndService {
		#dragState;
		#store;
		#api;
		#onFail;
		#cachedListElement = null;
		#cachedRects = null;
		#lastScrollTop = 0;
		#committed = false;
		constructor({
			dragState,
			store,
			api,
			onFail
		}) {
			this.#dragState = dragState;
			this.#store = store;
			this.#api = api;
			this.#onFail = onFail;
		}
		startDrag(collection, event) {
			this.#dragState.collectionItem = {
				id: Number(collection.id)
			};
			this.#dragState.collectionTarget = null;
			this.#committed = false;
			this.#invalidateRectCache();
			const transfer = event.dataTransfer;
			if (transfer) {
				transfer.effectAllowed = 'move';
				transfer.setData('text/plain', String(collection.id));
			}
		}
		onDragOver(collection, event) {
			if (!this.#dragState.collectionItem) {
				return;
			}
			event.preventDefault();
		}
		onListDragOver(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			event.preventDefault();
			const listNode = event.currentTarget;
			if (this.#cachedListElement !== listNode) {
				this.#cacheListRects(listNode);
			}

			// The list scrolls inside itself, not with the panel, so the cached rects go stale with the
			// tree area's own scroll position.
			const scrollParent = listNode.querySelector('.tree-scroll') ?? listNode.closest('.sidebar-content');
			if (scrollParent && scrollParent.scrollTop !== this.#lastScrollTop) {
				this.#lastScrollTop = scrollParent.scrollTop;
				this.#invalidateRectCache();
				this.#cacheListRects(listNode);
			}
			const target = this.#resolveCollectionGapTarget(event);
			if (!target) {
				return;
			}
			const current = this.#dragState.collectionTarget;
			if (current && Number(current.id) === Number(target.id) && current.placement === target.placement) {
				return;
			}
			this.#dragState.collectionTarget = target;
		}
		onViewportDragOver(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			const targetNode = event.target;
			if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list')) {
				return;
			}
			const target = this.#resolveCollectionViewportTarget(event);
			if (!target) {
				return;
			}
			event.preventDefault();
			this.#dragState.collectionTarget = target;
		}
		async onDrop(collection, event) {
			if (!this.#dragState.collectionItem) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#tryCommitAndClear();
		}
		async onListDrop(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			event.preventDefault();
			this.#tryCommitAndClear();
		}
		async onViewportDrop(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			const targetNode = event.target;
			if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list')) {
				return;
			}
			if (!this.#dragState.collectionTarget) {
				this.#dragState.collectionTarget = this.#resolveCollectionViewportTarget(event);
			}
			event.preventDefault();
			this.#tryCommitAndClear();
		}
		endDrag() {
			this.#tryCommitAndClear();
		}
		clearDrag() {
			this.#dragState.collectionItem = null;
			this.#dragState.collectionTarget = null;
			this.#invalidateRectCache();
		}
		#tryCommitAndClear() {
			if (this.#committed) {
				this.clearDrag();
				return;
			}
			const dragItem = this.#dragState.collectionItem;
			const target = this.#dragState.collectionTarget;
			this.clearDrag();
			if (!dragItem || !target || dragItem.id === Number(target.id)) {
				return;
			}
			this.#committed = true;
			const position = this.#resolvePosition(dragItem.id, Number(target.id), target.placement);
			this.#store.actions.moveCollectionLocal(dragItem.id, Number(target.id), target.placement);
			void this.#sendMove(dragItem.id, position);
		}
		async #sendMove(dragId, position) {
			try {
				const response = await this.#api.moveCollection(dragId, position);
				const affected = Array.isArray(response?.affectedPositions) ? response.affectedPositions : [];
				if (affected.length > 0 && this.#store.actions.applyCollectionPositions) {
					this.#store.actions.applyCollectionPositions(affected);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		#resolvePosition(dragId, targetId, placement) {
			const siblings = this.#store.state.collections.value.map(item => Number(item.id)).filter(id => id !== dragId);
			const targetIndex = siblings.indexOf(targetId);
			if (targetIndex < 0) {
				return null;
			}
			const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			return insertIndex + 1;
		}
		#cacheListRects(listNode) {
			if (this.#cachedListElement === listNode) {
				return;
			}
			const rowNodes = [...listNode.querySelectorAll('.collection-row')];
			this.#cachedRects = rowNodes.map(row => {
				const rect = row.getBoundingClientRect();
				return {
					id: Number(row.dataset.collectionId),
					top: rect.top,
					bottom: rect.bottom,
					height: rect.height
				};
			});
			this.#cachedListElement = listNode;
		}
		#invalidateRectCache() {
			this.#cachedListElement = null;
			this.#cachedRects = null;
		}
		invalidateDragRectCache() {
			this.#invalidateRectCache();
		}
		#resolveCollectionGapTarget(event) {
			const rects = this.#cachedRects;
			if (!rects || rects.length === 0) {
				return null;
			}
			const pointerY = event.clientY;
			if (pointerY <= rects[0].top) {
				return {
					id: rects[0].id,
					placement: 'before'
				};
			}
			if (pointerY >= rects[rects.length - 1].bottom) {
				return {
					id: rects[rects.length - 1].id,
					placement: 'after'
				};
			}
			for (let i = 0; i < rects.length; i++) {
				const {
					id,
					top,
					height
				} = rects[i];
				const midY = top + height / 2;
				if (pointerY < midY) {
					if (i === 0) {
						return {
							id,
							placement: 'before'
						};
					}
					return {
						id: rects[i - 1].id,
						placement: 'after'
					};
				}
				const nextTop = i < rects.length - 1 ? rects[i + 1].top : null;
				if (nextTop === null || pointerY < nextTop) {
					return {
						id,
						placement: 'after'
					};
				}
			}
			return {
				id: rects[rects.length - 1].id,
				placement: 'after'
			};
		}
		#resolveCollectionViewportTarget(event) {
			const viewportNode = event.currentTarget;
			const listNode = viewportNode.querySelector('.collection-list');
			if (!(listNode instanceof HTMLElement)) {
				return null;
			}
			const rowNodes = [...listNode.querySelectorAll('.collection-row')];
			if (rowNodes.length === 0) {
				return null;
			}
			const pointerY = event.clientY;
			const firstId = Number(rowNodes[0].dataset.collectionId);
			const lastId = Number(rowNodes[rowNodes.length - 1].dataset.collectionId);
			if (!Number.isFinite(firstId) || !Number.isFinite(lastId)) {
				return null;
			}
			const listRect = listNode.getBoundingClientRect();
			if (pointerY < listRect.top) {
				return {
					id: firstId,
					placement: 'before'
				};
			}
			if (pointerY > listRect.bottom) {
				return {
					id: lastId,
					placement: 'after'
				};
			}
			return null;
		}
	}

	const NoteEvent = {
		DOCUMENT_RENAMED: 'Note:documentRenamed',
		COLLECTION_RENAMED: 'Note:collectionRenamed',
		DOCUMENT_CHILDREN_CHANGED: 'Note:documentChildrenChanged',
		DOCUMENTS_BULK_RESTORED: 'Note:documentsBulkRestored',
		// Workspace → sidebar: a bulk archive/delete/move ran on the current page. The
		// initiator is excluded from the pull fan-out, so the sidebar tree must be
		// refreshed locally the same way a bulk restore refreshes it.
		DOCUMENTS_BULK_CHANGED: 'Note:documentsBulkChanged',
		// Cross-route bus: sidebar re-emits selected pull commands so other pages
		// (e.g. /shared/) can react without subscribing to BX.PULL directly.
		PULL_EVENT: 'Note:pullEvent',
		// Editor → app: after a push-driven capability refetch, app-level
		// routeDocumentContext.document needs the new recycleBinId/canRestore/etc
		// so menu actions (restoreFromTrash, hardDelete) can read them.
		DOCUMENT_ACCESS_SYNCED: 'Note:documentAccessSynced',
		// Editor → sidebar: materialization is the one moment the client learns the stored text of a
		// document changed, and there is deliberately no pull event for it, so the fresh card preview
		// reaches the loaded branches through this local event.
		// Payload: `{ documentId, collectionId, excerpt }`.
		DOCUMENT_EXCERPT_CHANGED: 'Note:documentExcerptChanged',
		// Bell (editor) / collection toggle (workspace) → app bus: a subscription was added or
		// removed. Retained as a general event; no in-app listener at present.
		SUBSCRIPTION_CHANGED: 'Note:subscriptionChanged',
		// Star (sidebar row, activity line, knowledge base page) -> every other star of the same object.
		// The pull event says the same thing a moment later, but the stars of one page have to agree
		// within the frame of the press, so the flag travels locally first.
		// Payload: `{ entityType, entityId, isFavorite }`.
		FAVORITE_CHANGED: 'Note:favoriteChanged',
		// [EVENT-01] The only public way in and out of the BitrixGPT panel. Payload
		// `{ desired?: 'open' | 'close' }`; without `desired` the shell toggles the current state. The
		// single listener is the note.app shell, which owns that state.
		AI_CHAT_TOGGLE_REQUESTED: 'Note:aiChatToggleRequested',
		// [EVENT-02] Who occupies the right rail: `{ owner: NoteRailOwner | null }`. Every resident
		// announces itself, and anyone seeing a foreign owner collapses.
		RAIL_OCCUPANCY_CHANGED: 'Note:railOccupancyChanged'
	};

	// [EVENT-02] The three residents of the single right rail. The chat belongs to the app shell, the
	// other two to the document page — the vocabulary lives here, next to the event, rather than with
	// either side.
	const NoteRailOwner = Object.freeze({
		AI_CHAT: 'aiChat',
		HISTORY: 'history',
		HOTKEYS: 'hotkeys'
	});

	class DocumentDndService {
		#dragState;
		#store;
		#api;
		#onFail;
		#uiState;
		#autoExpandDelayMs;
		#prefetchCooldownMs = 300;
		#autoExpandTimer = null;
		#autoExpandKey = null;
		#dragPrefetchedKeys = new Set();
		#dragPrefetchInFlight = new Map();
		#dragPrefetchAt = new Map();
		#cachedBranchElement = null;
		#cachedRects = null;
		constructor({
			dragState,
			store,
			api,
			onFail,
			uiState,
			autoExpandDelayMs = 500
		}) {
			this.#dragState = dragState;
			this.#store = store;
			this.#api = api;
			this.#onFail = onFail;
			this.#uiState = uiState;
			this.#autoExpandDelayMs = autoExpandDelayMs;
		}
		startDrag(doc, event) {
			this.#clearAutoExpand();
			this.#clearDragPrefetchState();
			this.#invalidateRectCache();
			this.#dragState.docItem = {
				id: Number(doc.id),
				collectionId: Number(doc.collectionId),
				parentId: this.#toNullableInt(doc.parentId),
				title: String(doc.title || ''),
				hasChildren: Boolean(doc.hasChildren),
				position: Number(doc.position || 0)
			};
			this.#dragState.docTarget = null;
			const transfer = event.dataTransfer;
			if (transfer) {
				transfer.effectAllowed = 'move';
				transfer.setData('text/plain', String(doc.id));
			}
		}
		onBranchDragEnter(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			this.#cacheBranchRects(payload.branchElement);
		}
		onBranchDragOver(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			if (this.#cachedBranchElement !== payload.branchElement) {
				this.#cacheBranchRects(payload.branchElement);
			}
			const collectionId = Number(payload.collectionId);
			const parentId = this.#toNullableInt(payload.parentId);
			const target = this.#resolveGapTarget(collectionId, parentId, payload.nativeEvent);
			if (!target) {
				return;
			}
			const current = this.#dragState.docTarget;
			if (current && Number(current.targetId) === Number(target.targetId) && current.placement === target.placement && Number(current.collectionId) === Number(target.collectionId) && current.parentId === target.parentId) {
				return;
			}
			this.#dragState.docTarget = target;
			if (target.placement === 'inside' && target.targetId !== null) {
				const doc = this.#store.queries.findLoadedDocument(collectionId, target.targetId);
				if (doc) {
					this.#scheduleDocAutoExpand(doc);
				} else {
					this.#clearAutoExpand();
				}
			} else if (target.placement === 'inside' && target.targetId === null) {
				this.#scheduleCollectionAutoExpand(collectionId);
			} else {
				this.#clearAutoExpand();
			}
		}
		async onBranchDrop(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			payload.nativeEvent.stopPropagation();
			this.#clearAutoExpand();
			const target = this.#dragState.docTarget;
			if (!target) {
				this.clearDrag();
				return;
			}
			await this.#moveDocumentWithTarget(target);
		}
		onViewportDragOver(event) {
			if (!this.#dragState.docItem) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.tree-branch')) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.collection-row')) {
				return;
			}
			event.preventDefault();
			const currentTarget = this.#dragState.docTarget;
			if (!currentTarget) {
				return;
			}
			const collectionId = Number(currentTarget.collectionId);
			const rootDocs = this.#store.queries.getChildren(collectionId, null);
			if (rootDocs.length === 0) {
				return;
			}
			const lastDoc = rootDocs[rootDocs.length - 1];
			const lastDocId = Number(lastDoc.id);
			const newTarget = {
				collectionId,
				parentId: null,
				targetId: lastDocId,
				placement: 'after'
			};
			if (Number(currentTarget.targetId) === lastDocId && currentTarget.placement === 'after' && currentTarget.parentId === null) {
				return;
			}
			this.#dragState.docTarget = newTarget;
			this.#clearAutoExpand();
		}
		async onViewportDrop(event) {
			if (!this.#dragState.docItem) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.tree-branch')) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#clearAutoExpand();
			const target = this.#dragState.docTarget;
			if (!target) {
				this.clearDrag();
				return;
			}
			await this.#moveDocumentWithTarget(target);
		}
		onCollectionDragOver(collection, event) {
			if (!this.#dragState.docItem || !collection) {
				return;
			}
			event.preventDefault();
			const current = this.#dragState.docTarget;
			if (current && current.placement === 'inside' && current.targetId === null && Number(current.collectionId) === Number(collection.id)) {
				return;
			}
			this.#dragState.docTarget = {
				collectionId: Number(collection.id),
				parentId: null,
				targetId: null,
				placement: 'inside'
			};
			this.#scheduleCollectionAutoExpand(Number(collection.id));
		}
		async onCollectionDrop(collection, event) {
			if (!this.#dragState.docItem || !collection) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#clearAutoExpand();
			const target = {
				collectionId: Number(collection.id),
				parentId: null,
				targetId: null,
				placement: 'inside'
			};
			await this.#moveDocumentWithTarget(target);
		}
		clearDrag() {
			this.#clearAutoExpand();
			this.#clearDragPrefetchState();
			this.#invalidateRectCache();
			this.#dragState.docItem = null;
			this.#dragState.docTarget = null;
		}
		async #moveDocumentWithTarget(target) {
			const dragItem = this.#dragState.docItem;
			if (!dragItem) {
				return;
			}
			if (target.targetId === dragItem.id) {
				this.clearDrag();
				return;
			}
			if (this.#isInvalidDocMoveTarget(dragItem, target)) {
				this.clearDrag();
				return;
			}

			// Read while the row still stands where it was picked up, before anything is awaited: the move is a
			// request away and the branch it lands in may have to be loaded first, and both take frames the row
			// spends where it was.
			const travel = captureRowTravel(dragItem.id);
			try {
				const position = this.#resolveDocumentPosition(dragItem, target);
				const nextParentId = target.placement === 'inside' ? target.targetId : target.parentId;
				if (this.#shouldGuardPrefetchTarget(target, nextParentId)) {
					await this.#guardPrefetchTarget(target.collectionId, nextParentId);
				}
				const response = await this.#api.moveDocument(dragItem.id, target.collectionId, nextParentId, position);
				this.#store.actions.moveDocumentLocal({
					docId: dragItem.id,
					fromCollectionId: dragItem.collectionId,
					fromParentId: dragItem.parentId,
					toCollectionId: target.collectionId,
					toParentId: nextParentId,
					placement: target.placement,
					targetId: target.targetId,
					fallbackDoc: {
						id: dragItem.id,
						collectionId: target.collectionId,
						parentId: nextParentId,
						title: dragItem.title,
						hasChildren: dragItem.hasChildren,
						position: dragItem.position
					}
				});
				this.#store.actions.applyDocumentPositions(response.affectedPositions);

				// After the patch, before the reloads the events below set off: what the row has to travel is the
				// distance to where the move itself put it, and what the sections have to move by is what the two
				// branches now hold.
				travel?.play();
				markSectionMotion(document.querySelector('.sidebar'));
				const changedParents = new Set();
				if (dragItem.parentId !== null) {
					changedParents.add(`${dragItem.collectionId}:${dragItem.parentId}`);
				}
				if (nextParentId !== null) {
					changedParents.add(`${target.collectionId}:${nextParentId}`);
				}
				for (const key of changedParents) {
					const [colId, parId] = key.split(':').map(Number);
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId: parId,
							collectionId: colId
						}
					}));
				}
			} catch (error) {
				this.#onFail(error);
			} finally {
				this.clearDrag();
			}
		}
		#resolveDocumentPosition(dragItem, target) {
			if (target.placement === 'root' || target.placement === 'inside') {
				return null;
			}
			const siblings = this.#store.queries.getChildren(target.collectionId, target.parentId);
			const siblingIds = siblings.map(item => Number(item.id)).filter(id => id !== dragItem.id);
			const targetIndex = siblingIds.indexOf(target.targetId);
			if (targetIndex < 0) {
				return null;
			}
			const insertIndex = target.placement === 'before' ? targetIndex : targetIndex + 1;
			return insertIndex + 1;
		}
		#cacheBranchRects(branchElement) {
			if (this.#cachedBranchElement === branchElement) {
				return;
			}
			const rows = [...branchElement.querySelectorAll(':scope > li > .tree-row')];
			this.#cachedRects = rows.map(row => {
				const rect = row.getBoundingClientRect();
				return {
					docId: Number(row.dataset.docId),
					top: rect.top,
					bottom: rect.bottom,
					height: rect.height
				};
			});
			this.#cachedBranchElement = branchElement;
		}
		#invalidateRectCache() {
			this.#cachedBranchElement = null;
			this.#cachedRects = null;
		}
		invalidateDragRectCache() {
			this.#invalidateRectCache();
		}
		#resolveGapTarget(collectionId, parentId, event) {
			const rects = this.#cachedRects;
			if (!rects || rects.length === 0) {
				return {
					collectionId,
					parentId,
					targetId: null,
					placement: 'inside'
				};
			}
			const result = this.#findGapPlacement(rects, event.clientY);
			return {
				collectionId,
				parentId,
				targetId: result.docId,
				placement: result.placement
			};
		}
		#findGapPlacement(rects, pointerY) {
			for (let i = 0; i < rects.length; i++) {
				const {
					docId,
					top,
					height
				} = rects[i];
				if (pointerY < top + height * 0.25) {
					if (i === 0) {
						return {
							docId,
							placement: 'before'
						};
					}
					return {
						docId: rects[i - 1].docId,
						placement: 'after'
					};
				}
				if (pointerY < top + height * 0.75) {
					return {
						docId,
						placement: 'inside'
					};
				}
				if (this.#store.state.expandedDocs[docId] && pointerY < top + height) {
					return {
						docId,
						placement: 'inside'
					};
				}
				const nextTop = i < rects.length - 1 ? rects[i + 1].top : null;
				if (nextTop === null || pointerY < nextTop) {
					return {
						docId,
						placement: 'after'
					};
				}
			}
			return {
				docId: rects[rects.length - 1].docId,
				placement: 'after'
			};
		}
		#shouldGuardPrefetchTarget(target, nextParentId) {
			if (target.placement !== 'inside') {
				return false;
			}
			const collectionId = Number(target.collectionId);
			const parentId = this.#toNullableInt(nextParentId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			if (parentId === null) {
				return Boolean(this.#uiState.expandedCollections[collectionId]) && !this.#store.queries.isBranchLoaded(collectionId, null);
			}
			if (!this.#store.state.expandedDocs[parentId]) {
				return false;
			}
			return !this.#store.queries.isBranchLoaded(collectionId, parentId);
		}
		async #guardPrefetchTarget(collectionId, parentId) {
			const key = `${Number(collectionId)}:${parentId === null ? 'root' : Number(parentId)}`;
			if (this.#dragPrefetchedKeys.has(key)) {
				return;
			}
			const inFlight = this.#dragPrefetchInFlight.get(key);
			if (inFlight) {
				await inFlight;
				return;
			}
			const lastAttemptAt = this.#dragPrefetchAt.get(key);
			if (Number.isFinite(lastAttemptAt) && Date.now() - lastAttemptAt < this.#prefetchCooldownMs) {
				return;
			}
			this.#dragPrefetchAt.set(key, Date.now());
			const request = this.#store.actions.ensureChildrenLoaded(collectionId, parentId);
			this.#dragPrefetchInFlight.set(key, request);
			try {
				await request;
				this.#dragPrefetchedKeys.add(key);
			} finally {
				if (this.#dragPrefetchInFlight.get(key) === request) {
					this.#dragPrefetchInFlight.delete(key);
				}
			}
		}
		#scheduleDocAutoExpand(doc) {
			if (!doc) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			const docId = Number(doc.id);
			if (!Number.isFinite(collectionId) || collectionId <= 0 || !Number.isFinite(docId) || docId <= 0) {
				return;
			}
			if (!doc.hasChildren) {
				this.#clearAutoExpand();
				return;
			}
			if (this.#store.state.expandedDocs[docId]) {
				this.#clearAutoExpand();
				return;
			}
			this.#scheduleAutoExpand(`doc:${collectionId}:${docId}`, async () => {
				const target = this.#dragState.docTarget;
				if (!target || target.placement !== 'inside' || Number(target.collectionId) !== collectionId || Number(target.targetId) !== docId) {
					return;
				}
				if (this.#store.state.expandedDocs[docId]) {
					return;
				}
				this.#store.state.expandedDocs[docId] = true;
				this.#invalidateRectCache();
				await this.#store.actions.ensureChildrenLoaded(collectionId, docId);
			});
		}
		#scheduleCollectionAutoExpand(collectionId) {
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return;
			}
			if (this.#uiState.expandedCollections[collectionId]) {
				this.#clearAutoExpand();
				return;
			}
			this.#scheduleAutoExpand(`collection:${collectionId}`, async () => {
				const target = this.#dragState.docTarget;
				if (!target || target.placement !== 'inside' || Number(target.collectionId) !== collectionId || !(target.targetId === null || target.targetId === undefined)) {
					return;
				}
				const shouldExpandImmediately = this.#store.queries.isLoadingChildren(collectionId, null) || this.#store.queries.getChildren(collectionId, null).length > 0 || this.#store.queries.hasNextChildren(collectionId, null);
				if (shouldExpandImmediately) {
					this.#uiState.expandedCollections[collectionId] = true;
				}
				await this.#store.actions.ensureChildrenLoaded(collectionId, null);
				const hasChildren = this.#store.queries.getChildren(collectionId, null).length > 0 || this.#store.queries.hasNextChildren(collectionId, null);
				if (!hasChildren) {
					return;
				}
				this.#uiState.expandedCollections[collectionId] = true;
				this.#invalidateRectCache();
			});
		}
		#scheduleAutoExpand(key, callback) {
			if (this.#autoExpandKey === key) {
				return;
			}
			this.#clearAutoExpand();
			this.#autoExpandKey = key;
			this.#autoExpandTimer = setTimeout(() => {
				if (this.#autoExpandKey !== key) {
					return;
				}
				this.#autoExpandTimer = null;
				this.#autoExpandKey = null;
				void callback();
			}, this.#autoExpandDelayMs);
		}
		#clearAutoExpand() {
			if (this.#autoExpandTimer !== null) {
				clearTimeout(this.#autoExpandTimer);
				this.#autoExpandTimer = null;
			}
			this.#autoExpandKey = null;
		}
		#clearDragPrefetchState() {
			this.#dragPrefetchedKeys.clear();
			this.#dragPrefetchInFlight.clear();
			this.#dragPrefetchAt.clear();
		}
		#isInvalidDocMoveTarget(dragItem, target) {
			if (!target || target.targetId === null || target.targetId === undefined) {
				return false;
			}
			if (Number(dragItem.id) === Number(target.targetId)) {
				return true;
			}
			if (Number(dragItem.collectionId) !== Number(target.collectionId)) {
				return false;
			}
			let currentId = Number(target.targetId);
			let guard = 0;
			while (currentId > 0 && guard < 200) {
				guard += 1;
				if (currentId === Number(dragItem.id)) {
					return true;
				}
				const loadedDoc = this.#store.queries.findLoadedDocument(target.collectionId, currentId);
				if (!loadedDoc) {
					return false;
				}
				const nextParent = this.#toNullableInt(loadedDoc.parentId);
				if (nextParent === null) {
					return false;
				}
				currentId = Number(nextParent);
			}
			return false;
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}
	}

	// [P3] Manual order of the favorites block, built on the same HTML5 drag events as the knowledge
	// base list. Geometry only: the order itself belongs to the store, which owns the list and answers
	// to the server (AC-072). Rows are addressed by the id of the favorites row, the same key the
	// server uses in affectedPositions.
	class FavoriteDndService {
		#dragState;
		#store;
		#cachedListElement = null;
		#cachedRects = null;
		#lastScrollTop = 0;
		#committed = false;
		constructor({
			dragState,
			store
		}) {
			this.#dragState = dragState;
			this.#store = store;
		}
		startDrag(row, event) {
			const id = Number(row?.id);
			if (!Number.isInteger(id) || id <= 0) {
				return;
			}
			this.#dragState.favoriteItem = {
				id
			};
			this.#dragState.favoriteTarget = null;
			this.#committed = false;
			this.#invalidateRectCache();
			const transfer = event.dataTransfer;
			if (transfer) {
				transfer.effectAllowed = 'move';
				transfer.setData('text/plain', String(id));
			}
		}
		onListDragOver(event) {
			if (!this.#isOwnDrag()) {
				return;
			}
			const listNode = event.currentTarget;
			if (!(listNode instanceof HTMLElement)) {
				return;
			}
			event.preventDefault();
			if (this.#cachedListElement !== listNode) {
				this.#cacheListRects(listNode);
			}

			// The block scrolls inside itself rather than with the panel, so the cached rects go stale with
			// its own scroll position.
			if (listNode.scrollTop !== this.#lastScrollTop) {
				this.#lastScrollTop = listNode.scrollTop;
				this.#invalidateRectCache();
				this.#cacheListRects(listNode);
			}
			const target = this.#resolveGapTarget(event);
			if (!target) {
				return;
			}
			const current = this.#dragState.favoriteTarget;
			if (current && Number(current.id) === Number(target.id) && current.placement === target.placement) {
				return;
			}
			this.#dragState.favoriteTarget = target;
		}
		onListDrop(event) {
			if (!this.#isOwnDrag()) {
				return;
			}
			event.preventDefault();
			this.#tryCommitAndClear();
		}

		// A drag that ends anywhere but on the block moves nothing: the block is the only surface with a
		// drop target of its own, so there is no place outside it to commit to.
		endDrag() {
			this.clearDrag();
		}
		clearDrag() {
			this.#dragState.favoriteItem = null;
			this.#dragState.favoriteTarget = null;
			this.#invalidateRectCache();
		}
		invalidateDragRectCache() {
			this.#invalidateRectCache();
		}
		#isOwnDrag() {
			return Boolean(this.#dragState.favoriteItem) && !this.#dragState.docItem && !this.#dragState.collectionItem;
		}
		#tryCommitAndClear() {
			if (this.#committed) {
				this.clearDrag();
				return;
			}
			const dragItem = this.#dragState.favoriteItem;
			const target = this.#dragState.favoriteTarget;
			this.clearDrag();
			if (!dragItem || !target || dragItem.id === Number(target.id)) {
				return;
			}
			this.#committed = true;
			void this.#store.actions.moveFavoriteRow(dragItem.id, Number(target.id), target.placement);
		}
		#cacheListRects(listNode) {
			if (this.#cachedListElement === listNode) {
				return;
			}

			// Top-level rows only (AC-032): the rows of an expanded branch are drawn by the tree and take
			// no part in the order of the block. A row of the block is the only thing .favorite-item ever
			// holds, so this says the same as a child selector without depending on how deep inside the
			// scrolling area the items are wrapped.
			const rowNodes = [...listNode.querySelectorAll('.favorite-item > .favorite-row')];
			this.#cachedRects = rowNodes.map(row => {
				const rect = row.getBoundingClientRect();
				return {
					id: Number(row.dataset.favoriteRowId),
					top: rect.top,
					bottom: rect.bottom,
					height: rect.height
				};
			});
			this.#cachedListElement = listNode;
		}
		#invalidateRectCache() {
			this.#cachedListElement = null;
			this.#cachedRects = null;
		}
		#resolveGapTarget(event) {
			const rects = this.#cachedRects;
			if (!rects || rects.length === 0) {
				return null;
			}
			const pointerY = event.clientY;
			if (pointerY <= rects[0].top) {
				return {
					id: rects[0].id,
					placement: 'before'
				};
			}
			if (pointerY >= rects[rects.length - 1].bottom) {
				return {
					id: rects[rects.length - 1].id,
					placement: 'after'
				};
			}
			for (let i = 0; i < rects.length; i++) {
				const {
					id,
					top,
					height
				} = rects[i];
				const midY = top + height / 2;
				if (pointerY < midY) {
					if (i === 0) {
						return {
							id,
							placement: 'before'
						};
					}
					return {
						id: rects[i - 1].id,
						placement: 'after'
					};
				}
				const nextTop = i < rects.length - 1 ? rects[i + 1].top : null;
				if (nextTop === null || pointerY < nextTop) {
					return {
						id,
						placement: 'after'
					};
				}
			}
			return {
				id: rects[rects.length - 1].id,
				placement: 'after'
			};
		}
	}

	const MAX_FILE_SIZE_BYTES = 1048576;
	const MARKDOWN_EXTENSION = '.md';
	// One OS drop can carry an unbounded number of files, and each valid one becomes its own sequential
	// create request; cap how many a single drop turns into documents. Bulk migration goes through the
	// import flow, not drag-and-drop. Overflow is reported through the same "skipped" notice.
	const MAX_DROP_FILES = 50;
	// Isolated from DocumentDndService/CollectionDndService: this drag originates outside the
	// browser (OS file drag), so there is no startDrag on our side and the target shape differs
	// from docTarget/collectionTarget ({ collectionId, parentId } instead of before/after/inside).
	class FileDropService {
		#dragState;
		#store;
		#documentUseCases;
		#onFail;
		#messages;
		constructor({
			dragState,
			store,
			documentUseCases,
			onFail,
			messages
		}) {
			this.#dragState = dragState;
			this.#store = store;
			this.#documentUseCases = documentUseCases;
			this.#onFail = onFail;
			this.#messages = messages;
		}
		resolveCollectionTarget(collection) {
			if (collection && Boolean(collection.canEditCollection)) {
				this.#setFileDropTarget(Number(collection.id), null);
				return;
			}
			this.#clearFileDropTarget();
		}
		resolveDocumentTarget(doc) {
			if (doc && this.#canDropOnDocument(doc)) {
				this.#setFileDropTarget(Number(doc.collectionId), Number(doc.id));
				return;
			}
			this.#clearFileDropTarget();
		}

		// dragover fires continuously; only swap the reactive target when its identity actually changes,
		// so the recursive TreeNode subtree doesn't re-render (and findCollection doesn't rerun) per event.
		#setFileDropTarget(collectionId, parentId) {
			const current = this.#dragState.fileDropTarget;
			if (current && Number(current.collectionId) === collectionId && current.parentId === parentId) {
				return;
			}
			this.#dragState.fileDropTarget = {
				collectionId,
				parentId
			};
		}
		#clearFileDropTarget() {
			if (this.#dragState.fileDropTarget !== null) {
				this.#dragState.fileDropTarget = null;
			}
		}
		onSidebarDragEnter(event) {
			this.#trackFileDragIfPresent(event);
		}
		onSidebarDragOver(event) {
			this.#trackFileDragIfPresent(event);
		}
		onSidebarDragLeave(event) {
			const container = event.currentTarget;
			const nextTarget = event.relatedTarget;
			if (container instanceof HTMLElement && nextTarget instanceof Node && container.contains(nextTarget)) {
				// Still inside the sidebar container (moved to a child element) — not a real leave.
				return;
			}
			this.clearFileDrag();
		}
		clearFileDrag() {
			this.#dragState.fileDragItem = false;
			this.#dragState.fileDropTarget = null;
		}
		extractMarkdownFiles(fileList) {
			const valid = [];
			let skipped = 0;
			for (const file of Array.from(fileList || [])) {
				const title = this.#extractMarkdownTitle(file.name);
				if (title === null || file.size > MAX_FILE_SIZE_BYTES) {
					skipped += 1;
					continue;
				}

				// Beyond the per-drop cap: count as skipped so the user gets the "N skipped" notice rather
				// than silently spawning an unbounded number of sequential create requests.
				if (valid.length >= MAX_DROP_FILES) {
					skipped += 1;
					continue;
				}
				valid.push({
					file,
					title
				});
			}
			return {
				valid,
				skipped
			};
		}
		async handleCollectionDrop(collection, fileList) {
			if (!Boolean(collection?.canEditCollection)) {
				this.clearFileDrag();
				return;
			}
			await this.#handleDrop({
				collectionId: Number(collection.id),
				parentId: null
			}, fileList);
		}
		async handleDocumentDrop(doc, fileList) {
			if (!doc || !this.#canDropOnDocument(doc)) {
				this.clearFileDrag();
				return;
			}
			await this.#handleDrop({
				collectionId: Number(doc.collectionId),
				parentId: Number(doc.id)
			}, fileList);
		}
		async #handleDrop(target, fileList) {
			try {
				const {
					valid,
					skipped
				} = this.extractMarkdownFiles(fileList);
				if (skipped > 0) {
					this.#notify(this.#messages.fileDropWarningSkipped.replace('#COUNT#', String(skipped)));
				}
				if (valid.length === 0) {
					this.#notify(this.#messages.fileDropWarningNoMarkdown);
					return;
				}
				if (valid.length === 1) {
					await this.#handleSingleFile(target, valid[0]);
					return;
				}
				await this.#handleMultipleFiles(target, valid);
			} finally {
				this.clearFileDrag();
			}
		}
		async #handleSingleFile(target, entry) {
			try {
				const text = await entry.file.text();
				await this.#documentUseCases.createDocumentFromMarkdownFile(target.collectionId, target.parentId, entry.title, text, {
					open: true
				});
			} catch (error) {
				this.#onFail(error);
			}
		}
		async #handleMultipleFiles(target, entries) {
			let created = 0;
			for (const entry of entries) {
				try {
					const text = await entry.file.text();
					await this.#documentUseCases.createDocumentFromMarkdownFile(target.collectionId, target.parentId, entry.title, text, {
						open: false
					});
					created += 1;
				} catch {
					// A single file failure must not roll back documents already created — keep going.
				}
			}

			// Full success shows a clean count; the "N of M" form is kept only when some files failed,
			// where the discrepancy is the useful signal.
			this.#notify(created === entries.length ? this.#messages.fileDropSummary.replace('#COUNT#', String(created)) : this.#messages.fileDropSummaryPartial.replace('#CREATED#', String(created)).replace('#TOTAL#', String(entries.length)));
		}
		#canDropOnDocument(doc) {
			return Boolean(this.#store.queries.findCollection(Number(doc.collectionId))?.canEditCollection) || Boolean(doc?.canEditCollection);
		}
		#extractMarkdownTitle(fileName) {
			const name = String(fileName || '');
			if (name.length <= MARKDOWN_EXTENSION.length || !name.toLowerCase().endsWith(MARKDOWN_EXTENSION)) {
				return null;
			}
			const title = name.slice(0, -MARKDOWN_EXTENSION.length);
			return title === '' ? null : title;
		}
		#trackFileDragIfPresent(event) {
			if (!event.dataTransfer?.types?.includes('Files')) {
				return;
			}
			event.preventDefault();
			this.#dragState.fileDragItem = true;
		}
		#notify(content) {
			BX.UI.Notification.Center.notify({
				content,
				position: 'top-right'
			});
		}
	}

	const MAX_BRANCH_LOAD_ITERATIONS = 100;
	class SidebarRouteSyncService {
		#store;
		#router;
		#uiState;
		#messages;
		#emitAction;
		#getRouteDocumentContext;
		#hydrateFromInitialContext;
		#documentRouteName;
		#homeRouteName;
		#sharedRouteName;
		#archiveRouteName;
		#recycleBinRouteName;
		#workspaceRouteName;
		#searchRouteName;
		constructor({
			store,
			router,
			uiState,
			messages,
			emitAction,
			getRouteDocumentContext = () => null,
			hydrateFromInitialContext = null,
			routeNames = {}
		}) {
			this.#store = store;
			this.#router = router;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#emitAction = emitAction;
			this.#getRouteDocumentContext = getRouteDocumentContext;
			this.#hydrateFromInitialContext = hydrateFromInitialContext ?? (context => store.actions.hydrateFromInitialContext(context));
			this.#documentRouteName = routeNames.document || 'document';
			this.#homeRouteName = routeNames.home || 'home';
			this.#sharedRouteName = routeNames.shared || 'shared';
			this.#archiveRouteName = routeNames.archive || 'archive';
			this.#recycleBinRouteName = routeNames.recyclebin || 'recyclebin';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#searchRouteName = routeNames.search || 'search';
		}
		async bootstrap({
			skipInitialCollectionsLoad = false
		} = {}) {
			if (skipInitialCollectionsLoad) {
				this.#subscribeToPullEvents();
				return;
			}
			try {
				await this.#store.actions.loadCollections(false);
			} catch {
				// store already handles load errors
			}
			this.#subscribeToPullEvents();
		}
		#subscribeToPullEvents() {
			const subscribe = this.#store.actions?.subscribeToPullEvents;
			if (typeof subscribe !== 'function') {
				return;
			}
			try {
				subscribe();
			} catch {
				// Pull subscription is best-effort — never break bootstrap.
			}
		}
		destroy() {
			const unsubscribe = this.#store.actions?.unsubscribeFromPullEvents;
			if (typeof unsubscribe !== 'function') {
				return;
			}
			try {
				unsubscribe();
			} catch {
				// Best-effort teardown — never throw on destroy.
			}
		}
		getRouteDocumentId(route = this.#router?.currentRoute?.value) {
			if (!route || route.name !== this.#documentRouteName) {
				return 0;
			}
			const docId = Number(route.params?.id);
			return Number.isInteger(docId) && docId > 0 ? docId : 0;
		}
		async syncFromRouteContext(withCollectionFallback = false, options = {}) {
			const previousRouteName = String(options?.previousRouteName || '');
			const currentRouteName = String(this.#router?.currentRoute?.value?.name || '');
			if (currentRouteName === this.#sharedRouteName) {
				this.#store.actions.setSharedView(true);
				return;
			}
			if (currentRouteName === this.#archiveRouteName) {
				this.#store.actions.setArchiveView(true);
				return;
			}
			if (currentRouteName === this.#recycleBinRouteName) {
				this.#store.actions.setRecycleBinView(true);
				return;
			}
			this.#store.actions.setSharedView(false);
			this.#store.actions.setArchiveView(false);
			this.#store.actions.setRecycleBinView(false);
			if (currentRouteName === this.#searchRouteName) {
				// Search page does not belong to any collection — clear selection so
				// no sidebar item gets highlighted as active.
				this.#store.actions.clearSelection();
				return;
			}
			if (currentRouteName === this.#workspaceRouteName) {
				await this.#syncWorkspaceRoute();
				return;
			}
			const context = this.#getRouteDocumentContext();
			const status = String(context?.status || 'idle');
			const routeDocId = Number(context?.docId || this.getRouteDocumentId());
			if (status === 'ready' && main_core.Type.isPlainObject(context?.document)) {
				await this.#syncDocumentContext(context);
				return;
			}
			if (status === 'not_found' || status === 'error') {
				await this.#handleInvalidDocumentRoute();
				return;
			}
			if (status === 'loading' && Number.isInteger(routeDocId) && routeDocId > 0) {
				return;
			}
			await this.#ensureHomeCollectionSelected(withCollectionFallback, previousRouteName, currentRouteName);
			this.#store.actions.clearDocumentSelection();
		}
		async #syncWorkspaceRoute() {
			const route = this.#router?.currentRoute?.value;
			const collectionId = Number(route?.params?.id);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				this.#store.actions.clearSelection();
				return;
			}
			this.#store.actions.clearDocumentSelection();
			const currentSelectedId = Number(this.#store.state.selectedCollectionId.value);
			if (currentSelectedId === collectionId) {
				return;
			}
			this.#uiState.expandedCollections[collectionId] = true;
			await this.#store.actions.selectCollection(collectionId);
		}
		async #syncDocumentContext(context) {
			const document = context.document;
			const docId = Number(document?.id);
			if (!Number.isInteger(docId) || docId <= 0) {
				await this.#handleInvalidDocumentRoute();
				return;
			}
			if (document?.sharedAccess === true) {
				this.#store.actions.clearSelection();
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId: 0
				});
				return;
			}
			if (document?.isTrashed === true) {
				// Trashed orphan documents may have collectionId === 0 (source collection gone).
				// Skip sidebar tree manipulation; editor renders trashed view from openContext.
				this.#store.actions.clearDocumentSelection();
				const rawCollectionId = Number(document?.collectionId);
				const trashedCollectionId = Number.isInteger(rawCollectionId) && rawCollectionId > 0 ? rawCollectionId : 0;
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId: trashedCollectionId
				});
				return;
			}
			const collectionId = Number(document?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				await this.#handleInvalidDocumentRoute();
				return;
			}

			// archived/trashed target is hidden from the sidebar tree, so skip expansion/selection for it
			const shouldExpandSidebarTree = !document?.isArchived && !document?.isTrashed;
			if (shouldExpandSidebarTree) {
				this.#uiState.expandedCollections[collectionId] = true;
			}
			if (main_core.Type.isPlainObject(context.openContext) && this.#hydrateFromInitialContext(context.openContext)) {
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId
				});
				return;
			}
			await this.#store.actions.selectCollection(collectionId, {
				preserveDocumentSelection: true
			});
			if (shouldExpandSidebarTree) {
				await this.#ensureDocumentLoaded(collectionId, this.#toNullableInt(document.parentId), docId, 0);
				this.#expandAncestorDocs(collectionId, this.#toNullableInt(document.parentId));
				this.#store.actions.selectDocument(docId);
			}
			this.#emitAction('onOpenDocument', {
				docId,
				collectionId
			});
		}
		async #handleInvalidDocumentRoute() {
			// Toast + redirect are owned by pages/document-page.js (single source of truth for unavailable docs).
			// This handler stays as a safety-net to clear sidebar selection and ensure the user leaves the doc route.
			this.#store.actions.clearDocumentSelection();
			if (this.#router.currentRoute.value.name === this.#documentRouteName) {
				await this.#router.replace({
					name: this.#homeRouteName
				});
			}
		}
		async #ensureDocumentLoaded(collectionId, parentId, targetDocId, depth = 0) {
			const normalizedParentId = this.#toNullableInt(parentId);
			const targetId = Number(targetDocId);
			if (depth >= MAX_BRANCH_LOAD_ITERATIONS || !Number.isInteger(targetId) || targetId <= 0) {
				return;
			}
			const hasTargetLoaded = () => this.#store.queries.getChildren(collectionId, normalizedParentId).some(item => Number(item.id) === targetId);
			if (hasTargetLoaded()) {
				return;
			}
			await this.#store.actions.ensureChildrenLoaded(collectionId, normalizedParentId);
			if (hasTargetLoaded()) {
				return;
			}
			if (!this.#store.queries.hasNextChildren(collectionId, normalizedParentId)) {
				return;
			}
			await this.#store.actions.loadDocuments(collectionId, normalizedParentId, true);
			if (hasTargetLoaded()) {
				return;
			}
			await this.#ensureDocumentLoaded(collectionId, normalizedParentId, targetId, depth + 1);
		}
		async #ensureHomeCollectionSelected(withCollectionFallback, previousRouteName = '', currentRouteName = '') {
			if (!withCollectionFallback || this.#store.state.selectedCollectionId.value || this.#store.state.collections.value.length === 0) {
				return;
			}

			// Only redirect from HOME — other routes (search, etc.) fall through this
			// branch with status='idle' but must keep their URL intact.
			if (currentRouteName !== this.#homeRouteName) {
				return;
			}
			const firstId = Number(this.#store.state.collections.value[0].id);
			if (!Number.isInteger(firstId) || firstId <= 0) {
				return;
			}
			await this.#store.actions.selectCollection(firstId);

			// Loop guard: skip redirect when we just bounced back from workspace/document
			// (via workspace-page onNotFound/onArchived/onDeleted) — keep user on empty HomePage.
			if (previousRouteName === this.#workspaceRouteName || previousRouteName === this.#documentRouteName) {
				return;
			}

			// The route name above is the one this pass started with, and selecting the collection is a
			// round trip: a knowledge base opened, a document opened or a search made while it was in
			// flight would be overridden by the redirect below. Asked again, of the router itself.
			if (this.#router?.currentRoute?.value?.name !== this.#homeRouteName) {
				return;
			}

			// And the list is read again for the same reason: the base picked before the round trip may
			// have been deleted or lost its access meanwhile, and redirecting onto it lands the reader on
			// "no rights or deleted" instead of a knowledge base.
			const stillListed = this.#store.state.collections.value.some(item => Number(item?.id) === firstId);
			if (!stillListed) {
				return;
			}
			await this.#router.replace({
				name: this.#workspaceRouteName,
				params: {
					id: String(firstId)
				}
			});
		}
		#expandAncestorDocs(collectionId, parentId) {
			const visited = new Set();
			let currentId = parentId;
			while (currentId !== null && currentId > 0 && !visited.has(currentId)) {
				visited.add(currentId);
				this.#store.state.expandedDocs[currentId] = true;
				const parentDoc = this.#store.queries.findLoadedDocument(collectionId, currentId);
				currentId = this.#toNullableInt(parentDoc?.parentId);
			}
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}
	}

	class CollectionUseCases {
		#api;
		#dialog;
		#store;
		#uiState;
		#messages;
		#onFail;
		#emitAction;
		#isDragging;
		#router;
		#homeRouteName;
		#documentRouteName;
		#workspaceRouteName;
		#getRouteDocumentContext;
		#saveSidebarState;
		#prefetchTimer = null;
		#handleExternalCollectionRenamed = null;
		constructor({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			emitAction,
			isDragging = () => false,
			router = null,
			routeNames = {},
			getRouteDocumentContext,
			saveSidebarState = () => {}
		}) {
			this.#api = api;
			this.#dialog = dialog;
			this.#store = store;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#onFail = onFail;
			this.#emitAction = emitAction;
			this.#isDragging = isDragging;
			this.#router = router;
			this.#homeRouteName = routeNames.home || 'home';
			this.#documentRouteName = routeNames.document || 'document';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
			this.#saveSidebarState = saveSidebarState;
			this.#handleExternalCollectionRenamed = event => {
				const {
					id,
					name
				} = event.getData();
				const collectionId = Number(id);
				if (!Number.isInteger(collectionId) || collectionId <= 0) {
					return;
				}
				this.#store.actions.updateCollectionLocal(collectionId, {
					name: String(name || '')
				});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.#handleExternalCollectionRenamed);
		}

		// Undoes what the constructor subscribed. See DocumentUseCases::destroy for why a global subscription
		// left behind is not merely untidy.
		destroy() {
			if (this.#handleExternalCollectionRenamed !== null) {
				main_core_events.EventEmitter.unsubscribe(NoteEvent.COLLECTION_RENAMED, this.#handleExternalCollectionRenamed);
				this.#handleExternalCollectionRenamed = null;
			}
		}
		isCollectionExpanded(collectionId) {
			return Boolean(this.#uiState.expandedCollections[Number(collectionId)]);
		}
		canCreateCollections() {
			return Boolean(this.#store.state.globalPermissions.canEditCollections);
		}
		canEditCollection(collection) {
			return Boolean(collection?.canEditCollection);
		}
		canManageCollectionPermissions(collection) {
			return Boolean(collection?.canManagePermissions);
		}
		async openCollection(collection) {
			await this.#store.actions.selectCollection(collection.id);
			this.#emitAction('onOpenCollection', {
				collectionId: Number(collection.id)
			});
		}
		prefetchCollectionChildren(collection) {
			clearTimeout(this.#prefetchTimer);
			if (!collection || this.#isDragging()) {
				return;
			}
			const collectionId = Number(collection.id);
			this.#prefetchTimer = setTimeout(() => {
				this.#store.actions.prefetchChildren(collectionId, null);
			}, 300);
		}
		async toggleCollectionExpanded(collection) {
			const id = Number(collection.id);
			const nextValue = !this.isCollectionExpanded(id);
			this.#uiState.expandedCollections[id] = nextValue;
			if (nextValue) {
				await this.#store.actions.ensureChildrenLoaded(id, null);
			} else {
				this.#store.actions.clearCollectionExpandedDocs(id);
			}
		}
		toggleCollectionsSection() {
			this.#uiState.collectionsSectionExpanded = !this.#uiState.collectionsSectionExpanded;
		}
		async loadMoreCollections() {
			if (this.#store.state.collectionsLoading.value || !this.#store.state.collectionsHasNextPage.value) {
				return;
			}
			await this.#store.actions.loadCollections(true);
		}
		async refreshCollections() {
			await this.#store.actions.loadCollections(false);
		}
		createCollection() {
			if (!this.canCreateCollections()) {
				return;
			}
			void note_permissions.App.openCollectionCreatePopup({
				onCreated: collection => this.#onCollectionCreated(collection)
			});
		}
		async #onCollectionCreated(collection) {
			const id = Number(collection?.id);
			if (!Number.isInteger(id) || id <= 0) {
				return;
			}
			const name = String(collection?.name || '');
			const maxPosition = this.#store.state.collections.value.reduce((max, item) => Math.max(max, Number(item?.position || 0)), 0);
			this.#store.actions.insertCollectionLocal({
				id,
				name,
				position: Number(collection?.position || maxPosition + 1),
				canEditCollection: true,
				canManagePermissions: true
			});
			main_core_events.EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new main_core_events.BaseEvent({
				data: {
					id,
					name
				}
			}));

			// A base created into a closed block opens it, and that is a state to remember like any other:
			// left unsaved, the block would close itself again on the next load.
			this.#uiState.collectionsSectionExpanded = true;
			this.#saveSidebarState();
			this.#uiState.expandedCollections[id] = true;
			await this.openCollection({
				id,
				name
			});
			if (this.#router && this.#workspaceRouteName) {
				await this.#router.push({
					name: this.#workspaceRouteName,
					params: {
						id
					}
				});
			}
		}
		renameCollection(collection) {
			if (!this.canEditCollection(collection)) {
				return;
			}
			this.#uiState.renamingCollectionId = Number(collection.id);
		}
		async confirmRenameCollection(collectionId, newName) {
			this.#uiState.renamingCollectionId = null;
			if (!newName) {
				return;
			}
			const id = Number(collectionId);
			const current = this.#store.queries.findCollection(id);
			const previousName = current ? String(current.name ?? '') : null;
			if (previousName === newName) {
				return;
			}
			this.#store.actions.updateCollectionLocal(id, {
				name: newName
			});
			try {
				await this.#api.updateCollection(id, newName);
				main_core_events.EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new main_core_events.BaseEvent({
					data: {
						id,
						name: newName
					}
				}));
			} catch (error) {
				if (previousName !== null) {
					this.#store.actions.updateCollectionLocal(id, {
						name: previousName
					});
				}
				this.#onFail(error);
			}
		}
		cancelRenameCollection() {
			this.#uiState.renamingCollectionId = null;
		}
		#isRouteDocumentInCollection(collectionId) {
			const normalizedCollectionId = Number(collectionId);
			if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0) {
				return false;
			}
			const route = this.#router?.currentRoute?.value;
			if (!route || route.name !== this.#documentRouteName) {
				return false;
			}
			const routeDoc = this.#getRouteDocumentContext()?.document ?? null;
			if (routeDoc && Number(routeDoc.collectionId) === normalizedCollectionId) {
				return true;
			}
			if (routeDoc) {
				return false;
			}
			const routeDocId = Number(route.params?.id);
			if (!Number.isInteger(routeDocId) || routeDocId <= 0) {
				return false;
			}
			return Boolean(this.#store.queries.findLoadedDocument(normalizedCollectionId, routeDocId));
		}
		async deleteCollection(collection) {
			if (!this.canManageCollectionPermissions(collection)) {
				return;
			}
			const confirmed = await this.#dialog.confirm(this.#messages.confirmDeleteCollection, this.#messages.confirmDeleteCollectionTitle, this.#messages.delete);
			if (!confirmed) {
				return;
			}
			try {
				const collectionId = Number(collection.id);
				await this.#api.deleteCollection(collectionId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
				this.#store.actions.removeCollectionLocal(collectionId);
				delete this.#uiState.expandedCollections[collectionId];
				if (collectionId === this.#store.state.selectedCollectionId.value) {
					this.#store.actions.clearSelection();
				}
				if (shouldLeaveDocumentPage) {
					await this.#router?.replace({
						name: this.#homeRouteName
					});
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async archiveCollection(collection) {
			if (!this.canManageCollectionPermissions(collection)) {
				return;
			}
			const confirmed = await this.#dialog.confirm(this.#messages.confirmDeleteCollection, this.#messages.confirmDeleteCollectionTitle, this.#messages.delete);
			if (!confirmed) {
				return;
			}
			try {
				const collectionId = Number(collection.id);
				await this.#api.archiveCollection(collectionId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
				this.#store.actions.removeCollectionLocal(collectionId);
				delete this.#uiState.expandedCollections[collectionId];
				if (collectionId === this.#store.state.selectedCollectionId.value) {
					this.#store.actions.clearSelection();
				}
				if (shouldLeaveDocumentPage) {
					await this.#router?.replace({
						name: this.#homeRouteName
					});
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
	}

	function openPickCollectionPopup(options) {
		const api = options?.api;
		const store = options?.store;
		const canCreateCollection = Boolean(options?.canCreateCollection);
		const onFail = main_core.Type.isFunction(options?.onFail) ? options.onFail : () => {};
		return note_ui_collectionPicker.openCollectionPicker({
			title: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TITLE') || '',
			description: canCreateCollection ? main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT_WITH_CREATE') || '' : main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT') || '',
			placeholder: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PLACEHOLDER') || '',
			primaryLabel: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PRIMARY') || '',
			cancelLabel: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_CANCEL') || '',
			canCreateCollection,
			createFooterLabel: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_FOOTER_CREATE') || '',
			onCreateCollection: async name => {
				try {
					const created = await api.createCollection(name);
					const id = Number(created?.id);
					if (!Number.isInteger(id) || id <= 0) {
						return null;
					}
					const collectionName = String(created?.name || name);
					if (store && store.actions && main_core.Type.isFunction(store.actions.insertCollectionLocal)) {
						const maxPosition = (store.state?.collections?.value || []).reduce((max, item) => Math.max(max, Number(item?.position || 0)), 0);
						store.actions.insertCollectionLocal({
							id,
							name: collectionName,
							position: Number(created?.position || maxPosition + 1),
							canEditCollection: true,
							canManagePermissions: true
						});
					}
					return {
						id,
						title: collectionName
					};
				} catch (error) {
					onFail(error);
					return null;
				}
			}
		});
	}

	class DocumentUseCases {
		#api;
		#dialog;
		#store;
		#uiState;
		#messages;
		#onFail;
		#router;
		#documentRouteName;
		#homeRouteName;
		#workspaceRouteName;
		#isDragging;
		#getRouteDocumentContext;
		#reloadRouteDocumentContext;
		#openingDocumentId = 0;
		#handleExternalDocRenamed;
		#handleExternalDocExcerptChanged;
		#handleExternalFavoriteChanged;
		#handleExternalNotifyChanged;
		#handleBulkDocumentsRestored;
		#handleBulkDocumentsChanged;
		#prefetchTimer = null;
		constructor({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			router,
			routeNames = {},
			isDragging = () => false,
			getRouteDocumentContext,
			reloadRouteDocumentContext = null
		}) {
			this.#api = api;
			this.#dialog = dialog;
			this.#store = store;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#onFail = onFail;
			this.#router = router;
			this.#documentRouteName = routeNames.document || 'document';
			this.#homeRouteName = routeNames.home || 'home';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#isDragging = isDragging;
			this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
			this.#reloadRouteDocumentContext = reloadRouteDocumentContext;
			this.#handleExternalDocRenamed = event => {
				const {
					id,
					title,
					collectionId
				} = event.getData();
				this.#store.actions.updateDocumentLocal(Number(id), {
					title
				}, {
					collectionId: Number(collectionId)
				});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleExternalDocRenamed);

			// The editor has just materialized the text and brought back its card preview: adopt it in the
			// loaded branches instead of asking for the list again. An empty string is the preview of a document
			// whose text was deleted, so the type decides whether to patch, not the truthiness.
			this.#handleExternalDocExcerptChanged = event => {
				const {
					documentId,
					collectionId,
					excerpt
				} = event?.getData?.() ?? {};
				if (typeof excerpt !== 'string') {
					return;
				}
				this.#store.actions.updateDocumentLocal(Number(documentId), {
					excerpt
				}, {
					collectionId: Number(collectionId)
				});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENT_EXCERPT_CHANGED, this.#handleExternalDocExcerptChanged);

			// A star pressed outside the sidebar (activity line of the editor, knowledge base page): adopt the
			// flag now instead of waiting for the pull round-trip, the same way a rename is adopted.
			this.#handleExternalFavoriteChanged = event => {
				this.#store.actions.applyExternalFavorite(event.getData() || {});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.FAVORITE_CHANGED, this.#handleExternalFavoriteChanged);

			// Same for the bell: pressed in the editor or on the knowledge base page, it has to reach the row
			// of the block now rather than on the pull round-trip.
			this.#handleExternalNotifyChanged = event => {
				this.#store.actions.applyExternalNotify(event?.getData?.() ?? {});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.SUBSCRIPTION_CHANGED, this.#handleExternalNotifyChanged);
			this.#handleBulkDocumentsRestored = async event => {
				const data = event.getData() || {};
				const restoredCollections = Array.isArray(data.restoredCollections) ? data.restoredCollections : [];
				restoredCollections.forEach(collection => this.#ensureCollectionInStore(collection));
				await this.#refreshLoadedBranches();
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENTS_BULK_RESTORED, this.#handleBulkDocumentsRestored);
			this.#handleBulkDocumentsChanged = async () => {
				// Bulk archive/delete/move on the workspace page: same broad refresh as a
				// restore — the initiator never receives the corresponding pull payload.
				await this.#refreshLoadedBranches();
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENTS_BULK_CHANGED, this.#handleBulkDocumentsChanged);
		}

		// Every subscription of the constructor, undone. The sidebar is mounted more than once in a session,
		// and these listeners are global: one left behind keeps the store of the dead mount alive and goes on
		// answering into it, so a single star pressed elsewhere costs a reactive update - and, for the bulk
		// events, a full re-read of every loaded branch - once per mount there has ever been.
		destroy() {
			clearTimeout(this.#prefetchTimer);
			this.#prefetchTimer = null;
			main_core_events.EventEmitter.unsubscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleExternalDocRenamed);
			main_core_events.EventEmitter.unsubscribe(NoteEvent.DOCUMENT_EXCERPT_CHANGED, this.#handleExternalDocExcerptChanged);
			main_core_events.EventEmitter.unsubscribe(NoteEvent.FAVORITE_CHANGED, this.#handleExternalFavoriteChanged);
			main_core_events.EventEmitter.unsubscribe(NoteEvent.SUBSCRIPTION_CHANGED, this.#handleExternalNotifyChanged);
			main_core_events.EventEmitter.unsubscribe(NoteEvent.DOCUMENTS_BULK_RESTORED, this.#handleBulkDocumentsRestored);
			main_core_events.EventEmitter.unsubscribe(NoteEvent.DOCUMENTS_BULK_CHANGED, this.#handleBulkDocumentsChanged);
		}

		// Invalidate every hydrated branch and eagerly reload the expanded collections so the
		// user sees the new tree state without having to re-interact.
		async #refreshLoadedBranches() {
			this.#store.actions.invalidateAllChildren();
			const expandedCollectionIds = Object.keys(this.#uiState.expandedCollections).filter(id => this.#uiState.expandedCollections[id]).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
			await Promise.all(expandedCollectionIds.map(id => this.#store.actions.ensureChildrenLoaded(id, null)));
		}
		canEditDocument(doc) {
			const collectionId = Number(doc?.collectionId);
			return this.#canEditCollection(collectionId);
		}
		canManageDocument(doc) {
			const collectionId = Number(doc?.collectionId);
			if (this.#canEditCollection(collectionId)) {
				return true;
			}

			// archived/shared docs: collection isn't in sidebar store, trust the per-doc flag from backend
			return Boolean(doc?.canEditCollection);
		}
		canManageDocumentPermissions(doc) {
			const collectionId = Number(doc?.collectionId);
			return this.#canManagePermissionsInCollection(collectionId);
		}

		// [P2] Accessible-tree ("Shared with me") section. DnD is forced off here; TreeNode couples the
		// create-child affordance to the same canManage gate, so with DnD off create-child is off in this
		// section too — a deliberate trade-off since TreeNode must stay untouched (only props change).
		async toggleSharedSection() {
			await this.#store.actions.toggleSharedSection();
		}
		async ensureSharedLoaded() {
			await this.#store.actions.ensureSharedLoaded();
		}
		async loadMoreSharedTree() {
			await this.#store.actions.loadMoreSharedTree();
		}
		toggleSharedDoc(doc) {
			this.#store.actions.toggleSharedDocExpanded(doc);
		}
		toggleSharedContainer(collectionId) {
			this.#store.actions.toggleSharedContainer(collectionId);
		}

		// Same debounce as prefetchDocumentChildren: a hover across the tree must not fire a request
		// per row, and an already-loaded branch is served from the namespace.
		prefetchSharedDocumentChildren(doc) {
			clearTimeout(this.#prefetchTimer);
			if (!doc) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			const parentId = Number(doc.id);
			const hasLoadedChildren = this.#store.queries.getSharedChildren(collectionId, parentId).length > 0;
			if (!doc.hasChildren && !hasLoadedChildren) {
				return;
			}
			this.#prefetchTimer = setTimeout(() => {
				void this.#store.actions.prefetchSharedChildren(doc);
			}, 300);
		}
		async loadMoreSharedChildren(doc) {
			await this.#store.actions.loadMoreSharedChildren(doc);
		}
		async openDocument(doc) {
			const documentId = Number(doc.id);
			if (!Number.isInteger(documentId) || documentId <= 0) {
				return;
			}
			if (this.#openingDocumentId === documentId) {
				return;
			}
			if (this.#getRouteDocumentId() === documentId) {
				return;
			}
			this.#openingDocumentId = documentId;
			try {
				await this.#router.push({
					name: this.#documentRouteName,
					params: {
						id: documentId
					}
				});
			} finally {
				if (this.#openingDocumentId === documentId) {
					this.#openingDocumentId = 0;
				}
			}
		}
		prefetchDocumentChildren(doc) {
			clearTimeout(this.#prefetchTimer);
			if (!doc || this.#isDragging()) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			const parentId = Number(doc.id);
			const hasLoadedChildren = this.#store.queries.getChildren(collectionId, parentId).length > 0;
			if (!doc.hasChildren && !hasLoadedChildren) {
				return;
			}
			this.#prefetchTimer = setTimeout(() => {
				this.#store.actions.prefetchChildren(collectionId, parentId);
			}, 300);
		}
		async toggleDoc(doc) {
			await this.#store.actions.toggleDocExpanded(doc);
		}
		async loadMoreChildren(doc) {
			await this.#store.actions.loadDocuments(Number(doc.collectionId), doc.id === null || doc.id === undefined ? null : Number(doc.id), true);
		}
		async createDocument() {
			const collectionId = this.#store.state.selectedCollectionId.value;
			if (!collectionId) {
				return;
			}
			if (!this.#canEditCollection(collectionId)) {
				return;
			}
			await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
		}
		async createDocumentFromSidebar() {
			try {
				const {
					items,
					hasMore
				} = await this.#api.listManageableCollections(2);
				if (Array.isArray(items) && items.length === 1 && !hasMore) {
					await this.#createDocumentInCollection(Number(items[0].id));
					return;
				}
				const canCreateCollection = Boolean(this.#store.state.globalPermissions?.canEditCollections);
				const picked = await openPickCollectionPopup({
					api: this.#api,
					store: this.#store,
					canCreateCollection,
					onFail: this.#onFail
				});
				if (!picked) {
					return;
				}
				await this.#createDocumentInCollection(Number(picked.collectionId));
			} catch (error) {
				this.#onFail(error);
			}
		}
		async #createDocumentInCollection(collectionId) {
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			await this.#store.actions.selectCollection(collectionId);
			this.#uiState.expandedCollections[collectionId] = true;
			await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
		}
		async createDocumentForCollection(collection) {
			if (!collection) {
				return;
			}
			if (!this.#canEditCollection(Number(collection.id))) {
				return;
			}
			await this.#store.actions.selectCollection(collection.id);
			this.#uiState.expandedCollections[Number(collection.id)] = true;
			await this.confirmCreateDocument(Number(collection.id), null, this.#messages.promptDocumentName);
		}
		async createChildDocument(doc) {
			if (!doc) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			if (!this.#canEditCollection(collectionId)) {
				return;
			}
			const parentId = Number(doc.id);
			this.#store.state.expandedDocs[parentId] = true;
			await this.confirmCreateDocument(collectionId, parentId, this.#messages.promptDocumentName);
		}
		async confirmCreateDocument(collectionId, parentId, title) {
			if (!title) {
				return;
			}
			try {
				const doc = await this.#api.createDocument(collectionId, title, parentId);
				const nextPosition = this.#store.queries.getChildren(collectionId, parentId).length + 1;
				// The list as it stands before the row joins it: the rows under the place it takes have a row of
				// height to give up, and the section a row of height to grow by. Left to the render alone, both
				// happened in a single frame.
				const arrival = captureRowArrival(parentId);
				const insertedDoc = this.#store.actions.insertDocumentLocal({
					...doc,
					collectionId,
					parentId,
					title,
					position: Number(doc?.position || nextPosition),
					hasChildren: Boolean(doc?.hasChildren ?? false)
				}, {
					forceCreateBranch: true
				});
				arrival?.play();
				markSectionMotion(document.querySelector('.sidebar'));
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
					data: {
						id: Number(insertedDoc?.id || doc?.id),
						title,
						collectionId
					}
				}));
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (Number(insertedDoc?.id) > 0) {
					await this.openDocument(insertedDoc);
					const routeContext = this.#getRouteDocumentContext();
					if (routeContext) {
						routeContext.autoEdit = true;
					}
				}
			} catch (error) {
				this.#onFail(error);
			}
		}

		// Standalone from confirmCreateDocument: throws on failure so the caller (file drop
		// service) can keep processing the rest of a multi-file set without a shared onFail.
		async createDocumentFromMarkdownFile(collectionId, parentId, title, markdown, {
			open = false
		} = {}) {
			if (parentId !== null) {
				this.#store.state.expandedDocs[parentId] = true;
			} else {
				this.#uiState.expandedCollections[collectionId] = true;
			}
			const doc = await this.#api.createDocument(collectionId, title, parentId, markdown);
			const nextPosition = this.#store.queries.getChildren(collectionId, parentId).length + 1;
			const insertedDoc = this.#store.actions.insertDocumentLocal({
				...doc,
				collectionId,
				parentId,
				title,
				position: Number(doc?.position || nextPosition),
				hasChildren: Boolean(doc?.hasChildren ?? false)
			}, {
				forceCreateBranch: true
			});
			main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
				data: {
					id: Number(insertedDoc?.id || doc?.id),
					title,
					collectionId
				}
			}));
			if (parentId !== null) {
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
					data: {
						parentId,
						collectionId
					}
				}));
			}
			if (open && Number(insertedDoc?.id) > 0) {
				await this.openDocument(insertedDoc);
				const routeContext = this.#getRouteDocumentContext();
				if (routeContext) {
					routeContext.autoEdit = true;
				}
			}
			return insertedDoc;
		}
		renameDocument(doc) {
			if (!this.canEditDocument(doc)) {
				return;
			}
			this.#uiState.renamingDocId = Number(doc.id);
		}
		async confirmRenameDocument(docId, newTitle, collectionId) {
			this.#uiState.renamingDocId = null;
			if (!newTitle) {
				return;
			}
			try {
				await this.#api.updateDocument(Number(docId), newTitle);
				note_analytics.NoteAnalytics.documentUpdated(true);
				this.#store.actions.updateDocumentLocal(Number(docId), {
					title: newTitle
				}, {
					collectionId: Number(collectionId)
				});
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
					data: {
						id: Number(docId),
						title: newTitle,
						collectionId: Number(collectionId)
					}
				}));
			} catch (error) {
				note_analytics.NoteAnalytics.documentUpdated(false);
				this.#onFail(error);
			}
		}
		cancelRenameDocument() {
			this.#uiState.renamingDocId = null;
		}
		async restoreDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}
			const documentId = Number(doc.id);
			if (!Number.isInteger(documentId) || documentId <= 0) {
				return;
			}
			try {
				const restored = await this.#api.restoreDocument(documentId);
				if (restored && Number(restored.id) > 0) {
					this.#ensureCollectionInStore(restored.restoredCollection);
					const restoredDoc = {
						...restored,
						id: Number(restored.id),
						collectionId: Number(restored.collectionId),
						parentId: restored.parentId === null || restored.parentId === undefined || restored.parentId === '' ? null : Number(restored.parentId),
						title: String(restored.title ?? doc.title ?? ''),
						position: Number(restored.position ?? doc.position ?? 0),
						hasChildren: Boolean(restored.hasChildren ?? doc.hasChildren ?? false),
						isArchived: false
					};
					const inserted = this.#store.actions.insertDocumentLocal(restoredDoc, {
						forceCreateBranch: true
					});

					// Expand the collection and ancestor chain so the restored doc is visible.
					this.#uiState.expandedCollections[restoredDoc.collectionId] = true;
					let ancestorId = restoredDoc.parentId;
					const visited = new Set();
					while (Number.isInteger(ancestorId) && ancestorId > 0 && !visited.has(ancestorId)) {
						visited.add(ancestorId);
						this.#store.state.expandedDocs[ancestorId] = true;
						const ancestorDoc = this.#store.queries.findLoadedDocument(restoredDoc.collectionId, ancestorId);
						ancestorId = ancestorDoc?.parentId === null || ancestorDoc?.parentId === undefined ? null : Number(ancestorDoc.parentId);
					}
					if (restoredDoc.parentId !== null) {
						main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
							data: {
								parentId: restoredDoc.parentId,
								collectionId: restoredDoc.collectionId
							}
						}));
					}
					if (inserted) {
						main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
							data: {
								id: restoredDoc.id,
								title: restoredDoc.title,
								collectionId: restoredDoc.collectionId
							}
						}));
					}
				}
				if (this.#getRouteDocumentId() === documentId && this.#reloadRouteDocumentContext) {
					await this.#reloadRouteDocumentContext();
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async archiveDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}

			// Offer the "with nested" choice only when the node actually has children; the
			// checkbox defaults to ON (cascade), unchecking it lifts the children one level up.
			const hasChildren = this.#resolveHasChildren(doc);
			const {
				confirmed,
				withNested
			} = await this.#dialog.confirmArchive({
				message: this.#messages.confirmArchiveDocument,
				title: this.#messages.confirmArchiveDocumentTitle,
				confirmText: this.#messages.archiveConfirm,
				offerNested: hasChildren,
				nestedLabel: this.#messages.archiveWithNested,
				nestedDefault: true
			});
			if (!confirmed) {
				return;
			}
			try {
				await this.#api.archiveDocument(Number(doc.id), withNested);
				const collectionId = Number(doc.collectionId);
				const parentId = this.#toNullableInt(doc.parentId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
				this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));

				// Without cascade the direct children were re-hung onto this node's parent
				// (grandparent, or root when parentId is null) — refetch that branch so they resurface.
				if (!withNested && hasChildren) {
					this.#store.actions.invalidateBranch(collectionId, parentId);
					await this.#store.actions.loadDocuments(collectionId, parentId, false);
				}
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (shouldLeaveDocumentPage) {
					await this.#redirectAfterDocumentRemoval(collectionId);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async deleteDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}

			// Offer the "with nested" choice only when the node actually has children; the
			// checkbox defaults to ON (cascade), unchecking it lifts the children one level up.
			const hasChildren = this.#resolveHasChildren(doc);
			const {
				confirmed,
				withNested
			} = await this.#dialog.confirmDelete({
				message: this.#messages.confirmDeleteDocument,
				title: this.#messages.confirmDeleteDocumentTitle,
				confirmText: this.#messages.delete,
				offerNested: hasChildren,
				nestedLabel: this.#messages.deleteWithNested,
				nestedDefault: true
			});
			if (!confirmed) {
				return;
			}
			try {
				await this.#api.deleteDocument(Number(doc.id), withNested);
				const collectionId = Number(doc.collectionId);
				const parentId = this.#toNullableInt(doc.parentId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
				this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));

				// Without cascade the direct children were re-hung onto this node's parent
				// (grandparent, or root when parentId is null) — refetch that branch so they resurface.
				if (!withNested && hasChildren) {
					this.#store.actions.invalidateBranch(collectionId, parentId);
					await this.#store.actions.loadDocuments(collectionId, parentId, false);
				}
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (shouldLeaveDocumentPage) {
					await this.#redirectAfterDocumentRemoval(collectionId);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async #redirectAfterDocumentRemoval(collectionId) {
			this.#store.actions.clearDocumentSelection();
			const targetRoute = this.#findCollection(collectionId) ? {
				name: this.#workspaceRouteName,
				params: {
					id: collectionId
				}
			} : {
				name: this.#homeRouteName
			};
			await this.#router.replace(targetRoute);
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}

		// The `get` bootstrap payload (a document already loaded in the sidebar tree) omits
		// hasChildren, while getOpenContext includes it. Trust an explicit boolean on the doc,
		// otherwise fall back to the sidebar store, which carries the flag from list/tree responses.
		#resolveHasChildren(doc) {
			if (typeof doc?.hasChildren === 'boolean') {
				return doc.hasChildren;
			}
			const stored = this.#store.queries.findLoadedDocumentAnywhere(Number(doc?.id));
			return Boolean(stored?.hasChildren);
		}
		#getRouteDocumentId() {
			const route = this.#router?.currentRoute?.value;
			if (!route || route.name !== this.#documentRouteName) {
				return 0;
			}
			const docId = Number(route.params?.id);
			return Number.isInteger(docId) && docId > 0 ? docId : 0;
		}
		#isRouteDocumentInSubtree(rootDocId, collectionId) {
			const normalizedRootId = Number(rootDocId);
			const normalizedCollectionId = Number(collectionId);
			const routeDocId = this.#getRouteDocumentId();
			if (!Number.isInteger(normalizedRootId) || normalizedRootId <= 0 || !Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0 || routeDocId <= 0) {
				return false;
			}
			if (routeDocId === normalizedRootId) {
				return true;
			}
			const routeContext = this.#getRouteDocumentContext();
			const routeDoc = routeContext?.document ?? null;
			if (!routeDoc || Number(routeDoc.collectionId) !== normalizedCollectionId) {
				return false;
			}
			const visited = new Set([routeDocId]);
			let parentId = this.#toNullableInt(routeDoc.parentId);
			while (parentId !== null && Number.isInteger(parentId) && parentId > 0 && !visited.has(parentId)) {
				if (parentId === normalizedRootId) {
					return true;
				}
				visited.add(parentId);
				const parent = this.#store.queries.findLoadedDocument(normalizedCollectionId, parentId);
				if (!parent) {
					return false;
				}
				parentId = this.#toNullableInt(parent.parentId);
			}
			return false;
		}
		#ensureCollectionInStore(restoredCollection) {
			if (!main_core.Type.isPlainObject(restoredCollection)) {
				return;
			}
			const collectionId = Number(restoredCollection.id);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			if (this.#findCollection(collectionId)) {
				return;
			}
			this.#store.actions.insertCollectionLocal({
				...restoredCollection,
				id: collectionId
			});

			// Restored collections must appear collapsed so the user doesn't see
			// an expanded node with no loaded children until hover triggers prefetch.
			delete this.#uiState.expandedCollections[collectionId];
		}
		#findCollection(collectionId) {
			const normalizedCollectionId = Number(collectionId);
			if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0) {
				return null;
			}
			return this.#store.state.collections.value.find(item => Number(item.id) === normalizedCollectionId) ?? null;
		}
		#canEditCollection(collectionId) {
			return Boolean(this.#findCollection(collectionId)?.canEditCollection);
		}
		#canManagePermissionsInCollection(collectionId) {
			return Boolean(this.#findCollection(collectionId)?.canManagePermissions);
		}
	}

	function sortDocuments(docs) {
		return [...docs].sort((a, b) => {
			const leftPos = Number(a?.position || 0);
			const rightPos = Number(b?.position || 0);
			if (leftPos !== rightPos) {
				return rightPos - leftPos;
			}
			return Number(b?.id || 0) - Number(a?.id || 0);
		});
	}
	function normalizeDocumentForStore(doc, normalizeParentId, fallback = {}) {
		const id = Number(doc?.id ?? fallback.id ?? 0);
		const collectionId = Number(doc?.collectionId ?? fallback.collectionId ?? 0);
		const parentIdValue = doc?.parentId ?? fallback.parentId;
		const parentId = normalizeParentId(parentIdValue);
		if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(collectionId) || collectionId <= 0) {
			return null;
		}
		return {
			...doc,
			id,
			collectionId,
			parentId,
			title: String(doc?.title ?? fallback.title ?? ''),
			position: Number.isFinite(Number(doc?.position)) ? Number(doc.position) : Number.isFinite(Number(fallback.position)) ? Number(fallback.position) : 0,
			hasChildren: Boolean(doc?.hasChildren ?? fallback.hasChildren ?? false),
			isArchived: Boolean(doc?.isArchived ?? fallback.isArchived ?? false)
		};
	}

	const PAGE_SIZE$1 = 50;

	// Debounce window for every re-read an access push asks for — collapses bursts of ACL updates on the
	// same collection (or list-invalidations during a multi-step admin operation) and adds random jitter
	// to desynchronise reconnecting clients. Shared by the readers of those pushes: the collection tree
	// and the favorites block answer the same signals.
	const REFRESH_DEBOUNCE_MIN_MS = 80;
	const REFRESH_DEBOUNCE_JITTER_MS = 220;

	// Safety net for a page that came back empty with a live cursor: the section renders nothing then,
	// so the scroll sentinel can never come into view and paging would stop for good. The server already
	// walks such pages itself; this bounds the walk on the client for whatever is left past its cap.
	const EMPTY_PAGE_WALK_LIMIT = 10;

	// The SECTION walk is short because it is no longer the only way forward: its sentinel is watched
	// for visibility, so an empty section keeps paging by itself, one request at a time, for as long as
	// it is on screen. Reaching a distant first branch is therefore a matter of time rather than of this
	// limit — and each round here multiplies with the server's own page cap, so a burst is pure cost.
	const SECTION_EMPTY_PAGE_WALK_LIMIT = 2;

	// [P2] Accessible-tree ("Shared with me") section: lazy-loaded, pull-refreshed pruned tree of
	// documents reachable via document-level grants only. Lives in its own branch namespace
	// (sharedDocsByParent, keyed via sharedKey/sharedRootKey) so TreeNode.getChildren reads the
	// accessible branch without ever mixing with the regular collection tree.
	class SidebarAccessibleTreeActions {
		#api;
		#state;
		#sharedKey;
		#sharedRootKey;
		#setError;
		#onBranchesDropped;
		constructor({
			api,
			state,
			sharedKey,
			sharedRootKey,
			setError,
			onBranchesDropped
		}) {
			this.#api = api;
			this.#state = state;
			this.#sharedKey = sharedKey;
			this.#sharedRootKey = sharedRootKey;
			this.#setError = setError;
			this.#onBranchesDropped = onBranchesDropped ?? (() => {});
		}
		getSharedChildren(collectionId, parentId = null) {
			const key = this.#sharedKey(collectionId, parentId);
			return this.#state.sharedDocsByParent[key] || [];
		}

		// Per-container disclosure — collapsed by default, mirroring the regular collection list.
		isSharedContainerExpanded(collectionId) {
			return this.#state.sharedExpandedContainers[Number(collectionId)] === true;
		}
		toggleSharedContainer(collectionId) {
			const id = Number(collectionId);
			this.#state.sharedExpandedContainers[id] = !this.#state.sharedExpandedContainers[id];
		}

		// Nested branches load per parent, exactly like the collection tree; root branches arrive with
		// the section page and paginate globally, so they never report their own loading/next state.
		isSharedChildrenLoading(collectionId, parentId = null) {
			if (parentId === null) {
				return false;
			}
			return this.#state.sharedDocsLoadingByParent[this.#sharedKey(collectionId, parentId)] === true;
		}
		hasNextSharedChildren(collectionId, parentId = null) {
			if (parentId === null) {
				return false;
			}
			return this.#state.sharedDocsHasNextPageByParent[this.#sharedKey(collectionId, parentId)] === true;
		}

		// Whether the branch has actually been read. The favorites block asks it to tell an empty branch
		// (a valid answer) from a branch whose read failed.
		isSharedBranchHydrated(collectionId, parentId) {
			return this.#state.sharedDocsHydratedByParent[this.#sharedKey(collectionId, parentId)] === true;
		}
		toggleSharedDocExpanded(doc) {
			const docId = Number(doc?.id);
			if (!Number.isFinite(docId) || docId <= 0) {
				return;
			}
			const isNextExpanded = !this.#state.expandedDocs[docId];
			this.#state.expandedDocs[docId] = isNextExpanded;
			if (isNextExpanded) {
				void this.prefetchSharedChildren(doc);
				return;
			}
			this.#clearExpandedBranch(Number(doc?.collectionId), docId);
		}

		// Hover/expand entry point — one request per branch, then served from the namespace.
		async prefetchSharedChildren(doc) {
			const collectionId = Number(doc?.collectionId);
			const parentId = Number(doc?.id);
			if (!Number.isFinite(collectionId) || collectionId <= 0 || !Number.isFinite(parentId) || parentId <= 0) {
				return;
			}
			if (this.#state.sharedDocsHydratedByParent[this.#sharedKey(collectionId, parentId)] === true) {
				return;
			}
			await this.loadSharedChildren(collectionId, parentId, false);
		}
		async loadMoreSharedChildren(doc) {
			const collectionId = Number(doc?.collectionId);
			const parentId = Number(doc?.id);
			if (!Number.isFinite(collectionId) || collectionId <= 0 || !Number.isFinite(parentId) || parentId <= 0) {
				return;
			}
			const key = this.#sharedKey(collectionId, parentId);
			if (this.#state.sharedDocsLoadingByParent[key] === true || this.#state.sharedDocsHasNextPageByParent[key] !== true) {
				return;
			}
			await this.loadSharedChildren(collectionId, parentId, true);
		}
		async loadSharedChildren(collectionId, parentId, append = false) {
			const key = this.#sharedKey(collectionId, parentId);
			// Coalesce concurrent first loads (hover + expand fire together on a click).
			if (!append && this.#state.sharedDocsRequestByParent[key]) {
				await this.#state.sharedDocsRequestByParent[key];
				return;
			}
			const request = this.#loadSharedChildrenRequest(collectionId, parentId, append, key);
			if (append) {
				await request;
				return;
			}
			this.#state.sharedDocsRequestByParent[key] = request;
			try {
				await request;
			} finally {
				if (this.#state.sharedDocsRequestByParent[key] === request) {
					delete this.#state.sharedDocsRequestByParent[key];
				}
			}
		}
		async #loadSharedChildrenRequest(collectionId, parentId, append, key) {
			this.#state.sharedDocsLoadingByParent[key] = true;
			try {
				let cursor = append ? this.#state.sharedDocsCursorByParent[key] || null : null;
				let appendPage = append;
				let walked = 0;

				// Same trap as the section page: a child window emptied by the access filter comes back
				// with a live cursor, and an expanded branch showing nothing produces no scroll, so the
				// sentinel would never fire. Walk it here instead of leaving the branch look childless.
				do {
					const response = await this.#api.listAccessibleChildren(collectionId, parentId, {
						limit: PAGE_SIZE$1,
						cursor
					});
					const merged = appendPage ? this.#mergeSharedDocs(this.#state.sharedDocsByParent[key] || [], response.items) : response.items;
					this.#state.sharedDocsByParent[key] = sortDocuments(merged);
					cursor = response.nextCursor || null;
					this.#state.sharedDocsCursorByParent[key] = cursor;
					this.#state.sharedDocsHasNextPageByParent[key] = response.hasNextPage;
					this.#state.sharedDocsHydratedByParent[key] = true;
					appendPage = true;
					walked++;
				} while (cursor !== null && (this.#state.sharedDocsByParent[key] || []).length === 0 && walked < EMPTY_PAGE_WALK_LIMIT);

				// Detached on purpose: the branch is filled and must stop showing a spinner, its expanded
				// descendants refill behind it.
				void this.#refetchExpandedBranches(this.#state.sharedDocsByParent[key]);
			} catch (error) {
				this.#setError(error?.message || 'Accessible children loading failed');
			} finally {
				this.#state.sharedDocsLoadingByParent[key] = false;
			}
		}

		// A branch that stays expanded across a section reload (pull cascade) must fill itself again:
		// the reload drops every nested branch, and without this the user would stare at an empty
		// disclosure until hovering it. Recursion happens naturally — each restored level restores its
		// own expanded children.
		//
		// One branch at a time: a wide expanded tree would otherwise put every branch on the wire at
		// once on every cascade, and each of those requests can itself walk several server pages.
		async #refetchExpandedBranches(docs) {
			for (const doc of docs) {
				if (this.#state.expandedDocs[Number(doc?.id)] === true) {
					// eslint-disable-next-line no-await-in-loop
					await this.prefetchSharedChildren(doc);
				}
			}
		}
		#mergeSharedDocs(current, incoming) {
			const merged = [...current];
			for (const doc of incoming) {
				const index = merged.findIndex(item => Number(item.id) === Number(doc.id));
				if (index >= 0) {
					merged[index] = {
						...merged[index],
						...doc
					};
					continue;
				}
				merged.push(doc);
			}
			return merged;
		}
		#clearExpandedBranch(collectionId, parentDocId) {
			const children = this.getSharedChildren(collectionId, parentDocId);
			for (const child of children) {
				const childId = Number(child.id);
				delete this.#state.expandedDocs[childId];
				this.#clearExpandedBranch(collectionId, childId);
			}
		}
		async toggleSharedSection() {
			const nextExpanded = !this.#state.sharedSectionExpanded.value;
			this.#state.sharedSectionExpanded.value = nextExpanded;
			if (nextExpanded) {
				await this.ensureSharedLoaded();
			}
		}

		// Lazy entry point: the first expand (or the next expand after a pull marked the set stale)
		// triggers the API-03 request; a collapsed section never touches the network.
		async ensureSharedLoaded() {
			if (this.#state.sharedHydrated.value && !this.#state.sharedStale.value) {
				return;
			}
			await this.loadSharedTree(false);
		}
		async loadMoreSharedTree() {
			if (this.#state.sharedLoading.value || !this.#state.sharedHasNextPage.value || this.#state.sharedCursor.value === null) {
				return;
			}
			await this.loadSharedTree(true);
		}
		async loadSharedTree(append = false) {
			// Coalesce concurrent (re)loads — this is what keeps a double-delivered documentAccessCascade
			// (personal channel path 1 + path 2) from firing two overlapping refetches.
			while (!append && this.#state.sharedRequest) {
				await this.#state.sharedRequest;
				if (!this.#state.sharedStale.value) {
					return;
				}

				// Still stale: the read we waited on had already started when the invalidation landed, so
				// its result is out of date. Loop instead of falling through — with several callers parked
				// here they would otherwise each start a read of their own; this way the first one to wake
				// issues it and the rest park on that one.
			}
			const request = this.#loadSharedTreeRequest(append);
			if (append) {
				await request;
				return;
			}
			this.#state.sharedRequest = request;
			try {
				await request;
			} finally {
				if (this.#state.sharedRequest === request) {
					this.#state.sharedRequest = null;
				}
			}
		}
		async #loadSharedTreeRequest(append) {
			this.#state.sharedLoading.value = true;
			// Snapshotted before the first request goes out: an invalidation that lands while it is in
			// flight makes the response obsolete on arrival, and clearing the flag then would swallow the
			// cascade for good.
			const staleToken = this.#state.sharedStaleToken;
			try {
				let afterCursor = append ? this.#state.sharedCursor.value : null;
				let appendPage = append;
				let walked = 0;
				do {
					const response = await this.#api.listAccessibleTree({
						limit: PAGE_SIZE$1,
						afterCursor
					});
					this.#hydrateAccessibleTree(response, appendPage);
					afterCursor = response.nextCursor || null;
					this.#state.sharedCursor.value = afterCursor;
					this.#state.sharedHasNextPage.value = afterCursor !== null;
					if (walked === 0) {
						// Cleared by the first response only, and only when nothing invalidated the section
						// meanwhile: a pull cascade that lands during the walk must keep the set stale, so
						// the next expand refetches it.
						this.#state.sharedHydrated.value = true;
						if (this.#state.sharedStaleToken === staleToken) {
							this.#state.sharedStale.value = false;
						}
					}
					// Pages after the first one extend the section instead of replacing it, otherwise the
					// walk would wipe the rows it just found.
					appendPage = true;
					walked++;
				} while (afterCursor !== null && this.#state.sharedContainers.value.length === 0 && walked < SECTION_EMPTY_PAGE_WALK_LIMIT);
			} catch (error) {
				this.#setError(error?.message || 'Accessible tree loading failed');
			} finally {
				this.#state.sharedLoading.value = false;
			}
		}

		// Branches a section page carries, in the coordinates of this namespace.
		#pageBranches(containers) {
			const seen = new Set();
			const branches = [];
			for (const container of containers) {
				const collectionId = Number(container?.collectionId);
				if (!Number.isFinite(collectionId) || collectionId <= 0) {
					continue;
				}
				const nodes = Array.isArray(container?.nodes) ? container.nodes : [];
				for (const node of nodes) {
					const raw = node?.parentId ?? null;
					const parentId = raw === null ? null : Number(raw);
					const key = parentId === null ? this.#sharedRootKey(collectionId) : this.#sharedKey(collectionId, parentId);
					if (seen.has(key)) {
						continue;
					}
					seen.add(key);
					branches.push({
						collectionId,
						parentId,
						key
					});
				}
			}
			return branches;
		}

		// A branch and everything that says how much of it has been read. Whoever else is drawing one of
		// them is told in coordinates, not in the keys of this namespace, so an opened row elsewhere
		// refills instead of standing empty.
		#dropBranches(branches) {
			if (branches.length === 0) {
				return;
			}
			for (const {
				key
			} of branches) {
				delete this.#state.sharedDocsByParent[key];
				delete this.#state.sharedDocsHydratedByParent[key];
				delete this.#state.sharedDocsHasNextPageByParent[key];
				delete this.#state.sharedDocsCursorByParent[key];
			}
			this.#onBranchesDropped(branches.map(({
				collectionId,
				parentId
			}) => ({
				collectionId,
				parentId
			})));
		}

		// ALG-F1 (NORMATIVE): lay the API-03 response into the branch namespace. The endpoint returns
		// branch roots (parentId===null -> sharedRootKey); the sharedKey path stays as a safety net for
		// a node that still arrives with a parent.
		#hydrateAccessibleTree(response, append) {
			const containers = Array.isArray(response?.containers) ? response.containers : [];
			if (!append) {
				// Only the branches this page re-reads are dropped. This namespace is not the section's
				// private copy: the favorites block opens branches of shared documents straight out of it,
				// and a branch is the same branch wherever it is drawn. Dropping all of it took the rows
				// out from under a block that was showing them and left an opened row empty.
				this.#dropBranches(this.#pageBranches(containers));
				this.#state.sharedContainers.value = [];
			}
			const seenContainers = new Set(this.#state.sharedContainers.value.map(container => Number(container.collectionId)));
			const nextContainers = [...this.#state.sharedContainers.value];
			const touchedKeys = new Set();
			for (const container of containers) {
				const collectionId = Number(container?.collectionId);
				if (!Number.isFinite(collectionId) || collectionId <= 0) {
					continue;
				}
				if (!seenContainers.has(collectionId)) {
					seenContainers.add(collectionId);
					nextContainers.push({
						collectionId,
						title: String(container?.title ?? '')
					});
				}
				const nodes = Array.isArray(container?.nodes) ? container.nodes : [];
				for (const node of nodes) {
					const parentId = node?.parentId ?? null;
					const parentKey = parentId === null ? this.#sharedRootKey(collectionId) : this.#sharedKey(collectionId, Number(parentId));
					if (!touchedKeys.has(parentKey)) {
						touchedKeys.add(parentKey);
						if (!append || !Array.isArray(this.#state.sharedDocsByParent[parentKey])) {
							this.#state.sharedDocsByParent[parentKey] = [];
						}
					}
					const bucket = this.#state.sharedDocsByParent[parentKey];
					if (!bucket.some(item => Number(item.id) === Number(node.id))) {
						bucket.push(node);
					}
				}
			}
			const expandedCandidates = [];
			for (const key of touchedKeys) {
				this.#state.sharedDocsByParent[key] = sortDocuments(this.#state.sharedDocsByParent[key]);
				expandedCandidates.push(...(this.#state.sharedDocsByParent[key] || []));
			}
			this.#state.sharedContainers.value = nextContainers;

			// One serial chain over every touched branch, not one per branch: a cascade on a wide tree
			// would otherwise put the whole section on the wire at once.
			void this.#refetchExpandedBranches(expandedCandidates);
		}

		// [P2.T3 / EVENT-01] Pull cascade of a document-level ACL change. Arrives on the personal
		// channel (the receiver has no collection VIEW, so no NOTE_COLLECTION_* watch). A collapsed
		// section only marks itself stale — the refetch is deferred to the next expand (lazy). Both
		// the documentIds and requestRefetch shapes reload just the section, never the whole sidebar:
		// API-03 is a single flat-paginated endpoint, so a surgical per-branch refetch is not possible.
		applyDocumentAccessCascade(params) {
			if (!params || typeof params !== 'object') {
				return;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return;
			}

			// A grant narrowed on an ancestor takes its descendants out of the tree while the ancestor
			// itself stays a branch root, so the nested branches must be re-read, not just the page.
			this.#invalidateSection(true);
		}

		// Tree events that arrive on the personal channel carry sharedScope and are applied in place,
		// exactly like the collection tree applies its own pull events — a rename or a new child must
		// not cost a section reload. Only changes that can move a branch ROOT in or out of the
		// accessible set fall back to a refetch: roots are derived server-side (a granted node whose
		// parent is outside the set), so no local patch can place them correctly.
		applySharedDocumentUpdate(params) {
			const documentId = Number(params?.documentId);
			const title = typeof params?.title === 'string' ? params.title : '';
			if (!Number.isFinite(documentId) || documentId <= 0 || title === '') {
				return false;
			}
			let patched = false;
			for (const docs of Object.values(this.#state.sharedDocsByParent)) {
				const index = docs.findIndex(doc => Number(doc.id) === documentId);
				if (index < 0) {
					continue;
				}

				// Title never affects ordering (position does), so the branch keeps its sort.
				docs[index] = {
					...docs[index],
					title
				};
				patched = true;
			}
			return patched;
		}

		// documentCreate / documentRestore: a node appears inside an already granted subtree.
		applySharedDocumentUpsert(params) {
			const documentId = Number(params?.documentId);
			const collectionId = Number(params?.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0 || !Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			const parentId = params?.parentId == null ? null : Number(params.parentId);
			if (parentId === null || !Number.isFinite(parentId) || parentId <= 0) {
				this.#invalidateSection();
				return true;
			}

			// The parent's disclosure must appear even when its branch has never been opened.
			this.#patchSharedDocument(parentId, {
				hasChildren: true
			});
			const key = this.#sharedKey(collectionId, parentId);
			if (this.#state.sharedDocsHydratedByParent[key] !== true) {
				// Branch not opened yet — the fetch happens on expand, the disclosure above is enough.
				return true;
			}
			const bucket = this.#state.sharedDocsByParent[key] || [];
			const node = {
				id: documentId,
				collectionId,
				parentId,
				position: Number.isFinite(Number(params?.position)) ? Number(params.position) : 0,
				title: typeof params?.title === 'string' ? params.title : '',
				hasChildren: params?.hasChildren === true
			};
			const index = bucket.findIndex(item => Number(item.id) === documentId);
			const merged = [...bucket];
			if (index >= 0) {
				merged[index] = {
					...merged[index],
					...node
				};
			} else {
				merged.push(node);
			}
			this.#state.sharedDocsByParent[key] = sortDocuments(merged);
			return true;
		}

		// documentArchive / documentDelete / collectionArchive / collectionDelete: the ids leave the
		// accessible tree. The payload carries whole subtrees, so descendants arrive with their root.
		applySharedDocumentRemoval(params) {
			const collectionId = Number(params?.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			if (params?.requestRefetch === true) {
				// Too many ids to name, so what left the tree is unknown: the nested branches are as
				// suspect as the page.
				this.#invalidateSection(true);
				return true;
			}
			const documentIds = Array.isArray(params?.documentIds) ? params.documentIds : [];
			if (documentIds.length === 0) {
				return false;
			}
			const orphanedParents = new Set();
			let removed = false;
			let rootRemoved = false;
			const rootKey = this.#sharedRootKey(collectionId);
			for (const rawId of documentIds) {
				const documentId = Number(rawId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					continue;
				}
				for (const [key, docs] of Object.entries(this.#state.sharedDocsByParent)) {
					const index = docs.findIndex(doc => Number(doc.id) === documentId);
					if (index < 0) {
						continue;
					}
					const parentId = docs[index].parentId == null ? null : Number(docs[index].parentId);
					this.#state.sharedDocsByParent[key] = docs.filter(doc => Number(doc.id) !== documentId);
					removed = true;
					if (key === rootKey) {
						rootRemoved = true;
					} else if (parentId !== null && parentId > 0) {
						orphanedParents.add(parentId);
					}
				}

				// The removed node may have parented a hydrated branch — drop it so a later expand of a
				// restored node does not render children swept together with it.
				this.#dropSharedBranch(collectionId, documentId);
				delete this.#state.expandedDocs[documentId];
			}

			// A parent that just lost its last visible child must lose its disclosure too.
			for (const parentId of orphanedParents) {
				const key = this.#sharedKey(collectionId, parentId);
				if ((this.#state.sharedDocsByParent[key] || []).length === 0) {
					this.#patchSharedDocument(parentId, {
						hasChildren: false
					});
				}
			}
			if (rootRemoved && (this.#state.sharedDocsByParent[rootKey] || []).length === 0) {
				// Container with no accessible roots left is no longer a container.
				this.#state.sharedContainers.value = this.#state.sharedContainers.value.filter(container => Number(container.collectionId) !== collectionId);
				delete this.#state.sharedDocsByParent[rootKey];
			}
			return removed;
		}
		#patchSharedDocument(documentId, patch) {
			for (const docs of Object.values(this.#state.sharedDocsByParent)) {
				const index = docs.findIndex(doc => Number(doc.id) === documentId);
				if (index >= 0) {
					docs[index] = {
						...docs[index],
						...patch
					};
				}
			}
		}
		#dropSharedBranch(collectionId, parentId) {
			const key = this.#sharedKey(collectionId, parentId);
			delete this.#state.sharedDocsByParent[key];
			delete this.#state.sharedDocsHydratedByParent[key];
			delete this.#state.sharedDocsHasNextPageByParent[key];
			delete this.#state.sharedDocsCursorByParent[key];
		}

		// `staleNested` is for the events that can change what a branch HOLDS rather than merely add a
		// root: those have to reach the nested branches too, and the page alone never does.
		#invalidateSection(staleNested = false) {
			this.markSharedStale();
			// Before the page, and regardless of whether this section is on screen: the marks are what make
			// the nested branches re-read at all (see #staleNestedBranches), and they are drawn elsewhere too.
			if (staleNested) {
				this.#staleNestedBranches();
			}
			if (!this.#state.sharedSectionExpanded.value || !this.#state.sharedHydrated.value) {
				// Collapsed or never hydrated — the refetch is deferred to the next expand (lazy).
				return;
			}
			void this.loadSharedTree(false);
		}

		// [EVENT-01] An access change lands on a subtree, not on a page: a descendant can lose the grant
		// it was held by while its parent keeps one of its own. The page re-reads branch ROOTS and drops
		// only the branches it re-reads, so every nested branch stayed hydrated and kept showing a child
		// whose access had just been taken away - here, and in the favorites block, which draws its
		// branches out of this very namespace.
		//
		// Rows are deliberately left in place: what is on screen holds until its replacement arrives, so
		// a branch that is still granted does not blink. Only the hydration marks go - and they are what
		// makes the readers actually go back to the server, because the branch loader is a prefetch and
		// returns at once on a branch it believes it already holds.
		#staleNestedBranches() {
			const branches = [];
			for (const key of Object.keys(this.#state.sharedDocsHydratedByParent)) {
				const coordinates = parseSharedKey(key);
				// Root branches belong to the page and are re-read by it.
				if (coordinates === null || coordinates.parentId === null) {
					continue;
				}
				delete this.#state.sharedDocsHydratedByParent[key];
				branches.push(coordinates);
			}
			if (branches.length > 0) {
				this.#onBranchesDropped(branches);
			}
		}
		markSharedStale() {
			this.#state.sharedStale.value = true;
			this.#state.sharedStaleToken++;
		}
	}

	class SidebarCollectionActions {
		#api;
		#state;
		#setError;
		#setGlobalPermissions;
		#removeBranch;
		#refreshCollectionWatches;
		#patchFavoriteTitle;
		#capabilityRefreshTimers;
		#listRefetchTimer;
		constructor({
			api,
			state,
			setError,
			setGlobalPermissions,
			removeBranch,
			refreshCollectionWatches,
			patchFavoriteTitle = () => false
		}) {
			this.#api = api;
			this.#state = state;
			this.#setError = setError;
			this.#setGlobalPermissions = setGlobalPermissions;
			this.#removeBranch = removeBranch;
			this.#patchFavoriteTitle = patchFavoriteTitle;
			this.#refreshCollectionWatches = typeof refreshCollectionWatches === 'function' ? refreshCollectionWatches : () => {};
			this.#capabilityRefreshTimers = new Map();
			this.#listRefetchTimer = null;
		}
		insertCollectionLocal(collection) {
			if (!collection) {
				return null;
			}
			const normalizedId = Number(collection.id);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return null;
			}
			const nextItem = {
				...collection,
				id: normalizedId,
				name: String(collection.name || ''),
				position: Number.isFinite(Number(collection.position)) ? Number(collection.position) : 0
			};
			this.#state.collections.value = this.#mergeCollections(this.#state.collections.value, [nextItem]);
			return nextItem;
		}
		#sortCollections(items) {
			return [...items].sort((a, b) => {
				const leftPos = Number(a?.position || 0);
				const rightPos = Number(b?.position || 0);
				if (leftPos !== rightPos) {
					return rightPos - leftPos;
				}
				return Number(b?.id || 0) - Number(a?.id || 0);
			});
		}
		#mergeCollections(base, incoming) {
			const byId = new Map();
			for (const item of base) {
				const id = Number(item?.id);
				if (Number.isInteger(id) && id > 0) {
					byId.set(id, item);
				}
			}
			for (const item of incoming) {
				const id = Number(item?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				byId.set(id, byId.has(id) ? {
					...byId.get(id),
					...item
				} : item);
			}
			return this.#sortCollections([...byId.values()]);
		}
		updateCollectionLocal(collectionId, patch = {}) {
			const normalizedId = Number(collectionId);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const index = this.#state.collections.value.findIndex(item => Number(item.id) === normalizedId);
			if (index < 0) {
				return false;
			}
			const next = [...this.#state.collections.value];
			next[index] = {
				...next[index],
				...patch
			};
			this.#state.collections.value = next;
			// The row of the favorites block keeps its own copy of the name (see patchFavoriteTitle).
			this.#patchFavoriteTitle('collection', normalizedId, patch.name);
			return true;
		}
		async applyCollectionCreate() {
			await this.loadCollections(false);
			this.#refreshCollectionWatches();
		}
		applyCollectionDelete(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}
			return this.removeCollectionLocal(collectionId);
		}
		applyCollectionArchive(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}

			// Archived collection lives on under /note/archive/ — lazy-refetch when user opens that view.
			return this.removeCollectionLocal(collectionId);
		}
		applyCollectionRestore(params) {
			if (!params) {
				return null;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return null;
			}
			const inserted = this.insertCollectionLocal({
				id: collectionId,
				name: typeof params.name === 'string' ? params.name : '',
				position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
				policyLevel: Number.isFinite(Number(params.policyLevel)) ? Number(params.policyLevel) : 0
			});
			if (inserted) {
				this.#refreshCollectionWatches();
			}
			return inserted;
		}
		applyCollectionCapabilities(params) {
			const collectionId = Number(params?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			this.#scheduleCapabilityRefresh(collectionId);
		}
		applyCollectionListInvalidated() {
			this.#scheduleListRefetch();
		}
		patchCollectionCapabilities(collectionId, capabilities) {
			const normalizedId = Number(collectionId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof capabilities.policyLevel === 'string') {
				patch.policyLevel = capabilities.policyLevel;
			}
			if (typeof capabilities.canEditCollection === 'boolean') {
				patch.canEditCollection = capabilities.canEditCollection;
			}
			if (typeof capabilities.canManagePermissions === 'boolean') {
				patch.canManagePermissions = capabilities.canManagePermissions;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			return this.updateCollectionLocal(normalizedId, patch);
		}
		#scheduleCapabilityRefresh(collectionId) {
			const existing = this.#capabilityRefreshTimers.get(collectionId);
			if (existing) {
				clearTimeout(existing);
			}
			const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
			const timer = setTimeout(() => {
				this.#capabilityRefreshTimers.delete(collectionId);
				this.#fetchAndApplyCapabilities(collectionId);
			}, delay);
			this.#capabilityRefreshTimers.set(collectionId, timer);
		}
		async #fetchAndApplyCapabilities(collectionId) {
			try {
				const access = await this.#api.getMyCollectionAccess(collectionId);
				if (!access) {
					return;
				}
				if (access.level === 'none') {
					// Lost-access path: collection drops out of the sidebar; /shared/ takes over via list-invalidation.
					this.removeCollectionLocal(collectionId);
					return;
				}
				this.patchCollectionCapabilities(collectionId, {
					policyLevel: access.policyLevel,
					canEditCollection: access.canEditCollection,
					canManagePermissions: access.canManagePermissions
				});
			} catch (error) {
				console.warn('[NOTE PULL SIDEBAR] capability refresh failed', collectionId, error);
			}
		}
		#scheduleListRefetch() {
			if (this.#listRefetchTimer) {
				clearTimeout(this.#listRefetchTimer);
			}
			const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
			this.#listRefetchTimer = setTimeout(() => {
				this.#listRefetchTimer = null;
				this.loadCollections(false).then(() => this.#refreshCollectionWatches()).catch(error => console.warn('[NOTE PULL SIDEBAR] list refetch failed', error));
			}, delay);
		}
		applyCollectionUpdate(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof params.name === 'string') {
				patch.name = params.name;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			return this.updateCollectionLocal(collectionId, patch);
		}
		removeCollectionLocal(collectionId) {
			const normalizedId = Number(collectionId);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const nextCollections = this.#state.collections.value.filter(item => Number(item.id) !== normalizedId);
			if (nextCollections.length === this.#state.collections.value.length) {
				return false;
			}
			this.#state.collections.value = nextCollections;
			this.#state.collectionsCursor.value = null;
			const keyPrefix = `${normalizedId}:`;
			const docIdsToCollapse = [];
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix)) {
					continue;
				}
				if (Array.isArray(docs)) {
					for (const doc of docs) {
						const docId = Number(doc?.id);
						if (Number.isInteger(docId) && docId > 0) {
							docIdsToCollapse.push(docId);
						}
					}
				}
				const [, parentToken] = key.split(':');
				const parentId = parentToken === 'root' ? null : Number(parentToken);
				this.#removeBranch(normalizedId, parentId);
			}
			for (const docId of docIdsToCollapse) {
				delete this.#state.expandedDocs[docId];
			}
			if (this.#state.selectedCollectionId.value === normalizedId) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
			}
			return true;
		}
		moveCollectionLocal(dragId, targetId, placement) {
			const list = this.#state.collections.value.filter(item => Number(item.id) !== dragId);
			const dragItem = this.#state.collections.value.find(item => Number(item.id) === dragId);
			if (!dragItem) {
				return;
			}
			const targetIndex = list.findIndex(item => Number(item.id) === targetId);
			if (targetIndex < 0) {
				return;
			}

			// Synthesise a position above/below the target so the optimistic order matches the
			// upcoming server response. The server returns authoritative values via applyCollectionPositions.
			const beforeItem = placement === 'before' ? list[targetIndex - 1] ?? null : list[targetIndex];
			const afterItem = placement === 'before' ? list[targetIndex] : list[targetIndex + 1] ?? null;
			const beforePos = beforeItem ? Number(beforeItem.position) : null;
			const afterPos = afterItem ? Number(afterItem.position) : null;
			let optimisticPosition;
			if (beforePos !== null && afterPos !== null) {
				optimisticPosition = Math.floor((beforePos + afterPos) / 2);
			} else if (beforePos !== null) {
				optimisticPosition = beforePos - 1;
			} else if (afterPos !== null) {
				optimisticPosition = afterPos + 1;
			} else {
				optimisticPosition = Number(dragItem.position) || 0;
			}
			const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			list.splice(insertIndex, 0, {
				...dragItem,
				position: optimisticPosition
			});
			this.#state.collections.value = this.#sortCollections(list);
			this.#state.collectionsCursor.value = null;
		}
		applyCollectionPositions(entries) {
			if (!Array.isArray(entries) || entries.length === 0) {
				return;
			}
			const patchById = new Map();
			for (const entry of entries) {
				const id = Number(entry?.id);
				const position = Number(entry?.position);
				if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(position)) {
					continue;
				}
				patchById.set(id, position);
			}
			if (patchById.size === 0) {
				return;
			}
			const next = this.#state.collections.value.map(item => {
				const id = Number(item?.id);
				return patchById.has(id) ? {
					...item,
					position: patchById.get(id)
				} : item;
			});
			this.#state.collections.value = this.#sortCollections(next);
		}
		async applyCollectionMove(params) {
			if (!params) {
				return;
			}
			if (params.requestRefetch === true) {
				await this.loadCollections(false);
				return;
			}
			const entries = Array.isArray(params.affectedPositions) ? params.affectedPositions : [];
			if (entries.length > 0) {
				this.applyCollectionPositions(entries);
			}
		}
		async loadCollections(append = false) {
			this.#state.collectionsLoading.value = true;
			try {
				const effectiveAppend = append && this.#state.collectionsCursor.value !== null;
				const cursor = effectiveAppend ? this.#state.collectionsCursor.value : null;
				const response = await this.#api.listCollections({
					limit: PAGE_SIZE$1,
					cursor
				});
				if (this.#setGlobalPermissions && response?.permissions) {
					this.#setGlobalPermissions(response.permissions);
				}
				this.#state.collections.value = this.#mergeCollections(this.#state.collections.value, response.items);
				this.#state.collectionsCursor.value = response.nextCursor;
				this.#state.collectionsHasNextPage.value = response.hasNextPage;
			} catch (error) {
				this.#setError(error?.message || 'Collections loading failed');
			} finally {
				this.#state.collectionsLoading.value = false;
			}
		}
	}

	class SidebarDocumentActions {
		#api;
		#state;
		#queries;
		#keyOf;
		#normalizeParentId;
		#setBranchDocs;
		#removeBranch;
		#setError;
		#patchFavoriteTitle;
		constructor({
			api,
			state,
			queries,
			keyOf,
			normalizeParentId,
			setBranchDocs,
			removeBranch,
			setError,
			patchFavoriteTitle = () => false
		}) {
			this.#api = api;
			this.#state = state;
			this.#queries = queries;
			this.#keyOf = keyOf;
			this.#normalizeParentId = normalizeParentId;
			this.#setBranchDocs = setBranchDocs;
			this.#patchFavoriteTitle = patchFavoriteTitle;
			this.#removeBranch = removeBranch;
			this.#setError = setError;
		}
		invalidateChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}

		// Hard reset for a branch: drop cached docs in addition to cursor/hydration flags.
		// Used by realtime handlers when the server signals a branch needs full refetch.
		invalidateBranch(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			this.#state.docsByParent[key] = [];
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}
		invalidateAllChildren() {
			for (const key of Object.keys(this.#state.docsHydratedByParent)) {
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}

		// Cascade reset for an entire collection — used when a cascade push requests refetch
		// and the loaded sub-branches under the root must also be invalidated.
		invalidateCollectionTree(collectionId) {
			const cid = Number(collectionId);
			if (!Number.isFinite(cid) || cid <= 0) {
				return;
			}
			const prefix = `${cid}:`;
			for (const key of Object.keys(this.#state.docsByParent)) {
				if (!key.startsWith(prefix)) {
					continue;
				}
				this.#state.docsByParent[key] = [];
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}

		// Drop child-branch caches keyed by every id in `parentIds` — used after cascade
		// archive/delete so loaded sub-branches under each removed doc are also flushed.
		invalidateBranchesByParentIds(collectionId, parentIds) {
			const cid = Number(collectionId);
			if (!Number.isFinite(cid) || cid <= 0 || !Array.isArray(parentIds)) {
				return;
			}
			for (const rawId of parentIds) {
				const pid = Number(rawId);
				if (!Number.isFinite(pid) || pid <= 0) {
					continue;
				}
				const key = this.#keyOf(cid, pid);
				if (this.#state.docsByParent[key] === undefined) {
					continue;
				}
				this.#state.docsByParent[key] = [];
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}
		#setParentHasChildren(collectionId, parentId, value) {
			const normalizedParentId = this.#normalizeParentId(parentId);
			if (normalizedParentId === null) {
				return;
			}
			this.#updateDocumentInCollection(collectionId, doc => {
				if (Number(doc.id) !== Number(normalizedParentId) || Boolean(doc.hasChildren) === Boolean(value)) {
					return doc;
				}
				return {
					...doc,
					hasChildren: Boolean(value)
				};
			});
		}
		setParentHasChildrenLocal(collectionId, parentId, value) {
			this.#setParentHasChildren(collectionId, parentId, value);
		}
		insertDocumentLocal(doc, options = {}) {
			const normalized = normalizeDocumentForStore(doc, this.#normalizeParentId);
			if (!normalized) {
				return null;
			}
			const parentId = this.#normalizeParentId(normalized.parentId);
			if (!this.#queries.isBranchLoaded(normalized.collectionId, parentId) && !options.forceCreateBranch) {
				if (parentId !== null) {
					this.#setParentHasChildren(normalized.collectionId, parentId, true);
				}
				return normalized;
			}
			const key = this.#keyOf(normalized.collectionId, parentId);
			const docs = [...(this.#state.docsByParent[key] || [])];
			const existingIndex = docs.findIndex(item => Number(item.id) === Number(normalized.id));
			if (existingIndex >= 0) {
				docs[existingIndex] = {
					...docs[existingIndex],
					...normalized
				};
			} else {
				docs.push(normalized);
			}
			this.#setBranchDocs(normalized.collectionId, parentId, sortDocuments(docs));
			if (parentId !== null) {
				this.#setParentHasChildren(normalized.collectionId, parentId, true);
			}
			return normalized;
		}

		// Applies a documentUpdate push payload to local docs. Idempotent:
		// patches by id across every loaded branch via updateDocumentLocal.
		applyDocumentUpdate(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof params.title === 'string' && params.title !== '') {
				patch.title = params.title;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			const options = Number.isFinite(collectionId) && collectionId > 0 ? {
				collectionId
			} : {};
			return this.updateDocumentLocal(documentId, patch, options);
		}

		// forceCreateBranch is intentionally absent: materialising a collapsed
		// branch from a single sibling would mask the rest until full reload.
		applyDocumentCreate(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			const parentId = this.#normalizeParentId(params.parentId);
			const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
			const title = typeof params.title === 'string' ? params.title : '';
			const hasChildren = params.hasChildren === true;
			const inserted = this.insertDocumentLocal({
				id: documentId,
				collectionId,
				parentId,
				position,
				title,
				hasChildren
			});
			return inserted !== null;
		}

		// Applies a documentRestore push payload. Idempotent:
		// upserts the doc into the loaded branch by id. For Phase 1 wired to
		// DOCUMENT_RESTORE only — Phase 2 will add DOCUMENT_CREATE.
		applyDocumentActive(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			const parentId = this.#normalizeParentId(params.parentId);
			const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
			const title = typeof params.title === 'string' ? params.title : '';
			const hasChildren = params.hasChildren === true;
			const inserted = this.insertDocumentLocal({
				id: documentId,
				collectionId,
				parentId,
				position,
				title,
				hasChildren
			}, {
				forceCreateBranch: true
			});
			return inserted !== null;
		}

		// Applies a documentArchive / documentDelete push payload. Both events
		// share the same "remove these ids from sidebar" shape — only the editor
		// reacts differently (archived vs recycle-bin freeze).
		async applyDocumentRemoval(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			if (params.requestRefetch === true) {
				// Tree-wide invalidate: the cascade may have pruned sub-branches that were already
				// hydrated under collapsed parents — a root-only reset would leave stale child caches.
				this.invalidateCollectionTree(collectionId);
				await this.loadDocuments(collectionId, null, false);
				return true;
			}
			const documentIds = Array.isArray(params.documentIds) ? params.documentIds : null;
			if (!documentIds || documentIds.length === 0) {
				return false;
			}
			let removed = false;
			for (const rawId of documentIds) {
				const documentId = Number(rawId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					continue;
				}
				const located = this.#queries.findLoadedDocumentAnywhere(documentId);
				const parentId = located ? this.#normalizeParentId(located.parentId) : null;
				if (this.removeDocumentLocal(collectionId, parentId, documentId)) {
					removed = true;
				}
			}

			// Each removed doc may itself parent a hydrated branch — drop those caches so a later
			// expand doesn't render documents already swept by the cascade.
			this.invalidateBranchesByParentIds(collectionId, documentIds);
			return removed;
		}

		// Applies a list of {id, position} entries across loaded branches and
		// resorts those branches. Symmetric with applyCollectionPositions.
		applyDocumentPositions(entries) {
			if (!Array.isArray(entries) || entries.length === 0) {
				return false;
			}
			const patchById = new Map();
			for (const entry of entries) {
				const id = Number(entry?.id);
				const position = Number(entry?.position);
				if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(position)) {
					continue;
				}
				patchById.set(id, position);
			}
			if (patchById.size === 0) {
				return false;
			}
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!Array.isArray(docs)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(doc => {
					const id = Number(doc?.id);
					if (!patchById.has(id)) {
						return doc;
					}
					branchChanged = true;
					return {
						...doc,
						position: patchById.get(id)
					};
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = sortDocuments(nextDocs);
				changed = true;
			}
			return changed;
		}

		// Applies a documentMove push payload. Handles two shapes:
		// - requestRefetch=true: fall back to invalidate+reload of both branches.
		// - Standard: optimistic move + applyDocumentPositions for siblings.
		async applyDocumentMove(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const toCollectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0 || !Number.isFinite(toCollectionId) || toCollectionId <= 0) {
				return false;
			}
			const fromCollectionId = Number.isFinite(Number(params.fromCollectionId)) ? Number(params.fromCollectionId) : toCollectionId;
			const toParentId = this.#normalizeParentId(params.parentId);
			const fromParentId = this.#normalizeParentId(params.fromParentId);
			if (params.requestRefetch === true) {
				this.invalidateBranch(fromCollectionId, fromParentId);
				if (fromCollectionId !== toCollectionId || fromParentId !== toParentId) {
					this.invalidateBranch(toCollectionId, toParentId);
				}
				const reloads = [this.loadDocuments(fromCollectionId, fromParentId, false)];
				if (fromCollectionId !== toCollectionId || fromParentId !== toParentId) {
					reloads.push(this.loadDocuments(toCollectionId, toParentId, false));
				}
				await Promise.all(reloads);
				return true;
			}
			const fallbackDoc = {
				id: documentId,
				collectionId: toCollectionId,
				parentId: toParentId,
				position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
				title: typeof params.title === 'string' ? params.title : '',
				hasChildren: Boolean(params.hasChildren)
			};
			const moved = this.moveDocumentLocal({
				docId: documentId,
				fromCollectionId,
				fromParentId,
				toCollectionId,
				toParentId,
				fallbackDoc
			});
			if (Array.isArray(params.affectedPositions) && params.affectedPositions.length > 0) {
				this.applyDocumentPositions(params.affectedPositions);
			}

			// Server tells us authoritatively whether fromParent still has children —
			// covers the case where receiver never loaded that branch, so local
			// `handleParentBecameEmpty` can't decide.
			if (fromParentId !== null && typeof params.fromParentHasChildren === 'boolean') {
				this.#setParentHasChildren(fromCollectionId, fromParentId, params.fromParentHasChildren);
			}
			return moved !== null;
		}
		updateDocumentLocal(docId, patch = {}, options = {}) {
			const normalizedDocId = Number(docId);
			if (!Number.isFinite(normalizedDocId) || normalizedDocId <= 0) {
				return false;
			}
			const normalizedCollectionId = Number(options.collectionId || 0);
			const keyPrefix = normalizedCollectionId > 0 ? `${normalizedCollectionId}:` : '';
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!Array.isArray(docs) || keyPrefix && !key.startsWith(keyPrefix)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(currentDoc => {
					if (Number(currentDoc.id) !== normalizedDocId) {
						return currentDoc;
					}
					branchChanged = true;
					return {
						...currentDoc,
						...patch
					};
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				changed = true;
			}

			// The favorites block reads its own list, so its copy of the title lives outside the branches
			// above - and an object can be in the block while no loaded branch of the tree holds it.
			const favoriteChanged = this.#patchFavoriteTitle('document', normalizedDocId, patch.title);
			return changed || favoriteChanged;
		}
		removeDocumentLocal(collectionId, parentId, docId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedParentId = this.#normalizeParentId(parentId);
			const normalizedDocId = Number(docId);
			if (!Number.isFinite(normalizedCollectionId) || normalizedCollectionId <= 0 || !Number.isFinite(normalizedDocId) || normalizedDocId <= 0) {
				return false;
			}
			const descendants = this.#collectLoadedDescendantIds(normalizedCollectionId, normalizedDocId);
			const idsToDelete = new Set([normalizedDocId, ...descendants]);
			const keyPrefix = `${normalizedCollectionId}:`;
			let removed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				const nextDocs = docs.filter(item => !idsToDelete.has(Number(item.id)));
				if (nextDocs.length === docs.length) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				this.#state.docsOffsetByParent[key] = nextDocs.length;
				removed = true;
			}
			for (const id of idsToDelete) {
				delete this.#state.expandedDocs[id];
				this.#removeBranch(normalizedCollectionId, id);
			}
			if (removed) {
				this.#handleParentBecameEmpty(normalizedCollectionId, normalizedParentId);
			}
			return removed;
		}
		moveDocumentLocal({
			docId,
			fromCollectionId,
			fromParentId,
			toCollectionId,
			toParentId,
			placement = 'inside',
			targetId = null,
			fallbackDoc = null
		}) {
			const normalizedDocId = Number(docId);
			const fromCollection = Number(fromCollectionId);
			const toCollection = Number(toCollectionId);
			const fromParent = this.#normalizeParentId(fromParentId);
			const toParent = this.#normalizeParentId(toParentId);
			const collectionChanged = fromCollection !== toCollection;
			const descendantsToInvalidate = collectionChanged ? this.#collectLoadedDescendantIds(fromCollection, normalizedDocId) : null;
			let movedDoc = this.#extractDocumentFromBranch(fromCollection, fromParent, normalizedDocId);
			if (!movedDoc) {
				movedDoc = this.#queries.findLoadedDocument(fromCollection, normalizedDocId);
			}
			movedDoc = normalizeDocumentForStore(movedDoc || fallbackDoc, this.#normalizeParentId, {
				id: normalizedDocId,
				collectionId: toCollection,
				parentId: toParent
			});
			if (!movedDoc) {
				return null;
			}
			const nextDoc = {
				...movedDoc,
				collectionId: toCollection,
				parentId: toParent
			};
			this.#insertDocumentIntoBranch(nextDoc, toCollection, toParent, placement, targetId);
			this.#handleParentBecameEmpty(fromCollection, fromParent);
			if (toParent !== null) {
				this.#setParentHasChildren(toCollection, toParent, true);
			}
			if (descendantsToInvalidate) {
				for (const descId of descendantsToInvalidate) {
					this.#removeBranch(fromCollection, descId);
					delete this.#state.expandedDocs[descId];
				}
			}
			return nextDoc;
		}
		async loadDocuments(collectionId, parentId = null, append = false) {
			const key = this.#keyOf(collectionId, parentId);
			if (!append && this.#state.docsRequestByParent[key]) {
				await this.#state.docsRequestByParent[key];
				return;
			}
			const request = this.#loadDocumentsRequest(collectionId, parentId, append, key);
			if (append) {
				await request;
				return;
			}
			this.#state.docsRequestByParent[key] = request;
			try {
				await request;
			} finally {
				if (this.#state.docsRequestByParent[key] === request) {
					delete this.#state.docsRequestByParent[key];
				}
			}
		}
		async prefetchChildren(collectionId, parentId = null) {
			if (this.#queries.isChildrenHydrated(collectionId, parentId)) {
				return;
			}
			await this.loadDocuments(collectionId, parentId, false);
		}
		async ensureChildrenLoaded(collectionId, parentId = null) {
			await this.prefetchChildren(collectionId, parentId);
		}
		#updateDocumentInCollection(collectionId, updater) {
			const keyPrefix = `${Number(collectionId)}:`;
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(doc => {
					const nextDoc = updater(doc);
					if (nextDoc !== doc) {
						branchChanged = true;
					}
					return nextDoc;
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				changed = true;
			}
			return changed;
		}
		#collectLoadedDescendantIds(collectionId, docId) {
			const descendants = new Set();
			const stack = [Number(docId)];
			while (stack.length > 0) {
				const currentId = stack.pop();
				if (!Number.isFinite(currentId)) {
					continue;
				}
				const children = this.#queries.getChildren(collectionId, currentId);
				for (const child of children) {
					const childId = Number(child.id);
					if (!Number.isFinite(childId) || descendants.has(childId)) {
						continue;
					}
					descendants.add(childId);
					stack.push(childId);
				}
			}
			return descendants;
		}
		#extractDocumentFromBranch(collectionId, parentId, docId) {
			const key = this.#keyOf(collectionId, parentId);
			const docs = this.#state.docsByParent[key];
			if (!Array.isArray(docs)) {
				return null;
			}
			const index = docs.findIndex(item => Number(item.id) === Number(docId));
			if (index < 0) {
				return null;
			}
			const removed = docs[index];
			const nextDocs = [...docs.slice(0, index), ...docs.slice(index + 1)];
			this.#state.docsByParent[key] = nextDocs;
			this.#state.docsOffsetByParent[key] = nextDocs.length;
			return removed;
		}
		#handleParentBecameEmpty(collectionId, parentId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedParentId = this.#normalizeParentId(parentId);
			if (!Number.isFinite(normalizedCollectionId) || normalizedCollectionId <= 0 || normalizedParentId === null) {
				return false;
			}
			if (!this.#queries.isBranchLoaded(normalizedCollectionId, normalizedParentId)) {
				return false;
			}
			const siblings = this.#queries.getChildren(normalizedCollectionId, normalizedParentId);
			if (siblings.length > 0) {
				return false;
			}
			this.#setParentHasChildren(normalizedCollectionId, normalizedParentId, false);
			delete this.#state.expandedDocs[normalizedParentId];
			return true;
		}
		#insertDocumentIntoBranch(doc, collectionId, parentId, placement = 'inside', targetId = null) {
			if (!this.#queries.isBranchLoaded(collectionId, parentId)) {
				return false;
			}
			const key = this.#keyOf(collectionId, parentId);
			const docs = [...(this.#state.docsByParent[key] || [])].filter(item => Number(item.id) !== Number(doc.id));
			let insertIndex = docs.length;
			if ((placement === 'before' || placement === 'after') && Number.isFinite(Number(targetId))) {
				const targetIndex = docs.findIndex(item => Number(item.id) === Number(targetId));
				if (targetIndex >= 0) {
					insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
				}
			}
			docs.splice(insertIndex, 0, doc);
			this.#setBranchDocs(collectionId, parentId, docs);
			return true;
		}
		#mergeDocs(base, incoming) {
			const byId = new Map();
			for (const item of base) {
				const id = Number(item?.id);
				if (Number.isInteger(id) && id > 0) {
					byId.set(id, item);
				}
			}
			for (const item of incoming) {
				const id = Number(item?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				byId.set(id, byId.has(id) ? {
					...byId.get(id),
					...item
				} : item);
			}
			return sortDocuments([...byId.values()]);
		}
		async #loadDocumentsRequest(collectionId, parentId, append, key) {
			this.#state.docsLoadingByParent[key] = true;
			try {
				const hasCursor = (this.#state.docsCursorByParent[key] || null) !== null;
				const effectiveAppend = append && hasCursor;
				const cursor = effectiveAppend ? this.#state.docsCursorByParent[key] : null;
				const response = await this.#api.listDocumentsByParent(collectionId, parentId, {
					limit: PAGE_SIZE$1,
					cursor
				});
				this.#state.docsByParent[key] = effectiveAppend ? this.#mergeDocs(this.#state.docsByParent[key] || [], response.items) : sortDocuments(response.items);
				this.#state.docsOffsetByParent[key] = this.#state.docsByParent[key].length;
				this.#state.docsCursorByParent[key] = response.nextCursor || null;
				this.#state.docsHasNextPageByParent[key] = response.hasNextPage;
				this.#state.docsHydratedByParent[key] = true;
				this.#state.docsStaleByParent[key] = false;
			} catch (error) {
				this.#setError(error?.message || 'Documents loading failed');
			} finally {
				this.#state.docsLoadingByParent[key] = false;
			}
		}
	}

	class SidebarErrorActions {
		// Silent: sidebar errors are surfaced by page wrappers (workspace/document) as a single toast + redirect.
		setError() {}
	}

	class SidebarExpansionActions {
		#state;
		#getChildren;
		#ensureChildrenLoaded;
		constructor({
			state,
			getChildren,
			ensureChildrenLoaded
		}) {
			this.#state = state;
			this.#getChildren = getChildren;
			this.#ensureChildrenLoaded = ensureChildrenLoaded;
		}
		#clearExpandedBranch(collectionId, parentDocId) {
			const children = this.#getChildren(collectionId, parentDocId);
			for (const child of children) {
				const childId = Number(child.id);
				delete this.#state.expandedDocs[childId];
				this.#clearExpandedBranch(collectionId, childId);
			}
		}
		async toggleDocExpanded(doc) {
			const docId = Number(doc.id);
			const isNextExpanded = !this.#state.expandedDocs[docId];
			this.#state.expandedDocs[docId] = isNextExpanded;
			if (isNextExpanded) {
				await this.#ensureChildrenLoaded(Number(doc.collectionId), docId);
			} else {
				this.#clearExpandedBranch(Number(doc.collectionId), docId);
			}
		}
		clearCollectionExpandedDocs(collectionId) {
			const rootDocs = this.#getChildren(collectionId, null);
			for (const doc of rootDocs) {
				const docId = Number(doc.id);
				delete this.#state.expandedDocs[docId];
				this.#clearExpandedBranch(collectionId, docId);
			}
		}
	}

	// What the pressed star knows about its own object. Only the title is required: a row without one
	// cannot be drawn, and the caller that has none keeps the old behaviour (a re-read of the list).

	// A row of the block or a document nested in a branch of it: the second one carries the expansion
	// path of the row it hangs under, so both take the same route through ALG-02.

	const ENTITY_TYPES = ['document', 'collection'];
	const POSITIVE_MODES = ['self', 'subtree', 'all'];
	// Modes that reach further than the object they are written on: everything under it becomes covered,
	// and every bell under it changes with them.
	const COVERING_MODES = ['subtree', 'all'];
	const MODE_MUTED = 'muted';
	// [API-05] The one refusal the interface is not supposed to be able to reach: the target left the
	// list between the read and the press. The state is re-read rather than guessed at.
	const FAVORITE_REQUIRED_ERROR = 'FAVORITE_REQUIRED';
	const EMPTY_NOTIFY = Object.freeze({
		mode: null,
		subscribed: false,
		muted: false,
		inherited: false,
		inheritedSource: null,
		notified: false
	});

	// [P1] Favorites block: the whole list lives on the server, so every gesture goes through here -
	// the components own no state of their own. Reads come back through the store (state + queries).
	class SidebarFavoriteActions {
		#api;
		#state;
		#messages;
		#notify;
		#isFavorite;
		#ensureChildrenLoaded;
		#ensureAccessibleChildrenLoaded;
		#isBranchLoaded;
		#isAccessibleBranchLoaded;
		#getBranchDocs;
		#notifyStateOf;
		#applyingExternalFavorite = false;
		#applyingExternalNotify = false;
		#refreshingInheritance = false;
		#inheritanceRefreshQueued = false;
		#announcingNotify = false;
		#announcingFavorite = false;
		// [TPL-02] Rows the notification filter took off the screen, held on to so that switching it back
		// off can put them back within the frame of the press instead of after a round trip. Kept level with
		// the block while it is on (see #putRow, #dropRow), and the server page that follows the switch
		// replaces the list outright anyway - so anything that went stale out of our sight is corrected a
		// moment later, and until then a list that is right about the rows we know of beats an empty wait.
		#hiddenByFilter = [];
		// Presses still waiting for their answer, by key. A page read dispatched before the press was
		// built from state older than it, so its response must not be allowed to undo the press. `row` is
		// the provisional row the press put in the block, if it could build one, and `hadRow` whether a
		// removal took a loaded row out (the page it leaves short is closed once the removal is answered).
		#unanswered = new Map();
		// Debounce of the re-read a change of composition asks for (see invalidateComposition).
		#accessRefreshTimer = null;
		constructor({
			api,
			state,
			messages,
			notify,
			isFavorite,
			ensureChildrenLoaded,
			ensureAccessibleChildrenLoaded,
			isBranchLoaded,
			isAccessibleBranchLoaded,
			getBranchDocs,
			notifyStateOf
		}) {
			this.#api = api;
			this.#state = state;
			this.#messages = messages || {};
			this.#notify = notify;
			this.#isFavorite = isFavorite;
			this.#ensureChildrenLoaded = ensureChildrenLoaded;
			this.#ensureAccessibleChildrenLoaded = ensureAccessibleChildrenLoaded;
			this.#isBranchLoaded = isBranchLoaded;
			this.#isAccessibleBranchLoaded = isAccessibleBranchLoaded;
			this.#getBranchDocs = getBranchDocs;
			this.#notifyStateOf = notifyStateOf;
		}

		// A row of the block carries its own copy of the title (the list is its own read, not a view over
		// the tree), so a rename has to reach it as well - including for an object no loaded branch holds.
		// Called from the local patchers of documents and collections: one gesture, one place to change.
		patchFavoriteTitle(entityType, entityId, title) {
			const target = this.#normalizeTarget({
				entityType,
				entityId
			});
			if (target === null || typeof title !== 'string' || title === '') {
				return false;
			}
			const row = this.#findRow(target);
			if (row === null || row.title === title) {
				return false;
			}
			this.#patchRow(target, {
				title
			});
			return true;
		}

		// [TPL-02] First page taken from the payload the page was rendered with, instead of a request of
		// its own - the block is painted together with the knowledge bases, which arrive the same way.
		// Answers whether it had anything to take: without a payload the caller reads the page itself.
		hydrateFavorites(payload) {
			if (payload === null || payload === undefined) {
				return false;
			}
			const page = this.#api.normalizeFavoritePage(payload);
			this.#state.favorites.value = this.#sort(page.items);
			this.#state.favoritesCursor.value = page.nextCursor;
			this.#state.favoritesHasNextPage.value = page.hasNextPage;
			this.#state.favoritesHydrated.value = true;
			this.#state.favoritesStale.value = false;
			this.#state.favoritesError.value = null;
			this.#state.favoritesErrorOnAppend.value = false;

			// Same index the loaded pages feed: the stars of objects on this page must not wait for the row
			// they belong to to be looked up.
			for (const row of page.items) {
				this.#state.favoriteIndex[favoriteKey(row.entityType, row.entityId)] = true;
			}
			return true;
		}

		// [TPL-02] First read and every following page: which of the two it is follows from the state,
		// so the caller (a scroll sentinel, the block on mount) never has to decide.
		async loadFavoritesPage() {
			if (this.#state.favoritesStale.value || !this.#state.favoritesHydrated.value) {
				await this.#load(false);
				return;
			}
			if (this.#state.favoritesHasNextPage.value) {
				await this.#load(true);
			}
		}

		// [ERR-006] Second attempt at whatever failed: the next page keeps the rows already loaded, the
		// first page is re-read from scratch.
		async retryFavorites() {
			if (this.#state.favoritesErrorOnAppend.value) {
				await this.#load(true);
				return;
			}
			await this.reloadFavorites();
		}
		async reloadFavorites() {
			this.#state.favoritesStale.value = true;
			this.#state.favoritesStaleToken++;
			await this.#load(false);
		}

		// Which rows the block holds is the server's answer, and it is decided by things the block never
		// sees: access taken away or handed out, and the life of the object itself. A row whose object the
		// user has just lost stays on screen with nothing behind it, one they have just been given never
		// appears, a document moved to the bin is hidden from the list while its row keeps standing here,
		// and a physically deleted object takes its row with it. None of that is derivable on this side -
		// the list is re-read.
		//
		// The membership row itself is deliberately left alone by the server when access changes (a
		// favorite outlives the access), so a returned grant brings the row back where it stood.
		//
		// Debounced like the other readers of the same pushes: a cascade names every document it touched
		// and arrives as a burst, and one read after it answers the whole burst.
		invalidateComposition() {
			if (!this.#state.favoritesHydrated.value) {
				// Nothing has been read yet, so there is nothing on screen to correct: the first read of the
				// block carries the change on its own.
				return;
			}
			if (this.#accessRefreshTimer !== null) {
				clearTimeout(this.#accessRefreshTimer);
			}
			const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
			this.#accessRefreshTimer = setTimeout(() => {
				this.#accessRefreshTimer = null;
				void this.reloadFavorites();
			}, delay);
		}
		setFavoritesSectionExpanded(expanded) {
			this.#state.favoritesSectionExpanded.value = expanded === true;
		}
		toggleFavoritesSection() {
			this.#state.favoritesSectionExpanded.value = !this.#state.favoritesSectionExpanded.value;
		}

		// [TPL-02] The filter is a request parameter, not a client-side sieve: filtering on the client would
		// hand out pages with holes in them and break the cursor. Both directions of the press are answered
		// here all the same, in the frame of the press: the rows on screen carry the same `notified` the
		// server filters by, so switching it on drops what it excludes, and what was dropped is kept, so
		// switching it off puts it back. The page still comes from the server - it alone knows what lies
		// past the rows already read, and it is what makes either answer exact.
		async setFavoritesFilter(onlyNotified) {
			const next = onlyNotified === true;
			if (this.#state.favoritesOnlyNotified.value === next) {
				return;
			}
			this.#state.favoritesOnlyNotified.value = next;
			if (next) {
				const rows = this.#state.favorites.value;
				this.#hiddenByFilter = rows.filter(row => !this.#passesFilter(row));
				this.#state.favorites.value = rows.filter(row => this.#passesFilter(row));
			} else {
				this.#state.favorites.value = this.#restoreHidden();
			}

			// Marked for the length of this read alone: switching the filter off with nothing to restore
			// leaves the block empty and unfiltered until the page lands, and the block is not allowed to
			// collapse under the pointer that is still on its button. Every other read of the list leaves the
			// visibility of the block to its contents.
			this.#state.favoritesFilterReloading.value = true;
			try {
				await this.reloadFavorites();
			} finally {
				this.#state.favoritesFilterReloading.value = false;
			}
		}

		// [TPL-02] The single path in and out of the list, shared by all three stars. `hint` is what the
		// caller knows about the object it starred, so the row can be drawn within the frame of the press
		// instead of after a re-read (see #provisionalRow).
		async toggleFavorite(target, hint = null) {
			const normalized = this.#normalizeTarget(target);
			if (normalized === null) {
				return false;
			}
			const key = favoriteKey(normalized.entityType, normalized.entityId);
			if (this.#state.favoritesPending[key] === true) {
				// A press while the previous one is unanswered is dropped rather than queued: the server
				// state is not known yet, so the only thing a second request could do is race the first.
				return this.#isFavorite(normalized.entityType, normalized.entityId);
			}
			const wasFavorite = this.#isFavorite(normalized.entityType, normalized.entityId);
			this.#state.favoritesPending[key] = true;
			this.#unanswered.set(key, {
				target: normalized,
				value: !wasFavorite,
				row: null
			});
			try {
				return wasFavorite ? await this.#removeFavorite(normalized) : await this.#addFavorite(normalized, hint);
			} finally {
				delete this.#state.favoritesPending[key];
				this.#unanswered.delete(key);
			}
		}

		// [ALG-02] (NORMATIVE) Expansion of a block row. The flag goes into the block's own space, the
		// branch comes from the namespace the server named in expandVia: the regular branch action would
		// turn a user down for a document they see only through a personal grant.
		async toggleFavoriteExpanded(item) {
			const target = this.#normalizeExpandTarget(item);
			if (target === null) {
				return;
			}
			const key = this.#expandKeyOf(target);
			const next = this.#state.favoritesExpanded[key] !== true;
			this.#state.favoritesExpanded[key] = next;
			if (!next) {
				// The branch data are shared with the tree and stay where they are: collapsing here must
				// not collapse the same nodes in the tree, and re-expanding must not cost a request.
				// The coverage map is ours alone though, and re-expanding always re-reads it, so it is
				// dropped here instead of growing with every branch opened during the session.
				this.#forgetBranchCoverage(target);
				return;
			}
			await this.#loadFavoriteBranch(target, key);
		}

		// [ERR-005] Second attempt at a branch, offered inside the row that failed.
		async retryFavoriteBranch(item) {
			const target = this.#normalizeExpandTarget(item);
			if (target === null) {
				return;
			}
			await this.#loadFavoriteBranch(target, this.#expandKeyOf(target));
		}
		async #loadFavoriteBranch(target, key) {
			delete this.#state.favoritesBranchError[key];
			const branch = this.#branchOf(target);
			// Remembered before the read: a re-read of the coverage of an opened branch (see
			// #refreshInheritance) needs these coordinates, and the row alone does not carry them.
			this.#state.favoritesBranchContext[key] = branch;

			// A knowledge base opens its root branch, a document its own.
			if (target.entityType === 'collection') {
				await this.#ensureChildrenLoaded(branch.collectionId, null);
				this.#reportBranchResult(key, this.#isBranchLoaded(branch.collectionId, null));
				await this.refreshFavoriteCoverage(branch);
				return;
			}
			if (target.expandVia === 'tree') {
				await this.#ensureChildrenLoaded(target.collectionId, target.entityId);
				this.#reportBranchResult(key, this.#isBranchLoaded(target.collectionId, target.entityId));
			} else {
				await this.#ensureAccessibleChildrenLoaded(target.collectionId, target.entityId);
				this.#reportBranchResult(key, this.#isAccessibleBranchLoaded(target.collectionId, target.entityId));
			}
			await this.refreshFavoriteCoverage(branch);
		}

		// [ALG-02] The branches of the block are not its own copies - they are read from the two document
		// namespaces of the panel. When one of those namespaces drops a branch (the accessible-tree section
		// re-reading its first page, an access cascade), every row of the block standing open on it reads it
		// again. Without this the row kept its chevron open over nothing until the same branch happened to
		// be opened somewhere else.
		reloadOpenBranches(branches) {
			if (!Array.isArray(branches) || branches.length === 0) {
				return;
			}
			const dropped = new Set(branches.map(branch => this.#branchId(branch)));
			for (const [key, branch] of Object.entries(this.#state.favoritesBranchContext)) {
				if (branch?.expandVia === 'tree' || !dropped.has(this.#branchId(branch))) {
					continue;
				}
				void this.#reloadBranch(key, branch);
			}
		}
		#branchId(branch) {
			const parentId = branch?.parentId ?? null;
			return `${Number(branch?.collectionId)}:${parentId === null ? 'root' : Number(parentId)}`;
		}
		async #reloadBranch(key, branch) {
			await this.#ensureAccessibleChildrenLoaded(branch.collectionId, branch.parentId);
			this.#reportBranchResult(key, this.#isAccessibleBranchLoaded(branch.collectionId, branch.parentId));
			await this.refreshFavoriteCoverage(branch);
		}

		// Branch a row opens, in the coordinates refreshFavoriteCoverage speaks: a knowledge base opens the
		// roots of its own tree, a document the children of itself.
		#branchOf(target) {
			return target.entityType === 'collection' ? {
				collectionId: target.entityId,
				parentId: null,
				expandVia: 'tree'
			} : {
				collectionId: target.collectionId,
				parentId: target.entityId,
				expandVia: target.expandVia
			};
		}
		#expandKeyOf(target) {
			return favoriteExpandKey(target.entityType, target.entityId, target.scope);
		}

		// Mirror of refreshFavoriteCoverage: the states of the branch that has just been collapsed.
		#forgetBranchCoverage(target) {
			const branch = this.#branchOf(target);
			delete this.#state.favoritesBranchContext[this.#expandKeyOf(target)];
			for (const doc of this.#branchDocsOf(branch)) {
				delete this.#state.favoritesCoverage[String(Number(doc?.id))];
			}
		}

		// [AC-052] A subscription on a knowledge base covers every document in it, and a subtree subscription
		// everything below itself - so a write of that kind changes the state of rows it never touched. Their
		// coverage is the server's answer, not something derivable here: the list is re-read and every opened
		// branch re-reads its states. Without this the bells of the descendants keep the coverage that has
		// just been switched off, and a press on one of them acts on a state that no longer exists.
		async #refreshInheritance() {
			if (this.#refreshingInheritance) {
				// A second change while the re-read is in flight would read the state of the first one. One
				// more pass after the current one covers it, however many changes arrived meanwhile.
				this.#inheritanceRefreshQueued = true;
				return;
			}
			this.#refreshingInheritance = true;
			try {
				do {
					this.#inheritanceRefreshQueued = false;
					// eslint-disable-next-line no-await-in-loop
					await this.reloadFavorites();
					// Every opened branch at once, not a request per branch: one press on a knowledge base with
					// a dozen rows expanded would otherwise open a dozen parallel connections, and the whole
					// set again if another change arrived while they were in flight.
					// eslint-disable-next-line no-await-in-loop
					await this.#refreshCoverageOf(Object.values(this.#state.favoritesBranchContext));
				} while (this.#inheritanceRefreshQueued);
			} finally {
				this.#refreshingInheritance = false;
			}
		}

		// Does the change of this object's own row reach other rows: a knowledge base always does, a document
		// only through a covering mode - on the way in or on the way out.
		#coversOtherRows(target, previousMode, nextMode) {
			if (target.entityType === 'collection') {
				return true;
			}
			return COVERING_MODES.includes(previousMode) || COVERING_MODES.includes(nextMode);
		}

		// [API-06] Coverage of the documents of one branch: one request per branch, never one per row.
		// Called on expansion and on every following page of the branch - a page that arrives without
		// states would draw rows with no bell where a bell belongs.
		async refreshFavoriteCoverage(params) {
			await this.#refreshCoverageOf([params]);
		}

		// The same read for any number of branches. Branches of one knowledge base share a request - the
		// endpoint answers per knowledge base, not per branch - and a document reachable from two of them
		// is asked about once.
		async #refreshCoverageOf(branches) {
			const idsByCollection = new Map();
			for (const branch of branches) {
				const collectionId = Number(branch?.collectionId);
				if (!Number.isInteger(collectionId) || collectionId <= 0) {
					continue;
				}
				let ids = idsByCollection.get(collectionId);
				if (ids === undefined) {
					ids = new Set();
					idsByCollection.set(collectionId, ids);
				}
				for (const doc of this.#branchDocsOf(branch)) {
					const id = Number(doc?.id);
					if (Number.isInteger(id) && id > 0) {
						ids.add(id);
					}
				}
			}
			await Promise.all([...idsByCollection.entries()].filter(([, ids]) => ids.size > 0).map(([collectionId, ids]) => this.#loadCoverage(collectionId, [...ids])));
		}
		async #loadCoverage(collectionId, ids) {
			let states = null;
			try {
				states = await this.#api.getSubscriptionStates(collectionId, ids);
			} catch {
				// A bell that cannot be drawn is not a failure of the branch: the rows are there and
				// readable, so the row keeps quiet instead of reporting an error it cannot act on.
				return;
			}
			for (const [id, state] of Object.entries(states)) {
				this.#state.favoritesCoverage[id] = state;
			}
		}

		// Documents of one branch, in the namespace the row expands through.
		#branchDocsOf(branch) {
			const collectionId = Number(branch?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return [];
			}
			const rawParentId = branch?.parentId ?? null;
			const docs = this.#getBranchDocs(collectionId, rawParentId === null ? null : Number(rawParentId), branch?.expandVia === 'accessibleTree');
			return Array.isArray(docs) ? docs : [];
		}

		// [API-05] One press of a bell that has no depth to choose: a covered object is muted, a muted one
		// resumes, a subscribed one goes silent, and an object in the list with nothing arriving subscribes.
		// The same rule the bell of the editor follows.
		async toggleFavoriteNotify(target) {
			const normalized = this.#normalizeTarget(target);
			if (normalized === null) {
				return;
			}
			const current = this.#notifyStateOf(normalized.entityType, normalized.entityId);
			// A mute counts only while there is coverage to suppress. The negative row survives the covering
			// subscription being switched off, and treating that leftover as "muted" would spend the press on
			// deleting a row nothing depends on - the bell would look unresponsive.
			const isMuted = current?.muted === true && current?.inherited === true;
			if (isMuted || current?.subscribed === true) {
				await this.clearFavoriteNotify(normalized);
				return;
			}
			if (current?.inherited === true) {
				// [AC-045] Outside the list only muting is on offer, and muting is what a covered object
				// gets here too: the depth of the covering subscription is not this row's to change (AC-052).
				await this.setFavoriteNotify(normalized, MODE_MUTED);
				return;
			}
			await this.setFavoriteNotify(normalized, normalized.entityType === 'collection' ? 'all' : 'self');
		}

		// [API-05] Explicit depth, chosen in the popover of a row with nested documents.
		async setFavoriteNotify(target, mode) {
			await this.#writeNotify(target, mode);
		}

		// [API-05] "Off" for a direct subscription and "resume" for a muted object are the same call.
		async clearFavoriteNotify(target) {
			await this.#writeNotify(target, null);
		}

		// [EVENT-02] subscriptionSet. Idempotent: the initiator is not excluded from the broadcast, so
		// this lands on top of the change it describes. Objects the sidebar knows nothing about are
		// skipped - inventing a state for them would light a bell on a row nobody asked about.
		applySubscriptionSet(params) {
			this.#applyRemoteMode(params, this.#normalizeMode(params?.mode));
		}

		// [EVENT-02] subscriptionRemove. Also arrives from the cascade of a star being taken off, and the
		// handler makes no distinction: the row is gone either way.
		applySubscriptionRemove(params) {
			this.#applyRemoteMode(params, null);
		}
		#applyRemoteMode(params, mode) {
			const target = this.#normalizeTarget({
				entityType: params?.scope,
				entityId: Number(params?.entityId)
			});
			if (target === null) {
				return;
			}
			const current = this.#notifyStateOf(target.entityType, target.entityId);
			// A covering change is worth following even for an object the block draws no row for: what it
			// covers may well be on screen. Anything else concerns a row that is not here.
			const covers = this.#coversOtherRows(target, current?.mode ?? null, mode);
			if (current === null) {
				if (covers) {
					void this.#refreshInheritance();
				}
				return;
			}

			// Our own write comes back through this channel too (the initiator is not excluded), and by then
			// the block already holds the mode being announced - re-reading everything again would cost a
			// second reload of the list per press. A mode that differs is news, and news is followed.
			const isKnown = (current.mode ?? null) === mode;
			this.#patchNotify(target, this.#nextNotifyState(current, mode));
			if (covers && !isKnown) {
				void this.#refreshInheritance();
			}
		}
		async #writeNotify(target, mode) {
			const normalized = this.#normalizeTarget(target);
			if (normalized === null) {
				return;
			}
			const key = favoriteKey(normalized.entityType, normalized.entityId);
			if (this.#state.favoritesNotifyPending[key] === true) {
				return;
			}

			// Optimistic: the state a successful call leads to follows from DTO-02 alone - a direct row
			// never changes the coverage an object gets from above - so nothing has to be re-read.
			const previous = this.#notifyStateOf(normalized.entityType, normalized.entityId);
			this.#patchNotify(normalized, this.#nextNotifyState(previous, mode));
			this.#state.favoritesNotifyPending[key] = true;
			try {
				await (mode === null ? this.#api.removeSubscription(normalized) : this.#api.setSubscription(normalized, mode));
				if (this.#coversOtherRows(normalized, previous?.mode ?? null, mode)) {
					await this.#refreshInheritance();
				}

				// Second announcement, this one with the server's answer behind it: a listener that cannot
				// derive coverage on its own (the bell of the editor under a subscribed knowledge base) waits
				// for exactly this one instead of the push.
				this.#announceNotify(normalized, this.#notifyStateOf(normalized.entityType, normalized.entityId), true);
			} catch (error) {
				// [ERR-003] The failed change goes back to what it was and the composition of the list is
				// untouched: notifications and membership are separate things.
				this.#patchNotify(normalized, previous);
				if (String(error?.code || '') === FAVORITE_REQUIRED_ERROR) {
					// The target is not in the list any more. Which rows are is the server's answer.
					await this.reloadFavorites();
					return;
				}
				this.#notify(this.#messages.favoriteNotifyFailed || error?.message || '');
			} finally {
				delete this.#state.favoritesNotifyPending[key];
			}
		}

		// [DTO-02] Where a write of the direct row leads. `notified` is the predicate of the filter, and
		// coverage from above is not touched by a row of one's own - so it carries over as it was.
		#nextNotifyState(current, mode) {
			const base = current ?? EMPTY_NOTIFY;
			const subscribed = POSITIVE_MODES.includes(mode);
			const muted = mode === MODE_MUTED;
			return {
				...base,
				mode: mode ?? null,
				subscribed,
				muted,
				notified: (subscribed || base.inherited === true) && !muted
			};
		}

		// Both surfaces of the same state: the row of the block and the coverage map its branch reads.
		#patchNotify(target, notify) {
			if (notify === null) {
				return;
			}
			if (this.#findRow(target) !== null) {
				this.#patchRow(target, {
					notify
				});
			}
			if (target.entityType === 'document' && this.#state.favoritesCoverage[String(target.entityId)] !== undefined) {
				this.#state.favoritesCoverage[String(target.entityId)] = notify;
			}

			// Same reasoning as the star: the bell of the open document has to follow the bell of the row
			// within the frame of the press, and pull only confirms it a moment later.
			if (!this.#applyingExternalNotify) {
				this.#announceNotify(target, notify, false);
			}
		}

		// [DTO-02] One announcement of a notification state over the local bus. `confirmed` says whether the
		// server has already accepted the change: a listener that has to re-read something (coverage from
		// above) can only trust the confirmed one.
		#announceNotify(target, notify, confirmed) {
			if (notify === null) {
				return;
			}

			// Delivery is synchronous and the bus carries no sender, so the flag is what tells our own echo
			// (see applyExternalNotify) apart from a foreign announcement.
			this.#announcingNotify = true;
			try {
				main_core_events.EventEmitter.emit(NoteEvent.SUBSCRIPTION_CHANGED, new main_core_events.BaseEvent({
					data: {
						scope: target.entityType,
						entityId: target.entityId,
						state: notify,
						confirmed
					}
				}));
			} finally {
				this.#announcingNotify = false;
			}
		}

		// The other side of SUBSCRIPTION_CHANGED: the bell of the editor or of the knowledge base page was
		// pressed, so the row adopts the state without waiting for pull.
		applyExternalNotify(params) {
			if (this.#announcingNotify) {
				// Our own announcement, delivered back to us because the bus has one channel for everyone.
				return;
			}
			const target = this.#normalizeTarget({
				entityType: params?.scope,
				entityId: Number(params?.entityId)
			});
			if (target === null) {
				return;
			}
			const state = params?.state ?? null;
			const previous = this.#notifyStateOf(target.entityType, target.entityId);
			this.#applyingExternalNotify = true;
			try {
				if (state === null) {
					// A sender that reports no state (the plain "something changed" signal) leaves the row to the
					// server: coverage from above cannot be derived from that, and the page carries notify per row.
					void this.reloadFavorites();
					return;
				}
				this.#patchNotify(target, state);
			} finally {
				this.#applyingExternalNotify = false;
			}

			// Only once the sender has the server's answer: re-reading on the optimistic announcement would
			// read the state from before the write and put it back on screen (`confirmed` in the payload).
			if (params?.confirmed === true && this.#coversOtherRows(target, previous?.mode ?? null, state.mode ?? null)) {
				void this.#refreshInheritance();
			}
		}
		#normalizeMode(mode) {
			return [...POSITIVE_MODES, MODE_MUTED].includes(mode) ? mode : null;
		}

		// The branch loaders answer with state rather than by throwing: a branch that is still not there
		// after the read is the failure, and an empty one that did arrive is a valid answer (AC-035).
		#reportBranchResult(key, isLoaded) {
			if (isLoaded) {
				return;
			}
			this.#state.favoritesBranchError[key] = this.#messages.favoritesBranchError || '';
		}
		#normalizeExpandTarget(item) {
			const target = this.#normalizeTarget(item);
			const collectionId = Number(item?.collectionId);
			if (target === null || !Number.isInteger(collectionId) || collectionId <= 0) {
				return null;
			}
			return {
				...target,
				collectionId,
				expandVia: item?.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
				scope: typeof item?.scope === 'string' ? item.scope : ''
			};
		}

		// [EVENT-01] favoriteAdd. Idempotent by contract: the initiator is not excluded from the
		// broadcast, so this lands on top of the optimistic change it describes.
		async applyFavoriteAdd(params) {
			const target = this.#normalizeTarget(params);
			if (target === null) {
				return;
			}
			this.#setIndex(target, true);
			this.#applyPositions(params?.affectedPositions);

			// [EVENT-01] The push carries the finished row, in the same shape a page of the list does - so a
			// row the block has never seen goes in from here, and one it holds (the provisional row of a press
			// of our own) is replaced by it.
			const item = this.#api.normalizeFavoriteItem(params?.item);
			if (item !== null) {
				this.#putRow(item);
				return;
			}
			const row = this.#findRow(target);
			if (row === null) {
				// No row in the payload and none on screen: only a page of the list can put a complete one in
				// the block, and the new row is on the first one (it goes in on top).
				await this.reloadFavorites();
				return;
			}
			const position = Number(params?.position);
			if (Number.isFinite(position)) {
				this.#patchRow(target, {
					position
				});
			}
		}

		// [EVENT-01] favoriteRemove.
		applyFavoriteRemove(params) {
			const target = this.#normalizeTarget(params);
			if (target === null) {
				return;
			}
			this.#setIndex(target, false);
			this.#dropRow(target);
		}

		// [EVENT-01] favoriteMove. Mass renumbering arrives as requestRefetch instead of positions.
		async applyFavoriteMove(params) {
			if (params?.requestRefetch === true) {
				await this.reloadFavorites();
				return;
			}
			const target = this.#normalizeTarget(params);
			if (target === null) {
				return;
			}
			if (this.#findRow(target) === null) {
				// A row carried in from beyond the loaded pages can land inside the visible range, and
				// patching only touches rows already loaded - it would stay invisible until a reload. Same
				// answer favoriteAdd gives for a row it has never seen.
				await this.reloadFavorites();
				return;
			}

			// The same code as a move of our own: an event of another session differs only in where the
			// numbers came from.
			this.#applyServerPosition(target, params);
		}

		// [API-03] Manual order. The gap comes from the drag as a pair of row ids; the order moves at once
		// and is then overwritten by what the server confirmed - two sessions reordering the same list can
		// only converge on the server's answer (AC-072).
		async moveFavoriteRow(dragId, targetId, placement) {
			const rows = this.#state.favorites.value;
			const dragRow = rows.find(row => Number(row.id) === Number(dragId)) ?? null;
			const targetRow = rows.find(row => Number(row.id) === Number(targetId)) ?? null;
			if (dragRow === null || targetRow === null || dragRow === targetRow) {
				return;
			}
			const target = this.#normalizeTarget(dragRow);
			if (target === null) {
				return;
			}

			// [ERR-007] The position the server last confirmed for this row. Putting that one value back is
			// what returns the order - and unlike a snapshot of the whole list it cannot resurrect a row
			// that left the block while the request was in flight.
			const confirmedPosition = Number(dragRow.position);
			const position = this.#insertPositionOf(dragRow, targetRow, placement);
			this.#reorderLocal(dragRow, targetRow, placement);
			let response = null;
			try {
				response = await this.#api.moveFavorite(target, position);
			} catch (error) {
				if (Number.isFinite(confirmedPosition)) {
					this.#patchRow(target, {
						position: confirmedPosition
					});
				}
				this.#notify(this.#messages.favoriteMoveFailed || error?.message || '');
				return;
			}
			this.#applyServerPosition(target, response);
		}

		// The moved row is patched last: the renumbering carries a value for it too, and the one the
		// server assigned to the move itself is the newer of the two.
		#applyServerPosition(target, response) {
			this.#applyPositions(response?.affectedPositions);
			const position = Number(response?.position);
			if (Number.isFinite(position)) {
				this.#patchRow(target, {
					position
				});
			}
			this.#refreshCursorFromTail();
		}

		// [API-04] The cursor is the position of the last loaded row, and reordering moves it: left as it
		// was, the next page would be asked for from a place no row stands in any more.
		#refreshCursorFromTail() {
			if (this.#state.favoritesCursor.value === null) {
				return;
			}

			// A row the server has not named yet (a provisional row of a press in flight) is no cursor: the
			// next page would be asked for from a position and an id the list does not have.
			const rows = this.#state.favorites.value;
			const tail = [...rows].reverse().find(row => Number(row.id) > 0) ?? null;
			if (tail === null) {
				return;
			}
			this.#state.favoritesCursor.value = {
				position: Number(tail.position),
				id: Number(tail.id)
			};
		}

		// [API-03] The ordinal number of the insertion point in the list, counted without the row being
		// moved: 1 is the first row. The client never computes a POSITION of its own.
		#insertPositionOf(dragRow, targetRow, placement) {
			const ids = this.#state.favorites.value.map(row => Number(row.id)).filter(id => id !== Number(dragRow.id));
			const targetIndex = ids.indexOf(Number(targetRow.id));
			if (targetIndex < 0) {
				return null;
			}
			return (placement === 'before' ? targetIndex : targetIndex + 1) + 1;
		}

		// Optimistic order. A position between the two neighbours of the gap is synthesised so the row
		// sorts where it was dropped; the authoritative values arrive with the response.
		#reorderLocal(dragRow, targetRow, placement) {
			const list = this.#state.favorites.value.filter(row => Number(row.id) !== Number(dragRow.id));
			const targetIndex = list.findIndex(row => Number(row.id) === Number(targetRow.id));
			if (targetIndex < 0) {
				return;
			}
			const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			// Order is POSITION DESC: the row above the gap holds the higher value.
			const above = insertIndex > 0 ? Number(list[insertIndex - 1].position) : null;
			const below = insertIndex < list.length ? Number(list[insertIndex].position) : null;
			let position = Number(dragRow.position) || 0;
			if (above !== null && below !== null) {
				position = Math.floor((above + below) / 2);
			} else if (above !== null) {
				position = above - 1;
			} else if (below !== null) {
				position = below + 1;
			}
			list.splice(insertIndex, 0, {
				...dragRow,
				position
			});
			this.#state.favorites.value = list;
		}
		async #addFavorite(target, hint) {
			// Optimistic: the star fills in and the row goes into the block before the round trip, both
			// falling back on failure. The provisional row carries the key of the real one, so the answer
			// replaces it where it stands instead of remounting a row the user is already looking at.
			this.#setIndex(target, true);
			const hasProvisional = this.#insertProvisionalRow(target, hint);
			let response = null;
			try {
				response = await this.#api.addFavorite(target, null);
			} catch (error) {
				this.#setIndex(target, false);
				if (hasProvisional) {
					this.#dropRow(target);
				}
				this.#notify(this.#messages.favoriteAddFailed || error?.message || '');
				return false;
			}
			this.#applyPositions(response.affectedPositions);
			if (response.item !== null) {
				this.#putRow(response.item);
				return true;
			}

			// No row in the answer: the object is not in the list the server would hand out (rights, trash),
			// or an older server answered. Which rows the block holds is its answer either way.
			await this.reloadFavorites();
			return true;
		}

		// A row built from what the pressed star knows, standing in until the server's own row arrives.
		// Everything but the values only the server assigns; an empty title is no row at all - a nameless
		// row would be worse than the wait it saves.
		#provisionalRow(target, hint) {
			const title = typeof hint?.title === 'string' ? hint.title.trim() : '';
			if (title === '') {
				return null;
			}
			const collectionId = target.entityType === 'collection' ? target.entityId : Number(hint?.collectionId);
			const parentId = Number(hint?.parentId);
			return {
				// The server names the row (id) and where it stands (position). Until then the row sorts to
				// the top, which is where an added row goes.
				id: null,
				entityType: target.entityType,
				entityId: target.entityId,
				title,
				position: this.#topPosition() + 1,
				collectionId: Number.isInteger(collectionId) && collectionId > 0 ? collectionId : 0,
				parentId: Number.isInteger(parentId) && parentId > 0 ? parentId : null,
				// A chevron is only offered for a branch the row knows how to read.
				hasChildren: hint?.hasChildren === true && Number.isInteger(collectionId) && collectionId > 0,
				expandVia: hint?.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
				notify: {
					...EMPTY_NOTIFY
				},
				isProvisional: true
			};
		}

		// Answers whether the block took a provisional row: the caller has to know whether there is one to
		// take back if the write fails.
		#insertProvisionalRow(target, hint) {
			if (this.#findRow(target) !== null) {
				return false;
			}
			const row = this.#provisionalRow(target, hint);
			if (row === null || !this.#passesFilter(row)) {
				return false;
			}
			this.#putRow(row);
			// Kept with the press: a page read landing before the answer rebuilds the list from the server's
			// rows, and the provisional row is on none of them yet (see #reapplyUnanswered).
			const pending = this.#unanswered.get(favoriteKey(target.entityType, target.entityId));
			if (pending !== undefined) {
				pending.row = row;
			}
			return true;
		}

		// [DTO-01] One finished row into the block, in place of whatever stood under its key. Under the
		// notification filter a row that nothing reaches has no place on screen.
		#putRow(row) {
			const target = this.#normalizeTarget(row);
			if (target === null) {
				return;
			}
			const rest = this.#state.favorites.value.filter(item => !(item.entityType === target.entityType && Number(item.entityId) === target.entityId));
			if (this.#passesFilter(row)) {
				this.#forgetHidden(target);
				this.#state.favorites.value = this.#sort([...rest, row]);
				return;
			}

			// Off the screen, but into the snapshot the filter is switched off from: kept out of it, the row
			// would come back as it was before this update.
			this.#rememberHidden(row);
			this.#state.favorites.value = rest;
		}

		// The snapshot only holds rows the filter itself excluded, so it is written to and read from nowhere
		// but here, #dropRow and setFavoritesFilter.
		#rememberHidden(row) {
			const target = this.#normalizeTarget(row);
			if (target === null) {
				return;
			}
			this.#forgetHidden(target);
			this.#hiddenByFilter = [...this.#hiddenByFilter, row];
		}
		#forgetHidden(target) {
			if (this.#hiddenByFilter.length === 0) {
				return;
			}
			this.#hiddenByFilter = this.#hiddenByFilter.filter(row => !(row.entityType === target.entityType && Number(row.entityId) === target.entityId));
		}

		// Rows back onto the screen, in the order the server keeps them. A row on both sides is taken from
		// the screen: that copy is the one the block has been keeping level with the server.
		#restoreHidden() {
			const visible = this.#state.favorites.value;
			if (this.#hiddenByFilter.length === 0) {
				return visible;
			}
			const shown = new Set(visible.map(row => favoriteKey(row.entityType, Number(row.entityId))));
			const restored = this.#hiddenByFilter.filter(row => !shown.has(favoriteKey(row.entityType, Number(row.entityId))));
			this.#hiddenByFilter = [];
			return this.#sort([...visible, ...restored]);
		}

		// [TPL-02] The filter is a request parameter, so a row that arrives from anywhere but a page of the
		// list has to be held to it here.
		#passesFilter(row) {
			return this.#state.favoritesOnlyNotified.value !== true || row?.notify?.notified === true;
		}

		// Position of the first row of the block; order is POSITION DESC.
		#topPosition() {
			const rows = this.#state.favorites.value;
			return rows.length > 0 ? Number(rows[0].position) || 0 : 0;
		}

		// [ALG-01] Removal.
		async #removeFavorite(target) {
			const snapshot = this.#snapshotOf(target);
			this.#setIndex(target, false);
			this.#dropRow(target);
			try {
				await this.#api.removeFavorite(target);
			} catch (error) {
				this.#rollback(target, snapshot);
				this.#notify(this.#messages.favoriteRemoveFailed || error?.message || '');
				return true;
			}

			// Taking a row out reports nothing: the star itself is the feedback, and a toast for every press
			// is noise. There is no undo offer - the row goes back by pressing the star again, so the
			// removal response is not read here.
			return false;
		}
		async #load(append) {
			// Concurrent first reads collapse into one, the same way the accessible tree does it.
			while (!append && this.#state.favoritesRequest) {
				// eslint-disable-next-line no-await-in-loop
				await this.#state.favoritesRequest;
				if (!this.#state.favoritesStale.value) {
					return;
				}
			}
			const request = this.#loadRequest(append);
			if (append) {
				await request;
				return;
			}
			this.#state.favoritesRequest = request;
			try {
				await request;
			} finally {
				if (this.#state.favoritesRequest === request) {
					this.#state.favoritesRequest = null;
				}
			}
		}
		async #loadRequest(append) {
			this.#state.favoritesLoading.value = true;
			const staleToken = this.#state.favoritesStaleToken;
			try {
				const response = await this.#api.listFavorites({
					limit: PAGE_SIZE$1,
					afterCursor: append ? this.#state.favoritesCursor.value : null,
					onlyNotified: this.#state.favoritesOnlyNotified.value
				});
				this.#state.favorites.value = append ? this.#merge(this.#state.favorites.value, response.items) : this.#sort(response.items);
				this.#state.favoritesCursor.value = response.nextCursor;
				this.#state.favoritesHasNextPage.value = response.hasNextPage;
				this.#state.favoritesHydrated.value = true;
				this.#state.favoritesError.value = null;
				this.#state.favoritesErrorOnAppend.value = false;
				if (this.#state.favoritesStaleToken === staleToken) {
					this.#state.favoritesStale.value = false;
				}
				for (const row of response.items) {
					this.#state.favoriteIndex[favoriteKey(row.entityType, row.entityId)] = true;
				}
				this.#reapplyUnanswered();
			} catch (error) {
				// [ERR-004] The failure stays inside the block: the rest of the sidebar is untouched and
				// the block itself offers a retry.
				this.#state.favoritesError.value = this.#messages.favoritesLoadError || error?.message || '';
				this.#state.favoritesErrorOnAppend.value = append;
			} finally {
				this.#state.favoritesLoading.value = false;
			}
		}

		// A page read that set out before the press was built from state older than it, so returning it
		// verbatim would light a star back up that the user has just put out - and put it out again a moment
		// later, when the answer to the press arrives. The press wins until it is answered.
		#reapplyUnanswered() {
			for (const {
				target,
				value,
				row
			} of this.#unanswered.values()) {
				this.#setIndex(target, value);
				if (!value) {
					this.#dropRow(target);
					continue;
				}

				// The row the press put in the block belongs to the press as well: the page that has just
				// landed was read before it and knows nothing of it yet.
				if (row !== null && this.#findRow(target) === null) {
					this.#putRow(row);
				}
			}
		}
		#snapshotOf(target) {
			const row = this.#findRow(target);
			return {
				row: row === null ? null : {
					...row
				}
			};
		}
		#rollback(target, snapshot) {
			this.#setIndex(target, true);
			if (snapshot.row !== null) {
				this.#state.favorites.value = this.#sort([...this.#state.favorites.value, snapshot.row]);
			}
		}
		#setIndex(target, value) {
			const key = favoriteKey(target.entityType, target.entityId);
			const previous = this.#state.favoriteIndex[key];
			this.#state.favoriteIndex[key] = value;

			// Every star of the object on this page has to agree within the frame of the press, and the pull
			// event only arrives a moment later - so the flag is announced locally from the one place that
			// writes it. Announcing an adopted value back would bounce it, hence the guard.
			if (previous !== value && !this.#applyingExternalFavorite) {
				// Guarded the same way as the bell: the announcement comes back through the bus, and adopting
				// our own would cost a re-read of the list on every press (see applyExternalFavorite).
				this.#announcingFavorite = true;
				try {
					main_core_events.EventEmitter.emit(NoteEvent.FAVORITE_CHANGED, new main_core_events.BaseEvent({
						data: {
							entityType: target.entityType,
							entityId: target.entityId,
							isFavorite: value
						}
					}));
				} finally {
					this.#announcingFavorite = false;
				}
			}
		}

		// The other side of FAVORITE_CHANGED: a star pressed outside the sidebar (the activity line of the
		// editor, the knowledge base page) lands here, so the row lights up without waiting for pull.
		applyExternalFavorite(params) {
			if (this.#announcingFavorite) {
				return;
			}
			const target = this.#normalizeTarget(params);
			if (target === null) {
				return;
			}
			const value = params?.isFavorite === true;
			// `confirmed` says the sender has the server's answer behind it - the answer to the write, or the
			// refusal that rolled it back. Until then the press of another surface is as unanswered as one of
			// our own, and is protected the same way (see #reapplyUnanswered).
			const confirmed = params?.confirmed === true;
			const key = favoriteKey(target.entityType, target.entityId);
			this.#applyingExternalFavorite = true;
			try {
				this.#setIndex(target, value);
			} finally {
				this.#applyingExternalFavorite = false;
			}
			const pending = this.#unanswered.get(key) ?? null;
			if (confirmed) {
				this.#unanswered.delete(key);
			}
			const row = this.#findRow(target);
			if (!value) {
				// A provisional row is not a loaded one: taking it back leaves no hole in the page behind it.
				const droppedLoadedRow = row !== null && row.isProvisional !== true;
				if (row !== null) {
					this.#dropRow(target);
				}
				if (!confirmed) {
					// Nothing is re-read while the removal is unanswered: a page read racing it can be built
					// from state older than the press and would hand the row straight back.
					this.#unanswered.set(key, {
						target,
						value: false,
						row: null,
						hadRow: droppedLoadedRow
					});
					return;
				}

				// A loaded row that left the block leaves the page one row short, and only a read closes it -
				// but there is nothing to close it with unless the server still holds a next page.
				if ((droppedLoadedRow || pending?.hadRow === true) && this.#state.favoritesHasNextPage.value) {
					void this.reloadFavorites();
				}
				return;
			}

			// [DTO-01] The sender that has the server's answer reports the finished row with it, so the block
			// completes the row it drew on the press without a read of its own and without waiting for pull.
			const item = this.#api.normalizeFavoriteItem(params?.item);
			if (item !== null) {
				this.#putRow(item);
				return;
			}
			if (confirmed) {
				// Answered, and the answer carried no row: an older server, or an object the list does not
				// hand out. A provisional row cannot be left standing on that.
				if (row === null || row.isProvisional === true) {
					void this.reloadFavorites();
				}
				return;
			}

			// The optimistic announcement of the press: the star reports what it knows about its object, so the
			// row appears within the frame of the press. A star with no title to report keeps the read.
			if (row === null && !this.#insertProvisionalRow(target, params?.hint)) {
				void this.reloadFavorites();
				return;
			}
			this.#unanswered.set(key, {
				target,
				value: true,
				row: this.#findRow(target)
			});
		}
		#findRow(target) {
			return this.#state.favorites.value.find(row => row.entityType === target.entityType && Number(row.entityId) === target.entityId) ?? null;
		}
		#dropRow(target) {
			this.#state.favorites.value = this.#state.favorites.value.filter(row => !(row.entityType === target.entityType && Number(row.entityId) === target.entityId));
			// An object unstarred while the filter is on leaves the block whether it was on screen or waiting
			// out of it.
			this.#forgetHidden(target);
			// A row that leaves the block takes its expansion with it - its own and that of everything opened
			// inside its branch, whose keys carry the row's key as their scope. Starred again, it comes back
			// closed rather than with the branches it had before it was removed.
			const key = favoriteKey(target.entityType, target.entityId);
			const scopePrefix = `${key}/`;
			for (const map of [this.#state.favoritesExpanded, this.#state.favoritesBranchError, this.#state.favoritesBranchContext]) {
				for (const stored of Object.keys(map)) {
					if (stored === key || stored.startsWith(scopePrefix)) {
						delete map[stored];
					}
				}
			}
		}
		#patchRow(target, patch) {
			const next = this.#state.favorites.value.map(row => row.entityType === target.entityType && Number(row.entityId) === target.entityId ? {
				...row,
				...patch
			} : row);
			this.#state.favorites.value = this.#sort(next);
		}
		#applyPositions(rawEntries) {
			const positionByRowId = new Map();
			for (const entry of Array.isArray(rawEntries) ? rawEntries : []) {
				const id = Number(entry?.id);
				const position = Number(entry?.position);
				if (Number.isInteger(id) && id > 0 && Number.isFinite(position)) {
					positionByRowId.set(id, position);
				}
			}
			if (positionByRowId.size === 0) {
				return;
			}
			const next = this.#state.favorites.value.map(row => positionByRowId.has(Number(row.id)) ? {
				...row,
				position: positionByRowId.get(Number(row.id))
			} : row);
			this.#state.favorites.value = this.#sort(next);
		}
		#merge(current, incoming) {
			const merged = [...current];
			for (const row of incoming) {
				const index = merged.findIndex(item => Number(item.id) === Number(row.id));
				if (index >= 0) {
					merged[index] = {
						...merged[index],
						...row
					};
					continue;
				}
				merged.push(row);
			}
			return this.#sort(merged);
		}

		// [API-04] Server order: POSITION DESC, ID DESC.
		#sort(rows) {
			return [...rows].sort((left, right) => {
				const leftPosition = Number(left?.position || 0);
				const rightPosition = Number(right?.position || 0);
				if (leftPosition !== rightPosition) {
					return rightPosition - leftPosition;
				}
				return Number(right?.id || 0) - Number(left?.id || 0);
			});
		}
		#normalizeTarget(target) {
			const entityType = target?.entityType;
			const entityId = Number(target?.entityId);
			if (!ENTITY_TYPES.includes(entityType) || !Number.isInteger(entityId) || entityId <= 0) {
				return null;
			}
			return {
				entityType,
				entityId
			};
		}
	}

	class SidebarHydrationActions {
		#state;
		#keyOf;
		#normalizeParentId;
		constructor({
			state,
			keyOf,
			normalizeParentId
		}) {
			this.#state = state;
			this.#keyOf = keyOf;
			this.#normalizeParentId = normalizeParentId;
		}
		hydrateFromInitialContext(context) {
			if (!main_core.Type.isPlainObject(context)) {
				return false;
			}
			const normalizedDocument = this.#normalizeDocument(context.document);
			if (!normalizedDocument) {
				return false;
			}
			const selectedCollectionId = this.#toPositiveInt(context.selectedCollectionId ?? context.collectionId ?? normalizedDocument.collectionId);
			const selectedDocId = this.#toPositiveInt(context.selectedDocId ?? normalizedDocument.id);
			if (selectedCollectionId === null || selectedDocId === null) {
				return false;
			}
			this.#hydrateBranches(context.branches, selectedCollectionId);
			this.#hydrateExpandedDocs(context.expandedDocs);
			this.#state.selectedCollectionId.value = selectedCollectionId;
			this.#state.selectedDocId.value = selectedDocId;
			return true;
		}
		hydrateInitialCollections(payload) {
			if (!main_core.Type.isPlainObject(payload)) {
				return false;
			}
			this.setGlobalPermissions(payload.permissions);
			const rawItems = Array.isArray(payload.items) ? payload.items : [];
			const collections = rawItems.map(item => this.#normalizeCollection(item)).filter(item => item !== null);
			this.#state.collections.value = collections;
			this.#state.collectionsCursor.value = payload.nextCursor ?? null;
			this.#state.collectionsHasNextPage.value = payload.nextCursor !== null && payload.nextCursor !== undefined;
			this.#state.collectionsLoading.value = false;
			return true;
		}
		setGlobalPermissions(rawPermissions) {
			const normalized = this.#normalizeGlobalPermissions(rawPermissions);
			this.#state.globalPermissions.canEditCollections = normalized.canEditCollections;
			this.#state.globalPermissions.canEditGlobalPermissions = normalized.canEditGlobalPermissions;
			this.#state.globalPermissions.canImport = normalized.canImport;
			this.#state.globalPermissions.canImportWiki = normalized.canImportWiki;
			this.#state.globalPermissions.hasManageableCollection = normalized.hasManageableCollection;
		}
		#hydrateBranches(rawBranches, fallbackCollectionId) {
			if (!main_core.Type.isPlainObject(rawBranches)) {
				return;
			}
			for (const [rawKey, rawDocuments] of Object.entries(rawBranches)) {
				const branchMeta = this.#parseBranchKey(rawKey, fallbackCollectionId);
				if (!branchMeta) {
					continue;
				}
				const documents = Array.isArray(rawDocuments) ? rawDocuments.map(item => this.#normalizeDocument(item)).filter(item => item !== null) : [];
				const key = this.#keyOf(branchMeta.collectionId, branchMeta.parentId);
				this.#state.docsByParent[key] = documents;
				this.#state.docsOffsetByParent[key] = documents.length;
				this.#state.docsLoadingByParent[key] = false;
				this.#state.docsHasNextPageByParent[key] = false;
				this.#state.docsHydratedByParent[key] = true;
				this.#state.docsStaleByParent[key] = false;
			}
		}
		#hydrateExpandedDocs(rawExpandedDocs) {
			if (!main_core.Type.isPlainObject(rawExpandedDocs)) {
				return;
			}
			for (const [rawDocId, rawIsExpanded] of Object.entries(rawExpandedDocs)) {
				const docId = this.#toPositiveInt(rawDocId);
				if (docId === null || !rawIsExpanded) {
					continue;
				}
				this.#state.expandedDocs[docId] = true;
			}
		}
		#parseBranchKey(rawKey, fallbackCollectionId) {
			if (!main_core.Type.isStringFilled(rawKey)) {
				return null;
			}
			const [rawCollectionId, rawParentToken] = rawKey.split(':');
			const collectionId = this.#toPositiveInt(rawCollectionId) ?? fallbackCollectionId;
			if (collectionId === null) {
				return null;
			}
			if (rawParentToken === 'root') {
				return {
					collectionId,
					parentId: null
				};
			}
			const parentId = this.#normalizeParentId(rawParentToken);
			if (parentId === null) {
				return null;
			}
			return {
				collectionId,
				parentId
			};
		}
		#normalizeCollection(rawCollection) {
			if (!main_core.Type.isPlainObject(rawCollection)) {
				return null;
			}
			const id = this.#toPositiveInt(rawCollection.id);
			if (id === null) {
				return null;
			}
			const name = String(rawCollection.name ?? '').trim();
			return {
				...rawCollection,
				id,
				name: name === '' ? `#${id}` : name,
				position: Number.isFinite(Number(rawCollection.position)) ? Number(rawCollection.position) : 0,
				canEditCollection: Boolean(rawCollection.canEditCollection),
				canManagePermissions: Boolean(rawCollection.canManagePermissions),
				hasDescription: Boolean(rawCollection.hasDescription),
				mainDocumentId: Number(rawCollection.mainDocumentId) || 0
			};
		}
		#normalizeDocument(rawDocument) {
			if (!main_core.Type.isPlainObject(rawDocument)) {
				return null;
			}
			const id = this.#toPositiveInt(rawDocument.id);
			const collectionId = this.#toPositiveInt(rawDocument.collectionId);
			if (id === null || collectionId === null) {
				return null;
			}
			return {
				...rawDocument,
				id,
				collectionId,
				parentId: this.#normalizeParentId(rawDocument.parentId),
				title: String(rawDocument.title ?? ''),
				collectionTitle: String(rawDocument.collectionTitle ?? ''),
				position: Number.isFinite(Number(rawDocument.position)) ? Number(rawDocument.position) : 0,
				hasChildren: Boolean(rawDocument.hasChildren),
				isArchived: Boolean(rawDocument.isArchived)
			};
		}
		#toPositiveInt(value) {
			const parsed = Number(value);
			if (!Number.isInteger(parsed) || parsed <= 0) {
				return null;
			}
			return parsed;
		}
		#normalizeGlobalPermissions(rawPermissions) {
			if (!main_core.Type.isPlainObject(rawPermissions)) {
				return {
					canEditCollections: false,
					canEditGlobalPermissions: false,
					canImport: false,
					canImportWiki: false,
					hasManageableCollection: false
				};
			}
			return {
				canEditCollections: Boolean(rawPermissions.canEditCollections),
				canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
				canImport: Boolean(rawPermissions.canImport),
				canImportWiki: Boolean(rawPermissions.canImportWiki),
				hasManageableCollection: Boolean(rawPermissions.hasManageableCollection)
			};
		}
	}

	const PullCommand = Object.freeze({
		DOCUMENT_CREATE: 'documentCreate',
		DOCUMENT_UPDATE: 'documentUpdate',
		DOCUMENT_MOVE: 'documentMove',
		DOCUMENT_ARCHIVE: 'documentArchive',
		DOCUMENT_RESTORE: 'documentRestore',
		DOCUMENT_DELETE: 'documentDelete',
		DOCUMENT_HARD_DELETE: 'documentHardDelete',
		COLLECTION_CREATE: 'collectionCreate',
		COLLECTION_UPDATE: 'collectionUpdate',
		COLLECTION_MOVE: 'collectionMove',
		COLLECTION_ARCHIVE: 'collectionArchive',
		COLLECTION_RESTORE: 'collectionRestore',
		COLLECTION_DELETE: 'collectionDelete',
		COLLECTION_CAPABILITIES: 'collectionCapabilities',
		COLLECTION_LIST_INVALIDATED: 'collectionListInvalidated',
		DOCUMENT_ACCESS_CASCADE: 'documentAccessCascade',
		// [EVENT-01] Personal channel: the composition of the favorites block.
		FAVORITE_ADD: 'favoriteAdd',
		FAVORITE_REMOVE: 'favoriteRemove',
		FAVORITE_MOVE: 'favoriteMove',
		// [EVENT-02] Personal channel: the notification state of an object of the block.
		SUBSCRIPTION_SET: 'subscriptionSet',
		SUBSCRIPTION_REMOVE: 'subscriptionRemove'
	});
	class SidebarPullActions {
		#state;
		#handlers;
		#subscriptions;
		#subscribed;
		constructor({
			state,
			handlers
		}) {
			this.#state = state;
			this.#handlers = handlers || {};
			this.#subscriptions = [];
			this.#subscribed = false;
		}
		subscribeToPullEvents() {
			if (this.#subscribed) {
				this.#refreshCollectionWatches();
				return;
			}
			if (!main_core.Type.isFunction(BX?.PULL?.subscribe)) {
				return;
			}
			const knownCommands = new Set(Object.values(PullCommand));
			const handler = data => {
				// Drop foreign/out-of-spec pushes before any bus traffic or warn noise —
				// only commands declared in PullCommand are routed.
				if (!data || !knownCommands.has(data.command)) {
					return;
				}

				// Cross-route bus: re-emit on EventEmitter so non-sidebar pages
				// (e.g. /shared/) can react without subscribing to BX.PULL directly.
				main_core_events.EventEmitter.emit(NoteEvent.PULL_EVENT, new main_core_events.BaseEvent({
					data: {
						command: data.command,
						params: data.params || {}
					}
				}));
				const dispatch = this.#handlers[data.command];
				if (typeof dispatch !== 'function') {
					console.warn('[NOTE PULL SIDEBAR] no handler for', data.command);
					return;
				}
				dispatch(data.params || {});
			};
			const unsubscribeServer = BX.PULL.subscribe({
				type: pull_client.PullClient.SubscriptionType.Server,
				moduleId: 'note',
				callback: handler
			});
			if (main_core.Type.isFunction(unsubscribeServer)) {
				this.#subscriptions.push(unsubscribeServer);
			}
			BX.PULL.extendWatch('NOTE_GLOBAL');
			this.#refreshCollectionWatches();
			this.#subscribed = true;
		}
		unsubscribeFromPullEvents() {
			for (const unsub of this.#subscriptions) {
				if (main_core.Type.isFunction(unsub)) {
					unsub();
				}
			}
			this.#subscriptions = [];
			this.#subscribed = false;
		}
		refreshCollectionWatches() {
			this.#refreshCollectionWatches();
		}
		#refreshCollectionWatches() {
			if (!main_core.Type.isFunction(BX?.PULL?.extendWatch)) {
				return;
			}
			const collections = this.#state.collections.value || [];
			for (const collection of collections) {
				const id = Number(collection?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				BX.PULL.extendWatch(`NOTE_COLLECTION_${id}`);
				BX.PULL.extendWatch(`NOTE_COLLECTION_${id}_ACL`);
			}
		}
	}

	class SidebarSelectionActions {
		#state;
		#ensureChildrenLoaded;
		constructor({
			state,
			ensureChildrenLoaded
		}) {
			this.#state = state;
			this.#ensureChildrenLoaded = ensureChildrenLoaded;
		}
		async selectCollection(collectionId, options = {}) {
			const preserveDocumentSelection = Boolean(options?.preserveDocumentSelection);
			this.#state.selectedCollectionId.value = Number(collectionId);
			this.#state.selectedSharedView.value = false;
			this.#state.selectedArchiveView.value = false;
			this.#state.selectedRecycleBinView.value = false;
			if (!preserveDocumentSelection) {
				this.#state.selectedDocId.value = null;
			}
			await this.#ensureChildrenLoaded(this.#state.selectedCollectionId.value, null);
		}
		selectDocument(docId) {
			if (docId === null || docId === undefined || docId === '') {
				this.#state.selectedDocId.value = null;
				return;
			}
			this.#state.selectedDocId.value = Number(docId);
			this.#state.selectedSharedView.value = false;
			this.#state.selectedArchiveView.value = false;
			this.#state.selectedRecycleBinView.value = false;
		}
		clearSelection() {
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
		}
		clearDocumentSelection() {
			this.#state.selectedDocId.value = null;
		}
		setSharedView(active) {
			const next = Boolean(active);
			this.#state.selectedSharedView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedArchiveView.value = false;
				this.#state.selectedRecycleBinView.value = false;
			}
		}
		setArchiveView(active) {
			const next = Boolean(active);
			this.#state.selectedArchiveView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedSharedView.value = false;
				this.#state.selectedRecycleBinView.value = false;
			}
		}
		setRecycleBinView(active) {
			const next = Boolean(active);
			this.#state.selectedRecycleBinView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedSharedView.value = false;
				this.#state.selectedArchiveView.value = false;
			}
		}
	}

	class SidebarStoreQueries {
		#state;
		#keyOf;
		#treeFavoriteFlags;
		#favoriteRowsByKey;
		constructor(state, keyOf) {
			this.#state = state;
			this.#keyOf = keyOf;
			// [P2] The block's expansion space as TreeNode reads expansion: by document id - but one map per
			// top-level row, because that is the scope a place belongs to (see favoriteExpandKey). Rows
			// nested in a branch of the block are ordinary tree rows, and this is what lets them share one
			// component with the tree while answering to the block's own flags, without a document opened
			// under one row opening the same document under another.
			this.favoritesExpandedDocs = ui_vue3.computed(() => {
				const byScope = {};
				for (const [key, value] of Object.entries(this.#state.favoritesExpanded)) {
					const separator = key.lastIndexOf('/');
					if (value !== true || separator < 0) {
						continue;
					}
					const scope = key.slice(0, separator);
					const [entityType, entityId] = key.slice(separator + 1).split(':');
					if (entityType !== 'document') {
						continue;
					}
					byScope[scope] = byScope[scope] ?? {};
					byScope[scope][entityId] = true;
				}
				return byScope;
			});
			// Both of the maps below answer a question every rendered row asks on every reactivity tick.
			// Kept as keyed maps rather than a scan per row: with the sidebar loaded the scan is over all
			// loaded documents, so a row-by-row lookup is quadratic in the size of the tree.
			this.#treeFavoriteFlags = ui_vue3.computed(() => {
				const flags = {};
				// Regular buckets last: the same document reachable both ways answers from the tree the star
				// of the block was drawn in, which is the order findLoadedDocumentAnywhere kept.
				for (const buckets of [this.#state.sharedDocsByParent, this.#state.docsByParent]) {
					for (const docs of Object.values(buckets)) {
						if (!Array.isArray(docs)) {
							continue;
						}
						for (const doc of docs) {
							flags[String(Number(doc.id))] = doc.isFavorite === true;
						}
					}
				}
				return flags;
			});
			this.#favoriteRowsByKey = ui_vue3.computed(() => {
				const rows = {};
				for (const item of this.#state.favorites.value) {
					rows[favoriteKey(item.entityType, Number(item.entityId))] = item;
				}
				return rows;
			});
			this.currentRootDocs = ui_vue3.computed(() => {
				if (!this.#state.selectedCollectionId.value) {
					return [];
				}
				return this.getChildren(this.#state.selectedCollectionId.value, null);
			});
		}
		getChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return this.#state.docsByParent[key] || [];
		}
		findLoadedDocument(collectionId, docId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedDocId = Number(docId);
			const keyPrefix = `${normalizedCollectionId}:`;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				const found = docs.find(doc => Number(doc.id) === normalizedDocId);
				if (found) {
					return found;
				}
			}
			return null;
		}
		findLoadedDocumentAnywhere(docId) {
			const normalizedDocId = Number(docId);
			if (!Number.isInteger(normalizedDocId) || normalizedDocId <= 0) {
				return null;
			}
			for (const docs of Object.values(this.#state.docsByParent)) {
				if (!Array.isArray(docs)) {
					continue;
				}
				const found = docs.find(doc => Number(doc.id) === normalizedDocId);
				if (found) {
					return found;
				}
			}
			return null;
		}
		isDocumentLoadedAnywhere(docId) {
			return this.findLoadedDocumentAnywhere(docId) !== null;
		}

		// Returns ancestors from the closest-to-root to the direct parent (the document itself excluded).
		// Walks docsByParent: keys are `${collectionId}:${parentId}`. Stops if the chain breaks.
		getAncestorsForDocument(docId) {
			const startId = Number(docId);
			if (!Number.isInteger(startId) || startId <= 0) {
				return [];
			}
			const ancestors = [];
			const visited = new Set();
			let currentId = startId;
			while (currentId > 0 && !visited.has(currentId)) {
				visited.add(currentId);
				let foundDoc = null;
				let parentId = 0;
				for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
					if (!Array.isArray(docs)) {
						continue;
					}
					const found = docs.find(doc => Number(doc.id) === currentId);
					if (!found) {
						continue;
					}
					foundDoc = found;
					const colonIndex = key.indexOf(':');
					const parentPart = colonIndex >= 0 ? key.slice(colonIndex + 1) : '';
					parentId = parentPart === 'root' ? 0 : Number(parentPart) || 0;
					break;
				}
				if (!foundDoc) {
					break;
				}
				if (currentId !== startId) {
					ancestors.unshift({
						id: Number(foundDoc.id),
						title: String(foundDoc.title || '')
					});
				}
				currentId = parentId;
			}
			return ancestors;
		}
		findCollection(collectionId) {
			const normalizedId = Number(collectionId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return null;
			}
			const collections = this.#state.collections.value;
			if (!Array.isArray(collections)) {
				return null;
			}
			return collections.find(collection => Number(collection.id) === normalizedId) || null;
		}

		// [TPL-02] The star of any row. Two sources feed the answer: the index the block keeps (loaded
		// pages, optimistic toggles, pull events) and, for objects no loaded page mentions, the isFavorite
		// flag the server puts on the entity itself (TPL-01). The index wins - it is the fresher of the two.
		isFavorite(entityType, entityId) {
			const id = Number(entityId);
			if (!Number.isInteger(id) || id <= 0) {
				return false;
			}
			const indexed = this.#state.favoriteIndex[favoriteKey(entityType, id)];
			if (indexed !== undefined) {
				return indexed === true;
			}
			if (entityType === 'collection') {
				return this.findCollection(id)?.isFavorite === true;
			}
			return this.#treeFavoriteFlags.value[String(id)] === true;
		}

		// [P2] Expansion of a top-level block row. Nested rows are answered by favoritesExpandedDocs.
		isFavoriteExpanded(entityType, entityId) {
			return this.#state.favoritesExpanded[favoriteExpandKey(entityType, entityId)] === true;
		}

		// [DTO-02] Notification state of one object. A row of the block answers from the list it came
		// with; a document nested in an opened branch answers from the coverage map (API-06). Objects
		// neither the list nor an opened branch mentions have no state - and no bell.
		favoriteNotify(entityType, entityId) {
			const id = Number(entityId);
			if (!Number.isInteger(id) || id <= 0) {
				return null;
			}
			const row = this.#favoriteRowsByKey.value[favoriteKey(entityType, id)];
			if (row !== undefined) {
				return row.notify ?? null;
			}
			return entityType === 'document' ? this.#state.favoritesCoverage[String(id)] ?? null : null;
		}
		isFavoriteNotifyPending(entityType, entityId) {
			return this.#state.favoritesNotifyPending[favoriteKey(entityType, Number(entityId))] === true;
		}

		// [ERR-005] The failure of a branch belongs to the PLACE that opened it, so it is asked for by the
		// same key the loader wrote it under - scope included (see favoriteExpandKey). Asked without the
		// scope, the failure of a nested branch was never found and its row stood open over nothing.
		favoriteBranchError(entityType, entityId, scope = '') {
			return this.#state.favoritesBranchError[favoriteExpandKey(entityType, entityId, scope)] ?? null;
		}
		isLoadingChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsLoadingByParent[key]);
		}
		hasNextChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHasNextPageByParent[key]);
		}
		isChildrenHydrated(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHydratedByParent[key]) && !this.#state.docsStaleByParent[key];
		}
		isBranchLoaded(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHydratedByParent[key]) || Array.isArray(this.#state.docsByParent[key]);
		}
	}

	class SidebarBranchUtils {
		#state;
		#keyOf;
		constructor(state, keyOf) {
			this.#state = state;
			this.#keyOf = keyOf;
		}
		setBranchDocs(collectionId, parentId, list, {
			keepHasNext = true
		} = {}) {
			const key = this.#keyOf(collectionId, parentId);
			const normalizedList = Array.isArray(list) ? list : [];
			this.#state.docsByParent[key] = normalizedList;
			this.#state.docsOffsetByParent[key] = normalizedList.length;
			this.#state.docsHydratedByParent[key] = true;
			this.#state.docsStaleByParent[key] = false;
			if (!keepHasNext) {
				this.#state.docsHasNextPageByParent[key] = false;
			}
		}
		removeBranch(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			delete this.#state.docsByParent[key];
			delete this.#state.docsLoadingByParent[key];
			delete this.#state.docsHasNextPageByParent[key];
			delete this.#state.docsOffsetByParent[key];
			delete this.#state.docsCursorByParent[key];
			delete this.#state.docsHydratedByParent[key];
			delete this.#state.docsStaleByParent[key];
			delete this.#state.docsRequestByParent[key];
		}
	}

	class SidebarStoreState {
		constructor() {
			this.collections = ui_vue3.ref([]);
			this.collectionsLoading = ui_vue3.ref(false);
			this.collectionsCursor = ui_vue3.ref(null);
			this.collectionsHasNextPage = ui_vue3.ref(true);
			this.globalPermissions = ui_vue3.reactive({
				canEditCollections: false,
				canEditGlobalPermissions: false,
				canImport: false,
				canImportWiki: false,
				hasManageableCollection: false
			});
			this.selectedCollectionId = ui_vue3.ref(null);
			this.selectedDocId = ui_vue3.ref(null);
			this.selectedSharedView = ui_vue3.ref(false);
			this.selectedArchiveView = ui_vue3.ref(false);
			this.selectedRecycleBinView = ui_vue3.ref(false);
			this.expandedDocs = ui_vue3.reactive({});
			this.docsByParent = ui_vue3.reactive({});
			this.docsLoadingByParent = ui_vue3.reactive({});
			this.docsHasNextPageByParent = ui_vue3.reactive({});
			this.docsOffsetByParent = ui_vue3.reactive({});
			this.docsCursorByParent = ui_vue3.reactive({});
			this.docsHydratedByParent = ui_vue3.reactive({});
			this.docsStaleByParent = ui_vue3.reactive({});
			this.docsRequestByParent = {};

			// Accessible-tree ("Shared with me") section — a branch namespace parallel to docsByParent,
			// keyed via sharedKey/sharedRootKey. The expanded flag lives here (not in feature uiState)
			// because the pull handler must read it to honour the lazy-load / mark-stale contract.
			this.sharedSectionExpanded = ui_vue3.ref(false);
			this.sharedLoading = ui_vue3.ref(false);
			this.sharedHydrated = ui_vue3.ref(false);
			this.sharedStale = ui_vue3.ref(false);
			// Bumped by every invalidation. A read that started before the bump must not report the
			// section fresh: its response predates the change that marked it stale. Plain counter —
			// nothing renders it.
			this.sharedStaleToken = 0;
			this.sharedHasNextPage = ui_vue3.ref(false);
			this.sharedCursor = ui_vue3.ref(null);
			this.sharedContainers = ui_vue3.ref([]);
			this.sharedDocsByParent = ui_vue3.reactive({});
			// Per-branch loading/cursor bookkeeping for the nested levels, mirroring docs*ByParent.
			// Root branches are excluded: they arrive with the section page and paginate globally.
			this.sharedDocsLoadingByParent = ui_vue3.reactive({});
			this.sharedDocsHasNextPageByParent = ui_vue3.reactive({});
			this.sharedDocsCursorByParent = ui_vue3.reactive({});
			this.sharedDocsHydratedByParent = ui_vue3.reactive({});
			this.sharedDocsRequestByParent = {};
			// Per-container disclosure, keyed by collectionId. Empty = every container collapsed by
			// default (mirrors the regular collection list), so the branch is revealed on demand.
			this.sharedExpandedContainers = ui_vue3.reactive({});
			this.sharedRequest = null;

			// [P1] Favorites block. The list is server-owned and paginated by its own keyset cursor.
			this.favorites = ui_vue3.ref([]);
			// Whether the block stands open. Here rather than inside the component drawing it, for the same
			// reason sharedSectionExpanded is here: the rail of the collapsed panel opens the block its entry
			// leads to, and the rail is drawn instead of that component, not around it.
			this.favoritesSectionExpanded = ui_vue3.ref(true);
			this.favoritesLoading = ui_vue3.ref(false);
			this.favoritesHydrated = ui_vue3.ref(false);
			this.favoritesStale = ui_vue3.ref(false);
			// The one read the block stays on screen for even with nothing to show: the page under a filter
			// just switched. Every other read leaves the visibility of the block to its contents - held up by
			// a read of its own, an empty block appeared for the length of every access push.
			this.favoritesFilterReloading = ui_vue3.ref(false);
			// Bumped by every invalidation, same contract as sharedStaleToken: a read that started before
			// the bump must not report the list fresh.
			this.favoritesStaleToken = 0;
			this.favoritesHasNextPage = ui_vue3.ref(false);
			this.favoritesCursor = ui_vue3.ref(null);
			// Server-side filter of the block. Deliberately not persisted (AC-059).
			this.favoritesOnlyNotified = ui_vue3.ref(false);
			this.favoritesError = ui_vue3.ref(null);
			// [ERR-006] Which read failed. A failed next page is retried as a next page: re-reading the
			// first one would throw away the rows already on screen and put the user back at the top.
			this.favoritesErrorOnAppend = ui_vue3.ref(false);
			// Stars ask this index, keyed `entityType:entityId`, because they also live on objects that are
			// on no loaded page of the block. Written per key only - never wiped as a whole, or a filtered
			// page would report everything it omits as unstarred.
			this.favoriteIndex = ui_vue3.reactive({});
			// Toggles in flight, same keys: a second press must not put the same change on the wire twice.
			this.favoritesPending = ui_vue3.reactive({});
			this.favoritesRequest = null;

			// [P2] Expansion space of the block, same keys. Deliberately separate from expandedDocs: the
			// same document may be open here and closed in the tree (AC-040). Only the flags are separate -
			// the branches themselves are read from docsByParent / sharedDocsByParent, so a branch already
			// loaded for the tree is not loaded again and an edit in the tree shows up here at once.
			this.favoritesExpanded = ui_vue3.reactive({});
			// [P4] Coverage states (DTO-02) of the documents inside opened branches of the block, keyed by
			// document id. Read with API-06 once per branch: the branch responses of the tree carry no
			// notifications and must not - the tree itself draws no bells (AC-048).
			this.favoritesCoverage = ui_vue3.reactive({});
			// Which branch each opened row reads, keyed the same way as favoritesExpanded:
			// `{ collectionId, parentId, expandVia }`. A subscription on a knowledge base (or on a subtree)
			// changes the coverage of every document under it, and re-reading that needs the branch
			// coordinates - the coverage map itself is keyed by document id and cannot give them back.
			// Not reactive: nothing renders it.
			this.favoritesBranchContext = {};
			// Notification writes in flight, keyed `entityType:entityId`: a second press must not race the
			// first, and the popover of the row disables its options while one is on the wire.
			this.favoritesNotifyPending = ui_vue3.reactive({});
			// Branch of a block row that failed to load, same keys. Kept per row so the failure stays
			// inside the row it belongs to (ERR-005) instead of taking the whole block down.
			this.favoritesBranchError = ui_vue3.reactive({});
		}
	}

	class SidebarStore {
		constructor(api, {
			messages = {},
			notify = () => {}
		} = {}) {
			const bind = (instance, methodName) => instance[methodName].bind(instance);
			const internalState = new SidebarStoreState();
			const errorActions = new SidebarErrorActions();
			const queryService = new SidebarStoreQueries(internalState, keyOf);
			const branchUtils = new SidebarBranchUtils(internalState, keyOf);
			const setBranchDocs = (collectionId, parentId, list, options = {}) => {
				branchUtils.setBranchDocs(collectionId, parentId, list, options);
			};
			const removeBranch = (collectionId, parentId = null) => {
				branchUtils.removeBranch(collectionId, parentId);
			};
			const setError = message => {
				errorActions.setError(message);
			};

			// Late-bound: favoriteActions is constructed below, after the collaborators it needs.
			let favoriteActionsRef = null;
			// A rename has to reach the copy of the title the favorites block keeps, and both local patchers
			// are the choke points every rename passes through - local edit, pull, adopted event alike.
			const patchFavoriteTitle = (entityType, entityId, title) => favoriteActionsRef?.patchFavoriteTitle(entityType, entityId, title) === true;
			const documentActions = new SidebarDocumentActions({
				api,
				state: internalState,
				queries: queryService,
				keyOf,
				normalizeParentId,
				setBranchDocs,
				removeBranch,
				setError,
				patchFavoriteTitle
			});
			const hydrationActions = new SidebarHydrationActions({
				state: internalState,
				keyOf,
				normalizeParentId
			});
			const accessibleTreeActions = new SidebarAccessibleTreeActions({
				api,
				state: internalState,
				sharedKey,
				sharedRootKey,
				setError,
				// Late-bound like patchFavoriteTitle above: the block is built below, and it is the other
				// reader of this namespace.
				onBranchesDropped: branches => favoriteActionsRef?.reloadOpenBranches(branches)
			});
			const applyDocumentAccessCascade = bind(accessibleTreeActions, 'applyDocumentAccessCascade');

			// Late-bound: pullActions is constructed below after the dispatch table is built.
			let pullActionsRef = null;
			const collectionActions = new SidebarCollectionActions({
				api,
				state: internalState,
				setError,
				setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
				removeBranch,
				refreshCollectionWatches: () => pullActionsRef?.refreshCollectionWatches(),
				patchFavoriteTitle
			});
			const ensureChildrenLoaded = bind(documentActions, 'ensureChildrenLoaded');
			const selectionActions = new SidebarSelectionActions({
				state: internalState,
				ensureChildrenLoaded
			});
			const favoriteActions = new SidebarFavoriteActions({
				api,
				state: internalState,
				messages,
				notify,
				isFavorite: bind(queryService, 'isFavorite'),
				// [ALG-02] The block owns the expansion flags, not the branches: both namespaces are read
				// through their existing loaders, so a branch is never fetched twice.
				ensureChildrenLoaded,
				ensureAccessibleChildrenLoaded: (collectionId, parentId) => accessibleTreeActions.prefetchSharedChildren({
					collectionId,
					id: parentId
				}),
				isBranchLoaded: bind(queryService, 'isBranchLoaded'),
				isAccessibleBranchLoaded: bind(accessibleTreeActions, 'isSharedBranchHydrated'),
				// [API-06] Which documents an opened branch holds - the set whose coverage is asked for.
				getBranchDocs: (collectionId, parentId, isShared) => isShared ? accessibleTreeActions.getSharedChildren(collectionId, parentId) : queryService.getChildren(collectionId, parentId),
				notifyStateOf: bind(queryService, 'favoriteNotify')
			});
			favoriteActionsRef = favoriteActions;
			const expansionActions = new SidebarExpansionActions({
				state: internalState,
				getChildren: bind(queryService, 'getChildren'),
				ensureChildrenLoaded
			});

			// Pull-router dispatch table. Phase 1 handlers are wired below.
			// The composition of the favorites block is decided outside it - by access and by the life of the
			// objects themselves - so the actions that decide it answer for the block too. Wrapped here at the
			// bind rather than in the dispatch table below, because the same functions are what the local
			// paths call: the initiator of a deletion never receives the push describing it.
			const alsoRefreshFavorites = handler => params => {
				const result = handler(params);
				favoriteActions.invalidateComposition();
				return result;
			};
			const applyDocumentUpdate = bind(documentActions, 'applyDocumentUpdate');
			const applyDocumentMove = bind(documentActions, 'applyDocumentMove');
			// To the bin and back: the server hides trashed documents from the list, so the row has to go
			// with the document and come back with it.
			const applyDocumentRemoval = alsoRefreshFavorites(bind(documentActions, 'applyDocumentRemoval'));
			const applyDocumentActive = alsoRefreshFavorites(bind(documentActions, 'applyDocumentActive'));
			const applyDocumentCreate = bind(documentActions, 'applyDocumentCreate');
			const applyCollectionCreate = bind(collectionActions, 'applyCollectionCreate');
			// A deleted knowledge base takes the favorite rows on it with it, and its documents go to the
			// bin; archiving only changes how the row reads, but the row has no other way to learn of it.
			const applyCollectionDelete = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionDelete'));
			const applyCollectionArchive = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionArchive'));
			const applyCollectionRestore = alsoRefreshFavorites(bind(collectionActions, 'applyCollectionRestore'));
			const applyCollectionUpdate = bind(collectionActions, 'applyCollectionUpdate');
			const applyCollectionMove = bind(collectionActions, 'applyCollectionMove');
			const applyCollectionCapabilities = bind(collectionActions, 'applyCollectionCapabilities');
			const applyCollectionListInvalidated = bind(collectionActions, 'applyCollectionListInvalidated');
			// Pull-driven applies: emit DOCUMENT_CHILDREN_CHANGED for affected parents so
			// editor children-block (note-app subscription) refreshes on remote events.
			const emitChildrenChanged = (collectionId, parentId) => {
				const pid = Number(parentId);
				const cid = Number(collectionId);
				if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(cid) || cid <= 0) {
					return;
				}
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
					data: {
						parentId: pid,
						collectionId: cid
					}
				}));
			};
			const pullDocumentCreate = async params => {
				const result = await applyDocumentCreate(params);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentMove = async params => {
				const result = await applyDocumentMove(params);
				emitChildrenChanged(params?.fromCollectionId ?? params?.collectionId, params?.fromParentId);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentActive = async params => {
				const result = await applyDocumentActive(params);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentRemoval = async params => {
				// Pre-compute affected parents from store before removal mutates it.
				const affectedParents = [];
				const ids = Array.isArray(params?.documentIds) ? params.documentIds : [];
				for (const rawId of ids) {
					const id = Number(rawId);
					if (!Number.isFinite(id) || id <= 0) {
						continue;
					}
					const found = queryService.findLoadedDocumentAnywhere(id);
					if (found && Number(found.parentId) > 0) {
						affectedParents.push({
							collectionId: Number(found.collectionId),
							parentId: Number(found.parentId)
						});
					}
				}
				const result = await applyDocumentRemoval(params);
				for (const ap of affectedParents) {
					emitChildrenChanged(ap.collectionId, ap.parentId);
				}
				return result;
			};

			// Tree events reach a document-grant recipient on their personal channel, marked with
			// sharedScope: the collection namespace is not theirs to touch (they have no collection
			// access), so those payloads are applied to the accessible-tree namespace instead.
			const sharedScoped = params => params?.sharedScope === true;
			const applySharedUpsert = bind(accessibleTreeActions, 'applySharedDocumentUpsert');
			const applySharedUpdate = bind(accessibleTreeActions, 'applySharedDocumentUpdate');
			const applySharedRemoval = bind(accessibleTreeActions, 'applySharedDocumentRemoval');
			const routeByScope = (sharedHandler, collectionHandler) => params => sharedScoped(params) ? sharedHandler(params) : collectionHandler(params);
			const handlers = {
				[PullCommand.DOCUMENT_CREATE]: routeByScope(applySharedUpsert, pullDocumentCreate),
				[PullCommand.DOCUMENT_UPDATE]: routeByScope(applySharedUpdate, applyDocumentUpdate),
				[PullCommand.DOCUMENT_MOVE]: pullDocumentMove,
				[PullCommand.DOCUMENT_ARCHIVE]: routeByScope(applySharedRemoval, pullDocumentRemoval),
				[PullCommand.DOCUMENT_RESTORE]: routeByScope(applySharedUpsert, pullDocumentActive),
				[PullCommand.DOCUMENT_DELETE]: routeByScope(applySharedRemoval, pullDocumentRemoval),
				// Nothing left for the trees to do - the document left them when it went to the bin - but the
				// favorite rows pointing at it are deleted for good at this moment, server-side.
				[PullCommand.DOCUMENT_HARD_DELETE]: () => favoriteActions.invalidateComposition(),
				[PullCommand.COLLECTION_CREATE]: applyCollectionCreate,
				[PullCommand.COLLECTION_UPDATE]: applyCollectionUpdate,
				[PullCommand.COLLECTION_MOVE]: applyCollectionMove,
				[PullCommand.COLLECTION_ARCHIVE]: routeByScope(applySharedRemoval, applyCollectionArchive),
				[PullCommand.COLLECTION_RESTORE]: applyCollectionRestore,
				[PullCommand.COLLECTION_DELETE]: routeByScope(applySharedRemoval, applyCollectionDelete),
				[PullCommand.COLLECTION_CAPABILITIES]: alsoRefreshFavorites(applyCollectionCapabilities),
				[PullCommand.COLLECTION_LIST_INVALIDATED]: alsoRefreshFavorites(applyCollectionListInvalidated),
				[PullCommand.DOCUMENT_ACCESS_CASCADE]: alsoRefreshFavorites(applyDocumentAccessCascade),
				[PullCommand.FAVORITE_ADD]: bind(favoriteActions, 'applyFavoriteAdd'),
				[PullCommand.FAVORITE_REMOVE]: bind(favoriteActions, 'applyFavoriteRemove'),
				[PullCommand.FAVORITE_MOVE]: bind(favoriteActions, 'applyFavoriteMove'),
				[PullCommand.SUBSCRIPTION_SET]: bind(favoriteActions, 'applySubscriptionSet'),
				[PullCommand.SUBSCRIPTION_REMOVE]: bind(favoriteActions, 'applySubscriptionRemove')
			};
			const pullActions = new SidebarPullActions({
				state: internalState,
				handlers
			});
			pullActionsRef = pullActions;
			this.state = {
				collections: internalState.collections,
				collectionsLoading: internalState.collectionsLoading,
				collectionsHasNextPage: internalState.collectionsHasNextPage,
				globalPermissions: internalState.globalPermissions,
				selectedCollectionId: internalState.selectedCollectionId,
				selectedDocId: internalState.selectedDocId,
				selectedSharedView: internalState.selectedSharedView,
				selectedArchiveView: internalState.selectedArchiveView,
				selectedRecycleBinView: internalState.selectedRecycleBinView,
				expandedDocs: internalState.expandedDocs,
				currentRootDocs: queryService.currentRootDocs,
				sharedSectionExpanded: internalState.sharedSectionExpanded,
				sharedLoading: internalState.sharedLoading,
				sharedHydrated: internalState.sharedHydrated,
				sharedHasNextPage: internalState.sharedHasNextPage,
				sharedCursor: internalState.sharedCursor,
				sharedContainers: internalState.sharedContainers,
				favorites: internalState.favorites,
				favoritesSectionExpanded: internalState.favoritesSectionExpanded,
				favoritesLoading: internalState.favoritesLoading,
				favoritesFilterReloading: internalState.favoritesFilterReloading,
				favoritesHydrated: internalState.favoritesHydrated,
				favoritesHasNextPage: internalState.favoritesHasNextPage,
				favoritesOnlyNotified: internalState.favoritesOnlyNotified,
				favoritesError: internalState.favoritesError,
				favoritesExpandedDocs: queryService.favoritesExpandedDocs
			};
			this.actions = {
				setError,
				hydrateFromInitialContext: bind(hydrationActions, 'hydrateFromInitialContext'),
				hydrateInitialCollections: bind(hydrationActions, 'hydrateInitialCollections'),
				setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
				invalidateChildren: bind(documentActions, 'invalidateChildren'),
				invalidateBranch: bind(documentActions, 'invalidateBranch'),
				invalidateAllChildren: bind(documentActions, 'invalidateAllChildren'),
				setParentHasChildrenLocal: bind(documentActions, 'setParentHasChildrenLocal'),
				insertDocumentLocal: bind(documentActions, 'insertDocumentLocal'),
				updateDocumentLocal: bind(documentActions, 'updateDocumentLocal'),
				applyDocumentUpdate,
				applyDocumentMove,
				applyDocumentPositions: bind(documentActions, 'applyDocumentPositions'),
				applyDocumentRemoval,
				applyDocumentActive,
				applyDocumentCreate,
				removeDocumentLocal: bind(documentActions, 'removeDocumentLocal'),
				moveDocumentLocal: bind(documentActions, 'moveDocumentLocal'),
				loadDocuments: bind(documentActions, 'loadDocuments'),
				prefetchChildren: bind(documentActions, 'prefetchChildren'),
				ensureChildrenLoaded,
				insertCollectionLocal: bind(collectionActions, 'insertCollectionLocal'),
				updateCollectionLocal: bind(collectionActions, 'updateCollectionLocal'),
				applyCollectionCreate,
				applyCollectionDelete,
				applyCollectionArchive,
				applyCollectionRestore,
				applyCollectionUpdate,
				applyCollectionMove,
				applyCollectionCapabilities,
				applyCollectionListInvalidated,
				patchCollectionCapabilities: bind(collectionActions, 'patchCollectionCapabilities'),
				removeCollectionLocal: bind(collectionActions, 'removeCollectionLocal'),
				moveCollectionLocal: bind(collectionActions, 'moveCollectionLocal'),
				applyCollectionPositions: bind(collectionActions, 'applyCollectionPositions'),
				loadCollections: bind(collectionActions, 'loadCollections'),
				selectCollection: bind(selectionActions, 'selectCollection'),
				selectDocument: bind(selectionActions, 'selectDocument'),
				clearSelection: bind(selectionActions, 'clearSelection'),
				clearDocumentSelection: bind(selectionActions, 'clearDocumentSelection'),
				setSharedView: bind(selectionActions, 'setSharedView'),
				setArchiveView: bind(selectionActions, 'setArchiveView'),
				setRecycleBinView: bind(selectionActions, 'setRecycleBinView'),
				toggleDocExpanded: bind(expansionActions, 'toggleDocExpanded'),
				clearCollectionExpandedDocs: bind(expansionActions, 'clearCollectionExpandedDocs'),
				subscribeToPullEvents: bind(pullActions, 'subscribeToPullEvents'),
				unsubscribeFromPullEvents: bind(pullActions, 'unsubscribeFromPullEvents'),
				toggleSharedSection: bind(accessibleTreeActions, 'toggleSharedSection'),
				ensureSharedLoaded: bind(accessibleTreeActions, 'ensureSharedLoaded'),
				loadMoreSharedTree: bind(accessibleTreeActions, 'loadMoreSharedTree'),
				toggleSharedDocExpanded: bind(accessibleTreeActions, 'toggleSharedDocExpanded'),
				toggleSharedContainer: bind(accessibleTreeActions, 'toggleSharedContainer'),
				prefetchSharedChildren: bind(accessibleTreeActions, 'prefetchSharedChildren'),
				loadMoreSharedChildren: bind(accessibleTreeActions, 'loadMoreSharedChildren'),
				applyDocumentAccessCascade,
				hydrateFavorites: bind(favoriteActions, 'hydrateFavorites'),
				loadFavoritesPage: bind(favoriteActions, 'loadFavoritesPage'),
				reloadFavorites: bind(favoriteActions, 'reloadFavorites'),
				retryFavorites: bind(favoriteActions, 'retryFavorites'),
				setFavoritesFilter: bind(favoriteActions, 'setFavoritesFilter'),
				setFavoritesSectionExpanded: bind(favoriteActions, 'setFavoritesSectionExpanded'),
				toggleFavoritesSection: bind(favoriteActions, 'toggleFavoritesSection'),
				toggleFavorite: bind(favoriteActions, 'toggleFavorite'),
				applyExternalFavorite: bind(favoriteActions, 'applyExternalFavorite'),
				applyExternalNotify: bind(favoriteActions, 'applyExternalNotify'),
				moveFavoriteRow: bind(favoriteActions, 'moveFavoriteRow'),
				toggleFavoriteExpanded: bind(favoriteActions, 'toggleFavoriteExpanded'),
				retryFavoriteBranch: bind(favoriteActions, 'retryFavoriteBranch'),
				refreshFavoriteCoverage: bind(favoriteActions, 'refreshFavoriteCoverage'),
				toggleFavoriteNotify: bind(favoriteActions, 'toggleFavoriteNotify'),
				setFavoriteNotify: bind(favoriteActions, 'setFavoriteNotify'),
				clearFavoriteNotify: bind(favoriteActions, 'clearFavoriteNotify')
			};
			this.queries = {
				getChildren: bind(queryService, 'getChildren'),
				findCollection: bind(queryService, 'findCollection'),
				findLoadedDocument: bind(queryService, 'findLoadedDocument'),
				findLoadedDocumentAnywhere: bind(queryService, 'findLoadedDocumentAnywhere'),
				isDocumentLoadedAnywhere: bind(queryService, 'isDocumentLoadedAnywhere'),
				getAncestorsForDocument: bind(queryService, 'getAncestorsForDocument'),
				isLoadingChildren: bind(queryService, 'isLoadingChildren'),
				hasNextChildren: bind(queryService, 'hasNextChildren'),
				isChildrenHydrated: bind(queryService, 'isChildrenHydrated'),
				isBranchLoaded: bind(queryService, 'isBranchLoaded'),
				getSharedChildren: bind(accessibleTreeActions, 'getSharedChildren'),
				isSharedChildrenLoading: bind(accessibleTreeActions, 'isSharedChildrenLoading'),
				hasNextSharedChildren: bind(accessibleTreeActions, 'hasNextSharedChildren'),
				isSharedContainerExpanded: bind(accessibleTreeActions, 'isSharedContainerExpanded'),
				isFavorite: bind(queryService, 'isFavorite'),
				isFavoriteExpanded: bind(queryService, 'isFavoriteExpanded'),
				favoriteBranchError: bind(queryService, 'favoriteBranchError'),
				favoriteNotify: bind(queryService, 'favoriteNotify'),
				isFavoriteNotifyPending: bind(queryService, 'isFavoriteNotifyPending')
			};
		}
	}
	function createSidebarStore(api, options = {}) {
		return new SidebarStore(api, options);
	}

	function buildSidebarMessages() {
		const msg = code => main_core.Loc.getMessage(code);
		return {
			brandName: msg('NOTE_SIDEBAR_BRAND_NAME'),
			brandSuffix: msg('NOTE_SIDEBAR_BRAND_SUFFIX'),
			knowledgeBase: msg('NOTE_SIDEBAR_KNOWLEDGE_BASE'),
			collections: msg('NOTE_SIDEBAR_COLLECTIONS'),
			documents: msg('NOTE_SIDEBAR_DOCUMENTS'),
			emptyCollections: msg('NOTE_SIDEBAR_EMPTY_COLLECTIONS'),
			emptyDocuments: msg('NOTE_SIDEBAR_EMPTY_DOCUMENTS'),
			createDocument: msg('NOTE_SIDEBAR_CREATE_DOCUMENT'),
			createChildDocument: msg('NOTE_SIDEBAR_CREATE_CHILD_DOCUMENT'),
			delete: msg('NOTE_SIDEBAR_DELETE'),
			deleteWithNested: msg('NOTE_SIDEBAR_DELETE_WITH_NESTED'),
			confirmDeleteCollection: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION'),
			confirmDeleteCollectionTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE'),
			confirmDeleteDocument: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT'),
			confirmDeleteDocumentTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT_TITLE'),
			archiveConfirm: msg('NOTE_APP_ARCHIVE'),
			archiveWithNested: msg('NOTE_SIDEBAR_ARCHIVE_WITH_NESTED'),
			confirmArchiveDocument: msg('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT'),
			confirmArchiveDocumentTitle: msg('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT_TITLE'),
			promptCollectionName: msg('NOTE_SIDEBAR_PROMPT_COLLECTION_NAME'),
			promptDocumentName: msg('NOTE_SIDEBAR_PROMPT_DOCUMENT_NAME'),
			errorGeneric: msg('NOTE_SIDEBAR_ERROR_GENERIC'),
			moveAccessEscalation: msg('NOTE_SIDEBAR_MOVE_ACCESS_ESCALATION'),
			errorDocumentNotFound: msg('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND'),
			openPermissions: msg('NOTE_SIDEBAR_OPEN_PERMISSIONS'),
			sharedWithMe: msg('NOTE_SIDEBAR_SHARED_WITH_ME'),
			expandShared: msg('NOTE_SIDEBAR_SHARED_EXPAND'),
			collapseShared: msg('NOTE_SIDEBAR_SHARED_COLLAPSE'),
			expandSharedContainer: msg('NOTE_SIDEBAR_SHARED_CONTAINER_EXPAND'),
			collapseSharedContainer: msg('NOTE_SIDEBAR_SHARED_CONTAINER_COLLAPSE'),
			emptyShared: msg('NOTE_SIDEBAR_SHARED_EMPTY'),
			archive: msg('NOTE_SIDEBAR_ARCHIVE'),
			recycleBin: msg('NOTE_SIDEBAR_RECYCLE_BIN'),
			search: msg('NOTE_SIDEBAR_SEARCH_PLACEHOLDER'),
			favorites: msg('NOTE_SIDEBAR_FAVORITES'),
			favoriteOn: msg('NOTE_SIDEBAR_FAVORITE_ON'),
			favoriteOff: msg('NOTE_SIDEBAR_FAVORITE_OFF'),
			// Name of the star, the one it keeps in both states: what the press does is in its tooltip, what
			// the row is now is in aria-pressed.
			favoriteState: msg('NOTE_SIDEBAR_FAVORITE_STATE'),
			notifyOn: msg('NOTE_SIDEBAR_NOTIFY_ON'),
			notifyOff: msg('NOTE_SIDEBAR_NOTIFY_OFF'),
			// Name of the bell, the one it keeps whatever the state: what the press does is in its tooltip.
			notifyState: msg('NOTE_SIDEBAR_NOTIFY_STATE'),
			favoritesShowNotified: msg('NOTE_SIDEBAR_FAVORITES_SHOW_NOTIFIED'),
			favoritesShowAll: msg('NOTE_SIDEBAR_FAVORITES_SHOW_ALL'),
			favoritesEmptyNotified: msg('NOTE_SIDEBAR_FAVORITES_EMPTY_NOTIFIED'),
			favoritesLoadError: msg('NOTE_SIDEBAR_FAVORITES_LOAD_ERROR'),
			favoritesRetry: msg('NOTE_SIDEBAR_FAVORITES_RETRY'),
			favoritesBranchError: msg('NOTE_SIDEBAR_FAVORITES_BRANCH_ERROR'),
			favoriteExpand: msg('NOTE_SIDEBAR_FAVORITE_EXPAND'),
			favoriteCollapse: msg('NOTE_SIDEBAR_FAVORITE_COLLAPSE'),
			favoriteAddFailed: msg('NOTE_SIDEBAR_FAVORITE_ADD_FAILED'),
			favoriteRemoveFailed: msg('NOTE_SIDEBAR_FAVORITE_REMOVE_FAILED'),
			favoriteMoveFailed: msg('NOTE_SIDEBAR_FAVORITE_MOVE_FAILED'),
			favoriteNotifyFailed: msg('NOTE_SIDEBAR_FAVORITE_NOTIFY_FAILED'),
			// [P4.T1] Wording of the depth chooser, taken from the extension that owns the popover - the
			// same phrases the bell of the editor shows, not a second copy of them.
			notifyPopover: note_ui_documentHistory.createHistoryMessages(),
			expandCollections: msg('NOTE_SIDEBAR_COLLECTIONS_EXPAND'),
			collapseCollections: msg('NOTE_SIDEBAR_COLLECTIONS_COLLAPSE'),
			fileDropWarningSkipped: msg('NOTE_SIDEBAR_FILE_DROP_WARNING_SKIPPED'),
			fileDropWarningNoMarkdown: msg('NOTE_SIDEBAR_FILE_DROP_WARNING_NO_MARKDOWN'),
			fileDropSummary: msg('NOTE_SIDEBAR_FILE_DROP_SUMMARY'),
			fileDropSummaryPartial: msg('NOTE_SIDEBAR_FILE_DROP_SUMMARY_PARTIAL')
		};
	}

	const SIDEBAR_COLLAPSED_WIDTH = 48;
	function createSidebarRootState({
		store,
		uiState,
		dragState,
		getRouteDocumentId
	}) {
		const documentsLoading = ui_vue3.computed(() => {
			if (!store.state.selectedCollectionId.value) {
				return false;
			}
			return store.queries.isLoadingChildren(store.state.selectedCollectionId.value, null);
		});
		const hasManageableCollection = ui_vue3.computed(() => {
			const items = store.state.collections.value;
			if (!Array.isArray(items)) {
				return false;
			}
			return items.some(collection => Boolean(collection?.canEditCollection));
		});
		const permissions = ui_vue3.computed(() => ({
			...store.state.globalPermissions,
			hasManageableCollection: hasManageableCollection.value
		}));

		// [TPL-02] Everything the favorites block and the stars are allowed to read.
		const favorites = {
			get items() {
				return store.state.favorites.value;
			},
			// Whether the block itself stands open, as opposed to `isExpanded` below, which answers for a row.
			get sectionExpanded() {
				return store.state.favoritesSectionExpanded.value;
			},
			get isLoading() {
				return store.state.favoritesLoading.value;
			},
			get isLoaded() {
				return store.state.favoritesHydrated.value;
			},
			// Whether the read in flight is the one a filter switch asked for - the only one the block stays
			// on screen for while it holds nothing.
			get isFilterReloading() {
				return store.state.favoritesFilterReloading.value;
			},
			get hasNextPage() {
				return store.state.favoritesHasNextPage.value;
			},
			get onlyNotified() {
				return store.state.favoritesOnlyNotified.value;
			},
			get error() {
				return store.state.favoritesError.value;
			},
			isFavorite: (entityType, entityId) => store.queries.isFavorite(entityType, entityId),
			// [P2] Expansion inside the block: the flag of a top-level row, and the same space projected onto
			// document ids for the tree rows nested under it - one map per top-level row, because a place in
			// the block is what carries the flag, not the object (see favoriteExpandKey).
			get expandedDocsByRow() {
				return store.state.favoritesExpandedDocs.value;
			},
			// [P3] Drag of the block: the row being carried and the gap it would go into.
			get dragItem() {
				return dragState.favoriteItem;
			},
			get dropTarget() {
				return dragState.favoriteTarget;
			},
			isExpanded: (entityType, entityId) => store.queries.isFavoriteExpanded(entityType, entityId),
			// [DTO-02] Notification state of a row of the block or of a document inside one of its branches,
			// and whether a write on it is still on the wire.
			notifyOf: (entityType, entityId) => store.queries.favoriteNotify(entityType, entityId),
			isNotifyPending: (entityType, entityId) => store.queries.isFavoriteNotifyPending(entityType, entityId),
			branchError: (entityType, entityId, scope) => store.queries.favoriteBranchError(entityType, entityId, scope)
		};
		return {
			favorites,
			get collections() {
				return store.state.collections.value;
			},
			get collectionsLoading() {
				return store.state.collectionsLoading.value;
			},
			get collectionsHasNextPage() {
				return store.state.collectionsHasNextPage.value;
			},
			get permissions() {
				return permissions.value;
			},
			get documentsLoading() {
				return documentsLoading.value;
			},
			get selectedCollectionId() {
				return store.state.selectedCollectionId.value;
			},
			get selectedDocId() {
				return getRouteDocumentId() || store.state.selectedDocId.value;
			},
			get selectedSharedView() {
				return store.state.selectedSharedView.value;
			},
			get selectedArchiveView() {
				return store.state.selectedArchiveView.value;
			},
			get selectedRecycleBinView() {
				return store.state.selectedRecycleBinView.value;
			},
			get collectionsSectionExpanded() {
				return uiState.collectionsSectionExpanded;
			},
			get sharedTreeEnabled() {
				return Boolean(uiState.sharedTreeEnabled);
			},
			get sharedSectionExpanded() {
				return store.state.sharedSectionExpanded.value;
			},
			get sharedLoading() {
				return store.state.sharedLoading.value;
			},
			get sharedHydrated() {
				return store.state.sharedHydrated.value;
			},
			get sharedHasNextPage() {
				return store.state.sharedHasNextPage.value;
			},
			get sharedCursor() {
				return store.state.sharedCursor.value;
			},
			get sharedContainers() {
				return store.state.sharedContainers.value;
			},
			get sidebarWidth() {
				return uiState.sidebarWidth;
			},
			get sidebarCollapsed() {
				return uiState.sidebarCollapsed;
			},
			get isMobile() {
				return Boolean(uiState.isMobile);
			},
			get historyEnabled() {
				return Boolean(uiState.historyEnabled);
			},
			get notificationsEnabled() {
				return Boolean(uiState.notificationsEnabled);
			},
			get sidebarEffectiveWidth() {
				return uiState.sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : uiState.sidebarWidth;
			},
			get aiChatOpen() {
				return Boolean(uiState.aiChatOpen);
			},
			expandedDocs: store.state.expandedDocs,
			get currentRootDocs() {
				return store.state.currentRootDocs.value;
			},
			get docDragItem() {
				return dragState.docItem;
			},
			get docDropTarget() {
				return dragState.docTarget;
			},
			get collectionDragItem() {
				return dragState.collectionItem;
			},
			get collectionDropTarget() {
				return dragState.collectionTarget;
			},
			get fileDragItem() {
				return dragState.fileDragItem;
			},
			get fileDropTarget() {
				return dragState.fileDropTarget;
			},
			get renamingDocId() {
				return uiState.renamingDocId;
			},
			get renamingCollectionId() {
				return uiState.renamingCollectionId;
			},
			getChildren: store.queries.getChildren,
			isLoadingChildren: store.queries.isLoadingChildren,
			hasNextChildren: store.queries.hasNextChildren,
			getRootDocs: collectionId => store.queries.getChildren(collectionId, null),
			isRootLoading: collectionId => store.queries.isLoadingChildren(collectionId, null),
			hasRootNextPage: collectionId => store.queries.hasNextChildren(collectionId, null),
			getSharedChildren: store.queries.getSharedChildren,
			isSharedChildrenLoading: store.queries.isSharedChildrenLoading,
			hasNextSharedChildren: store.queries.hasNextSharedChildren,
			getSharedRootDocs: collectionId => store.queries.getSharedChildren(collectionId, null),
			isSharedContainerExpanded: collectionId => store.queries.isSharedContainerExpanded(collectionId)
		};
	}

	class AjaxControllerClient {
		run(action, data = {}) {
			return main_core.ajax.runAction(action, {
				data
			}).then(response => response?.data).catch(error => {
				const failure = new Error(this.#extractErrorMessage(error));
				// Preserve the server error code (e.g. NOTE_MOVE_ACCESS_ESCALATION) so callers can
				// tell a typed failure apart from a generic one instead of matching on text.
				failure.code = this.#extractErrorCode(error);
				throw failure;
			});
		}
		#extractErrorMessage(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstError = error?.errors?.[0]?.message;
				if (main_core.Type.isStringFilled(firstError)) {
					return firstError;
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return error.message;
				}
			}
			return 'Request failed';
		}
		#extractErrorCode(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstCode = error?.errors?.[0]?.code;
				if (main_core.Type.isStringFilled(firstCode)) {
					return firstCode;
				}
			}
			return '';
		}
	}

	class DialogService {
		confirm(message, title = '', confirmText = '') {
			return new Promise(resolve => {
				let isResolved = false;
				const finish = value => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					resolve(value);
				};
				const content = main_core.Tag.render`
				<div class="note-sidebar-confirm-content">
					${String(message || '')}
				</div>
			`;
				const dialog = new ui_system_dialog.Dialog({
					title,
					content,
					width: 420,
					hasOverlay: true,
					overlay: true,
					centerButtons: [new ui_buttons.Button({
						text: String(main_core.Loc.getMessage('NOTE_SIDEBAR_CANCEL') || 'Cancel'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						dataset: {
							testid: 'note-dialog-cancel'
						},
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					}), new ui_buttons.Button({
						text: String(confirmText || title || main_core.Loc.getMessage('NOTE_SIDEBAR_DELETE') || 'OK'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: {
							testid: 'note-dialog-confirm'
						},
						onclick: () => {
							finish(true);
							dialog.hide();
						}
					})],
					events: {
						onHide: () => {
							finish(false);
						}
					}
				});
				note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		}

		// Same layout as confirm(), plus an optional "with nested" checkbox. Resolves with
		// { confirmed, withNested }. When offerNested is false the checkbox is hidden and
		// withNested defaults to true (the backend cascades by default anyway).
		confirmDelete(options) {
			return this.#confirmWithNested(options);
		}

		// Archive counterpart of confirmDelete — same checkbox mechanics, no destructive styling
		// (archiving isn't destructive). Resolves with { confirmed, withNested }.
		confirmArchive(options) {
			return this.#confirmWithNested(options);
		}
		#confirmWithNested({
			message = '',
			title = '',
			confirmText = '',
			offerNested = false,
			nestedLabel = '',
			nestedDefault = true
		}) {
			return new Promise(resolve => {
				let isResolved = false;
				let checkbox = null;
				const finish = confirmed => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					const withNested = offerNested ? Boolean(checkbox?.checked) : true;
					resolve({
						confirmed,
						withNested
					});
				};
				const content = main_core.Tag.render`
				<div class="note-sidebar-confirm-content">
					${String(message || '')}
				</div>
			`;
				if (offerNested) {
					checkbox = main_core.Tag.render`<input type="checkbox" class="note-sidebar-confirm-checkbox-input" />`;
					checkbox.checked = Boolean(nestedDefault);
					const nestedRow = main_core.Tag.render`
					<label class="note-sidebar-confirm-checkbox">
						${checkbox}
						<span>${String(nestedLabel || '')}</span>
					</label>
				`;
					content.appendChild(nestedRow);
				}
				const dialog = new ui_system_dialog.Dialog({
					title,
					content,
					width: 420,
					hasOverlay: true,
					overlay: true,
					centerButtons: [new ui_buttons.Button({
						text: String(main_core.Loc.getMessage('NOTE_SIDEBAR_CANCEL') || 'Cancel'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						dataset: {
							testid: 'note-dialog-cancel'
						},
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					}), new ui_buttons.Button({
						text: String(confirmText || title || main_core.Loc.getMessage('NOTE_SIDEBAR_DELETE') || 'OK'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: {
							testid: 'note-dialog-confirm'
						},
						onclick: () => {
							finish(true);
							dialog.hide();
						}
					})],
					events: {
						onHide: () => {
							finish(false);
						}
					}
				});
				note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		}
		requestText({
			title = '',
			value = ''
		}) {
			return new Promise(resolve => {
				const input = document.createElement('input');
				input.className = 'ui-ctl-element';
				input.value = value;
				ui_dialogs_messagebox.MessageBox.show({
					title,
					message: input,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					popupOptions: {
						designSystemContext: note_ui_themeContext.NoteThemeContext.getDesignSystemContext()
					},
					onOk: messageBox => {
						const nextValue = String(input.value || '').trim();
						messageBox.close();
						resolve(nextValue || null);
					},
					onCancel: messageBox => {
						messageBox.close();
						resolve(null);
					}
				});
				setTimeout(() => {
					input.focus();
				}, 0);
			});
		}
	}

	const PAGE_SIZE = 50;
	// Mirror of SubscriptionController::MAX_STATES_BATCH - the ceiling the endpoint silently trims to.
	const STATES_BATCH_SIZE = 200;

	// [DTO-01] Cursor and target of the favorites list. entityType is the server's own wording.

	class SidebarApi {
		#client;
		constructor(client) {
			this.#client = client;
		}
		async listCollections({
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			const params = {
				limit
			};
			if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
				params.afterPosition = cursor.position;
				params.afterId = cursor.id;
			}
			const data = await this.#client.run('note.infrastructure.CollectionController.list', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null,
					permissions: null
				};
			}
			const normalizedItems = data.items.map(item => this.#normalizeCollection(item)).filter(item => item !== null);
			const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			return {
				items: normalizedItems,
				hasNextPage: nextCursor !== null,
				nextCursor,
				permissions: this.#normalizeGlobalPermissions(data.permissions)
			};
		}
		async listDocumentsByParent(collectionId, parentId = null, {
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			try {
				const params = {
					collectionId,
					parentId,
					limit
				};
				if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
					params.afterPosition = cursor.position;
					params.afterId = cursor.id;
				}
				const data = await this.#client.run('note.infrastructure.DocumentController.listByParent', params);
				if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.documents)) {
					throw new TypeError('Invalid listByParent response');
				}
				const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
				return {
					items: data.documents.map(item => this.#normalizeDocument(item)).filter(item => item !== null),
					hasNextPage: nextCursor !== null,
					nextCursor
				};
			} catch {
				const allDocs = await this.#loadParentFromTree(collectionId, parentId);
				return {
					items: allDocs,
					hasNextPage: false,
					nextCursor: null
				};
			}
		}

		// [API-03] Pruned tree of documents reachable via document-level grants only (no collection VIEW),
		// grouped by container collection. Flat keyset pagination over the whole accessible set; the
		// cursor is {collectionId, id}, NOT per-parent — the client rebuilds the hierarchy from parentId.
		async listAccessibleTree({
			limit = PAGE_SIZE,
			afterCursor = null
		} = {}) {
			const params = {
				limit
			};
			if (afterCursor !== null && main_core.Type.isPlainObject(afterCursor)) {
				params.afterCursor = afterCursor;
			}
			const data = await this.#client.run('note.infrastructure.DocumentController.listAccessibleTree', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.containers)) {
				return {
					containers: [],
					nextCursor: null
				};
			}
			const containers = data.containers.map(container => this.#normalizeAccessibleContainer(container)).filter(container => container !== null);
			const nextCursor = this.#normalizeAccessibleCursor(data.nextCursor);
			return {
				containers,
				nextCursor
			};
		}

		// [API-03b] Direct children of one node of the accessible tree. Separate from listByParent,
		// which gates on collection VIEW — a right this section's users do not hold by definition.
		// The cursor is per-parent {position, id}, exactly like the collection tree's.
		async listAccessibleChildren(collectionId, parentId, {
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			const params = {
				collectionId,
				parentId,
				limit
			};
			if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
				params.afterCursor = cursor;
			}
			const data = await this.#client.run('note.infrastructure.DocumentController.listAccessibleChildren', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.documents)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null
				};
			}
			const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			return {
				items: data.documents.map(item => this.#normalizeDocument(item)).filter(item => item !== null),
				hasNextPage: nextCursor !== null,
				nextCursor
			};
		}
		#normalizeAccessibleContainer(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const collectionId = this.#toPositiveInt(row.collectionId);
			if (collectionId === null) {
				return null;
			}
			const rawNodes = Array.isArray(row.nodes) ? row.nodes : [];
			const nodes = rawNodes.map(node => this.#normalizeDocument({
				...node,
				collectionId
			})).filter(node => node !== null);
			return {
				collectionId,
				title: String(row.title ?? ''),
				nodes
			};
		}
		#normalizeAccessibleCursor(cursor) {
			if (!main_core.Type.isPlainObject(cursor)) {
				return null;
			}
			const collectionId = this.#toPositiveInt(cursor.collectionId);
			const id = this.#toPositiveInt(cursor.id);
			if (collectionId === null || id === null) {
				return null;
			}
			return {
				collectionId,
				id
			};
		}

		// [API-04] One page of the personal favorites list. The end of the list is nextCursor === null:
		// the server refills a page whose rows the access filter dropped, so a short page is not the end.
		async listFavorites({
			limit = PAGE_SIZE,
			afterCursor = null,
			onlyNotified = false
		} = {}) {
			// The flag travels as 1/0: a urlencoded `false` reaches the server as a truthy string.
			const params = {
				limit,
				onlyNotified: onlyNotified === true ? 1 : 0
			};
			if (main_core.Type.isPlainObject(afterCursor)) {
				params.afterCursor = afterCursor;
			}
			const data = await this.#client.run('note.infrastructure.FavoriteController.list', params);
			return this.normalizeFavoritePage(data);
		}

		// [TPL-02] One mapper for both sources of a page: the list action and the payload the page carries
		// for the first one. Public because the store hydrates from the second without going through here.
		normalizeFavoritePage(data) {
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null
				};
			}
			const nextCursor = this.#normalizeFavoriteCursor(data.nextCursor);
			return {
				items: data.items.map(item => this.#normalizeFavoriteRow(item)).filter(item => item !== null),
				hasNextPage: nextCursor !== null,
				nextCursor
			};
		}

		// [API-01] position is the ordinal of the insertion point (1 - first row); null puts the row first.
		// `item` is the finished row, in the shape `list` hands out - null when the object is not visible to
		// the caller any more (no rights, trashed, deleted), which is the caller's cue to re-read the list.
		async addFavorite(target, position = null) {
			const data = await this.#client.run('note.infrastructure.FavoriteController.add', {
				entityType: target.entityType,
				entityId: target.entityId,
				position: this.#toNullableInt(position)
			});
			if (!main_core.Type.isPlainObject(data)) {
				return {
					id: null,
					position: null,
					affectedPositions: [],
					item: null
				};
			}
			return {
				id: this.#toPositiveInt(data.id),
				position: this.#toInt(data.position),
				affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions),
				item: this.normalizeFavoriteItem(data.item)
			};
		}

		// One row of the block from a source other than a page of the list: the answer to an add and the
		// push of one. Public for the same reason normalizeFavoritePage is - the store applies both.
		normalizeFavoriteItem(item) {
			return this.#normalizeFavoriteRow(item);
		}

		// [API-02] Reports the state that was taken away: the position of the row and its notification depth.
		async removeFavorite(target) {
			const data = await this.#client.run('note.infrastructure.FavoriteController.remove', {
				entityType: target.entityType,
				entityId: target.entityId
			});
			if (!main_core.Type.isPlainObject(data) || !main_core.Type.isPlainObject(data.removed)) {
				return null;
			}
			return {
				position: this.#toInt(data.removed.position),
				notifyMode: this.#normalizeNotifyMode(data.removed.notifyMode)
			};
		}

		// [API-03] Reorders one row of the personal list; the response carries the recomputed positions.
		async moveFavorite(target, position) {
			const data = await this.#client.run('note.infrastructure.FavoriteController.move', {
				entityType: target.entityType,
				entityId: target.entityId,
				position: this.#toNullableInt(position)
			});
			if (!main_core.Type.isPlainObject(data)) {
				return {
					position: null,
					affectedPositions: []
				};
			}
			return {
				position: this.#toInt(data.position),
				affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions)
			};
		}

		// [API-05] Subscription depth. The server invariant refuses a depth on an object that is not in the
		// favorites list, so the row has to be there first (FAVORITE_REQUIRED).
		setSubscription(target, mode) {
			return this.#client.run('note.infrastructure.SubscriptionController.set', {
				scope: target.entityType,
				entityId: target.entityId,
				mode
			});
		}

		// [API-05] Removes the caller's own subscription row - both "off" and lifting a mute.
		removeSubscription(target) {
			return this.#client.run('note.infrastructure.SubscriptionController.remove', {
				scope: target.entityType,
				entityId: target.entityId
			});
		}

		// [API-06] Coverage states of the documents of one knowledge base. Documents the user cannot see are
		// absent from the answer, so an absent key means "no bell", not "no coverage".
		//
		// Asked in batches: the endpoint answers for STATES_BATCH_SIZE ids and drops the rest without saying
		// so. A branch is read whole on every page it grows by, so past that many rows the tail would keep
		// its bells hidden - and nothing on either side would report it.
		async getSubscriptionStates(collectionId, documentIds) {
			const ids = (Array.isArray(documentIds) ? documentIds : []).map(id => this.#toPositiveInt(id)).filter(id => id !== null);
			if (ids.length === 0) {
				return {};
			}
			const batches = [];
			for (let offset = 0; offset < ids.length; offset += STATES_BATCH_SIZE) {
				batches.push(ids.slice(offset, offset + STATES_BATCH_SIZE));
			}
			const answers = await Promise.all(batches.map(batch => this.#client.run('note.infrastructure.SubscriptionController.getStates', {
				collectionId,
				documentIds: batch
			})));
			const states = {};
			for (const data of answers) {
				if (!main_core.Type.isPlainObject(data) || !main_core.Type.isPlainObject(data.states)) {
					continue;
				}
				for (const [rawId, rawState] of Object.entries(data.states)) {
					const id = this.#toPositiveInt(rawId);
					if (id !== null) {
						states[String(id)] = this.#normalizeNotifyState(rawState);
					}
				}
			}
			return states;
		}
		#normalizeFavoriteRow(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			const entityId = this.#toPositiveInt(row.entityId);
			const collectionId = this.#toPositiveInt(row.collectionId);
			const entityType = row.entityType === 'collection' || row.entityType === 'document' ? row.entityType : null;
			if (id === null || entityId === null || collectionId === null || entityType === null) {
				return null;
			}
			return {
				...row,
				id,
				entityType,
				entityId,
				title: String(row.title ?? ''),
				position: this.#toInt(row.position) ?? 0,
				collectionId,
				parentId: this.#toNullableInt(row.parentId),
				hasChildren: Boolean(row.hasChildren),
				expandVia: row.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
				notify: this.#normalizeNotifyState(row.notify)
			};
		}

		// [DTO-02] Coverage state of one row. Absent state reads as "no notifications" - the safe default.
		#normalizeNotifyState(notify) {
			const source = main_core.Type.isPlainObject(notify) ? notify : {};
			const inheritedSource = source.inheritedSource === 'subtree' || source.inheritedSource === 'collection' ? source.inheritedSource : null;
			return {
				mode: this.#normalizeNotifyMode(source.mode),
				subscribed: Boolean(source.subscribed),
				muted: Boolean(source.muted),
				inherited: Boolean(source.inherited),
				inheritedSource,
				notified: Boolean(source.notified)
			};
		}
		#normalizeNotifyMode(mode) {
			return ['self', 'subtree', 'all', 'muted'].includes(mode) ? mode : null;
		}
		#normalizeFavoriteCursor(cursor) {
			if (!main_core.Type.isPlainObject(cursor)) {
				return null;
			}
			const position = this.#toInt(cursor.position);
			const id = this.#toPositiveInt(cursor.id);
			if (position === null || id === null) {
				return null;
			}
			return {
				position,
				id
			};
		}
		#normalizeAffectedPositions(rawList) {
			const entries = [];
			for (const entry of Array.isArray(rawList) ? rawList : []) {
				if (!main_core.Type.isPlainObject(entry)) {
					continue;
				}
				const entryId = this.#toPositiveInt(entry.id);
				const entryPosition = this.#toInt(entry.position);
				if (entryId === null || entryPosition === null) {
					continue;
				}
				entries.push({
					id: entryId,
					position: entryPosition
				});
			}
			return entries;
		}
		async createCollection(name) {
			const data = await this.#client.run('note.infrastructure.CollectionController.create', {
				name,
				position: 0
			});
			const normalized = this.#normalizeCollection(data);
			if (normalized) {
				return normalized;
			}
			const id = this.#toPositiveInt(data?.id);
			return {
				id: id ?? 0,
				name: String(name || ''),
				position: 0
			};
		}
		updateCollection(id, name) {
			return this.#client.run('note.infrastructure.CollectionController.update', {
				id,
				name
			});
		}
		deleteCollection(id) {
			return this.#client.run('note.infrastructure.CollectionController.delete', {
				id
			});
		}
		archiveCollection(id) {
			return this.#client.run('note.infrastructure.CollectionController.archive', {
				id
			});
		}
		async getMyCollectionAccess(id) {
			const data = await this.#client.run('note.infrastructure.CollectionController.getMyAccess', {
				id
			});
			if (!main_core.Type.isPlainObject(data)) {
				return null;
			}
			return {
				collectionId: Number(data.collectionId) || id,
				level: typeof data.level === 'string' ? data.level : 'none',
				policyLevel: typeof data.policyLevel === 'string' ? data.policyLevel : 'none',
				canEditCollection: Boolean(data.canEditCollection),
				canManagePermissions: Boolean(data.canManagePermissions)
			};
		}
		async moveCollection(id, position) {
			const data = await this.#client.run('note.infrastructure.CollectionController.move', {
				id,
				position
			});
			if (!main_core.Type.isPlainObject(data)) {
				return {
					position: null,
					affectedPositions: []
				};
			}
			return {
				position: this.#toInt(data.position),
				affectedPositions: this.#normalizeAffectedPositions(data.affectedPositions)
			};
		}
		async listManageableCollections(limit = 2) {
			const data = await this.#client.run('note.infrastructure.CollectionController.listManageableShort', {
				limit
			});
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasMore: false
				};
			}
			const items = data.items.map(item => {
				if (!main_core.Type.isPlainObject(item)) {
					return null;
				}
				const id = this.#toPositiveInt(item.id);
				if (id === null) {
					return null;
				}
				return {
					id,
					name: String(item.name ?? '')
				};
			}).filter(item => item !== null);
			return {
				items,
				hasMore: Boolean(data.hasMore)
			};
		}
		async createDocument(collectionId, title, parentId = null, markdown = '') {
			const data = await this.#client.run('note.infrastructure.DocumentController.create', {
				collectionId,
				parentId,
				title,
				markdown
			});
			const normalized = this.#normalizeDocument(data);
			if (normalized) {
				return normalized;
			}
			const id = this.#toPositiveInt(data?.id);
			return {
				id: id ?? 0,
				collectionId: this.#toPositiveInt(collectionId) ?? 0,
				parentId: this.#toNullableInt(parentId),
				title: String(title || ''),
				position: 0,
				hasChildren: false,
				isArchived: false
			};
		}
		updateDocument(id, title) {
			return this.#client.run('note.infrastructure.DocumentController.update', {
				id,
				title
			});
		}
		deleteDocument(id, withNested = true) {
			return this.#client.run('note.infrastructure.DocumentController.delete', {
				id,
				withNested: withNested ? 1 : 0
			});
		}
		archiveDocument(id, withNested = true) {
			return this.#client.run('note.infrastructure.DocumentController.archive', {
				id,
				withNested: withNested ? 1 : 0
			});
		}
		restoreDocument(id) {
			return this.#client.run('note.infrastructure.DocumentController.restore', {
				id
			});
		}
		restoreAllDocuments() {
			return this.#client.run('note.infrastructure.DocumentController.restoreAll', {});
		}
		async listArchivedDocuments({
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			const params = {
				limit
			};
			if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
				params.afterCursor = cursor;
			}
			const data = await this.#client.run('note.infrastructure.DocumentController.listArchived', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null
				};
			}
			const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			return {
				items: data.items,
				hasNextPage: nextCursor !== null,
				nextCursor
			};
		}
		async moveDocument(id, collectionId, parentId, position) {
			const data = await this.#client.run('note.infrastructure.DocumentController.move', {
				id,
				collectionId,
				parentId,
				position: this.#toNullableInt(position)
			});
			if (!main_core.Type.isPlainObject(data)) {
				throw new TypeError('Invalid moveDocument response');
			}
			const responseId = this.#toPositiveInt(data.id);
			const persistedPosition = this.#toInt(data.position);
			const affectedPositions = this.#normalizeAffectedPositions(data.affectedPositions);
			const movedDocumentPosition = affectedPositions.find(entry => entry.id === responseId)?.position ?? null;
			if (responseId !== id || persistedPosition === null || !Array.isArray(data.affectedPositions) || affectedPositions.length !== data.affectedPositions.length || movedDocumentPosition !== persistedPosition) {
				throw new TypeError('Invalid moveDocument response');
			}
			return {
				id: responseId,
				position: persistedPosition,
				affectedPositions
			};
		}
		async #loadParentFromTree(collectionId, parentId) {
			const tree = await this.#client.run('note.infrastructure.DocumentController.getTree', {
				collectionId
			});
			if (!Array.isArray(tree)) {
				return [];
			}
			const docs = this.#collectTreeDocumentsByParent(tree, parentId ?? null);
			this.#sortDocumentsByPosition(docs);
			return docs;
		}
		#collectTreeDocumentsByParent(tree, targetParentId) {
			const docs = [];
			const stack = [...tree];
			while (stack.length > 0) {
				const node = stack.pop();
				const normalizedNode = this.#normalizeTreeNode(node, targetParentId);
				if (normalizedNode) {
					docs.push(normalizedNode);
				}
				this.#pushNodeChildren(stack, node);
			}
			return docs;
		}
		#normalizeTreeNode(node, targetParentId) {
			if (!main_core.Type.isPlainObject(node)) {
				return null;
			}
			const nodeParentId = node.parentId ?? null;
			if (nodeParentId !== targetParentId) {
				return null;
			}
			const children = Array.isArray(node.children) ? node.children : [];
			return this.#normalizeDocument({
				...node,
				hasChildren: children.length > 0
			});
		}
		#pushNodeChildren(stack, node) {
			if (!main_core.Type.isPlainObject(node)) {
				return;
			}
			const children = Array.isArray(node.children) ? node.children : [];
			for (let i = children.length - 1; i >= 0; i -= 1) {
				stack.push(children[i]);
			}
		}
		#sortDocumentsByPosition(documents) {
			documents.sort((a, b) => {
				const leftPos = Number(a.position || 0);
				const rightPos = Number(b.position || 0);
				if (leftPos !== rightPos) {
					return rightPos - leftPos;
				}
				return Number(b.id || 0) - Number(a.id || 0);
			});
		}
		#normalizeCollection(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			if (id === null) {
				return null;
			}
			return {
				...row,
				id,
				name: String(row.name ?? ''),
				position: this.#toInt(row.position) ?? 0,
				canEditCollection: Boolean(row.canEditCollection),
				canManagePermissions: Boolean(row.canManagePermissions)
			};
		}
		#normalizeDocument(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			const collectionId = this.#toPositiveInt(row.collectionId);
			if (id === null || collectionId === null) {
				return null;
			}
			return {
				...row,
				id,
				collectionId,
				parentId: this.#toNullableInt(row.parentId),
				title: String(row.title ?? ''),
				position: this.#toInt(row.position) ?? 0,
				hasChildren: Boolean(row.hasChildren),
				isArchived: Boolean(row.isArchived)
			};
		}
		#toPositiveInt(value) {
			const normalized = this.#toInt(value);
			if (normalized === null || normalized <= 0) {
				return null;
			}
			return normalized;
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return this.#toInt(value);
		}
		#toInt(value) {
			const parsed = Number(value);
			if (!Number.isFinite(parsed)) {
				return null;
			}
			return Math.trunc(parsed);
		}
		#normalizeGlobalPermissions(rawPermissions) {
			if (!main_core.Type.isPlainObject(rawPermissions)) {
				return null;
			}
			return {
				canEditCollections: Boolean(rawPermissions.canEditCollections),
				canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
				canImport: Boolean(rawPermissions.canImport),
				hasManageableCollection: Boolean(rawPermissions.hasManageableCollection)
			};
		}
	}

	const AUTO_EXPAND_DELAY_MS = 500;
	const SIDEBAR_DEFAULT_WIDTH = 280;
	const SIDEBAR_MIN_WIDTH = 280;
	const SIDEBAR_MAX_WIDTH = 540;
	function createDragState() {
		return ui_vue3.reactive({
			docItem: null,
			docTarget: null,
			collectionItem: null,
			collectionTarget: null,
			// [P3] Order of the favorites block: its own pair, so a row of the block is never a target of
			// the document or knowledge base drag and the other way round.
			favoriteItem: null,
			favoriteTarget: null,
			// External OS-driven file drag (no local startDrag) has its own target shape { collectionId, parentId }.
			fileDragItem: false,
			fileDropTarget: null
		});
	}
	function normalizeSidebarMinWidth(minWidth) {
		const numericMin = Number(minWidth);
		if (!Number.isFinite(numericMin)) {
			return SIDEBAR_MIN_WIDTH;
		}
		return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.ceil(numericMin)));
	}
	function normalizeSidebarWidth(width, minWidth = SIDEBAR_MIN_WIDTH) {
		const normalizedMin = normalizeSidebarMinWidth(minWidth);
		const normalizedWidth = Number(width);
		if (!Number.isFinite(normalizedWidth)) {
			return Math.max(normalizedMin, SIDEBAR_DEFAULT_WIDTH);
		}
		return Math.max(normalizedMin, Math.min(SIDEBAR_MAX_WIDTH, Math.trunc(normalizedWidth)));
	}
	function normalizeSidebarCollapsed(collapsed) {
		return Boolean(collapsed);
	}

	// A saved block state, as it travels: the server answers with a boolean, the option itself holds 'Y'/'N',
	// and a panel drawn before either arrives has its blocks open.
	function normalizeSidebarSection(expanded) {
		if (expanded === undefined || expanded === null) {
			return true;
		}
		return expanded !== false && expanded !== 'N';
	}
	function createUiState(sidebarWidth = SIDEBAR_DEFAULT_WIDTH, sidebarCollapsed = false, isMobile = false, historyEnabled = false, notificationsEnabled = false, sharedTreeEnabled = false, collectionsSectionExpanded = true) {
		return ui_vue3.reactive({
			expandedCollections: {},
			collectionsSectionExpanded: normalizeSidebarSection(collectionsSectionExpanded),
			// [P2] Backend-owned flag: when on, the flat note.shared page/button is replaced by the
			// collapsible "Shared with me" sidebar section. Default off = safe rollback.
			sharedTreeEnabled: Boolean(sharedTreeEnabled),
			sidebarMinWidth: SIDEBAR_MIN_WIDTH,
			sidebarWidth: normalizeSidebarWidth(sidebarWidth, SIDEBAR_MIN_WIDTH),
			sidebarCollapsed: normalizeSidebarCollapsed(sidebarCollapsed),
			isMobile: Boolean(isMobile),
			// Bootstrap-level UI feature flags — surfaced on the sidebar root state so the pages that
			// inject it (document / workspace) can gate their history + notifications affordances.
			historyEnabled: Boolean(historyEnabled),
			notificationsEnabled: Boolean(notificationsEnabled),
			renamingDocId: null,
			renamingCollectionId: null,
			// [ALG-01] Whether the BitrixGPT rail panel is expanded. Owned by the shell, never by the
			// panel: the panel is mounted once and only its geometry collapses.
			aiChatOpen: false
		});
	}
	function applyExpandedCollectionsFromContext(uiState, context) {
		const expandedCollectionsState = uiState.expandedCollections;
		const expandedCollections = main_core.Type.isPlainObject(context?.expandedCollections) ? context.expandedCollections : {};
		for (const [rawCollectionId, rawIsExpanded] of Object.entries(expandedCollections)) {
			const collectionId = Number(rawCollectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0 || !rawIsExpanded) {
				continue;
			}
			expandedCollectionsState[collectionId] = true;
		}
		if (Object.keys(expandedCollectionsState).length > 0) {
			return;
		}
		if (Boolean(context?.document?.isArchived)) {
			return;
		}
		const fallbackCollectionId = Number(context?.selectedCollectionId ?? context?.collectionId ?? context?.document?.collectionId ?? 0);
		if (Number.isInteger(fallbackCollectionId) && fallbackCollectionId > 0) {
			expandedCollectionsState[fallbackCollectionId] = true;
		}
	}

	// The one allowed toast call of the module: always top-right. Only failures reach it - a gesture that
	// worked is reported by the control that was pressed, not by a balloon.
	function createNotifier() {
		return content => {
			if (!main_core.Type.isStringFilled(content)) {
				return;
			}
			BX.UI.Notification.Center.notify({
				content,
				position: 'top-right'
			});
		};
	}
	async function scrollSelectedDocIntoView(docId) {
		const normalizedId = Number(docId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
			return;
		}
		await ui_vue3.nextTick();
		const node = document.querySelector(`[data-doc-id="${normalizedId}"]`);
		if (node && main_core.Type.isFunction(node.scrollIntoView)) {
			node.scrollIntoView({
				block: 'center',
				behavior: 'smooth'
			});
		}
	}
	function createHydrateFromInitialContext(store, uiState) {
		return context => {
			const isHydrated = store.actions.hydrateFromInitialContext(context);
			if (!isHydrated) {
				return false;
			}
			applyExpandedCollectionsFromContext(uiState, context);
			return true;
		};
	}
	function createHydrateInitialCollections(store) {
		return payload => store.actions.hydrateInitialCollections(payload);
	}
	function createHydrationApi(store, uiState) {
		return {
			hydrateFromInitialContext: createHydrateFromInitialContext(store, uiState),
			hydrateInitialCollections: createHydrateInitialCollections(store)
		};
	}

	// `isFavoritesSectionExpanded` is asked of the store rather than kept here: that flag lives there, because
	// the rail of the collapsed panel opens the block its entry leads to. Everything the option holds is
	// written on every save - CUserOptions replaces the whole value, so a save carrying only what changed
	// would take the rest of the panel's state with it.
	function createSidebarPersistenceHandlers(uiState, isFavoritesSectionExpanded) {
		const sidebarUiState = uiState;
		let pendingWrite = 0;
		// One gesture can change two of these at once: the entry of the collapsed rail expands the panel AND
		// opens the block it leads to. Written as two requests, each carrying the whole option, they raced -
		// whichever landed last decided, and the block came back closed. So the state is written once, after
		// the gesture that changed it is over, and what it writes is the state as it then stands.
		const flushWrite = () => {
			pendingWrite = 0;
			void main_core.ajax.runAction('main.userOption.saveOptions', {
				json: {
					newValues: [{
						c: 'note',
						n: 'sidebar',
						v: {
							width: sidebarUiState.sidebarWidth,
							collapsed: sidebarUiState.sidebarCollapsed ? 'Y' : 'N',
							favoritesOpen: isFavoritesSectionExpanded() ? 'Y' : 'N',
							collectionsOpen: sidebarUiState.collectionsSectionExpanded ? 'Y' : 'N'
						}
					}]
				}
			}).catch(() => {
				// Keep UI state even if persistence fails.
			});
		};
		const saveSidebarState = ({
			width = sidebarUiState.sidebarWidth,
			collapsed = sidebarUiState.sidebarCollapsed
		} = {}) => {
			sidebarUiState.sidebarWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
			sidebarUiState.sidebarCollapsed = normalizeSidebarCollapsed(collapsed);
			if (pendingWrite !== 0) {
				return;
			}
			pendingWrite = setTimeout(flushWrite, 0);
		};
		const setSidebarWidth = width => {
			sidebarUiState.sidebarWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
		};
		const saveSidebarWidth = width => {
			const normalizedWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
			sidebarUiState.sidebarWidth = normalizedWidth;
			saveSidebarState({
				width: normalizedWidth,
				collapsed: sidebarUiState.sidebarCollapsed
			});
		};
		const setSidebarMinWidth = minWidth => {
			const normalizedMin = normalizeSidebarMinWidth(minWidth);
			if (normalizedMin === sidebarUiState.sidebarMinWidth) {
				return;
			}
			sidebarUiState.sidebarMinWidth = normalizedMin;
			if (sidebarUiState.sidebarWidth < normalizedMin) {
				sidebarUiState.sidebarWidth = normalizedMin;
			}
		};
		const setSidebarCollapsed = collapsed => {
			sidebarUiState.sidebarCollapsed = normalizeSidebarCollapsed(collapsed);
			return sidebarUiState.sidebarCollapsed;
		};
		const toggleSidebarCollapsed = () => {
			sidebarUiState.sidebarCollapsed = !sidebarUiState.sidebarCollapsed;
			return sidebarUiState.sidebarCollapsed;
		};

		// Not persisted, unlike its neighbours: the panel always starts collapsed on a fresh page.
		const setAiChatOpen = open => {
			sidebarUiState.aiChatOpen = Boolean(open);
			return sidebarUiState.aiChatOpen;
		};
		return {
			saveSidebarState,
			setSidebarWidth,
			saveSidebarWidth,
			setSidebarMinWidth,
			setSidebarCollapsed,
			toggleSidebarCollapsed,
			setAiChatOpen
		};
	}
	function createStoreProxy(store) {
		return {
			ensureChildrenLoaded: (collectionId, parentId) => store.actions.ensureChildrenLoaded(collectionId, parentId),
			findCollection: collectionId => store.queries.findCollection(collectionId),
			findLoadedDocument: (collectionId, docId) => store.queries.findLoadedDocument(collectionId, docId),
			findLoadedDocumentAnywhere: docId => store.queries.findLoadedDocumentAnywhere(docId),
			getAncestorsForDocument: docId => store.queries.getAncestorsForDocument(docId),
			hasNextChildren: (collectionId, parentId) => store.queries.hasNextChildren(collectionId, parentId),
			loadMoreChildren: (collectionId, parentId) => store.actions.loadDocuments(collectionId, parentId, true),
			// Shared counterparts: a document reached through a document-level grant has no collection
			// branch to read, its children live in the accessible-tree namespace.
			ensureSharedChildrenLoaded: (collectionId, parentId) => store.actions.prefetchSharedChildren({
				collectionId,
				id: parentId
			}),
			loadMoreSharedChildren: (collectionId, parentId) => store.actions.loadMoreSharedChildren({
				collectionId,
				id: parentId
			}),
			isDocumentLoaded: docId => store.queries.isDocumentLoadedAnywhere(docId),
			setSharedView: active => store.actions.setSharedView(active),
			setArchiveView: active => store.actions.setArchiveView(active),
			setRecycleBinView: active => store.actions.setRecycleBinView(active),
			insertCollectionLocal: collection => store.actions.insertCollectionLocal(collection),
			updateCollectionLocal: (collectionId, patch) => store.actions.updateCollectionLocal(Number(collectionId), patch),
			removeCollectionLocal: collectionId => store.actions.removeCollectionLocal(Number(collectionId)),
			isCollectionSelected: collectionId => Number(store.state.selectedCollectionId.value) === Number(collectionId),
			clearCollectionSelection: () => store.actions.clearSelection(),
			// [P4.T6] The page of a knowledge base re-reads the block when the server turns a subscription
			// down for an object that is not in the list any more.
			reloadFavorites: () => store.actions.reloadFavorites(),
			// [TPL-01] Star of the knowledge base page: one implementation of the gesture for every star.
			toggleFavorite: (target, hint) => store.actions.toggleFavorite(target, hint)
		};
	}
	function createSidebarState(store, uiState, dragState, routeSyncService) {
		return createSidebarRootState({
			store,
			uiState,
			dragState,
			getRouteDocumentId: () => routeSyncService.getRouteDocumentId()
		});
	}
	function createSidebarRuntime({
		router,
		emitAction,
		getRouteDocumentContext,
		reloadRouteDocumentContext,
		routeNames,
		api,
		dialog,
		dragState,
		uiState,
		store,
		messages,
		onFail,
		initialFavorites
	}) {
		const isDragging = () => Boolean(dragState.docItem || dragState.collectionItem);
		const hydrationApi = createHydrationApi(store, uiState);
		// A row clicked in the tree is already in frame: scrolling it to the centre would only jerk the
		// panel away from where the pointer is. Only navigation coming from outside the tree - a direct
		// link, initial context, search, favourites, a link inside a document - has to reveal the row.
		let skipNextSelectionScroll = false;
		ui_vue3.watch(() => store.state.selectedDocId.value, newId => {
			if (skipNextSelectionScroll) {
				skipNextSelectionScroll = false;
				return;
			}
			void scrollSelectedDocIntoView(newId);
		}, {
			flush: 'post'
		});
		// Prune expandedCollections for ids no longer present (NONE→VIEW must enter collapsed).
		ui_vue3.watch(() => store.state.collections.value.map(c => Number(c?.id)), currentIds => {
			const presentIds = new Set(currentIds.filter(id => Number.isInteger(id) && id > 0));
			for (const key of Object.keys(uiState.expandedCollections)) {
				if (!presentIds.has(Number(key))) {
					delete uiState.expandedCollections[key];
				}
			}
		});
		const routeSyncService = new SidebarRouteSyncService({
			store,
			router,
			uiState,
			messages,
			emitAction,
			getRouteDocumentContext,
			routeNames,
			hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext
		});
		const persistenceHandlers = createSidebarPersistenceHandlers(uiState, () => store.state.favoritesSectionExpanded.value);
		const collectionUseCases = new CollectionUseCases({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			emitAction,
			isDragging,
			router,
			routeNames,
			getRouteDocumentContext,
			saveSidebarState: persistenceHandlers.saveSidebarState
		});
		const documentUseCases = new DocumentUseCases({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			router,
			routeNames,
			isDragging,
			getRouteDocumentContext,
			reloadRouteDocumentContext
		});
		const collectionDndService = new CollectionDndService({
			dragState,
			store,
			api,
			onFail
		});
		const documentDndService = new DocumentDndService({
			dragState,
			store,
			api,
			onFail,
			uiState,
			autoExpandDelayMs: AUTO_EXPAND_DELAY_MS
		});
		const favoriteDndService = new FavoriteDndService({
			dragState,
			store
		});
		const fileDropService = new FileDropService({
			dragState,
			store,
			documentUseCases,
			onFail,
			messages
		});
		const actions = createSidebarActions({
			collectionUseCases,
			documentUseCases,
			collectionDndService,
			documentDndService,
			favoriteDndService,
			fileDropService,
			messages,
			router,
			routeNames,
			setSidebarWidth: persistenceHandlers.setSidebarWidth,
			saveSidebarWidth: persistenceHandlers.saveSidebarWidth,
			setSidebarMinWidth: persistenceHandlers.setSidebarMinWidth,
			setSidebarCollapsed: persistenceHandlers.setSidebarCollapsed,
			toggleSidebarCollapsed: persistenceHandlers.toggleSidebarCollapsed,
			saveSidebarState: persistenceHandlers.saveSidebarState,
			setAiChatOpen: persistenceHandlers.setAiChatOpen,
			suppressSelectionScrollOnce: () => {
				skipNextSelectionScroll = true;
			},
			favoriteActions: {
				toggleFavorite: (target, hint) => store.actions.toggleFavorite(target, hint),
				loadFavoritesPage: () => store.actions.loadFavoritesPage(),
				reloadFavorites: () => store.actions.reloadFavorites(),
				retryFavorites: () => store.actions.retryFavorites(),
				setFavoritesFilter: onlyNotified => store.actions.setFavoritesFilter(onlyNotified),
				// Both of these are how the block is opened and closed, so both are where the state is
				// remembered - by the same route the width and the collapsed panel take.
				setFavoritesSectionExpanded: expanded => {
					// The filter forces the block open on every press, and most of those presses find it open
					// already: only a state that changed is worth a write.
					const wasExpanded = store.state.favoritesSectionExpanded.value;
					store.actions.setFavoritesSectionExpanded(expanded);
					if (store.state.favoritesSectionExpanded.value !== wasExpanded) {
						persistenceHandlers.saveSidebarState();
					}
				},
				toggleFavoritesSection: () => {
					store.actions.toggleFavoritesSection();
					persistenceHandlers.saveSidebarState();
				},
				toggleFavoriteExpanded: item => store.actions.toggleFavoriteExpanded(item),
				retryFavoriteBranch: item => store.actions.retryFavoriteBranch(item),
				refreshFavoriteCoverage: params => store.actions.refreshFavoriteCoverage(params),
				toggleFavoriteNotify: target => store.actions.toggleFavoriteNotify(target),
				setFavoriteNotify: (target, mode) => store.actions.setFavoriteNotify(target, mode),
				clearFavoriteNotify: target => store.actions.clearFavoriteNotify(target)
			}
		});
		const state = createSidebarState(store, uiState, dragState, routeSyncService);
		const storeProxy = createStoreProxy(store);

		// The block is painted with the rest of the sidebar, and hiding an empty one (AC-027) needs a
		// confirmed empty page - so its first page is there from the start: taken from the page when the
		// server rendered it in (TPL-02), read up front otherwise.
		if (!store.actions.hydrateFavorites(initialFavorites)) {
			void store.actions.loadFavoritesPage();
		}
		return {
			state,
			actions,
			store: storeProxy,
			messages,
			bootstrap: async (options = {}) => routeSyncService.bootstrap(options),
			syncFromRouteContext: async (withCollectionFallback = false, options = {}) => routeSyncService.syncFromRouteContext(withCollectionFallback, options),
			hydrateInitialCollections: hydrationApi.hydrateInitialCollections,
			hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext,
			...storeProxy,
			destroy: () => {
				routeSyncService.destroy();
				// The use cases hold global EventEmitter subscriptions, which outlive the mount unless they
				// are taken down here.
				documentUseCases.destroy();
				collectionUseCases.destroy();
			}
		};
	}
	function createSidebarFeature({
		router,
		emitAction = () => {},
		getRouteDocumentContext = () => null,
		reloadRouteDocumentContext = null,
		routeNames = {
			home: 'home',
			document: 'document',
			search: 'search',
			shared: 'shared',
			archive: 'archive',
			recyclebin: 'recyclebin'
		},
		sidebarOptions = null,
		isMobile = false,
		historyEnabled = false,
		notificationsEnabled = false,
		sharedTreeEnabled = false,
		initialFavorites = null
	}) {
		const api = new SidebarApi(new AjaxControllerClient());
		const dialog = new DialogService();
		const dragState = createDragState();
		const initialSidebarWidth = normalizeSidebarWidth(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.width : SIDEBAR_DEFAULT_WIDTH);
		const initialSidebarCollapsed = normalizeSidebarCollapsed(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.collapsed : false);
		// The two blocks the panel remembers. "Shared with me" is not among them on purpose: it is closed by
		// default and reads its tree only when opened, so remembering it open would mean a request on every
		// load of the page.
		const initialFavoritesOpen = normalizeSidebarSection(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.favoritesOpen : undefined);
		const uiState = createUiState(initialSidebarWidth, initialSidebarCollapsed, Boolean(isMobile), Boolean(historyEnabled), Boolean(notificationsEnabled), Boolean(sharedTreeEnabled), normalizeSidebarSection(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.collectionsOpen : undefined));
		const messages = buildSidebarMessages();
		const store = createSidebarStore(api, {
			messages,
			notify: createNotifier()
		});
		// Straight onto the state the block is drawn from, before anything renders: the block belongs to the
		// store (the rail reaches it from outside the component), so this is where its saved state lands.
		store.actions.setFavoritesSectionExpanded(initialFavoritesOpen);
		const onFail = error => {
			// A move blocked because it would escalate subtree access gets its own "needs moderator"
			// message; everything else falls back to the server text or a generic error.
			if (error?.code === 'NOTE_MOVE_ACCESS_ESCALATION') {
				store.actions.setError(messages.moveAccessEscalation);
				return;
			}
			store.actions.setError(error?.message || messages.errorGeneric);
		};
		return createSidebarRuntime({
			router,
			emitAction,
			getRouteDocumentContext,
			reloadRouteDocumentContext,
			routeNames,
			api,
			dialog,
			dragState,
			uiState,
			store,
			messages,
			onFail,
			initialFavorites
		});
	}

	exports.DialogService = DialogService;
	exports.NoteEvent = NoteEvent;
	exports.NoteRailOwner = NoteRailOwner;
	exports.SidebarRootComponent = SidebarRootComponent;
	exports.createSidebarFeature = createSidebarFeature;

})(this.BX.Note.Sidebar = this.BX.Note.Sidebar || {}, BX.UI.IconSet, window, window, BX.Note, BX.Note.Ui, BX.Vue3, BX, BX.Note.Ui, BX.SidePanel, BX.Note.Import, BX.Note.Permissions, BX.Note.Ui, BX.Note.Ui, BX.Event, BX.UI.Notification, BX.Note.Ui, BX, BX.UI, BX.UI.Dialogs, BX.UI.System);
//# sourceMappingURL=sidebar.bundle.js.map
