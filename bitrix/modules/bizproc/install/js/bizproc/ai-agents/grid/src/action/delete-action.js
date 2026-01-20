import { Loc, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { ACTION_TYPE, AJAX_REQUEST_TYPE } from '../constants';

import type {
	DeleteActionParams,
	ActionConfig,
	DeleteActionDataType,
} from '../types';

import { BaseAction } from './base-action';

export class DeleteAction extends BaseAction
{
	templateId: number;

	static getActionId(): string
	{
		return ACTION_TYPE.DELETE;
	}

	async run(): void
	{
		await this.sendActionRequest();
	}

	setActionParams(params: DeleteActionParams): void
	{
		this.templateId = Number.parseInt(params.templateId, 10);
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: 'Integration.AiAgent.Template.delete',
		};
	}

	getActionData(): DeleteActionDataType
	{
		const data: DeleteActionDataType = {
			...super.getActionData(),
		};

		if (!this.templateId || !Type.isNumber(this.templateId))
		{
			return data;
		}

		data.agentIds = [this.templateId];

		return data;
	}

	getConfirmationPopup(): MessageBox
	{
		const message = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_MESSAGE');
		const title = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_TITLE');
		const buttons = MessageBoxButtons.OK_CANCEL;
		const okCaption = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_OK');
		const cancelCaption = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_CANCEL');

		return new MessageBox({
			message,
			title,
			buttons,
			okCaption,
			onCancel: (messageBox) => {
				messageBox.close();
			},
			cancelCaption,
		});
	}
}
