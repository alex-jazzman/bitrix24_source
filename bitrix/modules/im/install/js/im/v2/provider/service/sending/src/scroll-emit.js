import { EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { ChatType, EventType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

/**
 * Mirrors the canonical scroll-pin policy (im.v2.component.dialog.chat/scroll-pin-policy).
 * Kept here inline because the sending service cannot import the dialog.chat extension
 * without creating a dependency cycle (dialog.chat -> entity-selector -> sending).
 */
export function isQuestionPinApplicable(dialogId: string): boolean
{
	if (
		!FeatureManager.isFeatureAvailable(Feature.isBitrixGptScrollPinAvailable)
		|| !FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
	)
	{
		return false;
	}

	const dialog: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	return dialog?.type === ChatType.copilot;
}

/**
 * Starts pinning of a just-sent question for applicable chats (EVENT-01).
 * Returns whether the pin event was emitted, so callers can fall back to the
 * legacy scroll-to-bottom for non-applicable chats.
 *
 * Contract: only genuine send/retry paths call this. A future answer-regeneration
 * method must NOT emit pinQuestion — a regenerated answer is not a question.
 */
export function emitQuestionPin(params: { dialogId: string, messageId: number | string }): boolean
{
	const { dialogId, messageId } = params;
	if (!isQuestionPinApplicable(dialogId))
	{
		return false;
	}

	EventEmitter.emit(EventType.dialog.pinQuestion, { dialogId, messageId });

	return true;
}
