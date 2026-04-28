import type { PermissionCheckerClass } from 'humanresources.company-structure.permission-checker';
import { PermissionActions } from 'humanresources.company-structure.permission-checker';
import { getColorCode } from 'humanresources.company-structure.utils';
import { Loc } from 'main.core';
import { Actions } from 'ui.icon-set.api.core';
import { MenuActions } from '../../menu-actions';
import { AbstractMenuItem } from '../abstract-menu-item';

export class ShowMultiRoleUserSettingsMenuItem extends AbstractMenuItem
{
	constructor()
	{
		super({
			id: MenuActions.showMultiRoleUserSettings,
			title: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_CHANGE_MULTI_ROLE_SETTINGS_TITLE'),
			description: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_CHANGE_MULTI_ROLE_SETTINGS_SUBTITLE'),
			bIcon: {
				name: Actions.SETTINGS_2,
				size: 20,
				color: getColorCode('paletteBlue50'),
			},
			permissionAction: PermissionActions.departmentSettingsEdit,
			dataTestId: 'hr-company-structure_menu__show-multi-role-user-settings-item',
		});
	}

	hasPermission(permissionChecker: PermissionCheckerClass, entityId: number): boolean
	{
		const isFeatureAvailable = permissionChecker.checkMultipleUsersBPSettingsAvailable()
			|| permissionChecker.checkMultipleUsersReportSettingsAvailable()
		;

		return isFeatureAvailable && permissionChecker.hasPermission(this.permissionAction, entityId);
	}
}
