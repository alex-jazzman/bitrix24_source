import { Text } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListNotifier } from './check-list-notifier';
import {
	splitTitles,
	selectFreshTitles,
	computeAppendSortIndexes,
	collectSubtreeTitles,
} from './check-list-title-utils';

export type AddFromTextOutcome = { added: number, skipped: number };

/**
 * Adds selected text as items to an existing checklist; rolls back all inserts if the save fails.
 */
export class CheckListAddFromText
{
	#taskId: number | string;

	constructor(taskId: number | string)
	{
		this.#taskId = taskId;
	}

	/**
	 * Resolves with the add outcome, or null when nothing was processed (empty input or failed save).
	 */
	async addToCheckList(targetCheckList: CheckListModel, text: string, isEdit: boolean): Promise<?AddFromTextOutcome>
	{
		const titles = splitTitles(text);
		if (titles.length === 0)
		{
			return null;
		}

		const freshTitles = selectFreshTitles(titles, this.#titlesOf(targetCheckList));
		if (freshTitles.length === 0)
		{
			CheckListNotifier.notifyAllDuplicates();

			return { added: 0, skipped: titles.length };
		}

		const skipped = titles.length - freshTitles.length;

		const insertedIds = this.#insertToEnd(targetCheckList, freshTitles);

		if (!isEdit)
		{
			// Create mode: checklists are saved with the task, so no separate save or rollback.
			CheckListNotifier.notifyItemsAdded(freshTitles.length, skipped);

			return { added: freshTitles.length, skipped };
		}

		try
		{
			await checkListService.save(this.#taskId, this.#getCheckLists());

			CheckListNotifier.notifyItemsAdded(freshTitles.length, skipped);

			return { added: freshTitles.length, skipped };
		}
		catch (error)
		{
			console.error('tasks: check-list add from text: save failed', error);

			this.#rollback(insertedIds);

			CheckListNotifier.notifyServerError(() => {
				void this.addToCheckList(targetCheckList, text, isEdit);
			});

			return null;
		}
	}

	/**
	 * Titles across the whole subtree, not just direct children, to dedupe against nested items too.
	 * Items pending deferred deletion are skipped: save() drops them, so they must not count as duplicates.
	 */
	#titlesOf(targetCheckList: CheckListModel): string[]
	{
		return collectSubtreeTitles(this.#getCheckLists(), targetCheckList.id, this.#deletingCheckListIds());
	}

	#deletingCheckListIds(): Set<number | string>
	{
		const deletingIds = this.#store.getters[`${Model.Interface}/deletingCheckListIds`] ?? {};

		return new Set(Object.values(deletingIds));
	}

	#insertToEnd(targetCheckList: CheckListModel, titles: string[]): Array<number | string>
	{
		const sortIndexes = computeAppendSortIndexes(
			this.#getChildren(targetCheckList.id).map((item: CheckListModel) => item.sortIndex),
			titles.length,
		);

		const items = titles.map((title: string, index: number) => {
			const id = Text.getRandom();

			// parentNodeId is omitted: prepareCheckLists rebuilds it before sending.
			return {
				id,
				nodeId: id,
				parentId: targetCheckList.id,
				title,
				sortIndex: sortIndexes[index],
			};
		});

		const insertedIds = items.map((item) => item.id);

		void this.#store.dispatch(`${Model.CheckList}/insertMany`, items);

		const task = taskService.getStoreTask(this.#taskId);
		taskService.updateStoreTask(this.#taskId, {
			containsChecklist: true,
			checklist: [...(task?.checklist ?? []), ...insertedIds],
		});

		return insertedIds;
	}

	#rollback(insertedIds: Array<number | string>): void
	{
		void this.#store.dispatch(`${Model.CheckList}/deleteMany`, insertedIds);

		const insertedIdsSet = new Set(insertedIds);
		const task = taskService.getStoreTask(this.#taskId);
		const checklist = (task?.checklist ?? []).filter((id) => !insertedIdsSet.has(id));

		taskService.updateStoreTask(this.#taskId, {
			containsChecklist: checklist.length > 0,
			checklist,
		});
	}

	#getChildren(parentId: number | string): CheckListModel[]
	{
		return this.#getCheckLists().filter((item: CheckListModel) => item.parentId === parentId);
	}

	#getCheckLists(): CheckListModel[]
	{
		const task = taskService.getStoreTask(this.#taskId);

		return this.#store.getters[`${Model.CheckList}/getByIds`](task?.checklist ?? []);
	}

	get #store(): Store
	{
		return Core.getStore();
	}
}
