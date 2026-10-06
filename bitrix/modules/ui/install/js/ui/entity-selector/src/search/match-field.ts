import { Type } from 'main.core';
import { OrderedArray } from 'main.core.collections';

import { MatchIndex } from './match-index';
import { type SearchField } from './search-field';

const comparator = (a: MatchIndex, b: MatchIndex) => {
	if (a.getStartIndex() === b.getStartIndex())
	{
		return a.getEndIndex()! > b.getEndIndex()! ? -1 : 1;
	}

	return a.getStartIndex()! > b.getStartIndex()! ? 1 : -1;
};

export class MatchField
{
	field: SearchField | null = null;
	matchIndexes: OrderedArray<MatchIndex> = new OrderedArray(comparator);

	constructor(field: SearchField, indexes: MatchIndex[] = [])
	{
		this.field = field;
		this.addIndexes(indexes);
	}

	getField(): SearchField | null
	{
		return this.field;
	}

	getMatches(): OrderedArray<MatchIndex>
	{
		return this.matchIndexes;
	}

	addIndex(matchIndex: MatchIndex): void
	{
		this.matchIndexes.add(matchIndex);
	}

	addIndexes(matchIndexes: MatchIndex[]): void
	{
		if (Type.isArray(matchIndexes))
		{
			for (const matchIndex of matchIndexes)
			{
				this.addIndex(matchIndex);
			}
		}
	}
}
