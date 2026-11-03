/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, im_v2_component_list_items_base, im_v2_component_list_items_elements_activeCallList, im_v2_const, im_v2_lib_draft, im_v2_provider_service_copilot, main_core, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_menu, im_v2_component_list_items_elements_emptyState, im_v2_lib_copilot) {
	'use strict';

	class CopilotRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getAddToFolderItem(), this.getMuteItem(), this.getHideItem(), this.getLeaveItem()];
		}
		getAddToFolderItem() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive)) {
				return null;
			}
			return super.getAddToFolderItem();
		}
		getHideItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
				onClick: () => {
					this.getRecentService().hideChat(this.context.dialogId);
					im_v2_lib_analytics.Analytics.getInstance().recentContextMenu.onHide(this.context.dialogId);
					this.menuInstance.close();
				}
			};
		}
		getRecentService() {
			if (!this.service) {
				this.service = new im_v2_provider_service_copilot.CopilotRecentService();
			}
			return this.service;
		}
	}

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			subtitle() {
				return this.loc('IM_LIST_COPILOT_EMPTY_SUBTITLE', {
					'#COPILOT_NAME#': new im_v2_lib_copilot.CopilotManager().getName()
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<RecentEmptyState
			:title="loc('IM_LIST_COPILOT_EMPTY_TITLE')"
			:subtitle="subtitle"
			:recentSection="RecentType.copilot"
		/>
	`
	};

	// @vue/component
	const CopilotList = {
		name: 'CopilotList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			EmptyState
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
					type: im_v2_const.RecentType.copilot
				});
			}
		},
		async created() {
			this.contextMenuManager = ui_vue3.markRaw(new CopilotRecentMenu({
				emitter: this.getEmitter()
			}));
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
					this.service = new im_v2_provider_service_copilot.CopilotRecentService();
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
		</BaseRecentList>
	`
	};

	exports.CopilotList = CopilotList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib);
//# sourceMappingURL=copilot-list.bundle.js.map
