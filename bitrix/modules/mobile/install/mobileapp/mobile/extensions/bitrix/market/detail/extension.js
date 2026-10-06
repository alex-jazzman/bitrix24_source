/**
 * @module market/detail
 */
jn.define('market/detail', (require, exports, module) => {
	const { confirmDestructiveAction } = require('alert');
	const { Type } = require('type');
	const { Loc } = require('loc');
	const {
		hasActionErrors,
		normalizeNonNegativeInt,
		normalizeOpenUrl,
		normalizeString,
		resolveActionErrorMessage: resolveActionResponseErrorMessage,
	} = require('market/utils');
	const { getParameterByName } = require('utils/url');
	const { createTestIdGenerator } = require('utils/test');
	const { NotifyManager } = require('notify-manager');
	const { showErrorToast } = require('toast/error');
	const { Color } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { Icon } = require('assets/icons');
	const { inAppUrl } = require('in-app-url');
	const { MarketInstallOpener } = require('market/install/opener');
	const { MarketDetailToolbarState } = require('market/detail/src/toolbar-state');

	const WebViewBridgeEvent = Object.freeze({
		PAGE_READY: 'market:page:ready',
		TOOLBAR_UPDATE: 'market:toolbar:update',
		INSTALL_OPEN: 'market:install:open',
		INSTALL_COMPLETE: 'market:install:complete',
		APP_OPEN: 'market:app:open',
		NAVIGATION_BACK: 'market:navigation:back',
		SEARCH_OPEN: 'market:search:open',
	});

	function resolveMenuItemIcon(iconName = '')
	{
		const normalizedIconName = normalizeString(iconName, '').toLowerCase();
		const iconMap = {
			feedback: Icon.FEEDBACK,
			favorite: Icon.FAVORITE,
			open: Icon.OPEN_NEW,
			question: Icon.QUESTION,
			refresh: Icon.REFRESH,
			settings: Icon.SETTINGS,
			share: Icon.SHARE,
			task_list: Icon.TASK_LIST,
			trashcan: Icon.TRASHCAN,
		};

		return iconMap[normalizedIconName] ?? null;
	}

	class MarketDetail extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.webViewRef = null;
			this.morePopupMenu = null;
			this.toolbarState = new MarketDetailToolbarState({
				title: props.title,
				fallbackTitle: Loc.getMessage('MOBILE_MARKET_DETAIL_OPENER_TITLE'),
			});
			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'market-detail',
			});
		}

		componentDidMount()
		{
			this.updateWidgetHeader();
		}

		componentWillUnmount()
		{
			this.morePopupMenu?.hide?.();
			this.morePopupMenu = null;
		}

		getLayoutWidget()
		{
			return this.props.layout ?? PageManager;
		}

		getUrl()
		{
			return normalizeOpenUrl(this.props.url);
		}

		getAppCode()
		{
			const explicitCode = normalizeString(this.props.code, '');
			if (explicitCode)
			{
				return explicitCode;
			}

			return normalizeString(getParameterByName(this.getUrl(), 'appCode'), '');
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: false,
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				WebView({
					style: {
						flex: 1,
						height: '100%',
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					data: {
						url: this.getUrl(),
					},
					ref: this.handleWebViewRef,
					onReceiveEvent: this.handleWebViewReceiveEvent,
				}),
			);
		}

		handleWebViewRef = (ref) => {
			this.webViewRef = ref;
		};

		handleWebViewReceiveEvent = (event = {}) => {
			const eventType = this.resolveEventType(event);
			const eventData = this.resolveEventData(event);

			if (eventType === WebViewBridgeEvent.TOOLBAR_UPDATE)
			{
				this.handleToolbarUpdate(eventData);

				return;
			}

			if (eventType === WebViewBridgeEvent.INSTALL_OPEN)
			{
				this.handleInstallOpen(eventData);

				return;
			}

			if (eventType === WebViewBridgeEvent.APP_OPEN)
			{
				this.handleAppOpen(eventData);

				return;
			}

			if (eventType === WebViewBridgeEvent.PAGE_READY)
			{
				this.updateWidgetHeader();
			}
		};

		resolveEventType(event = {})
		{
			if (!Type.isPlainObject(event))
			{
				return '';
			}

			return normalizeString(
				event.eventType
				|| event.type
				|| event.name
				|| (Type.isPlainObject(event.data) ? (event.data.eventType || event.data.type || event.data.name) : '')
				|| (Type.isPlainObject(event.params) ? (event.params.eventType || event.params.type || event.params.name) : ''),
				'',
			);
		}

		resolveEventData(event = {})
		{
			if (!Type.isPlainObject(event))
			{
				return {};
			}

			if (Type.isPlainObject(event.data))
			{
				return event.data;
			}

			if (Type.isPlainObject(event.params))
			{
				return event.params;
			}

			return {};
		}

		handleToolbarUpdate(payload = {})
		{
			const menu = Type.isPlainObject(payload?.menu)
				? this.prepareNativeMenuItems(payload.menu)
				: undefined;

			this.toolbarState.update({
				title: payload?.title,
				menu,
				search: payload?.search,
				navigation: payload?.navigation,
			});
			this.updateWidgetHeader();
		}

		prepareNativeMenuItems(data = {})
		{
			if (!Type.isPlainObject(data) || data.isAvailable !== true)
			{
				return [];
			}

			const menu = [];
			const contactDeveloperUrl = normalizeOpenUrl(data.contactDeveloperUrl);
			if (contactDeveloperUrl)
			{
				const title = Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_CONTACT_DEVELOPER');
				menu.push({
					id: 'contact-developer',
					title,
					icon: resolveMenuItemIcon('feedback'),
					onItemSelected: () => this.handleOpenLink(contactDeveloperUrl, title),
				});
			}

			const requestDemoUrl = normalizeOpenUrl(data.requestDemoUrl);
			if (requestDemoUrl)
			{
				const title = Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_REQUEST_DEMO');
				menu.push({
					id: 'request-demo',
					title,
					icon: resolveMenuItemIcon('question'),
					onItemSelected: () => this.handleOpenLink(requestDemoUrl, title),
				});
			}

			const partnerPageUrl = normalizeOpenUrl(data.partnerPageUrl);
			if (partnerPageUrl)
			{
				const title = Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_PARTNER_PAGE');
				menu.push({
					id: 'partner-page',
					title,
					icon: resolveMenuItemIcon('open'),
					onItemSelected: () => this.handleOpenLink(partnerPageUrl, title),
				});
			}

			const shareUrl = normalizeOpenUrl(data.shareUrl);
			if (shareUrl)
			{
				menu.push({
					id: 'share',
					title: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_SHARE'),
					icon: resolveMenuItemIcon('share'),
					onItemSelected: () => this.handleShareLink(shareUrl),
				});
			}

			const openAppUrl = normalizeOpenUrl(data.openAppUrl);
			if (data.canOpenApp === true && openAppUrl)
			{
				const title = Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_OPEN_APP');
				menu.push({
					id: 'open-app',
					title,
					icon: resolveMenuItemIcon('open'),
					onItemSelected: () => this.handleAppOpen({
						url: openAppUrl,
						title,
					}),
				});
			}

			const installInfo = this.prepareInstallInfo(data.installInfo);
			if (data.canUpdate === true && installInfo)
			{
				menu.push({
					id: 'update-app',
					title: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_UPDATE'),
					icon: resolveMenuItemIcon('refresh'),
					onItemSelected: () => this.handleInstallOpen(installInfo),
				});
			}

			if (data.canDelete === true)
			{
				menu.push({
					id: 'delete-app',
					title: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_DELETE'),
					icon: resolveMenuItemIcon('trashcan'),
					isDestructive: true,
					onItemSelected: () => this.handleDeleteApp(),
				});
			}

			return menu;
		}

		prepareInstallInfo(installInfo = {})
		{
			if (!Type.isPlainObject(installInfo))
			{
				return null;
			}

			const code = normalizeString(installInfo.code, '');
			if (!code)
			{
				return null;
			}

			return {
				code,
				version: normalizeNonNegativeInt(installInfo.version, 0),
				checkHash: normalizeString(installInfo.checkHash, ''),
				installHash: normalizeString(installInfo.installHash, ''),
			};
		}

		updateWidgetHeader()
		{
			const widget = this.getLayoutWidget();
			if (!widget)
			{
				return;
			}

			if (typeof widget?.setTitle === 'function')
			{
				widget.setTitle({
					text: this.toolbarState.getTitle(),
					type: 'dialog',
				}, true);
			}

			this.setBackdropLeftButtons(widget);

			if (typeof widget?.setRightButtons === 'function')
			{
				widget.setRightButtons(this.buildRightButtons());
			}
		}

		setBackdropLeftButtons(widget)
		{
			if (typeof widget?.setLeftButtons !== 'function')
			{
				return;
			}

			widget.setLeftButtons([
				{
					type: 'back',
					callback: this.handleBackClick,
				},
			]);
		}

		buildRightButtons()
		{
			const buttons = [];

			if (this.toolbarState.shouldShowSearchButton())
			{
				buttons.push({
					id: 'market_detail_search',
					type: 'search',
					callback: this.handleSearchClick,
				});
			}

			if (this.toolbarState.hasMenu())
			{
				buttons.push({
					id: 'market_detail_more',
					type: 'more',
					callback: this.handleMoreClick,
				});
			}

			return buttons;
		}

		handleBackClick = () => {
			if (this.toolbarState.canGoBack())
			{
				this.sendWebViewEvent(WebViewBridgeEvent.NAVIGATION_BACK);

				return;
			}

			this.getLayoutWidget()?.close?.();
		};

		handleSearchClick = () => {
			if (!this.toolbarState.isSearchEnabled())
			{
				return;
			}

			this.sendWebViewEvent(WebViewBridgeEvent.SEARCH_OPEN, this.toolbarState.getSearch());
		};

		handleMoreClick = () => {
			const menuItems = this.toolbarState.getMenu();
			if (menuItems.length === 0)
			{
				return;
			}

			this.morePopupMenu?.hide?.();
			this.morePopupMenu = new PopupMenu(menuItems);

			this.morePopupMenu.show({
				position: PopupMenuPosition.TOP_RIGHT,
			});
		};

		handleOpenLink(url = '', title = '')
		{
			const preparedUrl = normalizeOpenUrl(url);
			if (!preparedUrl)
			{
				return;
			}

			inAppUrl.open(preparedUrl, {
				title: normalizeString(title, this.toolbarState.getTitle()),
			});
		}

		handleShareLink(url = '')
		{
			const preparedUrl = normalizeOpenUrl(url);
			if (
				!preparedUrl
				|| typeof dialogs === 'undefined'
				|| typeof dialogs.showSharingDialog !== 'function'
			)
			{
				return;
			}

			dialogs.showSharingDialog({
				message: preparedUrl,
			});
		}

		handleDeleteApp()
		{
			const appCode = this.getAppCode();
			if (!appCode)
			{
				return;
			}

			confirmDestructiveAction({
				title: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_DELETE_CONFIRM_TITLE'),
				destructionText: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_DELETE'),
				onDestruct: () => {
					void this.runDeleteApp(appCode);
				},
			});
		}

		async runDeleteApp(appCode)
		{
			await NotifyManager.showLoadingIndicator();

			try
			{
				const response = await BX.ajax.runAction('market.Application.uninstall', {
					data: {
						code: appCode,
						clean: 'N',
						from: 'detail',
					},
					analyticsLabel: {
						code: appCode,
						viewMode: 'detail',
					},
					method: 'POST',
				}).catch((errorResponse) => errorResponse);

				const result = this.extractActionResult(response);
				const sliderUrl = normalizeOpenUrl(result?.sliderUrl);
				const isSuccess = (String(result?.success ?? '') === '1' || sliderUrl !== '');

				if (!isSuccess)
				{
					showErrorToast({
						message: this.resolveActionErrorMessage(result),
					}, this.getLayoutWidget());

					return;
				}

				if (Type.isFunction(this.props.onInstallCompleted))
				{
					this.props.onInstallCompleted({
						code: appCode,
						uninstalled: true,
					});
				}

				this.getLayoutWidget()?.close?.();

				if (sliderUrl)
				{
					inAppUrl.open(sliderUrl, {
						title: this.toolbarState.getTitle(),
					});
				}
			}
			catch (error)
			{
				console.error(error);
				showErrorToast({
					message: Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_ACTION_ERROR'),
				}, this.getLayoutWidget());
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		}

		extractActionResult(response)
		{
			if (hasActionErrors(response))
			{
				return {
					error: resolveActionResponseErrorMessage(response, 'UNKNOWN_ERROR'),
				};
			}

			if (Type.isPlainObject(response?.data))
			{
				return response.data;
			}

			return (Type.isPlainObject(response) ? response : {});
		}

		resolveActionErrorMessage(result = {})
		{
			return (
				normalizeString(result?.errorDescription, '')
				|| normalizeString(result?.error, '')
				|| Loc.getMessage('MOBILE_MARKET_DETAIL_MENU_ACTION_ERROR')
			);
		}

		handleInstallOpen(eventData = {})
		{
			const code = normalizeString(eventData.code, '');
			if (!code)
			{
				return;
			}

			MarketInstallOpener.open({
				code,
				version: normalizeNonNegativeInt(eventData.version, 0),
				checkHash: normalizeString(eventData.checkHash, ''),
				installHash: normalizeString(eventData.installHash, ''),
				source: 'detail',
				parentWidget: this.getLayoutWidget(),
				onCompleted: (installResult = {}) => {
					if (Type.isFunction(this.props.onInstallCompleted))
					{
						this.props.onInstallCompleted(installResult);
					}

					this.sendWebViewEvent(
						WebViewBridgeEvent.INSTALL_COMPLETE,
						Type.isPlainObject(installResult) ? installResult : {},
					);
				},
			});
		}

		handleAppOpen(eventData = {})
		{
			const url = normalizeOpenUrl(eventData.url);
			if (!url)
			{
				return;
			}

			inAppUrl.open(url, {
				title: normalizeString(eventData.title, this.toolbarState.getTitle()),
			});
		}

		sendWebViewEvent(eventType, data = {})
		{
			if (!this.webViewRef || typeof this.webViewRef.sendEvent !== 'function')
			{
				return;
			}

			this.webViewRef.sendEvent(
				eventType,
				Type.isPlainObject(data) ? data : {},
			);
		}
	}

	module.exports = {
		MarketDetail: (props) => new MarketDetail(props),
	};
});
