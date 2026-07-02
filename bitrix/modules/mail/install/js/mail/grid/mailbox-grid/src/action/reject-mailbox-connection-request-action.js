import { BaseAction, type ActionConfig } from './base-action';
import { Loc } from 'main.core';

export class RejectMailboxConnectionRequestAction extends BaseAction
{
	requestId: number;

	static getActionId(): string
	{
		return 'rejectMailboxConnectionRequestAction';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.api.mailboxconnectionrequest.rejectRequest',
		};
	}

	getActionData(): Object
	{
		return {
			requestId: this.requestId,
		};
	}

	setActionParams(params: Object): void
	{
		this.requestId = params.requestId;
	}

	onBeforeActionRequest()
	{
		this.grid.tableFade();
	}

	handleSuccess(result: Result): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECTED'),
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	handleError(result: Result): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECT_ERROR'),
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	onAfterActionRequest(): void
	{
		this.grid.tableUnfade();
	}
}
