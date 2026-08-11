import { Loc, Text } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Notifier } from 'ui.notification-manager';

import { TaskCard } from 'tasks.v2.application.task-card';
import { EventName } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';

class TaskNotification
{
	constructor()
	{
		EventEmitter.subscribe(EventName.NotifyTaskTemplateUpdated, this.#handleTaskTemplateUpdated);
		EventEmitter.subscribe(EventName.NotifyTemplateCreated, this.#handleTemplateCreated);
	}

	#handleTaskTemplateUpdated = (event: BaseEvent): void => {
		const { templateId } = event.getData();

		BX.UI.Notification.Center.notify({
			id: Text.getRandom(),
			content: Loc.getMessage('TASKS_V2_NOTIFY_TASK_TEMPLATE_UPDATED'),
			useAirDesign: true,
			actions: [
				{
					title: Loc.getMessage('TASKS_V2_NOTIFY_TASK_TEMPLATE_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();

							TaskCard.showFullCard({ taskId: idUtils.boxTemplate(templateId) });
						},
					},
				},
			],
		});
	};

	#handleTemplateCreated = (event: BaseEvent): void => {
		const { id, error } = event.getData();

		if (error)
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-template-created',
				text: Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_FAIL'),
			});

			return;
		}

		BX.UI.Notification.Center.notify({
			id: 'task-notify-template-created',
			content: Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_SUCC'),
			useAirDesign: true,
			actions: [
				{
					id: 'open-template',
					title: Loc.getMessage('TASKS_V2_NOTIFY_TEMPLATE_CREATED_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();
							TaskCard.showFullCard({ taskId: id });
						},
					},
				},
			],
		});
	};
}

export const taskNotification = new TaskNotification();
