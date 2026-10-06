import { Dialog } from './dialog';
import { type DialogOptions } from './dialog-options';

export function createDialog(dialogOptions: DialogOptions): Dialog
{
	return new Dialog(dialogOptions);
}
