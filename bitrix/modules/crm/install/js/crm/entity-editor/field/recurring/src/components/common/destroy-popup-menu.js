import { Type } from 'main.core';
import { destroyPopupMenu } from '../../helper';

export const popupMenuMixin = (popupMenuId: string | Array) => ({
	created(): void
	{
		this.popupMenuId = popupMenuId;
	},
	beforeUnmount(): void
	{
		if (Type.isArray(this.popupMenuId))
		{
			this.popupMenuId.forEach((popupId) => destroyPopupMenu(popupId));
		}
		else if (Type.isStringFilled(this.popupMenuId))
		{
			destroyPopupMenu(this.popupMenuId);
		}
	},
});
