import { BaseAction, type ActionConfig } from './base-action';
import { Loc } from 'main.core';
import { showActionReport } from './report-helper';

export class MassCalendarEnableAction extends BaseAction
{
	#mailboxIds: number[] = [];

	static getActionId(): string
	{
		return 'enableCalendar';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.mailboxconnecting.massSetCalendarIntegration',
		};
	}

	getActionData(): Object
	{
		return {
			mailboxIds: this.#mailboxIds,
			enabled: 'Y',
		};
	}

	setActionParams(params: Object): void
	{
		this.#mailboxIds = params.mailboxIds ?? [];
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
			success: 'MAIL_MAILBOX_PANEL_CALENDAR_ENABLE_SUCCESS',
			applied: 'MAIL_MAILBOX_PANEL_CALENDAR_ENABLE_REPORT_APPLIED',
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

export class MassCalendarDisableAction extends BaseAction
{
	#mailboxIds: number[] = [];

	static getActionId(): string
	{
		return 'disableCalendar';
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: 'controller',
			name: 'mail.mailboxconnecting.massSetCalendarIntegration',
		};
	}

	getActionData(): Object
	{
		return {
			mailboxIds: this.#mailboxIds,
			enabled: 'N',
		};
	}

	setActionParams(params: Object): void
	{
		this.#mailboxIds = params.mailboxIds ?? [];
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
			success: 'MAIL_MAILBOX_PANEL_CALENDAR_DISABLE_SUCCESS',
			applied: 'MAIL_MAILBOX_PANEL_CALENDAR_DISABLE_REPORT_APPLIED',
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
