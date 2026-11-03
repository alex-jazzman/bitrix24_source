import { BaseMainTool } from './base-main-tool';
import { Menu } from 'main.popup';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';

export class ExtensionTool extends BaseMainTool
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('extensionLayout', () => {
			const layout = super.getLayout();
			const trigger = this.#getTriggerElement();

			trigger.setAttribute('aria-haspopup', 'menu');
			trigger.setAttribute('aria-expanded', 'false');

			return layout;
		});
	}

	getIconClass(): string
	{
		return '--o-box';
	}

	onClick(): void
	{
		Analytics.send(Analytics.EVENT_CLICK_EXTENSION);
		this.#getMenu().toggle();
	}

	#getMenu(): Menu
	{
		return this.cache.remember('menu', () => {
			const trigger = this.#getTriggerElement();
			const menu = new Menu({
				bindElement: trigger,
				ariaLabel: this.getTitle(),
				items: this.options.items,
				angle: true,
				cachable: false,
				offsetLeft: 10,
				fixed: true,
				events: {
					onShow: () => trigger.setAttribute('aria-expanded', 'true'),
					onClose: () => trigger.setAttribute('aria-expanded', 'false'),
				},
			});
			EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
				menu.close();
			});

			return menu;
		});
	}

	#getTriggerElement(): HTMLElement
	{
		const trigger = this.getIconElement().closest('button');

		if (!trigger)
		{
			throw new Error('Extension tool trigger was not found');
		}

		return trigger;
	}

	getId(): string
	{
		return 'extension';
	}
}
