import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

/**
 * Canonical applicability rule for the BitrixGPT scroll-pin behaviour.
 * A dialog qualifies only when it is a Copilot chat and both server feature
 * flags are on. This is the single source of truth for the controller; the
 * sending service mirrors the same predicate inline (it cannot import this
 * extension without introducing a dependency cycle).
 */
export function isScrollPinApplicable(dialogId: string): boolean
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
