import { SliderManager } from './slider-manager';

let instance = null;

export function getInstance(): SliderManager
{
	const topWindow = BX.PageObject.getRootWindow();
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
