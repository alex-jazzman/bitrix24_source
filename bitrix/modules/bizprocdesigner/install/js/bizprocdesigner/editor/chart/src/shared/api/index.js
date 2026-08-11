import { ajax } from 'main.core';
import type { DiagramData, GetNodeSettingsControlsData, UpdateTemplateData, EntitySelectorItem } from '../types';

const BIZPROC_DOCUMENT_ENTITY_ID = 'bizproc-document';

const post = async (action: string, data: Object): Promise => {
	const response = await ajax.runAction(`bizprocdesigner.v2.${action}`, {
		method: 'POST',
		json: data || {},
	});

	if (response.status === 'success')
	{
		return response.data;
	}

	return null;
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
		return post('Diagram.publicateDraft', data);
	},
	getNodeSettingsControls: (data: GetNodeSettingsControlsData): Promise<?Object> => {
		return post('Activity.getSettingsControls', data);
	},
	getNodeFilterMetadata: (
		data: {
			activityType: string,
			documentType: Array<string>,
			onlyDynamicEntities: boolean,
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
};
