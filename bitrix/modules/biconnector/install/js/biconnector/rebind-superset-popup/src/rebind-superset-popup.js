import { ajax as Ajax, Loc } from 'main.core';
import { CardSelectPopup } from 'biconnector.card-select-popup';
import { resolveErrorHtml } from 'biconnector.error-message';
import { Center as NotificationCenter } from 'ui.notification';

const ACTION_REBIND = 'rebind';
const ACTION_DISABLE = 'disable';

export class RebindSupersetPopup
{
	#popup: CardSelectPopup;
	#settingsUrl: string;

	constructor({ settingsUrl = '' }: { settingsUrl?: string } = {})
	{
		this.#settingsUrl = settingsUrl;
		this.#popup = new CardSelectPopup({
			title: Loc.getMessage('BICONNECTOR_REBIND_POPUP_TITLE'),
			applyButtonText: Loc.getMessage('BICONNECTOR_REBIND_POPUP_APPLY_BTN'),
			cancelButtonText: Loc.getMessage('BICONNECTOR_REBIND_POPUP_CANCEL_BTN'),
			cards: [
				{
					id: ACTION_REBIND,
					title: Loc.getMessage('BICONNECTOR_REBIND_POPUP_REBIND_TITLE'),
					description: Loc.getMessage('BICONNECTOR_REBIND_POPUP_REBIND_DESCRIPTION'),
				},
				{
					id: ACTION_DISABLE,
					title: Loc.getMessage('BICONNECTOR_REBIND_POPUP_DISABLE_TITLE'),
					description: Loc.getMessage('BICONNECTOR_REBIND_POPUP_DISABLE_DESCRIPTION'),
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
		switch (action)
		{
			case ACTION_REBIND:
				this.#popup.setLoading(true);
				this.#rebindSuperset();
				break;
			case ACTION_DISABLE:
				BX.SidePanel.Instance.open(this.#settingsUrl, {
					cacheable: false,
					width: 1034,
				});
				break;
		}
	}

	#rebindSuperset(): void
	{
		Ajax.runAction('biconnector.superset.rebindSuperset').then(() => {
			location.reload();
		}).catch((response) => {
			this.#processErrorResponse(response);
		});
	}

	#processErrorResponse(response): void
	{
		NotificationCenter.notify({
			content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_REBIND_POPUP_ERROR')),
		});

		this.#popup.setLoading(false);
	}
}
