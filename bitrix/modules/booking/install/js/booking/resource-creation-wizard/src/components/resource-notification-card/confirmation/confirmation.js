import { RichLoc } from 'ui.vue3.components.rich-loc';
import { mapGetters } from 'ui.vue3.vuex';
import 'ui.icon-set.main';

import { HelpDesk, Model } from 'booking.const';
import { CardId } from 'booking.component.cycle-popup';

import { LabelDropdown } from '../label/label';
import { ResourceNotification } from '../layout/resource-notification';
import { ResourceNotificationTextRow } from '../layout/resource-notification-text-row';

// @vue/component
export const Confirmation = {
	name: 'ResourceNotificationCardConfirmation',
	components: {
		ResourceNotification,
		ResourceNotificationTextRow,
		LabelDropdown,
		RichLoc,
	},
	props: {
		/** @type {NotificationsModel} */
		model: {
			type: Object,
			required: true,
		},
		ordinal: {
			type: Number,
			required: true,
		},
		senderCanUse: {
			type: Boolean,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			HelpDesk,
			CardId,
		};
	},
	computed: {
		...mapGetters({
			/** @type {ResourceModel} */
			resource: `${Model.ResourceCreationWizard}/getResource`,
			isAiCommunication: `${Model.ResourceCreationWizard}/isAiCommunication`,
		}),
		isConfirmationNotificationOn: {
			get(): boolean
			{
				return this.senderCanUse && this.resource.isConfirmationNotificationOn;
			},
			set(isConfirmationNotificationOn: boolean): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { isConfirmationNotificationOn });
			},
		},
		confirmationNotificationDelay: {
			get(): number
			{
				return this.resource.confirmationNotificationDelay;
			},
			set(confirmationNotificationDelay: number): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { confirmationNotificationDelay });
				this.$refs.card.$forceUpdate();
			},
		},
		confirmationNotificationRepetitions: {
			get(): number
			{
				return this.resource.confirmationNotificationRepetitions;
			},
			set(confirmationNotificationRepetitions: number): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { confirmationNotificationRepetitions });
				this.$refs.card.$forceUpdate();
			},
		},
		confirmationNotificationRepetitionsInterval: {
			get(): number
			{
				return this.resource.confirmationNotificationRepetitionsInterval;
			},
			set(confirmationNotificationRepetitionsInterval: number): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { confirmationNotificationRepetitionsInterval });
				this.$refs.card.$forceUpdate();
			},
		},
		confirmationCounterDelay: {
			get(): number
			{
				return this.resource.confirmationCounterDelay;
			},
			set(confirmationCounterDelay: number): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { confirmationCounterDelay });
				this.$refs.card.$forceUpdate();
			},
		},
		locSendMessageBefore(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_AI_HELPER_TEXT_SECOND')
					.replace('#days_before#', '[delay/]')
				: this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_HELPER_TEXT_SECOND')
					.replace('#days_before#', '[delay/]');
		},
		locRetryMessage(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_AI_HELPER_TEXT_THIRD')
					.replace('#times#', '[repeat/]')
					.replace('#time_delay#', '[repeatInterval/]')
				: this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_HELPER_TEXT_THIRD')
					.replace('#times#', '[repeat/]')
					.replace('#time_delay#', '[repeatInterval/]');
		},
		locManagerRemindTime(): string
		{
			return this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_MANAGER_REMIND_TIME')
				.replace('#time#', '[delay/]')
			;
		},
		locDescription(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_AI_HELPER_TEXT_FIRST')
				: this.loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_HELPER_TEXT_FIRST_MSGVER_2');
		},
	},
	template: `
		<ResourceNotification
			v-model:checked="isConfirmationNotificationOn"
			:type="model.type"
			:ordinal
			:senderCanUse
			:title="loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_TITLE_MSGVER_2')"
			:description="locDescription"
			:helpDesk="HelpDesk.ResourceNotificationConfirmation"
			:managerDescription="loc('BRCW_NOTIFICATION_CARD_CONFIRMATION_MANAGER_HELPER')"
			:scrollToCard="CardId.Unconfirmed"
			ref="card"
		>
			<template #client>
				<ResourceNotificationTextRow icon="--clock-2">
					<RichLoc :text="locSendMessageBefore" :placeholder="'[delay/]'">
						<template #delay>
							<LabelDropdown v-model:value="confirmationNotificationDelay" :items="model.settings.notification.delayValues"/>
						</template>
					</RichLoc>
				</ResourceNotificationTextRow>
				<ResourceNotificationTextRow icon="--undo-1">
					<RichLoc :text="locRetryMessage" :placeholder="['[repeat/]', '[repeatInterval/]']">
						<template #repeat>
							<LabelDropdown v-model:value="confirmationNotificationRepetitions" :items="model.settings.notification.repeatValues"/>
						</template>
						<template #repeatInterval>
							<LabelDropdown v-model:value="confirmationNotificationRepetitionsInterval" :items="model.settings.notification.repeatIntervalValues"/>
						</template>
					</RichLoc>
				</ResourceNotificationTextRow>
			</template>
			<template #manager>
				<ResourceNotificationTextRow icon="--clock-2">
					<RichLoc :text="locManagerRemindTime" :placeholder="'[delay/]'">
						<template #delay>
							<LabelDropdown v-model:value="confirmationCounterDelay" :items="model.settings.counter.delayValues"/>
						</template>
					</RichLoc>
				</ResourceNotificationTextRow>
			</template>
		</ResourceNotification>
	`,
};
