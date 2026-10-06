import { Runtime, ajax } from 'main.core';

import { AiAgentErrorCode } from './error-codes';

export type AiAgentLaunchError = {
	message: string,
	code: string,
	customData: Object,
};

export type AiAgentLaunchResult = {
	success: boolean,
	errors: AiAgentLaunchError[],
};

class AiAgentLauncherService
{
	#isPullSubscribed: boolean = false;

	async launch(): Promise<AiAgentLaunchResult>
	{
		try
		{
			await this.#setupTemplate();
		}
		catch (e)
		{
			console.error('bizproc.setup-template extension is not available', e);

			return {
				success: false,
				errors: [
					{
						message: 'bizproc.setup-template extension is not available',
						code: '',
						customData: {},
					},
				],
			};
		}

		try
		{
			await ajax.runAction('booking.api_v1.AiAgent.launch', { json: {} });
		}
		catch (response)
		{
			return {
				success: false,
				errors: response?.errors ?? [],
			};
		}

		return {
			success: true,
			errors: [],
		};
	}

	async #setupTemplate(): Promise<void>
	{
		const { SetupTemplate } = await Runtime.loadExtension('bizproc.setup-template');

		if (!this.#isPullSubscribed)
		{
			SetupTemplate.subscribeOnPull();
			this.#isPullSubscribed = true;
		}
	}
}

export { AiAgentErrorCode };

export const aiAgentLauncherService = new AiAgentLauncherService();
