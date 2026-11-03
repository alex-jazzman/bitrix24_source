export const SEMANTIC_SCALAR_FIELDS = ['title', 'parentId', 'sortIndex', 'isImportant', 'isComplete'];
export const MEMBER_FIELDS = ['accomplices', 'auditors'];
export const ATTACHMENT_FIELD = 'attachments';

const CARRIED_LOCAL_FIELDS = [
	'actions',
	'panelIsShown',
	'myFilterActive',
	'collapsed',
	'expanded',
	'localCollapsedState',
	'areCompletedCollapsed',
	'hidden',
	'groupMode',
];

function carryLocalFields(target, localItem)
{
	CARRIED_LOCAL_FIELDS.forEach((field) => {
		if (target[field] !== undefined && target[field] !== null)
		{
			return;
		}

		if (localItem && localItem[field] !== undefined && localItem[field] !== null)
		{
			target[field] = localItem[field];
		}
		else
		{
			delete target[field];
		}
	});

	return target;
}

function reconcileLocalCompleteState(merged, localItem, id, isFieldActive)
{
	const localValue = localItem ? localItem.localCompleteState : undefined;

	if (isFieldActive(id, 'isComplete') && localValue !== undefined && localValue !== null)
	{
		merged.localCompleteState = localValue;
	}
	else
	{
		merged.localCompleteState = null;
	}
}

function indexById(items)
{
	const map = new Map();
	items.forEach((item) => {
		map.set(item.id, item);
	});

	return map;
}

export function memberSetsEqual(a, b)
{
	const aIds = new Set((a ?? []).map((u) => u.id));
	const bIds = new Set((b ?? []).map((u) => u.id));
	if (aIds.size !== bIds.size)
	{
		return false;
	}
	for (const id of aIds)
	{
		if (!bIds.has(id))
		{
			return false;
		}
	}

	return true;
}

function attachmentSetsEqual(a, b)
{
	return memberSetsEqual(a, b);
}

function scalarChanged(base, candidate, field)
{
	const baseVal = base ? base[field] : undefined;

	return baseVal !== candidate[field];
}

function resolveIncomingActions(incomingItem, options, localCanToggle = false)
{
	const creatorId = incomingItem?.creator?.id ?? null;
	const canEdit = options.checklistEdit === true
		|| (creatorId !== null && creatorId === options.currentUserId);

	return {
		modify: canEdit,
		remove: canEdit,
		toggle: options.checklistToggle === true || localCanToggle === true,
	};
}

