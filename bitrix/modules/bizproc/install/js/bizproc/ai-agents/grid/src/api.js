import { ajax } from 'main.core';

import { GRID_API_ACTION } from './constants';
import type {
	GridApiAction,
	BaseAjaxResponse,
	CopyAndStartActionResponse,
	FetchAiAgentRowResponse,
} from './types';
import { AjaxErrorHandler } from './handler/ajax-error-handler';

const post = async (action: GridApiAction, data: Object): Promise => {
	try
	{
		const response: BaseAjaxResponse = await ajax.runAction(`bizproc.v2.${action}`, {
			method: 'POST',
			json: data || {},
		});

		return response.data;
	}
	catch (error)
	{
		const ajaxErrorHandler = new AjaxErrorHandler();

		ajaxErrorHandler.handle(action, error);
	}

	return null;
};

const gridApi: { ... } = {
	startTemplate: (templateId: number): Promise<void> => {
		return post(GRID_API_ACTION.START_TEMPLATE, { templateId });
	},
	copyAndStartTemplate: (templateId: number): Promise<CopyAndStartActionResponse> => {
		return post(GRID_API_ACTION.COPY_AND_START_TEMPLATE, { templateId });
	},
	fetchRow: (templateId: number): Promise<FetchAiAgentRowResponse> => {
		return post(GRID_API_ACTION.FETCH_ROW, { templateId });
	},
};

export {
	gridApi,
	post,
};
