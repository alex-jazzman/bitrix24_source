import { Core } from 'im.v2.application.core';
import { RestMethod, UserStatus, NotificationSettingsMode, Settings } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';

export type NotificationSubscriptionOptions = {
	notifyModule: string;
	notifyEvent: string;
	shouldSubscribe: boolean;
	lastSubscribedTypes: Array<string>;
};

export class SettingsService
{
	changeSetting(settingName: string, value: any): void
	{
		Logger.warn('SettingsService: changeSetting', settingName, value);
		void Core.getStore().dispatch('application/settings/set', {
			[settingName]: value,
		});

		const payload = {
			data: {
				userId: Core.getUserId(),
				name: settingName,
				value,
			},
		};

		runAction(RestMethod.imV2SettingsGeneralUpdate, payload)
			.catch(([error]) => {
				console.error('SettingsService: changeSetting error', error);
			});
	}

	changeStatus(status: string): void
	{
		if (!UserStatus[status])
		{
			return;
		}

		Logger.warn(`SettingsService: changeStatus to ${status}`);
		void Core.getStore().dispatch('users/setStatus', { status });
		void Core.getStore().dispatch('application/settings/set', { status });

		const payload = { STATUS: status };
		Core.getRestClient().callMethod(RestMethod.imUserStatusSet, payload)
			.catch((result: RestResult) => {
				console.error('SettingsService: changeStatus error', result.error());
			});
	}

	async switchScheme(newScheme: $Keys<typeof NotificationSettingsMode>): void
	{
		void Core.getStore().dispatch('application/settings/set', {
			[Settings.notification.mode]: newScheme,
		});

		const newNotificationsSettings = await runAction(RestMethod.imV2SettingsNotifySwitchScheme, {
			data: {
				userId: Core.getUserId(),
				scheme: newScheme,
			},
		}).catch(([error]) => {
			console.error('SettingsService: switchScheme error', error);
		});

		void Core.getStore().dispatch('application/settings/set', {
			notifications: newNotificationsSettings,
		});
	}

	async changeExpertOption(payload: {
		moduleId: string,
		optionName: string,
		type: string,
		value: boolean
	}): Promise<void>
	{
		const { moduleId, optionName, type, value } = payload;
		void Core.getStore().dispatch('application/settings/setNotificationOption', {
			moduleId,
			optionName,
			type,
			value,
		});

		try
		{
			await runAction(RestMethod.imV2SettingsNotifyUpdate, {
				data: {
					userId: Core.getUserId(),
					moduleId,
					name: optionName,
					type,
					value,
				},
			});
		}
		catch ([error])
		{
			console.error('SettingsService: changeExpertOption error', error);
		}
	}

	async toggleSubscription(notificationSubscriptionOptions: NotificationSubscriptionOptions): Promise<void>
	{
		const { notifyModule, notifyEvent, shouldSubscribe, lastSubscribedTypes } = notificationSubscriptionOptions;
		const notificationSettings = Core.getStore().getters['application/settings/get'](Settings.notifications);
		const scheme = Core.getStore().getters['application/settings/get'](Settings.notification.mode);
		if (scheme === NotificationSettingsMode.simple)
		{
			await this.switchScheme(NotificationSettingsMode.expert);
		}

		const notificationSetting = notificationSettings[notifyModule].items[notifyEvent];
		const promises = lastSubscribedTypes.map((type) => {
			return this.changeExpertOption({
				moduleId: notifyModule,
				optionName: notifyEvent,
				type,
				oldValue: notificationSetting[type],
				value: shouldSubscribe,
			});
		});

		return Promise.all(promises);
	}
}
