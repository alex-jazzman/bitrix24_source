import { type Dialog, type Item, type ItemOptions } from 'ui.entity-selector';

import { isRoleOutOfScope } from './access-code-map';

export type DialogConstructor = new (...args: any[]) => Dialog;

/**
 * Foreign providers keep adding items to the dialog long after it is shown: roles of a sub-department
 * arrive when its node is expanded, search brings its own portion, and neither reports an event.
 * Every item goes through addItem though, so the scope filter belongs here.
 *
 * The base class is taken as an argument rather than imported: `ui.entity-selector` is loaded on
 * demand, so the class it provides exists only after the dialog is asked for - see dialog-loader.
 */
export function createScopedDialog(BaseDialog: DialogConstructor): DialogConstructor
{
	return class ScopedDialog extends BaseDialog
	{
		addItem(options: ItemOptions): Item
		{
			const item = super.addItem(options);

			if (isRoleOutOfScope(item.getEntityId(), String(item.getId())))
			{
				item.setHidden(true);
			}

			return item;
		}
	};
}
