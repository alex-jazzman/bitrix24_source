import type { Store } from 'ui.vue3.vuex';

import { Runtime, ajax } from 'main.core';
import { Core } from 'booking.core';
import { Model } from 'booking.const';

const ACTION_COPY_AND_START = 'bizproc.v2.Integration.AiAgent.Template.copyAndStart';
const ACTION_START = 'bizproc.v2.Integration.AiAgent.Template.start';

class AiAgentLauncherService
{
	#isPullSubscribed: boolean = false;

	async launch(): Promise<void>
	{
		const aiAgent = this.$store.getters[`${Model.AiAgent}/aiAgent`];
		if (!aiAgent?.templateId)
		{
			return;
		}

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

		const actionName = aiAgent.action === 'copyAndStart'
			? ACTION_COPY_AND_START
			: ACTION_START;

		const response = await ajax.runAction(actionName, { json: { templateId: aiAgent.templateId } });

		if (aiAgent.action === 'copyAndStart' && response?.data?.id)
		{
			this.$store.dispatch(`${Model.AiAgent}/setAiAgent`, {
				templateId: response.data.id,
				action: 'start',
				error: null,
			});
		}
	}

	async launchInBackground(): Promise<void>
	{
		const aiAgent = this.$store.getters[`${Model.AiAgent}/aiAgent`];
		if (!aiAgent?.templateId || aiAgent.action !== 'copyAndStart')
		{
			return;
		}

		await ajax.runAction(
			ACTION_COPY_AND_START,
			{ json: { templateId: aiAgent.templateId } },
		);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const aiAgentLauncherService = new AiAgentLauncherService();
