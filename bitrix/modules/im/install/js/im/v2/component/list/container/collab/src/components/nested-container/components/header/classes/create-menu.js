import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { CreateChatManager, CreatableChatType } from 'im.v2.lib.create-chat';
import { BaseMenu } from 'im.v2.lib.menu';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { ActionByRole, ActionByUserType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { CopilotManager } from 'im.v2.lib.copilot';
import { PermissionManager } from 'im.v2.lib.permission';
import { CopilotChatService } from 'im.v2.provider.service.copilot';
import { Messenger } from 'im.public';

export class CreateMenu extends BaseMenu
{
	static events = {
		onAttachToCollabV2Show: 'onAttachToCollabV2Show',
	};

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
			this.getChatItem(),
			this.getAttachToCollabV2Item(),
			this.getCopilotItem(),
			this.getMeetingItem(),
			this.getFlowItem(),
		];
	}

	getAttachToCollabV2Item(): ?MenuItemOptions
	{
		const isAttachToCollabV2Available = FeatureManager.isFeatureAvailable(Feature.isAttachToCollabV2Available);

		if (!isAttachToCollabV2Available)
		{
			return null;
		}

		const { dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](this.context.parentChatId);

		const permissionManager = PermissionManager.getInstance();
		const canCreateChildChat = permissionManager.canPerformActionByRole(ActionByRole.createChildChat, dialogId);

		if (!permissionManager.canManageUsersAdd(dialogId) || !canCreateChildChat)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_ATTACH_TO_COLLAB_V2'),
			icon: OutlineIcons.GO_TO_MESSAGE,
			onClick: () => {
				this.emit(CreateMenu.events.onAttachToCollabV2Show);
			},
		};
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

	getCopilotItem(): ?MenuItemOptions
	{
		if (!this.#isCopilotAvailableAndCreatable())
		{
			return null;
		}

		const title = Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_COPILOT', {
			'#COPILOT_NAME#': (new CopilotManager()).getName(),
		});

		return {
			title,
			icon: OutlineIcons.BITRIX_GPT,
			design: MenuItemDesign.BitrixGPT,
			onClick: async () => {
				const newDialogId = await (new CopilotChatService()).createDefaultChat(this.context.parentChatId);

				void Messenger.openChat(newDialogId);
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

	#isCopilotAvailableAndCreatable(): boolean
	{
		const isAvailable = FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		const isActive = FeatureManager.isFeatureAvailable(Feature.copilotActive);
		const canCreate = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCopilot);

		return isAvailable && isActive && canCreate;
	}
}
