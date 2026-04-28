import { Extension, Loc } from 'main.core';
import type { UserRoleCodeType } from '../../../../type';
import { UserRole } from '../../../../type';

export const UserRoleTitleByCode: Record<UserRoleCodeType, string> = {
	[UserRole.Shop]: Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_SHOP'),
	[UserRole.Email]: Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_EMAIL'),
	[UserRole.Integrator]: Extension.getSettings('intranet.user.mini-profile')?.isRenamedIntegrator === 'Y'
		? Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_INTEGRATOR_RENAMED')
		: Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_INTEGRATOR'),
	[UserRole.Visitor]: Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_VISITOR'),
};
