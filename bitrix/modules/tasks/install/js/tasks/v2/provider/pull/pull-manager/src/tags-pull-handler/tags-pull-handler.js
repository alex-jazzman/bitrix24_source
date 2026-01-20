import { EventEmitter } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { EventName, Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { BasePullHandler } from '../handler/base-pull-handler';

export class TagsPullHandler extends BasePullHandler
{
	getMap(): { [command: string]: Function }
	{
		return {
			tags_deleted: this.#handleTagsDeleted,
		};
	}

	#handleTagsDeleted = ({ tagNames, userId, groupId }): void => {
		tagNames.forEach((tagName: string) => this.#handleTagDeleted({ tagName, userId, groupId }));
	};

	#handleTagDeleted = ({ tagName, userId, groupId }): void => {
		if (!groupId && userId !== this.#currentUserId)
		{
			return;
		}

		const tasks: TaskModel[] = this.$store.getters[`${Model.Tasks}/getAll`];

		const tasksWithTag = tasks.filter((task: TaskModel) => {
			return (task.groupId || 0) === (groupId || 0) && task.tags.includes(tagName);
		});

		tasksWithTag.forEach((task: TaskModel) => {
			void taskService.updateStoreTask(task.id, {
				tags: task.tags.filter((it: string) => it !== tagName),
			});
		});

		EventEmitter.emit(EventName.TagDeleted, { tagName, groupId });
	};

	get #currentUserId(): number
	{
		return this.$store.getters[`${Model.Interface}/currentUserId`];
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
