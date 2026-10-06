import { listAction, withDeadline } from './info';
import { computeTargetPoint } from './pick';

const PRELOAD_DEADLINE_MS = 30000;
const WRITE_DEADLINE_MS = 30000;
const DETACH_DESTROY_DELAY_MS = 3000;

// ONE responsible dialog reused across rounds (stage-3 addendum 2026-08-20),
// separate from the pick dialog: different entities. dialogOwnerRequestId
// scopes every shared-dialog callback to the round that currently owns the
// popup - late events of a replaced round never touch the current one.
let responsibleDialog = null;
let dialogOwnerRequestId = null;
// At most one interactive round (phases preload|dialog). Write-phase rounds
// release the slot and finish independently (spec 5.3).
let interactiveRound = null;
// Every unfinished round, including write-phase ones: detach resolves them
// silently (spec 5.3).
const liveRounds = new Set();

const ACTION_CALLS = {
	start: (taskId) => BX.ajax.runAction('tasks.V2.Task.Status.start', {
		json: { task: { id: Number(taskId) } },
	}),
	// completeWithChecklist exactly as the full card: "V2 always delegates
	// checklist completion to the server" (spec 4.4).
	complete: (taskId) => BX.ajax.runAction('tasks.V2.Task.Status.complete', {
		json: { task: { id: Number(taskId) }, completeWithChecklist: true },
	}),
};

// Direct actions (spec 5.2): one stock call per round, no host UI, no shared
// state - parallel rounds are independent by construction.
export async function handleTaskActionRequest(data, ctx)
{
	const requestId = data.requestId;
	const call = ACTION_CALLS[data.action];
	if (!call)
	{
		// Unclassified board anomaly: the router catch turns this into UNKNOWN.
		throw new Error(`unknown task action: ${data.action}`);
	}
	try
	{
		await withDeadline(call(String(data.taskId)), WRITE_DEADLINE_MS);
		ctx.reply('taskActionResponse', { requestId });
	}
	catch (err)
	{
		// Everything lands in one code on the wire (spec 4.2): the board shows a
		// toast either way; the detail stays in the console for diagnostics.
		console.error('board-tasks action failed', data.action, err);
		ctx.reply('taskActionError', { requestId, code: 'TASK_WRITE_FAILED' });
	}
}

function hideResponsibleDialog()
{
	if (responsibleDialog && !responsibleDialog.destroyed)
	{
		responsibleDialog.hide();
	}
}

function destroyPickerNow(holder)
{
	if (!holder || holder.destroyed)
	{
		return;
	}
	holder.destroyed = true;
	holder.picker.destroy();
}

// Popup teardown of the terminating round. The shared dialog is hidden only
// when this round still owns it: a write-phase terminal must never hide the
// dialog of the NEXT interactive round (spec 5.3). The per-round date picker
// belongs to this round alone.
function releaseRoundPopup(round)
{
	if (round.field === 'responsible' && dialogOwnerRequestId === round.requestId)
	{
		hideResponsibleDialog();
		dialogOwnerRequestId = null;
	}
	if (round.field === 'deadline')
	{
		destroyPickerNow(round.pickerHolder);
		round.pickerHolder = null;
	}
}

function releaseSlots(round)
{
	if (interactiveRound === round)
	{
		interactiveRound = null;
	}
	liveRounds.delete(round);
}

// Exactly one terminal per round; send === null means zero replies
// (taskEditCancel in preload/dialog, detach). finished is set BEFORE the popup
// teardown, so the synchronous Popup onClose never classifies it as a cancel.
function finishRound(round, send)
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
	releaseRoundPopup(round);
	round.resolve();
	releaseSlots(round);
}

// An unhandled late-callback error rejects the round promise; the router turns
// exactly that rejection into taskEditError UNKNOWN.
function failRound(round, err)
{
	if (round.finished)
	{
		return;
	}
	round.finished = true;
	clearTimeout(round.deadlineTimer);
	releaseRoundPopup(round);
	round.reject(err);
	releaseSlots(round);
}

// phase -> write: the cancel classifier goes dark, the interactive slot frees
// up (writes finish independently), the shared dialog is closed by its owner.
// The order is normative (spec 5.3): phase first, then hide, then ownership.
function enterWritePhase(round)
{
	round.phase = 'write';
	clearTimeout(round.deadlineTimer);
	if (round.field === 'responsible' && dialogOwnerRequestId === round.requestId)
	{
		hideResponsibleDialog(); // synchronous close: animation: false (spec 5.4)
		dialogOwnerRequestId = null;
	}
	if (interactiveRound === round)
	{
		interactiveRound = null;
	}
	round.reply('taskEditApplying', {});
}

