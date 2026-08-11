import { Loc, Tag, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { ACTION_TYPE, AJAX_REQUEST_TYPE, GRID_API_ACTION } from '../constants';

import type {
	DeleteActionParams,
	ActionConfig,
	DeleteActionDataType,
} from '../types';

import { BaseAction } from './base-action';

export class DeleteAction extends BaseAction
{
	templateId: number;
	deleteChatbotsCheckbox: ?HTMLInputElement = null;

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
		super.setActionParams(params);

		this.templateId = Number.parseInt(params.templateId, 10);
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: GRID_API_ACTION.DELETE,
		};
	}

	getActionData(): DeleteActionDataType
	{
		const data: DeleteActionDataType = {
			...super.getActionData(),
			deleteChatbots: this.isDeleteChatbotsChecked(),
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
		const buttons = MessageBoxButtons.OK_CANCEL;
		const okCaption = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_OK');
		const cancelCaption = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_CANCEL');

		const message = this.buildConfirmationMessage();

		return new MessageBox({
			message,
			title: this.getConfirmationTitle(),
			buttons,
			okCaption,
			onCancel: (messageBox) => {
				messageBox.close();
			},
			cancelCaption,
		});
	}

	getConfirmationTitle(): string
	{
		return Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_TITLE');
	}

	getConfirmationMessageText(): string
	{
		return Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_MESSAGE');
	}

	buildConfirmationMessage(): HTMLElement
	{
		const messageText = this.getConfirmationMessageText();
		const checkboxLabel = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_DELETE_CHATBOTS_LABEL');

		const messageNode = Tag.render`
			<div class="bizproc-ai-agents__delete-popup">
				<div class="bizproc-ai-agents__delete-popup-text">${messageText}</div>
				<label class="ui-ctl ui-ctl-checkbox bizproc-ai-agents__delete-popup-checkbox">
					<input type="checkbox" class="ui-ctl-element">
					<div class="ui-ctl-label-text">${checkboxLabel}</div>
				</label>
			</div>
		`;

		this.deleteChatbotsCheckbox = messageNode.querySelector('input[type="checkbox"]');

		return messageNode;
	}

	isDeleteChatbotsChecked(): boolean
	{
		return Boolean(this.deleteChatbotsCheckbox?.checked);
	}
}
