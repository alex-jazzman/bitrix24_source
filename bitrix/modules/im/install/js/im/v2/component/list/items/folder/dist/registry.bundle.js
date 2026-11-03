/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, im_v2_component_list_items_base, im_v2_component_list_items_elements_activeCallList, im_v2_lib_draft, im_v2_application_core, im_v2_const, im_v2_provider_service_recent, im_v2_lib_menu, ui_vue3_components_button, im_v2_lib_layout, im_v2_component_list_items_elements_emptyState, main_core_events, im_v2_component_list_items_elements_createChatStatus, im_v2_component_list_items_recent, im_v2_lib_createChat, im_v2_lib_recent, im_v2_lib_user, im_v2_lib_utils, im_v2_lib_unreadMode) {
	'use strict';

	class FolderRecentService extends im_v2_provider_service_recent.BaseRecentService {
		static #instances = new Map();
		#folderId;
		#tailLoaded = false;
		#firstPageRequest = null;
		// The composition the tail request went out with: the answer it brings back speaks for these
		// members and for nobody who joined the folder later.
		#requestedDialogIds = new Set();
		// Comes from onAfterRequest(), which the base service calls before it saves the response: until
		// a request says otherwise, the response being saved is the first page.
		#savingFirstPage = true;
		constructor(props) {
			super(props);
			this.#folderId = props.folderId;
		}

		// One service per folder: the list component is recreated on every folder entry, so what the
		// service already knows about the loaded tail has to outlive it.
		static getInstance(folderId) {
			if (!FolderRecentService.#hasUsableInstance(folderId)) {
				FolderRecentService.#dropInstancesOfDeletedFolders();
				FolderRecentService.#instances.set(folderId, new FolderRecentService({
					folderId
				}));
			}
			return FolderRecentService.#instances.get(folderId);
		}
		static dropInstance(folderId) {
			FolderRecentService.#instances.delete(folderId);
		}

		// Usable means the folder is still in the model: a service kept from its previous life describes
		// rows of a folder that is gone.
		static #hasUsableInstance(folderId) {
			if (!FolderRecentService.#instances.has(folderId)) {
				return false;
			}
			return Boolean(im_v2_application_core.Core.getStore().getters['recent/folders/getById'](folderId));
		}

		// A deleted folder never asks for its service again, so there is nothing to react to: stale
		// instances are taken out lazily, when the registry is about to take in another service.
		static #dropInstancesOfDeletedFolders() {
			[...FolderRecentService.#instances.keys()].forEach(folderId => {
				const folder = im_v2_application_core.Core.getStore().getters['recent/folders/getById'](folderId);
				if (!folder) {
					FolderRecentService.#instances.delete(folderId);
				}
			});
		}
		isTailLoaded() {
			return this.#tailLoaded;
		}

		// A loaded tail is enough while the folder is still the one it was asked for: a composition that
		// changed since then holds a member the answer never spoke about, so the next entry into the
		// folder goes for the tail again.
		isStateComplete() {
			if (!this.#tailLoaded) {
				return false;
			}
			const currentDialogIds = this.#getFolderDialogIds();
			return new Set(currentDialogIds).size === this.#requestedDialogIds.size && currentDialogIds.every(dialogId => this.#requestedDialogIds.has(dialogId));
		}

		// Whether to go for the tail is decided here and not in the list component: the component is
		// recreated on every entry into the folder, so a return made while the request is still in flight
		// would ask for the same page again. The second caller waits for the request of the first one, and
		// the field is cleared on any outcome - a refused request has to leave the folder loadable.
		loadFirstPage() {
			this.#firstPageRequest ??= this.#requestFirstPage();
			return this.#firstPageRequest;
		}
		#requestFirstPage() {
			// The flag and the snapshot belong to one answer, so the request in flight invalidates both:
			// there is no loaded tail until this request is saved.
			this.#tailLoaded = false;
			this.#requestedDialogIds = new Set(this.#getFolderDialogIds());
			return super.loadFirstPage().finally(() => {
				this.#firstPageRequest = null;
			});
		}
		onAfterRequest(firstPage) {
			super.onAfterRequest(firstPage);
			this.#savingFirstPage = firstPage;
		}
		getRestMethodName(firstPage) {
			return im_v2_const.RestMethod.imV2FolderRecentTail;
		}

		// One page covers the whole folder only while this limit matches the server ceiling on folder
		// members (both 50): raise the ceiling and the members past the page count as left out by the tail.
		getQueryParams(firstPage = false) {
			return {
				folderId: this.#folderId,
				limit: this.getItemsPerPage(),
				filter: this.getRequestFilter(firstPage)
			};
		}
		getRequestFilter(firstPage = false) {
			return {
				lastMessageDate: firstPage ? null : this.getLastMessageDate()
			};
		}

		// The tail counts as loaded only once its rows are in the recent collection: the flag decides
		// whether the folder requests the tail again, so a save that did not go through must not set it.
		async saveRecentItems(restResult) {
			const {
				recentItems
			} = restResult;
			const returnedDialogIds = await im_v2_application_core.Core.getStore().dispatch('recent/set', recentItems);
			if (this.#savingFirstPage) {
				this.#hideChatsMissingFromTail(returnedDialogIds);
				this.#tailLoaded = true;
			}
			return returnedDialogIds;
		}

		// Server tail is hide-aware: it returns only folder members the user can still see. A member the
		// request went out with but absent from the tail is hidden or left, so it gets the hidden status -
		// otherwise a chat another section put into the shared recent collection shows up in the folder.
		// Both bounds are needed. The snapshot keeps out a chat that joined the folder while the request was
		// out: the answer never spoke about it, and the status set here is never taken back. The composition
		// as it is now keeps out a chat that left the folder in the same window: the hidden status is a single
		// set shared by every list, so hiding it here would take its row out of the lists that still hold it.
		#hideChatsMissingFromTail(returnedDialogIds) {
			const returnedIdSet = new Set(returnedDialogIds);
			const currentIdSet = new Set(this.#getFolderDialogIds());
			const missingDialogIds = [...this.#requestedDialogIds].filter(dialogId => {
				return !returnedIdSet.has(dialogId) && currentIdSet.has(dialogId);
			});
			if (missingDialogIds.length === 0) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/setHiddenStatus', {
				ids: missingDialogIds,
				hidden: true
			});
		}

		// Only a personal folder has a composition of its own: a system folder gathers its members by
		// recentSection, so there is no list of dialogIds to compare anything against.
		#getFolderDialogIds() {
			const folder = im_v2_application_core.Core.getStore().getters['recent/folders/getById'](this.#folderId);
			if (folder?.type !== im_v2_const.FolderType.personal) {
				return [];
			}
			return folder.definition.chats.map(chat => chat.dialogId);
		}
	}

	class FolderRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getAddToFolderItem(), this.getMuteItem()];
		}
	}

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			folderId: {
				type: Number,
				required: true
			}
		},
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize
		},
		methods: {
			onAddChatsClick() {
				void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.updateFolder,
					entityId: String(this.folderId)
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<RecentEmptyState
			:title="loc('IM_LIST_FOLDER_EMPTY_STATE_TITLE')"
			:subtitle="loc('IM_LIST_FOLDER_EMPTY_STATE_SUBTITLE')"
			imageModifier="folder"
		>
			<UiButton
				:size="ButtonSize.MEDIUM"
				:text="loc('IM_LIST_FOLDER_EMPTY_STATE_ADD_CHATS')"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:dataset="{ testid: 'folder-empty-state-add-chats-btn' }"
				@click="onAddChatsClick"
			/>
		</RecentEmptyState>
	`
	};

	// @vue/component
	const PersonalFolderList = {
		name: 'PersonalFolderList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			EmptyState
		},
		props: {
			folderId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				loadingFolderId: 0,
				loadedFolderId: 0,
				listIsScrolled: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			isLoading() {
				return this.loadingFolderId === this.folderId;
			},
			firstPageLoaded() {
				return this.loadedFolderId === this.folderId;
			},
			collection() {
				const folderDialogIds = this.folder?.definition.chats.map(chat => chat.dialogId) ?? [];
				return this.$store.getters['recent/getCollectionByIds'](folderDialogIds);
			},
			folder() {
				return this.$store.getters['recent/folders/getById'](this.folderId);
			}
		},
		watch: {
			folderId() {
				void this.loadInitialItems();
			}
		},
		async created() {
			this.contextMenuManager = ui_vue3.markRaw(new FolderRecentMenu({
				emitter: this.getEmitter()
			}));
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		activated() {
			void this.loadInitialItems();
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			async loadInitialItems() {
				if (this.isLoading) {
					return;
				}
				const folderId = this.folderId;
				const recentService = FolderRecentService.getInstance(folderId);
				if (recentService.isStateComplete()) {
					this.loadedFolderId = folderId;
					return;
				}
				this.loadingFolderId = folderId;
				try {
					await recentService.loadFirstPage();
					if (!recentService.isStateComplete()) {
						await recentService.loadFirstPage();
					}
					this.loadedFolderId = folderId;
				} finally {
					if (this.loadingFolderId === folderId) {
						this.loadingFolderId = 0;
					}
				}
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
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
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<BaseRecentList
			:key="folderId"
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:contextMenuManager="contextMenuManager"
			data-testid="folder-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<EmptyState :folderId="folderId" />
			</template>
		</BaseRecentList>
	`
	};

	// The sections the DTO-02 record carries for a row without a chat - the ones a private dialog gets.
	const ROW_WITHOUT_CHAT_SECTIONS = [im_v2_const.RecentType.default, im_v2_const.RecentType.chat];
	class AllFolderRecentService extends im_v2_provider_service_recent.BaseRecentService {
		#folderId;
		#birthdaysAssembled = false;
		#deepestCursor = '';
		#destroyed = false;
		constructor(props) {
			super(props);
			this.#folderId = props.folderId;
		}

		// The greeting rows of a day are assembled once: the key repeats in every page of the tail, and
		// from the second page on the assembly can only rediscover rows it has already put in the model.
		loadFirstPage() {
			this.#birthdaysAssembled = false;
			return super.loadFirstPage();
		}
		getRestMethodName(firstPage) {
			return im_v2_const.RestMethod.imV2FolderRecentTail;
		}
		getQueryParams(firstPage = false) {
			return {
				folderId: this.#folderId,
				limit: this.getItemsPerPage(),
				filter: this.getRequestFilter(firstPage)
			};
		}
		getRequestFilter(firstPage = false) {
			return {
				lastMessageDate: firstPage ? null : this.getLastMessageDate(),
				unread: this.getUnreadMode()
			};
		}

		// The cursor of the base service is the lower bound of the page it has just read, so rereading the
		// first page would raise it and cut the list back to one page. What the list shows is the depth it
		// has already been given, and that depth only grows: the oldest bound of the session wins.
		handlePaginationField(result) {
			super.handlePaginationField(result);
			const cursor = super.getLastMessageDate();
			if (cursor !== '' && (this.#deepestCursor === '' || cursor < this.#deepestCursor)) {
				this.#deepestCursor = cursor;
			}
		}
		getLastMessageDate() {
			return this.#deepestCursor;
		}

		// Neither the request nor the seeding uses a single section - both are overridden.
		// The inherited RecentType.default would seed the composite tail into the general chat list.
		getRecentType() {
			return null;
		}
		saveRecentItems(restResult) {
			if (this.#destroyed) {
				return Promise.resolve();
			}
			const birthdayItems = this.#extractBirthdayItems(restResult);
			const seedResult = {
				...restResult,
				recentItems: [...this.#withoutBirthdayPlaceholder(restResult), ...birthdayItems.recentItems],
				recentConfigs: this.#getConfigsForBirthdayRows(restResult, birthdayItems)
			};
			const seedPromises = [...this.#groupItemsBySection(seedResult)].map(([section, items]) => {
				return im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: section,
					items,
					parentChatId: im_v2_const.ParentChatScope.topLevel,
					unread: this.getUnreadMode()
				});
			});
			return Promise.all([...seedPromises, this.#saveBirthdayAuthors(birthdayItems)]);
		}
		getCollection() {
			const sections = im_v2_application_core.Core.getStore().getters['recent/folders/getSourceSections'](this.#folderId);
			const union = im_v2_application_core.Core.getStore().getters['recent/getRootUnionCollection']({
				sections,
				unread: this.getUnreadMode()
			});
			return this.#cutByCursor(union);
		}

		// The real conversation of a colleague may lie deeper than the page that greeted them, and the model
		// keeps a field the response does not mention. Without this the row stays a placeholder for the rest
		// of the session: out of search and hidden once the greetings are switched off.
		#withoutBirthdayPlaceholder(restResult) {
			return (restResult.recentItems ?? []).map(recentItem => {
				return {
					...recentItem,
					isBirthdayPlaceholder: false
				};
			});
		}

		// Today's birthdays come with every tail response, but only the old chat list turns them into rows,
		// so a colleague without a conversation is missing from "All". The row is built here and not in the
		// base service: personal folders have no such rows.
		#extractBirthdayItems(restResult) {
			const items = {
				users: [],
				messages: [],
				recentItems: []
			};
			const {
				birthdayList = [],
				recentItems = []
			} = restResult;
			// A greeting row carries nothing unread, so it has no place in the unread list.
			if (this.getUnreadMode() || this.#birthdaysAssembled || birthdayList.length === 0 || !this.#birthdayRowsAllowed()) {
				return items;
			}
			this.#birthdaysAssembled = true;
			const store = im_v2_application_core.Core.getStore();
			const currentUserId = String(im_v2_application_core.Core.getUserId());
			const deliveredDialogIds = new Set(recentItems.map(recentItem => String(recentItem.dialogId)));
			birthdayList.forEach(user => {
				const dialogId = String(user.id);
				// a row of their own - delivered now or by an earlier page - already shows the colleague
				if (dialogId === currentUserId || deliveredDialogIds.has(dialogId) || store.getters['recent/get'](dialogId)) {
					return;
				}
				const messageId = `${im_v2_const.FakeMessagePrefix}-${user.id}`;
				items.users.push(user);
				items.messages.push({
					id: messageId
				});
				// chatId 0 is the key the composition record of a row without a chat comes under
				items.recentItems.push({
					id: user.id,
					chatId: 0,
					isBirthdayPlaceholder: true,
					messageId
				});
			});
			return items;
		}

		// The record for a row without a chat rides the meta-stream gate, and that gate is the "show
		// colleagues" switch, while the greeting row is on the "show birthdays" one. With the first switch
		// off the record does not come and the row would lose its sections silently, so the sections are
		// assumed here - the same ones the record carries, and the same row the old chat list keeps showing.
		#getConfigsForBirthdayRows(restResult, birthdayItems) {
			const recentConfigs = restResult.recentConfigs ?? [];
			if (birthdayItems.recentItems.length === 0) {
				return recentConfigs;
			}
			const hasRowWithoutChatConfig = recentConfigs.some(config => config.chatId === 0);
			if (hasRowWithoutChatConfig) {
				return recentConfigs;
			}
			return [...recentConfigs, {
				chatId: 0,
				sections: ROW_WITHOUT_CHAT_SECTIONS
			}];
		}

		// The server limits the key by the portal option only, the personal switch is the client's to read.
		#birthdayRowsAllowed() {
			return im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.recent.showBirthday) === true;
		}
		#saveBirthdayAuthors(birthdayItems) {
			const {
				users,
				messages
			} = birthdayItems;
			if (users.length === 0) {
				return Promise.resolve();
			}

			// the profile carries the chat placeholder with it, as it does for the users of the response
			return Promise.all([new im_v2_lib_user.UserManager().setUsersToModel(users), im_v2_application_core.Core.getStore().dispatch('messages/store', messages)]);
		}
		destroy() {
			this.#destroyed = true;
		}

		// Composite tail rows arrive flat: a row belongs to every section its chat is listed in.
		// Seeding all of them, not just the folder composition, keeps the model consistent with pull and sync.
		#groupItemsBySection(restResult) {
			const {
				recentItems = [],
				recentConfigs = []
			} = restResult;
			const sectionsByChatId = new Map(recentConfigs.map(config => [config.chatId, config.sections]));
			const itemsBySection = new Map();
			recentItems.forEach(recentItem => {
				const sections = sectionsByChatId.get(recentItem.chatId) ?? [];
				sections.forEach(section => {
					const sectionItems = itemsBySection.get(section) ?? [];
					sectionItems.push(recentItem);
					itemsBySection.set(section, sectionItems);
				});
			});
			return itemsBySection;
		}

		// The cursor is the lower activity bound of what the tail has already delivered, while source sections
		// may hold older rows loaded elsewhere. An empty cursor (before the first page) means no cut.
		// Pinned rows are never cut - the cursor does not account for them either.
		#cutByCursor(items) {
			const cursorDate = im_v2_lib_utils.Utils.date.cast(this.getLastMessageDate(), null);
			if (!cursorDate) {
				return items;
			}
			return items.filter(item => {
				if (item.pinned) {
					return true;
				}

				// activity is the scale the server pages by, so the cut shows exactly the delivered depth
				const {
					dialogId,
					lastActivityDate
				} = item;
				if (!lastActivityDate || lastActivityDate >= cursorDate) {
					return true;
				}

				// the list shows such a row high regardless of the delivered depth, so the cut must keep it
				return im_v2_lib_recent.RecentManager.hasFakeActivityDate(dialogId);
			});
		}
	}

	// @vue/component
	const AllFolderList = {
		name: 'AllFolderList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			CreateChatStatus: im_v2_component_list_items_elements_createChatStatus.CreateChatStatus,
			ChatsEmptyState: im_v2_component_list_items_recent.ChatsEmptyState
		},
		props: {
			// Read once when the service is built: a later value does not re-target the loaded pages.
			folderId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				listIsScrolled: false,
				isCreatingChat: false
			};
		},
		computed: {
			collection() {
				return this.service.getCollection();
			}
		},
		async created() {
			// The service owns the page cursor, so it is built once per list and never lazily in a computed:
			// a rebuilt service would lose the cursor and show the union uncut.
			this.service = new AllFolderRecentService({
				folderId: this.folderId
			});
			// Full row menu, as in the "Chats" list: "All" is the main section and holds every chat type,
			// so the trimmed FolderRecentMenu (personal folders only) would cost it "Hide" and "Leave".
			this.contextMenuManager = ui_vue3.markRaw(new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			}));
			this.initLikeManager();
			this.initCreateChatManager();
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.dayChanged, this.onDayChanged);
			// Lists live under KeepAlive, so a hidden one stays subscribed; only the visible one reacts.
			this.isOnScreen = true;
			this.missedDayChange = false;
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		activated() {
			this.isOnScreen = true;
			if (this.missedDayChange) {
				this.missedDayChange = false;
				void this.service.loadFirstPage();
			}
		},
		deactivated() {
			this.isOnScreen = false;
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.dayChanged, this.onDayChanged);
			this.contextMenuManager.destroy();
			this.destroyLikeManager();
			this.destroyCreateChatManager();
		},
		methods: {
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.service.loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.service.hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.service.loadNextPage();
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
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			initLikeManager() {
				this.likeManager = new im_v2_component_list_items_recent.LikeManager();
				this.likeManager.init();
			},
			destroyLikeManager() {
				this.likeManager.destroy();
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
			},
			// Birthday marks are computed for the current day and go stale once it turns over. A hidden
			// list defers the reload to the moment it comes back: reloading it now costs a page request
			// for a list nobody is looking at.
			onDayChanged() {
				if (!this.isOnScreen) {
					this.missedDayChange = true;
					return;
				}
				void this.service.loadFirstPage();
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
			:contextMenuManager="contextMenuManager"
			data-testid="folder-all-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #before-list>
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<!-- An empty "All" means an empty messenger, so the "Chats" wording with its invite
				button works here unchanged. data-testid falls through to the state's root element. -->
				<ChatsEmptyState data-testid="folder-all-empty-state" />
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const AllFolderUnreadList = {
		name: 'AllFolderUnreadList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			CreateChatStatus: im_v2_component_list_items_elements_createChatStatus.CreateChatStatus,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		props: {
			folderId: {
				type: Number,
				required: true
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				listIsScrolled: false,
				isCreatingChat: false
			};
		},
		computed: {
			collection() {
				return this.service.getCollection();
			},
			sourceSections() {
				return this.$store.getters['recent/folders/getSourceSections'](this.folderId);
			}
		},
		async created() {
			this.service = new AllFolderRecentService({
				folderId: this.folderId,
				unreadMode: true
			});
			this.contextMenuManager = ui_vue3.markRaw(new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			}));
			this.initLikeManager();
			this.initCreateChatManager();
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
			this.clearCollection();
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		beforeUnmount() {
			this.service.destroy();
			this.contextMenuManager.destroy();
			this.destroyLikeManager();
			this.destroyCreateChatManager();
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		methods: {
			clearCollection() {
				this.sourceSections.forEach(section => {
					void this.$store.dispatch('recent/clearUnreadCollection', {
						type: section,
						parentChatId: im_v2_const.ParentChatScope.topLevel
					});
				});
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: this.sourceSections,
					dialogId
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.service.loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.service.hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.service.loadNextPage();
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
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			initLikeManager() {
				this.likeManager = new im_v2_component_list_items_recent.LikeManager();
				this.likeManager.init();
			},
			destroyLikeManager() {
				this.likeManager.destroy();
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
			:contextMenuManager="contextMenuManager"
			data-testid="folder-all-unread-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #before-list>
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<RecentEmptyState
					data-testid="folder-all-unread-empty-state"
					:title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE_MSGVER_1')"
					:subtitle="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	exports.AllFolderList = AllFolderList;
	exports.AllFolderRecentService = AllFolderRecentService;
	exports.AllFolderUnreadList = AllFolderUnreadList;
	exports.PersonalFolderList = PersonalFolderList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Event, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
