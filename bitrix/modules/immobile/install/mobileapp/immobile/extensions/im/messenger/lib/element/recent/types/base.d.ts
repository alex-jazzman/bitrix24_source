import {AvatarDetail} from "../../chat-avatar/chat-avatar";

export type RecentWidgetItemAction = {
	title: string,
	identifier: string,
	color: string,
	iconName: string,
	direction?: string,
	fillOnSwipe?: boolean,
}

export type RecentWidgetItem = {
	actions: Array<RecentWidgetItemAction>,
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
