import { QrAuthorization } from 'ui.qrauthorization';
import { Widget } from 'landing.widget';
import { Event } from 'main.core';

export class AppsWidgetV2
{
	constructor(element, options = {})
	{
		const mainContainer = element.querySelector('.landing-widget-view-main');
		const sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
		const widgetOptions = {
			mainContainer,
			sidebarContainer,
		};
		const widget = new Widget(element, widgetOptions);
		widget.deleteContextDependentContainer();

		const qrButton = element.querySelector('.landing-widget-qr-button');
		const qrAuth = new QrAuthorization(options);
		if (qrButton && qrAuth)
		{
			Event.bind(qrButton, 'click', () => {
				const popup = qrAuth.getPopup();
				if (popup)
				{
					popup.show();
				}
			});
		}
	}
}
