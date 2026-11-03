import {
	type CheckListCompletionGroup,
	type CheckListCompletionItem,
	type CheckListCompletionSnapshot,
	type CheckListCompletionSourceItem,
} from '../../types';

type Descendant = { item: CheckListCompletionSourceItem, depth: number };

export function buildCompletionSnapshot(
	source: ReadonlyArray<CheckListCompletionSourceItem>,
): CheckListCompletionSnapshot
{
	const items = (source ?? []).filter(Boolean);
	const byId = new Map(items.map((item) => [Number(item.id), item]));
	const children = new Map<number, CheckListCompletionSourceItem[]>();
	items.forEach((item) => {
		const parentId = Number(item.parentId ?? 0);
		let siblings = children.get(parentId);
		if (!siblings)
		{
			siblings = [];
			children.set(parentId, siblings);
		}

		siblings.push(item);
	});
	children.forEach((siblings) => siblings.sort(compareItems));

	const groups: CheckListCompletionGroup[] = [];
	const incompleteIds: number[] = [];
	(children.get(0) ?? []).forEach((root) => {
		const descendants: Descendant[] = [];
		walk(root, children, 0, descendants, new Set([Number(root.id)]));
		const incomplete = descendants.filter(({ item }) => item.isComplete !== true);
		if (incomplete.length === 0)
		{
			return;
		}

		const included = new Set(incomplete.map(({ item }) => Number(item.id)));
		incomplete.forEach(({ item }) => {
			let parentId = Number(item.parentId ?? 0);
			const visitedParentIds = new Set<number>();
			while (
				parentId !== 0
				&& parentId !== Number(root.id)
				&& !included.has(parentId)
				&& !visitedParentIds.has(parentId)
			)
			{
				visitedParentIds.add(parentId);
				included.add(parentId);
				parentId = Number(byId.get(parentId)?.parentId ?? 0);
			}
		});

		const groupItems: CheckListCompletionItem[] = descendants
			.filter(({ item }) => included.has(Number(item.id)))
			.map(({ item, depth }) => Object.freeze({
				id: Number(item.id),
				rootId: Number(root.id),
				title: String(item.title ?? ''),
				depth,
				isContext: item.isComplete === true,
			}));
		incompleteIds.push(...incomplete.map(({ item }) => Number(item.id)));
		groups.push(Object.freeze({
			id: Number(root.id),
			title: String(root.title ?? ''),
			completedCount: descendants.length - incomplete.length,
			totalCount: descendants.length,
			items: Object.freeze(groupItems),
		}));
	});

	return Object.freeze({
		groups: Object.freeze(groups),
		incompleteIds: Object.freeze(incompleteIds),
		firstIncompleteId: incompleteIds[0] ?? null,
	});
}

function walk(
	parent: CheckListCompletionSourceItem,
	children: Map<number, CheckListCompletionSourceItem[]>,
	depth: number,
	result: Descendant[],
	visited: Set<number>,
): void
{
	(children.get(Number(parent.id)) ?? []).forEach((item) => {
		const id = Number(item.id);
		if (visited.has(id))
		{
			return;
		}
		visited.add(id);
		result.push({ item, depth });
		walk(item, children, depth + 1, result, visited);
	});
}

function compareItems(a: CheckListCompletionSourceItem, b: CheckListCompletionSourceItem): number
{
	return Number(a.sortIndex ?? 0) - Number(b.sortIndex ?? 0) || Number(a.id) - Number(b.id);
}