export function mergeCheckLists(base, local, incoming, options = {})
{
	const isFieldActive = typeof options.isFieldActive === 'function'
		? options.isFieldActive
		: () => false;

	const baseMap = indexById(base ?? []);
	const localMap = indexById(local ?? []);
	const incomingMap = indexById(incoming ?? []);

	const localCanToggle = [...localMap.values()].some((it) => it?.actions?.toggle === true);

	const conflicts = [];

	const deferred = [];

	const allIds = new Set([
		...baseMap.keys(),
		...localMap.keys(),
		...incomingMap.keys(),
	]);

	const mergedMap = new Map();

	allIds.forEach((id) => {
		const baseItem = baseMap.get(id) ?? null;
		const localItem = localMap.get(id) ?? null;
		const incomingItem = incomingMap.get(id) ?? null;

		if (!incomingItem && localItem && baseItem)
		{
			const localChanged = SEMANTIC_SCALAR_FIELDS.some((f) => scalarChanged(baseItem, localItem, f))
				|| !memberSetsEqual(baseItem.accomplices, localItem.accomplices)
				|| !memberSetsEqual(baseItem.auditors, localItem.auditors)
				|| !attachmentSetsEqual(baseItem.attachments, localItem.attachments);

			if (localChanged)
			{
				conflicts.push({
					id,
					field: 'deleted',
					base: baseItem,
					local: localItem,
					incoming: null,
					resolution: 'MANUAL',
				});
				mergedMap.set(id, localItem);
			}
			return;
		}

		if (!localItem && incomingItem && baseItem)
		{
			const incomingChanged = SEMANTIC_SCALAR_FIELDS.some((f) => scalarChanged(baseItem, incomingItem, f))
				|| !memberSetsEqual(baseItem.accomplices, incomingItem.accomplices)
				|| !memberSetsEqual(baseItem.auditors, incomingItem.auditors)
				|| !attachmentSetsEqual(baseItem.attachments, incomingItem.attachments);

			if (incomingChanged)
			{
				conflicts.push({
					id,
					field: 'deleted',
					base: baseItem,
					local: null,
					incoming: incomingItem,
					resolution: 'MANUAL',
				});
				mergedMap.set(id, carryLocalFields({ ...incomingItem }, null));
			}
			return;
		}

		if (!incomingItem && !baseItem && localItem)
		{
			mergedMap.set(id, localItem);

			return;
		}

		if (!localItem && !baseItem && incomingItem)
		{
			const newItem = carryLocalFields({ ...incomingItem }, null);
			if (newItem.actions === undefined)
			{
				newItem.actions = resolveIncomingActions(incomingItem, options, localCanToggle);
			}
			mergedMap.set(id, newItem);

			return;
		}

		if (!localItem && !incomingItem)
		{
			return;
		}

		if (!baseItem && localItem && incomingItem)
		{
			const merged = carryLocalFields({ ...incomingItem }, localItem);
			reconcileLocalCompleteState(merged, localItem, id, isFieldActive);
			mergedMap.set(id, merged);

			return;
		}

		const merged = { ...incomingItem };

		SEMANTIC_SCALAR_FIELDS.forEach((field) => {
			const localChanged = scalarChanged(baseItem, localItem, field);
			const incomingChanged = scalarChanged(baseItem, incomingItem, field);
			const divergentConflict = localChanged && incomingChanged && localItem[field] !== incomingItem[field];

			if (field === 'title' && divergentConflict)
			{
				conflicts.push({
					id,
					field: 'title',
					base: baseItem[field],
					local: localItem[field],
					incoming: incomingItem[field],
					resolution: 'MANUAL',
				});
				merged[field] = localItem[field];

				return;
			}

			if (incomingChanged && isFieldActive(id, field))
			{
				merged[field] = localItem[field];
				deferred.push({ id, field, value: incomingItem[field] });

				return;
			}

			if (divergentConflict)
			{
				merged[field] = incomingItem[field];
			}
			else if (localChanged && !incomingChanged)
			{
				merged[field] = localItem[field];
			}
		});

		MEMBER_FIELDS.forEach((field) => {
			const localChanged = !memberSetsEqual(baseItem[field], localItem[field]);
			const incomingChanged = !memberSetsEqual(baseItem[field], incomingItem[field]);

			if (localChanged && !incomingChanged)
			{
				merged[field] = localItem[field];
			}
		});

		const baseAtts = baseItem[ATTACHMENT_FIELD] ?? [];
		const localAtts = localItem[ATTACHMENT_FIELD] ?? [];
		const incomingAtts = incomingItem[ATTACHMENT_FIELD] ?? [];

		const baseIds = new Set(baseAtts.map((a) => a.id));
		const localIds = new Set(localAtts.map((a) => a.id));
		const incomingIds = new Set(incomingAtts.map((a) => a.id));

		const localAdded = localAtts.filter((a) => !baseIds.has(a.id));
		const incomingAdded = incomingAtts.filter((a) => !baseIds.has(a.id));
		const localRemoved = baseAtts.filter((a) => !localIds.has(a.id));
		const incomingRemoved = baseAtts.filter((a) => !incomingIds.has(a.id));

		const localAttsChanged = localAdded.length > 0 || localRemoved.length > 0;
		const incomingAttsChanged = incomingAdded.length > 0 || incomingRemoved.length > 0;

		const removalConflict = localAttsChanged
			&& incomingAttsChanged
			&& (
				localRemoved.some((a) => incomingIds.has(a.id))
				|| incomingRemoved.some((a) => localIds.has(a.id))
			);

		if (removalConflict)
		{
			conflicts.push({
				id,
				field: ATTACHMENT_FIELD,
				base: baseAtts,
				local: localAtts,
				incoming: incomingAtts,
				resolution: 'MANUAL',
			});
			merged[ATTACHMENT_FIELD] = incomingAtts;
		}
		else
		{
			const removedIds = new Set([...localRemoved, ...incomingRemoved].map((a) => a.id));
			const attById = new Map();
			baseAtts.forEach((a) => attById.set(a.id, a));
			localAtts.forEach((a) => attById.set(a.id, a));
			incomingAtts.forEach((a) => attById.set(a.id, a));

			const resultIds = new Set([
				...baseAtts.map((a) => a.id).filter((attId) => !removedIds.has(attId)),
				...localAdded.map((a) => a.id),
				...incomingAdded.map((a) => a.id),
			]);

			merged[ATTACHMENT_FIELD] = [...resultIds].map((attId) => attById.get(attId));
		}

		carryLocalFields(merged, localItem);
		reconcileLocalCompleteState(merged, localItem, id, isFieldActive);

		mergedMap.set(id, merged);
	});

	const appendDescendants = (rootIds, sourceMap) => {
		if (rootIds.length === 0)
		{
			return;
		}

		const childrenByParent = new Map();
		sourceMap.forEach((it) => {
			const siblings = childrenByParent.get(it.parentId) ?? [];
			siblings.push(it);
			childrenByParent.set(it.parentId, siblings);
		});

		const stack = [...rootIds];
		while (stack.length > 0)
		{
			const parentId = stack.pop();
			(childrenByParent.get(parentId) ?? []).forEach((child) => {
				if (!mergedMap.has(child.id))
				{
					mergedMap.set(child.id, carryLocalFields({ ...child }, localMap.get(child.id) ?? null));
				}
				stack.push(child.id);
			});
		}
	};

	const keptDeletedConflicts = conflicts.filter((c) => c.field === 'deleted');

	appendDescendants(
		keptDeletedConflicts.filter((c) => c.local !== null).map((c) => c.id),
		localMap,
	);

	appendDescendants(
		keptDeletedConflicts.filter((c) => c.local === null && c.incoming !== null).map((c) => c.id),
		incomingMap,
	);

	return {
		merged: [...mergedMap.values()],
		conflicts,
		deferred,
	};
}

