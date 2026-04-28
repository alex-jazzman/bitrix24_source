import { Type, Loc } from 'main.core';
import { SetupTemplate, type SetupTemplateData } from 'bizproc.setup-template';

import { ACTION_TYPE, AJAX_REQUEST_TYPE, GRID_API_ACTION } from '../constants';
import { StartAgentResponse } from '../types';

import type {
	RestartActionParams,
	ActionConfig,
	RestartActionDataType,
} from '../types';

import { BaseAction } from './base-action';

export class RestartAction extends BaseAction
{
	templateId: ?number;

	static getActionId(): string
	{
		return ACTION_TYPE.RESTART;
	}

	async run(): void
	{
		await this.sendActionRequest();
	}

	setActionParams(params: RestartActionParams): void
	{
		super.setActionParams(params);

		this.templateId = Number.parseInt(params.templateId, 10);
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: GRID_API_ACTION.RESTART,
		};
	}

	getActionData(): RestartActionDataType
	{
		const data: RestartActionDataType = {
			...super.getActionData(),
		};

		if (!this.templateId || !Type.isNumber(this.templateId))
		{
			return data;
		}

		data.templateId = this.templateId;

		return data;
	}

	handleSuccess(result: StartAgentResponse): void
	{
		const setupTemplate: ?SetupTemplateData = result?.data?.setupTemplateData;
		if (setupTemplate && Type.isObjectLike(setupTemplate))
		{
			SetupTemplate.showSidePanel(setupTemplate);

			return;
		}

		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_NOTIFICATION_TITLE'),
		});
	}
}
