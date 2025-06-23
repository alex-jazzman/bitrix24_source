import { PermissionActions } from 'humanresources.company-structure.permission-checker';
import { EntityTypes, getColorCode } from 'humanresources.company-structure.utils';
import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Main } from 'ui.icon-set.api.core';
import { events } from '../../../../consts';
import { AbstractMenuItem } from '../abstract-menu-item';
import { MenuActions } from '../../menu-actions';

export class EditDepartmentMenuItem extends AbstractMenuItem
{
	constructor(entityType: string)
	{
		const title = entityType === EntityTypes.team
			? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_TITLE')
			: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_DEPARTMENT_TITLE');

		const description = entityType === EntityTypes.team
			? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_SUBTITLE')
			: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_DEPARTMENT_SUBTITLE');

		const permissionAction = entityType === EntityTypes.team
			? PermissionActions.teamEdit
			: PermissionActions.departmentEdit
		;

		super({
			id: MenuActions.editDepartment,
			title,
			description,
			bIcon: {
				name: Main.EDIT_PENCIL,
				size: 20,
				color: getColorCode('paletteBlue50'),
			},
			permissionAction,
			dataTestId: 'hr-company-structure_menu__edit-department-item',
		});
	}

	invoke({ entityId, analyticSource, refToFocus = 'title' }): void
	{
		EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
			nodeId: entityId,
			isEditMode: true,
			type: 'department',
			source: analyticSource,
			refToFocus,
		});
	}
}
