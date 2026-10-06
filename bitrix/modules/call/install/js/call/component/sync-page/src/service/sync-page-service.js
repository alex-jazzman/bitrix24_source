import { Messenger } from 'im.public';
import { RestClient } from 'rest.client';
import { Type, Loc, ajax } from 'main.core';
import { CallManager } from 'call.lib.call-manager';
import { Util } from 'call.core';
import { CompactFormLauncher } from 'calendar.compacteventform-launcher';
import { UserSharingController } from 'calendar.sharing.interface';
import { Analytics } from 'call.lib.analytics';
import { Logger } from 'call.adapter.logger';
import { Clipboard } from 'call.adapter.clipboard';
import { BannerDispatcher } from 'ui.banner-dispatcher';

const SYNC_PROMO_ID = 'call:sync-promo-popup:05052026:all';

// give the banner dispatcher a pause before it shows the next queued banner
const PROMO_QUEUE_RELEASE_DELAY_MS = 1000;

export class SyncPageService
{
	#actionMap;
	#isStarting = false;
	#promoOnDone = null;
	#promoViewedSent = false;
	#promoQueued = false;

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

	#handleJoinMeeting()
	{
		// the component opens the join popup itself (local UI state); the service only reports analytics
		Analytics.getInstance().sync.onJoinClick();
	}

	#handleScheduleMeeting()
	{
		Analytics.getInstance().sync.onCreateEventClick();

		if (!CompactFormLauncher)
		{
			Logger.error('SyncPage: CompactFormLauncher is not available');

			return;
		}

		const form = new CompactFormLauncher();

		void form.showNewEventForm({
			eventType: '#call_sync#',
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

		try
		{
			const userSharing = await UserSharingController.getUserSharing(userId);

			userSharing.openDialog();
		}
		catch (error)
		{
			Logger.warn('SyncPage: failed to open free slots dialog', error);
		}
	}

	async initPromo(showCallback)
	{
		if (this.#promoQueued)
		{
			return;
		}

		const isActive = await this.#isPromoActive();
		if (!isActive)
		{
			return;
		}

		this.#promoQueued = true;

		BannerDispatcher.high.toQueue((onDone) =>
		{
			this.#promoOnDone = onDone;
			showCallback();
		});
	}

	closePromo()
	{
		// the popup emits 'close' twice on button close (component + container unmount):
		// mark the promo as viewed only once per show
		if (!this.#promoViewedSent)
		{
			this.#promoViewedSent = true;
			void this.#markPromoViewed();
		}

		if (this.#promoOnDone)
		{
			const onDone = this.#promoOnDone;
			this.#promoOnDone = null;
			setTimeout(onDone, PROMO_QUEUE_RELEASE_DELAY_MS);
		}
	}

	async #isPromoActive()
	{
		try
		{
			const response = await ajax.runAction('im.v2.Promotion.listActive', {
				data: { type: 'web' },
			});
			const list = response?.data ?? [];

			return list.some((promo) => promo?.id === SYNC_PROMO_ID);
		}
		catch (error)
		{
			Logger.error('SyncPage: failed to check promo status', error);

			return false;
		}
	}

	#markPromoViewed()
	{
		return ajax.runAction('im.v2.Promotion.read', {
			data: { id: SYNC_PROMO_ID },
		}).catch((error) =>
		{
			Logger.error('SyncPage: failed to mark promo as viewed', error);
		});
	}
}
