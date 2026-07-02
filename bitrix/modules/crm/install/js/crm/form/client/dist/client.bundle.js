/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	function request(options) {
		const action = options.action.replace('crm.api.form.', '');
		const data = main_core.Type.isPlainObject(options.data) ? options.data : {};
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction(`crm.api.form.${action}`, {
				json: data
			}).then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error.errors);
			});
		});
	}

	const instance = Symbol('instance');

	/**
	 * Crm-From client
	 * Implements singleton pattern
	 *
	 * @example
	 * import {Client} from 'crm.form.client';
	 * const client = Client.getInstance();
	 *
	 * client
	 * 		.loadOptionsById(formId)
	 * 		.then((options) => {
	 * 			// ...
	 * 		});
	 *
	 * @memberOf BX.Crm.Form
	 */
	class FormClient {
		static getInstance() {
			if (!FormClient[instance]) {
				FormClient[instance] = new FormClient();
			}
			return FormClient[instance];
		}
		cache = new main_core.Cache.MemoryCache();
		getOptions(formId) {
			return this.cache.remember(`formOptions#${formId}`, () => {
				return request({
					action: 'get',
					data: {
						id: formId
					}
				});
			});
		}
		getDictionary() {
			return this.cache.remember('formDictionary', () => {
				return request({
					action: 'getDict'
				});
			});
		}

		// eslint-disable-next-line class-methods-use-this
		prepareOptions(options, preparing) {
			return request({
				action: 'prepare',
				data: {
					options,
					preparing
				}
			});
		}

		// eslint-disable-next-line class-methods-use-this
		saveOptions(options) {
			return request({
				action: 'save',
				data: {
					options
				}
			});
		}

		// eslint-disable-next-line class-methods-use-this
		checkFields(options) {
			return request({
				action: 'check',
				data: {
					options
				}
			});
		}
		resetCache(formId) {
			if (main_core.Type.isNumber(formId) || main_core.Type.isStringFilled(formId)) {
				this.cache.delete(`formOptions#${formId}`);
			} else {
				this.cache.keys().filter(key => {
					return key.startsWith('formOptions#');
				}).forEach(key => {
					this.cache.delete(key);
				});
			}
		}
		check(options) {
			return request({
				action: 'check',
				data: {
					options
				}
			});
		}
	}

	exports.FormClient = FormClient;

})(this.BX.Crm.Form = this.BX.Crm.Form || {}, BX);
//# sourceMappingURL=client.bundle.js.map
