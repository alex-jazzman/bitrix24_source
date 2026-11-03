import { BaseAction, type ActionConfig } from './base-action';
import { Loc } from 'main.core';
import { getMigrationState, type MigrationState } from 'mail.migration-state';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { showActionReport } from './report-helper';

type MailboxMigrationState = {
	state: MigrationState,
	active: boolean,
};

export class MassDisconnectAction extends BaseAction
{
	#mailboxIds: number[] = [];
	#executing: boolean = false;

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
		if (!this.#executing)
		{
			this.#mailboxIds = [...(params.mailboxIds ?? [])];
		}
	}

	async execute(): void
	{
		if (this.#executing || this.#mailboxIds.length === 0)
		{
			return;
		}

		this.#executing = true;
		const unsubscribers: Array<() => void> = [];
		try
		{
			const states = this.#mailboxIds.map((mailboxId): MailboxMigrationState => {
				const state = getMigrationState(mailboxId);

				return { state, active: state.isActive() };
			});
			const confirmed = await this.#confirm(states, unsubscribers);
			if (!confirmed || states.some(({ state, active }) => !state.isInitialized() || active || state.isActive()))
			{
				return;
			}

			this.onBeforeActionRequest();
			await this.sendActionRequest();
		}
		finally
		{
			unsubscribers.forEach((unsubscribe) => unsubscribe());
			this.#executing = false;
		}
	}

	#confirm(states: MailboxMigrationState[], unsubscribers: Array<() => void>): Promise<boolean>
	{
		const count = this.#mailboxIds.length;
		const confirmationMessage = Loc.getMessagePlural(
			'MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TEXT',
			count,
			{ '#COUNT#': count },
		);

		return new Promise((resolve) => {
			let closed = false;
			const finish = (confirmed: boolean) => {
				if (!closed)
				{
					closed = true;
					resolve(confirmed);
				}
			};
			const isAvailable = () => states.every(({ state, active }) => state.isInitialized() && !active);
			const messageBox = MessageBox.create({
				message: confirmationMessage,
				title: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TITLE'),
				okCaption: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_OK'),
				cancelCaption: Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_CANCEL'),
				buttons: MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					closeByEsc: true,
					events: {
						onClose: () => finish(false),
						onDestroy: () => finish(false),
					},
				},
				onOk: () => {
					if (closed || !isAvailable() || states.some(({ state }) => state.isActive()))
					{
						return;
					}

					finish(true);
					messageBox.close();
				},
				onCancel: () => {
					finish(false);
					messageBox.close();
				},
			});
			const updateAvailability = () => {
				if (closed)
				{
					return;
				}

				messageBox.getOkButton().setDisabled(!isAvailable());
				messageBox.setMessage(
					states.some(({ active }) => active)
						? Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE')
						: confirmationMessage,
				);
			};
			states.forEach((entry) => {
				unsubscribers.push(entry.state.subscribe((change) => {
					Object.assign(entry, { active: change.active });
					updateAvailability();
				}));
				void entry.state.initialize().then(updateAvailability);
			});
			updateAvailability();

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
