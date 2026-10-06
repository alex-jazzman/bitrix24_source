import { Loc } from 'main.core';

const CHUNK = 1000;
const READ_DEADLINE_MS = 10000;
const SELECT = ['id', 'title', 'deadline', 'responsible', 'creator', 'status'];

/**
 * Explicit engine codes for "not authorized" / "not allowed" and nothing else:
 * invalid_authentication (main/lib/Engine/ActionFilter/Authentication.php:15, HTTP 401 —
 * what the portal answers an anonymous caller), access_denied
 * (main/lib/Engine/ActionFilter/Access/AccessDeniedEventResult.php:14, #[ActionAccess]
 * precondition), insufficient_scope (rest/lib/engine/actionfilter/scope.php:15, REST path).
 * Numeric SystemException codes ("module is not installed") stay a read failure.
 */
const ACCESS_DENIED_CODES = ['invalid_authentication', 'access_denied', 'insufficient_scope'];

/**
 * BX.ajax.runAction rejects with the WHOLE server envelope
 * {status, data, errors: [{code, message, customData}]} (main core_ajax.js:1006-1012), and
 * with a synthetic envelope carrying errors[0].code === 'NETWORK_ERROR' when the response
 * is not a parsable envelope at all (core_ajax.js:1030-1047).
 * Conservative on purpose: access denial only on an explicit code from the list above,
 * anything doubtful stays a read failure (which leaves card state untouched).
 */
export function isAccessDeniedError(err)
{
	if (!err || typeof err !== 'object' || !Array.isArray(err.errors))
	{
		return false;
	}
	return err.errors.some(
		(item) => item
			&& typeof item.code === 'string'
			&& ACCESS_DENIED_CODES.includes(item.code),
	);
}

export function chunkIds(ids)
{
	const chunks = [];
	for (let i = 0; i < ids.length; i += CHUNK)
	{
		chunks.push(ids.slice(i, i + CHUNK));
	}
	return chunks;
}

// task: { deadline: number|null (Unix seconds), status: string, responsibleId: string }
export function computeIsExpired(task, nowSec, currentUserId)
{
	if (!task.deadline || task.deadline >= nowSec)
	{
		return false;
	}
	if (task.status === 'completed' || task.status === 'supposedly_completed')
	{
		return false;
	}
	if (task.status === 'declined' && String(task.responsibleId) === String(currentUserId))
	{
		return false;
	}
	return true;
}

// Exported since stage 4: the write-preflight of actions.js reads the confirmed
// current value with the very same call (spec 4.4).
export function listAction(payload, captureXhr)
{
	return BX.ajax.runAction('tasks.V2.Task.list', {
		json: payload,
		// Only supported way to read headers: AjaxResponse does not expose them
		// (spec 4.1, main/core/src/lib/types/ajax.ts:3-7).
		onrequeststart: captureXhr,
	});
}

