import { Type } from 'main.core';
import { SidePanel, type SliderManager } from 'main.sidepanel';

import { Core } from 'im.v2.application.core';
import { GetParameter, NavigationMenuItem, Path, type LayoutType } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { RecentManager } from 'im.v2.lib.recent';
import { Utils } from 'im.v2.lib.utils';
import { MessengerSlider } from 'im.v2.lib.slider';
import { type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

type NavigationItem = $Values<typeof NavigationMenuItem>;
type GetParameterType = $Values<typeof GetParameter>;
type OpenChatConfig = {
	// The name of the layout to open. A navigation menu item is one of those names, not the whole set:
	// the layout of the All folder has no menu item of its own.
	navigationItem: NavigationItem | LayoutType,
	dialogId: string,
	messageId?: number,
}

export const isChatNestedInCollab = async (dialogId: string): Promise<boolean> => {
	if (!Utils.dialog.isChatDialogId(dialogId))
	{
		return false;
	}

	const store = Core.getStore();
	if (!store.getters['chats/get'](dialogId))
	{
		await (new ChatService()).loadChat(dialogId).catch(() => {});
	}

	const chat: ?ImModelChat = store.getters['chats/get'](dialogId);

	return Boolean(chat) && chat.parentChatId > 0 && !RecentManager.isTypeWithNestedChats(chat.type);
};

export const checkHistoryDialogId = (dialogId: string): boolean => {
	return Utils.dialog.isLinesHistoryId(dialogId) || Utils.dialog.isLinesExternalId(dialogId);
};

export const prepareHistorySliderLink = (dialogId: string): string => {
	const getParams = new URLSearchParams({
		[GetParameter.openHistory]: dialogId,
		[GetParameter.backgroundType]: 'light',
		[GetParameter.legacyMode]: 'Y',
	});

	return `${Path.history}?${getParams.toString()}`;
};

export const openHistoryInSidePanel = (dialogId: string): void => {
	const sidePanelManager: SliderManager = SidePanel.Instance;

	sidePanelManager.open(prepareHistorySliderLink(dialogId), {
		width: Utils.dialog.isLinesExternalId(dialogId) ? 700 : 1000,
		allowChangeHistory: false,
		allowChangeTitle: false,
		cacheable: false,
	});
};

export const normalizeEntityId = (entityId: any): string => {
	if (Type.isString(entityId))
	{
		return entityId;
	}

	if (Type.isNumber(entityId))
	{
		return entityId.toString();
	}

	return '';
};

export const handleOpenTarget = async (config: OpenChatConfig): void => {
	if (shouldOpenNewTab())
	{
		openChatInNewTab(config);

		return;
	}

	await openChatInSlider(config);
};

export const shouldOpenNewTab = (): boolean => {
	if (isEmbeddedModeWithActiveSlider())
	{
		return true;
	}

	const messengerSlider = MessengerSlider.getInstance();

	return messengerSlider.isOpened() && !messengerSlider.isFocused();
};

const isEmbeddedModeWithActiveSlider = (): boolean => {
	const sidePanelManager: SliderManager = SidePanel.Instance;

	return LayoutManager.getInstance().isEmbeddedMode() && sidePanelManager.getOpenSlidersCount() > 0;
};

export const openChatInNewTab = ({ navigationItem, dialogId, messageId }: OpenChatConfig): void => {
	const getParams = new URLSearchParams();

	const urlParameter = getUrlParameterForNavigation(navigationItem);
	if (Type.isStringFilled(dialogId))
	{
		getParams.append(urlParameter, dialogId);
	}

	if (messageId > 0)
	{
		getParams.append(GetParameter.openMessage, messageId);
	}

	Utils.browser.openLink(`${Path.online}?${getParams.toString()}`);
};

const openChatInSlider = async ({ navigationItem, dialogId, messageId }: OpenChatConfig): void => {
	await MessengerSlider.getInstance().openSlider();

	const layoutParams = {
		name: navigationItem,
		entityId: dialogId,
	};

	if (messageId > 0)
	{
		layoutParams.contextId = messageId;
	}

	await LayoutManager.getInstance().setLayout(layoutParams);
};

// A layout name outside the map falls back to the chat parameter: the new tab opens `/online/` with
// the dialog and picks the section on its own, the way the start of a session does.
const getUrlParameterForNavigation = (navigationItem: NavigationItem | LayoutType): GetParameterType => {
	const navigationToGetParameterMap = {
		[NavigationMenuItem.chat]: GetParameter.openChat,
		[NavigationMenuItem.openlines]: GetParameter.openLines,
		[NavigationMenuItem.openlinesV2]: GetParameter.openLines,
		[NavigationMenuItem.copilot]: GetParameter.openCopilotChat,
		[NavigationMenuItem.channel]: GetParameter.openChannel,
		[NavigationMenuItem.collab]: GetParameter.openCollab,
		[NavigationMenuItem.tasksTask]: GetParameter.openTaskComments,
	};

	return navigationToGetParameterMap[navigationItem] ?? GetParameter.openChat;
};
