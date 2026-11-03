import {
	type DraftRow,
	type MessageRow,
	type ProjectionRow,
} from '../../../model/grid/types';

export type MessageListAjaxError = {
	code?: string | number,
	message: string,
	customData?: unknown,
};

/** A failed request rejects with an envelope of the same shape, so the errors are read in one place. */
export type MessageListAjaxResponse<T> = {
	data: T,
	errors: MessageListAjaxError[],
	status: 'success' | 'error',
};

/** Answer of `mail.api.messagelist.getPage`. */
export type MessagePageResponse = {
	rows: MessageRow[],
	/** The letters being sent; empty on every page but the first one of the folder of the sent ones. */
	projections: ProjectionRow[],
	enableNextPage: boolean,
	/**
	 * Letters follow this page and no page of this list reaches them. Never on together with
	 * `enableNextPage`, and the ordinary end of a folder is neither of the two.
	 */
	pageLimitReached: boolean,
	page: number,
	/**
	 * The messages of the page rather than their addresses: where a message opens is known to the page
	 * of the screen alone (`message-href.ts`).
	 */
	hrefIds: number[],
	/**
	 * The list is narrowed by something the reader chose rather than by the folder they walked into:
	 * the word an empty table says. Read anew on every page, since the filter reloads the list and
	 * leaves the screen where it stands.
	 */
	filterApplied: boolean,
};

/** Answer of `mail.api.messagelist.getDraftPage`. */
export type DraftPageResponse = {
	rows: DraftRow[],
	enableNextPage: boolean,
	pageLimitReached: boolean,
	page: number,
	total: number,
};
