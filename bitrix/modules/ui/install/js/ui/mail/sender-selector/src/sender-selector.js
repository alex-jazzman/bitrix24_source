import { Dom, Tag, Type, Event, ajax, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Loader } from 'main.loader';
import { Dialog } from 'ui.entity-selector';
import { ProviderShowcase } from 'ui.mail.provider-showcase';
import { AliasEditor } from 'ui.mail.sender-editor';
import { Actions, Icon } from 'ui.icon-set.api.core';
import 'ui.icon-set.actions';
import './css/style.css';

type Options = {
	fieldValue?: string | null,
	fieldId?: string | null,
	fieldName?: string | null,
	selectCallback?: Function,
	mailboxes?: Array | null,
	initialSenderId?: number | null,
	initialMailboxId?: number | null,
	isSenderAvailable?: boolean | null,
};

type Sender = {
	id: number,
	mailboxId?: number,
	name: string,
	email: string,
	formated?: string,
};

const senderEntityId = 'sender';
const mailboxEntityId = 'mailbox';

const senderPrefix = 'S';
const mailboxPrefix = 'MB';

export class SenderSelector
{
	#container: HTMLElement | null = null;
	#senderButton: HTMLElement | null = null;
	#senderButtonTextNode: HTMLElement | null = null;
	#loader: Loader;
	#isListUpdated: boolean = true;
	#isSenderAvailable: boolean = false;

	constructor(options: Options)
	{
		this.sender = (options.fieldValue?.length > 0) ? options.fieldValue : null;
		this.fieldId = options.fieldId;
		this.fieldName = options.fieldName;
		this.initialSenderId = Number(options.initialSenderId) || null;
		this.initialMailboxId = Number(options.initialMailboxId) || null;
		this.#isSenderAvailable = options.isSenderAvailable ?? false;
		this.#container = (this.fieldId && this.fieldName) ? this.#renderContainer() : null;
		this.#storeCoordinate(this.initialSenderId, this.initialMailboxId);
		this.#createLoader();
		this.#createSelector();
		this.selectCallback = options.selectCallback;
		this.mailboxes = options.mailboxes;
		if (this.mailboxes)
		{
			this.#updateDialog(this.mailboxes);
		}
	}

	render(): HTMLElement | null
	{
		return this.#container;
	}

