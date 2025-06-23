import { Tag } from 'main.core';
import { Content } from './content';
import { Analytics } from '../analytics';

export class ThemeContent extends Content
{
	getOptions(): Object
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const onclick = () => {
				Analytics.send(Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME);
				BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(false);
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper --pointer" data-id="bx-avatar-widget-content-settings">
					<i class="ui-icon-set --o-image intranet-avatar-widget-item__icon"/>
					<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
				</div>
			`;
		});
	}
}
