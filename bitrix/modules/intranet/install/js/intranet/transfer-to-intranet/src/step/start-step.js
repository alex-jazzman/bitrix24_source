import { Type } from 'main.core';
import { UserDepartmentPopup } from 'intranet.user.department-popup';
import { TransferToIntranetPopup, type TransferToIntranetPopupType } from '../transfer-to-intranet-popup';

export class StartStep extends UserDepartmentPopup
{
	constructor(options: TransferToIntranetPopupType, parent: TransferToIntranetPopup): Object
	{
		super({
			...options,
			sendButtonCallback: (departmentIds) => {
				parent.emit('changestate', {
					departmentValues: Type.isArray(departmentIds) ? departmentIds : [],
				});
			},
			closeButtonCallback: () => {
				parent.emit('closepopup');
			},
		});
	}
}