// The whole write phase - preflight AND the conditional write - lives under a
// single WRITE_DEADLINE_MS budget (spec 4.2).
async function runWritePhase(round, writeFn)
{
	try
	{
		await withDeadline(writeFn(), WRITE_DEADLINE_MS);
		finishRound(round, () => round.reply('taskEditResponse', {}));
	}
	catch (err)
	{
		console.error('board-tasks edit write failed', round.field, err);
		finishRound(round, () => round.reply('taskEditError', { code: 'TASK_WRITE_FAILED' }));
	}
}

// Write-preflight (spec 4.4): one confirmed read before EVERY field write.
// Re-delegating the same responsible restarts the task (the status resets to
// pending), re-writing the same date burns the reschedule journal.
function preflightRead(taskId)
{
	return listAction({
		select: ['id', 'deadline', 'responsible'],
		filter: [{ field: 'id', operator: 'in', value: [taskId] }],
		pagination: { limit: 1 },
	}, () => {}).then((response) => (((response || {}).data || {}).tasks || [])[0]);
}

async function writeResponsible(round, selectedId)
{
	const serverTask = await preflightRead(round.taskId);
	if (!serverTask)
	{
		throw new Error('write preflight found no task');
	}
	const serverResponsible = serverTask.responsible ? String(serverTask.responsible.id) : '';
	if (serverResponsible === selectedId)
	{
		return; // already the desired value - the write is skipped (spec 4.4)
	}
	await BX.ajax.runAction('tasks.V2.Task.Stakeholder.Responsible.delegate', {
		json: { task: { id: Number(round.taskId), responsible: { id: Number(selectedId) } } },
	});
}

// Shared-dialog callbacks act on the CURRENT owner round only.
function ownerRound()
{
	const round = interactiveRound;
	if (!round || round.finished || round.field !== 'responsible'
		|| dialogOwnerRequestId !== round.requestId)
	{
		return null;
	}

	return round;
}

const guardOwner = (fn) => (...args) => {
	const round = ownerRound();
	if (!round)
	{
		return;
	}
	try
	{
		fn(round, ...args);
	}
	catch (err)
	{
		failRound(round, err);
	}
};

function onResponsibleSelect(round, event)
{
	const { item } = event.getData();
	const selectedId = String(item.getId());
	// Fast local layer (spec 4.4): picking the current responsible is a cancel,
	// not a write - re-delegation would restart the task.
	if (round.current !== undefined && round.current !== null && selectedId === String(round.current))
	{
		finishRound(round, () => round.reply('taskEditCancelled', {}));
		return;
	}
	enterWritePhase(round);
	runWritePhase(round, () => writeResponsible(round, selectedId));
}

function createResponsibleDialog(Dialog)
{
	return new Dialog({
		// The stock quick "change responsible" action of tasks
		// (comment-action-controller) - the closest product analog (spec 5.4).
		entities: [
			{
				id: 'user',
				options: {
					intranetUsersOnly: true,
					emailUsers: false,
					inviteEmployeeLink: false,
					inviteGuestLink: false,
				},
			},
			{ id: 'department' },
		],
		multiple: false,
		enableSearch: true,
		preselectedItems: [],
		events: {
			onLoad: guardOwner((round) => {
				clearTimeout(round.deadlineTimer);
				round.phase = 'dialog';
			}),
			onLoadError: guardOwner((round) => {
				finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
			}),
			'Item:onSelect': guardOwner(onResponsibleSelect),
		},
		popupOptions: {
			// animation: false is load-bearing: the default 200ms closing animation
			// would make Popup.show() of the immediate next round bail on isShown()
			// (spec 5.4).
			animation: false,
			events: {
				onClose: guardOwner((round) => {
					// Only a user close in preload/dialog is a cancel; entering the
					// write phase hides the popup with the round still unfinished.
					if (round.phase !== 'preload' && round.phase !== 'dialog')
					{
						return;
					}
					finishRound(round, () => round.reply('taskEditCancelled', {}));
				}),
			},
		},
	});
}

