// Per-taskId watch registry (module-level, spans handler calls): a repeat open
// request for the same task replaces the previous watch instead of stacking a
// second onOpen/onClose pair (spec 5.4: exactly one taskChanged per close).
const activeWatches = new Map();

// The full-card slider lives in the top window (spec 5.3): opened from inside
// a frame it would only occupy the frame's area.
export async function handleTaskOpenRequest(data, ctx)
{
	const taskId = String(data.taskId || '');
	if (!taskId)
	{
		return;
	}
	const exports = await top.BX.Runtime.loadExtension('tasks.v2.application.task-card');
	// attached === false: the board page left while the extension was loading
	// (MR review) - opening the full card now would pop a slider in the top
	// window that no board lifecycle manages any more.
	if (ctx.state.attached === false || !exports || !exports.TaskCard)
	{
		return;
	}

	const prevDetach = activeWatches.get(taskId);
	if (prevDetach)
	{
		prevDetach();
	}

	const emitter = top.BX.Event.EventEmitter;
	// Bounded match: `TASK_ID=5` must not match inside `TASK_ID=55`. The path
	// form already has a boundary on both sides (leading `/task/view/`, trailing
	// `/`); the query form needs an explicit one, since indexOf(`TASK_ID=5`) also
	// matches `TASK_ID=55`.
	const escapedTaskId = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const taskIdQueryBoundary = new RegExp(`[?&]TASK_ID=${escapedTaskId}(&|$)`);
	let watchedSlider = null;
	const onOpen = (event) => {
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider && sliderEvent.getSlider();
		const url = (slider && slider.getUrl && slider.getUrl()) || '';
		if (url.indexOf(`/task/view/${taskId}/`) !== -1 || taskIdQueryBoundary.test(url))
		{
			watchedSlider = slider;
			emitter.unsubscribe('SidePanel.Slider:onOpen', onOpen);
		}
	};
	// Unsubscribes both listeners and drops this watch's own registry entry;
	// the identity check guards a stale call (e.g. full extension detach) from
	// removing a newer watch that has since replaced this one for the same taskId.
	const detach = () => {
		emitter.unsubscribe('SidePanel.Slider:onOpen', onOpen);
		emitter.unsubscribe('SidePanel.Slider:onCloseComplete', onClose);
		watchedSlider = null; // MR review: do not retain the closed slider
		if (activeWatches.get(taskId) === detach)
		{
			activeWatches.delete(taskId);
		}
		// MR review: an executed watch must not stay in the page-detach registry -
		// repeated card opens on a long-lived board accumulated one closure each.
		const index = ctx.state.detachFns.indexOf(detach);
		if (index !== -1)
		{
			ctx.state.detachFns.splice(index, 1);
		}
	};
	const onClose = (event) => {
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider && sliderEvent.getSlider();
		if (!watchedSlider || slider !== watchedSlider)
		{
			return;
		}
		detach();
		// Exactly one taskChanged per close of our own slider (spec 5.4): opening
		// the card changes its unseen state, so the card must re-read it.
		ctx.reply('taskChanged', { taskId });
	};
	emitter.subscribe('SidePanel.Slider:onOpen', onOpen);
	emitter.subscribe('SidePanel.Slider:onCloseComplete', onClose);
	activeWatches.set(taskId, detach);
	ctx.state.detachFns.push(detach);

	exports.TaskCard.showFullCard({ taskId: Number(taskId) });
}

/**
 * Pull bridge (spec 5.4): regular task events -> taskChanged for cards that
 * belong to this board. Only the id travels on - the board re-reads the task
 * itself, on behalf of the current viewer.
 */
export function attachOpenAndPull(ctx)
{
	const commands = ['task_update', 'task_remove', 'task_view'];
	const callback = (params) => {
		// Server senders (SendPush.php, PushHandler.php, TaskViewed.php) and every
		// other tasks subscriber (entity-selector.js:92) key the id as TASK_ID.
		const taskId = String((params && params.TASK_ID) || '');
		if (!taskId || !ctx.state.knownTaskIds.has(taskId))
		{
			return;
		}
		ctx.reply('taskChanged', { taskId });
	};
	// PullClient#subscribe always returns its own unsubscribe closure for
	// module+command subscriptions (pull.client emitter.js); there is no
	// BX.PULL.unsubscribe method to fall back to.
	const detachFns = commands.map((command) => BX.PULL.subscribe({
		type: BX.PullClient.SubscriptionType.Server,
		moduleId: 'tasks',
		command,
		callback,
	}));
	return () => {
		detachFns.forEach((detach) => detach());
	};
}
