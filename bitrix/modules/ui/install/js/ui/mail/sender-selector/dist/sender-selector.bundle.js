/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_loader, ui_entitySelector, ui_mail_providerShowcase, ui_mail_senderEditor, ui_iconSet_api_core) {
	'use strict';

	const senderEntityId = 'sender';
	const mailboxEntityId = 'mailbox';
	const senderPrefix = 'S';
	const mailboxPrefix = 'MB';
	class SenderSelector {
		#container = null;
		#senderButton = null;
		#senderButtonTextNode = null;
		#loader;
		#isListUpdated = true;
		#isSenderAvailable = false;
		constructor(options) {
			this.sender = options.fieldValue?.length > 0 ? options.fieldValue : null;
			this.fieldId = options.fieldId;
			this.fieldName = options.fieldName;
			this.#isSenderAvailable = options.isSenderAvailable ?? false;
			this.#container = this.fieldId && this.fieldName ? this.#renderContainer() : null;
			this.#createLoader();
			this.#createSelector();
			this.selectCallback = options.selectCallback;
			this.mailboxes = options.mailboxes;
			if (this.mailboxes) {
				this.#updateDialog(this.mailboxes);
			}
		}
		render() {
			return this.#container;
		}
		renderTo(targetContainer) {
			if (main_core.Type.isDomNode(targetContainer)) {
				main_core.Dom.append(this.#container, targetContainer);
			}
		}
		setSender(senderId = null, name = null, email = null, type = senderEntityId) {
			const prefix = type === mailboxEntityId ? mailboxPrefix : senderPrefix;
			this.selectedItemId = senderId ? `${prefix}_${senderId}` : null;
			const senderName = name;
			const senderEmail = email;
			let selectorText = '';
			if (senderName && senderEmail) {
				selectorText = `${senderName} <${senderEmail}>`;
			} else if (senderEmail) {
				selectorText = `<${senderEmail}>`;
			}
			if (this.selectCallback && !this.#container) {
				this.selectCallback(selectorText, '');
				return;
			}
			if (!this.#container) {
				return;
			}
			const input = this.#container.querySelector('input');
			this.sender = selectorText;
			this.#senderButtonTextNode.innerText = selectorText.length > 0 ? selectorText : main_core.Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_SELECT_NEW_SENDER');
			this.#senderButtonTextNode.title = this.sender;
			main_core.Dom.append(this.icon, this.#senderButton);
			input.value = selectorText;
		}
		#createLoader() {
			this.#loader = new main_loader.Loader({
				target: this.#senderButton,
				size: 17,
				mode: 'inline'
			});
		}
		#renderContainer() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CHEVRON_DOWN,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-80'),
				size: 16
			});
			this.icon = icon.render();
			this.#senderButtonTextNode = main_core.Tag.render`
			<div class="sender-selector-button-text" title="${this.sender ?? ''}">
				${this.sender ?? main_core.Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_SELECT_NEW_SENDER')}
			</div>
		`;
			this.#senderButton = main_core.Tag.render`
			<div class="sender-selector-button">
				${this.#senderButtonTextNode}
				${this.icon}
			</div>
		`;
			const {
				root,
				senderInput
			} = main_core.Tag.render`
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
		#createSelector() {
			const footerHandler = () => {
				this.senderDialog.hide();
				this.showProviderShowcase();
			};
			const footer = main_core.Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${footerHandler}">${main_core.Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_ADD_NEW_MAILBOX')}</span>
		`;
			const linkClickHandler = baseEvent => {
				const data = baseEvent.data;
				data.event.preventDefault();
				const item = data.node.getItem();
				const dialog = item.getDialog();
				dialog.hide();
				const customData = item.getCustomData();
				if (item.entityId === mailboxEntityId) {
					BX.SidePanel.Instance.open(customData.get('href'), {
						width: 760,
						cacheable: false,
						events: {
							onClose: () => {
								this.setSender();
								void this.#updateSenderList();
							}
						}
					});
					return;
				}
				ui_mail_senderEditor.AliasEditor.openSlider({
					senderId: customData.get('id'),
					email: customData.get('email'),
					setSenderCallback: (senderId, senderName, senderEmail) => {
						this.setSender(senderId, senderName, senderEmail);
					},
					updateSenderList: () => {
						void this.#updateSenderList();
					}
				});
			};
			this.senderDialog = new ui_entitySelector.Dialog({
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
					'Item:onSelect': event => {
						const {
							item: selectedItem
						} = event.getData();
						const selectedItemName = selectedItem.getCustomData().get('name');
						const selectedItemEmail = selectedItem.getCustomData().get('email');
						this.setSender(selectedItem.id, selectedItemName, selectedItemEmail);
					},
					'ItemNode:onLinkClick': linkClickHandler
				}
			});
			main_core.Event.bind(this.#senderButton, 'click', () => {
				this.showDialog();
			});
		}
		#updateDialog(senders) {
			this.senderDialog.removeItems();
			const senderName = main_core.Tag.unsafe`${this.sender}`;
			senders.forEach(sender => {
				if (sender.id) {
					this.#addSender(sender);
					if (!this.selectedItemId && senderName === `${sender.name} <${sender.email}>`) {
						this.selectedItemId = this.#getSelectorSenderId(sender.id, sender.type);
					}
				}
			});
			if (this.selectedItemId) {
				const selectedItem = this.senderDialog.getItem({
					id: this.selectedItemId,
					entityId: this.#getSenderTypeByItemId(this.selectedItemId)
				});
				selectedItem?.select();
			} else {
				const items = this.senderDialog.getItems();
				if (items.length > 0) {
					this.setSender(items[0].id, items[0].getCustomData().get('name'), items[0].getCustomData().get('email'));
					items[0].select();
					this.selectedItemId = items[0].id;
				}
			}
		}
		#loadItems() {
			return main_core.ajax.runAction('main.api.mail.sender.getAvailableSenders', {}).then(response => {
				return response.data;
			}).catch(() => {
				return [];
			});
		}
		async #updateSenderList() {
			this.#isListUpdated = false;
			this.#showLoader();
			this.senderDialog.removeItems();
			try {
				const senders = await this.#loadItems();
				if (senders) {
					this.#updateDialog(senders);
				}
			} catch {/* empty */}
			this.#hideLoader();
			this.#isListUpdated = true;
		}
		#addSender(sender) {
			const title = `${sender.name} <${sender.email}>`;
			const id = this.#getSelectorSenderId(sender.id, sender.type);
			const href = sender.type === mailboxEntityId ? sender.editHref : sender.id;
			this.senderDialog.addItem({
				id,
				tabs: 'recents',
				entityId: sender.type === mailboxEntityId ? mailboxEntityId : senderEntityId,
				link: href ? '#' : null,
				deselectable: false,
				linkTitle: main_core.Loc.getMessage('UI_MAIL_SENDER_SLIDER_SELECTOR_ITEM_LINK_TITLE'),
				title,
				customData: {
					name: sender.name,
					email: sender.email,
					id: sender.id,
					formated: sender.formated,
					href
				}
			});
		}
		showDialog(targetNode = null, selectedSender = null) {
			if (!this.#isListUpdated) {
				return;
			}
			if (!this.senderDialog || this.senderDialog.getItems().length === 0) {
				this.showProviderShowcase();
				return;
			}
			if (targetNode) {
				this.senderDialog.setTargetNode(targetNode);
			}
			this.senderDialog.show();
		}
		showProviderShowcase(addSenderCallback) {
			this.addSenderCallback = addSenderCallback;
			ui_mail_providerShowcase.ProviderShowcase.openSlider({
				isSender: this.#isSenderAvailable,
				addSenderCallback,
				setSenderCallback: (senderId, senderName, senderEmail) => {
					this.setSender(senderId, senderName, senderEmail);
				},
				updateSenderList: () => {
					void this.#updateSenderList();
				}
			});
		}
		#showLoader() {
			this.#loader.show();
			main_core.Dom.style(this.icon, 'display', 'none');
		}
		#hideLoader() {
			this.#loader.hide();
			main_core.Dom.style(this.icon, 'display', 'block');
		}
		#getSelectorSenderId(id, entityType) {
			return entityType === mailboxEntityId ? `${mailboxPrefix}_${id}` : `${senderPrefix}_${id}`;
		}
		#getSenderTypeByItemId(id) {
			const prefix = id.split('_')[0];
			switch (prefix) {
				case senderPrefix:
					return senderEntityId;
				case mailboxPrefix:
					return mailboxEntityId;
				default:
					return '';
			}
		}
	}

	exports.SenderSelector = SenderSelector;

})(this.BX.UI.Mail = this.BX.UI.Mail || {}, BX, BX, BX.UI.EntitySelector, BX.UI.Mail, BX.UI.Mail, BX.UI.IconSet);
//# sourceMappingURL=sender-selector.bundle.js.map
