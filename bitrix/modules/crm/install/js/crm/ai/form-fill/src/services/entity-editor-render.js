import { addCustomEvent, ajax, removeCustomEvent, Runtime, Type } from 'main.core';

const EDITOR_DEPLOYED_EVENT = 'BX.Crm.EntityEditor:onUserFieldsDeployed';

// Entity types whose details component still keeps its own ajax.php with PREPARE_EDITOR_HTML.
// Every other Factory based type (quote, smart invoice, smart document, smart process) is rendered
// by the universal crm.api.item.getEditor controller.
const DETAILS_COMPONENT_SERVICE_URLS: Map<string, string> = new Map([
	['LEAD', '/bitrix/components/bitrix/crm.lead.details/ajax.php'],
	['DEAL', '/bitrix/components/bitrix/crm.deal.details/ajax.php'],
	['CONTACT', '/bitrix/components/bitrix/crm.contact.details/ajax.php'],
	['COMPANY', '/bitrix/components/bitrix/crm.company.details/ajax.php'],
]);

/**
 * A details component answers a rejected request (access denied, entity not found) with a json body
 * instead of the editor html, keeping the http status 200. Such a response carries no editor scripts,
 * so it never deploys the editor and must be treated as a failure.
 */
const getDetailsComponentError = (response: string): ?string => {
	if (!Type.isStringFilled(response))
	{
		return 'Empty response of the details component';
	}

	let payload = null;
	try
	{
		payload = JSON.parse(response);
	}
	catch
	{
		return null; // the editor html is not json
	}

	return Type.isPlainObject(payload) && Type.isStringFilled(payload.ERROR) ? payload.ERROR : null;
};

export class EntityEditorRender
{
	#params: EntityEditorRenderParams;
	constructor(params: EntityEditorRenderParams)
	{
		this.#params = params;
	}

	async render(): Promise
	{
		let onDeployed = null;

		// subscribe before the request: the editor may deploy while #fetchEntityEditor is awaited
		const deployed = new Promise((resolve) => {
			onDeployed = (editor) => {
				if (editor.getId() !== this.#params.domContainerId)
				{
					return;
				}
				removeCustomEvent(window, EDITOR_DEPLOYED_EVENT, onDeployed);
				resolve(editor);
			};
			addCustomEvent(window, EDITOR_DEPLOYED_EVENT, onDeployed);
		});

		try
		{
			await this.#fetchEntityEditor(this.#params);
		}
		catch (error)
		{
			removeCustomEvent(window, EDITOR_DEPLOYED_EVENT, onDeployed);

			throw error;
		}

		return deployed;
	}

	async #fetchEntityEditor(params: EntityEditorRenderParams): Promise
	{
		const serviceUrl = DETAILS_COMPONENT_SERVICE_URLS.get(params.entityTypeName);

		return serviceUrl === undefined
			? this.#requestEditorByItemController(params)
			: this.#requestEditorByDetailsComponent(serviceUrl, params);
	}

	async #requestEditorByDetailsComponent(serviceUrl: string, params: EntityEditorRenderParams): Promise
	{
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		const eeUrl = `${serviceUrl}?sessid=${BX.bitrix_sessid()}`;

		const data = {
			ACTION: 'PREPARE_EDITOR_HTML',
			ACTION_ENTITY_TYPE_NAME: params.entityTypeName,
			ACTION_ENTITY_ID: params.entityId,
			GUID: params.domContainerId,
			CONFIG_ID: params.configId,
			FORCE_DEFAULT_CONFIG: 'N',
			FORCE_DEFAULT_OPTIONS: 'Y',
			IS_EMBEDDED: 'Y',
			ENABLE_CONFIG_SCOPE_TOGGLE: 'N',
			ENABLE_CONFIGURATION_UPDATE: 'N',
			ENABLE_REQUIRED_USER_FIELD_CHECK: 'N',
			ENABLE_FIELDS_CONTEXT_MENU: 'N',
			CONTEXT: {},
			READ_ONLY: 'Y',
			MODULE_ID: 'crm',
		};

		// ajax.post has no failure branch at all, and a silently lost request leaves render()
		// waiting for the deploy event forever
		let response = null;
		try
		{
			response = await ajax.promise({
				method: 'POST',
				dataType: 'html',
				url: eeUrl,
				data: ajax.prepareData(data),
			});
		}
		catch (failure)
		{
			throw new Error(`Entity editor request failed: ${failure?.reason ?? 'unknown reason'}`);
		}

		const error = getDetailsComponentError(response);
		if (error !== null)
		{
			throw new Error(`Entity editor request rejected: ${error}`);
		}
	}

	async #requestEditorByItemController(params: EntityEditorRenderParams): Promise
	{
		const response = await ajax.runAction('crm.api.item.getEditor', {
			data: {
				entityTypeId: params.entityTypeId,
				id: params.entityId,
				categoryId: params.categoryId,
				guid: params.domContainerId,
				configId: params.configId,
				params: {
					forceDefaultConfig: 'N',
					enableSingleSectionCombining: 'N',
					IS_EMBEDDED: 'Y',
					READ_ONLY: 'Y',
					ENABLE_CONFIG_SCOPE_TOGGLE: 'N',
					ENABLE_CONFIGURATION_UPDATE: 'N',
					ENABLE_REQUIRED_USER_FIELD_CHECK: 'N',
					ENABLE_FIELDS_CONTEXT_MENU: 'N',
					ENABLE_VISIBILITY_POLICY: 'N',
				},
			},
		});

		// the editor markup is built by its own scripts inside the already rendered container,
		// so only the scripts of the response are deployed
		await Runtime.html(null, response.data.html);
	}
}

export interface EntityEditorRenderParams {
	entityTypeName: string;
	entityTypeId: number;
	entityId: number;
	categoryId: ?number;
	configId: string;
	domContainerId: string;
}
