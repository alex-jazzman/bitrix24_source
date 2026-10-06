import { MatchResult } from './match-result';
import { MatchIndex } from './match-index';

import { type SearchFieldIndex } from './search-field-index';
import { type Item } from '../item/item';
import { type SearchQuery } from './search-query';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export type MatchOptions = {
	matchAll?: boolean;
};

export class SearchEngine
{
	static matchItems(items: Item[], searchQuery: SearchQuery, options: MatchOptions = {}): MatchResult[]
	{
		const matchResults = [];
		const queryWords = searchQuery.getQueryWords();
		let limit = searchQuery.getResultLimit();

		const matchAll = options.matchAll === true;

		for (const item of items)
		{
			if (limit === 0)
			{
				break;
			}

			if (item.isSelected() || !item.isSearchable() || item.isHidden() || !item.getEntity().isSearchable())
			{
				continue;
			}

			const matchResult = this.matchItem(item, queryWords);
			if (matchResult)
			{
				matchResults.push(matchResult);
				limit--;
			}
			else if (matchAll && item.getEntity().getDynamicSearchMatchMode() === 'all')
			{
				matchResults.push(new MatchResult(item, []));
				limit--;
			}
		}

		return matchResults;
	}

	static matchItem(item: Item, queryWords: string[]): MatchResult | null
	{
		let matches: MatchIndex[] = [];
		for (const queryWord of queryWords)
		{
			const results = this.matchWord(item, queryWord);
			// const match = this.matchWord(item, queryWord);
			// if (match === null)
			if (results.length === 0)
			{
				return null;
			}

			matches = matches.concat(results);
			// matches.push(match);
		}

		if (matches.length > 0)
		{
			return new MatchResult(item, matches);
		}
		else
		{
			return null;
		}
	}

	static matchWord(item: Item, queryWord: string): MatchIndex[]
	{
		const searchIndexes = item.getSearchIndex().getIndexes();
		const matches = [];

		for (const fieldIndex of searchIndexes)
		{
			const indexes = fieldIndex.getIndexes();
			for (const index of indexes)
			{
				const word = index.getWord().substring(0, queryWord.length);
				if (collator.compare(queryWord, word) === 0)
				{
					matches.push(new MatchIndex(fieldIndex.getField()!, queryWord, index.getStartIndex()));
					// return new MatchIndex(field, queryWord, index[i][1]);
				}
			}

			if (matches.length > 0)
			{
				break;
			}
		}

		return matches;
		// return null;
	}
}
