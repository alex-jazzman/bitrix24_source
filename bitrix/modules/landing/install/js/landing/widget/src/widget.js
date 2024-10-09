import { Dom, Event } from 'main.core';

export class Widget
{
	constructor(widgetElement, options)
	{
		this.element = widgetElement;
		this.isShowExtendButton = options.isShowExtendButton ?? false;
		this.mainContainer = options.mainContainer ?? null;
		this.sidebarContainer = options.sidebarContainer ?? null;
		this.extendButton = options.extendButton ?? null;
		this.viewAllButton = options.viewAllButton ?? null;
		this.grid = options.grid ?? null;
		this.gridExtendedClass = options.gridExtendedClass ?? '';
		this.buttonHideClass = options.buttonHideClass ?? '';
	}

	deleteContextDependentContainer()
	{
		const sidebarElements = document.querySelectorAll('.landing-sidebar');
		let isInsideSidebar = false;
		sidebarElements.forEach((sidebarElement) => {
			if (sidebarElement.contains(this.element))
			{
				isInsideSidebar = true;
			}
		});

		if (isInsideSidebar && this.mainContainer)
		{
			this.mainContainer.remove();
		}

		if (!isInsideSidebar && this.sidebarContainer)
		{
			this.sidebarContainer.remove();
		}
	}

	toggleExtendViewButtonBehavior()
	{
		if (this.extendButton && this.viewAllButton)
		{
			if (this.isShowExtendButton)
			{
				Event.bind(this.extendButton, 'click', () => {
					if (this.grid)
					{
						Dom.addClass(this.grid, this.gridExtendedClass);
						setTimeout(() => {
							Dom.addClass(this.extendButton, this.buttonHideClass);
							Dom.removeClass(this.viewAllButton, this.buttonHideClass);
						}, 300);
					}
				});
			}
			else
			{
				Dom.addClass(this.extendButton, this.buttonHideClass);
				Dom.removeClass(this.viewAllButton, this.buttonHideClass);
			}
		}
	}
}
