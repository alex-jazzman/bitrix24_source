import { Loc, Tag } from 'main.core';

export class SuccessInvitePopup
{
	show(): void
	{
		const notificationOptions = {
			id: 'invite-notification-result',
			autoHideDelay: 4000,
			closeButton: false,
			autoHide: true,
			content: this.#getNotificationContent(),
			useAirDesign: true,
		};

		const notify = BX.UI.Notification.Center.notify(notificationOptions);
		notify.show();
		notify.activateAutoHide();
	}

	#getNotificationContent(): HTMLElement
	{
		return Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__title ui-text --sm --accent">
						${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_TITLE')}
					</div>
					<div class="invite-email-notification__description ui-text --2xs">
						${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_DESCRIPTION_MSGVER_1')}
					</div>
				</div>
				<a href="/company/?apply_filter=Y&INVITED=Y" target="_blank" class="ui-link ui-link-secondary ui-link-dashed">
					${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_BUTTON')}
				</a>
			</div>
		`;
	}
}
