/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_v2_component_list_container_elements_createChatPromo, im_v2_component_list_container_elements_createChatButton, im_v2_component_list_items_collab, im_v2_const, im_v2_lib_promo, im_v2_lib_analytics, im_v2_lib_createChat, im_v2_lib_feature, im_v2_lib_logger, im_v2_lib_permission, im_v2_component_list_container_elements_headerMenu, im_v2_component_search, im_v2_lib_collab, im_v2_component_list_container_elements_listSlider, main_core_events, im_v2_lib_utils, ui_system_highlighter, im_v2_component_elements_avatar, im_v2_lib_chat, im_v2_application_core, ui_iconSet_api_vue, main_loader, im_v2_component_elements_popup, ui_iconSet_api_core, im_v2_lib_menu, im_v2_lib_entityCreator, im_v2_component_elements_scrollWithGradient, im_v2_component_list_container_elements_navigationSection, im_v2_component_elements_listLoadingState) {
	'use strict';

	// @vue/component
	const CollabListContainer = {
		name: 'CollabListContainer',
		components: {
			CollabList: im_v2_component_list_items_collab.CollabList,
			CreateChatPromo: im_v2_component_list_container_elements_createChatPromo.CreateChatPromo,
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton,
			HeaderMenu: im_v2_component_list_container_elements_headerMenu.HeaderMenu,
			CollabUnreadList: im_v2_component_list_items_collab.CollabUnreadList,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: im_v2_component_search.RecentSearch
		},
		emits: ['selectChat'],
		data() {
			return {
				searchMode: false,
				searchQuery: '',
				isSearchLoading: false,
				unreadMode: false
			};
		},
		computed: {
			ChatType: () => im_v2_const.ChatType,
			RecentType: () => im_v2_const.RecentType,
			canCreate() {
				const creationAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.collabCreationAvailable);
				const hasAccess = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCollab);
				return creationAvailable && hasAccess;
			},
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			},
			createIconClass() {
				return {
					'bx-im-list-container-collab__header_create-collab': !this.isCollabV2Available
				};
			},
			searchInputText() {
				return im_v2_lib_collab.CollabManager.getSearchInputText();
			},
			isUnreadRecentModeAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.unreadRecentModeAvailable);
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Collab container created');
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
			void this.showCollabAiPromo();
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onDocumentClick(event) {
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['collab-container']);
				if (!clickOnRecentContainer) {
					this.onCloseSearch();
				}
			},
			onOpenSearch() {
				this.searchMode = true;
			},
			onCloseSearch() {
				this.searchMode = false;
				this.searchQuery = '';
			},
			onUpdateSearch(query) {
				this.searchMode = true;
				this.searchQuery = query;
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
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.collab,
					dialogId
				});
			},
			onCreateClick() {
				if (!im_v2_lib_feature.TariffManager.collabV2.isAvailable() && this.isCollabV2Available) {
					im_v2_lib_feature.TariffManager.collabV2.openFeatureSlider();
					return;
				}
				im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(im_v2_const.ChatType.collab);
				this.startCollabCreation();
			},
			startCollabCreation() {
				void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(im_v2_const.ChatType.collab);
			},
			onToggleUnreadMode() {
				this.unreadMode = !this.unreadMode;
			},
			async showCollabAiPromo() {
				if (!im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.collabAi)) {
					return;
				}
				await main_core.Runtime.loadExtension('socialnetwork.v2.components.popup.new-projects-popup');
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.collabAi);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-list-container-collab__container" ref="collab-container">
			<div class="bx-im-list-container-collab__header_container">
				<HeaderMenu
					v-if="isUnreadRecentModeAvailable"
					:unreadMode="unreadMode"
					:recentSection="RecentType.collab"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-collab__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="searchInputText"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatButton
					v-if="canCreate"
					@click="onCreateClick"
					:class="createIconClass"
				/>
			</div>
			<div class="bx-im-list-container-collab__elements_container">
				<div class="bx-im-list-container-collab__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.collab"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<CollabList v-show="!searchMode && !unreadMode" @selectChat="onSelectChat" />
					<CollabUnreadList v-if="unreadMode" @selectChat="onSelectChat"/>
				</div>
			</div>
		</div>
	`
	};

	const EVENT_NAMESPACE = 'BX.Messenger.v2.List.Collab.Promo';
	const INITIAL_DELAY = 1000;
	const BETWEEN_DELAY = 600;
	class CollabPromoManager extends main_core_events.EventEmitter {
		static events = {
			showCardPromo: 'showCardPromo',
			showCreateChatPromo: 'showCreateChatPromo'
		};
		#dialogId;
		#timer;
		constructor(parentChatId) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#dialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(parentChatId);
		}
		init() {
			this.#timer = setTimeout(() => {
				if (this.#shouldShowCardPromo()) {
					this.emit(CollabPromoManager.events.showCardPromo, true);
					return;
				}
				if (this.#shouldShowCreateChatPromo()) {
					this.emit(CollabPromoManager.events.showCreateChatPromo, true);
				}
			}, INITIAL_DELAY);
		}
		onCloseCardPromo() {
			void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.collabCardNavigation);
			this.emit(CollabPromoManager.events.showCardPromo, false);
			this.#timer = setTimeout(() => {
				if (this.#shouldShowCreateChatPromo()) {
					this.emit(CollabPromoManager.events.showCreateChatPromo, true);
				}
			}, BETWEEN_DELAY);
		}
		onCloseCreateChatPromo() {
			void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.collabCreateChat);
			this.emit(CollabPromoManager.events.showCreateChatPromo, false);
		}
		stop() {
			this.unsubscribeAll(CollabPromoManager.events.showCreateChatPromo);
			this.unsubscribeAll(CollabPromoManager.events.showCardPromo);
			clearTimeout(this.#timer);
		}
		#shouldShowCardPromo() {
			return im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.collabCardNavigation);
		}
		#shouldShowCreateChatPromo() {
			const isPromoActive = im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.collabCreateChat);
			return isPromoActive && this.#canCreateChat();
		}
		#canCreateChat() {
			const manager = im_v2_lib_permission.PermissionManager.getInstance();
			const canCreateByRole = manager.canPerformActionByRole(im_v2_const.ActionByRole.createChildChat, this.#dialogId);
			const canCreateByUserType = manager.canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
			return canCreateByRole && canCreateByUserType;
		}
	}

	async function createFeatureMenu(bindElement, parentChatId) {
		const {
			FeatureMenu
		} = await main_core.Runtime.loadExtension('socialnetwork.feature-menu');
		const {
			entityLink
		} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](parentChatId, true);
		return new FeatureMenu({
			projectId: entityLink.id,
			bindElement
		});
	}

	// @vue/component
	const CardButtonLoader = {
		name: 'CardButtonLoader',
		mounted() {
			this.loader = new main_loader.Loader({
				target: this.$refs['loader-container'],
				size: 18,
				color: '#525c69'
			});
			void this.loader.show();
		},
		beforeUnmount() {
			this.loader.destroy();
		},
		template: `
		<div class="bx-im-nested-list-collab-card__button_loader" ref="loader-container"></div>
	`
	};

	// @vue/component
	const CollabCardButton = {
		name: 'CollabCardButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			CardButtonLoader
		},
		props: {
			title: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				default: 0
			},
			withIcon: {
				type: Boolean,
				default: false
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		template: `
		<div class="bx-im-nested-list-collab-card__button --ui-context-content-light" :class="{'--with-icon': withIcon}">
			<div v-if="withIcon" class="bx-im-nested-list-collab-card__button_more">
				<CardButtonLoader v-if="isLoading" />
				<BIcon
					v-else
					:name="OutlineIcons.MORE_M"
					:title="title"
				/>
			</div>
			<div v-else class="bx-im-nested-list-collab-card__button_text --ellipsis" :title="title">
				{{ title }}
			</div>
			<div v-if="counter" class="bx-im-nested-list-collab-card__button_counter">
				{{ counter }}
			</div>
		</div>
	`
	};

	// @vue/component
	const CollabCardButtonPanel = {
		name: 'CollabCardButtonPanel',
		components: {
			CollabCardButton
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isFeatureMenuLoading: false
			};
		},
		computed: {
			buttonConfig() {
				const {
					entities
				} = this.$store.getters['chats/collabs/getByChatId'](this.parentChatId);
				return {
					[im_v2_const.CollabEntityType.tasks]: {
						title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_TASKS'),
						url: entities.tasks.url,
						counter: entities.tasks.counter
					},
					[im_v2_const.CollabEntityType.files]: {
						title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_FILES'),
						url: entities.files.url,
						counter: entities.files.counter
					},
					[im_v2_const.CollabEntityType.calendar]: {
						title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_CALENDAR'),
						url: entities.calendar.url,
						counter: entities.calendar.counter
					}
				};
			}
		},
		methods: {
			async onMoreClick() {
				this.isFeatureMenuLoading = true;
				try {
					const menu = await createFeatureMenu(this.$refs['button-more-container'], this.parentChatId);
					await menu.showFeatures();
				} finally {
					this.isFeatureMenuLoading = false;
				}
			},
			openEntitySlider(url) {
				BX.SidePanel.Instance.open(url, {
					cacheable: false,
					customLeftBoundary: 0
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-nested-list-collab-card__buttons">
			<CollabCardButton
				v-for="({title, counter, url}, type) in buttonConfig"
				:key="type"
				:title="title"
				:counter="counter"
				@click="openEntitySlider(url)"
			/>
			<div ref="button-more-container">
				<CollabCardButton
					:isLoading="isFeatureMenuLoading"
					:title="loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_MORE')"
					:withIcon="true"
					@click="onMoreClick"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const CollabCardBackground = {
		name: 'CollabCardBackground',
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			parentChat() {
				return this.$store.getters['chats/getByChatId'](this.parentChatId, true);
			},
			backgroundClass() {
				return {
					'--no-avatar': !this.parentChat.avatar
				};
			},
			backgroundStyle() {
				if (!this.parentChat.avatar) {
					return null;
				}
				return {
					backgroundImage: `url(${this.parentChat.avatar})`
				};
			},
			overlayStyle() {
				if (this.parentChat.avatar) {
					return null;
				}
				return {
					backgroundColor: this.parentChat.color,
					opacity: 0.5
				};
			}
		},
		template: `
		<div class="bx-im-nested-list-collab-card__background" :class="backgroundClass" :style="backgroundStyle">
			<div class="bx-im-nested-list-collab-card__background-overlay" :style="overlayStyle"></div>
		</div>
	`
	};

	const POPUP_CLASSNAME$1 = 'bx-im-collab-card-promo-popup__container --line-clamp-3 --ui-context-content-dark';

	// @vue/component
	const CardPromo = {
		name: 'CardPromo',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			PopupType: () => im_v2_const.PopupType,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					className: POPUP_CLASSNAME$1,
					width: 400,
					height: 121,
					padding: 0,
					overlay: false,
					offsetLeft: this.bindElement.offsetWidth + 15,
					offsetTop: -129,
					autoHide: true,
					bindOptions: {
						position: 'bottom'
					},
					closeIcon: true,
					angle: {
						offset: 45,
						position: 'left'
					},
					animation: 'fading'
				};
			},
			title() {
				return this.loc('IM_LIST_CONTAINER_COLLAB_CARD_PROMO_TITLE', {
					'#BR#': '\n'
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.collabCardPromo"
			@close="$emit('close')"
		>
			<div class="bx-im-collab-card-promo-popup__cover"></div>
			<div class="bx-im-collab-card-promo-popup__info">
				<div class="bx-im-collab-card-promo-popup__title">
					{{ title }}
				</div>
			</div>
		</MessengerPopup>
	`
	};

	// @vue/component
	const NewTabButton = {
		name: 'NewTabButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		template: `
		<div class="bx-im-collab-card-new-tab__container --ui-context-content-light">
			<BIcon :name="OutlineIcons.OPEN_NEW" :hoverable="true" class="bx-im-collab-card-new-tab__icon" />
		</div>
	`
	};

	// @vue/component
	const CollabCard = {
		name: 'CollabCard',
		components: {
			CollabCardBackground,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			CollabCardButtonPanel,
			CardPromo,
			NewTabButton
		},
		inject: ['promoManager'],
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			withNewTabButton: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				showPromo: false
			};
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			parentChat() {
				return this.$store.getters['chats/getByChatId'](this.parentChatId);
			},
			parentChatTitle() {
				return this.parentChat.name;
			},
			containerClass() {
				return {
					'ui-highlighter': this.showPromo
				};
			}
		},
		created() {
			this.bindPromoEvent();
		},
		methods: {
			bindPromoEvent() {
				this.promoManager.subscribe(CollabPromoManager.events.showCardPromo, event => {
					this.showPromo = event.getData();
				});
			},
			onClosePromo() {
				this.promoManager.onCloseCardPromo();
			},
			onOpenInNewTab() {
				const collabLink = im_v2_lib_chat.ChatManager.buildChatLink(this.parentChat.dialogId);
				im_v2_lib_utils.Utils.browser.openLink(collabLink);
			}
		},
		template: `
		<div :class="containerClass" class="bx-im-nested-list-collab-card__container --ui-context-content-dark" ref="card-container">
			<CollabCardBackground :parentChatId="parentChatId" />
			<div class="bx-im-nested-list-collab-card__header">
				<ChatAvatar
					:avatarDialogId="parentChat.dialogId"
					:contextDialogId="parentChat.dialogId"
					:size="AvatarSize.XXL"
					class="bx-im-nested-list-collab-card__avatar"
				/>
				<div :title="parentChatTitle" class="bx-im-nested-list-collab-card__title --line-clamp-2">
					{{ parentChatTitle }}
				</div>
			</div>
			<CollabCardButtonPanel :parentChatId="parentChatId" />
			<NewTabButton v-if="withNewTabButton" @click="onOpenInNewTab" />
		</div>
		<CardPromo v-if="showPromo" :bindElement="$refs['card-container']" @close="onClosePromo" />
	`
	};

	// @vue/component
	const CardLoader = {
		name: 'CardLoader',
		template: `
		<div class="bx-im-nested-list-collab-card__loader"></div>
	`
	};

	class CreateMenu extends im_v2_lib_menu.BaseMenu {
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false
			};
		}
		getMenuItems() {
			return [this.getTaskItem(), this.getMeetingItem(), this.getChatItem(), this.getFlowItem()];
		}
		getTaskItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_TASK_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.TASK,
				onClick: () => {
					new im_v2_lib_entityCreator.EntityCreator().openCollabTaskCreationForm(this.context.collabId);
				}
			};
		}
		getMeetingItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_MEETING_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS,
				onClick: () => {
					void new im_v2_lib_entityCreator.EntityCreator().openCollabMeetingCreationSlider(this.context.collabId);
				}
			};
		}
		getChatItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.CHATS,
				onClick: () => {
					if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreationLayoutActive(im_v2_lib_createChat.CreatableChatType.collabChat)) {
						return;
					}
					void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(im_v2_lib_createChat.CreatableChatType.collabChat, {
						parentChatId: this.context.parentChatId
					});
				}
			};
		}
		getFlowItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_CREATE_FLOW_MSGVER_1'),
				icon: ui_iconSet_api_core.Outline.BOTTLENECK,
				onClick: () => {
					const entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.context.parentChatId);
					void entityCreator.createFlowForChat();
				}
			};
		}
	}

	const POPUP_CLASSNAME = 'bx-im-collab-create-chat-promo-popup__container --line-clamp-3 --ui-context-content-dark';

	// @vue/component
	const CreateChatPromo = {
		name: 'CreateChatPromo',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			PopupType: () => im_v2_const.PopupType,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					className: POPUP_CLASSNAME,
					width: 400,
					height: 121,
					padding: 0,
					overlay: false,
					offsetLeft: 58,
					offsetTop: -77,
					autoHide: true,
					bindOptions: {
						position: 'bottom'
					},
					closeIcon: true,
					angle: {
						offset: 45,
						position: 'left'
					},
					animation: 'fading'
				};
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.collabCreateChatPromo"
			@close="$emit('close')"
		>
			<div class="bx-im-collab-create-chat-promo-popup__cover"></div>
			<div class="bx-im-collab-create-chat-promo-popup__info">
				<div class="bx-im-collab-create-chat-promo-popup__title">
					{{ loc('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_PROMO_TITLE') }}
				</div>
			</div>
		</MessengerPopup>
	`
	};

	// @vue/component
	const CollabHeader = {
		name: 'CollabHeader',
		components: {
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			CreateChatPromo,
			HeaderMenu: im_v2_component_list_container_elements_headerMenu.HeaderMenu
		},
		inject: ['promoManager'],
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			currentSection: {
				type: String,
				required: true
			},
			unreadMode: {
				type: Boolean,
				required: true
			},
			searchMode: {
				type: Boolean,
				required: true
			},
			isSearchLoading: {
				type: Boolean,
				required: true
			}
		},
		emits: ['openSearch', 'closeSearch', 'updateSearch', 'toggleUnreadMode'],
		data() {
			return {
				showCreateChatPromo: false
			};
		},
		computed: {
			parentDialogId() {
				return im_v2_lib_utils.Utils.dialog.buildChatDialogId(this.parentChatId);
			},
			canCreateEntities() {
				const manager = im_v2_lib_permission.PermissionManager.getInstance();
				const canCreateByRole = manager.canPerformActionByRole(im_v2_const.ActionByRole.createChildChat, this.parentDialogId);
				const canCreateByUserType = manager.canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
				return canCreateByRole && canCreateByUserType;
			},
			collabId() {
				const {
					collabId
				} = this.$store.getters['chats/collabs/getByChatId'](this.parentChatId);
				return collabId;
			},
			createChatClasses() {
				return {
					'ui-highlighter': this.showCreateChatPromo
				};
			}
		},
		created() {
			this.bindPromoEvent();
		},
		mounted() {
			this.contextMenuManager = new CreateMenu();
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			bindPromoEvent() {
				this.promoManager.subscribe(CollabPromoManager.events.showCreateChatPromo, event => {
					this.showCreateChatPromo = event.getData();
				});
			},
			onCreateClick(event) {
				const context = {
					parentChatId: this.parentChatId,
					collabId: this.collabId
				};
				this.contextMenuManager.openMenu(context, event.currentTarget);
			},
			onCloseCreateChatPromo() {
				this.promoManager.onCloseCreateChatPromo();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-nested-list-collab__header">
			<div class="bx-im-nested-list-collab__search">
				<ChatSearchInput
					:searchMode="searchMode"
					:isLoading="searchMode && isSearchLoading"
					:placeholder="loc('IM_LIST_CONTAINER_COLLAB_NESTED_SEARCH_INPUT_PLACEHOLDER')"
					@openSearch="$emit('openSearch')"
					@closeSearch="$emit('closeSearch')"
					@updateSearch="$emit('updateSearch', $event)"
				/>
			</div>
			<HeaderMenu
				:key="currentSection"
				:unreadMode="unreadMode"
				:recentSection="currentSection"
				:parentChatId="parentChatId"
				@toggleUnreadMode="$emit('toggleUnreadMode')"
			/>
			<div :class="createChatClasses" class="bx-im-nested-list-collab__subheader_create-button" ref="create-chat-button">
				<CreateChatButton v-if="canCreateEntities" @click="onCreateClick" />
			</div>
			<CreateChatPromo v-if="showCreateChatPromo" :bindElement="$refs['create-chat-button']" @close="onCloseCreateChatPromo" />
		</div>
	`
	};

	// @vue/component
	const CollabNavigation = {
		name: 'CollabNavigation',
		components: {
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient,
			NavigationSection: im_v2_component_list_container_elements_navigationSection.NavigationSection
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			sections: {
				type: Array,
				required: true
			},
			currentSection: {
				type: String,
				required: true
			}
		},
		computed: {
			ScrollDirection: () => im_v2_component_elements_scrollWithGradient.ScrollDirection,
			items() {
				return this.sections;
			}
		},
		methods: {
			getSectionCounter(type) {
				const childrenCounter = this.$store.getters['counters/getChildrenTotalCounter'](this.parentChatId, type);
				if (type === im_v2_const.RecentType.collabDefault) {
					const parentCounter = this.$store.getters['counters/getTotalCounterByIds']([this.parentChatId]);
					return parentCounter + childrenCounter;
				}
				return childrenCounter;
			}
		},
		template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div class="bx-im-nested-list-collab__section_container">
				<div v-for="{ type, title } in items" :key="type" class="bx-im-nested-list-collab__section">
					<NavigationSection
						:text="title"
						:isSelected="currentSection === type"
						:counter="getSectionCounter(type)"
						@click="$emit('selectSection', type)"
					/>
				</div>
			</div>
		</ScrollWithGradient>
	`
	};

	const CollabSectionConfig = {
		[im_v2_const.RecentType.collabDefault]: {
			type: im_v2_const.RecentType.collabDefault,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_DEFAULT'),
			component: im_v2_component_list_items_collab.CollabNestedDefaultList,
			unreadComponent: im_v2_component_list_items_collab.CollabNestedDefaultUnreadList
		},
		[im_v2_const.RecentType.taskComments]: {
			type: im_v2_const.RecentType.taskComments,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_TASK_COMMENTS'),
			component: im_v2_component_list_items_collab.CollabNestedTaskList,
			unreadComponent: im_v2_component_list_items_collab.CollabNestedTaskUnreadList
		},
		[im_v2_const.RecentType.collabChat]: {
			type: im_v2_const.RecentType.collabChat,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CHATS_MSGVER_2'),
			component: im_v2_component_list_items_collab.CollabNestedChatList,
			unreadComponent: im_v2_component_list_items_collab.CollabNestedChatUnreadList
		},
		[im_v2_const.RecentType.calendar]: {
			type: im_v2_const.RecentType.calendar,
			title: main_core.Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CALENDAR'),
			component: im_v2_component_list_items_collab.CollabNestedCalendarList,
			unreadComponent: im_v2_component_list_items_collab.CollabNestedCalendarUnreadList
		}
	};

	// @vue/component
	const CollabNestedListContainer = {
		name: 'CollabNestedListContainer',
		components: {
			RecentListSlider: im_v2_component_list_container_elements_listSlider.RecentListSlider,
			CollabNavigation,
			CollabHeader,
			CollabCard,
			CardLoader,
			RecentSearch: im_v2_component_search.RecentSearch
		},
		provide() {
			return {
				promoManager: this.getPromoManager()
			};
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['selectChat', 'close'],
		data() {
			return {
				searchMode: false,
				searchQuery: '',
				isSearchLoading: false,
				currentSection: im_v2_const.RecentType.collabDefault,
				unreadMode: false
			};
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			listComponent() {
				const matchingItem = CollabSectionConfig[this.currentSection];
				if (!matchingItem) {
					return null;
				}
				return matchingItem.component;
			},
			listUnreadComponent() {
				const matchingItem = CollabSectionConfig[this.currentSection];
				if (!matchingItem) {
					return null;
				}
				return matchingItem.unreadComponent;
			},
			navigationSections() {
				return Object.values(CollabSectionConfig);
			},
			parentChat() {
				return this.$store.getters['chats/getByChatId'](this.parentChatId);
			},
			isParentChatLoaded() {
				return Boolean(this.parentChat);
			}
		},
		watch: {
			isParentChatLoaded: {
				immediate: true,
				handler(isLoaded) {
					if (!isLoaded) {
						return;
					}
					this.getPromoManager().init();
				}
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Collab nested container created');
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			this.promoManager?.stop();
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onDocumentClick(event) {
				const sliderContainer = this.$refs.slider.$el;
				const clickOnRecentContainer = event.composedPath().includes(sliderContainer);
				if (!clickOnRecentContainer) {
					this.onCloseSearch();
				}
			},
			onOpenSearch() {
				this.searchMode = true;
			},
			onCloseSearch() {
				this.searchMode = false;
				this.searchQuery = '';
			},
			onUpdateSearch(query) {
				this.searchMode = true;
				this.searchQuery = query;
			},
			onSearchLoading(value) {
				this.isSearchLoading = value;
			},
			onOpenSearchItem(event) {
				const {
					dialogId
				} = event;
				this.currentSection = im_v2_const.RecentType.collabDefault;
				this.$emit('selectChat', dialogId);
			},
			onClose() {
				this.$emit('close');
			},
			onSelectSection(selectedSection) {
				this.currentSection = selectedSection;
			},
			onToggleUnreadMode() {
				this.unreadMode = !this.unreadMode;
			},
			getPromoManager() {
				if (!this.promoManager) {
					this.promoManager = new CollabPromoManager(this.parentChatId);
				}
				return this.promoManager;
			}
		},
		template: `
		<RecentListSlider ref="slider" :compactMode="compactMode" @close="onClose">
			<template #header>
				<CollabHeader
					:unreadMode="unreadMode"
					:currentSection="currentSection"
					:parentChatId="parentChatId"
					:searchMode="searchMode"
					:isSearchLoading="isSearchLoading"
					@openSearch="onOpenSearch"
					@closeSearch="onCloseSearch"
					@updateSearch="onUpdateSearch"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
			</template>
			<template v-if="!searchMode" #subheader>
				<CardLoader v-if="!isParentChatLoaded" />
				<CollabCard
					v-else
					:parentChatId="parentChatId"
					:withNewTabButton="compactMode"
				/>
				<CollabNavigation
					:parentChatId="parentChatId"
					:sections="navigationSections"
					:currentSection="currentSection"
					@selectSection="onSelectSection"
				/>
			</template>
			<template #content>
				<RecentSearch
					v-show="searchMode"
					:searchMode="searchMode"
					:query="searchQuery"
					:parentChatId="parentChatId"
					:showUsersCarousel="false"
					:recentSectionType="RecentType.collabDefault"
					@loading="onSearchLoading"
					@openItem="onOpenSearchItem"
					@closeSearch="onCloseSearch"
				/>
				<KeepAlive v-show="!searchMode && !unreadMode">
					<component
						:is="listComponent"
						:parentChatId="parentChatId"
						@selectChat="$emit('selectChat', $event)"
						@loadError="$emit('close')"
					/>
				</KeepAlive>
				<component
					v-if="unreadMode"
					:is="listUnreadComponent"
					:parentChatId="parentChatId"
					@selectChat="$emit('selectChat', $event)"
					@loadError="$emit('close')"
				/>
			</template>
		</RecentListSlider>
	`
	};

	// @vue/component
	const HeaderLoader = {
		name: 'HeaderLoader',
		template: `
		<div class="bx-im-nested-list-collab-header__loader"></div>
	`
	};

	// @vue/component
	const NavigationLoader = {
		name: 'NavigationLoader',
		template: `
		<div class="bx-im-nested-list-collab__navigation-loader"></div>
	`
	};

	// @vue/component
	const NestedListLoadingState = {
		name: 'NestedListLoadingState',
		components: {
			RecentListSlider: im_v2_component_list_container_elements_listSlider.RecentListSlider,
			HeaderLoader,
			NavigationLoader,
			CardLoader,
			LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState
		},
		props: {
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		template: `
		<RecentListSlider @close="$emit('close')" :compactMode="compactMode">
			<template #header>
				<HeaderLoader />
			</template>
			<template #subheader>
				<CardLoader />
				<NavigationLoader />
			</template>
			<template #content>
				<LoadingState />
			</template>
		</RecentListSlider>
	`
	};

	exports.CollabListContainer = CollabListContainer;
	exports.CollabNestedListContainer = CollabNestedListContainer;
	exports.NestedListLoadingState = NestedListLoadingState;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Event, BX.Messenger.v2.Lib, BX.UI.System, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.UI.IconSet, BX, BX.Messenger.v2.Component.Elements, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=registry.bundle.js.map
