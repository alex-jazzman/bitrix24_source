import { type RelationOption } from '../relation-rows/relation-rows';
import { RELATION_OPTION_GROUP } from '../../const/relations-layout';

export type RelationOptionGroup = {
	key: string;
	title: string;
	options: RelationOption[];
};

// Groups a row's options under their heading — process card vs. related entity card — preserving
// first-seen order. buildOptions (relation-rows.ts) always emits parent-field before
// parent-children-list before child-field and child-children-list, so the process group already
// comes first for a complete row; this only folds same-heading options together, it does not re-sort.
export function groupRelationOptions(options: RelationOption[]): RelationOptionGroup[]
{
	const groups: RelationOptionGroup[] = [];
	const byTitle = new Map<string, RelationOptionGroup>();

	options.forEach((option) => {
		const title = RELATION_OPTION_GROUP[`${option.direction}-${option.kind}`];
		if (!title)
		{
			return;
		}

		let group = byTitle.get(title);
		if (!group)
		{
			group = { key: title, title, options: [] };
			byTitle.set(title, group);
			groups.push(group);
		}
		group.options.push(option);
	});

	return groups;
}
