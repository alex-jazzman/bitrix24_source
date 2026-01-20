import { Type, Loc } from 'main.core';

import { ACTION_TYPE, AJAX_REQUEST_TYPE } from '../constants';

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
		this.templateId = Number.parseInt(params.templateId, 10);
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: 'Integration.AiAgent.Template.start',
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

	handleSuccess(result: any): void
	{
		/*
		// temporary disabled
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_NOTIFICATION_TITLE'),
		});
		 */
	}
}
