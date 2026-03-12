import { Page } from 'main.core';
import { SliderManager } from './slider-manager';

let instance = null;

export function getInstance(): SliderManager
{
	const topWindow = Page.getRootWindow();
	if (topWindow !== window)
	{
		return topWindow.BX.SidePanel.Instance;
	}

	if (instance === null)
	{
		instance = new SliderManager();
	}

	return instance;
}
