/**
 * @module im/messenger/lib/integration/callmobile/call-manager
 */
jn.define('im/messenger/lib/integration/callmobile/call-manager', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const {
		EventType,
		Analytics,
		DialogType,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Logger } = require('im/messenger/lib/logger');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatDataProvider } = require('im/messenger/provider/data');

	/**
	 * A call answers to every identifier it has: an event about the same call may carry only the
	 * id or only the uuid, whichever its producer had at hand.
	 *
	 * @param {RecentCallData} call
	 * @return {Array<string>}
	 */
	const getCallKeys = (call) => [call.id, call.uuid].filter(Boolean).map(String);

	/**
	 * @class CallManager
	 */
	class CallManager
	{
		/**
		 * @return {CallManager}
		 */
		static getInstance()
		{
			if (!this.instance)
			{
				this.instance = new this();
			}

			return this.instance;
		}

		constructor()
		{
			this.core = serviceLocator.get('core');
			this.store = this.core.getStore();
			this.messengerInitService = serviceLocator.get('messenger-init-service');
			this.chatDataProvider = new ChatDataProvider();

			/** @type {Map<string, { keys: Array<string>, dialogId: DialogId }>} a call in progress, by each key */
			this.activeCalls = new Map();

			this.bindMethods();
		}

		bindMethods()
		{
			this.messengerInitHandler = this.messengerInitHandler.bind(this);
			this.onCallActive = this.onCallActive.bind(this);
			this.onCallInactive = this.onCallInactive.bind(this);
		}

		subscribeMessengerInitEvent()
		{
			this.messengerInitService.onInit(this.messengerInitHandler);
			BX.addCustomEvent(EventType.call.active, this.onCallActive);
			BX.addCustomEvent(EventType.call.inactive, this.onCallInactive);
		}

		/**
		 * Every call in progress is tracked, not only the joined one: a tap on a call message
		 * joins the call the dialog already has. The previous registration is dropped first, so
		 * a key the call no longer answers to cannot outlive it.
		 *
		 * @param {RecentCallData} call
		 * @return {void}
		 */
		onCallActive(call)
		{
			const keys = getCallKeys(call);
			const activeCall = { keys, dialogId: String(call.associatedEntity.id) };

			this.#forgetCall(keys);
			for (const key of keys)
			{
				this.activeCalls.set(key, activeCall);
			}
		}

		/**
		 * Only the finished call is dropped, so a parallel call in the recent list cannot erase
		 * the dialog of the call still in progress.
		 *
		 * @param {RecentCallData} call
		 * @return {void}
		 */
		onCallInactive(call)
		{
			this.#forgetCall(getCallKeys(call));
		}

		/**
		 * An event may name the call by a single identifier, so the call is looked up by any of
		 * the given keys and forgotten by all of its own.
		 *
		 * @param {Array<string>} keys
		 * @return {void}
		 */
		#forgetCall(keys)
		{
			for (const key of keys)
			{
				const activeCall = this.activeCalls.get(key);
				if (!activeCall)
				{
					continue;
				}

				for (const activeCallKey of activeCall.keys)
				{
					this.activeCalls.delete(activeCallKey);
				}
			}
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {boolean}
		 */
		hasActiveCallInDialog(dialogId)
		{
			const targetDialogId = String(dialogId);

			for (const activeCall of this.activeCalls.values())
			{
				if (activeCall.dialogId === targetDialogId)
				{
					return true;
				}
			}

			return false;
		}

		/**
		 * @param {immobileTabChatLoadResult} messengerInitData
		 */
		messengerInitHandler(messengerInitData)
		{
			Logger.info('CallManager.messengerInitHandler', messengerInitData);

			const {
				activeCalls,
			} = messengerInitData;

			const currentUserId = this.core.getUserId();
			const currentUser = {
				[currentUserId]: this.store.getters['usersModel/getById'](currentUserId),
			};
			BX.postComponentEvent(EventType.callManager.setCurrentUser, [currentUser], 'calls');

			if (activeCalls)
			{
				BX.postComponentEvent(EventType.callManager.activeCallsReceived, [activeCalls], 'calls');
			}
		}

		async createAudioCall(dialogId)
		{
			Logger.info('CallManager.createAudioCall', dialogId);
			const currentUser = this.core.getUserId();

			const chatData = await this.#prepareCallChatData(dialogId);

			if (!chatData)
			{
				Logger.error('CallManager.createAudioCall: failed to get chat data', dialogId);
			}

			if (DialogHelper.isDialogId(dialogId))
			{
				const eventData = {
					dialogId,
					video: false,
					chatData,
					userData: {
						[currentUser]: this.store.getters['usersModel/getById'](currentUser),
					},
				};

				BX.postComponentEvent(EventType.callManager.createCall, [eventData], 'calls');

				return;
			}

			const eventData = {
				userId: dialogId,
				video: false,
				chatData,
				userData: {
					[dialogId]: this.store.getters['usersModel/getById'](dialogId),
					[currentUser]: this.store.getters['usersModel/getById'](currentUser),
				},
			};

			BX.postComponentEvent(EventType.callManager.createCall, [eventData], 'calls');
		}

		async createVideoCall(dialogId)
		{
			Logger.info('CallManager.createVideoCall', dialogId);
			const currentUser = this.core.getUserId();

			const chatData = await this.#prepareCallChatData(dialogId);

			if (!chatData)
			{
				Logger.error('CallManager.createVideoCall: failed to get chat data', dialogId);
			}

			if (DialogHelper.isDialogId(dialogId))
			{
				const eventData = {
					dialogId,
					video: true,
					chatData,
					userData: {
						[currentUser]: this.store.getters['usersModel/getById'](currentUser),
					},
				};

				BX.postComponentEvent(EventType.callManager.createCall, [eventData], 'calls');

				return;
			}

			const userData = this.store.getters['usersModel/getById'](dialogId);
			const eventData = {
				userId: dialogId,
				video: true,
				chatData,
				userData: {
					[dialogId]: userData,
					[currentUser]: this.store.getters['usersModel/getById'](currentUser),
				},
			};

			BX.postComponentEvent(EventType.callManager.createCall, [eventData], 'calls');
		}

		joinCall(callId, callUuid, associatedEntity)
		{
			Logger.info('CallManager.joinCall', callId);

			BX.postComponentEvent(EventType.call.join, [{ callId, callUuid, associatedEntity }], 'calls');
		}

		async leaveCall(dialogId)
		{
			Logger.info('CallManager.leaveCall', dialogId);
			const chatData = await this.#prepareCallChatData(dialogId);

			if (!chatData)
			{
				Logger.warn('CallManager.leaveCall: failed to prepare chat data', dialogId);
			}

			const eventData = {
				dialogId,
				chatData,
				userId: this.core.getUserId(),
			};

			BX.postComponentEvent(EventType.call.leave, [eventData], 'calls');
		}

		/**
		 * @param {number} chatId
		 * @param {string} token
		 */
		updateCallToken(chatId, token)
		{
			const eventData = {
				chatId,
				token,
			};

			BX.postComponentEvent(EventType.callManager.updateCallToken, [eventData], 'calls');
		}

		sendAnalyticsEvent(dialogId, callElement, analyticSection)
		{
			const dialogData = this.store.getters['dialoguesModel/getById'](dialogId);
			const callType = dialogData?.type === DialogType.videoconf
				? Analytics.Type.videoconf
				: (
					DialogHelper.isDialogId(dialogId)
						? Analytics.Type.groupCall
						: Analytics.Type.privateCall
				)
			;

			const section = this.isTaskDialog(dialogData)
				? Analytics.Section.taskChat
				: analyticSection
			;

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.clickCallButton)
				.setType(callType)
				.setSection(section)
				.setSubSection(Analytics.SubSection.window)
				.setElement(callElement)
				.setP5(`chatId_${dialogData.chatId}`)
			;

			analytics.send();
			this.sendTaskCallAnalytics(dialogData, callElement);
		}

		sendTaskCallAnalytics(dialogData, callElement)
		{
			if (!this.isTaskDialog(dialogData))
			{
				return;
			}

			const taskIdParam = this.getTaskIdParam(dialogData);
			const analyticsType = callElement === Analytics.Element.audiocall
				? Analytics.Type.audio
				: Analytics.Type.video;

			const taskAnalytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.task)
				.setCategory(Analytics.Category.chatOperations)
				.setEvent(Analytics.Event.clickCallButton)
				.setType(analyticsType)
				.setSection(Analytics.Section.chatTasks)
				.setP1(taskIdParam)
			;

			taskAnalytics.send();
		}

		async #prepareCallChatData(dialogId)
		{
			const result = await this.chatDataProvider.get({ dialogId });
			const dialog = result.getData();

			if (!dialog)
			{
				Logger.warn('CallManager.#prepareCallChatData: dialog not found', dialogId);

				return null;
			}

			return {
				dialogId: dialog.dialogId,
				chatId: dialog.chatId,
				name: dialog.name,
				avatar: dialog.avatar || '',
				color: dialog.color,
				type: dialog.type,
				userCounter: dialog.userCounter,
				entityType: dialog.entityType,
				entityId: dialog.entityId,
				entityData1: dialog.entityData1,
				entityData2: dialog.entityData2,
				entityData3: dialog.entityData3,
			};
		}

		getTaskIdParam(dialogData)
		{
			if (!this.isTaskDialog(dialogData))
			{
				return '';
			}

			const rawTaskId = dialogData?.entityLink?.id ?? dialogData?.entityId;
			const taskId = Number.parseInt(rawTaskId, 10);
			if (!Number.isInteger(taskId))
			{
				return 'taskId_0';
			}

			return `taskId_${taskId}`;
		}

		isTaskDialog(dialogData)
		{
			return dialogData?.type === DialogType.tasksTask;
		}
	}

	module.exports = {
		CallManager,
		getCallKeys,
	};
});
