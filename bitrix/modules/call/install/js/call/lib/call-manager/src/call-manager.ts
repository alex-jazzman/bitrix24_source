// @ts-ignore
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import 'im_call_compatible';
import { type JsonObject, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { RecentCallStatus, Layout, EventType, ChatType, UserType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelUser } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { ConferenceChannel } from 'call.application.conference-channel';
import { EventType as CallEventType } from 'call.const';
import { CallState, ControllerEvent } from 'call.mapping';
import { engineRegistry } from 'call.engine.registry';
import type { CallEngine as CallEngineContract, EngineContext } from 'call.engine.registry';
import { CallSliderManager } from 'call.lib.call-slider-manager';

import { createMessengerFacade } from './adapter/messenger-facade';
import { ImUiAdapter } from './adapter/im-ui';
import { ImStoreAdapter } from './adapter/im-store';
import { tryJoinCall } from './service/try-join-call';
import { openCallUserSelector } from './functions/open-call-user-selector';
import { notifyCallInAnotherTab } from './functions/notify-call-in-another-tab';
import { ChatInfoProvider } from './service/chat-info-provider';
import { CallAvailability } from './service/call-availability';
import { RecentCallsSync } from './service/recent-calls-sync';
import { RecentReconcile } from './service/recent-reconcile';
import { GuestJoinHandler } from './service/guest-join-handler';
import { ActiveCallStateSync } from './service/active-call-state-sync';

const RECONCILE_MIN_INTERVAL_MS = 3000;

export class CallManager
{
	static instance: CallManager;
	static viewContainerClass: string = 'bx-im-messenger__call_container';

	#engine: CallEngineContract;
	#sliderManager: CallSliderManager;
	#chatInfoProvider: ChatInfoProvider;
	#availability: CallAvailability;
	#recentSync: RecentCallsSync;
	#recentReconcile: RecentReconcile;
	#guestJoin: GuestJoinHandler;
	#activeCallStateSync: ActiveCallStateSync;
	#nextCallOptions: Object | null = null;

	static getInstance(): CallManager
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	constructor()
	{
		this.#engine = engineRegistry.create(this.#buildEngineContext());
		const capabilities = engineRegistry.getCapabilities();
		const recentSource = engineRegistry.getRecentCallsSource();
		this.#sliderManager = new CallSliderManager({
			hasCurrentCall: () => this.hasCurrentCall(),
			leaveCurrentCall: () => this.leaveCurrentCall(),
		});
		this.#chatInfoProvider = new ChatInfoProvider(
			ImStoreAdapter,
			() => new ChatService(),
			{ conference: ChatType.videoconf, user: ChatType.user },
			(error) => Logger.error('Open chat error', error),
		);
		this.#availability = new CallAvailability(
			ImStoreAdapter,
			this.#chatInfoProvider,
			capabilities,
			{ bot: UserType.bot },
		);
		this.#recentSync = new RecentCallsSync(ImStoreAdapter, {
			events: EventEmitter,
			callEvent: recentSource.callEvent,
			status: RecentCallStatus,
			connectedStates: [CallState.Connected, CallState.Proceeding],
			instantiator: recentSource.instantiator,
			// Listeners are stateless functions on the port; safe to pass detached.
			addCallListener: recentSource.addCallListener,
			removeCallListener: recentSource.removeCallListener,
		});
		this.#guestJoin = new GuestJoinHandler(ImStoreAdapter, {
			events: EventEmitter,
			guestEvents: this.#collectGuestEvents(),
			hasActiveCurrentCall: (dialogId) => this.hasActiveCurrentCall(dialogId),
			tryJoinCall,
			instantiator: recentSource.instantiator,
			join: (callId, callUuid, dialogId, withVideo) => this.joinCall(callId, callUuid, dialogId, withVideo),
			onWarn: (message, ...args) => Logger.warn(message, ...args),
		});
		this.#activeCallStateSync = new ActiveCallStateSync(ImStoreAdapter, {
			broadcast: (callUuid, options) => this.#engine.sendBroadcastRequest(callUuid, options),
			conferenceRequest: (conferenceCode) => ConferenceChannel.getInstance().sendRequest(conferenceCode),
			startCall: (dialogId) => this.startCall(dialogId),
			// @ts-ignore [call-ts] main.core ajax response type is untyped for runAction
			finishCall: (callUuid) => ajax.runAction('call.CallManager.finish', { data: { callUuid } }),
			// @ts-ignore [call-ts] main.core ajax response type is untyped for runAction
			fetchActiveCalls: () => ajax.runAction('call.Recent.getActive', {}),
			events: EventEmitter,
			// @ts-ignore [call-ts] wait BX to ts
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			subscribePull: (handler) => BX.addCustomEvent(window, 'onPullEvent-call', handler),
			// @ts-ignore [call-ts] wait BX to ts
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			unsubscribePull: (handler) => BX.removeCustomEvent(window, 'onPullEvent-call', handler),
			status: RecentCallStatus,
		});
		this.#recentReconcile = new RecentReconcile({
			subscribePullStatus: (handler) => this.#subscribeToPullStatus(handler),
			pullStatus: this.#getPullStatusValues(),
			// @ts-ignore [call-ts] main.core ajax response type is untyped for runAction
			fetchActiveCalls: (withUserData) => ajax.runAction(
				'call.Recent.getActive',
				withUserData ? { data: { withUserData: 'Y' } } : {},
			),
			hasMissingActiveCalls: (calls) => this.#recentSync.hasMissingActiveCalls(calls),
			addMissingActiveCalls: (calls) => this.#recentSync.addMissingActiveCalls(calls),
			now: () => Date.now(),
			minIntervalMs: RECONCILE_MIN_INTERVAL_MS,
			onWarn: (message, ...args) => Logger.warn(message, ...args),
		});

		this.#subscribeToEvents();

		this.#recentSync.start();
		this.#guestJoin.start();
		this.#recentReconcile.start();
	}

	#subscribeToPullStatus(handler: (data: { status?: string }) => void): boolean
	{
		// @ts-ignore [call-ts] wait BX to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		const pullClient = BX.PULL;
		// @ts-ignore [call-ts] wait BX to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		const pullClientClass = BX.PullClient;

		if (!pullClient || !pullClientClass)
		{
			return false;
		}

		pullClient.subscribe({
			type: pullClientClass.SubscriptionType.Status,
			callback: handler,
		});

		return true;
	}

	#getPullStatusValues(): { online: string, offline: string }
	{
		// @ts-ignore [call-ts] wait BX to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		const pullStatus = BX.PullClient?.PullStatus;

		return {
			online: pullStatus?.Online ?? 'online',
			offline: pullStatus?.Offline ?? 'offline',
		};
	}

	#collectGuestEvents(): string[]
	{
		const events = Object.entries({
			guestIdentified: CallEventType?.callEvents?.guestIdentified,
			guestInitialChatOpen: CallEventType?.callEvents?.guestInitialChatOpen,
		});
		const missing = events.filter(([, event]) => !event).map(([name]) => name);

		if (missing.length > 0)
		{
			Logger.warn(`CallManager: call.const EventType is unavailable, skipping ${missing.join(', ')} subscription`);
		}

		return events.filter(([, event]) => Boolean(event)).map(([, event]) => event);
	}

	async sendBroadcastRequest(callUuid: string): Promise<boolean>
	{
		const activeCalls = await this.#engine.sendBroadcastRequest(callUuid, { silent: false });

		if (activeCalls.some(Boolean))
		{
			notifyCallInAnotherTab();

			return true;
		}

		return false;
	}

	syncActiveCallState(dialogId: string, callUuid: string): Promise<void>
	{
		return this.#activeCallStateSync.syncActiveCallState(dialogId, callUuid);
	}

	syncActiveConferenceState(dialogId: string, callUuid: string, conferenceCode: string): Promise<void>
	{
		return this.#activeCallStateSync.syncActiveConferenceState(dialogId, callUuid, conferenceCode);
	}

	takeOverCall(dialogId: string, callUuid: string): Promise<void>
	{
		return this.#activeCallStateSync.takeOverCall(dialogId, callUuid);
	}

	setNextCallOptions(options: Object): void
	{
		this.#nextCallOptions = options;
	}

	startCall(dialogId: string, withVideo: boolean = true, callOptions: Object | null = null): void
	{
		Logger.warn('CallManager: startCall', dialogId, withVideo);

		this.#sliderManager.setTopSliderId();
		this.#prepareCall(dialogId);
		const startOptions: Record<string, unknown> = { ...callOptions };
		// eslint-disable-next-line promise/catch-or-return
		this.#chatInfoProvider.getChatInfo(dialogId).then((chatInfo) => {
			const mergedOptions: Record<string, unknown> = { ...this.#nextCallOptions, ...startOptions };
			this.#nextCallOptions = null;
			this.#engine.startCall(dialogId, { withVideo, chatInfo, callOptions: mergedOptions });
		});
	}

	joinCall(callId: string, callUuid: string | undefined, dialogId: string, withVideo: boolean = true)
	{
		Logger.warn('CallManager: joinCall', callId, callUuid, withVideo);

		this.#sliderManager.setTopSliderId();
		this.#prepareCall(dialogId);
		// eslint-disable-next-line promise/catch-or-return
		this.#chatInfoProvider.getChatInfo(dialogId).then((chatInfo) => {
			this.#engine.joinCall(callId, callUuid, { withVideo, chatInfo });
		});
	}

	leaveCurrentCall()
	{
		Logger.warn('CallManager: leaveCurrentCall');
		this.#engine.leaveCurrentCall();
		this.#sliderManager.clearSliderId();
	}

	onAnswerButtonClick(mediaParams: JsonObject, callParams: JsonObject)
	{
		this.#engine.onAnswerButtonClick(mediaParams, callParams);
	}

	onJoinFromRecentItem()
	{
		this.#engine.closeCallNotification();
	}

	/**
	 * Releases the call slot if it is taken by a ringing incoming call: the invitation is declined and the slot
	 * is freed. Does nothing when the slot is empty or holds an answered call.
	 *
	 * Needed by consumers that enter a call bypassing the controller — a conference is opened by the messenger
	 * itself, so without this call the ringing invitation would stay in the slot and keep ringing on the server.
	 */
	releaseRingingCallSlot()
	{
		Logger.warn('CallManager: releaseRingingCallSlot');
		this.#engine.releaseRingingCallSlot();
	}

	deleteRecentCall(dialogId: string)
	{
		this.#recentSync.deleteRecentCall(dialogId);
	}

	foldCurrentCall()
	{
		if (!this.#engine.hasActiveCall() || !this.#engine.hasVisibleCall())
		{
			return;
		}

		this.#engine.fold();
	}

	unfoldCurrentCall()
	{
		if (!this.#engine.hasActiveCall())
		{
			return;
		}

		// The only caller is the "return to call" button, so the window may take the focus outright.
		this.#engine.unfold({ isReturnGesture: true });
	}

	getCurrentCallDialogId(): string
	{
		return this.#engine.getActiveCall()?.dialogId ?? '';
	}

	getCurrentCall()
	{
		return this.#engine.getActiveCall()?.raw ?? false;
	}

	getCurrentUser(): ImModelUser
	{
		return ImStoreAdapter.getUser(ImStoreAdapter.getCurrentUserId());
	}

	hasCurrentCall(): boolean
	{
		return this.#engine.hasActiveCall();
	}

	hasCurrentScreenSharing(): boolean
	{
		return this.#engine.getActiveCall()?.isScreenSharingStarted() ?? false;
	}

	hasVisibleCall(): boolean
	{
		if (!this.#engine.hasActiveCall())
		{
			return false;
		}

		return this.#engine.hasVisibleCall();
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	toggleDebugFlag(debug)
	{
		this.#engine.setDebug(debug);
	}

	chatCanBeCalled(dialogId: string): boolean
	{
		return this.#availability.chatCanBeCalled(dialogId);
	}

	hasActiveCurrentCall(dialogId: string): boolean
	{
		return this.#availability.hasActiveCurrentCall(dialogId, this.getCurrentCallDialogId());
	}

	hasActiveAnotherCall(dialogId: string): boolean
	{
		return this.#availability.hasActiveAnotherCall(dialogId, this.getCurrentCallDialogId());
	}

	hasActiveCallInDialog(dialogId: string): boolean
	{
		return this.#availability.hasActiveCallInDialog(dialogId);
	}

	getCallUserLimit(): number
	{
		return this.#availability.getCallUserLimit();
	}

	isChatUserLimitExceeded(dialogId: string): boolean
	{
		return this.#availability.isChatUserLimitExceeded(dialogId);
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	updateRecentCallsList(activeCalls): void
	{
		this.#recentSync.updateFromActiveCalls(activeCalls);
	}

	#buildEngineContext(): EngineContext
	{
		return {
			language: Core.getLanguageId(),
			messengerFacade: createMessengerFacade({
				ui: ImUiAdapter,
				getCurrentDialogId: () => this.#getCurrentDialogId(),
				getCurrentUser: () => this.getCurrentUser(),
				getMessageCount: () => ImStoreAdapter.getTotalChatCounter(),
				getDialog: (dialogId) => this.#getDialog(dialogId),
				getRecentCalls: () => ImStoreAdapter.getRecentCalls(),
				showUserSelector: openCallUserSelector,
			}),
			events: {
				[ControllerEvent.onPromoViewed]: (event: { getData: () => { code: string } }) => {
					const { code } = event.getData();
					void ImUiAdapter.markPromoWatched(code);
				},
				[ControllerEvent.onOpenVideoConference]: (event: { getData: () => { dialogId: string } }) => {
					const { dialogId: chatId } = event.getData();
					const dialog = ImStoreAdapter.getChat(`chat${chatId}`, true);

					return ImUiAdapter.openConference({ code: dialog.public?.code });
				},
			},
		};
	}

	// region call events
	#subscribeToEvents()
	{
		EventEmitter.subscribe(EventType.layout.onLayoutChange, this.#onOpenChat.bind(this));
		EventEmitter.subscribe(EventType.layout.onOpenNotifications, this.foldCurrentCall.bind(this));
		EventEmitter.subscribe(EventType.call.onJoinFromRecentItem, this.onJoinFromRecentItem.bind(this));
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	#onOpenChat(event)
	{
		const callDialogId = this.getCurrentCallDialogId();
		const openedChat = event.getData().to.entityId;
		if (callDialogId === openedChat)
		{
			return;
		}

		this.foldCurrentCall();
	}

	isConference(dialogId: string): boolean
	{
		return this.#chatInfoProvider.isConference(dialogId);
	}

	#getCurrentDialogId(): string
	{
		const layout = ImStoreAdapter.getLayout();
		if (layout.name !== Layout.chat && layout.name !== Layout.taskComments)
		{
			return '';
		}

		return layout.entityId;
	}

	#getDialog(dialogId: string)
	{
		return ImStoreAdapter.getChat(dialogId);
	}

	#prepareCall(dialogId: string)
	{
		this.#engine.prepareCall(this.#chatInfoProvider.buildPrepareData(dialogId));
	}
	// endregion call events
}
