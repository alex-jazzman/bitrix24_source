import { Widget } from 'landing.widget';

export class BpWidgetV2
{
	constructor(element, options)
	{
		if (!element)
		{
			return;
		}
		const mainContainer = element.querySelector('.landing-widget-view-main');
		const sidebarContainer = element.querySelector('.landing-widget-view-sidebar');
		const extendButton = element.querySelector('.landing-widget-button.extend-list-button');
		const viewAllButton = element.querySelector('.landing-widget-button.view-all-button');
		const grid = element.querySelector('.landing-widget-content-grid');
		const widgetOptions = {
			mainContainer,
			sidebarContainer,
			isShowExtendButton: options.isShowExtendButton,
			extendButton,
			viewAllButton,
			grid,
			gridExtendedClass: 'extended',
			buttonHideClass: 'hide',
		};
		const widget = new Widget(element, widgetOptions);
		widget.deleteContextDependentContainer();
		widget.toggleExtendViewButtonBehavior();
	}
}
