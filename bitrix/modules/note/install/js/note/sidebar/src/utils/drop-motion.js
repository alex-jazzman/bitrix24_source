const TRAVEL_MS = 120;
// How long the rows are given to appear in their new places before the travel is called off.
const TRAVEL_FRAMES = 6;

// The panel is marked while a section's share is moving, and the stylesheet transitions the share only
// while it is. A drop is a share change with no transition of its own - the branch it left and the branch
// it joined are not the same height - so the window is opened by hand around it. Same name the section
// transition uses (ExpandTransition), one panel to a page.
const PANEL_ANIMATING_CLASS = 'is-section-animating';
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
export function prefersReducedMotion(): boolean
{
	return typeof window.matchMedia === 'function'
		&& window.matchMedia('(prefers-reduced-motion: reduce)').matches
	;
}

export function markSectionMotion(root: ?HTMLElement, ms: number = MOTION_MS): void
{
	if (!(root instanceof HTMLElement))
	{
		return;
	}

	const panel = root.classList.contains('sidebar-sections')
		? root
		: root.querySelector('.sidebar-sections')
	;
	if (!(panel instanceof HTMLElement))
	{
		return;
	}

	panel.classList.add(PANEL_ANIMATING_CLASS);
	// In force before the share it is to carry changes, or the change lands in one step.
	void panel.offsetHeight;
	clearTimeout(motionTimer);
	motionTimer = setTimeout(() => {
		motionTimer = 0;
		// A section of the panel may still be opening on its own account, and that motion owns the mark.
		if (!panel.querySelector(`.${BRANCH_ANIMATING_CLASS}`))
		{
			panel.classList.remove(PANEL_ANIMATING_CLASS);
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
export function captureRowTravel(docId: number): Object | null
{
	if (typeof document === 'undefined')
	{
		return null;
	}

	const id = Number(docId);
	if (!Number.isFinite(id) || id <= 0)
	{
		return null;
	}

	// By id, not by the drag-source mark: releasing the pointer ends the drag, and the mark is gone from
	// the row before the move it started is through.
	const source = document.querySelector(`.sidebar .tree-row[data-doc-id="${id}"]`);
	if (!(source instanceof HTMLElement))
	{
		return null;
	}

	const area = source.closest('.tree-scroll');
	const before = captureRows(area);

	return {
		play(): void
		{
			// After the render, still inside the frame that carries it: the store is patched by the time
			// this is called, the DOM is not, and the render is queued as a microtask ahead of this one.
			// A frame later would be a frame the rows spend at their new places before the travel starts,
			// which reads as a flicker. If the render has not landed after all, the retries below wait for
			// it frame by frame.
			void Promise.resolve().then(() => {
				playTravel(area, id, before, TRAVEL_FRAMES);
			});
		},
	};
}

// The same from the other end: a row created has nowhere on screen to come from, but every row under the
// place it takes has a row of height to give up, and that was a step of exactly one row in a single frame.
// The rows below travel down and the new one is faded in over the same 120ms.
export function captureRowArrival(parentId: number | null): Object | null
{
	if (typeof document === 'undefined')
	{
		return null;
	}

	const parent = Number(parentId);
	const area = Number.isFinite(parent) && parent > 0
		? document.querySelector(`.sidebar .tree-row[data-doc-id="${parent}"]`)?.closest('.tree-scroll')
		: document.querySelector('.sidebar .tree-scroll--collections')
	;
	if (!(area instanceof HTMLElement))
	{
		return null;
	}

	const before = captureRows(area);

	return {
		play(): void
		{
			void Promise.resolve().then(() => {
				playTravel(area, null, before, TRAVEL_FRAMES);
			});
		},
	};
}

// Every row the drop moves, and not only the documents: a list holds the rows of its knowledge bases too,
// and those stand below the documents of the base above them. Left out of the measurement they were left
// out of the travel as well - the documents glided to their new places while every base under them stepped
// a row in a single frame.
const TRAVELLING_ROWS = '.tree-row[data-doc-id], .collection-row[data-collection-id]';

// Identity across the two kinds, so a document and a knowledge base of the same number are not one row.
function rowKey(row: HTMLElement): string
{
	return row.dataset.docId ? `док:${row.dataset.docId}` : `база:${row.dataset.collectionId}`;
}

function captureRows(area: ?HTMLElement): Map
{
	const scope = area instanceof HTMLElement ? area : document;
	const before = new Map();
	for (const row of scope.querySelectorAll(TRAVELLING_ROWS))
	{
		if (!(row instanceof HTMLElement) || before.has(rowKey(row)))
		{
			continue;
		}

		const rect = row.getBoundingClientRect();
		before.set(rowKey(row), { top: rect.top, left: rect.left, indent: indentOf(row) });
	}

	return before;
}

// The level a row is drawn at, in pixels. It is a spacer standing at the head of the row and not padding
// on the row itself (see .tree-row__indent), so a row that only changed level has exactly the same box as
// before and the travel below would find nothing to carry.
function indentOf(row: HTMLElement): number | null
{
	const spacer = row.querySelector('.tree-row__indent');

	return spacer instanceof HTMLElement ? spacer.getBoundingClientRect().width : null;
}

function playTravel(area: ?HTMLElement, id: number | null, before: Map, framesLeft: number): void
{
	// Nothing is sent anywhere when less motion is asked for: the rows are simply where the store put
	// them, which is where this would have carried them anyway. Left before anything is touched, so
	// there is no inline style and no hidden row to hand back.
	if (prefersReducedMotion())
	{
		return;
	}

	const scope = area instanceof HTMLElement && area.isConnected ? area : document;
	// A row that was dragged: its old place is the one the travel starts from. Nothing dragged (a row
	// created) leaves this empty, and then the only motion is the rows around it making room.
	const from = id === null ? null : before.get(`док:${id}`);
	if (id !== null && !from)
	{
		return;
	}

	// Both places at once, for a frame or two: the row is in the branch it joined from the moment the
	// store is patched, and it leaves the one it came from when that branch is reloaded.
	const copies = [];
	for (const row of (from === null ? [] : scope.querySelectorAll(`.tree-row[data-doc-id="${id}"]`)))
	{
		if (!(row instanceof HTMLElement))
		{
			continue;
		}

		const rect = row.getBoundingClientRect();
		copies.push({
			row,
			indent: indentOf(row),
			distance: Math.abs(from.left - rect.left) + Math.abs(from.top - rect.top),
		});
	}

	// The level tells them apart before distance does. A row that changed level is drawn at its new indent
	// in the branch it joined, while the copy left behind is still drawn by the branch it came from, at the
	// indent it had - and distance would have picked the wrong one of the two: a row dropped one level down
	// right where it already stood does not move at all, while the copy behind it is pushed a row down by
	// the arrival and so looks like the one that travelled.
	const levelled = copies.filter((copy) => (
		typeof copy.indent === 'number'
		&& typeof from?.indent === 'number'
		&& Math.abs(copy.indent - from.indent) >= 1
	));

	let target = null;
	let travelled = 0;
	let stale = null;
	if (levelled.length === 1)
	{
		target = levelled[0].row;
		travelled = Math.max(levelled[0].distance, Math.abs(levelled[0].indent - from.indent));
		stale = copies.find((copy) => copy.row !== target)?.row ?? null;
	}
	else
	{
		// Same level on both sides, so the one that travelled is the one that is NOT where the drag started.
		let staleDistance = Number.POSITIVE_INFINITY;
		for (const copy of copies)
		{
			if (copy.distance > travelled)
			{
				target = copy.row;
				travelled = copy.distance;
			}
			if (copy.distance < staleDistance)
			{
				stale = copy.row;
				staleDistance = copy.distance;
			}
		}
	}

	// A row dropped into a branch that is closed is not on screen at all afterwards, and there is nothing
	// to send anywhere - but the rows below the place it left still have a row of height to climb, and
	// that is the motion this is here for.
	if (travelled < 1)
	{
		target = null;
		stale = null;
	}

	// The copy left behind goes out of the flow before anything is measured: it holds a row of height the
	// list is about to lose, so measured against it every row below stands a row lower than where it ends
	// up. The travel would start off by the height of a row in the wrong direction and correct itself the
	// moment the copy went away - which is the jump this is here to remove.
	const staleHost = stale !== null && stale !== target ? (stale.closest('li') ?? stale) : null;
	if (staleHost instanceof HTMLElement)
	{
		staleHost.style.display = 'none';
	}

	const limit = scope === document ? window.innerHeight : scope.clientHeight;
	const moved = [];
	const arrived = [];
	const levelChanged = [];
	for (const row of scope.querySelectorAll(TRAVELLING_ROWS))
	{
		if (!(row instanceof HTMLElement))
		{
			continue;
		}

		const previous = row === target ? from : before.get(rowKey(row));
		if (!previous)
		{
			// A row that was not on screen a moment ago and has nowhere to travel from. One of them is the
			// row just created, and it is faded in while the rows around it make room; a whole branch that
			// opened at the same time is its own transition's business, so only single arrivals are faded.
			arrived.push(row);

			continue;
		}

		// A row that stayed inside its branch may already be travelling: its group measures the move and
		// plays it back on the row's list item. Sending it a second time would double the distance.
		const host = row.closest('li') ?? row;
		if (getComputedStyle(host).transform !== 'none')
		{
			continue;
		}

		// The level, before the box: a row can change one without the other. Dropped under the row above it,
		// a row keeps its place to the pixel and the whole of the change is 20px of indent - so with nothing
		// else moving on screen, this is the only thing there is to see. Sent from the indent it had, it
		// slides under its new parent over the same time a row takes to travel.
		const spacer = row.querySelector('.tree-row__indent');
		const indent = spacer instanceof HTMLElement ? spacer.getBoundingClientRect().width : null;
		if (
			spacer instanceof HTMLElement
			&& typeof indent === 'number'
			&& typeof previous.indent === 'number'
			&& Math.abs(previous.indent - indent) >= 1
		)
		{
			spacer.style.transition = 'none';
			spacer.style.width = `${previous.indent}px`;
			levelChanged.push({ spacer, to: indent });
		}

		const rect = row.getBoundingClientRect();
		const dx = previous.left - rect.left;
		const dy = previous.top - rect.top;
		if (Math.abs(dx) < 1 && Math.abs(dy) < 1)
		{
			continue;
		}

		// Where a row came from off screen - a branch that had to be scrolled to, a section of its own -
		// there is no travel to show, only a row flying in from beyond the edge.
		if (Math.abs(dx) > limit || Math.abs(dy) > limit)
		{
			continue;
		}

		row.style.transition = 'none';
		row.style.transform = `translate(${dx}px, ${dy}px)`;
		moved.push(row);
	}

	// A level changed with no row moving anywhere is motion too, and the only motion this drop has.
	if (moved.length === 0 && levelChanged.length === 0)
	{
		if (staleHost instanceof HTMLElement)
		{
			staleHost.style.display = '';
		}

		// Nothing has moved yet - the render is still to come. Given up on after a few frames: a drop that
		// changes nothing (the row put back where it was) has nothing to animate either.
		if (framesLeft > 0)
		{
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
	for (const row of faded)
	{
		row.style.transition = 'none';
		row.style.opacity = '0';
	}

	if (scope instanceof HTMLElement)
	{
		scope.classList.add(TRAVELING_CLASS);
	}

	// One reflow for the whole list, so every row starts from where it was with no transition in force.
	void scope.offsetHeight;

	for (const row of moved)
	{
		row.style.transition = `transform ${TRAVEL_MS}ms ease-out`;
		row.style.transform = 'translate(0, 0)';
	}

	for (const row of faded)
	{
		row.style.transition = `opacity ${TRAVEL_MS}ms ease-out`;
		row.style.opacity = '1';
	}

	for (const { spacer, to } of levelChanged)
	{
		spacer.style.transition = `width ${TRAVEL_MS}ms ease-out`;
		spacer.style.width = `${to}px`;
	}

	// Whatever is moving carries the clean-up. A drop that only changed a level has no row travelling to
	// wait for, and then the indent that is sliding is what tells the motion is over.
	const anchor = target instanceof HTMLElement && moved.includes(target)
		? target
		: (moved[0] ?? levelChanged[0].spacer)
	;
	const anchorProperty = moved.length > 0 ? 'transform' : 'width';

	let timer = 0;
	const finish = () => {
		clearTimeout(timer);
		anchor.removeEventListener('transitionend', onEnd);
		for (const row of moved)
		{
			row.style.transition = '';
			row.style.transform = '';
		}

		for (const row of faded)
		{
			row.style.transition = '';
			row.style.opacity = '';
		}

		for (const { spacer } of levelChanged)
		{
			spacer.style.transition = '';
			spacer.style.width = '';
		}

		if (scope instanceof HTMLElement)
		{
			scope.classList.remove(TRAVELING_CLASS);
		}

		// Handed back to whoever owns it: by now the branch it was in has been reloaded without it, and
		// if it is still there it is a row that belongs in the list.
		if (staleHost instanceof HTMLElement)
		{
			staleHost.style.display = '';
		}
	};
	const onEnd = (event: TransitionEvent) => {
		if (event.target === anchor && event.propertyName === anchorProperty)
		{
			finish();
		}
	};

	anchor.addEventListener('transitionend', onEnd);
	// Rows that never get their transition - a tab in the background, a row re-rendered mid-flight -
	// would keep an inline transform for good.
	timer = setTimeout(finish, TRAVEL_MS + 80);
}
