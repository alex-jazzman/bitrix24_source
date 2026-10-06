import { readTasksInfo } from './info';

const AVAILABILITY_DEADLINE_MS = 30000;
const DETACH_DESTROY_DELAY_MS = 3000;

// ONE dialog reused across rounds (spec addendum 2026-08-20): rounds end with
// hide(), never destroy() - late async paths of ui.entity-selector (initial
// load .catch, both non-cancelable debounces, queryXhr) then land on a living
// instance, which is the stock mode of that extension. The only destroy()
// happens on detach, where the popup would otherwise outlive its SidePanel.
let dialog = null;
let activeRound = null;

function hideDialog()
{
	if (dialog && !dialog.destroyed)
	{
		dialog.hide();
	}
}

// Exactly one terminal per round; send === null means zero replies
// (taskPickCancel / detach - spec 4.1). finished is set BEFORE hide(), so the
// synchronous Popup onClose never classifies our own cleanup as a user cancel.
function completeRound(round, send)
{
	if (round.finished)
	{
		return;
	}
	round.finished = true;
	clearTimeout(round.deadlineTimer);
	if (send)
	{
		send();
	}
	hideDialog();
	round.resolve();
	if (activeRound === round)
	{
		activeRound = null;
	}
}

// An unhandled late-callback error rejects the round promise; the router turns
// exactly that rejection into taskPickError UNKNOWN (spec 5.3 p.5).
function failRound(round, err)
{
	if (round.finished)
	{
		return;
	}
	round.finished = true;
	clearTimeout(round.deadlineTimer);
	hideDialog();
	round.reject(err);
	if (activeRound === round)
	{
		activeRound = null;
	}
}

// Event callbacks fire long after the handler promise would have settled on
// its own - errors must be funneled into the round promise by hand.
const guardEvent = (fn) => (...args) => {
	const round = activeRound;
	try
	{
		fn(...args);
	}
	catch (err)
	{
		if (round && !round.finished)
		{
			failRound(round, err);
		}
		else
		{
			throw err;
		}
	}
};

// anchor (client coords of the board iframe viewport) -> absolute page
// coordinates of the top document: the object bind of main.popup is an
// absolute page position, and the dialog is created via top.BX (spec 5.3 p.2).
// Exported since stage 4: actions.js anchors its popups with the same formula.
export function computeTargetPoint(anchor, containerId)
{
	const topWindow = window.top;
	if (!anchor || typeof anchor.left !== 'number' || typeof anchor.top !== 'number')
	{
		return {
			left: topWindow.pageXOffset + (topWindow.innerWidth / 2),
			top: topWindow.pageYOffset + (topWindow.innerHeight / 2),
		};
	}
	let left = anchor.left;
	let topOffset = anchor.top;
	const container = document.getElementById(containerId);
	const frame = container ? container.querySelector('iframe') : null;
	if (frame)
	{
		const rect = frame.getBoundingClientRect();
		left += rect.left;
		topOffset += rect.top;
	}
	// The board page itself may live inside a SidePanel frame: climb to top.
	let win = window;
	while (win !== topWindow && win.frameElement)
	{
		const rect = win.frameElement.getBoundingClientRect();
		left += rect.left;
		topOffset += rect.top;
		win = win.parent;
	}

	return {
		left: left + topWindow.pageXOffset,
		top: topOffset + topWindow.pageYOffset,
	};
}

// Between-rounds hygiene (spec addendum 2026-08-20): the reused dialog must
// not leak the previous round's selection or query into the new one.
function resetDialog(instance)
{
	instance.getSelectedItems().forEach((item) => item.deselect({ emitEvents: false }));
	const tagSelector = instance.getTagSelector();
	if (tagSelector)
	{
		tagSelector.clearTextBox();
	}
	instance.selectFirstTab();
}

async function readPickedTask(round, taskId)
{
	try
	{
		const { tasks } = await readTasksInfo([taskId]);
		if (round.finished)
		{
			return; // cancelled during 'read': the late result is suppressed (spec 5.3 p.4)
		}
		if (!tasks.length)
		{
			completeRound(round, () => round.reply('taskPickError', { code: 'TASK_READ_FAILED' }));
			return;
		}
		const task = tasks[0];
		completeRound(round, () => round.reply('taskPickResponse', { task }));
	}
	catch (err)
	{
		// Any read outcome without a task means there is nothing to place a card
		// from - including ACCESS_DENIED and the 10s read deadline (spec 4.1).
		if (!round.finished)
		{
			completeRound(round, () => round.reply('taskPickError', { code: 'TASK_READ_FAILED' }));
		}
	}
}

