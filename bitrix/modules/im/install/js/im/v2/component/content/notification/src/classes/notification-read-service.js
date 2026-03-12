import { Runtime, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RestMethod, NotificationTypesCodes } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';

export class NotificationReadService
{
	store: Object;
	restClient: Object;
	itemsToRead = new Set();
	readRequestWithDebounce: Function;
	readOnClientWithDebounce: Function;
	changeReadStatusBlockTimeout = {};

	constructor()
	{
		this.store = Core.getStore();
		this.restClient = Core.getRestClient();
		this.readOnClientWithDebounce = Runtime.debounce(this.readOnClient, 50, this);
		this.readRequestWithDebounce = Runtime.debounce(this.readRequest, 500, this);
	}

	addToReadQueue(notificationIds: number[]): void
	{
		if (!Type.isArrayFilled(notificationIds))
		{
			return;
		}

		notificationIds.forEach((id: number) => {
			if (!Type.isNumber(id))
			{
				return;
			}

			const notification = this.store.getters['notifications/getById'](id);
			if (notification.read)
			{
				return;
			}

			this.itemsToRead.add(id);
		});
	}

	read(): void
	{
		this.readOnClientWithDebounce();
		this.readRequestWithDebounce();
	}

	readRequest(): void
	{
		if (this.itemsToRead.size === 0)
		{
			return;
		}

		const allNotifications = this.store.getters['notifications/getSortedCollection'];

		const confirmNotifications = allNotifications.filter((notification) => {
			return notification.sectionCode === NotificationTypesCodes.confirm;
		});

		const confirmNotificationIds = new Set(confirmNotifications.map((notification) => notification.id));

		const allIdsToRead = [...this.itemsToRead];

		const notificationsToReadIds = allIdsToRead.filter((id) => {
			return !confirmNotificationIds.has(id);
		});

		if (notificationsToReadIds.length === 0)
		{
			this.itemsToRead.clear();

			return;
		}

		const params = {
			ids: notificationsToReadIds,
		};

		runAction(RestMethod.imV2NotifyRead, { data: params })
			.then((response) => {
				Logger.warn(`I have read all the notifications, total: ${notificationsToReadIds.length}`, response);
			})
			.catch((result: RestResult) => {
				console.error('NotificationReadService: readRequest error', result.error());
			});

		this.itemsToRead.clear();
	}

	readOnClient()
	{
		this.store.dispatch('notifications/read', { ids: [...this.itemsToRead], read: true });
	}

	readAll(excludeIds: number[] = []): void
	{
		this.store.dispatch('notifications/readAllSimple', { excludeIds });

		const params = {
			ids: excludeIds,
		};

		runAction(RestMethod.imV2NotifyReadAll, { data: params })
			.then((response) => {
				const currentCounter = this.store.getters['notifications/getCounter'];
				const newCounter = response.counter;
				if (newCounter < currentCounter)
				{
					void this.store.dispatch('notifications/setCounter', newCounter);
				}

				Logger.warn(`I have read ALL the notifications, excluded: ${excludeIds.length}`, response);
			})
			.catch((result: RestResult) => {
				console.error('NotificationReadService: readAll error', result);
			});
	}

	changeReadStatus(notificationId: number): void
	{
		let notification = this.store.getters['notifications/getById'](notificationId);
		let fromSearchCollection = false;

		if (!notification)
		{
			notification = this.store.getters['notifications/getSearchItemById'](notificationId);
			fromSearchCollection = true;
		}

		if (!notification)
		{
			return;
		}

		if (fromSearchCollection)
		{
			this.store.commit('notifications/updateSearchResult', [
				{ id: notification.id, fields: { read: !notification.read } },
			]);
		}
		else
		{
			this.store.dispatch('notifications/read', { ids: [notification.id], read: !notification.read });
		}

		clearTimeout(this.changeReadStatusBlockTimeout[notification.id]);
		this.changeReadStatusBlockTimeout[notification.id] = setTimeout(() => {
			this.restClient.callMethod(RestMethod.imNotifyRead, {
				id: notification.id,
				action: notification.read ? 'N' : 'Y',
				only_current: 'Y',
			}).then(() => {
				Logger.warn(`Notification ${notification.id} unread status set to ${!notification.read}`);
			}).catch((result: RestResult) => {
				console.error('NotificationReadService: changeReadStatus error', result.error());
				// revert?
			});
		}, 1500);
	}

	destroy()
	{
		Logger.warn('Notification read service destroyed');
	}
}
