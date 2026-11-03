import { type AriaLivePoliteness } from 'ui.a11y';
import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { AiTaskStatus, type AiTaskStatusValue } from 'im.v2.const';
import { type AiTaskOperation, type ImModelMessage } from 'im.v2.model';

/**
 * The model side of the indication, shared by the layer around the message and the caption row.
 * The two are mounted by different hosts (the layer by `BaseMessage` inside the body, the caption
 * of a bubble by `DefaultMessageContent` inside the time row), so the frame table cannot live in
 * either of them without one importing the other.
 */

/**
 * Shape of the indication around the message. `BaseMessage` picks the value from the signs it
 * already has: a bubble with a background, edge-to-edge media (a transparent body) or the round
 * player of a video note.
 */
export const AiTaskIndicationLayout = Object.freeze({
	bubble: 'bubble',
	media: 'media',
	round: 'round',
	// The value differs from the key so the modifier it builds stays a plain BEM one (`--media-caption`).
	mediaCaption: 'media-caption',
});

export type AiTaskIndicationLayoutValue = (typeof AiTaskIndicationLayout)[keyof typeof AiTaskIndicationLayout];

/**
 * The one place the placement rule is written. A bubble already has a row of its own for the time
 * and the delivery ticks, and the caption joins it there; media and the round player have no such
 * row and carry a plate under the graphics instead. A frame with a caption keeps a bubble around
 * itself, so it owns such a row as well.
 */
export function isAiTaskStatusInTimeRow(layout: AiTaskIndicationLayoutValue | null): boolean
{
	return layout === AiTaskIndicationLayout.bubble || layout === AiTaskIndicationLayout.mediaCaption;
}

/**
 * Injection key of the placement contract. The host of the message provides the layout of the
 * running indication (`null` when there is none), and the content of the message reads it to know
 * whether the caption belongs in its own time row. A prop cannot carry it: the content is slotted
 * into the host, so the host never renders it and has nothing to pass it through.
 */
export const AiTaskIndicationLayoutKey = 'imAiTaskIndicationLayout';

const Tone = Object.freeze({
	ai: 'ai',
	warning: 'warning',
	alert: 'alert',
});

export type AiTaskFrame = {
	name: string,
	matches: (operation: AiTaskOperation) => boolean,
	labelKey: string,
	icon: string,
	tone: string,
	isTerminal: boolean,
	extinguishesDecor: boolean,
	politeness: AriaLivePoliteness,
};

// The stages that share the caption of the creation. `resultCreationCompleted` is not one of them,
// however much its name reads like a stage: it is the END of an operation whose result went into a
// task that already existed, and the server sends nothing after it
// (`TranscribedResultHandler::handle()`). Its own terminal frame stands below.
const CREATING_STATUSES: Set<AiTaskStatusValue | null> = new Set([
	AiTaskStatus.taskCreationStarted,
	AiTaskStatus.resultCreationStarted,
]);

/**
 * Frames of the indication (SDD TPL-02) in table order: the frame is the first row whose
 * condition holds. An unknown status matches nothing and paints no frame at all, which is safer
 * than guessing one.
 */
