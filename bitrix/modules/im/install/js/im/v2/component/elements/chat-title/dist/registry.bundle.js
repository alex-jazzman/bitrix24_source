/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, ui_iconSet_api_vue, im_v2_application_core, im_v2_const, im_v2_lib_feature, ui_vue3, im_v2_lib_textHighlighter, im_v2_lib_copilot, im_v2_css_classes, im_v2_lib_escManager, im_v2_lib_permission) {
	'use strict';

	const DialogSpecialType = {
		copilot: 'copilot',
		// TODO: change naming to aiAssistant after marta remove
		extranet: 'extranet',
		network: 'network',
		collaber: 'collaber',
		guest: 'guest',
		support24: 'support24'
	};
	const TitleIcons = {
		absent: 'absent',
		birthday: 'birthday'
	};
	const ChatTitleType = {
		selfChat: 'selfChat'
	};

	const ICON_SIZE = 18;
	const ChatTitle = {
		name: 'ChatTitle',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: [Number, String],
				default: 0
			},
			text: {
				type: String,
				default: ''
			},
			showItsYou: {
				type: Boolean,
				default: true
			},
			withLeftIcon: {
				type: Boolean,
				default: true
			},
			withColor: {
				type: Boolean,
				default: false
			},
			withMute: {
				type: Boolean,
				default: false
			},
			withAutoDelete: {
				type: Boolean,
				default: false
			},
			onlyFirstName: {
				type: Boolean,
				default: false
			},
			twoLine: {
				type: Boolean,
				default: false
			},
			customType: {
				type: String,
				default: ''
			}
		},
		computed: {
			Color: () => im_v2_const.Color,
			ICON_SIZE: () => ICON_SIZE,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			user() {
				return this.$store.getters['users/get'](this.dialogId, true);
			},
			botType() {
				const EXCLUDED_BOT_CODES = [im_v2_const.BotCode.aiAssistant];
				if (!this.isUser) {
					return '';
				}
				const bot = this.$store.getters['users/bots/getByUserId'](this.dialogId);
				if (!bot || EXCLUDED_BOT_CODES.includes(bot.code)) {
					return '';
				}
				return bot.type;
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			isSelfChat() {
				return this.isUser && this.user.id === im_v2_application_core.Core.getUserId();
			},
			containerClasses() {
				const classes = [];
				if (this.twoLine) {
					classes.push('--twoline');
				}
				return classes;
			},
			dialogName() {
				if (this.customType === ChatTitleType.selfChat) {
					return this.loc('IM_CHAT_TITLE_MY_NOTES');
				}
				if (this.text) {
					return main_core.Text.encode(this.text);
				}
				let resultText = this.dialog.name;
				if (this.isUser) {
					resultText = this.onlyFirstName ? this.user.firstName : this.user.name;
				}
				return main_core.Text.encode(resultText);
			},
			dialogSpecialType() {
				if (!this.isUser) {
					if (this.isCollabChat) {
						return '';
					}
					if (this.isExtranet) {
						return DialogSpecialType.extranet;
					}
					if (this.isCollaberChatOrUser) {
						return DialogSpecialType.collaber;
					}
					if ([im_v2_const.ChatType.support24Notifier, im_v2_const.ChatType.support24Question].includes(this.dialog.type)) {
						return DialogSpecialType.support24;
					}
					return '';
				}
				if (this.isSelfChat) {
					return '';
				}
				if (this.isAiAssistantBot) {
					return DialogSpecialType.copilot;
				}
				if (this.isBot) {
					return this.botType;
				}
				if (this.isExtranet) {
					return DialogSpecialType.extranet;
				}
				if (this.isCollaberChatOrUser) {
					return DialogSpecialType.collaber;
				}
				if (this.isGuest) {
					return DialogSpecialType.guest;
				}
				if (this.isNetwork) {
					return DialogSpecialType.network;
				}
				return '';
			},
			isDialogSpecialTypeWithLeftIcon() {
				if (this.isCollaberChatOrUser || this.isExtranet || this.isGuest) {
					return false;
				}
				return main_core.Type.isStringFilled(this.dialogSpecialType);
			},
			leftIcon() {
				if (!this.withLeftIcon || this.isSelfChat) {
					return '';
				}
				if (this.isDialogSpecialTypeWithLeftIcon) {
					return this.dialogSpecialType;
				}
				if (!this.isUser) {
					return '';
				}
				if (this.showBirthdays && this.user.isBirthday) {
					return TitleIcons.birthday;
				}
				if (this.user.isAbsent) {
					return TitleIcons.absent;
				}
				return '';
			},
			color() {
				if (!this.withColor || this.specialColor) {
					return '';
				}
				return this.dialog.color;
			},
			specialColor() {
				return this.dialogSpecialType;
			},
			isBot() {
				if (!this.isUser) {
					return false;
				}
				return this.user.type === im_v2_const.UserType.bot;
			},
			isExtranet() {
				if (this.isUser) {
					return this.user.type === im_v2_const.UserType.extranet;
				}
				return this.dialog.extranet;
			},
			isAiAssistantBot() {
				if (!this.isBot) {
					return false;
				}
				const bot = this.$store.getters['users/bots/getByUserId'](this.dialogId);
				return bot?.code === im_v2_const.BotCode.copilot;
			},
			isCollaberChatOrUser() {
				if (this.isUser) {
					return this.user.type === im_v2_const.UserType.collaber;
				}
				return this.dialog.containsCollaber;
			},
			isCollabChat() {
				return this.dialog.type === im_v2_const.ChatType.collab;
			},
			isNetwork() {
				if (this.isUser) {
					return this.user.network;
				}
				return false;
			},
			isGuest() {
				if (!this.isUser) {
					return false;
				}
				return this.$store.getters['users/isGuest'](this.dialogId);
			},
			isAutoDeleteEnabled() {
				if (!this.withAutoDelete) {
					return false;
				}
				return this.$store.getters['chats/autoDelete/isEnabled'](this.chatId);
			},
			tooltipText() {
				if (this.customType === ChatTitleType.selfChat) {
					return this.loc('IM_CHAT_TITLE_MY_NOTES');
				}
				if (this.isSelfChat && this.showItsYou) {
					return `${this.dialog.name} (${this.loc('IM_CHAT_TITLE_SELF')})`;
				}
				return this.dialog.name;
			},
			showBirthdays() {
				return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showBirthday);
			},
			isCopilot2026Styles() {
				return this.isAiAssistantBot && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div :class="containerClasses" class="bx-im-chat-title__scope bx-im-chat-title__container">
			<span class="bx-im-chat-title__content">
				<span v-if="leftIcon" :class="'--' + leftIcon" class="bx-im-chat-title__icon"></span>
				<span
					:class="[specialColor ? '--' + specialColor : '', {'--copilot2026': isCopilot2026Styles}]"
					:style="{color: color}"
					:title="tooltipText"
					class="bx-im-chat-title__text"
					v-html="dialogName"
				></span>
				<strong v-if="isSelfChat && showItsYou">
					<span class="bx-im-chat-title__text --self">({{ loc('IM_CHAT_TITLE_SELF') }})</span>
				</strong>
				<span v-if="withMute && dialog.isMuted" class="bx-im-chat-title__muted-icon"></span>
				<BIcon
					v-if="isAutoDeleteEnabled"
					:name="OutlineIcons.TIMER_DOT"
					:color="Color.accentBlue"
					:size="ICON_SIZE"
					:hoverable="false"
					:title="loc('IM_CHAT_TITLE_AUTO_DELETE_TITLE')"
					class="bx-im-chat-title__auto-delete-icon"
				/>
			</span>
		</div>
	`
	};

	// @vue/component
	const ChatTitleWithHighlighting = ui_vue3.BitrixVue.cloneComponent(ChatTitle, {
		name: 'ChatTitleWithHighlighting',
		props: {
			textToHighlight: {
				type: String,
				default: ''
			}
		},
		computed: {
			dialogName() {
				// noinspection JSUnresolvedVariable
				return im_v2_lib_textHighlighter.highlightText(this.parentDialogName, this.textToHighlight);
			}
		}
	});

	// @vue/component
	const MessageAuthorTitle = {
		name: 'MessageAuthorTitle',
		components: {
			ChatTitle
		},
		props: {
			dialogId: {
				type: [Number, String],
				default: 0
			},
			messageId: {
				type: [Number, String],
				default: 0
			},
			text: {
				type: String,
				default: ''
			},
			showItsYou: {
				type: Boolean,
				default: true
			},
			withLeftIcon: {
				type: Boolean,
				default: true
			},
			withColor: {
				type: Boolean,
				default: false
			},
			withMute: {
				type: Boolean,
				default: false
			},
			onlyFirstName: {
				type: Boolean,
				default: false
			},
			twoLine: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			},
			authorId() {
				return this.message.authorId;
			},
			customAuthorName() {
				const copilotManager = new im_v2_lib_copilot.CopilotManager();
				if (!copilotManager.isCopilotBot(this.dialogId)) {
					return '';
				}
				return copilotManager.getNameWithRole(this.messageId);
			}
		},
		template: `
		<ChatTitle 
			:dialogId="dialogId"
			:text="customAuthorName"
			:showItsYou="showItsYou"
			:withLeftIcon="withLeftIcon"
			:withColor="withColor"
			:withMute="withMute"
			:onlyFirstName="onlyFirstName"
			:twoLine="twoLine"
		/>
	`
	};

	const INPUT_PADDING = 5;

	// @vue/component
	const EditableChatTitle = {
		name: 'EditableChatTitle',
		components: {
			ChatTitle
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['newTitleSubmit'],
		data() {
			return {
				isEditing: false,
				inputWidth: 0,
				chatTitle: ''
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			canBeRenamed() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.rename, this.dialogId);
			},
			showTitleButton() {
				return this.canBeRenamed && !this.isEditing;
			},
			// The title itself reads as a name, so the button says what activating it does - and keeps the
			// name, otherwise the walk would announce the action without telling which chat it renames.
			// The marks of the title travel with it: the button hides its own content, so a state drawn as
			// an icon has no other way into the accessibility tree.
			renameLabel() {
				const rename = this.loc('IM_CHAT_TITLE_RENAME_ARIA', {
					'#TITLE#': this.dialog.name
				});
				return [rename, ...this.titleStates].join(', ');
			},
			titleStates() {
				const states = [];
				if (this.dialog.isMuted) {
					states.push(this.loc('IM_CHAT_TITLE_MUTED_ARIA'));
				}
				if (this.isAutoDeleteEnabled) {
					states.push(this.loc('IM_CHAT_TITLE_AUTO_DELETE_ARIA'));
				}
				return states;
			},
			isAutoDeleteEnabled() {
				return this.$store.getters['chats/autoDelete/isEnabled'](this.dialog.chatId);
			},
			inputStyle() {
				return {
					width: `calc(${this.inputWidth}ch + ${INPUT_PADDING}px)`
				};
			}
		},
		watch: {
			chatTitle() {
				this.inputWidth = this.chatTitle.length;
			}
		},
		created() {
			this.getEmitter().subscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
		},
		mounted() {
			this.chatTitle = this.dialog.name;
		},
		methods: {
			// ALG-02: the native button activates on Enter and Space by itself, so entering the edit mode has
			// a single entry point and needs no key handler of its own.
			async onTitleClick() {
				if (!this.canBeRenamed) {
					return;
				}
				this.chatTitle = this.dialog.name;
				this.isEditing = true;
				await this.$nextTick();
				this.$refs.titleInput.focus();
			},
			/**
			 * The single exit of the editor, idempotent by the edit flag, so one gesture submits once.
			 *
			 * It is also the whole of ALG-02 for `Tab` and `Shift+Tab`, and those keys get no handler on
			 * purpose: the browser has already picked the next stop from the focused field, and closing the
			 * editor inside `keydown` would take that starting point away before the default action runs.
			 * The blur of the real focus move saves instead - Vue updates asynchronously, so the field is
			 * still in the document while the browser moves on, and nothing here places the focus itself.
			 */
			onNewTitleSubmit() {
				if (!this.isEditing) {
					return;
				}
				this.isEditing = false;
				const nameNotChanged = this.chatTitle === this.dialog.name;
				if (nameNotChanged || this.chatTitle === '') {
					return;
				}
				this.$emit('newTitleSubmit', this.chatTitle);
			},
			// ALG-02: Enter saves and hands the focus back to the button it came from. The submit itself is
			// idempotent, so the blur of the field being unmounted adds no second event.
			onInputEnter() {
				this.onNewTitleSubmit();
				void this.focusTitleButton();
			},
			// ALG-02: Escape restores the title the chat had, closes the editor and returns the focus. The
			// `handled` answer is what stops the rest of the Esc chain, so the chat itself stays open.
			onBeforeEscape() {
				if (!this.isEditing) {
					return im_v2_lib_escManager.EscEventAction.ignored;
				}
				this.chatTitle = this.dialog.name;
				this.isEditing = false;
				void this.focusTitleButton();
				return im_v2_lib_escManager.EscEventAction.handled;
			},
			async focusTitleButton() {
				await this.$nextTick();
				this.$refs.titleButton?.focus();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		/**
		 * The pencil stands in the markup of the button from the start and is revealed by CSS - on `:hover`
		 * and on `:focus-visible` - instead of being inserted and removed by handlers of the focus. WebKit
		 * aborts the focus move of a `Tab` when the element that is losing the focus rebuilds its own content
		 * at that moment, and the walk was left standing on the title (measured on the stand, 2026-08-27).
		 * The pencil stays out of the accessibility tree and out of the walk either way.
		 */
		// language=Vue
		template: `
		<button
			v-if="showTitleButton"
			ref="titleButton"
			type="button"
			tabindex="0"
			:aria-label="renameLabel"
			@click="onTitleClick"
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__wrap
				--can-rename --focus-visible"
			data-testid="im-chat-title-rename-btn"
		>
			<div class="bx-im-elements-editable-chat-title__container" aria-hidden="true">
				<ChatTitle :dialogId="dialogId" :withMute="true" :withAutoDelete="true" />
			</div>
			<div class="bx-im-elements-editable-chat-title__edit-icon_container" aria-hidden="true">
				<div class="bx-im-elements-editable-chat-title__edit-icon"></div>
			</div>
		</button>
		<div
			v-else-if="!isEditing"
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__wrap"
		>
			<div class="bx-im-elements-editable-chat-title__container">
				<ChatTitle :dialogId="dialogId" :withMute="true" :withAutoDelete="true" />
			</div>
			<div class="bx-im-elements-editable-chat-title__edit-icon_container"></div>
		</div>
		<div
			v-else
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__input_container"
		>
			<input
				v-model="chatTitle"
				:style="inputStyle"
				:aria-label="loc('IM_CHAT_TITLE_RENAME_INPUT_ARIA')"
				@focus="$event.target.select()"
				@blur="onNewTitleSubmit"
				@keydown.enter.prevent="onInputEnter"
				type="text"
				class="bx-im-elements-editable-chat-title__input"
				data-testid="im-chat-title-input"
				ref="titleInput"
			/>
		</div>
	`
	};

	exports.ChatTitle = ChatTitle;
	exports.ChatTitleType = ChatTitleType;
	exports.ChatTitleWithHighlighting = ChatTitleWithHighlighting;
	exports.EditableChatTitle = EditableChatTitle;
	exports.MessageAuthorTitle = MessageAuthorTitle;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX.UI.IconSet, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Vue3, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
