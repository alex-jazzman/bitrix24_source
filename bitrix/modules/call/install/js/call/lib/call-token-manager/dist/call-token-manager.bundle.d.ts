/* eslint-disable */
type QueryParams = {
	call_auth_id?: string;
	videoconf_id?: string;
};

declare namespace BX.Call.Lib {
	const CallTokenManager: TokenManager;

	class TokenManager {
		constructor();
		setQueryParams(queryParams: QueryParams): void;
		getTokenCached(chatId: number): string | undefined;
		getToken(chatId: number): Promise<string | null | undefined>;
		setToken(chatId: number, token: string): void;
		getUserToken(chatId: number): Promise<string | null | undefined>;
		setUserToken(token: string): void;
		clearTokenList(): void;
	}
}
