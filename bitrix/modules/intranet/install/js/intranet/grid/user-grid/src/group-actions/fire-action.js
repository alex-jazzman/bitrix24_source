import { FirstAdminGuard } from 'bitrix24.first-admin-guard';
import { ajax, Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { ErrorCollection } from 'ui.form-elements.field';
import {
	FireSystemUserWizard,
	SystemUserConfigProvider,
	type FireWizardListConfigDto,
} from 'intranet.fire-system-user-wizard';
import { BaseAction } from './base-action';
import { showFireConfigFailure } from '../fire-config-failure';

export class FireAction extends BaseAction
{
	static getActionId(): string
	{
		return 'fire';
	}

	execute(): void
	{
		this.grid.tableFade();
		SystemUserConfigProvider.fetchForList(this.collectFireFields())
			.then((response) => {
				this.grid.tableUnfade();
				this.showConfirmation(response?.data);
			})
			.catch(() => {
				this.grid.tableUnfade();
				this.showConfigFailure();
			});
	}

	showConfirmation(config: ?FireWizardListConfigDto): void
	{
		if (!this.showPopups)
		{
			this.executeAfterConfirmation(FireSystemUserWizard.hasSystemUsers(config));

			return;
		}

		FireSystemUserWizard.showForListConfig(config, {
			onConfirm: () => {
				this.executeAfterConfirmation(true);
			},
			onFallback: () => {
				this.showDefaultConfirmation();
			},
		});
	}

	showDefaultConfirmation(): void
	{
		const confirmationPopup = this.getConfirmationPopup();

		confirmationPopup.setOkCallback(() => {
			confirmationPopup.close();
			this.executeAfterConfirmation(false);
		});
		confirmationPopup.show();
	}

	showConfigFailure(): void
	{
		showFireConfigFailure();
	}

	collectFireFields(): { userIds: Array, isSelectedAllRows: string, filter: Array }
	{
		const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
		const isSelectedAllRows = this.grid.getRows().isAllSelected() ? 'Y' : 'N';

		return {
			userIds: selectedRows,
			isSelectedAllRows,
			filter: this.userFilter,
		};
	}

	sendActionRequest(disableIntegrations: boolean = false): void
	{
		this.grid.tableFade();

		ajax.runAction(this.getAjaxMethod(), {
			data: {
				fields: this.collectFireFields(),
				disableIntegrations: disableIntegrations === true,
			},
		})
			.then((result) => this.handleSuccess(result))
			.catch((result) => this.handleError(result));
	}

	executeAfterConfirmation(disableIntegrations: boolean = false): void
	{
		if (this.firstAdminId)
		{
			const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
			const isFirstAdminSelected = selectedRows.some(
				(userId) => Number(userId) === Number(this.firstAdminId),
			);

			if (isFirstAdminSelected)
			{
				this.handleFirstAdminFire(disableIntegrations);

				return;
			}
		}

		this.sendActionRequest(disableIntegrations);
	}

	handleFirstAdminFire(disableIntegrations: boolean = false): void
	{
		const guard = new FirstAdminGuard(
			this.currentUserName || '',
			this.currentUserId || 0,
			this.firstAdminId,
		);

		guard.confirmAction(
			'bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest',
			() => {
				ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', {
					data: {
						userId: Number(this.currentUserId),
						toUser: Number(this.firstAdminId),
					},
				}).then((fireResponse) => {
					if (fireResponse.status === 'success')
					{
						BX.UI.Notification.Center.notify({
							content: Loc.getMessage(
								'INTRANET_USER_LIST_FIRST_GROUP_ACTION_FIRST_ADMIN_REQUEST_SENT',
								{
									'[b]': '<b>',
									'[/b]': '</b>',
									'[br]': '<br>',
								},
							),
							autoHide: true,
							autoHideDelay: 3000,
							useAirDesign: true,
						});
					}
				}).catch((error) => {
					ErrorCollection.showSystemError('An error occurred while sending fire request');
				});

				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
				const nonFirstAdminUsers = selectedRows.filter(
					(userId) => Number(userId) !== Number(this.firstAdminId),
				);

				if (nonFirstAdminUsers.length > 0)
				{
					this.selectedUsers = nonFirstAdminUsers;
					this.sendActionRequest(disableIntegrations);
				}
				else
				{
					this.grid.reload();
				}
			},
			() => {
				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
				this.selectedUsers = selectedRows.filter((id) => Number(id) !== Number(this.firstAdminId));
				this.sendActionRequest(disableIntegrations);
			},
		);
	}

	getConfirmationPopup(): ?MessageBox
	{
		return new MessageBox({
			message: Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE'),
			title: Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE_TITLE'),
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_MESSAGE_BUTTON'),
		});
	}

	getAjaxMethod(): string
	{
		return 'intranet.v2.UserList.fire';
	}

	getSkippedUsersMessageCode(): string
	{
		return 'INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_MESSAGE';
	}

	getSkippedUsersTitleCode(): string
	{
		return 'INTRANET_USER_LIST_GROUP_ACTION_FIRE_SKIPPED_TITLE';
	}
}
