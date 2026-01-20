import { ajax } from 'main.core';
import type { DiagramData, GetNodeSettingsControlsData, UpdateTemplateData } from '../types';

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
	saveNodeSettings: (data: Object): Promise<?Object> => {
		return post('Activity.SaveSettings', data);
	},
};

export {
	editorAPI,
	post,
};
