import { Loc } from 'main.core';

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

	isSingleSelection(): boolean
	{
		return this.getSelectedIds()?.length === 1;
	}

	getActionData(): DeleteActionDataType
	{
		const data = {
			...super.getActionData(),
		};

		data.agentIds = this.getSelectedIds();

		return data;
	}

	getConfirmationTitle(): string
	{
		return this.isSingleSelection()
			? super.getConfirmationTitle()
			: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_TITLE');
	}

	getConfirmationMessageText(): string
	{
		return this.isSingleSelection()
			? super.getConfirmationMessageText()
			: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_MESSAGE');
	}
}
