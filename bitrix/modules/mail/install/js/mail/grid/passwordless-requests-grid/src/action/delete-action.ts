import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { AjaxAction, ActionConfig } from './ajax-action';

export class DeleteAction extends AjaxAction
{
	mailboxId!: number;

	static getActionId(): string
	{
		return 'deleteRequestAction';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.mailboxconnecting.deletePasswordlessRequest',
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

	async execute(): Promise<void>
	{
		MessageBox.show({
			title: Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_CONFIRM_TITLE'),
			buttons: MessageBoxButtons.OK_CANCEL,
			useAirDesign: true,
			onOk: (messageBox: { close(): void }) => {
				messageBox.close();
				this.onBeforeActionRequest();
				this.sendActionRequest().then(() => {
					this.onAfterActionRequest();
				});
			},
			onCancel: (messageBox: { close(): void }) => {
				messageBox.close();
			},
		});
	}

	onBeforeActionRequest()
	{
		this.grid?.tableFade();
	}

	handleSuccess(_result: unknown): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_SUCCESS'),
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	handleError(_result: unknown): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('MAIL_PASSWORDLESS_GRID_ACTION_DELETE_ERROR'),
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
