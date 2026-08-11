/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, ui_notificationManager, tasks_v2_application_taskCard, tasks_v2_const, tasks_v2_lib_idUtils) {
	'use strict';

	class TaskNotification {
		constructor() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.NotifyTaskTemplateUpdated, this.#handleTaskTemplateUpdated);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.NotifyTemplateCreated, this.#handleTemplateCreated);
		}
		#handleTaskTemplateUpdated = event => {
			const {
				templateId
			} = event.getData();
			BX.UI.Notification.Center.notify({
				id: main_core.Text.getRandom(),
				content: main_core.Loc.getMessage('TASKS_V2_NOTIFY_TASK_TEMPLATE_UPDATED'),
				useAirDesign: true,
				actions: [{
					title: main_core.Loc.getMessage('TASKS_V2_NOTIFY_TASK_TEMPLATE_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();
							tasks_v2_application_taskCard.TaskCard.showFullCard({
								taskId: tasks_v2_lib_idUtils.idUtils.boxTemplate(templateId)
							});
						}
					}
				}]
			});
		};
		#handleTemplateCreated = event => {
			const {
				id,
				error
			} = event.getData();
			if (error) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-template-created',
					text: main_core.Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_FAIL')
				});
				return;
			}
			BX.UI.Notification.Center.notify({
				id: 'task-notify-template-created',
				content: main_core.Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_SUCC'),
				useAirDesign: true,
				actions: [{
					id: 'open-template',
					title: main_core.Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();
							tasks_v2_application_taskCard.TaskCard.showFullCard({
								taskId: id
							});
						}
					}
				}]
			});
		};
	}
	const taskNotification = new TaskNotification();

	exports.taskNotification = taskNotification;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Event, BX.UI.NotificationManager, BX.Tasks.V2.Application, BX.Tasks.V2.Const, BX.Tasks.V2.Lib);
//# sourceMappingURL=task-notification.bundle.js.map
