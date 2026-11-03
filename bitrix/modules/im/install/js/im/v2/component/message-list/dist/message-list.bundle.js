/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_component_animation, im_v2_const, im_v2_lib_feature, im_v2_lib_menu, im_v2_lib_messageComponent, im_v2_lib_permission, im_v2_lib_quote, im_v2_lib_utils, im_v2_application_core, im_v2_lib_dateFormatter, main_core, main_polyfill_intersectionobserver, im_v2_component_elements_avatar, im_v2_lib_copilot, im_v2_lib_notifier, ui_lottie, im_v2_lib_inputAction, im_v2_component_elements_userListPopup, im_v2_provider_service_user, ui_vue3_components_richLoc, im_v2_lib_analytics, imopenlines_v2_component_message_feedbackForm, imopenlines_v2_component_message_hidden, imopenlines_v2_component_message_multidialogError, imopenlines_v2_component_message_networkSticker, imopenlines_v2_component_message_startDialog, im_v2_component_message_admin, im_v2_component_message_aiAssistant_answer, im_v2_component_message_aiBizproc, im_v2_component_message_call, im_v2_component_message_callInvite, im_v2_component_message_checkIn, im_v2_component_message_collab_convert, im_v2_component_message_copilot_addedUsers, im_v2_component_message_copilot_answer, im_v2_component_message_copilot_creation, im_v2_component_message_creation_channel, im_v2_component_message_creation_chat, im_v2_component_message_creation_collab, im_v2_component_message_creation_conference, im_v2_component_message_creation_generalChannel, im_v2_component_message_creation_generalChat, im_v2_component_message_creation_ownChat, im_v2_component_message_creation_taskChat, im_v2_component_message_default, im_v2_component_message_deleted, im_v2_component_message_error, im_v2_component_message_file, im_v2_component_message_sign, im_v2_component_message_smile, im_v2_component_message_sticker, im_v2_component_message_supervisor_enableFeature, im_v2_component_message_supervisor_updateFeature, im_v2_component_message_support_chatCreation, im_v2_component_message_support_sessionNumber, im_v2_component_message_support_vote, im_v2_component_message_unsupported, im_v2_component_message_vote, im_v2_component_message_contact, im_v2_component_message_zoomInvite) {
	'use strict';

	class AvatarMenu extends im_v2_lib_menu.UserMenu {
		constructor(applicationContext) {
			super(applicationContext);
			this.id = 'bx-im-avatar-context-menu';
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				className: this.getMenuClassName(),
				angle: true,
				offsetLeft: 21
			};
		}
		getMenuItems() {
			const isCurrentUser = this.context.user.id === im_v2_application_core.Core.getUserId();
			if (isCurrentUser) {
				return [this.getProfileItem()];
			}
			return [this.getMentionItem(), this.getSendItem(), this.getProfileItem(), this.getKickItem()];
		}
	}

	class BlockManager {
		getAuthorBlock(message) {
			return {
				type: im_v2_const.DialogBlockType.authorGroup,
				userId: message.authorId,
				avatar: this.#getAvatarConfig(message),
				messageType: this.#getMessageType(message)
			};
		}
		getMarkedBlock() {
			return {
				type: im_v2_const.DialogBlockType.markedMessages
			};
		}
		getNewMessagesBlock() {
			return {
				type: im_v2_const.DialogBlockType.newMessages
			};
		}
		#getAvatarConfig(message) {
			return {
				isNeeded: this.#checkIfAvatarIsNeeded(message),
				avatarId: message.authorId.toString()
			};
		}
		#getMessageType(message) {
			if (!message.authorId) {
				return im_v2_const.MessageType.system;
			}
			if (message.authorId === im_v2_application_core.Core.getUserId()) {
				return im_v2_const.MessageType.self;
			}
			return im_v2_const.MessageType.opponent;
		}
		#checkIfAvatarIsNeeded(message) {
			const messageType = this.#getMessageType(message);
			const isSystem = messageType === im_v2_const.MessageType.system;
			if (isSystem) {
				return false;
			}
			const isSelf = messageType === im_v2_const.MessageType.self;
			const alignment = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
			if (alignment === im_v2_const.DialogAlignment.center) {
				return !isSelf;
			}
			return true;
		}
	}

	class Collection {
		#blockManager;
		#collection = [];
		#currentDateTitles = new Set();
		#markedIndicatorInserted = false;
		#lastDateItems = [];
		#lastAuthorId = null;
		#lastAuthorItems = [];
		constructor() {
			this.#blockManager = new BlockManager();
		}
		get() {
			return this.#collection;
		}
		hasDateTitle(dateTitle) {
			return this.#currentDateTitles.has(dateTitle);
		}
		addDateGroup(dateTitle, date) {
			this.#currentDateTitles.add(dateTitle);
			this.#lastDateItems = [];
			this.#collection.push({
				dateTitle,
				date,
				items: this.#lastDateItems
			});
			this.#clearLastAuthor();
		}
		addAuthorGroup(message) {
			this.#lastAuthorId = message.authorId;
			this.#lastAuthorItems = [];
			this.#lastDateItems.push({
				...this.#blockManager.getAuthorBlock(message),
				messages: this.#lastAuthorItems
			});
		}
		addMessage(message) {
			this.#lastAuthorItems.push(message);
		}
		addMarkedIndicator() {
			this.#lastDateItems.push(this.#blockManager.getMarkedBlock());
			this.#markedIndicatorInserted = true;
			this.#clearLastAuthor();
		}
		addNewMessagesIndicator() {
			if (this.#markedIndicatorInserted) {
				return;
			}
			this.#lastDateItems.push(this.#blockManager.getNewMessagesBlock());
			this.#clearLastAuthor();
		}
		getLastAuthorId() {
			return this.#lastAuthorId;
		}
		#clearLastAuthor() {
			this.#lastAuthorId = null;
		}
	}

	class DateManager {
		cachedDateGroups = {};
		getDateTitle(date) {
			const shortDate = this.getLocalShortDate(date);
			if (this.cachedDateGroups[shortDate]) {
				return this.cachedDateGroups[shortDate];
			}
			this.cachedDateGroups[shortDate] = im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.dateGroup);
			return this.cachedDateGroups[shortDate];
		}

		// The day of a message in the user's own day boundaries: the server groups the history by the
		// offset the client sends, so a UTC day would miss by one around midnight.
		getLocalShortDate(date) {
			const timestampWithTimezoneOffset = date.getTime() - date.getTimezoneOffset() * 60000;
			const localDateInJSON = new Date(timestampWithTimezoneOffset).toJSON();

			// 2022-10-25T14:58:44.000Z => 2022-10-25
			const INDEX_BETWEEN_DATE_AND_TIME = 10;
			return localDateInJSON.slice(0, INDEX_BETWEEN_DATE_AND_TIME);
		}
	}

	class CollectionManager {
		firstIteration = true;
		constructor(dialogId) {
			this.dialogId = dialogId;
			this.dateManager = new DateManager();
		}
		#setInitialValues() {
			if (!this.firstIteration) {
				return;
			}
			const {
				markedId
			} = this.#getDialog();
			this.lastReadMessageId = this.#getLastReadMessageId();
			this.markedMessageId = markedId;
		}
		#handleMarkedMessageId() {
			const {
				markedId
			} = this.#getDialog();
			if (markedId === this.markedMessageId || markedId === 0) {
				return;
			}

			// if mark was set after chat load - remember marked message and remove "new messages" block
			this.markedMessageId = markedId;
			this.lastReadMessageId = null;
		}
		formatMessageCollection(messageCollection) {
			/*
			Collection
			├── Date Group
			│   ├── Marked Message Indicator
			│   ├── Author Group
			│   │   └── Messages
			│   └── New Messages Indicator
			*/

			const collection = new Collection();
			this.#setInitialValues();
			this.#handleMarkedMessageId();
			messageCollection.forEach((message, index) => {
				const dateTitle = this.dateManager.getDateTitle(message.date);
				if (!collection.hasDateTitle(dateTitle)) {
					collection.addDateGroup(dateTitle, this.dateManager.getLocalShortDate(message.date));
				}
				if (message.id === this.markedMessageId) {
					collection.addMarkedIndicator();
				}
				if (message.authorId !== collection.getLastAuthorId()) {
					collection.addAuthorGroup(message);
				}
				collection.addMessage(message);
				const isLastMessage = index === messageCollection.length - 1;
				if (!isLastMessage && message.id === this.lastReadMessageId) {
					collection.addNewMessagesIndicator();
				}
			});
			const {
				inited
			} = this.#getDialog();
			if (inited) {
				this.firstIteration = false;
			}
			return collection.get();
		}
		formatAuthorGroup(message) {
			const blockManager = new BlockManager();
			return {
				...blockManager.getAuthorBlock(message),
				messages: [message]
			};
		}
		#getLastReadMessageId() {
			const {
				lastMessageId
			} = this.#getDialog();
			const lastReadId = im_v2_application_core.Core.getStore().getters['chats/getLastReadId'](this.dialogId);
			if (lastReadId === lastMessageId) {
				return 0;
			}
			return lastReadId;
		}
		#getDialog() {
			return im_v2_application_core.Core.getStore().getters['chats/get'](this.dialogId);
		}
	}

	const HIGHLIGHT_CLASS = '--date-highlighted';
	const HIGHLIGHT_DURATION = 2000;
	const GROUP_SELECTOR = '.bx-im-message-list-date-group__container';

	/**
	 * Highlights the day divider of a date group the same way a message is highlighted: a class for a
	 * fixed time, taken off by a timer. The divider carries no message id of its own, so the day is
	 * addressed through the first message of that day and the group it sits in.
	 */
	class DateGroupHighlight {
		#group = null;
		#timeoutId = null;
		showByAnchor(container, messageId) {
			const group = container.querySelector(`[data-id="${messageId}"]`)?.closest(GROUP_SELECTOR);
			if (!group) {
				return false;
			}

			// a repeated jump moves the highlight instead of stacking a second timer over it
			this.clear();
			main_core.Dom.addClass(group, HIGHLIGHT_CLASS);
			this.#group = group;
			this.#timeoutId = setTimeout(() => this.clear(), HIGHLIGHT_DURATION);
			return true;
		}
		clear() {
			clearTimeout(this.#timeoutId);
			this.#timeoutId = null;
			if (!this.#group) {
				return;
			}
			main_core.Dom.removeClass(this.#group, HIGHLIGHT_CLASS);
			this.#group = null;
		}
	}

	class ObserverManager {
		#dialogId;
		#emitter;
		#observer;
		constructor(payload) {
			const {
				dialogId,
				context: {
					emitter
				}
			} = payload;
			this.#dialogId = dialogId;
			this.#emitter = emitter;
			this.#initObserver();
		}
		observeMessage(messageElement) {
			this.#observer.observe(messageElement);
		}
		unobserveMessage(messageElement) {
			this.#observer.unobserve(messageElement);
		}
		#initObserver() {
			this.#observer = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					const messageId = this.#getMessageIdFromElement(entry.target);
					if (!messageId || !entry.rootBounds) {
						return;
					}
					const messageIsFullyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.99;
					if (messageIsFullyVisible || this.#isMessageBottomVisible(entry)) {
						this.#sendVisibleEvent(messageId);
					} else {
						this.#sendNotVisibleEvent(messageId);
					}
				});
			}, {
				threshold: this.#getThreshold()
			});
		}
		#isMessageBottomVisible(entry) {
			const wholeMessage = entry.boundingClientRect;
			const visibleMessagePart = entry.intersectionRect;
			if (visibleMessagePart.height === 0) {
				return false;
			}

			// +1 to offset browser floating point calculations
			return wholeMessage.bottom <= visibleMessagePart.bottom + 1;
		}
		#sendVisibleEvent(messageId) {
			this.#emitter.emit(im_v2_const.EventType.dialog.onMessageIsVisible, {
				messageId,
				dialogId: this.#dialogId
			});
		}
		#sendNotVisibleEvent(messageId) {
			this.#emitter.emit(im_v2_const.EventType.dialog.onMessageIsNotVisible, {
				messageId,
				dialogId: this.#dialogId
			});
		}
		#getThreshold() {
			const arrayWithZeros = Array.from({
				length: 101
			}).fill(0);
			return arrayWithZeros.map((zero, index) => index * 0.01);
		}
		#getMessageIdFromElement(messageElement) {
			return Number(messageElement.dataset.id);
		}
	}

	const forwardMessageComponents = new Set([im_v2_const.MessageComponent.default, im_v2_const.MessageComponent.copilotMessage, im_v2_const.MessageComponent.checkIn, im_v2_const.MessageComponent.FeedbackFormMessage, im_v2_const.MessageComponent.ImOpenLinesMessage, im_v2_const.MessageComponent.ImOpenLinesForm, im_v2_const.MessageComponent.sticker, im_v2_const.MessageComponent.contactMessage]);

	// @vue/component
	const MessageSelectButton = {
		name: 'MessageSelectButton',
		props: {
			contextDialogId: {
				type: String,
				required: true
			},
			message: {
				type: Object,
				required: true
			}
		},
		computed: {
			messageItem() {
				return this.message;
			},
			selectedMessages() {
				return this.$store.getters['messages/select/getCollection'](this.contextDialogId);
			},
			bulkActionMessageLimit() {
				const settings = main_core.Extension.getSettings('im.v2.component.message-list');
				return settings.get('multipleActionMessageLimit');
			},
			isMessageSelected() {
				return this.$store.getters['messages/select/isMessageSelected'](this.messageItem.id, this.contextDialogId);
			},
			isSelectionLimitReached() {
				return this.selectedMessages.size === this.bulkActionMessageLimit && !this.isMessageSelected;
			},
			isRealMessage() {
				return this.$store.getters['messages/isRealMessage'](this.messageItem.id);
			},
			canSelectMessage() {
				if (this.messageItem.isDeleted || !this.isRealMessage) {
					return false;
				}
				return forwardMessageComponents.has(this.messageItem.componentId);
			}
		},
		methods: {
			onSelectMessage() {
				if (!this.canSelectMessage) {
					return;
				}
				if (this.isSelectionLimitReached) {
					im_v2_lib_notifier.Notifier.message.onSelectLimitError();
					return;
				}
				this.$store.dispatch('messages/select/toggleMessageSelection', {
					messageId: this.messageItem.id,
					dialogId: this.contextDialogId
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div @click="onSelectMessage" class="bx-im-message-list-select-button__container">
			<div
				v-if="canSelectMessage"
				class="bx-im-message-list-select-button__checkbox-circle"
				:class="{'--selected': isMessageSelected}"
			/>
		</div>
	`
	};

	// @vue/component
	const AuthorGroup = {
		name: 'AuthorGroup',
		components: {
			MessageAvatar: im_v2_component_elements_avatar.MessageAvatar,
			MessageSelectButton
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			contextDialogId: {
				type: String,
				required: true
			},
			withAvatarMenu: {
				type: Boolean,
				default: true
			}
		},
		emits: ['avatarClick'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			contextDialog() {
				return this.$store.getters['chats/get'](this.contextDialogId, true);
			},
			contextUser() {
				return this.$store.getters['users/get'](this.contextDialogId, true);
			},
			isUser() {
				return this.contextDialog.type === im_v2_const.ChatType.user;
			},
			isBulkActionsMode() {
				return this.$store.getters['messages/select/isBulkActionsModeActive'](this.contextDialogId);
			},
			authorGroup() {
				return this.item;
			},
			authorDialogId() {
				return this.authorGroup.avatar.avatarId;
			},
			firstMessageIdInAuthorGroup() {
				// this is potentially dangerous.
				// for now, we always have the same avatar in one authorGroup
				// in future it can be different: several support answers (with different avatars) in one authorGroup
				return this.authorGroup.messages[0].id;
			},
			avatarMenuAvailable() {
				if (!this.withAvatarMenu) {
					return false;
				}
				const authorUser = this.$store.getters['users/get'](this.authorDialogId);
				if (!authorUser) {
					return false;
				}
				const copilotManager = new im_v2_lib_copilot.CopilotManager();
				if (copilotManager.isCopilotBot(this.authorDialogId)) {
					return false;
				}
				const isBotChat = this.isUser && this.contextUser.type === im_v2_const.UserType.bot;
				if (isBotChat) {
					return false;
				}
				const isCurrentUserGuest = this.$store.getters['users/isGuest'](im_v2_application_core.Core.getUserId());
				const isGuest = this.$store.getters['users/isGuest'](this.authorDialogId);
				if (isCurrentUserGuest && isGuest) {
					return false;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.openAvatarMenu, this.contextDialogId);
			},
			canMentionByClick() {
				return new im_v2_lib_copilot.CopilotManager().isMentionByClickAvailable(this.contextDialogId, this.authorDialogId);
			},
			containerClasses() {
				const classes = [`--${this.authorGroup.messageType}`];
				if (!this.avatarMenuAvailable) {
					classes.push('--no-menu');
				}
				if (this.canMentionByClick) {
					classes.push('--mention-clickable');
				}
				if (this.isBulkActionsMode) {
					classes.push('--is-bulk-actions-mode');
				}
				if (this.authorGroup.avatar.isNeeded) {
					classes.push('--has-avatar');
				}
				return classes;
			}
		},
		methods: {
			isAvatarNeeded(index) {
				const lastIndexMessageInGroup = this.authorGroup.messages.length - 1;
				return this.authorGroup.avatar.isNeeded && index === lastIndexMessageInGroup;
			},
			onAvatarClick(event) {
				if (this.canMentionByClick) {
					const botUser = this.$store.getters['users/get'](this.authorDialogId, true);
					this.insertMention(botUser);
					return;
				}
				if (!this.avatarMenuAvailable) {
					return;
				}
				this.$emit('avatarClick', {
					dialogId: this.authorGroup.avatar.avatarId,
					$event: event
				});
			},
			insertMention(user) {
				this.$Bitrix.eventEmitter.emit(im_v2_const.EventType.textarea.insertMention, {
					mentionText: user.name,
					mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(user.id, user.name),
					mentionedUserId: user.id,
					dialogId: this.contextDialogId,
					isMentionSymbol: false
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-list-author-group__container" :class="containerClasses">
			<template v-for="(message, index) in authorGroup.messages">
				<Transition name="bx-im-select-button-transition">
					<MessageSelectButton v-if="isBulkActionsMode" :contextDialogId="contextDialogId" :message="message" />
				</Transition>
				<div v-if="isAvatarNeeded(index)" class="bx-im-message-list-author-group__avatar" data-testid="im-message-list-author-avatar">
					<MessageAvatar
						:contextDialogId="contextDialogId"
						:messageId="firstMessageIdInAuthorGroup"
						:authorId="authorGroup.avatar.avatarId"
						:size="AvatarSize.L"
						@click="onAvatarClick"
					/>
				</div>
				<slot name="message" :message="message" :index="index"></slot>
			</template>
		</div>
	`
	};

	// @vue/component
	const DateGroupTitle = {
		name: 'DateGroupTitle',
		props: {
			title: {
				type: String,
				required: true
			},
			date: {
				type: String,
				default: ''
			}
		},
		emits: ['dateNavigationClick'],
		data() {
			return {};
		},
		computed: {
			isDateNavigationAvailable() {
				return this.date.length > 0 && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMessageDateNavigationAvailable);
			},
			// The day of the group is published on the sticky element of the divider: it is the element
			// whose position tells which group the user sees now, and the calendar opens on its month
			// Nothing to open the calendar from - nothing to publish.
			navigationDate() {
				return this.isDateNavigationAvailable ? this.date : null;
			},
			// The accessible name keeps the date the divider shows: without it the screen reader would
			// name every divider the same, and WCAG 2.5.3 asks the name to contain the visible label.
			dateNavigationTitle() {
				return this.$Bitrix.Loc.getMessage('IM_MESSAGE_LIST_DATE_GROUP_DATE_NAVIGATION_TITLE', {
					'#DATE#': this.title
				});
			}
		},
		methods: {
			onClick() {
				this.$emit('dateNavigationClick', {
					date: this.date
				});
			}
		},
		// The clickable element is the whole pill, and it is a native button, so Enter and
		// Space activate it without a key handler of our own.
		template: `
		<div class="bx-im-message-list-date-group-title__container" :data-date="navigationDate">
			<button
				v-if="isDateNavigationAvailable"
				type="button"
				class="bx-im-message-list-date-group-title__text --interactive"
				:aria-label="dateNavigationTitle"
				aria-haspopup="dialog"
				data-testid="im-message-list-date-group-title"
				@click="onClick"
			>{{ title }}</button>
			<div
				v-else
				class="bx-im-message-list-date-group-title__text"
				data-testid="im-message-list-date-group-title"
			>{{ title }}</div>
		</div>
	`
	};

	// @vue/component
	const DateGroup = {
		name: 'DateGroup',
		components: {
			DateGroupTitle
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['dateNavigationClick'],
		data() {
			return {};
		},
		computed: {
			BlockType: () => im_v2_const.DialogBlockType,
			dateGroup() {
				return this.item;
			}
		},
		template: `
		<div class="bx-im-message-list-date-group__container" data-testid="im-message-list-date-group">
			<DateGroupTitle
				:title="dateGroup.dateTitle"
				:date="dateGroup.date"
				@dateNavigationClick="$emit('dateNavigationClick', $event)"
			/>
			<template v-for="dateGroupItem in dateGroup.items" >
				<slot
					name="dateGroupItem"
					:dateGroupItem="dateGroupItem"
					:isMarkedBlock="dateGroupItem.type === BlockType.markedMessages"
					:isNewMessagesBlock="dateGroupItem.type === BlockType.newMessages"
					:isAuthorBlock="dateGroupItem.type === BlockType.authorGroup"
				></slot>
			</template>
		</div>
	`
	};

	// @vue/component
	const MarkedMessagesBlock = {
		data() {
			return {};
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-list-new-message__container">
			<div class="bx-im-message-list-new-message__text">
				{{ loc('IM_DIALOG_CHAT_BLOCK_MARKED_MESSAGES') }}
			</div>
		</div>
	`
	};

	// @vue/component
	const NewMessagesBlock = {
		data() {
			return {};
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-list-new-message__container">
			<div class="bx-im-message-list-new-message__text">
				{{ loc('IM_DIALOG_CHAT_BLOCK_NEW_MESSAGES_2') }}
			</div>
		</div>
	`
	};

	// @vue/component
	const DialogLoader = {
		name: 'DialogLoader',
		props: {
			fullHeight: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {};
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-dialog-loader__container" :class="{'--full-height': fullHeight}">
			<div class="bx-im-dialog-loader__spinner"></div>
			<div class="bx-im-dialog-loader__text">{{ loc('IM_DIALOG_CHAT_LOADER_TEXT') }}</div>
		</div>
	`
	};

	var fr$2 = 60;
	var v$2 = "5.9.6";
	var ip$2 = 0;
	var op$2 = 56.12;
	var w$2 = 18;
	var h$2 = 18;
	var nm$2 = "record";
	var ddd$2 = 0;
	var markers$2 = [
	];
	var assets$2 = [
		{
			nm: "[FRAME] record - Null / Ellipse 3 - Null / Ellipse 3 / Ellipse 3 - Null / Ellipse 3 / Ellipse 3 - Null / Ellipse 3",
			fr: 60,
			id: "m2czmkdti6rnkip3",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "record - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 57.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Ellipse 3 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										60
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.06,
									s: [
										100
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.12,
									s: [
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 57.12,
									s: [
										60
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										8,
										8
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 30.06,
									s: [
										6,
										6
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 30.12,
									s: [
										6,
										6
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 57.12,
									s: [
										8,
										8
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0.06,
					op: 57.12,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Ellipse 3",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										60
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.06,
									s: [
										100
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.12,
									s: [
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 57.12,
									s: [
										60
									]
								}
							]
						}
					},
					ao: 0,
					ip: 0.06,
					op: 57.12,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																2,
																1
															],
															[
																1,
																2
															],
															[
																0,
																1
															],
															[
																1,
																0
															],
															[
																2,
																1
															],
															[
																2,
																1
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5523,
																0
															],
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0.5523,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 1.062,
												s: [
													{
														c: true,
														v: [
															[
																2.222,
																1.111
															],
															[
																1.111,
																2.222
															],
															[
																0,
																1.111
															],
															[
																1.111,
																0
															],
															[
																2.222,
																1.111
															],
															[
																2.222,
																1.111
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6136,
																0
															],
															[
																0,
																0.6136
															],
															[
																-0.6136,
																0
															],
															[
																0,
																-0.6136
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6136000000000001
															],
															[
																-0.6136,
																0
															],
															[
																0,
																-0.6136
															],
															[
																0.6136000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 2.058,
												s: [
													{
														c: true,
														v: [
															[
																2.4344,
																1.2172
															],
															[
																1.2172,
																2.4344
															],
															[
																0,
																1.2172
															],
															[
																1.2172,
																0
															],
															[
																2.4344,
																1.2172
															],
															[
																2.4344,
																1.2172
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6723,
																0
															],
															[
																0,
																0.6723
															],
															[
																-0.6723,
																0
															],
															[
																0,
																-0.6723
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6722999999999999
															],
															[
																-0.6723,
																0
															],
															[
																0,
																-0.6723
															],
															[
																0.6722999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 3.0599999999999996,
												s: [
													{
														c: true,
														v: [
															[
																2.6424,
																1.3212
															],
															[
																1.3212,
																2.6424
															],
															[
																0.0001,
																1.3212
															],
															[
																1.3212,
																0.0001
															],
															[
																2.6424,
																1.3212
															],
															[
																2.6424,
																1.3212
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7297,
																0
															],
															[
																0,
																0.7297
															],
															[
																-0.7297,
																0
															],
															[
																0,
																-0.7297
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7297
															],
															[
																-0.7297,
																0
															],
															[
																0,
																-0.7297
															],
															[
																0.7297,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 4.061999999999999,
												s: [
													{
														c: true,
														v: [
															[
																2.8448,
																1.4224
															],
															[
																1.4224,
																2.8448
															],
															[
																0,
																1.4224
															],
															[
																1.4224,
																0
															],
															[
																2.8448,
																1.4224
															],
															[
																2.8448,
																1.4224
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7856,
																0
															],
															[
																0,
																0.7856
															],
															[
																-0.7856,
																0
															],
															[
																0,
																-0.7856
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7856000000000001
															],
															[
																-0.7856,
																0
															],
															[
																0,
																-0.7856
															],
															[
																0.7856000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 5.058,
												s: [
													{
														c: true,
														v: [
															[
																3.041,
																1.5205
															],
															[
																1.5205,
																3.041
															],
															[
																0,
																1.5205
															],
															[
																1.5205,
																0
															],
															[
																3.041,
																1.5205
															],
															[
																3.041,
																1.5205
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8398,
																0
															],
															[
																0,
																0.8398
															],
															[
																-0.8398,
																0
															],
															[
																0,
																-0.8398
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8398000000000001
															],
															[
																-0.8398,
																0
															],
															[
																0,
																-0.8398
															],
															[
																0.8398000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 6.0600000000000005,
												s: [
													{
														c: true,
														v: [
															[
																3.2336,
																1.6168
															],
															[
																1.6168,
																3.2336
															],
															[
																0.0001,
																1.6168
															],
															[
																1.6168,
																0.0001
															],
															[
																3.2336,
																1.6168
															],
															[
																3.2336,
																1.6168
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8929,
																0
															],
															[
																0,
																0.8929
															],
															[
																-0.8929,
																0
															],
															[
																0,
																-0.8929
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8929
															],
															[
																-0.8929,
																0
															],
															[
																0,
																-0.8929
															],
															[
																0.8929,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 7.062,
												s: [
													{
														c: true,
														v: [
															[
																3.4212,
																1.7106
															],
															[
																1.7106,
																3.4212
															],
															[
																0.0001,
																1.7106
															],
															[
																1.7106,
																0.0001
															],
															[
																3.4212,
																1.7106
															],
															[
																3.4212,
																1.7106
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9447,
																0
															],
															[
																0,
																0.9447
															],
															[
																-0.9447,
																0
															],
															[
																0,
																-0.9447
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9447000000000001
															],
															[
																-0.9447,
																0
															],
															[
																0,
																-0.9447
															],
															[
																0.9447000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6028,
																1.8014
															],
															[
																1.8014,
																3.6028
															],
															[
																0,
																1.8014
															],
															[
																1.8014,
																0
															],
															[
																3.6028,
																1.8014
															],
															[
																3.6028,
																1.8014
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9949,
																0
															],
															[
																0,
																0.9949
															],
															[
																-0.9949,
																0
															],
															[
																0,
																-0.9949
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9949000000000001
															],
															[
																-0.9949,
																0
															],
															[
																0,
																-0.9949
															],
															[
																0.9949000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 9.06,
												s: [
													{
														c: true,
														v: [
															[
																3.7808,
																1.8904
															],
															[
																1.8904,
																3.7808
															],
															[
																0.0001,
																1.8904
															],
															[
																1.8904,
																0.0001
															],
															[
																3.7808,
																1.8904
															],
															[
																3.7808,
																1.8904
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.044,
																0
															],
															[
																0,
																1.044
															],
															[
																-1.044,
																0
															],
															[
																0,
																-1.044
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.044
															],
															[
																-1.044,
																0
															],
															[
																0,
																-1.044
															],
															[
																1.044,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 10.062,
												s: [
													{
														c: true,
														v: [
															[
																3.9538,
																1.9769
															],
															[
																1.9769,
																3.9538
															],
															[
																0.0001,
																1.9769
															],
															[
																1.9769,
																0.0001
															],
															[
																3.9538,
																1.9769
															],
															[
																3.9538,
																1.9769
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.0918,
																0
															],
															[
																0,
																1.0918
															],
															[
																-1.0918,
																0
															],
															[
																0,
																-1.0918
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0918
															],
															[
																-1.0918,
																0
															],
															[
																0,
																-1.0918
															],
															[
																1.0918,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 11.058,
												s: [
													{
														c: true,
														v: [
															[
																4.1208,
																2.0604
															],
															[
																2.0604,
																4.1208
															],
															[
																0.0001,
																2.0604
															],
															[
																2.0604,
																0.0001
															],
															[
																4.1208,
																2.0604
															],
															[
																4.1208,
																2.0604
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1379,
																0
															],
															[
																0,
																1.1379
															],
															[
																-1.1379,
																0
															],
															[
																0,
																-1.1379
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1378999999999997
															],
															[
																-1.1379,
																0
															],
															[
																0,
																-1.1379
															],
															[
																1.1378999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 12.06,
												s: [
													{
														c: true,
														v: [
															[
																4.2836,
																2.1418
															],
															[
																2.1418,
																4.2836
															],
															[
																0.0001,
																2.1418
															],
															[
																2.1418,
																0.0001
															],
															[
																4.2836,
																2.1418
															],
															[
																4.2836,
																2.1418
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1829,
																0
															],
															[
																0,
																1.1829
															],
															[
																-1.1829,
																0
															],
															[
																0,
																-1.1829
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1829
															],
															[
																-1.1829,
																0
															],
															[
																0,
																-1.1829
															],
															[
																1.1829,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 13.062000000000001,
												s: [
													{
														c: true,
														v: [
															[
																4.441,
																2.2205
															],
															[
																2.2205,
																4.441
															],
															[
																0,
																2.2205
															],
															[
																2.2205,
																0
															],
															[
																4.441,
																2.2205
															],
															[
																4.441,
																2.2205
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2264,
																0
															],
															[
																0,
																1.2264
															],
															[
																-1.2264,
																0
															],
															[
																0,
																-1.2264
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2264
															],
															[
																-1.2264,
																0
															],
															[
																0,
																-1.2264
															],
															[
																1.2264,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 14.058,
												s: [
													{
														c: true,
														v: [
															[
																4.5922,
																2.2961
															],
															[
																2.2961,
																4.5922
															],
															[
																0,
																2.2961
															],
															[
																2.2961,
																0
															],
															[
																4.5922,
																2.2961
															],
															[
																4.5922,
																2.2961
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2681,
																0
															],
															[
																0,
																1.2681
															],
															[
																-1.2681,
																0
															],
															[
																0,
																-1.2681
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2681
															],
															[
																-1.2681,
																0
															],
															[
																0,
																-1.2681
															],
															[
																1.2681,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 15.06,
												s: [
													{
														c: true,
														v: [
															[
																4.7386,
																2.3693
															],
															[
																2.3693,
																4.7386
															],
															[
																0,
																2.3693
															],
															[
																2.3693,
																0
															],
															[
																4.7386,
																2.3693
															],
															[
																4.7386,
																2.3693
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3086,
																0
															],
															[
																0,
																1.3086
															],
															[
																-1.3086,
																0
															],
															[
																0,
																-1.3086
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3086000000000002
															],
															[
																-1.3086,
																0
															],
															[
																0,
																-1.3086
															],
															[
																1.3086000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.062,
												s: [
													{
														c: true,
														v: [
															[
																4.8792,
																2.4396
															],
															[
																2.4396,
																4.8792
															],
															[
																0.0001,
																2.4396
															],
															[
																2.4396,
																0.0001
															],
															[
																4.8792,
																2.4396
															],
															[
																4.8792,
																2.4396
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3474,
																0
															],
															[
																0,
																1.3474
															],
															[
																-1.3474,
																0
															],
															[
																0,
																-1.3474
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3474
															],
															[
																-1.3474,
																0
															],
															[
																0,
																-1.3474
															],
															[
																1.3474,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 17.058,
												s: [
													{
														c: true,
														v: [
															[
																5.0126,
																2.5063
															],
															[
																2.5063,
																5.0126
															],
															[
																0,
																2.5063
															],
															[
																2.5063,
																0
															],
															[
																5.0126,
																2.5063
															],
															[
																5.0126,
																2.5063
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3842,
																0
															],
															[
																0,
																1.3842
															],
															[
																-1.3842,
																0
															],
															[
																0,
																-1.3842
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3842000000000003
															],
															[
																-1.3842,
																0
															],
															[
																0,
																-1.3842
															],
															[
																1.3842000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 18.06,
												s: [
													{
														c: true,
														v: [
															[
																5.1406,
																2.5703
															],
															[
																2.5703,
																5.1406
															],
															[
																0,
																2.5703
															],
															[
																2.5703,
																0
															],
															[
																5.1406,
																2.5703
															],
															[
																5.1406,
																2.5703
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4196,
																0
															],
															[
																0,
																1.4196
															],
															[
																-1.4196,
																0
															],
															[
																0,
																-1.4196
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4196
															],
															[
																-1.4196,
																0
															],
															[
																0,
																-1.4196
															],
															[
																1.4196,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 19.061999999999998,
												s: [
													{
														c: true,
														v: [
															[
																5.2618,
																2.6309
															],
															[
																2.6309,
																5.2618
															],
															[
																0.0001,
																2.6309
															],
															[
																2.6309,
																0.0001
															],
															[
																5.2618,
																2.6309
															],
															[
																5.2618,
																2.6309
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.453,
																0
															],
															[
																0,
																1.453
															],
															[
																-1.453,
																0
															],
															[
																0,
																-1.453
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4529999999999998
															],
															[
																-1.453,
																0
															],
															[
																0,
																-1.453
															],
															[
																1.4529999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 20.058,
												s: [
													{
														c: true,
														v: [
															[
																5.3752,
																2.6876
															],
															[
																2.6876,
																5.3752
															],
															[
																0.0001,
																2.6876
															],
															[
																2.6876,
																0.0001
															],
															[
																5.3752,
																2.6876
															],
															[
																5.3752,
																2.6876
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4843,
																0
															],
															[
																0,
																1.4843
															],
															[
																-1.4843,
																0
															],
															[
																0,
																-1.4843
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4842999999999997
															],
															[
																-1.4843,
																0
															],
															[
																0,
																-1.4843
															],
															[
																1.4842999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 21.06,
												s: [
													{
														c: true,
														v: [
															[
																5.4818,
																2.7409
															],
															[
																2.7409,
																5.4818
															],
															[
																0.0001,
																2.7409
															],
															[
																2.7409,
																0.0001
															],
															[
																5.4818,
																2.7409
															],
															[
																5.4818,
																2.7409
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5138,
																0
															],
															[
																0,
																1.5138
															],
															[
																-1.5138,
																0
															],
															[
																0,
																-1.5138
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5137999999999998
															],
															[
																-1.5138,
																0
															],
															[
																0,
																-1.5138
															],
															[
																1.5137999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 22.062,
												s: [
													{
														c: true,
														v: [
															[
																5.5804,
																2.7902
															],
															[
																2.7902,
																5.5804
															],
															[
																0.0001,
																2.7902
															],
															[
																2.7902,
																0.0001
															],
															[
																5.5804,
																2.7902
															],
															[
																5.5804,
																2.7902
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.541,
																0
															],
															[
																0,
																1.541
															],
															[
																-1.541,
																0
															],
															[
																0,
																-1.541
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.541
															],
															[
																-1.541,
																0
															],
															[
																0,
																-1.541
															],
															[
																1.541,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 23.058,
												s: [
													{
														c: true,
														v: [
															[
																5.6698,
																2.8349
															],
															[
																2.8349,
																5.6698
															],
															[
																0,
																2.8349
															],
															[
																2.8349,
																0
															],
															[
																5.6698,
																2.8349
															],
															[
																5.6698,
																2.8349
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5657,
																0
															],
															[
																0,
																1.5657
															],
															[
																-1.5657,
																0
															],
															[
																0,
																-1.5657
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5657000000000005
															],
															[
																-1.5657,
																0
															],
															[
																0,
																-1.5657
															],
															[
																1.5657000000000005,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.060000000000002,
												s: [
													{
														c: true,
														v: [
															[
																5.7509,
																2.8755
															],
															[
																2.8754,
																5.751
															],
															[
																0,
																2.8755
															],
															[
																2.8754,
																0.0001
															],
															[
																5.7509,
																2.8755
															],
															[
																5.7509,
																2.8755
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5881,
																0
															],
															[
																0,
																1.5881
															],
															[
																-1.5881,
																0
															],
															[
																0,
																-1.5881
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5881000000000003
															],
															[
																-1.5881,
																0
															],
															[
																0,
																-1.5881
															],
															[
																1.5880999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.062,
												s: [
													{
														c: true,
														v: [
															[
																5.8222,
																2.9111
															],
															[
																2.9111,
																5.8222
															],
															[
																0.0001,
																2.9111
															],
															[
																2.9111,
																0.0001
															],
															[
																5.8222,
																2.9111
															],
															[
																5.8222,
																2.9111
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6078,
																0
															],
															[
																0,
																1.6078
															],
															[
																-1.6078,
																0
															],
															[
																0,
																-1.6078
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6077999999999997
															],
															[
																-1.6078,
																0
															],
															[
																0,
																-1.6078
															],
															[
																1.6077999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 26.058,
												s: [
													{
														c: true,
														v: [
															[
																5.8826,
																2.9413
															],
															[
																2.9413,
																5.8826
															],
															[
																0.0001,
																2.9413
															],
															[
																2.9413,
																0.0001
															],
															[
																5.8826,
																2.9413
															],
															[
																5.8826,
																2.9413
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6245,
																0
															],
															[
																0,
																1.6245
															],
															[
																-1.6245,
																0
															],
															[
																0,
																-1.6245
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6245000000000003
															],
															[
																-1.6245,
																0
															],
															[
																0,
																-1.6245
															],
															[
																1.6245000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 27.060000000000002,
												s: [
													{
														c: true,
														v: [
															[
																5.9319,
																2.966
															],
															[
																2.9659,
																5.932
															],
															[
																0,
																2.966
															],
															[
																2.9659,
																0.0001
															],
															[
																5.9319,
																2.966
															],
															[
																5.9319,
																2.966
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6381,
																0
															],
															[
																0,
																1.6381
															],
															[
																-1.6381,
																0
															],
															[
																0,
																-1.6381
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6380999999999997
															],
															[
																-1.6381,
																0
															],
															[
																0,
																-1.6381
															],
															[
																1.6381000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 28.062,
												s: [
													{
														c: true,
														v: [
															[
																5.9688,
																2.9844
															],
															[
																2.9844,
																5.9688
															],
															[
																0,
																2.9844
															],
															[
																2.9844,
																0
															],
															[
																5.9688,
																2.9844
															],
															[
																5.9688,
																2.9844
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6483,
																0
															],
															[
																0,
																1.6483
															],
															[
																-1.6483,
																0
															],
															[
																0,
																-1.6483
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6482999999999999
															],
															[
																-1.6483,
																0
															],
															[
																0,
																-1.6483
															],
															[
																1.6482999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 29.058,
												s: [
													{
														c: true,
														v: [
															[
																5.992,
																2.996
															],
															[
																2.996,
																5.992
															],
															[
																0.0001,
																2.996
															],
															[
																2.996,
																0.0001
															],
															[
																5.992,
																2.996
															],
															[
																5.992,
																2.996
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6547,
																0
															],
															[
																0,
																1.6547
															],
															[
																-1.6547,
																0
															],
															[
																0,
																-1.6547
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6547000000000005
															],
															[
																-1.6547,
																0
															],
															[
																0,
																-1.6547
															],
															[
																1.6547000000000005,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.06,
												s: [
													{
														c: true,
														v: [
															[
																6,
																3
															],
															[
																3,
																6
															],
															[
																0,
																3
															],
															[
																3,
																0
															],
															[
																6,
																3
															],
															[
																6,
																3
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6569,
																0
															],
															[
																0,
																1.6569
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6569000000000003
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																1.6569000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.12,
												s: [
													{
														c: true,
														v: [
															[
																6,
																3
															],
															[
																3,
																6
															],
															[
																0,
																3
															],
															[
																3,
																0
															],
															[
																6,
																3
															],
															[
																6,
																3
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6569,
																0
															],
															[
																0,
																1.6569
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6569000000000003
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																1.6569000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 31.122000000000003,
												s: [
													{
														c: true,
														v: [
															[
																5.9894,
																2.9947
															],
															[
																2.9947,
																5.9894
															],
															[
																0,
																2.9947
															],
															[
																2.9947,
																0
															],
															[
																5.9894,
																2.9947
															],
															[
																5.9894,
																2.9947
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.654,
																0
															],
															[
																0,
																1.654
															],
															[
																-1.654,
																0
															],
															[
																0,
																-1.654
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.654
															],
															[
																-1.654,
																0
															],
															[
																0,
																-1.654
															],
															[
																1.654,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 32.118,
												s: [
													{
														c: true,
														v: [
															[
																5.9574,
																2.9787
															],
															[
																2.9787,
																5.9574
															],
															[
																0.0001,
																2.9787
															],
															[
																2.9787,
																0.0001
															],
															[
																5.9574,
																2.9787
															],
															[
																5.9574,
																2.9787
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6451,
																0
															],
															[
																0,
																1.6451
															],
															[
																-1.6451,
																0
															],
															[
																0,
																-1.6451
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6451000000000002
															],
															[
																-1.6451,
																0
															],
															[
																0,
																-1.6451
															],
															[
																1.6451000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																5.9022,
																2.9511
															],
															[
																2.9511,
																5.9022
															],
															[
																0,
																2.9511
															],
															[
																2.9511,
																0
															],
															[
																5.9022,
																2.9511
															],
															[
																5.9022,
																2.9511
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6299,
																0
															],
															[
																0,
																1.6299
															],
															[
																-1.6299,
																0
															],
															[
																0,
																-1.6299
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6298999999999997
															],
															[
																-1.6299,
																0
															],
															[
																0,
																-1.6299
															],
															[
																1.6298999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 34.122,
												s: [
													{
														c: true,
														v: [
															[
																5.8236,
																2.9118
															],
															[
																2.9118,
																5.8236
															],
															[
																0.0001,
																2.9118
															],
															[
																2.9118,
																0.0001
															],
															[
																5.8236,
																2.9118
															],
															[
																5.8236,
																2.9118
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6082,
																0
															],
															[
																0,
																1.6082
															],
															[
																-1.6082,
																0
															],
															[
																0,
																-1.6082
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6081999999999996
															],
															[
																-1.6082,
																0
															],
															[
																0,
																-1.6082
															],
															[
																1.6081999999999996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 35.118,
												s: [
													{
														c: true,
														v: [
															[
																5.7214,
																2.8607
															],
															[
																2.8607,
																5.7214
															],
															[
																0,
																2.8607
															],
															[
																2.8607,
																0
															],
															[
																5.7214,
																2.8607
															],
															[
																5.7214,
																2.8607
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.58,
																0
															],
															[
																0,
																1.58
															],
															[
																-1.58,
																0
															],
															[
																0,
																-1.58
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5799999999999996
															],
															[
																-1.58,
																0
															],
															[
																0,
																-1.58
															],
															[
																1.5799999999999996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.12,
												s: [
													{
														c: true,
														v: [
															[
																5.5943,
																2.7971
															],
															[
																2.7972,
																5.5942
															],
															[
																0.0001,
																2.7971
															],
															[
																2.7972,
																0
															],
															[
																5.5943,
																2.7971
															],
															[
																5.5943,
																2.7971
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5449,
																0
															],
															[
																0,
																1.5449
															],
															[
																-1.5449,
																0
															],
															[
																0,
																-1.5449
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5448999999999997
															],
															[
																-1.5449,
																0
															],
															[
																0,
																-1.5449
															],
															[
																1.5449000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 37.122,
												s: [
													{
														c: true,
														v: [
															[
																5.4432,
																2.7216
															],
															[
																2.7216,
																5.4432
															],
															[
																0.0001,
																2.7216
															],
															[
																2.7216,
																0.0001
															],
															[
																5.4432,
																2.7216
															],
															[
																5.4432,
																2.7216
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5031,
																0
															],
															[
																0,
																1.5031
															],
															[
																-1.5031,
																0
															],
															[
																0,
																-1.5031
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5031000000000003
															],
															[
																-1.5031,
																0
															],
															[
																0,
																-1.5031
															],
															[
																1.5031000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 38.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																5.2696,
																2.6348
															],
															[
																2.6348,
																5.2696
															],
															[
																0.0001,
																2.6348
															],
															[
																2.6348,
																0.0001
															],
															[
																5.2696,
																2.6348
															],
															[
																5.2696,
																2.6348
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4552,
																0
															],
															[
																0,
																1.4552
															],
															[
																-1.4552,
																0
															],
															[
																0,
																-1.4552
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4552
															],
															[
																-1.4552,
																0
															],
															[
																0,
																-1.4552
															],
															[
																1.4552,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 39.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																5.0729,
																2.5365
															],
															[
																2.5364,
																5.073
															],
															[
																0,
																2.5365
															],
															[
																2.5364,
																0.0001
															],
															[
																5.0729,
																2.5365
															],
															[
																5.0729,
																2.5365
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4009,
																0
															],
															[
																0,
																1.4009
															],
															[
																-1.4009,
																0
															],
															[
																0,
																-1.4009
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4009
															],
															[
																-1.4009,
																0
															],
															[
																0,
																-1.4009
															],
															[
																1.4009,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 40.122,
												s: [
													{
														c: true,
														v: [
															[
																4.8568,
																2.4284
															],
															[
																2.4284,
																4.8568
															],
															[
																0.0001,
																2.4284
															],
															[
																2.4284,
																0.0001
															],
															[
																4.8568,
																2.4284
															],
															[
																4.8568,
																2.4284
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3412,
																0
															],
															[
																0,
																1.3412
															],
															[
																-1.3412,
																0
															],
															[
																0,
																-1.3412
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3411999999999997
															],
															[
																-1.3412,
																0
															],
															[
																0,
																-1.3412
															],
															[
																1.3411999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 41.118,
												s: [
													{
														c: true,
														v: [
															[
																4.6254,
																2.3127
															],
															[
																2.3127,
																4.6254
															],
															[
																0,
																2.3127
															],
															[
																2.3127,
																0
															],
															[
																4.6254,
																2.3127
															],
															[
																4.6254,
																2.3127
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2773,
																0
															],
															[
																0,
																1.2773
															],
															[
																-1.2773,
																0
															],
															[
																0,
																-1.2773
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2772999999999999
															],
															[
																-1.2773,
																0
															],
															[
																0,
																-1.2773
															],
															[
																1.2772999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 42.12,
												s: [
													{
														c: true,
														v: [
															[
																4.3802,
																2.1901
															],
															[
																2.1901,
																4.3802
															],
															[
																0.0001,
																2.1901
															],
															[
																2.1901,
																0.0001
															],
															[
																4.3802,
																2.1901
															],
															[
																4.3802,
																2.1901
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2096,
																0
															],
															[
																0,
																1.2096
															],
															[
																-1.2096,
																0
															],
															[
																0,
																-1.2096
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2096
															],
															[
																-1.2096,
																0
															],
															[
																0,
																-1.2096
															],
															[
																1.2096,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 43.122,
												s: [
													{
														c: true,
														v: [
															[
																4.1272,
																2.0636
															],
															[
																2.0636,
																4.1272
															],
															[
																0,
																2.0636
															],
															[
																2.0636,
																0
															],
															[
																4.1272,
																2.0636
															],
															[
																4.1272,
																2.0636
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1397,
																0
															],
															[
																0,
																1.1397
															],
															[
																-1.1397,
																0
															],
															[
																0,
																-1.1397
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1397
															],
															[
																-1.1397,
																0
															],
															[
																0,
																-1.1397
															],
															[
																1.1397,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 44.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																3.873,
																1.9365
															],
															[
																1.9365,
																3.873
															],
															[
																0.0001,
																1.9365
															],
															[
																1.9365,
																0.0001
															],
															[
																3.873,
																1.9365
															],
															[
																3.873,
																1.9365
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.0695,
																0
															],
															[
																0,
																1.0695
															],
															[
																-1.0695,
																0
															],
															[
																0,
																-1.0695
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0695000000000001
															],
															[
																-1.0695,
																0
															],
															[
																0,
																-1.0695
															],
															[
																1.0695000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 45.12,
												s: [
													{
														c: true,
														v: [
															[
																3.62,
																1.81
															],
															[
																1.81,
																3.62
															],
															[
																0.0001,
																1.81
															],
															[
																1.81,
																0.0001
															],
															[
																3.62,
																1.81
															],
															[
																3.62,
																1.81
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9996,
																0
															],
															[
																0,
																0.9996
															],
															[
																-0.9996,
																0
															],
															[
																0,
																-0.9996
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9996
															],
															[
																-0.9996,
																0
															],
															[
																0,
																-0.9996
															],
															[
																0.9996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 46.122,
												s: [
													{
														c: true,
														v: [
															[
																3.3746,
																1.6873
															],
															[
																1.6873,
																3.3746
															],
															[
																0,
																1.6873
															],
															[
																1.6873,
																0
															],
															[
																3.3746,
																1.6873
															],
															[
																3.3746,
																1.6873
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9319,
																0
															],
															[
																0,
																0.9319
															],
															[
																-0.9319,
																0
															],
															[
																0,
																-0.9319
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9319000000000002
															],
															[
																-0.9319,
																0
															],
															[
																0,
																-0.9319
															],
															[
																0.9319000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 47.118,
												s: [
													{
														c: true,
														v: [
															[
																3.1434,
																1.5717
															],
															[
																1.5717,
																3.1434
															],
															[
																0.0001,
																1.5717
															],
															[
																1.5717,
																0.0001
															],
															[
																3.1434,
																1.5717
															],
															[
																3.1434,
																1.5717
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.868,
																0
															],
															[
																0,
																0.868
															],
															[
																-0.868,
																0
															],
															[
																0,
																-0.868
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8680000000000001
															],
															[
																-0.868,
																0
															],
															[
																0,
																-0.868
															],
															[
																0.8680000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 48.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																2.9271,
																1.4635
															],
															[
																1.4636,
																2.927
															],
															[
																0.0001,
																1.4635
															],
															[
																1.4636,
																0
															],
															[
																2.9271,
																1.4635
															],
															[
																2.9271,
																1.4635
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8083,
																0
															],
															[
																0,
																0.8083
															],
															[
																-0.8083,
																0
															],
															[
																0,
																-0.8083
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8082999999999998
															],
															[
																-0.8083,
																0
															],
															[
																0,
																-0.8083
															],
															[
																0.8083,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 49.122,
												s: [
													{
														c: true,
														v: [
															[
																2.7306,
																1.3653
															],
															[
																1.3653,
																2.7306
															],
															[
																0.0001,
																1.3653
															],
															[
																1.3653,
																0.0001
															],
															[
																2.7306,
																1.3653
															],
															[
																2.7306,
																1.3653
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.754,
																0
															],
															[
																0,
																0.754
															],
															[
																-0.754,
																0
															],
															[
																0,
																-0.754
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.754
															],
															[
																-0.754,
																0
															],
															[
																0,
																-0.754
															],
															[
																0.754,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 50.118,
												s: [
													{
														c: true,
														v: [
															[
																2.557,
																1.2785
															],
															[
																1.2785,
																2.557
															],
															[
																0.0001,
																1.2785
															],
															[
																1.2785,
																0.0001
															],
															[
																2.557,
																1.2785
															],
															[
																2.557,
																1.2785
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7061,
																0
															],
															[
																0,
																0.7061
															],
															[
																-0.7061,
																0
															],
															[
																0,
																-0.7061
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7061
															],
															[
																-0.7061,
																0
															],
															[
																0,
																-0.7061
															],
															[
																0.7061,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 51.12,
												s: [
													{
														c: true,
														v: [
															[
																2.4058,
																1.2029
															],
															[
																1.2029,
																2.4058
															],
															[
																0.0001,
																1.2029
															],
															[
																1.2029,
																0.0001
															],
															[
																2.4058,
																1.2029
															],
															[
																2.4058,
																1.2029
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6643,
																0
															],
															[
																0,
																0.6643
															],
															[
																-0.6643,
																0
															],
															[
																0,
																-0.6643
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6642999999999999
															],
															[
																-0.6643,
																0
															],
															[
																0,
																-0.6643
															],
															[
																0.6642999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 52.122,
												s: [
													{
														c: true,
														v: [
															[
																2.2786,
																1.1393
															],
															[
																1.1393,
																2.2786
															],
															[
																0,
																1.1393
															],
															[
																1.1393,
																0
															],
															[
																2.2786,
																1.1393
															],
															[
																2.2786,
																1.1393
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6292,
																0
															],
															[
																0,
																0.6292
															],
															[
																-0.6292,
																0
															],
															[
																0,
																-0.6292
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6292
															],
															[
																-0.6292,
																0
															],
															[
																0,
																-0.6292
															],
															[
																0.6292,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 53.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																2.1766,
																1.0883
															],
															[
																1.0883,
																2.1766
															],
															[
																0.0001,
																1.0883
															],
															[
																1.0883,
																0.0001
															],
															[
																2.1766,
																1.0883
															],
															[
																2.1766,
																1.0883
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.601,
																0
															],
															[
																0,
																0.601
															],
															[
																-0.601,
																0
															],
															[
																0,
																-0.601
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.601
															],
															[
																-0.601,
																0
															],
															[
																0,
																-0.601
															],
															[
																0.601,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 54.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																2.0978,
																1.0489
															],
															[
																1.0489,
																2.0978
															],
															[
																0,
																1.0489
															],
															[
																1.0489,
																0
															],
															[
																2.0978,
																1.0489
															],
															[
																2.0978,
																1.0489
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5793,
																0
															],
															[
																0,
																0.5793
															],
															[
																-0.5793,
																0
															],
															[
																0,
																-0.5793
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5793000000000001
															],
															[
																-0.5793,
																0
															],
															[
																0,
																-0.5793
															],
															[
																0.5793000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 55.122,
												s: [
													{
														c: true,
														v: [
															[
																2.0428,
																1.0214
															],
															[
																1.0214,
																2.0428
															],
															[
																0.0001,
																1.0214
															],
															[
																1.0214,
																0.0001
															],
															[
																2.0428,
																1.0214
															],
															[
																2.0428,
																1.0214
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5641,
																0
															],
															[
																0,
																0.5641
															],
															[
																-0.5641,
																0
															],
															[
																0,
																-0.5641
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5641
															],
															[
																-0.5641,
																0
															],
															[
																0,
																-0.5641
															],
															[
																0.5641,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 56.118,
												s: [
													{
														c: true,
														v: [
															[
																2.0106,
																1.0053
															],
															[
																1.0053,
																2.0106
															],
															[
																0,
																1.0053
															],
															[
																1.0053,
																0
															],
															[
																2.0106,
																1.0053
															],
															[
																2.0106,
																1.0053
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5552,
																0
															],
															[
																0,
																0.5552
															],
															[
																-0.5552,
																0
															],
															[
																0,
																-0.5552
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5552000000000001
															],
															[
																-0.5552,
																0
															],
															[
																0,
																-0.5552
															],
															[
																0.5552000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 57.12,
												s: [
													{
														c: true,
														v: [
															[
																2,
																1
															],
															[
																1,
																2
															],
															[
																0,
																1
															],
															[
																1,
																0
															],
															[
																2,
																1
															],
															[
																2,
																1
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5523,
																0
															],
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0.5523,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Ellipse 3 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 30.12,
									s: [
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 57.12,
									s: [
										60
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 30.12,
									s: [
										6,
										6
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 57.12,
									s: [
										8,
										8
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 30.12,
					op: 57.12,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Ellipse 3",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 30.12,
									s: [
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 57.12,
									s: [
										60
									]
								}
							]
						}
					},
					ao: 0,
					ip: 30.12,
					op: 57.12,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 30.12,
												s: [
													{
														c: true,
														v: [
															[
																6,
																3
															],
															[
																3,
																6
															],
															[
																0,
																3
															],
															[
																3,
																0
															],
															[
																6,
																3
															],
															[
																6,
																3
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6569,
																0
															],
															[
																0,
																1.6569
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6569000000000003
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																1.6569000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 31.122000000000003,
												s: [
													{
														c: true,
														v: [
															[
																5.9894,
																2.9947
															],
															[
																2.9947,
																5.9894
															],
															[
																0,
																2.9947
															],
															[
																2.9947,
																0
															],
															[
																5.9894,
																2.9947
															],
															[
																5.9894,
																2.9947
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.654,
																0
															],
															[
																0,
																1.654
															],
															[
																-1.654,
																0
															],
															[
																0,
																-1.654
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.654
															],
															[
																-1.654,
																0
															],
															[
																0,
																-1.654
															],
															[
																1.654,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 32.118,
												s: [
													{
														c: true,
														v: [
															[
																5.9574,
																2.9787
															],
															[
																2.9787,
																5.9574
															],
															[
																0.0001,
																2.9787
															],
															[
																2.9787,
																0.0001
															],
															[
																5.9574,
																2.9787
															],
															[
																5.9574,
																2.9787
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6451,
																0
															],
															[
																0,
																1.6451
															],
															[
																-1.6451,
																0
															],
															[
																0,
																-1.6451
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6451000000000002
															],
															[
																-1.6451,
																0
															],
															[
																0,
																-1.6451
															],
															[
																1.6451000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																5.9022,
																2.9511
															],
															[
																2.9511,
																5.9022
															],
															[
																0,
																2.9511
															],
															[
																2.9511,
																0
															],
															[
																5.9022,
																2.9511
															],
															[
																5.9022,
																2.9511
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6299,
																0
															],
															[
																0,
																1.6299
															],
															[
																-1.6299,
																0
															],
															[
																0,
																-1.6299
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6298999999999997
															],
															[
																-1.6299,
																0
															],
															[
																0,
																-1.6299
															],
															[
																1.6298999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 34.122,
												s: [
													{
														c: true,
														v: [
															[
																5.8236,
																2.9118
															],
															[
																2.9118,
																5.8236
															],
															[
																0.0001,
																2.9118
															],
															[
																2.9118,
																0.0001
															],
															[
																5.8236,
																2.9118
															],
															[
																5.8236,
																2.9118
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6082,
																0
															],
															[
																0,
																1.6082
															],
															[
																-1.6082,
																0
															],
															[
																0,
																-1.6082
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6081999999999996
															],
															[
																-1.6082,
																0
															],
															[
																0,
																-1.6082
															],
															[
																1.6081999999999996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 35.118,
												s: [
													{
														c: true,
														v: [
															[
																5.7214,
																2.8607
															],
															[
																2.8607,
																5.7214
															],
															[
																0,
																2.8607
															],
															[
																2.8607,
																0
															],
															[
																5.7214,
																2.8607
															],
															[
																5.7214,
																2.8607
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.58,
																0
															],
															[
																0,
																1.58
															],
															[
																-1.58,
																0
															],
															[
																0,
																-1.58
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5799999999999996
															],
															[
																-1.58,
																0
															],
															[
																0,
																-1.58
															],
															[
																1.5799999999999996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.12,
												s: [
													{
														c: true,
														v: [
															[
																5.5943,
																2.7971
															],
															[
																2.7972,
																5.5942
															],
															[
																0.0001,
																2.7971
															],
															[
																2.7972,
																0
															],
															[
																5.5943,
																2.7971
															],
															[
																5.5943,
																2.7971
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5449,
																0
															],
															[
																0,
																1.5449
															],
															[
																-1.5449,
																0
															],
															[
																0,
																-1.5449
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5448999999999997
															],
															[
																-1.5449,
																0
															],
															[
																0,
																-1.5449
															],
															[
																1.5449000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 37.122,
												s: [
													{
														c: true,
														v: [
															[
																5.4432,
																2.7216
															],
															[
																2.7216,
																5.4432
															],
															[
																0.0001,
																2.7216
															],
															[
																2.7216,
																0.0001
															],
															[
																5.4432,
																2.7216
															],
															[
																5.4432,
																2.7216
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5031,
																0
															],
															[
																0,
																1.5031
															],
															[
																-1.5031,
																0
															],
															[
																0,
																-1.5031
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5031000000000003
															],
															[
																-1.5031,
																0
															],
															[
																0,
																-1.5031
															],
															[
																1.5031000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 38.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																5.2696,
																2.6348
															],
															[
																2.6348,
																5.2696
															],
															[
																0.0001,
																2.6348
															],
															[
																2.6348,
																0.0001
															],
															[
																5.2696,
																2.6348
															],
															[
																5.2696,
																2.6348
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4552,
																0
															],
															[
																0,
																1.4552
															],
															[
																-1.4552,
																0
															],
															[
																0,
																-1.4552
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4552
															],
															[
																-1.4552,
																0
															],
															[
																0,
																-1.4552
															],
															[
																1.4552,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 39.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																5.0729,
																2.5365
															],
															[
																2.5364,
																5.073
															],
															[
																0,
																2.5365
															],
															[
																2.5364,
																0.0001
															],
															[
																5.0729,
																2.5365
															],
															[
																5.0729,
																2.5365
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4009,
																0
															],
															[
																0,
																1.4009
															],
															[
																-1.4009,
																0
															],
															[
																0,
																-1.4009
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4009
															],
															[
																-1.4009,
																0
															],
															[
																0,
																-1.4009
															],
															[
																1.4009,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 40.122,
												s: [
													{
														c: true,
														v: [
															[
																4.8568,
																2.4284
															],
															[
																2.4284,
																4.8568
															],
															[
																0.0001,
																2.4284
															],
															[
																2.4284,
																0.0001
															],
															[
																4.8568,
																2.4284
															],
															[
																4.8568,
																2.4284
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3412,
																0
															],
															[
																0,
																1.3412
															],
															[
																-1.3412,
																0
															],
															[
																0,
																-1.3412
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3411999999999997
															],
															[
																-1.3412,
																0
															],
															[
																0,
																-1.3412
															],
															[
																1.3411999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 41.118,
												s: [
													{
														c: true,
														v: [
															[
																4.6254,
																2.3127
															],
															[
																2.3127,
																4.6254
															],
															[
																0,
																2.3127
															],
															[
																2.3127,
																0
															],
															[
																4.6254,
																2.3127
															],
															[
																4.6254,
																2.3127
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2773,
																0
															],
															[
																0,
																1.2773
															],
															[
																-1.2773,
																0
															],
															[
																0,
																-1.2773
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2772999999999999
															],
															[
																-1.2773,
																0
															],
															[
																0,
																-1.2773
															],
															[
																1.2772999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 42.12,
												s: [
													{
														c: true,
														v: [
															[
																4.3802,
																2.1901
															],
															[
																2.1901,
																4.3802
															],
															[
																0.0001,
																2.1901
															],
															[
																2.1901,
																0.0001
															],
															[
																4.3802,
																2.1901
															],
															[
																4.3802,
																2.1901
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2096,
																0
															],
															[
																0,
																1.2096
															],
															[
																-1.2096,
																0
															],
															[
																0,
																-1.2096
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2096
															],
															[
																-1.2096,
																0
															],
															[
																0,
																-1.2096
															],
															[
																1.2096,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 43.122,
												s: [
													{
														c: true,
														v: [
															[
																4.1272,
																2.0636
															],
															[
																2.0636,
																4.1272
															],
															[
																0,
																2.0636
															],
															[
																2.0636,
																0
															],
															[
																4.1272,
																2.0636
															],
															[
																4.1272,
																2.0636
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1397,
																0
															],
															[
																0,
																1.1397
															],
															[
																-1.1397,
																0
															],
															[
																0,
																-1.1397
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1397
															],
															[
																-1.1397,
																0
															],
															[
																0,
																-1.1397
															],
															[
																1.1397,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 44.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																3.873,
																1.9365
															],
															[
																1.9365,
																3.873
															],
															[
																0.0001,
																1.9365
															],
															[
																1.9365,
																0.0001
															],
															[
																3.873,
																1.9365
															],
															[
																3.873,
																1.9365
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.0695,
																0
															],
															[
																0,
																1.0695
															],
															[
																-1.0695,
																0
															],
															[
																0,
																-1.0695
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0695000000000001
															],
															[
																-1.0695,
																0
															],
															[
																0,
																-1.0695
															],
															[
																1.0695000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 45.12,
												s: [
													{
														c: true,
														v: [
															[
																3.62,
																1.81
															],
															[
																1.81,
																3.62
															],
															[
																0.0001,
																1.81
															],
															[
																1.81,
																0.0001
															],
															[
																3.62,
																1.81
															],
															[
																3.62,
																1.81
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9996,
																0
															],
															[
																0,
																0.9996
															],
															[
																-0.9996,
																0
															],
															[
																0,
																-0.9996
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9996
															],
															[
																-0.9996,
																0
															],
															[
																0,
																-0.9996
															],
															[
																0.9996,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 46.122,
												s: [
													{
														c: true,
														v: [
															[
																3.3746,
																1.6873
															],
															[
																1.6873,
																3.3746
															],
															[
																0,
																1.6873
															],
															[
																1.6873,
																0
															],
															[
																3.3746,
																1.6873
															],
															[
																3.3746,
																1.6873
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9319,
																0
															],
															[
																0,
																0.9319
															],
															[
																-0.9319,
																0
															],
															[
																0,
																-0.9319
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9319000000000002
															],
															[
																-0.9319,
																0
															],
															[
																0,
																-0.9319
															],
															[
																0.9319000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 47.118,
												s: [
													{
														c: true,
														v: [
															[
																3.1434,
																1.5717
															],
															[
																1.5717,
																3.1434
															],
															[
																0.0001,
																1.5717
															],
															[
																1.5717,
																0.0001
															],
															[
																3.1434,
																1.5717
															],
															[
																3.1434,
																1.5717
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.868,
																0
															],
															[
																0,
																0.868
															],
															[
																-0.868,
																0
															],
															[
																0,
																-0.868
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8680000000000001
															],
															[
																-0.868,
																0
															],
															[
																0,
																-0.868
															],
															[
																0.8680000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 48.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																2.9271,
																1.4635
															],
															[
																1.4636,
																2.927
															],
															[
																0.0001,
																1.4635
															],
															[
																1.4636,
																0
															],
															[
																2.9271,
																1.4635
															],
															[
																2.9271,
																1.4635
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8083,
																0
															],
															[
																0,
																0.8083
															],
															[
																-0.8083,
																0
															],
															[
																0,
																-0.8083
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8082999999999998
															],
															[
																-0.8083,
																0
															],
															[
																0,
																-0.8083
															],
															[
																0.8083,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 49.122,
												s: [
													{
														c: true,
														v: [
															[
																2.7306,
																1.3653
															],
															[
																1.3653,
																2.7306
															],
															[
																0.0001,
																1.3653
															],
															[
																1.3653,
																0.0001
															],
															[
																2.7306,
																1.3653
															],
															[
																2.7306,
																1.3653
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.754,
																0
															],
															[
																0,
																0.754
															],
															[
																-0.754,
																0
															],
															[
																0,
																-0.754
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.754
															],
															[
																-0.754,
																0
															],
															[
																0,
																-0.754
															],
															[
																0.754,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 50.118,
												s: [
													{
														c: true,
														v: [
															[
																2.557,
																1.2785
															],
															[
																1.2785,
																2.557
															],
															[
																0.0001,
																1.2785
															],
															[
																1.2785,
																0.0001
															],
															[
																2.557,
																1.2785
															],
															[
																2.557,
																1.2785
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7061,
																0
															],
															[
																0,
																0.7061
															],
															[
																-0.7061,
																0
															],
															[
																0,
																-0.7061
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7061
															],
															[
																-0.7061,
																0
															],
															[
																0,
																-0.7061
															],
															[
																0.7061,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 51.12,
												s: [
													{
														c: true,
														v: [
															[
																2.4058,
																1.2029
															],
															[
																1.2029,
																2.4058
															],
															[
																0.0001,
																1.2029
															],
															[
																1.2029,
																0.0001
															],
															[
																2.4058,
																1.2029
															],
															[
																2.4058,
																1.2029
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6643,
																0
															],
															[
																0,
																0.6643
															],
															[
																-0.6643,
																0
															],
															[
																0,
																-0.6643
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6642999999999999
															],
															[
																-0.6643,
																0
															],
															[
																0,
																-0.6643
															],
															[
																0.6642999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 52.122,
												s: [
													{
														c: true,
														v: [
															[
																2.2786,
																1.1393
															],
															[
																1.1393,
																2.2786
															],
															[
																0,
																1.1393
															],
															[
																1.1393,
																0
															],
															[
																2.2786,
																1.1393
															],
															[
																2.2786,
																1.1393
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6292,
																0
															],
															[
																0,
																0.6292
															],
															[
																-0.6292,
																0
															],
															[
																0,
																-0.6292
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6292
															],
															[
																-0.6292,
																0
															],
															[
																0,
																-0.6292
															],
															[
																0.6292,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 53.117999999999995,
												s: [
													{
														c: true,
														v: [
															[
																2.1766,
																1.0883
															],
															[
																1.0883,
																2.1766
															],
															[
																0.0001,
																1.0883
															],
															[
																1.0883,
																0.0001
															],
															[
																2.1766,
																1.0883
															],
															[
																2.1766,
																1.0883
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.601,
																0
															],
															[
																0,
																0.601
															],
															[
																-0.601,
																0
															],
															[
																0,
																-0.601
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.601
															],
															[
																-0.601,
																0
															],
															[
																0,
																-0.601
															],
															[
																0.601,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 54.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																2.0978,
																1.0489
															],
															[
																1.0489,
																2.0978
															],
															[
																0,
																1.0489
															],
															[
																1.0489,
																0
															],
															[
																2.0978,
																1.0489
															],
															[
																2.0978,
																1.0489
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5793,
																0
															],
															[
																0,
																0.5793
															],
															[
																-0.5793,
																0
															],
															[
																0,
																-0.5793
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5793000000000001
															],
															[
																-0.5793,
																0
															],
															[
																0,
																-0.5793
															],
															[
																0.5793000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 55.122,
												s: [
													{
														c: true,
														v: [
															[
																2.0428,
																1.0214
															],
															[
																1.0214,
																2.0428
															],
															[
																0.0001,
																1.0214
															],
															[
																1.0214,
																0.0001
															],
															[
																2.0428,
																1.0214
															],
															[
																2.0428,
																1.0214
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5641,
																0
															],
															[
																0,
																0.5641
															],
															[
																-0.5641,
																0
															],
															[
																0,
																-0.5641
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5641
															],
															[
																-0.5641,
																0
															],
															[
																0,
																-0.5641
															],
															[
																0.5641,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 56.118,
												s: [
													{
														c: true,
														v: [
															[
																2.0106,
																1.0053
															],
															[
																1.0053,
																2.0106
															],
															[
																0,
																1.0053
															],
															[
																1.0053,
																0
															],
															[
																2.0106,
																1.0053
															],
															[
																2.0106,
																1.0053
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5552,
																0
															],
															[
																0,
																0.5552
															],
															[
																-0.5552,
																0
															],
															[
																0,
																-0.5552
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5552000000000001
															],
															[
																-0.5552,
																0
															],
															[
																0,
																-0.5552
															],
															[
																0.5552000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 57.12,
												s: [
													{
														c: true,
														v: [
															[
																2,
																1
															],
															[
																1,
																2
															],
															[
																0,
																1
															],
															[
																1,
																0
															],
															[
																2,
																1
															],
															[
																2,
																1
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5523,
																0
															],
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0.5523,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "Ellipse 3 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										60
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.06,
									s: [
										100
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										8,
										8
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 30.06,
									s: [
										6,
										6
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 30.06,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Ellipse 3",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										60
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.06,
									s: [
										100
									]
								}
							]
						}
					},
					ao: 0,
					ip: 0,
					op: 30.06,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																2,
																1
															],
															[
																1,
																2
															],
															[
																0,
																1
															],
															[
																1,
																0
															],
															[
																2,
																1
															],
															[
																2,
																1
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5523,
																0
															],
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.5523
															],
															[
																-0.5523,
																0
															],
															[
																0,
																-0.5523
															],
															[
																0.5523,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 1.062,
												s: [
													{
														c: true,
														v: [
															[
																2.222,
																1.111
															],
															[
																1.111,
																2.222
															],
															[
																0,
																1.111
															],
															[
																1.111,
																0
															],
															[
																2.222,
																1.111
															],
															[
																2.222,
																1.111
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6136,
																0
															],
															[
																0,
																0.6136
															],
															[
																-0.6136,
																0
															],
															[
																0,
																-0.6136
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6136000000000001
															],
															[
																-0.6136,
																0
															],
															[
																0,
																-0.6136
															],
															[
																0.6136000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 2.058,
												s: [
													{
														c: true,
														v: [
															[
																2.4344,
																1.2172
															],
															[
																1.2172,
																2.4344
															],
															[
																0,
																1.2172
															],
															[
																1.2172,
																0
															],
															[
																2.4344,
																1.2172
															],
															[
																2.4344,
																1.2172
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.6723,
																0
															],
															[
																0,
																0.6723
															],
															[
																-0.6723,
																0
															],
															[
																0,
																-0.6723
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.6722999999999999
															],
															[
																-0.6723,
																0
															],
															[
																0,
																-0.6723
															],
															[
																0.6722999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 3.0599999999999996,
												s: [
													{
														c: true,
														v: [
															[
																2.6424,
																1.3212
															],
															[
																1.3212,
																2.6424
															],
															[
																0.0001,
																1.3212
															],
															[
																1.3212,
																0.0001
															],
															[
																2.6424,
																1.3212
															],
															[
																2.6424,
																1.3212
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7297,
																0
															],
															[
																0,
																0.7297
															],
															[
																-0.7297,
																0
															],
															[
																0,
																-0.7297
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7297
															],
															[
																-0.7297,
																0
															],
															[
																0,
																-0.7297
															],
															[
																0.7297,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 4.061999999999999,
												s: [
													{
														c: true,
														v: [
															[
																2.8448,
																1.4224
															],
															[
																1.4224,
																2.8448
															],
															[
																0,
																1.4224
															],
															[
																1.4224,
																0
															],
															[
																2.8448,
																1.4224
															],
															[
																2.8448,
																1.4224
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.7856,
																0
															],
															[
																0,
																0.7856
															],
															[
																-0.7856,
																0
															],
															[
																0,
																-0.7856
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.7856000000000001
															],
															[
																-0.7856,
																0
															],
															[
																0,
																-0.7856
															],
															[
																0.7856000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 5.058,
												s: [
													{
														c: true,
														v: [
															[
																3.041,
																1.5205
															],
															[
																1.5205,
																3.041
															],
															[
																0,
																1.5205
															],
															[
																1.5205,
																0
															],
															[
																3.041,
																1.5205
															],
															[
																3.041,
																1.5205
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8398,
																0
															],
															[
																0,
																0.8398
															],
															[
																-0.8398,
																0
															],
															[
																0,
																-0.8398
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8398000000000001
															],
															[
																-0.8398,
																0
															],
															[
																0,
																-0.8398
															],
															[
																0.8398000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 6.0600000000000005,
												s: [
													{
														c: true,
														v: [
															[
																3.2336,
																1.6168
															],
															[
																1.6168,
																3.2336
															],
															[
																0.0001,
																1.6168
															],
															[
																1.6168,
																0.0001
															],
															[
																3.2336,
																1.6168
															],
															[
																3.2336,
																1.6168
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.8929,
																0
															],
															[
																0,
																0.8929
															],
															[
																-0.8929,
																0
															],
															[
																0,
																-0.8929
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8929
															],
															[
																-0.8929,
																0
															],
															[
																0,
																-0.8929
															],
															[
																0.8929,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 7.062,
												s: [
													{
														c: true,
														v: [
															[
																3.4212,
																1.7106
															],
															[
																1.7106,
																3.4212
															],
															[
																0.0001,
																1.7106
															],
															[
																1.7106,
																0.0001
															],
															[
																3.4212,
																1.7106
															],
															[
																3.4212,
																1.7106
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9447,
																0
															],
															[
																0,
																0.9447
															],
															[
																-0.9447,
																0
															],
															[
																0,
																-0.9447
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9447000000000001
															],
															[
																-0.9447,
																0
															],
															[
																0,
																-0.9447
															],
															[
																0.9447000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6028,
																1.8014
															],
															[
																1.8014,
																3.6028
															],
															[
																0,
																1.8014
															],
															[
																1.8014,
																0
															],
															[
																3.6028,
																1.8014
															],
															[
																3.6028,
																1.8014
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9949,
																0
															],
															[
																0,
																0.9949
															],
															[
																-0.9949,
																0
															],
															[
																0,
																-0.9949
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9949000000000001
															],
															[
																-0.9949,
																0
															],
															[
																0,
																-0.9949
															],
															[
																0.9949000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 9.06,
												s: [
													{
														c: true,
														v: [
															[
																3.7808,
																1.8904
															],
															[
																1.8904,
																3.7808
															],
															[
																0.0001,
																1.8904
															],
															[
																1.8904,
																0.0001
															],
															[
																3.7808,
																1.8904
															],
															[
																3.7808,
																1.8904
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.044,
																0
															],
															[
																0,
																1.044
															],
															[
																-1.044,
																0
															],
															[
																0,
																-1.044
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.044
															],
															[
																-1.044,
																0
															],
															[
																0,
																-1.044
															],
															[
																1.044,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 10.062,
												s: [
													{
														c: true,
														v: [
															[
																3.9538,
																1.9769
															],
															[
																1.9769,
																3.9538
															],
															[
																0.0001,
																1.9769
															],
															[
																1.9769,
																0.0001
															],
															[
																3.9538,
																1.9769
															],
															[
																3.9538,
																1.9769
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.0918,
																0
															],
															[
																0,
																1.0918
															],
															[
																-1.0918,
																0
															],
															[
																0,
																-1.0918
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0918
															],
															[
																-1.0918,
																0
															],
															[
																0,
																-1.0918
															],
															[
																1.0918,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 11.058,
												s: [
													{
														c: true,
														v: [
															[
																4.1208,
																2.0604
															],
															[
																2.0604,
																4.1208
															],
															[
																0.0001,
																2.0604
															],
															[
																2.0604,
																0.0001
															],
															[
																4.1208,
																2.0604
															],
															[
																4.1208,
																2.0604
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1379,
																0
															],
															[
																0,
																1.1379
															],
															[
																-1.1379,
																0
															],
															[
																0,
																-1.1379
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1378999999999997
															],
															[
																-1.1379,
																0
															],
															[
																0,
																-1.1379
															],
															[
																1.1378999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 12.06,
												s: [
													{
														c: true,
														v: [
															[
																4.2836,
																2.1418
															],
															[
																2.1418,
																4.2836
															],
															[
																0.0001,
																2.1418
															],
															[
																2.1418,
																0.0001
															],
															[
																4.2836,
																2.1418
															],
															[
																4.2836,
																2.1418
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.1829,
																0
															],
															[
																0,
																1.1829
															],
															[
																-1.1829,
																0
															],
															[
																0,
																-1.1829
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1829
															],
															[
																-1.1829,
																0
															],
															[
																0,
																-1.1829
															],
															[
																1.1829,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 13.062000000000001,
												s: [
													{
														c: true,
														v: [
															[
																4.441,
																2.2205
															],
															[
																2.2205,
																4.441
															],
															[
																0,
																2.2205
															],
															[
																2.2205,
																0
															],
															[
																4.441,
																2.2205
															],
															[
																4.441,
																2.2205
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2264,
																0
															],
															[
																0,
																1.2264
															],
															[
																-1.2264,
																0
															],
															[
																0,
																-1.2264
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2264
															],
															[
																-1.2264,
																0
															],
															[
																0,
																-1.2264
															],
															[
																1.2264,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 14.058,
												s: [
													{
														c: true,
														v: [
															[
																4.5922,
																2.2961
															],
															[
																2.2961,
																4.5922
															],
															[
																0,
																2.2961
															],
															[
																2.2961,
																0
															],
															[
																4.5922,
																2.2961
															],
															[
																4.5922,
																2.2961
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.2681,
																0
															],
															[
																0,
																1.2681
															],
															[
																-1.2681,
																0
															],
															[
																0,
																-1.2681
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2681
															],
															[
																-1.2681,
																0
															],
															[
																0,
																-1.2681
															],
															[
																1.2681,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 15.06,
												s: [
													{
														c: true,
														v: [
															[
																4.7386,
																2.3693
															],
															[
																2.3693,
																4.7386
															],
															[
																0,
																2.3693
															],
															[
																2.3693,
																0
															],
															[
																4.7386,
																2.3693
															],
															[
																4.7386,
																2.3693
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3086,
																0
															],
															[
																0,
																1.3086
															],
															[
																-1.3086,
																0
															],
															[
																0,
																-1.3086
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3086000000000002
															],
															[
																-1.3086,
																0
															],
															[
																0,
																-1.3086
															],
															[
																1.3086000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.062,
												s: [
													{
														c: true,
														v: [
															[
																4.8792,
																2.4396
															],
															[
																2.4396,
																4.8792
															],
															[
																0.0001,
																2.4396
															],
															[
																2.4396,
																0.0001
															],
															[
																4.8792,
																2.4396
															],
															[
																4.8792,
																2.4396
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3474,
																0
															],
															[
																0,
																1.3474
															],
															[
																-1.3474,
																0
															],
															[
																0,
																-1.3474
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3474
															],
															[
																-1.3474,
																0
															],
															[
																0,
																-1.3474
															],
															[
																1.3474,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 17.058,
												s: [
													{
														c: true,
														v: [
															[
																5.0126,
																2.5063
															],
															[
																2.5063,
																5.0126
															],
															[
																0,
																2.5063
															],
															[
																2.5063,
																0
															],
															[
																5.0126,
																2.5063
															],
															[
																5.0126,
																2.5063
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.3842,
																0
															],
															[
																0,
																1.3842
															],
															[
																-1.3842,
																0
															],
															[
																0,
																-1.3842
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3842000000000003
															],
															[
																-1.3842,
																0
															],
															[
																0,
																-1.3842
															],
															[
																1.3842000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 18.06,
												s: [
													{
														c: true,
														v: [
															[
																5.1406,
																2.5703
															],
															[
																2.5703,
																5.1406
															],
															[
																0,
																2.5703
															],
															[
																2.5703,
																0
															],
															[
																5.1406,
																2.5703
															],
															[
																5.1406,
																2.5703
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4196,
																0
															],
															[
																0,
																1.4196
															],
															[
																-1.4196,
																0
															],
															[
																0,
																-1.4196
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4196
															],
															[
																-1.4196,
																0
															],
															[
																0,
																-1.4196
															],
															[
																1.4196,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 19.061999999999998,
												s: [
													{
														c: true,
														v: [
															[
																5.2618,
																2.6309
															],
															[
																2.6309,
																5.2618
															],
															[
																0.0001,
																2.6309
															],
															[
																2.6309,
																0.0001
															],
															[
																5.2618,
																2.6309
															],
															[
																5.2618,
																2.6309
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.453,
																0
															],
															[
																0,
																1.453
															],
															[
																-1.453,
																0
															],
															[
																0,
																-1.453
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4529999999999998
															],
															[
																-1.453,
																0
															],
															[
																0,
																-1.453
															],
															[
																1.4529999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 20.058,
												s: [
													{
														c: true,
														v: [
															[
																5.3752,
																2.6876
															],
															[
																2.6876,
																5.3752
															],
															[
																0.0001,
																2.6876
															],
															[
																2.6876,
																0.0001
															],
															[
																5.3752,
																2.6876
															],
															[
																5.3752,
																2.6876
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.4843,
																0
															],
															[
																0,
																1.4843
															],
															[
																-1.4843,
																0
															],
															[
																0,
																-1.4843
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4842999999999997
															],
															[
																-1.4843,
																0
															],
															[
																0,
																-1.4843
															],
															[
																1.4842999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 21.06,
												s: [
													{
														c: true,
														v: [
															[
																5.4818,
																2.7409
															],
															[
																2.7409,
																5.4818
															],
															[
																0.0001,
																2.7409
															],
															[
																2.7409,
																0.0001
															],
															[
																5.4818,
																2.7409
															],
															[
																5.4818,
																2.7409
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5138,
																0
															],
															[
																0,
																1.5138
															],
															[
																-1.5138,
																0
															],
															[
																0,
																-1.5138
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5137999999999998
															],
															[
																-1.5138,
																0
															],
															[
																0,
																-1.5138
															],
															[
																1.5137999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 22.062,
												s: [
													{
														c: true,
														v: [
															[
																5.5804,
																2.7902
															],
															[
																2.7902,
																5.5804
															],
															[
																0.0001,
																2.7902
															],
															[
																2.7902,
																0.0001
															],
															[
																5.5804,
																2.7902
															],
															[
																5.5804,
																2.7902
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.541,
																0
															],
															[
																0,
																1.541
															],
															[
																-1.541,
																0
															],
															[
																0,
																-1.541
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.541
															],
															[
																-1.541,
																0
															],
															[
																0,
																-1.541
															],
															[
																1.541,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 23.058,
												s: [
													{
														c: true,
														v: [
															[
																5.6698,
																2.8349
															],
															[
																2.8349,
																5.6698
															],
															[
																0,
																2.8349
															],
															[
																2.8349,
																0
															],
															[
																5.6698,
																2.8349
															],
															[
																5.6698,
																2.8349
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5657,
																0
															],
															[
																0,
																1.5657
															],
															[
																-1.5657,
																0
															],
															[
																0,
																-1.5657
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5657000000000005
															],
															[
																-1.5657,
																0
															],
															[
																0,
																-1.5657
															],
															[
																1.5657000000000005,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.060000000000002,
												s: [
													{
														c: true,
														v: [
															[
																5.7509,
																2.8755
															],
															[
																2.8754,
																5.751
															],
															[
																0,
																2.8755
															],
															[
																2.8754,
																0.0001
															],
															[
																5.7509,
																2.8755
															],
															[
																5.7509,
																2.8755
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.5881,
																0
															],
															[
																0,
																1.5881
															],
															[
																-1.5881,
																0
															],
															[
																0,
																-1.5881
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.5881000000000003
															],
															[
																-1.5881,
																0
															],
															[
																0,
																-1.5881
															],
															[
																1.5880999999999998,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.062,
												s: [
													{
														c: true,
														v: [
															[
																5.8222,
																2.9111
															],
															[
																2.9111,
																5.8222
															],
															[
																0.0001,
																2.9111
															],
															[
																2.9111,
																0.0001
															],
															[
																5.8222,
																2.9111
															],
															[
																5.8222,
																2.9111
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6078,
																0
															],
															[
																0,
																1.6078
															],
															[
																-1.6078,
																0
															],
															[
																0,
																-1.6078
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6077999999999997
															],
															[
																-1.6078,
																0
															],
															[
																0,
																-1.6078
															],
															[
																1.6077999999999997,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 26.058,
												s: [
													{
														c: true,
														v: [
															[
																5.8826,
																2.9413
															],
															[
																2.9413,
																5.8826
															],
															[
																0.0001,
																2.9413
															],
															[
																2.9413,
																0.0001
															],
															[
																5.8826,
																2.9413
															],
															[
																5.8826,
																2.9413
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6245,
																0
															],
															[
																0,
																1.6245
															],
															[
																-1.6245,
																0
															],
															[
																0,
																-1.6245
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6245000000000003
															],
															[
																-1.6245,
																0
															],
															[
																0,
																-1.6245
															],
															[
																1.6245000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 27.060000000000002,
												s: [
													{
														c: true,
														v: [
															[
																5.9319,
																2.966
															],
															[
																2.9659,
																5.932
															],
															[
																0,
																2.966
															],
															[
																2.9659,
																0.0001
															],
															[
																5.9319,
																2.966
															],
															[
																5.9319,
																2.966
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6381,
																0
															],
															[
																0,
																1.6381
															],
															[
																-1.6381,
																0
															],
															[
																0,
																-1.6381
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6380999999999997
															],
															[
																-1.6381,
																0
															],
															[
																0,
																-1.6381
															],
															[
																1.6381000000000001,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 28.062,
												s: [
													{
														c: true,
														v: [
															[
																5.9688,
																2.9844
															],
															[
																2.9844,
																5.9688
															],
															[
																0,
																2.9844
															],
															[
																2.9844,
																0
															],
															[
																5.9688,
																2.9844
															],
															[
																5.9688,
																2.9844
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6483,
																0
															],
															[
																0,
																1.6483
															],
															[
																-1.6483,
																0
															],
															[
																0,
																-1.6483
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6482999999999999
															],
															[
																-1.6483,
																0
															],
															[
																0,
																-1.6483
															],
															[
																1.6482999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 29.058,
												s: [
													{
														c: true,
														v: [
															[
																5.992,
																2.996
															],
															[
																2.996,
																5.992
															],
															[
																0.0001,
																2.996
															],
															[
																2.996,
																0.0001
															],
															[
																5.992,
																2.996
															],
															[
																5.992,
																2.996
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6547,
																0
															],
															[
																0,
																1.6547
															],
															[
																-1.6547,
																0
															],
															[
																0,
																-1.6547
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6547000000000005
															],
															[
																-1.6547,
																0
															],
															[
																0,
																-1.6547
															],
															[
																1.6547000000000005,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.06,
												s: [
													{
														c: true,
														v: [
															[
																6,
																3
															],
															[
																3,
																6
															],
															[
																0,
																3
															],
															[
																3,
																0
															],
															[
																6,
																3
															],
															[
																6,
																3
															]
														],
														i: [
															[
																0,
																0
															],
															[
																1.6569,
																0
															],
															[
																0,
																1.6569
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.6569000000000003
															],
															[
																-1.6569,
																0
															],
															[
																0,
																-1.6569
															],
															[
																1.6569000000000003,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$2 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "record",
			refId: "m2czmkdti6rnkip3",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 18,
			h: 18,
			ip: 0,
			op: 57.12,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$2 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var RecordingAnimation = {
		fr: fr$2,
		v: v$2,
		ip: ip$2,
		op: op$2,
		w: w$2,
		h: h$2,
		nm: nm$2,
		ddd: ddd$2,
		markers: markers$2,
		assets: assets$2,
		layers: layers$2,
		meta: meta$2
	};

	var fr$1 = 60;
	var v$1 = "5.9.6";
	var ip$1 = 0;
	var op$1 = 137.12;
	var w$1 = 19;
	var h$1 = 18;
	var nm$1 = "send/1";
	var ddd$1 = 0;
	var markers$1 = [
	];
	var assets$1 = [
		{
			id: "ad33659c33381eac40061641b81f19d65a13ad9f",
			w: 1,
			h: 1,
			e: 1,
			u: "",
			p: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC"
		},
		{
			nm: "frame",
			fr: 60,
			id: "m2czp0x468684051",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "send/1 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "frame - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 24.12,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.120000000000005,
									s: [
										2,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "frame - Shape Mask",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													2.5,
													0
												],
												[
													14.5,
													0
												],
												[
													17,
													2.5
												],
												[
													17,
													2.5
												],
												[
													14.5,
													5
												],
												[
													2.5,
													5
												],
												[
													0,
													2.5
												],
												[
													0,
													2.5
												],
												[
													2.5,
													0
												],
												[
													2.5,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-1.3807
												],
												[
													0,
													0
												],
												[
													1.3807,
													0
												],
												[
													0,
													0
												],
												[
													0,
													1.3807
												],
												[
													0,
													0
												],
												[
													-1.3807,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													1.3807100000000005,
													0
												],
												[
													0,
													0
												],
												[
													0,
													1.38071
												],
												[
													0,
													0
												],
												[
													-1.38071,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-1.38071
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "frame",
			fr: 60,
			id: "m2czqsy8jrzqk00c",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "send/1 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "frame - Null",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 24.12,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.120000000000005,
									s: [
										2,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "fill - Null",
					sr: 1,
					parent: 15,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										0.5,
										1
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 24.060000000000002,
									s: [
										1,
										1
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 24.12,
									s: [
										1,
										1
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.120000000000005,
									s: [
										17.25,
										1
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "fill",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																1.75,
																0
															],
															[
																1.75,
																0
															],
															[
																3.5,
																1.75
															],
															[
																3.5,
																1.75
															],
															[
																1.75,
																3.5
															],
															[
																1.75,
																3.5
															],
															[
																0,
																1.75
															],
															[
																0,
																1.75
															],
															[
																1.75,
																0
															],
															[
																1.75,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.9665
															],
															[
																0,
																0
															],
															[
																0.9665,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.9665
															],
															[
																0,
																0
															],
															[
																-0.9665,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0.9664999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.9664999999999999
															],
															[
																0,
																0
															],
															[
																-0.9665,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.9665
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.060000000000002,
												s: [
													{
														c: true,
														v: [
															[
																1.5,
																0
															],
															[
																13.5,
																0
															],
															[
																15,
																1.5
															],
															[
																15,
																1.5
															],
															[
																13.5,
																3
															],
															[
																1.5,
																3
															],
															[
																0,
																1.5
															],
															[
																0,
																1.5
															],
															[
																1.5,
																0
															],
															[
																1.5,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.8284
															],
															[
																0,
																0
															],
															[
																0.8284,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.8284
															],
															[
																0,
																0
															],
															[
																-0.8284,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0.8284300000000009,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.82843
															],
															[
																0,
																0
															],
															[
																-0.82843,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.82843
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.12,
												s: [
													{
														c: true,
														v: [
															[
																1.5,
																0
															],
															[
																13.5,
																0
															],
															[
																15,
																1.5
															],
															[
																15,
																1.5
															],
															[
																13.5,
																3
															],
															[
																1.5,
																3
															],
															[
																0,
																1.5
															],
															[
																0,
																1.5
															],
															[
																1.5,
																0
															],
															[
																1.5,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.8284
															],
															[
																0,
																0
															],
															[
																0.8284,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.8284
															],
															[
																0,
																0
															],
															[
																-0.8284,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0.8284300000000009,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.82843
															],
															[
																0,
																0
															],
															[
																-0.82843,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.82843
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 54.120000000000005,
												s: [
													{
														c: true,
														v: [
															[
																1.75,
																0
															],
															[
																1.75,
																0
															],
															[
																3.5,
																1.75
															],
															[
																3.5,
																1.75
															],
															[
																1.75,
																3.5
															],
															[
																1.75,
																3.5
															],
															[
																0,
																1.75
															],
															[
																0,
																1.75
															],
															[
																1.75,
																0
															],
															[
																1.75,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.9665
															],
															[
																0,
																0
															],
															[
																0.9665,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.9665
															],
															[
																0,
																0
															],
															[
																-0.9665,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0.9664999999999999,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0.9664999999999999
															],
															[
																0,
																0
															],
															[
																-0.9665,
																0
															],
															[
																0,
																0
															],
															[
																0,
																-0.9665
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] send/1 - Null / send/1 - Null / frame - Null / send/1 - Null / frame - Null / frame / frame / send/1 - Shape Mask / send/1",
			fr: 60,
			id: "m2czqsxwn53un534",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "send/1 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "send/1 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "frame - Null",
					sr: 1,
					parent: 12,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 24.12,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.120000000000005,
									s: [
										2,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "send/1 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "frame - Null",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 24.12,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.120000000000005,
									s: [
										2,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 16,
					ty: 0,
					nm: "frame",
					td: 1,
					refId: "m2czp0x468684051",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 19,
					h: 18,
					ip: 0,
					op: 138.12,
					st: 0,
					hd: false,
					bm: 0
				},
				{
					ddd: 0,
					ind: 17,
					ty: 0,
					nm: "frame",
					refId: "m2czqsy8jrzqk00c",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 19,
					h: 18,
					ip: 0,
					op: 138.12,
					st: 0,
					hd: false,
					bm: 0,
					tt: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "send/1 - Shape Mask",
					sr: 1,
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													9,
													0
												],
												[
													10,
													0
												],
												[
													19,
													9
												],
												[
													19,
													9
												],
												[
													10,
													18
												],
												[
													9,
													18
												],
												[
													0,
													9
												],
												[
													0,
													9
												],
												[
													9,
													0
												],
												[
													9,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-4.9706
												],
												[
													0,
													0
												],
												[
													4.9706,
													0
												],
												[
													0,
													0
												],
												[
													0,
													4.9706
												],
												[
													0,
													0
												],
												[
													-4.9706,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													4.970559999999999,
													0
												],
												[
													0,
													0
												],
												[
													0,
													4.970559999999999
												],
												[
													0,
													0
												],
												[
													-4.97056,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-4.97056
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					],
					td: 1
				},
				{
					ty: 2,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "send/1",
					sr: 1,
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								1.4921396702006693e-13,
								0
							]
						},
						s: {
							a: 0,
							k: [
								1399.9999297292645,
								1399.9999297292645
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 138.12,
					st: 0,
					bm: 0,
					refId: "ad33659c33381eac40061641b81f19d65a13ad9f",
					tt: 1
				}
			]
		}
	];
	var layers$1 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "send/1",
			refId: "m2czqsxwn53un534",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 19,
			h: 18,
			ip: 0,
			op: 138.12,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$1 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var UploadingAnimation = {
		fr: fr$1,
		v: v$1,
		ip: ip$1,
		op: op$1,
		w: w$1,
		h: h$1,
		nm: nm$1,
		ddd: ddd$1,
		markers: markers$1,
		assets: assets$1,
		layers: layers$1,
		meta: meta$1
	};

	var fr = 60;
	var v = "5.9.6";
	var ip = 0;
	var op = 65.3;
	var w = 18;
	var h = 18;
	var nm = "typing";
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] typing - Null / Ellipse 3 - Null / Ellipse 3 / Ellipse 2 - Null / Ellipse 2 / Ellipse 1 - Null / Ellipse 1",
			fr: 60,
			id: "m2czolqy5p73gm5l",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "typing - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Ellipse 3 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										13.0745,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.459999999999999,
									s: [
										13.0745,
										8.1111
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.52,
									s: [
										13.07,
										8.11
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.919999999999998,
									s: [
										13.0745,
										8.1111
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.979999999999997,
									s: [
										13.07,
										8.11
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.38,
									s: [
										13.0745,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.439999999999998,
									s: [
										13.07,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.839999999999996,
									s: [
										13.0742,
										7.8008
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.9,
									s: [
										13.07,
										7.8
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 42.3,
									s: [
										13.0745,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 48.300000000000004,
									s: [
										13.07,
										7
									],
									o: {
										x: [
											0.42
										],
										y: [
											-0.2
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 66.3,
									s: [
										13.0745,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Ellipse 3",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 1.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8244
															],
															[
																1.8,
																3.6488
															],
															[
																0,
																1.8244
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8244
															],
															[
																3.6,
																1.8244
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0076
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0076
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0075999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0076
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 2.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8157
															],
															[
																1.8,
																3.6314
															],
															[
																0,
																1.8157
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8157
															],
															[
																3.6,
																1.8157
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0028
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0028
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0028000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0028
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 3.0599999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8077
															],
															[
																1.8,
																3.6154
															],
															[
																0,
																1.8077
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8077
															],
															[
																3.6,
																1.8077
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9984
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9984
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9983999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9984
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 4.061999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8006
															],
															[
																1.8,
																3.6012
															],
															[
																0,
																1.8006
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8006
															],
															[
																3.6,
																1.8006
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9944
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9944
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9944
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9944
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 5.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7944
															],
															[
																1.8,
																3.5888
															],
															[
																0,
																1.7944
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7944
															],
															[
																3.6,
																1.7944
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.991
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.991
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9910000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.991
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 6.0600000000000005,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7892
															],
															[
																1.8,
																3.5784
															],
															[
																0,
																1.7892
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7892
															],
															[
																3.6,
																1.7892
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9882
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9882
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9882000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9882
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 7.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7854
															],
															[
																1.8,
																3.5708
															],
															[
																0,
																1.7854
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7854
															],
															[
																3.6,
																1.7854
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9861
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9861
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9861
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9861
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7834
															],
															[
																1.8,
																3.5668
															],
															[
																0,
																1.7834
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7834
															],
															[
																3.6,
																1.7834
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9849
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9849
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9848999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9849
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.459999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 9.462,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 10.458,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 11.46,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 12.462,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 13.458,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 14.459999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 15.462,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.458,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.979999999999997,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 17.982000000000003,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.951
															],
															[
																1.8,
																3.902
															],
															[
																0,
																1.951
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.951
															],
															[
																3.6,
																1.951
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0775
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0775
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0775000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0775
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 18.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1025
															],
															[
																1.8,
																4.205
															],
															[
																0,
																2.1025
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.1025
															],
															[
																3.6,
																2.1025
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1612
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1612
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1612
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1612
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 19.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2412
															],
															[
																1.8,
																4.4824
															],
															[
																0,
																2.2412
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.2412
															],
															[
																3.6,
																2.2412
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2378
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2378
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2378
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2378
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 20.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3654
															],
															[
																1.8,
																4.7308
															],
															[
																0,
																2.3654
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.3654
															],
															[
																3.6,
																2.3654
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.3064
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3064
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3064
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3064
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 21.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.4727
															],
															[
																1.8,
																4.9454
															],
															[
																0,
																2.4727
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.4727
															],
															[
																3.6,
																2.4727
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.3657
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3657
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3657
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3657
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 22.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.5617
															],
															[
																1.8,
																5.1234
															],
															[
																0,
																2.5617
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.5617
															],
															[
																3.6,
																2.5617
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.4148
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4148
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4148
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4148
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 23.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.6275
															],
															[
																1.8,
																5.255
															],
															[
																0,
																2.6275
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.6275
															],
															[
																3.6,
																2.6275
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.4511
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4511
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4510999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4511
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.663
															],
															[
																1.8,
																5.326
															],
															[
																0,
																2.663
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.663
															],
															[
																3.6,
																2.663
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.4708
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4708
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4708
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4708
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.38,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.6667
															],
															[
																1.8,
																5.3334
															],
															[
																0,
																2.6667
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.6667
															],
															[
																3.6,
																2.6667
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.4728
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4728
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4727999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4728
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.6667
															],
															[
																1.8,
																5.3334
															],
															[
																0,
																2.6667
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.6667
															],
															[
																3.6,
																2.6667
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.4728
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4728
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.4727999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.4728
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 26.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.4641
															],
															[
																1.8,
																4.9282
															],
															[
																0,
																2.4641
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.4641
															],
															[
																3.6,
																2.4641
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.3609
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3609
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.3609
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.3609
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 27.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2811
															],
															[
																1.8,
																4.5622
															],
															[
																0,
																2.2811
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.2811
															],
															[
																3.6,
																2.2811
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2599
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2599
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2599
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2599
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 28.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1137
															],
															[
																1.8,
																4.2274
															],
															[
																0,
																2.1137
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.1137
															],
															[
																3.6,
																2.1137
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1674
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1674
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1674000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1674
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 29.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9638
															],
															[
																1.8,
																3.9276
															],
															[
																0,
																1.9638
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9638
															],
															[
																3.6,
																1.9638
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0846
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0846
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0846
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0846
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8342
															],
															[
																1.8,
																3.6684
															],
															[
																0,
																1.8342
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8342
															],
															[
																3.6,
																1.8342
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 31.44,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7267
															],
															[
																1.8,
																3.4534
															],
															[
																0,
																1.7267
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7267
															],
															[
																3.6,
																1.7267
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9537
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9537
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9536999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9537
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 32.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6474
															],
															[
																1.8,
																3.2948
															],
															[
																0,
																1.6474
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.6474
															],
															[
																3.6,
																1.6474
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9098
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9098
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9097999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9098
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6044
															],
															[
																1.8,
																3.2088
															],
															[
																0,
																1.6044
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.6044
															],
															[
																3.6,
																1.6044
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8861
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8861
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8860999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8861
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.839999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6
															],
															[
																1.8,
																3.2
															],
															[
																0,
																1.6
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.6
															],
															[
																3.6,
																1.6
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8837
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8837
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8837000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8837
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.9,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6
															],
															[
																1.8,
																3.2
															],
															[
																0,
																1.6
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.6
															],
															[
																3.6,
																1.6
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8837
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8837
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8837000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8837
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 34.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6445
															],
															[
																1.8,
																3.289
															],
															[
																0,
																1.6445
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.6445
															],
															[
																3.6,
																1.6445
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9082
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9082
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9082000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9082
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 35.898,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6846
															],
															[
																1.8,
																3.3692
															],
															[
																0,
																1.6846
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.6846
															],
															[
																3.6,
																1.6846
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9304
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9304
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9304000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9304
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.9,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7214
															],
															[
																1.8,
																3.4428
															],
															[
																0,
																1.7214
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7214
															],
															[
																3.6,
																1.7214
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9507
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9507
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9506999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9507
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 37.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7543
															],
															[
																1.8,
																3.5086
															],
															[
																0,
																1.7543
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7543
															],
															[
																3.6,
																1.7543
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9689
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9689
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9688999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9689
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 38.897999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7827
															],
															[
																1.8,
																3.5654
															],
															[
																0,
																1.7827
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7827
															],
															[
																3.6,
																1.7827
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9846
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9846
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9846000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9846
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 39.900000000000006,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8063
															],
															[
																1.8,
																3.6126
															],
															[
																0,
																1.8063
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8063
															],
															[
																3.6,
																1.8063
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9976
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9976
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9976
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9976
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 40.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8237
															],
															[
																1.8,
																3.6474
															],
															[
																0,
																1.8237
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8237
															],
															[
																3.6,
																1.8237
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0072
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0072
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0072
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0072
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 41.898,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8332
															],
															[
																1.8,
																3.6664
															],
															[
																0,
																1.8332
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8332
															],
															[
																3.6,
																1.8332
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0124
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0124
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0124000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0124
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 42.3,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Ellipse 2 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										6.5371,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.459999999999999,
									s: [
										6.5371,
										8.1111
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.52,
									s: [
										6.54,
										8.11
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.919999999999998,
									s: [
										6.5371,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.979999999999997,
									s: [
										6.54,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.38,
									s: [
										6.5371,
										9.4453
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.439999999999998,
									s: [
										6.54,
										9.45
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.839999999999996,
									s: [
										6.5371,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.9,
									s: [
										6.54,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 42.3,
									s: [
										6.5371,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 48.300000000000004,
									s: [
										6.54,
										7
									],
									o: {
										x: [
											0.42
										],
										y: [
											-0.2
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 66.3,
									s: [
										6.5371,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Ellipse 2",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 1.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8244
															],
															[
																1.8,
																3.6488
															],
															[
																0,
																1.8244
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8244
															],
															[
																3.6,
																1.8244
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0076
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0076
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0075999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0076
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 2.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8157
															],
															[
																1.8,
																3.6314
															],
															[
																0,
																1.8157
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8157
															],
															[
																3.6,
																1.8157
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0028
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0028
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0028000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0028
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 3.0599999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8077
															],
															[
																1.8,
																3.6154
															],
															[
																0,
																1.8077
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8077
															],
															[
																3.6,
																1.8077
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9984
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9984
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9983999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9984
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 4.061999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8006
															],
															[
																1.8,
																3.6012
															],
															[
																0,
																1.8006
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8006
															],
															[
																3.6,
																1.8006
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9944
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9944
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9944
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9944
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 5.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7944
															],
															[
																1.8,
																3.5888
															],
															[
																0,
																1.7944
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7944
															],
															[
																3.6,
																1.7944
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.991
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.991
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9910000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.991
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 6.0600000000000005,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7892
															],
															[
																1.8,
																3.5784
															],
															[
																0,
																1.7892
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7892
															],
															[
																3.6,
																1.7892
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9882
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9882
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9882000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9882
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 7.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7854
															],
															[
																1.8,
																3.5708
															],
															[
																0,
																1.7854
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7854
															],
															[
																3.6,
																1.7854
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9861
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9861
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9861
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9861
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7834
															],
															[
																1.8,
																3.5668
															],
															[
																0,
																1.7834
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7834
															],
															[
																3.6,
																1.7834
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9849
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9849
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9848999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9849
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.459999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7832
															],
															[
																1.8,
																3.5664
															],
															[
																0,
																1.7832
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.7832
															],
															[
																3.6,
																1.7832
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9848
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9847999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9848
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 9.522,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8877
															],
															[
																1.8,
																3.7754
															],
															[
																0,
																1.8877
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8877
															],
															[
																3.6,
																1.8877
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0425
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0425
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0425000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0425
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 10.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.982
															],
															[
																1.8,
																3.964
															],
															[
																0,
																1.982
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.982
															],
															[
																3.6,
																1.982
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0947
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0947
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0946999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0947
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 11.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0684
															],
															[
																1.8,
																4.1368
															],
															[
																0,
																2.0684
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0684
															],
															[
																3.6,
																2.0684
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1424
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1424
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1423999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1424
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 12.522,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1457
															],
															[
																1.8,
																4.2914
															],
															[
																0,
																2.1457
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.1457
															],
															[
																3.6,
																2.1457
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1851
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1851
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1850999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1851
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 13.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2125
															],
															[
																1.8,
																4.425
															],
															[
																0,
																2.2125
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.2125
															],
															[
																3.6,
																2.2125
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.222
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.222
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.222
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.222
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 14.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.268
															],
															[
																1.8,
																4.536
															],
															[
																0,
																2.268
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.268
															],
															[
																3.6,
																2.268
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2526
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2526
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2526000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2526
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 15.521999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.309
															],
															[
																1.8,
																4.618
															],
															[
																0,
																2.309
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.309
															],
															[
																3.6,
																2.309
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2752
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2752
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2752
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2752
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3311
															],
															[
																1.8,
																4.6622
															],
															[
																0,
																2.3311
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3311
															],
															[
																3.6,
																2.3311
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2875
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2875
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2875
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2875
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.919999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3333
															],
															[
																1.8,
																4.6666
															],
															[
																0,
																2.3333
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3333
															],
															[
																3.6,
																2.3333
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.979999999999997,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3333
															],
															[
																1.8,
																4.6666
															],
															[
																0,
																2.3333
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3333
															],
															[
																3.6,
																2.3333
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 17.982000000000003,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2278
															],
															[
																1.8,
																4.4556
															],
															[
																0,
																2.2278
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.2278
															],
															[
																3.6,
																2.2278
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2304
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2304
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2304
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2304
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 18.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1326
															],
															[
																1.8,
																4.2652
															],
															[
																0,
																2.1326
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.1326
															],
															[
																3.6,
																2.1326
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1778
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1778
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1778
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1778
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 19.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0454
															],
															[
																1.8,
																4.0908
															],
															[
																0,
																2.0454
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.0454
															],
															[
																3.6,
																2.0454
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1296
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1296
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1296
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1296
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 20.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9673
															],
															[
																1.8,
																3.9346
															],
															[
																0,
																1.9673
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9673
															],
															[
																3.6,
																1.9673
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0865
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0865
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0864999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0865
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 21.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8998
															],
															[
																1.8,
																3.7996
															],
															[
																0,
																1.8998
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8998
															],
															[
																3.6,
																1.8998
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0492
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0492
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0492
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0492
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 22.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8438
															],
															[
																1.8,
																3.6876
															],
															[
																0,
																1.8438
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8438
															],
															[
																3.6,
																1.8438
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0183
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0183
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0182999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0183
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 23.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8025
															],
															[
																1.8,
																3.605
															],
															[
																0,
																1.8025
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8025
															],
															[
																3.6,
																1.8025
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9955
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9955
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9955
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9955
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7801
															],
															[
																1.8,
																3.5602
															],
															[
																0,
																1.7801
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7801
															],
															[
																3.6,
																1.7801
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9831
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9831
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9830999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9831
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.38,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7778
															],
															[
																1.8,
																3.5556
															],
															[
																0,
																1.7778
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7778
															],
															[
																3.6,
																1.7778
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9819
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9819
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9819
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9819
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7778
															],
															[
																1.8,
																3.5556
															],
															[
																0,
																1.7778
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7778
															],
															[
																3.6,
																1.7778
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9819
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9819
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9819
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9819
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 26.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.82
															],
															[
																1.8,
																3.64
															],
															[
																0,
																1.82
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.82
															],
															[
																3.6,
																1.82
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0052
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0052
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0052
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0052
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 27.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8581
															],
															[
																1.8,
																3.7162
															],
															[
																0,
																1.8581
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8581
															],
															[
																3.6,
																1.8581
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0262
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0262
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0262
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0262
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 28.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.893
															],
															[
																1.8,
																3.786
															],
															[
																0,
																1.893
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.893
															],
															[
																3.6,
																1.893
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0455
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0455
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0455000000000003
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0455
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 29.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9242
															],
															[
																1.8,
																3.8484
															],
															[
																0,
																1.9242
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9242
															],
															[
																3.6,
																1.9242
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0627
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0627
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0627
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0627
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9512
															],
															[
																1.8,
																3.9024
															],
															[
																0,
																1.9512
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9512
															],
															[
																3.6,
																1.9512
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0776
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0776
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0776
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0776
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 31.44,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9736
															],
															[
																1.8,
																3.9472
															],
															[
																0,
																1.9736
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9736
															],
															[
																3.6,
																1.9736
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.09
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.09
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.09
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.09
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 32.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9902
															],
															[
																1.8,
																3.9804
															],
															[
																0,
																1.9902
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9902
															],
															[
																3.6,
																1.9902
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0992
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0992
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0992
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0992
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9991
															],
															[
																1.8,
																3.9982
															],
															[
																0,
																1.9991
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9991
															],
															[
																3.6,
																1.9991
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1041
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1041
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1041
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1041
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.839999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2
															],
															[
																1.8,
																4
															],
															[
																0,
																2
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2
															],
															[
																3.6,
																2
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1046
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1046
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1046
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1046
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.9,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2
															],
															[
																1.8,
																4
															],
															[
																0,
																2
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2
															],
															[
																3.6,
																2
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1046
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1046
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1046
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1046
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 34.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9685
															],
															[
																1.8,
																3.937
															],
															[
																0,
																1.9685
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9685
															],
															[
																3.6,
																1.9685
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0872
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0872
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0872
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0872
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 35.898,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9401
															],
															[
																1.8,
																3.8802
															],
															[
																0,
																1.9401
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9401
															],
															[
																3.6,
																1.9401
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0715
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0715
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0714999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0715
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.9,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.914
															],
															[
																1.8,
																3.828
															],
															[
																0,
																1.914
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.914
															],
															[
																3.6,
																1.914
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0571
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0571
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0571
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0571
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 37.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8907
															],
															[
																1.8,
																3.7814
															],
															[
																0,
																1.8907
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8907
															],
															[
																3.6,
																1.8907
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0442
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0442
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0441999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0442
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 38.897999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8705
															],
															[
																1.8,
																3.741
															],
															[
																0,
																1.8705
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8705
															],
															[
																3.6,
																1.8705
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0331
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0331
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0331
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0331
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 39.900000000000006,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8538
															],
															[
																1.8,
																3.7076
															],
															[
																0,
																1.8538
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8538
															],
															[
																3.6,
																1.8538
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0239
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0239
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0239
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0239
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 40.902,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8415
															],
															[
																1.8,
																3.683
															],
															[
																0,
																1.8415
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8415
															],
															[
																3.6,
																1.8415
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.017
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.017
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.017
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.017
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 41.898,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8348
															],
															[
																1.8,
																3.6696
															],
															[
																0,
																1.8348
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8348
															],
															[
																3.6,
																1.8348
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0134
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0134
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0134000000000003
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0134
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 42.3,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "Ellipse 1 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0.06,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.459999999999999,
									s: [
										0,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 8.52,
									s: [
										0,
										5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.919999999999998,
									s: [
										0,
										8.8889
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 16.979999999999997,
									s: [
										0,
										8.89
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.38,
									s: [
										0,
										8.5547
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 25.439999999999998,
									s: [
										0,
										8.55
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.839999999999996,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 33.9,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 42.3,
									s: [
										0,
										7
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 48.300000000000004,
									s: [
										0,
										7
									],
									o: {
										x: [
											0.42
										],
										y: [
											-0.2
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 66.3,
									s: [
										0,
										7
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Ellipse 1",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 66.3,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 0.06,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 1.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.929
															],
															[
																1.8,
																3.858
															],
															[
																0,
																1.929
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.929
															],
															[
																3.6,
																1.929
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0654
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0654
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0653999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0654
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 2.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0146
															],
															[
																1.8,
																4.0292
															],
															[
																0,
																2.0146
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.0146
															],
															[
																3.6,
																2.0146
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1126
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1126
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1126
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1126
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 3.0599999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0929
															],
															[
																1.8,
																4.1858
															],
															[
																0,
																2.0929
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0929
															],
															[
																3.6,
																2.0929
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1559
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1559
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1559
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1559
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 4.061999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1631
															],
															[
																1.8,
																4.3262
															],
															[
																0,
																2.1631
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.1631
															],
															[
																3.6,
																2.1631
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1947
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1947
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1947
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1947
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 5.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2238
															],
															[
																1.8,
																4.4476
															],
															[
																0,
																2.2238
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.2238
															],
															[
																3.6,
																2.2238
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2282
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2282
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2281999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2282
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 6.0600000000000005,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.2741
															],
															[
																1.8,
																4.5482
															],
															[
																0,
																2.2741
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																2.2741
															],
															[
																3.6,
																2.2741
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.256
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.256
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2560000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.256
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 7.062,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3112
															],
															[
																1.8,
																4.6224
															],
															[
																0,
																2.3112
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3112
															],
															[
																3.6,
																2.3112
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2765
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2765
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2765
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2765
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.058,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3313
															],
															[
																1.8,
																4.6626
															],
															[
																0,
																2.3313
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3313
															],
															[
																3.6,
																2.3313
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2876
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2876
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2875999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2876
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.459999999999999,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3333
															],
															[
																1.8,
																4.6666
															],
															[
																0,
																2.3333
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3333
															],
															[
																3.6,
																2.3333
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 8.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.3333
															],
															[
																1.8,
																4.6666
															],
															[
																0,
																2.3333
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.3333
															],
															[
																3.6,
																2.3333
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2887
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2887
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 9.522,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.1856
															],
															[
																1.8,
																4.3712
															],
															[
																0,
																2.1856
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.1856
															],
															[
																3.6,
																2.1856
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.2071
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2071
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.2071
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.2071
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 10.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0522
															],
															[
																1.8,
																4.1044
															],
															[
																0,
																2.0522
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0522
															],
															[
																3.6,
																2.0522
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1334
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1334
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1334
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1334
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 11.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9302
															],
															[
																1.8,
																3.8604
															],
															[
																0,
																1.9302
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9302
															],
															[
																3.6,
																1.9302
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.066
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.066
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.066
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.066
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 12.522,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8208
															],
															[
																1.8,
																3.6416
															],
															[
																0,
																1.8208
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8208
															],
															[
																3.6,
																1.8208
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0056
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0056
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0056
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0056
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 13.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7263
															],
															[
																1.8,
																3.4526
															],
															[
																0,
																1.7263
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7263
															],
															[
																3.6,
																1.7263
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9534
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9534
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9534
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9534
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 14.52,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.648
															],
															[
																1.8,
																3.296
															],
															[
																0,
																1.648
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.648
															],
															[
																3.6,
																1.648
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9102
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9102
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9101999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9102
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 15.521999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.5901
															],
															[
																1.8,
																3.1802
															],
															[
																0,
																1.5901
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.5901
															],
															[
																3.6,
																1.5901
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8782
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8782
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8782000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8782
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.518,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.5588
															],
															[
																1.8,
																3.1176
															],
															[
																0,
																1.5588
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.5588
															],
															[
																3.6,
																1.5588
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8609
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8609
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8608999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8609
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.919999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.5556
															],
															[
																1.8,
																3.1112
															],
															[
																0,
																1.5556
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.5556
															],
															[
																3.6,
																1.5556
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8591
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8591
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8590999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8591
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 16.979999999999997,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.5556
															],
															[
																1.8,
																3.1112
															],
															[
																0,
																1.5556
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.5556
															],
															[
																3.6,
																1.5556
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.8591
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8591
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.8590999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.8591
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 17.982000000000003,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.6472
															],
															[
																1.8,
																3.2944
															],
															[
																0,
																1.6472
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.6472
															],
															[
																3.6,
																1.6472
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9097
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9097
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9096999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9097
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 18.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.7299
															],
															[
																1.8,
																3.4598
															],
															[
																0,
																1.7299
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.7299
															],
															[
																3.6,
																1.7299
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9554
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9554
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9553999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9554
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 19.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8056
															],
															[
																1.8,
																3.6112
															],
															[
																0,
																1.8056
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8056
															],
															[
																3.6,
																1.8056
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																0.9972
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9972
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0.9971999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-0.9972
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 20.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8734
															],
															[
																1.8,
																3.7468
															],
															[
																0,
																1.8734
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8734
															],
															[
																3.6,
																1.8734
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0347
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0347
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0347000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0347
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 21.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.932
															],
															[
																1.8,
																3.864
															],
															[
																0,
																1.932
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.932
															],
															[
																3.6,
																1.932
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.067
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.067
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0669999999999997
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.067
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 22.98,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9806
															],
															[
																1.8,
																3.9612
															],
															[
																0,
																1.9806
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9806
															],
															[
																3.6,
																1.9806
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0939
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0939
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0939
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0939
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 23.982,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0165
															],
															[
																1.8,
																4.033
															],
															[
																0,
																2.0165
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0165
															],
															[
																3.6,
																2.0165
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1137
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1137
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1137000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1137
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 24.978,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0359
															],
															[
																1.8,
																4.0718
															],
															[
																0,
																2.0359
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0359
															],
															[
																3.6,
																2.0359
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1244
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1244
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1244
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1244
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.38,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0379
															],
															[
																1.8,
																4.0758
															],
															[
																0,
																2.0379
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0379
															],
															[
																3.6,
																2.0379
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1255
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1255
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1255000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1255
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																2.0379
															],
															[
																1.8,
																4.0758
															],
															[
																0,
																2.0379
															],
															[
																1.8,
																0
															],
															[
																3.6,
																2.0379
															],
															[
																3.6,
																2.0379
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1255
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1255
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1255000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1255
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 26.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9992
															],
															[
																1.8,
																3.9984
															],
															[
																0,
																1.9992
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9992
															],
															[
																3.6,
																1.9992
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.1042
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1042
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.1042
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.1042
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 27.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9643
															],
															[
																1.8,
																3.9286
															],
															[
																0,
																1.9643
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9643
															],
															[
																3.6,
																1.9643
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0849
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0849
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0849
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0849
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 28.439999999999998,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9323
															],
															[
																1.8,
																3.8646
															],
															[
																0,
																1.9323
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.9323
															],
															[
																3.6,
																1.9323
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0672
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0672
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0672
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0672
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 29.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.9036
															],
															[
																1.8,
																3.8072
															],
															[
																0,
																1.9036
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.9036
															],
															[
																3.6,
																1.9036
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0514
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0514
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0514000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0514
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 30.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8789
															],
															[
																1.8,
																3.7578
															],
															[
																0,
																1.8789
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8789
															],
															[
																3.6,
																1.8789
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0377
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0377
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0376999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0377
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 31.44,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8583
															],
															[
																1.8,
																3.7166
															],
															[
																0,
																1.8583
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8583
															],
															[
																3.6,
																1.8583
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0263
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0263
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0262999999999998
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0263
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 32.442,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8432
															],
															[
																1.8,
																3.6864
															],
															[
																0,
																1.8432
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.8432
															],
															[
																3.6,
																1.8432
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.018
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.018
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0180000000000002
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.018
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.438,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.835
															],
															[
																1.8,
																3.67
															],
															[
																0,
																1.835
															],
															[
																1.8,
																0.0001
															],
															[
																3.6,
																1.835
															],
															[
																3.6,
																1.835
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.0134
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0134
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0133999999999999
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.0134
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.839999999999996,
												s: [
													{
														c: true,
														v: [
															[
																3.6,
																1.8341
															],
															[
																1.8,
																3.6682
															],
															[
																0,
																1.8341
															],
															[
																1.8,
																0
															],
															[
																3.6,
																1.8341
															],
															[
																3.6,
																1.8341
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.9941,
																0
															],
															[
																0,
																1.013
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																1.0130000000000001
															],
															[
																-0.9941,
																0
															],
															[
																0,
																-1.013
															],
															[
																0.9941000000000002,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "typing",
			refId: "m2czolqy5p73gm5l",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 18,
			h: 18,
			ip: 0,
			op: 66.3,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var WritingAnimation = {
		fr: fr,
		v: v,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	const USERS_TO_SHOW = 3;
	const AnimationByActionType = {
		[im_v2_lib_inputAction.InputAction.writing]: WritingAnimation,
		[im_v2_lib_inputAction.InputAction.sendingFile]: UploadingAnimation,
		[im_v2_lib_inputAction.InputAction.recordingVoice]: RecordingAnimation
	};
	const LocCodeByActionType = {
		[im_v2_lib_inputAction.InputAction.writing]: 'IM_MESSAGE_LIST_STATUS_TYPING_MSGVER_1',
		[im_v2_lib_inputAction.InputAction.sendingFile]: 'IM_MESSAGE_LIST_STATUS_SENDING_FILE_MSGVER_1',
		[im_v2_lib_inputAction.InputAction.recordingVoice]: 'IM_MESSAGE_LIST_STATUS_RECORDING_VOICE_MSGVER_1'
	};

	// @vue/component
	const InputActions = {
		name: 'InputActions',
		props: {
			enterAnimationFinished: {
				required: true,
				type: Boolean
			},
			inputActions: {
				required: true,
				type: Array
			}
		},
		computed: {
			uniqueUserRecords() {
				const uniqueUserRecords = {};
				this.inputActions.forEach(userRecord => {
					uniqueUserRecords[userRecord.userId] = userRecord.userName;
				});
				return Object.entries(uniqueUserRecords).map(([userId, userName]) => {
					return {
						userId,
						userName
					};
				});
			},
			isSingleUserActive() {
				const userIds = this.inputActions.map(element => element.userId);
				const uniqueUsers = new Set(userIds);
				return uniqueUsers.size === 1;
			},
			usersToShowText() {
				const usersToShow = this.uniqueUserRecords.slice(0, USERS_TO_SHOW);
				return usersToShow.map(element => element.userName).join(', ');
			},
			inputActionText() {
				if (this.isSingleUserActive) {
					return this.getActionTextForSingleUser();
				}

				// Ivan, Alex, Rob and 7 more are writing
				const remainingUsersCount = this.uniqueUserRecords.length - USERS_TO_SHOW;
				if (remainingUsersCount > 0) {
					return this.loc('IM_MESSAGE_LIST_STATUS_TYPING_PLURAL_MORE_MSGVER_1', {
						'#USERS#': this.usersToShowText,
						'#COUNT#': remainingUsersCount
					});
				}

				// Ivan, Alex, Rob are writing
				return this.loc('IM_MESSAGE_LIST_STATUS_TYPING_PLURAL_MSGVER_1', {
					'#USERS#': this.usersToShowText
				});
			},
			animationName() {
				if (this.isSingleUserActive) {
					const [firstUserRecord] = this.inputActions;
					const {
						type
					} = firstUserRecord;
					return AnimationByActionType[type];
				}
				return WritingAnimation;
			}
		},
		watch: {
			enterAnimationFinished() {
				if (this.currentAnimation) {
					return;
				}
				this.playAnimation(this.animationName);
			},
			animationName(newAnimation) {
				this.stopAnimation();
				this.playAnimation(newAnimation);
			}
		},
		mounted() {
			if (!this.$refs.animationContainer) {
				return;
			}
			this.playAnimation(this.animationName);
		},
		beforeUnmount() {
			this.stopAnimation();
		},
		methods: {
			getActionTextForSingleUser() {
				const [firstUserRecord] = this.inputActions;
				const {
					type,
					userName,
					statusMessageCode
				} = firstUserRecord;
				const hasCustomMessageCode = this.hasCustomMessageCode(statusMessageCode);
				const code = hasCustomMessageCode ? statusMessageCode : LocCodeByActionType[type];
				return this.loc(code, {
					'#USER#': userName
				});
			},
			playAnimation(animationName) {
				this.currentAnimation = ui_lottie.Lottie.loadAnimation({
					animationData: animationName,
					container: this.$refs.animationContainer,
					renderer: 'svg',
					loop: true,
					autoplay: true
				});
			},
			stopAnimation() {
				if (!this.currentAnimation) {
					return;
				}
				this.currentAnimation.destroy();
			},
			hasCustomMessageCode(phraseCode) {
				return main_core.Type.isStringFilled(phraseCode) && main_core.Type.isStringFilled(this.loc(phraseCode));
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__content">
			<div class="bx-im-dialog-chat-status__animation" ref="animationContainer"></div>
			<div class="bx-im-dialog-chat-status__text">{{ inputActionText }}</div>
		</div>
	`
	};

	class UserService extends im_v2_provider_service_user.BaseUserService {
		getRestMethodName() {
			return im_v2_const.RestMethod.imV2ChatMessageTailViewers;
		}
		getLastId(result) {
			const {
				views
			} = result;
			if (!views || views.length === 0) {
				return 0;
			}
			const sortedViews = [...views].sort((a, b) => b.id - a.id);
			return sortedViews[sortedViews.length - 1].id;
		}
	}

	// @vue/component
	const AdditionalUsers = {
		components: {
			UserListPopup: im_v2_component_elements_userListPopup.UserListPopup
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				showPopup: false,
				loadingAdditionalUsers: false,
				additionalUsers: []
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			}
		},
		mounted() {
			this.showPopup = true;
			void this.loadUsers();
		},
		methods: {
			async loadUsers() {
				this.loadingAdditionalUsers = true;
				try {
					const userIds = await this.getUserService().loadFirstPage(this.dialog.lastMessageId);
					this.additionalUsers = this.prepareAdditionalUsers(userIds);
					this.loadingAdditionalUsers = false;
				} catch {
					this.loadingAdditionalUsers = false;
				}
			},
			onPopupClose() {
				this.showPopup = false;
				this.$emit('close');
			},
			async onScroll(event) {
				if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.getUserService().hasMoreItemsToLoad()) {
					return;
				}
				const userIds = await this.getUserService().loadNextPage(this.dialog.lastMessageId);
				if (!userIds) {
					return;
				}
				this.additionalUsers = [...this.additionalUsers, ...this.prepareAdditionalUsers(userIds)];
			},
			prepareAdditionalUsers(userIds) {
				const firstViewerId = this.dialog.lastMessageViews.firstViewer.userId;
				return userIds.filter(userId => {
					return userId !== im_v2_application_core.Core.getUserId() && userId !== firstViewerId;
				});
			},
			getUserService() {
				if (!this.userService) {
					this.userService = new UserService();
				}
				return this.userService;
			}
		},
		template: `
		<UserListPopup
			id="bx-im-dialog-read-users"
			:showPopup="showPopup"
			:loading="loadingAdditionalUsers"
			:userIds="additionalUsers"
			:contextDialogId="dialogId"
			:bindElement="bindElement || {}"
			:withAngle="false"
			:forceTop="true"
			@close="onPopupClose"
			@scroll="onScroll"
		/>
	`
	};

	// @vue/component
	const UserRead = {
		name: 'UserRead',
		props: {
			dialogId: {
				required: true,
				type: String
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			formattedStatus() {
				const {
					date
				} = this.dialog.lastMessageViews.firstViewer;
				return this.loc('IM_MESSAGE_LIST_STATUS_READ_USER_MSGVER_1', {
					'#DATE#': im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.messageReadStatus)
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__text">{{ formattedStatus }}</div>
	`
	};

	// @vue/component
	const ChatSingleRead = {
		name: 'ChatSingleRead',
		props: {
			dialogId: {
				required: true,
				type: String
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			formattedStatus() {
				const {
					firstViewer
				} = this.dialog.lastMessageViews;
				return this.loc('IM_MESSAGE_LIST_STATUS_READ_CHAT', {
					'#USER#': firstViewer.userName
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__text">{{ formattedStatus }}</div>
	`
	};

	// @vue/component
	const ChatMultipleRead = {
		name: 'ChatMultipleRead',
		components: {
			AdditionalUsers,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			dialogId: {
				required: true,
				type: String
			}
		},
		data() {
			return {
				showAdditionalUsers: false
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			formattedStatus() {
				const {
					countOfViewers,
					firstViewer
				} = this.dialog.lastMessageViews;
				return this.loc('IM_MESSAGE_LIST_STATUS_READ_CHAT_PLURAL_MSGVER_2', {
					'#USERS#': firstViewer.userName,
					'#COUNT#': countOfViewers - 1
				});
			}
		},
		methods: {
			onMoreUsersClick() {
				this.showAdditionalUsers = true;
			},
			onUsersPopupClose() {
				this.showAdditionalUsers = false;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__text">
			<RichLoc :text="formattedStatus" placeholder="[link]">
				<template #link="{ text }">
					<span class="bx-im-dialog-chat-status__user-count" @click="onMoreUsersClick" ref="moreUsers">
						{{ text }}
					</span>
				</template>
			</RichLoc>
		</div>
		<AdditionalUsers
			v-if="showAdditionalUsers"
			:dialogId="dialogId"
			:bindElement="$refs['moreUsers'] || {}"
			@close="onUsersPopupClose"
		/>
	`
	};

	// @vue/component
	const ReadStatus = {
		name: 'ReadStatus',
		components: {
			UserRead,
			ChatSingleRead,
			ChatMultipleRead,
			AdditionalUsers
		},
		props: {
			dialogId: {
				required: true,
				type: String
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			lastMessageViews() {
				return this.dialog.lastMessageViews;
			},
			countOfViewers() {
				return this.lastMessageViews.countOfViewers;
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__content">
			<div class="bx-im-dialog-chat-status__icon --read"></div>
			<UserRead v-if="isUser" :dialogId="dialogId" />
			<ChatSingleRead v-else-if="countOfViewers === 1" :dialogId="dialogId" />
			<ChatMultipleRead v-else :dialogId="dialogId" />
		</div>
	`
	};

	// @vue/component
	const DialogStatus = {
		components: {
			InputActions,
			ReadStatus
		},
		props: {
			dialogId: {
				required: true,
				type: String
			}
		},
		data() {
			return {
				enterAnimationFinished: false
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatInputActions() {
				return this.$store.getters['chats/inputActions/getByDialogId'](this.dialogId);
			},
			visibleInputActions() {
				return (this.chatInputActions ?? []).filter(userRecord => {
					return !this.getCopilotManager().isCopilotBot(userRecord.userId);
				});
			},
			showInputStatus() {
				return this.dialog.inited && this.visibleInputActions.length > 0;
			},
			showReadStatus() {
				return this.dialog.inited && this.dialog.lastMessageViews.countOfViewers > 0;
			}
		},
		methods: {
			getCopilotManager() {
				this.copilotManager ??= new im_v2_lib_copilot.CopilotManager();
				return this.copilotManager;
			}
		},
		template: `
		<div class="bx-im-dialog-chat-status__container">
			<Transition
				name="im-dialog-status-animation"
				mode="out-in"
				@before-enter="enterAnimationFinished = false"
				@enter="enterAnimationFinished = true"
			>
				<InputActions v-if="showInputStatus" :inputActions="visibleInputActions" :enterAnimationFinished="enterAnimationFinished" />
				<ReadStatus v-else-if="showReadStatus" :dialogId="dialogId" />
			</Transition>
		</div>
	`
	};

	const defaultMessages = [main_core.Loc.getMessage('IM_MESSAGE_LIST_EMPTY_STATE_DEFAULT_MESSAGE_1'), main_core.Loc.getMessage('IM_MESSAGE_LIST_EMPTY_STATE_DEFAULT_MESSAGE_2'), main_core.Loc.getMessage('IM_MESSAGE_LIST_EMPTY_STATE_DEFAULT_MESSAGE_3'), main_core.Loc.getMessage('IM_MESSAGE_LIST_EMPTY_STATE_DEFAULT_MESSAGE_4'), main_core.Loc.getMessage('IM_MESSAGE_LIST_EMPTY_STATE_DEFAULT_MESSAGE_5')];

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			defaultMessages: () => defaultMessages
		},
		methods: {
			onMessageClick(text) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertText, {
					text,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-list-empty-state__container">
			<div class="bx-im-message-list-empty-state__content">
				<div class="bx-im-message-list-empty-state__icon"></div>
				<div class="bx-im-message-list-empty-state__title">{{ loc('IM_MESSAGE_LIST_EMPTY_STATE_TITLE') }}</div>
				<div class="bx-im-message-list-empty-state__action-list">
					<div
						v-for="(message, index) in defaultMessages"
						:key="index"
						@click="onMessageClick(message)"
						class="bx-im-message-list-empty-state__action-list_item"
					>
						{{ message }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const HistoryLimitBanner = {
		name: 'HistoryLimitBanner',
		props: {
			noMessages: {
				type: Boolean,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			title() {
				return im_v2_lib_feature.TariffManager.chatHistory.getLimitTitle();
			},
			subtitle() {
				return im_v2_lib_feature.TariffManager.chatHistory.getLimitSubtitle();
			},
			buttonText() {
				return im_v2_lib_feature.TariffManager.chatHistory.getLearnMoreText();
			}
		},
		mounted() {
			this.sendAnalytics();
		},
		methods: {
			onButtonClick() {
				im_v2_lib_analytics.Analytics.getInstance().historyLimit.onDialogBannerClick({
					dialogId: this.dialogId
				});
				im_v2_lib_feature.TariffManager.chatHistory.openFeatureSlider();
			},
			sendAnalytics() {
				im_v2_lib_analytics.Analytics.getInstance().historyLimit.onDialogLimitExceeded({
					dialogId: this.dialogId,
					noMessages: this.noMessages
				});
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-message-list-history-banner__container" :class="{'--no-messages': noMessages}">
			<div class="bx-im-message-list-history-banner__left">
				<div class="bx-im-message-list-history-banner__title">
					<div class="bx-im-message-list-history-banner__icon bx-im-messenger__lock-icon"></div>
					<div class="bx-im-message-list-history-banner__title_text --ellipsis" :title="title">
						{{ title }}
					</div>
				</div>
				<div class="bx-im-message-list-history-banner__subtitle --line-clamp-2" :title="subtitle">
					{{ subtitle }}
				</div>
			</div>
			<div class="bx-im-message-list-history-banner__right">
				<div class="bx-im-message-list-history-banner__button" @click="onButtonClick">
					{{ buttonText }}
				</div>
			</div>
		</div>
	`
	};

	const MessageComponents = {
		DefaultMessage: im_v2_component_message_default.DefaultMessage,
		FileMessage: im_v2_component_message_file.FileMessage,
		SmileMessage: im_v2_component_message_smile.SmileMessage,
		StickerMessage: im_v2_component_message_sticker.StickerMessage,
		ErrorMessage: im_v2_component_message_error.ErrorMessage,
		CallInviteMessage: im_v2_component_message_callInvite.CallInviteMessage,
		DeletedMessage: im_v2_component_message_deleted.DeletedMessage,
		UnsupportedMessage: im_v2_component_message_unsupported.UnsupportedMessage,
		ChatCreationMessage: im_v2_component_message_creation_chat.ChatCreationMessage,
		OwnChatCreationMessage: im_v2_component_message_creation_ownChat.OwnChatCreationMessage,
		ChatCopilotCreationMessage: im_v2_component_message_copilot_creation.ChatCopilotCreationMessage,
		CopilotMessage: im_v2_component_message_copilot_answer.CopilotMessage,
		AiAssistantMessage: im_v2_component_message_aiAssistant_answer.AiAssistantMessage,
		SupportVoteMessage: im_v2_component_message_support_vote.SupportVoteMessage,
		SupportSessionNumberMessage: im_v2_component_message_support_sessionNumber.SupportSessionNumberMessage,
		SupportChatCreationMessage: im_v2_component_message_support_chatCreation.SupportChatCreationMessage,
		ConferenceCreationMessage: im_v2_component_message_creation_conference.ConferenceCreationMessage,
		ZoomInviteMessage: im_v2_component_message_zoomInvite.ZoomInviteMessage,
		CheckInMessage: im_v2_component_message_checkIn.CheckInMessage,
		SupervisorUpdateFeatureMessage: im_v2_component_message_supervisor_updateFeature.SupervisorUpdateFeatureMessage,
		SupervisorEnableFeatureMessage: im_v2_component_message_supervisor_enableFeature.SupervisorEnableFeatureMessage,
		ChatCopilotAddedUsersMessage: im_v2_component_message_copilot_addedUsers.ChatCopilotAddedUsersMessage,
		SignMessage: im_v2_component_message_sign.SignMessage,
		AdminMessage: im_v2_component_message_admin.AdminMessage,
		GeneralChatCreationMessage: im_v2_component_message_creation_generalChat.GeneralChatCreationMessage,
		GeneralChannelCreationMessage: im_v2_component_message_creation_generalChannel.GeneralChannelCreationMessage,
		ChannelCreationMessage: im_v2_component_message_creation_channel.ChannelCreationMessage,
		CallMessage: im_v2_component_message_call.CallMessage,
		StartDialogMessage: imopenlines_v2_component_message_startDialog.StartDialogMessage,
		FeedbackFormMessage: imopenlines_v2_component_message_feedbackForm.FeedbackFormMessage,
		NetworkStickerMessage: imopenlines_v2_component_message_networkSticker.NetworkStickerMessage,
		MultiDialogErrorMessage: imopenlines_v2_component_message_multidialogError.MultiDialogErrorMessage,
		HiddenMessage: imopenlines_v2_component_message_hidden.HiddenMessage,
		VoteMessage: im_v2_component_message_vote.VoteMessage,
		ContactMessage: im_v2_component_message_contact.ContactMessage,
		TaskChatCreationMessage: im_v2_component_message_creation_taskChat.TaskChatCreationMessage,
		ConvertToCollabMessage: im_v2_component_message_collab_convert.ConvertToCollabMessage,
		CollabCreationMessage: im_v2_component_message_creation_collab.CollabCreationMessage,
		AiBizprocMessage: im_v2_component_message_aiBizproc.AiBizprocMessage
	};

	const DIVIDER_SELECTOR = '.bx-im-message-list-date-group-title__container[data-date]';
	// the browser can hold a sticky element a fraction of a pixel away from its own place
	const DISPLACEMENT_THRESHOLD = 1;

	/**
	 * The divider is sticky at the top of the scrollport, so a group already scrolled past keeps its
	 * divider pushed up by its own group, while a group still below holds the divider at rest.
	 */
	const isDisplacedFromGroup = divider => {
		const group = divider.parentElement;
		if (!group) {
			return false;
		}
		const displacement = divider.getBoundingClientRect().top - group.getBoundingClientRect().top;
		return displacement > DISPLACEMENT_THRESHOLD;
	};

	/**
	 * The day of the topmost visible group of the list, empty when the list has no day to report.
	 *
	 * The group the user is looking at is the last displaced one: everything above it is displaced too,
	 * everything below is not. Nothing displaced means the list is not scrolled at all, and then the
	 * group on screen is the first one.
	 */
	const getTopVisibleDate = container => {
		let firstDate = '';
		let topVisibleDate = '';
		container.querySelectorAll(DIVIDER_SELECTOR).forEach(divider => {
			const {
				date
			} = divider.dataset;
			if (!date) {
				return;
			}
			if (firstDate === '') {
				firstDate = date;
			}
			if (isDisplacedFromGroup(divider)) {
				topVisibleDate = date;
			}
		});
		return topVisibleDate === '' ? firstDate : topVisibleDate;
	};

	/* global $Values */


	// every jump of the chat, whatever it was started by; a jump that is not date-driven carries an
	// empty day and no identifier

	// the identifier decides, the rest is the context of the jump it names

	// both requests of the list are addressed by chat and answered with the return value (EventType)

	/**
	 * The anchor of a jump by date can arrive later than the jump itself, so the highlight waits for the
	 * collection changes that follow: the page of the anchor normally comes with the first of them, and
	 * a busy chat can change its collection while that page is still on its way.
	 *
	 * What ENDS the wait is the chat reporting the context of this very jump as applied
	 * (`EventType.dialog.dateNavigationContextApplied`): by then the list has finished moving, so an
	 * anchor still missing is an anchor that is never coming - a message deleted, a day with no history
	 * behind it - and the failure is reported at once instead of being waited out. The wait ends when
	 * the work ends, and the user is not kept in front of a finished screen for nine seconds.
	 *
	 * The two bounds below are what is left for a jump no report can be matched to: the wait is started
	 * by the chat announcing the jump, and every report about it is addressed by the identifier the jump
	 * carries, so a jump by date started without one is waited for by these two alone. Neither of them
	 * can be dropped:
	 * - the budget makes a busy chat stop searching the list on every change;
	 * - the clock covers a chat that stopped changing and so stopped spending the budget, whose attempts
	 *   left would otherwise be spent by whatever changes the collection next, lighting a day up long
	 *   after the user was told the jump had failed.
	 * Both are taken off the moment a chat says it has taken the jump on
	 * (`EventType.dialog.dateNavigationContextApplying`): from there the report is certain however long
	 * the loading runs, and either bound still standing would answer a jump in progress with a failure -
	 * and be contradicted by the list moving to the day right after. The budget is no safer than the
	 * clock here: it counts collection changes, and a chat busy enough to make twenty of them while the
	 * context is loading spends it inside the loading it was never meant to interrupt. While they run,
	 * they stay inside the window the side that started the jump gives them, so that the outcome still
	 * reaches somebody waiting for it.
	 */
	const MAX_DATE_ANCHOR_ATTEMPTS = 20;

	/**
	 * A click on the divider asks the sidebar for the message search panel, and the panel may not be on
	 * screen yet - so the request waits here until a panel takes it. The wait is bounded because an
	 * unclaimed request must not survive the click that made it: a panel opened much later would jump to
	 * the day of a click the user does not remember. The panel appears within the flush of the click in
	 * practice, so the window covers a slow render and nothing more.
	 */
	const DATE_NAVIGATION_REQUEST_LIFETIME = 3000;

	// @vue/component
	const MessageList = {
		name: 'MessageList',
		directives: {
			'message-observer': {
				mounted(element, binding) {
					binding.instance.observer.observeMessage(element);
				},
				beforeUnmount(element, binding) {
					binding.instance.observer.unobserveMessage(element);
				}
			}
		},
		components: {
			DateGroup,
			AuthorGroup,
			NewMessagesBlock,
			MarkedMessagesBlock,
			DialogStatus,
			DialogLoader,
			EmptyState,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			HistoryLimitBanner,
			...MessageComponents
		},
		inject: {
			// the chat content reports which sidebar panel is in front; outside it the message list keeps
			// working and simply asks for the panel every time
			currentSidebarPanel: {
				default: ''
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			containerHeight: {
				type: [Number, null],
				default: null
			},
			scrollPinEnabled: {
				type: Boolean,
				default: false
			},
			spacerHeight: {
				type: Number,
				default: 0
			},
			spacerAnimated: {
				type: Boolean,
				default: false
			},
			// external inline styles for individual messages, keyed by message id.
			// Keys are object keys and so always strings: a pending message addressed by its
			// send-time temporaryId (a uuid) and one addressed by a numeric server id match alike
			messageStyles: {
				/** @type {{ [messageId: string]: Object }} */
				type: Object,
				default: () => ({})
			}
		},
		emits: ['spacerRiseEnd'],
		data() {
			return {
				windowFocused: false
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			user() {
				return this.$store.getters['users/get'](this.dialogId, true);
			},
			messageCollection() {
				return this.$store.getters['messages/getByChatId'](this.dialog.chatId);
			},
			isDateNavigationAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMessageDateNavigationAvailable);
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			dialogInited() {
				return this.dialog.inited;
			},
			formattedCollection() {
				if (!this.dialogInited && this.messageCollection.length === 0) {
					return [];
				}
				return this.getCollectionManager().formatMessageCollection(this.messageCollection);
			},
			noMessages() {
				return this.formattedCollection.length === 0;
			},
			isHistoryLimitExceeded() {
				return !im_v2_lib_feature.TariffManager.chatHistory.isAvailable() && this.dialog.tariffRestrictions.isHistoryLimitExceeded;
			},
			showDialogStatus() {
				// DialogStatus renders inside the scroll content below the spacer; its height and
				// late appearance disturb scroll-pin geometry (jerk the pinned question), so it is
				// hidden in pin chats (ERR-007).
				if (this.scrollPinEnabled) {
					return false;
				}
				return this.messageCollection.some(message => {
					return message.id === this.dialog.lastMessageId;
				});
			},
			showEmptyState() {
				return this.dialogInited && this.noMessages && this.isUser && !this.isHistoryLimitExceeded;
			}
		},
		watch: {
			dialogId() {
				// nothing of the jump into the previous chat belongs to this one, and the side waiting
				// for that jump is told it will not finish. Cancelled and not failed: the user left of
				// their own accord, and an error about the chat they left is noise in the one they opened
				this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.cancelled);
				this.forgetDateNavigationRequest();
				this.dateGroupHighlight.clear();
			}
		},
		created() {
			this.initCollectionManager();
			this.initObserverManager();
			this.dateGroupHighlight = new DateGroupHighlight();
			// the jump by date the list is waiting for: the anchor to look for, the day to report back
			// and the chat the jump was started in - the list may leave that chat before the wait is over
			this.pendingDateAnchor = null;
			this.pendingDateNavigationDate = '';
			this.dateNavigationRequestTimer = null;
		},
		mounted() {
			this.subscribeToEvents();
		},
		beforeUnmount() {
			this.unsubscribeFromEvents();
			// the list is going away with the chat it belonged to - the same cancellation as leaving it
			this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.cancelled);
			this.forgetDateNavigationRequest();
			this.dateGroupHighlight.clear();
		},
		methods: {
			subscribeToEvents() {
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.onClickMessageContextMenu, this.onMessageContextMenuClick);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.messageContextJumpStarted, this.onMessageContextJumpStarted);
				// alongside the jump itself and not behind the feature gate: the wait is started by a jump
				// that carries a date, and the report that ends it has to reach the same waits
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.dateNavigationContextApplying, this.onDateNavigationContextApplying);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.dateNavigationContextApplied, this.onDateNavigationContextApplied);
				if (this.isDateNavigationAvailable) {
					this.getEmitter().subscribe(im_v2_const.EventType.dialog.getTopVisibleDate, this.onGetTopVisibleDate);
					this.getEmitter().subscribe(im_v2_const.EventType.dialog.getPendingDateNavigation, this.onGetPendingDateNavigation);
				}
			},
			unsubscribeFromEvents() {
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onClickMessageContextMenu, this.onMessageContextMenuClick);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.messageContextJumpStarted, this.onMessageContextJumpStarted);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.dateNavigationContextApplying, this.onDateNavigationContextApplying);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.dateNavigationContextApplied, this.onDateNavigationContextApplied);

				// unconditionally, unlike the subscription: the flag is read from the feature manager
				// anew here, so a flag switched off within the session would leave the handlers of a
				// destroyed component in the emitter. Unsubscribing what was never subscribed is a no-op
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.getTopVisibleDate, this.onGetTopVisibleDate);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.getPendingDateNavigation, this.onGetPendingDateNavigation);
			},
			/**
			 * The calendar of the message search panel opens on the month of the messages the user sees
			 * now, and only the list knows which day that is. The panel asks for the day while
			 * it builds the calendar, and the day is read from the layout that is already on screen - it
			 * needs neither a frame nor a copy of itself in the store.
			 */
			onGetTopVisibleDate(event) {
				const {
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId || !this.$refs.container) {
					return '';
				}
				return getTopVisibleDate(this.$refs.container);
			},
			/**
			 * The chat has started a jump - and the chat is asked and not the side that requested one:
			 * the request is one way of starting a jump among several, and a wait left standing through
			 * the jumps started by the others is a wait for an anchor that is not coming any more.
			 */
			onMessageContextJumpStarted(event) {
				const {
					dialogId,
					messageId,
					date,
					jumpId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return;
				}

				// a new jump supersedes the anchor the previous one may still be waiting for, and the
				// superseded jump is reported as cancelled instead of being dropped in silence: the side
				// waiting for it cannot see that it was superseded, and told nothing it would sit out its
				// own bound and answer with a failure the jump the user themselves replaced. Cancelled
				// and not failed - nothing failed, the user went somewhere else
				//
				// Reporting it whatever superseded it is safe because the report names the jump it
				// belongs to: another jump by date has already made the waiting side forget the
				// identifier of the old one, so that report meets nothing and is thrown away, while an
				// ordinary jump leaves the identifier in place and the wait ends the way it should
				this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.cancelled);

				// only a jump by date asks for the divider of the day; the other jumps highlight the
				// message alone and carry no date at all
				if (!date) {
					return;
				}
				const jump = {
					dialogId,
					messageId,
					date,
					jumpId,
					attempts: 0,
					takenByChat: false,
					stopWatching: null,
					timeoutId: null
				};
				this.pendingDateAnchor = jump;
				// the collection is watched for the length of the wait alone: outside a jump by date
				// there is no anchor to look for, and every change would pay a search for nothing
				jump.stopWatching = this.$watch('formattedCollection', () => {
					void this.highlightPendingDateGroup();
				});
				jump.timeoutId = setTimeout(() => this.onDateAnchorWaitTimeout(jump), im_v2_const.DateNavigationJumpTimeout.anchorWait);
				void this.highlightPendingDateGroup();
			},
			/**
			 * The chat has taken the jump on and is loading the context. From here the outcome is
			 * certain: the chat reports the context as applied on a settled promise, so the report comes
			 * whether the loading succeeded, failed or was superseded. So BOTH bounds of the wait come
			 * off - they are there for a jump no chat ever took, and the wait itself is unchanged and
			 * still ends on the outcome. Left on, either of them would answer a load longer than its
			 * window with a failure, and the chat would then move to the day anyway, next to the error
			 * saying it had not.
			 *
			 * The clock is taken off by hand, the budget by the flag set here: a chat busy enough to
			 * change its collection twenty times while the context is loading would otherwise spend the
			 * budget on a jump that is still on its way - the very case the clock was taken off for.
			 *
			 * The identifier decides here for the same reason it decides below, and the confirmation
			 * cannot outrun the wait it belongs to: the chat announces the jump first and says this
			 * second, from the same method and with nothing between the two, so the wait is standing by
			 * the time the confirmation of it arrives.
			 */
			onDateNavigationContextApplying(event) {
				const {
					jumpId
				} = event.getData();
				const jump = this.pendingDateAnchor;
				if (!jumpId || !jump || jump.jumpId !== jumpId) {
					return;
				}
				jump.takenByChat = true;
				clearTimeout(jump.timeoutId);
				jump.timeoutId = null;
			},
			/**
			 * The chat has finished applying the context of the jump: the page of the message arrived,
			 * or it failed to, or the jump was superseded and its answer refused. Whichever of the three,
			 * the collection will not move for this jump any more, so one last look for the anchor
			 * decides it - found is the day lit up, missing is a message that is not there at all. Told
			 * now and not waited out: a jump that cannot land is the very case the clock used to spend
			 * its nine seconds on.
			 *
			 * Only the jump the list is waiting for is answered - a superseded jump reports as well, and
			 * its report belongs to a jump the list has already left.
			 *
			 * The identifier of the jump is what decides that, and nothing else can: the same day picked
			 * twice in a row resolves to the same message, so the chat, the message and the day of the
			 * superseded jump are every bit the same as those of the jump that replaced it. A report
			 * carrying no identifier at all names no jump and is left to the backstop above.
			 */
			async onDateNavigationContextApplied(event) {
				const {
					jumpId
				} = event.getData();
				const jump = this.pendingDateAnchor;
				if (!jumpId || !jump || jump.jumpId !== jumpId) {
					return;
				}
				await this.highlightPendingDateGroup();

				// still waiting means the attempt found nothing and reported nothing: the jump is over
				// either way, and this is the only side that knows it
				if (this.pendingDateAnchor === jump) {
					this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.failure);
				}
			},
			/**
			 * The wait ran out with the anchor still missing, and no chat ever said it had taken this
			 * jump on - a confirmation takes the clock off. So there is nothing left to wait for, and
			 * the jump is over exactly the way a spent budget ends it - the watcher goes back and the
			 * failure is reported - so that the day of a jump nobody waits for any more is never lit up
			 * by a change of the collection much later.
			 */
			onDateAnchorWaitTimeout(jump) {
				if (this.pendingDateAnchor !== jump) {
					return;
				}
				this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.failure);
			},
			/**
			 * The highlight goes on strictly after the jump: the dialog scrolls to the message and, if
			 * the message was not loaded yet, brings its page in first. Until the anchor is in the DOM
			 * there is nothing to address, so the request waits for the next collection change.
			 */
			async highlightPendingDateGroup() {
				const jump = this.pendingDateAnchor;
				if (!jump) {
					return;
				}
				jump.attempts += 1;
				await this.$nextTick();

				// the wait can be over by the time the turn comes back: the anchor found by an attempt
				// started before this one, the jump superseded, the chat left
				if (this.pendingDateAnchor !== jump) {
					return;
				}
				try {
					const container = this.$refs.container;
					if (container && this.dateGroupHighlight.showByAnchor(container, jump.messageId)) {
						this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.success);
					}
				} finally {
					// the budget is what makes the wait finite while no chat has taken the jump on, so it
					// is reached even when the attempt threw: otherwise the request would stay pending
					// and the collection watcher would throw again on every change of the list. Once a
					// chat has taken the jump on, the report of it is what ends the wait, and the budget
					// steps aside - see onDateNavigationContextApplying()
					const budgetSpent = !jump.takenByChat && jump.attempts >= MAX_DATE_ANCHOR_ATTEMPTS;
					if (this.pendingDateAnchor === jump && budgetSpent) {
						this.reportDateNavigationJump(im_v2_const.DateNavigationJumpOutcome.failure);
					}
				}
			},
			/**
			 * The jump is over for the side that started it only when the divider is lit up or the wait
			 * is given up - until then the list is still where it was, and an answer given earlier would
			 * be an answer about a screen the user is not looking at.
			 *
			 * The report is addressed by the identifier of the jump and not by its day: two jumps to the
			 * same day carry the same chat, the same message and the same date, so only the identifier
			 * says which of them this outcome belongs to. It is taken from the jump the list stored, so
			 * every way out of the wait - the divider found, the budget spent, the clock, the chat left,
			 * the list going away, a jump superseding this one - names the same jump it started with.
			 */
			reportDateNavigationJump(outcome) {
				const jump = this.pendingDateAnchor;
				if (!jump) {
					return;
				}
				this.forgetPendingDateGroup();
				this.getEmitter().emit(im_v2_const.EventType.dialog.dateNavigationJumpFinished, {
					dialogId: jump.dialogId,
					date: jump.date,
					jumpId: jump.jumpId,
					outcome
				});
			},
			forgetPendingDateGroup() {
				this.pendingDateAnchor?.stopWatching?.();
				clearTimeout(this.pendingDateAnchor?.timeoutId);
				this.pendingDateAnchor = null;
			},
			/**
			 * The divider of the day is the second entry into the calendar, and the calendar
			 * itself lives in the message search panel of the sidebar. The click therefore asks the
			 * sidebar for that panel and leaves the day here, where a panel takes it from - the one that
			 * appears asks for the day itself, the one already on screen is told below. Delivery this way
			 * depends neither on the flush the panel mounts in nor on which sidebar of the screen answered
			 * the request to open. An already opened panel is not asked to open again - the request would
			 * toggle it closed.
			 */
			async onDateNavigationClick(payload) {
				this.rememberDateNavigationRequest(payload.date);
				if (this.currentSidebarPanel !== im_v2_const.SidebarDetailBlock.messageSearch) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
						panel: im_v2_const.SidebarDetailBlock.messageSearch,
						dialogId: this.dialogId
					});

					// the tick lets the panel of this flush take the request and lets a panel that was
					// already living be re-addressed to this chat before it is told anything
					await this.$nextTick();
				}
				await this.announceDateNavigationRequest();
			},
			rememberDateNavigationRequest(date) {
				this.forgetDateNavigationRequest();
				this.pendingDateNavigationDate = date;
				this.dateNavigationRequestTimer = setTimeout(this.forgetDateNavigationRequest, DATE_NAVIGATION_REQUEST_LIFETIME);
			},
			forgetDateNavigationRequest() {
				clearTimeout(this.dateNavigationRequestTimer);
				this.dateNavigationRequestTimer = null;
				this.pendingDateNavigationDate = '';
			},
			/**
			 * A panel that is already on screen neither mounts nor activates, so nothing makes it ask -
			 * it is told instead, and it answers whether it took the request. A panel that took the
			 * request while the sidebar was opening leaves nothing to tell.
			 */
			async announceDateNavigationRequest() {
				if (!this.pendingDateNavigationDate) {
					return;
				}
				const answers = await this.getEmitter().emitAsync(im_v2_const.EventType.sidebar.openDateNavigation, {
					dialogId: this.dialogId,
					date: this.pendingDateNavigationDate
				});
				if (answers.includes(true)) {
					this.forgetDateNavigationRequest();
				}
			},
			// the request is given away once: whoever asks first opens the calendar, and a second asker
			// - the same panel mounted and activated in one flush - gets nothing to open twice
			onGetPendingDateNavigation(event) {
				const {
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId || !this.pendingDateNavigationDate) {
					return '';
				}
				const date = this.pendingDateNavigationDate;
				this.forgetDateNavigationRequest();
				return date;
			},
			insertTextQuote(message) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertText, {
					text: im_v2_lib_quote.Quote.prepareInlineMessageQuote(message),
					withNewLine: true,
					replace: false,
					dialogId: this.dialogId
				});
			},
			insertMention(user) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertMention, {
					mentionText: user.name,
					mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(user.id, user.name),
					mentionedUserId: user.id,
					dialogId: this.dialogId,
					isMentionSymbol: false
				});
			},
			openReplyPanel(messageId) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.replyMessage, {
					messageId,
					dialogId: this.dialogId
				});
			},
			onAvatarClick(params) {
				const {
					dialogId,
					$event: event
				} = params;
				const user = this.$store.getters['users/get'](dialogId);
				if (im_v2_lib_utils.Utils.key.isAltOrOption(event)) {
					this.insertMention(user);
					return;
				}
				const avatarMenu = new AvatarMenu({
					emitter: this.getEmitter()
				});
				avatarMenu.openMenu({
					user,
					dialog: this.dialog
				}, event.currentTarget);
			},
			onMessageContextMenuClick(eventData) {
				const {
					message,
					event,
					dialogId,
					bindElement
				} = eventData.getData();
				if (dialogId !== this.dialogId) {
					return;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				if (!permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.openMessageMenu, this.dialogId)) {
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCombination(event, im_v2_const.HotkeyCombination.messageMenu.quote)) {
					this.insertTextQuote(message);
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCmdOrCtrl(event)) {
					this.openReplyPanel(message.id);
					return;
				}
				const context = {
					dialogId: this.dialogId,
					...message
				};
				const messageMenuManager = im_v2_lib_menu.MessageMenuManager.getInstance();
				let target = {
					left: event.pageX,
					top: event.pageY
				};
				if (bindElement) {
					target = bindElement;
				}
				messageMenuManager.openMenu({
					messageContext: context,
					applicationContext: {
						emitter: this.getEmitter()
					},
					target
				});
			},
			initObserverManager() {
				this.observer = new ObserverManager({
					dialogId: this.dialogId,
					context: {
						emitter: this.getEmitter()
					}
				});
			},
			getMessageComponentName(message) {
				return new im_v2_lib_messageComponent.MessageComponentManager(message).getName();
			},
			initCollectionManager() {
				this.collectionManager = new CollectionManager(this.dialogId);
			},
			getCollectionManager() {
				return this.collectionManager;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			getMessageStyle(message) {
				return this.messageStyles[message.id] ?? null;
			},
			onSpacerTransitionEnd(event) {
				if (event.propertyName === 'height') {
					this.$emit('spacerRiseEnd');
				}
			}
		},
		template: `
		<slot v-if="!dialogInited" name="loader">
			<DialogLoader />
		</slot>
		<FadeAnimation :duration="200">
			<div
				v-if="dialogInited"
				ref="container"
				class="bx-im-message-list__container"
				data-testid="im-message-list"
			>
				<EmptyState v-if="showEmptyState" :dialogId="dialogId" />
				<slot name="before-messages" :getMessageComponentName="getMessageComponentName"></slot>
				<HistoryLimitBanner v-if="isHistoryLimitExceeded" :dialogId="dialogId" :noMessages="noMessages" />
				<DateGroup
					v-for="dateGroup in formattedCollection"
					:key="dateGroup.dateTitle"
					:item="dateGroup"
					@dateNavigationClick="onDateNavigationClick"
				>
					<!-- Slot for every date group item -->
					<template #dateGroupItem="{ dateGroupItem, isMarkedBlock, isNewMessagesBlock, isAuthorBlock }">
						<MarkedMessagesBlock v-if="isMarkedBlock" data-id="newMessages" />
						<NewMessagesBlock v-else-if="isNewMessagesBlock" data-id="newMessages" />
						<AuthorGroup 
							v-else-if="isAuthorBlock" 
							:item="dateGroupItem"
							:contextDialogId="dialogId"
							@avatarClick="onAvatarClick"
						>
							<!-- Slot for every message -->
							<template #message="{ message, index }">
								<component
									v-message-observer
									:is="getMessageComponentName(message)"
									:withTitle="index === 0"
									:item="message"
									:dialogId="dialogId"
									:key="message.id"
									:data-viewed="message.viewed"
									:containerHeight="containerHeight"
									:style="getMessageStyle(message)"
								>
								</component>
							</template>
						</AuthorGroup>
					</template>
				</DateGroup>
				<div
					v-if="scrollPinEnabled"
					class="bx-im-dialog-chat__scroll-pin-spacer"
					:class="{ '--rising': spacerAnimated }"
					:style="{ height: spacerHeight + 'px' }"
					data-testid="im-dialog-scroll-pin-spacer"
					aria-hidden="true"
					@transitionend="onSpacerTransitionEnd"
				></div>
				<DialogStatus v-if="showDialogStatus" :dialogId="dialogId" />
			</div>
		</FadeAnimation>
	`
	};

	exports.AuthorGroup = AuthorGroup;
	exports.AvatarMenu = AvatarMenu;
	exports.CollectionManager = CollectionManager;
	exports.MessageComponents = MessageComponents;
	exports.MessageList = MessageList;
})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX?.Messenger?.v2?.Component?.Animation??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Lib??{}, BX??{}, BX??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Service??{}, BX?.UI?.Vue3?.Components??{}, BX?.Messenger?.v2?.Lib??{}, BX?.OpenLines?.v2?.Component?.Message??{}, BX?.OpenLines?.v2?.Component?.Message??{}, BX?.OpenLines?.v2?.Component?.Message??{}, BX?.OpenLines?.v2?.Component?.Message??{}, BX?.OpenLines?.v2?.Component?.Message??{}, BX?.IM?.V2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.IM?.V2?.Component?.Message?.Collab??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{}, BX?.Messenger?.v2?.Component?.Message??{});;
//# sourceMappingURL=message-list.bundle.js.map
