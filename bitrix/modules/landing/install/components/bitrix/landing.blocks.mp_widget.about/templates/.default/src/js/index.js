import { Widget } from 'landing.widget';

export class AboutWidget
{
	constructor(element)
	{
		const mainContainer = element.querySelector('.landing-widget-view-main');
		const sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
		const widgetOptions = {
			mainContainer,
			sidebarContainer,
		};
		const widget = new Widget(element, widgetOptions);
		widget.deleteContextDependentContainer();
	}
}
