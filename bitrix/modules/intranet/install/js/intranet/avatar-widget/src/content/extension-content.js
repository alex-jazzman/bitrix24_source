import { Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu } from 'main.popup';
import { Content } from './content';
import { Analytics } from '../analytics';
import type { ExtensionContentOptions } from '../types';

export class ExtensionContent extends Content
{
	#bindElementDataId: string = 'intranet-avatar-widget-extensions';

	getOptions(): ExtensionContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const onclick = () => {
				Analytics.send(Analytics.EVENT_CLICK_EXTENSION);
				this.#getMenu().toggle();
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper" data-id="bx-avatar-widget-content-extension">
					<i class="ui-icon-set --o-box intranet-avatar-widget-item__icon"/>
					<span class="intranet-avatar-widget-item__title">${Text.encode(this.getOptions().text)}</span>
					<i data-id="${this.#bindElementDataId}" class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>
				</div>
			`;
		});
	}

	#getMenu(): Menu
	{
		return this.cache.remember('menu', () => {
			const menu = new Menu({
				bindElement: document.querySelector(`[data-id="${this.#bindElementDataId}"]`),
				items: this.getOptions().items,
				angle: true,
				cachable: false,
				offsetLeft: 10,
				fixed: true,
			});
			EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
				menu.close();
			});

			return menu;
		});
	}
}
