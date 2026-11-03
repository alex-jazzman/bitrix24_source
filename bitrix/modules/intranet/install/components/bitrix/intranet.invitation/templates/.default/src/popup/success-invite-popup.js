import { Loc, Tag } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

export class SuccessInvitePopup
{
	show(content: ?HTMLElement): void
	{
		const notificationContent = content || this.#getNotificationContent();
		notificationContent.dataset.testid = 'invitation-success-notification';

		const notificationOptions = {
			id: 'invite-notification-result',
			autoHideDelay: 4000,
			closeButton: false,
			autoHide: true,
			content: notificationContent,
			useAirDesign: true,
		};

		const notify = BX.UI.Notification.Center.notify(notificationOptions);
		notify.show();
		notify.activateAutoHide();

		const resultContent = notificationContent.querySelector('.invite-email-notification__content')
			?? notificationContent
		;
		LiveAnnouncer.announce((resultContent.textContent ?? '').replace(/\s+/g, ' ').trim(), 'polite');
	}

	#getNotificationContent(): HTMLElement
	{
		return Tag.render`
			<div class="invite-email-notification">
				<div
					class="invite-email-notification__content"
					data-testid="invitation-success-notification-message"
				>
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
