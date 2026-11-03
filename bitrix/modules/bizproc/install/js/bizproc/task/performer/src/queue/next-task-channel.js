import { Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import 'sidepanel';

import { type QueueTask } from './queue';

/** EVENT-01 - how the form of a task asks the owner of the queue what comes next. */
export const NextTaskMessage = Object.freeze({
	Request: 'bp-performer-next-task-request',
	Response: 'bp-performer-next-task-response',
});

const SIDE_PANEL_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';

/**
 * The answer of EVENT-01: the task the pass goes on with, addressed by its process. `taskId: null`
 * says the queue is over.
 */
export type NextTaskAnswer = {
	taskId: ?number,
	workflowId: ?string,
};

/** Where the channel takes the answer from. Nothing answered means the queue is over. */
export type NextTaskSupplier = (finishedTaskId: number) => ?QueueTask;

/**
 * Whether the performed task the request names belongs to the pass at all. The supplier answers
 * nothing both for a task of the pass whose successor is not known yet and for a task the pass never
 * handed out, and only the first of them is a question this channel may answer.
 */
export type NextTaskOwnership = (finishedTaskId: number) => boolean;

/**
 * The side panel bus as the channel uses it. Tests put their own in, and a bus of a test delivers a
 * message the way this one does: wrapped, as the manager of side panels wraps it.
 */
export type NextTaskBus = {
	subscribe: (eventName: string, handler: Function) => void,
	unsubscribe: (eventName: string, handler: Function) => void,
	post: (sender: Object, eventId: string, data: Object) => void,
};

export type NextTaskChannelOptions = {
	nextTask: NextTaskSupplier,
	isOwnTask?: ?NextTaskOwnership,
	bus?: ?NextTaskBus,
};

/**
 * Tells the form of a task which task of the queue goes next (EVENT-01).
 *
 * The exchange is two messages of the side panel bus, both delivered to the window that opened the
 * form: the request comes in while the form waits for it, the answer goes back on the same bus. Two
 * messages and not a field filled in the request: the bus delivers within one tick, but leaning on a
 * mutated request object is a contract nobody can see.
 *
 * With nobody listening there is no answer at all, and a form without an answer keeps to its own
 * behaviour - the pass never hangs on a window that is not there.
 */
export class NextTaskChannel
{
	#nextTask: NextTaskSupplier;
	#isOwnTask: NextTaskOwnership;
	#bus: NextTaskBus;
	#isListening: boolean = false;

	/**
	 * @param options.nextTask Answers with the next task of the queue, or with nothing once it is over.
	 * @param options.isOwnTask Tells whether the performed task of a request belongs to the pass. Left
	 *   out, every request is taken as one of the pass - which is what a caller owning no queue means.
	 * @param options.bus Replaces the side panel bus in tests.
	 */
	constructor(options: NextTaskChannelOptions)
	{
		this.#nextTask = Type.isFunction(options?.nextTask) ? options.nextTask : () => null;
		this.#isOwnTask = Type.isFunction(options?.isOwnTask) ? options.isOwnTask : () => true;
		this.#bus = Type.isPlainObject(options?.bus) ? options.bus : sidePanelBus;
	}

	subscribe(): void
	{
		if (this.#isListening)
		{
			return;
		}

		this.#bus.subscribe(SIDE_PANEL_MESSAGE_EVENT, this.#handleMessage);
		this.#isListening = true;
	}

	unsubscribe(): void
	{
		if (!this.#isListening)
		{
			return;
		}

		this.#bus.unsubscribe(SIDE_PANEL_MESSAGE_EVENT, this.#handleMessage);
		this.#isListening = false;
	}

	/**
	 * A request that names no performed task, and a request from no form at all, is left without an
	 * answer: the queue answers about a task of the pass, and a malformed request names none.
	 *
	 * A request about a task of no pass of ours is left without an answer as well, and it has to be:
	 * an answer of any kind - the end of the queue included - tells the form it belongs to a pass, and
	 * a form outside a pass would then keep itself open to draw a next task nobody asked it for.
	 */
	#handleMessage = (event: ?Object): void => {
		const message = readSidePanelMessage(event);
		if (readEventId(message) !== NextTaskMessage.Request)
		{
			return;
		}

		const finishedTaskId = Text.toInteger(readEventData(message)?.finishedTaskId);
		const sender = Type.isFunction(message?.getSender) ? message.getSender() : null;
		if (finishedTaskId <= 0 || !sender || !this.#isOwnTask(finishedTaskId))
		{
			return;
		}

		this.#bus.post(sender, NextTaskMessage.Response, this.#answer(finishedTaskId));
	};

	#answer(finishedTaskId: number): NextTaskAnswer
	{
		const task = this.#nextTask(finishedTaskId);
		const taskId = Text.toInteger(task?.id);

		return {
			taskId: taskId > 0 ? taskId : null,
			workflowId: Type.isStringFilled(task?.workflowId) ? task.workflowId : null,
		};
	}
}

const sidePanelBus: NextTaskBus = {
	subscribe: (eventName, handler) => EventEmitter.subscribe(eventName, handler),
	unsubscribe: (eventName, handler) => EventEmitter.unsubscribe(eventName, handler),
	post: (sender, eventId, data) => BX.SidePanel.Instance.postMessage(sender, eventId, data),
};

/**
 * The message of the side panel out of what the bus handed over. The bus hands over a wrapper -
 * `new BaseEvent({ data: [message], compatData: [message] })` - and the wrapper itself carries
 * neither the identifier of the message, nor its data, nor its sender.
 */
function readSidePanelMessage(event: ?Object): ?Object
{
	const compatData = Type.isFunction(event?.getCompatData) ? event.getCompatData() : null;

	return Type.isArrayFilled(compatData) ? compatData[0] : null;
}

function readEventId(message: ?Object): ?string
{
	return Type.isFunction(message?.getEventId) ? message.getEventId() : null;
}

function readEventData(message: ?Object): ?Object
{
	const data = Type.isFunction(message?.getData) ? message.getData() : null;

	return Type.isPlainObject(data) ? data : null;
}
