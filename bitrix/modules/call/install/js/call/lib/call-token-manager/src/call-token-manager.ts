import { Type, Loc, Extension } from 'main.core';

const { callInstalled } = Extension.getSettings('call.core');

type QueryParams = { call_auth_id?: string, videoconf_id?: string };

class TokenManager
{
	#tokenList: Record<number, string>;
	#pendingTokenList: Partial<Record<number, Promise<string | null |undefined>>>;
	#queryParams: QueryParams;
	#userToken: string | null | undefined;

	constructor()
	{
		this.#tokenList = {};
		this.#pendingTokenList = {};
		this.#queryParams = {};

		if (callInstalled)
		{
			this.#userToken = Loc.getMessage('user_jwt');
		}
	}

	setQueryParams(queryParams: QueryParams)
	{
		// TODO: [call-ts] remove guard when all callers are TypeScript
		if (!Type.isPlainObject(queryParams))
		{
			return;
		}
		this.#queryParams = queryParams;
	}

	getTokenCached(chatId: number): string | undefined
	{
		return this.#tokenList[chatId];
	}

	async getToken(chatId: number): Promise<string | null | undefined>
	{
		const token = this.#tokenList[chatId];
		const pendingToken = this.#pendingTokenList[chatId];

		if (token)
		{
			return token;
		}

		if (pendingToken)
		{
			return pendingToken;
		}

		this.#pendingTokenList[chatId] = this.#loadToken(chatId).then(() => {
			delete this.#pendingTokenList[chatId];

			return this.#tokenList[chatId];
		});

		return this.#pendingTokenList[chatId];
	}

	setToken(chatId: number, token: string): void
	{
		this.#tokenList[chatId] = token;
	}

	async getUserToken(chatId: number): Promise<string | null | undefined>
	{
		const pendingToken = this.#pendingTokenList[chatId];

		if (this.#userToken)
		{
			return this.#userToken;
		}

		if (pendingToken)
		{
			return pendingToken;
		}

		this.#pendingTokenList[chatId] = this.#loadToken(chatId).then(() => {
			delete this.#pendingTokenList[chatId];

			return this.#userToken;
		});

		return this.#pendingTokenList[chatId];
	}

	setUserToken(token: string): void
	{
		this.#userToken = token;
	}

	clearTokenList(): void
	{
		this.#tokenList = {};
		this.#pendingTokenList = {};
		this.#userToken = null;
	}

	async #loadToken(chatId: number): Promise<void>
	{
		try
		{
			const params = {
				chatId,
				...this.#queryParams,
			};
			// @ts-expect-error [call-ts] wait BX.rest to ts
			const response = await BX.rest.callMethod('call.Call.getCallToken', params);
			const callToken = response.data()?.callToken;
			const userToken = response.data()?.userToken;

			if (callToken)
			{
				this.setToken(chatId, callToken);
			}

			if (userToken)
			{
				this.setUserToken(userToken);
			}
		}
		catch (error)
		{
			console.error('Error during call token retrieving', error);
		}
	}
}

export const CallTokenManager = new TokenManager();
