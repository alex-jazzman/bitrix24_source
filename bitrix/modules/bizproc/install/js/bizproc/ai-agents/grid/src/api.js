import { ajax, Type } from 'main.core';

import { GRID_API_ACTION } from './constants';
import type {
	GridApiAction,
	BaseAjaxResponse,
	CheckExistingRunsResponse,
	CopyAndStartActionResponse,
	ExistingRunsDecision,
	FetchAiAgentRowResponse,
} from './types';
import { AjaxErrorHandler } from './handler/ajax-error-handler';

const EXISTING_RUNS_CHECK_TIMEOUT = 8000;

const NO_WARNING_DECISION: ExistingRunsDecision = Object.freeze({ showWarning: false, systemCode: null });

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

const withTimeout = async (request: Promise, timeout: number): Promise => {
	let timeoutId = null;

	try
	{
		return await Promise.race([
			request,
			new Promise((resolve, reject) => {
				timeoutId = setTimeout(() => reject(new Error('timeout')), timeout);
			}),
		]);
	}
	finally
	{
		clearTimeout(timeoutId);
	}
};

/**
 * The only place where the raw pre-flight answer becomes a decision: "show" requires
 * showWarning === true together with a non-empty systemCode, anything else means "do not show".
 */
const toExistingRunsDecision = (response: ?CheckExistingRunsResponse): ExistingRunsDecision => {
	const data = response?.data;

	if (data?.showWarning !== true || !Type.isStringFilled(data?.systemCode))
	{
		return { ...NO_WARNING_DECISION };
	}

	return { showWarning: true, systemCode: data.systemCode };
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

	/**
	 * Pre-flight check before launching a system template (API-01). Deliberately bypasses post():
	 * a failed auxiliary check must not notify the user and must not block the launch, so every
	 * failure - network, contract or timeout - degrades to "do not show the warning".
	 *
	 * A positive answer spends the personal right to see the warning on the server, so the method
	 * must not be replayed "just in case".
	 */
	checkExistingRuns: async (templateId: number): Promise<ExistingRunsDecision> => {
		try
		{
			const response: CheckExistingRunsResponse = await withTimeout(
				ajax.runAction(`bizproc.v2.${GRID_API_ACTION.CHECK_EXISTING_RUNS}`, {
					method: 'POST',
					json: { templateId },
				}),
				EXISTING_RUNS_CHECK_TIMEOUT,
			);

			return toExistingRunsDecision(response);
		}
		catch
		{
			return { ...NO_WARNING_DECISION };
		}
	},
};

export {
	gridApi,
	post,
	withTimeout,
};
