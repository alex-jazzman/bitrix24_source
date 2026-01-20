import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { ACTION_TYPE } from '../../constants';
import type { DeleteActionDataType } from '../../types';
import { DeleteAction } from '../delete-action';

export class GroupDeleteAction extends DeleteAction
{
	static getActionId(): string
	{
		return ACTION_TYPE.GROUP_DELETE;
	}

	getSelectedIds(): string[]
	{
		return this.grid.getRows().getSelectedIds();
	}

	getActionData(): DeleteActionDataType
	{
		const data = {
			...super.getActionData(),
		};

		data.agentIds = this.getSelectedIds();

		return data;
	}

	getConfirmationPopup(): MessageBox
	{
		if (this.getSelectedIds()?.length === 1)
		{
			return super.getConfirmationPopup();
		}

		const message = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_MESSAGE');
		const title = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_TITLE');
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
