import { NotificationSettingsType, type NotificationSettingsItem } from 'im.v2.const';
import { SettingsService } from 'im.v2.provider.service.settings';

import { CheckboxOption } from '../../../../elements/checkbox';

import type { JsonObject } from 'main.core';

// @vue/component
export const NotificationItem = {
	name: 'NotificationItem',
	components: { CheckboxOption },
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		blockId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		NotificationSettingsType: () => NotificationSettingsType,
		notification(): NotificationSettingsItem
		{
			return this.item;
		},
		disabledForWeb(): boolean
		{
			return this.notification.disabled.includes(NotificationSettingsType.web);
		},
		disabledForMail(): boolean
		{
			return this.notification.disabled.includes(NotificationSettingsType.mail);
		},
		disabledForPush(): boolean
		{
			return this.notification.disabled.includes(NotificationSettingsType.push);
		},
	},
	methods:
	{
		onItemChange(newValue: boolean, type: $Values<typeof NotificationSettingsType>)
		{
			this.getSettingsService().changeExpertOption({
				moduleId: this.blockId,
				optionName: this.notification.id,
				type,
				value: newValue,
			});
		},
		getSettingsService(): SettingsService
		{
			if (!this.settingsService)
			{
				this.settingsService = new SettingsService();
			}

			return this.settingsService;
		},
	},
	template: `
		<div class="bx-im-settings-expert-notifications-item__container">
			<div class="bx-im-settings-expert-notifications-item__title">
				{{ notification.label }}
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --web">
				<CheckboxOption :value="notification.site" :disabled="disabledForWeb" @change="onItemChange($event, NotificationSettingsType.web)" />
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --mail">
				<CheckboxOption :value="notification.mail" :disabled="disabledForMail" @change="onItemChange($event, NotificationSettingsType.mail)" />
			</div>
			<div class="bx-im-settings-expert-notifications-item__type --push">
				<CheckboxOption :value="notification.push" :disabled="disabledForPush" @change="onItemChange($event, NotificationSettingsType.push)" />
			</div>
		</div>
	`,
};
