/**
 * @module im/messenger/controller/dialog/lib/entity-manager
 */

jn.define('im/messenger/controller/dialog/lib/entity-manager', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { NotifyManager } = require('notify-manager');

	const { MessengerParams } = require('im/messenger/lib/params');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('dialog--entity-manager');
	const { Uuid } = require('utils/uuid');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		ChatEntityType,
		RestMethod,
		EventType,
	} = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { VoteCreation } = require('im/messenger/controller/vote/creation');
	const { withTimeout } = require('im/messenger/lib/utils');

	// Max wait (ms) for im.chat.calendar.prepare. Prefill is a bonus, so a slow or failed
	// request must never hold back the meeting form.
	const MEETING_PREPARE_TIMEOUT = 3000;

	// Safety limit (ms) for the double-tap guard, above the worst legit path (prepare timeout
	// plus extension load and tool check): a hung await must not lock meeting creation in the
	// dialog until an app restart.
	const MEETING_IN_FLIGHT_GUARD_TIMEOUT = 10000;

	/**
	 * Maps the im.chat.calendar.prepare response to the fields the meeting form is prefilled with.
	 * The calendar owner is resolved locally, so a sonet project chat must not get chat data into
	 * a personal event.
	 * @param {?PrepareCalendarParams} params
	 * @param {boolean} isCollab
	 * @return {MeetingPrefill}
	 */
	function buildMeetingPrefill(params, isCollab)
	{
		if (!Type.isPlainObject(params) || (params.type === 'group' && !isCollab))
		{
			return {};
		}

		const prefill = {};

		if (Type.isStringFilled(params.entryDescription))
		{
			prefill.description = params.entryDescription;
		}

		if (Type.isArrayFilled(params.participantsEntityList))
		{
			// The prepare contract is private, so ids are taken only from entities the form reads as users.
			prefill.participantsEntityList = params.participantsEntityList
				.filter((item) => item?.entityId === 'user')
				.map((item) => item.id)
			;
		}

		return prefill;
	}

	/**
	 * A message on its way to the server has a temporary string id no calendar method can resolve.
	 * @param {?number|string} messageId
	 * @return {boolean}
	 */
	function isSavedMessageId(messageId)
	{
		return Type.isNumber(messageId);
	}

	/**
	 * @class EntityManager
	 */
	class EntityManager
	{
		/** @type {Set<DialogId>} */
		static #dialogsWithMeetingInFlight = new Set();

		#onCalendarEntrySaveHandler;

		/**
		 * @param {DialogId} dialogId
		 * @param {MessengerCoreStore} store
		 */
		constructor(dialogId, store)
		{
			this.dialogId = dialogId;
			this.store = store;
		}

		/**
		 * @param {?number|string} messageId
		 * @param {?number} chatId
		 * @return {Promise<PrepareTaskData>}
		 */
		#getCreateTaskData({ messageId, chatId })
		{
			return new Promise((resolve, reject) => {
				BX.rest.callMethod(RestMethod.imChatTaskPrepare, {
					MESSAGE_ID: messageId,
					CHAT_ID: chatId,
				})
					.then((result) => {
						logger.log(`${this.constructor.name}.getCreateTaskData result`, result.data());
						resolve(result.data());
					})
					.catch((result) => {
						logger.error(`${this.constructor.name}.getCreateTaskData catch:`, result.error());
						reject(result.error());
					});
			});
		}

		/**
		 * @param {object} params
		 * @param {object} [options]
		 * @param {boolean} [options.sendOpenAnalytics] - false when the creation starts from the
		 *        message menu: that path reports itself, and chat_textarea would be a second label
		 */
		async #onCreateTask(params, { sendOpenAnalytics = true } = {})
		{
			logger.log(`${this.constructor.name}.onClickActionTask`);

			try
			{
				const { Entry } = await requireLazy('tasks:entry');
				Entry.openTaskCreation(params);

				if (sendOpenAnalytics)
				{
					AnalyticsService.getInstance().sendOpenCreateTask(this.dialogId);
				}
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.createTask catch`, error);
			}
		}

		async createTask()
		{
			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!isModuleInstalled('tasks') || !dialog)
			{
				return;
			}

			const auditors = [];
			try
			{
				const taskData = await this.#getCreateTaskData({ chatId: dialog.chatId });

				if (Type.isStringFilled(taskData.params?.AUDITORS))
				{
					const auditorsIds = taskData.params.AUDITORS.split(',');
					auditorsIds.forEach((id) => {
						const user = this.store.getters['usersModel/getById'](id);

						const auditor = { id };
						if (Type.isStringFilled(user?.name))
						{
							auditor.name = user.name;
						}

						auditors.push(auditor);
					});
				}
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.createTask get auditors error find ${error}`);
			}

			const openTaskCreateFormOptions = {
				initialTaskData: {
					title: '',
					description: '',
					auditors,
					IM_CHAT_ID: dialog.chatId,
				},
				closeAfterSave: true,
				analyticsLabel: {
					c_section: 'chat',
					c_element: 'create_button',
				},
			};

			const collabId = this.store.getters['dialoguesModel/collabModel/getByDialogId'](this.dialogId)?.collabId;
			if (collabId > 0)
			{
				openTaskCreateFormOptions.initialTaskData.group = {
					id: collabId,
					name: dialog.name,
				};
			}

			void this.#onCreateTask(openTaskCreateFormOptions);
		}

		/**
		 * @param {MessagesModelState} messageData
		 * @return {Promise}
		 */
		async createTaskFomMessage(messageData)
		{
			const taskData = await this.#getCreateTaskData({ messageId: messageData.id });

			if (!taskData.params || !isModuleInstalled('tasks'))
			{
				return;
			}

			let auditors = [];
			try
			{
				if (taskData.params?.AUDITORS)
				{
					const auditorsIds = taskData.params.AUDITORS.split(',');
					auditors = auditorsIds.map((id) => {
						const user = this.store.getters['usersModel/getById'](id);
						if (user && user.name)
						{
							return Object.create({ id, name: user.name });
						}

						return Object.create({ id, name: '' });
					});
				}
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.onClickActionTask get auditors error find ${error}`);
			}

			const files = taskData.params?.UF_TASK_WEBDAV_FILES_DATA || [];
			const openTaskCreateFormOptions = {
				initialTaskData: {
					title: messageData.text,
					description: taskData.params.DESCRIPTION,
					auditors,
					files,
					IM_CHAT_ID: taskData.params.IM_CHAT_ID,
					IM_MESSAGE_ID: taskData.params.IM_MESSAGE_ID,
				},
				closeAfterSave: true,
				analyticsLabel: {
					c_section: 'chat',
					c_element: 'create_button',
				},
			};

			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			const collabInfo = this.store.getters['dialoguesModel/collabModel/getByDialogId'](this.dialogId);
			const isCollab = DialogHelper.createByDialogId(this.dialogId)?.isCollab;

			if (isCollab && collabInfo && collabInfo.collabId > 0)
			{
				openTaskCreateFormOptions.initialTaskData.group = {
					id: collabInfo.collabId,
					name: dialog.name,
				};
			}

			await this.#onCreateTask(openTaskCreateFormOptions, { sendOpenAnalytics: false });
		}

		/**
		 * Never rejects: the prefill is optional, so any error or timeout degrades to an empty one.
		 * @param {number} chatId
		 * @param {?number|string} messageId
		 * @param {boolean} isCollab
		 * @return {Promise<MeetingPrefill>}
		 */
		async #getMeetingPrefill({ chatId, messageId, isCollab })
		{
			const queryParams = { CHAT_ID: chatId };
			if (isSavedMessageId(messageId))
			{
				queryParams.MESSAGE_ID = messageId;
			}

			try
			{
				const result = await withTimeout(
					BX.rest.callMethod(RestMethod.imChatCalendarPrepare, queryParams),
					MEETING_PREPARE_TIMEOUT,
				);

				return buildMeetingPrefill(result.data()?.params, isCollab);
			}
			catch (error)
			{
				// A rest rejection carries the server reason behind error(); a timeout rejects with an Error.
				logger.error(`${this.constructor.name}.getMeetingPrefill catch`, error?.error?.() ?? error);

				return {};
			}
		}

		/**
		 * @param {?number|string} messageId
		 * @param {object} [options]
		 * @param {boolean} [options.sendOpenAnalytics] - false when the creation starts from the
		 *        message menu: that path reports itself, and chat_textarea would be a second label
		 */
		async createMeeting(messageId, { sendOpenAnalytics = true } = {})
		{
			if (!isModuleInstalled('calendar'))
			{
				return;
			}

			// Both message entry points build their own manager per tap, so the mark is kept per
			// dialog: while waiting for prepare is silent, a second tap would subscribe to the save
			// event twice and open the form twice.
			if (EntityManager.#dialogsWithMeetingInFlight.has(this.dialogId))
			{
				logger.warn(`${this.constructor.name}.createMeeting: already underway, tap ignored`, this.dialogId);

				return;
			}

			const point = new PerfPoint('IM Create Meeting', `dialog ${this.dialogId}`).start();
			EntityManager.#dialogsWithMeetingInFlight.add(this.dialogId);
			const inFlightGuardTimer = setTimeout(
				() => EntityManager.#dialogsWithMeetingInFlight.delete(this.dialogId),
				MEETING_IN_FLIGHT_GUARD_TIMEOUT,
			);
			// The wait before the form opens is user-visible (up to the prepare timeout), so the tap
			// answers with a single loader; requireLazy's own indicator is disabled below.
			NotifyManager.showLoadingIndicator();
			let currentStage = 'load-calendar-entry';

			try
			{
				// Not awaited right away: the extension loads in parallel with the prefill request below.
				point.startPoint('load-calendar-entry');
				const calendarEntryPromise = requireLazy('calendar:entry', false)
					.then((entryExports) => {
						point.endPoint('load-calendar-entry');

						return entryExports;
					});

				let ownerId = MessengerParams.getUserId();
				let calType = 'user';

				const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
				const collabInfo = this.store.getters['dialoguesModel/collabModel/getByDialogId'](this.dialogId);
				const collabId = collabInfo?.collabId;
				const isCollab = collabId > 0;

				if (isCollab)
				{
					ownerId = collabId;
					calType = 'group';
				}

				if (dialog?.chatId > 0)
				{
					// A sonet project chat gets an empty prefill anyway (see buildMeetingPrefill),
					// so it must not wait for the request at all.
					const isSonetProjectChat = dialog.entityType === ChatEntityType.sonetGroup && !isCollab;

					let prefill = {};
					if (!isSonetProjectChat)
					{
						currentStage = 'calendar-prepare';
						point.startPoint(currentStage);
						prefill = await this.#getMeetingPrefill({
							chatId: dialog.chatId,
							messageId,
							isCollab,
						});
						point.endPoint(currentStage, {
							itemsCount: prefill.participantsEntityList?.length ?? 0,
						});
					}

					const { Entry } = await calendarEntryPromise;
					if (!Entry)
					{
						return;
					}

					const uuid = Uuid.getV4();
					this.#onCalendarEntrySaveHandler = (event) => this.#onCalendarEntrySave(event, dialog.chatId, uuid, messageId);
					BX.addCustomEvent(EventType.calendar.addMeeting, this.#onCalendarEntrySaveHandler);

					currentStage = 'open-form';
					point.startPoint(currentStage);
					// Awaited so the in-flight guard holds until the form is handed over for opening.
					await Entry.openEventEditForm({
						ownerId,
						calType,
						createChatId: dialog.chatId,
						uuid,
						...prefill,
					});
					point.endPoint(currentStage);

					if (sendOpenAnalytics)
					{
						AnalyticsService.getInstance().sendOpenCreateMeeting(this.dialogId);
					}
				}
			}
			catch (error)
			{
				point.endPoint(currentStage, { error: error?.message });
				logger.error(`${this.constructor.name}.createMeeting catch`, error);
			}
			finally
			{
				clearTimeout(inFlightGuardTimer);
				EntityManager.#dialogsWithMeetingInFlight.delete(this.dialogId);
				NotifyManager.hideLoadingIndicatorWithoutFallback();
				point.end();
			}
		}

		/**
		 * @param eventData
		 * @param {number} eventData.eventId
		 * @param {number} eventData.createChatId
		 * @param {string} eventData.uuid
		 * @param {string} uuid
		 * @param {number} chatId
		 * @param {?number|string} messageId
		 */
		#onCalendarEntrySave(eventData, chatId, uuid, messageId)
		{
			const isEqualChatId = chatId === eventData.createChatId;
			const isEqualUuid = uuid === eventData.uuid;

			if (!isEqualChatId || !isEqualUuid)
			{
				return;
			}

			this.#unsubscribeCalendarEvent();
			const queryParams = {
				CALENDAR_ID: eventData.eventId,
				CHAT_ID: chatId,
			};

			if (isSavedMessageId(messageId))
			{
				queryParams.MESSAGE_ID = messageId;
			}

			BX.rest.callMethod(RestMethod.imChatCalendarAdd, queryParams)
				.catch((error) => {
					logger.error(`${this.constructor.name}.onCalendarEntrySave error`, error);
				});
		}

		#unsubscribeCalendarEvent()
		{
			BX.removeCustomEvent(EventType.calendar.addMeeting, this.#onCalendarEntrySaveHandler.bind());
		}

		createVote(dialogCallback)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);

			if (dialog?.chatId > 0)
			{
				VoteCreation.open({
					dialogCallback,
					chatId: dialog.chatId,
				});
				AnalyticsService.getInstance().sendOpenCreateVote(this.dialogId);
			}
		}
	}

	module.exports = {
		EntityManager,
		buildMeetingPrefill,
	};
});
