import { ajax } from 'main.core';
import type { DebugSessionSchema, DebugTraceSchema } from './types';

const post = async (action: string, data: Object): Promise<Object | null> =>
{
	const response = await ajax.runAction(`bizproc.v2.${action}`, {
		data,
	});

	if (response.status === 'success')
	{
		return response.data;
	}

	return null;
};

export type LoadSessionsPayload = {
	templateId: number,
}

export type LoadTracesPayload = {
	debugSessionId: number,
	page?: number,
	size?: number,
}

export type DebugSessionsResponse = Array<DebugSessionSchema>;
export type DebugTracesResponse = Array<DebugTraceSchema>;

export const debugBarApi = Object.freeze({
	loadSessions: async (payload: LoadSessionsPayload): Promise<DebugSessionsResponse | null> =>
	{
		const data = await post('DebugSession.getList', { templateId: payload.templateId });

		if (!data)
		{
			return null;
		}

		return Array.isArray(data) ? data : [];
	},

	loadTraces: async (payload: LoadTracesPayload): Promise<DebugTracesResponse | null> =>
	{
		const data = await post('DebugTrace.getBySessionId', {
			debugSessionId: payload.debugSessionId,
			page: payload.page ?? 1,
		});

		if (!data)
		{
			return null;
		}

		return Array.isArray(data) ? data : [];
	},

	deleteAllSessions: async (): Promise<boolean> =>
	{
		const data = await post('DebugSession.deleteAll', {});

		return data !== null;
	},

	enableDebug: async (templateId: number): Promise<boolean> =>
	{
		const data = await post('Debug.enableForTemplate', {
			templateId,
		});

		return data !== null;
	},

	disableDebug: async (templateId: number): Promise<boolean> =>
	{
		const data = await post('Debug.disable', {
			templateId,
		});

		return data !== null;
	},

	getDebugStatus: async (templateId: number): Promise<{ enabled: boolean } | null> =>
	{
		const response = await ajax.runAction('bizproc.v2.Debug.getStatus', {
			data: { templateId },
		});

		if (response.status === 'success' && response.data)
		{
			return {
				enabled: response.data.enabled === true || response.data.enabled === 'Y',
			};
		}

		return { enabled: false };
	},
});
