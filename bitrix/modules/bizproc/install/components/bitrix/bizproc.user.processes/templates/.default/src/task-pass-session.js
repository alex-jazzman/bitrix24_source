import { addCustomEvent, removeCustomEvent, Runtime, Text, Type } from 'main.core';
import { Router } from 'bizproc.router';
import {
	type PerformerResult,
	type PerformerTask,
	type TaskPass,
} from 'bizproc.task.performer';
import { notifyPass } from './notify-pass';

// EVENT-02: the decision the form of a task publishes once the server has accepted it. The identifier
// belongs to the form of a task, and the public surface of the mechanics does not carry it.
const TASK_DECISION_EVENT = 'bp-performer-task-decision';

// The two messages the form of a task frames a decision with: one when it goes to the server, one when
// the server refused it. Together with EVENT-02 they say how a decision ended, whatever became of the
// form in the meantime.
const TASK_DECISION_SENT_EVENT = 'try-do-bp-task-event';
const TASK_DECISION_FAILED_EVENT = 'error-do-bp-task-event';

/** The task the address of the form of a task names - `/company/personal/bizproc/<taskId>/`. */
const TASK_URL_PATTERN = /\/bizproc\/(\d+)\//;

const SIDE_PANEL_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';
const SIDE_PANEL_OPEN_EVENT = 'SidePanel.Slider:onOpenComplete';
const SIDE_PANEL_CLOSE_EVENT = 'SidePanel.Slider:onCloseComplete';

/**
 * How long a step of the pass waits for the form it asked for to appear. The panel reports an open of
 * its own (`onOpenComplete`), and an open that did not happen reports nothing at all: the request is
 * refused where the panel already shows that very address, and the panel itself is brought in by a
 * loader of its own, which answers a failure to the console. Without a limit the step would wait for a
 * form nobody is going to show, and the group action would stay dead until the page is reloaded.
 *
 * How long an honest open takes belongs to the portal and not to this code, so the limit is only a
 * default here: the list passes its own (`formOpenTimeout`).
 */
const DEFAULT_FORM_OPEN_TIMEOUT = 20000;

/**
 * The mechanics of a pass, once loaded. The list needs them only after a group action is chosen and
 * applied, so the extension is not part of the page: a list a person just reads never asks for it.
 * Everything reaching for it goes through a pass, and a pass is only ever started by `loadPerformer`.
 */
let performer: ?Object = null;

export function loadPerformer(): Promise<Object>
{
	if (performer !== null)
	{
		return Promise.resolve(performer);
	}

	return Runtime.loadExtension('bizproc.task.performer').then((exports) => {
		performer = exports;

		return exports;
	});
}

/**
 * One pass over the selected tasks. It owns the snapshot of the queue, tells the form of a task which
 * task goes next (EVENT-01) and takes the person through a task in the side panel (P3). How the queue
 * is walked is decided by `bizproc.task.performer` - nothing of that lives here.
 *
 * Everything the pass subscribed to is dropped the moment it ends, however it ended: a listener that
 * outlived its pass would answer for a queue that is gone.
 */
export class TaskPassSession
{
	#tasks: Array<PerformerTask>;
	#handlers: { [string]: Function };
	#formOpenTimeout: number;

	// Where the pass stands: the task last handed to the opener. It outlives one step of the pass,
	// unlike #resolveStep, so a message about another task is not taken for a message about this one.
	#currentTaskId: number = 0;
	#currentTask: ?PerformerTask = null;
	#resolveStep: ?Function = null;

	// Whether a decision on the task the pass stands on is on its way to the server. While it is, the
	// step is settled by the answer of the server and not by whatever happens to the form meanwhile.
	#isDecisionSent: boolean = false;

	// The side panel the pass opened. The panels opened from inside it are not the pass.
	#slider: ?Object = null;
	#isSliderRequested: boolean = false;
	#sliderOpenTimeoutId: ?number = null;

	// The same panel, kept once it closed: the messages of a decision reach the pass after the form is
	// gone as well, and they are still the messages of that form.
	#openedSlider: ?Object = null;

