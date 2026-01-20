import { ajax } from 'main.core';
import { CopyAndStartActionResponse, FetchAiAgentRowResponse } from './types';

const post = async (action: string, data: Object): Promise => {
	const response = await ajax.runAction(`bizproc.v2.${action}`, {
		method: 'POST',
		json: data || {},
	});

	if (response.status === 'success')
	{
		return response.data;
	}

	return null;
};

const gridApi: { ... } = {
	startTemplate: (templateId: number): Promise<void> => {
		return post('Integration.AiAgent.Template.start', { templateId });
	},
	copyAndStartTemplate: (templateId: number): Promise<CopyAndStartActionResponse> => {
		return post('Integration.AiAgent.Template.copyAndStart', { templateId });
	},
	fetchRow: (templateId: number): Promise<FetchAiAgentRowResponse> => {
		return post('Integration.AiAgent.Template.fetchRow', { templateId });
	},
};

export {
	gridApi,
	post,
};
