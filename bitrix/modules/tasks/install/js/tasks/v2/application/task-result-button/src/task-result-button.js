import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { apiClient } from 'tasks.v2.lib.api-client';
import { Endpoint } from 'tasks.v2.const';

import { TaskResultButtonContent, type BeforeSendResult } from './task-result-button-content';

export type TaskResultButtonContext = {
	taskId: number,
};

type ButtonInstance = {
	handleBeforeSend: (text: string) => Promise<BeforeSendResult>,
};

export class TaskResultButton
{
	#application: ?VueCreateAppResult = null;
	#instance: ?ButtonInstance = null;
	#unmounted: boolean = false;

	async mounted(container: HTMLElement, context: TaskResultButtonContext): Promise<void>
	{
		if (!Number.isInteger(context.taskId) || context.taskId <= 0)
		{
			return;
		}

		const canAddResult = await this.#canAddResult(context.taskId);
		if (!canAddResult || this.#unmounted)
		{
			return;
		}

		const application = BitrixVue.createApp(TaskResultButtonContent, { context });
		application.mixin(locMixin);
		this.#instance = application.mount(container);

		this.#application = application;
	}

	async handleBeforeSend(text: string): Promise<BeforeSendResult>
	{
		if (!this.#instance)
		{
			return { handled: false, keepText: false };
		}

		return this.#instance.handleBeforeSend(text);
	}

	unmounted(): void
	{
		this.#unmounted = true;
		this.#application?.unmount();
		this.#application = null;
		this.#instance = null;
	}

	async #canAddResult(taskId: number): Promise<boolean>
	{
		try
		{
			const response = await apiClient.post(Endpoint.TaskAccessGet, { task: { id: taskId } });

			return Boolean(response?.rights?.createResult);
		}
		catch (error)
		{
			console.error('TaskResultButton: access check failed', error);

			return false;
		}
	}
}
