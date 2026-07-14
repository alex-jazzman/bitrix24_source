import { Type } from 'main.core';
import { SidePanel, type SliderManager } from 'main.sidepanel';

import { GetParameter, NavigationMenuItem, Path } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { Utils } from 'im.v2.lib.utils';
import { MessengerSlider } from 'im.v2.lib.slider';

type NavigationItem = $Values<typeof NavigationMenuItem>;
type GetParameterType = $Values<typeof GetParameter>;
type OpenChatConfig = {
	navigationItem: NavigationItem,
	dialogId: string,
	messageId?: number,
}

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

const shouldOpenNewTab = (): boolean => {
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

const openChatInNewTab = ({ navigationItem, dialogId, messageId }: OpenChatConfig): void => {
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

const getUrlParameterForNavigation = (navigationItem: NavigationItem): GetParameterType => {
	const navigationToGetParameterMap = {
		[NavigationMenuItem.chat]: GetParameter.openChat,
		[NavigationMenuItem.openlines]: GetParameter.openLines,
		[NavigationMenuItem.openlinesV2]: GetParameter.openLines,
	};

	return navigationToGetParameterMap[navigationItem] ?? GetParameter.openChat;
};
