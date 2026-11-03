import { Messenger } from 'im.public';
import { RestClient } from 'rest.client';
import { Type, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { CallManager } from 'call.lib.call-manager';
import { Util } from 'call.core';
import { CompactFormLauncher } from 'calendar.compacteventform-launcher';
import { UserSharingController } from 'calendar.sharing.interface';
import { Analytics } from 'call.lib.analytics';
import { Logger } from 'call.adapter.logger';
import { Clipboard } from 'call.adapter.clipboard';

// CompactEventForm sets this namespace and emits 'onClose' when it is really closed
const COMPACT_FORM_CLOSE_EVENT = 'BX.Calendar.CompactEventForm:onClose';

export class SyncPageService
{
	#actionMap;
	#isStarting = false;
	#isOpeningMeetingForm = false;
	#isOpeningFreeSlots = false;
	#meetingFormLauncher = null;
	#meetingFormCloseSubscribed = false;

	constructor()
	{
		this.#actionMap = {
			'start-call': () => this.#handleStartCall(),
			'join-meeting': () => this.#handleJoinMeeting(),
			'schedule-meeting': () => this.#handleScheduleMeeting(),
			'free-slots': () => this.#handleFreeSlots(),
		};
	}

	handleBlockAction(blockType)
	{
		// blockType comes from the page's own controlled action types, so an unknown value
		// cannot reach production — silent no-op, no log noise
		this.#actionMap[blockType]?.();
	}

	async #handleStartCall()
	{
		Analytics.getInstance().sync.onStartCallClick();

		if (this.#isStarting)
		{
			return;
		}

		this.#isStarting = true;

		try
		{
			const restClient = new RestClient();
			// Fire the request once; the same response promise feeds both the clipboard copy
			// and the call flow, so the chat is created only once.
			const responsePromise = restClient.callMethod('call.Call.createChatForCall', {});

			// Start copying synchronously, before any await: Safari only allows a clipboard
			// write while the click's user activation is alive, and that activation is lost
			// after the first awaited network round-trip. The guest link is handed over as a
			// promise so the write begins now and resolves once the response arrives.
			const copyResultPromise = this.#copyGuestLink(
				responsePromise.then((response) => response.data().guestLink),
			);

			const response = await responsePromise;
			const { dialogId, token: callToken } = response.data();

			if (!Type.isStringFilled(dialogId) || !/^chat\d+$/.test(dialogId))
			{
				this.#notifyStartCallError();

				return;
			}

			await Messenger.openChat(dialogId);

			const callManager = CallManager.getInstance();
			callManager.setNextCallOptions({
				invitePeriod: Util.getSyncCallInvitePeriod(),
				callToken,
			});

			callManager.startCall(dialogId, true);

			// Report the copy result only after the call actually starts, so a copy failure
			// is not masked by an early "link copied" toast.
			this.#notifyGuestLinkCopyResult(await copyResultPromise);
		}
		catch (error)
		{
			Logger.error('SyncPage: failed to start call', error);
			this.#notifyStartCallError();
		}
		finally
		{
			this.#isStarting = false;
		}
	}

	async #copyGuestLink(guestLinkPromise)
	{
		let hadLink = false;

		try
		{
			await Clipboard.copyFromPromise(
				guestLinkPromise.then((guestLink) =>
				{
					hadLink = Type.isStringFilled(guestLink);
					if (!hadLink)
					{
						Logger.warn('SyncPage: guest link is empty, skipping copy');

						throw new Error('SyncPage: guest link is empty');
					}

					return guestLink;
				}),
			);

			return 'copied';
		}
		catch
		{
			// An empty link or a failed create-chat request is not a clipboard failure:
			// stay silent (the start-call error is surfaced by the caller). Only a genuine
			// clipboard rejection with a real link is reported as a copy error.
			return hadLink ? 'failed' : 'empty';
		}
	}

	#notifyGuestLinkCopyResult(result)
	{
		if (result === 'copied')
		{
			this.#notifyGuestLinkCopied();

			return;
		}

		if (result === 'failed')
		{
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('CALL_SYNC_PAGE_GUEST_LINK_COPY_ERROR'),
				autoHideDelay: 5000,
			});
		}
	}

	#notifyGuestLinkCopied()
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('CALL_SYNC_PAGE_GUEST_LINK_COPIED'),
			autoHideDelay: 5000,
			useAirDesign: true,
		});
	}

	#notifyStartCallError()
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('CALL_SYNC_PAGE_START_CALL_ERROR'),
			autoHideDelay: 5000,
		});
	}

	#notifyScheduleMeetingError()
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('CALL_SYNC_PAGE_SCHEDULE_MEETING_ERROR'),
			autoHideDelay: 5000,
		});
	}

	#notifyFreeSlotsError()
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('CALL_SYNC_PAGE_FREE_SLOTS_ERROR'),
			autoHideDelay: 5000,
		});
	}

	#handleJoinMeeting()
	{
		// the component opens the join popup itself (local UI state); the service only reports analytics
		Analytics.getInstance().sync.onJoinClick();
	}

	async #handleScheduleMeeting()
	{
		Analytics.getInstance().sync.onCreateEventClick();

		if (!CompactFormLauncher)
		{
			Logger.error('SyncPage: CompactFormLauncher is not available');

			return;
		}

		// the guard is held until the form is actually closed, not just until it opens:
		// re-showing the reused launcher would destroy the open form's unsaved input,
		// bypassing its own "discard changes?" confirmation
		if (this.#isOpeningMeetingForm)
		{
			return;
		}

		this.#isOpeningMeetingForm = true;
		this.#subscribeMeetingFormClose();

		try
		{
			// a single launcher reuses its own form, so a repeated show replaces the popup
			// instead of stacking an independent one
			this.#meetingFormLauncher ??= new CompactFormLauncher();

			await this.#meetingFormLauncher.showNewEventForm({
				eventType: '#call_sync#',
			});

			// the form stays open now; the guard is released by the form's close event
		}
		catch (error)
		{
			Logger.error('SyncPage: failed to open schedule meeting form', error);
			this.#notifyScheduleMeetingError();
			// the form never opened, so no close event will arrive to release the guard
			this.#isOpeningMeetingForm = false;
		}
	}

	#subscribeMeetingFormClose()
	{
		if (this.#meetingFormCloseSubscribed)
		{
			return;
		}

		this.#meetingFormCloseSubscribed = true;

		EventEmitter.subscribe(COMPACT_FORM_CLOSE_EVENT, () =>
		{
			this.#isOpeningMeetingForm = false;
		});
	}

	async #handleFreeSlots()
	{
		Analytics.getInstance().sync.onOpenSlotsClick();

		if (!UserSharingController)
		{
			Logger.error('SyncPage: UserSharingController is not available');

			return;
		}

		const userId = Number(Loc.getMessage('USER_ID'));

		if (!Number.isInteger(userId) || userId <= 0)
		{
			Logger.warn('SyncPage: USER_ID is not a valid positive integer', userId);

			return;
		}

		if (this.#isOpeningFreeSlots)
		{
			return;
		}

		this.#isOpeningFreeSlots = true;

		try
		{
			const userSharing = await UserSharingController.getUserSharing(userId);

			userSharing.openDialog();
		}
		catch (error)
		{
			Logger.warn('SyncPage: failed to open free slots dialog', error);
			this.#notifyFreeSlotsError();
		}
		finally
		{
			this.#isOpeningFreeSlots = false;
		}
	}
}
