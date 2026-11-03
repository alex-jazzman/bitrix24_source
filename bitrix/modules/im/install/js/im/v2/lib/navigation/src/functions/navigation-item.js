import { Layout, NavigationMenuItem, type LayoutType, type NavigationMenuItemType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

const LayoutsWithOwnNavigationItem = Object.freeze({
	[Layout.notification]: NavigationMenuItem.notification,
	[Layout.settings]: NavigationMenuItem.settings,
	[Layout.market]: NavigationMenuItem.market,
});

export const getNavigationItemId = (layoutName: LayoutType): NavigationMenuItemType | '' => {
	const ownItemId = LayoutsWithOwnNavigationItem[layoutName];
	if (ownItemId)
	{
		return ownItemId;
	}

	// With folders on, sections have no menu items of their own, so any other screen, known or
	// unknown, falls back to the messenger item.
	if (FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable))
	{
		return NavigationMenuItem.messenger;
	}

	// Without folders every section keeps its own menu item, so an empty id means the screen has
	// none (folder, conference, chat and folder forms) or is unknown: nothing to highlight.
	return NavigationMenuItem[layoutName] ?? '';
};
