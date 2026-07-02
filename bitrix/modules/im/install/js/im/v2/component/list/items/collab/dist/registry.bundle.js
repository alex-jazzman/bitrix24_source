/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_items_base, im_v2_const, im_v2_lib_draft, im_v2_provider_service_recent, im_v2_lib_menu, im_v2_component_list_items_elements_createChatStatus, im_v2_lib_createChat, im_v2_lib_notifier) {
	'use strict';

	class CollabService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collab;
		}
	}

	class CollabRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem()];
		}
	}

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-list-collab__empty">
			<div class="bx-im-list-collab__empty_icon"></div>
			<div class="bx-im-list-collab__empty_text">
				{{ loc('IM_LIST_COLLAB_EMPTY_V2') }}
			</div>
		</div>
	`
	};

	// @vue/component
	const CollabList = {
		name: 'CollabList',
		components: {
			EmptyState,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList
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
				return this.$store.getters['recent/getSortedCollection']({
					type: im_v2_const.RecentType.collab
				});
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
				<EmptyState />
			</template>
		</BaseRecentList>
	`
	};

	class CollabDefaultService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collabDefault;
		}
	}

	class CollabChatService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.collabChat;
		}
	}

	const ServiceByRecentType = {
		[im_v2_const.RecentType.collabDefault]: CollabDefaultService,
		[im_v2_const.RecentType.taskComments]: im_v2_provider_service_recent.TaskRecentService,
		[im_v2_const.RecentType.collabChat]: CollabChatService,
		[im_v2_const.RecentType.calendar]: im_v2_provider_service_recent.CalendarRecentService
	};

	// @vue/component
	const BaseCollabNestedList = {
		name: 'BaseCollabNestedList',
		components: {
			EmptyState,
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
			}
		},
		emits: ['selectChat', 'loadComplete', 'loadError'],
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
			this.contextMenuManager = new CollabRecentMenu({
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
				this.$emit('loadComplete');
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
				if (this.isCreatingChat) {
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
				<CreateChatStatus v-if="showCreationStatus" :allowedTypes="[creatableChatType]" />
			</template>
			<template #empty-state>
				<EmptyState />
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

	// @vue/component
	const CollabNestedDefaultList = {
		name: 'CollabNestedDefaultList',
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
			CreatableChatType: () => im_v2_lib_createChat.CreatableChatType,
			parentChat() {
				return this.$store.getters['chats/getByChatId'](this.parentChatId);
			}
		},
		methods: {
			onLoadComplete() {
				this.selectParentChat();
			},
			selectParentChat() {
				this.$emit('selectChat', this.parentChat.dialogId);
			}
		},
		template: `
		<BaseCollabNestedList
			:type="RecentType.collabDefault"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
			@loadComplete="onLoadComplete"
		/>
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

	exports.CollabList = CollabList;
	exports.CollabNestedCalendarList = CollabNestedCalendarList;
	exports.CollabNestedChatList = CollabNestedChatList;
	exports.CollabNestedDefaultList = CollabNestedDefaultList;
	exports.CollabNestedTaskList = CollabNestedTaskList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
