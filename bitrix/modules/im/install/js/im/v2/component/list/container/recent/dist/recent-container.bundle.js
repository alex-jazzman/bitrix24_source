/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_component_list_items_recent, im_v2_component_search, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_logger, im_v2_component_list_container_elements_filterRow, im_v2_component_list_container_elements_headerMenu, im_v2_component_list_container_elements_vibeCodeCatalogButton, ui_infoHelper, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_menu_vue, im_public, im_v2_component_elements_copilotRolesDialog, im_v2_component_elements_menu, im_v2_component_list_container_elements_createChatPromo, im_v2_lib_createChat, im_v2_lib_permission, im_v2_lib_promo, im_v2_provider_service_copilot, im_v2_lib_copilot, im_v2_lib_helpdesk, im_v2_lib_invite) {
	'use strict';

	// @vue/component
	const DescriptionBanner = {
		name: 'DescriptionBanner',
		emits: ['close'],
		computed: {
			preparedText() {
				return main_core.Loc.getMessage('IM_RECENT_CREATE_COLLAB_DESCRIPTION_BANNER', {
					'[color_highlight]': '<span class="bx-im-create-chat-menu-description-banner__highlight">',
					'[/color_highlight]': '</span>'
				});
			},
			closeAriaLabel() {
				return main_core.Loc.getMessage('IM_RECENT_CREATE_COLLAB_DESCRIPTION_BANNER_CLOSE_ARIA');
			}
		},
		template: `
		<div class="bx-im-create-chat-menu-description-banner__container">
			<div class="bx-im-create-chat-menu-description-banner__content" v-html="preparedText"></div>
			<div
				class="bx-im-create-chat-menu-description-banner__close-icon --focus-visible"
				role="button"
				tabindex="0"
				:aria-label="closeAriaLabel"
				@click.stop="$emit('close')"
				@keydown.enter.prevent="$emit('close')"
				@keydown.space.prevent="$emit('close')"
			></div>
		</div>
	`
	};

	// @vue/component
	const CopilotRoleSelectionButton = {
		name: 'CopilotRoleSelectionButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			title() {
				return this.loc('IM_RECENT_CREATE_COPILOT_ROLE_SELECTION_TITLE_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			handleActivationKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					// Synthesize the native click the mouse path uses: the parent binds @click.stop,
					// which falls through to this root element.
					event.preventDefault();
					this.$el.click();
				}
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			class="bx-im-create-chat-menu-item__button --copilot --focus-visible"
			data-testid="im-copilot-role-selection-button"
			:title="title"
			role="button"
			tabindex="0"
			@keydown="handleActivationKeydown"
		>
			<BIcon
				:name="OutlineIcons.MORE_L"
				:hoverable="true"
				class="bx-im-create-chat-menu-item__icon-more"
			/>
		</div>
	`
	};

	const HELP_ARTICLE_CODE = '17412872';

	// @vue/component
	const CreateChatHelp = {
		emits: ['articleOpen'],
		data() {
			return {};
		},
		methods: {
			openHelpArticle() {
				im_v2_lib_helpdesk.openHelpdeskArticle(HELP_ARTICLE_CODE);
				this.$emit('articleOpen');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-create-chat-help__container">
			<div
				class="bx-im-create-chat-help__content --focus-visible"
				data-testid="im-create-chat-help"
				role="button"
				tabindex="0"
				@click="openHelpArticle"
				@keydown.enter.prevent="openHelpArticle"
				@keydown.space.prevent="openHelpArticle"
			>
				<div class="bx-im-create-chat-help__icon"></div>
				<div class="bx-im-create-chat-help__text">{{ loc('IM_RECENT_CREATE_CHAT_WHAT_TO_CHOOSE') }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const InvitePromo = {
		name: 'InvitePromo',
		emits: ['close'],
		methods: {
			onContainerClick() {
				const analyticsContext = im_v2_lib_analytics.Analytics.getInstance().sliderInvite.getRecentCreateMenuContext();
				im_v2_lib_invite.InviteManager.openInviteSlider(analyticsContext);
			},
			onCloseClick() {
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.recentCreateChatInviteUsers);
				this.$emit('close');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-recent-invite-promo">
			<div
				class="bx-im-recent-invite-promo__container --focus-visible"
				data-testid="im-invite-promo"
				role="button"
				tabindex="0"
				@click="onContainerClick"
				@keydown.enter.prevent="onContainerClick"
				@keydown.space.prevent="onContainerClick"
			>
				<div class="bx-im-recent-invite-promo__icon"></div>
				<div class="bx-im-recent-invite-promo__content">
					<div class="bx-im-recent-invite-promo__title">
						{{ loc('IM_RECENT_CREATE_INVITE_TITLE') }}
					</div>
					<div class="bx-im-recent-invite-promo__subtitle">
						{{ loc('IM_RECENT_CREATE_INVITE_SUBTITLE') }}
					</div>
				</div>
			</div>
			<div
				class="bx-im-recent-invite-promo__close-icon --focus-visible"
				data-testid="im-invite-promo-close"
				role="button"
				tabindex="0"
				:aria-label="loc('IM_RECENT_CREATE_INVITE_CLOSE_ARIA')"
				@click.stop="onCloseClick"
				@keydown.enter.prevent.stop="onCloseClick"
				@keydown.space.prevent.stop="onCloseClick"
			></div>
		</div>
	`
	};

	const MENU_ID = 'im-create-chat-menu';
	const MENU_WIDTH = 290;
	const MENU_OFFSET_TOP = 4;
	const HELP_SECTION_CODE = 'help';
	const HELP_ITEM_ID = 'im-create-chat-help';

	// @vue/component
	const CreateChatMenuAir = {
		name: 'CreateChatMenuAir',
		components: {
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			/** @type CreateChatMenuAirItem[] */
			items: {
				type: Array,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				default: null
			}
		},
		emits: ['select', 'close'],
		computed: {
			menuOptions() {
				return {
					id: MENU_ID,
					width: MENU_WIDTH,
					offsetTop: MENU_OFFSET_TOP,
					bindElement: this.bindElement,
					// The titleless section is the separator between the ways to create a chat
					// and the article that helps to choose one.
					sections: [{
						code: HELP_SECTION_CODE
					}],
					items: [...this.createItems, this.helpItem]
				};
			},
			createItems() {
				return this.items.map(item => {
					return {
						id: item.id,
						title: item.title,
						subtitle: item.subtitle,
						design: item.design,
						icon: item.icon,
						isLocked: item.isLocked,
						disabled: item.disabled,
						onClick: () => this.$emit('select', item.id)
					};
				});
			},
			helpItem() {
				return {
					id: HELP_ITEM_ID,
					sectionCode: HELP_SECTION_CODE,
					title: this.loc('IM_RECENT_CREATE_CHAT_WHAT_TO_CHOOSE'),
					design: ui_system_menu_vue.MenuItemDesign.Accent2,
					icon: ui_iconSet_api_vue.Outline.INFO_CIRCLE,
					onClick: () => this.openHelpArticle()
				};
			}
		},
		methods: {
			openHelpArticle() {
				im_v2_lib_helpdesk.openHelpdeskArticle(HELP_ARTICLE_CODE);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BMenu :options="menuOptions" @close="$emit('close')"/>
	`
	};

	const PromoByChatType = {
		[im_v2_const.ChatType.chat]: im_v2_const.PromoId.createGroupChat,
		[im_v2_const.ChatType.videoconf]: im_v2_const.PromoId.createConference,
		[im_v2_const.ChatType.channel]: im_v2_const.PromoId.createChannel
	};
	const AirMenuItemId = Object.freeze({
		chat: 'im-create-chat-menu-item-chat',
		copilot: 'im-create-chat-menu-item-copilot',
		channel: 'im-create-chat-menu-item-channel',
		collab: 'im-create-chat-menu-item-collab',
		conference: 'im-create-chat-menu-item-conference',
		folder: 'im-create-chat-menu-item-folder'
	});

	// @vue/component
	const CreateChatMenu = {
		components: {
			MessengerMenu: im_v2_component_elements_menu.MessengerMenu,
			MenuItem: im_v2_component_elements_menu.MenuItem,
			CreateChatHelp,
			CreateChatPromo: im_v2_component_list_container_elements_createChatPromo.CreateChatPromo,
			CopilotRoleSelectionButton,
			CopilotRolesDialog: im_v2_component_elements_copilotRolesDialog.CopilotRolesDialog,
			InvitePromo,
			DescriptionBanner,
			CreateChatMenuAir,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		data() {
			return {
				showMenu: false,
				chatTypeToCreate: '',
				showCreateChatPromo: false,
				showInvitePromo: false,
				showCopilotRolesDialog: false,
				showCollabPromo: false,
				isLoading: false,
				airMenuItems: []
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			MenuItemIcon: () => im_v2_component_elements_menu.MenuItemIcon,
			Outline: () => ui_iconSet_api_vue.Outline,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			hasMenuAccess() {
				const actions = [this.canCreateChat, this.canCreateChannel, this.canCreateConference, this.isCollabAvailable, this.isFolderAvailable];
				return actions.includes(true);
			},
			menuConfig() {
				return {
					id: 'im-create-chat-menu',
					width: 275,
					bindElement: this.$refs.icon || {},
					offsetTop: 4,
					padding: 0
				};
			},
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			},
			isFolderAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable);
			},
			isBitrixGptV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			},
			copilotIcon() {
				if (this.isBitrixGptV2Available) {
					return im_v2_component_elements_menu.MenuItemIcon.aiAssistant;
				}
				return im_v2_component_elements_menu.MenuItemIcon.copilot;
			},
			isCollabV2AvailableByTariff() {
				return im_v2_lib_feature.TariffManager.collabV2.isAvailable();
			},
			isCollabAvailable() {
				const hasAccess = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
				const creationAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabCreationAvailable);
				const featureAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabAvailable);
				return hasAccess && featureAvailable && creationAvailable;
			},
			isCopilotAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable);
			},
			isCopilotActive() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive);
			},
			isCopilotAvailableAndCreatable() {
				return this.isCopilotAvailable && this.canCreateCopilot;
			},
			canCreateChat() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
			},
			canCreateCopilot() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCopilot);
			},
			canCreateChannel() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createChannel);
			},
			canCreateConference() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createConference);
			},
			iconStatusClasses() {
				return {
					'--default': !this.isLoading,
					'--loading': this.isLoading
				};
			},
			createCopilotTitle() {
				return this.loc('IM_RECENT_CREATE_COPILOT_TITLE_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			}
		},
		watch: {
			showMenu(isVisible) {
				if (!isVisible) {
					this.airMenuItems = [];
				}
			}
		},
		created() {
			this.showCollabPromo = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.createCollabDescription);
			this.showInvitePromo = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.recentCreateChatInviteUsers);
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			onChatCreateClick(type) {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(type);
				this.chatTypeToCreate = type;
				const promoBannerIsNeeded = im_v2_lib_promo.PromoManager.getInstance().needToShow(this.getPromoType());
				if (promoBannerIsNeeded) {
					this.showCreateChatPromo = true;
					this.showMenu = false;
					return;
				}
				this.startChatCreation();
				this.showMenu = false;
			},
			onFolderCreateClick() {
				im_v2_lib_analytics.Analytics.getInstance().folder.onClickCreateFolder(im_v2_lib_analytics.AnalyticsSection.createMenu);
				im_v2_lib_folder.FolderManager.startCreation();
				this.showMenu = false;
			},
			onCollabV2CreateClick() {
				if (!this.isCollabV2AvailableByTariff) {
					im_v2_lib_feature.TariffManager.collabV2.openFeatureSlider();
					return;
				}
				this.onChatCreateClick(im_v2_const.ChatType.collab);
			},
			onAirMenuItemSelect(itemId) {
				const scenarios = {
					[AirMenuItemId.chat]: () => this.onChatCreateClick(im_v2_const.ChatType.chat),
					[AirMenuItemId.copilot]: () => {
						void this.onDefaultCopilotCreateClick();
					},
					[AirMenuItemId.channel]: () => this.onChatCreateClick(im_v2_const.ChatType.channel),
					[AirMenuItemId.collab]: () => {
						if (this.isCollabV2Available) {
							this.onCollabV2CreateClick();
							return;
						}
						this.onChatCreateClick(im_v2_const.ChatType.collab);
					},
					[AirMenuItemId.conference]: () => this.onChatCreateClick(im_v2_const.ChatType.videoconf),
					[AirMenuItemId.folder]: () => this.onFolderCreateClick()
				};
				scenarios[itemId]?.();
			},
			showCopilotPromoter() {
				const promoter = new ui_infoHelper.FeaturePromoter({
					code: im_v2_const.SliderCode.copilotDisabled
				});
				promoter.show();
			},
			checkCopilotActive() {
				if (!this.isCopilotActive) {
					this.showCopilotPromoter();
					return false;
				}
				return true;
			},
			async onDefaultCopilotCreateClick() {
				if (!this.checkCopilotActive()) {
					return;
				}
				this.showMenu = false;
				if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable)) {
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateDefaultChatInRecent();
					void im_public.Messenger.openCopilot();
					return;
				}
				this.isLoading = true;
				try {
					const newDialogId = await this.getCopilotChatService().createDefaultChat();
					im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChat(newDialogId);
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateDefaultChatInRecent();
					this.isLoading = false;
					void im_public.Messenger.openChat(newDialogId);
				} catch {
					this.isLoading = false;
				}
			},
			onCollabDescriptionClose() {
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.createCollabDescription);
				this.showCollabPromo = false;
			},
			onCopilotRoleSelectClick() {
				if (!this.checkCopilotActive()) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().copilot.onSelectRoleInRecent();
				this.showCopilotRolesDialog = true;
			},
			async onCopilotDialogSelectRole(role) {
				if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable) && role.code === im_v2_const.CopilotRole.universalCode) {
					this.showMenu = false;
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateDefaultChatInRecent();
					void im_public.Messenger.openCopilot();
					return;
				}
				await this.createCopilotChat(role.code);
			},
			async createCopilotChat(roleCode) {
				this.showMenu = false;
				this.isLoading = true;
				try {
					const newDialogId = await this.getCopilotChatService().createChat({
						roleCode
					});
					im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChat(newDialogId);
					im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(newDialogId);
					this.isLoading = false;
					void im_public.Messenger.openChat(newDialogId);
				} catch {
					this.isLoading = false;
				}
			},
			onPromoContinueClick() {
				im_v2_lib_promo.PromoManager.getInstance().markAsWatched(this.getPromoType());
				this.startChatCreation();
				this.showCreateChatPromo = false;
				this.showMenu = false;
				this.chatTypeToCreate = '';
			},
			startChatCreation() {
				if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreationLayoutActive(this.chatTypeToCreate)) {
					return;
				}
				void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(this.chatTypeToCreate);
			},
			getPromoType() {
				return PromoByChatType[this.chatTypeToCreate] ?? '';
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			getCopilotChatService() {
				if (!this.copilotService) {
					this.copilotService = new im_v2_provider_service_copilot.CopilotChatService();
				}
				return this.copilotService;
			},
			collectAirMenuItems() {
				const items = [];
				if (this.canCreateChat) {
					items.push({
						id: AirMenuItemId.chat,
						title: this.loc('IM_RECENT_CREATE_GROUP_CHAT_TITLE_V2'),
						subtitle: this.loc('IM_RECENT_CREATE_GROUP_CHAT_SUBTITLE_MSGVER_1'),
						design: ui_system_menu_vue.MenuItemDesign.Default,
						icon: ui_iconSet_api_vue.Outline.CHATS
					});
				}
				if (this.isCopilotAvailableAndCreatable) {
					items.push({
						id: AirMenuItemId.copilot,
						title: this.createCopilotTitle,
						subtitle: this.loc('IM_RECENT_CREATE_COPILOT_SUBTITLE_MSGVER_1'),
						// The design paints the icon, so it needs no chat type.
						design: this.isBitrixGptV2Available ? ui_system_menu_vue.MenuItemDesign.BitrixGPT : ui_system_menu_vue.MenuItemDesign.Copilot,
						icon: this.isBitrixGptV2Available ? ui_iconSet_api_vue.Outline.BITRIX_GPT : ui_iconSet_api_vue.Outline.COPILOT
					});
				}
				if (this.canCreateChannel) {
					items.push({
						id: AirMenuItemId.channel,
						title: this.loc('IM_RECENT_CREATE_CHANNEL_TITLE_V2'),
						subtitle: this.loc('IM_RECENT_CREATE_CHANNEL_SUBTITLE_MSGVER_1'),
						design: ui_system_menu_vue.MenuItemDesign.Default,
						icon: ui_iconSet_api_vue.Outline.SPEAKER
					});
				}
				if (this.isCollabAvailable) {
					if (this.isCollabV2Available) {
						items.push({
							id: AirMenuItemId.collab,
							title: this.loc('IM_RECENT_CREATE_COLLAB_V2_TITLE'),
							subtitle: this.loc('IM_RECENT_CREATE_COLLAB_V2_SUBTITLE'),
							design: ui_system_menu_vue.MenuItemDesign.Default,
							icon: ui_iconSet_api_vue.Outline.COLLAB,
							isLocked: !this.isCollabV2AvailableByTariff,
							disabled: !this.isCollabV2AvailableByTariff
						});
					} else {
						items.push({
							id: AirMenuItemId.collab,
							title: this.loc('IM_RECENT_CREATE_COLLAB_TITLE'),
							subtitle: this.loc('IM_RECENT_CREATE_COLLAB_SUBTITLE_MSGVER_1'),
							design: ui_system_menu_vue.MenuItemDesign.Default,
							icon: ui_iconSet_api_vue.Outline.COLLAB
						});
					}
				}
				if (this.canCreateConference) {
					items.push({
						id: AirMenuItemId.conference,
						title: this.loc('IM_RECENT_CREATE_CONFERENCE_TITLE'),
						subtitle: this.loc('IM_RECENT_CREATE_CONFERENCE_SUBTITLE_MSGVER_1'),
						design: ui_system_menu_vue.MenuItemDesign.Default,
						icon: ui_iconSet_api_vue.Outline.RECORD_VIDEO
					});
				}
				if (this.isFolderAvailable) {
					items.push({
						id: AirMenuItemId.folder,
						title: this.loc('IM_RECENT_CREATE_FOLDER_TITLE'),
						subtitle: this.loc('IM_RECENT_CREATE_FOLDER_SUBTITLE'),
						design: ui_system_menu_vue.MenuItemDesign.Default,
						icon: ui_iconSet_api_vue.Outline.FOLDER
					});
				}
				return items;
			},
			handleShowPopup() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onMenuCreateClick();
				if (this.isAirDesignEnabled) {
					// The set is taken once, so the items do not change under an open menu.
					this.airMenuItems = ui_vue3.markRaw(this.collectAirMenuItems());
				}
				this.showMenu = true;
			}
		},
		template: `
		<!-- In the Air branch BMenu owns aria-expanded (it restores the attribute it saw before showing), so Vue must not render it. -->
		<div
			v-if="hasMenuAccess"
			class="bx-im-list-container-recent__create-chat_icon --focus-visible"
			:class="{'--active': showMenu}"
			role="button"
			tabindex="0"
			data-testid="im-create-chat-menu-trigger"
			:aria-label="loc('IM_RECENT_CREATE_CHAT_MENU_BUTTON_ARIA')"
			:aria-expanded="isAirDesignEnabled ? null : showMenu"
			:aria-haspopup="isAirDesignEnabled ? 'menu' : null"
			@click="handleShowPopup"
			@keydown.enter.prevent="handleShowPopup"
			@keydown.space.prevent="handleShowPopup"
			ref="icon"
		>
			<BIcon
				v-if="isAirDesignEnabled && !isLoading"
				:name="Outline.CREATE_CHAT"
				class="bx-im-list-container-recent__create-chat_icon-air"
			/>
			<div
				v-else
				class="bx-im-list-container-recent__create-chat_icon_status"
				:class="iconStatusClasses"
			></div>
		</div>
		<template v-if="!isAirDesignEnabled">
		<MessengerMenu v-if="showMenu" :config="menuConfig" @close="showMenu = false">
			<MenuItem
				v-if="canCreateChat"
				data-testid="im-create-chat-menu-item-chat"
				:icon="MenuItemIcon.chat"
				:title="loc('IM_RECENT_CREATE_GROUP_CHAT_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_GROUP_CHAT_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.chat)"
			/>
			<MenuItem
				v-if="isCopilotAvailableAndCreatable"
				data-testid="im-create-chat-menu-item-copilot"
				:icon="copilotIcon"
				:title="createCopilotTitle"
				:subtitle="loc('IM_RECENT_CREATE_COPILOT_SUBTITLE_MSGVER_1')"
				hasInteractiveAfterContent
				@click.stop="onDefaultCopilotCreateClick"
			>
				<template #after-content>
					<CopilotRoleSelectionButton @click.stop="onCopilotRoleSelectClick" />
				</template>
			</MenuItem>
			<MenuItem
				v-if="canCreateChannel"
				data-testid="im-create-chat-menu-item-channel"
				:icon="MenuItemIcon.channel"
				:title="loc('IM_RECENT_CREATE_CHANNEL_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_CHANNEL_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.channel)"
			/>
			<template v-if="isCollabAvailable">
				<MenuItem
					v-if="isCollabV2Available"
					:disabled="!isCollabV2AvailableByTariff"
					data-testid="im-create-chat-menu-item-collab"
					:icon="MenuItemIcon.collabV2"
					:title="loc('IM_RECENT_CREATE_COLLAB_V2_TITLE')"
					:subtitle="loc('IM_RECENT_CREATE_COLLAB_V2_SUBTITLE')"
					@click="onCollabV2CreateClick"
				/>
				<MenuItem
					v-else
					data-testid="im-create-chat-menu-item-collab"
					:icon="MenuItemIcon.collab"
					:title="loc('IM_RECENT_CREATE_COLLAB_TITLE')"
					:subtitle="loc('IM_RECENT_CREATE_COLLAB_SUBTITLE_MSGVER_1')"
					@click="onChatCreateClick(ChatType.collab)"
				>
					<template #below-content>
						<DescriptionBanner v-if="showCollabPromo" @close="onCollabDescriptionClose"/>
					</template>
				</MenuItem>
			</template>
			<MenuItem
				v-if="canCreateConference"
				data-testid="im-create-chat-menu-item-conference"
				:icon="MenuItemIcon.conference"
				:title="loc('IM_RECENT_CREATE_CONFERENCE_TITLE')"
				:subtitle="loc('IM_RECENT_CREATE_CONFERENCE_SUBTITLE_MSGVER_1')"
				:withBottomBorder="showInvitePromo"
				@click="onChatCreateClick(ChatType.videoconf)"
			/>
			<MenuItem
				v-if="isFolderAvailable"
				:icon="MenuItemIcon.folder"
				:title="loc('IM_RECENT_CREATE_FOLDER_TITLE')"
				:subtitle="loc('IM_RECENT_CREATE_FOLDER_SUBTITLE')"
				data-testid="im-create-chat-menu-item-folder"
				@click="onFolderCreateClick"
			/>
			<InvitePromo v-if="showInvitePromo" @close="showInvitePromo = false" />
			<template #footer>
				<CreateChatHelp @articleOpen="showMenu = false" />
			</template>
		</MessengerMenu>
		</template>
		<CreateChatMenuAir
			v-else-if="showMenu"
			:items="airMenuItems"
			:bindElement="$refs.icon"
			@select="onAirMenuItemSelect"
			@close="showMenu = false"
		/>
		<CreateChatPromo
			v-if="showCreateChatPromo"
			:chatType="chatTypeToCreate"
			@continue="onPromoContinueClick"
			@close="showCreateChatPromo = false"
		/>
		<CopilotRolesDialog
			v-if="showCopilotRolesDialog"
			@selectRole="onCopilotDialogSelectRole"
			@close="showCopilotRolesDialog = false"
		/>
	`
	};

	// @vue/component
	const RecentListContainer = {
		name: 'RecentListContainer',
		components: {
			HeaderMenu: im_v2_component_list_container_elements_headerMenu.HeaderMenu,
			CreateChatMenu,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			FilterRow: im_v2_component_list_container_elements_filterRow.FilterRow,
			RecentList: im_v2_component_list_items_recent.RecentList,
			RecentSearch: im_v2_component_search.RecentSearch,
			RecentUnreadList: im_v2_component_list_items_recent.RecentUnreadList,
			VibeCodeCatalogButton: im_v2_component_list_container_elements_vibeCodeCatalogButton.VibeCodeCatalogButton
		},
		provide() {
			return {
				avatarsOnly: ui_vue3.computed(() => this.avatarsOnly)
			};
		},
		props: {
			avatarsOnly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				searchAreaId: main_core.Text.getRandom(),
				searchMode: false,
				unreadMode: false,
				searchQuery: '',
				isSearchLoading: false
			};
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			isShellNavigationAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable);
			},
			filterMode() {
				return this.unreadMode ? im_v2_component_list_container_elements_filterRow.FilterMode.unread : im_v2_component_list_container_elements_filterRow.FilterMode.all;
			},
			unreadCounter() {
				return this.$store.getters['counters/getTotalChatCounter'];
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Recent container created');
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			// This container is mounted not only in the chats layout: it also stands on the left in
			// notifications, in the chat and folder forms, in project copying and in the conference. The
			// emitted name goes straight into setLayout, so a hardcoded chats layout would drop the user
			// into a hidden section. Those layouts now pick their list by the same rule, so this line
			// serves the rollback branch alone - with the All folder in place the list is the one of the
			// All folder and it carries its own layout name.
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_lib_folder.FolderManager.getRegularChatsLayout().name,
					dialogId
				});
			},
			onOpenSearch() {
				if (!this.searchMode) {
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onOpen(this.layoutName);
				}
				this.searchMode = true;
			},
			onCloseSearch() {
				this.searchMode = false;
				this.searchQuery = '';
			},
			onCloseRecentSearch() {
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				this.onCloseSearch();
			},
			onUpdateSearch(query) {
				this.searchMode = true;
				this.searchQuery = query;
			},
			onDocumentClick(event) {
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['recent-container']);
				if (this.searchMode && !clickOnRecentContainer) {
					this.onCloseSearch();
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				}
			},
			onSearchLoading(value) {
				this.isSearchLoading = value;
			},
			onOpenSearchItem(event) {
				const {
					dialogId
				} = event;
				this.onSelectChat(dialogId);
			},
			onToggleUnreadMode() {
				this.unreadMode = !this.unreadMode;
			},
			onChangeFilterMode(mode) {
				this.unreadMode = mode === im_v2_component_list_container_elements_filterRow.FilterMode.unread;
				if (this.unreadMode) {
					im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode(im_v2_lib_analytics.AnalyticsSection.filterRow);
				}
			}
		},
		template: `
		<div class="bx-im-list-container-recent__scope bx-im-list-container-recent__container" data-testid="im-list-recent" ref="recent-container">
			<!-- In the compact collab peek the header is occluded by the drawer; keep it out of the tab order (mouse there is moot). -->
			<div
				class="bx-im-list-container-recent__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
				:inert="avatarsOnly || null"
			>
				<VibeCodeCatalogButton />
				<HeaderMenu
					v-if="!isShellNavigationAvailable"
					:unreadMode="unreadMode"
					:recentSection="RecentType.default"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-recent__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu />
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.default"
				:inert="avatarsOnly || null"
				:aria-hidden="avatarsOnly ? 'true' : null"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-recent__elements_container">
				<div class="bx-im-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode" 
						:searchMode="searchMode"
						:query="searchQuery"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-show="!searchMode && !unreadMode" @selectChat="onSelectChat" />
					<RecentUnreadList v-if="unreadMode" @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`
	};

	exports.CreateChatMenu = CreateChatMenu;
	exports.RecentListContainer = RecentListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.UI, BX.UI.IconSet, window, BX.UI.System.Menu, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=recent-container.bundle.js.map
