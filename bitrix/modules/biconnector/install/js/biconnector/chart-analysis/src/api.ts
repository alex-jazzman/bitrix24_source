import { ajax, Loc, Type } from 'main.core';

import { type BxCard, type BxPreviousStatus } from './types';

const LAUNCH_ACTION = 'biconnector.chartanalysis.launch';
const PAYLOAD_VERSION = 4;

export const NETWORK_ERROR = 'NETWORK_ERROR';
export const SUBSCRIPTION_REQUIRED_ERROR = 'CHART_ANALYSIS_SUBSCRIPTION_REQUIRED';
export const RATE_LIMITED_ERROR = 'CHART_ANALYSIS_RATE_LIMITED';

export type LaunchRequest = {
	dashboardId: number;
	requestId: string;
	card: BxCard;
	previousStatus: BxPreviousStatus;
	data: object | null;
	// The chat of the previous analysis to continue; the server may answer with another one.
	chatId?: number;
};

export type LaunchResult = {
	chatId: number;
	// Only a message of this bot answers the analysis; 0 when the server did not name it.
	botId: number;
};

export type LaunchError = {
	code: string;
	message: string;
	promoterCode?: string;
};

type ActionError = {
	code?: unknown;
	message?: unknown;
	customData?: { promoterCode?: unknown } | null;
};

type LaunchActionData = {
	dashboardId: number;
	payload: string;
	chatId?: number;
};

type RunAction = (
	action: string,
	config: { data: LaunchActionData },
) => Promise<{ data?: { chatId?: unknown, botId?: unknown } }>;

export class ChartAnalysisApi
{
	#runAction: RunAction;

	constructor(runAction: RunAction = (...args) => ajax.runAction(...args))
	{
		this.#runAction = runAction;
	}

	async launch(request: LaunchRequest): Promise<LaunchResult>
	{
		const { dashboardId, requestId, card, previousStatus, data, chatId: previousChatId } = request;
		const payload = JSON.stringify({ version: PAYLOAD_VERSION, requestId, card, previousStatus, data });
		const actionData: LaunchActionData = { dashboardId, payload };
		if (Type.isInteger(previousChatId) && previousChatId > 0)
		{
			actionData.chatId = previousChatId;
		}

		let response = null;
		try
		{
			response = await this.#runAction(LAUNCH_ACTION, { data: actionData });
		}
		catch (failure)
		{
			throw this.#toLaunchError(failure);
		}

		const chatId = Number(response?.data?.chatId);
		if (!Number.isInteger(chatId) || chatId <= 0)
		{
			throw this.#networkError();
		}

		const botId = Number(response?.data?.botId);

		return { chatId, botId: Number.isInteger(botId) && botId > 0 ? botId : 0 };
	}

	#toLaunchError(failure: unknown): LaunchError
	{
		const error: ActionError | undefined = (failure as { errors?: ActionError[] } | null)?.errors?.[0];
		if (!Type.isStringFilled(error?.code) || error.code === NETWORK_ERROR)
		{
			return this.#networkError();
		}

		const launchError: LaunchError = {
			code: error.code,
			message: Type.isString(error.message) ? error.message : '',
		};

		const promoterCode = error.customData?.promoterCode;
		if (Type.isStringFilled(promoterCode))
		{
			launchError.promoterCode = promoterCode;
		}

		return launchError;
	}

	#networkError(): LaunchError
	{
		return {
			code: NETWORK_ERROR,
			message: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_NETWORK_ERROR') ?? '',
		};
	}
}

export const api = new ChartAnalysisApi();
