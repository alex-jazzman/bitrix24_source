/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, main_core, im_v2_const, im_v2_lib_layout, im_v2_lib_menu, im_v2_lib_utils) {
	'use strict';

	const OPENLINES_PAGE_PATH = '/online/?IM_LINES=';
	class RecentContextMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			...im_v2_lib_menu.BaseMenu.events,
			openItem: 'openItem'
		};
		getMenuItems() {
			return [this.#getOpenItem(), this.#getOpenItemInNewTab()];
		}
		#getOpenItem() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
				onClick: () => {
					this.emit(RecentContextMenu.events.openItem, {
						dialogId: this.context.dialogId
					});
					void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
						name: this.#getLayoutName(),
						entityId: this.context.dialogId
					});
				}
			};
		}
		#getLayoutName() {
			const chat = this.store.getters['chats/get'](this.context.dialogId);
			const isOpenLinesChat = chat && chat.type === im_v2_const.ChatType.lines;
			return isOpenLinesChat ? im_v2_const.Layout.openlinesV2 : im_v2_const.Layout.chat;
		}
		#getOpenItemInNewTab() {
			return {
				title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_IN_NEW_TAB'),
				onClick: () => {
					im_v2_lib_utils.Utils.browser.openLink(`${OPENLINES_PAGE_PATH}${this.context.dialogId}`);
				}
			};
		}
	}

	exports.RecentContextMenu = RecentContextMenu;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=menu.bundle.js.map
