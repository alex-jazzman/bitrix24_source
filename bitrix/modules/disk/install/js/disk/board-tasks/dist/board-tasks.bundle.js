/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core) {
	'use strict';

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
	function isAccessDeniedError(err) {
		if (!err || typeof err !== 'object' || !Array.isArray(err.errors)) {
			return false;
		}
		return err.errors.some(item => item && typeof item.code === 'string' && ACCESS_DENIED_CODES.includes(item.code));
	}
	function chunkIds(ids) {
		const chunks = [];
		for (let i = 0; i < ids.length; i += CHUNK) {
			chunks.push(ids.slice(i, i + CHUNK));
		}
		return chunks;
	}

	// task: { deadline: number|null (Unix seconds), status: string, responsibleId: string }
	function computeIsExpired(task, nowSec, currentUserId) {
		if (!task.deadline || task.deadline >= nowSec) {
			return false;
		}
		if (task.status === 'completed' || task.status === 'supposedly_completed') {
			return false;
		}
		if (task.status === 'declined' && String(task.responsibleId) === String(currentUserId)) {
			return false;
		}
		return true;
	}

	// Exported since stage 4: the write-preflight of actions.js reads the confirmed
	// current value with the very same call (spec 4.4).
	function listAction(payload, captureXhr) {
		return BX.ajax.runAction('tasks.V2.Task.list', {
			json: payload,
			// Only supported way to read headers: AjaxResponse does not expose them
			// (spec 4.1, main/core/src/lib/types/ajax.ts:3-7).
			onrequeststart: captureXhr
		});
	}
	function withDeadline(promise, ms) {
		let timer;
		const timeout = new Promise((_, reject) => {
			timer = setTimeout(() => reject({
				code: 'TIMEOUT'
			}), ms);
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
	async function readTasksInfo(taskIds) {
		const currentUserId = String(main_core.Loc.getMessage('USER_ID'));
		const run = async () => {
			const chunks = chunkIds(taskIds);
			const tasksById = new Map();
			const unseenCandidates = new Set();
			let serverNowSec = null;
			for (const chunk of chunks) {
				let mainXhr = null;
				const idFilter = [{
					field: 'id',
					operator: 'in',
					value: chunk
				}];
				const mainResponse = await listAction({
					select: SELECT,
					filter: idFilter,
					pagination: {
						limit: chunk.length
					}
				}, xhr => {
					mainXhr = xhr;
				});
				if (serverNowSec === null) {
					const dateHeader = mainXhr && mainXhr.getResponseHeader('Date');
					const parsed = dateHeader ? Date.parse(dateHeader) : NaN;
					if (Number.isNaN(parsed)) {
						throw {
							code: 'READ_FAILED'
						}; // spec 4.1: missing Date header — read failure
					}
					serverNowSec = Math.floor(parsed / 1000);
				}
				(mainResponse.data.tasks || []).forEach(raw => {
					tasksById.set(String(raw.id), raw);
				});
				const unseenResponse = await listAction({
					select: ['id'],
					filter: [...idFilter, {
						field: 'viewed',
						operator: '=',
						value: 0
					}],
					pagination: {
						limit: chunk.length
					}
				}, () => {});
				(unseenResponse.data.tasks || []).forEach(raw => {
					unseenCandidates.add(String(raw.id));
				});
			}
			const tasks = [];
			const missing = [];
			taskIds.forEach(id => {
				const raw = tasksById.get(String(id));
				if (!raw) {
					missing.push(String(id)); // id only — AC-074
					return;
				}
				tasks.push(buildTaskInfo(raw, unseenCandidates, serverNowSec, currentUserId));
			});
			// rawById: the rights enrichment needs raw list rows (creator id) that the
			// protocol task objects deliberately do not carry (spec §6, AC-074).
			return {
				tasks,
				missing,
				rawById: tasksById
			};
		};
		try {
			return await withDeadline(run(), READ_DEADLINE_MS);
		} catch (err) {
			if (err && err.code === 'TIMEOUT') {
				throw {
					code: 'TIMEOUT'
				};
			}
			if (isAccessDeniedError(err)) {
				throw {
					code: 'ACCESS_DENIED'
				};
			}
			throw {
				code: 'READ_FAILED'
			};
		}
	}
	function buildTaskInfo(raw, unseenCandidates, nowSec, currentUserId) {
		const id = String(raw.id);
		const responsibleId = raw.responsible ? String(raw.responsible.id) : '';
		const creatorId = raw.creator ? String(raw.creator.id) : '';
		return {
			id,
			title: String(raw.title || ''),
			deadline: raw.deadline == null ? null : Number(raw.deadline),
			responsible: raw.responsible ? {
				id: responsibleId,
				name: String(raw.responsible.name || '')
			} : undefined,
			status: String(raw.status),
			// Portal NOT_VIEWED requires "not created by me" (taskquerybuilder.php:1506-1524).
			isUnseen: unseenCandidates.has(id) && creatorId !== String(currentUserId),
			isExpired: computeIsExpired({
				deadline: raw.deadline == null ? null : Number(raw.deadline),
				status: String(raw.status),
				responsibleId
			}, nowSec, currentUserId)
		};
	}

	// Board formulas are computed HOST-side (spec §6). rights is the alias->bool
	// matrix of the V2 DTO (ActionDictionary). Status guards close the gap between
	// a stale matrix and the live status the card shows.
	function computeCan(status, rights) {
		return {
			responsible: rights.delegate === true || rights.changeResponsible === true,
			deadline: rights.deadline === true,
			start: status === 'pending' && rights.start === true,
			complete: status !== 'supposedly_completed' && status !== 'completed' && rights.complete === true && rights.completeResult === true
		};
	}

	// The creator and an editor (thus any portal admin) are exempt from the reason
	// (DeadlinePolicy path). rights.admin is NOT a portal admin (it is true for
	// TASK_ACCESS_MANAGE too) and must not be used here (spec §6).
	function computeRequireDeadlineChangeReason(dtoRequire, creatorId, currentUserId, rights) {
		if (dtoRequire !== true) {
			return false;
		}
		return !(String(creatorId) === String(currentUserId) || rights.edit === true);
	}
	async function enrichWithRights(task, raw, startedAt) {
		const remaining = READ_DEADLINE_MS - (Date.now() - startedAt);
		if (remaining <= 0) {
			return;
		}
		try {
			// view: false is mandatory: the default (true) marks the task as viewed
			// and would silently kill the "New" badge on hover (spec 4.1).
			const response = await withDeadline(BX.ajax.runAction('tasks.V2.Task.get', {
				json: {
					taskId: Number(task.id),
					taskSelect: {
						parameters: true
					},
					view: false
				}
			}), remaining);
			const dto = response && response.data || {};
			const rights = dto.rights || {};
			task.can = computeCan(task.status, rights);
			task.requireDeadlineChangeReason = computeRequireDeadlineChangeReason(dto.requireDeadlineChangeReason, raw && raw.creator ? raw.creator.id : '', main_core.Loc.getMessage('USER_ID'), rights);
		} catch (err) {
			// Rights are a progressive enhancement (spec 4.1): any enrichment failure
			// or timeout ships the ordinary response without can.
		}
	}
	async function handleTaskInfoRequest(data, ctx) {
		const requestId = data.requestId;
		const taskIds = (data.taskIds || []).map(String);
		const startedAt = Date.now();
		// Anti-N+1 (spec 4.1): rights are fetched only for a single-id request.
		const withRights = data.withRights === true && taskIds.length === 1;
		try {
			const {
				tasks,
				missing,
				rawById
			} = await readTasksInfo(taskIds);
			if (withRights && tasks.length === 1) {
				await enrichWithRights(tasks[0], rawById.get(tasks[0].id), startedAt);
			}
			ctx.reply('taskInfoResponse', {
				requestId,
				tasks,
				missing
			});
		} catch (err) {
			if (err && err.code === 'ACCESS_DENIED') {
				// A viewer with no rights on tasks (anonymous, no access to the action or the
				// module) must see exactly what a rightless portal user sees — the title-only
				// card. So an access denial is answered with an ORDINARY response listing every
				// requested id as missing, not with a read error (that would leave the cards on
				// their full snapshot forever).
				ctx.reply('taskInfoResponse', {
					requestId,
					tasks: [],
					missing: taskIds
				});
				return;
			}
			ctx.reply('taskInfoError', {
				requestId,
				code: err && err.code || 'READ_FAILED'
			});
		}
	}

	const PRELOAD_DEADLINE_MS$1 = 30000;
	// Bounded late watch (MR review): after a cancelled round the created-after-
	// cancel race (AC-071) is still possible while a Task.add is in flight, but
	// not forever - the window comfortably covers a hung request.
	const LATE_CREATE_WATCH_MS = 600000;

	// The timer is cleared on ANY race outcome - a losing deadline must not
	// keep running for 30 seconds (spec stage 3, 4.2).
	function preloadDeadline(ms) {
		let timer = null;
		const promise = new Promise((_, reject) => {
			timer = setTimeout(() => reject(new Error('preload deadline')), ms);
		});
		return {
			promise,
			cancel: () => clearTimeout(timer)
		};
	}

	/**
	 * The loader runtime can hang instead of rejecting, and with the tasks module
	 * disabled it resolves to an empty extension (spec 5.1) - hence race + export checks.
	 * Always load via top.BX.Runtime: the form runs in top, a local cache would
	 * populate the wrong window (task-card.js:66).
	 */
	async function preloadTaskForm() {
		const load = name => top.BX.Runtime.loadExtension(name);
		const guarded = (async () => {
			const cardExports = await load('tasks.v2.application.task-card');
			if (!cardExports || !cardExports.TaskCard || typeof cardExports.TaskCard.showCompactCard !== 'function') {
				throw new Error('no TaskCard export');
			}
			const compactExports = await load('tasks.v2.application.task-compact-card');
			if (!compactExports || !compactExports.TaskCompactCard) {
				throw new Error('no TaskCompactCard export');
			}
			const fullExports = await load('tasks.v2.application.task-full-card');
			if (!fullExports || !fullExports.TaskFullCard) {
				throw new Error('no TaskFullCard export');
			}
			return cardExports.TaskCard;
		})();
		const deadline = preloadDeadline(PRELOAD_DEADLINE_MS$1);
		try {
			return await Promise.race([guarded, deadline.promise]);
		} finally {
			deadline.cancel();
		}
	}
	async function handleTaskCreateRequest(data, ctx) {
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
			if (finished) {
				return;
			}
			finished = true;
			cleanups.forEach(fn => fn());
			if (roundDetach) {
				const detachIndex = ctx.state.detachFns.indexOf(roundDetach);
				if (detachIndex !== -1) {
					ctx.state.detachFns.splice(detachIndex, 1);
				}
			}
			// A round that never saw its own taskAdded (cancel, error) keeps the
			// watch for the late-create notification (AC-071) - but bounded, not
			// until the page is left (MR review).
			if (taskAddedSubscribed && !taskAddedSeen) {
				lateWatchTimer = setTimeout(stopTaskAddedWatch, LATE_CREATE_WATCH_MS);
			}
			ctx.reply(event, Object.assign({
				requestId
			}, payload));
		};
		let TaskCard;
		try {
			TaskCard = await preloadTaskForm();
		} catch (err) {
			// Setting finished also nulls out a late race resolution (spec 5.1).
			finish('taskCreateError', {
				code: 'TASKS_UNAVAILABLE'
			});
			return;
		}
		if (finished || ctx.state.attached === false) {
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
			if (finished) {
				return;
			}
			finished = true;
			cleanups.forEach(fn => fn());
		};
		ctx.state.detachFns.push(roundDetach);

		// Race "closed/cancelled while creating": the cancellation already went out, but the
		// user must still learn the created task's number (AC-071, spec 5.1).
		const notifyCreatedAfterCancel = createdId => {
			// Fall back to the local BX if top's Notification Center isn't loaded there yet.
			const center = top.BX && top.BX.UI && top.BX.UI.Notification && top.BX.UI.Notification.Center || BX.UI.Notification.Center;
			center.notify({
				content: BX.Loc.getMessage('DISK_BOARD_TASKS_CREATED_AFTER_CANCEL').replace('#ID#', createdId)
			});
		};

		// Success path: normalize via the singleton read (4.1) - the event carries the
		// form's internal model, which must not be forwarded as-is (spec 5.1).
		const onTaskAdded = async event => {
			const eventData = event.getData() || {};
			const initialTask = eventData.initialTask || {};
			if (String(initialTask.id) !== tmpTaskId) {
				return;
			}
			// Own event observed - this handler's job is done whatever the outcome
			// below: the whole watch stops, including its late-window timer and its
			// page-detach registry entry (MR review).
			stopTaskAddedWatch();
			const createdId = String(eventData.task && eventData.task.id || '');
			if (!createdId) {
				return;
			}
			// Set before any await: races onClosed/onSliderClose against the auto-close
			// that follows a successful create.
			taskAddedSeen = true;
			if (finished) {
				notifyCreatedAfterCancel(createdId);
				return;
			}
			try {
				const {
					tasks
				} = await readTasksInfo([createdId]);
				// The wait above is a race window: a cancellation could have arrived while
				// readTasksInfo was in flight. finish() would then silently no-op, so the
				// task's number would never reach the user - notify instead (AC-071).
				if (finished) {
					notifyCreatedAfterCancel(createdId);
					return;
				}
				if (!tasks.length) {
					finish('taskCreateError', {
						code: 'TASK_CREATED_READ_FAILED',
						taskId: createdId
					});
					return;
				}
				finish('taskCreateResponse', {
					task: tasks[0]
				});
			} catch (err) {
				if (finished) {
					notifyCreatedAfterCancel(createdId);
					return;
				}
				finish('taskCreateError', {
					code: 'TASK_CREATED_READ_FAILED',
					taskId: createdId
				});
			}
		};
		const stopTaskAddedWatch = () => {
			if (lateWatchTimer !== null) {
				clearTimeout(lateWatchTimer);
				lateWatchTimer = null;
			}
			emitter.unsubscribe('tasks:card:taskAdded', onTaskAdded);
			const index = ctx.state.detachFns.indexOf(taskAddedDetach);
			if (index !== -1) {
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
		const onClosed = event => {
			const closedFor = event.getData() || {};
			if (String(closedFor.taskId || '') !== tmpTaskId) {
				return;
			}
			if (taskAddedSeen) {
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
		const sliderCarriesTmpId = url => {
			const match = /[?&]id=([^&#]+)/.exec(url);
			if (!match) {
				return false;
			}
			let value = match[1];
			try {
				value = decodeURIComponent(value);
			} catch (err) {
				// a malformed percent-encoding cannot be ours
			}
			return value === tmpTaskId;
		};
		let watchedSlider = null;
		const onSliderOpen = event => {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider && sliderEvent.getSlider();
			const url = slider && slider.getUrl && slider.getUrl() || '';
			if (sliderCarriesTmpId(url)) {
				watchedSlider = slider;
			}
		};
		const onSliderClose = event => {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider && sliderEvent.getSlider();
			if (watchedSlider && slider === watchedSlider) {
				if (taskAddedSeen) {
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
			description: data.elementLink ? decodeURIComponent(data.elementLink) : ''
		});
	}

	const AVAILABILITY_DEADLINE_MS = 30000;
	const DETACH_DESTROY_DELAY_MS$1 = 3000;

	// ONE dialog reused across rounds (spec addendum 2026-08-20): rounds end with
	// hide(), never destroy() - late async paths of ui.entity-selector (initial
	// load .catch, both non-cancelable debounces, queryXhr) then land on a living
	// instance, which is the stock mode of that extension. The only destroy()
	// happens on detach, where the popup would otherwise outlive its SidePanel.
	let dialog = null;
	let activeRound = null;
	function hideDialog() {
		if (dialog && !dialog.destroyed) {
			dialog.hide();
		}
	}

	// Exactly one terminal per round; send === null means zero replies
	// (taskPickCancel / detach - spec 4.1). finished is set BEFORE hide(), so the
	// synchronous Popup onClose never classifies our own cleanup as a user cancel.
	function completeRound(round, send) {
		if (round.finished) {
			return;
		}
		round.finished = true;
		clearTimeout(round.deadlineTimer);
		if (send) {
			send();
		}
		hideDialog();
		round.resolve();
		if (activeRound === round) {
			activeRound = null;
		}
	}

	// An unhandled late-callback error rejects the round promise; the router turns
	// exactly that rejection into taskPickError UNKNOWN (spec 5.3 p.5).
	function failRound$1(round, err) {
		if (round.finished) {
			return;
		}
		round.finished = true;
		clearTimeout(round.deadlineTimer);
		hideDialog();
		round.reject(err);
		if (activeRound === round) {
			activeRound = null;
		}
	}

	// Event callbacks fire long after the handler promise would have settled on
	// its own - errors must be funneled into the round promise by hand.
	const guardEvent = fn => (...args) => {
		const round = activeRound;
		try {
			fn(...args);
		} catch (err) {
			if (round && !round.finished) {
				failRound$1(round, err);
			} else {
				throw err;
			}
		}
	};

	// anchor (client coords of the board iframe viewport) -> absolute page
	// coordinates of the top document: the object bind of main.popup is an
	// absolute page position, and the dialog is created via top.BX (spec 5.3 p.2).
	// Exported since stage 4: actions.js anchors its popups with the same formula.
	function computeTargetPoint(anchor, containerId) {
		const topWindow = window.top;
		if (!anchor || typeof anchor.left !== 'number' || typeof anchor.top !== 'number') {
			return {
				left: topWindow.pageXOffset + topWindow.innerWidth / 2,
				top: topWindow.pageYOffset + topWindow.innerHeight / 2
			};
		}
		let left = anchor.left;
		let topOffset = anchor.top;
		const container = document.getElementById(containerId);
		const frame = container ? container.querySelector('iframe') : null;
		if (frame) {
			const rect = frame.getBoundingClientRect();
			left += rect.left;
			topOffset += rect.top;
		}
		// The board page itself may live inside a SidePanel frame: climb to top.
		let win = window;
		while (win !== topWindow && win.frameElement) {
			const rect = win.frameElement.getBoundingClientRect();
			left += rect.left;
			topOffset += rect.top;
			win = win.parent;
		}
		return {
			left: left + topWindow.pageXOffset,
			top: topOffset + topWindow.pageYOffset
		};
	}

	// Between-rounds hygiene (spec addendum 2026-08-20): the reused dialog must
	// not leak the previous round's selection or query into the new one.
	function resetDialog(instance) {
		instance.getSelectedItems().forEach(item => item.deselect({
			emitEvents: false
		}));
		const tagSelector = instance.getTagSelector();
		if (tagSelector) {
			tagSelector.clearTextBox();
		}
		instance.selectFirstTab();
	}
	async function readPickedTask(round, taskId) {
		try {
			const {
				tasks
			} = await readTasksInfo([taskId]);
			if (round.finished) {
				return; // cancelled during 'read': the late result is suppressed (spec 5.3 p.4)
			}
			if (!tasks.length) {
				completeRound(round, () => round.reply('taskPickError', {
					code: 'TASK_READ_FAILED'
				}));
				return;
			}
			const task = tasks[0];
			completeRound(round, () => round.reply('taskPickResponse', {
				task
			}));
		} catch (err) {
			// Any read outcome without a task means there is nothing to place a card
			// from - including ACCESS_DENIED and the 10s read deadline (spec 4.1).
			if (!round.finished) {
				completeRound(round, () => round.reply('taskPickError', {
					code: 'TASK_READ_FAILED'
				}));
			}
		}
	}
	function createDialog(Dialog) {
		return new Dialog({
			entities: [{
				id: 'task-with-id'
			}],
			multiple: false,
			enableSearch: true,
			preselectedItems: [],
			// cacheable stays at its default (true): the single reused instance keeps
			// the global instances map at one entry (spec addendum 2026-08-20).
			events: {
				onLoad: guardEvent(() => {
					const round = activeRound;
					if (!round || round.finished) {
						return;
					}
					clearTimeout(round.deadlineTimer);
					round.phase = 'dialog';
				}),
				onLoadError: guardEvent(() => {
					const round = activeRound;
					if (!round || round.finished) {
						return;
					}
					completeRound(round, () => round.reply('taskPickError', {
						code: 'TASKS_UNAVAILABLE'
					}));
				}),
				'Item:onSelect': guardEvent(event => {
					const round = activeRound;
					if (!round || round.finished) {
						return;
					}
					// The phase flips to 'read' synchronously BEFORE the stock
					// hideOnSelect closes the popup, so its onClose is not a cancel.
					round.phase = 'read';
					const {
						item
					} = event.getData();
					readPickedTask(round, String(item.getId()));
				})
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
						if (!round || round.finished || round.phase === 'read') {
							return;
						}
						completeRound(round, () => round.reply('taskPickCancelled', {}));
					})
				}
			}
		});
	}
	async function runRound(round, data, ctx) {
		let selectorExports;
		try {
			selectorExports = await top.BX.Runtime.loadExtension('ui.entity-selector');
			await top.BX.Runtime.loadExtension('tasks.entity-selector');
		} catch (err) {
			completeRound(round, () => round.reply('taskPickError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		if (round.finished) {
			return; // cancelled or replaced while loading - never show a stale dialog
		}
		const Dialog = selectorExports && selectorExports.Dialog;
		const Entity = selectorExports && selectorExports.Entity;
		if (!Dialog || !Entity) {
			completeRound(round, () => round.reply('taskPickError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		// Preflight (spec 5.3 p.1): without the tasks module the provider's server
		// half is absent, the client defaults stay false and the dialog would hang
		// forever empty without even an onLoadError.
		const entityOptions = Entity.getEntityDefaultOptions('task-with-id');
		if (!entityOptions || entityOptions.dynamicLoad !== true || entityOptions.dynamicSearch !== true) {
			completeRound(round, () => round.reply('taskPickError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		const point = computeTargetPoint(data.anchor, ctx.containerId);
		if (!dialog || dialog.destroyed) {
			dialog = createDialog(Dialog);
		} else {
			resetDialog(dialog);
		}
		dialog.setTargetNode(point);
		// A loaded reused dialog never re-emits Dialog:onLoad (load() exits on
		// loadState !== UNSENT) - defuse the availability deadline synchronously
		// (stage 4 spec 5.4), or the second round would get a false
		// TASKS_UNAVAILABLE after 30s with the dialog open.
		if (typeof dialog.isLoaded === 'function' && dialog.isLoaded()) {
			clearTimeout(round.deadlineTimer);
			round.phase = 'dialog';
		}
		dialog.show();
	}
	function handleTaskPickRequest(data, ctx) {
		const requestId = data.requestId;
		if (activeRound && !activeRound.finished) {
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
			reply: (event, payload) => ctx.reply(event, Object.assign({
				requestId
			}, payload))
		};
		activeRound = round;
		// The single availability deadline (spec 4.1): from the request to
		// Dialog:onLoad, covering both extension loads AND the initial
		// ui.entityselector.load, which runs with no timeout of its own.
		round.deadlineTimer = setTimeout(() => {
			completeRound(round, () => round.reply('taskPickError', {
				code: 'TASKS_UNAVAILABLE'
			}));
		}, AVAILABILITY_DEADLINE_MS);
		runRound(round, data, ctx).catch(err => failRound$1(round, err));
		return promise;
	}
	function handleTaskPickCancel(data) {
		const round = activeRound;
		if (!round || round.finished || String(data && data.requestId || '') !== String(round.requestId)) {
			return;
		}
		// Zero replies: the board has already cancelled locally (spec 4.1). In the
		// 'read' phase the finished flag suppresses the late read result.
		completeRound(round, null);
	}
	function detachPick() {
		if (activeRound && !activeRound.finished) {
			// The page is leaving: finish silently, zero replies (spec 5.3 p.5).
			completeRound(activeRound, null);
		}
		if (!dialog) {
			return;
		}
		const dying = dialog;
		dialog = null;
		if (dying.destroyed) {
			return;
		}
		dying.hide();
		// The popup lives in top and would outlive a closed SidePanel. destroy() is
		// delayed past both non-cancelable ui debounces (200/500ms); a load still
		// pending after that is the documented residual (spec addendum 2026-08-20).
		top.setTimeout(() => {
			if (!dying.destroyed) {
				dying.destroy();
			}
		}, DETACH_DESTROY_DELAY_MS$1);
	}

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
		start: taskId => BX.ajax.runAction('tasks.V2.Task.Status.start', {
			json: {
				task: {
					id: Number(taskId)
				}
			}
		}),
		// completeWithChecklist exactly as the full card: "V2 always delegates
		// checklist completion to the server" (spec 4.4).
		complete: taskId => BX.ajax.runAction('tasks.V2.Task.Status.complete', {
			json: {
				task: {
					id: Number(taskId)
				},
				completeWithChecklist: true
			}
		})
	};

	// Direct actions (spec 5.2): one stock call per round, no host UI, no shared
	// state - parallel rounds are independent by construction.
	async function handleTaskActionRequest(data, ctx) {
		const requestId = data.requestId;
		const call = ACTION_CALLS[data.action];
		if (!call) {
			// Unclassified board anomaly: the router catch turns this into UNKNOWN.
			throw new Error(`unknown task action: ${data.action}`);
		}
		try {
			await withDeadline(call(String(data.taskId)), WRITE_DEADLINE_MS);
			ctx.reply('taskActionResponse', {
				requestId
			});
		} catch (err) {
			// Everything lands in one code on the wire (spec 4.2): the board shows a
			// toast either way; the detail stays in the console for diagnostics.
			console.error('board-tasks action failed', data.action, err);
			ctx.reply('taskActionError', {
				requestId,
				code: 'TASK_WRITE_FAILED'
			});
		}
	}
	function hideResponsibleDialog() {
		if (responsibleDialog && !responsibleDialog.destroyed) {
			responsibleDialog.hide();
		}
	}
	function destroyPickerNow(holder) {
		if (!holder || holder.destroyed) {
			return;
		}
		holder.destroyed = true;
		holder.picker.destroy();
	}

	// Popup teardown of the terminating round. The shared dialog is hidden only
	// when this round still owns it: a write-phase terminal must never hide the
	// dialog of the NEXT interactive round (spec 5.3). The per-round date picker
	// belongs to this round alone.
	function releaseRoundPopup(round) {
		if (round.field === 'responsible' && dialogOwnerRequestId === round.requestId) {
			hideResponsibleDialog();
			dialogOwnerRequestId = null;
		}
		if (round.field === 'deadline') {
			destroyPickerNow(round.pickerHolder);
			round.pickerHolder = null;
		}
	}
	function releaseSlots(round) {
		if (interactiveRound === round) {
			interactiveRound = null;
		}
		liveRounds.delete(round);
	}

	// Exactly one terminal per round; send === null means zero replies
	// (taskEditCancel in preload/dialog, detach). finished is set BEFORE the popup
	// teardown, so the synchronous Popup onClose never classifies it as a cancel.
	function finishRound(round, send) {
		if (round.finished) {
			return;
		}
		round.finished = true;
		clearTimeout(round.deadlineTimer);
		if (send) {
			send();
		}
		releaseRoundPopup(round);
		round.resolve();
		releaseSlots(round);
	}

	// An unhandled late-callback error rejects the round promise; the router turns
	// exactly that rejection into taskEditError UNKNOWN.
	function failRound(round, err) {
		if (round.finished) {
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
	function enterWritePhase(round) {
		round.phase = 'write';
		clearTimeout(round.deadlineTimer);
		if (round.field === 'responsible' && dialogOwnerRequestId === round.requestId) {
			hideResponsibleDialog(); // synchronous close: animation: false (spec 5.4)
			dialogOwnerRequestId = null;
		}
		if (interactiveRound === round) {
			interactiveRound = null;
		}
		round.reply('taskEditApplying', {});
	}

	// The whole write phase - preflight AND the conditional write - lives under a
	// single WRITE_DEADLINE_MS budget (spec 4.2).
	async function runWritePhase(round, writeFn) {
		try {
			await withDeadline(writeFn(), WRITE_DEADLINE_MS);
			finishRound(round, () => round.reply('taskEditResponse', {}));
		} catch (err) {
			console.error('board-tasks edit write failed', round.field, err);
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASK_WRITE_FAILED'
			}));
		}
	}

	// Write-preflight (spec 4.4): one confirmed read before EVERY field write.
	// Re-delegating the same responsible restarts the task (the status resets to
	// pending), re-writing the same date burns the reschedule journal.
	function preflightRead(taskId) {
		return listAction({
			select: ['id', 'deadline', 'responsible'],
			filter: [{
				field: 'id',
				operator: 'in',
				value: [taskId]
			}],
			pagination: {
				limit: 1
			}
		}, () => {}).then(response => (((response || {}).data || {}).tasks || [])[0]);
	}
	async function writeResponsible(round, selectedId) {
		const serverTask = await preflightRead(round.taskId);
		if (!serverTask) {
			throw new Error('write preflight found no task');
		}
		const serverResponsible = serverTask.responsible ? String(serverTask.responsible.id) : '';
		if (serverResponsible === selectedId) {
			return; // already the desired value - the write is skipped (spec 4.4)
		}
		await BX.ajax.runAction('tasks.V2.Task.Stakeholder.Responsible.delegate', {
			json: {
				task: {
					id: Number(round.taskId),
					responsible: {
						id: Number(selectedId)
					}
				}
			}
		});
	}

	// Shared-dialog callbacks act on the CURRENT owner round only.
	function ownerRound() {
		const round = interactiveRound;
		if (!round || round.finished || round.field !== 'responsible' || dialogOwnerRequestId !== round.requestId) {
			return null;
		}
		return round;
	}
	const guardOwner = fn => (...args) => {
		const round = ownerRound();
		if (!round) {
			return;
		}
		try {
			fn(round, ...args);
		} catch (err) {
			failRound(round, err);
		}
	};
	function onResponsibleSelect(round, event) {
		const {
			item
		} = event.getData();
		const selectedId = String(item.getId());
		// Fast local layer (spec 4.4): picking the current responsible is a cancel,
		// not a write - re-delegation would restart the task.
		if (round.current !== undefined && round.current !== null && selectedId === String(round.current)) {
			finishRound(round, () => round.reply('taskEditCancelled', {}));
			return;
		}
		enterWritePhase(round);
		runWritePhase(round, () => writeResponsible(round, selectedId));
	}
	function createResponsibleDialog(Dialog) {
		return new Dialog({
			// The stock quick "change responsible" action of tasks
			// (comment-action-controller) - the closest product analog (spec 5.4).
			entities: [{
				id: 'user',
				options: {
					intranetUsersOnly: true,
					emailUsers: false,
					inviteEmployeeLink: false,
					inviteGuestLink: false
				}
			}, {
				id: 'department'
			}],
			multiple: false,
			enableSearch: true,
			preselectedItems: [],
			events: {
				onLoad: guardOwner(round => {
					clearTimeout(round.deadlineTimer);
					round.phase = 'dialog';
				}),
				onLoadError: guardOwner(round => {
					finishRound(round, () => round.reply('taskEditError', {
						code: 'TASKS_UNAVAILABLE'
					}));
				}),
				'Item:onSelect': guardOwner(onResponsibleSelect)
			},
			popupOptions: {
				// animation: false is load-bearing: the default 200ms closing animation
				// would make Popup.show() of the immediate next round bail on isShown()
				// (spec 5.4).
				animation: false,
				events: {
					onClose: guardOwner(round => {
						// Only a user close in preload/dialog is a cancel; entering the
						// write phase hides the popup with the round still unfinished.
						if (round.phase !== 'preload' && round.phase !== 'dialog') {
							return;
						}
						finishRound(round, () => round.reply('taskEditCancelled', {}));
					})
				}
			}
		});
	}

	// Between-rounds hygiene (stage-3 addendum): the reused dialog must not leak
	// the previous round's selection or query into the new one.
	function resetResponsibleDialog(instance) {
		instance.getSelectedItems().forEach(item => item.deselect({
			emitEvents: false
		}));
		const tagSelector = instance.getTagSelector();
		if (tagSelector) {
			tagSelector.clearTextBox();
		}
	}
	async function runResponsibleRound(round, data, ctx) {
		let selectorExports;
		try {
			selectorExports = await top.BX.Runtime.loadExtension('ui.entity-selector');
		} catch (err) {
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		if (round.finished) {
			return; // cancelled or replaced while loading - never show a stale popup
		}
		const Dialog = selectorExports && selectorExports.Dialog;
		if (!Dialog) {
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		const point = computeTargetPoint(data.anchor, ctx.containerId);
		if (!responsibleDialog || responsibleDialog.destroyed) {
			responsibleDialog = createResponsibleDialog(Dialog);
		} else {
			resetResponsibleDialog(responsibleDialog);
		}
		dialogOwnerRequestId = round.requestId;
		responsibleDialog.setTargetNode(point);
		// A loaded reused dialog never re-emits Dialog:onLoad - defuse the deadline
		// synchronously (spec 5.4; the same rule as the pick fix).
		if (typeof responsibleDialog.isLoaded === 'function' && responsibleDialog.isLoaded()) {
			clearTimeout(round.deadlineTimer);
			round.phase = 'dialog';
		}
		responsibleDialog.show();
	}
	async function writeDeadline(round, deadlineTs) {
		const serverTask = await preflightRead(round.taskId);
		if (!serverTask) {
			throw new Error('write preflight found no task');
		}
		const serverDeadline = serverTask.deadline == null ? null : Number(serverTask.deadline);
		if (serverDeadline === deadlineTs) {
			return; // the same date again would burn the reschedule journal (spec 4.4)
		}
		await BX.ajax.runAction('tasks.V2.Task.Deadline.update', {
			json: {
				task: {
					id: Number(round.taskId),
					deadlineTs
				}
			}
		});
	}
	function onDateSelect(round, calendar, timezone, event) {
		if (round.finished || round.phase !== 'dialog') {
			return;
		}
		const {
			date
		} = event.getData();
		round.phase = 'write';
		clearTimeout(round.deadlineTimer);
		// Deferred teardown: the picker synchronously emits SELECT_CHANGE right
		// after SELECT, and destroy() ends with setPrototypeOf(this, null) - a
		// synchronous destroy inside the SELECT handler would throw (spec 5.4).
		const holder = round.pickerHolder;
		round.pickerHolder = null;
		top.setTimeout(() => destroyPickerNow(holder), 0);
		if (interactiveRound === round) {
			interactiveRound = null;
		}
		round.reply('taskEditApplying', {});
		// Two-step conversion of the full card (spec 5.4): the picker date is a
		// synthetic UTC date; the portal timezone offset is subtracted at the end.
		const dateTs = calendar.createDateFromUtc(date).getTime();
		const deadlineTs = (dateTs - timezone.getOffset(dateTs)) / 1000;
		runWritePhase(round, () => writeDeadline(round, deadlineTs));
	}
	async function runDeadlineRound(round, data, ctx) {
		let exportsPicker;
		let exportsCalendar;
		let exportsTimezone;
		try {
			exportsPicker = await top.BX.Runtime.loadExtension('ui.date-picker');
			exportsCalendar = await top.BX.Runtime.loadExtension('tasks.v2.lib.calendar');
			exportsTimezone = await top.BX.Runtime.loadExtension('tasks.v2.lib.timezone');
		} catch (err) {
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASKS_UNAVAILABLE'
			}));
			return;
		}
		if (round.finished) {
			return; // cancelled or replaced while loading - never show a stale picker
		}
		const DatePicker = exportsPicker && exportsPicker.DatePicker;
		const DatePickerEvent = exportsPicker && exportsPicker.DatePickerEvent;
		const calendar = exportsCalendar && exportsCalendar.calendar;
		const timezone = exportsTimezone && exportsTimezone.timezone;
		// An empty export means the tasks module never shipped the extension config
		// (its config.php returns [] without the module) - spec §2.
		if (!DatePicker || !DatePickerEvent || !calendar || !timezone) {
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASKS_UNAVAILABLE'
			}));
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
			selectedDates: current === null ? null : [current * 1000 + timezone.getOffset(current * 1000)],
			hideOnSelect: false,
			cacheable: false,
			events: {
				[DatePickerEvent.SELECT]: event => {
					try {
						onDateSelect(round, calendar, timezone, event);
					} catch (err) {
						failRound(round, err);
					}
				}
			},
			popupOptions: {
				events: {
					onClose: () => {
						// Only a user close in preload/dialog is a cancel; the deferred
						// teardown after a SELECT closes the popup in 'write' (spec 5.4).
						if (round.finished || round.phase !== 'preload' && round.phase !== 'dialog') {
							return;
						}
						finishRound(round, () => round.reply('taskEditCancelled', {}));
					}
				}
			}
		});
		round.pickerHolder = {
			picker,
			destroyed: false
		};
		picker.show();
		if (!round.finished) {
			clearTimeout(round.deadlineTimer);
			round.phase = 'dialog';
		}
	}

	// async on purpose: a synchronous throw would escape the router's
	// Promise.resolve(handler(...)) wrapper and never become taskEditError UNKNOWN.
	async function handleTaskEditRequest(data, ctx) {
		if (data.field !== 'responsible' && data.field !== 'deadline') {
			// Unclassified board anomaly: the router catch turns this into UNKNOWN.
			throw new Error(`unknown task edit field: ${data.field}`);
		}
		const requestId = data.requestId;
		if (interactiveRound && !interactiveRound.finished) {
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
			reply: (event, payload) => ctx.reply(event, Object.assign({
				requestId
			}, payload))
		};
		interactiveRound = round;
		liveRounds.add(round);
		// The availability deadline (spec 4.2): from the request to the shown popup
		// (Dialog:onLoad for the responsible, picker show() for the deadline).
		round.deadlineTimer = setTimeout(() => {
			finishRound(round, () => round.reply('taskEditError', {
				code: 'TASKS_UNAVAILABLE'
			}));
		}, PRELOAD_DEADLINE_MS);
		const run = round.field === 'deadline' ? runDeadlineRound : runResponsibleRound;
		run(round, data, ctx).catch(err => failRound(round, err));
		return promise;
	}
	function handleTaskEditCancel(data) {
		const round = interactiveRound;
		// Write-phase rounds are not interactive any more - a cancel arriving then
		// is ignored by construction: the write is not abortable (spec 4.2).
		if (!round || round.finished || String(data && data.requestId || '') !== String(round.requestId)) {
			return;
		}
		finishRound(round, null);
	}
	function detachActions() {
		// The interactive round first: its silent finish also tears its popup down.
		if (interactiveRound && !interactiveRound.finished) {
			finishRound(interactiveRound, null);
		}
		// Write-phase rounds: resolve silently, zero replies (spec 5.3).
		[...liveRounds].forEach(round => finishRound(round, null));
		if (!responsibleDialog) {
			return;
		}
		const dying = responsibleDialog;
		responsibleDialog = null;
		dialogOwnerRequestId = null;
		if (dying.destroyed) {
			return;
		}
		dying.hide();
		// The popup lives in top and would outlive a closed SidePanel; destroy is
		// delayed past the non-cancelable ui debounces (stage-3 addendum).
		top.setTimeout(() => {
			if (!dying.destroyed) {
				dying.destroy();
			}
		}, DETACH_DESTROY_DELAY_MS);
	}

	// Per-taskId watch registry (module-level, spans handler calls): a repeat open
	// request for the same task replaces the previous watch instead of stacking a
	// second onOpen/onClose pair (spec 5.4: exactly one taskChanged per close).
	const activeWatches = new Map();

	// The full-card slider lives in the top window (spec 5.3): opened from inside
	// a frame it would only occupy the frame's area.
	async function handleTaskOpenRequest(data, ctx) {
		const taskId = String(data.taskId || '');
		if (!taskId) {
			return;
		}
		const exports = await top.BX.Runtime.loadExtension('tasks.v2.application.task-card');
		// attached === false: the board page left while the extension was loading
		// (MR review) - opening the full card now would pop a slider in the top
		// window that no board lifecycle manages any more.
		if (ctx.state.attached === false || !exports || !exports.TaskCard) {
			return;
		}
		const prevDetach = activeWatches.get(taskId);
		if (prevDetach) {
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
		const onOpen = event => {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider && sliderEvent.getSlider();
			const url = slider && slider.getUrl && slider.getUrl() || '';
			if (url.indexOf(`/task/view/${taskId}/`) !== -1 || taskIdQueryBoundary.test(url)) {
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
			if (activeWatches.get(taskId) === detach) {
				activeWatches.delete(taskId);
			}
			// MR review: an executed watch must not stay in the page-detach registry -
			// repeated card opens on a long-lived board accumulated one closure each.
			const index = ctx.state.detachFns.indexOf(detach);
			if (index !== -1) {
				ctx.state.detachFns.splice(index, 1);
			}
		};
		const onClose = event => {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider && sliderEvent.getSlider();
			if (!watchedSlider || slider !== watchedSlider) {
				return;
			}
			detach();
			// Exactly one taskChanged per close of our own slider (spec 5.4): opening
			// the card changes its unseen state, so the card must re-read it.
			ctx.reply('taskChanged', {
				taskId
			});
		};
		emitter.subscribe('SidePanel.Slider:onOpen', onOpen);
		emitter.subscribe('SidePanel.Slider:onCloseComplete', onClose);
		activeWatches.set(taskId, detach);
		ctx.state.detachFns.push(detach);
		exports.TaskCard.showFullCard({
			taskId: Number(taskId)
		});
	}

	/**
	 * Pull bridge (spec 5.4): regular task events -> taskChanged for cards that
	 * belong to this board. Only the id travels on - the board re-reads the task
	 * itself, on behalf of the current viewer.
	 */
	function attachOpenAndPull(ctx) {
		const commands = ['task_update', 'task_remove', 'task_view'];
		const callback = params => {
			// Server senders (SendPush.php, PushHandler.php, TaskViewed.php) and every
			// other tasks subscriber (entity-selector.js:92) key the id as TASK_ID.
			const taskId = String(params && params.TASK_ID || '');
			if (!taskId || !ctx.state.knownTaskIds.has(taskId)) {
				return;
			}
			ctx.reply('taskChanged', {
				taskId
			});
		};
		// PullClient#subscribe always returns its own unsubscribe closure for
		// module+command subscriptions (pull.client emitter.js); there is no
		// BX.PULL.unsubscribe method to fall back to.
		const detachFns = commands.map(command => BX.PULL.subscribe({
			type: BX.PullClient.SubscriptionType.Server,
			moduleId: 'tasks',
			command,
			callback
		}));
		return () => {
			detachFns.forEach(detach => detach());
		};
	}

	// Own message channel for this extension.
	//
	// The flip-board-sdk under templates/.default/src/flip-board-sdk is a vendored copy: it is
	// overwritten wholesale on every vendor update, so this extension must not depend on
	// fork-local additions to it (postMessage/isTrustedMessage stay SDK-internal). The trust
	// root is the same as the SDK's — the iframe's own contentWindow plus an expected origin —
	// but built independently: the origin is pinned by the server (template.php, from APP_URL),
	// and the iframe is resolved from the DOM rather than cached from a constructor.
	function createChannel({
		containerId,
		appOrigin
	}) {
		// The SDK creates the iframe only inside init(), which runs after attach() wires up this
		// extension — so the element cannot be captured once up front. It is re-resolved on every
		// call; the cached reference is reused only while still attached to the document.
		let cachedFrame = null;
		const resolveFrame = () => {
			if (cachedFrame && cachedFrame.isConnected) {
				return cachedFrame;
			}
			const container = document.getElementById(containerId);
			cachedFrame = container ? container.querySelector('iframe') : null;
			return cachedFrame;
		};
		return {
			isTrusted(event) {
				const frame = resolveFrame();
				return Boolean(frame) && event.origin === appOrigin && event.source === frame.contentWindow;
			},
			post(message) {
				const frame = resolveFrame();
				if (!frame || !frame.contentWindow) {
					return; // no iframe yet — nothing to send to, and nothing to queue (spec 4.3)
				}
				frame.contentWindow.postMessage(message, appOrigin); // never '*'
			}
		};
	}

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
		}
	};

	// Spec 4.2: the reply name is derived from the request name, but only for
	// correlatable requests - 'Request' suffix AND a non-empty requestId. One-way
	// messages (taskOpenRequest carries no requestId, taskPickCancel has no
	// 'Request' suffix) never get an answer in any branch.
	const deriveErrorEvent = (eventName, data) => {
		const name = String(eventName);
		if (!name.endsWith('Request') || !data || !data.requestId) {
			return null;
		}
		return `${name.slice(0, -'Request'.length)}Error`;
	};
	function attach({
		containerId,
		appOrigin
	}) {
		const channel = createChannel({
			containerId,
			appOrigin
		});
		const state = {
			knownTaskIds: new Set(),
			detachFns: [],
			attached: true
		};
		const ctx = {
			state,
			containerId,
			reply: (event, data) => channel.post({
				event,
				data
			})
		};
		const onMessage = event => {
			// Spec 4.3: untrusted is dropped before parsing type/requestId, no reply.
			if (!channel.isTrusted(event)) {
				return;
			}
			const {
				event: eventName,
				data
			} = event.data || {};
			if (!eventName || !String(eventName).startsWith('task')) {
				return; // not ours — leave it alone (waitSDKParams etc. live in the template)
			}
			const handler = HANDLERS[eventName];
			if (!handler) {
				const replyEvent = deriveErrorEvent(eventName, data);
				if (replyEvent) {
					ctx.reply(replyEvent, {
						requestId: data.requestId,
						code: 'NOT_SUPPORTED'
					});
				}
				return;
			}
			Promise.resolve(handler(data || {}, ctx)).catch(err => {
				console.error('board-tasks handler failed', eventName, err);
				// Spec §4: UNKNOWN — unexpected error the handler did not classify itself.
				const replyEvent = deriveErrorEvent(eventName, data);
				if (replyEvent) {
					ctx.reply(replyEvent, {
						requestId: data.requestId,
						code: 'UNKNOWN'
					});
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
			if (!state.attached) {
				return;
			}
			state.attached = false;
			// A copy: entries may splice themselves out of the registry when run -
			// the registry is no longer append-only (MR review).
			[...state.detachFns].forEach(fn => fn());
			state.detachFns = [];
		};
	}

	exports.attach = attach;

})(this.BX.Disk.BoardTasks = this.BX.Disk.BoardTasks || {}, BX);
//# sourceMappingURL=board-tasks.bundle.js.map
