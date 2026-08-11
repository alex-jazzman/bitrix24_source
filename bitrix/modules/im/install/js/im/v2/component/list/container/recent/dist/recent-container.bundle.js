/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_component_list_items_recent, im_v2_component_search, im_v2_const, im_v2_lib_analytics, im_v2_lib_logger, im_v2_lib_permission, im_v2_component_list_container_elements_headerMenu, im_v2_component_list_container_elements_vibeCodeCatalogButton, ui_infoHelper, im_public, im_v2_component_elements_copilotRolesDialog, im_v2_component_elements_menu, im_v2_component_list_container_elements_createChatPromo, im_v2_lib_createChat, im_v2_lib_feature, im_v2_lib_promo, im_v2_provider_service_copilot, im_v2_lib_copilot, ui_iconSet_api_vue, im_v2_lib_helpdesk, im_v2_lib_invite) {
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
			}
		},
		template: `
		<div class="bx-im-create-chat-menu-description-banner__container">
			<div class="bx-im-create-chat-menu-description-banner__content" v-html="preparedText"></div>
			<div class="bx-im-create-chat-menu-description-banner__close-icon" @click.stop="$emit('close')"></div>
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
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-create-chat-menu-item__button --copilot" :title="title">
			<BIcon 
				:name="OutlineIcons.MORE_L" 
				:hoverable="true"
				class="bx-im-create-chat-menu-item__icon-more"
			/>
		</div>
	`
	};

	// @vue/component
	const CreateChatHelp = {
		emits: ['articleOpen'],
		data() {
			return {};
		},
		methods: {
			openHelpArticle() {
				const ARTICLE_CODE = '17412872';
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
				this.$emit('articleOpen');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-create-chat-help__container">
			<div @click="openHelpArticle" class="bx-im-create-chat-help__content">
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
		<div @click="onContainerClick" class="bx-im-recent-invite-promo__container">
			<div class="bx-im-recent-invite-promo__icon"></div>
			<div class="bx-im-recent-invite-promo__content">
				<div class="bx-im-recent-invite-promo__title">
					{{ loc('IM_RECENT_CREATE_INVITE_TITLE') }}
				</div>
				<div class="bx-im-recent-invite-promo__subtitle">
					{{ loc('IM_RECENT_CREATE_INVITE_SUBTITLE') }}
				</div>
			</div>
			<div @click.stop="onCloseClick" class="bx-im-recent-invite-promo__close-icon"></div>
		</div>
	`
	};

	const PromoByChatType = {
		[im_v2_const.ChatType.chat]: im_v2_const.PromoId.createGroupChat,
		[im_v2_const.ChatType.videoconf]: im_v2_const.PromoId.createConference,
		[im_v2_const.ChatType.channel]: im_v2_const.PromoId.createChannel
	};

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
			DescriptionBanner
		},
		data() {
			return {
				showMenu: false,
				chatTypeToCreate: '',
				showCreateChatPromo: false,
				showInvitePromo: false,
				showCopilotRolesDialog: false,
				showCollabPromo: false,
				isLoading: false
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			MenuItemIcon: () => im_v2_component_elements_menu.MenuItemIcon,
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
			collabAvailable() {
				const hasAccess = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
				const creationAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabCreationAvailable);
				const featureAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabAvailable);
				return hasAccess && featureAvailable && creationAvailable;
			},
			canCreateChat() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
			},
			canCreateCopilot() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCopilot);
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
			onCollabV2CreateClick() {
				if (!this.isCollabV2AvailableByTariff) {
					im_v2_lib_feature.TariffManager.collabV2.openFeatureSlider();
					return;
				}
				this.onChatCreateClick(im_v2_const.ChatType.collab);
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
			handleShowPopup() {
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onMenuCreateClick();
				this.showMenu = true;
			}
		},
		template: `
		<div
			class="bx-im-list-container-recent__create-chat_icon"
			:class="{'--active': showMenu}"
			@click="handleShowPopup"
			ref="icon"
		>
			<div
				class="bx-im-list-container-recent__create-chat_icon_status"
				:class="iconStatusClasses"
			></div>
		</div>
		<MessengerMenu v-if="showMenu" :config="menuConfig" @close="showMenu = false">
			<MenuItem
				v-if="canCreateChat"
				:icon="MenuItemIcon.chat"
				:title="loc('IM_RECENT_CREATE_GROUP_CHAT_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_GROUP_CHAT_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.chat)"
			/>
			<MenuItem
				v-if="isCopilotAvailableAndCreatable"
				:icon="copilotIcon"
				:title="createCopilotTitle"
				:subtitle="loc('IM_RECENT_CREATE_COPILOT_SUBTITLE_MSGVER_1')"
				@click.stop="onDefaultCopilotCreateClick"
			>
				<template #after-content>
					<CopilotRoleSelectionButton @click.stop="onCopilotRoleSelectClick" />
				</template>
			</MenuItem>
			<MenuItem
				v-if="canCreateChannel"
				:icon="MenuItemIcon.channel"
				:title="loc('IM_RECENT_CREATE_CHANNEL_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_CHANNEL_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.channel)"
			/>
			<template v-if="collabAvailable">
				<MenuItem
					v-if="isCollabV2Available"
					:disabled="!isCollabV2AvailableByTariff"
					:icon="MenuItemIcon.collabV2"
					:title="loc('IM_RECENT_CREATE_COLLAB_V2_TITLE')"
					:subtitle="loc('IM_RECENT_CREATE_COLLAB_V2_SUBTITLE')"
					@click="onCollabV2CreateClick"
				/>
				<MenuItem
					v-else
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
				:icon="MenuItemIcon.conference"
				:title="loc('IM_RECENT_CREATE_CONFERENCE_TITLE')"
				:subtitle="loc('IM_RECENT_CREATE_CONFERENCE_SUBTITLE_MSGVER_1')"
				:withBottomBorder="showInvitePromo"
				@click="onChatCreateClick(ChatType.videoconf)"
			/>
			<InvitePromo v-if="showInvitePromo" @close="showInvitePromo = false" />
			<template #footer>
				<CreateChatHelp @articleOpen="showMenu = false" />
			</template>
		</MessengerMenu>
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
			canCreateChat() {
				const actions = [im_v2_const.ActionByUserType.createChat, im_v2_const.ActionByUserType.createCollab, im_v2_const.ActionByUserType.createChannel, im_v2_const.ActionByUserType.createConference];
				return actions.some(action => im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(action));
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
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.chat,
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
			}
		},
		template: `
		<div class="bx-im-list-container-recent__scope bx-im-list-container-recent__container" ref="recent-container">
			<div class="bx-im-list-container-recent__header_container">
				<VibeCodeCatalogButton />
				<HeaderMenu
					:unreadMode="unreadMode"
					:recentSection="RecentType.default"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-recent__search-input_container">
					<ChatSearchInput 
						:searchMode="searchMode" 
						:isLoading="searchMode && isSearchLoading"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu v-if="canCreateChat" />
			</div>
			<div class="bx-im-list-container-recent__elements_container">
				<div class="bx-im-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode" 
						:searchMode="searchMode"
						:query="searchQuery"
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

	exports.RecentListContainer = RecentListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.UI, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=recent-container.bundle.js.map
