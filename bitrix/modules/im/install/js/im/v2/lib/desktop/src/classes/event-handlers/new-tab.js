import { EventType } from 'im.v2.const';
import { DesktopApi } from 'im.v2.lib.desktop-api';
import { Loc } from 'main.core';

export class NewTabHandler
{
	static init(): NewTabHandler
	{
		return new NewTabHandler();
	}

	constructor()
	{
		this.#subscribeToNewTabEvent();
	}

	#subscribeToNewTabEvent()
	{
		DesktopApi.subscribe(EventType.desktop.onNewTabClick, this.#onNewTabClick.bind(this));
	}

	#onNewTabClick()
	{
		const siteDir = Loc.getMessage('SITE_DIR') || '/';

		BX.SidePanel.Instance.open(
			`${siteDir}sitemap/?IM_DESKTOP_NEW_TAB=Y`,
			{
				allowChangeHistory: false,
				customLeftBoundary: 0,
			},
		);
	}
}
