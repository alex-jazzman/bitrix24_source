/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_items_base, im_v2_const, im_v2_lib_draft, im_v2_lib_collab, im_v2_component_list_items_elements_emptyState, im_v2_provider_service_recent, im_v2_lib_menu, im_v2_lib_unreadMode, im_v2_component_list_items_elements_createChatStatus, im_v2_lib_createChat, im_v2_lib_notifier, im_v2_application_core, main_core, im_v2_lib_copilot, main_core_events, im_v2_lib_utils) {
	'use strict';

	class CollabService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collab;
		}
	}

	class CollabRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getAddToFolderItem(), this.getMuteItem()];
		}
	}

	// @vue/component
	const CollabUnreadList = {
		name: 'CollabUnreadList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedUnreadCollection']({
					type: im_v2_const.RecentType.collab
				});
			}
		},
		async created() {
			this.contextMenuManager = new CollabRecentMenu({
				emitter: this.getEmitter()
			});
			this.clearCollection();
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		methods: {
			clearCollection() {
				this.$store.dispatch('recent/clearUnreadCollection', {
					type: im_v2_const.RecentType.collab
				});
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: [im_v2_const.RecentType.collab],
					dialogId
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getCollabUnreadService().loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getCollabUnreadService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getCollabUnreadService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			getCollabUnreadService() {
				if (!this.service) {
					this.service = new CollabService({
						unreadMode: true
					});
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
			data-test-id="im_container-recent__unread-list"
		>
			<template #empty-state>
				<RecentEmptyState 
					:title="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_TITLE')" 
					:subtitle="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const CollabList = {
		name: 'CollabList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false
			};
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			collection() {
				return this.$store.getters['recent/getSortedCollection']({
					type: im_v2_const.RecentType.collab
				});
			},
			emptyStateTitle() {
				return im_v2_lib_collab.CollabManager.getListEmptyStateText();
			},
			emptyStateSubtitle() {
				return im_v2_lib_collab.CollabManager.getListEmptyStateSubtitleText();
			}
		},
		async created() {
			this.contextMenuManager = new CollabRecentMenu({
				emitter: this.getEmitter()
			});
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentService().loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getRecentService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getRecentService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			getRecentService() {
				if (!this.service) {
					this.service = new CollabService();
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #empty-state>
				<RecentEmptyState 
					:title="emptyStateTitle"
					:subtitle="emptyStateSubtitle"
					:recentSection="RecentType.collab"
				/>
			</template>
		</BaseRecentList>
	`
	};

	class CollabNestedRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getHideItem(), this.getLeaveItem()];
		}
	}

	function saveCollabInfo(restResult, parentChatId) {
		const collabInfo = restResult.sectionMeta?.collabInfo;
		if (!collabInfo) {
			return Promise.resolve();
		}
		return im_v2_application_core.Core.getStore().dispatch('chats/collabs/set', {
			chatId: parentChatId,
			collabInfo
		});
	}

	class CollabDefaultService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collabDefault;
		}
		saveRecentItems(restResult) {
			const {
				collectionItems,
				fixedItems
			} = this.#extractFixedItems(restResult);
			const setPayload = {
				type: this.getRecentType(),
				items: collectionItems,
				unread: this.getUnreadMode(),
				parentChatId: this.getParentChatId()
			};
			return Promise.all([im_v2_application_core.Core.getStore().dispatch('recent/set', fixedItems), im_v2_application_core.Core.getStore().dispatch('recent/setCollection', setPayload)]);
		}
		saveFirstPageData(restResult) {
			return saveCollabInfo(restResult, this.getParentChatId());
		}
		#extractFixedItems(restResult) {
			const {
				recentItems,
				sectionMeta
			} = restResult;
			const fixedChatIds = sectionMeta ? sectionMeta.fixedChatIds : [];
			const collectionItems = [];
			const fixedItems = [];
			recentItems.forEach(item => {
				if (fixedChatIds.includes(item.chatId)) {
					fixedItems.push(item);
					return;
				}
				collectionItems.push(item);
			});
			return {
				collectionItems,
				fixedItems
			};
		}
	}

	class CollabChatService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collabChat;
		}
		saveFirstPageData(restResult) {
			return saveCollabInfo(restResult, this.getParentChatId());
		}
	}

	const TitleByTypeHandler = {
		[im_v2_const.RecentType.taskComments]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_TITLE'),
		[im_v2_const.RecentType.collabChat]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_TITLE'),
		[im_v2_const.RecentType.calendar]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_TITLE'),
		[im_v2_const.RecentType.copilot]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_COPILOT_TITLE', {
			'#COPILOT_NAME#': new im_v2_lib_copilot.CopilotManager().getName()
		})
	};
	const SubtitleByTypeHandler = {
		[im_v2_const.RecentType.taskComments]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_SUBTITLE'),
		[im_v2_const.RecentType.collabChat]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_SUBTITLE'),
		[im_v2_const.RecentType.calendar]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_SUBTITLE'),
		[im_v2_const.RecentType.copilot]: () => main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_COPILOT_SUBTITLE')
	};

	// @vue/component
	const CollabNestedEmptyState = {
		name: 'CollabNestedEmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		props: {
			type: {
				type: String,
				required: true
			}
		},
		computed: {
			title() {
				return TitleByTypeHandler[this.type]();
			},
			subtitle() {
				return SubtitleByTypeHandler[this.type]();
			}
		},
		template: `
		<RecentEmptyState :title="title" :subtitle="subtitle" :recentSection="type" />
	`
	};

	const ServiceByRecentType = {
		[im_v2_const.RecentType.collabDefault]: CollabDefaultService,
		[im_v2_const.RecentType.taskComments]: im_v2_provider_service_recent.TaskRecentService,
		[im_v2_const.RecentType.collabChat]: CollabChatService,
		[im_v2_const.RecentType.calendar]: im_v2_provider_service_recent.CalendarRecentService,
		[im_v2_const.RecentType.copilot]: im_v2_provider_service_recent.CopilotRecentV2Service
	};

	// @vue/component
	const BaseCollabNestedList = {
		name: 'BaseCollabNestedList',
		components: {
			CollabNestedEmptyState,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			CreateChatStatus: im_v2_component_list_items_elements_createChatStatus.CreateChatStatus
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			creatableChatType: {
				type: String,
				default: ''
			},
			withEmptyState: {
				type: Boolean,
				default: true
			}
		},
		emits: ['selectChat', 'loadError'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				isCreatingChat: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedCollection']({
					parentChatId: this.parentChatId,
					type: this.type
				});
			},
			showCreationStatus() {
				return this.isCreatingChat && this.creatableChatType;
			}
		},
		async created() {
			this.initCreateChatManager();
			this.contextMenuManager = new CollabNestedRecentMenu({
				emitter: this.getEmitter()
			});
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		beforeUnmount() {
			this.destroyCreateChatManager();
			this.contextMenuManager.destroy();
		},
		methods: {
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentService().loadFirstPage().catch(error => {
					im_v2_lib_notifier.Notifier.chat.handleLoadError(error);
					this.$emit('loadError');
				});
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getRecentService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getRecentService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			initCreateChatManager() {
				if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreating()) {
					this.isCreatingChat = true;
				}
				this.onCreationStatusChange = event => {
					this.isCreatingChat = event.getData();
				};
				im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
			},
			destroyCreateChatManager() {
				im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
				const isOwnChatTypeCreation = im_v2_lib_createChat.CreateChatManager.getInstance().getChatType() === this.creatableChatType;
				if (this.isCreatingChat && isOwnChatTypeCreation) {
					im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
				}
			},
			getRecentService() {
				if (!this.service) {
					const ServiceClass = ServiceByRecentType[this.type];
					this.service = new ServiceClass({
						parentChatId: this.parentChatId
					});
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-list>
				<slot name="fixed-chats"></slot>
				<CreateChatStatus v-if="showCreationStatus" :allowedTypes="[creatableChatType]" />
			</template>
			<template #empty-state>
				<CollabNestedEmptyState v-if="withEmptyState" :type="type" />
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const CollabNestedTaskList = {
		name: 'CollabNestedTaskList',
		components: {
			BaseCollabNestedList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedList :type="RecentType.taskComments" :parentChatId="parentChatId" />
	`
	};

	class FixedParentRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getMuteItem()];
		}
		hasCounter() {
			const {
				chatId
			} = this.store.getters['chats/get'](this.context.dialogId, true);
			const chatCounter = this.store.getters['counters/getCounterByChatId'](chatId);
			const isChatMarkedUnread = this.store.getters['counters/getUnreadStatus'](chatId);
			return isChatMarkedUnread || chatCounter > 0;
		}
	}

	// @vue/component
	const FixedParentItem = {
		name: 'FixedParentItem',
		components: {
			FixedItemContainer: im_v2_component_list_items_base.FixedItemContainer,
			BaseRecentItem: im_v2_component_list_items_base.BaseRecentItem
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			parentDialogId() {
				return im_v2_lib_utils.Utils.dialog.buildChatDialogId(this.parentChatId);
			},
			parentRecentItem() {
				return this.$store.getters['recent/get'](this.parentDialogId);
			}
		},
		created() {
			this.contextMenuManager = new FixedParentRecentMenu({
				emitter: this.getEmitter()
			});
		},
		methods: {
			onRightClick(event) {
				event.preventDefault();
				const context = {
					dialogId: this.parentRecentItem.dialogId,
					recentItem: this.parentRecentItem
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<FixedItemContainer  class="bx-im-collab-nested-list__fixed-items_container">
			<BaseRecentItem
				:item="parentRecentItem"
				:withPinStatus="false"
				:withChildrenCounter="false"
				:forceOwnMessage="true"
				@click.right="onRightClick"
			/>
		</FixedItemContainer>
	`
	};

	// @vue/component
	const CollabNestedDefaultList = {
		name: 'CollabNestedDefaultList',
		components: {
			BaseCollabNestedList,
			FixedParentItem
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat'],
		computed: {
			RecentType: () => im_v2_const.RecentType,
			CreatableChatType: () => im_v2_lib_createChat.CreatableChatType,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			parentDialogId() {
				return im_v2_lib_utils.Utils.dialog.buildChatDialogId(this.parentChatId);
			}
		},
		mounted() {
			if (this.shouldSelectParentChat()) {
				this.selectParentChat();
			}
			main_core_events.EventEmitter.emit(im_v2_const.EventType.collab.onFirstOpen, {
				parentChatId: this.parentChatId
			});
		},
		methods: {
			selectParentChat() {
				this.$emit('selectChat', this.parentDialogId);
			},
			shouldSelectParentChat() {
				const currentDialogId = this.layout.entityId;
				if (!currentDialogId) {
					return true;
				}
				const currentChat = this.$store.getters['chats/get'](currentDialogId, true);
				const isNestedChatOpen = currentChat.parentChatId === this.parentChatId;
				// eslint-disable-next-line sonarjs/prefer-single-boolean-return
				if (isNestedChatOpen) {
					return false;
				}
				return true;
			},
			onParentItemClick() {
				this.selectParentChat();
			}
		},
		template: `
		<BaseCollabNestedList
			:type="RecentType.collabDefault"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
			:withEmptyState="false"
			@selectChat="$emit('selectChat', $event)"
		>
			<template #fixed-chats>
				<FixedParentItem :parentChatId="parentChatId" @click="onParentItemClick" />
			</template>
		</BaseCollabNestedList>
	`
	};

	// @vue/component
	const CollabNestedCalendarList = {
		name: 'CollabNestedCalendarList',
		components: {
			BaseCollabNestedList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedList :type="RecentType.calendar" :parentChatId="parentChatId" />
	`
	};

	// @vue/component
	const CollabNestedChatList = {
		name: 'CollabNestedChatList',
		components: {
			BaseCollabNestedList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			CreatableChatType: () => im_v2_lib_createChat.CreatableChatType
		},
		template: `
		<BaseCollabNestedList
			:type="RecentType.collabChat"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
		/>
	`
	};

	// @vue/component
	const CollabNestedCopilotList = {
		name: 'CollabNestedCopilotList',
		components: {
			BaseCollabNestedList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedList :type="RecentType.copilot" :parentChatId="parentChatId" />
	`
	};

	// @vue/component
	const BaseCollabNestedUnreadList = {
		name: 'BaseCollabNestedUnreadList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			withEmptyState: {
				type: Boolean,
				default: true
			}
		},
		emits: ['selectChat', 'loadError'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedUnreadCollection']({
					parentChatId: this.parentChatId,
					type: this.type
				});
			}
		},
		async created() {
			this.contextMenuManager = new CollabNestedRecentMenu({
				emitter: this.getEmitter()
			});
			this.clearCollection();
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		methods: {
			clearCollection() {
				this.$store.dispatch('recent/clearUnreadCollection', {
					parentChatId: this.parentChatId,
					type: this.type
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getUnreadRecentService().loadFirstPage().catch(error => {
					im_v2_lib_notifier.Notifier.chat.handleLoadError(error);
					this.$emit('loadError');
				});
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getUnreadRecentService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getUnreadRecentService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: [this.type],
					dialogId,
					parentChatId: this.parentChatId
				});
			},
			getUnreadRecentService() {
				if (!this.service) {
					const ServiceClass = ServiceByRecentType[this.type];
					this.service = new ServiceClass({
						unreadMode: true,
						parentChatId: this.parentChatId
					});
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
			data-test-id="im_container-recent__unread-list"
		>
			<template #before-list>
				<slot name="fixed-chats"></slot>
			</template>
			<template #empty-state>
				<RecentEmptyState 
					v-if="withEmptyState" 
					:title="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const CollabNestedTaskUnreadList = {
		name: 'CollabNestedTaskUnreadList',
		components: {
			BaseCollabNestedUnreadList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedUnreadList :type="RecentType.taskComments" :parentChatId="parentChatId" />
	`
	};

	// @vue/component
	const CollabNestedDefaultUnreadList = {
		name: 'CollabNestedDefaultUnreadList',
		components: {
			BaseCollabNestedUnreadList,
			FixedParentItem
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat'],
		computed: {
			RecentType: () => im_v2_const.RecentType,
			parentDialogId() {
				return im_v2_lib_utils.Utils.dialog.buildChatDialogId(this.parentChatId);
			}
		},
		methods: {
			onParentItemClick() {
				this.$emit('selectChat', this.parentDialogId);
			}
		},
		template: `
		<BaseCollabNestedUnreadList 
			:type="RecentType.collabDefault" 
			:parentChatId="parentChatId"
			:withEmptyState="false"
			@selectChat="$emit('selectChat', $event)"
		>
			<template #fixed-chats>
				<FixedParentItem :parentChatId="parentChatId" @click="onParentItemClick" />
			</template>
		</BaseCollabNestedUnreadList>
	`
	};

	// @vue/component
	const CollabNestedCalendarUnreadList = {
		name: 'CollabNestedCalendarUnreadList',
		components: {
			BaseCollabNestedUnreadList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedUnreadList :type="RecentType.calendar" :parentChatId="parentChatId" />
	`
	};

	// @vue/component
	const CollabNestedChatUnreadList = {
		name: 'CollabNestedChatUnreadList',
		components: {
			BaseCollabNestedUnreadList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedUnreadList :type="RecentType.collabChat" :parentChatId="parentChatId" />
	`
	};

	// @vue/component
	const CollabNestedCopilotUnreadList = {
		name: 'CollabNestedCopilotUnreadList',
		components: {
			BaseCollabNestedUnreadList
		},
		props: {
			parentChatId: {
				type: Number,
				required: true
			}
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		template: `
		<BaseCollabNestedUnreadList :type="RecentType.copilot" :parentChatId="parentChatId" />
	`
	};

	exports.CollabList = CollabList;
	exports.CollabNestedCalendarList = CollabNestedCalendarList;
	exports.CollabNestedCalendarUnreadList = CollabNestedCalendarUnreadList;
	exports.CollabNestedChatList = CollabNestedChatList;
	exports.CollabNestedChatUnreadList = CollabNestedChatUnreadList;
	exports.CollabNestedCopilotList = CollabNestedCopilotList;
	exports.CollabNestedCopilotUnreadList = CollabNestedCopilotUnreadList;
	exports.CollabNestedDefaultList = CollabNestedDefaultList;
	exports.CollabNestedDefaultUnreadList = CollabNestedDefaultUnreadList;
	exports.CollabNestedTaskList = CollabNestedTaskList;
	exports.CollabNestedTaskUnreadList = CollabNestedTaskUnreadList;
	exports.CollabUnreadList = CollabUnreadList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX, BX.Messenger.v2.Lib, BX.Event, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
