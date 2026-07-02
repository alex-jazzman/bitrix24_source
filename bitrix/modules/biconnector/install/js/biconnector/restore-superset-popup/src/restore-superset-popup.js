import { Loc, Tag, ajax } from 'main.core';
import { CardSelectPopup } from 'biconnector.card-select-popup';

const ACTION_RESTORE = 'restore';
const ACTION_RESET = 'reset';

export class RestoreSupersetPopup
{
	#popup: CardSelectPopup;
	#formNode: ?HTMLElement;
	#toolCode: ?string;

	constructor(options: { formNode?: HTMLElement, toolCode?: string } = {})
	{
		this.#formNode = options.formNode ?? null;
		this.#toolCode = options.toolCode ?? null;

		this.#popup = new CardSelectPopup({
			title: Loc.getMessage('BICONNECTOR_RESTORE_POPUP_TITLE'),
			cards: [
				{
					id: ACTION_RESTORE,
					title: Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESTORE_TITLE'),
					description: Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESTORE_DESCRIPTION'),
				},
				{
					id: ACTION_RESET,
					title: Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESET_TITLE'),
					description: Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESET_DESCRIPTION'),
				},
			],
		});
	}

	show(): Promise<string>
	{
		// in the rare case superset was deleted while the slider was open
		return Promise.resolve(ajax.runAction('biconnector.superset.isEnableConfirmationNeeded'))
			.catch(() => null)
			.then((response) => {
				if (response?.data?.isNeeded === false)
				{
					return '';
				}

				return new Promise((resolve) => {
					this.#popup.show(
						(action) => {
							this.#popup.hide();
							this.#setEnableMode(action);
							resolve(action);
						},
						() => {
							resolve('');
						},
					);
				});
			});
	}

	#setEnableMode(mode: string): void
	{
		if (!this.#formNode || !this.#toolCode)
		{
			return;
		}

		const inputName = this.#toolCode + '_enable_mode';

		let input = this.#formNode.querySelector(`input[name="${inputName}"]`);
		if (!input)
		{
			input = Tag.render`<input type="hidden" name="${inputName}">`;
			this.#formNode.appendChild(input);
		}

		input.value = mode;
	}
}
