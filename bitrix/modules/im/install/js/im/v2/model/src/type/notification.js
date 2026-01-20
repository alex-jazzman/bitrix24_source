import type { NotificationType } from '../../../component/content/notification/src/const/const';

export type NotificationParams = {
	subject?: string,
	plainText?: string,
	systemIcon?: string,
	entity?: {
		title?: string,
		reaction?: string,
		entityType?: $Values<typeof NotificationType>,
		contentType?: string,
		content?: {
			ids?: number[],
			text?: string,
			value?: string,
			prev?: string,
			next?: string,
			items?: Object[],
		},
	},
}

export type Notification = {
	id: number,
	authorId: number,
	date: Date,
	title: string,
	text: string,
	params: {
		canAnswer: 'Y' | 'N',
		attach: Object[],
		users: number[],
		componentId?: string,
		componentParams?: NotificationParams,
	},
	replaces: Object[],
	notifyButtons: NotificationButton[],
	sectionCode: string,
	read: boolean,
	settingName: string,
	moduleId: string,
};

export type NotificationButton = {
	BG_COLOR: string,
	COMMAND: string,
	COMMAND_PARAMS: string,
	DISPLAY: string,
	TEXT: string,
	TEXT_COLOR: string,
	TYPE: string
};
