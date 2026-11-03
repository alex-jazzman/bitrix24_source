/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, ui_infoHelper, main_core_events, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_layout, im_v2_lib_phone, im_v2_lib_utils, im_v2_lib_market) {
	'use strict';

	const LayoutsWithOwnNavigationItem = Object.freeze({
		[im_v2_const.Layout.notification]: im_v2_const.NavigationMenuItem.notification,
		[im_v2_const.Layout.settings]: im_v2_const.NavigationMenuItem.settings,
		[im_v2_const.Layout.market]: im_v2_const.NavigationMenuItem.market
	});
	const getNavigationItemId = layoutName => {
		const ownItemId = LayoutsWithOwnNavigationItem[layoutName];
		if (ownItemId) {
			return ownItemId;
		}

		// With folders on, sections have no menu items of their own, so any other screen, known or
		// unknown, falls back to the messenger item.
		if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable)) {
			return im_v2_const.NavigationMenuItem.messenger;
		}

		// Without folders every section keeps its own menu item, so an empty id means the screen has
		// none (folder, conference, chat and folder forms) or is unknown: nothing to highlight.
		return im_v2_const.NavigationMenuItem[layoutName] ?? '';
	};

	const customClickHandler = {
		[im_v2_const.NavigationMenuItem.messenger]: onMessengerClick,
		[im_v2_const.NavigationMenuItem.copilot]: onCopilotClick,
		[im_v2_const.NavigationMenuItem.call]: onCallClick,
		[im_v2_const.NavigationMenuItem.timemanager]: onTimeManagerClick,
		[im_v2_const.NavigationMenuItem.homepage]: onHomepageClick,
		[im_v2_const.NavigationMenuItem.market]: onMarketClick
	};
	const NavigationManager = {
		open(payload) {
			const {
				id
			} = payload;
			if (!im_v2_const.NavigationMenuItem[id]) {
				return;
			}
			if (customClickHandler[id]) {
				customClickHandler[id](payload);
				return;
			}
			handleMenuItem(payload);
		},
		isMarketApp(payload) {
			const {
				id,
				entityId
			} = payload;
			const isMarketMenuItem = id === im_v2_const.NavigationMenuItem.market;
			return isMarketMenuItem && Boolean(entityId);
		},
		getNavigationItemId(layoutName) {
			return getNavigationItemId(layoutName);
		}
	};
	function onMessengerClick() {
		// The item has no screen of its own: it opens the same folder the messenger starts with.
		const initialLayout = im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
			name: im_v2_const.Layout.chat
		};

		// changeLayout() is bypassed on purpose: it forwards entityId only and would drop the
		// starting folder kept in params.
		main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList);
		void im_v2_lib_layout.LayoutManager.getInstance().setLayout(initialLayout);
	}
	function onCopilotClick(payload) {
		if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive)) {
			const promoter = new ui_infoHelper.FeaturePromoter({
				code: im_v2_const.SliderCode.copilotDisabled
			});
			promoter.show();
			im_v2_lib_analytics.Analytics.getInstance().copilot.onOpenTab({
				isAvailable: false
			});
			return;
		}
		handleMenuItem(payload);
	}
	function onCallClick(payload) {
		const KEYPAD_OFFSET_TOP = -30;
		const KEYPAD_OFFSET_LEFT = 64;
		im_v2_lib_phone.PhoneManager.getInstance().openKeyPad({
			bindElement: payload?.target,
			offsetTop: KEYPAD_OFFSET_TOP,
			offsetLeft: KEYPAD_OFFSET_LEFT
		});
	}
	function onTimeManagerClick() {
		BX.Timeman?.Monitor?.openReport();
	}
	function onHomepageClick() {
		im_v2_lib_utils.Utils.browser.openLink('/');
	}
	function onMarketClick(payload) {
		const {
			entityId
		} = payload;
		if (entityId) {
			// specific apps should be opened as layouts
			changeLayout({
				layoutName: im_v2_const.Layout.market,
				layoutEntityId: entityId
			});
			return;
		}

		// marketplace should be opened as slider
		im_v2_lib_market.MarketManager.openChatMarket();
	}
	function handleMenuItem(payload) {
		const {
			id: layoutName,
			entityId: layoutEntityId,
			asLink
		} = payload;
		if (asLink) {
			openLink({
				layoutName,
				layoutEntityId
			});
			return;
		}
		changeLayout({
			layoutName,
			layoutEntityId
		});
	}
	function openLink({
		layoutName,
		layoutEntityId
	}) {
		const LayoutToUrlConfigMap = {
			[im_v2_const.NavigationMenuItem.chat]: {
				paramName: im_v2_const.GetParameter.openChat,
				useParamByDefault: false,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.copilot]: {
				paramName: im_v2_const.GetParameter.openCopilotChat,
				useParamByDefault: true,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.collab]: {
				paramName: im_v2_const.GetParameter.openCollab,
				useParamByDefault: true,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.channel]: {
				paramName: im_v2_const.GetParameter.openChannel,
				useParamByDefault: true,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.tasksTask]: {
				paramName: im_v2_const.GetParameter.openTaskComments,
				useParamByDefault: true,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.openlines]: {
				paramName: im_v2_const.GetParameter.openLines,
				useParamByDefault: true,
				canUseId: true
			},
			[im_v2_const.NavigationMenuItem.notification]: {
				paramName: im_v2_const.GetParameter.openNotifications,
				useParamByDefault: true,
				canUseId: false
			},
			[im_v2_const.NavigationMenuItem.settings]: {
				paramName: im_v2_const.GetParameter.openSettings,
				useParamByDefault: true,
				canUseId: false
			}
		};
		const basePath = im_v2_const.Path.online;
		const urlConfig = LayoutToUrlConfigMap[layoutName];
		if (!urlConfig) {
			return;
		}
		let finalUrl = basePath;
		if (urlConfig.canUseId && layoutEntityId) {
			finalUrl += `?${urlConfig.paramName}=${layoutEntityId}`;
		} else if (urlConfig.useParamByDefault) {
			finalUrl += `?${urlConfig.paramName}`;
		}
		location.href = finalUrl;
	}
	function changeLayout({
		layoutName,
		layoutEntityId
	}) {
		// The only place where a navigation menu item becomes a layout name, so the menu item of the plain
		// chats is sent to the section where those chats live now. Everything below keeps working on the
		// resolved name: the validity check, the last opened chat and the nested list event.
		const targetLayoutName = layoutName === im_v2_const.Layout.chat ? im_v2_lib_folder.FolderManager.getRegularChatsLayout().name : layoutName;
		const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
		if (!layoutManager.isValidLayout(targetLayoutName)) {
			return;
		}
		const targetLayout = layoutManager.resolveLayoutEntityId({
			name: targetLayoutName,
			entityId: layoutEntityId
		});
		main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList);
		void layoutManager.setLayout(targetLayout);
	}

	exports.NavigationManager = NavigationManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.UI, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=navigation.bundle.js.map
