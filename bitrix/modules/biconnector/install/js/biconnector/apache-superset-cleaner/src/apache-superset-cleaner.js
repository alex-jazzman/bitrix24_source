import { Loc, Text } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export class ApacheSupersetCleaner
{
	#popup: Popup;

	handleButtonClick(button: BaseButton)
	{
		this.#popup = new MessageBox({
			title: Loc.getMessage('SUPERSET_CLEANER_DELETE_POPUP_TITLE'),
			message: Loc.getMessage('SUPERSET_CLEANER_DELETE_POPUP_TEXT'),
			buttons: MessageBoxButtons.YES_NO,
			yesCaption: Loc.getMessage('SUPERSET_CLEANER_DELETE_POPUP_BUTTON_YES'),
			noCaption: Loc.getMessage('SUPERSET_CLEANER_DELETE_POPUP_BUTTON_NO'),
			onYes: (messageBox) => {
				button.addClass('ui-btn-wait');
				this.#deleteInstance();
				messageBox.close();
			},
			onNo: (messageBox) => {
				messageBox.close();
			},
		});

		this.#popup.show();
	}

	#deleteInstance()
	{
		BX.ajax.runAction('biconnector.superset.clean')
			.then(() => {
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('SUPERSET_CLEANER_DELETE_DONE'),
				});
				window.location.reload();
			})
			.catch((response) => {
				BX.UI.Notification.Center.notify({
					content: Text.encode(response.errors[0].message),
				});
			});
	}
}
