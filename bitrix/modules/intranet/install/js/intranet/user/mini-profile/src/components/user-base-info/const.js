import type { AvatarType } from 'ui.vue3.components.avatar';
import type { UserRoleCodeType } from '../../type';
import { UserRole } from '../../type';

export const UserAvatarTypeByRole: Record<UserRoleCodeType, AvatarType> = Object.freeze({
	[UserRole.Collaber]: 'round-guest',
	[UserRole.Extranet]: 'round-extranet',
	[UserRole.Employee]: 'round',
});
