/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core_events, planner, ui_designTokens, ui_fontawesome4, ui_fonts_opensans, ui_vue3, im_integration_viewer, im_v2_component_list_navigator, im_v2_component_content_openlines, im_v2_component_playerBar, im_v2_const, im_v2_css_classes, im_v2_css_icons, im_v2_css_tokens, im_v2_lib_a11y, im_v2_lib_bulkActions, im_v2_lib_counter, im_v2_lib_desktop, im_v2_lib_escManager, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_init, im_v2_lib_layout, im_v2_lib_logger, im_v2_lib_pageContext, im_v2_lib_theme, im_v2_component_desktop_modeSelectionBanner, im_v2_lib_analytics, im_v2_lib_desktopApi, im_v2_lib_promo, main_sidepanel, im_public, im_v2_lib_slider, main_core, main_popup, ui_a11y, ui_iconSet_api_vue, ui_system_typography_vue, ui_vue3_components_button, im_v2_lib_notifier, im_v2_provider_service_folder, ui_system_menu, im_v2_lib_menu, ui_cnt, ui_vue3_components_counter, ui_iconSet_solid, ui_system_highlighter, im_v2_application_core, im_v2_component_elements_popup, ui_iconSet_api_core, im_v2_component_content_chat, im_v2_component_content_chatForms_forms, im_v2_component_content_folderForms, im_v2_component_content_market, im_v2_component_content_notification, im_v2_component_content_openlinesV2, im_v2_component_content_settings, im_v2_component_list_container_channel, im_v2_component_list_container_collab, im_v2_component_list_container_aiAssistant, im_v2_component_list_container_openline, im_v2_component_list_container_recent, im_v2_component_list_container_task, im_v2_component_list_container_folder, im_v2_component_list_container_vibecodeApp) {
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

	// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder panel item
	// menu follows, so a label never has to be looked up to be known.
	const MENU_ID$2 = 'im-folder-list-item-menu';
	class FolderListItemMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			closeList: 'closeList'
		};
		constructor() {
			super();
			this.id = MENU_ID$2;
		}
		getMenuItems() {
			// A safety net for deletion, not a live path: the card of a system folder shows the menu button only
			// for a composite one, and even there the only item edits the composition.
			if (this.#isSystemFolder()) {
				return [this.getEditAllItem()];
			}
			return [this.getUpdateItem(), this.getDeleteItem()];
		}
		getEditAllItem() {
			// Only a composite folder owns a composition to edit; for the remaining system folders the branch
			// above stays empty and deletion remains closed.
			if (!this.#isCompositeFolder()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_EDIT_ALL'),
				dataset: {
					testid: `${MENU_ID$2}-edit-all`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickEdit({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderList
					});
					im_v2_lib_folder.FolderManager.openAllFolderSettings();
					this.emit(FolderListItemMenu.events.closeList);
				}
			};
		}
		getUpdateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
				dataset: {
					testid: `${MENU_ID$2}-update`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickEdit({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderList
					});
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.updateFolder,
						entityId: String(this.context.folderId)
					});
					this.emit(FolderListItemMenu.events.closeList);
				}
			};
		}
		getDeleteItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_DELETE'),
				design: ui_system_menu.MenuItemDesign.Alert,
				dataset: {
					testid: `${MENU_ID$2}-delete`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickDelete({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderList
					});
					const popup = new im_v2_lib_folder.FolderDeletePopup();
					popup.subscribe(im_v2_lib_folder.FolderDeletePopup.events.onConfirm, () => {
						void new im_v2_provider_service_folder.FolderService().delete(this.context.folderId);
					});
					popup.show();
				}
			};
		}
		#isSystemFolder() {
			return this.context.folderType === im_v2_const.FolderType.system;
		}
		#isCompositeFolder() {
			return this.store.getters['recent/folders/isComposite'](this.context.folderId);
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
			isComposite() {
				return this.$store.getters['recent/folders/isComposite'](this.folder.id);
			},
			subtitle() {
				// One line for every personal folder: it describes this surface, not the folder, so the
				// server does not send it.
				if (this.isPersonal) {
					return this.loc('IM_MESSENGER_FOLDER_LIST_PERSONAL_ITEM_SUBTITLE');
				}
				return this.folder.description ?? '';
			},
			// The list holds a menu button on every row it lets the user act on, so the name of the button
			// carries the folder: without it the rows are told apart by nothing at all on a screen reader.
			menuAriaLabel() {
				return this.loc('IM_MESSENGER_FOLDER_LIST_ITEM_MENU_ARIA_LABEL', {
					'#TITLE#': this.folder.title
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			class="bx-im-folder-list-item__container"
			role="listitem"
			:data-folder-id="folder.id"
			:data-folder-code="folder.code || null"
			data-testid="folder-list-settings-item"
		>
			<BIcon
				:name="OutlineIcons.DRAG_XS"
				:hoverable="true"
				class="bx-im-folder-list-item__handle-icon"
				data-testid="folder-list-settings-item-handle"
			/>
			<div class="bx-im-folder-list-item__text">
				<div
					class="bx-im-folder-list-item__title --ellipsis"
					:title="folder.title"
					data-testid="folder-list-settings-item-title"
				>
					{{ folder.title }}
				</div>
				<div
					class="bx-im-folder-list-item__subtitle --ellipsis"
					:title="subtitle"
					data-testid="folder-list-settings-item-subtitle"
				>
					{{ subtitle }}
				</div>
			</div>
			<button
				v-if="isPersonal || isComposite"
				type="button"
				class="bx-im-folder-list-item__menu-button --focus-visible"
				aria-haspopup="menu"
				:aria-label="menuAriaLabel"
				data-testid="folder-list-settings-item-menu-btn"
				@click="$emit('menuClick', $event.currentTarget)"
			>
				<BIcon
					:name="OutlineIcons.MORE_L"
					:hoverable="true"
					class="bx-im-folder-list-item__menu-icon"
				/>
			</button>
		</div>
	`
	};

	const CLOSE_ICON_SIZE = 24;

	// The capture phase: the press past the panel is the only way the pointer has of giving the covered
	// interface back, and an ancestor that stops the press travelling would take that way away in
	// silence. One object for both sides so that the subscription is taken back with the options it was
	// made with - a mismatch there leaves the handler on the document after the panel has closed.
	const OUTSIDE_PRESS_OPTIONS = {
		capture: true
	};

	// @vue/component
	const FolderListSettings = {
		name: 'FolderListSettings',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			UiButton: ui_vue3_components_button.Button,
			FolderListSettingsItem
		},
		emits: ['close'],
		data() {
			return {
				// The order the user built by dragging, in ids alone. The rows themselves stay in the model:
				// a copy of them here would keep showing a folder deleted while the panel is open.
				draggedIds: [],
				isSaving: false,
				isCreatingFolder: false,
				// The heading names the panel, so it needs an anchor of its own: two panels share the DOM
				// for the length of the leave transition and a fixed id would be there twice.
				titleId: `bx-im-folder-list-title-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			CLOSE_ICON_SIZE: () => CLOSE_ICON_SIZE,
			folderList() {
				return this.$store.getters['recent/folders/getVisibleList'];
			},
			// The rows of the panel: the registry, put into the order the user dragged. Everything the
			// registry no longer has leaves on its own, and a folder it gained joins the tail - the order
			// the user built is his until he saves it, and it says nothing about the folders he never moved.
			orderedFolders() {
				const registry = new Map(this.folderList.map(folder => [folder.id, folder]));
				const dragged = this.draggedIds.map(folderId => registry.get(folderId)).filter(Boolean);
				const draggedIds = new Set(dragged.map(folder => folder.id));
				return [...dragged, ...this.folderList.filter(folder => !draggedIds.has(folder.id))];
			},
			layoutName() {
				return this.$store.getters['application/getLayout'].name;
			}
		},
		watch: {
			// The panel opened the create screen itself and stays over the list while the form next door is
			// being filled in - the folder taking shape there belongs to the list it shows. It leaves with
			// that screen: the created folder opens its own chats, and the panel is done.
			layoutName(layoutName) {
				if (layoutName === im_v2_const.Layout.createFolder) {
					this.stepAsideForCreation();
					return;
				}
				if (this.isCreatingFolder) {
					this.closePanel();
				}
			}
		},
		created() {
			this.itemMenu = new FolderListItemMenu();
			this.itemMenu.subscribe(FolderListItemMenu.events.closeList, this.closePanel);
			this.getEmitter().subscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
		},
		mounted() {
			this.startFocusTrap();
			this.startOutsideClickHandling();
			void this.$nextTick(() => this.initDraggable());
		},
		beforeUnmount() {
			this.stopEscapeHandling();
			this.stopFocusTrap();
			this.stopOutsideClickHandling();
			this.draggable?.destroy();
			this.itemMenu?.destroy();
		},
		methods: {
			// The menu is bound to the button and not to the point of the click: a click made with the
			// keyboard carries no coordinates and would put the menu in the corner of the window. Bound to
			// the node, ui.system.menu also keeps `aria-expanded` on the button in step with itself.
			onItemMenuClick(folder, trigger) {
				this.itemMenu.openMenu({
					folderId: folder.id,
					folderType: folder.type
				}, trigger);
			},
			// Esc has to be answered here: left alone it travels on through EscManager and clears the
			// layout underneath, leaving the panel standing over a screen it did not ask for.
			onBeforeEscape() {
				this.closePanel();
				return im_v2_lib_escManager.EscEventAction.handled;
			},
			closePanel() {
				// the leave transition holds `beforeUnmount` back for its whole duration, so the key, the
				// focus and the pointer are all given up here: the next Esc travels on instead of reaching a
				// panel already closing, the covered interface comes back the moment the panel is closed, and
				// a click meant for it is not read as a click past a panel that is no longer there
				this.stopEscapeHandling();
				this.stopFocusTrap();
				this.stopOutsideClickHandling();
				this.$emit('close');
			},
			stopEscapeHandling() {
				this.getEmitter().unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
			},
			// The panel is drawn over the strip and over the chat list, and the slider that used to carry
			// this screen took its focus trap away with it: holding the focus is the panel's own job now.
			// The focus goes to the panel itself so that its role and its name are announced first.
			startFocusTrap() {
				this.focusTrap = new ui_a11y.FocusTrap(this.$el, {
					initialFocus: 'container',
					restoreFocus: true,
					isolateOutside: true
				});
				this.focusTrap.activate();
			},
			stopFocusTrap() {
				this.focusTrap?.destroy();
				this.focusTrap = null;
			},
			// The trap leaves everything around the panel `inert`, so a click past it reaches no control of
			// its own and the interface reads as broken. Closing the panel is what the slider used to do with
			// its backdrop, and it is the pointer half of what Esc already does.
			// The pointer press and not the click: the click of the menu item that opens the panel is still
			// travelling when the panel mounts, and a handler bound to it would answer its own opening.
			startOutsideClickHandling() {
				main_core.Event.bind(document, 'mousedown', this.onOutsideClick, OUTSIDE_PRESS_OPTIONS);
			},
			stopOutsideClickHandling() {
				main_core.Event.unbind(document, 'mousedown', this.onOutsideClick, OUTSIDE_PRESS_OPTIONS);
			},
			onOutsideClick(event) {
				// A popup takes the press before the panel does - the row menu lives outside the panel, and
				// the layers unwind one at a time, the same order Esc unwinds them in.
				if (main_popup.PopupManager.isAnyPopupShown()) {
					return;
				}

				// The path and not the target: a row travels by its handle, and the press that starts the
				// drag belongs to the panel however far the pointer goes afterwards.
				if (event.composedPath().includes(this.$el)) {
					return;
				}
				this.closePanel();
			},
			onCreateClick() {
				im_v2_lib_analytics.Analytics.getInstance().folder.onClickCreateFolder(im_v2_lib_analytics.AnalyticsSection.folderList);

				// The panel is not closed here: it follows the create screen, and the screen may never open
				// at all - the creation is turned down on the limit of folders.
				im_v2_lib_folder.FolderManager.startCreation();
			},
			// The create screen opens next door, in the content area, and the panel gives up being a modal
			// layer for it to be reachable at all: the trap leaves everything around the panel inert, the
			// press past the panel closes it, and Esc belongs to the form now. The panel itself stays.
			stepAsideForCreation() {
				this.isCreatingFolder = true;
				this.stopEscapeHandling();
				this.stopFocusTrap();
				this.stopOutsideClickHandling();
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
			// The drag moves the rows in the DOM, and the ids read back from there are the whole of what the
			// panel keeps of it: the rows are drawn from the registry either way.
			syncOrderFromDom() {
				const container = this.$refs.itemsContainer;
				if (!container) {
					return;
				}
				this.draggedIds = [...container.querySelectorAll('[data-folder-id]')].map(node => Number(node.dataset.folderId));
			},
			async onSave() {
				const orderedIds = this.orderedFolders.map(folder => folder.id);
				if (this.isOrderUnchanged(orderedIds)) {
					this.closePanel();
					return;
				}
				this.isSaving = true;
				try {
					await new im_v2_provider_service_folder.FolderService().sort(orderedIds);
				} catch {
					// The sort reports nothing of its own, and the panel is the only surface the user can
					// see: left silent, a refusal reads as a save that simply did nothing. The order the
					// user built stays on screen, so the button can be pressed again.
					im_v2_lib_notifier.Notifier.onDefaultError();
					return;
				} finally {
					this.isSaving = false;
				}
				this.closePanel();
			},
			// Against the registry as it stands now and not against the list the panel opened with: a folder
			// deleted or created next door is no reordering of the rows the user never touched, and the
			// server has that order already.
			isOrderUnchanged(orderedIds) {
				const registryIds = this.folderList.map(folder => folder.id);
				return orderedIds.length === registryIds.length && orderedIds.every((folderId, index) => folderId === registryIds[index]);
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
			class="bx-im-folder-list__panel"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="titleId"
			data-testid="folder-list-settings-panel"
		>
			<div class="bx-im-folder-list__header" data-testid="folder-list-settings-header">
				<HeadlineXs
					tag="h2"
					:id="titleId"
					data-testid="folder-list-settings-title"
				>
					{{ loc('IM_MESSENGER_FOLDER_LIST_TITLE') }}
				</HeadlineXs>
				<div class="bx-im-folder-list__header-actions">
					<UiButton
						:size="ButtonSize.EXTRA_SMALL"
						:style="AirButtonStyle.OUTLINE"
						:text="loc('IM_MESSENGER_FOLDER_LIST_CREATE_BUTTON')"
						:dataset="{ testid: 'folder-list-settings-create-btn' }"
						@click="onCreateClick"
					/>
					<button
						type="button"
						class="bx-im-folder-list__close-button --focus-visible"
						:aria-label="loc('IM_MESSENGER_FOLDER_LIST_CLOSE_ARIA_LABEL')"
						data-testid="folder-list-settings-close-btn"
						@click="closePanel"
					>
						<BIcon :name="OutlineIcons.CROSS_L" :size="CLOSE_ICON_SIZE" :hoverable="true" />
					</button>
				</div>
			</div>
			<!-- A tab stop of its own: the system rows carry no control at all, so a list too long for
				the panel would keep its tail out of reach of the keyboard and of the arrow keys. A stop
				has to show and to say what it is, so the area carries the ring of the shared utility and
				is grouped and named the way the table of a message is. -->
			<div
				class="bx-im-folder-list__container --focus-visible"
				tabindex="0"
				role="group"
				:aria-label="loc('IM_MESSENGER_FOLDER_LIST_CONTENT_ARIA_LABEL')"
				data-testid="folder-list-settings-content"
			>
				<div class="bx-im-folder-list__image" data-testid="folder-list-settings-image"></div>
				<div
					class="bx-im-folder-list__items"
					role="list"
					ref="itemsContainer"
					data-testid="folder-list-settings-items"
				>
					<FolderListSettingsItem
						v-for="folder in orderedFolders"
						:key="folder.id"
						:item="folder"
						@menuClick="onItemMenuClick(folder, $event)"
					/>
				</div>
			</div>
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
					@click="closePanel"
				/>
			</div>
		</div>
	`
	};

	const isSelectedFolder = folder => {
		const folderLayout = im_v2_lib_folder.FolderManager.getFolderLayout(folder);
		if (!folderLayout) {
			return false;
		}
		const currentLayout = getCurrentLayout();
		if (getSelectionLayoutName(currentLayout.name) !== folderLayout.name) {
			return false;
		}

		// Personal folders all live under one layout name, so only there the folder id tells them apart.
		// Every other folder owns its layout name alone: the name match is the whole answer, and a folder
		// id left in the layout by the previous section says nothing about it.
		if (folderLayout.name !== im_v2_const.Layout.folder) {
			return true;
		}
		const {
			folderId
		} = currentLayout.params;
		return folderId === folder.id;
	};

	// The setup screen of the composite folder stands on the list of that very folder, so its tile keeps the
	// selection while the composition is being edited. The pairing belongs here alone: `FolderManager` tells
	// a folder layout from the rest to decide what a click on a tile opens, and a form has nothing to open.
	const getSelectionLayoutName = layoutName => {
		return layoutName === im_v2_const.Layout.folderAllSettings ? im_v2_const.Layout.folderAll : layoutName;
	};
	const getCurrentLayout = () => {
		return im_v2_application_core.Core.getStore().getters['application/getLayout'];
	};

	// @vue/component
	const PanelItem = {
		name: 'PanelItem',
		components: {
			BCounter: ui_vue3_components_counter.Counter,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			highlighted: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				CounterSize: ui_cnt.CounterSize,
				CounterStyle: ui_cnt.CounterStyle
			};
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
				if (this.$store.getters['recent/folders/isComposite'](this.folder.id)) {
					const sourceDefinitions = this.$store.getters['recent/folders/getSourceDefinitions'](this.folder.id);
					return this.$store.getters['counters/getCounterByRecentSections'](sourceDefinitions);
				}
				if (this.isSystemFolder) {
					const folderRecentType = definition.recentSection;
					return this.$store.getters['counters/getCounterByRecentType'](folderRecentType);
				}
				const folderChatIds = definition.chats.map(chat => chat.chatId);
				return this.$store.getters['counters/getTotalCounterByIdsWithChildren'](folderChatIds);
			},
			showCounter() {
				// "Channels" is a company-wide showcase folder, not a personal one, so no unread counter there
				return this.counter > 0 && this.folder.code !== im_v2_const.SystemFolderCode.openChannel;
			},
			maxCounterValue() {
				return im_v2_lib_counter.CounterManager.getCounterDisplayLimit() - 1;
			},
			containerClasses() {
				return {
					'--selected': this.isSelected,
					'ui-highlighter': this.highlighted
				};
			},
			iconName() {
				// A personal folder has no system code, so the map of the library has nothing to answer for it
				return this.isSystemFolder ? im_v2_lib_folder.FolderManager.getFolderIcon(this.folder.code) : ui_iconSet_api_vue.Solid.CHATS;
			},
			// The colour BitrixGPT logo the tile draws is a temporary stand-in: the design system carries no
			// colour glyph for this folder yet.
			isCopilotFolder() {
				return this.isSystemFolder && this.folder.code === im_v2_const.SystemFolderCode.copilot;
			},
			// The badge stands before the title in the DOM and the glyph says nothing at all, so the name of
			// the tile is spelled out: read off the content it would come out as "1 All".
			ariaLabel() {
				if (!this.showCounter) {
					return this.folder.title;
				}

				// A locale that has no phrase gets an empty string back from Loc, and an empty name is no name
				// at all: the reader falls back to the content and says "1 All". The title alone stands in.
				const phrase = this.loc('IM_MESSENGER_FOLDER_PANEL_ITEM_UNREAD_ARIA_LABEL');
				if (!phrase) {
					return this.folder.title;
				}

				// The real number and not the capped one the badge draws: "99+" is a size of the badge.
				// The phrase is filled in a single pass, because Loc fills it in as many passes as there are
				// placeholders: a folder named "#count#" would land in the title and be read as the number.
				const values = new Map([['#TITLE#', this.folder.title], ['#COUNT#', String(this.counter)]]);
				return phrase.replaceAll(/#TITLE#|#COUNT#/gi, placeholder => values.get(placeholder.toUpperCase()));
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			type="button"
			class="bx-im-messenger-folder-panel__item --focus-visible"
			:class="containerClasses"
			:aria-label="ariaLabel"
			:aria-current="isSelected ? 'true' : null"
			aria-haspopup="menu"
			data-testid="folder-panel-item"
			:data-folder-code="folder.code || null"
		>
			<BIcon
				:name="iconName"
				class="bx-im-messenger-folder-panel-item__glyph"
				:class="{ '--bitrix-gpt-logo': isCopilotFolder }"
				data-testid="folder-panel-item-icon"
			/>
			<div
				v-if="showCounter"
				class="bx-im-messenger-folder-panel-item__counter"
				data-testid="folder-panel-counter"
			>
				<BCounter
					:value="counter"
					:maxValue="maxCounterValue"
					:style="CounterStyle.FILLED"
					:size="CounterSize.MEDIUM"
				/>
			</div>
			<div
				class="bx-im-messenger-folder-panel-item__title --ellipsis"
				:title="folder.title"
				data-testid="folder-panel-item-title"
			>
				{{ folder.title }}
			</div>
		</button>
	`
	};

	const isItemInListView = (list, item) => {
		const itemRect = item.getBoundingClientRect();
		const listRect = list.getBoundingClientRect();
		return itemRect.bottom > listRect.top && itemRect.top < listRect.bottom;
	};

	// From the centre of the tile the popup is bound to down to the centre of the part of the frame the list shows.
	const getFramePointerShift = (list, frame, tile) => {
		const listRect = list.getBoundingClientRect();
		const frameRect = frame.getBoundingClientRect();
		const tileRect = tile.getBoundingClientRect();
		const visibleTop = Math.max(frameRect.top, listRect.top);
		const visibleBottom = Math.min(frameRect.bottom, listRect.bottom);
		return (visibleTop + visibleBottom - (tileRect.top + tileRect.bottom)) / 2;
	};

	const PANEL_TOUR_TARGET = 'panel';

	// The step count never depends on the folders of the user, so the list is a constant of the tour.
	// `image` is the modifier class that carries the illustration of a step; a step without one renders
	// no illustration at all.
	const TOUR_STEPS = Object.freeze([Object.freeze({
		target: PANEL_TOUR_TARGET,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_1_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_1_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--folder'
	}), Object.freeze({
		target: im_v2_const.SystemFolderCode.all,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_2_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_2_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--tasks'
	}), Object.freeze({
		target: im_v2_const.SystemFolderCode.collab,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_3_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_3_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--projects'
	}), Object.freeze({
		target: im_v2_const.SystemFolderCode.all,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_4_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_4_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_SETUP',
		image: '--settings'
	})]);

	const POPUP_ID = 'im-folder-panel-onboarding-tour';
	const TITLE_ID = `${POPUP_ID}-title`;
	const TEXT_ID = `${POPUP_ID}-text`;
	const POPUP_DESIGN_CONTEXT = '--ui-context-content-dark';
	const POPUP_WIDTH = 440;
	const POPUP_BACKGROUND = 'var(--ui-color-accent-soft-element-blue)';
	const POPUP_BORDER_RADIUS = '16px';
	const POPUP_RAIL_GAP = 12;
	const POPUP_ANGLE_OFFSET = 44;
	// middle of the arrow inside the left angle of main.popup: 8px from the top of the angle plus half of its 15px
	const POPUP_ANGLE_ARROW_MIDDLE = 16;
	// without forceTop the core popup flips over a tile standing low on the screen and the pointer leaves the tile
	const POPUP_BIND_OPTIONS = Object.freeze({
		position: 'bottom',
		forceTop: true
	});
	const FOREIGN_DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], .popup-window';

	// The tour comes from the queue at a moment the user did not choose, so it leaves the focus in a field being typed in
	// and in somebody else's dialog.
	const canTakeFocusFrom = element => {
		if (!element) {
			return true;
		}
		const isEditable = element.matches('input, textarea') || element.isContentEditable;
		return !isEditable && element.closest(FOREIGN_DIALOG_SELECTOR) === null;
	};

	// @vue/component
	const OnboardingTour = {
		name: 'OnboardingTour',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextSm: ui_system_typography_vue.TextSm,
			Text3Xs: ui_system_typography_vue.Text3Xs
		},
		props: {
			step: {
				type: Number,
				required: true
			},
			/** @type HTMLElement */
			bindElement: {
				type: Object,
				required: true
			},
			/** @type HTMLElement */
			railElement: {
				type: Object,
				required: true
			},
			/** @type HTMLElement */
			listElement: {
				type: Object,
				required: true
			},
			/** @type ?HTMLElement */
			frameElement: {
				type: Object,
				default: null
			}
		},
		emits: ['prev', 'next', 'goto', 'close'],
		computed: {
			POPUP_ID: () => POPUP_ID,
			TITLE_ID: () => TITLE_ID,
			TEXT_ID: () => TEXT_ID,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			currentStep() {
				return TOUR_STEPS[this.step - 1];
			},
			stepCount() {
				return TOUR_STEPS.length;
			},
			isFirstStep() {
				return this.step === 1;
			},
			isLastStep() {
				return this.step === this.stepCount;
			},
			stepCounterLabel() {
				return this.loc('IM_MESSENGER_FOLDER_PANEL_TOUR_COUNTER_ARIA', {
					'#CURRENT#': this.step,
					'#TOTAL#': this.stepCount
				});
			},
			title() {
				return this.loc(this.currentStep.titleCode);
			},
			text() {
				return this.loc(this.currentStep.textCode);
			},
			buttonText() {
				return this.loc(this.currentStep.buttonCode);
			},
			popupConfig() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					designSystemContext: POPUP_DESIGN_CONTEXT,
					width: POPUP_WIDTH,
					padding: 0,
					background: POPUP_BACKGROUND,
					borderRadius: POPUP_BORDER_RADIUS,
					contentBorderRadius: POPUP_BORDER_RADIUS,
					overlay: false,
					autoHide: false,
					closeByEsc: true,
					// the cross of the core popup carries a hardcoded english label, so the tour draws its own
					closeIcon: false,
					animation: 'fading',
					offsetLeft: this.getOffsetLeft(),
					offsetTop: this.getOffsetTop(),
					bindOptions: POPUP_BIND_OPTIONS,
					angle: {
						position: 'left',
						offset: POPUP_ANGLE_OFFSET
					},
					role: 'dialog',
					ariaLabelledBy: TITLE_ID,
					ariaDescribedBy: TEXT_ID
				};
			}
		},
		watch: {
			// The popup of the core is built once, out of the options it was handed then, and a config
			// recomputed for the next step never reaches it on its own. The pointer has to follow the folder
			// the step speaks of, so the step moves the live popup itself.
			step() {
				this.adjustPosition();
			},
			// A tile that leaves the rail during the step is replaced by another one, measured once the rail is laid out
			bindElement: {
				handler() {
					this.adjustPosition();
				},
				flush: 'post'
			},
			frameElement(frameElement) {
				if (frameElement) {
					this.observeHeight(frameElement);
				}
			}
		},
		mounted() {
			this.adjustPosition();
			// The container of the core popup is the node with the dialog role, and it is focusable on its
			// own: the tour is not modal, so the focus is moved there without a trap.
			if (canTakeFocusFrom(document.activeElement)) {
				main_popup.PopupManager.getPopupById(POPUP_ID)?.getPopupContainer()?.focus();
			}
			this.listElement.addEventListener('scroll', this.adjustPosition, {
				passive: true
			});
			this.observedHeights = new Map();
			this.resizeObserver = new ResizeObserver(this.onResize);
			this.observeHeight(this.listElement);
			if (this.frameElement) {
				this.observeHeight(this.frameElement);
			}
		},
		beforeUnmount() {
			this.listElement.removeEventListener('scroll', this.adjustPosition);
			this.resizeObserver.disconnect();
		},
		methods: {
			adjustPosition() {
				const popup = main_popup.PopupManager.getPopupById(POPUP_ID);
				if (!popup) {
					return;
				}
				popup.setBindElement(this.bindElement);
				popup.setOffset({
					offsetLeft: this.getOffsetLeft(),
					offsetTop: this.getOffsetTop()
				});
				popup.adjustPosition({
					...POPUP_BIND_OPTIONS,
					forceBindPosition: true
				});
			},
			observeHeight(element) {
				if (this.observedHeights.has(element)) {
					return;
				}
				this.observedHeights.set(element, element.clientHeight);
				this.resizeObserver.observe(element);
			},
			// Only the frame depends on the heights: a slider lays the list out later than the window resize, and a folder
			// added to the rail or hidden from it changes the frame while the list keeps its height.
			onResize(entries) {
				let hasHeightChanged = false;
				entries.forEach(({
					target
				}) => {
					const height = target.clientHeight;
					hasHeightChanged = hasHeightChanged || height !== this.observedHeights.get(target);
					this.observedHeights.set(target, height);
				});
				if (hasHeightChanged && this.frameElement) {
					this.adjustPosition();
				}
			},
			getOffsetLeft() {
				const railRight = this.railElement.getBoundingClientRect().right;
				return railRight - this.bindElement.getBoundingClientRect().left + POPUP_RAIL_GAP;
			},
			getOffsetTop() {
				const pointerShift = this.frameElement ? getFramePointerShift(this.listElement, this.frameElement, this.bindElement) : 0;
				return pointerShift - this.bindElement.offsetHeight / 2 - POPUP_ANGLE_OFFSET - POPUP_ANGLE_ARROW_MIDDLE;
			},
			loc(phraseCode, replacements = null) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			stepLabel(number) {
				return this.loc('IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_ARIA', {
					'#NUMBER#': number
				});
			}
		},
		template: `
		<MessengerPopup :id="POPUP_ID" :config="popupConfig" @close="$emit('close')">
			<div class="bx-im-folder-tour__container" :data-step="step" data-testid="im-folder-tour-popup">
				<!-- first in the container so the tab order matches the visual one -->
				<button
					type="button"
					class="bx-im-folder-tour__close"
					:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_CLOSE_ARIA')"
					data-testid="im-folder-tour-close-btn"
					@click="$emit('close')"
				>
					<BIcon :name="OutlineIcons.CROSS_L" />
				</button>
				<div v-if="currentStep.image" class="bx-im-folder-tour__image" :class="currentStep.image"></div>
				<div class="bx-im-folder-tour__content">
					<!-- the step is swapped in place, so the new title and text are announced from here;
							 the footer stays out of the region and is not read again on every step -->
					<div class="bx-im-folder-tour__body" aria-live="polite">
						<HeadlineMd
							:id="TITLE_ID"
							tag="div"
							className="bx-im-folder-tour__title"
							data-testid="im-folder-tour-title"
						>
							{{ title }}
						</HeadlineMd>
						<TextSm
							:id="TEXT_ID"
							tag="div"
							className="bx-im-folder-tour__text"
							data-testid="im-folder-tour-text"
						>{{ text }}</TextSm>
					</div>
					<div class="bx-im-folder-tour__footer">
						<div class="bx-im-folder-tour__pagination">
							<button
								type="button"
								class="bx-im-folder-tour__arrow"
								:disabled="isFirstStep"
								:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_PREV_ARIA')"
								data-testid="im-folder-tour-prev-btn"
								@click="$emit('prev')"
							>
								<BIcon :name="OutlineIcons.CHEVRON_LEFT_L" />
							</button>
							<!-- the dots are step controls of their own now, so the group is named and they stay
									 in the accessibility tree instead of being hidden behind one label -->
							<div
								class="bx-im-folder-tour__steps"
								role="group"
								:aria-label="stepCounterLabel"
								data-testid="im-folder-tour-counter"
							>
								<button
									v-for="number in stepCount"
									:key="number"
									type="button"
									class="bx-im-folder-tour__step"
									:class="{ '--current': number === step }"
									:aria-label="stepLabel(number)"
									:aria-current="number === step ? 'step' : null"
									:data-testid="'im-folder-tour-step-' + number + '-btn'"
									@click="$emit('goto', number)"
								>
									<Text3Xs v-if="number === step" className="bx-im-folder-tour__step-number">{{ number }}</Text3Xs>
								</button>
							</div>
							<button
								type="button"
								class="bx-im-folder-tour__arrow"
								:disabled="isLastStep"
								:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_NEXT_ARIA')"
								data-testid="im-folder-tour-next-btn"
								@click="$emit('next')"
							>
								<BIcon :name="OutlineIcons.CHEVRON_RIGHT_L" />
							</button>
						</div>
						<UiButton
							:size="ButtonSize.MEDIUM"
							:style="AirButtonStyle.FILLED"
							:text="buttonText"
							:dataset="{ testid: 'im-folder-tour-action-btn' }"
							class="bx-im-folder-tour__action"
							@click="$emit('next')"
						/>
					</div>
				</div>
			</div>
		</MessengerPopup>
	`
	};

	const SectionCode$1 = Object.freeze({
		settings: 'settings'
	});

	// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder panel item
	// menu follows, so a label never has to be looked up to be known.
	const MENU_ID$1 = 'im-folder-panel-settings-menu';
	class PanelSettingsMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			openFolderList: 'openFolderList'
		};
		constructor() {
			super();
			this.id = MENU_ID$1;
		}
		getMenuItems() {
			return [this.getCreateItem(), this.getListItem(), this.getEditAllItem(), ...this.groupItems([this.getSettingsItem()], SectionCode$1.settings)];
		}
		getMenuGroups() {
			return [{
				code: SectionCode$1.settings
			}];
		}
		getCreateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_CREATE'),
				dataset: {
					testid: `${MENU_ID$1}-create`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickCreateFolder();
					im_v2_lib_folder.FolderManager.startCreation();
				}
			};
		}
		getListItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
				dataset: {
					testid: `${MENU_ID$1}-list`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onOpenList();
					this.emit(PanelSettingsMenu.events.openFolderList);
				}
			};
		}
		getEditAllItem() {
			const folder = this.#getCompositeAllFolder();
			if (!folder) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_EDIT_ALL'),
				dataset: {
					testid: `${MENU_ID$1}-edit-all`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickEdit({
						folderId: folder.id
					});
					im_v2_lib_folder.FolderManager.openAllFolderSettings();
				}
			};
		}
		getSettingsItem() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable)) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_SETTINGS'),
				dataset: {
					testid: `${MENU_ID$1}-settings`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().settings.onOpenFromFolderMenu();
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.settings
					});
				}
			};
		}

		// The menu stands on no folder, so the "All" folder is found by its code; only a composite one owns
		// a composition to edit, the same condition the card menu of that folder follows.
		#getCompositeAllFolder() {
			const folder = this.store.getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.all);
			if (!folder || !this.store.getters['recent/folders/isComposite'](folder.id)) {
				return null;
			}
			return folder;
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
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			type="button"
			class="bx-im-messenger-folder-panel__settings_container --focus-visible"
			aria-haspopup="menu"
			:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_SETTINGS_ARIA_LABEL')"
			data-testid="folder-panel-settings-btn"
			ref="icon"
			@click="onSettingsClick"
		>
			<BIcon
				:name="OutlineIcons.MORE_M"
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

	// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder list item
	// menu follows, so a label never has to be looked up to be known.
	const MENU_ID = 'im-folder-panel-item-menu';
	class PanelItemMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			openFolderList: 'openFolderList'
		};
		constructor() {
			super();
			this.id = MENU_ID;
		}
		getMenuItems() {
			if (this.#isSystemFolder()) {
				return [this.getEditAllItem(), this.getReadAllItem(), this.getListItem()];
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
		getEditAllItem() {
			// Only a composite folder owns a composition to edit; the remaining system folders are filled
			// by the server and keep the navigation item alone.
			if (!this.#isCompositeFolder()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_EDIT_ALL'),
				dataset: {
					testid: `${MENU_ID}-edit-all`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickEdit({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderContextMenu
					});
					im_v2_lib_folder.FolderManager.openAllFolderSettings();
				}
			};
		}
		getUpdateItem() {
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
				dataset: {
					testid: `${MENU_ID}-update`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickEdit({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderContextMenu
					});
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
				dataset: {
					testid: `${MENU_ID}-delete`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onClickDelete({
						folderId: this.context.folderId,
						subSection: im_v2_lib_analytics.AnalyticsSubSection.folderContextMenu
					});
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
				dataset: {
					testid: `${MENU_ID}-list`
				},
				onClick: () => {
					im_v2_lib_analytics.Analytics.getInstance().folder.onOpenList(im_v2_lib_analytics.AnalyticsSubSection.folderContextMenu);
					this.emit(PanelItemMenu.events.openFolderList);
				}
			};
		}
		getReadAllItem() {
			if (!this.#hasReadAllOperation()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_READ_ALL_CHATS'),
				icon: ui_iconSet_api_core.Outline.CHATS_WITH_CHECK,
				dataset: {
					testid: `${MENU_ID}-read-all`
				},
				onClick: () => this.#onReadAllClick()
			};
		}
		#hasReadAllOperation() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable)) {
				return false;
			}
			return im_v2_lib_menu.ReadAllOperation.isSupported(this.#getReadAllSection());
		}
		#onReadAllClick() {
			im_v2_lib_menu.ReadAllOperation.run(this.#getReadAllSection(), im_v2_lib_analytics.AnalyticsSection.folderMenu);
		}

		// The composite folder unites several sections and owns none, so it is decided by its code before
		// the section is asked for at all: it spans the whole messenger and is read the way the recent
		// list is.
		#getReadAllSection() {
			return this.#isAllFolder() ? im_v2_const.RecentType.default : this.#getRecentSection();
		}
		#isAllFolder() {
			return this.context.folder?.code === im_v2_const.SystemFolderCode.all;
		}
		#getRecentSection() {
			return this.context.folder?.definition?.recentSection;
		}
		#isSystemFolder() {
			return this.context.folderType === im_v2_const.FolderType.system;
		}
		#isCompositeFolder() {
			return this.store.getters['recent/folders/isComposite'](this.context.folderId);
		}
	}

	const QUEUE_EXTENSIONS = ['ui.banner-dispatcher', 'ui.auto-launch'];
	const TOUR_QUEUE_ID = 'im-folder-all-onboarding-tour';
	const RequestState = {
		idle: 'idle',
		loading: 'loading',
		queued: 'queued',
		running: 'running',
		finished: 'finished',
		cancelled: 'cancelled'
	};
	class TourLauncher {
		#state = RequestState.idle;
		// ui.banner-dispatcher keeps the queued callback for the life of the page, so the tour is let go once over
		#show = null;
		#onDone = null;
		#autoLauncher = null;
		async request(show) {
			if (this.#state !== RequestState.idle) {
				return;
			}
			this.#state = RequestState.loading;
			this.#show = show;
			try {
				const {
					BannerDispatcher,
					AutoLauncher
				} = await main_core.Runtime.loadExtension(QUEUE_EXTENSIONS);
				if (this.#state === RequestState.cancelled) {
					return;
				}
				this.#autoLauncher = AutoLauncher;
				if (!AutoLauncher.isEnabled()) {
					AutoLauncher.enable();
				}

				// Set before queueing: an item started right inside toQueue() must stay running
				this.#state = RequestState.queued;
				BannerDispatcher.high.toQueue(done => this.#launch(done), {
					id: TOUR_QUEUE_ID,
					forceShowOnTop: true
				});
			} catch {
				this.#state = RequestState.finished;
			}
		}
		finish() {
			if (this.#state === RequestState.running) {
				this.#release();
			}
		}
		cancel() {
			if (this.#state === RequestState.running) {
				this.#release();
				return;
			}
			if (this.#state === RequestState.queued) {
				this.#autoLauncher.unregister(TOUR_QUEUE_ID);
				this.#autoLauncher = null;
			}
			if (this.#state !== RequestState.finished) {
				this.#state = RequestState.cancelled;
			}
			this.#show = null;
		}
		#launch(done) {
			this.#onDone = done;
			if (this.#state === RequestState.cancelled) {
				this.#release();
				return {};
			}
			this.#state = RequestState.running;
			try {
				this.#show();
			} catch {
				this.#release();
			}

			// LaunchItemCallback must return a non-nullish value; the launcher ignores it
			return {};
		}
		#release() {
			if (!this.#onDone) {
				return;
			}
			const done = this.#onDone;
			this.#onDone = null;
			this.#show = null;
			this.#state = RequestState.finished;
			done();
		}
	}

	const NO_TOUR_STEP = 0;
	const FIRST_TOUR_STEP = 1;
	const LAST_TOUR_STEP = TOUR_STEPS.length;

	// @vue/component
	const FolderPanel = {
		name: 'FolderPanel',
		components: {
			PanelSettings,
			PanelItem,
			FolderListSettings,
			OnboardingTour
		},
		data() {
			return {
				showFolderList: false,
				tourStep: NO_TOUR_STEP
			};
		},
		computed: {
			folderList() {
				return this.$store.getters['recent/folders/getVisibleList'];
			},
			highlightedTourTarget() {
				const target = TOUR_STEPS[this.tourStep - 1]?.target ?? null;
				if (target === null || target === PANEL_TOUR_TARGET) {
					return target;
				}
				const item = this.getFolderElement(target);
				const list = this.$refs.list;
				return item && list && isItemInListView(list, item) ? target : null;
			},
			tourAnchorElement() {
				const target = this.highlightedTourTarget;
				if (target !== null && target !== PANEL_TOUR_TARGET) {
					return this.getFolderElement(target);
				}
				return this.getFolderElement(im_v2_const.SystemFolderCode.all) ?? this.getFirstFolderElement();
			},
			isPanelHighlighted() {
				return this.highlightedTourTarget === PANEL_TOUR_TARGET;
			},
			isTourVisible() {
				return this.tourStep !== NO_TOUR_STEP;
			}
		},
		created() {
			this.itemElements = new Map();
			this.isUnmounting = false;
			this.tourLauncher = new TourLauncher();
			this.focusBeforeTour = null;
			this.contextMenuManager = new PanelItemMenu();
			this.contextMenuManager.subscribe(PanelItemMenu.events.openFolderList, this.onOpenFolderList);
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.messenger.onClose, this.onMessengerClose);
			this.startTour();
		},
		beforeUnmount() {
			this.isUnmounting = true;
			this.tourLauncher.cancel();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.messenger.onClose, this.onMessengerClose);
			this.contextMenuManager.destroy();
		},
		methods: {
			openFolderLayout(layout) {
				const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
				const targetLayout = layout.name === im_v2_const.Layout.folderAll ? layoutManager.resolveLayoutEntityId(layout) : layout;
				main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList);
				void layoutManager.setLayout(targetLayout);
			},
			onSelectFolder(folder) {
				const layout = im_v2_lib_folder.FolderManager.getFolderLayout(folder);
				if (!layout) {
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().folder.onOpenFolder(folder);
				if (im_v2_lib_folder.FolderManager.isFolderLayout(layout.name)) {
					this.openFolderLayout(layout);
					return;
				}
				void im_public.Messenger.openNavigationItem({
					id: layout.name
				});
			},
			onFolderContextMenu(folder, event) {
				const context = {
					folderId: folder.id,
					folderType: folder.type,
					folder
				};
				const raisedByPointer = event.button === 2;
				const target = raisedByPointer ? {
					left: event.pageX,
					top: event.pageY
				} : this.itemElements.get(folder.id) ?? event.currentTarget;
				this.contextMenuManager.openMenu(context, target);
			},
			onOpenFolderList() {
				this.showFolderList = true;
			},
			startTour() {
				if (!im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.folderAllOnboarding)) {
					return;
				}
				void this.tourLauncher.request(() => {
					if (this.isUnmounting || !im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.folderAllOnboarding) || !this.isMessengerOnTop()) {
						this.tourLauncher.finish();
						return;
					}
					this.focusBeforeTour = document.activeElement;
					this.setTourStep(FIRST_TOUR_STEP);
				});
			},
			isMessengerOnTop() {
				if (im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode()) {
					return main_sidepanel.SidePanel.Instance.getOpenSlidersCount() === 0;
				}
				return im_v2_lib_slider.MessengerSlider.getInstance().isFocused();
			},
			setTourStep(step) {
				this.scrollTourTargetIntoView(step);
				this.tourStep = step;
				if (step === LAST_TOUR_STEP) {
					this.markTourAsWatched();
				}
			},
			onTourNext() {
				if (this.tourStep < LAST_TOUR_STEP) {
					this.setTourStep(this.tourStep + 1);
					return;
				}
				this.openAllFolderSettings();
			},
			onTourPrev() {
				if (this.tourStep > FIRST_TOUR_STEP) {
					this.setTourStep(this.tourStep - 1);
				}
			},
			onTourGoto(step) {
				if (step !== this.tourStep) {
					this.setTourStep(step);
				}
			},
			onTourClose() {
				if (this.isUnmounting) {
					return;
				}
				if (this.isTourVisible) {
					this.markTourAsWatched();
				}
				this.finishTour();
			},
			onMessengerClose() {
				this.isUnmounting = true;
				this.hideTour();
				this.tourLauncher.cancel();
			},
			openAllFolderSettings() {
				// the user goes on to the settings screen rather than back to where the tour came in
				this.focusBeforeTour = null;
				this.hideTour();
				im_v2_lib_folder.FolderManager.openAllFolderSettings();
			},
			finishTour() {
				this.hideTour();
				this.returnFocus();
			},
			returnFocus() {
				const element = this.focusBeforeTour;
				if (element && element !== document.body && element.isConnected) {
					element.focus();
					return;
				}
				this.$refs.container.focus();
			},
			hideTour() {
				this.tourStep = NO_TOUR_STEP;
				this.tourLauncher.finish();
			},
			markTourAsWatched() {
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.folderAllOnboarding);
			},
			registerItemElement(folderId, item) {
				if (item) {
					this.itemElements.set(folderId, item.$el);
					return;
				}
				this.itemElements.delete(folderId);
			},
			scrollTourTargetIntoView(step) {
				const {
					target
				} = TOUR_STEPS[step - 1];
				const item = target === PANEL_TOUR_TARGET ? this.getFirstFolderElement() : this.getFolderElement(target);
				item?.scrollIntoView({
					block: 'nearest'
				});
			},
			getFolderElement(code) {
				const folder = this.folderList.find(item => item.code === code);
				return folder ? this.itemElements.get(folder.id) : null;
			},
			getFirstFolderElement() {
				return this.itemElements.get(this.folderList[0]?.id);
			}
		},
		template: `
		<div class="bx-im-messenger-folder-panel__wrapper">
			<div
				class="bx-im-messenger-folder-panel__container"
				data-testid="folder-panel-container"
				tabindex="-1"
				ref="container"
			>
				<div
					class="bx-im-messenger-folder-panel__list --hidden-scroll"
					data-testid="folder-panel-list"
					ref="list"
				>
					<div
						class="bx-im-messenger-folder-panel__items"
						:class="{ 'ui-highlighter': isPanelHighlighted }"
						data-testid="folder-panel-items"
						ref="items"
					>
						<PanelItem
							v-for="folder in folderList"
							:key="folder.id"
							:item="folder"
							:highlighted="folder.code === highlightedTourTarget"
							:ref="(item) => registerItemElement(folder.id, item)"
							@click="onSelectFolder(folder)"
							@contextmenu.prevent="onFolderContextMenu(folder, $event)"
						/>
					</div>
				</div>
				<div class="bx-im-messenger-folder-panel__footer" data-testid="folder-panel-footer">
					<PanelSettings @openFolderList="onOpenFolderList" />
				</div>
			</div>
			<Transition name="bx-im-folder-list-panel">
				<FolderListSettings v-if="showFolderList" @close="showFolderList = false" />
			</Transition>
			<OnboardingTour
				v-if="isTourVisible"
				:step="tourStep"
				:bindElement="tourAnchorElement"
				:railElement="$refs.container"
				:listElement="$refs.list"
				:frameElement="isPanelHighlighted ? $refs.items : null"
				@prev="onTourPrev"
				@next="onTourNext"
				@goto="onTourGoto"
				@close="onTourClose"
			/>
		</div>
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
		[im_v2_const.Layout.vibecodeApp]: {
			list: im_v2_component_list_container_vibecodeApp.VibecodeAppListContainer,
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
			list: im_v2_component_list_container_folder.PersonalFolderListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.folderAll]: {
			list: im_v2_component_list_container_folder.AllFolderListContainer,
			content: im_v2_component_content_chat.ChatContent
		},
		[im_v2_const.Layout.folderAllSettings]: {
			list: im_v2_component_list_container_folder.AllFolderListContainer,
			content: im_v2_component_content_folderForms.AllFolderSettings
		}
	};

	// Layouts with no list of their own: on the left they show the list of the section where plain chats
	// live, picked in `listComponent()` of the root component. Their entries above stay as the fallback
	// for the case when that section is the chats one. The list is closed and manual - a new layout
	// without a list of its own belongs here only by a deliberate decision, and layouts with no list at
	// all (openlines, settings, market) do not belong here.
	const LayoutsWithRegularChatsList = new Set([im_v2_const.Layout.createChat, im_v2_const.Layout.updateChat, im_v2_const.Layout.createFolder, im_v2_const.Layout.updateFolder, im_v2_const.Layout.copyCollab, im_v2_const.Layout.notification, im_v2_const.Layout.conference]);

	// @vue/component
	const Messenger = {
		name: 'MessengerRoot',
		components: {
			ListNavigator: im_v2_component_list_navigator.ListNavigator,
			OpenlinesContent: im_v2_component_content_openlines.OpenlinesContent,
			DesktopOverlay,
			FolderPanel,
			PlayerBar: im_v2_component_playerBar.PlayerBar
		},
		provide() {
			return {
				[im_v2_lib_a11y.CHAT_DETAIL_FOCUS_CONTEXT]: this.focusContext
			};
		},
		setup() {
			// A class instance must stay out of the reactive state, and the context coordinates the detail
			// areas of this messenger instance alone - it goes down together with it.
			const focusContext = new im_v2_lib_a11y.ChatDetailFocusContext();
			ui_vue3.onBeforeUnmount(() => focusContext.destroy());
			return {
				focusContext
			};
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
				// A layout with no list of its own shows the list of the section where plain chats live
				// now. Its own map entry is the fallback of that rule: with no All folder the resolver
				// answers with the chats layout and the entry is taken after all.
				const listLayoutName = LayoutsWithRegularChatsList.has(this.layoutName) ? im_v2_lib_folder.FolderManager.getRegularChatsLayout().name : this.layoutName;
				return LayoutComponentMap[listLayoutName].list;
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
			isPlayerBarVisible() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBackgroundAudioPlaybackAvailable) && !this.isOpenline;
			},
			containerClasses() {
				return {
					'--dark-theme': im_v2_lib_theme.ThemeManager.isDarkTheme(),
					'--light-theme': im_v2_lib_theme.ThemeManager.isLightTheme(),
					'--desktop': im_v2_lib_desktop.DesktopManager.isDesktop(),
					'--air-design': im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled)
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
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.slider.onClose, this.handleSliderClose);
			main_core_events.EventEmitter.emit(im_v2_const.EventType.messenger.onReady);
		},
		beforeUnmount() {
			this.getLayoutManager().destroy();
			im_v2_lib_escManager.EscManager.getInstance().unregister();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.slider.onClose, this.handleSliderClose);
			main_core_events.EventEmitter.emit(im_v2_const.EventType.messenger.onClose);
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
			},
			handleSliderClose() {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.messenger.onClose);
			}
		},
		template: `
		<div class="bx-im-messenger__scope bx-im-messenger__container --ui-context-content-light" :class="containerClasses" ref="container" data-testid="im-messenger">
			<div class="bx-im-messenger__layout_container">
				<div class="bx-im-messenger__layout_content">
					<FolderPanel v-if="isFolderAvailable" />
					<div v-if="hasListComponent" class="bx-im-messenger__list_container">
						<ListNavigator :listComponent="listComponent" @selectChat="onSelectChat" />
					</div>
					<div class="bx-im-messenger__content_container" :class="{'--with-list': hasListComponent}">
						<PlayerBar v-if="isPlayerBarVisible" />
						<div class="bx-im-messenger__content_layout">
							<div v-if="openlinesContentOpened" class="bx-im-messenger__openlines_container" :class="{'--hidden': !isOpenline}">
								<OpenlinesContent v-show="isOpenline" :entityId="entityId" />
							</div>
							<component v-if="!isOpenline" :is="contentComponent" :entityId="entityId" />
						</div>
					</div>
				</div>
			</div>
		</div>
		<DesktopOverlay />
	`
	};

	exports.Messenger = Messenger;

})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX.Event, BX, window, BX, BX, BX.Vue3, BX.Messenger.Integration.Viewer, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Css, BX.Messenger.v2.Css, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Desktop, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.SidePanel, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Main, BX.UI.Accessibility, BX.UI.IconSet, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI.System, BX.Messenger.v2.Lib, BX.UI, BX.UI.Vue3.Components, window, BX.UI.System, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Elements, BX.UI.IconSet, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.IM.V2.Component.List.Container);
//# sourceMappingURL=messenger.bundle.js.map
