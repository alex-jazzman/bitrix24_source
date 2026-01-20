import { Loc } from 'main.core';
import { CloseIconSize } from 'main.popup';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export class DeactivateConfirmation
{
	static confirm(): Promise<boolean>
	{
		return new Promise((resolve) => {
			const messageBox = MessageBox.create({
				title: Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_TITLE'),
				message: Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_DESCRIPTION'),
				yesCaption: Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_YES_CAPTION'),
				modal: true,
				buttons: MessageBoxButtons.YES_CANCEL,
				popupOptions: {
					className: 'booking-yiw__deactivate-confirmation',
					minHeight: 200,
					minWidth: 479,
					closeByEsc: true,
					closeIcon: true,
					closeIconSize: CloseIconSize.LARGE,
				},
				useAirDesign: true,
				onYes: async (box) => {
					box.close();
					resolve(true);
				},
				onCancel: (box) => {
					box.close();
					resolve(false);
				},
			});

			messageBox.show();
		});
	}
}
