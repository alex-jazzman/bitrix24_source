export const EventName = Object.freeze({
	CloseCard: 'tasks:card:close',
	CloseFullCard: 'tasks:full-card:close',
	FullCardHasChanges: 'tasks:full-card:hasChanges',
	TryCloseFullCard: 'tasks:full-card:tryClose',
	OpenFullCard: 'tasks:card:openFullCard',
	OpenCompactCard: 'tasks:card:openCompactCard',
	CardClosed: 'tasks:card:closed',
	FullCardInit: 'tasks:full-card:init',
	// The card finished loading without task data: it is deleted or unreachable, and the card shows a placeholder.
	FullCardInitFailed: 'tasks:full-card:initFailed',
	FullCardClosed: 'tasks:full-card:closed',
	TaskAdded: 'tasks:card:taskAdded',
	TaskBeforeUpdate: 'tasks:card:taskBeforeUpdate',
	TaskAfterUpdate: 'tasks:card:taskAfterUpdate',
	TaskPullUpdated: 'tasks:card:taskPullUpdated',
	TaskStageSyncFailed: 'tasks:card:taskStageSyncFailed',
	TaskStageSyncRestored: 'tasks:card:taskStageSyncRestored',
	TaskDeleted: 'tasks:card:taskDeleted',
	TemplateAdded: 'tasks:templateAdded',
	TemplateBeforeUpdate: 'tasks:templateBeforeUpdate',
	TemplateDeleted: 'tasks:templateDeleted',
	ReplicateTemplateAdded: 'tasks:replicateTemplateAdded',
	TagDeleted: 'tasks:card:tagDeleted',
	UserMenuExternalItems: 'tasks:card:userMenuExternalItems',
	OpenSliderCard: 'tasks:card:openSliderCard',
	OpenGrid: 'tasks:card:openGrid',
	ShowOverlay: 'tasks:card:showOverlay',
	HideOverlay: 'tasks:card:hideOverlay',
	AdjustPosition: 'tasks:card:adjustPosition',
	// Payload: { text, anchor? }. Without anchor (the AI path) the receiver creates a new checklist.
	AddCheckListFromText: 'tasks:card:check-list:addFromText',
	// Fires when the action finished; not emitted when the picker is cancelled without a choice.
	CheckListAddFromTextResolved: 'tasks:card:check-list:addFromTextResolved',
	CloseCheckList: 'tasks:card:check-list:close',
	OpenDeadlinePicker: 'tasks:deadline:openPicker',
	OpenResultFromChat: 'task:card:open-result-from-chat',
	RequiredResultsMissing: 'task:card:required-results-missing',
	ResultAdded: 'task:card:result-added',
	ResultSuccessfulAdded: 'task:card:result-successful-added',
	ResultSuccessfulDeleted: 'task:card:result-successful-deleted',
	ResultUpdated: 'task:card:result-updated',
	ResultFromMessageAdded: 'task:card:result-from-message-added',
	OpenPrefilledResultForm: 'task:card:open-prefilled-result-form',
	TimeTrackingChange: 'task:card:timeTackingChange',
	LegacyTasksTaskEvent: 'tasksTaskEvent',
	DescriptionConflictDetected: 'tasks:description:conflictDetected',
	HighlightCheckListItem: 'tasks:card:check-list-item:highlight',
	ShowCheckList: 'tasks:card:check-list:show',
	ShowCheckListItems: 'tasks:card:check-list-items:show',
	OpenHistory: 'tasks:full-card:openHistory',
	OpenTemplateHistory: 'tasks:template:openHistory',
	UpdateReplicateParams: 'tasks:template:update-replicate-params',
	ChatActionBeforeExecute: 'tasks:chat-action:before-execute',
	NotifyTaskTemplateUpdated: 'tasks:full-card:task-template-updated',
	NotifyTemplateCreated: 'tasks:full-card:template-created',
	ToggleReplicate: 'tasks:template:toggle-replicate',
	OpenTimeTrackingPopup: 'task:card:open-time-tracking-popup',
	CloseAllBottomSheets: 'tasks:card:close-all-bottom-sheets',
});

/**
 * Normalizes the AddCheckListFromText payload to { text, anchor } (a string becomes { text, anchor: null }).
 * Uses native typeof: const is a leaf module with no BX dependency.
 */
export function normalizeAddCheckListFromTextPayload(
	data: string | { text?: string, anchor?: ?HTMLElement },
): { text: string, anchor: ?HTMLElement }
{
	if (typeof data === 'string')
	{
		return { text: data, anchor: null };
	}

	return {
		text: data?.text ?? '',
		anchor: data?.anchor ?? null,
	};
}
