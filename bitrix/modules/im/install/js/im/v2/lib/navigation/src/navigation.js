import { FeaturePromoter } from 'ui.info-helper';
import { EventEmitter } from 'main.core.events';

import {
	Layout,
	SliderCode,
	NavigationMenuItem,
	Path,
	GetParameter,
	EventType,
	type LayoutType,
	type NavigationMenuItemType,
} from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { PhoneManager } from 'im.v2.lib.phone';
import { Utils } from 'im.v2.lib.utils';
import { MarketManager } from 'im.v2.lib.market';

import { getNavigationItemId } from './functions/navigation-item';

export type NavigationMenuItemParams = {
	id: string,
	entityId?: string,
	target?: HTMLElement,
	asLink?: boolean,
};

type LayoutParams = {
	layoutName: string,
	layoutEntityId?: string | number
};

const customClickHandler = {
	[NavigationMenuItem.messenger]: onMessengerClick,
	[NavigationMenuItem.copilot]: onCopilotClick,
	[NavigationMenuItem.call]: onCallClick,
	[NavigationMenuItem.timemanager]: onTimeManagerClick,
	[NavigationMenuItem.homepage]: onHomepageClick,
	[NavigationMenuItem.market]: onMarketClick,
};

export const NavigationManager = {
	open(payload: NavigationMenuItemParams): void
	{
		const { id } = payload;
		if (!NavigationMenuItem[id])
		{
			return;
		}

		if (customClickHandler[id])
		{
			customClickHandler[id](payload);

			return;
		}

		handleMenuItem(payload);
	},
	isMarketApp(payload: NavigationMenuItemParams): boolean
	{
		const { id, entityId } = payload;
		const isMarketMenuItem = id === NavigationMenuItem.market;

		return isMarketMenuItem && Boolean(entityId);
	},
	getNavigationItemId(layoutName: LayoutType): NavigationMenuItemType | ''
	{
		return getNavigationItemId(layoutName);
	},
};

function onMessengerClick(): void
{
	// The item has no screen of its own: it opens the same folder the messenger starts with.
	const initialLayout = FolderManager.getDefaultLayout() ?? { name: Layout.chat };

	// changeLayout() is bypassed on purpose: it forwards entityId only and would drop the
	// starting folder kept in params.
	EventEmitter.emit(EventType.recent.closeNestedList);

	void LayoutManager.getInstance().setLayout(initialLayout);
}

function onCopilotClick(payload: NavigationMenuItemParams)
{
	if (!FeatureManager.isFeatureAvailable(Feature.copilotActive))
	{
		const promoter = new FeaturePromoter({ code: SliderCode.copilotDisabled });
		promoter.show();
		Analytics.getInstance().copilot.onOpenTab({ isAvailable: false });

		return;
	}

	handleMenuItem(payload);
}

function onCallClick(payload: NavigationMenuItemParams)
{
	const KEYPAD_OFFSET_TOP = -30;
	const KEYPAD_OFFSET_LEFT = 64;

	PhoneManager.getInstance().openKeyPad({
		bindElement: payload?.target,
		offsetTop: KEYPAD_OFFSET_TOP,
		offsetLeft: KEYPAD_OFFSET_LEFT,
	});
}

function onTimeManagerClick()
{
	BX.Timeman?.Monitor?.openReport();
}

function onHomepageClick()
{
	Utils.browser.openLink('/');
}

function onMarketClick(payload: NavigationMenuItemParams)
{
	const { entityId } = payload;
	if (entityId)
	{
		// specific apps should be opened as layouts
		changeLayout({
			layoutName: Layout.market,
			layoutEntityId: entityId,
		});

		return;
	}

	// marketplace should be opened as slider
	MarketManager.openChatMarket();
}

function handleMenuItem(payload: NavigationMenuItemParams): void
{
	const { id: layoutName, entityId: layoutEntityId, asLink } = payload;
	if (asLink)
	{
		openLink({ layoutName, layoutEntityId });

		return;
	}

	changeLayout({ layoutName, layoutEntityId });
}

function openLink({ layoutName, layoutEntityId }: LayoutParams): void
{
	const LayoutToUrlConfigMap: Record<string, { paramName: string, useParamByDefault: boolean, canUseId: boolean }> = {
		[NavigationMenuItem.chat]: {
			paramName: GetParameter.openChat,
			useParamByDefault: false,
			canUseId: true,
		},
		[NavigationMenuItem.copilot]: {
			paramName: GetParameter.openCopilotChat,
			useParamByDefault: true,
			canUseId: true,
		},
		[NavigationMenuItem.collab]: {
			paramName: GetParameter.openCollab,
			useParamByDefault: true,
			canUseId: true,
		},
		[NavigationMenuItem.channel]: {
			paramName: GetParameter.openChannel,
			useParamByDefault: true,
			canUseId: true,
		},
		[NavigationMenuItem.tasksTask]: {
			paramName: GetParameter.openTaskComments,
			useParamByDefault: true,
			canUseId: true,
		},
		[NavigationMenuItem.openlines]: {
			paramName: GetParameter.openLines,
			useParamByDefault: true,
			canUseId: true,
		},
		[NavigationMenuItem.notification]: {
			paramName: GetParameter.openNotifications,
			useParamByDefault: true,
			canUseId: false,
		},
		[NavigationMenuItem.settings]: {
			paramName: GetParameter.openSettings,
			useParamByDefault: true,
			canUseId: false,
		},
	};

	const basePath = Path.online;
	const urlConfig = LayoutToUrlConfigMap[layoutName];
	if (!urlConfig)
	{
		return;
	}

	let finalUrl = basePath;
	if (urlConfig.canUseId && layoutEntityId)
	{
		finalUrl += `?${urlConfig.paramName}=${layoutEntityId}`;
	}
	else if (urlConfig.useParamByDefault)
	{
		finalUrl += `?${urlConfig.paramName}`;
	}

	location.href = finalUrl;
}

function changeLayout({ layoutName, layoutEntityId }: LayoutParams)
{
	// The only place where a navigation menu item becomes a layout name, so the menu item of the plain
	// chats is sent to the section where those chats live now. Everything below keeps working on the
	// resolved name: the validity check, the last opened chat and the nested list event.
	const targetLayoutName = layoutName === Layout.chat ? FolderManager.getRegularChatsLayout().name : layoutName;

	const layoutManager = LayoutManager.getInstance();
	if (!layoutManager.isValidLayout(targetLayoutName))
	{
		return;
	}

	const targetLayout = layoutManager.resolveLayoutEntityId({ name: targetLayoutName, entityId: layoutEntityId });

	EventEmitter.emit(EventType.recent.closeNestedList);
	void layoutManager.setLayout(targetLayout);
}
