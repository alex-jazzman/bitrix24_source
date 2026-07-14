/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, calendar_sliderloader, im_v2_application_core, im_v2_const, im_v2_lib_rest) {
	'use strict';

	class EntityCreator {
		#chatId = 0;
		#restClient;
		#onCalendarEntrySaveHandler;
		constructor(chatId) {
			this.#restClient = im_v2_application_core.Core.getRestClient();
			this.#chatId = chatId;
		}
		openCollabTaskCreationForm(collabId) {
			this.openTaskCreationForm({
				groupId: collabId
			});
		}
		openCollabMeetingCreationSlider(collabId) {
			this.#openCalendarSlider({
				type: 'group',
				ownerId: collabId
			});
		}
		openTaskCreationForm(additionalParams = {}) {
			this.#openTaskV2Card({
				analytics: {
					context: 'chat',
					element: 'create_button'
				},
				...additionalParams
			});
		}
		createTaskForChat() {
			return this.#createTask();
		}
		createTaskForMessage(messageId) {
			return this.#createTask(messageId);
		}
		createMeetingForChat() {
			return this.#createMeeting();
		}
		createFlowForChat() {
			return this.#createFlow();
		}
		createMeetingForMessage(messageId) {
			return this.#createMeeting(messageId);
		}
		#createMeeting(messageId) {
			const queryParams = {
				CHAT_ID: this.#chatId
			};
			if (messageId) {
				queryParams.MESSAGE_ID = messageId;
			}
			return this.#requestPreparedParams(im_v2_const.RestMethod.imChatCalendarPrepare, queryParams).then(sliderParams => {
				const {
					params
				} = sliderParams;
				const CALENDAR_ON_ENTRY_SAVE_EVENT = 'BX.Calendar:onEntrySave';
				this.#onCalendarEntrySaveHandler = this.#onCalendarEntrySave.bind(this, params.sliderId, messageId);
				main_core_events.EventEmitter.subscribeOnce(CALENDAR_ON_ENTRY_SAVE_EVENT, this.#onCalendarEntrySaveHandler);
				return this.#openCalendarSlider(params);
			});
		}
		#createTask(messageId) {
			const config = {
				data: {
					chatId: this.#chatId
				}
			};
			if (messageId) {
				config.data.messageId = messageId;
			}
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatTaskPrepare, config).then(taskParams => {
				const {
					link,
					params
				} = taskParams;
				return params.is_tasks_v2 ? this.#openPrefilledTaskV2Card(params) : this.#openTaskSlider(link, params);
			});
		}
		#createFlow() {
			const config = {
				data: {
					chatId: this.#chatId
				}
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatFlowPrepare, config).then(async params => {
				const {
					EditForm
				} = await main_core.Runtime.loadExtension('tasks.flow.edit-form');
				return EditForm.createInstance({
					groupId: params.groupId
				});
			});
		}
		#requestPreparedParams(requestMethod, query) {
			return this.#restClient.callMethod(requestMethod, query).then(result => {
				return result.data();
			}).catch(error => {
				console.error(error);
			});
		}
		#openTaskSlider(sliderUri, sliderParams) {
			BX.SidePanel.Instance.open(sliderUri, {
				requestMethod: 'post',
				requestParams: sliderParams,
				cacheable: false
			});
		}
		async #openTaskV2Card(payload = {}) {
			const {
				TaskCard
			} = await main_core.Runtime.loadExtension('tasks.v2.application.task-card');
			TaskCard.showCompactCard(payload);
		}
		#openPrefilledTaskV2Card(params) {
			const entityId = params.entityId ?? null;
			const subEntityId = params.subEntityId ?? null;
			const auditors = params.auditors ? params.auditors.split(',').map(auditorId => parseInt(auditorId.trim(), 10)) : [];
			const payload = {
				groupId: params.groupId ?? null,
				description: params.description ?? null,
				auditorsIds: auditors,
				fileIds: params.UF_TASK_WEBDAV_FILES,
				analytics: {
					context: params.ta_sec,
					element: params.ta_el
				},
				source: {
					type: 'chat',
					entityId,
					subEntityId
				}
			};
			void this.#openTaskV2Card(payload);
		}
		#openCalendarSlider(sliderParams) {
			new (window.top.BX || window.BX).Calendar.SliderLoader(0, sliderParams).show();
		}
		#onCalendarEntrySave(sliderId, messageId, event) {
			const eventData = event.getData();
			if (eventData.sliderId !== sliderId) {
				return;
			}
			const queryParams = {
				CALENDAR_ID: eventData.responseData.entryId,
				CHAT_ID: this.#chatId
			};
			if (messageId) {
				queryParams.MESSAGE_ID = messageId;
			}
			return this.#restClient.callMethod(im_v2_const.RestMethod.imChatCalendarAdd, queryParams).catch(error => {
				console.error(error);
			});
		}
	}

	exports.EntityCreator = EntityCreator;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Calendar, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=entity-creator.bundle.js.map
