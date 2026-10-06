import { SearchField } from './search-field';

export class MatchIndex
{
	field: SearchField | null = null;
	queryWord: string | null = null;
	startIndex: number | null = null;
	endIndex: number | null = null;

	constructor(field: SearchField, queryWord: string, startIndex: number)
	{
		this.field = field;
		this.queryWord = queryWord;
		this.startIndex = startIndex;
		this.endIndex = startIndex + queryWord.length;
	}

	getField(): SearchField | null
	{
		return this.field;
	}

	getQueryWord(): string | null
	{
		return this.queryWord;
	}

	getStartIndex(): number | null
	{
		return this.startIndex;
	}

	getEndIndex(): number | null
	{
		return this.endIndex;
	}
}
