/**
 * @module im/messenger/controller/sidebar-v2/services/file-service/src/query
 */
jn.define('im/messenger/controller/sidebar-v2/services/file-service/src/query', (require, exports, module) => {
	// The page size goes into the request AND into the "is there another page" check, so the two can
	// never drift apart. Without it in the request the check rides on the server default (50) staying
	// equal to a constant in another code base.
	const PAGE_LIMIT = 50;

	// A tab keeps its files under the key of the whole subtype set it asked for, so a pull event can
	// find every collection its record belongs to. Repeated in the pull provider, pinned by the suite.
	const STORE_KEY_SEPARATOR = '&';

	// Paging by the date needs the date order: the server then continues the page by the pair
	// LAST_DATE + LAST_ID and refuses either half alone.
	const SidebarFileDateOrder = Object.freeze({ DATE_CREATE: 'DESC' });

	/**
	 * @param {string[]} subtypes
	 * @return {string}
	 */
	function buildStoreKey(subtypes)
	{
		return subtypes.join(STORE_KEY_SEPARATOR);
	}

	/**
	 * @param {SidebarFileQueryParams} params
	 * @return {object}
	 */
	function buildInitialQueryParams(params)
	{
		const { chatId, subtypes, order } = params;

		const query = {
			CHAT_ID: chatId,
			SUBTYPE: { ...subtypes },
			LIMIT: PAGE_LIMIT,
		};

		if (isDateOrder(order))
		{
			query.ORDER = { ...order };
		}

		return query;
	}

	/**
	 * @param {SidebarFileQueryParams} params
	 * @return {object}
	 */
	function buildQueryParams(params)
	{
		const { order, cursor } = params;
		const query = buildInitialQueryParams(params);

		if (!isDateOrder(order))
		{
			query.LAST_ID = cursor?.lastLoadFileId ?? 0;

			return query;
		}

		// an incomplete pair is a wrong request, so the cursor goes in only once a page has come back
		if (cursor?.lastLoadFileId && cursor?.lastLoadFileDate)
		{
			query.LAST_ID = cursor.lastLoadFileId;
			query.LAST_DATE = cursor.lastLoadFileDate;
		}

		return query;
	}

	/**
	 * @desc The boundary of the page that came back, taken from its last record in the server order.
	 * The smallest record of the collection would be wrong: a record from a pull event lands there
	 * with a bigger number and an earlier date, and the next page would start from the wrong place.
	 * @param {SidebarFile[]} list
	 * @return {SidebarFileCursor|null}
	 */
	function getPageCursor(list)
	{
		if (list.length === 0)
		{
			return null;
		}

		const lastItem = list[list.length - 1];

		return {
			lastLoadFileId: lastItem.id,
			// the date goes back to the server as it came, RFC3339
			lastLoadFileDate: lastItem.dateCreate,
		};
	}

	/**
	 * @desc The answer carries no "there is more" flag, so a full page means there may be another one.
	 * @param {number} pageSize
	 * @param {boolean} isHistoryLimitExceeded
	 * @return {boolean}
	 */
	function hasNextPage(pageSize, isHistoryLimitExceeded)
	{
		if (isHistoryLimitExceeded)
		{
			return false;
		}

		return pageSize === PAGE_LIMIT;
	}

	/**
	 * @desc Half a pair is not a cursor the server takes, so buildQueryParams drops it and the
	 * request goes for the first page again - the listing then stops moving without a trace. The
	 * caller says so out loud: this module stays a leaf and has no logger of its own.
	 * @param {SidebarFileOrder|null} [order]
	 * @param {SidebarFileCursor|null} [cursor]
	 * @return {boolean}
	 */
	function isIncompleteDateCursor(order, cursor)
	{
		if (!isDateOrder(order))
		{
			return false;
		}

		return Boolean(cursor?.lastLoadFileId) !== Boolean(cursor?.lastLoadFileDate);
	}

	function isDateOrder(order)
	{
		return Boolean(order?.DATE_CREATE);
	}

	module.exports = {
		PAGE_LIMIT,
		STORE_KEY_SEPARATOR,
		SidebarFileDateOrder,
		buildStoreKey,
		buildInitialQueryParams,
		buildQueryParams,
		getPageCursor,
		hasNextPage,
		isIncompleteDateCursor,
	};
});