// Between-rounds hygiene (stage-3 addendum): the reused dialog must not leak
// the previous round's selection or query into the new one.
function resetResponsibleDialog(instance)
{
	instance.getSelectedItems().forEach((item) => item.deselect({ emitEvents: false }));
	const tagSelector = instance.getTagSelector();
	if (tagSelector)
	{
		tagSelector.clearTextBox();
	}
}

async function runResponsibleRound(round, data, ctx)
{
	let selectorExports;
	try
	{
		selectorExports = await top.BX.Runtime.loadExtension('ui.entity-selector');
	}
	catch (err)
	{
		finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	if (round.finished)
	{
		return; // cancelled or replaced while loading - never show a stale popup
	}
	const Dialog = selectorExports && selectorExports.Dialog;
	if (!Dialog)
	{
		finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	const point = computeTargetPoint(data.anchor, ctx.containerId);
	if (!responsibleDialog || responsibleDialog.destroyed)
	{
		responsibleDialog = createResponsibleDialog(Dialog);
	}
	else
	{
		resetResponsibleDialog(responsibleDialog);
	}
	dialogOwnerRequestId = round.requestId;
	responsibleDialog.setTargetNode(point);
	// A loaded reused dialog never re-emits Dialog:onLoad - defuse the deadline
	// synchronously (spec 5.4; the same rule as the pick fix).
	if (typeof responsibleDialog.isLoaded === 'function' && responsibleDialog.isLoaded())
	{
		clearTimeout(round.deadlineTimer);
		round.phase = 'dialog';
	}
	responsibleDialog.show();
}

async function writeDeadline(round, deadlineTs)
{
	const serverTask = await preflightRead(round.taskId);
	if (!serverTask)
	{
		throw new Error('write preflight found no task');
	}
	const serverDeadline = serverTask.deadline == null ? null : Number(serverTask.deadline);
	if (serverDeadline === deadlineTs)
	{
		return; // the same date again would burn the reschedule journal (spec 4.4)
	}
	await BX.ajax.runAction('tasks.V2.Task.Deadline.update', {
		json: { task: { id: Number(round.taskId), deadlineTs } },
	});
}

function onDateSelect(round, calendar, timezone, event)
{
	if (round.finished || round.phase !== 'dialog')
	{
		return;
	}
	const { date } = event.getData();
	round.phase = 'write';
	clearTimeout(round.deadlineTimer);
	// Deferred teardown: the picker synchronously emits SELECT_CHANGE right
	// after SELECT, and destroy() ends with setPrototypeOf(this, null) - a
	// synchronous destroy inside the SELECT handler would throw (spec 5.4).
	const holder = round.pickerHolder;
	round.pickerHolder = null;
	top.setTimeout(() => destroyPickerNow(holder), 0);
	if (interactiveRound === round)
	{
		interactiveRound = null;
	}
	round.reply('taskEditApplying', {});
	// Two-step conversion of the full card (spec 5.4): the picker date is a
	// synthetic UTC date; the portal timezone offset is subtracted at the end.
	const dateTs = calendar.createDateFromUtc(date).getTime();
	const deadlineTs = (dateTs - timezone.getOffset(dateTs)) / 1000;
	runWritePhase(round, () => writeDeadline(round, deadlineTs));
}

async function runDeadlineRound(round, data, ctx)
{
	let exportsPicker;
	let exportsCalendar;
	let exportsTimezone;
	try
	{
		exportsPicker = await top.BX.Runtime.loadExtension('ui.date-picker');
		exportsCalendar = await top.BX.Runtime.loadExtension('tasks.v2.lib.calendar');
		exportsTimezone = await top.BX.Runtime.loadExtension('tasks.v2.lib.timezone');
	}
	catch (err)
	{
		finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	if (round.finished)
	{
		return; // cancelled or replaced while loading - never show a stale picker
	}
	const DatePicker = exportsPicker && exportsPicker.DatePicker;
	const DatePickerEvent = exportsPicker && exportsPicker.DatePickerEvent;
	const calendar = exportsCalendar && exportsCalendar.calendar;
	const timezone = exportsTimezone && exportsTimezone.timezone;
	// An empty export means the tasks module never shipped the extension config
	// (its config.php returns [] without the module) - spec §2.
	if (!DatePicker || !DatePickerEvent || !calendar || !timezone)
	{
		finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
		return;
	}
	const point = computeTargetPoint(data.anchor, ctx.containerId);
	const current = typeof data.current === 'number' ? data.current : null;
	const picker = new DatePicker({
		targetNode: point,
		// enableTime: false is mandatory: SELECT fires on EVERY value change
		// (day, hour, minute) - with time enabled the first SELECT would tear
		// the picker down mid-selection (spec 5.4).
		enableTime: false,
		defaultTime: calendar.dayEndTime,
		// The preset uses the full-card substitution formula (spec 5.4); the
		// picked day then keeps the preset time ("save previous time").
		selectedDates: current === null ? null : [(current * 1000) + timezone.getOffset(current * 1000)],
		hideOnSelect: false,
		cacheable: false,
		events: {
			[DatePickerEvent.SELECT]: (event) => {
				try
				{
					onDateSelect(round, calendar, timezone, event);
				}
				catch (err)
				{
					failRound(round, err);
				}
			},
		},
		popupOptions: {
			events: {
				onClose: () => {
					// Only a user close in preload/dialog is a cancel; the deferred
					// teardown after a SELECT closes the popup in 'write' (spec 5.4).
					if (round.finished || (round.phase !== 'preload' && round.phase !== 'dialog'))
					{
						return;
					}
					finishRound(round, () => round.reply('taskEditCancelled', {}));
				},
			},
		},
	});
	round.pickerHolder = { picker, destroyed: false };
	picker.show();
	if (!round.finished)
	{
		clearTimeout(round.deadlineTimer);
		round.phase = 'dialog';
	}
}

// async on purpose: a synchronous throw would escape the router's
// Promise.resolve(handler(...)) wrapper and never become taskEditError UNKNOWN.
export async function handleTaskEditRequest(data, ctx)
{
	if (data.field !== 'responsible' && data.field !== 'deadline')
	{
		// Unclassified board anomaly: the router catch turns this into UNKNOWN.
		throw new Error(`unknown task edit field: ${data.field}`);
	}
	const requestId = data.requestId;
	if (interactiveRound && !interactiveRound.finished)
	{
		// Round replacement: the old requestId gets exactly one taskEditCancelled
		// and its late popup never opens (finished flag / round token).
		const replaced = interactiveRound;
		finishRound(replaced, () => replaced.reply('taskEditCancelled', {}));
	}
	let resolveRound = null;
	let rejectRound = null;
	const promise = new Promise((resolve, reject) => {
		resolveRound = resolve;
		rejectRound = reject;
	});
	const round = {
		requestId,
		taskId: String(data.taskId),
		field: data.field,
		phase: 'preload',
		finished: false,
		deadlineTimer: null,
		current: data.current,
		pickerHolder: null,
		resolve: resolveRound,
		reject: rejectRound,
		reply: (event, payload) => ctx.reply(event, Object.assign({ requestId }, payload)),
	};
	interactiveRound = round;
	liveRounds.add(round);
	// The availability deadline (spec 4.2): from the request to the shown popup
	// (Dialog:onLoad for the responsible, picker show() for the deadline).
	round.deadlineTimer = setTimeout(() => {
		finishRound(round, () => round.reply('taskEditError', { code: 'TASKS_UNAVAILABLE' }));
	}, PRELOAD_DEADLINE_MS);
	const run = round.field === 'deadline' ? runDeadlineRound : runResponsibleRound;
	run(round, data, ctx).catch((err) => failRound(round, err));

	return promise;
}

export function handleTaskEditCancel(data)
{
	const round = interactiveRound;
	// Write-phase rounds are not interactive any more - a cancel arriving then
	// is ignored by construction: the write is not abortable (spec 4.2).
	if (!round || round.finished || String((data && data.requestId) || '') !== String(round.requestId))
	{
		return;
	}
	finishRound(round, null);
}

export function detachActions()
{
	// The interactive round first: its silent finish also tears its popup down.
	if (interactiveRound && !interactiveRound.finished)
	{
		finishRound(interactiveRound, null);
	}
	// Write-phase rounds: resolve silently, zero replies (spec 5.3).
	[...liveRounds].forEach((round) => finishRound(round, null));
	if (!responsibleDialog)
	{
		return;
	}
	const dying = responsibleDialog;
	responsibleDialog = null;
	dialogOwnerRequestId = null;
	if (dying.destroyed)
	{
		return;
	}
	dying.hide();
	// The popup lives in top and would outlive a closed SidePanel; destroy is
	// delayed past the non-cancelable ui debounces (stage-3 addendum).
	top.setTimeout(() => {
		if (!dying.destroyed)
		{
			dying.destroy();
		}
	}, DETACH_DESTROY_DELAY_MS);
}
