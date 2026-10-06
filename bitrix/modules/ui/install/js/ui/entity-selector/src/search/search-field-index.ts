import { type SearchField } from './search-field';
import { type WordIndex } from './word-index';

export class SearchFieldIndex
{
	field: SearchField | null = null;
	indexes: WordIndex[] = [];

	constructor(field: SearchField, indexes: WordIndex[] = [])
	{
		this.field = field;
		this.addIndexes(indexes);
	}

	getField(): SearchField | null
	{
		return this.field;
	}

	getIndexes(): WordIndex[]
	{
		return this.indexes;
	}

	addIndex(index: WordIndex)
	{
		this.getIndexes().push(index);
	}

	addIndexes(indexes: WordIndex[])
	{
		for (const index of indexes)
		{
			this.addIndex(index);
		}
	}
}
