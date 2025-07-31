import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';
import { getColorCode, ChatTypes } from 'humanresources.company-structure.utils';
import { Main } from 'ui.icon-set.api.core';
import { AbstractMenuItem } from '../abstract-menu-item';
import { PermissionCheckerClass } from 'humanresources.company-structure.permission-checker';
import { MenuActions } from '../../menu-actions';
import { Loc } from 'main.core';

/**
 * Menu item for opening a chat or channel.
 * Displays appropriate title, and description based on chat type.
 * Checks permissions using hasAccess property of the chat.
 */
export class OpenChatMenuItem extends AbstractMenuItem
{
	chat: ChatOrChannelDetailed;

	constructor(entityType: string, chat: ChatOrChannelDetailed)
	{
		const title = chat.type === ChatTypes.chat
			? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_OPEN_CHAT_TITLE')
			: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_OPEN_CHANNEL_TITLE')
		;

		const description = chat.type === ChatTypes.chat
			? Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_OPEN_CHAT_DESCRIPTION')
			: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_CHAT_LIST_ACTION_MENU_OPEN_CHANNEL_DESCRIPTION')
		;

		super({
			id: MenuActions.openChat,
			title,
			description,
			bIcon: {
				name: Main.EDIT_PENCIL,
				size: 20,
				color: getColorCode('paletteBlue50'),
			},
			permissionAction: null,
			dataTestId: 'hr-department-detail-content__chat-list_open-chat',
		});

		this.entityType = entityType;
		this.chat = chat;
	}

	hasPermission(permissionChecker: PermissionCheckerClass, entityId: number): boolean
	{
		return this.chat.hasAccess;
	}
}
