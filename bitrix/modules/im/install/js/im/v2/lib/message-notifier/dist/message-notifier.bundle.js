/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_notificationManager, im_public, im_v2_application_core, im_v2_const, im_v2_lib_desktop, im_v2_lib_desktopApi, im_v2_lib_parser, im_v2_lib_soundNotification, im_v2_provider_service_notification) {
	'use strict';

	const NotificationIdPrefix = {
		chat: 'im_chat',
		taskComments: 'im_task_comments',
		lines: 'im_lines',
		notify: 'im_notify'
	};
	const ID_SEPARATOR = '-';
	const NotificationId = {
		build(payload) {
			const {
				prefix
			} = payload;
			if (prefix === NotificationIdPrefix.notify) {
				const {
					notifyId
				} = payload;
				return `${prefix}${ID_SEPARATOR}${notifyId}`;
			}
			const {
				dialogId,
				messageId
			} = payload;
			return `${prefix}${ID_SEPARATOR}${dialogId}${ID_SEPARATOR}${messageId}`;
		},
		parse(notificationId) {
			const parts = notificationId.split(ID_SEPARATOR);
			const [prefix] = parts;
			if (prefix === NotificationIdPrefix.notify) {
				const [, notifyId] = parts;
				return {
					prefix,
					notifyId
				};
			}
			const [, dialogId, messageId] = parts;
			return {
				prefix,
				dialogId,
				messageId
			};
		}
	};

	class MessageOptionsBuilder {
		#message;
		#chat;
		#user;
		#isLines;
		constructor(context) {
			const {
				message,
				chat,
				user,
				isLines
			} = context;
			this.#message = message;
			this.#chat = chat;
			this.#user = user;
			this.#isLines = isLines;
		}
		build() {
			return {
				id: this.#getId(),
				title: this.#chat.name,
				icon: this.#getAvatarUrl(),
				text: this.#getText()
			};
		}
		#getId() {
			const prefixMap = [{
				condition: () => this.#isLines,
				prefix: NotificationIdPrefix.lines
			}, {
				condition: () => this.#chat.type === im_v2_const.ChatType.taskComments,
				prefix: NotificationIdPrefix.taskComments
			}];
			let prefix = NotificationIdPrefix.chat;
			const foundItem = prefixMap.find(record => record.condition() === true);
			if (foundItem) {
				prefix = foundItem.prefix;
			}
			return NotificationId.build({
				prefix,
				dialogId: this.#chat.dialogId,
				messageId: this.#message.id
			});
		}
		#getAvatarUrl() {
			return this.#chat.avatar || this.#user?.avatar;
		}
		#getText() {
			let text = '';
			if (this.#chat.type !== im_v2_const.ChatType.user && this.#user) {
				text += `${this.#user.name}: `;
			}
			text += im_v2_lib_parser.Parser.purifyMessage(this.#message);
			return text;
		}
	}

	const ACTION_BUTTON_PREFIX = 'button_';
	const ButtonNumber = {
		first: '1',
		second: '2'
	};
	const NotifierShowMessageAction = {
		skip: 'skip',
		show: 'show'
	};
	class MessageNotifierManager {
		static #instance;
		#store;
		#notificationService;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		static init() {
			MessageNotifierManager.getInstance();
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#notificationService = new im_v2_provider_service_notification.NotificationService();
			this.#subscribeToNotifierEvents();
		}
		async handleIncomingMessage(params) {
			const {
				isImportant,
				dialogId
			} = params;
			if (await this.#shouldSkipNotification(dialogId)) {
				this.#playOpenedChatMessageSound(isImportant);
				return;
			}
			this.#playMessageSound(isImportant);
			this.#flashDesktopIcon();
			MessageNotifierManager.getInstance().showMessage(params);
		}
		handleIncomingNotification(params) {
			const {
				notificationId,
				userId,
				isSilent
			} = params;
			const notification = this.#store.getters['notifications/getById'](notificationId);
			const user = this.#store.getters['users/get'](userId);
			if (!isSilent) {
				im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.reminder);
			}
			this.#flashDesktopIcon();
			MessageNotifierManager.getInstance().showNotification(notification, user);
		}
		showMessage(params) {
			const {
				messageId,
				dialogId,
				isLines
			} = params;
			const message = this.#store.getters['messages/getById'](messageId);
			const chat = this.#store.getters['chats/get'](dialogId, true);
			const user = this.#store.getters['users/get'](message.authorId);
			const builder = new MessageOptionsBuilder({
				message,
				chat,
				user,
				isLines
			});
			const notificationOptions = builder.build();
			const isDesktopFocused = im_v2_lib_desktop.DesktopManager.isChatWindow() && document.hasFocus();
			if (isDesktopFocused) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider(notificationOptions);
			} else {
				ui_notificationManager.Notifier.notify(notificationOptions);
			}
		}
		showNotification(notification, user) {
			let title = main_core.Loc.getMessage('IM_LIB_NOTIFIER_NOTIFY_SYSTEM_TITLE');
			if (notification.title) {
				title = notification.title;
			} else if (user) {
				title = user.name;
			}
			const notificationOptions = this.#prepareNotificationOptions(title, notification, user);
			const isDesktopFocused = im_v2_lib_desktop.DesktopManager.isChatWindow() && document.hasFocus();
			if (isDesktopFocused) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider(notificationOptions);
			} else {
				ui_notificationManager.Notifier.notify(notificationOptions);
			}
		}
		onNotifierClick(params) {
			const {
				id
			} = params;
			const {
				prefix,
				dialogId
			} = NotificationId.parse(id);
			if (prefix === NotificationIdPrefix.chat) {
				void im_public.Messenger.openChat(dialogId);
			} else if (prefix === NotificationIdPrefix.taskComments) {
				void im_public.Messenger.openTaskComments(dialogId);
			} else if (prefix === NotificationIdPrefix.lines) {
				void im_public.Messenger.openLines(dialogId);
			} else if (prefix === NotificationIdPrefix.notify) {
				void im_public.Messenger.openNotifications();
			}
		}
		#prepareNotificationOptions(title, notification, user) {
			const id = NotificationId.build({
				prefix: NotificationIdPrefix.notify,
				notifyId: notification.id
			});
			const notificationOptions = {
				id,
				title,
				icon: user ? user.avatar : '',
				text: im_v2_lib_parser.Parser.purifyNotification(notification)
			};
			if (notification.sectionCode === im_v2_const.NotificationTypesCodes.confirm) {
				const [firstButton, secondButton] = notification.notifyButtons;
				notificationOptions.button1Text = firstButton.TEXT;
				notificationOptions.button2Text = secondButton.TEXT;
			} else if (notification.params?.canAnswer === 'Y') {
				notificationOptions.inputPlaceholderText = main_core.Loc.getMessage('IM_LIB_NOTIFIER_NOTIFY_REPLY_PLACEHOLDER');
			}
			return notificationOptions;
		}
		#subscribeToNotifierEvents() {
			ui_notificationManager.Notifier.subscribe('click', async event => {
				if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
					this.onNotifierClick(event.getData());
					return;
				}
				await im_v2_lib_desktopApi.DesktopApi.showBrowserWindow();
				if (im_v2_lib_desktopApi.DesktopApi.isFeatureSupported(im_v2_lib_desktopApi.DesktopFeature.portalTabActivation.id)) {
					await im_v2_lib_desktopApi.DesktopApi.handlePortalTabActivation();
				}
				im_v2_lib_desktop.DesktopBroadcastManager.getInstance().sendActionMessage({
					action: im_v2_const.DesktopBroadcastAction.notification,
					params: event.getData()
				});
			});
			ui_notificationManager.Notifier.subscribe('action', event => {
				this.#onNotifierAction(event.getData());
			});
		}
		#onNotifierAction(params) {
			const {
				id,
				action,
				userInput
			} = params;
			const {
				prefix,
				notifyId
			} = NotificationId.parse(id);
			if (prefix !== NotificationIdPrefix.notify) {
				return;
			}
			const notification = this.#store.getters['notifications/getById'](notifyId);
			if (userInput) {
				this.#onNotifierQuickAnswer(notification, userInput);
			} else if (this.#isConfirmButtonAction(action, notification)) {
				this.#onNotifierButtonClick(action, notification);
			}
		}
		#onNotifierQuickAnswer(notification, text) {
			this.#notificationService.sendQuickAnswer({
				id: notification.id,
				text
			});
		}
		#onNotifierButtonClick(action, notification) {
			const [firstButton, secondButton] = notification.notifyButtons;
			const actionButtonNumber = this.#extractButtonNumber(action);
			if (actionButtonNumber === ButtonNumber.first) {
				this.#sendButtonAction(notification, firstButton);
			} else if (actionButtonNumber === ButtonNumber.second) {
				this.#sendButtonAction(notification, secondButton);
			}
		}
		#sendButtonAction(notification, button) {
			const [notificationId, value] = this.#extractButtonParams(button);
			this.#notificationService.sendConfirmAction(notificationId, value);
		}
		#isConfirmButtonAction(action, notification) {
			const notificationType = notification.sectionCode;
			return action.startsWith(ACTION_BUTTON_PREFIX) && notificationType === im_v2_const.NotificationTypesCodes.confirm;
		}
		#extractButtonNumber(action) {
			// 'button_1'
			return action.split('_')[1];
		}
		#extractButtonParams(button) {
			// '2568|Y'
			return button.COMMAND_PARAMS.split('|');
		}
		#isChatOpened(dialogId) {
			const isChatOpen = this.#store.getters['application/isChatOpen'](dialogId);
			return Boolean(document.hasFocus() && isChatOpen);
		}
		#playOpenedChatMessageSound(isImportant) {
			if (isImportant) {
				im_v2_lib_soundNotification.SoundNotificationManager.getInstance().forcePlayOnce(im_v2_const.SoundType.newMessage2);
				return;
			}
			im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.newMessage2);
		}
		#playMessageSound(isImportant) {
			if (isImportant) {
				im_v2_lib_soundNotification.SoundNotificationManager.getInstance().forcePlayOnce(im_v2_const.SoundType.newMessage1);
				return;
			}
			im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.newMessage1);
		}
		#flashDesktopIcon() {
			if (!im_v2_lib_desktop.DesktopManager.isDesktop()) {
				return;
			}
			im_v2_lib_desktopApi.DesktopApi.flashIcon();
		}
		async #shouldSkipNotification(dialogId) {
			if (this.#isChatOpened(dialogId)) {
				return true;
			}
			const eventResult = await main_core_events.EventEmitter.emitAsync(im_v2_const.EventType.notifier.onBeforeShowMessage, {
				dialogId
			});
			return eventResult.includes(NotifierShowMessageAction.skip);
		}
	}

	exports.MessageNotifierManager = MessageNotifierManager;
	exports.NotifierShowMessageAction = NotifierShowMessageAction;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.UI.NotificationManager, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=message-notifier.bundle.js.map
