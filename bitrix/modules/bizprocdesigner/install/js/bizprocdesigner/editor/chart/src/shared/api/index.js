import { ajax } from 'main.core';
import type { DiagramData, GetNodeSettingsControlsData, UpdateTemplateData, EntitySelectorItem } from '../types';

const BIZPROC_DOCUMENT_ENTITY_ID = 'bizproc-document';
const USER_ENTITY_ID = 'user';

// Typed transport error carrying the action-controller response payload so
// callers can branch on errors[].code and still read data/status/errors.
class ApiError extends Error
{
	errors: Array<{ code?: string, message?: string }>;
	code: ?string;
	status: ?string;
	data: mixed;

	constructor(response: Object)
	{
		const errors = Array.isArray(response?.errors) ? response.errors : [];
		super(errors[0]?.message ?? 'Request failed');
		this.name = 'ApiError';
		this.errors = errors;
		this.code = errors[0]?.code ?? null;
		this.status = response?.status ?? 'error';
		this.data = response?.data ?? null;
	}
}

// Draft saves run in a queue where the next one starts only after the previous request has
// settled, so a request that never answers would stop every later save. Seconds, tunable.
const DRAFT_SAVE_TIMEOUT_SEC = 30;

// onRequestStart receives the XHR handle, so a caller whose request became
// stale can abort it instead of waiting for a response it will throw away.
// timeoutSec 0 keeps the browser default (effectively no limit).
type PostOptions = {
	onRequestStart?: (xhr: XMLHttpRequest) => void,
	timeoutSec?: number,
};

const post = async (action: string, data: Object, options: PostOptions = {}): Promise => {
	let response;
	try
	{
		response = await ajax.runAction(`bizprocdesigner.v2.${action}`, {
			method: 'POST',
			json: data || {},
			timeout: options.timeoutSec ?? 0,
			onrequeststart: options.onRequestStart,
		});
	}
	catch (error)
	{
		// runAction rejects on any non-success response (including network
		// errors) with a response-like object holding errors[].
		throw new ApiError(error);
	}

	if (response?.status === 'success')
	{
		return response.data;
	}

	throw new ApiError(response);
};

const editorAPI: {...} = {
	getCatalogData: (): Promise<?Object> => {
		return post('Catalog.get');
	},
	getDiagramData: async (
		params: {
			templateId: Number,
			documentType: ?Array,
			startTrigger: ?string,
		},
	): Promise<?Object> => {
		return post('Diagram.get', params);
	},
	updateTemplateData: (data: UpdateTemplateData): Promise<?Object> => {
		return post('Diagram.updateTemplate', data);
	},
	publicDiagramData: (data: DiagramData): Promise<?Object> => {
		return post('Diagram.publicate', data);
	},
	publicDiagramDataDraft: (data: DiagramData): Promise<?Object> => {
		return post('Diagram.publicateDraft', data, { timeoutSec: DRAFT_SAVE_TIMEOUT_SEC });
	},
	getLastRunValues: async (params: { templateId: number }): Promise<Object> => {
		try
		{
			const data = await post('Diagram.getLastRunValues', params);

			return data?.values ?? {};
		}
		catch
		{
			// Missing values are a regular state, so a failed request must not
			// break the data panel: it just stays without values.
			return {};
		}
	},
	getTemplateVersions: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.getVersions', params);
	},
	getTemplateVersion: (params: { templateId: number, versionId: number }): Promise<?Object> => {
		return post('Diagram.getVersion', params);
	},
	restoreTemplateVersion: (params: { templateId: number, versionId: number }): Promise<?Object> => {
		return post('Diagram.restoreVersion', params);
	},
	undoTemplateRestore: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.undoRestore', params);
	},
	discardTemplateRestoreBackup: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.discardRestoreBackup', params);
	},
	fetchUserNames: async (userIds: Array<number>): Promise<{ [string]: string }> => {
		if (userIds.length === 0)
		{
			return {};
		}

		try
		{
			const response = await ajax.runAction('ui.entityselector.load', {
				json: {
					dialog: {
						entities: [
							{
								id: USER_ENTITY_ID,
								dynamicLoad: true,
								// Only the requested authors are needed: without these the provider also
								// preloads the recent items and the first 50 users of the portal.
								fillRecentItems: false,
								options: { fillDialog: false },
							},
						],
						preselectedItems: userIds.map((userId) => [USER_ENTITY_ID, userId]),
					},
				},
			});

			const items = response?.data?.dialog?.items ?? [];

			return Object.fromEntries(
				items
					.filter((item) => item?.entityId === USER_ENTITY_ID)
					.map((item) => [String(item.id), item.title?.text ?? item.title ?? ''])
					.filter(([, name]) => name !== ''),
			);
		}
		catch
		{
			// A name is decoration over authorId: without it the row shows "no data" and stays usable.
			return {};
		}
	},
	getNodeSettingsControls: (data: GetNodeSettingsControlsData, options: PostOptions = {}): Promise<?Object> => {
		return post('Activity.getSettingsControls', data, options);
	},
	getNodeFilterMetadata: (
		data: {
			activityType: string,
			documentType: Array<string>,
			onlyDynamicEntities: boolean,
			includeRelatedEntityTypes: boolean,
		},
	): Promise<?Object> => {
		return post('Activity.getNodeFilterMetadata', data);
	},
	saveNodeSettings: (data: Object): Promise<?Object> => {
		return post('Activity.SaveSettings', data);
	},
	fetchDocumentFields: async (documentType: string | Array<string>): Promise<Array<EntitySelectorItem>> => {
		const key = Array.isArray(documentType) ? documentType.join(':') : String(documentType);
		const response = await ajax.runAction('ui.entityselector.getChildren', {
			json: {
				parentItem: {
					id: `document-fields-${key}`,
					entityId: BIZPROC_DOCUMENT_ENTITY_ID,
					entityType: 'document',
					customData: {
						document: documentType,
						idTemplate: '#FIELD#',
					},
				},
				dialog: {
					entities: [
						{
							id: BIZPROC_DOCUMENT_ENTITY_ID,
							dynamicLoad: true,
						},
					],
				},
			},
		});

		return response?.data?.dialog?.items ?? [];
	},
};

export {
	editorAPI,
	post,
	ApiError,
};
