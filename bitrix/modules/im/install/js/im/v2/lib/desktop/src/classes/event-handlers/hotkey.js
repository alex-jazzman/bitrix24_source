import { Event } from 'main.core';
import { HotkeyCombination } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';
import { DesktopApi } from 'im.v2.lib.desktop-api';

export class HotkeyHandler
{
	static init(): HotkeyHandler
	{
		return new HotkeyHandler();
	}

	constructor()
	{
		this.#bindHotkeys();
	}

	#bindHotkeys()
	{
		Event.bind(window, 'keydown', (event) => {
			const logFolderCombination = Utils.key.isCombination(event, HotkeyCombination.desktop.logFolder);
			if (logFolderCombination)
			{
				DesktopApi.openLogsFolder();
				Logger.desktop('NOTICE: User open log folder (hotkey)');

				return;
			}

			const devToolsCombination = Utils.key.isCombination(event, HotkeyCombination.desktop.devTools);
			if (devToolsCombination)
			{
				DesktopApi.openDeveloperTools();
				Logger.desktop('NOTICE: User open developer tools (hotkey)');
			}
		});
	}
}