export function deriveParentCompletion(items, options = {})
{
	const isFieldActive = typeof options.isFieldActive === 'function'
		? options.isFieldActive
		: () => false;

	const byId = indexById(items ?? []);

	const childIds = new Map();
	(items ?? []).forEach((item) => {
		const siblings = childIds.get(item.parentId) ?? [];
		siblings.push(item.id);
		childIds.set(item.parentId, siblings);
	});

	const depthCache = new Map();
	const depthOf = (item) => {
		if (depthCache.has(item.id))
		{
			return depthCache.get(item.id);
		}

		const path = [];
		const visited = new Set();
		let current = item;
		while (current && current.parentId && !depthCache.has(current.id) && !visited.has(current.id))
		{
			path.push(current);
			visited.add(current.id);
			current = byId.get(current.parentId);
		}

		let depth = current && depthCache.has(current.id) ? depthCache.get(current.id) : 0;
		for (let index = path.length - 1; index >= 0; index--)
		{
			depth++;
			depthCache.set(path[index].id, depth);
		}

		return depthCache.get(item.id) ?? 0;
	};

	const parents = (items ?? [])
		.filter((item) => childIds.has(item.id))
		.sort((a, b) => depthOf(b) - depthOf(a));

	parents.forEach((parent) => {
		if (isFieldActive(parent.id, 'isComplete'))
		{
			return;
		}

		const children = (childIds.get(parent.id) ?? []).map((id) => byId.get(id));
		if (children.length === 0)
		{
			return;
		}

		const allComplete = children.every((child) => child.localCompleteState ?? child.isComplete);
		const currentParent = byId.get(parent.id);
		if ((currentParent.isComplete ?? false) !== allComplete)
		{
			byId.set(parent.id, { ...currentParent, isComplete: allComplete });
		}
	});

	return (items ?? []).map((item) => byId.get(item.id));
}
