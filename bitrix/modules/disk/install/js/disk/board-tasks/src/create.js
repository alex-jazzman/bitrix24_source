import { readTasksInfo } from './info';

const PRELOAD_DEADLINE_MS = 30000;
// Bounded late watch (MR review): after a cancelled round the created-after-
// cancel race (AC-071) is still possible while a Task.add is in flight, but
// not forever - the window comfortably covers a hung request.
const LATE_CREATE_WATCH_MS = 600000;

// The timer is cleared on ANY race outcome - a losing deadline must not
// keep running for 30 seconds (spec stage 3, 4.2).
function preloadDeadline(ms)
{
	let timer = null;
	const promise = new Promise((_, reject) => {
		timer = setTimeout(() => reject(new Error('preload deadline')), ms);
	});

	return { promise, cancel: () => clearTimeout(timer) };
}

/**
 * The loader runtime can hang instead of rejecting, and with the tasks module
 * disabled it resolves to an empty extension (spec 5.1) - hence race + export checks.
 * Always load via top.BX.Runtime: the form runs in top, a local cache would
 * populate the wrong window (task-card.js:66).
 */
async function preloadTaskForm()
{
	const load = (name) => top.BX.Runtime.loadExtension(name);
	const guarded = (async () => {
		const cardExports = await load('tasks.v2.application.task-card');
		if (!cardExports || !cardExports.TaskCard || typeof cardExports.TaskCard.showCompactCard !== 'function')
		{
			throw new Error('no TaskCard export');
		}
		const compactExports = await load('tasks.v2.application.task-compact-card');
		if (!compactExports || !compactExports.TaskCompactCard)
		{
			throw new Error('no TaskCompactCard export');
		}
		const fullExports = await load('tasks.v2.application.task-full-card');
		if (!fullExports || !fullExports.TaskFullCard)
		{
			throw new Error('no TaskFullCard export');
		}
		return cardExports.TaskCard;
	})();
	const deadline = preloadDeadline(PRELOAD_DEADLINE_MS);
	try
	{
		return await Promise.race([guarded, deadline.promise]);
	}
	finally
	{
		deadline.cancel();
	}
}

