import { Event, Type } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { Button } from 'ui.buttons';

export const SUNSET_HELPDESK_CODE = '14795982';

export function bindHelpdeskLink(root: HTMLElement, onClick?: () => void): void
{
	const link = root.querySelector('.crm-old-layout-helpdesk-link');
	if (!link)
	{
		return;
	}

	Event.bind(link, 'click', (event) => {
		if (top.BX.Helper)
		{
			top.BX.Helper.show(`redirect=detail&code=${SUNSET_HELPDESK_CODE}`);
			event.preventDefault();
		}
		if (Type.isFunction(onClick))
		{
			onClick();
		}
	});
}

export type ConfirmationOptions = {
	message: string,
	confirmText: string,
	cancelText: string,
	errorText: string,
};

export function showDisableOldInvoicesConfirmation(options: ConfirmationOptions): void
{
	const confirmationPopup = MessageBox.create({
		message: options.message,
		useAirDesign: true,
		buttons: [
			new Button({
				text: options.confirmText,
				useAirDesign: true,
				style: Button.AirStyle.FILLED,
				onclick: () => {
					sendDisableOldInvoicesRequest(options.errorText);
				},
			}),
			new Button({
				text: options.cancelText,
				useAirDesign: true,
				style: Button.AirStyle.OUTLINE,
				onclick: (button) => {
					button.context.close();
				},
			}),
		],
	});
	confirmationPopup.show();
}

function sendDisableOldInvoicesRequest(errorText: string): void
{
	BX.ajax.runAction('crm.oldentityview.sunset.disableOldInvoices')
		.then((response) => {
			const redirectUrl = response?.data?.redirectUrl;
			if (Type.isString(redirectUrl) && redirectUrl !== '')
			{
				window.location.href = redirectUrl;
			}
			else
			{
				window.location.reload();
			}
		})
		.catch(() => {
			UI.Notification.Center.notify({
				content: errorText,
			});
		});
}