export function withDeadline(promise, ms)
{
	let timer;
	const timeout = new Promise((_, reject) => {
		timer = setTimeout(() => reject({ code: 'TIMEOUT' }), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Logical read operation (spec 4.1): per chunk — a main call and a viewed=0
 * call; server "now" is the Date of the first chunk's successful main
 * response; isUnseen = candidate from viewed=0 AND "not created by me".
 * Any chunk error is a single error for the whole operation, without a
 * false missing.
 * throw: { code: 'TIMEOUT' | 'ACCESS_DENIED' | 'READ_FAILED' }.
 */
export async function readTasksInfo(taskIds)
{
	const currentUserId = String(Loc.getMessage('USER_ID'));
	const run = async () => {
		const chunks = chunkIds(taskIds);
		const tasksById = new Map();
		const unseenCandidates = new Set();
		let serverNowSec = null;

		for (const chunk of chunks)
		{
			let mainXhr = null;
			const idFilter = [{ field: 'id', operator: 'in', value: chunk }];
			const mainResponse = await listAction({
				select: SELECT,
				filter: idFilter,
				pagination: { limit: chunk.length },
			}, (xhr) => { mainXhr = xhr; });

			if (serverNowSec === null)
			{
				const dateHeader = mainXhr && mainXhr.getResponseHeader('Date');
				const parsed = dateHeader ? Date.parse(dateHeader) : NaN;
				if (Number.isNaN(parsed))
				{
					throw { code: 'READ_FAILED' }; // spec 4.1: missing Date header — read failure
				}
				serverNowSec = Math.floor(parsed / 1000);
			}

			(mainResponse.data.tasks || []).forEach((raw) => {
				tasksById.set(String(raw.id), raw);
			});

			const unseenResponse = await listAction({
				select: ['id'],
				filter: [...idFilter, { field: 'viewed', operator: '=', value: 0 }],
				pagination: { limit: chunk.length },
			}, () => {});
			(unseenResponse.data.tasks || []).forEach((raw) => {
				unseenCandidates.add(String(raw.id));
			});
		}

		const tasks = [];
		const missing = [];
		taskIds.forEach((id) => {
			const raw = tasksById.get(String(id));
			if (!raw)
			{
				missing.push(String(id)); // id only — AC-074
				return;
			}
			tasks.push(buildTaskInfo(raw, unseenCandidates, serverNowSec, currentUserId));
		});
		// rawById: the rights enrichment needs raw list rows (creator id) that the
		// protocol task objects deliberately do not carry (spec §6, AC-074).
		return { tasks, missing, rawById: tasksById };
	};

	try
	{
		return await withDeadline(run(), READ_DEADLINE_MS);
	}
	catch (err)
	{
		if (err && err.code === 'TIMEOUT')
		{
			throw { code: 'TIMEOUT' };
		}
		if (isAccessDeniedError(err))
		{
			throw { code: 'ACCESS_DENIED' };
		}
		throw { code: 'READ_FAILED' };
	}
}

export function buildTaskInfo(raw, unseenCandidates, nowSec, currentUserId)
{
	const id = String(raw.id);
	const responsibleId = raw.responsible ? String(raw.responsible.id) : '';
	const creatorId = raw.creator ? String(raw.creator.id) : '';
	return {
		id,
		title: String(raw.title || ''),
		deadline: raw.deadline == null ? null : Number(raw.deadline),
		responsible: raw.responsible
			? { id: responsibleId, name: String(raw.responsible.name || '') }
			: undefined,
		status: String(raw.status),
		// Portal NOT_VIEWED requires "not created by me" (taskquerybuilder.php:1506-1524).
		isUnseen: unseenCandidates.has(id) && creatorId !== String(currentUserId),
		isExpired: computeIsExpired(
			{ deadline: raw.deadline == null ? null : Number(raw.deadline), status: String(raw.status), responsibleId },
			nowSec,
			currentUserId,
		),
	};
}

// Board formulas are computed HOST-side (spec §6). rights is the alias->bool
// matrix of the V2 DTO (ActionDictionary). Status guards close the gap between
// a stale matrix and the live status the card shows.
export function computeCan(status, rights)
{
	return {
		responsible: rights.delegate === true || rights.changeResponsible === true,
		deadline: rights.deadline === true,
		start: status === 'pending' && rights.start === true,
		complete: status !== 'supposedly_completed' && status !== 'completed'
			&& rights.complete === true && rights.completeResult === true,
	};
}

// The creator and an editor (thus any portal admin) are exempt from the reason
// (DeadlinePolicy path). rights.admin is NOT a portal admin (it is true for
// TASK_ACCESS_MANAGE too) and must not be used here (spec §6).
export function computeRequireDeadlineChangeReason(dtoRequire, creatorId, currentUserId, rights)
{
	if (dtoRequire !== true)
	{
		return false;
	}

	return !(String(creatorId) === String(currentUserId) || rights.edit === true);
}

async function enrichWithRights(task, raw, startedAt)
{
	const remaining = READ_DEADLINE_MS - (Date.now() - startedAt);
	if (remaining <= 0)
	{
		return;
	}
	try
	{
		// view: false is mandatory: the default (true) marks the task as viewed
		// and would silently kill the "New" badge on hover (spec 4.1).
		const response = await withDeadline(BX.ajax.runAction('tasks.V2.Task.get', {
			json: { taskId: Number(task.id), taskSelect: { parameters: true }, view: false },
		}), remaining);
		const dto = (response && response.data) || {};
		const rights = dto.rights || {};
		task.can = computeCan(task.status, rights);
		task.requireDeadlineChangeReason = computeRequireDeadlineChangeReason(
			dto.requireDeadlineChangeReason,
			raw && raw.creator ? raw.creator.id : '',
			Loc.getMessage('USER_ID'),
			rights,
		);
	}
	catch (err)
	{
		// Rights are a progressive enhancement (spec 4.1): any enrichment failure
		// or timeout ships the ordinary response without can.
	}
}

export async function handleTaskInfoRequest(data, ctx)
{
	const requestId = data.requestId;
	const taskIds = (data.taskIds || []).map(String);
	const startedAt = Date.now();
	// Anti-N+1 (spec 4.1): rights are fetched only for a single-id request.
	const withRights = data.withRights === true && taskIds.length === 1;
	try
	{
		const { tasks, missing, rawById } = await readTasksInfo(taskIds);
		if (withRights && tasks.length === 1)
		{
			await enrichWithRights(tasks[0], rawById.get(tasks[0].id), startedAt);
		}
		ctx.reply('taskInfoResponse', { requestId, tasks, missing });
	}
	catch (err)
	{
		if (err && err.code === 'ACCESS_DENIED')
		{
			// A viewer with no rights on tasks (anonymous, no access to the action or the
			// module) must see exactly what a rightless portal user sees — the title-only
			// card. So an access denial is answered with an ORDINARY response listing every
			// requested id as missing, not with a read error (that would leave the cards on
			// their full snapshot forever).
			ctx.reply('taskInfoResponse', { requestId, tasks: [], missing: taskIds });
			return;
		}
		ctx.reply('taskInfoError', { requestId, code: (err && err.code) || 'READ_FAILED' });
	}
}
