import { BaseAction } from './base-action';
import { Messenger } from 'im.public';

export class CreateChatAction extends BaseAction
{
	static getActionId(): string
	{
		return 'createChat';
	}

	getAjaxMethod(): string
	{
		return 'intranet.v2.UserList.createChat';
	}

	handleSuccess(result)
	{
		this.grid.tableUnfade();
		const chatId = result.data;
		Messenger.openChat(`chat${chatId}`);
		this.unselectRows(this.grid);
	}
}
