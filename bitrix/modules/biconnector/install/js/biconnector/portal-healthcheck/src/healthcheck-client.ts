import { ajax } from 'main.core';

import { HealthcheckRequestError } from './healthcheck-request-error';
import { type HealthcheckSnapshot } from './types';

type ActionResponse = { data: HealthcheckSnapshot };

async function runAction(action: string): Promise<HealthcheckSnapshot>
{
	try
	{
		const response = await ajax.runAction(action) as ActionResponse;

		return response.data;
	}
	catch (reason)
	{
		throw HealthcheckRequestError.from(reason);
	}
}

export class HealthcheckClient
{
	async get(): Promise<HealthcheckSnapshot>
	{
		return runAction('biconnector.portalhealthcheck.get');
	}

	async start(): Promise<HealthcheckSnapshot>
	{
		return runAction('biconnector.portalhealthcheck.start');
	}
}
