/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_const, im_v2_lib_createChat, main_core_events, main_popup, im_public, im_v2_component_content_chatForms_elements, im_v2_component_elements_avatar, im_v2_lib_permission, im_v2_provider_service_chat, im_v2_application_core, main_core, im_v2_lib_helpdesk, socialnetwork_collab_accessRights, ui_iconSet_api_vue, im_v2_lib_promo, im_v2_lib_notifier, im_v2_lib_analytics, im_v2_lib_confirm) {
	'use strict';

	// @vue/component
	const ChannelCreation = {
		name: 'ChannelCreation',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection,
			AppearanceSection: im_v2_component_content_chatForms_elements.AppearanceSection,
			PrivacySection: im_v2_component_content_chatForms_elements.PrivacySection,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			TextareaInput: im_v2_component_content_chatForms_elements.TextareaInput,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading
		},
		data() {
			return {
				isCreating: false,
				avatarFile: null,
				chatTitle: '',
				chatMembers: [],
				undeselectedItems: [],
				settings: {
					isAvailableInSearch: false,
					description: ''
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			EmptyAvatarType: () => im_v2_component_elements_avatar.EmptyAvatarType
		},
		watch: {
			chatTitle(newValue) {
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatTitle(newValue);
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			this.initDefaultRolesForRights();
			this.undeselectedItems = im_v2_lib_createChat.CreateChatManager.getInstance().getUndeselectedItems();
			this.rights.ownerId = im_v2_lib_createChat.CreateChatManager.getInstance().getOwnerId();
			this.chatMembers = im_v2_lib_createChat.CreateChatManager.getInstance().getChatMembers();
			this.restoreFields();
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatType(im_v2_lib_createChat.CreatableChatType.channel);
			im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(true);
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
		},
		beforeUnmount() {
			im_v2_lib_createChat.CreateChatManager.getInstance().clearPresetFields();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			if (this.exitByCancel || this.exitByChatTypeSwitch || this.exitByCreation) {
				return;
			}
			this.saveFields();
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onChatTypeChange(isAvailableInSearch) {
				this.settings.isAvailableInSearch = isAvailableInSearch;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			async onCreateClick() {
				this.isCreating = true;
				const {
					newDialogId
				} = await this.getChatService().createChat({
					type: im_v2_const.ChatType.channel,
					title: this.chatTitle,
					avatar: this.avatarFile,
					memberEntities: this.chatMembers,
					ownerId: this.rights.ownerId,
					managers: this.rights.managerIds,
					searchable: this.settings.isAvailableInSearch,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages
				}).catch(() => {
					this.isCreating = false;
				});
				this.isCreating = false;
				this.exitByCreation = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat(newDialogId);
			},
			onCancelClick() {
				this.exitByCancel = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat();
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			onLayoutChange(event) {
				const {
					to
				} = event.getData();
				if (to.name === im_v2_const.Layout.createChat && to.entityId !== im_v2_lib_createChat.CreatableChatType.channel) {
					this.exitByChatTypeSwitch = true;
				}
			},
			saveFields() {
				im_v2_lib_createChat.CreateChatManager.getInstance().saveFields({
					chatTitle: this.chatTitle,
					avatarFile: this.avatarFile,
					chatMembers: this.chatMembers,
					settings: this.settings,
					rights: this.rights
				});
			},
			restoreFields() {
				const savedFields = im_v2_lib_createChat.CreateChatManager.getInstance().getFields();
				if (!savedFields) {
					return;
				}
				const {
					chatTitle,
					avatarFile,
					chatMembers,
					settings,
					rights
				} = savedFields;
				this.chatTitle = chatTitle;
				this.avatarFile = avatarFile;
				this.chatMembers = chatMembers;
				this.settings = settings;
				this.rights = rights;
			},
			initDefaultRolesForRights() {
				const {
					manageUsersAdd,
					manageUsersDelete,
					manageUi,
					manageMessages
				} = im_v2_lib_permission.PermissionManager.getInstance().getDefaultRolesForActionGroups(im_v2_const.ChatType.channel);
				this.rights.manageUsersAdd = manageUsersAdd;
				this.rights.manageUsersDelete = manageUsersDelete;
				this.rights.manageUi = manageUi;
				this.rights.manageMessages = manageMessages;
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --channel" @scroll="onScroll">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar 
					:avatarFile="avatarFile" 
					:chatTitle="chatTitle" 
					:type="EmptyAvatarType.squared"
					@avatarChange="onAvatarChange" 
				/>
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHANNEL_TITLE_PLACEHOLDER_V2')" />
			</div>
			<CreateChatHeading :text="loc('IM_CREATE_CHANNEL_DESCRIPTION_TITLE')" />
			<div class="bx-im-content-chat-forms__description_container">
				<TextareaInput
					:value="settings.description"
					:placeholder="loc('IM_CREATE_CHANNEL_DESCRIPTION_PLACEHOLDER_V3')"
					:border="false"
					@input="onDescriptionChange"
				/>
			</div>
			<PrivacySection
				:isAvailableInSearch="settings.isAvailableInSearch"
				@chatTypeChange="onChatTypeChange"
			/>
			<CreateChatHeading
				:text="loc('IM_CREATE_CHANNEL_MEMBERS_TITLE')"
				:hintText="loc('IM_CREATE_CHANNEL_MEMBERS_HINT')"
			/>
			<div class="bx-im-content-chat-forms__members_container">
				<ChatMembersSelector 
					:chatMembers="chatMembers"
					:undeselectedItems="undeselectedItems"
					:allowTeamsSelect="true"
					@membersChange="onMembersChange"
				/>
			</div>
			<RightsSection
				:chatType="ChatType.channel"
				:ownerId="rights.ownerId"
				:managerIds="rights.managerIds"
				:manageUsersAdd="rights.manageUsersAdd"
				:manageUsersDelete="rights.manageUsersDelete"
				:manageUi="rights.manageUi"
				:manageMessages="rights.manageMessages"
				@ownerChange="onOwnerChange"
				@managersChange="onManagersChange"
				@manageUsersAddChange="onManageUsersAddChange"
				@manageUsersDeleteChange="onManageUsersDeleteChange"
				@manageUiChange="onManageUiChange"
				@manageMessagesChange="onManageMessagesChange"
			/>
		</div>
		<ButtonPanel
			:isCreating="isCreating"
			:createButtonTitle="loc('IM_CREATE_CHANNEL_CONFIRM')"
			@create="onCreateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	const LINK_CSS_CLASS = 'bx-im-create-collab-description-banner__link';
	const TITLE_LINK_MODIFIER = '--title';
	const INVITE_LINK_MODIFIER = '--invite';

	// @vue/component
	const DescriptionBanner$1 = {
		name: 'DescriptionBanner',
		computed: {
			preparedTitle() {
				return main_core.Loc.getMessage('IM_CREATE_COLLAB_BANNER_TITLE', {
					'[learn-more]': `<span class="${LINK_CSS_CLASS} ${TITLE_LINK_MODIFIER} --solid">`,
					'[/learn-more]': '</span>'
				});
			},
			preparedInviteText() {
				return main_core.Loc.getMessage('IM_CREATE_COLLAB_BANNER_TEXT_2', {
					'[learn-more]': `<span class="${LINK_CSS_CLASS} ${INVITE_LINK_MODIFIER} --dashed">`,
					'[/learn-more]': '</span>'
				});
			}
		},
		methods: {
			onTitleClick(event) {
				if (!main_core.Dom.hasClass(event.target, TITLE_LINK_MODIFIER)) {
					return;
				}
				const ARTICLE_CODE = '22706764';
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			},
			onInviteClick(event) {
				if (!main_core.Dom.hasClass(event.target, INVITE_LINK_MODIFIER)) {
					return;
				}
				const ARTICLE_CODE = '22706836';
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-create-collab-description-banner__container" ref="container">
			<div class="bx-im-create-collab-description-banner__icon"></div>
			<div class="bx-im-create-collab-description-banner__content">
				<div class="bx-im-create-collab-description-banner__title" v-html="preparedTitle" @click="onTitleClick"></div>
				<div class="bx-im-create-collab-description-banner__text">
					{{ loc('IM_CREATE_COLLAB_BANNER_TEXT_1') }}
				</div>
				<div class="bx-im-create-collab-description-banner__text" v-html="preparedInviteText" @click="onInviteClick"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const RightsSection = {
		name: 'RightsSection',
		components: {
			CreateChatExternalSection: im_v2_component_content_chatForms_elements.CreateChatExternalSection
		},
		props: {
			collabId: {
				type: Number,
				default: 0
			}
		},
		emits: ['change'],
		data() {
			return {
				formResult: null
			};
		},
		methods: {
			async onClick() {
				const sliderParams = {};
				if (this.collabId > 0) {
					sliderParams.collabId = this.collabId;
				}
				if (this.formResult) {
					sliderParams.formData = this.formResult;
				}
				this.form = await socialnetwork_collab_accessRights.AccessRights.openForm(sliderParams);
				this.bindEvents();
			},
			bindEvents() {
				main_core_events.EventEmitter.subscribe(this.form, 'save', this.onSave);
				main_core_events.EventEmitter.subscribe(this.form, 'cancel', this.onCancel);
			},
			unbindEvents() {
				main_core_events.EventEmitter.unsubscribe(this.form, 'save', this.onSave);
				main_core_events.EventEmitter.unsubscribe(this.form, 'cancel', this.onCancel);
			},
			onSave(event) {
				this.formResult = event.getData();
				this.$emit('change', this.formResult);
				this.unbindEvents();
			},
			onCancel() {
				this.unbindEvents();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<CreateChatExternalSection
			:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION')"
			@click="onClick"
			name="rights"
		/>
	`
	};

	const CollabCreation = {
		name: 'CollabCreation',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			DescriptionBanner: DescriptionBanner$1,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading,
			TextareaInput: im_v2_component_content_chatForms_elements.TextareaInput,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			RightsSection,
			AutoDelete: im_v2_component_content_chatForms_elements.AutoDelete
		},
		data() {
			return {
				isCreating: false,
				avatarFile: null,
				chatTitle: '',
				description: '',
				groupSettings: {
					ownerId: im_v2_application_core.Core.getUserId(),
					moderatorMembers: [],
					options: {},
					permissions: null
				},
				autoDeleteDelay: 0
			};
		},
		watch: {
			chatTitle(newValue) {
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatTitle(newValue);
			}
		},
		computed: {
			EmptyAvatarType: () => im_v2_component_elements_avatar.EmptyAvatarType,
			createButtonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: im_v2_const.Color.collab60,
					iconColor: im_v2_const.Color.white,
					textColor: im_v2_const.Color.white,
					hoverColor: im_v2_const.Color.collab50
				};
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			this.restoreFields();
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatType(im_v2_lib_createChat.CreatableChatType.collab);
			im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(true);
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			if (this.exitByCancel || this.exitByChatTypeSwitch || this.exitByCreation) {
				return;
			}
			this.saveFields();
		},
		methods: {
			restoreFields() {
				const savedFields = im_v2_lib_createChat.CreateChatManager.getInstance().getFields();
				if (!savedFields) {
					return;
				}
				const {
					chatTitle,
					avatarFile,
					description,
					autoDeleteDelay
				} = savedFields;
				this.chatTitle = chatTitle;
				this.avatarFile = avatarFile;
				this.description = description;
				this.autoDeleteDelay = autoDeleteDelay;
			},
			saveFields() {
				im_v2_lib_createChat.CreateChatManager.getInstance().saveFields({
					chatTitle: this.chatTitle,
					avatarFile: this.avatarFile,
					description: this.description,
					autoDeleteDelay: this.autoDeleteDelay
				});
			},
			onLayoutChange(event) {
				const {
					to
				} = event.getData();
				if (to.name === im_v2_const.Layout.createChat && to.entityId !== im_v2_lib_createChat.CreatableChatType.collab) {
					this.exitByChatTypeSwitch = true;
				}
			},
			async onCreateClick() {
				this.isCreating = true;
				try {
					const {
						newDialogId
					} = await this.getChatService().createCollab({
						title: this.chatTitle,
						avatar: this.avatarFile,
						description: this.description,
						ownerId: this.groupSettings.ownerId,
						moderatorMembers: this.groupSettings.moderatorMembers,
						options: this.groupSettings.options,
						permissions: this.groupSettings.permissions,
						messagesAutoDeleteDelay: this.autoDeleteDelay
					});
					this.isCreating = false;
					this.exitByCreation = true;
					im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
					await im_public.Messenger.openChat(newDialogId);
					this.getEmitter().emit(im_v2_const.EventType.header.openAddToChatPopup);
				} catch {
					this.isCreating = false;
				}
			},
			onCancelClick() {
				this.exitByCancel = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				im_public.Messenger.openChat();
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
			},
			onDescriptionChange(description) {
				this.description = description;
			},
			onRightsChange(rights) {
				const {
					ownerId,
					moderators,
					permissions,
					options
				} = rights;
				this.groupSettings.ownerId = ownerId;
				this.groupSettings.moderatorMembers = moderators;
				this.groupSettings.permissions = permissions;
				this.groupSettings.options = options;
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			onAutoDeleteDelayChange(delay) {
				this.autoDeleteDelay = delay;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --collab">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar 
					:avatarFile="avatarFile" 
					:chatTitle="chatTitle" 
					:type="EmptyAvatarType.collab" 
					@avatarChange="onAvatarChange" 
				/>
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_COLLAB_TITLE_PLACEHOLDER')" />
			</div>
			<DescriptionBanner />
			<CreateChatHeading :text="loc('IM_CREATE_COLLAB_DESCRIPTION_TITLE')" />
			<div class="bx-im-content-chat-forms__description_container">
				<TextareaInput
					:value="description"
					:placeholder="loc('IM_CREATE_COLLAB_DESCRIPTION_PLACEHOLDER')"
					:border="false"
					@input="onDescriptionChange"
				/>
			</div>
			<RightsSection @change="onRightsChange" />
			<AutoDelete 
				:initialDelay="autoDeleteDelay" 
				@delayChange="onAutoDeleteDelayChange" 
			/>
		</div>
		<ButtonPanel
			:isCreating="isCreating"
			:createButtonTitle="loc('IM_CREATE_COLLAB_CONFIRM')"
			:createButtonColorScheme="createButtonColorScheme"
			@create="onCreateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const DescriptionBanner = {
		name: 'DescriptionBanner',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['close'],
		data() {
			return {
				showDescriptionBanner: im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.createCollabNestedChatDescription)
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			preparedText() {
				return this.loc('IM_CREATE_COLLAB_CHAT_BANNER_TEXT', {
					'#BR#': '\n'
				});
			}
		},
		methods: {
			onClose() {
				this.showDescriptionBanner = false;
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.createCollabNestedChatDescription);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div v-if="showDescriptionBanner" class="bx-im-create-collab-chat-description-banner__container">
			<div class="bx-im-create-collab-chat-description-banner__title">
				{{ loc('IM_CREATE_COLLAB_CHAT_BANNER_TITLE') }}
			</div>
			<div class="bx-im-create-collab-chat-description-banner__text">
				{{ preparedText }}
			</div>
			<BIcon
				:name="OutlineIcons.CROSS_L"
				:hoverable="true"
				class="bx-im-create-collab-chat-description-banner__close"
				@click="onClose"
			/>
		</div>
	`
	};

	// @vue/component
	const CollabChatCreation = {
		name: 'CollabChatCreation',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			SettingsSection: im_v2_component_content_chatForms_elements.SettingsSection,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection,
			AppearanceSection: im_v2_component_content_chatForms_elements.AppearanceSection,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading,
			DescriptionBanner
		},
		data() {
			return {
				isCreating: false,
				avatarFile: null,
				chatTitle: '',
				chatMembers: [],
				undeselectedItems: [],
				settings: {
					description: '',
					autoDeleteDelay: 0
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		watch: {
			chatTitle(newValue) {
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatTitle(newValue);
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			this.initDefaultRolesForRights();
			this.undeselectedItems = im_v2_lib_createChat.CreateChatManager.getInstance().getUndeselectedItems();
			this.rights.ownerId = im_v2_lib_createChat.CreateChatManager.getInstance().getOwnerId();
			this.chatMembers = im_v2_lib_createChat.CreateChatManager.getInstance().getChatMembers();
			this.parentChatId = im_v2_lib_createChat.CreateChatManager.getInstance().getParentChatId();
			this.restoreFields();
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatType(im_v2_lib_createChat.CreatableChatType.collabChat);
			im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(true);
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
		},
		beforeUnmount() {
			im_v2_lib_createChat.CreateChatManager.getInstance().clearPresetFields();
			if (this.exitByCancel || this.exitByChatTypeSwitch || this.exitByCreation) {
				return;
			}
			this.saveFields();
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onAutoDeleteChange(delay) {
				this.settings.autoDeleteDelay = delay;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			async onCreateClick() {
				this.isCreating = true;
				const {
					newDialogId
				} = await this.getChatService().createChat({
					parentChatId: this.parentChatId,
					title: this.chatTitle,
					avatar: this.avatarFile,
					memberEntities: this.chatMembers,
					ownerId: this.rights.ownerId,
					managers: this.rights.managerIds,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages,
					messagesAutoDeleteDelay: this.settings.autoDeleteDelay
				}).catch(() => {
					this.isCreating = false;
				});
				this.isCreating = false;
				this.exitByCreation = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat(newDialogId);
			},
			onCancelClick() {
				this.exitByCancel = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat();
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			onLayoutChange(event) {
				const {
					to
				} = event.getData();
				if (to.name === im_v2_const.Layout.createChat && to.entityId !== im_v2_lib_createChat.CreatableChatType.collabChat) {
					this.exitByChatTypeSwitch = true;
				}
			},
			saveFields() {
				im_v2_lib_createChat.CreateChatManager.getInstance().saveFields({
					chatTitle: this.chatTitle,
					avatarFile: this.avatarFile,
					chatMembers: this.chatMembers,
					settings: this.settings,
					rights: this.rights,
					parentChatId: this.parentChatId
				});
			},
			restoreFields() {
				const savedFields = im_v2_lib_createChat.CreateChatManager.getInstance().getFields();
				if (!savedFields) {
					return;
				}
				const {
					chatTitle,
					avatarFile,
					chatMembers,
					settings,
					rights,
					parentChatId
				} = savedFields;
				this.chatTitle = chatTitle;
				this.avatarFile = avatarFile;
				this.chatMembers = chatMembers;
				this.settings = settings;
				this.rights = rights;
				this.parentChatId = parentChatId;
			},
			initDefaultRolesForRights() {
				const {
					manageUsersAdd,
					manageUsersDelete,
					manageUi,
					manageMessages
				} = im_v2_lib_permission.PermissionManager.getInstance().getDefaultRolesForActionGroups();
				this.rights.manageUsersAdd = manageUsersAdd;
				this.rights.manageUsersDelete = manageUsersDelete;
				this.rights.manageUi = manageUi;
				this.rights.manageMessages = manageMessages;
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
		<div class="bx-im-content-chat-forms__content --chat" @scroll="onScroll">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar :avatarFile="avatarFile" :chatTitle="chatTitle" @avatarChange="onAvatarChange" />
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHAT_TITLE_PLACEHOLDER')" />
			</div>
			<DescriptionBanner />
			<CreateChatHeading :text="loc('IM_CREATE_CHAT_MEMBERS_TITLE')" />
			<div class="bx-im-content-chat-forms__members_container">
				<ChatMembersSelector
					:undeselectedItems="undeselectedItems"
					:chatMembers="chatMembers"
					:allowTeamsSelect="true"
					@membersChange="onMembersChange"
				/>
			</div>
			<SettingsSection
				:withSearchOption="false"
				:description="settings.description"
				:autoDeleteDelay="settings.autoDeleteDelay"
				@autoDeleteDelayChange="onAutoDeleteChange"
				@descriptionChange="onDescriptionChange"
			/>
			<RightsSection
				:ownerId="rights.ownerId"
				:managerIds="rights.managerIds"
				:manageUsersAdd="rights.manageUsersAdd"
				:manageUsersDelete="rights.manageUsersDelete"
				:manageUi="rights.manageUi"
				:manageMessages="rights.manageMessages"
				@ownerChange="onOwnerChange"
				@managersChange="onManagersChange"
				@manageUsersAddChange="onManageUsersAddChange"
				@manageUsersDeleteChange="onManageUsersDeleteChange"
				@manageUiChange="onManageUiChange"
				@manageMessagesChange="onManageMessagesChange"
			/>
		</div>
		<ButtonPanel
			:isCreating="isCreating"
			:createButtonTitle="loc('IM_CREATE_CHAT_CONFIRM')"
			@create="onCreateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const ConferenceCreation = {
		name: 'ConferenceCreation',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			SettingsSection: im_v2_component_content_chatForms_elements.SettingsSection,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection,
			AppearanceSection: im_v2_component_content_chatForms_elements.AppearanceSection,
			ConferenceSection: im_v2_component_content_chatForms_elements.ConferenceSection,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading
		},
		data() {
			return {
				isCreating: false,
				avatarFile: null,
				chatTitle: '',
				chatMembers: [['user', im_v2_application_core.Core.getUserId()]],
				conference: {
					passwordNeeded: false,
					password: ''
				},
				settings: {
					description: ''
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		computed: {
			EmptyAvatarType: () => im_v2_component_elements_avatar.EmptyAvatarType
		},
		watch: {
			chatTitle(newValue) {
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatTitle(newValue);
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			this.rights.ownerId = im_v2_application_core.Core.getUserId();
			this.initDefaultRolesForRights();
			this.restoreFields();
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatType(im_v2_lib_createChat.CreatableChatType.videoconf);
			im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(true);
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
		},
		beforeUnmount() {
			if (this.exitByCancel || this.exitByChatTypeSwitch) {
				return;
			}
			this.saveFields();
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
			},
			onPasswordNeededChange(passwordNeeded) {
				this.conference.passwordNeeded = passwordNeeded;
			},
			onPasswordChange(newPassword) {
				this.conference.password = newPassword;
			},
			async onCreateClick() {
				if (!this.checkPassword()) {
					im_v2_lib_notifier.Notifier.conference.onPasswordError();
					return;
				}
				this.isCreating = true;
				const result = await this.getChatService().createChat({
					entityType: im_v2_const.ChatType.videoconf,
					title: this.chatTitle,
					avatar: this.avatarFile,
					memberEntities: this.chatMembers,
					ownerId: this.rights.ownerId,
					managers: this.rights.managerIds,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages,
					conferencePassword: this.conference.passwordNeeded ? this.conference.password : ''
				}).catch(() => {
					this.isCreating = false;
				});
				if (!result) {
					return;
				}
				const {
					newDialogId
				} = result;
				this.isCreating = false;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat(newDialogId);
			},
			onCancelClick() {
				this.exitByCancel = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				im_public.Messenger.openChat();
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			onLayoutChange(event) {
				const {
					to
				} = event.getData();
				if (to.name === im_v2_const.Layout.createChat && to.entityId !== im_v2_lib_createChat.CreatableChatType.videoconf) {
					this.exitByChatTypeSwitch = true;
				}
			},
			saveFields() {
				im_v2_lib_createChat.CreateChatManager.getInstance().saveFields({
					chatTitle: this.chatTitle,
					avatarFile: this.avatarFile,
					chatMembers: this.chatMembers,
					settings: this.settings,
					rights: this.rights,
					conference: this.conference
				});
			},
			restoreFields() {
				const savedFields = im_v2_lib_createChat.CreateChatManager.getInstance().getFields();
				if (!savedFields) {
					return;
				}
				const {
					chatTitle,
					avatarFile,
					chatMembers,
					conference,
					settings,
					rights
				} = savedFields;
				this.chatTitle = chatTitle;
				this.avatarFile = avatarFile;
				this.chatMembers = chatMembers;
				this.conference = conference;
				this.settings = settings;
				this.rights = rights;
			},
			initDefaultRolesForRights() {
				const {
					manageUsersAdd,
					manageUsersDelete,
					manageUi,
					manageMessages
				} = im_v2_lib_permission.PermissionManager.getInstance().getDefaultRolesForActionGroups();
				this.rights.manageUsersAdd = manageUsersAdd;
				this.rights.manageUsersDelete = manageUsersDelete;
				this.rights.manageUi = manageUi;
				this.rights.manageMessages = manageMessages;
			},
			checkPassword() {
				const PASSWORD_MIN_LENGTH = 3;
				if (!this.conference.passwordNeeded) {
					return true;
				}
				const password = this.conference.password.trim();
				return password !== '' && password.length >= PASSWORD_MIN_LENGTH;
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
		<div class="bx-im-content-chat-forms__content --conference" @scroll="onScroll">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar 
					:avatarFile="avatarFile" 
					:chatTitle="chatTitle"
					:type="EmptyAvatarType.squared"	
					@avatarChange="onAvatarChange" 
				/>
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CONFERENCE_TITLE_PLACEHOLDER')" />
			</div>
			<CreateChatHeading :text="loc('IM_CREATE_CHAT_MEMBERS_TITLE')" />
			<div class="bx-im-content-chat-forms__members_container">
				<ChatMembersSelector :chatMembers="chatMembers" @membersChange="onMembersChange" />
			</div>
			<ConferenceSection
				:passwordNeeded="conference.passwordNeeded"
				:password="conference.password"
				@passwordNeededChange="onPasswordNeededChange"
				@passwordChange="onPasswordChange"
			/>
			<SettingsSection
				:withSearchOption="false"
				:withAutoDeleteOption="false"
				:description="settings.description"
				@descriptionChange="onDescriptionChange"
			/>
			<RightsSection
				:ownerId="rights.ownerId"
				:managerIds="rights.managerIds"
				:manageUsersAdd="rights.manageUsersAdd"
				:manageUsersDelete="rights.manageUsersDelete"
				:manageUi="rights.manageUi"
				:manageMessages="rights.manageMessages"
				@ownerChange="onOwnerChange"
				@managersChange="onManagersChange"
				@manageUsersAddChange="onManageUsersAddChange"
				@manageUsersDeleteChange="onManageUsersDeleteChange"
				@manageUiChange="onManageUiChange"
				@manageMessagesChange="onManageMessagesChange"
			/>
		</div>
		<ButtonPanel
			:isCreating="isCreating"
			:createButtonTitle="loc('IM_CREATE_CONFERENCE_CONFIRM')"
			@create="onCreateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const GroupChatCreation = {
		name: 'GroupChatCreation',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			SettingsSection: im_v2_component_content_chatForms_elements.SettingsSection,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection,
			AppearanceSection: im_v2_component_content_chatForms_elements.AppearanceSection,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading
		},
		data() {
			return {
				isCreating: false,
				avatarFile: null,
				chatTitle: '',
				chatMembers: [],
				undeselectedItems: [],
				settings: {
					isAvailableInSearch: false,
					description: '',
					autoDeleteDelay: 0
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		watch: {
			chatTitle(newValue) {
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatTitle(newValue);
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, this.onLayoutChange);
			this.initDefaultRolesForRights();
			this.undeselectedItems = im_v2_lib_createChat.CreateChatManager.getInstance().getUndeselectedItems();
			this.rights.ownerId = im_v2_lib_createChat.CreateChatManager.getInstance().getOwnerId();
			this.chatMembers = im_v2_lib_createChat.CreateChatManager.getInstance().getChatMembers();
			this.restoreFields();
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatType(im_v2_lib_createChat.CreatableChatType.chat);
			im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(true);
			im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
		},
		beforeUnmount() {
			im_v2_lib_createChat.CreateChatManager.getInstance().clearPresetFields();
			if (this.exitByCancel || this.exitByChatTypeSwitch || this.exitByCreation) {
				return;
			}
			this.saveFields();
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onChatTypeChange(isAvailableInSearch) {
				this.settings.isAvailableInSearch = isAvailableInSearch;
			},
			onAutoDeleteChange(delay) {
				this.settings.autoDeleteDelay = delay;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			async onCreateClick() {
				this.isCreating = true;
				const {
					newDialogId
				} = await this.getChatService().createChat({
					title: this.chatTitle,
					avatar: this.avatarFile,
					memberEntities: this.chatMembers,
					ownerId: this.rights.ownerId,
					managers: this.rights.managerIds,
					searchable: this.settings.isAvailableInSearch,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages,
					messagesAutoDeleteDelay: this.settings.autoDeleteDelay
				}).catch(() => {
					this.isCreating = false;
				});
				this.isCreating = false;
				this.exitByCreation = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				void im_public.Messenger.openChat(newDialogId);
			},
			onCancelClick() {
				this.exitByCancel = true;
				im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				im_public.Messenger.openChat();
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				im_v2_lib_createChat.CreateChatManager.getInstance().setChatAvatar(this.avatarFile);
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			onLayoutChange(event) {
				const {
					to
				} = event.getData();
				if (to.name === im_v2_const.Layout.createChat && to.entityId !== im_v2_lib_createChat.CreatableChatType.chat) {
					this.exitByChatTypeSwitch = true;
				}
			},
			saveFields() {
				im_v2_lib_createChat.CreateChatManager.getInstance().saveFields({
					chatTitle: this.chatTitle,
					avatarFile: this.avatarFile,
					chatMembers: this.chatMembers,
					settings: this.settings,
					rights: this.rights
				});
			},
			restoreFields() {
				const savedFields = im_v2_lib_createChat.CreateChatManager.getInstance().getFields();
				if (!savedFields) {
					return;
				}
				const {
					chatTitle,
					avatarFile,
					chatMembers,
					settings,
					rights
				} = savedFields;
				this.chatTitle = chatTitle;
				this.avatarFile = avatarFile;
				this.chatMembers = chatMembers;
				this.settings = settings;
				this.rights = rights;
			},
			initDefaultRolesForRights() {
				const {
					manageUsersAdd,
					manageUsersDelete,
					manageUi,
					manageMessages
				} = im_v2_lib_permission.PermissionManager.getInstance().getDefaultRolesForActionGroups();
				this.rights.manageUsersAdd = manageUsersAdd;
				this.rights.manageUsersDelete = manageUsersDelete;
				this.rights.manageUi = manageUi;
				this.rights.manageMessages = manageMessages;
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
		<div class="bx-im-content-chat-forms__content --chat" @scroll="onScroll">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar :avatarFile="avatarFile" :chatTitle="chatTitle" @avatarChange="onAvatarChange" />
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHAT_TITLE_PLACEHOLDER')" />
			</div>
			<CreateChatHeading :text="loc('IM_CREATE_CHAT_MEMBERS_TITLE')" />
			<div class="bx-im-content-chat-forms__members_container">
				<ChatMembersSelector 
					:undeselectedItems="undeselectedItems" 
					:chatMembers="chatMembers"
					:allowTeamsSelect="true"
					@membersChange="onMembersChange"
				/>
			</div>
			<SettingsSection
				:isAvailableInSearch="settings.isAvailableInSearch"
				:description="settings.description"
				:autoDeleteDelay="settings.autoDeleteDelay"
				@autoDeleteDelayChange="onAutoDeleteChange"
				@chatTypeChange="onChatTypeChange"
				@descriptionChange="onDescriptionChange"
			/>
			<RightsSection
				:ownerId="rights.ownerId"
				:managerIds="rights.managerIds"
				:manageUsersAdd="rights.manageUsersAdd"
				:manageUsersDelete="rights.manageUsersDelete"
				:manageUi="rights.manageUi"
				:manageMessages="rights.manageMessages"
				@ownerChange="onOwnerChange"
				@managersChange="onManagersChange"
				@manageUsersAddChange="onManageUsersAddChange"
				@manageUsersDeleteChange="onManageUsersDeleteChange"
				@manageUiChange="onManageUiChange"
				@manageMessagesChange="onManageMessagesChange"
			/> 
		</div>
		<ButtonPanel
			:isCreating="isCreating"
			:createButtonTitle="loc('IM_CREATE_CHAT_CONFIRM')"
			@create="onCreateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	const CreationComponentByChatType = {
		[im_v2_lib_createChat.CreatableChatType.chat]: GroupChatCreation,
		[im_v2_lib_createChat.CreatableChatType.videoconf]: ConferenceCreation,
		[im_v2_lib_createChat.CreatableChatType.channel]: ChannelCreation,
		[im_v2_lib_createChat.CreatableChatType.collab]: CollabCreation,
		[im_v2_lib_createChat.CreatableChatType.collabChat]: CollabChatCreation,
		default: GroupChatCreation
	};

	// @vue/component
	const CreateChatContent = {
		name: 'CreateChatContent',
		components: {
			GroupChatCreation,
			ConferenceCreation,
			ChannelCreation,
			CollabCreation
		},
		props: {
			entityId: {
				type: String,
				required: true
			}
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			chatType() {
				return this.entityId;
			},
			creationComponent() {
				return CreationComponentByChatType[this.chatType] ?? CreationComponentByChatType.default;
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__container">
			<component :is="creationComponent" />
		</div>
	`
	};

	class ChatMemberDiffManager {
		#initialManagers = [];
		#initialMembers = [];
		setInitialManagers(initialManagers) {
			this.#initialManagers = initialManagers;
		}
		setInitialChatMembers(initialMembers) {
			this.#initialMembers = initialMembers;
		}
		getAddedMemberEntities(modifiedEntities) {
			const originalSet = new Set(this.#initialMembers.map(elem => JSON.stringify(elem)));
			return modifiedEntities.filter(elem => !originalSet.has(JSON.stringify(elem)));
		}
		getDeletedMemberEntities(modifiedEntities) {
			const modifiedSet = new Set(modifiedEntities.map(elem => JSON.stringify(elem)));
			return this.#initialMembers.filter(elem => !modifiedSet.has(JSON.stringify(elem)));
		}
		getAddedManagers(modifiedArray) {
			const originalSet = new Set(this.#initialManagers);
			return modifiedArray.filter(elem => !originalSet.has(elem));
		}
		getDeletedManagers(modifiedArray) {
			const modifiedSet = new Set(modifiedArray);
			return this.#initialManagers.filter(elem => !modifiedSet.has(elem));
		}
	}

	const ENTITY_ID = 'imUpdateChatCollapsedUsers';
	const AVATAR_URL = '/bitrix/js/im/v2/component/content/chat-forms/src/css/images/collapsed-users-avatar.svg';
	function getCollapsedUsersElement({
		title,
		onclick
	}) {
		const textNode = `
		<div class="bx-im-content-chat-forms__collapsed-users">
			${title}
			<div class="bx-im-content-chat-forms__collapsed-users-icon"></div>
		</div>
	`;
		return {
			id: 0,
			entityId: ENTITY_ID,
			avatar: AVATAR_URL,
			title: {
				text: textNode,
				type: 'html'
			},
			deselectable: false,
			tagOptions: {
				onclick
			}
		};
	}

	// @vue/component
	const GroupChatUpdating = {
		name: 'GroupChatUpdating',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			SettingsSection: im_v2_component_content_chatForms_elements.SettingsSection,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isLoading: true,
				isUpdating: false,
				areUsersCollapsed: false,
				collapsedUsersCount: 0,
				avatarFile: null,
				avatarUrl: '',
				chatTitle: '',
				chatMembers: [],
				settings: {
					isAvailableInSearch: false,
					description: ''
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			collapsedUsers() {
				if (!this.areUsersCollapsed) {
					return [];
				}
				const title = this.loc('IM_UPDATE_GROUP_CHAT_COLLAPSED_ELEMENT', {
					'#COUNT#': this.collapsedUsersCount
				});
				const element = getCollapsedUsersElement({
					title,
					onclick: this.onCollapsedUsersClick
				});
				return [element];
			},
			canChangeSearchAvailability() {
				return [im_v2_const.ChatType.open, im_v2_const.ChatType.chat].includes(this.dialog.type);
			}
		},
		async created() {
			await this.fillForm();
			this.memberDiffManager = new ChatMemberDiffManager();
			this.memberDiffManager.setInitialChatMembers(this.chatMembers);
			this.memberDiffManager.setInitialManagers(this.rights.managerIds);
			this.isLoading = false;
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onChatTypeChange(isAvailableInSearch) {
				this.settings.isAvailableInSearch = isAvailableInSearch;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			async fillForm() {
				this.chatTitle = this.dialog.name;
				this.avatarUrl = this.dialog.avatar;
				this.settings.description = this.dialog.description;
				this.chatMembers = await this.getMemberEntities();
				this.rights.ownerId = this.dialog.ownerId;
				this.rights.manageMessages = this.dialog.permissions.manageMessages;
				this.rights.managerIds = this.dialog.managerList;
				this.rights.manageUi = this.dialog.permissions.manageUi;
				this.rights.manageUsersAdd = this.dialog.permissions.manageUsersAdd;
				this.rights.manageUsersDelete = this.dialog.permissions.manageUsersDelete;
				this.settings.isAvailableInSearch = this.dialog.type === im_v2_const.ChatType.open;
			},
			async getMemberEntities() {
				const {
					memberEntities,
					areUsersCollapsed,
					userCount
				} = await this.getChatService().getMemberEntities(this.chatId);
				if (areUsersCollapsed) {
					this.areUsersCollapsed = true;
					this.collapsedUsersCount = userCount;
					return memberEntities;
				}
				return memberEntities;
			},
			async onUpdateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatEdit.onSubmitForm(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				this.isUpdating = true;
				await this.getChatService().updateChat(this.chatId, {
					title: this.chatTitle,
					avatar: this.avatarFile,
					addedMemberEntities: this.memberDiffManager.getAddedMemberEntities(this.chatMembers),
					deletedMemberEntities: this.memberDiffManager.getDeletedMemberEntities(this.chatMembers),
					addedManagers: this.memberDiffManager.getAddedManagers(this.rights.managerIds),
					deletedManagers: this.memberDiffManager.getDeletedManagers(this.rights.managerIds),
					ownerId: this.rights.ownerId,
					searchable: this.settings.isAvailableInSearch,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages
				}).catch(() => {
					this.isUpdating = false;
				});
				this.isUpdating = false;
				return im_public.Messenger.openChat(this.dialogId);
			},
			onCancelClick() {
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				void im_public.Messenger.openChat(this.dialogId);
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				this.avatarUrl = '';
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			async onCollapsedUsersClick() {
				const confirmResult = await im_v2_lib_confirm.showExitUpdateChatConfirm(this.dialogId);
				if (!confirmResult) {
					return;
				}
				await this.onUpdateClick();
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --chat" @scroll="onScroll">
			<div v-if="isLoading" class="bx-im-content-chat-forms__skeleton"></div>
			<template v-else>
				<div class="bx-im-content-chat-forms__header">
					<ChatAvatar
						:avatarFile="avatarFile"
						:existingAvatarUrl="avatarUrl"
						:chatTitle="chatTitle"
						@avatarChange="onAvatarChange"
					/>
					<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHAT_TITLE_PLACEHOLDER')" />
				</div>
				<CreateChatHeading :text="loc('IM_CREATE_CHAT_MEMBERS_TITLE')" />
				<div class="bx-im-content-chat-forms__members_container">
					<ChatMembersSelector
						:customElements="collapsedUsers"
						:chatMembers="chatMembers"
						:allowTeamsSelect="dialog.type !== ChatType.videoconf"
						@membersChange="onMembersChange"
					/>
				</div>
				<SettingsSection
					:isAvailableInSearch="settings.isAvailableInSearch"
					:description="settings.description"
					:withSearchOption="canChangeSearchAvailability"
					:withAutoDeleteOption="false"
					@chatTypeChange="onChatTypeChange"
					@descriptionChange="onDescriptionChange"
				/>
				<RightsSection
					:ownerId="rights.ownerId"
					:managerIds="rights.managerIds"
					:manageUsersAdd="rights.manageUsersAdd"
					:manageUsersDelete="rights.manageUsersDelete"
					:manageUi="rights.manageUi"
					:manageMessages="rights.manageMessages"
					@ownerChange="onOwnerChange"
					@managersChange="onManagersChange"
					@manageUsersAddChange="onManageUsersAddChange"
					@manageUsersDeleteChange="onManageUsersDeleteChange"
					@manageUiChange="onManageUiChange"
					@manageMessagesChange="onManageMessagesChange"
				/>
			</template>
		</div>
		<ButtonPanel
			:isCreating="isUpdating || isLoading"
			:createButtonTitle="loc('IM_UPDATE_CONFIRM')"
			@create="onUpdateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const ChannelUpdating = {
		name: 'ChannelUpdating',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection,
			AppearanceSection: im_v2_component_content_chatForms_elements.AppearanceSection,
			PrivacySection: im_v2_component_content_chatForms_elements.PrivacySection,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			TextareaInput: im_v2_component_content_chatForms_elements.TextareaInput,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isLoading: true,
				isUpdating: false,
				areUsersCollapsed: false,
				collapsedUsersCount: 0,
				avatarFile: null,
				avatarUrl: '',
				chatTitle: '',
				chatMembers: [],
				settings: {
					isAvailableInSearch: true,
					description: ''
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			EmptyAvatarType: () => im_v2_component_elements_avatar.EmptyAvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			chatType() {
				return this.dialog.type;
			},
			collapsedUsers() {
				if (!this.areUsersCollapsed) {
					return [];
				}
				const title = this.loc('IM_UPDATE_CHANNEL_COLLAPSED_ELEMENT', {
					'#COUNT#': this.collapsedUsersCount
				});
				const element = getCollapsedUsersElement({
					title,
					onclick: this.onCollapsedUsersClick
				});
				return [element];
			}
		},
		async created() {
			await this.fillForm();
			this.memberDiffManager = new ChatMemberDiffManager();
			this.memberDiffManager.setInitialChatMembers(this.chatMembers);
			this.memberDiffManager.setInitialManagers(this.rights.managerIds);
			this.isLoading = false;
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			onChatTypeChange(isAvailableInSearch) {
				this.settings.isAvailableInSearch = isAvailableInSearch;
			},
			async onUpdateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatEdit.onSubmitForm(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				this.isUpdating = true;
				await this.getChatService().updateChat(this.chatId, {
					title: this.chatTitle,
					avatar: this.avatarFile,
					addedMemberEntities: this.memberDiffManager.getAddedMemberEntities(this.chatMembers),
					deletedMemberEntities: this.memberDiffManager.getDeletedMemberEntities(this.chatMembers),
					addedManagers: this.memberDiffManager.getAddedManagers(this.rights.managerIds),
					deletedManagers: this.memberDiffManager.getDeletedManagers(this.rights.managerIds),
					ownerId: this.rights.ownerId,
					searchable: this.settings.isAvailableInSearch,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages
				}).catch(() => {
					this.isUpdating = false;
				});
				this.isUpdating = false;
				return im_public.Messenger.openChat(this.dialogId);
			},
			onCancelClick() {
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				void im_public.Messenger.openChat(this.dialogId);
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				this.avatarUrl = '';
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			async fillForm() {
				this.chatTitle = this.dialog.name;
				this.avatarUrl = this.dialog.avatar;
				this.settings.description = this.dialog.description;
				this.chatMembers = await this.getMemberEntities();
				this.rights.ownerId = this.dialog.ownerId;
				this.rights.manageMessages = this.dialog.permissions.manageMessages;
				this.rights.managerIds = this.dialog.managerList;
				this.rights.manageUi = this.dialog.permissions.manageUi;
				this.rights.manageUsersAdd = this.dialog.permissions.manageUsersAdd;
				this.rights.manageUsersDelete = this.dialog.permissions.manageUsersDelete;
				this.settings.isAvailableInSearch = this.dialog.type === im_v2_const.ChatType.openChannel;
			},
			async getMemberEntities() {
				const {
					memberEntities,
					areUsersCollapsed,
					userCount
				} = await this.getChatService().getMemberEntities(this.chatId);
				if (areUsersCollapsed) {
					this.areUsersCollapsed = true;
					this.collapsedUsersCount = userCount;
					return memberEntities;
				}
				return memberEntities;
			},
			async onCollapsedUsersClick() {
				const confirmResult = await im_v2_lib_confirm.showExitUpdateChatConfirm(this.dialogId);
				if (!confirmResult) {
					return;
				}
				await this.onUpdateClick();
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --channel" @scroll="onScroll">
			<div v-if="isLoading" class="bx-im-content-chat-forms__skeleton"></div>
			<template v-else>
				<div class="bx-im-content-chat-forms__header">
					<ChatAvatar
						:avatarFile="avatarFile"
						:chatTitle="chatTitle"
						:existingAvatarUrl="avatarUrl"
						:type="EmptyAvatarType.squared"
						@avatarChange="onAvatarChange"
					/>
					<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHANNEL_TITLE_PLACEHOLDER_V2')" />
				</div>
				<CreateChatHeading :text="loc('IM_CREATE_CHANNEL_DESCRIPTION_TITLE')" />
				<div class="bx-im-content-chat-forms__description_container">
					<TextareaInput
						:value="settings.description"
						:placeholder="loc('IM_CREATE_CHANNEL_DESCRIPTION_PLACEHOLDER_V3')"
						:border="false"
						@input="onDescriptionChange"
					/>
				</div>
				<PrivacySection
					:isAvailableInSearch="settings.isAvailableInSearch"
					@chatTypeChange="onChatTypeChange"
				/>
				<CreateChatHeading
					:text="loc('IM_CREATE_CHANNEL_MEMBERS_TITLE')"
					:hintText="loc('IM_CREATE_CHANNEL_MEMBERS_HINT')"
				/>
				<div class="bx-im-content-chat-forms__members_container">
					<ChatMembersSelector
						:customElements="collapsedUsers"
						:chatMembers="chatMembers"
						:allowTeamsSelect="true"
						@membersChange="onMembersChange"
					/>
				</div>
				<RightsSection
					:chatType="ChatType.channel"
					:ownerId="rights.ownerId"
					:managerIds="rights.managerIds"
					:manageUsersAdd="rights.manageUsersAdd"
					:manageUsersDelete="rights.manageUsersDelete"
					:manageUi="rights.manageUi"
					:manageMessages="rights.manageMessages"
					@ownerChange="onOwnerChange"
					@managersChange="onManagersChange"
					@manageUsersAddChange="onManageUsersAddChange"
					@manageUsersDeleteChange="onManageUsersDeleteChange"
					@manageUiChange="onManageUiChange"
					@manageMessagesChange="onManageMessagesChange"
				/>
			</template>
		</div>
		<ButtonPanel
			:isCreating="isLoading || isUpdating"
			:createButtonTitle="loc('IM_UPDATE_CONFIRM')"
			@create="onUpdateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const CollabUpdating = {
		name: 'CollabUpdating',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			TextareaInput: im_v2_component_content_chatForms_elements.TextareaInput,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading,
			RightsSection
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isUpdating: false,
				avatarFile: null,
				avatarUrl: '',
				chatTitle: '',
				description: '',
				groupSettings: {
					ownerId: im_v2_application_core.Core.getUserId(),
					moderatorMembers: [],
					options: null,
					permissions: null,
					isModified: false
				}
			};
		},
		computed: {
			EmptyAvatarType: () => im_v2_component_elements_avatar.EmptyAvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			collabId() {
				const {
					collabId
				} = this.$store.getters['chats/collabs/getByChatId'](this.chatId);
				return collabId;
			},
			updateButtonColorScheme() {
				return {
					borderColor: im_v2_const.Color.transparent,
					backgroundColor: im_v2_const.Color.collab60,
					iconColor: im_v2_const.Color.white,
					textColor: im_v2_const.Color.white,
					hoverColor: im_v2_const.Color.collab50
				};
			}
		},
		created() {
			this.fillForm();
			this.initDiffManager();
		},
		methods: {
			initDiffManager() {
				this.memberDiffManager = new ChatMemberDiffManager();
				const managersWithoutOwner = this.dialog.managerList.filter(managerId => {
					return managerId !== im_v2_application_core.Core.getUserId();
				});
				this.memberDiffManager.setInitialManagers(managersWithoutOwner);
			},
			async fillForm() {
				this.chatTitle = this.dialog.name;
				this.avatarUrl = this.dialog.avatar;
				this.description = this.dialog.description;
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				this.avatarUrl = '';
			},
			onDescriptionChange(description) {
				this.description = description;
			},
			onRightsChange(rights) {
				const {
					ownerId,
					moderators,
					permissions,
					options
				} = rights;
				this.groupSettings.ownerId = ownerId;
				this.groupSettings.moderatorMembers = moderators;
				this.groupSettings.permissions = permissions;
				this.groupSettings.options = options;
				this.groupSettings.isModified = true;
			},
			async onUpdateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatEdit.onSubmitForm(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				this.isUpdating = true;
				let payload = {
					title: this.chatTitle,
					avatar: this.avatarFile,
					description: this.description
				};
				if (this.groupSettings.isModified) {
					const groupSettings = {
						ownerId: this.groupSettings.ownerId,
						options: this.groupSettings.options,
						permissions: this.groupSettings.permissions,
						addModeratorMembers: this.memberDiffManager.getAddedManagers(this.groupSettings.moderatorMembers),
						deleteModeratorMembers: this.memberDiffManager.getDeletedManagers(this.groupSettings.moderatorMembers)
					};
					payload = {
						...payload,
						groupSettings
					};
				}
				try {
					await this.getChatService().updateCollab(this.dialogId, payload);
					this.isUpdating = false;
					void im_public.Messenger.openChat(this.dialogId);
				} catch {
					this.isUpdating = false;
				}
			},
			onCancelClick() {
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				void im_public.Messenger.openChat(this.dialogId);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --collab">
			<div class="bx-im-content-chat-forms__header">
				<ChatAvatar
					:avatarFile="avatarFile"
					:existingAvatarUrl="avatarUrl"
					:chatTitle="chatTitle"
					:type="EmptyAvatarType.collab"
					@avatarChange="onAvatarChange"
				/>
				<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_COLLAB_TITLE_PLACEHOLDER')" />
			</div>
			<CreateChatHeading :text="loc('IM_CREATE_COLLAB_DESCRIPTION_TITLE')" />
			<div class="bx-im-content-chat-forms__description_container">
				<TextareaInput
					:value="description"
					:placeholder="loc('IM_CREATE_COLLAB_DESCRIPTION_PLACEHOLDER')"
					:border="false"
					@input="onDescriptionChange"
				/>
			</div>
			<RightsSection :collabId="collabId" @change="onRightsChange" />
		</div>
		<ButtonPanel
			:isCreating="isUpdating"
			:createButtonTitle="loc('IM_UPDATE_CONFIRM')"
			:createButtonColorScheme="updateButtonColorScheme"
			@create="onUpdateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const CollabChatUpdating = {
		name: 'CollabChatUpdating',
		components: {
			TitleInput: im_v2_component_content_chatForms_elements.TitleInput,
			ChatAvatar: im_v2_component_content_chatForms_elements.ChatAvatar,
			ButtonPanel: im_v2_component_content_chatForms_elements.ButtonPanel,
			CreateChatHeading: im_v2_component_content_chatForms_elements.CreateChatHeading,
			ChatMembersSelector: im_v2_component_content_chatForms_elements.ChatMembersSelector,
			SettingsSection: im_v2_component_content_chatForms_elements.SettingsSection,
			RightsSection: im_v2_component_content_chatForms_elements.RightsSection
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isLoading: true,
				isUpdating: false,
				areUsersCollapsed: false,
				collapsedUsersCount: 0,
				avatarFile: null,
				avatarUrl: '',
				chatTitle: '',
				chatMembers: [],
				settings: {
					description: ''
				},
				rights: {
					ownerId: 0,
					managerIds: [],
					manageUsersAdd: '',
					manageUsersDelete: '',
					manageUi: '',
					manageMessages: ''
				}
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatId() {
				return this.dialog.chatId;
			},
			collapsedUsers() {
				if (!this.areUsersCollapsed) {
					return [];
				}
				const title = this.loc('IM_UPDATE_GROUP_CHAT_COLLAPSED_ELEMENT', {
					'#COUNT#': this.collapsedUsersCount
				});
				const element = getCollapsedUsersElement({
					title,
					onclick: this.onCollapsedUsersClick
				});
				return [element];
			}
		},
		async created() {
			await this.fillForm();
			this.memberDiffManager = new ChatMemberDiffManager();
			this.memberDiffManager.setInitialChatMembers(this.chatMembers);
			this.memberDiffManager.setInitialManagers(this.rights.managerIds);
			this.isLoading = false;
		},
		methods: {
			onMembersChange(currentTags) {
				this.chatMembers = currentTags;
			},
			onOwnerChange(ownerId) {
				this.rights.ownerId = ownerId;
			},
			onManagersChange(managerIds) {
				this.rights.managerIds = managerIds;
			},
			onManageUsersAddChange(newValue) {
				this.rights.manageUsersAdd = newValue;
			},
			onManageUsersDeleteChange(newValue) {
				this.rights.manageUsersDelete = newValue;
			},
			onManageUiChange(newValue) {
				this.rights.manageUi = newValue;
			},
			onManageMessagesChange(newValue) {
				this.rights.manageMessages = newValue;
			},
			onDescriptionChange(description) {
				this.settings.description = description;
			},
			async fillForm() {
				this.chatTitle = this.dialog.name;
				this.avatarUrl = this.dialog.avatar;
				this.settings.description = this.dialog.description;
				this.chatMembers = await this.getMemberEntities();
				this.rights.ownerId = this.dialog.ownerId;
				this.rights.manageMessages = this.dialog.permissions.manageMessages;
				this.rights.managerIds = this.dialog.managerList;
				this.rights.manageUi = this.dialog.permissions.manageUi;
				this.rights.manageUsersAdd = this.dialog.permissions.manageUsersAdd;
				this.rights.manageUsersDelete = this.dialog.permissions.manageUsersDelete;
			},
			async getMemberEntities() {
				const {
					memberEntities,
					areUsersCollapsed,
					userCount
				} = await this.getChatService().getMemberEntities(this.chatId);
				if (areUsersCollapsed) {
					this.areUsersCollapsed = true;
					this.collapsedUsersCount = userCount;
					return memberEntities;
				}
				return memberEntities;
			},
			async onUpdateClick() {
				im_v2_lib_analytics.Analytics.getInstance().chatEdit.onSubmitForm(this.dialogId);
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				this.isUpdating = true;
				await this.getChatService().updateChat(this.chatId, {
					title: this.chatTitle,
					avatar: this.avatarFile,
					addedMemberEntities: this.memberDiffManager.getAddedMemberEntities(this.chatMembers),
					deletedMemberEntities: this.memberDiffManager.getDeletedMemberEntities(this.chatMembers),
					addedManagers: this.memberDiffManager.getAddedManagers(this.rights.managerIds),
					deletedManagers: this.memberDiffManager.getDeletedManagers(this.rights.managerIds),
					ownerId: this.rights.ownerId,
					description: this.settings.description,
					manageUsersAdd: this.rights.manageUsersAdd,
					manageUsersDelete: this.rights.manageUsersDelete,
					manageUi: this.rights.manageUi,
					manageMessages: this.rights.manageMessages
				}).catch(() => {
					this.isUpdating = false;
				});
				this.isUpdating = false;
				return im_public.Messenger.openChat(this.dialogId);
			},
			onCancelClick() {
				im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(this.dialogId);
				void im_public.Messenger.openChat(this.dialogId);
			},
			onAvatarChange(newAvatarFile) {
				this.avatarFile = newAvatarFile;
				this.avatarUrl = '';
			},
			onScroll() {
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersAddMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUsersDeleteMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageUiMenu)?.close();
				main_popup.MenuManager.getMenuById(im_v2_const.PopupType.createChatManageMessagesMenu)?.close();
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			async onCollapsedUsersClick() {
				const confirmResult = await im_v2_lib_confirm.showExitUpdateChatConfirm(this.dialogId);
				if (!confirmResult) {
					return;
				}
				await this.onUpdateClick();
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__content --chat" @scroll="onScroll">
			<div v-if="isLoading" class="bx-im-content-chat-forms__skeleton"></div>
			<template v-else>
				<div class="bx-im-content-chat-forms__header">
					<ChatAvatar
						:avatarFile="avatarFile"
						:existingAvatarUrl="avatarUrl"
						:chatTitle="chatTitle"
						@avatarChange="onAvatarChange"
					/>
					<TitleInput v-model="chatTitle" :placeholder="loc('IM_CREATE_CHAT_TITLE_PLACEHOLDER')" />
				</div>
				<CreateChatHeading :text="loc('IM_CREATE_CHAT_MEMBERS_TITLE')" />
				<div class="bx-im-content-chat-forms__members_container">
					<ChatMembersSelector
						:customElements="collapsedUsers"
						:chatMembers="chatMembers"
						:allowTeamsSelect="dialog.type !== ChatType.videoconf"
						@membersChange="onMembersChange"
					/>
				</div>
				<SettingsSection
					:description="settings.description"
					:withSearchOption="false"
					:withAutoDeleteOption="false"
					@descriptionChange="onDescriptionChange"
				/>
				<RightsSection
					:ownerId="rights.ownerId"
					:managerIds="rights.managerIds"
					:manageUsersAdd="rights.manageUsersAdd"
					:manageUsersDelete="rights.manageUsersDelete"
					:manageUi="rights.manageUi"
					:manageMessages="rights.manageMessages"
					@ownerChange="onOwnerChange"
					@managersChange="onManagersChange"
					@manageUsersAddChange="onManageUsersAddChange"
					@manageUsersDeleteChange="onManageUsersDeleteChange"
					@manageUiChange="onManageUiChange"
					@manageMessagesChange="onManageMessagesChange"
				/>
			</template>
		</div>
		<ButtonPanel
			:isCreating="isUpdating || isLoading"
			:createButtonTitle="loc('IM_UPDATE_CONFIRM')"
			@create="onUpdateClick"
			@cancel="onCancelClick"
		/>
	`
	};

	// @vue/component
	const UpdateChatContent = {
		name: 'UpdateChatContent',
		components: {
			GroupChatUpdating,
			ChannelUpdating,
			CollabUpdating,
			CollabChatUpdating
		},
		props: {
			entityId: {
				type: String,
				required: true
			}
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			chat() {
				return this.$store.getters['chats/get'](this.entityId, true);
			},
			parentChat() {
				if (this.chat.parentChatId === 0) {
					return null;
				}
				return this.$store.getters['chats/getByChatId'](this.chat.parentChatId);
			},
			isChannel() {
				const editableChannelTypes = new Set([im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel]);
				return editableChannelTypes.has(this.chat.type);
			},
			isChat() {
				const editableChatTypes = new Set([im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.videoconf]);
				return editableChatTypes.has(this.chat.type) && !this.parentChat;
			},
			isCollab() {
				return this.chat.type === im_v2_const.ChatType.collab;
			},
			isCollabNestedChat() {
				if (!this.parentChat) {
					return false;
				}
				return this.parentChat.type === im_v2_const.ChatType.collab;
			}
		},
		template: `
		<div class="bx-im-content-chat-forms__container">
			<GroupChatUpdating v-if="isChat" :dialogId="entityId" />
			<ChannelUpdating v-else-if="isChannel" :dialogId="entityId" />
			<CollabUpdating v-else-if="isCollab" :dialogId="entityId" />
			<CollabChatUpdating v-else-if="isCollabNestedChat" :dialogId="entityId" />
		</div>
	`
	};

	exports.CreateChatContent = CreateChatContent;
	exports.UpdateChatContent = UpdateChatContent;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Event, BX.Main, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX, BX.Messenger.v2.Lib, BX.Socialnetwork.Collab, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
