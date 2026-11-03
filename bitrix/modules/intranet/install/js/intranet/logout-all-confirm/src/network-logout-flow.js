import { Type } from 'main.core';

export type NetworkLogoutFlowOptions = {
	isCloud: boolean,
	location?: Object,
	navigationLocation?: Object,
	storage?: Object,
	history?: Object,
	clock?: () => number,
};

export class NetworkLogoutFlow
{
	static RECONNECT_MARKER_KEY = 'intranet.logout-all-confirm.reconnect';
	static RECONNECT_MARKER_TTL = 5 * 60 * 1000;
	static NETWORK_RETURN_HANDLED_STATE_KEY = 'intranet.logout-all-confirm.network-return-handled';

	#isCloud: boolean;
	#location: Object;
	#navigationLocation: Object;
	#storage: Object;
	#history: Object;
	#clock: () => number;

	constructor({
		isCloud,
		location = window.location,
		navigationLocation = window.top.location,
		storage = window.sessionStorage,
		history = window.history,
		clock = () => Date.now(),
	}: NetworkLogoutFlowOptions)
	{
		this.#isCloud = isCloud === true;
		this.#location = location;
		this.#navigationLocation = navigationLocation;
		this.#storage = storage;
		this.#history = history;
		this.#clock = clock;
	}

	createRequestData(data: Object): Object
	{
		if (!this.#isCloud)
		{
			return data;
		}

		return {
			...data,
			backurl: this.#location.href,
		};
	}

	handleLogoutSuccess(response: ?Object, shouldReconnect: boolean, handlers: Object): void
	{
		if (!this.#isCloud)
		{
			if (shouldReconnect)
			{
				handlers.reconnect();
			}
			else
			{
				handlers.notify();
			}

			return;
		}

		const networkLogoutUrl = response?.data?.networkLogoutUrl;
		if (Type.isStringFilled(networkLogoutUrl))
		{
			if (shouldReconnect)
			{
				this.#storeReconnectMarker();
			}

			this.#navigationLocation.replace(networkLogoutUrl);

			return;
		}

		if (shouldReconnect)
		{
			handlers.reconnect();
		}
		else
		{
			handlers.notify();
		}
	}

	restoreAfterNetworkReturn(handlers: Object): boolean
	{
		if (!this.#isCloud)
		{
			return false;
		}

		let url = null;
		try
		{
			url = new URL(this.#location.href);
		}
		catch
		{
			return false;
		}

		if (url.searchParams.get('justLoggedOut') !== '1')
		{
			return false;
		}

		if (this.#isNetworkReturnHandled())
		{
			return false;
		}

		this.#markNetworkReturnHandled();

		if (this.#consumeReconnectMarker())
		{
			handlers.reconnect();
		}
		else
		{
			handlers.notify();
		}

		return true;
	}

	#isNetworkReturnHandled(): boolean
	{
		try
		{
			return this.#history.state?.[NetworkLogoutFlow.NETWORK_RETURN_HANDLED_STATE_KEY] === true;
		}
		catch
		{
			return false;
		}
	}

	#markNetworkReturnHandled(): void
	{
		try
		{
			const state = Type.isPlainObject(this.#history.state) ? this.#history.state : {};
			this.#history.replaceState(
				{
					...state,
					[NetworkLogoutFlow.NETWORK_RETURN_HANDLED_STATE_KEY]: true,
				},
				'',
			);
		}
		catch
		{
			// History failure must not block existing Network return UX.
		}
	}

	#storeReconnectMarker(): void
	{
		try
		{
			this.#storage.setItem(
				NetworkLogoutFlow.RECONNECT_MARKER_KEY,
				JSON.stringify({
					reconnect: true,
					createdAt: this.#clock(),
				}),
			);
		}
		catch
		{
			// Storage failure must not block the Network round-trip.
		}
	}

	#consumeReconnectMarker(): boolean
	{
		let marker = null;
		try
		{
			marker = this.#storage.getItem(NetworkLogoutFlow.RECONNECT_MARKER_KEY);
			this.#storage.removeItem(NetworkLogoutFlow.RECONNECT_MARKER_KEY);
		}
		catch
		{
			return false;
		}

		if (!Type.isStringFilled(marker))
		{
			return false;
		}

		try
		{
			const data = JSON.parse(marker);
			if (!Type.isPlainObject(data) || !Type.isNumber(data.createdAt))
			{
				return false;
			}

			const age = this.#clock() - data.createdAt;

			return (
				data.reconnect === true
				&& age >= 0
				&& age <= NetworkLogoutFlow.RECONNECT_MARKER_TTL
			);
		}
		catch
		{
			return false;
		}
	}
}
