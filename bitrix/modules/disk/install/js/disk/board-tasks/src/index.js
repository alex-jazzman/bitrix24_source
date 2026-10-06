import { handleTaskInfoRequest } from './info';
import { handleTaskCreateRequest } from './create';
import {
	detachActions,
	handleTaskActionRequest,
	handleTaskEditCancel,
	handleTaskEditRequest,
} from './actions';
import { handleTaskPickRequest, handleTaskPickCancel, detachPick } from './pick';
import { attachOpenAndPull, handleTaskOpenRequest } from './open-and-pull';
import { createChannel } from './channel';

const HANDLERS = {
	taskInfoRequest: handleTaskInfoRequest,
	taskCreateRequest: handleTaskCreateRequest,
	taskOpenRequest: handleTaskOpenRequest,
	// Both pick handlers live in the map: an unregistered taskPickCancel would
	// be dropped as an unknown one-way message and never close the dialog.
	taskPickRequest: handleTaskPickRequest,
	taskPickCancel: handleTaskPickCancel,
	taskActionRequest: handleTaskActionRequest,
	// Both edit handlers live in the map: an unregistered taskEditCancel would
	// be dropped as an unknown one-way message and never close the popup.
	taskEditRequest: handleTaskEditRequest,
	taskEditCancel: handleTaskEditCancel,
	taskListChanged: (data, ctx) => {
		ctx.state.knownTaskIds = new Set((data.taskIds || []).map(String));
	},
};

// Spec 4.2: the reply name is derived from the request name, but only for
// correlatable requests - 'Request' suffix AND a non-empty requestId. One-way
// messages (taskOpenRequest carries no requestId, taskPickCancel has no
// 'Request' suffix) never get an answer in any branch.
const deriveErrorEvent = (eventName, data) => {
	const name = String(eventName);
	if (!name.endsWith('Request') || !data || !data.requestId)
	{
		return null;
	}

	return `${name.slice(0, -'Request'.length)}Error`;
};

export function attach({ containerId, appOrigin })
{
	const channel = createChannel({ containerId, appOrigin });
	const state = {
		knownTaskIds: new Set(),
		detachFns: [],
		attached: true,
	};
	const ctx = {
		state,
		containerId,
		reply: (event, data) => channel.post({ event, data }),
	};

	const onMessage = (event) => {
		// Spec 4.3: untrusted is dropped before parsing type/requestId, no reply.
		if (!channel.isTrusted(event))
		{
			return;
		}
		const { event: eventName, data } = event.data || {};
		if (!eventName || !String(eventName).startsWith('task'))
		{
			return; // not ours — leave it alone (waitSDKParams etc. live in the template)
		}
		const handler = HANDLERS[eventName];
		if (!handler)
		{
			const replyEvent = deriveErrorEvent(eventName, data);
			if (replyEvent)
			{
				ctx.reply(replyEvent, { requestId: data.requestId, code: 'NOT_SUPPORTED' });
			}
			return;
		}
		Promise.resolve(handler(data || {}, ctx)).catch((err) => {
			console.error('board-tasks handler failed', eventName, err);
			// Spec §4: UNKNOWN — unexpected error the handler did not classify itself.
			const replyEvent = deriveErrorEvent(eventName, data);
			if (replyEvent)
			{
				ctx.reply(replyEvent, { requestId: data.requestId, code: 'UNKNOWN' });
			}
		});
	};

	window.addEventListener('message', onMessage);
	state.detachFns.push(() => window.removeEventListener('message', onMessage));
	state.detachFns.push(attachOpenAndPull(ctx));
	// Non-bfcache pagehide only (template.php keeps the persisted pages alive).
	state.detachFns.push(detachPick);
	state.detachFns.push(detachActions);

	// detach is idempotent (spec 4.3).
	return () => {
		if (!state.attached)
		{
			return;
		}
		state.attached = false;
		// A copy: entries may splice themselves out of the registry when run -
		// the registry is no longer append-only (MR review).
		[...state.detachFns].forEach((fn) => fn());
		state.detachFns = [];
	};
}
