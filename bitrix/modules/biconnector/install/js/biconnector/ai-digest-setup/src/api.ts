import { ajax } from 'main.core';

import { type DigestSetupResult, type ScreenState } from './types';

const PREPARE_DIGEST_SETUP_ACTION = 'biconnector.dashboard.prepareDigestSetup';

type RequestData = {
	dashboardId?: number,
	screenState?: ScreenState,
};

type RunAction = (
	action: string,
	config: { data: RequestData },
) => Promise<{ data: DigestSetupResult }>;

export class Api
{
	#runAction: RunAction;

	constructor(runAction: RunAction = (...args) => ajax.runAction(...args))
	{
		this.#runAction = runAction;
	}

	async prepareDigestSetup(dashboardId?: number, screenState?: ScreenState | null): Promise<DigestSetupResult>
	{
		const response = await this.#runAction(PREPARE_DIGEST_SETUP_ACTION, {
			data: this.#buildRequestData(dashboardId, screenState),
		});

		return response.data;
	}

	#buildRequestData(dashboardId?: number, screenState?: ScreenState | null): RequestData
	{
		if (dashboardId === undefined)
		{
			return {};
		}

		return screenState ? { dashboardId, screenState } : { dashboardId };
	}
}

export const api = new Api();
