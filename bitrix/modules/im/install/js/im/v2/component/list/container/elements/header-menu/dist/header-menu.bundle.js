/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, im_v2_lib_menu, im_v2_const, im_v2_lib_unreadMode, im_v2_provider_service_chat, im_v2_application_core, im_v2_lib_analytics, main_core, ui_iconSet_api_core, im_v2_lib_feature) {
	'use strict';

	const MenuSectionCode = {
		first: 'first',
		second: 'second'
	};
	class BaseRecentHeaderMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			onToggleUnreadMode: 'onToggleUnreadMode'
		};
		constructor() {
			super();
			this.id = im_v2_const.PopupType.recentHeaderMenu;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false
			};
		}
		getMenuItems() {
			const isUnreadRecentModeAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.unreadRecentModeAvailable);
			if (!isUnreadRecentModeAvailable) {
				return [this.getReadAllItem()];
			}
			const firstGroupItems = [this.getDefaultModeItem(), this.getUnreadModeItem()];
			const secondGroupItems = [this.getReadAllItem()];
			return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems(secondGroupItems, MenuSectionCode.second)];
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode.first
			}, {
				code: MenuSectionCode.second
			}];
		}
		getUnreadModeItem() {
			const menuItem = {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_UNREAD_MODE'),
				isSelected: this.context.unreadMode,
				onClick: () => this.onSelectUnreadMode()
			};
			if (!this.context.unreadMode) {
				menuItem.counter = {
					value: this.getUnreadCounter()
				};
			}
			return menuItem;
		}
		getDefaultModeItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_ALL_MODE'),
				isSelected: !this.context.unreadMode,
				onClick: () => {
					if (!this.context.unreadMode) {
						return;
					}
					this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
				}
			};
		}
		getReadAllItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_READ_ALL_CHATS'),
				icon: ui_iconSet_api_core.Outline.CHATS_WITH_CHECK,
				onClick: () => this.onReadAllClick()
			};
		}
		onReadAllClick() {
			// you should implement this method for child class
		}
		onSelectUnreadMode() {
			// you should implement this method for child class
		}
		getUnreadCounter() {
			return 0;
		}
	}

	class RecentHeaderMenu extends BaseRecentHeaderMenu {
		onSelectUnreadMode() {
			im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode();
			this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
		}
		onReadAllClick() {
			im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onReadAllChats();
			im_v2_lib_unreadMode.UnreadModeManager.clearClosedChats(im_v2_const.RecentType.default);
			new im_v2_provider_service_chat.ChatService().readAll();
		}
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getTotalChatCounter'];
		}
	}

	class TaskHeaderMenu extends BaseRecentHeaderMenu {
		onSelectUnreadMode() {
			im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onOpenTasksUnreadMode();
			this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
		}
		onReadAllClick() {
			im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onReadAllTaskChats();
			im_v2_lib_unreadMode.UnreadModeManager.clearClosedChats(im_v2_const.RecentType.taskComments);
			new im_v2_provider_service_chat.ChatService().readAllByType(im_v2_const.ChatType.taskComments);
		}
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getTotalTaskCounter'];
		}
	}

	const MenuClass = {
		[im_v2_const.RecentType.taskComments]: TaskHeaderMenu,
		[im_v2_const.RecentType.default]: RecentHeaderMenu
	};

	// @vue/component
	const HeaderMenu = {
		name: 'HeaderMenu',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			unreadMode: {
				type: Boolean,
				default: false
			},
			recentSection: {
				type: String,
				required: true
			}
		},
		emits: ['toggleUnreadMode'],
		data() {
			return {
				showMenu: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		created() {
			this.contextMenuManager = new MenuClass[this.recentSection]();
			this.contextMenuManager.subscribe(im_v2_lib_menu.BaseMenu.events.close, this.closeMenu);
			this.contextMenuManager.subscribe(BaseRecentHeaderMenu.events.onToggleUnreadMode, this.onToggleUnreadMode);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			onToggleUnreadMode() {
				this.$emit('toggleUnreadMode');
			},
			openMenu(event) {
				this.contextMenuManager.openMenu({
					unreadMode: this.unreadMode
				}, event.currentTarget);
				this.showMenu = true;
			},
			closeMenu() {
				this.showMenu = false;
			},
			onClick(event) {
				if (this.unreadMode) {
					this.onToggleUnreadMode();
					return;
				}
				if (this.showMenu) {
					this.closeMenu();
					return;
				}
				this.openMenu(event);
			}
		},
		template: `
		<button
			class="bx-im-list-container-header-menu__container"
			:class="{'--active': unreadMode, '--menu-opened': showMenu }" 
			:aria-pressed="unreadMode"
			@click="onClick"
		>
			<BIcon
				class="bx-im-list-container-header-menu-icon"
				:name="OutlineIcons.FILTER_FUNNEL"
				:aria-hidden="true"
			/>
		</button>
	`
	};

	exports.HeaderMenu = HeaderMenu;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX, BX.UI.IconSet, BX.Messenger.v2.Lib);
//# sourceMappingURL=header-menu.bundle.js.map
