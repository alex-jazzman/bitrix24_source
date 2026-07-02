/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core) {
	'use strict';

	const EXTENSIONS = ['mail.client.action.discuss-in-chat', 'ui.entity-selector', 'ui.dialogs.messagebox', 'ui.notification'];
	const DiscussInChat = {
		dialog: null,
		activeDialogId: null,
		triggerButton: null,
		currentSource: null,
		sidePanelListenerBound: false,
		preload() {
			this.getRootWindow().BX.Runtime.loadExtension(EXTENSIONS);
		},
		open(messageId, triggerButton, source) {
			if (!main_core.Type.isInteger(messageId)) {
				return;
			}
			this.dialog = null;
			this.triggerButton = triggerButton || null;
			this.currentSource = source || null;
			this.ensureExtensions().then(() => {
				this.dialog = this.createSelectorDialog(messageId);
				if (this.dialog.isOpen()) {
					return;
				}
				this.dialog.show();
			}).catch(() => {
				this.showError(main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_ERROR_IM') ?? '');
			});
		},
		confirmSend(messageId, dialogId) {
			const rootWindow = this.getRootWindow();
			const messageBox = rootWindow.BX.UI.Dialogs.MessageBox;
			const messageBoxButtons = rootWindow.BX.UI.Dialogs.MessageBoxButtons;
			const dialog = this.createSelectorDialog(messageId);
			messageBox.show({
				title: main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_TITLE') ?? '',
				message: main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_DESCRIPTION') ?? '',
				buttons: messageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_ACCEPT') ?? '',
				cancelCaption: main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_CANCEL') ?? '',
				useAirDesign: true,
				popupOptions: {
					closeByEsc: true,
					focusTrap: true
				},
				onOk: messageBoxInstance => {
					messageBoxInstance.close();
					dialog.deselectAll();
					this.closeDialog();
					this.sendToChat(messageId, dialogId);
				},
				onCancel: messageBoxInstance => {
					messageBoxInstance.close();
					dialog.deselectAll();
				}
			});
		},
		sendToChat(messageId, dialogId) {
			const data = {
				dialogId
			};
			if (this.currentSource === 'crm') {
				data.activityId = messageId;
			} else {
				data.messageId = messageId;
			}
			this.getRootWindow().BX.ajax.runAction('mail.secretary.discussMessageInChat', {
				data
			}).then(response => {
				const errors = this.getErrorMessages(response);
				if (errors.length > 0) {
					this.showError(errors.join(', '));
					return;
				}
				this.openMessenger(dialogId);
			}).catch(error => {
				const errors = this.getErrorMessages(error);
				if (errors.length > 0) {
					this.showError(errors.join(', '));
					return;
				}
				this.showError(main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_ERROR_IM') ?? '');
			});
		},
		closeDialog() {
			this.dialog?.hide();
		},
		openMessenger(dialogId) {
			if (!dialogId) {
				return;
			}
			this.getRootWindow().BX.Messenger.Public.openChat(dialogId);
		},
		createSelectorDialog(messageId) {
			const rootWindow = this.getRootWindow();
			const header = this.buildSelectorHeader();
			const dialogId = this.getDialogId(messageId);
			this.activeDialogId = dialogId;
			const DialogClass = rootWindow.BX.UI.EntitySelector.Dialog;
			const existingDialog = DialogClass.getById(dialogId) ?? null;
			if (existingDialog) {
				existingDialog.deselectAll();
				return existingDialog;
			}
			const events = this.getDialogEvents(messageId);
			const dialogOptions = this.getDialogOptions(dialogId, header, events);
			const dialog = new DialogClass(dialogOptions);
			this.bindSelectorHeader(header);
			this.bindSidePanelCloseHandler();
			return dialog;
		},
		getDialogId(messageId) {
			return `mail__discuss-in-chat-${messageId}`;
		},
		getDialogEvents(messageId) {
			return {
				'Item:onSelect': event => {
					const {
						item
					} = event.getData();
					const selectedDialogId = this.getDialogIdByItem(item);
					if (!selectedDialogId) {
						return;
					}
					this.confirmSend(messageId, selectedDialogId);
				},
				onHide: () => {
					this.dialog?.deselectAll();
					this.focusTriggerButton();
				}
			};
		},
		getDialogOptions(dialogId, header, events) {
			return {
				id: dialogId,
				context: 'MAIL_DISCUSS_IN_CHAT',
				targetNode: null,
				multiple: false,
				cacheable: false,
				enableSearch: true,
				addTagOnSelect: false,
				hideOnSelect: false,
				clearSearchOnSelect: true,
				dropdownMode: false,
				compactView: false,
				showAvatars: true,
				autoHide: true,
				width: 400,
				height: 600,
				header,
				footer: null,
				recentTabOptions: {
					itemOrder: {
						sort: 'desc'
					}
				},
				popupOptions: this.getPopupOptions(),
				entities: this.getDialogEntities(),
				events
			};
		},
		getPopupOptions() {
			return {
				overlay: true,
				targetContainer: this.getRootWindow().document.body,
				className: 'mail__discuss-in-chat-popup'
			};
		},
		getDialogEntities() {
			return [this.getRecentEntityOptions()];
		},
		getRecentEntityOptions() {
			return {
				id: 'im-recent-v2',
				dynamicLoad: true,
				dynamicSearch: true,
				fillRecentItems: false,
				options: {
					searchChatTypes: ['C', 'O', 'N', 'J', 'B'],
					fillDialogByRecent: true
				},
				filters: [{
					id: 'mail.discussInChatAppearanceFilter'
				}]
			};
		},
		buildSelectorHeader() {
			return main_core.Tag.render`
			<div class="mail__discuss-in-chat__titlebar">
				<div class="mail__discuss-in-chat__title">
					${main_core.Loc.getMessage('MAIL_DISCUSS_IN_CHAT_SELECT_TITLE') ?? ''}
				</div>
				<button class="mail__discuss-in-chat__close" type="button"></button>
			</div>
		`;
		},
		bindSelectorHeader(header) {
			const closeButton = header.querySelector('.mail__discuss-in-chat__close');
			if (!closeButton) {
				return;
			}
			main_core.Event.bind(closeButton, 'click', () => {
				this.closeDialog();
			});
		},
		getDialogIdByItem(item) {
			if (!item) {
				return null;
			}
			const entityType = item.getEntityType();
			if (entityType === 'im-user') {
				return item.getId().toString();
			}
			if (entityType === 'im-chat') {
				const rawId = item.getId();
				if (main_core.Type.isString(rawId) && rawId.startsWith('chat')) {
					return rawId;
				}
				return `chat${rawId}`;
			}
			return null;
		},
		focusTriggerButton() {
			if (!this.triggerButton) {
				return;
			}
			const triggerWindow = this.triggerButton.ownerDocument.defaultView;
			if (!triggerWindow) {
				this.triggerButton.focus();
				return;
			}
			const slider = this.getRootWindow().BX.SidePanel.Instance.getSliderByWindow(triggerWindow);
			if (slider) {
				slider.getFrameWindow().focus();
			}
			this.triggerButton.focus();
		},
		showError(message) {
			this.getRootWindow().BX.UI.Notification.Center.notify({
				content: message
			});
		},
		getErrorMessages(source) {
			if (!main_core.Type.isPlainObject(source)) {
				return [];
			}
			const {
				errors
			} = source;
			if (!Array.isArray(errors)) {
				return [];
			}
			return errors.filter(item => {
				return main_core.Type.isPlainObject(item) && main_core.Type.isStringFilled(item.message);
			}).map(item => main_core.Text.encode(item.message));
		},
		getRootWindow() {
			return window.top ?? window;
		},
		ensureExtensions() {
			return this.getRootWindow().BX.Runtime.loadExtension(EXTENSIONS).then(() => undefined);
		},
		bindSidePanelCloseHandler() {
			if (this.sidePanelListenerBound) {
				return;
			}
			const rootWindow = this.getRootWindow();
			rootWindow.BX.addCustomEvent('SidePanel.Slider:onClose', () => {
				if (!this.activeDialogId) {
					return;
				}
				const DialogClass = rootWindow.BX.UI.EntitySelector.Dialog;
				const dialog = DialogClass.getById(this.activeDialogId);
				if (!dialog) {
					return;
				}
				this.dialog = dialog;
				this.dialog?.deselectAll();
				this.closeDialog();
			});
			this.sidePanelListenerBound = true;
		}
	};
	DiscussInChat.preload();

	exports.DiscussInChat = DiscussInChat;

})(this.BX.Mail.Client.Action = this.BX.Mail.Client.Action || {}, BX);
//# sourceMappingURL=discuss-in-chat.bundle.js.map
