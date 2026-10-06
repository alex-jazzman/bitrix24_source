/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, landing_env) {
	'use strict';

	// Maps a failed Backend.upload() response to an ErrorManager action.
	// Validation rejects (FILE_ERROR/BAD_IMAGE — e.g. an unsupported format such as
	// a gated SVG) get a friendly "bad format" message without a support link;
	// everything else (network, 500, quota, auth, empty/absent result) keeps the
	// generic upload error with the support link, so diagnostics are not lost.

	/**
	 * @param {*} error - rejected upload response (or {type: 'error'} for a string reject)
	 * @return {{action: string, hideSupportLink: boolean}}
	 */
	function resolveUploadErrorAction(error) {
		const code = error && error.result && error.result[0] && error.result[0].error;
		if (code === 'FILE_ERROR' || code === 'BAD_IMAGE') {
			return {
				action: 'UPLOAD_BAD_FORMAT',
				hideSupportLink: true
			};
		}
		return {
			action: 'Block::uploadFile',
			hideSupportLink: false
		};
	}

	let additionalRequestCompleted = true;

	/**
	 * Upper bound for a single batch request built from portal data (sites, pages, etc).
	 * The server drops a batch longer than Bitrix\Landing\PublicAction::MAX_BATCH_ITEMS (500),
	 * and one item costs about 8 POST variables, so 500 items would also overflow
	 * the usual max_input_vars = 1000 long before the module limit is reached.
	 */
	const BATCH_ITEMS_PER_REQUEST = 100;

	/**
	 * @memberOf BX.Landing
	 */
	class Backend {
		static instance = null;
		static getInstance() {
			if (!Backend.instance) {
				Backend.instance = new Backend();
			}
			return Backend.instance;
		}
		static makeResponse(xhr, sourceResponse = {}) {
			const type = (() => {
				if (main_core.Type.isStringFilled(sourceResponse.type)) {
					return sourceResponse.type;
				}
				if (main_core.Type.isPlainObject(sourceResponse) && Object.values(sourceResponse).length > 0) {
					const allSuccess = Object.values(sourceResponse).every(item => {
						return item.type === 'success';
					});
					if (allSuccess) {
						return 'success';
					}
				}
				if (main_core.Type.isArray(sourceResponse)) {
					return 'other';
				}
				return 'error';
			})();
			if (type === 'other') {
				return sourceResponse;
			}
			return {
				result: null,
				type,
				...sourceResponse,
				status: xhr.status,
				authorized: xhr.getResponseHeader('X-Bitrix-Ajax-Status') !== 'Authorize'
			};
		}
		static request({
			url,
			data
		}) {
			return new Promise((resolve, reject) => {
				const fd = data instanceof FormData ? data : main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: sourceResponse => {
						const response = Backend.makeResponse(xhr, sourceResponse);
						if (main_core.Type.isStringFilled(response.sessid) && main_core.Loc.getMessage('bitrix_sessid') !== response.sessid && additionalRequestCompleted) {
							main_core.Loc.setMessage('bitrix_sessid', response.sessid);
							additionalRequestCompleted = false;
							const newData = {
								...data,
								sessid: main_core.Loc.getMessage('bitrix_sessid')
							};
							Backend.request({
								url,
								data: newData
							}).then(newResponse => {
								additionalRequestCompleted = true;
								resolve(newResponse);
							}).catch(newResponse => {
								additionalRequestCompleted = true;
								reject(newResponse);
							});
							return;
						}
						if (!main_core.Type.isPlainObject(response)) {
							resolve(response);
							return;
						}
						if (response.type === 'error' || response.authorized === false) {
							if (response.authorized === false) {
								top.window.location.reload();
							} else {
								reject(response);
							}
							return;
						}
						resolve(response);
					},
					onfailure: sourceResponse => {
						if (sourceResponse === 'auth') {
							top.window.location.reload();
						} else {
							reject(Backend.makeResponse(xhr, sourceResponse));
						}
					}
				});
				xhr.send(fd);
			});
		}
		cache = new main_core.Cache.MemoryCache();
		getControllerUrl() {
			return this.cache.remember('controllerUrl', () => {
				const uri = new main_core.Uri('/bitrix/tools/landing/ajax.php');
				uri.setQueryParams({
					site: main_core.Loc.getMessage('SITE_ID') || undefined,
					type: this.getSitesType()
				});
				return uri.toString();
			});
		}
		getSiteId() {
			return this.cache.remember('siteId', () => {
				const landing = main_core.Reflection.getClass('BX.Landing.Main');
				if (landing) {
					const instance = landing.getInstance();
					if ('options' in instance && 'site_id' in instance.options && !main_core.Type.isUndefined(instance.options.site_id)) {
						return instance.options.site_id;
					}
				}
				return -1;
			});
		}
		getLandingId() {
			return this.cache.remember('landingId', () => {
				const landing = main_core.Reflection.getClass('BX.Landing.Main');
				if (landing) {
					return landing.getInstance().id;
				}
				return -1;
			});
		}
		getSitesType() {
			return this.cache.remember('siteType', () => {
				return landing_env.Env.getInstance().getType();
			});
		}
		action(action, data = {}, queryParams = {}, uploadParams = {}) {
			if (!queryParams.site_id) {
				queryParams.site_id = this.getSiteId();
			}
			const requestBody = {
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				action: uploadParams.action || action.replace('Landing\\Block', 'Block'),
				data: {
					...data,
					uploadParams,
					lid: data.lid || this.getLandingId()
				}
			};
			const uri = new main_core.Uri(this.getControllerUrl());
			uri.setQueryParams({
				action: requestBody.action,
				...queryParams
			});
			return Backend.request({
				url: uri.toString(),
				data: requestBody
			}).then(response => {
				if (requestBody.action === 'Block::updateNodes' || requestBody.action === 'Block::removeCard' || requestBody.action === 'Block::cloneCard' || requestBody.action === 'Block::addCard' || requestBody.action === 'Block::updateStyles') {
					// eslint-disable-next-line
					BX.Landing.UI.Panel.StatusPanel.getInstance().update();
				}
				if (typeof BX.Landing.PageObject !== 'undefined') {
					BX.onCustomEvent(BX.Landing.PageObject.getRootWindow(), 'BX.Landing.Backend:action', [action, data]);
				}

				/*if (!response.result) {
					BX.Landing.ErrorManager.getInstance().add({
						type: 'error'
					});
				}*/

				return response.result;
			}).catch(err => {
				if (requestBody.action !== 'Landing::downBlock' && requestBody.action !== 'Landing::upBlock') {
					if (requestBody.action !== 'Block::getById' && requestBody.action !== 'Block::publication' && requestBody.action !== 'Landing::move' && requestBody.action !== 'Landing::copy' && requestBody.action !== 'Landing::publication' && requestBody.action !== 'Site::publication' && requestBody.action !== 'Site::moveFolder' && requestBody.action !== 'Site::markDelete' && requestBody.action !== 'Vk::getVideoInfo') {
						const error = main_core.Type.isString(err) ? {
							type: 'error'
						} : err;
						err.action = requestBody.action;

						// eslint-disable-next-line
						BX.Landing.ErrorManager.getInstance().add(error);
					}
					return Promise.reject(err);
				}
			});
		}
		batch(action, data = {}, queryParams = {}) {
			queryParams.site_id = this.getSiteId();
			const requestBody = {
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				action: action.replace('Landing\\Block', 'Block'),
				data: {
					lid: data.lid || this.getLandingId()
				},
				batch: data
			};
			const uri = new main_core.Uri(this.getControllerUrl());
			uri.setQueryParams({
				action: requestBody.action,
				...queryParams
			});
			return Backend.request({
				url: uri.toString(),
				data: requestBody
			}).then(response => {
				// eslint-disable-next-line
				BX.Landing.UI.Panel.StatusPanel.getInstance().update();
				if (typeof BX.Landing.PageObject !== 'undefined') {
					BX.onCustomEvent(BX.Landing.PageObject.getRootWindow(), 'BX.Landing.Backend:batch', [action, data]);
				}

				/*if (!response.result) {
					BX.Landing.ErrorManager.getInstance().add({
						type: 'error'
					});
				}*/

				return response;
			}).catch(err => {
				if (requestBody.action !== 'Landing::downBlock' && requestBody.action !== 'Landing::upBlock') {
					if (requestBody.action !== 'Block::getById') {
						const error = main_core.Type.isString(err) ? {
							type: 'error'
						} : err;
						error.action = requestBody.action;
						// eslint-disable-next-line
						BX.Landing.ErrorManager.getInstance().add(error);
					}
					return Promise.reject(err);
				}
			});
		}

		/**
		 * Runs a list of batch items as several sequential requests, none of them longer
		 * than BATCH_ITEMS_PER_REQUEST, and concatenates the responses keeping the source order.
		 * A failed part rejects the whole call, so the caller never gets a silently shortened list.
		 */
		batchList(action, items) {
			if (items.length <= BATCH_ITEMS_PER_REQUEST) {
				return this.batch(action, items);
			}
			const chunks = [];
			for (let index = 0; index < items.length; index += BATCH_ITEMS_PER_REQUEST) {
				chunks.push(items.slice(index, index + BATCH_ITEMS_PER_REQUEST));
			}
			return chunks.reduce((queue, chunk) => {
				return queue.then(processed => {
					return this.batch(action, chunk).then(response => [...processed, ...response]);
				});
			}, Promise.resolve([]));
		}
		upload(file, uploadParams = {}) {
			const formData = new FormData();
			formData.append('sessid', main_core.Loc.getMessage('bitrix_sessid'));
			formData.append('picture', file, file.name);
			if ('block' in uploadParams) {
				formData.append('action', 'Block::uploadFile');
				formData.append('data[block]', uploadParams.block);
			}
			if ('lid' in uploadParams) {
				formData.set('action', 'Landing::uploadFile');
				formData.append('data[lid]', uploadParams.lid);
			}
			if ('id' in uploadParams) {
				formData.set('action', 'Site::uploadFile');
				formData.append('data[id]', uploadParams.id);
			}
			if ('temp' in uploadParams) {
				formData.append('data[temp]', true);
			}
			const uri = new main_core.Uri(this.getControllerUrl());
			uri.setQueryParams({
				action: formData.get('action'),
				site_id: this.getSiteId()
			});
			if (uploadParams.context) {
				uri.setQueryParam('context', uploadParams.context);
			}
			return Backend.request({
				url: uri.toString(),
				data: formData
			}).then(response => response.result).catch(err => {
				const error = main_core.Type.isString(err) ? {
					type: 'error'
				} : err;
				const res = resolveUploadErrorAction(error);
				error.action = res.action;
				if (res.hideSupportLink) {
					error.hideSupportLink = true;
				}
				// eslint-disable-next-line
				BX.Landing.ErrorManager.getInstance().add(error);
				return Promise.reject(err);
			});
		}
		getSites({
			filter = {}
		} = {}) {
			return this.cache.remember(`sites+${JSON.stringify(filter)}`, () => {
				return this.action('Site::getList', {
					params: {
						filter,
						order: {
							ID: 'DESC'
						}
					}
				}).then(response => response);
			});
		}
		getLandings({
			siteId = []
		} = {}, filter) {
			let skipFilter = false;
			if (!BX.Type.isPlainObject(filter)) {
				filter = {};
				skipFilter = true;
			}
			const ids = main_core.Type.isArray(siteId) ? siteId : [siteId];
			filter.SITE_ID = ids;
			const getBathItem = id => ({
				action: 'Landing::getList',
				data: {
					params: {
						filter: (() => {
							if (skipFilter) {
								return {
									SITE_ID: id,
									DELETED: 'N',
									FOLDER: 'N'
								};
							}
							return filter;
						})(),
						order: {
							ID: 'DESC'
						},
						get_preview: true,
						check_area: 1
					}
				}
			});
			const prepareResponse = response => {
				return response.reduce((acc, item) => {
					return [...acc, ...item.result];
				}, []);
			};
			return this.cache.remember(`landings+${JSON.stringify(ids)}`, () => {
				const requestedIds = ids.some(id => !main_core.Type.isNil(id)) ? Promise.resolve(ids) : this.getSites().then(sites => sites.map(site => site.ID));
				return requestedIds.then(siteIds => this.batchList('Landing::getList', siteIds.map(id => getBathItem(id)))).then(response => prepareResponse(response)).then(response => {
					response.forEach(landing => {
						this.cache.set(`landing+${landing.ID}`, Promise.resolve(landing));
					});
					return response;
				});
			});
		}
		getLanding({
			landingId
		}) {
			return this.cache.remember(`landing+${landingId}`, () => {
				return this.action('Landing::getList', {
					params: {
						filter: {
							ID: landingId
						},
						get_preview: true
					}
				}).then(response => {
					if (main_core.Type.isArray(response) && response.length > 0) {
						return response[0];
					}
					return null;
				});
			});
		}
		getBlocks({
			landingId
		}) {
			return this.cache.remember(`blocks+${landingId}`, () => {
				return this.action('Block::getList', {
					lid: landingId,
					params: {
						get_content: true,
						edit_mode: true
					}
				}).then(blocks => {
					blocks.forEach(block => {
						this.cache.set(`block+${block.id}`, Promise.resolve(block));
					});
					return blocks;
				});
			});
		}
		getBlock({
			blockId
		}) {
			return this.cache.remember(`blockId+${blockId}`, () => {
				return this.action('Block::getById', {
					block: blockId,
					params: {
						edit_mode: true
					}
				});
			});
		}
		getTemplates({
			type = 'page',
			filter = {}
		} = {}) {
			return this.cache.remember(`templates+${JSON.stringify(filter)}`, () => {
				return this.action('Demos::getPageList', {
					type,
					filter
				}).then(response => Object.values(response));
			});
		}
		getDynamicTemplates(sourceId = '') {
			return this.cache.remember(`dynamicTemplates:${sourceId}`, () => {
				return this.getTemplates({
					filter: {
						section: `dynamic${sourceId ? `:${sourceId}` : ''}`
					}
				});
			});
		}
		createPage(options = {}) {
			const envOptions = landing_env.Env.getInstance().getOptions();
			const {
				title,
				siteId = envOptions.site_id,
				siteType = envOptions.params.type,
				code = main_core.Text.getRandom(16),
				blockId,
				menuCode,
				folderId
			} = options;
			const templateCode = (() => {
				const {
					theme
				} = envOptions;
				if (main_core.Type.isPlainObject(theme) && main_core.Type.isArray(theme.newPageTemplate) && main_core.Type.isStringFilled(theme.newPageTemplate[0])) {
					return theme.newPageTemplate[0];
				}
				return 'empty';
			})();
			const requestBody = {
				siteId,
				code: templateCode,
				fields: {
					TITLE: title,
					CODE: code,
					//@todo: refactor
					ADD_IN_MENU: siteType === 'KNOWLEDGE' || siteType === 'GROUP' ? 'Y' : 'N'
				}
			};
			if (main_core.Type.isNumber(blockId) && main_core.Type.isString(menuCode)) {
				requestBody.fields.BLOCK_ID = blockId;
				requestBody.fields.MENU_CODE = menuCode;
			}
			if (main_core.Type.isNumber(folderId)) {
				requestBody.fields.FOLDER_ID = folderId;
			}
			return this.action('Landing::addByTemplate', requestBody);
		}
	}

	exports.BATCH_ITEMS_PER_REQUEST = BATCH_ITEMS_PER_REQUEST;
	exports.Backend = Backend;

})(this.BX.Landing = this.BX.Landing || {}, BX, BX.Landing);
//# sourceMappingURL=backend.bundle.js.map