const FRAMES: readonly AiTaskFrame[] = Object.freeze([
	{
		name: 'preparing',
		// `null` is the local start: the operation exists, but no pull event has arrived yet.
		matches: (operation: AiTaskOperation): boolean => operation.status === null,
		labelKey: 'IM_MESSAGE_AI_TASK_PREPARING',
		icon: OutlineIcons.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		name: 'analyzing',
		matches: (operation: AiTaskOperation): boolean => operation.status === AiTaskStatus.search,
		labelKey: 'IM_MESSAGE_AI_TASK_ANALYZING',
		icon: OutlineIcons.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		name: 'creating',
		matches: (operation: AiTaskOperation): boolean => CREATING_STATUSES.has(operation.status),
		labelKey: 'IM_MESSAGE_AI_TASK_CREATING',
		icon: OutlineIcons.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		name: 'created',
		// A success without the partial flag. The flag is a boolean on the operation, but a missing
		// one is read as a plain success here as well, so a terminal status always has a frame.
		matches: (operation: AiTaskOperation): boolean => {
			return operation.status === AiTaskStatus.taskCreationCompleted && !operation.isPartial;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_CREATED',
		icon: OutlineIcons.AI_STARS,
		tone: Tone.ai,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		// Reached only with the partial flag raised: the row above takes every plain success.
		name: 'partial',
		matches: (operation: AiTaskOperation): boolean => {
			return operation.status === AiTaskStatus.taskCreationCompleted;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_CREATED_PARTIAL',
		icon: OutlineIcons.EXCLAMATION_CIRCLE,
		tone: Tone.warning,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		// The other successful end: the AI read the messages as a result of a task that already
		// exists, so nothing was created and the result was appended to that task. "Created" would be
		// wrong here - the task was there before the operation started - which is why the outcome has
		// a caption of its own, the same one the mobile client shows.
		// The name is kebab-case because it becomes a `data-testid` below, like every other frame.
		name: 'result-added',
		matches: (operation: AiTaskOperation): boolean => {
			return operation.status === AiTaskStatus.resultCreationCompleted;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_RESULT_ADDED',
		icon: OutlineIcons.AI_STARS,
		tone: Tone.ai,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite',
	},
	{
		name: 'error',
		matches: (operation: AiTaskOperation): boolean => operation.status === AiTaskStatus.notFound,
		labelKey: 'IM_MESSAGE_AI_TASK_ERROR',
		icon: OutlineIcons.ALERT,
		tone: Tone.alert,
		isTerminal: true,
		// The only frame that reverses the order of the change: the rim and the haze go out first
		// and the caption materializes in the freed slot afterwards.
		extinguishesDecor: true,
		politeness: 'assertive',
	},
]);

/**
 * Only progressive stages share the caption cell: a terminal frame enters that cell on its own,
 * so the width invariant of the running sequence is not extended to it.
 */
export const PROGRESSIVE_FRAMES: readonly AiTaskFrame[] = FRAMES.filter((frame: AiTaskFrame) => !frame.isTerminal);

export function findAiTaskFrame(operation: AiTaskOperation | null): AiTaskFrame | null
{
	if (!operation)
	{
		return null;
	}

	return FRAMES.find((frame: AiTaskFrame) => frame.matches(operation)) ?? null;
}

export type AiTaskOperationSource = {
	getters: {
		'aiTask/getForChat': (chatId: number) => AiTaskOperation | null,
	},
};

export function getAiTaskOperation(store: AiTaskOperationSource, message: ImModelMessage): AiTaskOperation | null
{
	// `message.chatId`, not a `chats/get(dialogId)` lookup: the indication is mounted on every
	// message of the list, so a chat search per message is not affordable.
	const operation: AiTaskOperation | null = store.getters['aiTask/getForChat'](message.chatId);
	if (!operation)
	{
		return null;
	}

	// `message.id` is `string | number`: a message still being sent carries a temporary string id
	// and can never be a source of a running operation, so such an id simply does not match.
	const indicatedIds: readonly (string | number)[] = operation.indicatedMessageIds;

	return indicatedIds.includes(message.id) ? operation : null;
}

/**
 * Gate for the `v-if` in `BaseMessage`: costs a single collection lookup and answers `false`
 * right there when the chat has no operation. Exported so the membership rule (the message is
 * one of the indicated sources) lives in one place only.
 */
export function hasAiTaskIndication(store: AiTaskOperationSource, message: ImModelMessage): boolean
{
	return getAiTaskOperation(store, message) !== null;
}

/**
 * The one message of the set that carries the caption, reports its visibility and speaks for the
 * operation.
 */
export function isAiTaskCaptionPlace(operation: AiTaskOperation | null, message: ImModelMessage): boolean
{
	return operation?.captionMessageId === message.id;
}
