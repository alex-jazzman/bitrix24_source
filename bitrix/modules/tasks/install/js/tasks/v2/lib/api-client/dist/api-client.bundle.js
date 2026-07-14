/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core) {
	'use strict';

	class ApiClient {
		#baseUrl;
		#contentType;
		constructor(baseUrl = 'tasks.v2.', contentType = 'json') {
			this.#baseUrl = baseUrl;
			this.#contentType = contentType;
		}
		async get(endpoint, params = {}) {
			const url = this.buildUrl(endpoint);
			const response = await main_core.ajax.runAction(url, {
				[this.#contentType]: {
					method: 'GET',
					...params
				}
			});
			return this.handleResponse(response);
		}
		async post(endpoint, data) {
			const url = this.buildUrl(endpoint);
			const response = await main_core.ajax.runAction(url, {
				[this.#contentType]: data,
				navigation: data?.navigation
			});
			return this.handleResponse(response);
		}
		async postComponent(component, endpoint, data, mode = 'class') {
			const response = await main_core.ajax.runComponentAction(component, endpoint, {
				mode,
				data
			});
			return this.handleResponse(response);
		}
		async put(endpoint, data) {
			const url = this.buildUrl(endpoint);
			const response = await main_core.ajax.runAction(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				[this.#contentType]: data
			});
			return this.handleResponse(response);
		}
		async delete(endpoint, params = {}) {
			const url = this.buildUrl(endpoint, params);
			const response = await main_core.ajax.runAction(url, {
				method: 'DELETE'
			});
			return this.handleResponse(response);
		}
		buildUrl(endpoint, params = {}) {
			let url = `${this.#baseUrl}${endpoint}`;
			if (Object.keys(params).length > 0) {
				url += `?${new URLSearchParams(params).toString()}`;
			}
			return url;
		}
		async handleResponse(response) {
			const {
				data,
				error
			} = response;
			if (error) {
				throw error;
			}
			return data;
		}
	}
	const apiClient = new ApiClient();

	exports.ApiClient = ApiClient;
	exports.apiClient = apiClient;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX);
//# sourceMappingURL=api-client.bundle.js.map
