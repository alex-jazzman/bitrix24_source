import 'ui.notification';

import { BaseAction } from './base-action';

type ModeType = 'ajax' | 'class';

type ActionOptions = {
	mode?: ModeType;
	[key: string]: any;
};

type BaseActionConfig = {
	name: string;
	options?: ActionOptions;
};

type ControllerActionConfig = BaseActionConfig & {
	type: 'controller';
};

type ComponentActionConfig = BaseActionConfig & {
	type: 'component';
	component: string;
};

export type ActionConfig = ControllerActionConfig | ComponentActionConfig;

export abstract class AjaxAction extends BaseAction
{
	abstract getActionConfig(): ActionConfig;

	getActionData(): Record<string, unknown>
	{
		return {};
	}

	async execute(): Promise<void>
	{
		this.onBeforeActionRequest();
		await this.sendActionRequest();
		this.onAfterActionRequest();
	}

	onBeforeActionRequest(): void
	{}

	async sendActionRequest(): Promise<void>
	{
		try
		{
			const result = await new Promise((resolve, reject) => {
				const actionConfig = this.getActionConfig();
				const actionData = this.getActionData();
				const ajaxOptions = {
					...actionConfig.options,
					data: actionData,
				};

				let ajaxPromise = null;

				switch (actionConfig.type)
				{
					case 'controller':
						ajaxPromise = BX.ajax.runAction(actionConfig.name, ajaxOptions);

						break;

					case 'component':
						ajaxPromise = BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);

						break;

					default:
					{
						reject(new Error(`Unknown action type: ${actionConfig}`));

						return;
					}
				}

				ajaxPromise.then(resolve, reject);
			});

			this.handleSuccess(result);
		}
		catch (result)
		{
			this.handleError(result);
		}
	}

	onAfterActionRequest(): void
	{}

	handleSuccess(_result: unknown): void
	{}

	handleError(_result: unknown): void
	{}
}
