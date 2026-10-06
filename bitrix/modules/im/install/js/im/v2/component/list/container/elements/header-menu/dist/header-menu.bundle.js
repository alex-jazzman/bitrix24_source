/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, im_v2_lib_menu, im_v2_const, im_v2_lib_unreadMode, im_v2_provider_service_chat, im_v2_application_core, im_v2_lib_analytics, main_core, ui_iconSet_api_core) {
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
		onSelectUnreadMode() {
			this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
		}
		onReadAllClick() {
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
			im_v2_lib_unreadMode.UnreadModeManager.removeClosedChats(im_v2_const.RecentType.default);
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
			if (this.context.parentChatId > 0) {
				new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.taskComments, this.context.parentChatId);
				return;
			}
			new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.taskComments, im_v2_const.ParentChatScope.all);
		}
		getUnreadCounter() {
			const parentChatId = this.context.parentChatId;
			if (parentChatId > 0) {
				return im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](parentChatId, im_v2_const.RecentType.taskComments);
			}
			return im_v2_application_core.Core.getStore().getters['counters/getTotalTaskCounter'];
		}
	}

	class CollabHeaderMenu extends BaseRecentHeaderMenu {
		onReadAllClick() {
			new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.collab, im_v2_const.ParentChatScope.topLevel);
		}
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getTotalCollabCounter'];
		}
	}

	class CollabDefaultHeaderMenu extends BaseRecentHeaderMenu {
		onReadAllClick() {
			new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.collabDefault, this.context.parentChatId);
			this.#readParentChat();
		}
		getUnreadCounter() {
			const childrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, im_v2_const.RecentType.collabDefault);
			const parentCounter = im_v2_application_core.Core.getStore().getters['counters/getTotalCounterByIds']([this.context.parentChatId]);
			return parentCounter + childrenCounter;
		}
		#readParentChat() {
			const {
				dialogId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](this.context.parentChatId);
			new im_v2_provider_service_chat.ChatService().readDialog(dialogId);
		}
	}

	class CollabChatHeaderMenu extends BaseRecentHeaderMenu {
		onReadAllClick() {
			new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.collabChat, this.context.parentChatId);
		}
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, im_v2_const.RecentType.collabChat);
		}
	}

	class CollabCalendarHeaderMenu extends BaseRecentHeaderMenu {
		onReadAllClick() {
			new im_v2_provider_service_chat.ChatService().readAllByRecentType(im_v2_const.RecentType.calendar, this.context.parentChatId);
		}
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, im_v2_const.RecentType.calendar);
		}
	}

	class CollabCopilotHeaderMenu extends BaseRecentHeaderMenu {
		getUnreadCounter() {
			return im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, im_v2_const.RecentType.copilot);
		}
	}

	const MenuClass = {
		[im_v2_const.RecentType.taskComments]: TaskHeaderMenu,
		[im_v2_const.RecentType.collab]: CollabHeaderMenu,
		[im_v2_const.RecentType.default]: RecentHeaderMenu,
		[im_v2_const.RecentType.collabDefault]: CollabDefaultHeaderMenu,
		[im_v2_const.RecentType.collabChat]: CollabChatHeaderMenu,
		[im_v2_const.RecentType.calendar]: CollabCalendarHeaderMenu,
		[im_v2_const.RecentType.copilot]: CollabCopilotHeaderMenu
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
			},
			parentChatId: {
				type: Number,
				default: 0
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
				const context = {
					unreadMode: this.unreadMode,
					parentChatId: this.parentChatId
				};
				this.contextMenuManager.openMenu(context, event.currentTarget);
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

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX, BX.UI.IconSet);
//# sourceMappingURL=header-menu.bundle.js.map
