/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, main_popup, ui_system_menu, im_v2_application_core, ui_dialogs_messagebox, im_public, im_v2_const, im_v2_lib_analytics, im_v2_lib_call, im_v2_lib_channel, im_v2_lib_confirm, im_v2_lib_invite, im_v2_lib_permission, im_v2_lib_utils, im_v2_provider_service_chat, im_v2_provider_service_recent, im_v2_lib_collab, im_v2_lib_copilot, ui_iconSet_api_core, im_v2_lib_feedback, im_v2_lib_chat, im_v2_lib_entityCreator, im_v2_lib_feature, im_v2_lib_market, im_v2_lib_message, im_v2_lib_notifier, im_v2_lib_parser, im_v2_lib_promo, im_v2_provider_service_disk, im_v2_provider_service_message, im_v2_provider_service_sticker, im_v2_provider_service_sending) {
	'use strict';

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Menu';
	class BaseMenu extends main_core_events.EventEmitter {
		static events = {
			close: 'close'
		};
		id = 'im-base-context-menu';
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.store = im_v2_application_core.Core.getStore();
			this.restClient = im_v2_application_core.Core.getRestClient();
		}

		// public
		openMenu(context, target) {
			const existingPopupWithId = main_popup.PopupManager.getPopupById(this.id);
			if (existingPopupWithId) {
				existingPopupWithId.close();
			}
			if (this.menuInstance) {
				this.close();
			}
			this.context = context;
			this.target = target;
			this.menuInstance = new ui_system_menu.Menu(this.getMenuOptions());
			this.menuInstance.show(this.target);
			this.#bindBlurEvent();
		}
		getMenuOptions() {
			return {
				id: this.id,
				bindOptions: {
					forceBindPosition: true,
					position: 'bottom'
				},
				targetContainer: document.body,
				cacheable: false,
				closeByEsc: true,
				className: this.getMenuClassName(),
				items: this.#prepareItems(),
				sections: this.getMenuGroups(),
				events: {
					onClose: () => this.close(),
					onDestroy: () => this.destroy()
				}
			};
		}
		getMenuItems() {
			return [];
		}
		getMenuGroups() {
			return [];
		}
		groupItems(menuItems, group) {
			return menuItems.filter(item => item !== null).map(item => {
				return {
					...item,
					sectionCode: group
				};
			});
		}
		getMenuClassName() {
			return '';
		}
		close() {
			this.emit(BaseMenu.events.close);
			if (!this.menuInstance) {
				return;
			}
			this.menuInstance.destroy();
			this.menuInstance = null;
		}
		destroy() {
			this.close();
		}
		getCurrentUserId() {
			return im_v2_application_core.Core.getUserId();
		}
		#prepareItems() {
			return this.getMenuItems().filter(item => item !== null);
		}
		#bindBlurEvent() {
			main_core.Event.bindOnce(window, 'blur', () => {
				this.destroy();
			});
		}
	}

	const MenuSectionCode$2 = {
		first: 'first',
		second: 'second'};
	class RecentMenu extends BaseMenu {
		constructor(applicationContext) {
			super();
			this.id = 'im-recent-context-menu';
			this.chatService = new im_v2_provider_service_chat.ChatService();
			this.callManager = im_v2_lib_call.CallManager.getInstance();
			this.permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
			const {
				emitter
			} = applicationContext;
			this.emitter = emitter;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				className: this.getMenuClassName()
			};
		}
		getMenuClassName() {
			return this.context.compactMode ? '' : super.getMenuClassName();
		}
		getMenuItems() {
			if (this.#isInvitationActive()) {
				const firstGroupItems = [this.getSendMessageItem(), this.getOpenProfileItem()];
				return [...this.groupItems(firstGroupItems, MenuSectionCode$2.first), ...this.groupItems(this.getInviteItems(), MenuSectionCode$2.second)];
			}
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getOpenProfileItem(), this.getChatsWithUserItem(), this.getHideItem(), this.getLeaveItem()];
		}
		getMenuGroups() {
			if (this.#isInvitationActive()) {
				return [{
					code: MenuSectionCode$2.first
				}, {
					code: MenuSectionCode$2.second
				}];
			}
			return [];
		}
		getSendMessageItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_WRITE_V2'),
				onClick: () => {
					void im_public.Messenger.openChat(this.context.dialogId);
				}
			};
		}
		getOpenItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
				onClick: () => {
					void im_public.Messenger.openChat(this.context.dialogId);
				}
			};
		}
		getUnreadMessageItem() {
			const {
				recentItem,
				dialogId
			} = this.context;
			if (!recentItem || this.isGuestRole()) {
				return null;
			}
			const showReadOption = this.hasCounter();
			return {
				title: showReadOption ? main_core.Loc.getMessage('IM_LIB_MENU_READ') : main_core.Loc.getMessage('IM_LIB_MENU_UNREAD'),
				onClick: () => {
					if (showReadOption) {
						this.chatService.readDialog(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onRead(dialogId);
					} else {
						this.chatService.unreadDialog(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnread(dialogId);
					}
				}
			};
		}
		getPinMessageItem() {
			const {
				dialogId
			} = this.context;
			if (this.isGuestRole()) {
				return null;
			}
			const recentItem = this.#getRecentItem();
			const isPinned = recentItem ? recentItem.pinned : false;
			return {
				title: isPinned ? main_core.Loc.getMessage('IM_LIB_MENU_UNPIN_MSGVER_1') : main_core.Loc.getMessage('IM_LIB_MENU_PIN_MSGVER_1'),
				onClick: () => {
					if (isPinned) {
						this.chatService.unpinChat(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnpin(dialogId);
					} else {
						this.chatService.pinChat(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onPin(dialogId);
					}
				}
			};
		}
		getMuteItem() {
			const {
				dialogId
			} = this.context;
			const canMute = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.mute, dialogId);
			if (!canMute) {
				return null;
			}
			const {
				isMuted
			} = this.store.getters['chats/get'](dialogId, true);
			return {
				title: isMuted ? main_core.Loc.getMessage('IM_LIB_MENU_UNMUTE_2') : main_core.Loc.getMessage('IM_LIB_MENU_MUTE_2'),
				onClick: () => {
					if (isMuted) {
						this.chatService.unmuteChat(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onUnmute(dialogId);
					} else {
						this.chatService.muteChat(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onMute(dialogId);
					}
				}
			};
		}
		getOpenProfileItem() {
			if (!this.isUser() || this.isBot()) {
				return null;
			}
			const profileUri = im_v2_lib_utils.Utils.user.getProfileLink(this.context.dialogId);
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
				onClick: () => {
					BX.SidePanel.Instance.open(profileUri);
					im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onOpenProfile(this.context.dialogId);
				}
			};
		}
		getHideItem() {
			if (!this.#canHideChat()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
				onClick: () => {
					im_v2_provider_service_recent.LegacyRecentService.getInstance().hideChat(this.context.dialogId);
					im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onHide(this.context.dialogId);
				}
			};
		}
		getLeaveItem() {
			if (this.isCollabChat()) {
				return this.#leaveCollab();
			}
			return this.#leaveChat();
		}
		getChatsWithUserItem() {
			if (!this.isUser() || this.isBot() || this.isChatWithCurrentUser()) {
				return null;
			}
			const isAnyChatOpened = this.store.getters['application/getLayout'].entityId.length > 0;
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_FIND_SHARED_CHATS'),
				onClick: async () => {
					if (!isAnyChatOpened) {
						await im_public.Messenger.openChat(this.context.dialogId);
					}
					this.emitter.emit(im_v2_const.EventType.sidebar.open, {
						panel: im_v2_const.SidebarDetailBlock.chatsWithUser,
						standalone: true,
						dialogId: this.context.dialogId
					});
					im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onFindChatsWithUser(this.context.dialogId);
				}
			};
		}

		// region invitation
		getInviteItems() {
			const {
				recentItem
			} = this.context;
			if (!recentItem) {
				return [];
			}
			const items = [];
			let canInvite; // TODO change to APPLICATION variable
			if (main_core.Type.isUndefined(BX.MessengerProxy)) {
				canInvite = true;
				console.error('BX.MessengerProxy.canInvite() method not found in v2 version!');
			} else {
				canInvite = BX.MessengerProxy.canInvite();
			}
			const canManageInvite = canInvite && im_v2_application_core.Core.getUserId() === recentItem.invitation.originator;
			if (canManageInvite) {
				items.push(this.getResendInviteItem(), this.getCancelInviteItem());
			}
			return items;
		}
		getResendInviteItem() {
			const {
				recentItem,
				dialogId
			} = this.context;
			if (!recentItem || !this.#canResendInvitation()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_INVITE_RESEND'),
				onClick: () => {
					im_v2_lib_invite.InviteManager.resendInvite(dialogId);
				}
			};
		}
		getCancelInviteItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_INVITE_CANCEL'),
				onClick: () => {
					ui_dialogs_messagebox.MessageBox.show({
						message: main_core.Loc.getMessage('IM_LIB_INVITE_CANCEL_CONFIRM'),
						modal: true,
						buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
						onOk: messageBox => {
							im_v2_lib_invite.InviteManager.cancelInvite(this.context.dialogId);
							messageBox.close();
						},
						onCancel: messageBox => {
							messageBox.close();
						}
					});
				}
			};
		}
		// endregion

		getChat() {
			return this.store.getters['chats/get'](this.context.dialogId, true);
		}
		isUser() {
			return this.store.getters['chats/isUser'](this.context.dialogId);
		}
		isBot() {
			if (!this.isUser()) {
				return false;
			}
			const user = this.store.getters['users/get'](this.context.dialogId);
			return user.type === im_v2_const.UserType.bot;
		}
		isChannel() {
			return im_v2_lib_channel.ChannelManager.isChannel(this.context.dialogId);
		}
		isCollabChat() {
			const {
				type
			} = this.store.getters['chats/get'](this.context.dialogId, true);
			return type === im_v2_const.ChatType.collab;
		}
		isOpenChat() {
			const {
				type
			} = this.store.getters['chats/get'](this.context.dialogId, true);
			return type === im_v2_const.ChatType.open;
		}
		isGuestRole() {
			const {
				role
			} = this.store.getters['chats/get'](this.context.dialogId, true);
			return role === im_v2_const.UserRole.guest;
		}
		isChatWithCurrentUser() {
			return this.getCurrentUserId() === Number.parseInt(this.context.dialogId, 10);
		}
		hasCounter() {
			const {
				dialogId
			} = this.context;
			const {
				chatId
			} = this.store.getters['chats/get'](dialogId, true);
			const chatCounter = this.store.getters['counters/getCounterByChatId'](chatId);
			const childrenCounter = this.store.getters['counters/getChildrenTotalCounter'](chatId);
			const isChatMarkedUnread = this.store.getters['counters/getUnreadStatus'](chatId);
			return isChatMarkedUnread || chatCounter > 0 || childrenCounter > 0;
		}
		#leaveChat() {
			const canLeaveChat = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.leave, this.context.dialogId);
			if (!canLeaveChat) {
				return null;
			}
			const title = this.isChannel() ? main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_CHANNEL') : main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1');
			return {
				title,
				onClick: async () => {
					const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
					if (userChoice === true) {
						this.chatService.leaveChat(this.context.dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onLeave(this.context.dialogId);
					}
				}
			};
		}
		#leaveCollab() {
			const canLeaveChat = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.leave, this.context.dialogId);
			const canLeaveCollab = this.permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.leaveCollab);
			if (!canLeaveChat || !canLeaveCollab) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1'),
				onClick: async () => {
					const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(this.context.dialogId);
					if (!userChoice) {
						return;
					}
					this.chatService.leaveCollab(this.context.dialogId);
				}
			};
		}
		#canHideChat() {
			const {
				dialogId
			} = this.context;
			const recentItem = this.#getRecentItem();
			if (!recentItem) {
				return null;
			}
			const isInvitation = this.#isInvitationActive();
			const isFakeUser = recentItem.isFakeElement;
			const isAiAssistantBot = this.store.getters['users/bots/isAiAssistant'](dialogId);
			return !isInvitation && !isFakeUser && !isAiAssistantBot;
		}
		#getRecentItem() {
			return this.context.recentItem || this.store.getters['recent/get'](this.context.dialogId);
		}
		#isInvitationActive() {
			const {
				recentItem
			} = this.context;
			if (!recentItem || !recentItem.invitation) {
				return false;
			}
			return recentItem.invitation.isActive;
		}
		#canResendInvitation() {
			const {
				recentItem
			} = this.context;
			if (!recentItem || !recentItem.invitation) {
				return false;
			}
			return recentItem.invitation.canResend;
		}
	}

	class UserMenu extends BaseMenu {
		constructor(applicationContext) {
			super();
			this.id = 'bx-im-user-context-menu';
			this.permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
			const {
				emitter
			} = applicationContext;
			this.emitter = emitter;
		}
		getKickItem() {
			const canKick = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.kick, this.context.dialog.dialogId);
			if (!canKick) {
				return null;
			}
			return {
				title: this.#getKickItemText(),
				onClick: async () => {
					const userChoice = await im_v2_lib_confirm.showKickUserConfirm(this.context.dialog.dialogId);
					if (userChoice !== true) {
						return;
					}
					void this.#kickUser();
				}
			};
		}
		getMentionItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_USER_MENTION'),
				onClick: () => {
					this.emitter.emit(im_v2_const.EventType.textarea.insertMention, {
						mentionText: this.context.user.name,
						mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(this.context.user.id, this.context.user.name),
						dialogId: this.context.dialog.dialogId,
						isMentionSymbol: false
					});
				}
			};
		}
		getSendItem() {
			if (this.context.dialog.type === im_v2_const.ChatType.user) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_USER_WRITE'),
				onClick: () => {
					void im_public.Messenger.openChat(this.context.user.id);
				}
			};
		}
		getProfileItem() {
			if (this.isBot()) {
				return null;
			}
			const profileUri = im_v2_lib_utils.Utils.user.getProfileLink(this.context.user.id);
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
				onClick: () => {
					BX.SidePanel.Instance.open(profileUri);
				}
			};
		}
		isCollabChat() {
			const {
				type
			} = this.store.getters['chats/get'](this.context.dialog.dialogId, true);
			return type === im_v2_const.ChatType.collab;
		}
		isBot() {
			return this.context.user.type === im_v2_const.UserType.bot;
		}
		#getKickItemText() {
			if (this.isCollabChat()) {
				return im_v2_lib_collab.CollabManager.getKickUserText();
			}
			return main_core.Loc.getMessage('IM_LIB_MENU_USER_KICK_FROM_CHAT');
		}
		#kickUser() {
			if (this.isCollabChat()) {
				return new im_v2_provider_service_chat.ChatService().kickUserFromCollab(this.context.dialog.dialogId, this.context.user.id);
			}
			return new im_v2_provider_service_chat.ChatService().kickUserFromChat(this.context.dialog.dialogId, this.context.user.id);
		}
	}

	const MenuSectionCode$1 = {
		first: 'first',
		second: 'second',
		third: 'third'
	};
	const NestedMenuSectionCode = {
		first: 'first',
		second: 'second',
		third: 'third'
	};
	class MessageMenu extends BaseMenu {
		maxPins = 20;
		constructor(applicationContext) {
			super();
			this.id = 'bx-im-message-context-menu';
			this.diskService = new im_v2_provider_service_disk.DiskService();
			this.marketManager = im_v2_lib_market.MarketManager.getInstance();
			const {
				emitter
			} = applicationContext;
			this.emitter = emitter;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				className: this.getMenuClassName(),
				angle: true,
				offsetLeft: 11,
				minWidth: 238
			};
		}
		getMenuItems() {
			const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
			const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode$1.first
			}, {
				code: MenuSectionCode$1.second
			}];
		}
		getNestedMenuGroups() {
			return [{
				code: NestedMenuSectionCode.first
			}, {
				code: NestedMenuSectionCode.second
			}];
		}
		getSelectItem() {
			if (this.isDeletedMessage() || !this.isRealMessage()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SELECT'),
				icon: ui_iconSet_api_core.Outline.CIRCLE_CHECK,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSelect(this.context.dialogId);
					this.emitter.emit(im_v2_const.EventType.dialog.openBulkActionsMode, {
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
				}
			};
		}
		getReplyItem() {
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REPLY'),
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onReply(this.context.dialogId);
					this.emitter.emit(im_v2_const.EventType.textarea.replyMessage, {
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
				},
				icon: ui_iconSet_api_core.Outline.QUOTE
			};
		}
		getForwardItem() {
			if (this.isDeletedMessage() || !this.isRealMessage()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_FORWARD'),
				icon: ui_iconSet_api_core.Outline.FORWARD,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onForward(this.context.dialogId);
					this.emitter.emit(im_v2_const.EventType.dialog.showForwardPopup, {
						messagesIds: [this.context.id]
					});
				}
			};
		}
		getCopyItem() {
			if (this.isDeletedMessage() || this.context.text.trim().length === 0) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY'),
				onClick: async () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyText({
						dialogId: this.context.dialogId,
						messageId: this.context.id
					});
					const textToCopy = im_v2_lib_parser.Parser.prepareCopy(this.context);
					await im_v2_lib_utils.Utils.text.copyToClipboard(textToCopy);
					im_v2_lib_notifier.Notifier.message.onCopyComplete();
				},
				icon: ui_iconSet_api_core.Outline.COPY
			};
		}
		getCopyLinkItem() {
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_LINK_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.LINK,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyLink(this.context.dialogId);
					const textToCopy = im_v2_lib_chat.ChatManager.buildMessageLink(this.context.dialogId, this.context.id);
					if (BX.clipboard?.copy(textToCopy)) {
						im_v2_lib_notifier.Notifier.message.onCopyLinkComplete();
					}
				}
			};
		}
		getCopyFileItem() {
			if (this.context.files.length !== 1) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_FILE'),
				icon: ui_iconSet_api_core.Outline.COPY,
				onClick: () => {
					const fileId = this.context.files[0];
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCopyFile({
						dialogId: this.context.dialogId,
						fileId
					});
					const textToCopy = im_v2_lib_parser.Parser.prepareCopyFile(this.context);
					if (BX.clipboard?.copy(textToCopy)) {
						im_v2_lib_notifier.Notifier.file.onCopyComplete();
					}
				}
			};
		}
		getPinItem() {
			const canPin = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.pinMessage, this.context.dialogId);
			if (this.isDeletedMessage() || !canPin) {
				return null;
			}
			const isPinned = this.store.getters['messages/pin/isPinned']({
				chatId: this.context.chatId,
				messageId: this.context.id
			});
			return {
				title: isPinned ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_UNPIN') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_PIN'),
				icon: ui_iconSet_api_core.Outline.PIN,
				onClick: () => {
					const messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.context.chatId
					});
					if (isPinned) {
						messageService.unpinMessage(this.context.chatId, this.context.id);
						im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onUnpin(this.context.dialogId);
					} else {
						if (this.#arePinsExceedLimit()) {
							im_v2_lib_notifier.Notifier.chat.onMessagesPinLimitError(this.maxPins);
							im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onReachingPinsLimit(this.context.dialogId);
							return;
						}
						messageService.pinMessage(this.context.chatId, this.context.id);
						im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onPin(this.context.dialogId);
					}
				}
			};
		}
		getFavoriteItem() {
			if (this.isDeletedMessage()) {
				return null;
			}
			const isInFavorite = this.store.getters['sidebar/favorites/isFavoriteMessage'](this.context.chatId, this.context.id);
			const menuItemText = isInFavorite ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_REMOVE_FROM_SAVED') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE');
			return {
				title: menuItemText,
				icon: ui_iconSet_api_core.Outline.FAVORITE,
				onClick: () => {
					const messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.context.chatId
					});
					if (isInFavorite) {
						messageService.removeMessageFromFavorite(this.context.id);
					} else {
						im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onAddFavorite({
							dialogId: this.context.dialogId,
							messageId: this.context.id
						});
						messageService.addMessageToFavorite(this.context.id);
					}
				}
			};
		}
		getMarkItem() {
			const canUnread = this.context.viewed && !this.isOwnMessage();
			const dialog = this.store.getters['chats/getByChatId'](this.context.chatId);
			const isMarked = this.context.id === dialog.markedId;
			if (!canUnread || isMarked) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MARK'),
				icon: ui_iconSet_api_core.Outline.NEW_MESSAGE,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onMark(this.context.dialogId);
					const messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.context.chatId
					});
					messageService.markMessage(this.context.id);
				}
			};
		}
		getCreateTaskItem() {
			if (this.isDeletedMessage() || this.#isStickerMessage()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_TASK_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.TASK,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCreateTask(this.context.dialogId);
					const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
					void entityCreator.createTaskForMessage(this.context.id);
				}
			};
		}
		getCreateMeetingItem() {
			if (this.isDeletedMessage() || this.#isStickerMessage()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_MEETING_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCreateEvent(this.context.dialogId);
					const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.chatId);
					void entityCreator.createMeetingForMessage(this.context.id);
				}
			};
		}
		getEditItem() {
			if (!im_v2_lib_message.MessageManager.isEditable(this.context.id)) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_EDIT'),
				icon: ui_iconSet_api_core.Outline.EDIT_L,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onEdit(this.context.dialogId);
					this.emitter.emit(im_v2_const.EventType.textarea.editMessage, {
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
				}
			};
		}
		getAskCopilotItem() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotMentionAvailable)) {
				return null;
			}
			if (!this.canSendMessage() || this.isDeletedMessage()) {
				return null;
			}
			const isChannel = im_v2_lib_channel.ChannelManager.isChannel(this.context.dialogId);
			if (isChannel) {
				return null;
			}
			const copilotBotDialogId = this.store.getters['users/bots/getCopilotBotDialogId'];
			const {
				name: mentionText
			} = this.store.getters['users/get'](copilotBotDialogId, true);
			const title = main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_ASK_COPILOT_MSGVER_1', {
				'#COPILOT_NAME#': new im_v2_lib_copilot.CopilotManager().getName()
			});
			const isBGPTv2 = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			const icon = isBGPTv2 ? ui_iconSet_api_core.Outline.BITRIX_GPT : ui_iconSet_api_core.Outline.COPILOT;
			const design = isBGPTv2 ? ui_system_menu.MenuItemDesign.BitrixGPT : ui_system_menu.MenuItemDesign.Copilot;
			return {
				title,
				icon,
				design,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onAskCopilot(this.context.dialogId);
					this.emitter.emit(im_v2_const.EventType.textarea.insertMention, {
						mentionText,
						mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(copilotBotDialogId, mentionText),
						dialogId: this.context.dialogId
					});
					this.emitter.emit(im_v2_const.EventType.textarea.replyMessage, {
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
				}
			};
		}
		getDeleteItem() {
			if (this.isDeletedMessage()) {
				return null;
			}
			const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
			const canDeleteOthersMessage = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOthersMessage, this.context.dialogId);
			if (!this.isOwnMessage() && !canDeleteOthersMessage) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DELETE'),
				design: ui_system_menu.MenuItemDesign.Alert,
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				onClick: this.#onDelete.bind(this)
			};
		}
		getMarketItems() {
			const {
				dialogId,
				id
			} = this.context;
			const placements = this.marketManager.getAvailablePlacementsByType(im_v2_const.PlacementType.contextMenu, dialogId);
			const marketMenuItem = [];
			const context = {
				messageId: id,
				dialogId
			};
			placements.forEach(placement => {
				marketMenuItem.push({
					title: placement.title,
					icon: ui_iconSet_api_core.Outline.MARKET,
					onClick: () => {
						void im_v2_lib_market.MarketManager.openSlider(placement, context);
					}
				});
			});
			const MARKET_ITEMS_LIMIT = 10;
			return marketMenuItem.slice(0, MARKET_ITEMS_LIMIT);
		}
		getDownloadFileItem() {
			if (!main_core.Type.isArrayFilled(this.context.files)) {
				return null;
			}
			if (this.#isSingleFile()) {
				return this.#getDownloadSingleFileItem();
			}
			return this.#getDownloadSeveralFilesItem();
		}
		getSaveToDiskItem() {
			if (!main_core.Type.isArrayFilled(this.context.files)) {
				return null;
			}
			const menuItemText = this.#isSingleFile() ? main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ON_DISK_MSGVER_1') : main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ALL_ON_DISK');
			return {
				title: menuItemText,
				icon: ui_iconSet_api_core.Outline.FOLDER_24,
				onClick: async function () {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSaveOnDisk({
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
					await this.diskService.save(this.context.files);
					im_v2_lib_notifier.Notifier.file.onDiskSaveComplete(this.#isSingleFile());
				}.bind(this)
			};
		}
		getAdditionalItems() {
			const items = this.getNestedItems();
			if (this.#needNestedMenu(items)) {
				return [{
					title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_MORE'),
					subMenu: {
						items,
						sections: this.getNestedMenuGroups()
					}
				}];
			}
			return items;
		}
		getNestedItems() {
			const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
			return [...this.groupItems(firstGroupItems, NestedMenuSectionCode.first), ...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.second)];
		}
		isOwnMessage() {
			return this.context.authorId === im_v2_application_core.Core.getUserId();
		}
		isDeletedMessage() {
			return this.context.isDeleted;
		}
		isRealMessage() {
			return this.store.getters['messages/isRealMessage'](this.context.id);
		}
		canSendMessage() {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](this.context.dialogId, true);
			if (!dialog.isTextareaEnabled) {
				return false;
			}
			return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.context.dialogId);
		}
		#isStickerMessage() {
			return this.store.getters['stickers/messages/isSticker'](this.context.id);
		}
		#needNestedMenu(additionalItems) {
			const NESTED_MENU_MIN_ITEMS = 3;
			const menuItems = additionalItems.filter(item => item !== null);
			return menuItems.length >= NESTED_MENU_MIN_ITEMS;
		}
		#getFirstFile() {
			return this.store.getters['files/get'](this.context.files[0]);
		}
		#isSingleFile() {
			return this.context.files.length === 1;
		}
		async #onDelete() {
			const {
				id: messageId,
				dialogId,
				chatId
			} = this.context;
			im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onDelete({
				messageId,
				dialogId
			});
			if (await this.#isDeletionCancelled()) {
				return;
			}
			const messageService = new im_v2_provider_service_message.MessageService({
				chatId
			});
			messageService.deleteMessages([messageId]);
		}
		async #isDeletionCancelled() {
			const {
				id: messageId,
				dialogId
			} = this.context;
			if (!im_v2_lib_channel.ChannelManager.isChannel(dialogId)) {
				return false;
			}
			const confirmResult = await im_v2_lib_confirm.showDeleteChannelPostConfirm();
			if (!confirmResult) {
				im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onCancelDelete({
					messageId,
					dialogId
				});
				return true;
			}
			return false;
		}
		#getDownloadSingleFileItem() {
			const file = this.#getFirstFile();
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILE'),
				icon: ui_iconSet_api_core.Outline.DOWNLOAD,
				onClick: function () {
					im_v2_lib_utils.Utils.file.downloadFiles([file]);
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onFileDownload({
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
				}.bind(this)
			};
		}
		#getDownloadSeveralFilesItem() {
			const files = this.context.files.map(fileId => {
				return this.store.getters['files/get'](fileId);
			});
			return {
				title: main_core.Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILES'),
				icon: ui_iconSet_api_core.Outline.DOWNLOAD,
				onClick: async () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onFileDownload({
						messageId: this.context.id,
						dialogId: this.context.dialogId
					});
					im_v2_lib_utils.Utils.file.downloadFiles(files);
					const needToShowPopup = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.downloadSeveralFiles);
					if (needToShowPopup && im_v2_lib_utils.Utils.browser.isChrome() && !im_v2_lib_utils.Utils.platform.isBitrixDesktop()) {
						await im_v2_lib_confirm.showDownloadAllFilesConfirm();
						void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.downloadSeveralFiles);
					}
				}
			};
		}
		#arePinsExceedLimit() {
			const pins = this.store.getters['messages/pin/getPinned'](this.context.chatId);
			return pins.length >= this.maxPins;
		}
	}

	class AiAssistantMessageMenu extends MessageMenu {
		getMenuItems() {
			const firstGroupItems = [this.getCopyItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
			return this.groupItems(firstGroupItems, MenuSectionCode$1.first);
		}
		getNestedItems() {
			const firstGroupItems = [this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
			return [...this.groupItems(firstGroupItems, NestedMenuSectionCode.first), ...this.groupItems([this.getSendFeedbackItem()], NestedMenuSectionCode.second), ...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.third)];
		}
		getNestedMenuGroups() {
			return [{
				code: NestedMenuSectionCode.first
			}, {
				code: NestedMenuSectionCode.second
			}, {
				code: NestedMenuSectionCode.third
			}];
		}
		getSendFeedbackItem() {
			const isAiAssistantBot = im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](this.context.authorId);
			if (!isAiAssistantBot) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
				icon: ui_iconSet_api_core.Outline.FEEDBACK,
				onClick: () => {
					void new im_v2_lib_feedback.FeedbackManager().openAiAssistantForm({});
				}
			};
		}
	}

	class ChannelMessageMenu extends MessageMenu {
		getMenuItems() {
			const firstGroupItems = [this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getForwardItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
			const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
		}
		getNestedItems() {
			const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
			return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
		}
		getNestedMenuGroups() {
			return [{
				code: NestedMenuSectionCode.first
			}];
		}
	}

	class CommentsMessageMenu extends MessageMenu {
		getMenuItems() {
			const message = this.context;
			const contextDialogId = this.context.dialogId;
			if (im_v2_lib_channel.ChannelManager.isCommentsPostMessage(message, contextDialogId)) {
				return this.#getCommentsPostMenuItems();
			}
			return this.#getDefaultMenuItems();
		}
		getNestedItems() {
			const firstGroupItems = [this.getCopyFileItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
			return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode$1.first
			}, {
				code: MenuSectionCode$1.second
			}, {
				code: MenuSectionCode$1.third
			}];
		}
		getNestedMenuGroups() {
			return [{
				code: NestedMenuSectionCode.first
			}];
		}
		getOpenInChannelItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_COMMENTS_OPEN_IN_CHANNEL'),
				icon: ui_iconSet_api_core.Outline.GO_TO_MESSAGE,
				onClick: () => {
					this.emitter.emit(im_v2_const.EventType.dialog.closeComments);
				}
			};
		}
		#getCommentsPostMenuItems() {
			const firstGroupItems = [this.getCopyItem(), this.getCopyFileItem()];
			const secondGroupItems = [this.getDownloadFileItem(), this.getSaveToDiskItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second), ...this.groupItems([this.getOpenInChannelItem()], MenuSectionCode$1.third)];
		}
		#getDefaultMenuItems() {
			const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), ...this.getAdditionalItems()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems([this.getDeleteItem()], MenuSectionCode$1.second)];
		}
	}

	class CopilotMessageMenu extends MessageMenu {
		getMenuItems() {
			const firstGroupItems = [this.getCopyItem(), this.getMarkItem(), this.getFavoriteItem(), this.getForwardItem(), this.getSendFeedbackItem()];
			const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
		}
		getSendFeedbackItem() {
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			if (!copilotManager.isCopilotBot(this.context.authorId)) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
				icon: ui_iconSet_api_core.Outline.FEEDBACK,
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().messageContextMenu.onSendFeedback(this.context.dialogId);
					void this.#openForm();
				}
			};
		}
		async #openForm() {
			void new im_v2_lib_feedback.FeedbackManager().openCopilotForm({
				userCounter: this.#getUserCounter(),
				text: this.context.text
			});
		}
		#getUserCounter() {
			const chat = this.store.getters['chats/get'](this.context.dialogId);
			return chat.userCounter;
		}
	}

	class TaskCommentsMessageMenu extends MessageMenu {
		getMenuItems() {
			const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getAskCopilotItem(), this.getCreateTaskItem(), this.getAddResultItem(), this.getRemoveResultItem(), ...this.getAdditionalItems()];
			const secondGroupItems = [this.getDeleteItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode$1.first), ...this.groupItems(secondGroupItems, MenuSectionCode$1.second)];
		}
		getNestedItems() {
			const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
			return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode$1.first
			}, {
				code: MenuSectionCode$1.second
			}];
		}
		getNestedMenuGroups() {
			return [{
				code: NestedMenuSectionCode.first
			}];
		}
		getAddResultItem() {
			return null;
		}
		getRemoveResultItem() {
			return null;
		}
	}

	// noinspection ES6PreferShortImport

	class MessageMenuManager {
		static #instance = null;
		#defaultMenuByCallback = new Map();
		#customMenuByCallback = new Map();
		#menuByMessageType = new Map();
		#menuInstance = null;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new MessageMenuManager();
			}
			return this.#instance;
		}
		constructor() {
			this.#registerDefaultMenus();
		}
		openMenu(payload) {
			this.destroyMenuInstance();
			const {
				messageContext,
				target,
				applicationContext
			} = payload;
			const MenuClass = this.#resolveMenuClass(messageContext);
			this.#menuInstance = new MenuClass(applicationContext);
			this.#menuInstance.openMenu(messageContext, target);
		}
		registerMenuByCallback(callback, menuClass) {
			this.#customMenuByCallback.set(callback, menuClass);
		}
		unregisterMenuByCallback(callback) {
			this.#customMenuByCallback.delete(callback);
		}
		destroyMenuInstance() {
			if (!this.#menuInstance) {
				return;
			}
			this.#menuInstance.destroy();
			this.#menuInstance = null;
		}
		shouldUseNativeContextMenu(target) {
			return Boolean(target.closest(`[${im_v2_const.DataAttribute.useNativeContextMenu}]`));
		}
		registerMenuByMessageType(messageType, menuClass) {
			if (this.#hasMenuForMessageType(messageType)) {
				return;
			}
			this.#menuByMessageType.set(messageType, menuClass);
		}
		#resolveMenuClass(context) {
			if (!this.#isCustomMenuAllowed(context)) {
				return this.#getDefaultMenuClass(context);
			}
			const customMenu = this.#getCustomMenuClass(context);
			return customMenu ?? this.#getDefaultMenuClass(context);
		}
		#registerDefaultMenus() {
			this.#defaultMenuByCallback.set(this.#isChannel.bind(this), ChannelMessageMenu);
			this.#defaultMenuByCallback.set(this.#isComment.bind(this), CommentsMessageMenu);
			this.#defaultMenuByCallback.set(this.#isCopilot.bind(this), CopilotMessageMenu);
			this.#defaultMenuByCallback.set(this.#isAiAssistant.bind(this), AiAssistantMessageMenu);
			this.#defaultMenuByCallback.set(this.#isTaskComments.bind(this), TaskCommentsMessageMenu);
		}
		#isCustomMenuAllowed(context) {
			return !im_v2_lib_channel.ChannelManager.isCommentsPostMessage(context, context.dialogId);
		}
		#getDefaultMenuClass(context) {
			const MenuClass = this.#getClassByMap(this.#defaultMenuByCallback, context);
			return MenuClass ?? MessageMenu;
		}
		#getCustomMenuClass(context) {
			if (this.#hasMenuForMessageType(context.componentId)) {
				return this.#getMenuForMessageType(context.componentId);
			}
			return this.#getClassByMap(this.#customMenuByCallback, context);
		}
		#getClassByMap(menuMap, context) {
			const menuMapEntries = menuMap.entries();
			for (const [callback, MenuClass] of menuMapEntries) {
				if (callback(context)) {
					return MenuClass;
				}
			}
			return null;
		}
		#getChatType(dialogId) {
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			return chat.type;
		}
		#isChannel(context) {
			return im_v2_lib_channel.ChannelManager.isChannel(context.dialogId);
		}
		#isComment(context) {
			const type = this.#getChatType(context.dialogId);
			return type === im_v2_const.ChatType.comment;
		}
		#isCopilot(context) {
			return new im_v2_lib_copilot.CopilotManager().isCopilotChat(context.dialogId);
		}
		#isAiAssistant(context) {
			return im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](context.dialogId);
		}
		#isTaskComments(context) {
			const type = this.#getChatType(context.dialogId);
			return type === im_v2_const.ChatType.taskComments;
		}
		#hasMenuForMessageType(messageType) {
			return this.#menuByMessageType.has(messageType);
		}
		#getMenuForMessageType(messageType) {
			return this.#menuByMessageType.get(messageType);
		}
	}

	const MenuSectionCode = {
		first: 'first',
		second: 'second'
	};
	class StickerPackMenu extends BaseMenu {
		static events = {
			showPackForm: 'showPackForm',
			closeParentPopup: 'closeParentPopup'
		};
		constructor() {
			super();
			this.id = im_v2_const.PopupType.stickerPackContextMenu;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false
			};
		}
		getMenuItems() {
			if (this.context.isRecent) {
				return [this.getClearRecentItem()];
			}
			return [...this.groupItems([this.getEditPackItem()], MenuSectionCode.first), ...this.groupItems([this.getUnlinkPackItem(), this.getDeletePackItem()], MenuSectionCode.second)];
		}
		getMenuGroups() {
			return this.getMenuItems().map(menuItem => {
				return {
					code: menuItem.sectionCode
				};
			});
		}
		getEditPackItem() {
			if (!im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.changeStickerPack)) {
				return null;
			}
			if (!this.#isPackOwner()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_EDIT_STICKER_PACK'),
				icon: ui_iconSet_api_core.Outline.EDIT_M,
				onClick: () => {
					this.emit(StickerPackMenu.events.showPackForm);
				}
			};
		}
		getDeletePackItem() {
			if (!this.#canDeletePack()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER_PACK'),
				design: ui_system_menu.MenuItemDesign.Alert,
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				onClick: async () => {
					const confirmResult = await im_v2_lib_confirm.showStickerPackDeleteConfirm();
					if (!confirmResult) {
						return;
					}
					this.emit(StickerPackMenu.events.closeParentPopup);
					await im_v2_provider_service_sticker.StickerService.getInstance().deletePack({
						id: this.context.pack.id,
						type: this.context.pack.type
					});
					im_v2_lib_notifier.Notifier.sticker.onRemovePackComplete();
				}
			};
		}
		getUnlinkPackItem() {
			if (!this.#canUnlinkPack()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_UNLINK_STICKER_PACK'),
				design: ui_system_menu.MenuItemDesign.Alert,
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				onClick: async () => {
					const confirmResult = await im_v2_lib_confirm.showStickerPackUnlinkConfirm();
					if (!confirmResult) {
						return;
					}
					this.emit(StickerPackMenu.events.closeParentPopup);
					await im_v2_provider_service_sticker.StickerService.getInstance().unlinkPack({
						id: this.context.pack.id,
						type: this.context.pack.type
					});
					im_v2_lib_notifier.Notifier.sticker.onRemovePackComplete();
				}
			};
		}
		getClearRecentItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_CLEAR_RECENT_STICKERS'),
				icon: ui_iconSet_api_core.Outline.BROOM,
				onClick: () => {
					void im_v2_provider_service_sticker.StickerService.getInstance().clearRecent();
				}
			};
		}
		#isPackOwner() {
			return this.context.pack.authorId === im_v2_application_core.Core.getUserId();
		}
		#isVendorStickerPack() {
			return this.context.packType === im_v2_const.StickerPackType.vendor;
		}
		#canUnlinkPack() {
			if (this.#isVendorStickerPack()) {
				return false;
			}
			if (!this.context.pack.isAdded) {
				return false;
			}
			return !this.#isPackOwner();
		}
		#canDeletePack() {
			if (this.#isVendorStickerPack()) {
				return false;
			}
			return this.#isPackOwner();
		}
	}

	class StickerMenu extends BaseMenu {
		static events = {
			closeParentPopup: 'closeParentPopup'
		};
		constructor() {
			super();
			this.id = im_v2_const.PopupType.stickerContextMenu;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false
			};
		}
		getMenuItems() {
			return [this.getSendItem(), this.getRemoveFromRecentItem(), this.getDeleteFromPackItem()];
		}
		getSendItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_SEND_STICKER'),
				icon: ui_iconSet_api_core.Outline.SEND,
				onClick: () => {
					this.emit(StickerMenu.events.closeParentPopup);
					void im_v2_provider_service_sending.SendingService.getInstance().sendMessageWithSticker({
						dialogId: this.context.dialogId,
						stickerParams: {
							id: this.context.sticker.id,
							packId: this.context.sticker.packId,
							packType: this.context.sticker.packType
						}
					});
				}
			};
		}
		getDeleteFromPackItem() {
			if (this.context.isRecent) {
				return null;
			}
			const isPacksOwner = this.#isPackOwner();
			if (!isPacksOwner) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER'),
				design: ui_system_menu.MenuItemDesign.Alert,
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				onClick: () => {
					void im_v2_provider_service_sticker.StickerService.getInstance().deleteStickerFromPack({
						ids: [this.context.sticker.id],
						packId: this.context.sticker.packId,
						packType: this.context.sticker.packType
					});
				}
			};
		}
		getRemoveFromRecentItem() {
			if (!this.context.isRecent) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_REMOVE_RECENT_STICKER'),
				icon: ui_iconSet_api_core.Outline.CIRCLE_MINUS,
				design: ui_system_menu.MenuItemDesign.Alert,
				onClick: () => {
					void im_v2_provider_service_sticker.StickerService.getInstance().removeFromRecent({
						id: this.context.sticker.id,
						packId: this.context.sticker.packId,
						packType: this.context.sticker.packType
					});
				}
			};
		}
		#isPackOwner() {
			const pack = im_v2_application_core.Core.getStore().getters['stickers/packs/getByIdentifier']({
				id: this.context.sticker.packId,
				type: this.context.sticker.packType
			});
			if (!pack) {
				return false;
			}
			return pack.authorId === im_v2_application_core.Core.getUserId();
		}
	}

	exports.AiAssistantMessageMenu = AiAssistantMessageMenu;
	exports.BaseMenu = BaseMenu;
	exports.MessageMenu = MessageMenu;
	exports.MessageMenuManager = MessageMenuManager;
	exports.RecentMenu = RecentMenu;
	exports.StickerMenu = StickerMenu;
	exports.StickerPackMenu = StickerPackMenu;
	exports.TaskCommentsMessageMenu = TaskCommentsMessageMenu;
	exports.UserMenu = UserMenu;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Main, BX.UI.System, BX.Messenger.v2.Application, BX.UI.Dialogs, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Provider.Service, BX.Messenger.v2.Service);
//# sourceMappingURL=registry.bundle.js.map
