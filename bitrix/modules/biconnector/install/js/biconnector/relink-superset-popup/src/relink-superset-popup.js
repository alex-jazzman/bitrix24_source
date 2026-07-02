import { ajax as Ajax, Loc, Text, Type } from 'main.core';
import { CardSelectPopup } from 'biconnector.card-select-popup';

const ACTION_TRANSFER = 'transfer';
const ACTION_CREATE_NEW = 'create_new';
const ACTION_DISABLE = 'disable';

export class RelinkSupersetPopup
{
	#popup: CardSelectPopup;

	constructor()
	{
		this.#popup = new CardSelectPopup({
			title: Loc.getMessage('BICONNECTOR_RELINK_POPUP_TITLE'),
			applyButtonText: Loc.getMessage('BICONNECTOR_RELINK_POPUP_APPLY_BTN'),
			cancelButtonText: Loc.getMessage('BICONNECTOR_RELINK_POPUP_CANCEL_BTN'),
			cards: [
				{
					id: ACTION_TRANSFER,
					title: Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_TITLE'),
					description: Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_DESCRIPTION'),
				},
				{
					id: ACTION_CREATE_NEW,
					title: Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_TITLE'),
					description: Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_DESCRIPTION'),
				},
				{
					id: ACTION_DISABLE,
					title: Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_TITLE'),
					description: Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_DESCRIPTION'),
				},
			],
		});
	}

	show(): void
	{
		this.#popup.show((action) => {
			this.#handleAction(action);
		});
	}

	hide(): void
	{
		this.#popup.hide();
	}

	#handleAction(action: string): void
	{
		this.#popup.setLoading(true);

		switch (action)
		{
			case ACTION_TRANSFER:
				this.#transferSuperset();
				break;
			case ACTION_CREATE_NEW:
				this.#createNewSuperset();
				break;
			case ACTION_DISABLE:
				this.#disableSuperset();
				break;
		}
	}

	#transferSuperset(): void
	{
		Ajax.runAction('biconnector.superset.linkAddress').then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#createNewSuperset(): void
	{
		Ajax.runAction('biconnector.superset.deleteLocal').then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#disableSuperset(): void
	{
		Ajax.runAction('biconnector.superset.deleteLocal', {
			data: {
				disableTool: true,
			},
		}).then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#processErrorResponse(response): void
	{
		if (response.errors && Type.isStringFilled(response.errors[0]?.message))
		{
			BX.UI.Notification.Center.notify({
				content: Text.encode(response.errors[0].message),
			});
		}

		this.#popup.setLoading(false);
	}
}
