/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, planner, ui_designTokens, ui_fontawesome4, ui_fonts_opensans, im_integration_viewer, im_v2_component_list_navigator, im_v2_component_content_openlines, im_v2_const, im_v2_css_classes, im_v2_css_icons, im_v2_css_tokens, im_v2_lib_bulkActions, im_v2_lib_counter, im_v2_lib_desktop, im_v2_lib_escManager, im_v2_lib_feature, im_v2_lib_init, im_v2_lib_layout, im_v2_lib_logger, im_v2_lib_pageContext, im_v2_lib_theme, im_v2_component_desktop_modeSelectionBanner, im_v2_lib_analytics, im_v2_lib_desktopApi, im_v2_lib_promo, main_core_events, im_public, im_v2_lib_folder, main_core, main_sidepanel, ui_sidepanel_layout, ui_vue3_components_button, im_v2_provider_service_folder, ui_system_menu, im_v2_lib_menu, ui_iconSet_api_vue, im_v2_application_core, im_v2_component_content_chat, im_v2_component_content_chatForms_forms, im_v2_component_content_folderForms, im_v2_component_content_market, im_v2_component_content_notification, im_v2_component_content_openlinesV2, im_v2_component_content_settings, im_v2_component_list_container_channel, im_v2_component_list_container_collab, im_v2_component_list_container_aiAssistant, im_v2_component_list_container_openline, im_v2_component_list_container_recent, im_v2_component_list_container_task, im_v2_component_list_container_folder) {
	'use strict';

	// @vue/component
	const DesktopOverlay = {
		name: 'DesktopOverlay',
		components: {
			DesktopModeSelectionBanner: im_v2_component_desktop_modeSelectionBanner.DesktopModeSelectionBanner
		},
		data() {
			return {
				isBannerVisible: false
			};
		},
		computed: {
			shouldShowBanner() {
				const promoManager = im_v2_lib_promo.PromoManager.getInstance();
				const needToShow = promoManager.needToShow(im_v2_const.PromoId.desktopModeSelection);
				return needToShow && im_v2_lib_desktopApi.DesktopApi.isChatWindow();
			}
		},
		created() {
			this.isBannerVisible = this.shouldShowBanner;
			if (this.isBannerVisible) {
				im_v2_lib_analytics.Analytics.getInstance().desktopMode.onBannerShow();
			}
		},
		methods: {
			onCloseBanner() {
				this.isBannerVisible = false;
			}
		},
		template: `
		<DesktopModeSelectionBanner v-if="isBannerVisible" @close="onCloseBanner" />
	`
	};

	class FolderListItemMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			editFolder: 'editFolder'
		};
		constructor() {
			super();
			this.id = 'im-folder-list-item-menu';
		}
		getMenuItems() {
			return [this.getUpdateItem(), this.getDeleteItem()];
		}
		getUpdateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
				onClick: () => {
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.updateFolder,
						entityId: String(this.context.folderId)
					});
					this.emit(FolderListItemMenu.events.editFolder);
				}
			};
		}
		getDeleteItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_DELETE'),
				design: ui_system_menu.MenuItemDesign.Alert,
				onClick: () => {
					const popup = new im_v2_lib_folder.FolderDeletePopup();
					popup.subscribe(im_v2_lib_folder.FolderDeletePopup.events.onConfirm, () => {
						void new im_v2_provider_service_folder.FolderService().delete(this.context.folderId);
					});
					popup.show();
				}
			};
		}
	}

	// @vue/component
	const FolderListSettingsItem = {
		name: 'FolderListSettingsItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['menuClick'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			folder() {
				return this.item;
			},
			isPersonal() {
				return this.folder.type === im_v2_const.FolderType.personal;
			},
			subtitle() {
				if (this.isPersonal) {
					return this.loc('IM_MESSENGER_FOLDER_LIST_PERSONAL_ITEM_SUBTITLE');
				}
				const phraseCode = this.getSystemSubtitlePhraseCode();
				return phraseCode ? this.loc(phraseCode) : '';
			}
		},
		methods: {
			getSystemSubtitlePhraseCode() {
				const isCollabV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
				const phraseCodeByRecentType = {
					[im_v2_const.RecentType.default]: isCollabV2Available ? 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_ALL_V2' : 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_ALL',
					[im_v2_const.RecentType.taskComments]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_TASKS',
					[im_v2_const.RecentType.copilot]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COPILOT',
					[im_v2_const.RecentType.openChannel]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_CHANNELS',
					[im_v2_const.RecentType.collab]: isCollabV2Available ? 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COLLAB_V2' : 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_COLLAB',
					[im_v2_const.RecentType.openlines]: 'IM_MESSENGER_FOLDER_LIST_SUBTITLE_OPENLINES'
				};
				return phraseCodeByRecentType[this.folder.code] ?? '';
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-folder-list-item__container" :data-folder-id="folder.id" data-testid="folder-list-settings-item">
			<BIcon
				:name="OutlineIcons.DRAG_XS"
				:hoverable="true"
				class="bx-im-folder-list-item__handle-icon"
			/>
			<div class="bx-im-folder-list-item__text">
				<div class="bx-im-folder-list-item__title --ellipsis" :title="folder.title">
					{{ folder.title }}
				</div>
				<div class="bx-im-folder-list-item__subtitle --ellipsis" :title="subtitle">
					{{ subtitle }}
				</div>
				<button
					v-if="isPersonal"
					type="button"
					class="bx-im-folder-list-item__menu-button"
					aria-haspopup="menu"
					data-testid="folder-list-settings-item-menu-btn"
					@click="$emit('menuClick', $event)"
				>
					<BIcon
						:name="OutlineIcons.MORE_L"
						:hoverable="true"
						class="bx-im-folder-list-item__menu-icon"
					/>
				</button>
			</div>
		</div>
	`
	};

	const SLIDER_ID = 'im:folder-list';
	const SLIDER_WIDTH = 456;

	// @vue/component
	const FolderListSettings = {
		name: 'FolderListSettings',
		components: {
			UiButton: ui_vue3_components_button.Button,
			FolderListSettingsItem
		},
		emits: ['close'],
		data() {
			return {
				orderedFolders: [],
				isSaving: false
			};
		},
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			ButtonIcon: () => ui_vue3_components_button.ButtonIcon,
			folderList() {
				return this.$store.getters['recent/folders/getList'];
			},
			contentContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			footerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			toolbarContainer() {
				return main_core.Tag.render`<div></div>`;
			}
		},
		created() {
			this.orderedFolders = [...this.folderList];
			this.initialFolderIds = this.orderedFolders.map(folder => folder.id);
			this.itemMenu = new FolderListItemMenu();
			this.itemMenu.subscribe(FolderListItemMenu.events.editFolder, this.onEditFolder);
			this.openSlider();
		},
		mounted() {
			void this.$nextTick(() => this.initDraggable());
		},
		beforeUnmount() {
			this.draggable?.destroy();
			this.itemMenu?.destroy();
			this.closeSlider();
		},
		methods: {
			openSlider() {
				main_sidepanel.SidePanel.Instance.open(SLIDER_ID, {
					cacheable: false,
					width: SLIDER_WIDTH,
					contentCallback: () => this.createLayoutContent(),
					events: {
						onCloseComplete: () => this.$emit('close')
					}
				});
			},
			closeSlider() {
				const slider = main_sidepanel.SidePanel.Instance.getSlider(SLIDER_ID);
				if (!slider) {
					return;
				}
				slider.close();
			},
			createLayoutContent() {
				return ui_sidepanel_layout.Layout.createContent({
					title: this.loc('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
					design: {
						section: false,
						alignButtonsLeft: true
					},
					toolbar: () => [this.toolbarContainer],
					content: () => this.contentContainer,
					buttons: () => [this.footerContainer]
				});
			},
			onItemMenuClick(folder, event) {
				const target = {
					left: event.pageX,
					top: event.pageY
				};
				this.itemMenu.openMenu({
					folderId: folder.id
				}, target);
			},
			onEditFolder() {
				this.$emit('close');
			},
			onCreateClick() {
				im_v2_lib_folder.FolderManager.startCreation();
				this.$emit('close');
			},
			async initDraggable() {
				if (!this.$refs.itemsContainer) {
					return;
				}
				const {
					Draggable
				} = await main_core.Runtime.loadExtension('ui.draganddrop.draggable');
				const container = this.$refs.itemsContainer;
				if (!container) {
					return;
				}
				this.draggable = new Draggable({
					container,
					draggable: '.bx-im-folder-list-item__container',
					dragElement: '.bx-im-folder-list-item__handle-icon',
					type: Draggable.CLONE,
					transitionDuration: 0
				});
				this.draggable.subscribe('end', () => this.syncOrderFromDom());
			},
			syncOrderFromDom() {
				const container = this.$refs.itemsContainer;
				if (!container) {
					return;
				}
				const folderById = new Map(this.orderedFolders.map(folder => [folder.id, folder]));
				this.orderedFolders = [...container.querySelectorAll('[data-folder-id]')].map(node => folderById.get(Number(node.dataset.folderId))).filter(Boolean);
			},
			async onSave() {
				const orderedIds = this.orderedFolders.map(folder => folder.id);
				if (this.isOrderUnchanged(orderedIds)) {
					this.$emit('close');
					return;
				}
				this.isSaving = true;
				try {
					await new im_v2_provider_service_folder.FolderService().sort(orderedIds);
				} finally {
					this.isSaving = false;
				}
				this.$emit('close');
			},
			isOrderUnchanged(orderedIds) {
				return orderedIds.length === this.initialFolderIds.length && orderedIds.every((id, index) => id === this.initialFolderIds[index]);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<Teleport :to="toolbarContainer">
			<UiButton
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.FILLED_SUCCESS"
				:collapsed="true"
				:collapsedIcon="ButtonIcon.ADD_M"
				:dataset="{ testid: 'folder-list-settings-create-btn' }"
				@click="onCreateClick"
			/>
		</Teleport>
		<Teleport :to="contentContainer">
			<div class="bx-im-folder-list__container bx-im-messenger__scope" data-testid="folder-list-settings-content">
				<div class="bx-im-folder-list__image"></div>
				<div class="bx-im-folder-list__items" ref="itemsContainer" data-testid="folder-list-settings-items">
					<FolderListSettingsItem
						v-for="folder in orderedFolders"
						:key="folder.id"
						:item="folder"
						@menuClick="onItemMenuClick(folder, $event)"
					/>
				</div>
			</div>
		</Teleport>
		<Teleport :to="footerContainer">
			<div class="bx-im-folder-list__footer" data-testid="folder-list-settings-footer">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:loading="isSaving"
					:text="loc('IM_MESSENGER_FOLDER_LIST_SAVE')"
					:dataset="{ testid: 'folder-list-settings-save-btn' }"
					@click="onSave"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:text="loc('IM_MESSENGER_FOLDER_LIST_CANCEL')"
					:dataset="{ testid: 'folder-list-settings-cancel-btn' }"
					@click="$emit('close')"
				/>
			</div>
		</Teleport>
	`
	};

	const isSelectedFolder = folder => {
		if (folder.type === im_v2_const.FolderType.personal) {
			return isSelectedPersonalFolder(folder);
		}
		return isSelectedSystemFolder(folder);
	};
	const isSelectedPersonalFolder = folder => {
		const layout = getCurrentLayout();
		const isPersonalFolderLayout = layout.name === im_v2_const.Layout.folder;
		if (!isPersonalFolderLayout) {
			return false;
		}
		const {
			folderId
		} = layout.params;
		return folderId === folder.id;
	};
	const isSelectedSystemFolder = folder => {
		const layout = getCurrentLayout();
		return layout.name === im_v2_lib_folder.FolderManager.getLayoutByFolderCode(folder.code);
	};
	const getCurrentLayout = () => {
		return im_v2_application_core.Core.getStore().getters['application/getLayout'];
	};

	// @vue/component
	const PanelItem = {
		name: 'PanelItem',
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			folder() {
				return this.item;
			},
			isSelected() {
				return isSelectedFolder(this.folder);
			},
			isSystemFolder() {
				return this.folder.type === im_v2_const.FolderType.system;
			},
			counter() {
				const {
					definition
				} = this.folder;
				if (this.isSystemFolder) {
					const folderRecentType = definition.recentSection;
					return this.$store.getters['counters/getCounterByRecentType'](folderRecentType);
				}
				const folderChatIds = definition.chats.map(chat => chat.chatId);
				return this.$store.getters['counters/getTotalCounterByIdsWithChildren'](folderChatIds);
			},
			showCounter() {
				// "Channels" is a company-wide showcase folder, not a personal one, so no unread counter there
				return this.counter > 0 && this.folder.code !== im_v2_const.RecentType.openChannel;
			},
			formattedCounter() {
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			},
			containerClasses() {
				return {
					'--selected': this.isSelected
				};
			},
			iconClasses() {
				if (!this.isSystemFolder) {
					return [];
				}
				return [`--${this.folder.code}`];
			}
		},
		template: `
		<div class="bx-im-messenger-folder-panel__item" :class="containerClasses" data-testid="folder-panel-item">
			<div class="bx-im-messenger-folder-panel-item__icon" :class="iconClasses">
				<div v-if="showCounter" class="bx-im-messenger-folder-panel-item__counter">
					{{ formattedCounter }}
				</div>
			</div>
			<div class="bx-im-messenger-folder-panel-item__title --line-clamp-2" :title="folder.title">
				{{ folder.title }}
			</div>
		</div>
	`
	};

	class PanelSettingsMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			openFolderList: 'openFolderList'
		};
		constructor() {
			super();
			this.id = 'im-folder-panel-settings-menu';
		}
		getMenuItems() {
			return [this.getCreateItem(), this.getListItem()];
		}
		getCreateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_CREATE'),
				onClick: () => {
					im_v2_lib_folder.FolderManager.startCreation();
				}
			};
		}
		getListItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
				onClick: () => {
					this.emit(PanelSettingsMenu.events.openFolderList);
				}
			};
		}
	}

	// @vue/component
	const PanelSettings = {
		name: 'PanelSettings',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['openFolderList'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		created() {
			this.contextMenuManager = new PanelSettingsMenu();
			this.contextMenuManager.subscribe(PanelSettingsMenu.events.openFolderList, () => this.$emit('openFolderList'));
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			onSettingsClick() {
				this.contextMenuManager.openMenu({}, this.$refs.icon);
			}
		},
		template: `
		<button
			type="button"
			class="bx-im-messenger-folder-panel__settings_container"
			aria-haspopup="menu"
			data-testid="folder-panel-settings-btn"
			ref="icon"
			@click="onSettingsClick"
		>
			<BIcon
				:name="OutlineIcons.SETTINGS_L"
				:hoverable="true"
				class="bx-im-messenger-folder-panel__settings"
			/>
		</button>
	`
	};

	const SectionCode = Object.freeze({
		manage: 'manage',
		navigate: 'navigate'
	});
	class PanelItemMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			openFolderList: 'openFolderList'
		};
		constructor() {
			super();
			this.id = 'im-folder-panel-item-menu';
		}
		getMenuItems() {
			if (this.#isSystemFolder()) {
				return [this.getListItem()];
			}
			return [...this.groupItems([this.getUpdateItem(), this.getDeleteItem()], SectionCode.manage), ...this.groupItems([this.getListItem()], SectionCode.navigate)];
		}
		getMenuGroups() {
			if (this.#isSystemFolder()) {
				return [];
			}
			return [{
				code: SectionCode.manage
			}, {
				code: SectionCode.navigate
			}];
		}
		getUpdateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
				onClick: () => {
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.updateFolder,
						entityId: String(this.context.folderId)
					});
				}
			};
		}
		getDeleteItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_DELETE'),
				design: ui_system_menu.MenuItemDesign.Alert,
				onClick: () => {
					const popup = new im_v2_lib_folder.FolderDeletePopup();
					popup.subscribe(im_v2_lib_folder.FolderDeletePopup.events.onConfirm, () => {
						void new im_v2_provider_service_folder.FolderService().delete(this.context.folderId);
					});
					popup.show();
				}
			};
		}
		getListItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
				onClick: () => {
					this.emit(PanelItemMenu.events.openFolderList);
				}
			};
		}
		#isSystemFolder() {
			return this.context.folderType === im_v2_const.FolderType.system;
		}
	}

	// @vue/component
	const FolderPanel = {
		name: 'FolderPanel',
		components: {
			PanelSettings,
			PanelItem,
			FolderListSettings
		},
		data() {
			return {
				showFolderList: false
			};
		},
		computed: {
			folderList() {
				return this.$store.getters['recent/folders/getList'];
			}
		},
		created() {
			this.contextMenuManager = new PanelItemMenu();
			this.contextMenuManager.subscribe(PanelItemMenu.events.openFolderList, this.onOpenFolderList);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			openSystemFolder(folder) {
				void im_public.Messenger.openNavigationItem({
					id: im_v2_lib_folder.FolderManager.getLayoutByFolderCode(folder.code)
				});
			},
			openPersonalFolder(folder) {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList);
				im_v2_lib_folder.FolderManager.openPersonalFolder(folder.id);
			},
			isSystemFolder(folder) {
				return folder.type === im_v2_const.FolderType.system;
			},
			onSelectFolder(folder) {
				if (this.isSystemFolder(folder)) {
					this.openSystemFolder(folder);
					return;
				}
				this.openPersonalFolder(folder);
			},
			onFolderRightClick(folder, event) {
				const context = {
					folderId: folder.id,
					folderType: folder.type
				};
				const target = {
					left: event.pageX,
					top: event.pageY
				};
				this.contextMenuManager.openMenu(context, target);
			},
			onOpenFolderList() {
				this.showFolderList = true;
			}
		},
		template: `
		<div class="bx-im-messenger-folder-panel__container --hidden-scroll" data-testid="folder-panel-container">
			<div class="bx-im-messenger-folder-panel__header">
				<PanelSettings @openFolderList="onOpenFolderList" />
			</div>
			<div class="bx-im-messenger-folder-panel__separator"></div>
			<PanelItem
				v-for="folder in folderList"
				:key="folder.id"
				:item="folder"
				@click="onSelectFolder(folder)"
				@click.right.prevent="onFolderRightClick(folder, $event)"
			/>
		</div>
		<FolderListSettings v-if="showFolderList" @close="showFolderList = false" />
	`
	};

	const LayoutComponentMap = {
		[im_v2_const.Layout.chat]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.createChat]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_chatForms_forms.CreateChatContent
		},
		[im_v2_const.Layout.updateChat]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_chatForms_forms.UpdateChatContent
		},
		[im_v2_const.Layout.createFolder]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_folderForms.FolderCreation
		},
		[im_v2_const.Layout.updateFolder]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_folderForms.FolderUpdateContent
		},
		[im_v2_const.Layout.copyCollab]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_chatForms_forms.CollabV2CopyContent
		},
		[im_v2_const.Layout.channel]: {
			list: im_v2_component_list_container_channel.ChannelListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.notification]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_notification.NotificationContent
		},
		[im_v2_const.Layout.openlines]: {
			content: im_v2_component_content_openlines.OpenlinesContent
		},
		[im_v2_const.Layout.openlinesV2]: {
			list: im_v2_component_list_container_openline.OpenlineListContainer,
			content: im_v2_component_content_openlinesV2.OpenlinesV2Content
		},
		[im_v2_const.Layout.conference]: {
			list: im_v2_component_list_container_recent.RecentListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.settings]: {
			content: im_v2_component_content_settings.SettingsContent
		},
		[im_v2_const.Layout.copilot]: {
			list: im_v2_component_list_container_aiAssistant.AiAssistantListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.collab]: {
			list: im_v2_component_list_container_collab.CollabListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.market]: {
			content: im_v2_component_content_market.MarketContent
		},
		[im_v2_const.Layout.taskComments]: {
			list: im_v2_component_list_container_task.TaskListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.folder]: {
			list: im_v2_component_list_container_folder.FolderListContainer,
			content: im_v2_component_content_chat.ChatContent
		}
	};

	// @vue/component
	const Messenger = {
		name: 'MessengerRoot',
		components: {
			ListNavigator: im_v2_component_list_navigator.ListNavigator,
			OpenlinesContent: im_v2_component_content_openlines.OpenlinesContent,
			DesktopOverlay,
			FolderPanel
		},
		data() {
			return {
				openlinesContentOpened: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			entityId() {
				return this.layout.entityId;
			},
			hasListComponent() {
				return Boolean(this.listComponent);
			},
			listComponent() {
				return LayoutComponentMap[this.layoutName].list;
			},
			contentComponent() {
				return LayoutComponentMap[this.layoutName].content;
			},
			isOpenline() {
				return this.layout.name === im_v2_const.Layout.openlines;
			},
			isFolderAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable);
			},
			containerClasses() {
				return {
					'--dark-theme': im_v2_lib_theme.ThemeManager.isDarkTheme(),
					'--light-theme': im_v2_lib_theme.ThemeManager.isLightTheme(),
					'--desktop': im_v2_lib_desktop.DesktopManager.isDesktop()
				};
			}
		},
		watch: {
			layoutName: {
				handler(newLayoutName) {
					if (newLayoutName !== im_v2_const.Layout.openlines) {
						return;
					}
					this.openlinesContentOpened = true;
				},
				immediate: true
			}
		},
		created() {
			im_v2_lib_init.InitManager.init();
			// emit again because external code expects to receive it after the messenger is opened (not via quick-access).
			im_v2_lib_counter.CounterManager.getInstance().emitCounters();
			im_v2_lib_layout.LayoutManager.getInstance().bindEvents({
				emitter: this.getEmitter()
			});
			im_v2_lib_bulkActions.BulkActionsManager.getInstance().bindEvents({
				emitter: this.getEmitter()
			});
			im_v2_lib_pageContext.ChatPageContextManager.init();
			im_v2_lib_logger.Logger.warn('MessengerRoot created');
			void this.getLayoutManager().prepareInitialLayout();
		},
		mounted() {
			im_v2_lib_escManager.EscManager.getInstance().register({
				messengerContainer: this.$refs.container,
				context: {
					emitter: this.getEmitter()
				}
			});
		},
		beforeUnmount() {
			this.getLayoutManager().destroy();
			im_v2_lib_escManager.EscManager.getInstance().unregister();
		},
		methods: {
			onSelectChat({
				layoutName,
				dialogId
			}) {
				void this.getLayoutManager().setLayout({
					name: layoutName,
					entityId: dialogId
				});
			},
			getLayoutManager() {
				return im_v2_lib_layout.LayoutManager.getInstance();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container --ui-context-content-light" :class="containerClasses" ref="container">
			<div class="bx-im-messenger__layout_container">
				<div class="bx-im-messenger__layout_content">
					<FolderPanel v-if="isFolderAvailable" />
					<div v-if="hasListComponent" class="bx-im-messenger__list_container">
						<ListNavigator :listComponent="listComponent" @selectChat="onSelectChat" />
					</div>
					<div class="bx-im-messenger__content_container" :class="{'--with-list': hasListComponent}">
						<div v-if="openlinesContentOpened" class="bx-im-messenger__openlines_container" :class="{'--hidden': !isOpenline}">
							<OpenlinesContent v-show="isOpenline" :entityId="entityId" />
						</div>
						<component v-if="!isOpenline" :is="contentComponent" :entityId="entityId" />
					</div>
				</div>
			</div>
		</div>
		<DesktopOverlay />
	`
	};

	exports.Messenger = Messenger;

})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX, window, BX, BX, BX.Messenger.Integration.Viewer, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Const, BX.Messenger.v2.Css, BX.Messenger.v2.Css, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Desktop, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.SidePanel, BX.UI.SidePanel, BX.Vue3.Components, BX.Messenger.v2.Service, BX.UI.System, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List);
//# sourceMappingURL=messenger.bundle.js.map
