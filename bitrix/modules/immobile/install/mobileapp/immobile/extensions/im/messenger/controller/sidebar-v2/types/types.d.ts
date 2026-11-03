/* eslint-disable no-unused-vars */

import { DialogId } from '../../../types/common';

type SidebarWidgetHeaderButton = {
	type: string,
	id: string,
	testId: string,
};

type SidebarMenuItem = {
	id: string,
	title: string,
	icon: object, // @see assets/icons/src/main
	testId: string,
	isDestructive?: boolean,
	onItemSelected: () => {},
}

type SidebarContextMenuItem = SidebarMenuItem & {
	sort: number,
};

type SidebarPrimaryActionButton = {
	id: string,
	title: string,
	icon: object, // @see assets/icons/src/main
	onClick: () => {},
	selected?: boolean,
	disabled?: boolean,
	counter?: number,
	testIdSuffix?: string,
	renderCustomContent?: () => {},
	ahaMoment?: string,
	separatorAfter?: boolean,
};

type SidebarViewDefaultProps = {
	dialogId: DialogId,
	primaryActionButtons: SidebarPrimaryActionButton[],
	tabs: SidebarBaseTab[],
	widget: LayoutWidget,
	widgetNavigator: SidebarWidgetNavigator,
	widgetTitle: string,
	chatTitle: ChatTitle,
	isMessagesAutoDeleteDelayEnabled: boolean,
	callbacks?: {
		callUserProfile?: () => any,
	}
};

type SidebarPermissionManagerDefaultProps = {
	dialogId: DialogId,
	dialogHelper: object,
};

type SidebarControllerProps = {
	dialogId: DialogId;
	dialogLocator: Object;
	config?: SidebarHeaderIntegrationConfigParams | {};
	view: SidebarBaseView,
};

type SidebarViewTheme = {
	titleGap?: number,
};

type SidebarWidgetNavigator = {
	backToChat: () => Promise<any>,
	backToChatMessage: (number) => Promise<any>,
	backToDialogs: () => Promise<any>,
};

type SidebarTabProps = SidebarControllerProps

/** How the tab switcher addresses a tab: only the id is guaranteed to be there. */
type SidebarTabDescriptor = {
	id: string,
	title?: string,
};

/** Handed to the tab content that has just taken the screen. */
type SidebarTabSelectedParams = {
	tab: SidebarTabDescriptor,
};

/** Handed to the tab content that has just left the screen. */
type SidebarTabDeselectedParams = {
	tabId: string,
};

/**
 * What the list reports to its content while scrolling: indexes of the rows it
 * shows, grouped by section. Sidebar tabs render a single section, so the payload
 * always carries one entry.
 */
type SidebarViewableRowsPayload = Array<{ items: Array<number> }>;

type UserActionProps = {
	dialogId: DialogId;
	store: Object;
}

type UserActionRestServicePropsType = UserActionProps
