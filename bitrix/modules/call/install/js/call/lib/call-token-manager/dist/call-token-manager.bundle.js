/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	const {
		callInstalled
	} = main_core.Extension.getSettings('call.core');
	class TokenManager {
		#tokenList;
		#pendingTokenList;
		#queryParams;
		#userToken;
		constructor() {
			this.#tokenList = {};
			this.#pendingTokenList = {};
			this.#queryParams = {};
			if (callInstalled) {
				this.#userToken = main_core.Loc.getMessage('user_jwt');
			}
		}
		setQueryParams(queryParams) {
			if (!main_core.Type.isPlainObject(queryParams)) {
				return;
			}
			this.#queryParams = queryParams;
		}
		getTokenCached(chatId) {
			return this.#tokenList[chatId];
		}
		async getToken(chatId) {
			const token = this.#tokenList[chatId];
			const pendingToken = this.#pendingTokenList[chatId];
			if (token) {
				return token;
			}
			if (pendingToken) {
				return pendingToken;
			}
			this.#pendingTokenList[chatId] = this.#loadToken(chatId).then(() => {
				delete this.#pendingTokenList[chatId];
				return this.#tokenList[chatId];
			});
			return this.#pendingTokenList[chatId];
		}
		setToken(chatId, token) {
			this.#tokenList[chatId] = token;
		}
		async getUserToken(chatId) {
			const pendingToken = this.#pendingTokenList[chatId];
			if (this.#userToken) {
				return this.#userToken;
			}
			if (pendingToken) {
				return pendingToken;
			}
			this.#pendingTokenList[chatId] = this.#loadToken(chatId).then(() => {
				delete this.#pendingTokenList[chatId];
				return this.#userToken;
			});
			return this.#pendingTokenList[chatId];
		}
		setUserToken(token) {
			this.#userToken = token;
		}
		clearTokenList() {
			this.#tokenList = {};
			this.#pendingTokenList = {};
			this.#userToken = null;
		}
		async #loadToken(chatId) {
			try {
				const params = {
					chatId,
					...this.#queryParams
				};
				const response = await BX.rest.callMethod('call.Call.getCallToken', params);
				const callToken = response.data()?.callToken;
				const userToken = response.data()?.userToken;
				if (callToken) {
					this.setToken(chatId, callToken);
				}
				if (userToken) {
					this.setUserToken(userToken);
				}
			} catch (error) {
				console.error('Error during call token retrieving', error);
			}
		}
	}
	const CallTokenManager = new TokenManager();

	exports.CallTokenManager = CallTokenManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX);
//# sourceMappingURL=call-token-manager.bundle.js.map
