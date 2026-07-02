import { Dom, Text } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { hint } from 'ui.vue3.directives.hint';
import { BIcon } from 'ui.icon-set.api.vue';
import { Actions, CRM, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.actions';
import 'ui.icon-set.crm';
import 'ui.hint';

import { Button as UiButton, ButtonSize, ButtonColor } from 'booking.component.button';
import { Switcher } from 'booking.component.switcher';
import { Model, NotificationChannel, NotificationFieldsMap, Communication } from 'booking.const';
import { resourceCreationWizardService } from 'booking.provider.service.resource-creation-wizard-service';
import type { NotificationsModel, NotificationsTemplateModel } from 'booking.model.notifications';

import { CheckedForAll } from './components/checked-for-all';
import { Description } from './components/description';
import { MessageBlock } from './components/message-block';
import { AiBlock } from './components/ai-block';
import { ManagerNotification } from './components/manager-notification';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

// @vue/component
export const ResourceNotification = {
	name: 'ResourceNotification',
	components: {
		Switcher,
		BIcon,
		UiButton,
		Description,
		CheckedForAll,
		MessageBlock,
		AiBlock,
		ManagerNotification,
	},
	directives: { hint },
	props: {
		type: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		helpDesk: {
			type: Object,
			required: true,
		},
		checked: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		managerDescription: {
			type: String,
			default: '',
		},
		scrollToCard: {
			type: String,
			default: null,
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
	emits: ['update:checked'],
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
			Actions,
			CRM,
			Outline,
			Communication,
		};
	},
	data(): Object
	{
		return {
			messenger: NotificationChannel.WhatsApp,
		};
	},
	computed: {
		...mapGetters({
			resource: `${Model.ResourceCreationWizard}/getResource`,
			isAiCommunication: `${Model.ResourceCreationWizard}/isAiCommunication`,
		}),
		model(): NotificationsModel
		{
			return this.$store.getters[`${Model.Notifications}/getByType`](this.type);
		},
		template(): NotificationsTemplateModel | undefined
		{
			const templateName = this.resource[this.templateTypeField];

			return this.model.templates.find((template) => template.type === templateName);
		},
		messageTemplate(): string
		{
			return {
				[NotificationChannel.WhatsApp]: this.template?.text ?? '',
				[NotificationChannel.Sms]: this.template?.textSms ?? '',
			}[this.messenger] ?? '';
		},
		hasTemplate(): boolean
		{
			return Boolean(this.messageTemplate);
		},
		disableSwitcher(): boolean
		{
			return this.disabled || !this.senderCanUse;
		},
		templateTypeField(): string
		{
			return NotificationFieldsMap.TemplateType[this.type];
		},
		soonHint(): Object
		{
			return {
				text: this.loc('BRCW_BOOKING_SOON_HINT'),
				popupOptions: {
					offsetLeft: 60,
					targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				},
			};
		},
		isNotificationSettingsFeatureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingNotificationsSettings;
		},
		infoIcon(): string
		{
			return this.isAiCommunication ? Outline.CALL_BACK : CRM.CHAT_LINE;
		},
		infoTitle(): string
		{
			return this.isAiCommunication
				? this.loc('BRCW_NOTIFICATION_CARD_MESSAGE_AI')
				: this.loc('BRCW_NOTIFICATION_CARD_MESSAGE');
		},
	},
	created(): void
	{
		this.hintManager = BX.UI.Hint.createInstance({
			id: `brwc-notification-hint-${Text.getRandom(5)}`,
			popupParameters: {
				targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
			},
		});
	},
	mounted(): void
	{
		this.hintManager.init(this.$el);

		void this.animateHeight(false);
	},
	updated(): void
	{
		this.hintManager.init(this.$el);

		void this.animateHeight(true);
	},
	methods: {
		handleChannelChange(selectedChannel: string): void
		{
			this.messenger = selectedChannel;
		},
		handleTemplateTypeSelected(selectedType: string): void
		{
			void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { [this.templateTypeField]: selectedType });
		},
		getChooseTemplateButton(): HTMLElement | null
		{
			return this.$refs.messageBlock?.getChooseTemplateButton() || null;
		},
		expand(): void
		{
			void resourceCreationWizardService.updateNotificationExpanded(this.type, !this.model.isExpanded);
		},
		async animateHeight(withAnimation: boolean): Promise<void>
		{
			Dom.style(this.$el, 'transition', null);
			if (withAnimation)
			{
				await sleep(10);
			}

			const prevHeight = this.$el.offsetHeight;
			Dom.style(this.$el, 'height', null);
			if (!this.model.isExpanded)
			{
				Dom.style(this.$refs.main, 'display', 'none');
				Dom.style(this.$refs.manager?.$el, 'display', 'none');
			}

			const height = this.$el.offsetHeight;
			Dom.style(this.$refs.main, 'display', null);
			Dom.style(this.$refs.manager?.$el, 'display', null);
			Dom.style(this.$el, 'height', `${prevHeight}px`);

			if (withAnimation)
			{
				Dom.style(this.$el, 'transition', 'height 0.2s');
				await sleep(10);
				Dom.style(this.$el, 'height', `${height}px`);
			}
			else
			{
				Dom.style(this.$el, 'height', `${height}px`);
			}
		},
	},
	template: `
		<div
			class="booking-resource-creation-wizard-notification-container"
			:class="{
				'--disabled': !checked,
				'--locked': !isNotificationSettingsFeatureEnabled,
			}"
		>
			<div class="booking-resource-creation-wizard-notification">
				<div class="booking-resource-creation-wizard-notification-header" @click="expand">
					<div class="booking-resource-creation-wizard-notification-number">{{ ordinal }}</div>
					<div class="booking-resource-creation-wizard-notification-title">{{ title }}</div>
					<BIcon :name="model.isExpanded ? Actions.CHEVRON_UP : Actions.CHEVRON_DOWN"/>
				</div>
				<div class="booking-resource-creation-wizard-notification-main" ref="main">
					<div class="resource-creation-wizard__form-notification-info-title-row --main">
						<BIcon :name="infoIcon"/>
						<div class="resource-creation-wizard__form-notification-info-title">
							{{ infoTitle }}
						</div>
						<Switcher
							v-hint="disableSwitcher && soonHint"
							class="resource-creation-wizard__form-notification-info-switcher"
							:data-id="'brcw-resource-notification-info-switcher-' + type"
							:model-value="checked"
							:disabled="disableSwitcher"
							@update:model-value="$emit('update:checked', $event)"
						/>
					</div>
					<AiBlock
						v-if="isAiCommunication"
						:checked="checked"
						:ordinal
					/>
					<MessageBlock
						v-else
						ref="messageBlock"
						:messenger="messenger"
						:messageTemplate="messageTemplate"
						:hasTemplate="hasTemplate"
						:checked="checked"
						:model="model"
						:currentTemplateType="resource[templateTypeField]"
						@updateChannel="handleChannelChange"
						@templateTypeSelected="handleTemplateTypeSelected"
					/>
					<Description :description="description" :helpDesk="helpDesk"/>
					<slot name="client"/>
					<CheckedForAll :type="type" :disabled="!checked"/>
				</div>
			</div>
			<ManagerNotification
				v-if="$slots.manager"
				:description="managerDescription"
				:text="model.managerNotification"
				:helpDesk="helpDesk"
				:scrollToCard="scrollToCard"
				ref="manager"
			>
				<slot name="manager"/>
			</ManagerNotification>
		</div>
	`,
};