	/**
	 * @param tasks The selection, in the order of the rows of the list.
	 * @param options.formOpenTimeout How long a step waits for the form of its task, in milliseconds.
	 */
	constructor(tasks: Array<PerformerTask>, options: { formOpenTimeout?: number } = {})
	{
		this.#tasks = [...tasks];
		this.#formOpenTimeout = toFormOpenTimeout(options?.formOpenTimeout);
		this.#handlers = {
			[SIDE_PANEL_MESSAGE_EVENT]: this.#handleSliderMessage,
			[SIDE_PANEL_OPEN_EVENT]: this.#handleSliderOpen,
			[SIDE_PANEL_CLOSE_EVENT]: this.#handleSliderClose,
		};
	}

	/**
	 * @param decision The task request the pass starts with, or nothing when the decision is made
	 *   inside the pass, task by task.
	 */
	async run(decision: ?Object): Promise<PerformerResult>
	{
		this.#subscribe();

		try
		{
			return await (new performer.TasksPerformer({
				tasks: this.#tasks,
				decision,
				openTask: this.#openTask,
			})).start();
		}
		finally
		{
			this.#unsubscribe();
		}
	}

	#subscribe(): void
	{
		Object.entries(this.#handlers).forEach(
			([eventName, handler]) => addCustomEvent(eventName, handler),
		);
	}

	#unsubscribe(): void
	{
		Object.entries(this.#handlers).forEach(
			([eventName, handler]) => removeCustomEvent(eventName, handler),
		);
	}

	/**
	 * Takes the person through one task. The form is opened only when there is none open: the form of the
	 * task just performed is still on the screen while it closes, and the next task is opened once that
	 * form is gone (`#handleSliderClose`). A form that shows the next task itself - which it does while
	 * that task belongs to its own process (EVENT-01) - stays, and the step then waits for a decision on
	 * the form that is already there.
	 */
	#openTask = (task: PerformerTask): Promise<TaskPass> => {
		this.#currentTaskId = task.id;
		this.#currentTask = task;
		this.#isDecisionSent = false;

		return new Promise((resolve) => {
			this.#resolveStep = resolve;

			this.#openSlider();
		});
	};

	/**
	 * Shows the form of the task the pass stands on - unless one is already there to show it, or nobody
	 * is waiting for that task any more: a form is only ever opened for a step of the pass.
	 */
	#openSlider(): void
	{
		const task = this.#currentTask;
		if (
			task === null
			|| this.#resolveStep === null
			|| this.#slider !== null
			|| this.#isSliderRequested
		)
		{
			return;
		}

		this.#isSliderRequested = true;
		this.#sliderOpenTimeoutId = setTimeout(this.#handleSliderOpenFailure, this.#formOpenTimeout);
		Router.openWorkflowTask(task.id, task.userId);
	}

	/** Nothing is waited for any more: the form arrived, or the step it was asked for is over. */
	#stopWaitingForSlider(): void
	{
		this.#isSliderRequested = false;

		if (this.#sliderOpenTimeoutId !== null)
		{
			clearTimeout(this.#sliderOpenTimeoutId);
			this.#sliderOpenTimeoutId = null;
		}
	}

	/**
	 * The form never appeared. The person has nothing to decide in and no reason to expect the next form
	 * to appear either, so the pass ends here instead of waiting on: what it performed stays performed,
	 * the tasks behind keep waiting for their decision, and the panel of the list can start a pass anew
	 * without the page being reloaded. Silence would leave the group action dead until it is.
	 */
	#handleSliderOpenFailure = (): void => {
		this.#stopWaitingForSlider();

		if (this.#resolveStep === null)
		{
			return;
		}

		notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_FORM_FAILED');
		this.#settleStep({
			status: performer.TaskPassStatus.Exit,
			decision: null,
			outcome: null,
		});
	};

	/**
	 * What the form of a task says about a decision: that it went to the server, that the server refused
	 * it, or - EVENT-02 - that the server accepted it. Only the last one ends a step as performed, and
	 * only because the form publishes it after the server has accepted it for this very task: the record
	 * of the outcome repeats an answer of the server and is not a guess of the interface.
	 */
	#handleSliderMessage = (event: ?Object): void => {
		if (!this.#isOwnSliderMessage(event))
		{
			return;
		}

		const eventId = readEventId(event);
		const data = readEventData(event);

		if (eventId === TASK_DECISION_SENT_EVENT || eventId === TASK_DECISION_FAILED_EVENT)
		{
			this.#trackDecisionInFlight(eventId, data);

			return;
		}

		if (eventId !== TASK_DECISION_EVENT)
		{
			return;
		}

		if (Text.toInteger(data?.taskId) !== this.#currentTaskId)
		{
			return;
		}

		this.#isDecisionSent = false;
		this.#settleStep({
			status: performer.TaskPassStatus.Done,
			// a decision that carried files is not repeated for a group: the files stay in the form
			decision: data?.hasFileFields === true || !Type.isPlainObject(data?.taskRequest)
				? null
				: data.taskRequest,
			outcome: {
				taskId: this.#currentTaskId,
				status: performer.TaskOutcomeStatus.Done,
				errors: [],
			},
		});
	};

	/**
	 * Whether the message came from the form the pass opened. Every panel of the portal shares the bus,
	 * so a message of another one says nothing about the task the pass stands on.
	 */
	#isOwnSliderMessage(event: ?Object): boolean
	{
		const sender = Type.isFunction(event?.getSender) ? event.getSender() : null;

		return sender !== null && sender === this.#openedSlider;
	}

	/**
	 * The form the pass asked for: the panels opened from inside it belong to the person, not to us. The
	 * address tells them apart - the pass opens the form by the address of its own task
	 * (`Router.openWorkflowTask`), so a panel showing anything else is not the form the step waits for.
	 * Taken for that form, it would end a wait for a form that never came, and the form itself would
	 * then be ignored as an open of somebody else.
	 */
	#handleSliderOpen = (event: ?Object): void => {
		const slider = Type.isFunction(event?.getSlider) ? event.getSlider() : null;
		if (!this.#isSliderRequested || readSliderTaskId(slider) !== this.#currentTaskId)
		{
			return;
		}

		this.#stopWaitingForSlider();
		this.#slider = slider;
		this.#openedSlider = slider;
	};

	/**
	 * A decision on its way to the server, and the refusal that ends it. Both messages name the process
	 * only, so they are taken as being about the task the pass stands on when the process matches: the
	 * form decides one task at a time and the pass owns that form.
	 *
	 * A refusal leaves the task undecided. A form still on the screen can be tried again, and the step
	 * waits for that; a refusal reaching a form that is already gone ends the step - a pass with neither
	 * a form nor an ending would never finish.
	 */
	#trackDecisionInFlight(eventId: string, data: ?Object): void
	{
		const workflowId = this.#currentTask?.workflowId;
		if (!Type.isStringFilled(workflowId) || data?.workflowId !== workflowId)
		{
			return;
		}

		this.#isDecisionSent = eventId === TASK_DECISION_SENT_EVENT;

		if (eventId === TASK_DECISION_FAILED_EVENT && this.#slider === null)
		{
			this.#settleStep({
				status: performer.TaskPassStatus.Skipped,
				decision: null,
				outcome: null,
			});
		}
	}

	/**
	 * The form went away. What the step ended with is not the close itself:
	 *   - a decision already on its way settles the step when the server answers it (EVENT-02, or the
	 *     refusal of it), so a close overtaking that answer decides nothing;
	 *   - a form that closed while it was showing ANOTHER task never offered the one the pass stands on,
	 *     so the pass opens that task again instead of losing it;
	 *   - the form of the task the pass stands on, closed with no decision on its way, is the person
	 *     leaving that task undecided - the pass goes on, as before.
	 */
	#handleSliderClose = (event: ?Object): void => {
		const slider = Type.isFunction(event?.getSlider) ? event.getSlider() : null;
		if (this.#slider === null || slider !== this.#slider)
		{
			return;
		}

		const shownTaskId = readSliderTaskId(slider);
		this.#slider = null;

		if (this.#isDecisionSent)
		{
			return;
		}

		if (shownTaskId > 0 && shownTaskId !== this.#currentTaskId)
		{
			this.#openSlider();

			return;
		}

		this.#settleStep({
			status: performer.TaskPassStatus.Skipped,
			decision: null,
			outcome: null,
		});
	};

	/** Reports how the step ended. A step nobody waits for ends nothing. */
	#settleStep(pass: TaskPass): void
	{
		const resolve = this.#resolveStep;
		if (resolve === null)
		{
			return;
		}

		// the form was asked for by this very step, and the step is over
		this.#stopWaitingForSlider();
		this.#resolveStep = null;
		resolve(pass);
	}
}

/** A limit naming no time at all is no limit: the default stands. */
function toFormOpenTimeout(value: mixed): number
{
	const timeout = Text.toInteger(value);

	return timeout > 0 ? timeout : DEFAULT_FORM_OPEN_TIMEOUT;
}

/**
 * The task the form of a task was showing, out of the address of its panel: the form walks the queue
 * itself and names the task it moved to in that very address (`Router.openWorkflowTask` opens it,
 * `Slider.setUrl` follows every redraw). An address naming no task reads as 0 - an unreadable address
 * must not turn the close of a form into an unexpected reopening.
 */
function readSliderTaskId(slider: ?Object): number
{
	const url = Type.isFunction(slider?.getUrl) ? slider.getUrl() : '';

	return Type.isStringFilled(url) ? Text.toInteger(url.match(TASK_URL_PATTERN)?.[1]) : 0;
}

function readEventId(event: ?Object): ?string
{
	return Type.isFunction(event?.getEventId) ? event.getEventId() : null;
}

function readEventData(event: ?Object): ?Object
{
	const data = Type.isFunction(event?.getData) ? event.getData() : null;

	return Type.isPlainObject(data) ? data : null;
}
