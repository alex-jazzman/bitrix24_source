import { MatchField } from './match-field';

import { type MatchIndex } from './match-index';
import { type SearchField } from './search-field';
import { type Item } from '../item/item';

export class MatchResult
{
	item: Item;
	matchFields: Map<SearchField, MatchField> = new Map();
	sort: number | null = null;

	constructor(item: Item, matchIndexes: MatchIndex[] = [])
	{
		this.item = item;
		this.addIndexes(matchIndexes);
	}

	getItem(): Item
	{
		return this.item;
	}

	getMatchFields(): Map<SearchField, MatchField>
	{
		return this.matchFields;
	}

	getSort(): number | null
	{
		return this.sort;
	}

	addIndex(matchIndex: MatchIndex): void
	{
		let matchField = this.matchFields.get(matchIndex.getField()!);
		if (!matchField)
		{
			matchField = new MatchField(matchIndex.getField()!);
			this.matchFields.set(matchIndex.getField()!, matchField);

			const fieldSort = matchIndex.getField()!.getSort();
			if (fieldSort !== null)
			{
				this.sort = this.sort === null ? fieldSort : Math.min(this.sort as number, fieldSort as number);
			}
		}

		matchField.addIndex(matchIndex);
	}

	addIndexes(matchIndexes: MatchIndex[]): void
	{
		for (const matchIndex of matchIndexes)
		{
			this.addIndex(matchIndex);
		}
	}
}
