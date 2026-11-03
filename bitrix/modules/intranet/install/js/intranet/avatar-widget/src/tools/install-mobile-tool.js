import { BaseSecondaryTool } from './base-secondary-tool';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';

export class InstallMobileTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-mobile';
	}

	onClick(event: MouseEvent): void
	{
		Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
		EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', {
			focusTarget: event.currentTarget,
		});
	}
}
