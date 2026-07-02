/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, sidepanel, ui_entitySelector, ui_notification, bizproc_router, ui_dialogs_messagebox) {
	'use strict';

	const ACTION_AJAX_MAP = Object.freeze({
		load: 'get_templates',
		start: 'start_workflow',
		check_parameters: 'check_parameters'
	});
	const ACTION_CONTROLLER_MAP = Object.freeze({
		load: 'getTemplates',
		start: 'startWorkflow',
		check_parameters: 'checkParameters'
	});
	class CallActionHelper {
		#defaultData = {};
		#ajaxUrl = '';
		#controller = 'bizproc.workflow.starter';
		constructor(data) {
			this.#fillDefaultData(data);
			if (main_core.Type.isStringFilled(data.customAjaxUrl)) {
				this.#ajaxUrl = data.customAjaxUrl;
			} else if (!main_core.Type.isStringFilled(this.#defaultData.signed_document_type)) {
				console.warn(`
				Bizproc.Workflow.Starter: 
				Using the document type in parts has been deprecated and will soon cease to be supported. 
				Please use a signed document type
			`);
				this.#ajaxUrl = '/bitrix/components/bitrix/bizproc.workflow.start/ajax.php';
			}
		}
		#fillDefaultData(data) {
			if (!main_core.Type.isNil(data.signedDocumentType)) {
				this.#defaultData.signed_document_type = data.signedDocumentType;
			}
			if (!main_core.Type.isNil(data.signedDocumentId)) {
				this.#defaultData.signed_document_id = data.signedDocumentId;
			}
			if (!main_core.Type.isNil(data.complexDocumentType?.moduleId)) {
				this.#defaultData.module_id = data.complexDocumentType.moduleId;
			}
			if (!main_core.Type.isNil(data.complexDocumentType?.entity)) {
				this.#defaultData.entity = data.complexDocumentType.entity;
			}
			if (!main_core.Type.isNil(data.complexDocumentType?.documentType)) {
				this.#defaultData.document_type = data.complexDocumentType.documentType;
			}
			if (!main_core.Type.isNil(data.complexDocumentId?.documentId)) {
				this.#defaultData.document_id = data.complexDocumentId.documentId;
			}
			if (!main_core.Type.isNil(data.triggerType)) {
				this.#defaultData.trigger_type = data.triggerType;
			}
		}
		get #hasAjaxUrl() {
			return main_core.Type.isStringFilled(this.#ajaxUrl);
		}
		callAction(action, actionData = {}) {
			const actionName = this.#hasAjaxUrl ? ACTION_AJAX_MAP[action] : ACTION_CONTROLLER_MAP[action];
			if (!main_core.Type.isStringFilled(actionName)) {
				return Promise.reject(new Error('incorrect action')); // todo: Loc
			}
			const data = this.addData(this.#defaultData, actionData);
			return this.#hasAjaxUrl ? this.#callAjax(actionName, data) : this.#callController(actionName, data);
		}
		#callAjax(actionName, actionData = {}) {
			const data = this.addData({
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				site: main_core.Loc.getMessage('SITE_ID'),
				ajax_action: actionName
			}, actionData);
			return new Promise((resolve, reject) => {
				const ajaxConfig = {
					method: 'POST',
					dataType: 'json',
					url: this.#ajaxUrl,
					data,
					onsuccess: response => {
						if (response.success) {
							resolve(response);
						} else {
							reject(response);
						}
					},
					onfailure: () => {
						reject();
					}
				};
				if (!main_core.Type.isPlainObject(data)) {
					ajaxConfig.preparePost = false;
				}
				main_core.ajax(ajaxConfig);
			});
		}
		#callController(actionName, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction(`${this.#controller}.${actionName}`, {
					data
				}).then(resolve).catch(reject);
			});
		}
		addData(targetData, actionData = {}) {
			const data = actionData;
			const isPlainObject = main_core.Type.isPlainObject(data);
			Object.entries(targetData).forEach(([key, value]) => {
				const modifiedKey = this.#hasAjaxUrl ? key : main_core.Text.toCamelCase(key);
				if (isPlainObject) {
					data[modifiedKey] = value;
					return;
				}
				data.set(modifiedKey, value);
			});
			return data;
		}
	}

	class ComplexDocumentId {
		#moduleId;
		#entity;
		#documentId;
		static tryCreate(documentId) {
			if (documentId instanceof ComplexDocumentId) {
				return documentId;
			}
			if (!main_core.Type.isPlainObject(documentId)) {
				return null;
			}
			if (!main_core.Type.isStringFilled(documentId.moduleId) || !main_core.Type.isStringFilled(documentId.entity) || !(main_core.Type.isStringFilled(documentId.documentId) || main_core.Type.isNumber(documentId.documentId))) {
				return null;
			}
			return new ComplexDocumentId(documentId.moduleId, documentId.entity, documentId.documentId);
		}
		constructor(moduleId, entity, documentId) {
			if (!main_core.Type.isStringFilled(moduleId) || !main_core.Type.isStringFilled(entity) || !(main_core.Type.isStringFilled(documentId) || main_core.Type.isNumber(documentId))) {
				throw new TypeError('incorrect complex document id');
			}
			this.#moduleId = moduleId;
			this.#entity = entity;
			this.#documentId = documentId;
		}
		get moduleId() {
			return this.#moduleId;
		}
		get entity() {
			return this.#entity;
		}
		get documentId() {
			return this.#documentId;
		}
	}

	class ComplexDocumentType {
		#moduleId;
		#entity;
		#documentType;
		static tryCreate(documentType) {
			if (documentType instanceof ComplexDocumentType) {
				return documentType;
			}
			if (!main_core.Type.isPlainObject(documentType)) {
				return null;
			}
			if (!main_core.Type.isStringFilled(documentType.moduleId) || !main_core.Type.isStringFilled(documentType.entity) || !main_core.Type.isStringFilled(documentType.documentType)) {
				return null;
			}
			return new ComplexDocumentType(documentType.moduleId, documentType.entity, documentType.documentType);
		}
		constructor(moduleId, entity, documentType) {
			if (!main_core.Type.isStringFilled(moduleId) || !main_core.Type.isStringFilled(entity) || !main_core.Type.isStringFilled(documentType)) {
				throw new TypeError('incorrect complex document type');
			}
			this.#moduleId = moduleId;
			this.#entity = entity;
			this.#documentType = documentType;
		}
		get moduleId() {
			return this.#moduleId;
		}
		get entity() {
			return this.#entity;
		}
		get documentType() {
			return this.#documentType;
		}
		isEqual(targetDocumentType) {
			if (main_core.Type.isString(targetDocumentType)) {
				return targetDocumentType.includes(this.moduleId) && targetDocumentType.includes(this.entity) && targetDocumentType.includes(this.documentType);
			}
			if (main_core.Type.isObjectLike(targetDocumentType)) {
				return this.moduleId === targetDocumentType.moduleId && this.entity === targetDocumentType.entity && this.documentType === targetDocumentType.documentType;
			}
			return false;
		}
	}

	class StarterDocument {
		#documentType;
		#documentId;
		static tryCreate(document) {
			if (document instanceof StarterDocument) {
				return document;
			}
			if (!main_core.Type.isPlainObject(document)) {
				return null;
			}
			const documentType = ComplexDocumentType.tryCreate(document.documentType);
			const documentId = ComplexDocumentId.tryCreate(document.documentId);
			if (!documentType || !documentId) {
				return null;
			}
			if (documentType.moduleId !== documentId.moduleId || documentType.entity !== documentId.entity) {
				return null;
			}
			return new StarterDocument(documentType, documentId);
		}
		constructor(documentType, documentId) {
			if (documentType.moduleId !== documentId.moduleId || documentType.entity !== documentId.entity) {
				throw new TypeError('document type and id are incompatible');
			}
			this.#documentType = documentType;
			this.#documentId = documentId;
		}
		get documentType() {
			return this.#documentType;
		}
		get documentId() {
			return this.#documentId;
		}
		get key() {
			return [this.documentType.moduleId, this.documentType.entity, this.documentType.documentType, String(this.documentId.documentId)].join('@');
		}
	}

	class ErrorNotifier {
		#messages = [];
		constructor(errors) {
			if (main_core.Type.isArrayFilled(errors)) {
				this.#setMessages(errors);
			}
		}
		#setMessages(errors) {
			errors.forEach(error => {
				if (main_core.Type.isStringFilled(error)) {
					this.#messages.push(main_core.Text.encode(error));
				} else if (main_core.Type.isPlainObject(error) && main_core.Type.isStringFilled(error.message)) {
					if (main_core.Type.isStringFilled(error.code) && error.code === 'NETWORK_ERROR') {
						this.#messages.push(main_core.Text.encode(this.#defaultErrorMessage));
					} else {
						this.#messages.push(main_core.Text.encode(error.message));
					}
				}
			});
		}
		show() {
			this.#showMessages(ui_dialogs_messagebox.MessageBox);
		}
		showToWindow(targetWindow) {
			targetWindow.BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
				this.#showMessages(targetWindow.BX.UI.Dialogs.MessageBox);
			}).catch(() => {});
		}
		#showMessages(messageBox) {
			if (!messageBox) {
				return;
			}
			if (main_core.Type.isArrayFilled(this.#messages)) {
				messageBox.alert(this.#messages.join('<br>'));
				return;
			}
			messageBox.alert(main_core.Text.encode(this.#defaultErrorMessage));
		}
		get #defaultErrorMessage() {
			return main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_STARTER_REQUEST_FAILED');
		}
	}

	class Starter extends main_core_events.EventEmitter {
		#templates = null;
		#signedDocumentType = null;
		#signedDocumentId = null;
		#complexDocumentType = null;
		#complexDocumentId = null;
		#triggerType = null;
		#templatesSelector = null;
		#callActionHelper;
		#hasCustomAjaxUrl = false;
		constructor(data) {
			super();
			this.setEventNamespace('BX.Bizproc.Workflow.Starter');
			this.#setDocumentType(data);
			this.#triggerType = data.triggerType || null;
			if (main_core.Type.isNil(this.#complexDocumentType) && main_core.Type.isNil(this.#signedDocumentType)) {
				throw new TypeError('document type is empty');
			}
			this.#setDocumentId(data);
			if (main_core.Type.isArray(data.templates)) {
				this.#templates = data.templates;
			}
			this.#hasCustomAjaxUrl = main_core.Type.isStringFilled(data.ajaxUrl);
			this.#callActionHelper = new CallActionHelper({
				complexDocumentType: this.#complexDocumentType,
				signedDocumentType: this.#signedDocumentType,
				complexDocumentId: this.#complexDocumentId,
				signedDocumentId: this.#signedDocumentId,
				triggerType: data.triggerType || '',
				customAjaxUrl: this.#hasCustomAjaxUrl ? data.ajaxUrl : null
			});
			managerInstance.put(this);
		}
		#setDocumentType(data) {
			if (main_core.Type.isStringFilled(data.moduleId) && main_core.Type.isStringFilled(data.entity) && main_core.Type.isStringFilled(data.documentType)) {
				this.#complexDocumentType = new ComplexDocumentType(data.moduleId, data.entity, data.documentType);
			}
			if (main_core.Type.isStringFilled(data.signedDocumentType)) {
				this.#signedDocumentType = data.signedDocumentType;
			}
		}
		#setDocumentId(data) {
			if (main_core.Type.isStringFilled(data.moduleId) && main_core.Type.isStringFilled(data.entity) && (main_core.Type.isStringFilled(data.documentId) || main_core.Type.isNumber(data.documentId))) {
				this.#complexDocumentId = new ComplexDocumentId(data.moduleId, data.entity, data.documentId);
			}
			if (main_core.Type.isStringFilled(data.signedDocumentId)) {
				this.#signedDocumentId = data.signedDocumentId;
			}
		}
		static singleStart(config, callback) {
			const templateId = main_core.Text.toInteger(config?.templateId);
			if (templateId <= 0) {
				return;
			}
			let starter = null;
			try {
				starter = new Starter({
					moduleId: config.moduleId,
					entity: config.entity,
					documentType: config.documentType,
					documentId: config.documentId,
					signedDocumentType: config.signedDocumentType,
					signedDocumentId: config.signedDocumentId,
					templates: config.templates || null,
					triggerType: config.triggerType || null,
					ajaxUrl: config.ajaxUrl || ''
				});
			} catch (e) {
				console.error(e);
				return;
			}
			if (main_core.Type.isFunction(callback)) {
				main_core_events.EventEmitter.subscribe(starter, 'onAfterStartWorkflow', callback);
			}
			starter.beginStartWorkflow(templateId).then(() => {
				managerInstance.remove(starter);
			}).catch(() => {});
		}
		static showTemplatesListByDocuments(documents, config = {}) {
			const preparedDocuments = this.#normalizeDocuments(documents);
			if (!main_core.Type.isArrayFilled(preparedDocuments)) {
				throw new TypeError('documents are empty');
			}
			bizproc_router.Router.openWorkflowStartList({
				requestMethod: 'get',
				requestParams: this.#createDocumentsRequestParams(preparedDocuments),
				events: {
					onCloseComplete: main_core.Type.isFunction(config.callback) ? config.callback : () => {}
				}
			});
		}
		static showAutoStartParametersPopupByDocumentTypes(documentTypes, autoExecuteType, config = {}) {
			const preparedDocumentTypes = this.#normalizeDocumentTypes(documentTypes);
			const preparedAutoExecuteType = main_core.Text.toInteger(autoExecuteType);
			this.#assertAutoStartParameters(preparedDocumentTypes, preparedAutoExecuteType);
			bizproc_router.Router.openWorkflowAutoStartParameters({
				requestMethod: 'post',
				requestParams: this.#createAutoStartRequestParams(preparedDocumentTypes, preparedAutoExecuteType),
				events: {
					onCloseComplete: this.#createAutoStartOnCloseCompleteHandler(config.callback)
				}
			});
		}
		static #assertAutoStartParameters(documentTypes, autoExecuteType) {
			if (!main_core.Type.isArrayFilled(documentTypes)) {
				throw new TypeError('document types are empty');
			}
			if (autoExecuteType < 0) {
				throw new TypeError('auto execute type is incorrect');
			}
		}
		static #normalizeDocuments(documents) {
			if (!main_core.Type.isArrayFilled(documents)) {
				return [];
			}
			const uniqueDocuments = new Map();
			documents.forEach(document => {
				const normalizedDocument = StarterDocument.tryCreate(document);
				if (!normalizedDocument) {
					return;
				}
				uniqueDocuments.set(normalizedDocument.key, normalizedDocument);
			});
			return [...uniqueDocuments.values()];
		}
		static #normalizeDocumentTypes(documentTypes) {
			if (!main_core.Type.isArrayFilled(documentTypes)) {
				return [];
			}
			const uniqueDocumentTypes = new Map();
			documentTypes.forEach(documentType => {
				const normalizedDocumentType = this.#normalizeDocumentType(documentType);
				if (!normalizedDocumentType) {
					return;
				}
				uniqueDocumentTypes.set([normalizedDocumentType.moduleId, normalizedDocumentType.entity, normalizedDocumentType.documentType].join('@'), normalizedDocumentType);
			});
			return [...uniqueDocumentTypes.values()];
		}
		static #normalizeDocumentType(documentType) {
			return ComplexDocumentType.tryCreate(documentType);
		}
		static #createDocumentPayload(document) {
			return {
				documentType: [document.documentType.moduleId, document.documentType.entity, document.documentType.documentType],
				documentId: [document.documentId.moduleId, document.documentId.entity, document.documentId.documentId]
			};
		}
		static #createDocumentTypePayload(documentType) {
			return [documentType.moduleId, documentType.entity, documentType.documentType];
		}
		static #createDocumentsRequestParams(documents) {
			const requestParams = {};
			documents.forEach((document, documentIndex) => {
				const payload = this.#createDocumentPayload(document);
				payload.documentType.forEach((value, valueIndex) => {
					requestParams[`documents[${documentIndex}][documentType][${valueIndex}]`] = value;
				});
				payload.documentId.forEach((value, valueIndex) => {
					requestParams[`documents[${documentIndex}][documentId][${valueIndex}]`] = value;
				});
			});
			return requestParams;
		}
		static #createAutoStartRequestParams(documentTypes, autoExecuteType) {
			return {
				autoExecuteType,
				documents: documentTypes.map(documentType => ({
					documentType: this.#createDocumentTypePayload(documentType)
				}))
			};
		}
		static #createAutoStartOnCloseCompleteHandler(callback) {
			return event => {
				if (!main_core.Type.isFunction(callback)) {
					return;
				}
				callback({
					parameters: this.#extractSignedParameters(event)
				});
			};
		}
		static #extractSignedParameters(event) {
			const slider = event.getSlider();
			const dictionary = slider ? slider.getData() : null;
			if (!dictionary?.has('data')) {
				return null;
			}
			return dictionary.get('data').signedParameters || null;
		}
		static showTemplates(starterData, config) {
			let starter = null;
			try {
				starter = new Starter({
					signedDocumentType: starterData.signedDocumentType,
					signedDocumentId: starterData.signedDocumentId
				});
			} catch (e) {
				console.error(e);
				return;
			}
			starter.#showTemplatesSlider(() => {
				if (main_core.Type.isFunction(config.callback)) {
					config.callback();
				}
				managerInstance.remove(starter);
			});
		}
		get signedDocumentType() {
			return this.#signedDocumentType;
		}
		get complexDocumentType() {
			return this.#complexDocumentType;
		}
		#showTemplatesSlider(callback = null) {
			const options = {
				requestMethod: 'get',
				requestParams: {
					signedDocumentType: this.#signedDocumentType,
					signedDocumentId: this.#signedDocumentId
				},
				events: {
					onCloseComplete: main_core.Type.isFunction(callback) ? callback : () => {}
				}
			};
			bizproc_router.Router.openWorkflowStartList(options);
		}

		// compatibility
		showTemplatesMenu(targetNode) {
			if (main_core.Type.isStringFilled(this.#signedDocumentType) && !this.#hasCustomAjaxUrl) {
				this.#showTemplatesSlider();
				return;
			}
			if (!main_core.Type.isElementNode(targetNode) && !main_core.Type.isNull(targetNode)) {
				return;
			}
			if (main_core.Type.isArray(this.#templates)) {
				if (!this.#templatesSelector) {
					this.#initTemplateSelector(targetNode);
				}
				this.#templatesSelector.show();
				return;
			}
			this.#loadTemplates().then(() => {
				this.showTemplatesMenu(targetNode);
			}).catch(response => {
				this.#showErrors(response?.errors);
			});
		}
		#loadTemplates() {
			return new Promise((resolve, reject) => {
				this.#callAction('load').then(response => {
					this.#templates = main_core.Type.isArray(response.data.templates) ? response.data.templates : [];
					resolve(response);
				}).catch(reject);
			});
		}
		#initTemplateSelector(targetNode) {
			const items = [];
			if (main_core.Type.isArrayFilled(this.#templates)) {
				this.#templates.forEach(template => {
					if (main_core.Text.toInteger(template.id) > 0 && main_core.Type.isStringFilled(template.name)) {
						items.push({
							id: template.id,
							title: template.name,
							subtitle: template.description || '',
							entityId: 'template',
							tabs: 'recents',
							customData: template
						});
					}
				});
			}
			this.#templatesSelector = new ui_entitySelector.Dialog({
				targetNode,
				context: 'bp_workflow_starter',
				items,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				hideOnSelect: true,
				clearSearchOnSelect: true,
				hideByEsc: true,
				cacheable: true,
				focusOnFirst: true,
				showAvatars: false,
				compactView: false,
				events: {
					'Item:onSelect': event => {
						this.#templatesSelector.deselectAll();
						const customData = event.getData().item?.getCustomData();
						if (customData) {
							this.#onTemplateSelect(customData);
						}
					}
				},
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_STARTER_EMPTY_TEMPLATES')
					}
				}
			});
		}
		#onTemplateSelect(template) {
			this.beginStartWorkflow(template.get('id')).then(() => {}).catch(() => {});
		}

		// compatibility
		showParametersPopup(templateId) {
			this.beginStartWorkflow(templateId).then(() => {}).catch(() => {});
		}
		beginStartWorkflow(templateId) {
			if (main_core.Text.toInteger(templateId) <= 0) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				this.#showStepByStepSlider({
					templateId,
					autoExecuteType: null
				}).then(data => {
					if (main_core.Type.isStringFilled(data.workflowId)) {
						managerInstance.fireEvent(this, 'onAfterStartWorkflow', {
							workflowId: data.workflowId
						});
					}
					resolve();
				}).catch(reject);
			});
		}

		// compatibility
		showAutoStartParametersPopup(autoExecuteType, config = {}) {
			this.#showStepByStepSlider({
				templateId: null,
				autoExecuteType
			}).then(data => {
				if (main_core.Type.isFunction(config?.callback)) {
					if (main_core.Type.isString(data.signedParameters)) {
						config.callback({
							parameters: data.signedParameters
						});
						return;
					}
					config.callback({
						parameters: null
					});
				}
			}).catch(() => {});
		}
		#showStepByStepSlider(componentParams) {
			return new Promise(resolve => {
				BX.SidePanel.Instance.open(this.#createStepByStepSliderUrl(componentParams), {
					width: 900,
					cacheable: false,
					allowChangeHistory: false,
					// loader: '', // todo: loader
					events: {
						onCloseComplete: event => {
							const slider = event.getSlider();
							const dictionary = slider ? slider.getData() : null;
							let data = {};
							if (dictionary && dictionary.has('data')) {
								data = {
									workflowId: dictionary.get('data').workflowId || null,
									signedParameters: dictionary.get('data').signedParameters || null
								};
							}
							resolve(data);
						}
					}
				});
			});
		}
		#createStepByStepSliderUrl(componentParams) {
			let url = main_core.Uri.addParam('/bitrix/components/bitrix/bizproc.workflow.start/', {
				sessid: main_core.Loc.getMessage('bitrix_sessid')
			} // todo: remove?
			);
			const templateId = main_core.Text.toInteger(componentParams.templateId);
			if (templateId > 0) {
				url = main_core.Uri.addParam(url, {
					templateId
				});
			}
			const autoExecuteType = main_core.Text.toInteger(componentParams.autoExecuteType);
			if (!main_core.Type.isNil(componentParams.autoExecuteType) && autoExecuteType >= 0) {
				url = main_core.Uri.addParam(url, {
					autoExecuteType
				});
			}
			if (this.#complexDocumentType?.moduleId) {
				url = main_core.Uri.addParam(url, {
					moduleId: this.#complexDocumentType.moduleId,
					entity: this.#complexDocumentType.entity,
					documentType: this.#complexDocumentType.documentType
				});
			}
			if (this.#signedDocumentType) {
				url = main_core.Uri.addParam(url, {
					signedDocumentType: this.#signedDocumentType
				});
			}
			if (this.#complexDocumentId?.documentId) {
				url = main_core.Uri.addParam(url, {
					documentId: this.#complexDocumentId.documentId
				});
			}
			if (this.#signedDocumentId) {
				url = main_core.Uri.addParam(url, {
					signedDocumentId: this.#signedDocumentId
				});
			}
			if (main_core.Type.isStringFilled(this.#triggerType)) {
				url = main_core.Uri.addParam(url, {
					triggerType: this.#triggerType
				});
			}
			return url;
		}
		#callAction(action, formData = {}, addData = {}) {
			return this.#callActionHelper.callAction(action, this.#callActionHelper.addData(addData, formData));
		}
		#showErrors(errors, targetWindow) {
			const notifier = new ErrorNotifier(errors);
			const method = main_core.Type.isNil(targetWindow) ? 'show' : 'showToWindow';
			notifier[method](targetWindow);
		}
	}

	class Manager {
		#instances = new Set();
		put(starter) {
			this.#instances.add(starter);
			return this;
		}
		remove(starter) {
			this.#instances.delete(starter);
		}
		fireEvent(starter, eventName, parameters) {
			const instances = this.#findSimilar(starter);
			instances.forEach(target => {
				target.emit(eventName, parameters);
				main_core_events.EventEmitter.emit(target, eventName, parameters, {
					useGlobalNaming: true
				}); // compatibility
			});
		}
		#findSimilar(target) {
			const result = [target];
			this.#instances.forEach(starter => {
				if (starter !== target && this.#isEqual(target, starter)) {
					result.push(starter);
				}
			});
			return result;
		}
		#isEqual(target, starter) {
			if (target.signedDocumentType && starter.signedDocumentType) {
				return target.signedDocumentType === starter.signedDocumentType;
			}
			if (target.complexDocumentType) {
				return target.complexDocumentType.isEqual(starter.complexDocumentType || starter.signedDocumentType);
			}
			return starter.complexDocumentType.isEqual(target.complexDocumentType || target.signedDocumentType);
		}
	}

	const managerInstance = new Manager();

	exports.Starter = Starter;
	exports.managerInstance = managerInstance;

})(this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {}, BX, BX.Event, BX, BX.UI.EntitySelector, BX, BX.Bizproc, BX.UI.Dialogs);
//# sourceMappingURL=starter.bundle.js.map
