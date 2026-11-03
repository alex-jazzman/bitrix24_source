import { Extension } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { Button as UiButton, ButtonSize as UiButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { hint } from 'ui.vue3.directives.hint';

import { Core } from 'im.v2.application.core';
import { ChatButton, ButtonSize, ButtonIcon, ButtonColor } from 'im.v2.component.elements.button';
import { ForwardPopup } from 'im.v2.component.entity-selector';
import { ActionByRole, ChatType, EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { showDeleteMessagesConfirm } from 'im.v2.lib.confirm';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelChat } from 'im.v2.model';
import { AiTaskService } from 'im.v2.provider.service.ai-task';
import { MessageService } from 'im.v2.provider.service.message';

import '../css/bulk-actions-panel.css';

// @vue/component
export const BulkActionsPanel = {
	name: 'BulkActionsPanel',
	components: { ChatButton, UiButton, ForwardPopup },
	directives: { hint },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			showForwardPopup: false,
			messagesIds: [],
			isAiTaskStarting: false,
		};
	},
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonIcon: () => ButtonIcon,
		ButtonColor: () => ButtonColor,
		UiButtonSize: () => UiButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		selectedMessages(): Set<number>
		{
			return this.$store.getters['messages/select/getCollection'](this.dialogId);
		},
		messagesAuthorId(): number[]
		{
			return [...this.selectedMessages].map((messageId) => {
				return this.$store.getters['messages/getById'](messageId).authorId;
			});
		},
		hasOthersMessages(): boolean
		{
			const userId = Core.getUserId();

			return this.messagesAuthorId.some((authorId) => authorId !== userId);
		},
		hasOwnMessages(): boolean
		{
			return this.messagesAuthorId.includes(Core.getUserId());
		},
		canDeleteMessage(): boolean
		{
			if (this.selectedMessagesSize === 0)
			{
				return false;
			}

			const permissionManager = PermissionManager.getInstance();
			const canDeleteOwn = !this.hasOwnMessages || permissionManager.canPerformActionByRole(
				ActionByRole.deleteOwnMessage,
				this.dialogId,
			);
			const canDeleteOthers = !this.hasOthersMessages || permissionManager.canPerformActionByRole(
				ActionByRole.deleteOthersMessage,
				this.dialogId,
			);

			return canDeleteOwn && canDeleteOthers;
		},
		selectedMessagesSize(): number
		{
			return this.selectedMessages.size;
		},
		formattedMessagesCounter(): string
		{
			if (!this.selectedMessagesSize)
			{
				return '';
			}

			return `(${this.selectedMessagesSize})`;
		},
		isBlockedDeletion(): boolean
		{
			return this.selectedMessagesSize > 0 && !this.canDeleteMessage;
		},
		isCopilotChat(): boolean
		{
			return this.dialog.type === ChatType.copilot;
		},
		// The shared multi-action limit, fed by MessageService::getMultipleActionMessageLimit();
		// Task::createByAiAction() refuses an oversized selection by that same method, so the caption
		// and the server cannot disagree. The fallback repeats the constant and has to move with it.
		bulkActionMessageLimit(): number
		{
			const settings = Extension.getSettings('im.v2.component.message-list');

			return settings.get('multipleActionMessageLimit', 20);
		},
		canCreateAiTask(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAiTaskFromMessageAvailable);
		},
		isAiTaskDisabled(): boolean
		{
			return !this.selectedMessagesSize || this.selectedMessagesSize > this.bulkActionMessageLimit;
		},
		isAiTaskOverLimit(): boolean
		{
			return this.selectedMessagesSize > this.bulkActionMessageLimit;
		},
		aiTaskButtonLabel(): string
		{
			if (this.isAiTaskOverLimit)
			{
				return this.loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_LIMIT', {
					'#LIMIT#': this.bulkActionMessageLimit,
				});
			}

			return this.loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_MSGVER_1');
		},
		messageCounterText(): string
		{
			if (!this.selectedMessagesSize)
			{
				return this.loc('IM_CONTENT_BULK_ACTIONS_SELECT_MESSAGES');
			}

			return this.loc('IM_CONTENT_BULK_ACTIONS_COUNT_MESSAGES');
		},
		confirmTitle(): string
		{
			return this.loc('IM_CONTENT_BULK_ACTIONS_CONFIRM_TITLE', { '#COUNT#': this.selectedMessagesSize });
		},
		tooltipSettings(): { text: string, popupOptions: Object<string, any> }
		{
			return {
				text: this.loc('IM_CONTENT_BULK_ACTIONS_DELETE_NOT_CAN_DELETE'),
				popupOptions: {
					angle: true,
					targetContainer: document.body,
					offsetTop: -13,
					offsetLeft: 65,
					bindOptions: {
						position: 'top',
					},
				},
			};
		},
	},
	methods:
	{
		onForwardButtonClick()
		{
			Analytics.getInstance().messageForward.onClickForward(this.dialogId);
			this.messagesIds = [...this.selectedMessages];
			this.showForwardPopup = true;
		},
		closeForwardPopup()
		{
			this.messagesIds = [];
			this.showForwardPopup = false;
		},
		async onCreateAiTaskButtonClick(): Promise<void>
		{
			// Waiting does not lock the button for good: a selection emptied and refilled meanwhile
			// re-applies `disabled` over the waiting state and lets a tap through before the answer.
			if (this.isAiTaskStarting)
			{
				return;
			}

			Analytics.getInstance().bulkActionsPanel.onCreateAiTask(this.dialogId);

			const messageIds = [...this.selectedMessages];
			const chatId = this.dialog.chatId;
			// Anchor = newest (max id) selected message. Must match the backend, which reports every
			// pull status of a multiselect against this same anchor — see
			// Bitrix\Im\V2\Integration\AI\TaskCreation\MultipleMessagesCreator::resolveAnchorMessageId()
			// ((int)max($messageIds)). Non-numeric ids (e.g. unsent temp-id messages) are filtered out,
			// otherwise Math.max would yield NaN and the panel would never correlate a pull status.
			const numericMessageIds = messageIds.filter((id) => this.$store.getters['messages/isRealMessage'](id));
			if (numericMessageIds.length === 0)
			{
				// With no numeric anchor Math.max() returns -Infinity, which slips through the NaN-guards
				// downstream and spawns a dead operation that never correlates a pull status.
				this.closeBulkActionsMode();

				return;
			}

			const anchorMessageId = Math.max(...numericMessageIds);
			this.isAiTaskStarting = true;
			try
			{
				const started = await (new AiTaskService()).createForMessages(numericMessageIds, {
					chatId,
					anchorMessageId,
				});
				// Closing the mode drops the selection, and a selection holds up to twenty messages a user
				// picked one by one. A refused start leaves nothing behind to make that worth it: the reason
				// is shown, and the very same selection is what the user needs to try again with.
				if (started)
				{
					this.closeBulkActionsMode();
				}
			}
			finally
			{
				this.isAiTaskStarting = false;
			}
		},
		async onDeleteButtonClick(): Promise<boolean>
		{
			const confirmResult = await showDeleteMessagesConfirm(this.confirmTitle);

			if (!confirmResult)
			{
				return false;
			}

			this.getMessageService().deleteMessages([...this.selectedMessages]);
			this.closeBulkActionsMode();

			return true;
		},
		closeBulkActionsMode()
		{
			this.getEmitter().emit(EventType.dialog.closeBulkActionsMode, {
				dialogId: this.dialogId,
			});
		},
		getMessageService(): MessageService
		{
			if (!this.messageService)
			{
				this.messageService = new MessageService({ chatId: this.dialog.chatId });
			}

			return this.messageService;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-content-bulk-actions-panel">
			<div class="bx-im-content-bulk-actions-panel__container">
				<div class="bx-im-content-bulk-actions-panel__left-section">
					<div @click="closeBulkActionsMode" class="bx-im-content-bulk-actions-panel__cancel"></div>
					<div class="bx-im-content-bulk-actions-panel__counter-container">
						<span class="bx-im-content-bulk-actions-panel__counter-name">{{ messageCounterText }}</span>
						<span class="bx-im-content-bulk-actions-panel__counter-number">{{ formattedMessagesCounter }}</span>
					</div>
				</div>
				<div class="bx-im-content-bulk-actions-panel__right-section">
					<div v-if="!isCopilotChat" class="bx-im-content-bulk-actions-panel__delete-button">
						<div
							v-if="isBlockedDeletion"
							v-hint="tooltipSettings"
							class="bx-im-content-bulk-actions-panel__tooltip"
						>
						</div>
						<ChatButton
							:size="ButtonSize.L"
							:icon="ButtonIcon.Delete"
							:color="ButtonColor.Delete"
							:isDisabled="!selectedMessagesSize || isBlockedDeletion"
							:isRounded="true"
							:isUppercase="false"
							:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_DELETE')"
							@click="onDeleteButtonClick"
						/>
					</div>
					<UiButton
						v-if="canCreateAiTask"
						:size="UiButtonSize.MEDIUM"
						:style="AirButtonStyle.TINTED_BITRIX_GPT"
						:disabled="isAiTaskDisabled"
						:loading="isAiTaskStarting"
						:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_MSGVER_1')"
						:aria-label="aiTaskButtonLabel"
						:aria-disabled="isAiTaskDisabled ? 'true' : 'false'"
						:title="isAiTaskOverLimit ? aiTaskButtonLabel : null"
						data-testid="bulk-actions-panel-ai-task-btn"
						@click="onCreateAiTaskButtonClick"
					/>
					<ChatButton
						:size="ButtonSize.L"
						:icon="ButtonIcon.Forward"
						:color="ButtonColor.Forward"
						:isRounded="true"
						:isUppercase="false"
						:isDisabled="!selectedMessagesSize"
						:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_FORWARD')"
						@click="onForwardButtonClick"
					/>
				</div>
				<ForwardPopup
					v-if="showForwardPopup"
					:messagesIds="messagesIds"
					:dialogId="dialogId"
					@close="closeForwardPopup"
				/>
			</div>
		</div>
	`,
};
