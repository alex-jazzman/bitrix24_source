export type NotificationsState = {
	notifications: { [type: string]: NotificationsModel },
	senders: { [type: string]: NotificationsSenderModel },
};

export type NotificationsModel = {
	type: string,
	templates: NotificationsTemplateModel[],
	managerNotification: string,
	isExpanded: boolean,
	settings: {
		counter: {
			delayValues: SettingsValue[],
		},
		notification: {
			delayValues: SettingsValue[],
			repeatValues: SettingsValue[],
			repeatIntervalValues: SettingsValue[],
		},
	},
};

export type SettingsValue = {
	name: string,
	value: number,
};

export type NotificationsTemplateModel = {
	type: string,
	text: string,
	textSms: string,
};

export type NotificationItem = { name: string, value: string };

export type SenderNotifications = {
	Info?: NotificationItem,
	Confirmation?: NotificationItem,
	Reminder?: NotificationItem,
	Delayed?: NotificationItem,
	Cancellation?: NotificationItem,
	Feedback?: NotificationItem,
};

export type NotificationsSenderModel = {
	code: string,
	canUse: boolean,
	notifications: SenderNotifications,
};
