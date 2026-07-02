import { Type, Loc, Text, Uri } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'sidepanel';
import { Dialog } from 'ui.entity-selector';
import 'ui.notification';

import { Router } from 'bizproc.router';

import { CallActionHelper, type Action } from './call-action-helper';
import { ComplexDocumentId } from './data/complex-document-id';
import { ComplexDocumentType } from './data/complex-document-type';
import {
	StarterDocument,
	type StarterComplexDocumentTypeInput,
	type StarterDocumentInit,
} from './data/starter-document';
import { ErrorNotifier } from './error-notifier';
import { managerInstance } from './index';
import { type StarterData } from './types/starter-data';

export type SignedDocumentType = string;
export type SignedDocumentId = string;

export class Starter extends EventEmitter
{
	#templates: ?[] = null;
	#signedDocumentType: ?SignedDocumentType = null;
	#signedDocumentId: ?SignedDocumentId = null;
	#complexDocumentType: ?ComplexDocumentType = null;
	#complexDocumentId: ?ComplexDocumentId = null;
	#triggerType: ?string = null;

	#templatesSelector: ?Dialog = null;
	#callActionHelper: CallActionHelper;
	#hasCustomAjaxUrl: boolean = false;

	constructor(data: StarterData)
	{
		super();
		this.setEventNamespace('BX.Bizproc.Workflow.Starter');

		this.#setDocumentType(data);
		this.#triggerType = data.triggerType || null;

		if (Type.isNil(this.#complexDocumentType) && Type.isNil(this.#signedDocumentType))
		{
			throw new TypeError('document type is empty');
		}

		this.#setDocumentId(data);

		if (Type.isArray(data.templates))
		{
			this.#templates = data.templates;
		}

		this.#hasCustomAjaxUrl = Type.isStringFilled(data.ajaxUrl);
		this.#callActionHelper = new CallActionHelper({
			complexDocumentType: this.#complexDocumentType,
			signedDocumentType: this.#signedDocumentType,
			complexDocumentId: this.#complexDocumentId,
			signedDocumentId: this.#signedDocumentId,
			triggerType: data.triggerType || '',
			customAjaxUrl: this.#hasCustomAjaxUrl ? data.ajaxUrl : null,
		});

		managerInstance.put(this);
	}

	#setDocumentType(data: StarterData): void
	{
		if (
			Type.isStringFilled(data.moduleId)
			&& Type.isStringFilled(data.entity)
			&& Type.isStringFilled(data.documentType)
		)
		{
			this.#complexDocumentType = new ComplexDocumentType(data.moduleId, data.entity, data.documentType);
		}

		if (Type.isStringFilled(data.signedDocumentType))
		{
			this.#signedDocumentType = data.signedDocumentType;
		}
	}

	#setDocumentId(data: StarterData): void
	{
		if (
			Type.isStringFilled(data.moduleId)
			&& Type.isStringFilled(data.entity)
			&& (Type.isStringFilled(data.documentId) || Type.isNumber(data.documentId))
		)
		{
			this.#complexDocumentId = new ComplexDocumentId(data.moduleId, data.entity, data.documentId);
		}

		if (Type.isStringFilled(data.signedDocumentId))
		{
			this.#signedDocumentId = data.signedDocumentId;
		}
	}

	static singleStart(config: StarterData & { hasParameters: boolean, templateId: number }, callback: ?Function)
	{
		const templateId = Text.toInteger(config?.templateId);
		if (templateId <= 0)
		{
			return;
		}

		let starter = null;
		try
		{
			starter = new Starter({
				moduleId: config.moduleId,
				entity: config.entity,
				documentType: config.documentType,
				documentId: config.documentId,
				signedDocumentType: config.signedDocumentType,
				signedDocumentId: config.signedDocumentId,
				templates: config.templates || null,
				triggerType: config.triggerType || null,
				ajaxUrl: config.ajaxUrl || '',
			});
		}
		catch (e)
		{
			console.error(e);

			return;
		}

		if (Type.isFunction(callback))
		{
			EventEmitter.subscribe(starter, 'onAfterStartWorkflow', callback);
		}

		starter.beginStartWorkflow(templateId)
			.then(() => {
				managerInstance.remove(starter);
			})
			.catch(() => {})
		;
	}

