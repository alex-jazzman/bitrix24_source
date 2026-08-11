import { type MenuItemOptions } from 'ui.system.menu';
import { ContentProvider } from './content-provider';

export class CopilotContentProvider extends ContentProvider
{
	getMenuItems(): Array<MenuItemOptions>
	{
		return [];
	}
}
