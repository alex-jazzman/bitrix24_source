const MAX_NOTIFICATION_COUNT = 5;

export class FloorRequestNotificationManager
{
	constructor()
	{
		this.notifications = [];
	}

	addNotification(notification)
	{
		const onDestroy = () => {
			notification.unsubscribe('onDestroy', onDestroy);
			this.#onNotificationDestroy(notification);
		};
		notification.subscribe('onDestroy', onDestroy);
		this.notifications.push(notification);

		if (this.notifications.length > MAX_NOTIFICATION_COUNT)
		{
			const firstNotification = this.notifications.shift();
			firstNotification.dismount();
		}
	}

	#onNotificationDestroy(notification)
	{
		const index = this.notifications.indexOf(notification);

		if (index !== -1)
		{
			this.notifications.splice(index, 1);
		}
	}
}

export const NotificationManager = new FloorRequestNotificationManager();
