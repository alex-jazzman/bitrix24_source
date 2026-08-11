/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	let Base$1 = class Base {
		payload = null;
		markers = {};
		constructor(payload) {
			this.payload = payload;
		}
		setMarkers(markers) {
			this.markers = markers;
			return this;
		}
		getMarkers() {
			return this.markers;
		}

		/**
		 * Returns data in pretty style.
		 *
		 * @return {*}
		 */
		getPrettifiedData() {
			return this.payload;
		}

		/**
		 * Returns data in raw style.
		 *
		 * @return {*}
		 */
		getRawData() {
			return this.payload;
		}
	};

	let Text$1 = class Text extends Base$1 {
		/**
		 *
		 * @param {TextPayload} payload
		 */
		// eslint-disable-next-line no-useless-constructor
		constructor(payload) {
			super(payload);
		}
		setMarkers(markers) {
			return super.setMarkers(markers);
		}
		getMarkers() {
			return super.getMarkers();
		}
		getPrettifiedData() {
			return super.getPrettifiedData();
		}
		getRawData() {
			return super.getRawData();
		}
	};

	const Base = Base$1;
	const Text = Text$1;
	class Engine {
		static textCompletionsUrl = '/bitrix/services/main/ajax.php?action=ai.api.text.completions';
		static imageCompletionsUrl = '/bitrix/services/main/ajax.php?action=ai.api.image.completions';
		static textAcceptationUrl = '/bitrix/services/main/ajax.php?action=ai.api.text.acceptation';
		static textFeedbackDataUrl = '/bitrix/services/main/ajax.php?action=ai.api.text.getFeedbackData';
		static imageAcceptationUrl = '/bitrix/services/main/ajax.php?action=ai.api.image.acceptation';
		static saveImageUrl = '/bitrix/services/main/ajax.php?action=ai.api.image.save';
		static getToolingUrl = '/bitrix/services/main/ajax.php?action=ai.api.tooling.get';
		static getImageToolingUrl = '/bitrix/services/main/ajax.php?action=ai.api.image.getTooling';
		static getImageParamsUrl = '/bitrix/services/main/ajax.php?action=ai.api.image.getParams';
		static installKitUrl = '/bitrix/services/main/ajax.php?action=ai.api.tooling.installKit';
		static getRolesListUrl = '/bitrix/services/main/ajax.php?action=ai.api.role.list';
		static getRolesDialogDataUrl = '/bitrix/services/main/ajax.php?action=ai.api.role.picker';
		static addRoleToFavouriteListUrl = '/bitrix/services/main/ajax.php?action=ai.api.role.addfavorite';
		static removeRoleFromFavouriteListUrl = '/bitrix/services/main/ajax.php?action=ai.api.role.removefavorite';
		static acceptAgreementUrl = '/bitrix/services/main/ajax.php?action=ai.api.agreement.accept';
		static checkAgreementUrl = '/bitrix/services/main/ajax.php?action=ai.api.agreement.check';
		static setBannerLaunchedUrl = '/bitrix/services/main/ajax.php?action=ai.api.tooling.setLaunched';
		#moduleId;
		#contextId;
		#contextParameters;
		#payload;
		#historyState = false;
		/**
		 * -1 - no grouped, 0 - first item of group
		 * @type {?number}
		 */
		#historyGroupId = -1;
		#parameters = {};
		#analyticParameters = {};

		/**
		 * Sets Payload for Engine.
		 *
		 * @param {PayloadBase} payload
		 * @return {Engine}
		 */
		setPayload(payload) {
			this.#payload = payload;
			return this;
		}
		getPayload() {
			return this.#payload;
		}

		/**
		 * Sets allowed (by core) parameters for Engine.
		 *
		 * @param {{[key: string]: string}} parameters
		 * @return {Engine}
		 */
		setParameters(parameters) {
			this.#parameters = parameters;
			return this;
		}
		addParameter(key, value) {
			this.#parameters[key] = value;
			return this;
		}
		setAnalyticParameters(parameters) {
			this.#analyticParameters = parameters;
			return this;
		}

		/**
		 * Sets current module id. Its should be Bitrix's module.
		 *
		 * @param {string} moduleId
		 * @return {Engine}
		 */
		setModuleId(moduleId) {
			this.#moduleId = moduleId;
			return this;
		}
		getModuleId() {
			return this.#moduleId;
		}

		/**
		 * Sets current context id. Its may be just a string unique within the moduleId.
		 *
		 * @param {string} contextId
		 * @return {Engine}
		 */
		setContextId(contextId) {
			this.#contextId = contextId;
			return this;
		}
		getContextId() {
			return this.#contextId;
		}
		setContextParameters(contextParameters) {
			this.#contextParameters = contextParameters;
			return this;
		}

		/**
		 * Write or not history, in depend on $state.
		 *
		 * @param {boolean} state
		 * @return {Engine}
		 */
		setHistoryState(state) {
			this.#historyState = state;
			return this;
		}

		/**
		 * Set group ID for save history.
		 * -1 - no grouped, 0 - first item of group
		 * @param id
		 * @return {Engine}
		 */
		setHistoryGroupId(id) {
			this.#historyGroupId = id;
			return this;
		}
		setBannerLaunched() {
			this.#addSystemParameters();
			return this.#send(Engine.setBannerLaunchedUrl, {
				parameters: this.#parameters
			});
		}
		async checkAgreement() {
			this.#addSystemParameters();
			return this.#send(Engine.checkAgreementUrl, {
				parameters: this.#parameters,
				agreementCode: 'AI_BOX_AGREEMENT'
			});
		}
		acceptAgreement() {
			this.#addSystemParameters();
			return this.#send(Engine.acceptAgreementUrl, {
				parameters: this.#parameters,
				agreementCode: 'AI_BOX_AGREEMENT'
			});
		}

		/**
		 * Makes request for text completions.
		 *
		 * @return {Promise}
		 */
		textCompletions() {
			this.#addSystemParameters();
			return this.#send(Engine.textCompletionsUrl, {
				prompt: this.#payload.getRawData().prompt,
				engineCode: this.#payload.getRawData().engineCode,
				roleCode: this.#payload.getRawData()?.roleCode,
				markers: this.#payload.getMarkers(),
				parameters: this.#parameters
			});
		}

		/**
		 * Makes request for image completions.
		 *
		 * @return {Promise}
		 */
		imageCompletions() {
			this.#addSystemParameters();
			return this.#send(Engine.imageCompletionsUrl, {
				prompt: this.#payload.getRawData().prompt,
				engineCode: this.#payload.getRawData().engineCode,
				markers: this.#payload.getMarkers(),
				parameters: this.#parameters
			});
		}
		getTooling(category) {
			this.#addSystemParameters();
			this.#parameters.category = this.#parameters.promptCategory;
			const data = {
				parameters: this.#parameters,
				category: this.#parameters.promptCategory,
				moduleId: this.#moduleId,
				context: this.#contextId
			};
			return main_core.ajax.runAction('ai.prompt.getPromptsForUser', {
				data: main_core.Http.Data.convertObjectToFormData(data),
				method: 'POST',
				start: false,
				preparePost: false
			});
		}
		getImagePickerTooling() {
			this.#addSystemParameters();
			const data = {
				parameters: this.#parameters,
				category: 'image'
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.getToolingUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}
		getImageCopilotTooling() {
			this.#addSystemParameters();
			const data = {
				parameters: this.#parameters
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.getImageToolingUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}
		getImageEngineParams(engineCode) {
			this.#addSystemParameters();
			const data = {
				engineCode,
				parameters: this.#parameters
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.getImageParamsUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}
		async getRolesDialogData() {
			this.#addSystemParameters();
			const data = {
				parameters: this.#parameters
			};
			return this.#send(Engine.getRolesDialogDataUrl, data);
		}
		async getRoles() {
			this.#addSystemParameters();
			const data = {
				parameters: this.#parameters
			};
			return this.#send(Engine.getRolesListUrl, data);
		}
		async addRoleToFavouriteList(roleCode) {
			this.#addSystemParameters();
			const data = {
				roleCode,
				parameters: this.#parameters
			};
			return this.#send(Engine.addRoleToFavouriteListUrl, data);
		}
		async removeRoleFromFavouriteList(roleCode) {
			this.#addSystemParameters();
			const data = {
				roleCode,
				parameters: this.#parameters
			};
			return this.#send(Engine.removeRoleFromFavouriteListUrl, data);
		}
		installKit(code) {
			this.#addSystemParameters();
			const data = {
				code,
				parameters: this.#parameters
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.installKitUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}

		/**
		 * Send user's acceptation of agreement.
		 *
		 * @return {Promise<string>}
		 */
		acceptImageAgreement(engineCode) {
			this.#addSystemParameters();
			const data = {
				engineCode,
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				parameters: this.#parameters
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.imageAcceptationUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}
		acceptTextAgreement(engineCode) {
			this.#addSystemParameters();
			const data = {
				engineCode,
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				parameters: this.#parameters
			};
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url: Engine.textAcceptationUrl,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							resolve(response);
						}
					},
					onfailure: reject
				});
				xhr.send(fd);
			});
		}
		saveImage(imageUrl) {
			this.#addSystemParameters();
			const data = {
				pictureUrl: imageUrl,
				parameters: this.#parameters
			};
			return this.#send(Engine.saveImageUrl, data);
		}
		getFeedbackData() {
			this.#addSystemParameters();
			const data = {
				parameters: this.#parameters
			};
			return this.#send(Engine.textFeedbackDataUrl, data);
		}

		/**
		 * Adds additional system parameters.
		 */
		#addSystemParameters() {
			this.#parameters.bx_module = this.#moduleId;
			this.#parameters.bx_context = this.#contextId;
			this.#parameters.bx_context_parameters = this.#contextParameters;
			this.#parameters.bx_history = this.#historyState;
			this.#parameters.bx_history_group_id = this.#historyGroupId;
			this.#parameters.bx_analytic = this.#analyticParameters;
		}

		/**
		 * Registers pull listener if response from the Controller is a queue's hash.
		 *
		 * @param {string} queueHash
		 * @param {() => {}} resolve
		 * @param {() => {}} reject
		 */
		#registerPullListener(queueHash, resolve, reject) {
			main_core.addCustomEvent('onPullEvent-ai', (command, params) => {
				const {
					hash,
					data,
					error
				} = params;
				if (command === 'onQueueJobExecute' && hash === queueHash) {
					resolve({
						data
					});
				} else if (command === 'onQueueJobFail' && hash === queueHash) {
					reject({
						errors: [error]
					});
				}
			});
		}

		/**
		 * Makes request to the Controller.
		 *
		 * @param {string} url
		 * @param {Object} data
		 * @return {Promise}
		 */
		#send(url, data) {
			if (this.#isOffline()) {
				return Promise.reject(new Error(main_core.Loc.getMessage('AI_ENGINE_INTERNET_PROBLEM')));
			}
			return new Promise((resolve, reject) => {
				const fd = main_core.Http.Data.convertObjectToFormData(data);
				const xhr = main_core.ajax({
					method: 'POST',
					dataType: 'json',
					url,
					data: fd,
					start: false,
					preparePost: false,
					onsuccess: response => {
						if (response.status === 'error') {
							reject(response);
						} else {
							const queueHash = response.data?.queue;
							if (queueHash) {
								this.#registerPullListener(queueHash, resolve, reject);
							} else {
								resolve(response);
							}
						}
					},
					onfailure: (res, resData) => {
						if (res === 'processing' && resData?.bProactive === true) {
							reject(resData.data);
						}
						reject(res);
					}
				});
				xhr.send(fd);
			});
		}
		#isOffline() {
			return !window.navigator.onLine;
		}
	}

	exports.Base = Base;
	exports.Engine = Engine;
	exports.Text = Text;

})(this.BX.AI = this.BX.AI || {}, BX);
//# sourceMappingURL=engine.bundle.js.map