	renderTo(targetContainer: HTMLElement): void
	{
		if (Type.isDomNode(targetContainer))
		{
			Dom.append(this.#container, targetContainer);
		}
	}

	setSender(
		itemId: number | string | null = null,
		name: string | null = null,
		email: string | null = null,
		type: string = senderEntityId,
		senderId: number | null = null,
		mailboxId: number | null = null,
	): void
	{
		const prefix = type === mailboxEntityId ? mailboxPrefix : senderPrefix;
		this.selectedItemId = itemId ? `${prefix}_${itemId}` : null;
		const senderName = name;
		const senderEmail = email;
		let selectorText = '';
		if (senderName && senderEmail)
		{
			selectorText = `${senderName} <${senderEmail}>`;
		}
		else if (senderEmail)
		{
			selectorText = `<${senderEmail}>`;
		}

		if (this.selectCallback && !this.#container)
		{
			this.selectCallback(selectorText, '');

			return;
		}

		if (!this.#container)
		{
			return;
		}

		const input = this.#container.querySelector('input');
		this.#storeCoordinate(senderId, mailboxId);
		this.sender = selectorText;
		this.#senderButtonTextNode.innerText = (selectorText.length > 0) ? selectorText : Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_SELECT_NEW_SENDER');
		this.#senderButtonTextNode.title = this.sender;
		Dom.append(this.icon, this.#senderButton);
		input.value = selectorText;
	}

	#storeCoordinate(senderId: ?number, mailboxId: ?number): void
	{
		if (!this.#container)
		{
			return;
		}

		const input = this.#container.querySelector('input');
		input.dataset.senderId = senderId > 0 ? String(senderId) : '';
		input.dataset.mailboxId = mailboxId > 0 ? String(mailboxId) : '';
	}

	#createLoader(): void
	{
		this.#loader = new Loader({
			target: this.#senderButton,
			size: 17,
			mode: 'inline',
		});
	}

	#renderContainer(): HTMLElement
	{
		const icon = new Icon({
			icon: Actions.CHEVRON_DOWN,
			color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-80'),
			size: 16,
		});
		this.icon = icon.render();

		this.#senderButtonTextNode = Tag.render`
			<div class="sender-selector-button-text" title="${this.sender ?? ''}">
				${this.sender ?? Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_SELECT_NEW_SENDER')}
			</div>
		`;
		this.#senderButton = Tag.render`
			<div class="sender-selector-button">
				${this.#senderButtonTextNode}
				${this.icon}
			</div>
		`;

		const { root, senderInput } = Tag.render`
			<div>
				${this.#senderButton}
				<input type="hidden"
					id="${this.fieldId}"
					name="${this.fieldName}"
					value="${this.sender ?? ''}"
					ref="senderInput">
			</div>
		`;

		this.senderInput = senderInput;

		return root;
	}

	#createSelector(): void
	{
		const footerHandler = () => {
			this.senderDialog.hide();
			this.showProviderShowcase();
		};

		const footer = Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${footerHandler}">${Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_ADD_NEW_MAILBOX')}</span>
		`;

		const linkClickHandler = (baseEvent: BaseEvent) => {
			const data = baseEvent.data;
			data.event.preventDefault();
			const item = data.node.getItem();
			const dialog = item.getDialog();
			dialog.hide();
			const customData = item.getCustomData();
			if (item.entityId === mailboxEntityId)
			{
				BX.SidePanel.Instance.open(
					customData.get('href'),
					{
						width: 760,
						cacheable: false,
						events: {
							onClose: () => {
								void this.#updateSenderList();
							},
						},
					},
				);

				return;
			}

			AliasEditor.openSlider({
				senderId: customData.get('id'),
				email: customData.get('email'),
				setSenderCallback: (senderId: string | number, senderName: string, senderEmail: string) => {
					this.setSender(
						senderId,
						senderName,
						senderEmail,
						senderEntityId,
						Number(senderId) || null,
						null,
					);
				},
				updateSenderList: () => {
					void this.#updateSenderList();
				},
			});
		};

		this.senderDialog = new Dialog({
			targetNode: this.#senderButton,
			width: 400,
			height: 300,
			multiple: false,
			enableSearch: true,
			footer,
			dropdownMode: true,
			showAvatars: false,
			compactView: true,
			events: {
				'Item:onSelect': (event) => {
					const { item: selectedItem } = event.getData();
					const customData = selectedItem.getCustomData();
					this.setSender(
						selectedItem.id,
						customData.get('name'),
						customData.get('email'),
						selectedItem.entityId,
						customData.get('senderId'),
						customData.get('mailboxId'),
					);
				},
				'ItemNode:onLinkClick': linkClickHandler,
			},
		});

		Event.bind(this.#senderButton, 'click', () => {
			this.showDialog();
		});
	}

	#updateDialog(senders: Sender[]): void
	{
		this.senderDialog.removeItems();
		const senderName = Tag.unsafe`${this.sender}`;
		senders.forEach((sender: Sender) => {
			if (sender.id)
			{
				this.#addSender(sender);

				const matchesInitialCoordinate = this.initialMailboxId
					? Number(sender.mailboxId) === this.initialMailboxId
					: this.initialSenderId
						? !sender.mailboxId && Number(sender.id) === this.initialSenderId
						: false
				;
				if (
					!this.selectedItemId
					&& (matchesInitialCoordinate || (!this.initialMailboxId && !this.initialSenderId && senderName === `${sender.name} <${sender.email}>`))
				)
				{
					this.selectedItemId = this.#getSelectorSenderId(sender.id, sender.type);
				}
			}
		});
		if (this.selectedItemId)
		{
			const selectedItem = this.senderDialog.getItem({
				id: this.selectedItemId,
				entityId: this.#getSenderTypeByItemId(this.selectedItemId),
			});
			if (selectedItem)
			{
				this.#setSenderFromItem(selectedItem);
				selectedItem.select();
			}
		}
		else
		{
			if (this.initialMailboxId || this.initialSenderId)
			{
				return;
			}

			const items = this.senderDialog.getItems();
			if (items.length > 0)
			{
				const customData = items[0].getCustomData();
				this.setSender(
					items[0].id,
					customData.get('name'),
					customData.get('email'),
					items[0].entityId,
					customData.get('senderId'),
					customData.get('mailboxId'),
				);
				items[0].select();
				this.selectedItemId = items[0].id;
			}
		}
	}

	#setSenderFromItem(item): void
	{
		const customData = item.getCustomData();
		this.setSender(
			item.id,
			customData.get('name'),
			customData.get('email'),
			item.entityId,
			customData.get('senderId'),
			customData.get('mailboxId'),
		);
	}

	#findItemByCoordinate(id: number | string, email: string)
	{
		const normalizedEmail = email.toLowerCase();

		return this.senderDialog.getItems().find((item) => {
			const customData = item.getCustomData();

			return Number(customData.get('senderId')) === Number(id)
				&& String(customData.get('email')).toLowerCase() === normalizedEmail
			;
		}) ?? this.senderDialog.getItems().find((item) => {
			const customData = item.getCustomData();

			return Number(customData.get('mailboxId')) === Number(id)
				&& String(customData.get('email')).toLowerCase() === normalizedEmail
			;
		});
	}

	#loadItems(): Promise
	{
		return ajax.runAction('main.api.mail.sender.getAvailableSenders', {}).then((response) => {
			return response.data;
		}).catch(() => {
			return [];
		});
	}

	async #updateSenderList(): Promise<void>
	{
		this.#isListUpdated = false;
		this.#showLoader();
		this.senderDialog.removeItems();

		try
		{
			const senders = await this.#loadItems();
			if (senders)
			{
				this.#updateDialog(senders);
			}
		}
		catch
		{ /* empty */ }

		this.#hideLoader();
		this.#isListUpdated = true;
	}

	#addSender(sender: Sender): void
	{
		const title = `${sender.name} <${sender.email}>`;
		const id = this.#getSelectorSenderId(sender.id, sender.type);
		const href = sender.type === mailboxEntityId ? sender.editHref : sender.id;
		const mailboxId = Number(sender.mailboxId) || null;
		const senderId = mailboxId ? null : (Number(sender.id) || null);
		this.senderDialog.addItem({
			id,
			tabs: 'recents',
			entityId: sender.type === mailboxEntityId ? mailboxEntityId : senderEntityId,
			link: href ? '#' : null,
			deselectable: false,
			linkTitle: Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_ITEM_LINK_TITLE'),
			title,
			customData: {
				name: sender.name,
				email: sender.email,
				id: sender.id,
				senderId,
				mailboxId,
				formated: sender.formated,
				href,
			},
		});
	}

	showDialog(targetNode: HTMLElement | null = null, selectedSender: string | null = null): void
	{
		if (!this.#isListUpdated)
		{
			return;
		}

		if (!this.senderDialog || (this.senderDialog.getItems().length === 0))
		{
			this.showProviderShowcase();

			return;
		}

		if (targetNode)
		{
			this.senderDialog.setTargetNode(targetNode);
		}

		this.senderDialog.show();
	}

	showProviderShowcase(addSenderCallback?: Function): void
	{
		this.addSenderCallback = addSenderCallback;
		ProviderShowcase.openSlider({
			isSender: this.#isSenderAvailable,
			addSenderCallback,
			setSenderCallback: (
				senderId: number | string,
				senderName: string,
				senderEmail: string,
				coordinate: ?Object = null,
			) => {
				const coordinateId = coordinate?.mailboxId ?? coordinate?.senderId ?? senderId;
				const selectedItem = this.#findItemByCoordinate(coordinateId, senderEmail);
				if (selectedItem)
				{
					this.#setSenderFromItem(selectedItem);
					selectedItem.select();
				}
			},
			updateSenderList: () => {
				return this.#updateSenderList();
			},
		});
	}

	#showLoader(): void
	{
		this.#loader.show();
		Dom.style(this.icon, 'display', 'none');
	}

	#hideLoader(): void
	{
		this.#loader.hide();
		Dom.style(this.icon, 'display', 'block');
	}

	#getSelectorSenderId(id: number | string, entityType: string): string
	{
		return entityType === mailboxEntityId ? `${mailboxPrefix}_${id}` : `${senderPrefix}_${id}`;
	}

	#getSenderTypeByItemId(id: string): string
	{
		const prefix = id.split('_')[0];
		switch (prefix)
		{
			case senderPrefix:
				return senderEntityId;
			case mailboxPrefix:
				return mailboxEntityId;
			default:
				return '';
		}
	}
}
