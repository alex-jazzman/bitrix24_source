/**
 * Statuses and content types of the "AI task from messages" flow. Single source of truth
 * shared by im.v2.model (ai-task) and im.v2.provider.pull, so the client union cannot drift
 * from the backend.
 *
 * Backend counterparts:
 * - statuses: Bitrix\Im\V2\Integration\AI\TaskCreation\Status (enum Status: string)
 * - content types: Bitrix\Im\V2\Pull\Event\AutoTaskStatus::getMessageType()
 */
export const AiTaskStatus = Object.freeze({
	search: 'search',
	taskCreationStarted: 'taskCreationStarted',
	taskCreationCompleted: 'taskCreationCompleted',
	resultCreationStarted: 'resultCreationStarted',
	resultCreationCompleted: 'resultCreationCompleted',
	notFound: 'notFound',
});

export type AiTaskStatusValue = $Values<typeof AiTaskStatus>;

export const AiTaskContentType = Object.freeze({
	voiceNote: 'voiceNote',
	videoNote: 'videoNote',
	message: 'message',
});

export type AiTaskContentTypeValue = $Values<typeof AiTaskContentType>;
