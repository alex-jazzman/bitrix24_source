import { type GridPagePayload } from '../../../model/grid/types';
import { type DraftPageResponse, type MessagePageResponse } from './types';

/**
 * The two lists answer with two shapes and the state keeps one. The number of the page is taken off
 * the answer rather than off the request, because the server clamps what it was asked for.
 */
export function mapMessagePage(response: MessagePageResponse): GridPagePayload
{
	const {
		rows,
		projections,
		enableNextPage,
		pageLimitReached,
		page,
		hrefIds,
		filterApplied,
	} = response;

	return { rows, projections, enableNextPage, pageLimitReached, page, hrefIds, filterApplied };
}

export function mapDraftPage(response: DraftPageResponse): GridPagePayload
{
	const { rows, enableNextPage, pageLimitReached, page, total } = response;

	return { rows, enableNextPage, pageLimitReached, page, total };
}
