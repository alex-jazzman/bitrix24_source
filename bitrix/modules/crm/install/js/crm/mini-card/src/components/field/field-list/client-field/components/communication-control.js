import { type BitrixVueComponentProps } from 'ui.vue3';
import { Text } from 'main.core';
import { Button, ButtonSize, AirButtonStyle, type ButtonOptions, type ButtonState } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.core';
import { ServiceLocator } from '../../../../../lib/service-locator';

const CommunicationType = Object.freeze({
	Phone: 'PHONE',
	Email: 'EMAIL',
	Im: 'IM',
});

type CommunicationTypeValue = $Values<typeof CommunicationType>;

export const BUTTON_CONFIGURATION: Object<CommunicationTypeValue, ButtonOptions> = Object.freeze({
	[CommunicationType.Phone]: {
		icon: Outline.PHONE_UP,
		removeRightCorners: true,
		dataset: { testid: 'crm-mini-card-communication-phone-btn' },
	},
	[CommunicationType.Email]: {
		icon: Outline.MAIL,
		removeLeftCorners: true,
		removeRightCorners: true,
		dataset: { testid: 'crm-mini-card-communication-email-btn' },
	},
	[CommunicationType.Im]: {
		icon: Outline.OPEN_CHANNELS,
		removeLeftCorners: true,
		dataset: { testid: 'crm-mini-card-communication-im-btn' },
	},
});

export type Communication = {
	typeId: string,
	valueTypeCaption: string,
	valueType: string,
	value: string,
};

export type Entity = {
	entityTypeId: number,
	entityId: number,
	ownerTypeId: number,
	ownerId: number,
};

