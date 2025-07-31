import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';
import { EntityTypes, getColorCode, ChatTypes } from 'humanresources.company-structure.utils';
import { Main } from 'ui.icon-set.api.core';
import { PermissionActions, PermissionCheckerClass } from 'humanresources.company-structure.permission-checker';
import { AbstractMenuItem } from '../abstract-menu-item';
import { MenuActions } from '../../menu-actions';
import { Loc } from 'main.core';

/**
 * Menu item for unbinding a chat or channel from a team or department.
 * Displays appropriate title, description, and permission requirements
 * based on the entity type and chat type.
 */
export class UnbindChatMenuItem extends AbstractMenuItem
{
	chat: ChatOrChannelDetailed;

	constructor(entityType: string, chat: ChatOrChannelDetailed)
	{
		let title = '';
		let description = '';

		if (entityType === EntityTypes.team)
		{
			title = chat.type === ChatTypes.chat
				? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_TEAM_CHAT_TITLE')
				: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_TEAM_CHANNEL_TITLE')
			;

			description = chat.type === ChatTypes.chat
				? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_TEAM_CHAT_DESCRIPTION')
				: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_TEAM_CHANNEL_DESCRIPTION')
			;
		}
		else
		{
			title = chat.type === ChatTypes.chat
				? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_DEPARTMENT_CHAT_TITLE')
				: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_DEPARTMENT_CHANNEL_TITLE')
			;

			description = chat.type === ChatTypes.chat
				? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_DEPARTMENT_CHAT_DESCRIPTION')
				: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_UNBIND_DEPARTMENT_CHANNEL_DESCRIPTION')
			;
		}

		const permissionAction = entityType === EntityTypes.team
			? PermissionActions.teamCommunicationEdit
			: PermissionActions.departmentCommunicationEdit
		;

		super({
			id: MenuActions.unbindChat,
			title,
			description,
			bIcon: {
				name: Main.TRASH_BIN,
				size: 20,
				color: getColorCode('paletteRed40'),
			},
			permissionAction,
			dataTestId: 'hr-department-detail-content__chat-list_open-chat',
		});

		this.chat = chat;
	}

	hasPermission(permissionChecker: PermissionCheckerClass, entityId: number): boolean
	{
		return !this.chat.originalNodeId
			&& this.chat.hasAccess
			&& permissionChecker.hasPermission(this.permissionAction, entityId)
		;
	}
}
