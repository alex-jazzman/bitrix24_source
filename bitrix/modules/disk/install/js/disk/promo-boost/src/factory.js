import { Button } from './button/button';
import { Widget } from './widget';
import { Settings } from './settings';

export class Factory
{
	static getSessionBoostButton(containerId: string): Button
	{
		return new Button({
			containerId,
			service: Settings.getSessionBoostServiceCode(),
			widget: this.getSessionBoostWidget(),
		});
	}

	static getSessionBoostWidget(): Widget
	{
		return Widget.getInstance(Settings.getSessionBoostServiceCode());
	}
}
