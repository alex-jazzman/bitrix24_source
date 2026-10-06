import { BaseAction, type ActionConfig } from './base-action';
import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { showActionReport } from './report-helper';

export class MassDisconnectAction extends BaseAction
{
	#mailboxIds: number[] = [];

	static getActionId(): string
	{
		return 'disconnectMailbox';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.mailboxconnecting.massDisconnectMailboxes',
		};
	}

	getActionData(): Object
	{
		return {
			mailboxIds: this.#mailboxIds,
		};
	}

	setActionParams(params: Object): void
	{
		this.#mailboxIds = params.mailboxIds ?? [];
	}

	async execute(): void
	{
		const count = this.#mailboxIds.length;
		if (count === 0)
		{
			return;
		}

		const confirmed = await new Promise((resolve) => {
			const messageBox = MessageBox.create({
				message: Loc.getMessagePlural('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TEXT', count, { '#COUNT#': count }),
				title: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TITLE'),
				okCaption: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_OK'),
				cancelCaption: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_CANCEL'),
				buttons: MessageBoxButtons.OK_CANCEL,
				onOk: () => {
					messageBox.close();
					resolve(true);
				},
				onCancel: () => {
					messageBox.close();
					resolve(false);
				},
			});

			messageBox.show();

			const popup = messageBox.getPopupWindow();
			if (popup)
			{
				const container = popup.getPopupContainer();
				if (container)
				{
					container.dataset.testid = 'mail-mailbox-bulk-confirm-dialog';
				}
			}
		});

		if (!confirmed)
		{
			return;
		}

		this.onBeforeActionRequest();
		await this.sendActionRequest();
	}

	onBeforeActionRequest(): void
	{
		this.grid.tableFade();
	}

	handleSuccess(result: Object): void
	{
		this.grid.reload(() => {
			this.grid.tableUnfade();
		});

		showActionReport(result?.data ?? {}, {
			success: 'MAIL_MAILBOX_PANEL_DISCONNECT_SUCCESS',
			applied: 'MAIL_MAILBOX_PANEL_DISCONNECT_REPORT_APPLIED',
			skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
			failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED',
		});
	}

	handleError(result: Object): void
	{
		const errors = result?.errors ?? [];
		const message = errors[0]?.message ?? Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');

		this.grid.tableUnfade();

		BX.UI.Notification.Center.notify({
			content: message,
			position: 'top-right',
			autoHideDelay: 5000,
		});
	}
}
