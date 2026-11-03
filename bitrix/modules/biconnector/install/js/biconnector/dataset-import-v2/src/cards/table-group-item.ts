import type { AvatarOptions } from 'ui.entity-selector';
import type { TableGroupItem } from '../types/state';

export const TABLE_GROUP_ENTITY_ID = 'biconnector-table-group';

// The folder icons the table list and the rights settings give the two kinds of groups
const SYSTEM_GROUP_AVATAR = '/bitrix/js/ui/icons/disk/images/ui-icon-air-folder-24.svg';
const CUSTOM_GROUP_AVATAR = '/bitrix/js/ui/icons/disk/images/ui-icon-air-folder-person.svg';

export const TABLE_GROUP_AVATAR_OPTIONS: AvatarOptions = { borderRadius: '4px' };

export function getTableGroupAvatar(group: TableGroupItem): string
{
	return group.type === 'SYSTEM' ? SYSTEM_GROUP_AVATAR : CUSTOM_GROUP_AVATAR;
}
