import { Loc } from 'main.core';

import { AjaxAction, ActionConfig } from './ajax-action';

export class ResendAction extends AjaxAction
{
	mailboxId!: number;

	static getActionId(): string
	{
		return 'resendRequestAction';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.mailboxconnecting.resendPasswordlessRequest',
		};
	}

	getActionData(): { mailboxId: number }
	{
		return {
			mailboxId: this.mailboxId,
		};
	}

	setActionParams(params: { mailboxId: number }): void
	{
		this.mailboxId = params.mailboxId;
	}

	onBeforeActionRequest()
	{
		this.grid?.tableFade();
	}

	handleSuccess(_result: unknown): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_RESEND_SUCCESS'),
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	handleError(_result: unknown): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_RESEND_ERROR'),
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	onAfterActionRequest(): void
	{
		this.grid?.reload(() => {
			this.grid?.tableUnfade();
		});
	}
}
