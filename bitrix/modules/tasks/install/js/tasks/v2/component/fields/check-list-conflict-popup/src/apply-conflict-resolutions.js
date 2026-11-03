import { Model } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

export async function applyConflictResolutions({ conflicts, resolutions, store, taskId, checkListItems }): Promise<boolean>
{
	const storeDispatch = store.dispatch.bind(store);
	const itemsById = new Map(checkListItems.map((item) => [item.id, item]));
	const getItemById = (id) => itemsById.get(id) ?? null;

	const patches = new Map();

	conflicts.forEach((conflict) => {
		const key = `${conflict.id}::${conflict.field}`;
		const resolution = resolutions[key] ?? 'INCOMING';

		let chosenValue;
		if (resolution === 'LOCAL')
		{
			if (conflict.field === 'title')
			{
				const liveItem = getItemById(conflict.id);
				chosenValue = liveItem ? liveItem[conflict.field] : conflict.local;
			}
			else
			{
				chosenValue = conflict.local;
			}
		}
		else
		{
			chosenValue = conflict.incoming;
		}

		if (!patches.has(conflict.id))
		{
			patches.set(conflict.id, {});
		}

		const patch = patches.get(conflict.id);

		if (conflict.field === 'deleted')
		{
			patch.__deleteResolution = chosenValue === null ? 'DELETE' : 'KEEP';
			if (chosenValue !== null)
			{
				patch.__keepItem = chosenValue;
			}
		}
		else
		{
			patch[conflict.field] = chosenValue;
		}
	});

	const updates = [];
	const restoredIds = [];
	const deletableIds = [];

	const childrenByParent = new Map();
	checkListItems.forEach((it) => {
		const siblings = childrenByParent.get(it.parentId) ?? [];
		siblings.push(it.id);
		childrenByParent.set(it.parentId, siblings);
	});
	const collectSubtreeIds = (rootId) => {
		const ids = [rootId];
		const stack = [rootId];
		while (stack.length > 0)
		{
			const parentId = stack.pop();
			(childrenByParent.get(parentId) ?? []).forEach((childId) => {
				ids.push(childId);
				stack.push(childId);
			});
		}

		return ids;
	};

	patches.forEach((patch, itemId) => {
		const item = getItemById(itemId);

		if (patch.__deleteResolution === 'DELETE')
		{
			collectSubtreeIds(itemId).forEach((id) => {
				if (getItemById(id))
				{
					deletableIds.push(id);
				}
			});

			return;
		}

		const { __deleteResolution, __keepItem, ...fields } = patch; // eslint-disable-line no-unused-vars
		const baseItem = item ?? __keepItem;
		if (!baseItem)
		{
			return;
		}

		if (__keepItem !== undefined)
		{
			restoredIds.push(itemId);
		}

		if (__keepItem !== undefined || Object.keys(fields).length > 0)
		{
			updates.push({ ...baseItem, ...(__keepItem ?? {}), ...fields });
		}
	});

	if (deletableIds.length > 0)
	{
		await storeDispatch(`${Model.CheckList}/deleteMany`, deletableIds);
	}

	if (updates.length > 0)
	{
		await storeDispatch(`${Model.CheckList}/upsertMany`, updates);
	}

	const task = taskService.getStoreTask(taskId);
	const currentIds = task.checklist ?? [];
	const missingRestoredIds = restoredIds.filter((id) => !currentIds.includes(id));
	if (missingRestoredIds.length > 0)
	{
		taskService.updateStoreTask(taskId, { checklist: [...currentIds, ...missingRestoredIds] });
	}

	checkListService.clearPullConflicts(taskId);

	const freshTask = taskService.getStoreTask(taskId);
	const checkLists = store.getters[`${Model.CheckList}/getByIds`](freshTask.checklist ?? []);
	await checkListService.save(taskId, checkLists, false);

	return !checkListService.getPullConflicts().some((conflict) => conflict.taskId === taskId);
}
