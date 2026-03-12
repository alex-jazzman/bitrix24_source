import { DesktopApi } from 'im.v2.lib.desktop-api';
import { Tag, Type, Uri } from 'main.core';
import { Content } from './content';
import { Analytics } from '../analytics';
import type { LogoutContentOptions } from '../types';

export class LogoutContent extends Content
{
	getOptions(): LogoutContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const onclick = () => {
				Analytics.send(Analytics.EVENT_CLICK_LOGOUT);

				if (!Type.isNil(DesktopApi) && DesktopApi.isDesktop())
				{
					DesktopApi.logout();
				}
				else
				{
					const backUrl = new Uri(window.location.pathname);
					backUrl.removeQueryParam(this.getOptions().removeQueryParam);
					const newUrl = new Uri(this.getOptions().path);
					newUrl.setQueryParam('sessid', BX.bitrix_sessid());
					newUrl.setQueryParam('backurl', encodeURIComponent(backUrl.toString()));
					document.location.href = newUrl;
				}
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper --pointer" data-id="bx-avatar-widget-content-logout">
					<i class="ui-icon-set --o-log-out intranet-avatar-widget-item__icon"/>
					<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
				</div>
			`;
		});
	}
}