export async function handleTaskCreateRequest(data, ctx)
{
	const requestId = data.requestId;
	const tmpTaskId = `tmp.board.${requestId}`;
	let finished = false;
	// The compact form auto-closes right after creation; tasks:card:closed for our
	// tmpTaskId can arrive before the async onTaskAdded finishes reading the created
	// task. A close seen after taskAdded is normal teardown, not a cancellation.
	let taskAddedSeen = false;
	let taskAddedSubscribed = false;
	let lateWatchTimer = null;
	let roundDetach = null;
	const cleanups = [];
	const finish = (event, payload) => {
		if (finished)
		{
			return;
		}
		finished = true;
		cleanups.forEach((fn) => fn());
		if (roundDetach)
		{
			const detachIndex = ctx.state.detachFns.indexOf(roundDetach);
			if (detachIndex !== -1)
			{
				ctx.state.detachFns.splice(detachIndex, 1);
			}
		}
		// A round that never saw its own taskAdded (cancel, error) keeps the
		// watch for the late-create notification (AC-071) - but bounded, not
		// until the page is left (MR review).
		if (taskAddedSubscribed && !taskAddedSeen)
		{
			lateWatchTimer = setTimeout(stopTaskAddedWatch, LATE_CREATE_WATCH_MS);
		}
		ctx.reply(event, Object.assign({ requestId }, payload));
	};

	let TaskCard;
	try
	{
		TaskCard = await preloadTaskForm();
	}
	catch (err)
	{
		// Setting finished also nulls out a late race resolution (spec 5.1).
		finish('taskCreateError', { code: 'TASKS_UNAVAILABLE' });
		return;
	}
	if (finished || ctx.state.attached === false)
	{
		// finished - a raced terminal; attached === false - the board page left
		// while the preload was in flight (MR review): opening the form now
		// would pop it in the top window with no board behind it.
		return;
	}

	const emitter = top.BX.Event.EventEmitter;
	const subscribe = (eventName, handler) => {
		emitter.subscribe(eventName, handler);
		cleanups.push(() => emitter.unsubscribe(eventName, handler));
	};

	// Page detach tears the whole round down (MR review): the top-window
	// subscriptions of an open form must not outlive the board page. The form
	// itself is deliberately left open - creating the task remains a valid
	// portal action without the board behind it; the round just stops watching,
	// so no reply and no late notification follow.
	roundDetach = () => {
		if (finished)
		{
			return;
		}
		finished = true;
		cleanups.forEach((fn) => fn());
	};
	ctx.state.detachFns.push(roundDetach);

	// Race "closed/cancelled while creating": the cancellation already went out, but the
	// user must still learn the created task's number (AC-071, spec 5.1).
	const notifyCreatedAfterCancel = (createdId) => {
		// Fall back to the local BX if top's Notification Center isn't loaded there yet.
		const center = (top.BX && top.BX.UI && top.BX.UI.Notification && top.BX.UI.Notification.Center) || BX.UI.Notification.Center;
		center.notify({
			content: BX.Loc.getMessage('DISK_BOARD_TASKS_CREATED_AFTER_CANCEL')
				.replace('#ID#', createdId),
		});
	};

	// Success path: normalize via the singleton read (4.1) - the event carries the
	// form's internal model, which must not be forwarded as-is (spec 5.1).
	const onTaskAdded = async (event) => {
		const eventData = event.getData() || {};
		const initialTask = eventData.initialTask || {};
		if (String(initialTask.id) !== tmpTaskId)
		{
			return;
		}
		// Own event observed - this handler's job is done whatever the outcome
		// below: the whole watch stops, including its late-window timer and its
		// page-detach registry entry (MR review).
		stopTaskAddedWatch();
		const createdId = String((eventData.task && eventData.task.id) || '');
		if (!createdId)
		{
			return;
		}
		// Set before any await: races onClosed/onSliderClose against the auto-close
		// that follows a successful create.
		taskAddedSeen = true;
		if (finished)
		{
			notifyCreatedAfterCancel(createdId);
			return;
		}
		try
		{
			const { tasks } = await readTasksInfo([createdId]);
			// The wait above is a race window: a cancellation could have arrived while
			// readTasksInfo was in flight. finish() would then silently no-op, so the
			// task's number would never reach the user - notify instead (AC-071).
			if (finished)
			{
				notifyCreatedAfterCancel(createdId);
				return;
			}
			if (!tasks.length)
			{
				finish('taskCreateError', { code: 'TASK_CREATED_READ_FAILED', taskId: createdId });
				return;
			}
			finish('taskCreateResponse', { task: tasks[0] });
		}
		catch (err)
		{
			if (finished)
			{
				notifyCreatedAfterCancel(createdId);
				return;
			}
			finish('taskCreateError', { code: 'TASK_CREATED_READ_FAILED', taskId: createdId });
		}
	};
	const stopTaskAddedWatch = () => {
		if (lateWatchTimer !== null)
		{
			clearTimeout(lateWatchTimer);
			lateWatchTimer = null;
		}
		emitter.unsubscribe('tasks:card:taskAdded', onTaskAdded);
		const index = ctx.state.detachFns.indexOf(taskAddedDetach);
		if (index !== -1)
		{
			ctx.state.detachFns.splice(index, 1);
		}
	};
	const taskAddedDetach = () => stopTaskAddedWatch();
	// NOT in cleanups: the subscription survives a cancellation - for the
	// bounded late-create window (AC-071, MR review), until its own taskAdded
	// arrives, or until the page detach - whichever comes first (spec 5.1).
	emitter.subscribe('tasks:card:taskAdded', onTaskAdded);
	taskAddedSubscribed = true;
	ctx.state.detachFns.push(taskAddedDetach);

	// tasks:card:closed / tasks:full-card:closed carry the closed form's params
	// directly, not wrapped in an array (task-compact-card.js:113, task-full-card.js:253).
	const onClosed = (event) => {
		const closedFor = event.getData() || {};
		if (String(closedFor.taskId || '') !== tmpTaskId)
		{
			return;
		}
		if (taskAddedSeen)
		{
			// Closed after creation succeeded - onTaskAdded finishes the request, not us.
			return;
		}
		finish('taskCreateCancelled', {});
	};
	subscribe('tasks:card:closed', onClosed);
	subscribe('tasks:full-card:closed', onClosed);

	// Slider watch: closing the full form before its app loads emits no card events
	// at all (task-card.js:156-165) - identify our slider by its URL.
	// Exact id match (MR review): indexOf('id=tmp.board.1') also matched
	// 'id=tmp.board.10' and made a round adopt a parallel round's slider.
	const sliderCarriesTmpId = (url) => {
		const match = /[?&]id=([^&#]+)/.exec(url);
		if (!match)
		{
			return false;
		}
		let value = match[1];
		try
		{
			value = decodeURIComponent(value);
		}
		catch (err)
		{
			// a malformed percent-encoding cannot be ours
		}
		return value === tmpTaskId;
	};
	let watchedSlider = null;
	const onSliderOpen = (event) => {
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider && sliderEvent.getSlider();
		const url = (slider && slider.getUrl && slider.getUrl()) || '';
		if (sliderCarriesTmpId(url))
		{
			watchedSlider = slider;
		}
	};
	const onSliderClose = (event) => {
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider && sliderEvent.getSlider();
		if (watchedSlider && slider === watchedSlider)
		{
			if (taskAddedSeen)
			{
				// Closed after creation succeeded - onTaskAdded finishes the request, not us.
				return;
			}
			finish('taskCreateCancelled', {});
		}
	};
	subscribe('SidePanel.Slider:onOpen', onSliderOpen);
	subscribe('SidePanel.Slider:onCloseComplete', onSliderClose);

	// Form: a non-integer taskId means create mode; description is the element link
	// (decodeURIComponent exactly once, spec §4, as in template.php:231).
	TaskCard.showCompactCard({
		taskId: tmpTaskId,
		title: '',
		description: data.elementLink ? decodeURIComponent(data.elementLink) : '',
	});
}
