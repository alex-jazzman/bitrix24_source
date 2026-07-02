/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_lib_rest, im_v2_lib_user) {
	'use strict';

	class BaseUserService {
		#itemsPerPage = 50;
		#isLoading = false;
		#hasMoreItemsToLoad = true;
		#lastId;
		loadFirstPage(messageId) {
			this.#isLoading = true;
			return this.#requestItems({
				messageId,
				firstPage: true
			});
		}
		loadNextPage(messageId) {
			if (this.#isLoading || !this.#hasMoreItemsToLoad) {
				return Promise.resolve();
			}
			this.#isLoading = true;
			return this.#requestItems({
				messageId
			});
		}
		hasMoreItemsToLoad() {
			return this.#hasMoreItemsToLoad;
		}
		getItemsPerPage() {
			return this.#itemsPerPage;
		}
		getRequestFilter(firstPage = false) {
			return {
				lastId: firstPage ? null : this.#lastId
			};
		}
		getRestMethodName() {
			throw new Error('BaseUserService: you should implement "getRestMethodName" for child class');
		}
		getLastId(result) {
			throw new Error('BaseUserService: you should implement "getLastId" for child class');
		}
		async #requestItems({
			messageId,
			firstPage = false
		}) {
			const result = await im_v2_lib_rest.runAction(this.getRestMethodName(), this.#getQueryParams({
				messageId,
				firstPage
			})).catch(([error]) => {
				console.error('BaseRecentList: page request error', error);
			});
			const {
				users,
				hasNextPage
			} = result;
			this.#lastId = this.getLastId(result);
			this.#hasMoreItemsToLoad = hasNextPage;
			this.#isLoading = false;
			const userManager = new im_v2_lib_user.UserManager();
			await userManager.setUsersToModel(Object.values(users));
			return users.map(user => user.id);
		}
		#getQueryParams({
			messageId,
			firstPage = false
		}) {
			return {
				data: {
					messageId,
					limit: this.getItemsPerPage(),
					filter: this.getRequestFilter(firstPage)
				}
			};
		}
	}

	exports.BaseUserService = BaseUserService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=user.bundle.js.map
