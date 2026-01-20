/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,main_core,tasks_v2_core,tasks_v2_const,tasks_v2_lib_idUtils,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService) {
	'use strict';

	function mapModelToDto(reminder) {
	  return {
	    id: reminder.id,
	    taskId: reminder.taskId,
	    userId: reminder.userId,
	    nextRemindTs: mapValue(reminder.nextRemindTs, Math.floor(reminder.nextRemindTs / 1000)),
	    remindBy: reminder.remindBy,
	    remindVia: reminder.remindVia,
	    recipient: reminder.recipient,
	    before: mapValue(reminder.before, Math.floor(reminder.before / 1000))
	  };
	}
	function mapDtoToModel(reminderDto) {
	  var _reminderDto$before;
	  return {
	    id: reminderDto.id,
	    taskId: reminderDto.taskId,
	    userId: reminderDto.userId,
	    nextRemindTs: mapValue(reminderDto.nextRemindTs, reminderDto.nextRemindTs * 1000),
	    remindBy: reminderDto.remindBy,
	    remindVia: reminderDto.remindVia,
	    recipient: reminderDto.recipient,
	    before: mapValue((_reminderDto$before = reminderDto.before) != null ? _reminderDto$before : undefined, reminderDto.before * 1000)
	  };
	}
	function mapValue(value, mappedValue) {
	  return main_core.Type.isUndefined(value) ? undefined : mappedValue;
	}

	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	class RemindersService {
	  constructor() {
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: {}
	    });
	  }
	  async list(taskId) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache][taskId] || !Number.isInteger(taskId)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache][taskId] = true;
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReminderList, {
	        taskId
	      });
	      await this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/upsertMany`, data.map(it => mapDtoToModel(it)));
	    } catch (error) {
	      console.error('Reminder.list', error);
	    }
	  }
	  async set(taskId, reminders) {
	    void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      numberOfReminders: reminders.length
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/upsertMany`, reminders.map(reminder => ({
	      ...reminder,
	      taskId
	    })));
	    try {
	      const task = tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto({
	        id: taskId,
	        reminders
	      });
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReminderSet, {
	        task
	      });
	      await this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/deleteMany`, reminders.map(({
	        id
	      }) => id));
	    } catch (error) {
	      console.error('Reminder.set', error);
	    }
	  }
	  async add(reminder) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(reminder.taskId);
	    void tasks_v2_provider_service_taskService.taskService.updateStoreTask(reminder.taskId, {
	      numberOfReminders: task.numberOfReminders + 1
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/upsert`, reminder);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(reminder.taskId)) {
	      return;
	    }
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReminderAdd, {
	        reminder: mapModelToDto(reminder)
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/update`, {
	        id: reminder.id,
	        fields: mapDtoToModel(data)
	      });
	    } catch (error) {
	      console.error('Reminder.add', error);
	    }
	  }
	  async update(reminder) {
	    const {
	      id,
	      ...fields
	    } = reminder;
	    const reminderBefore = this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](id);
	    if (JSON.stringify(reminderBefore) === JSON.stringify(reminder)) {
	      return;
	    }
	    void this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/update`, {
	      id,
	      fields
	    });
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReminderUpdate, {
	        reminder: mapModelToDto(reminder)
	      });
	    } catch (error) {
	      console.error('Reminder.add', error);
	    }
	  }
	  async delete(id) {
	    const reminder = this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](id);
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(reminder.taskId);
	    void tasks_v2_provider_service_taskService.taskService.updateStoreTask(reminder.taskId, {
	      numberOfReminders: task.numberOfReminders - 1
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.Reminders}/delete`, id);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(reminder.taskId)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReminderDelete, {
	        reminder: {
	          id
	        }
	      });
	    } catch (error) {
	      console.error('Reminder.delete', error);
	    }
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}

	const remindersService = new RemindersService();
	const RemindersMappers = {
	  mapModelToDto,
	  mapDtoToModel
	};

	exports.remindersService = remindersService;
	exports.RemindersMappers = RemindersMappers;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=reminders-service.bundle.js.map
