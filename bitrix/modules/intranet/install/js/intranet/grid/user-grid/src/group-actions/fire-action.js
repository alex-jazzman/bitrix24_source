import { FirstAdminGuard } from 'bitrix24.first-admin-guard';
import { ajax, Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { ErrorCollection } from 'ui.form-elements.field';
import { BaseAction } from './base-action';

export class FireAction extends BaseAction
{
	static getActionId(): string
	{
		return 'fire';
	}

	execute(): void
	{
		const confirmationPopup = this.showPopups
			? this.getConfirmationPopup()
			: null;

		if (confirmationPopup)
		{
			confirmationPopup.setOkCallback(() => {
				confirmationPopup.close();
				this.executeAfterConfirmation();
			});
			confirmationPopup.show();
		}
		else
		{
			this.executeAfterConfirmation();
		}
	}

	executeAfterConfirmation(): void
	{
		if (this.firstAdminId)
		{
			const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
			const isFirstAdminSelected = selectedRows.some(
				(userId) => Number(userId) === Number(this.firstAdminId),
			);

			if (isFirstAdminSelected)
			{
				this.handleFirstAdminFire();

				return;
			}
		}

		this.sendActionRequest();
	}

	handleFirstAdminFire(): void
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
					this.sendActionRequest();
				}
				else
				{
					this.grid.reload();
				}
			},
			() => {
				const selectedRows = this.selectedUsers ?? this.grid.getRows().getSelectedIds();
				this.selectedUsers = selectedRows.filter((id) => Number(id) !== Number(this.firstAdminId));
				this.sendActionRequest();
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
		return 'intranet.controller.user.userlist.groupFire';
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
