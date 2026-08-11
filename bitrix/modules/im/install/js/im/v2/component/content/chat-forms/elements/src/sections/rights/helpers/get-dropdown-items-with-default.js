import { type DropdownItem } from 'im.v2.component.elements.dropdown';
import { type UserRole } from 'im.v2.const';

import { rightsDropdownItems } from '../const/dropdown-items.js';

type UserRoleItem = $Keys<typeof UserRole>;

export const getDropdownItemsWithDefault = (defaultValue: UserRoleItem): DropdownItem[] => {
	return rightsDropdownItems.map((item) => {
		return {
			...item,
			default: item.value === defaultValue,
		};
	});
};
