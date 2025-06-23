import { Dom } from 'main.core';
import type { ListItemOptions } from 'landing.ui.component.listitem';

import { BookingSettingsPopup } from './booking-settings-popup';
import type { FormOptions } from './types';

export class Settings
{
	#isAutoSelectionOn: boolean;
	#options: ListItemOptions;

	settingsPopup: BookingSettingsPopup;

	constructor(listItemOptions: ListItemOptions, formOptions: FormOptions = {})
	{
		this.#options = listItemOptions;
		this.#isAutoSelectionOn = Boolean(formOptions?.bookingResourceAutoSelection?.use);

		this.settingsPopup = new BookingSettingsPopup({
			listItemOptions,
			isAutoSelectionOn: this.#isAutoSelectionOn,
			templateId: formOptions?.templateId,
		});
	}

	getSettings(): Object
	{
		return this.settingsPopup.getSettings();
	}

	showSettingsPopup(): void
	{
		const container = document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-body`);

		if (Dom.style(container, 'display') === 'block')
		{
			this.settingsPopup.close();
		}
		else
		{
			this.settingsPopup.show();
		}
	}
}