export const CommunicationControl: BitrixVueComponentProps = {
	name: 'CommunicationControl',

	props: {
		communications: {
			/** @type Communication[] */
			type: Array,
			required: true,
		},
		entity: {
			/** @type Entity */
			type: Object,
			required: true,
		},
	},

	buttons: null,

	data(): Object
	{
		return {
			CommunicationType,
			communicationsByType: {
				[CommunicationType.Phone]: this.filterCommunication(CommunicationType.Phone),
				[CommunicationType.Email]: this.filterCommunication(CommunicationType.Email),
				[CommunicationType.Im]: this.filterCommunication(CommunicationType.Im),
			},
		};
	},

	mounted(): void
	{
		this.createButton(CommunicationType.Phone);
		this.createButton(CommunicationType.Email);
		this.createButton(CommunicationType.Im);
	},

	methods: {
		createButton(typeId: CommunicationTypeValue): Button
		{
			const communicationButtonOptions = BUTTON_CONFIGURATION[typeId];
			const communicationsByType = this.communicationsByType[typeId];

			const isDisabled = communicationsByType.length === 0;

			const buttonOptions: ButtonOptions = {
				size: ButtonSize.EXTRA_SMALL,
				style: AirButtonStyle.OUTLINE,
				useAirDesign: true,
				dropdown: false,
				props: {
					'aria-label': this.getButtonAriaLabel(typeId, isDisabled),
				},
				...communicationButtonOptions,
			};

			if (communicationsByType.length === 1)
			{
				buttonOptions.onclick = () => {
					this.communicate(communicationsByType[0]);
				};
			}

			if (communicationsByType.length > 1)
			{
				buttonOptions.menu = {
					items: communicationsByType.map((communication: Communication) => {
						const itemHtmlContent = this.$Bitrix.Loc.getMessage('CRM_MINI_CARD_FIELD_CLIENT_COMMUNICATION_CONTROL_MENU_ITEM')
							.replace('#VALUE#', Text.encode(communication.value))
							.replace('[VALUE_TYPE_TAG]', '<span style="opacity: .5;">')
							.replace('#VALUE_TYPE#', Text.encode(communication.valueTypeCaption))
							.replace('[/VALUE_TYPE_TAG]', '</span>')
						;

						return {
							html: `<span>${itemHtmlContent}</span>`,
							onclick: () => {
								this.communicate(communication);
							},
						};
					}),
				};
			}

			const button = new Button(buttonOptions);

			this.buttons ??= {};
			this.buttons[typeId] = button;

			if (communicationsByType.length === 0)
			{
				this.disableButton(typeId);
			}

			const menuWindow = button.getMenuWindow();
			if (menuWindow)
			{
				ServiceLocator
					.getInstance()
					.getEventService()
					.registerChildPopup(this.$Bitrix.eventEmitter, menuWindow.getPopupWindow());
			}

			button.renderTo(this.$refs[typeId]);
		},
		disableButton(typeId: CommunicationTypeValue): void
		{
			this.buttons[typeId].setDisabled(true);
			this.setButtonState(typeId, Button.State.DISABLED);
		},
		setButtonState(typeId: CommunicationTypeValue, state: ButtonState | null): void
		{
			this.buttons[typeId].setState(state);
			this.refreshButtonAriaLabel(typeId);
		},
		// The accessible name follows the current availability of the channel,
		// so it stays correct after every state change, not only on creation.
		refreshButtonAriaLabel(typeId: CommunicationTypeValue): void
		{
			const button = this.buttons[typeId];

			button.setProps({
				'aria-label': this.getButtonAriaLabel(typeId, button.isDisabled()),
			});
		},
		getButtonAriaLabel(typeId: CommunicationTypeValue, isDisabled: boolean): string
		{
			const messageCode = {
				[CommunicationType.Phone]: isDisabled
					? 'CRM_MINI_CARD_COMMUNICATION_PHONE_DISABLED'
					: 'CRM_SIP_MGR_MAKE_CALL',
				[CommunicationType.Email]: isDisabled
					? 'CRM_MINI_CARD_COMMUNICATION_EMAIL_DISABLED'
					: 'CRM_MINI_CARD_COMMUNICATION_EMAIL',
				[CommunicationType.Im]: isDisabled
					? 'CRM_MINI_CARD_COMMUNICATION_IM_DISABLED'
					: 'CRM_MINI_CARD_COMMUNICATION_IM',
			}[typeId];

			return this.$Bitrix.Loc.getMessage(messageCode);
		},
		communicate(communication: Communication): void
		{
			const communicationService = ServiceLocator.getInstance().getCommunicationService();

			if (communication.typeId === CommunicationType.Phone)
			{
				communicationService
					.communicateByPhone({
						phone: communication.value,
						entityTypeId: this.entity.entityTypeId,
						entityId: this.entity.entityId,
						ownerTypeId: this.entity.ownerTypeId,
						ownerId: this.entity.ownerId,
					})
				;

				return;
			}

			if (communication.typeId === CommunicationType.Email)
			{
				this.setButtonState(CommunicationType.Email, Button.State.WAITING);

				void communicationService
					.communicateByEmail({
						email: communication.value,
						ownerTypeId: this.entity.ownerTypeId,
						ownerId: this.entity.ownerId,
						entityTypeId: this.entity.entityTypeId,
						entityId: this.entity.entityId,
						activityEditorContainer: this.$refs.activityEditorContainer,
					})
					.finally(() => {
						this.setButtonState(CommunicationType.Email, null);
					})
				;

				return;
			}

			if (communication.typeId === CommunicationType.Im)
			{
				communicationService
					.communicateByIM({
						dialogId: communication.value,
					})
				;
			}
		},
		filterCommunication(typeId: CommunicationTypeValue): Communication[]
		{
			return this.communications.filter((communication: Communication) => communication.typeId === typeId);
		},
	},

	template: `
		<div class="crm-mini-card__communication-control">
			<div class="crm-mini-card__communication-phone" :ref="CommunicationType.Phone"></div>
			<div class="crm-mini-card__communication-mail" :ref="CommunicationType.Email"></div>
			<div class="crm-mini-card__communication-im" :ref="CommunicationType.Im"></div>
			<div hidden ref="activityEditorContainer"></div>
		</div>
	`,
};
