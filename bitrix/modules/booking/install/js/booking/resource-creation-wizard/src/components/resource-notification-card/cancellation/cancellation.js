import { RichLoc } from 'ui.vue3.components.rich-loc';
import { mapGetters } from 'ui.vue3.vuex';
import 'ui.icon-set.main';

import { HelpDesk, Model } from 'booking.const';
import { LabelDropdown } from '../label/label';
import { ResourceNotification } from '../layout/resource-notification';
import { ResourceNotificationTextRow } from '../layout/resource-notification-text-row';

// @vue/component
export const Cancellation = {
	name: 'ResourceNotificationCardCancellation',
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
	computed: {
		...mapGetters({
			/** @type {ResourceModel} */
			resource: `${Model.ResourceCreationWizard}/getResource`,
			isAiCommunication: `${Model.ResourceCreationWizard}/isAiCommunication`,
		}),
		isCancellationNotificationOn: {
			get(): boolean
			{
				return this.senderCanUse && this.resource.isCancellationNotificationOn;
			},
			set(isCancellationNotificationOn: boolean): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { isCancellationNotificationOn });
			},
		},
		cancellationNotificationDelay: {
			get(): number
			{
				return this.resource.cancellationNotificationDelay;
			},
			set(cancellationNotificationDelay: number): void
			{
				void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { cancellationNotificationDelay });
				this.$refs.card.$forceUpdate();
			},
		},
		locSendCancellationTime(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_CANCELLATION_AI_HELPER_TEXT_SECOND').replace('#time#', '[delay/]')
				: this.loc('BRCW_NOTIFICATION_CARD_CANCELLATION_HELPER_TEXT_SECOND').replace('#time#', '[delay/]');
		},
		helpDesk(): Object
		{
			return HelpDesk.ResourceNotificationCancellation;
		},
		locDescription(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_CANCELLATION_AI_HELPER_TEXT_FIRST')
				: this.loc('BRCW_NOTIFICATION_CARD_CANCELLATION_HELPER_TEXT_FIRST');
		},
	},
	template: `
		<ResourceNotification
			v-model:checked="isCancellationNotificationOn"
			:type="model.type"
			:ordinal
			:senderCanUse
			:title="loc('BRCW_NOTIFICATION_CARD_CANCELLATION_TITLE')"
			:description="locDescription"
			:helpDesk="helpDesk"
			ref="card"
		>
			<template #client>
				<ResourceNotificationTextRow icon="--clock-2">
					<RichLoc :text="locSendCancellationTime" :placeholder="'[delay/]'">
						<template #delay>
							<LabelDropdown
								v-model:value="cancellationNotificationDelay"
								:items="model.settings.notification.delayValues"
							/>
						</template>
					</RichLoc>
				</ResourceNotificationTextRow>
			</template>
		</ResourceNotification>
	`,
};
