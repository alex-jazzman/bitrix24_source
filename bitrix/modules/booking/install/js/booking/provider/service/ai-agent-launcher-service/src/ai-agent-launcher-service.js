import { Runtime, ajax } from 'main.core';

class AiAgentLauncherService
{
	#isPullSubscribed: boolean = false;

	async launch(): Promise<void>
	{
		try
		{
			const { SetupTemplate } = await Runtime.loadExtension('bizproc.setup-template');

			if (!this.#isPullSubscribed)
			{
				SetupTemplate.subscribeOnPull();
				this.#isPullSubscribed = true;
			}
		}
		catch (e)
		{
			console.error('bizproc.setup-template extension is not available', e);

			return;
		}

		await ajax.runAction('booking.api_v1.AiAgent.launch', { json: {} });
	}
}

export const aiAgentLauncherService = new AiAgentLauncherService();
