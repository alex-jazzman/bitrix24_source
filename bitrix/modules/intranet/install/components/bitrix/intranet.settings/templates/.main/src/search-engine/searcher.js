import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { DataSource } from './data-source';

export class Searcher
{
	static STATE_READY = 'ready';
	static STATE_WAIT = 'wait';
	static STATE_NOT_FOUND = 'not_found';
	static STATE_ERROR = 'error';

	#query: string;
	#minSymbol: number;
	#dataSource: DataSource;
	#result: Array;
	#requestId: number = 0;
	#lastEvent: ?Object = null;

	constructor(dataSource: DataSource, minSymbol: number = 3)
	{
		if (!(dataSource instanceof DataSource))
		{
			throw new Error('Unexpected type, expect: DataSource');
		}
		this.#dataSource = dataSource;
		this.#minSymbol = minSymbol;
		this.#result = [];
	}

	find(query: string)
	{
		const requestId = this.#nextRequestId();

		if (query.length < this.#minSymbol)
		{
			this.reset(requestId);

			return;
		}

		this.#query = query;
		this.#result = [];
		this.changeState(Searcher.STATE_WAIT, { requestId, query });
		this.#dataSource
			.fetch(this.#query)
			.then(
				(response) => this.resolve(response, requestId),
				(response) => this.reject(response, requestId),
			);
	}

	invalidate(query: string): void
	{
		const requestId = this.#nextRequestId();

		this.#query = query;
		this.#result = [];
		this.changeState(Searcher.STATE_READY, {
			requestId,
			query,
			reset: true,
		});
	}

	#nextRequestId(): number
	{
		this.#requestId += 1;

		return this.#requestId;
	}

	changeState(state: string, payload: Object = {})
	{
		const eventData = {
			state,
			requestId: payload.requestId ?? this.#requestId,
			query: payload.query ?? this.#query,
			resultCount: this.#getResultCount(),
			reset: payload.reset === true,
		};

		if (this.#isSameEvent(eventData))
		{
			return;
		}

		this.#lastEvent = eventData;
		EventEmitter.emit(
			EventEmitter.GLOBAL_TARGET,
			'BX.Intranet.Settings:searchChangeState',
			eventData,
		);

	}

	#isSameEvent(eventData: Object): boolean
	{
		return this.#lastEvent?.state === eventData.state
			&& this.#lastEvent?.requestId === eventData.requestId
			&& this.#lastEvent?.query === eventData.query
			&& this.#lastEvent?.resultCount === eventData.resultCount
			&& this.#lastEvent?.reset === eventData.reset
		;
	}

	#getResultCount(): number
	{
		return this.#result.reduce((count, group) => {
			return count + (Array.isArray(group.options) ? group.options.length : 0);
		}, 0);
	}

	getMinSymbol(): number
	{
		return this.#minSymbol;
	}

	resolve(response, requestId: number)
	{
		if (requestId !== this.#requestId)
		{
			return;
		}

		this.#result = Array.isArray(response.data) ? response.data : [];

		this.changeState(this.#getResultCount() > 0 ? Searcher.STATE_READY : Searcher.STATE_NOT_FOUND, { requestId });
	}

	reject(response, requestId: number)
	{
		if (requestId !== this.#requestId)
		{
			return;
		}

		this.#result = [];

		this.changeState(Searcher.STATE_ERROR, { requestId });
	}

	getResult(): Array
	{
		return this.#result;
	}

	reset(requestId?: number): void
	{
		const actualRequestId = Type.isNumber(requestId) ? requestId : this.#nextRequestId();

		this.#query = '';
		this.#result = [];
		this.changeState(Searcher.STATE_READY, {
			requestId: actualRequestId,
			reset: true,
		});
	}

	getOthers()
	{
		return [
			{
				link: '/stream/',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_TEAMWORK'),
			},
			{
				link: '/tasks/config/permissions/',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_TASKS'),
			},
			{
				link: '/crm/configs/',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_CRM'),
			},
			{
				link: '/shop/documents/?inventoryManagementSource=inventory',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_WAREHOUSE'),
			},
			{
				link: '/sites/',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_SITES'),
			},
			{
				link: '/company/vis_structure.php',
				title: Loc.getMessage('INTRANET_SETTINGS_TITLE_TOOL_COMPANY'),
			},
		];
	}
}
