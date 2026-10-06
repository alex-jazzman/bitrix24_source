import { Dialog } from './dialog';

export function isDialog(dialog: unknown): dialog is Dialog
{
	return dialog instanceof Dialog;
}
