import { MenuManager } from 'main.popup';

export class Menu
{
	#menuItems: Array;
	#bindElement: HTMLElement;

	constructor(bind: HTMLElement, options)
	{
		this.#bindElement = bind;
		this.#menuItems = this.#createDeactivateMenuItems(options.days, options.callback);
	}

	show(): void
	{
		MenuManager.show(
			'securityOtpDaysPopup',
			this.#bindElement,
			this.#menuItems,
			{
				maxHeight: 200,
				offsetTop: 10,
				offsetLeft: 0,
				events: {
					onPopupClose() {
						MenuManager.destroy('securityOtpDaysPopup');
					},
				},
			},
		);
	}

	#createDeactivateMenuItems(days: Array, callback: function): Array
	{
		const menuItems = [];
		for (const index in days)
		{
			menuItems.push({
				text: days[index],
				numDays: index,
				onclick(event, item)
				{
					callback(item);
					this.popupWindow.close();
				},
			});
		}

		return menuItems;
	}
}
