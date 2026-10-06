import { TemplateApi } from '../../infrastructure/service/template/template';
import {
	type SearchTemplatesRequest,
	type SearchTemplatesResponse,
} from '../../infrastructure/service/template/types';
import { type TemplateListItem } from '../../model/compose/types';

const SearchDelay = 300;
const SearchLimit = 20;

/**
 * The longest query the search carries. The catalogue looks the query up in the title of a template, and that
 * title holds 128 characters, so a longer query can match nothing at all: it is answered with an empty list
 * instead of being asked about, which also keeps a pasted fragment of a letter out of the header buffer of the
 * web server. Counted in characters rather than code units, as the server counts them.
 */
const MaxQueryLength = 128;

export type TemplateSearchState = {
	items: TemplateListItem[],
	isLoading: boolean,
	error: boolean,
	nextOffset: number | null,
};

export type TemplateSearchApi = {
	search(request: SearchTemplatesRequest): Promise<SearchTemplatesResponse>,
};

export type TemplateSearchController = {
	search(query: string): void,
	loadMore(): void,
	retry(): void,
	destroy(): void,
};

export function createTemplateSearch(params: {
	state: TemplateSearchState,
	api?: TemplateSearchApi,
	delay?: number,
}): TemplateSearchController
{
	const { state } = params;
	const api = params.api ?? TemplateApi;
	const delay = params.delay ?? SearchDelay;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let sequence = 0;
	let currentQuery = '';
	let isQueryOverBound = false;

	const clearTimer = (): void => {
		if (timer !== null)
		{
			clearTimeout(timer);
			timer = null;
		}
	};

	const request = (query: string, offset: number, append: boolean, deferred: boolean): void => {
		clearTimer();
		const requestSequence = ++sequence;
		const run = (): void => {
			timer = null;
			state.isLoading = true;
			state.error = false;
			void api.search({ query, offset, limit: SearchLimit }).then(
				(response): void => {
					if (sequence !== requestSequence)
					{
						return;
					}

					state.items = append ? [...state.items, ...response.items] : response.items;
					state.nextOffset = response.nextOffset;
					state.isLoading = false;
				},
				(): void => {
					if (sequence !== requestSequence)
					{
						return;
					}

					state.error = true;
					state.isLoading = false;
				},
			);
		};

		if (!deferred || delay <= 0)
		{
			run();
		}
		else
		{
			timer = setTimeout(run, delay);
		}
	};

	/**
	 * Cutting the query down to the bound would answer a query the field never held, so a query over it is
	 * answered here: nothing can match it anyway, and the list says as much.
	 */
	const answerNothingFound = (): void => {
		clearTimer();
		sequence += 1;
		state.items = [];
		state.isLoading = false;
		state.error = false;
	};

	return {
		search(query: string): void
		{
			const characters = [...query.trim()];
			isQueryOverBound = characters.length > MaxQueryLength;
			currentQuery = characters.join('');
			state.nextOffset = null;
			if (isQueryOverBound)
			{
				answerNothingFound();

				return;
			}

			request(currentQuery, 0, false, true);
		},

		loadMore(): void
		{
			if (!state.isLoading && state.nextOffset !== null)
			{
				request(currentQuery, state.nextOffset, true, false);
			}
		},

		retry(): void
		{
			if (isQueryOverBound)
			{
				answerNothingFound();

				return;
			}

			request(currentQuery, 0, false, false);
		},

		destroy(): void
		{
			clearTimer();
			sequence += 1;
		},
	};
}
