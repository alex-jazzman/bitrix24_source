import { ConfirmationDialog } from './confirmation-dialog';
import { NotificationDialog } from './notification-dialog';

BX.namespace('BX.Crm');

if (typeof BX.Crm.DialogButtonType === 'undefined')
{
	BX.Crm.DialogButtonType = {
		undefined: 0,
		accept: 1,
		cancel: 2,
		names: { accept: 'accept', cancel: 'cancel' },
	};
}

BX.Crm.ConfirmationDialog = ConfirmationDialog;
BX.Crm.NotificationDialog = NotificationDialog;

export { ConfirmationDialog, NotificationDialog };
