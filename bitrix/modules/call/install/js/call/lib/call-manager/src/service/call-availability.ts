import { Feature, FeatureManager } from 'im.v2.lib.feature';

import type { ImStore } from '../adapter/im-store';
import type { CallCapabilities } from 'call.engine.registry';

type ConferenceCheck = { isConference: (dialogId: string) => boolean };

export class CallAvailability
{
	#store: ImStore;
	#conference: ConferenceCheck;
	#capabilities: CallCapabilities;
	#userTypes: { bot: string };

	constructor(store: ImStore, conference: ConferenceCheck, capabilities: CallCapabilities, userTypes: { bot: string })
	{
		this.#store = store;
		this.#conference = conference;
		this.#capabilities = capabilities;
		this.#userTypes = userTypes;
	}

	getCallUserLimit(): number
	{
		return this.#capabilities.getUserLimit();
	}

	chatCanBeCalled(dialogId: string): boolean
	{
		return this.#checkCallSupport(dialogId) && !this.#store.hasActiveCall(dialogId);
	}

	hasActiveCurrentCall(dialogId: string, currentDialogId: string): boolean
	{
		return this.#store.hasActiveCall(dialogId) && currentDialogId === dialogId;
	}

	hasActiveAnotherCall(dialogId: string, currentDialogId: string): boolean
	{
		return this.#store.hasActiveCall() && !this.hasActiveCurrentCall(dialogId, currentDialogId);
	}

	hasActiveCallInDialog(dialogId: string): boolean
	{
		return Boolean(this.#store.getRecentCallByDialog(dialogId));
	}

	isChatUserLimitExceeded(dialogId: string): boolean
	{
		return this.#getChatUserCounter(dialogId) > this.getCallUserLimit();
	}

	#getChatUserCounter(dialogId: string): number
	{
		return this.#store.getChat(dialogId, true).userCounter;
	}

	#checkCallSupport(dialogId: string): boolean
	{
		const userId = Number(dialogId);

		if (!this.#checkGuestCallSupport(userId > 0))
		{
			return false;
		}

		if (!this.#capabilities.isWebRTCSupported())
		{
			return false;
		}

		return userId > 0 ? this.#checkUserCallSupport(userId) : this.#checkChatCallSupport(dialogId);
	}

	/**
	 * A guest starts a call while the portal allows it - and at a bare user id, which is a one-to-one
	 * dialogue, only while the scheme serving that shape allows it too: the classic one refuses a guest
	 * there whatever the portal says. Hence two answers rather than one; both are computed by the server.
	 */
	#checkGuestCallSupport(isPrivateTarget: boolean): boolean
	{
		if (!this.#store.isGuest(this.#store.getCurrentUserId()))
		{
			return true;
		}

		return FeatureManager.isFeatureAvailable(
			isPrivateTarget ? Feature.isGuestOutgoingPrivateCallAvailable : Feature.isGuestOutgoingCallAvailable,
		);
	}

	#checkUserCallSupport(userId: number): boolean
	{
		const user = this.#store.getUser(userId);
		const isBot = user.type === this.#userTypes.bot;

		return Boolean(
			user
			&& user.status !== 'guest'
			&& !isBot
			&& !user.network
			&& user.id !== this.#store.getCurrentUserId()
			&& Boolean(user.lastActivityDate),
		);
	}

	#checkChatCallSupport(dialogId: string): boolean
	{
		const userCounter = this.#getChatUserCounter(dialogId);

		return (userCounter > 1 || this.#conference.isConference(dialogId)) && userCounter <= this.getCallUserLimit();
	}
}
