import { Loc, Text, Type } from 'main.core';
import { LiveAnnouncer, type AriaLivePoliteness } from 'ui.a11y';

import { ErrorCode } from 'im.v2.const';
import { type CallBatchError, type RunActionError } from 'im.v2.lib.rest';

import { showNotification, type NotificationAction } from '../utils/notification';

const EDIT_ERROR_NOTIFICATION_ID = 'im-message-edit-error';
const AI_TASK_REFUSAL_NOTIFICATION_ID = 'im-message-ai-task-refusal';

type AiTaskRefusal = {
	code?: string | number,
	messageCount?: number,
};

type AiTaskRefusalPresentation = {
	single: string,
	multiple: string,
	politeness: AriaLivePoliteness,
};

/**
 * Refusals of the creation request that name a cause the user can do something about, and therefore
 * get a phrase of their own instead of the general failure. A busy slot is a state of the chat and
 * not a fault of the request, so it is announced politely; an unusable source is the answer to what
 * was asked for and keeps the assertive tone of a failure.
 */
const AI_TASK_REFUSALS: Map<string, AiTaskRefusalPresentation> = new Map([
	[ErrorCode.aiTask.creationInProgress, {
		single: 'IM_NOTIFIER_MESSAGE_AI_TASK_ALREADY_CREATING',
		multiple: 'IM_NOTIFIER_MESSAGE_AI_TASK_ALREADY_CREATING_MULTIPLE',
		politeness: 'polite',
	}],
	[ErrorCode.aiTask.sourceNotSupported, {
		single: 'IM_NOTIFIER_MESSAGE_AI_TASK_SOURCE_NOT_SUPPORTED',
		multiple: 'IM_NOTIFIER_MESSAGE_AI_TASK_SOURCE_NOT_SUPPORTED_MULTIPLE',
		politeness: 'assertive',
	}],
]);

export const MessageNotifier = {
	onCopyComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_COPY_COMPLETE'));
	},

	onCopyLinkComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_LINK_COPY_COMPLETE'));
	},

	onAddToFavoriteComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_FAVORITE_ADD_COMPLETE'));
	},

	onForwardComplete(messagesIds: number[], openChat: () => void): void
	{
		const text = messagesIds.length > 1
			? Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_SEVERAL_MESSAGES_COMPLETE')
			: Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_COMPLETE');

		const openChatAction: NotificationAction = {
			title: Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_OPEN_COMPLETE'),
			events: {
				click: openChat,
			},
		};

		showNotification(text, {
			actions: [openChatAction],
		});
	},

	onSelectMainReaction(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_SELECT_MAIN_REACTION_COMPLETE'));
	},

	handleLoadContextError(error: CallBatchError): void
	{
		if (error.code === ErrorCode.message.notFound)
		{
			this.onNotFoundError();
		}
	},

	onNotFoundError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CONTEXT_MESSAGE_NOT_FOUND_ERROR'));
	},

	onSelectLimitError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_SELECT_LIMIT_ERROR'));
	},

	onAiTaskCreateError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_AI_TASK_CREATE_ERROR'));
	},

	/**
	 * The creation request itself was refused, so no indication was ever raised: this balloon is the
	 * whole outcome of the attempt, and the two refusals that name a cause say it instead of the
	 * general failure. A code this client does not know keeps that general failure untouched.
	 *
	 * A named refusal is also announced - the balloon carries no live region, and here there is no
	 * frame on the message to speak for it - and shown under a stable id: the slot of a chat stays
	 * busy for hours, so a repeated attempt replaces the balloon instead of stacking a copy of it.
	 * The announcement is what keeps a repeat perceivable all the same.
	 */
	onAiTaskCreateRefusal(refusal: ?AiTaskRefusal): void
	{
		const presentation: ?AiTaskRefusalPresentation = AI_TASK_REFUSALS.get(refusal?.code);
		if (!presentation)
		{
			this.onAiTaskCreateError();

			return;
		}

		const text = Loc.getMessage(refusal.messageCount > 1 ? presentation.multiple : presentation.single);

		showNotification(text, { id: AI_TASK_REFUSAL_NOTIFICATION_ID });
		LiveAnnouncer.announce(text, presentation.politeness);
	},

	onEditError(reason: ?RunActionError): void
	{
		const text = Type.isStringFilled(reason?.message)
			? reason.message
			: Loc.getMessage('IM_NOTIFIER_DEFAULT_ERROR');

		// the reason comes from the response and reaches the balloon as raw html, so it is encoded;
		// the stable id keeps repeated failures from stacking up as identical notifications
		showNotification(Text.encode(text), { id: EDIT_ERROR_NOTIFICATION_ID });
		// the balloon is no live region, and the stable id leaves a repeated failure without any
		// signal at all, so every failure is announced on its own
		LiveAnnouncer.announce(text, 'assertive');
	},
};
