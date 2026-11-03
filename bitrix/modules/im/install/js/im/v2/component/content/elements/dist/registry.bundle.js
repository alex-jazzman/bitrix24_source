/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_v2_application_core, im_v2_component_animation, im_v2_component_elements_avatar, im_v2_component_elements_loader, im_v2_const, im_v2_lib_a11y, im_v2_lib_feature, im_v2_lib_permission, im_v2_provider_service_chat, ui_iconSet_api_vue, im_v2_component_entitySelector, im_v2_lib_analytics, im_v2_css_classes, call_widget_callButton, ui_a11y, im_v2_lib_utils, im_v2_component_elements_chatTitle, im_v2_component_elements_entityLink, ui_vue3, im_v2_component_dialog_chat, im_v2_component_sidebar, im_v2_component_textarea, im_v2_lib_theme, ui_vue3_components_button, ui_vue3_directives_hint, im_v2_component_elements_button, im_v2_lib_confirm, im_v2_provider_service_aiTask, im_v2_provider_service_message, ui_vue3_components_richLoc, im_v2_lib_copilot, im_v2_lib_helpdesk, ui_uploader_core) {
	'use strict';

	/**
	 * The semantic keys of the header controls. One key per user result, the same key in the wide, the
	 * compact and the AIR composition: ALG-01 tells a control that is gone from a control that has only
	 * been rebuilt by this key, so a variant of the header picks a key from here instead of its own literal.
	 */
	const HeaderControlKey = Object.freeze({
		profile: 'profile',
		avatar: 'avatar',
		title: 'title',
		members: 'members',
		entity: 'entity',
		taskCard: 'taskCard',
		promoClose: 'promoClose',
		call: 'call',
		addToChat: 'addToChat',
		search: 'search',
		sidebar: 'sidebar',
		commentsBack: 'commentsBack',
		commentsSubscribe: 'commentsSubscribe'
	});

	/**
	 * The geometry of the focus ring. An outline follows the border-radius of its own element, so the
	 * shape is set on the control itself - invisibly, since the control paints neither background nor border.
	 * `text` is the shape of a control that is a run of text - a name, a counter - and takes the smallest
	 * radius of the scale together with the promise not to clip its own content; `rounded` is for a control
	 * that is a block. The exception is `avatar`: the picture of a chat is drawn in several shapes, and only
	 * the picture knows which one it took, so that ring is handed down to the picture instead of being named
	 * here.
	 */
	const HeaderActionShape = Object.freeze({
		circle: 'circle',
		rounded: 'rounded',
		text: 'text',
		avatar: 'avatar'
	});

	// @vue/component
	const HeaderAction = {
		name: 'HeaderAction',
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			controlKey: {
				type: String,
				required: true
			},
			label: {
				type: String,
				default: ''
			},
			href: {
				type: String,
				default: ''
			},
			expanded: {
				type: Boolean,
				default: null
			},
			controls: {
				type: String,
				default: ''
			},
			checked: {
				type: Boolean,
				default: null
			},
			shape: {
				type: String,
				default: HeaderActionShape.rounded
			},
			tabStop: {
				type: Boolean,
				default: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			after: {
				type: String,
				default: ''
			},
			truncate: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			// An action has no address, so it is a button; only a real navigation earns a link.
			isLink() {
				return main_core.Type.isStringFilled(this.href);
			},
			isSwitch() {
				return this.checked !== null;
			},
			tag() {
				return this.isLink ? 'a' : 'button';
			},
			// WebKit leaves a native button out of the sequential walk until it carries a tabindex of its own.
			tabIndex() {
				return this.tabStop ? '0' : '-1';
			},
			accessibleName() {
				return main_core.Type.isStringFilled(this.label) ? this.label : null;
			},
			// Without an explicit phrase the visible content is the accessible name, so it stays exposed.
			isContentDecorative() {
				return this.accessibleName !== null;
			},
			/*
			 * The wrapper of the content creates no box of its own, so the geometry of the consumer is
			 * untouched - unless the content is the thing that has to be cut off, and then a box is exactly
			 * what is needed: the clip cannot sit on the control, because a radius on the very element that
			 * clips cuts the painted glyphs along the arcs of its corners.
			 */
			hasContentBox() {
				return this.isContentDecorative || this.truncate;
			},
			contentClasses() {
				return this.truncate ? ['--ellipsis'] : [];
			},
			role() {
				return this.isSwitch ? 'switch' : null;
			},
			ariaChecked() {
				return this.isSwitch ? String(this.checked) : null;
			},
			ariaExpanded() {
				return this.expanded === null ? null : String(this.expanded);
			},
			ariaControls() {
				return main_core.Type.isStringFilled(this.controls) ? this.controls : null;
			},
			controlClasses() {
				return [`--shape-${this.shape}`];
			}
		},
		created() {
			this.registeredElement = null;
		},
		mounted() {
			this.registerControl();
		},
		/**
		 * ALG-01 for the case no removal reports: an update of this very control can take its ability to hold
		 * the focus away - it turns disabled, or leaves the walk - and its registration stays where it is. Only
		 * a control that holds the focus can lose it, so the report costs the rest of them nothing.
		 */
		beforeUpdate() {
			if (this.holdsFocus()) {
				this.getFocusContext()?.beforeHeaderControlChange(this.registeredElement);
			}
		},
		updated() {
			// The tag switches between a link and a button when the address appears or goes: Vue replaces
			// the element in place without remounting, so the registration has to follow the new one.
			if (this.registeredElement !== this.$refs.control) {
				this.unregisterControl();
				this.registerControl();
			}
		},
		beforeUnmount() {
			this.unregisterControl();
		},
		methods: {
			registerControl() {
				const element = this.$refs.control;
				if (!element) {
					return;
				}
				this.registeredElement = element;
				this.getFocusContext()?.registerHeaderControl({
					key: this.controlKey,
					element,
					after: this.after
				});
			},
			holdsFocus() {
				return this.registeredElement !== null && this.registeredElement.contains(document.activeElement);
			},
			unregisterControl() {
				if (this.registeredElement === null) {
					return;
				}
				this.getFocusContext()?.unregisterHeaderControl(this.controlKey, this.registeredElement);
				this.registeredElement = null;
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			}
		},
		template: `
		<component
			:is="tag"
			ref="control"
			class="bx-im-chat-header-action --focus-visible"
			:class="controlClasses"
			:type="isLink ? null : 'button'"
			:href="isLink ? href : null"
			:disabled="isLink ? null : disabled"
			:tabindex="tabIndex"
			:role="role"
			:aria-label="accessibleName"
			:aria-expanded="ariaExpanded"
			:aria-controls="ariaControls"
			:aria-checked="ariaChecked"
		>
			<span
				v-if="hasContentBox"
				class="bx-im-chat-header-action__content"
				:class="contentClasses"
				:aria-hidden="isContentDecorative ? 'true' : null"
			>
				<slot/>
			</span>
			<slot v-else/>
		</component>
	`
	};

	const ICON_SIZE$2 = 24;

	// @vue/component
	const AddToChatButton = {
		name: 'AddToChatButton',
		components: {
			AddToChat: im_v2_component_entitySelector.AddToChat,
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showInviteButton: false,
				showAddToChatPopup: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$2,
			HeaderActionShape: () => HeaderActionShape,
			HeaderControlKey: () => HeaderControlKey
		},
		methods: {
			openAddToChatPopup() {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onChatHeaderClick(this.dialogId);
				this.showAddToChatPopup = true;
			},
			closeAddToChatPopup() {
				this.showAddToChatPopup = false;
			},
			// The popup binds to the native control, and the ref of a component gives its instance.
			getPopupBindElement() {
				return this.$refs['add-members']?.$el ?? {};
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// The surface behind the action is the selector dialog of the entity selector, not a disclosure of
		// this button, so it announces the type it opens and reports no expanded state of its own.
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.addToChat"
			aria-haspopup="dialog"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-add-btn"
			@click="openAddToChatPopup"
			ref="add-members"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
		</HeaderAction>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="getPopupBindElement()"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
	`
	};

	const {
		callInstalled
	} = main_core.Extension.getSettings('im.v2.lib.call');

	/**
	 * The place of the external call widget in the header. The widget is opaque: `im` owns the position and
	 * the semantic key of the call, the widget owns its own contents, accessible name and inner walk. The
	 * position element is the one thing that stays the same in the wide, the compact and the AIR composition,
	 * so ALG-01 reads a change of the button form as a rebuild instead of a removal and leaves the focus
	 * inside the widget alone.
	 */
	// @vue/component
	const CallHeaderButton = {
		name: 'CallHeaderButton',
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			componentToRender() {
				if (!callInstalled) {
					return null;
				}
				return call_widget_callButton.CallButton;
			}
		},
		mounted() {
			this.registerPosition();
		},
		beforeUnmount() {
			this.unregisterPosition();
		},
		methods: {
			registerPosition() {
				const element = this.$refs.position;
				if (!element) {
					return;
				}
				this.getFocusContext()?.registerHeaderControl({
					key: HeaderControlKey.call,
					element
				});
			},
			unregisterPosition() {
				const element = this.$refs.position;
				if (!element) {
					return;
				}
				this.getFocusContext()?.unregisterHeaderControl(HeaderControlKey.call, element);
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			}
		},
		// The position is programmatically focusable (tabindex="-1"): it answers ALG-01 that the call is still
		// there, and serves as the fallback target of the restore. The stop of the walk stays the button of the
		// widget itself, so the position adds none of its own.
		template: `
		<div
			v-if="componentToRender"
			class="bx-im-chat-header__call-position --focus-visible"
			ref="position"
			tabindex="-1"
			data-testid="im-chat-header-call"
		>
			<component :is="componentToRender" :dialog="dialog" :compactMode="compactMode" />
		</div>
	`
	};

	// @vue/component
	const HeaderAvatar = {
		name: 'HeaderAvatar',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			HeaderAction
		},
		inject: {
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['avatarClick'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			HeaderActionShape: () => HeaderActionShape,
			HeaderControlKey: () => HeaderControlKey,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			canChangeAvatar() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.avatar, this.dialogId);
			},
			isSelfChat() {
				return this.$store.getters['chats/isSelfChat'](this.dialogId);
			},
			userLink() {
				return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
			},
			avatarType() {
				return this.isSelfChat ? im_v2_component_elements_avatar.ChatAvatarType.selfChat : '';
			},
			// The very same pair of conditions the file dialog itself is opened under: with no right to
			// change the picture, and in any chat with a person, the avatar carries no action at all.
			isAvatarButton() {
				return !this.isUser && this.canChangeAvatar;
			},
			needProfileLink() {
				return this.isUser && !this.isSelfChat;
			},
			/**
			 * The name beside the avatar opens the same profile, and one result deserves one announcement, so
			 * the picture leaves the walk - the walk, and nothing else. The link keeps its place in the
			 * accessibility tree: a control hidden from assistive technology still takes the focus on a click,
			 * and that leaves the reader standing on a node nothing can announce.
			 * The exception is the support chat, where the title is not a control of its own: there the
			 * picture is the only informational stop left.
			 */
			isProfileTabStop() {
				return this.$store.getters['users/bots/isSupport'](this.dialogId);
			},
			profileLabel() {
				return this.loc('IM_CONTENT_CHAT_HEADER_PROFILE_ARIA', {
					'#NAME#': this.userName
				});
			},
			userName() {
				return this.$store.getters['users/get'](this.dialogId, true).name;
			}
		},
		watch: {
			// The initiator of a system dialog belongs to the chat it was opened from, and nothing of the
			// previous chat is restored in the next one.
			dialogId() {
				this.disarmSystemSelectReturn();
			}
		},
		created() {
			// Not in data(): the pending system dialog is no part of the template.
			this.isSystemSelectArmed = false;
		},
		beforeUnmount() {
			this.disarmSystemSelectReturn();
		},
		methods: {
			openAvatarSelect() {
				this.armSystemSelectReturn();
				this.$refs.avatarInput.click();
			},
			/**
			 * The system dialog is not the page: choosing a file reports back through `change`, cancelling it
			 * reports nothing at all. Both end with the document taking the focus again, so the window
			 * regaining it is what the one-shot return waits for - and `change`, when it comes first, spends
			 * the very same shot. `visibilitychange` answers neither: the page stays visible all along.
			 */
			armSystemSelectReturn() {
				if (this.isSystemSelectArmed) {
					return;
				}
				this.isSystemSelectArmed = true;
				main_core.Event.bind(window, 'focus', this.onSystemSelectReturn);
			},
			disarmSystemSelectReturn() {
				if (!this.isSystemSelectArmed) {
					return;
				}
				this.isSystemSelectArmed = false;
				main_core.Event.unbind(window, 'focus', this.onSystemSelectReturn);
			},
			onSystemSelectReturn() {
				this.disarmSystemSelectReturn();
				this.returnFocusToInitiator();
			},
			returnFocusToInitiator() {
				const initiator = this.$refs.avatarButton?.$el ?? null;
				if (!this.canReturnFocusTo(initiator)) {
					return;
				}
				ui_a11y.FocusNavigator.focusTarget(initiator, {
					preventScroll: true
				});
			},
			/**
			 * All four conditions, and none of them alone: the chat this header shows is still the active one,
			 * the button is still in the document, the right to change the picture is still there, and the
			 * focus is not somebody else's.
			 */
			canReturnFocusTo(initiator) {
				if (initiator === null || !initiator.isConnected || !this.canChangeAvatar) {
					return false;
				}
				const context = this.getFocusContext();
				if (context !== null && context.getActiveDialogId() !== this.dialogId) {
					return false;
				}

				// Back from the system dialog the focus is either lost or still on the control that opened it.
				// Anything else is another surface, and the focus of another surface stays its own.
				return initiator.contains(ui_a11y.FocusNavigator.getActiveElement()) || ui_a11y.FocusNavigator.isFocusLost();
			},
			async onAvatarSelect(input) {
				this.onSystemSelectReturn();
				const file = input.files[0];
				if (!file) {
					return;
				}
				const preparedAvatar = await this.getChatService().prepareAvatar(file);
				if (!preparedAvatar) {
					return;
				}
				void this.getChatService().changeAvatar(this.dialog.chatId, preparedAvatar);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		// The control itself carries the geometry class of the avatar: as a flex item of the header it is
		// blockified, so a native button or link takes exactly the box the plain container used to take.
		// The ring of the stop is the `avatar` shape: the picture is drawn round, square with rounded corners
		// or hexagonal, and the shape it took is known to the picture alone.
		// The file input stays hidden by its own class and is therefore no stop of the walk.
		// language=Vue
		template: `
		<HeaderAction
			v-if="isAvatarButton"
			ref="avatarButton"
			:controlKey="HeaderControlKey.avatar"
			:label="loc('IM_CONTENT_CHAT_HEADER_AVATAR_ARIA')"
			:shape="HeaderActionShape.avatar"
			class="bx-im-chat-header__avatar --can-change"
			data-testid="im-chat-header-avatar"
			@click="openAvatarSelect"
		>
			<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
		</HeaderAction>
		<HeaderAction
			v-else-if="needProfileLink"
			:controlKey="HeaderControlKey.avatar"
			:label="profileLabel"
			:href="userLink"
			:shape="HeaderActionShape.avatar"
			:tabStop="isProfileTabStop"
			target="_blank"
			class="bx-im-chat-header__avatar"
			data-testid="im-chat-header-avatar"
		>
			<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
		</HeaderAction>
		<div v-else class="bx-im-chat-header__avatar" data-testid="im-chat-header-avatar">
			<ChatAvatar
				:avatarDialogId="dialogId"
				:contextDialogId="dialogId"
				:size="AvatarSize.L"
				:customType="avatarType"
			/>
		</div>
		<input
			type="file"
			accept="image/*"
			class="bx-im-chat-header__avatar_input"
			data-testid="im-chat-header-avatar-input"
			ref="avatarInput"
			@change="onAvatarSelect($event.target)"
		>
	`
	};

	const ICON_SIZE$1 = 24;

	// @vue/component
	const SearchButton = {
		name: 'SearchButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction
		},
		inject: {
			currentSidebarPanel: 'currentSidebarPanel',
			sidebarAreaId: {
				default: ''
			}
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$1,
			HeaderActionShape: () => HeaderActionShape,
			HeaderControlKey: () => HeaderControlKey,
			isMessageSearchActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.messageSearch;
			}
		},
		methods: {
			toggleSearchPanel() {
				if (this.isMessageSearchActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.messageSearch
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.messageSearch,
					dialogId: this.dialogId
				});
				im_v2_lib_analytics.Analytics.getInstance().messageSearch.onOpenSearchPanel(this.dialogId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.search"
			:expanded="isMessageSearchActive"
			:controls="sidebarAreaId"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SEARCH')"
			:class="{'--active': isMessageSearchActive}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-search-btn"
			@click="toggleSearchPanel"
		>
			<BIcon :name="Outline.SEARCH" :size="ICON_SIZE" />
		</HeaderAction>
	`
	};

	const ICON_SIZE = 24;
	const KEYBOARD_MODALITY = 'keyboard';
	const TAB_KEY = 'Tab';

	/**
	 * ALG-03. The direct entry into the sidebar is the one branch of the walk the document order cannot make.
	 * `entry` is armed by the keyboard activation that opens the panel and spent by the very next direct `Tab`
	 * off this button; `back` is armed by that jump and spent by the `Shift+Tab` that returns. Everything else
	 * drops both, so outside the branch the reverse walk out of the sidebar stays the natural one.
	 */
	const SidebarBranchIntent = Object.freeze({
		entry: 'sidebarEntry',
		back: 'sidebarEntryBack'
	});

	// @vue/component
	const SidebarButton = {
		name: 'SidebarButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction
		},
		inject: {
			currentSidebarPanel: 'currentSidebarPanel',
			sidebarAreaId: {
				default: ''
			},
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE,
			HeaderActionShape: () => HeaderActionShape,
			HeaderControlKey: () => HeaderControlKey,
			isSidebarOpened() {
				return main_core.Type.isStringFilled(this.currentSidebarPanel);
			}
		},
		watch: {
			// The branch is a promise about one open panel of one chat: the panel closing or the chat changing
			// under the same button leaves nothing to keep it for.
			isSidebarOpened(opened) {
				if (!opened) {
					this.dropEntryBranch();
				}
			},
			dialogId() {
				this.dropEntryBranch();
			}
		},
		created() {
			this.watchedOpener = null;
			this.entryTarget = null;
		},
		beforeUnmount() {
			this.dropEntryBranch();
		},
		methods: {
			toggleRightPanel() {
				this.updateEntryIntent(!this.isSidebarOpened);
				if (this.isSidebarOpened) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: ''
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.main,
					dialogId: this.dialogId
				});
			},
			// Only a keyboard activation that really opens the panel earns the branch: a mouse click, a closing
			// one and a sidebar restored already open leave the walk to the document order.
			updateEntryIntent(isOpening) {
				this.dropEntryBranch();
				const context = this.getFocusContext();
				if (context === null || !isOpening) {
					return;
				}
				if (ui_a11y.FocusMonitor.Instance.getLastInputModality() !== KEYBOARD_MODALITY) {
					return;
				}
				context.armIntent({
					name: SidebarBranchIntent.entry,
					dialogId: this.dialogId,
					openerKey: HeaderControlKey.sidebar
				});
				this.watchedOpener = this.$el;
				main_core.Event.bind(this.watchedOpener, 'focusout', this.onOpenerFocusOut);
			},
			/**
			 * The promise is about the focus standing on this button, so it ends together with that focus. The
			 * branch spends the promise before it moves the focus itself, so its own jump is no such route.
			 */
			onOpenerFocusOut() {
				this.getFocusContext()?.clearIntent(SidebarBranchIntent.entry);
				this.unwatchOpener();
			},
			onOpenerKeydown(event) {
				const context = this.getFocusContext();
				if (event.key !== TAB_KEY || context === null) {
					return;
				}
				const intent = context.getIntent(SidebarBranchIntent.entry);
				const isDirectEntry = !event.shiftKey && intent !== null && intent.dialogId === this.dialogId && intent.openerKey === HeaderControlKey.sidebar;
				if (!isDirectEntry) {
					context.clearIntent(SidebarBranchIntent.entry);
					return;
				}

				// Spent by the step that took it, whether or not the area has a target to take the focus: the
				// promise was about this one `Tab` and no later one.
				context.consumeIntent(SidebarBranchIntent.entry);
				const target = context.getAreaEntryTarget(im_v2_lib_a11y.DetailArea.sidebar);
				if (!this.canTakeFocus(target)) {
					return;
				}
				event.preventDefault();
				ui_a11y.FocusNavigator.focusTarget(target, {
					preventScroll: true
				});
				this.armReturn(context, target);
			},
			armReturn(context, target) {
				context.armIntent({
					name: SidebarBranchIntent.back,
					dialogId: this.dialogId,
					openerKey: HeaderControlKey.sidebar
				});

				// The listener of somebody else's element lives exactly as long as the branch does, so the
				// sidebar keeps its own keyboard model everywhere outside this single step back.
				this.entryTarget = target;
				main_core.Event.bind(target, 'keydown', this.onEntryTargetKeydown);
				main_core.Event.bind(target, 'focusout', this.dropEntryBranch);
			},
			onEntryTargetKeydown(event) {
				const context = this.getFocusContext();
				if (event.key !== TAB_KEY || context === null) {
					return;
				}
				const intent = context.getIntent(SidebarBranchIntent.back);
				const opener = context.getHeaderControlElement(HeaderControlKey.sidebar);
				this.dropEntryBranch();
				const isReturn = event.shiftKey && intent !== null && intent.dialogId === this.dialogId;
				if (!isReturn || !this.canTakeFocus(opener)) {
					return;
				}
				event.preventDefault();
				ui_a11y.FocusNavigator.focusTarget(opener, {
					preventScroll: true
				});
			},
			dropEntryBranch() {
				const context = this.getFocusContext();
				context?.clearIntent(SidebarBranchIntent.entry);
				context?.clearIntent(SidebarBranchIntent.back);
				this.unwatchOpener();
				if (this.entryTarget === null) {
					return;
				}
				main_core.Event.unbind(this.entryTarget, 'keydown', this.onEntryTargetKeydown);
				main_core.Event.unbind(this.entryTarget, 'focusout', this.dropEntryBranch);
				this.entryTarget = null;
			},
			unwatchOpener() {
				if (this.watchedOpener === null) {
					return;
				}
				main_core.Event.unbind(this.watchedOpener, 'focusout', this.onOpenerFocusOut);
				this.watchedOpener = null;
			},
			canTakeFocus(element) {
				if (element === null || !element.isConnected) {
					return false;
				}
				return ui_a11y.InteractivityChecker.isFocusable(element) && !ui_a11y.InteractivityChecker.isDisabled(element);
			},
			getFocusContext() {
				return this.chatDetailFocusContext;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// One control, one wording: the tooltip is the only phrase of this control and therefore its name.
		// A second attribute carrying the same text would turn the tooltip into the description of that name,
		// and the control would announce itself twice.
		template: `
		<HeaderAction
			:controlKey="HeaderControlKey.sidebar"
			:expanded="isSidebarOpened"
			:controls="sidebarAreaId"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
			:class="{'--active': isSidebarOpened}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-sidebar-btn"
			@click="toggleRightPanel"
			@keydown="onOpenerKeydown"
		>
			<BIcon :name="Outline.COLUMNS_SIDEBAR_PENDING" :size="ICON_SIZE" />
		</HeaderAction>
	`
	};

	// @vue/component
	const EntityControl = {
		name: 'EntityControl',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeaderAction
		},
		props: {
			text: {
				type: String,
				required: true
			},
			url: {
				type: String,
				default: ''
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			expanded: {
				type: Boolean,
				default: null
			}
		},
		emits: ['click'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			HeaderActionShape: () => HeaderActionShape,
			// An address leads to the entity itself; without one the control only opens a card of its own.
			controlKey() {
				return main_core.Type.isStringFilled(this.url) ? HeaderControlKey.entity : HeaderControlKey.taskCard;
			}
		},
		template: `
		<HeaderAction
			:controlKey="controlKey"
			:href="url"
			:expanded="expanded"
			:shape="HeaderActionShape.rounded"
			class="bx-im-chat-header-entity-button__container"
			:class="{'--compact': compactMode}"
			@click="$emit('click')"
		>
			<div class="bx-im-chat-header-entity-button__text --ellipsis">{{ text }}</div>
			<BIcon
				class="bx-im-chat-header-entity-button__icon"
				:name="OutlineIcons.CHEVRON_RIGHT_M"
				aria-hidden="true"
			/>
		</HeaderAction>
	`
	};

	const UserCounterPhraseCodeByChatType = {
		[im_v2_const.ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		[im_v2_const.ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		[im_v2_const.ChatType.generalChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		default: 'IM_CONTENT_CHAT_HEADER_USER_COUNT'
	};
	const MembersLabelPhraseCodeByChatType = {
		[im_v2_const.ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
		[im_v2_const.ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
		[im_v2_const.ChatType.generalChannel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
		default: 'IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA'
	};

	// @vue/component
	const UserCounter = {
		name: 'UserCounter',
		components: {
			HeaderAction
		},
		inject: {
			currentSidebarPanel: 'currentSidebarPanel',
			withSidebar: 'withSidebar',
			sidebarAreaId: {
				default: ''
			}
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isMembersPanelActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.members;
			},
			userCounterPhraseCode() {
				return UserCounterPhraseCodeByChatType[this.dialog.type] ?? UserCounterPhraseCodeByChatType.default;
			},
			userCounterText() {
				return main_core.Loc.getMessagePlural(this.userCounterPhraseCode, this.dialog.userCounter, {
					'#COUNT#': this.dialog.userCounter
				});
			},
			// SC 2.5.3: the visible text of the counter opens the name of the button, and the purpose of the
			// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
			membersLabel() {
				const purpose = this.loc(MembersLabelPhraseCodeByChatType[this.dialog.type] ?? MembersLabelPhraseCodeByChatType.default);
				return `${this.visibleCounterText}, ${purpose}`;
			},
			visibleCounterText() {
				return this.isShowGuestCount ? `${this.userCounterText} ${this.guestCounterText}` : this.userCounterText;
			},
			isShowGuestCount() {
				return this.dialog.guestCount > 0 && [im_v2_const.ChatType.chat, im_v2_const.ChatType.calendar].includes(this.dialog.type);
			},
			guestCounterText() {
				return main_core.Loc.getMessagePlural('IM_CONTENT_CHAT_HEADER_GUEST_COUNT', this.dialog.guestCount, {
					'#COUNT#': this.dialog.guestCount
				});
			},
			// Everything that turns the row into a control of the header. Without the sidebar there is no
			// control, so the row takes nothing at all and stays the plain text it draws.
			controlProps() {
				if (!this.withSidebar) {
					return {};
				}
				return {
					controlKey: HeaderControlKey.members,
					label: this.membersLabel,
					expanded: this.isMembersPanelActive,
					controls: this.sidebarAreaId,
					shape: HeaderActionShape.text,
					truncate: true,
					title: this.loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS'),
					class: '--click',
					onClick: this.onMembersClick
				};
			}
		},
		methods: {
			onMembersClick() {
				if (this.isMembersPanelActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.members
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
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
		// The members panel is the only thing the counter opens: without the sidebar it stays plain text and
		// creates no Tab stop. Only the root of the row knows about that difference - the text it shows is
		// the same one either way, and the guest count belongs to that text instead of being a stop of its own.
		template: `
		<component
			:is="withSidebar ? 'HeaderAction' : 'div'"
			v-bind="controlProps"
			class="bx-im-chat-header__subtitle_content"
			data-testid="im-chat-header-user-counter"
		>
			{{ userCounterText }}
			<span v-if="isShowGuestCount" class="bx-im-chat-header__guest-counter" data-testid="im-chat-header-guest-counter">
				{{ guestCounterText }}
			</span>
		</component>
	`
	};

	// @vue/component
	const GroupChatTitle = {
		name: 'GroupChatTitle',
		components: {
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle,
			EntityControl,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			UserCounter
		},
		inject: ['withSidebar'],
		props: {
			dialogId: {
				type: String,
				required: true
			},
			withEntityLink: {
				type: Boolean,
				default: true
			}
		},
		emits: ['newTitle'],
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			showEntityLink() {
				return this.withEntityLink && im_v2_component_elements_entityLink.hasEntityLink(this.dialog);
			},
			entityText() {
				return im_v2_component_elements_entityLink.PhraseByLinkType[this.dialog.entityLink?.type] ?? im_v2_component_elements_entityLink.PhraseByLinkType.default;
			},
			entityUrl() {
				return this.dialog.entityLink?.url ?? '';
			}
		},
		template: `
		<div class="bx-im-chat-header__info">
			<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
			<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
			<FadeAnimation :duration="100">
				<div v-if="dialog.inited" class="bx-im-chat-header__subtitle_container">
					<UserCounter :dialogId="dialogId" />
					<slot name="after-user-counter">
						<EntityControl
							v-if="showEntityLink"
							:text="entityText"
							:url="entityUrl"
							data-testid="im-chat-header-entity-btn"
						/>
					</slot>
				</div>
			</FadeAnimation>
		</div>
	`
	};

	const ONE_MINUTE = 60 * 1000;

	// @vue/component
	const UserTitle = {
		name: 'UserTitle',
		components: {
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			HeaderAction
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				userLastOnlineText: ''
			};
		},
		computed: {
			HeaderActionShape: () => HeaderActionShape,
			HeaderControlKey: () => HeaderControlKey,
			userPosition() {
				return this.$store.getters['users/getPosition'](this.dialogId);
			},
			userLastOnline() {
				return this.$store.getters['users/getLastOnline'](this.dialogId);
			},
			userLink() {
				return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
			},
			userName() {
				return this.$store.getters['users/get'](this.dialogId, true).name;
			},
			isSelfChat() {
				return this.$store.getters['chats/isSelfChat'](this.dialogId);
			},
			/**
			 * The stop is worth offering only while the profile behind the name belongs to somebody else. In the
			 * chat with oneself it is the profile of the reader, and the keyboard is handed nothing it does not
			 * already have - so the name gives the stop up and keeps the mouse action, exactly as the picture of
			 * a personal chat does. The walk is all that either of them gives up: a control taken out of the
			 * accessibility tree instead would still take the focus on a click, and leave the reader on a node
			 * nothing can announce.
			 */
			isAnotherUserProfile() {
				return !this.isSelfChat;
			},
			// The name reads as a name, so the link says where it leads and keeps the name it is made of.
			profileLabel() {
				return this.loc('IM_CONTENT_CHAT_HEADER_PROFILE_ARIA', {
					'#NAME#': this.userName
				});
			}
		},
		watch: {
			userLastOnline(value) {
				this.userLastOnlineText = value;
			}
		},
		created() {
			this.updateUserOnline();
			this.userLastOnlineInterval = setInterval(this.updateUserOnline, ONE_MINUTE);
		},
		beforeUnmount() {
			clearInterval(this.userLastOnlineInterval);
		},
		methods: {
			updateUserOnline() {
				this.userLastOnlineText = this.$store.getters['users/getLastOnline'](this.dialogId);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-chat-header__info">
			<div class="bx-im-chat-header__title --user">
				<HeaderAction
					:controlKey="HeaderControlKey.profile"
					:label="profileLabel"
					:href="userLink"
					:shape="HeaderActionShape.text"
					:tabStop="isAnotherUserProfile"
					target="_blank"
					class="bx-im-chat-header__title_container"
					data-testid="im-chat-header-profile-link"
				>
					<ChatTitle :dialogId="dialogId" :withAutoDelete="true" :withMute="true" />
				</HeaderAction>
				<span class="bx-im-chat-header__user-status">{{ userLastOnlineText }}</span>
			</div>
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ userPosition }}</div>
			</div>
		</div>
	`
	};

	const HEADER_WIDTH_BREAKPOINT = 700;

	// @vue/component
	const ChatHeader = {
		name: 'ChatHeader',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			CallHeaderButton,
			GroupChatTitle,
			UserChatTitle: UserTitle,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			HeaderAvatar,
			AddToChatButton,
			SearchButton,
			SidebarButton
		},
		inject: {
			withSidebar: 'withSidebar',
			chatDetailFocusContext: {
				from: im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT,
				default: null
			}
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withCallButton: {
				type: Boolean,
				default: true
			},
			withSearchButton: {
				type: Boolean,
				default: true
			},
			withAddToChatButton: {
				type: Boolean,
				default: true
			},
			withEntityLink: {
				type: Boolean,
				default: true
			}
		},
		emits: ['buttonPanelReady', 'compactModeChange'],
		data() {
			return {
				compactMode: false
			};
		},
		computed: {
			user() {
				return this.$store.getters['users/get'](this.dialogId, true);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isInited() {
				return this.dialog.inited;
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			isBot() {
				if (!this.isUser) {
					return false;
				}
				return this.user.type === im_v2_const.UserType.bot;
			},
			isCurrentUserGuest() {
				return this.$store.getters['users/isGuest'](im_v2_application_core.Core.getUserId());
			},
			showCallButton() {
				if (this.isBot || !this.withCallButton) {
					return false;
				}
				if (this.isCurrentUserGuest || this.dialog.role === im_v2_const.UserRole.guest) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.call, this.dialogId);
			},
			showAddToChatButton() {
				if (this.isBot || !this.withAddToChatButton) {
					return false;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				const hasCreateChatAccess = permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
				if (this.isUser && !hasCreateChatAccess) {
					return false;
				}
				return permissionManager.canManageUsersAdd(this.dialogId);
			},
			showSearchButton() {
				return this.withSearchButton;
			},
			showSidebarButton() {
				if (!this.withSidebar) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.openSidebar, this.dialogId);
			},
			chatTitleComponent() {
				return this.isUser ? UserTitle : GroupChatTitle;
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			showAirSkeleton() {
				return !this.isInited && this.isAirDesignEnabled;
			},
			containerClasses() {
				return {
					'--compact': this.compactMode,
					'--air': this.isAirDesignEnabled
				};
			}
		},
		watch: {
			dialogId() {
				this.claimDetail();
				this.rebaseRegistrations();
			}
		},
		created() {
			// Not in data(): neither the displaced chat nor the chat this header claimed reaches the template.
			this.displacedDialogId = '';
			this.claimedDialogId = '';

			// The registry of a control is chosen by the header root that draws it, and the root of this
			// header is registered only on mount - so its controls, which register before that, are taken by
			// the chat this header claims here. A claim from `mounted()` would give them away to another chat.
			this.claimDetail();
			if (this.isInited) {
				this.emitButtonPanelReady();
			}
		},
		mounted() {
			this.initResizeObserver();
			this.getFocusContext()?.registerHeaderRoot(this.$refs.container);
		},
		beforeUnmount() {
			this.getResizeObserver().disconnect();
			this.releaseDetail();
			this.getFocusContext()?.unregisterHeaderRoot(this.$refs.container);
		},
		methods: {
			getFocusContext() {
				return this.chatDetailFocusContext;
			},
			/**
			 * ALG-01 compares the dialog of the header with the active one, so every header claims the detail
			 * for the chat it shows. One claim at a time is what the context holds, and a header drawn over a
			 * live one - the comments layer over its chat - takes it while it is there.
			 *
			 * A header reused for another chat claims a second time, and the detail it takes then is its own
			 * from the claim before: that chat has no header left - this very one took its controls along - so
			 * it is nobody to give the detail back to. Only a claim taken from another header displaces a chat,
			 * and the chat displaced by the first such claim is the one still drawn underneath.
			 */
			claimDetail() {
				const context = this.getFocusContext();
				if (context === null) {
					return;
				}
				const activeDialogId = context.getActiveDialogId();
				const displacesAnotherHeader = activeDialogId !== this.claimedDialogId;
				this.claimedDialogId = this.dialogId;
				if (activeDialogId === this.dialogId) {
					return;
				}
				if (displacesAnotherHeader) {
					this.displacedDialogId = activeDialogId;
				}
				context.setActiveDialogId(this.dialogId);
			},
			/**
			 * The layer gives the claim back when it goes: the header underneath is still on screen, and
			 * without the claim its own ALG-01 would stay silent for the rest of the session. Only a header
			 * that still holds the claim hands it over, so the one unmounted after the next has already
			 * claimed the detail - the order of the two is not guaranteed - takes nothing away from it.
			 */
			releaseDetail() {
				const context = this.getFocusContext();
				const isStillOurs = context !== null && context.getActiveDialogId() === this.dialogId && main_core.Type.isStringFilled(this.displacedDialogId);
				if (isStillOurs) {
					context.setActiveDialogId(this.displacedDialogId);
				}
			},
			/**
			 * A header reused for another chat brings the registry of its root along: registering the same root
			 * again moves it, together with every control it draws, to the chat just claimed - and leaves the
			 * chat it has left with no record of controls that are no longer its own.
			 */
			rebaseRegistrations() {
				const container = this.$refs.container;
				if (!container) {
					return;
				}
				this.getFocusContext()?.registerHeaderRoot(container);
			},
			initResizeObserver() {
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.onContainerResize(entry.contentRect.width);
				});
				this.resizeObserver.observe(this.$refs.container);
			},
			onContainerResize(newContainerWidth) {
				const newCompactMode = newContainerWidth <= HEADER_WIDTH_BREAKPOINT;
				if (newCompactMode !== this.compactMode) {
					this.$emit('compactModeChange', newCompactMode);
					this.compactMode = newCompactMode;
				}
			},
			onNewTitleSubmit(newTitle) {
				void this.getChatService().renameChat(this.dialogId, newTitle);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getResizeObserver() {
				return this.resizeObserver;
			},
			emitButtonPanelReady() {
				this.$emit('buttonPanelReady');
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			class="bx-im-chat-header__scope bx-im-chat-header__container"
			:class="containerClasses"
			ref="container"
			tabindex="-1"
			data-testid="im-chat-header"
		>
			<div v-if="showAirSkeleton" class="bx-im-chat-header__skeleton-left">
				<div class="bx-im-chat-header__skeleton-avatar"></div>
				<div class="bx-im-chat-header__skeleton-info">
					<div class="bx-im-chat-header__skeleton-bar --title"></div>
					<div class="bx-im-chat-header__skeleton-bar --subtitle"></div>
				</div>
			</div>
			<div v-else class="bx-im-chat-header__left">
				<slot name="left">
					<HeaderAvatar :dialogId="dialogId" />
					<slot name="title" :onNewTitleHandler="onNewTitleSubmit">
						<component
							:is="chatTitleComponent"
							:dialogId="dialogId"
							:withEntityLink="withEntityLink"
							@newTitle="onNewTitleSubmit"
						/>
					</slot>
				</slot>
			</div>
			<div v-if="showAirSkeleton" class="bx-im-chat-header__skeleton-bar --action"></div>
			<LineLoader v-else-if="!isInited" :width="45" :height="22" />
			<FadeAnimation @afterEnter="emitButtonPanelReady" :duration="100">
				<div v-if="isInited" class="bx-im-chat-header__right">
					<slot name="before-actions"></slot>
					<CallHeaderButton v-if="showCallButton" :dialogId="dialogId" :compactMode="compactMode" />
					<div class="bx-im-chat-header__actions">
						<slot v-if="showAddToChatButton" name="add-to-chat-button">
							<AddToChatButton :dialogId="dialogId" />
						</slot>
						<SearchButton v-if="showSearchButton" :dialogId="dialogId" />
						<SidebarButton v-if="showSidebarButton" :dialogId="dialogId" />
					</div>
				</div>
			</FadeAnimation>
		</div>
	`
	};

	// @vue/component
	const BulkActionsPanel = {
		name: 'BulkActionsPanel',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			UiButton: ui_vue3_components_button.Button,
			ForwardPopup: im_v2_component_entitySelector.ForwardPopup
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showForwardPopup: false,
				messagesIds: [],
				isAiTaskStarting: false
			};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonIcon: () => im_v2_component_elements_button.ButtonIcon,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
			UiButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			selectedMessages() {
				return this.$store.getters['messages/select/getCollection'](this.dialogId);
			},
			messagesAuthorId() {
				return [...this.selectedMessages].map(messageId => {
					return this.$store.getters['messages/getById'](messageId).authorId;
				});
			},
			hasOthersMessages() {
				const userId = im_v2_application_core.Core.getUserId();
				return this.messagesAuthorId.some(authorId => authorId !== userId);
			},
			hasOwnMessages() {
				return this.messagesAuthorId.includes(im_v2_application_core.Core.getUserId());
			},
			canDeleteMessage() {
				if (this.selectedMessagesSize === 0) {
					return false;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				const canDeleteOwn = !this.hasOwnMessages || permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOwnMessage, this.dialogId);
				const canDeleteOthers = !this.hasOthersMessages || permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOthersMessage, this.dialogId);
				return canDeleteOwn && canDeleteOthers;
			},
			selectedMessagesSize() {
				return this.selectedMessages.size;
			},
			formattedMessagesCounter() {
				if (!this.selectedMessagesSize) {
					return '';
				}
				return `(${this.selectedMessagesSize})`;
			},
			isBlockedDeletion() {
				return this.selectedMessagesSize > 0 && !this.canDeleteMessage;
			},
			isCopilotChat() {
				return this.dialog.type === im_v2_const.ChatType.copilot;
			},
			// The shared multi-action limit, fed by MessageService::getMultipleActionMessageLimit();
			// Task::createByAiAction() refuses an oversized selection by that same method, so the caption
			// and the server cannot disagree. The fallback repeats the constant and has to move with it.
			bulkActionMessageLimit() {
				const settings = main_core.Extension.getSettings('im.v2.component.message-list');
				return settings.get('multipleActionMessageLimit', 20);
			},
			canCreateAiTask() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAiTaskFromMessageAvailable);
			},
			isAiTaskDisabled() {
				return !this.selectedMessagesSize || this.selectedMessagesSize > this.bulkActionMessageLimit;
			},
			isAiTaskOverLimit() {
				return this.selectedMessagesSize > this.bulkActionMessageLimit;
			},
			aiTaskButtonLabel() {
				if (this.isAiTaskOverLimit) {
					return this.loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_LIMIT', {
						'#LIMIT#': this.bulkActionMessageLimit
					});
				}
				return this.loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_MSGVER_1');
			},
			messageCounterText() {
				if (!this.selectedMessagesSize) {
					return this.loc('IM_CONTENT_BULK_ACTIONS_SELECT_MESSAGES');
				}
				return this.loc('IM_CONTENT_BULK_ACTIONS_COUNT_MESSAGES');
			},
			confirmTitle() {
				return this.loc('IM_CONTENT_BULK_ACTIONS_CONFIRM_TITLE', {
					'#COUNT#': this.selectedMessagesSize
				});
			},
			tooltipSettings() {
				return {
					text: this.loc('IM_CONTENT_BULK_ACTIONS_DELETE_NOT_CAN_DELETE'),
					popupOptions: {
						angle: true,
						targetContainer: document.body,
						offsetTop: -13,
						offsetLeft: 65,
						bindOptions: {
							position: 'top'
						}
					}
				};
			}
		},
		methods: {
			onForwardButtonClick() {
				im_v2_lib_analytics.Analytics.getInstance().messageForward.onClickForward(this.dialogId);
				this.messagesIds = [...this.selectedMessages];
				this.showForwardPopup = true;
			},
			closeForwardPopup() {
				this.messagesIds = [];
				this.showForwardPopup = false;
			},
			async onCreateAiTaskButtonClick() {
				// Waiting does not lock the button for good: a selection emptied and refilled meanwhile
				// re-applies `disabled` over the waiting state and lets a tap through before the answer.
				if (this.isAiTaskStarting) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().bulkActionsPanel.onCreateAiTask(this.dialogId);
				const messageIds = [...this.selectedMessages];
				const chatId = this.dialog.chatId;
				// Anchor = newest (max id) selected message. Must match the backend, which reports every
				// pull status of a multiselect against this same anchor — see
				// Bitrix\Im\V2\Integration\AI\TaskCreation\MultipleMessagesCreator::resolveAnchorMessageId()
				// ((int)max($messageIds)). Non-numeric ids (e.g. unsent temp-id messages) are filtered out,
				// otherwise Math.max would yield NaN and the panel would never correlate a pull status.
				const numericMessageIds = messageIds.filter(id => this.$store.getters['messages/isRealMessage'](id));
				if (numericMessageIds.length === 0) {
					// With no numeric anchor Math.max() returns -Infinity, which slips through the NaN-guards
					// downstream and spawns a dead operation that never correlates a pull status.
					this.closeBulkActionsMode();
					return;
				}
				const anchorMessageId = Math.max(...numericMessageIds);
				this.isAiTaskStarting = true;
				try {
					const started = await new im_v2_provider_service_aiTask.AiTaskService().createForMessages(numericMessageIds, {
						chatId,
						anchorMessageId
					});
					// Closing the mode drops the selection, and a selection holds up to twenty messages a user
					// picked one by one. A refused start leaves nothing behind to make that worth it: the reason
					// is shown, and the very same selection is what the user needs to try again with.
					if (started) {
						this.closeBulkActionsMode();
					}
				} finally {
					this.isAiTaskStarting = false;
				}
			},
			async onDeleteButtonClick() {
				const confirmResult = await im_v2_lib_confirm.showDeleteMessagesConfirm(this.confirmTitle);
				if (!confirmResult) {
					return false;
				}
				this.getMessageService().deleteMessages([...this.selectedMessages]);
				this.closeBulkActionsMode();
				return true;
			},
			closeBulkActionsMode() {
				this.getEmitter().emit(im_v2_const.EventType.dialog.closeBulkActionsMode, {
					dialogId: this.dialogId
				});
			},
			getMessageService() {
				if (!this.messageService) {
					this.messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.dialog.chatId
					});
				}
				return this.messageService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-bulk-actions-panel">
			<div class="bx-im-content-bulk-actions-panel__container">
				<div class="bx-im-content-bulk-actions-panel__left-section">
					<div @click="closeBulkActionsMode" class="bx-im-content-bulk-actions-panel__cancel"></div>
					<div class="bx-im-content-bulk-actions-panel__counter-container">
						<span class="bx-im-content-bulk-actions-panel__counter-name">{{ messageCounterText }}</span>
						<span class="bx-im-content-bulk-actions-panel__counter-number">{{ formattedMessagesCounter }}</span>
					</div>
				</div>
				<div class="bx-im-content-bulk-actions-panel__right-section">
					<div v-if="!isCopilotChat" class="bx-im-content-bulk-actions-panel__delete-button">
						<div
							v-if="isBlockedDeletion"
							v-hint="tooltipSettings"
							class="bx-im-content-bulk-actions-panel__tooltip"
						>
						</div>
						<ChatButton
							:size="ButtonSize.L"
							:icon="ButtonIcon.Delete"
							:color="ButtonColor.Delete"
							:isDisabled="!selectedMessagesSize || isBlockedDeletion"
							:isRounded="true"
							:isUppercase="false"
							:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_DELETE')"
							@click="onDeleteButtonClick"
						/>
					</div>
					<UiButton
						v-if="canCreateAiTask"
						:size="UiButtonSize.MEDIUM"
						:style="AirButtonStyle.TINTED_BITRIX_GPT"
						:disabled="isAiTaskDisabled"
						:loading="isAiTaskStarting"
						:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_AI_TASK_MSGVER_1')"
						:aria-label="aiTaskButtonLabel"
						:aria-disabled="isAiTaskDisabled ? 'true' : 'false'"
						:title="isAiTaskOverLimit ? aiTaskButtonLabel : null"
						data-testid="bulk-actions-panel-ai-task-btn"
						@click="onCreateAiTaskButtonClick"
					/>
					<ChatButton
						:size="ButtonSize.L"
						:icon="ButtonIcon.Forward"
						:color="ButtonColor.Forward"
						:isRounded="true"
						:isUppercase="false"
						:isDisabled="!selectedMessagesSize"
						:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_FORWARD')"
						@click="onForwardButtonClick"
					/>
				</div>
				<ForwardPopup
					v-if="showForwardPopup"
					:messagesIds="messagesIds"
					:dialogId="dialogId"
					@close="closeForwardPopup"
				/>
			</div>
		</div>
	`
	};

	const ARTICLE_CODE = '20412666';

	// @vue/component
	const ChatContentDisclaimer = {
		name: 'ChatContentDisclaimer',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			forceVisible: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			warningText() {
				return main_core.Loc.getMessage('IM_CONTENT_COPILOT_DISCLAIMER_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			},
			shouldShow() {
				const isCopilotReady = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive);
				if (!isCopilotReady) {
					return false;
				}
				return this.forceVisible || this.$store.getters['copilot/chats/hasAiGeneratedContent'](this.dialogId);
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			onLinkClick() {
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			}
		},
		template: `
		<div v-if="shouldShow" class="bx-im-chat-content-disclaimer__container">
			<RichLoc
				:text="warningText"
				placeholder="[link]"
				tag="span"
				class="bx-im-chat-content-disclaimer__text --ellipsis"
			>
				<template #link="{ text }">
					<span class="bx-im-chat-content-disclaimer__link" @click="onLinkClick">
						{{ text }}
					</span>
				</template>
			</RichLoc>
		</div>
	`
	};

	const Height = {
		chatHeader: 64,
		pinnedMessages: 53,
		dropAreaOffset: 16};

	// @vue/component
	const DropArea = {
		props: {
			dialogId: {
				type: String,
				required: true
			},
			container: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				showDropArea: false,
				lastDropAreaEnterTarget: null
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			hasPinnedMessages() {
				return this.$store.getters['messages/pin/getPinned'](this.dialog.chatId).length > 0;
			},
			dropAreaStyles() {
				let offset = Height.dropAreaOffset + Height.chatHeader;
				if (this.hasPinnedMessages) {
					offset += Height.pinnedMessages;
				}
				return {
					top: `${offset}px`
				};
			}
		},
		watch: {
			container: {
				immediate: true,
				handler(container) {
					this.unbindEvents();
					if (main_core.Type.isElementNode(container)) {
						this.bindEvents(container);
					}
				}
			}
		},
		beforeUnmount() {
			this.unbindEvents();
		},
		methods: {
			bindEvents(container) {
				main_core.Event.bind(container, 'dragenter', this.onDragEnter);
				main_core.Event.bind(container, 'dragleave', this.onDragLeave);
				main_core.Event.bind(container, 'dragover', this.onDragOver);
				main_core.Event.bind(container, 'drop', this.onDrop);
				// the prop may point elsewhere by unbind time, so remember the node that actually got the listeners
				this.boundContainer = container;
			},
			unbindEvents() {
				if (!this.boundContainer) {
					return;
				}
				main_core.Event.unbind(this.boundContainer, 'dragenter', this.onDragEnter);
				main_core.Event.unbind(this.boundContainer, 'dragleave', this.onDragLeave);
				main_core.Event.unbind(this.boundContainer, 'dragover', this.onDragOver);
				main_core.Event.unbind(this.boundContainer, 'drop', this.onDrop);
				this.boundContainer = null;
			},
			async onDragEnter(event) {
				event.stopPropagation();
				event.preventDefault();
				const success = await ui_uploader_core.hasDataTransferOnlyFiles(event.dataTransfer, false);
				if (!success) {
					return;
				}
				this.lastDropAreaEnterTarget = event.target;
				this.showDropArea = true;
			},
			onDragLeave(event) {
				event.stopPropagation();
				event.preventDefault();
				if (this.lastDropAreaEnterTarget !== event.target) {
					return;
				}
				this.showDropArea = false;
			},
			onDragOver(event) {
				event.preventDefault();
			},
			async onDrop(event) {
				event.preventDefault();
				const files = await ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer);
				if (main_core.Type.isArrayFilled(files)) {
					// the textarea owns the preview session: it validates the files and opens the popup
					this.getEmitter().emit(im_v2_const.EventType.textarea.openUploadPreview, {
						dialogId: this.dialogId,
						files
					});
				}
				this.showDropArea = false;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<Transition name="drop-area-fade">
			<div
				v-if="showDropArea"
				:style="dropAreaStyles"
				class="bx-im-content-chat-drop-area__container bx-im-content-chat-drop-area__scope"
				data-testid="im-content-chat-drop-area"
			>
				<div class="bx-im-content-chat-drop-area__box">
					<span class="bx-im-content-chat-drop-area__icon"></span>
					<label class="bx-im-content-chat-drop-area__label-text">
						{{ loc('IM_CONTENT_DROP_AREA') }}
					</label>
				</div>
			</div>
		</Transition>
	`
	};

	// @vue/component
	const JoinPanel = {
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor
		},
		methods: {
			onButtonClick() {
				this.getChatService().joinChat(this.dialogId);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Primary"
				:text="loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHAT')"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	// @vue/component
	const LoadingBar = {
		name: 'LoadingBar',
		data() {
			return {};
		},
		template: `
		<div class="bx-im-content-chat__loading-bar"></div>
	`
	};

	const BUTTON_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.1)';
	const BUTTON_HOVER_COLOR = 'rgba(0, 0, 0, 0.2)';
	const BUTTON_TEXT_COLOR = '#fff';

	// @vue/component
	const MutePanel = {
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			buttonText() {
				const mutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_ENABLE_NOTIFICATIONS');
				const unmutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_DISABLE_NOTIFICATIONS');
				return this.dialog.isMuted ? mutedCode : unmutedCode;
			},
			buttonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: BUTTON_BACKGROUND_COLOR,
					iconColor: BUTTON_TEXT_COLOR,
					textColor: BUTTON_TEXT_COLOR,
					hoverColor: BUTTON_HOVER_COLOR
				};
			}
		},
		methods: {
			onButtonClick() {
				if (this.dialog.isMuted) {
					this.getChatService().unmuteChat(this.dialogId);
					return;
				}
				this.getChatService().muteChat(this.dialogId);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:customColorScheme="buttonColorScheme"
				:text="buttonText"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	/**
	 * The bounds of the detail areas this composition owns: the context learns where an area starts and ends
	 * and nothing about the stops inside it, which belong to the owner of the area.
	 */
	const DetailAreaRef = Object.freeze({
		[im_v2_lib_a11y.DetailArea.header]: 'headerArea',
		[im_v2_lib_a11y.DetailArea.preFeed]: 'preFeedArea',
		[im_v2_lib_a11y.DetailArea.feed]: 'feedArea',
		[im_v2_lib_a11y.DetailArea.composerOrReplacement]: 'composerArea',
		[im_v2_lib_a11y.DetailArea.postComposer]: 'postComposerArea',
		[im_v2_lib_a11y.DetailArea.sidebar]: 'sidebarArea'
	});

	/**
	 * The stable name of the sidebar area a header control points at with `aria-controls`. Several details can
	 * live on one page - an embedded chat beside the messenger, the comments layer over the base one - so the
	 * name carries the number of the composition that owns the element and stays the same while it is mounted.
	 */
	const SIDEBAR_AREA_ID_PREFIX = 'bx-im-chat-detail-sidebar';
	let sidebarAreaSequence = 0;

	// @vue/component
	const BaseChatContent = {
		name: 'BaseChatContent',
		components: {
			ChatHeader,
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			ChatTextarea: im_v2_component_textarea.ChatTextarea,
			ChatSidebar: im_v2_component_sidebar.ChatSidebar,
			ChatContentDisclaimer,
			DropArea,
			MutePanel,
			JoinPanel,
			BulkActionsPanel,
			LoadingBar
		},
		provide() {
			return {
				currentSidebarPanel: ui_vue3.computed(() => this.currentSidebarPanel),
				withSidebar: ui_vue3.computed(() => this.withSidebar),
				// A control names the area it opens only while that area is really rendered: an `aria-controls`
				// pointing at nothing is worse than no attribute at all.
				sidebarAreaId: ui_vue3.computed(() => this.showSidebar ? this.sidebarAreaElementId : ''),
				[im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT]: this.focusContext
			};
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withSidebar: {
				type: Boolean,
				default: true
			},
			withHeader: {
				type: Boolean,
				default: true
			},
			withDropArea: {
				type: Boolean,
				default: true
			},
			backgroundId: {
				type: String,
				default: null
			}
		},
		setup() {
			sidebarAreaSequence += 1;
			const sidebarAreaElementId = `${SIDEBAR_AREA_ID_PREFIX}-${sidebarAreaSequence}`;
			const inheritedFocusContext = ui_vue3.inject(im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT, null);
			if (inheritedFocusContext !== null) {
				return {
					focusContext: inheritedFocusContext,
					sidebarAreaElementId
				};
			}

			// Embedded content mounted on its own has no messenger root above it, so it owns a fallback
			// coordinator of its detail areas and takes it down together with itself.
			const focusContext = new im_v2_lib_a11y.ChatDetailFocusContext();
			ui_vue3.onBeforeUnmount(() => focusContext.destroy());
			return {
				focusContext,
				sidebarAreaElementId
			};
		},
		data() {
			return {
				showLoadingBar: false,
				currentSidebarPanel: '',
				dropAreaContainer: null
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			canSend() {
				if (!this.dialog.isTextareaEnabled) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.dialog.dialogId);
			},
			isGuest() {
				return this.dialog.role === im_v2_const.UserRole.guest;
			},
			isBulkActionsMode() {
				return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
			},
			hasCommentsOnTop() {
				return this.$store.getters['messages/comments/areOpenedForChannel'](this.dialogId);
			},
			showSidebar() {
				return main_core.Type.isStringFilled(this.dialogId) && this.withSidebar;
			},
			canRenderDropArea() {
				return this.withDropArea && Boolean(this.dropAreaContainer);
			},
			containerClasses() {
				const alignment = this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
				return [`--${alignment}-align`];
			},
			backgroundStyle() {
				if (this.backgroundId) {
					return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(this.backgroundId);
				}
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle(this.dialogId);
			}
		},
		created() {
			this.registeredAreas = new Map();
			this.bindEvents();
		},
		mounted() {
			this.syncDetailAreas();
			// $refs are not reactive: the drop area gets the node through state, not straight from the template
			this.dropAreaContainer = this.$refs.content;
		},
		updated() {
			this.syncDetailAreas();
		},
		beforeUnmount() {
			this.releaseDetailAreas();
			this.unbindEvents();
		},
		methods: {
			getContainer() {
				return this.$refs.content;
			},
			/**
			 * While the comments layer covers this content, the layer on top describes the detail: several
			 * compositions share one context, and only the one the user is looking at owns the area bounds.
			 */
			syncDetailAreas() {
				const isCovered = this.hasCommentsOnTop;
				Object.keys(DetailAreaRef).forEach(area => {
					const element = isCovered ? null : this.resolveAreaElement(DetailAreaRef[area]);
					const registered = this.registeredAreas.get(area) ?? null;
					if (registered === element) {
						return;
					}
					if (registered !== null) {
						this.focusContext.unregisterArea(area, registered);
						this.registeredAreas.delete(area);
					}
					if (element !== null) {
						this.focusContext.registerArea(area, element);
						this.registeredAreas.set(area, element);
					}
				});
			},
			releaseDetailAreas() {
				this.registeredAreas.forEach((element, area) => {
					this.focusContext.unregisterArea(area, element);
				});
				this.registeredAreas.clear();
			},
			// An area drawn by a component hands over its root element, an area of this template - itself.
			resolveAreaElement(refName) {
				const target = this.$refs[refName];
				const element = main_core.Type.isElementNode(target) ? target : target?.$el;
				return main_core.Type.isElementNode(element) ? element : null;
			},
			onShowLoadingBar(event) {
				const {
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return;
				}
				this.showLoadingBar = true;
			},
			onHideLoadingBar(event) {
				const {
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return;
				}
				this.showLoadingBar = false;
			},
			onChangeSidebarPanel({
				panel
			}) {
				this.currentSidebarPanel = panel;
			},
			bindEvents() {
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
			},
			unbindEvents() {
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-content-chat__scope bx-im-content-chat__container"
			:class="containerClasses"
			:style="backgroundStyle"
			data-testid="im-content-chat-container"
		>
			<div class="bx-im-content-chat__content" ref="content" data-testid="im-content-chat-content">
				<div v-if="withHeader" ref="headerArea">
					<slot name="header">
						<ChatHeader :dialogId="dialogId" :key="dialogId" />
					</slot>
				</div>
				<div class="bx-im-content-chat__pre-feed_container" ref="preFeedArea">
					<slot name="sub-header"></slot>
				</div>
				<div class="bx-im-content-chat__dialog_container" ref="feedArea">
					<Transition name="loading-bar-transition">
						<LoadingBar v-if="showLoadingBar" />
					</Transition>
					<div class="bx-im-content-chat__dialog_content">
						<slot name="dialog">
							<ChatDialog :dialogId="dialogId" :key="dialogId"/>
						</slot>
					</div>
				</div>
				<!-- Textarea -->
				<div class="bx-im-content-chat__composer_container" ref="composerArea">
					<Transition name="bx-im-panel-transition" @afterLeave="syncDetailAreas">
						<BulkActionsPanel v-if="isBulkActionsMode" :dialogId="dialogId"/>
						<div v-else-if="canSend" class="bx-im-content-chat__textarea_container">
							<!-- default field serves the in-scope surfaces only: everyone else either replaces it
								through the slot or never gets here, having no right to send -->
							<slot name="textarea">
								<ChatTextarea
									:dialogId="dialogId"
									:withKeyboardNavigation="true"
									:key="dialogId"
								/>
							</slot>
							<div class="bx-im-content-chat__after-textarea_container" ref="postComposerArea">
								<slot name="after-textarea">
									<ChatContentDisclaimer :dialogId="dialogId"/>
								</slot>
							</div>
						</div>
						<slot v-else name="blocked-panel">
							<slot v-if="isGuest" name="join-panel">
								<JoinPanel :dialogId="dialogId" />
							</slot>
							<MutePanel v-else :dialogId="dialogId" />
						</slot>
					</Transition>
				</div>
				<DropArea
					v-if="canRenderDropArea"
					:key="dialogId"
					:dialogId="dialogId"
					:container="dropAreaContainer"
				/>
				<!-- End textarea -->
			</div>
			<ChatSidebar
				v-if="showSidebar"
				ref="sidebarArea"
				:id="sidebarAreaElementId"
				:originDialogId="dialogId"
				:isActive="!hasCommentsOnTop"
				@changePanel="onChangeSidebarPanel"
			/>
			<slot name="extra-panel"></slot>
		</div>
	`
	};

	// @vue/component
	const FeatureBlock = {
		name: 'FeatureBlock',
		props: {
			name: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			subtitle: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="bx-im-content-chat-start__block">
			<div class="bx-im-content-chat-start__block_icon" :class="'--' + name"></div>
			<div class="bx-im-content-chat-start__block_content">
				<div class="bx-im-content-chat-start__block_title">
					{{ title }}
				</div>
				<div class="bx-im-content-chat-start__block_subtitle">
					{{ subtitle }}
				</div>
			</div>
		</div>
	`
	};

	const IconClass = {
		group: '--group',
		chat: '--chat',
		list: '--list'
	};
	const EmptyStateListItemName = {
		audio: 'audio',
		messages: 'messages',
		chat: 'chat',
		collaboration: 'collaboration',
		business: 'business',
		result: 'result',
		copilot: 'copilot',
		list: 'list'
	};
	// @vue/component
	const BaseEmptyState = {
		components: {
			FeatureBlock
		},
		props: {
			text: {
				type: String,
				default: ''
			},
			subtext: {
				type: String,
				default: ''
			},
			backgroundId: {
				type: [String, Number],
				default: ''
			},
			listItems: {
				type: Array,
				default: () => []
			},
			iconClassName: {
				type: String,
				default: ''
			}
		},
		computed: {
			items() {
				return this.listItems;
			},
			iconClass() {
				if (this.iconClassName) {
					return this.iconClassName;
				}
				return this.isEmptyRecent ? IconClass.group : IconClass.chat;
			},
			preparedText() {
				if (this.text) {
					return this.text;
				}
				if (this.isEmptyRecent) {
					return this.loc('IM_CONTENT_CHAT_EMPTY_STATE_NO_CHATS_MESSAGE');
				}
				return this.loc('IM_CONTENT_CHAT_EMPTY_STATE_MESSAGE');
			},
			preparedSubtext() {
				if (this.subtext) {
					return this.subtext;
				}
				return '';
			},
			isEmptyRecent() {
				const recentCollection = im_v2_application_core.Core.getStore().getters['recent/getCollection']({
					type: im_v2_const.RecentType.default
				});
				return recentCollection.length === 0;
			},
			backgroundStyle() {
				if (main_core.Type.isStringFilled(this.backgroundId) || main_core.Type.isNumber(this.backgroundId)) {
					return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(this.backgroundId);
				}
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-start__container" :style="backgroundStyle">
			<div class="bx-im-content-chat-start__content">
				<div class="bx-im-content-chat-start__icon" :class="iconClass"></div>
				<div class="bx-im-content-chat-start__title">
					{{ preparedText }}
				</div>
				<div v-if="preparedSubtext" class="bx-im-content-chat-start__subtitle">
					{{ preparedSubtext }}
				</div>
				<div v-if="items.length > 0" class="bx-im-content-chat-start__blocks">
					<FeatureBlock
						v-for="item in items"
						:name="item.name"
						:title="item.title"
						:subtitle="item.subtitle"
					/>
				</div>
				<slot name="bottom-content"></slot>
			</div>
		</div>
	`
	};

	exports.BaseChatContent = BaseChatContent;
	exports.BaseEmptyState = BaseEmptyState;
	exports.ChatContentDisclaimer = ChatContentDisclaimer;
	exports.ChatHeader = ChatHeader;
	exports.DropArea = DropArea;
	exports.EmptyStateListItemName = EmptyStateListItemName;
	exports.EntityControl = EntityControl;
	exports.GroupChatTitle = GroupChatTitle;
	exports.HeaderAction = HeaderAction;
	exports.HeaderActionShape = HeaderActionShape;
	exports.HeaderControlKey = HeaderControlKey;
	exports.IconClass = IconClass;
	exports.UserCounter = UserCounter;
})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Component?.Animation??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.UI?.IconSet??{}, BX?.Messenger?.v2?.Component?.EntitySelector??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Css??{}, BX?.Call?.Widget??{}, BX?.UI?.Accessibility??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Vue3??{}, BX?.Messenger?.v2?.Component?.Dialog??{}, BX?.Messenger?.v2?.Component??{}, BX?.Messenger?.v2?.Component??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Vue3?.Components??{}, BX?.Vue3?.Directives??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Service??{}, BX?.UI?.Vue3?.Components??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.Uploader??{});;
//# sourceMappingURL=registry.bundle.js.map
