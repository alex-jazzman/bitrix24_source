/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, im_v2_component_list_items_base, im_v2_component_list_items_elements_activeCallList, im_v2_const, im_v2_application_core, im_v2_provider_service_recent, main_core, im_v2_lib_analytics, im_v2_lib_confirm, im_v2_lib_layout, im_v2_lib_menu, im_v2_lib_rest, im_v2_component_elements_chatTitle, im_v2_component_list_items_elements_emptyState) {
	'use strict';

	class ChannelService extends im_v2_provider_service_recent.BaseRecentService {
		#lastMessageId = 0;
		getRecentType() {
			return im_v2_const.RecentType.openChannel;
		}
		getRestMethodName() {
			return im_v2_const.RestMethod.imV2RecentChannelTail;
		}
		getRequestFilter(firstPage = false) {
			return {
				lastMessageId: firstPage ? null : this.#lastMessageId
			};
		}
		onAfterRequest(firstPage) {
			if (!firstPage) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/clearCollection', {
				type: im_v2_const.RecentType.openChannel
			});
		}
		handlePaginationField(result) {
			const {
				messages
			} = result;
			this.#lastMessageId = this.#getMinMessageId(messages);
		}
		#getMinMessageId(messages) {
			if (messages.length === 0) {
				return 0;
			}
			const firstMessageId = messages[0].id;
			return messages.reduce((minId, nextMessage) => {
				return Math.min(minId, nextMessage.id);
			}, firstMessageId);
		}
	}

	class ChannelRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getOpenItem(), this.getSubscribeItem(), this.getUnsubscribeItem()];
		}
		getOpenItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
				onClick: () => {
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: im_v2_const.Layout.channel,
						entityId: this.context.dialogId
					});
					this.menuInstance.close();
				}
			};
		}
		getSubscribeItem() {
			if (!this.isGuestRole()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIST_CHANNEL_MENU_SUBSCRIBE'),
				onClick: () => {
					void this.chatService.joinChat(this.context.dialogId);
					this.menuInstance.close();
				}
			};
		}
		getUnsubscribeItem() {
			const {
				dialogId
			} = this.context;
			if (this.isGuestRole()) {
				return null;
			}
			const canLeave = this.permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.leave, dialogId);
			if (!canLeave) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_LIST_CHANNEL_MENU_UNSUBSCRIBE'),
				onClick: async () => {
					this.menuInstance.close();
					const userChoice = await im_v2_lib_confirm.showLeaveChatConfirm(dialogId);
					if (userChoice === true) {
						this.chatService.leaveChat(dialogId);
						im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onLeave(dialogId);
					}
				}
			};
		}
	}

	const TAG = 'IM_SHARED_CHANNEL_LIST';
	class PullWatchManager {
		#pullClient;
		constructor() {
			this.#pullClient = im_v2_application_core.Core.getPullClient();
		}
		subscribe() {
			this.#pullClient.extendWatch(TAG);
			this.#requestWatchStart();
		}
		unsubscribe() {
			this.#pullClient.clearWatch(TAG);
		}
		#requestWatchStart() {
			void im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2RecentChannelExtendPullWatch);
		}
	}

	// @vue/component
	const ChannelItem = {
		name: 'ChannelItem',
		components: {
			BaseRecentItem: im_v2_component_list_items_base.BaseRecentItem,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			recentItem() {
				return this.item;
			}
		},
		template: `
		<BaseRecentItem
			:item="item"
			:withCounter="false"
			:withMessageStatus="false"
			:withInputIndicator="false"
			:withDraft="false"
		>
			<template #title>
				<ChatTitle :dialogId="recentItem.dialogId" />
			</template>
		</BaseRecentItem>
	`
	};

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<RecentEmptyState 
			:title="loc('IM_LIST_CHANNEL_EMPTY_TITLE')"
			:subtitle="loc('IM_LIST_CHANNEL_EMPTY_SUBTITLE')"
			:recentSection="RecentType.openChannel" 
		/>
	`
	};

	// @vue/component
	const ChannelList = {
		name: 'ChannelList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			EmptyState,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			ChannelItem
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				listIsScrolled: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedCollection']({
					type: im_v2_const.RecentType.openChannel
				});
			}
		},
		created() {
			this.contextMenuManager = ui_vue3.markRaw(new ChannelRecentMenu({
				emitter: this.getEmitter()
			}));
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
			this.getPullWatchManager().unsubscribe();
		},
		activated() {
			void this.loadInitialItems();
			this.getPullWatchManager().subscribe();
		},
		deactivated() {
			this.getPullWatchManager().unsubscribe();
		},
		methods: {
			async loadInitialItems() {
				if (this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentService().loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
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
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			getRecentService() {
				if (!this.service) {
					this.service = new ChannelService();
				}
				return this.service;
			},
			getPullWatchManager() {
				if (!this.pullWatchManager) {
					this.pullWatchManager = new PullWatchManager();
				}
				return this.pullWatchManager;
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
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<EmptyState />
			</template>
			<template #item="{ item, onClick, onRightClick }">
				<ChannelItem
					:item="item"
					@click="onClick(item)"
					@click.right="onRightClick(item, $event)"
				/>
			</template>
		</BaseRecentList>
	`
	};

	exports.ChannelList = ChannelList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Application, BX.Messenger.v2.Service, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List);
//# sourceMappingURL=channel-list.bundle.js.map