	static showTemplatesListByDocuments(
		documents: StarterDocumentInit[],
		config: { callback: ?Function } = {},
	): void
	{
		const preparedDocuments = this.#normalizeDocuments(documents);
		if (!Type.isArrayFilled(preparedDocuments))
		{
			throw new TypeError('documents are empty');
		}

		Router.openWorkflowStartList({
			requestMethod: 'get',
			requestParams: this.#createDocumentsRequestParams(preparedDocuments),
			events: {
				onCloseComplete: Type.isFunction(config.callback) ? config.callback : () => {},
			},
		});
	}

	static showAutoStartParametersPopupByDocumentTypes(
		documentTypes: StarterComplexDocumentTypeInput[],
		autoExecuteType: number,
		config: { callback: ?Function } = {},
	): void
	{
		const preparedDocumentTypes = this.#normalizeDocumentTypes(documentTypes);
		const preparedAutoExecuteType = Text.toInteger(autoExecuteType);

		this.#assertAutoStartParameters(preparedDocumentTypes, preparedAutoExecuteType);

		Router.openWorkflowAutoStartParameters({
			requestMethod: 'post',
			requestParams: this.#createAutoStartRequestParams(
				preparedDocumentTypes,
				preparedAutoExecuteType,
			),
			events: {
				onCloseComplete: this.#createAutoStartOnCloseCompleteHandler(config.callback),
			},
		});
	}

	static #assertAutoStartParameters(
		documentTypes: ComplexDocumentType[],
		autoExecuteType: number,
	): void
	{
		if (!Type.isArrayFilled(documentTypes))
		{
			throw new TypeError('document types are empty');
		}

		if (autoExecuteType < 0)
		{
			throw new TypeError('auto execute type is incorrect');
		}
	}

	static #normalizeDocuments(documents: StarterDocumentInit[]): StarterDocument[]
	{
		if (!Type.isArrayFilled(documents))
		{
			return [];
		}

		const uniqueDocuments = new Map();
		documents.forEach((document) => {
			const normalizedDocument = StarterDocument.tryCreate(document);
			if (!normalizedDocument)
			{
				return;
			}

			uniqueDocuments.set(normalizedDocument.key, normalizedDocument);
		});

		return [...uniqueDocuments.values()];
	}

	static #normalizeDocumentTypes(documentTypes: StarterComplexDocumentTypeInput[]): ComplexDocumentType[]
	{
		if (!Type.isArrayFilled(documentTypes))
		{
			return [];
		}

		const uniqueDocumentTypes = new Map();
		documentTypes.forEach((documentType) => {
			const normalizedDocumentType = this.#normalizeDocumentType(documentType);
			if (!normalizedDocumentType)
			{
				return;
			}

			uniqueDocumentTypes.set(
				[
					normalizedDocumentType.moduleId,
					normalizedDocumentType.entity,
					normalizedDocumentType.documentType,
				].join('@'),
				normalizedDocumentType,
			);
		});

		return [...uniqueDocumentTypes.values()];
	}

	static #normalizeDocumentType(documentType: mixed): ?ComplexDocumentType
	{
		return ComplexDocumentType.tryCreate(documentType);
	}

	static #createDocumentPayload(document: StarterDocument): {
		documentType: [string, string, string],
		documentId: [string, string, string | number],
	}
	{
		return {
			documentType: [
				document.documentType.moduleId,
				document.documentType.entity,
				document.documentType.documentType,
			],
			documentId: [
				document.documentId.moduleId,
				document.documentId.entity,
				document.documentId.documentId,
			],
		};
	}

	static #createDocumentTypePayload(documentType: ComplexDocumentType): [string, string, string]
	{
		return [
			documentType.moduleId,
			documentType.entity,
			documentType.documentType,
		];
	}

	static #createDocumentsRequestParams(documents: StarterDocument[]): { [string]: string | number }
	{
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

	static #createAutoStartRequestParams(
		documentTypes: ComplexDocumentType[],
		autoExecuteType: number,
	): {
		autoExecuteType: number,
		documents: Array<{ documentType: [string, string, string] }>,
	}
	{
		return {
			autoExecuteType,
			documents: documentTypes.map((documentType) => ({
				documentType: this.#createDocumentTypePayload(documentType),
			})),
		};
	}

	static #createAutoStartOnCloseCompleteHandler(callback: ?Function): (event: BX.SidePanel.Event) => void
	{
		return (event: BX.SidePanel.Event) => {
			if (!Type.isFunction(callback))
			{
				return;
			}

			callback({
				parameters: this.#extractSignedParameters(event),
			});
		};
	}

	static #extractSignedParameters(event: BX.SidePanel.Event): ?string
	{
		const slider = event.getSlider();
		const dictionary: ?BX.SidePanel.Dictionary = slider ? slider.getData() : null;

		if (!dictionary?.has('data'))
		{
			return null;
		}

		return dictionary.get('data').signedParameters || null;
	}

	static showTemplates(
		starterData: { signedDocumentType: string, signedDocumentId: string },
		config: { targetNode: ?HTMLElement, callback: ?Function },
	): void
	{
		let starter = null;
		try
		{
			starter = new Starter({
				signedDocumentType: starterData.signedDocumentType,
				signedDocumentId: starterData.signedDocumentId,
			});
		}
		catch (e)
		{
			console.error(e);

			return;
		}

		starter.#showTemplatesSlider(() => {
			if (Type.isFunction(config.callback))
			{
				config.callback();
			}
			managerInstance.remove(starter);
		});
	}

	get signedDocumentType(): ?string
	{
		return this.#signedDocumentType;
	}

	get complexDocumentType(): ?ComplexDocumentType
	{
		return this.#complexDocumentType;
	}

	#showTemplatesSlider(callback: ?Function = null): void
	{
		const options = {
			requestMethod: 'get',
			requestParams: {
				signedDocumentType: this.#signedDocumentType,
				signedDocumentId: this.#signedDocumentId,
			},
			events: {
				onCloseComplete: Type.isFunction(callback) ? callback : () => {},
			},
		};

		Router.openWorkflowStartList(options);
	}

	// compatibility
	showTemplatesMenu(targetNode)
	{
		if (Type.isStringFilled(this.#signedDocumentType) && !this.#hasCustomAjaxUrl)
		{
			this.#showTemplatesSlider();

			return;
		}

		if (!Type.isElementNode(targetNode) && !Type.isNull(targetNode))
		{
			return;
		}

		if (Type.isArray(this.#templates))
		{
			if (!this.#templatesSelector)
			{
				this.#initTemplateSelector(targetNode);
			}

			this.#templatesSelector.show();

			return;
		}

		this.#loadTemplates()
			.then(() => {
				this.showTemplatesMenu(targetNode);
			})
			.catch((response) => {
				this.#showErrors(response?.errors);
			})
		;
	}

	#loadTemplates(): Promise
	{
		return new Promise((resolve, reject) => {
			this.#callAction('load')
				.then((response) => {
					this.#templates = Type.isArray(response.data.templates) ? response.data.templates : [];
					resolve(response);
				})
				.catch(reject)
			;
		});
	}

	#initTemplateSelector(targetNode: HTMLElement)
	{
		const items = [];
		if (Type.isArrayFilled(this.#templates))
		{
			this.#templates.forEach((template) => {
				if (Text.toInteger(template.id) > 0 && Type.isStringFilled(template.name))
				{
					items.push({
						id: template.id,
						title: template.name,
						subtitle: template.description || '',
						entityId: 'template',
						tabs: 'recents',
						customData: template,
					});
				}
			});
		}

		this.#templatesSelector = new Dialog({
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
				'Item:onSelect': (event) => {
					this.#templatesSelector.deselectAll();
					const customData = event.getData().item?.getCustomData();
					if (customData)
					{
						this.#onTemplateSelect(customData);
					}
				},
			},
			recentTabOptions: {
				stub: true,
				stubOptions: {
					title: Loc.getMessage('BIZPROC_JS_WORKFLOW_STARTER_EMPTY_TEMPLATES'),
				},
			},
		});
	}

	#onTemplateSelect(template: Map)
	{
		this.beginStartWorkflow(template.get('id')).then(() => {}).catch(() => {});
	}

	// compatibility
	showParametersPopup(templateId)
	{
		this.beginStartWorkflow(templateId).then(() => {}).catch(() => {});
	}

	beginStartWorkflow(templateId: number): Promise
	{
		if (Text.toInteger(templateId) <= 0)
		{
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			this.#showStepByStepSlider({ templateId, autoExecuteType: null })
				.then((data: { workflowId: string }) => {
					if (Type.isStringFilled(data.workflowId))
					{
						managerInstance.fireEvent(this, 'onAfterStartWorkflow', { workflowId: data.workflowId });
					}

					resolve();
				})
				.catch(reject)
			;
		});
	}

	// compatibility
	showAutoStartParametersPopup(
		autoExecuteType: number,
		config: { callback: Function } = {},
	)
	{
		this.#showStepByStepSlider({ templateId: null, autoExecuteType })
			.then((data: { signedParameters: string }) => {
				if (Type.isFunction(config?.callback))
				{
					if (Type.isString(data.signedParameters))
					{
						config.callback({ parameters: data.signedParameters });

						return;
					}

					config.callback({ parameters: null });
				}
			})
			.catch(() => {})
		;
	}

	#showStepByStepSlider(componentParams: { templateId: ?number, autoExecuteType: ?number }): Promise
	{
		return new Promise((resolve) => {
			BX.SidePanel.Instance.open(
				this.#createStepByStepSliderUrl(componentParams),
				{
					width: 900,
					cacheable: false,
					allowChangeHistory: false,
					// loader: '', // todo: loader
					events: {
						onCloseComplete: (event: BX.SidePanel.Event) => {
							const slider = event.getSlider();
							const dictionary: ?BX.SidePanel.Dictionary = slider ? slider.getData() : null;
							let data = {};
							if (dictionary && dictionary.has('data'))
							{
								data = {
									workflowId: dictionary.get('data').workflowId || null,
									signedParameters: dictionary.get('data').signedParameters || null,
								};
							}

							resolve(data);
						},
					},
				},
			);
		});
	}

	#createStepByStepSliderUrl(componentParams: { templateId: ?number, autoExecuteType: ?number }): string
	{
		let url = Uri.addParam(
			'/bitrix/components/bitrix/bizproc.workflow.start/',
			{ sessid: Loc.getMessage('bitrix_sessid') }, // todo: remove?
		);

		const templateId = Text.toInteger(componentParams.templateId);
		if (templateId > 0)
		{
			url = Uri.addParam(url, { templateId });
		}

		const autoExecuteType = Text.toInteger(componentParams.autoExecuteType);
		if (!Type.isNil(componentParams.autoExecuteType) && autoExecuteType >= 0)
		{
			url = Uri.addParam(url, { autoExecuteType });
		}

		if (this.#complexDocumentType?.moduleId)
		{
			url = Uri.addParam(
				url,
				{
					moduleId: this.#complexDocumentType.moduleId,
					entity: this.#complexDocumentType.entity,
					documentType: this.#complexDocumentType.documentType,
				},
			);
		}

		if (this.#signedDocumentType)
		{
			url = Uri.addParam(url, { signedDocumentType: this.#signedDocumentType });
		}

		if (this.#complexDocumentId?.documentId)
		{
			url = Uri.addParam(url, { documentId: this.#complexDocumentId.documentId });
		}

		if (this.#signedDocumentId)
		{
			url = Uri.addParam(url, { signedDocumentId: this.#signedDocumentId });
		}

		if (Type.isStringFilled(this.#triggerType))
		{
			url = Uri.addParam(url, { triggerType: this.#triggerType });
		}

		return url;
	}

	#callAction(action: Action, formData: {} | FormData = {}, addData: {} = {}): Promise
	{
		return this.#callActionHelper.callAction(action, this.#callActionHelper.addData(addData, formData));
	}

	#showErrors(errors: ?[], targetWindow: ?Window)
	{
		const notifier = new ErrorNotifier(errors);
		const method = Type.isNil(targetWindow) ? 'show' : 'showToWindow';

		notifier[method](targetWindow);
	}
}
