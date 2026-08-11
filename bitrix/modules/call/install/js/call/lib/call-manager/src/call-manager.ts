// @ts-ignore
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import 'im_call_compatible';
import { type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ChatType, RecentCallStatus, Layout, EventType, UserType } from 'im.v2.const';
import { DesktopApi } from 'im.v2.lib.desktop-api';
import { Logger } from 'im.v2.lib.logger';
import { PromoManager } from 'im.v2.lib.promo';
import { MessengerSlider } from 'im.v2.lib.slider';
import { SoundNotificationManager } from 'im.v2.lib.sound-notification';
import { type Call, type CallAssociatedEntity, type ImModelChat, type ImModelUser } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { Controller, State as CallState, EngineLegacy, Engine as CallEngine, Util } from 'call.core';
import { CallSliderManager } from 'call.lib.call-slider-manager';

import { openCallUserSelector } from './functions/open-call-user-selector';

export class CallManager
{
	static instance: CallManager;
	static viewContainerClass: string = 'bx-im-messenger__call_container';

	#controller: Controller;
	#sliderManager: CallSliderManager;
	#nextCallOptions: Object | null = null;

	#openChatActionByChatType = {
		[ChatType.taskComments]: (dialogId: string) => {
			if (Messenger.isEmbeddedMode() || Messenger.isMessengerSliderOpened())
			{
				return Messenger.openTaskComments(dialogId);
			}

			return Promise.resolve();
		},
	};

	#onCallJoinHandler: Function;
	#onCallLeaveHandler: Function;
	#onCallDestroyHandler: Function;

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
		this.#controller = this.#getController();
		this.#sliderManager = new CallSliderManager({
			hasCurrentCall: () => this.hasCurrentCall(),
			leaveCurrentCall: () => this.leaveCurrentCall(),
		});

		this.#subscribeToEvents();

		this.#onCallJoinHandler = this.#onCallJoin.bind(this);
		this.#onCallLeaveHandler = this.#onCallLeave.bind(this);
		this.#onCallDestroyHandler = this.#onCallDestroy.bind(this);
	}

	async sendBroadcastRequest(callId: string): Promise<boolean[]>
	{
		if (!DesktopApi.isDesktop())
		{
			return [];
		}

		if (!this.#controller.callMultiBroadcastClient)
		{
			return [];
		}

		// @ts-ignore [call-ts] wait call.core to ts
		return this.#controller.callMultiBroadcastClient.broadcastRequest(callId, { timeout: 100 });
	}

	startCall(dialogId: string, withVideo: boolean = true): void
	{
		Logger.warn('CallManager: startCall', dialogId, withVideo);

		this.#sliderManager.setTopSliderId();
		this.#prepareCall(dialogId);
		// eslint-disable-next-line promise/catch-or-return
		this.#getChatInfo(dialogId).then((chatInfo) => {
			const callOptions = this.#nextCallOptions ?? {};
			this.#nextCallOptions = null;
			this.#controller.startCall(dialogId, withVideo, chatInfo, callOptions);
		});
	}

	joinCall(callId: string, callUuid: string, dialogId: string, withVideo: boolean = true)
	{
		Logger.warn('CallManager: joinCall', callId, callUuid, withVideo);

		this.#sliderManager.setTopSliderId();
		this.#prepareCall(dialogId);
		// eslint-disable-next-line promise/catch-or-return
		this.#getChatInfo(dialogId).then((chatInfo) => {
			// @ts-expect-error [call-ts] wait call.core to ts
			this.#controller.joinCall(callId, callUuid, withVideo, { chatInfo });
		});
	}

	leaveCurrentCall()
	{
		Logger.warn('CallManager: leaveCurrentCall');
		this.#controller.leaveCurrentCall();
		this.#sliderManager.clearSliderId();
	}

	onAnswerButtonClick(mediaParams: JsonObject, callParams: JsonObject)
	{
		this.#controller.onAnswerButtonClick(mediaParams, callParams);
	}

	onJoinFromRecentItem()
	{
		this.#controller.closeCallNotification();
	}

	deleteRecentCall(dialogId: string)
	{
		// @ts-ignore [call-ts] wait im to ts.
		void Core.getStore().dispatch('recent/calls/deleteActiveCall', {
			dialogId,
		});
	}

	foldCurrentCall()
	{
		if (!this.#controller.hasActiveCall() || !this.#controller.hasVisibleCall())
		{
			return;
		}

		this.#controller.fold();
	}

	unfoldCurrentCall()
	{
		if (!this.#controller.hasActiveCall())
		{
			return;
		}

		this.#controller.unfold();
	}

	getCurrentCallDialogId(): string
	{
		if (!this.#controller.hasActiveCall())
		{
			return '';
		}

		return this.#controller?.currentCall?.associatedEntity.id;
	}

	getCurrentCall()
	{
		if (!this.#controller.hasActiveCall())
		{
			return false;
		}

		return this.#controller.currentCall;
	}

	getCurrentUser(): ImModelUser
	{
		const currentUserId = Core.getUserId();

		// @ts-ignore [call-ts] wait im to ts.
		return Core.getStore().getters['users/get'](currentUserId);
	}

	hasCurrentCall(): boolean
	{
		return this.#controller.hasActiveCall();
	}

	hasCurrentScreenSharing(): boolean
	{
		if (!this.#controller.hasActiveCall())
		{
			return false;
		}

		// @ts-expect-error [call-ts] wait call.core to ts
		return this.#controller.currentCall.isScreenSharingStarted();
	}

	hasVisibleCall(): boolean
	{
		if (!this.#controller.hasActiveCall())
		{
			return false;
		}

		return this.#controller.hasVisibleCall();
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	toggleDebugFlag(debug)
	{
		if (!this.#controller)
		{
			return;
		}

		this.#controller.debug = debug;
	}

	chatCanBeCalled(dialogId: string): boolean
	{
		const callSupported = this.#checkCallSupport(dialogId);
		// @ts-ignore [call-ts] wait im to ts.
		const hasCurrentCall = Core.getStore().getters['recent/calls/hasActiveCall'](dialogId);

		return callSupported && !hasCurrentCall;
	}

	hasActiveCurrentCall(dialogId: string): boolean
	{
		return (
			// @ts-ignore [call-ts] wait im to ts.
			Core.getStore().getters['recent/calls/hasActiveCall'](dialogId) && this.getCurrentCallDialogId() === dialogId
		);
	}

	hasActiveAnotherCall(dialogId: string): boolean
	{
		// @ts-ignore [call-ts] wait im to ts.
		return Core.getStore().getters['recent/calls/hasActiveCall']() && !this.hasActiveCurrentCall(dialogId);
	}

	getCallUserLimit()
	{
		// @ts-expect-error [call-ts] wait call.core to ts
		return BX.Call.Util.getUserLimit();
	}

	isChatUserLimitExceeded(dialogId: string): boolean
	{
		return this.#getChatUserCounter(dialogId) > this.getCallUserLimit();
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	updateRecentCallsList(activeCalls): void
	{
		// @ts-ignore [call-ts] wait im to ts.
		const recentCalls = Core.getStore().getters['recent/calls/get'];

		// @ts-expect-error [call-ts] wait call.core to ts
		const activeCallsMap = new Map(Object.values(activeCalls).map((call) => [call.ID, call]));

		activeCallsMap.forEach((call) => {
			// @ts-expect-error [call-ts] wait call.core to ts
			const instantiatedCall = Util.isLegacyCall(call.PROVIDER, call.SCHEME)
				// @ts-expect-error [call-ts] wait call.core to ts
				? EngineLegacy.instantiateCall(call, call.USERS, call.LOG_TOKEN, call.CONNECTION_DATA, call.USER_DATA)
				// @ts-expect-error [call-ts] wait call.core to ts
				: CallEngine.instantiateCall(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
			this.#subscribeToCallEvents(instantiatedCall);
		});

		// @ts-ignore
		recentCalls
			// @ts-expect-error [call-ts] wait im to ts
			.filter((oldCall) => !activeCallsMap.has(oldCall.call.id))
			// @ts-expect-error [call-ts] wait im to ts
			.forEach((oldCall) => {
				// @ts-ignore [call-ts] wait im to ts.
				void Core.getStore().dispatch('recent/calls/deleteActiveCall', {
					dialogId: oldCall.dialogId,
				});
			});
	}

	#getController(): Controller
	{
		return new Controller({
			init: true,
			language: Core.getLanguageId(),
			messengerFacade: {
				getDefaultZIndex: () => MessengerSlider.getInstance().getZIndex(),
				isMessengerOpen: () => MessengerSlider.getInstance().isOpened(),
				isSliderFocused: () => MessengerSlider.getInstance().isFocused(),
				isThemeDark: () => false,
				openMessenger: (dialogId: string, force: boolean = false) => {
					if (!force)
					{
						const dialog = this.#getDialog(dialogId);

						if (dialog && dialog.type in this.#openChatActionByChatType)
						{
							// @ts-expect-error [call-ts] wait im to ts
							return this.#openChatActionByChatType[dialog.type](dialogId);
						}
					}

					// @ts-expect-error [call-ts] wait BX?.SidePanel to ts
					const sidePanel = BX?.SidePanel?.Instance;
					const hasChatUnderSlider =						sidePanel?.getOpenSlidersCount?.() > 0 && sidePanel?.getPageUrl?.()?.includes('/online/');

					if (hasChatUnderSlider)
					{
						const topSlider = sidePanel?.getTopSlider?.();

						if (topSlider?.close)
						{
							return new Promise((resolve) => {
								topSlider.close(false, resolve);
							}).then(() => Messenger.openChat(dialogId));
						}

						return Messenger.openChat(dialogId);
					}

					return Messenger.openChat(dialogId);
				},
				// @ts-expect-error [call-ts] wait call.core to ts
				openHistory: (dialogId) => {
					return Messenger.openChat(dialogId);
				},
				openSettings: () => {
					return Messenger.openSettings();
				},
				openHelpArticle: () => {}, // TODO
				// @ts-ignore [call-ts] wait im to ts.
				getMessageCount: () => Core.getStore().getters['counters/getTotalChatCounter'],
				getCurrentDialogId: () => this.#getCurrentDialogId(),
				isPromoRequired: (promoCode: string) => {
					return PromoManager.getInstance().needToShow(promoCode);
				},
				// @ts-expect-error [call-ts] wait call.core and im to ts
				repeatSound: (soundType, timeout, force) => {
					SoundNotificationManager.getInstance().playLoop(soundType, timeout, force);
				},
				// @ts-expect-error [call-ts] wait and im to ts
				stopRepeatSound: (soundType) => {
					SoundNotificationManager.getInstance().stop(soundType);
				},
				showUserSelector: openCallUserSelector,
			},
			events: {
				// @ts-expect-error [call-ts] wait call.core to ts
				[Controller.Events.onPromoViewed]: (event) => {
					const { code } = event.getData();
					void PromoManager.getInstance().markAsWatched(code);
				},
				// @ts-expect-error [call-ts] wait call.core to ts
				[Controller.Events.onOpenVideoConference]: (event) => {
					const { dialogId: chatId } = event.getData();
					// @ts-ignore [call-ts] wait im to ts.
					const dialog: ImModelChat = Core.getStore().getters['chats/get'](`chat${chatId}`, true);

					return Messenger.openConference({ code: dialog.public?.code });
				},
			},
		});
	}

	#getChatService(): ChatService
	{
		// @ts-expect-error [call-ts] wait im to ts
		if (!this.chatService)
		{
			// @ts-expect-error [call-ts] wait im to ts
			this.chatService = new ChatService();
		}

		// @ts-expect-error [call-ts] wait im to ts
		return this.chatService;
	}

	// region call events
	#subscribeToEvents()
	{
		EventEmitter.subscribe(EventType.layout.onLayoutChange, this.#onOpenChat.bind(this));
		EventEmitter.subscribe(EventType.layout.onOpenNotifications, this.foldCurrentCall.bind(this));
		EventEmitter.subscribe(EventType.call.onJoinFromRecentItem, this.onJoinFromRecentItem.bind(this));

		EventEmitter.subscribe('CallEvents::callCreated', this.#onCallCreated.bind(this));
	}

	#subscribeToCallEvents(call: Call)
	{
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.addEventListener(BX.Call.Event.onJoin, this.#onCallJoinHandler);
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.addEventListener(BX.Call.Event.onLeave, this.#onCallLeaveHandler);
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.addEventListener(BX.Call.Event.onDestroy, this.#onCallDestroyHandler);
	}

	#unsubscribeFromCallEvents(call: Call)
	{
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.removeEventListener(BX.Call.Event.onJoin, this.#onCallJoinHandler);
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.removeEventListener(BX.Call.Event.onLeave, this.#onCallLeaveHandler);
		// @ts-expect-error [call-ts] wait call.core to ts
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		call.removeEventListener(BX.Call.Event.onDestroy, this.#onCallDestroyHandler);
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	#onCallCreated(event)
	{
		const { call } = event.getData()[0];
		// @ts-ignore [call-ts] wait im to ts.
		const currentCall = Core.getStore().getters['recent/calls/getCallByDialog'](call.associatedEntity.id);
		const isNewCall = currentCall?.call.uuid !== call.uuid;

		const state = call.state === CallState.Connected || call.state === CallState.Proceeding
			? RecentCallStatus.joined
			: RecentCallStatus.waiting;

		if (isNewCall)
		{
			if (currentCall)
			{
				this.#unsubscribeFromCallEvents(currentCall.call);
			}

			this.#subscribeToCallEvents(call);
			this.#addChatToModel(call);
			// @ts-ignore [call-ts] wait im to ts.
			void Core.getStore().dispatch('recent/calls/addActiveCall', {
				dialogId: call.associatedEntity.id,
				name: call.associatedEntity.name,
				call,
				state,
			});

			return;
		}

		// @ts-ignore [call-ts] wait im to ts.
		void Core.getStore().dispatch('recent/calls/updateActiveCall', {
			dialogId: call.associatedEntity.id,
			fields: {
				name: call.associatedEntity.name,
				state,
				call,
			},
		});
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	#onCallJoin(event)
	{
		// @ts-ignore [call-ts] wait im to ts.
		void Core.getStore().dispatch('recent/calls/updateActiveCall', {
			dialogId: event.call.associatedEntity.id,
			fields: {
				state: RecentCallStatus.joined,
			},
		});
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	#onCallLeave(event)
	{
		// @ts-ignore [call-ts] wait im to ts.
		void Core.getStore().dispatch('recent/calls/updateActiveCall', {
			dialogId: event.call.associatedEntity.id,
			fields: {
				state: RecentCallStatus.waiting,
			},
		});
	}

	// @ts-expect-error [call-ts] wait call.core to ts
	#onCallDestroy(event)
	{
		const dialogId = event.call.associatedEntity.id;
		// @ts-ignore [call-ts] wait im to ts.
		const currentCall = Core.getStore().getters['recent/calls/getCallByDialog'](dialogId);

		if (currentCall)
		{
			this.#unsubscribeFromCallEvents(currentCall.call);
		}

		if (currentCall?.call.uuid === event.call.uuid)
		{
			// @ts-ignore [call-ts] wait im to ts.
			void Core.getStore().dispatch('recent/calls/deleteActiveCall', {
				dialogId,
			});
		}
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
		// @ts-ignore [call-ts] wait im to ts.
		const dialog: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return dialog.type === ChatType.videoconf;
	}

	#checkCallSupport(dialogId: string): boolean
	{
		// @ts-expect-error [call-ts] wait call.core to ts
		if (!this.#pushServerIsActive() || !BX.Call.Util.isWebRTCSupported())
		{
			return false;
		}

		const userId = Number(dialogId);

		return userId > 0 ? this.#checkUserCallSupport(userId) : this.#checkChatCallSupport(dialogId);
	}

	#checkUserCallSupport(userId: number): boolean
	{
		// @ts-ignore [call-ts] wait im to ts.
		const user = Core.getStore().getters['users/get'](userId);
		const isBot = user.type === UserType.bot;

		return (
			user
			&& user.status !== 'guest'
			&& !isBot
			&& !user.network
			&& user.id !== Core.getUserId()
			&& Boolean(user.lastActivityDate)
		);
	}

	#checkChatCallSupport(dialogId: string): boolean
	{
		const userCounter = this.#getChatUserCounter(dialogId);

		return (userCounter > 1 || this.isConference(dialogId)) && userCounter <= this.getCallUserLimit();
	}

	#pushServerIsActive(): boolean
	{
		return true;
	}

	#getCurrentDialogId(): string
	{
		// @ts-ignore [call-ts] wait im to ts.
		const layout = Core.getStore().getters['application/getLayout'];
		if (layout.name !== Layout.chat && layout.name !== Layout.taskComments)
		{
			return '';
		}

		return layout.entityId;
	}

	#getDialog(dialogId: string)
	{
		// @ts-ignore [call-ts] wait im to ts.
		return Core.getStore().getters['chats/get'](dialogId);
	}

	#isUser(dialogId: string): boolean
	{
		const dialog: ImModelChat = this.#getDialog(dialogId);

		return dialog?.type === ChatType.user;
	}

	async #getChatInfo(dialogId: string): Promise<CallAssociatedEntity>
	{
		// @ts-ignore [call-ts] wait im to ts.
		const chatInfo = Core.getStore().getters['chats/get'](dialogId, true);

		if (chatInfo.chatId === 0)
		{
			try
			{
				await this.#getChatService().loadChat(dialogId);
				// @ts-ignore [call-ts] wait im to ts.
				const updatedChatInfo = Core.getStore().getters['chats/get'](dialogId, true);

				return this.#prepareChatInfo(updatedChatInfo);
			}
			catch (error)
			{
				Logger.error('Open chat error', error);

				return this.#prepareChatInfo(chatInfo);
			}
		}

		return this.#prepareChatInfo(chatInfo);
	}

	// @ts-expect-error [call-ts] wait im to ts
	#prepareChatInfo(chatInfo)
	{
		return {
			advanced: {
				chatType: chatInfo.type,
				entityType: chatInfo.entityType,
				entityId: chatInfo.entityId,
				entityData1: chatInfo.entityData1,
				entityData2: chatInfo.entityData2,
				entityData3: chatInfo.entityData3,
			},
			id: chatInfo.dialogId,
			chatId: chatInfo.chatId,
			name: chatInfo.name,
			avatar: chatInfo.avatar || '/bitrix/js/im/images/blank.gif',
			avatarColor: chatInfo.color,
			type: 'chat',
			userCounter: chatInfo.userCounter,
		};
	}

	#addChatToModel(call: Call): void
	{
		const entity: CallAssociatedEntity = call.associatedEntity;
		const chatFields = {
			dialogId: entity.id,
			type: entity.advanced?.chatType,
			name: entity.name,
			avatar: entity.avatar,
			color: entity.avatarColor,
		};

		// @ts-ignore [call-ts] wait im to ts.
		void Core.getStore().dispatch('chats/add', chatFields);
	}

	#prepareCall(dialogId: string)
	{
		const currentUserId = Core.getUserId();
		// @ts-ignore [call-ts] wait im to ts.
		const currentUser: ImModelUser = Core.getStore().getters['users/get'](currentUserId);

		const callData = {
			dialogId,
			userData: {
				[currentUserId]: currentUser,
			},
		};

		if (this.#isUser(dialogId))
		{
			// @ts-ignore [call-ts] wait im to ts.
			const currentCompanion: ImModelUser = Core.getStore().getters['users/get'](dialogId);
			// @ts-expect-error [call-ts] wait im to ts
			callData.user = currentCompanion.id;
			callData.userData[currentCompanion.id] = currentCompanion;
		}

		this.#controller.prepareCall(callData);
	}

	#getChatUserCounter(dialogId: string): number
	{
		// @ts-ignore [call-ts] wait im to ts.
		const { userCounter } = Core.getStore().getters['chats/get'](dialogId, true);

		return userCounter;
	}
	// endregion call events
}