function createDialog(Dialog)
{
	return new Dialog({
		entities: [{ id: 'task-with-id' }],
		multiple: false,
		enableSearch: true,
		preselectedItems: [],
		// cacheable stays at its default (true): the single reused instance keeps
		// the global instances map at one entry (spec addendum 2026-08-20).
		events: {
			onLoad: guardEvent(() => {
				const round = activeRound;
				if (!round || round.finished)
				{
					return;
				}
				clearTimeout(round.deadlineTimer);
				round.phase = 'dialog';
			}),
			onLoadError: guardEvent(() => {
				const round = activeRound;
				if (!round || round.finished)
				{
					return;
				}
				completeRound(round, () => round.reply('taskPickError', { code: 'TASKS_UNAVAILABLE' }));
			}),
			'Item:onSelect': guardEvent((event) => {
				const round = activeRound;
				if (!round || round.finished)
				{
					return;
				}
				// The phase flips to 'read' synchronously BEFORE the stock
				// hideOnSelect closes the popup, so its onClose is not a cancel.
				round.phase = 'read';
				const { item } = event.getData();
				readPickedTask(round, String(item.getId()));
			}),
		},
		popupOptions: {
			// animation: false is load-bearing (MR review): the default 200ms
			// closing animation keeps the popup isShown() while a replacement
			// round calls show() - with the loaded-dialog deadline already
			// defused the new round would stay without a visible popup.
			animation: false,
			events: {
				// The close classifier is the SYNCHRONOUS Popup onClose, not
				// Dialog:onHide - onHide loses the race against the 200ms closing
				// animation (spec 5.3 p.3). Programmatic terminals set finished
				// before hide(), so only a user close gets here unfinished.
				onClose: guardEvent(() => {
					const round = activeRound;
					if (!round || round.finished || round.phase === 'read')
					{
						return;
					}
					completeRound(round, () => round.reply('taskPickCancelled', {}));
				}),
			},
		},
	});
}

async function runRound(round, data, ctx)
{
	let selectorExports;
	try
	{
		selectorExports = await top.BX.Runtime.loadExtension('ui.entity-selector');
		await top.BX.Runtime.loadExtension('tasks.entity-selector');
	}
	catch (err)
	{
		completeRound(round, () => round.reply('taskPickError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	if (round.finished)
	{
		return; // cancelled or replaced while loading - never show a stale dialog
	}
	const Dialog = selectorExports && selectorExports.Dialog;
	const Entity = selectorExports && selectorExports.Entity;
	if (!Dialog || !Entity)
	{
		completeRound(round, () => round.reply('taskPickError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	// Preflight (spec 5.3 p.1): without the tasks module the provider's server
	// half is absent, the client defaults stay false and the dialog would hang
	// forever empty without even an onLoadError.
	const entityOptions = Entity.getEntityDefaultOptions('task-with-id');
	if (!entityOptions || entityOptions.dynamicLoad !== true || entityOptions.dynamicSearch !== true)
	{
		completeRound(round, () => round.reply('taskPickError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	const point = computeTargetPoint(data.anchor, ctx.containerId);
	if (!dialog || dialog.destroyed)
	{
		dialog = createDialog(Dialog);
	}
	else
	{
		resetDialog(dialog);
	}
	dialog.setTargetNode(point);
	// A loaded reused dialog never re-emits Dialog:onLoad (load() exits on
	// loadState !== UNSENT) - defuse the availability deadline synchronously
	// (stage 4 spec 5.4), or the second round would get a false
	// TASKS_UNAVAILABLE after 30s with the dialog open.
	if (typeof dialog.isLoaded === 'function' && dialog.isLoaded())
	{
		clearTimeout(round.deadlineTimer);
		round.phase = 'dialog';
	}
	dialog.show();
}

export function handleTaskPickRequest(data, ctx)
{
	const requestId = data.requestId;
	if (activeRound && !activeRound.finished)
	{
		// Round replacement: the old requestId gets exactly one taskPickCancelled
		// (spec 4.1) and its late preload never opens a dialog (finished flag).
		const replaced = activeRound;
		completeRound(replaced, () => replaced.reply('taskPickCancelled', {}));
	}
	let resolveRound = null;
	let rejectRound = null;
	const promise = new Promise((resolve, reject) => {
		resolveRound = resolve;
		rejectRound = reject;
	});
	const round = {
		requestId,
		phase: 'preload',
		finished: false,
		deadlineTimer: null,
		resolve: resolveRound,
		reject: rejectRound,
		reply: (event, payload) => ctx.reply(event, Object.assign({ requestId }, payload)),
	};
	activeRound = round;
	// The single availability deadline (spec 4.1): from the request to
	// Dialog:onLoad, covering both extension loads AND the initial
	// ui.entityselector.load, which runs with no timeout of its own.
	round.deadlineTimer = setTimeout(() => {
		completeRound(round, () => round.reply('taskPickError', { code: 'TASKS_UNAVAILABLE' }));
	}, AVAILABILITY_DEADLINE_MS);
	runRound(round, data, ctx).catch((err) => failRound(round, err));

	return promise;
}

export function handleTaskPickCancel(data)
{
	const round = activeRound;
	if (!round || round.finished || String((data && data.requestId) || '') !== String(round.requestId))
	{
		return;
	}
	// Zero replies: the board has already cancelled locally (spec 4.1). In the
	// 'read' phase the finished flag suppresses the late read result.
	completeRound(round, null);
}

export function detachPick()
{
	if (activeRound && !activeRound.finished)
	{
		// The page is leaving: finish silently, zero replies (spec 5.3 p.5).
		completeRound(activeRound, null);
	}
	if (!dialog)
	{
		return;
	}
	const dying = dialog;
	dialog = null;
	if (dying.destroyed)
	{
		return;
	}
	dying.hide();
	// The popup lives in top and would outlive a closed SidePanel. destroy() is
	// delayed past both non-cancelable ui debounces (200/500ms); a load still
	// pending after that is the documented residual (spec addendum 2026-08-20).
	top.setTimeout(() => {
		if (!dying.destroyed)
		{
			dying.destroy();
		}
	}, DETACH_DESTROY_DELAY_MS);
}
