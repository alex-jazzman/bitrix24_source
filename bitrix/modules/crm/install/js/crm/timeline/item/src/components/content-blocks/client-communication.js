import { Runtime, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.core';
import { Menu } from 'ui.system.menu';
import 'crm_common';

const CommunicationType = Object.freeze({
	PHONE: 'PHONE',
	EMAIL: 'EMAIL',
	IM: 'IM',
});

// @vue/component
export default {
	props: {
		communications: {
			type: Object,
			required: true,
		},
		ownerTypeId: {
			type: Number,
			required: true,
		},
		ownerId: {
			type: Number,
			required: true,
		},
		entityTypeId: {
			type: Number,
			required: true,
		},
		entityId: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			// check data and deep clone to trigger reactivity on changes
			currentCommunications: JSON.parse(JSON.stringify(this.communications)),
		};
	},

	computed: {
		hasPhone(): boolean
		{
			return this.hasCommunicationType(CommunicationType.PHONE);
		},

		hasEmail(): boolean
		{
			return this.hasCommunicationType(CommunicationType.EMAIL);
		},

		hasIM(): boolean
		{
			return this.hasCommunicationType(CommunicationType.IM);
		},

		phoneItems(): Array
		{
			return this.getCommunicationItems(CommunicationType.PHONE);
		},

		emailItems(): Array
		{
			return this.getCommunicationItems(CommunicationType.EMAIL);
		},

		imItems(): Array
		{
			return this.getCommunicationItems(CommunicationType.IM);
		},

		phoneClassName(): string
		{
			return this.getButtonClassName(CommunicationType.PHONE, this.hasPhone);
		},

		emailClassName(): string
		{
			return this.getButtonClassName(CommunicationType.EMAIL, this.hasEmail);
		},

		imClassName(): string
		{
			return this.getButtonClassName(CommunicationType.IM, this.hasIM);
		},
	},

	watch: {
		communications: {
			handler(newValue) {
				this.currentCommunications = JSON.parse(JSON.stringify(newValue));
			},
			deep: true,
		},
	},

	created(): void
	{
		EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onCommunicationChanged);
	},

	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onCommunicationChanged);
	},

	methods: {
		onCommunicationChanged(event: BaseEvent): void
		{
			const { item, current } = event.getData();
			if (
				this.entityTypeId !== item?.entityTypeId
				|| this.entityId !== item?.entityId
				|| !Type.isArray(current)
			)
			{
				return;
			}

			const data = current.map((receiver: Object) => ({
				id: receiver.address?.id,
				value: receiver.address?.value,
				valueFormatted: receiver.address?.valueFormatted,
				complexName: receiver.address?.valueTypeCaption ?? '',
				title: receiver.valueTypeCaption?.title ?? '',
				typeId: receiver.address?.typeId,
			}));

			this.currentCommunications[CommunicationType.PHONE] = data
				.filter((comm: Object) => comm.typeId === CommunicationType.PHONE)
			;
			this.currentCommunications[CommunicationType.EMAIL] = data
				.filter((comm: Object) => comm.typeId === CommunicationType.EMAIL)
			;
			this.currentCommunications[CommunicationType.IM] = data
				.filter((comm: Object) => comm.typeId === CommunicationType.IM)
			;
		},

		hasCommunicationType(type: string): boolean
		{
			const items = this.currentCommunications[type];

			return Type.isArray(items) && items.length > 0;
		},

		getCommunicationItems(type: string): Array
		{
			const items = this.currentCommunications[type];

			return Type.isArray(items) ? items : [];
		},

		getButtonClassName(type: string, isAvailable: boolean): string
		{
			const baseClass = `crm-timeline__client-communication --${type}`.toLowerCase();

			return isAvailable
				? `${baseClass} crm-timeline__client-communication-available`
				: baseClass
			;
		},

		onPhoneClick(event: PointerEvent): void
		{
			if (!this.hasPhone)
			{
				return;
			}

			if (this.phoneItems.length === 1)
			{
				this.makeCall(this.phoneItems[0].value);

				return;
			}

			this.showCommunicationMenu(event.target, this.phoneItems, CommunicationType.PHONE);
		},

		onEmailClick(event: PointerEvent): void
		{
			if (!this.hasEmail)
			{
				return;
			}

			if (this.emailItems.length === 1)
			{
				this.createEmail(this.emailItems[0].value);

				return;
			}

			this.showCommunicationMenu(event.target, this.emailItems, CommunicationType.EMAIL);
		},

		onChatClick(event: PointerEvent): void
		{
			if (!this.hasIM)
			{
				return;
			}

			if (this.imItems.length === 1)
			{
				this.openChat(this.imItems[0].value);

				return;
			}

			this.showCommunicationMenu(event.target, this.imItems, CommunicationType.IM);
		},

		showCommunicationMenu(anchor: HTMLElement, items: Array, type: string): void
		{
			let menu: Menu = null;

			const iconMap = {
				PHONE: Outline.CALL_BACK,
				EMAIL: Outline.MAIL,
				IM: Outline.CHATS,
			};

			const menuItems = items.map((item) => {
				const value = item.valueFormatted || item.value;

				return {
					title: value,
					subtitle: item.complexName || '',
					design: 'accent-1',
					icon: iconMap[type],
					onClick: (): void => {
						menu.close();

						this.handleMenuItemClick(item.value, type);
					},
				};
			});

			const createMenu = (communicationType: string, communicationItems: Array): Menu => {
				return new Menu({
					id: `crm-timeline-client-communication-menu-${communicationType}-${Math.random().toString()}`,
					animation: 'fading-slide',
					bindElement: anchor,
					autoHide: true,
					angle: true,
					cacheable: false,
					offsetTop: 5,
					offsetLeft: 10,
					items: communicationItems,
				});
			};

			if (Object.values(CommunicationType).includes(type))
			{
				menu = createMenu(type, menuItems);
			}

			menu?.show();
		},

		handleMenuItemClick(value: string, type: string): void
		{
			const handlers = {
				[CommunicationType.PHONE]: (v) => this.makeCall(v),
				[CommunicationType.EMAIL]: (v) => this.createEmail(v),
				[CommunicationType.IM]: (v) => this.openChat(v),
			};

			handlers[type]?.(value);
		},

		makeCall(phone: string): void
		{
			const params = {
				ENTITY_TYPE_NAME: this.getEntityTypeName(this.entityTypeId),
				ENTITY_ID: this.entityId,
				AUTO_FOLD: true,
			};

			if (
				this.ownerTypeId !== this.entityTypeId
				|| this.ownerId !== this.entityId
			)
			{
				params.BINDINGS = [{
					OWNER_TYPE_NAME: this.getEntityTypeName(this.ownerTypeId),
					OWNER_ID: this.ownerId,
				}];
			}

			Runtime.loadExtension('im.public').then((exports: Object) => {
				exports.Messenger.startPhoneCall(phone, params);
			}).catch((exception) => {
				console.error('Error loading "im.public":', exception);
			});
		},

		createEmail(email: string): void
		{
			BX.CrmActivityEditor.addEmail({
				ownerID: this.ownerId,
				ownerType: this.getEntityTypeName(this.ownerTypeId),
				communicationsLoaded: true,
				communications: [
					{
						type: 'EMAIL',
						entityType: this.getEntityTypeName(this.entityTypeId),
						entityId: this.entityId,
						value: email,
					},
				],
			});
		},

		openChat(messengerValue: string): void
		{
			Runtime.loadExtension('im.public.iframe').then((exports: Object) => {
				exports.Messenger.openLines(messengerValue);
			}).catch((exception) => {
				console.error('Error loading "im.public.iframe":', exception);
			});
		},

		getEntityTypeName(typeId: number): string
		{
			return BX.CrmEntityType.resolveName(typeId);
		},
	},

	// language=Vue
	template: `
		<span class="crm-timeline__client-communication-wrapper">
			<a 
				:class="phoneClassName"
				@click="onPhoneClick"
				title="Phone"
			></a>
			<a 
				:class="emailClassName"
				@click="onEmailClick"
				title="Email"
			></a>
			<a 
				:class="imClassName"
				@click="onChatClick"
				title="Messenger"
			></a>
		</span>
	`,
};
