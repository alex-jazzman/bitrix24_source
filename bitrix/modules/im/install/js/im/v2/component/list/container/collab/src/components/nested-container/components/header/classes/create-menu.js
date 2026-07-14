import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { CreateChatManager, CreatableChatType } from 'im.v2.lib.create-chat';
import { BaseMenu } from 'im.v2.lib.menu';
import { EntityCreator } from 'im.v2.lib.entity-creator';

export class CreateMenu extends BaseMenu
{
	context: { parentChatId: number, collabId: number };

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
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK_MSGVER_1'),
			icon: OutlineIcons.TASK,
			onClick: () => {
				(new EntityCreator()).openCollabTaskCreationForm(this.context.collabId);
			},
		};
	}

	getMeetingItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING_MSGVER_1'),
			icon: OutlineIcons.CALENDAR_WITH_SLOTS,
			onClick: () => {
				void (new EntityCreator()).openCollabMeetingCreationSlider(this.context.collabId);
			},
		};
	}

	getChatItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_MSGVER_1'),
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
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW_MSGVER_1'),
			icon: OutlineIcons.BOTTLENECK,
			onClick: () => {
				const entityCreator = new EntityCreator(this.context.parentChatId);
				void entityCreator.createFlowForChat();
			},
		};
	}
}
