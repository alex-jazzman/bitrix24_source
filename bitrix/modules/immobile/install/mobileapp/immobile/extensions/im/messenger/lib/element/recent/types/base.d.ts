import {AvatarDetail} from "../../chat-avatar/chat-avatar";

export type RecentWidgetItemContextMenuItemStyles = {
	title?: { font?: { color?: string } },
	icon?: { color?: string },
}

export type RecentWidgetItemContextMenuPresentation = {
	sectionCode?: string,
	showTopSeparator?: boolean,
	styles?: RecentWidgetItemContextMenuItemStyles,
	iconName?: string,
}

export type RecentWidgetItemAction = {
	title: string,
	identifier: string,
	color: string,
	iconName: string,
	direction?: string,
	fillOnSwipe?: boolean,
	contextMenu?: RecentWidgetItemContextMenuPresentation,
}

export type RecentWidgetItemContextMenuItem = {
	id: string,
	title: string,
	iconName: string,
	sectionCode: string,
	showTopSeparator?: boolean,
	styles?: RecentWidgetItemContextMenuItemStyles,
}

export type RecentWidgetItemContextMenuSection = {
	id: string,
	title: string,
}

export type RecentWidgetItemContextMenu = {
	sections: Array<RecentWidgetItemContextMenuSection>,
	items: Array<RecentWidgetItemContextMenuItem>,
}

export type RecentWidgetItem = {
	actions: Array<RecentWidgetItemAction>,
	contextMenu?: RecentWidgetItemContextMenu | null,
	avatar: AvatarDetail,
	backgroundColor: string,
	color: string,
	counterTestId: string | null,
	date: number,
	displayedDate: string,
	id: string,
	imageUrl: string,
	isSuperEllipseIcon: boolean,
	menuMode: string,
	messageCount: number,
	params: RecentWidgetItemParams,
	sectionCode: string,
	sortValues: { order: number },
	styles: RecentWidgetItemStyles,
	subtitle: string,
	subtitleAvatar: AvatarDetail | null,
	title: string,
	unread: boolean,
}

export type RecentWidgetItemParams = {
	options: object,
	id: string,
	type: string,
	useLetterImage: boolean,
	disableTap?: boolean,
}

export type RecentWidgetItemStyles = {
	avatar: object,
	counter: { backgroundColor?: string },
	date: {
		image?: { name: string, sizeMultiplier: number },
	},
	subtitle: object,
	title: {
		additionalImage: {},
		font: {
			color: string,
			fontStyle: string,
			useColor: boolean,
		}
	},
}
