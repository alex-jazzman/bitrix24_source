import { mapGetters } from 'ui.vue3.vuex';
import 'ui.forms';
import 'ui.layout-form';
import type { BitrixVueComponentProps } from 'ui.vue3';

import { Model, Communication } from 'booking.const';
import type { NotificationsModel, NotificationsSenderModel } from 'booking.model.notifications';
import { BaseInfo } from './base-info/base-info';
import { Confirmation } from './confirmation/confirmation';
import { Reminder } from './reminder/reminder';
import { Feedback } from './feedback/feedback';
import { Late } from './late/late';
import { Cancellation } from './cancellation/cancellation';
import { TariffInfo } from './tariff-info/tariff-info';
import { MethodsCommunication } from './methods-communication/methods-communication';
import { AiSettings } from './ai-settings/ai-settings';

import './resource-notification-card.css';

// @vue/component
export const ResourceNotificationCard = {
	name: 'ResourceNotificationCard',
	components: {
		TariffInfo,
		MethodsCommunication,
		AiSettings,
	},
	computed: {
		...mapGetters({
			notifications: `${Model.Notifications}/get`,
			dictionary: `${Model.Dictionary}/getNotifications`,
			senders: `${Model.Notifications}/getSenders`,
			resource: `${Model.ResourceCreationWizard}/getResource`,
			isAiCommunication: `${Model.ResourceCreationWizard}/isAiCommunication`,
		}),
		availableSenders(): NotificationsSenderModel[]
		{
			return this.senders.filter((s) => (
				s.code !== Communication.AiCall
				|| s.canUse
				|| s.code === this.resource.senderCode
			));
		},
		needShowSenderSelector(): boolean
		{
			return this.availableSenders.length > 1;
		},
		activeSender(): NotificationsSenderModel | null
		{
			return this.senders.find((s) => s.code === this.resource.senderCode) ?? this.senders[0] ?? null;
		},
		activeSenderCanUse(): boolean
		{
			return this.activeSender?.canUse ?? false;
		},
		supportedNotificationTypes(): string[]
		{
			if (!this.activeSender?.notifications)
			{
				return [];
			}

			return Object.values(this.activeSender.notifications).map((n) => n.value);
		},
		notificationViews(): { view: BitrixVueComponentProps, model: NotificationsModel, ordinal: number }[]
		{
			return this.notifications
				.filter((model: NotificationsModel) => this.supportedNotificationTypes.includes(model.type))
				.map((model: NotificationsModel, index: number) => {
					const ordinal = index + 1;

					return {
						[this.dictionary.Info.value]: { view: BaseInfo, model, ordinal },
						[this.dictionary.Confirmation.value]: { view: Confirmation, model, ordinal },
						[this.dictionary.Reminder.value]: { view: Reminder, model, ordinal },
						[this.dictionary.Delayed.value]: { view: Late, model, ordinal },
						[this.dictionary.Feedback.value]: { view: Feedback, model, ordinal },
						[this.dictionary.Cancellation.value]: { view: Cancellation, model, ordinal },
					}[model.type] ?? {};
				})
			;
		},
	},
	template: `
		<div class="resource-notification-card">
			<TariffInfo/>
			<template v-if="needShowSenderSelector" >
				<MethodsCommunication :senders="availableSenders"/>
				<template v-if="isAiCommunication">
					<AiSettings/>
				</template>
			</template>
			<slot v-for="notification of notificationViews" :key="notification.view">
				<component
					:is="notification.view"
					:model="notification.model"
					:ordinal="notification.ordinal"
					:senderCanUse="activeSenderCanUse"
					:data-id="'brcw-resource-notification-view-' + notification.view"
				/>
			</slot>
		</div>
	`,
};
