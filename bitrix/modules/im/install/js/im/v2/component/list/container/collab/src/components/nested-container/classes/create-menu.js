import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { CreateChatManager, CreatableChatType } from 'im.v2.lib.create-chat';
import { BaseMenu } from 'im.v2.lib.menu';

export class CreateMenu extends BaseMenu
{
	context: { parentChatId: number };

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			angle: false,
		};
	}

	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getTaskItem(),
			this.getMeetingItem(),
			this.getChatItem(),
			this.getFlowItem(),
		];
	}

	getTaskItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK'),
			subtitle: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK_SUBTITLE'),
			icon: OutlineIcons.TASK,
			onClick: () => {
				//
			},
		};
	}

	getMeetingItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING'),
			subtitle: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING_SUBTITLE'),
			icon: OutlineIcons.CALENDAR_WITH_SLOTS,
			onClick: () => {
				//
			},
		};
	}

	getChatItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT'),
			subtitle: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_SUBTITLE'),
			icon: OutlineIcons.CHATS,
			onClick: () => {
				if (CreateChatManager.getInstance().isCreationLayoutActive(CreatableChatType.collabChat))
				{
					return;
				}

				void CreateChatManager.getInstance().startChatCreation(CreatableChatType.collabChat, {
					parentChatId: this.context.parentChatId,
				});
			},
		};
	}

	getFlowItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW'),
			subtitle: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW_SUBTITLE'),
			icon: OutlineIcons.BOTTLENECK,
			onClick: () => {
				//
			},
		};
	}
}
