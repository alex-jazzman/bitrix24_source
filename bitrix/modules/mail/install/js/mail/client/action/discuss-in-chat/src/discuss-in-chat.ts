import { Event, Loc, Tag, Type, Text } from 'main.core';
import type { Dialog } from 'ui.entity-selector';
import type {
	AjaxErrorItem,
	AjaxResponseWithErrors,
	DialogWindow,
	MessageBoxInstance,
	SendToChatData,
	SelectorDialogEvents,
	SelectorDialogItem,
} from './types';
import './style.css';

const EXTENSIONS = [
	'mail.client.action.discuss-in-chat',
	'ui.entity-selector',
	'ui.dialogs.messagebox',
	'ui.notification',
];

export const DiscussInChat = {
	dialog: null as Dialog | null,
	activeDialogId: null as string | null,
	triggerButton: null as HTMLElement | null,
	currentSource: null as string | null,
	sidePanelListenerBound: false,

	preload(): void
	{
		this.getRootWindow().BX.Runtime.loadExtension(EXTENSIONS);
	},

	open(messageId: number, triggerButton: HTMLElement | null | undefined, source: string | null | undefined): void
	{
		if (!Type.isInteger(messageId))
		{
			return;
		}

		this.dialog = null;
		this.triggerButton = triggerButton || null;
		this.currentSource = source || null;

		this.ensureExtensions()
			.then(() => {
				this.dialog = this.createSelectorDialog(messageId);

				if (this.dialog.isOpen())
				{
					return;
				}

				this.dialog.show();
			})
			.catch(() => {
				this.showError(Loc.getMessage('MAIL_DISCUSS_IN_CHAT_ERROR_IM') ?? '');
			});
	},

	confirmSend(messageId: number, dialogId: string): void
	{
		const rootWindow = this.getRootWindow();
		const messageBox = rootWindow.BX.UI.Dialogs.MessageBox;
		const messageBoxButtons = rootWindow.BX.UI.Dialogs.MessageBoxButtons;
		const dialog = this.createSelectorDialog(messageId);

		messageBox.show({
			title: Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_TITLE') ?? '',
			message: Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_DESCRIPTION') ?? '',
			buttons: messageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_ACCEPT') ?? '',
			cancelCaption: Loc.getMessage('MAIL_DISCUSS_IN_CHAT_CONFIRM_CANCEL') ?? '',
			useAirDesign: true,
			popupOptions: {
				closeByEsc: true,
				focusTrap: true,
			},
			onOk: (messageBoxInstance: MessageBoxInstance) => {
				messageBoxInstance.close();
				dialog.deselectAll();
				this.closeDialog();
				this.sendToChat(messageId, dialogId);
			},
			onCancel: (messageBoxInstance: MessageBoxInstance) => {
				messageBoxInstance.close();
				dialog.deselectAll();
			},
		});
	},

	sendToChat(messageId: number, dialogId: string): void
	{
		const data: SendToChatData = { dialogId };
		if (this.currentSource === 'crm')
		{
			data.activityId = messageId;
		}
		else
		{
			data.messageId = messageId;
		}

		this.getRootWindow().BX.ajax
			.runAction('mail.secretary.discussMessageInChat', {
				data,
			})
			.then((response: AjaxResponseWithErrors) => {
				const errors = this.getErrorMessages(response);
				if (errors.length > 0)
				{
					this.showError(errors.join(', '));

					return;
				}

				this.openMessenger(dialogId);
			})
			.catch((error: unknown) => {
				const errors = this.getErrorMessages(error);
				if (errors.length > 0)
				{
					this.showError(errors.join(', '));

					return;
				}

				this.showError(Loc.getMessage('MAIL_DISCUSS_IN_CHAT_ERROR_IM') ?? '');
			});
	},

	closeDialog(): void
	{
		this.dialog?.hide();
	},

	openMessenger(dialogId: string): void
	{
		if (!dialogId)
		{
			return;
		}

		this.getRootWindow().BX.Messenger.Public.openChat(dialogId);
	},

	createSelectorDialog(messageId: number): Dialog
	{
		const rootWindow = this.getRootWindow();
		const header = this.buildSelectorHeader();
		const dialogId = this.getDialogId(messageId);
		this.activeDialogId = dialogId;

		const DialogClass = rootWindow.BX.UI.EntitySelector.Dialog;

		const existingDialog = DialogClass.getById(dialogId) ?? null;
		if (existingDialog)
		{
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

	getDialogId(messageId: number): string
	{
		return `mail__discuss-in-chat-${messageId}`;
	},

	getDialogEvents(messageId: number): SelectorDialogEvents
	{
		return {
			'Item:onSelect': (event) => {
				const { item } = event.getData();
				const selectedDialogId = this.getDialogIdByItem(item);
				if (!selectedDialogId)
				{
					return;
				}

				this.confirmSend(messageId, selectedDialogId);
			},
			onHide: () => {
				this.dialog?.deselectAll();
				this.focusTriggerButton();
			},
		};
	},

	getDialogOptions(dialogId: string, header: HTMLElement, events: SelectorDialogEvents)
	{
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
				itemOrder: { sort: 'desc' },
			},
			popupOptions: this.getPopupOptions(),
			entities: this.getDialogEntities(),
			events,
		};
	},

	getPopupOptions()
	{
		return {
			overlay: true,
			targetContainer: this.getRootWindow().document.body,
			className: 'mail__discuss-in-chat-popup',
		};
	},

	getDialogEntities()
	{
		return [this.getRecentEntityOptions()];
	},

	getRecentEntityOptions()
	{
		return {
			id: 'im-recent-v2',
			dynamicLoad: true,
			dynamicSearch: true,
			fillRecentItems: false,
			options: {
				searchChatTypes: ['C', 'O', 'N', 'J', 'B'],
				fillDialogByRecent: true,
			},
			filters: [
				{
					id: 'mail.discussInChatAppearanceFilter',
				},
			],
		};
	},

	buildSelectorHeader(): HTMLElement
	{
		return Tag.render`
			<div class="mail__discuss-in-chat__titlebar">
				<div class="mail__discuss-in-chat__title">
					${Loc.getMessage('MAIL_DISCUSS_IN_CHAT_SELECT_TITLE') ?? ''}
				</div>
				<button class="mail__discuss-in-chat__close" type="button"></button>
			</div>
		`;
	},

	bindSelectorHeader(header: HTMLElement): void
	{
		const closeButton = header.querySelector('.mail__discuss-in-chat__close');
		if (!closeButton)
		{
			return;
		}

		Event.bind(closeButton, 'click', () => {
			this.closeDialog();
		});
	},

	getDialogIdByItem(item: SelectorDialogItem | null | undefined): string | null
	{
		if (!item)
		{
			return null;
		}

		const entityType = item.getEntityType();

		if (entityType === 'im-user')
		{
			return item.getId().toString();
		}

		if (entityType === 'im-chat')
		{
			const rawId = item.getId();
			if (Type.isString(rawId) && rawId.startsWith('chat'))
			{
				return rawId;
			}

			return `chat${rawId}`;
		}

		return null;
	},

	focusTriggerButton(): void
	{
		if (!this.triggerButton)
		{
			return;
		}

		const triggerWindow = this.triggerButton.ownerDocument.defaultView;
		if (!triggerWindow)
		{
			this.triggerButton.focus();

			return;
		}

		const slider = this.getRootWindow().BX.SidePanel.Instance.getSliderByWindow(triggerWindow);
		if (slider)
		{
			slider.getFrameWindow().focus();
		}

		this.triggerButton.focus();
	},

	showError(message: string): void
	{
		this.getRootWindow().BX.UI.Notification.Center.notify({
			content: message,
		});
	},

	getErrorMessages(source: AjaxResponseWithErrors | unknown): string[]
	{
		if (!Type.isPlainObject(source))
		{
			return [];
		}

		const { errors } = source as AjaxResponseWithErrors;
		if (!Array.isArray(errors))
		{
			return [];
		}

		return errors
			.filter((item): item is AjaxErrorItem => {
				return Type.isPlainObject(item) && Type.isStringFilled((item as AjaxErrorItem).message);
			})
			.map((item) => Text.encode(item.message));
	},

	getRootWindow(): DialogWindow
	{
		return (window.top ?? window) as DialogWindow;
	},

	ensureExtensions(): Promise<void>
	{
		return this.getRootWindow().BX.Runtime.loadExtension(EXTENSIONS).then(() => undefined);
	},

	bindSidePanelCloseHandler(): void
	{
		if (this.sidePanelListenerBound)
		{
			return;
		}

		const rootWindow = this.getRootWindow();

		rootWindow.BX.addCustomEvent('SidePanel.Slider:onClose', () => {
			if (!this.activeDialogId)
			{
				return;
			}

			const DialogClass = rootWindow.BX.UI.EntitySelector.Dialog;

			const dialog = DialogClass.getById(this.activeDialogId);
			if (!dialog)
			{
				return;
			}

			this.dialog = dialog;
			this.dialog?.deselectAll();
			this.closeDialog();
		});

		this.sidePanelListenerBound = true;
	},
};

DiscussInChat.preload();
