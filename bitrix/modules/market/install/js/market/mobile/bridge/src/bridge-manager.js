import { Type } from 'main.core';

import { BridgeEvents } from './bridge-events';
import { NativeBridge } from './native-bridge';
import { PageController } from './page-controller';

const NATIVE_BRIDGE_READY_EVENT = 'BXNativeBridgeReady';
const DEFAULT_PAGE_CODE = 'detail';

export class BridgeManager
{
	constructor(options = {})
	{
		this.page = this.normalizeString(options.page, DEFAULT_PAGE_CODE);
		this.getUrl = Type.isFunction(options.getUrl) ? options.getUrl : () => window.location.href;
		this.getTitle = Type.isFunction(options.getTitle) ? options.getTitle : () => '';
		this.onMenuClick = Type.isFunction(options.onMenuClick) ? options.onMenuClick : null;
		this.onInstallComplete = Type.isFunction(options.onInstallComplete) ? options.onInstallComplete : null;
		this.onNavigationBack = Type.isFunction(options.onNavigationBack) ? options.onNavigationBack : null;

		this.currentUiPayload = {};
		this.lastReadyKey = '';
		this.pageController = new PageController({
			onEvent: (event) => {
				this.handleNativeEvent(event);
			},
		});
		this.pageController.connect();
		this.nativeBridgeReadyHandler = null;
	}

	init()
	{
		this.initBridgeReadySync();
		this.trySyncWithNativeBridge();
	}

	applyMobileUi(payload = {}): void
	{
		this.currentUiPayload = Type.isPlainObject(payload) ? payload : {};
		this.syncCurrentPageState();
	}

	syncCurrentPageState(overridePayload = null): void
	{
		if (this.pageController)
		{
			this.pageController.connect(true);
		}

		const toolbarPayload = this.buildToolbarPayload(overridePayload);

		this.notifyPageReady(toolbarPayload);
		this.updateNativeToolbar(toolbarPayload);
	}

	buildToolbarPayload(overridePayload = null): Object
	{
		const pageUiPayload = Type.isPlainObject(overridePayload)
			? { ...this.currentUiPayload, ...overridePayload }
			: this.currentUiPayload;
		const currentPageUrl = this.normalizeString(this.getUrl(), window.location.href || '');
		const navigation = Type.isPlainObject(pageUiPayload.navigation) ? pageUiPayload.navigation : {};
		const title = this.normalizeString(pageUiPayload.title, this.getTitle());
		const menu = Type.isPlainObject(pageUiPayload.menu) ? pageUiPayload.menu : {};

		return {
			page: this.page,
			url: currentPageUrl,
			title,
			menu,
			tabs: [],
			navigation: {
				canGoBack: Type.isBoolean(navigation.canGoBack)
					? navigation.canGoBack
					: false,
				loading: navigation.loading === true,
			},
		};
	}

	notifyPageReady(payload = {}): void
	{
		if (
			!this.pageController
			|| (payload.navigation && payload.navigation.loading === true)
		)
		{
			return;
		}

		const readyKey = this.normalizeString(payload.url, '');

		if (readyKey === '' || this.lastReadyKey === readyKey)
		{
			return;
		}

		const isSent = this.pageController.emitReady({
			page: payload.page,
			url: readyKey,
		});

		if (isSent)
		{
			this.lastReadyKey = readyKey;
		}
		else
		{
			this.trySyncWithNativeBridge();
		}
	}

	updateNativeToolbar(payload = {}): void
	{
		if (!this.pageController)
		{
			return;
		}

		const isSent = this.pageController.updateToolbar(payload);

		if (!isSent)
		{
			this.trySyncWithNativeBridge();
		}
	}

	handleNativeEvent(event = {}): void
	{
		const eventType = this.resolveBridgeEventType(event);
		const data = this.resolveBridgeEventData(event);

		switch (eventType)
		{
			case BridgeEvents.MENU_CLICK:
			{
				if (this.onMenuClick)
				{
					this.onMenuClick(data);
				}

				break;
			}

			case BridgeEvents.NAVIGATION_BACK:
			{
				if (this.onNavigationBack)
				{
					this.onNavigationBack();
				}

				break;
			}

			case BridgeEvents.INSTALL_COMPLETE:
			{
				if (this.onInstallComplete)
				{
					this.onInstallComplete(data);
				}

				break;
			}

			default:
				break;
		}
	}

	resolveBridgeEventType(event = {}): string
	{
		if (!Type.isPlainObject(event))
		{
			return '';
		}

		return this.normalizeString(
			event.eventType
			|| event.type
			|| event.name
			|| (Type.isPlainObject(event.data) ? (event.data.eventType || event.data.type || event.data.name) : '')
			|| (Type.isPlainObject(event.params) ? (event.params.eventType || event.params.type || event.params.name) : ''),
			'',
		);
	}

	resolveBridgeEventData(event = {}): Object
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

	normalizeString(value, fallback = ''): string
	{
		const preparedValue = Type.isString(value) ? value.trim() : '';

		return Type.isStringFilled(preparedValue) ? preparedValue : fallback;
	}

	initBridgeReadySync(): void
	{
		this.nativeBridgeReadyHandler = () => {
			this.trySyncWithNativeBridge(true);
		};

		document.addEventListener(NATIVE_BRIDGE_READY_EVENT, this.nativeBridgeReadyHandler);
	}

	trySyncWithNativeBridge(force = false): boolean
	{
		if (!NativeBridge.isAvailable())
		{
			return false;
		}

		if (this.pageController)
		{
			this.pageController.connect(true);
		}

		if (force)
		{
			this.lastReadyKey = '';
		}

		this.syncCurrentPageState();

		return true;
	}
}
