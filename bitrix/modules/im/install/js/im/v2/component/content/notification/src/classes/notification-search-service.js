import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { UserManager } from 'im.v2.lib.user';
import { Logger } from 'im.v2.lib.logger';
import { RestMethod } from 'im.v2.const';

const LIMIT_PER_PAGE = 50;

export class NotificationSearchService
{
	searchQuery: string = '';
	searchTypes: Array = [];
	searchDate: Date = null;
	searchDateFrom: Date = null;
	searchDateTo: Date = null;
	searchAuthors: Array = [];

	store: Object = null;
	restClient: Object = null;
	userManager: Object = null;
	isLoading: boolean = false;

	lastId: number = 0;
	hasMoreItemsToLoad: boolean = true;

	constructor()
	{
		this.store = Core.getStore();
		this.restClient = Core.getRestClient();
		this.userManager = new UserManager();
	}

	loadFirstPage({
		searchQuery,
		searchAuthors,
		searchTypes,
		searchDate,
		searchDateFrom,
		searchDateTo,
	}): Promise
	{
		this.isLoading = true;

		this.searchQuery = searchQuery;
		this.searchAuthors = searchAuthors;
		this.searchTypes = searchTypes;
		this.searchDate = searchDate;
		this.searchDateFrom = searchDateFrom;
		this.searchDateTo = searchDateTo;

		return this.requestItems({ firstPage: true });
	}

	loadNextPage(): Promise
	{
		if (this.isLoading || !this.hasMoreItemsToLoad)
		{
			return Promise.resolve();
		}
		this.isLoading = true;

		return this.requestItems();
	}

	searchInModel({
		searchQuery,
		searchAuthors,
		searchTypes,
		searchDate,
		searchDateFrom,
		searchDateTo,
	}): Array
	{
		this.searchQuery = searchQuery;
		this.searchAuthors = searchAuthors;
		this.searchTypes = searchTypes;
		this.searchDate = searchDate;
		this.searchDateFrom = searchDateFrom;
		this.searchDateTo = searchDateTo;

		return this.store.getters['notifications/getSortedCollection'].filter((item) => {
			let result = false;
			if (this.searchQuery?.length >= 3)
			{
				result = item.text.toLowerCase().includes(this.searchQuery.toLowerCase());
				if (!result)
				{
					return result;
				}
			}

			if (this.searchTypes?.length > 0)
			{
				const settingPrefix = item.settingName.split('|')[0];
				result = this.searchTypes.includes(settingPrefix);
				if (!result)
				{
					return result;
				}
			}

			if (this.searchDateFrom !== '' && this.searchDateTo !== '')
			{
				const fromDate = BX.parseDate(this.searchDateFrom);
				const toDate = BX.parseDate(this.searchDateTo);

				if (fromDate instanceof Date && toDate instanceof Date)
				{
					const itemDateForCompare = (new Date(item.date.getTime())).setHours(0, 0, 0, 0);
					const fromDateForCompare = fromDate.setHours(0, 0, 0, 0);
					const toDateForCompare = toDate.setHours(0, 0, 0, 0);

					result = itemDateForCompare >= fromDateForCompare && itemDateForCompare <= toDateForCompare;
					if (!result)
					{
						return result;
					}
				}
			}
			else if (this.searchDate !== '')
			{
				const date = BX.parseDate(this.searchDate);
				if (date instanceof Date)
				{
					const itemDateForCompare = (new Date(item.date.getTime())).setHours(0, 0, 0, 0);
					const dateFromInput = date.setHours(0, 0, 0, 0);

					result = itemDateForCompare === dateFromInput;
					if (!result)
					{
						return result;
					}
				}
			}

			if (this.searchAuthors?.length > 0)
			{
				result = this.searchAuthors.includes(item.authorId);
				if (!result)
				{
					return result;
				}
			}

			return result;
		});
	}

	requestItems({ firstPage = false } = {}): Promise
	{
		const queryParams = this.getSearchRequestParams(firstPage);

		return this.restClient.callMethod(RestMethod.imNotifyHistorySearch, queryParams)
			.then((response) => {
				const responseData = response.data();
				Logger.warn('im.notify.history.search: first page results', responseData);
				this.hasMoreItemsToLoad = !this.isLastPage(responseData.notifications);
				if (!responseData || responseData.notifications.length === 0)
				{
					Logger.warn('im.notify.get: no notifications', responseData);

					return [];
				}

				this.lastId = this.getLastItemId(responseData.notifications);

				this.userManager.setUsersToModel(responseData.users);
				this.isLoading = false;

				return responseData.notifications;
			}).catch((result: RestResult) => {
				console.error('NotificationService: requestItems error', result.error());
			});
	}

	getSearchRequestParams(firstPage: boolean): Object
	{
		const requestParams = {
			SEARCH_TEXT: this.searchQuery,
			SEARCH_TYPES: this.searchTypes,
			SEARCH_AUTHORS: this.searchAuthors,
			LIMIT: LIMIT_PER_PAGE,
			CONVERT_TEXT: 'Y',
		};

		if (
			BX.parseDate(this.searchDateFrom) instanceof Date
			&& BX.parseDate(this.searchDateTo) instanceof Date
		)
		{
			requestParams.SEARCH_DATE_FROM = BX.parseDate(this.searchDateFrom).toISOString();
			requestParams.SEARCH_DATE_TO = BX.parseDate(this.searchDateTo).toISOString();
		}
		else if (BX.parseDate(this.searchDate) instanceof Date)
		{
			requestParams.SEARCH_DATE = BX.parseDate(this.searchDate).toISOString();
		}

		if (!firstPage)
		{
			requestParams.LAST_ID = this.lastId;
		}

		return requestParams;
	}

	getLastItemId(collection: Array<Object>): number
	{
		return collection[collection.length - 1].id;
	}

	isLastPage(notifications: Array): boolean
	{
		return !Type.isArrayFilled(notifications) || notifications.length < LIMIT_PER_PAGE;
	}

	destroy()
	{
		Logger.warn('Notification search service destroyed');
	}
}
