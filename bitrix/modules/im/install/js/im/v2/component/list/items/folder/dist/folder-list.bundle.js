/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_items_base, im_v2_lib_draft, im_v2_application_core, im_v2_const, im_v2_provider_service_recent, im_v2_lib_menu, ui_vue3_components_button, im_v2_lib_layout, im_v2_component_list_items_elements_emptyState) {
	'use strict';

	class FolderRecentService extends im_v2_provider_service_recent.BaseRecentService {
		#folderId;
		constructor(props) {
			super(props);
			this.#folderId = props.folderId;
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
				lastMessageDate: firstPage ? null : this.getLastMessageDate()
			};
		}
		async saveRecentItems(restResult) {
			const {
				recentItems
			} = restResult;
			const returnedDialogIds = await im_v2_application_core.Core.getStore().dispatch('recent/set', recentItems);
			this.#hideChatsMissingFromTail(returnedDialogIds);
			return returnedDialogIds;
		}

		// Server tail is hide-aware: it returns only folder members the user can still see.
		// Members listed in the folder definition but absent from the tail are hidden/left,
		// so mark them hidden. Otherwise a channel that another section (e.g. the channels list)
		// loaded into the shared recent collection would reappear in the folder after reload.
		#hideChatsMissingFromTail(returnedDialogIds) {
			const folder = im_v2_application_core.Core.getStore().getters['recent/folders/getById'](this.#folderId);
			if (folder?.type !== im_v2_const.FolderType.personal) {
				return;
			}
			const returnedIdSet = new Set(returnedDialogIds);
			const missingDialogIds = folder.definition.chats.map(chat => chat.dialogId).filter(dialogId => !returnedIdSet.has(dialogId));
			if (missingDialogIds.length === 0) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/setHiddenStatus', {
				ids: missingDialogIds,
				hidden: true
			});
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
	const FolderChatList = {
		name: 'FolderChatList',
		components: {
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
				isLoading: false,
				firstPageLoaded: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			collection() {
				const folderDialogIds = this.folder.definition.chats.map(chat => chat.dialogId);
				return this.$store.getters['recent/getCollectionByIds'](folderDialogIds);
			},
			folder() {
				return this.$store.getters['recent/folders/getById'](this.folderId);
			}
		},
		async created() {
			this.contextMenuManager = new FolderRecentMenu({
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
					this.service = new FolderRecentService({
						folderId: this.folderId
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
			data-testid="folder-chat-list"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #empty-state>
				<EmptyState :folderId="folderId" />
			</template>
		</BaseRecentList>
	`
	};

	exports.FolderChatList = FolderChatList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List);
//# sourceMappingURL=folder-list.bundle.js.map
