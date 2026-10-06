/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, main_popup) {
	'use strict';

	class Loc {
		static loadMessages(messages) {
			Loc.messages = messages;
		}
		static getMessage(code) {
			return Loc.messages[code];
		}
	}

	/**
	 * IMPORTANT:
	 * For non-Apple devices, width and height values are calculated relatively:
	 *  - mobile devices are calculated relative to Apple iPhone (6.3")
	 *  - tablet devices are calculated relative to Apple iPad Pro (13")
	 *
	 * This is required to preserve correct visual proportions in preview mode.
	 * A physically smaller device must never be rendered larger than a physically bigger one,
	 * even if its native screen resolution is higher.
	 *
	 * Apple devices are used as reference points because their physical dimensions
	 * are well-known and stable.
	 */
	const Devices = {
		defaultDevice: {
			tablet: 'iPad11',
			mobile: 'iPhone'
		},
		devices: {
			delimiter1: {
				code: 'delimiter',
				langCode: 'LANDING_PREVIEW_DEVICE_MOBILES'
			},
			// Apple iPhone 17 / Apple iPhone 17 Pro
			iPhone: {
				name: 'Apple iPhone (6.3")',
				code: 'iPhone',
				className: '--iphone',
				width: 1206 / 3,
				// 402
				height: 2622 / 3,
				// 874
				type: 'mobile'
			},
			// Apple iPhone 17 Air
			iPhoneAir: {
				name: 'Apple iPhone Air (6.5")',
				code: 'iPhoneAir',
				className: '--iphone-air',
				width: 1260 / 3,
				// 420
				height: 2736 / 3,
				// 912
				type: 'mobile'
			},
			// Apple iPhone 17 Pro Max
			iPhoneProMax: {
				name: 'Apple iPhone Pro Max (6.9")',
				code: 'iPhoneProMax',
				className: '--iphone-pro-max',
				width: 1320 / 3,
				// 440
				height: 2868 / 3,
				// 956
				type: 'mobile'
			},
			// Apple iPhone SE 4
			iPhoneSE: {
				name: 'Apple iPhone SE (4.7")',
				code: 'iPhoneSE',
				className: '--iphone-se',
				width: 1179 / 3,
				// 393
				height: 2532 / 3,
				// 844
				type: 'mobile'
			},
			// Samsung Galaxy S26
			// Dimensions are calculated relatively to Apple iPhone (6.3")
			// to preserve correct visual proportions in preview
			samsungGalaxy: {
				name: 'Samsung Galaxy (6.3")',
				code: 'samsungGalaxy',
				className: '--samsung-galaxy',
				// width: 1080 / 3, // 360
				// height: 2340 / 3, // 780
				width: 1212 / 3,
				// 404
				height: 2616 / 3,
				// 872
				type: 'mobile'
			},
			// Samsung Galaxy S26 +
			// Dimensions are calculated relatively to Apple iPhone (6.3")
			// to preserve correct visual proportions in preview
			samsungGalaxyPlus: {
				name: 'Samsung Galaxy + (6.7")',
				code: 'samsungGalaxyPlus',
				className: '--samsung-galaxy-plus',
				// width: 1440 / 3, // 480
				// height: 3120 / 3, // 1040
				width: 1287 / 3,
				// 429
				height: 2781 / 3,
				// 927
				type: 'mobile'
			},
			// Xiaomi Redmi Note 15 Pro
			// Dimensions are calculated relatively to Apple iPhone (6.3")
			// to preserve correct visual proportions in preview
			xiaomiRedmiNotePro: {
				name: 'Xiaomi Redmi Note Pro (6.8")',
				code: 'xiaomiRedmiNotePro',
				className: '--xiaomi-redmi-note-pro',
				// width: 1280 / 3, // 427
				// height: 2772 / 3, // 924
				width: 1308 / 3,
				// 436
				height: 2826 / 3,
				// 942
				type: 'mobile'
			},
			delimiter2: {
				code: 'delimiter',
				langCode: 'LANDING_PREVIEW_DEVICE_TABLETS'
			},
			iPadMini: {
				name: 'Apple iPad Mini (8.3")',
				code: 'iPadMini',
				className: '--ipad-mini',
				width: 1488 / 2,
				// 744
				height: 2266 / 2,
				// 1133
				type: 'tablet'
			},
			// Apple iPad 11‑inch
			iPad11: {
				name: 'Apple iPad (11")',
				code: 'iPad11',
				className: '--ipad-11',
				width: 1640 / 2,
				// 820
				height: 2360 / 2,
				// 1180
				type: 'tablet'
			},
			// Apple iPad Pro 13‑inch
			iPad13: {
				name: 'Apple iPad Pro (13")',
				code: 'iPad13',
				className: '--ipad-13',
				width: 2048 / 2,
				// 1024
				height: 2732 / 2,
				// 1366
				type: 'tablet'
			},
			// Galaxy Tab S11 Ultra
			// Dimensions are calculated relatively to Apple iPad Pro (13")
			// to preserve correct visual proportions in preview
			samsungGalaxyTabUltra: {
				name: 'Samsung Galaxy Tab Ultra (14.6")',
				code: 'samsungGalaxyTabUltra',
				className: '--samsung-galaxy-tab-ultra',
				// width: 1848 / 2.5, // 739
				// height: 2960 / 2.5, // 1184
				width: 2064 / 2,
				// 1032,
				height: 3304 / 2,
				// 1652
				type: 'tablet'
			}
		}
	};

	class DeviceUI {
		/**
		 * Returns Landing Preview Block above the screen.
		 *
		 * @param {Options} options Preview options.
		 * @return {HTMLElement}
		 */
		static getPreview(options) {
			if (options.messages) {
				DeviceUI.messages = options.messages;
			}
			if (!localStorage.getItem('deviceOrientation')) {
				localStorage.setItem('deviceOrientation', 'portrait');
			}
			const rotateClick = () => {
				if (localStorage.getItem('deviceOrientation') === 'portrait') {
					localStorage.setItem('deviceOrientation', 'landscape');
				} else {
					localStorage.setItem('deviceOrientation', 'portrait');
				}
				main_core.Dom.style(layout.wrapper, 'width', `${layout.wrapper.offsetHeight}px`);
				main_core.Dom.style(layout.wrapper, 'height', `${layout.wrapper.offsetWidth}px`);
				main_core.Dom.style(layout.frame, 'width', `${layout.frame.offsetHeight}px`);
				main_core.Dom.style(layout.frame, 'height', `${layout.frame.offsetWidth}px`);
				layout.wrapper.querySelector('[data-role="device-orientation"]').innerHTML = localStorage.getItem('deviceOrientation');
			};
			const hidden = localStorage.getItem('deviceHidden') === 'true';
			const layout = {
				wrapper: null,
				rotate: main_core.Tag.render`<div class="landing-device-rotate" onclick="${rotateClick}" data-role="landing-device-rotate"></div>`,
				frame: main_core.Tag.render`<iframe data-role="landing-device-preview-iframe" src="${options.frameUrl}"></iframe>`
			};

			// Sandbox the preview only when it shares the portal origin — that is the only case where
			// the frame could reach the editor document and the portal session. A cross-origin preview
			// is already isolated by the browser, and sandboxing it would cost more than it adds: an
			// opaque origin turns even same-host @font-face into a CORS request, and the portal serves
			// fonts without Access-Control-Allow-Origin, so icon fonts stop rendering.
			// Attribute is set before the frame enters the document, so it applies to the first load.
			if (DeviceUI.isSameOriginPreview(options.frameUrl)) {
				main_core.Dom.attr(layout.frame, 'sandbox', 'allow-scripts');
			}
			layout.wrapper = main_core.Tag.render`
			<div class="landing-device-wrapper${hidden ? ' landing-device-wrapper-hidden' : ''}">
				<div class="landing-device-name" onclick="${options.clickHandler}">
					<span data-role="device-name">Device</span>
					<span data-role="device-orientation" class="landing-device-orientation">Orientation</span>
				</div>
				${layout.rotate}
				<div class="landing-device-preview" data-role="landing-device-preview">
					${layout.frame}
				</div>
			</div>
		`;
			return layout.wrapper;
		}

		/**
		 * Returns true when the preview URL resolves to the origin the editor itself runs on.
		 * Fails closed: an unparseable URL is treated as same-origin, so the sandbox stays on.
		 *
		 * @param {string} frameUrl Preview URL, absolute or relative.
		 * @return {boolean}
		 */
		static isSameOriginPreview(frameUrl) {
			try {
				return new URL(frameUrl, window.location.href).origin === window.location.origin;
			} catch (e) {
				return true;
			}
		}

		/**
		 * Creates and open menu with list of devices.
		 *
		 * @param {HTMLElement} bindElement HTML element to bind position of menu.
		 * @param {Array<DeviceItem>} devices List of devices.
		 * @param {(device: DeviceItem) => {}} clickHandler Invokes when user clicked on the menu item.
		 */
		static openDeviceMenu(bindElement, devices, clickHandler) {
			const menuId = 'device_selector';
			let menu = main_popup.MenuManager.getMenuById(menuId);
			if (menu) {
				menu.show();
				return;
			}
			const menuItems = [];
			devices.forEach(device => {
				if (device.code === 'delimiter') {
					menuItems.push(new main_popup.MenuItem({
						delimiter: true,
						text: device.langCode ? DeviceUI.messages[device.langCode] : ''
					}));
					return;
				}
				menuItems.push(new main_popup.MenuItem({
					id: device.className,
					html: String(device.name),
					onclick: () => {
						main_popup.MenuManager.getMenuById(menuId).close();
						clickHandler(device);
					}
				}));
			});
			const bindNode = bindElement.parentNode || document.body;
			menu = main_popup.MenuManager.create({
				id: menuId,
				bindElement: bindNode,
				className: 'landing-ui-block-actions-popup',
				items: menuItems,
				offsetTop: 0,
				offsetLeft: 40,
				minWidth: bindNode.offsetWidth,
				animation: 'fading-slide',
				events: {
					onPopupShow: () => {
						menu.getPopupWindow().setMinWidth(bindNode.offsetWidth);
					}
				}
			});
			menu.show();
		}
	}

	class Device {
		#options;
		#frameUrl;
		#editorFrameWrapper;
		#previewElement;
		#previewFrame;
		#previewWindow; // window object of iframe
		#previewLoader;
		#currentDevice = null;
		#editorEnabled = false;
		#pendingReload = false;
		#commandsToRefresh = ['Landing::upBlock', 'Landing::downBlock', 'Landing::showBlock', 'Landing::hideBlock', 'Landing::markDeletedBlock', 'Landing::addBlock', 'Landing::copyBlock', 'Landing::moveBlock', 'Block::changeNodeName', 'Block::updateContent', 'Block::getContent', 'Landing\\Block::addCard', 'Landing\\Block::cloneCard', 'Landing\\Block::removeCard', 'Landing\\Block::updateNodes', 'Landing\\Block::updateStyles', 'Landing\\Block::saveForm' // fake-action
		];
		// PROTO-01 (owner): device-preview postMessage protocol. Envelope {action, payload}.
		static #ACTION_SET_TOUCH = 'landing.device-preview:setTouch';
		static #ACTION_SCROLL_TO_PERCENT = 'landing.device-preview:scrollToPercent';
		static #ACTION_READY = 'landing.device-preview:ready';

		/**
		 * Device constructor.
		 *
		 * @param {Options} options Constructor options.
		 */
		constructor(options) {
			this.target = options.target || document.body;
			this.#frameUrl = options.frameUrl;
			this.#editorFrameWrapper = options.editorFrameWrapper;
			this.#options = options;
			this.#registerListeners(options);
			this.#buildPreview(options);
			this.#showPreview();
			this.#setDevice(this.#resolveDeviceByType('mobile'));
		}

		/**
		 * Registers Handlers you need.
		 *
		 * @param {Options} options Constructor options.
		 */
		#registerListeners(options) {
			// when user click different window size
			BX.addCustomEvent('BX.Landing.Main:editorSizeChange', deviceType => {
				this.#setDevice(this.#resolveDeviceByType(deviceType));
			});

			// listen messages from editor frame
			window.addEventListener('message', event => {
				const data = event.data || {};

				// PROTO-01: the sandboxed preview reports it is ready — resend the current state.
				// Accept ready only from the preview window; the editor channel uses event.source too.
				if (event.source === this.#previewWindow && data.action === Device.#ACTION_READY) {
					this.#sendPreviewState();
					return;
				}
				if (data.action === 'editorenable') {
					if (!!data.payload.enable) {
						this.#editorEnabled = true;
					} else {
						if (this.#pendingReload) {
							this.#reloadPreviewWindow();
						}
						this.#editorEnabled = false;
						this.#pendingReload = false;
					}
				} else if (data.action === 'backendaction') {
					this.#backendAction(data.payload);
				}
			});
		}

		/**
		 * Invokes when backend request occurred.
		 *
		 * @param {{action: string, data: Object}} payload Payload data.
		 */
		#backendAction(payload) {
			if (this.#commandsToRefresh.includes(payload.action)) {
				if (this.#editorEnabled) {
					this.#pendingReload = true;
				} else {
					let blockId = null;
					if (payload.data?.block) {
						blockId = payload.data?.block;
					}
					if (payload.data?.updateNodes?.data?.block) {
						blockId = payload.data?.updateNodes?.data?.block;
					}
					blockId = main_core.Text.toInteger(blockId);
					if (blockId <= 0) {
						blockId = null;
					}
					this.#reloadPreviewWindow(blockId);
				}
			}
		}

		/**
		 * Reloads preview window.
		 * @param {number} blockId
		 */
		#reloadPreviewWindow(blockId) {
			if (this.#previewFrame) {
				const uri = new main_core.Uri(this.#frameUrl);
				uri.setQueryParam('ts', Date.now());
				if (main_core.Type.isNil(blockId)) {
					uri.removeQueryParam('scrollTo');
				} else {
					uri.setQueryParam('scrollTo', `editor${blockId}`);
				}
				this.#previewFrame.src = uri.toString();
			}
		}
		#getDocumentMetrics(doc) {
			const body = doc?.body;
			const documentElement = doc?.documentElement;
			if (!body || !documentElement) {
				return null;
			}
			return {
				scrollHeight: Math.max(body.scrollHeight, documentElement.scrollHeight, body.offsetHeight, documentElement.offsetHeight, body.clientHeight, documentElement.clientHeight),
				scrollTop: documentElement.scrollTop || body.scrollTop
			};
		}

		/**
		 * Scrolls preview window for some percent.
		 *
		 * @param {number} topInPercent Percent from top to scroll.
		 */
		#scrollDevice(topInPercent) {
			// The sandboxed preview owns its height and converts the percent to pixels itself.
			this.#postToPreview(Device.#ACTION_SCROLL_TO_PERCENT, {
				percent: topInPercent
			});
		}

		/**
		 * Sends a PROTO-01 command to the sandboxed preview window.
		 *
		 * @param {string} action Namespaced action name.
		 * @param {Object} payload Command payload.
		 */
		#postToPreview(action, payload) {
			if (this.#previewWindow) {
				// targetOrigin '*': the preview is opaque-origin and commands carry no privileged data.
				this.#previewWindow.postMessage({
					action,
					payload
				}, '*');
			}
		}

		/**
		 * Pushes the current touch and scroll state to the preview (e.g. after it reports ready).
		 */
		#sendPreviewState() {
			this.#postToPreview(Device.#ACTION_SET_TOUCH, {
				touch: true
			});
			this.#adjustPreviewScroll();
		}

		/**
		 * Resolves and returns Device by its code.
		 *
		 * @param {string} deviceType Device type.
		 * @return {DeviceItem}
		 */
		#resolveDeviceByType(deviceType) {
			let deviceCode = localStorage.getItem('deviceCode');
			if (deviceCode && Devices.devices[deviceCode]) {
				return Devices.devices[deviceCode];
			}
			deviceCode = Devices.defaultDevice?.[deviceType];
			if (!deviceCode) {
				return;
			}
			return Devices.devices[deviceCode];
		}
		#getPreviewNode() {
			if (!this.#previewLoader) {
				Loc.loadMessages(this.#options.messages);
				this.#previewLoader = main_core.Tag.render`
				<div class="landing-device-loader">
					<div class="landing-device-loader-icon"></div>
					<div class="landing-device-loader-text">${Loc.getMessage('LANDING_TPL_PREVIEW_LOADING')}</div>
				</div>
			`;
			}
			return this.#previewLoader;
		}
		#setPreview(target) {
			if (!target) {
				return;
			}
			main_core.Dom.append(this.#getPreviewNode(), target);
		}
		#removePreview() {
			main_core.Dom.addClass(this.#getPreviewNode(), '--hide');
			main_core.Event.bind(this.#getPreviewNode(), 'transitionend', () => {
				main_core.Dom.remove(this.#getPreviewNode());
			});
		}

		/**
		 * Sets new device.
		 *
		 * @param {DeviceItem|null} newDevice Device.
		 */
		#setDevice(newDevice) {
			if (!newDevice) {
				return;
			}
			localStorage.setItem('deviceCode', newDevice.code);

			// remove old class within preview
			if (this.#currentDevice) {
				main_core.Dom.removeClass(this.#previewElement, this.#currentDevice.className);
				this.#previewElement.style.removeProperty('top');
			}
			this.#currentDevice = newDevice;
			this.#previewElement.querySelector('[data-role="device-name"]').innerHTML = newDevice.name;
			this.#previewElement.querySelector('[data-role="device-orientation"]').innerHTML = localStorage.getItem('deviceOrientation');
			const frame = this.#previewElement.querySelector('[data-role="landing-device-preview-iframe"]');
			const frameWrapper = this.#previewElement.querySelector('[data-role="landing-device-preview"]');
			frame.onload = () => this.#removePreview();

			// scale for device
			if (frame && frameWrapper && this.#currentDevice.width && this.#currentDevice.height) {
				const maxDeviceHeight = this.#maxDeviceHeight(this.#currentDevice.type);
				const scale = window.innerHeight / (maxDeviceHeight + 300);
				const padding = parseInt(window.getComputedStyle(frameWrapper).padding);
				let param1 = this.#currentDevice.width;
				let param2 = this.#currentDevice.height;
				if (localStorage.getItem('deviceOrientation') === 'landscape') {
					param1 = this.#currentDevice.height;
					param2 = this.#currentDevice.width;
				}
				frame.style.setProperty('width', `${param1}px`);
				frame.style.setProperty('height', `${param2}px`);
				frameWrapper.style.setProperty('transform', `scale(${scale})`);
				this.#previewElement.style.setProperty('width', `${(param1 + padding * 2) * scale}px`);
				this.#previewElement.style.setProperty('height', `${(param2 + padding * 2) * scale}px`);
			}
			main_core.Dom.addClass(this.#previewElement, this.#currentDevice.className);
		}
		#maxDeviceHeight(type) {
			let maxHeight = 0;
			Object.values(Devices.devices).forEach(device => {
				if (device.type === type && device.height) {
					maxHeight = Math.max(maxHeight, device.height);
				}
			});
			return maxHeight;
		}

		/**
		 * Gets top scroll of editor window and adjusts device preview window.
		 */
		#adjustPreviewScroll() {
			const editorFrame = this.#editorFrameWrapper?.querySelector('iframe');
			const metrics = this.#getDocumentMetrics(editorFrame?.contentWindow?.document);
			if (!metrics || metrics.scrollHeight <= 0) {
				return;
			}
			this.#scrollDevice(metrics.scrollTop / metrics.scrollHeight * 100);
		}

		/**
		 * Creates Preview Popup.
		 *
		 * @param {Options} options Preview options.
		 */
		#buildPreview(options) {
			if (!this.#previewElement) {
				this.#previewElement = DeviceUI.getPreview({
					frameUrl: options.frameUrl,
					clickHandler: this.#onClickDeviceSelector.bind(this),
					messages: options.messages
				});
				main_core.Dom.hide(this.#previewElement);
				this.target.appendChild(this.#previewElement);
				const editorFrame = this.#editorFrameWrapper?.querySelector('iframe');
				if (editorFrame) {
					main_core.Event.bind(editorFrame, 'load', () => {
						this.#adjustPreviewScroll();
					});
				}
				const previewFrame = this.#previewElement.querySelector('iframe');
				if (previewFrame) {
					this.#previewFrame = previewFrame;
					main_core.Event.bind(previewFrame, 'load', () => {
						this.#previewWindow = previewFrame.contentWindow;
						// Under sandbox the preview document is opaque-origin: drive touch and scroll
						// through PROTO-01 instead of reading contentWindow.document directly.
						this.#sendPreviewState();
					});
					if (!this.#previewWindow) {
						this.#previewWindow = previewFrame.contentWindow;
					}
				}
				this.#adjustPreviewScroll();
			}
		}

		/**
		 * Invokes by clicking on device selector.
		 */
		#onClickDeviceSelector() {
			DeviceUI.openDeviceMenu(this.#previewElement.querySelector('[data-role="device-name"]'), Object.values(Devices.devices), this.#setDevice.bind(this));
		}

		/**
		 * Creates and Shows Preview Popup.
		 */
		#showPreview() {
			main_core.Dom.show(this.#previewElement);
			this.#setPreview(this.#previewElement);
		}

		/**
		 * Hides Preview Popup.
		 */
		#hidePreview() {
			main_core.Dom.hide(this.#previewElement);
		}
	}

	class Action {
		#iframe;
		constructor(options) {
			this.#iframe = options.iframe;
			if (!main_core.Type.isDomNode(this.#iframe)) {
				throw new Error("Missed 'frame' option as iFrame Element.");
			}
		}

		/**
		 * Sends action with payload to child window.
		 *
		 * @param {string} action Command to internal iframe.
		 * @param {Object} payload Command's payload.
		 */
		#postInternalCommand(action, payload) {
			this.#iframe.contentWindow.postMessage({
				action,
				payload
			}, window.location.origin);
		}

		/**
		 * Handles on Designer click.
		 *
		 * @param {number} blockId Block id.
		 */
		onDesignerBlockClick(blockId) {
			this.#postInternalCommand('onDesignerBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Style Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onStyleBlockClick(blockId) {
			this.#postInternalCommand('onStyleBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Edit Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onEditBlockClick(blockId) {
			this.#postInternalCommand('onEditBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Down Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onSortDownBlockClick(blockId) {
			this.#postInternalCommand('onSortDownBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Up Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onSortUpBlockClick(blockId) {
			this.#postInternalCommand('onSortUpBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Remove Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onRemoveBlockClick(blockId) {
			this.#postInternalCommand('onRemoveBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Change State Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onChangeStateBlockClick(blockId) {
			this.#postInternalCommand('onChangeStateBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Cut Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onCutBlockClick(blockId) {
			this.#postInternalCommand('onCutBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Copy Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onCopyBlockClick(blockId) {
			this.#postInternalCommand('onCopyBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Paste Block click.
		 *
		 * @param {number} blockId Block id.
		 */
		onPasteBlockClick(blockId) {
			this.#postInternalCommand('onPasteBlockClick', {
				blockId
			});
		}

		/**
		 * Handles on Feedback click.
		 *
		 * @param {number} blockId Block id.
		 */
		onFeedbackClick(blockId) {
			this.#postInternalCommand('onFeedbackClick', {
				blockId
			});
		}

		/**
		 * Handles on Save In Library click.
		 *
		 * @param {number} blockId Block id.
		 */
		onSaveInLibraryClick(blockId) {
			this.#postInternalCommand('onSaveInLibraryClick', {
				blockId
			});
		}

		/**
		 * Hide opened editor panel.
		 */
		onHideEditorPanel() {
			this.#postInternalCommand('onHideEditorPanel');
		}
	}

	class UI {
		static pendingMenuItems = {};

		/**
		 * Till Menu for this block not show, sets predefined prop value for menu item.
		 *
		 * @param {number} blockId
		 * @param {string} itemCode
		 * @param {string} itemProp
		 * @param {mixed} value
		 */
		static setPendingMenuItemValue(blockId, itemCode, itemProp, value) {
			if (!UI.pendingMenuItems[blockId]) {
				UI.pendingMenuItems[blockId] = {};
			}
			if (!UI.pendingMenuItems[blockId][itemCode]) {
				UI.pendingMenuItems[blockId][itemCode] = {};
			}
			UI.pendingMenuItems[blockId][itemCode][itemProp] = value;
		}

		/**
		 * Returns predefined prop value for menu item (if exists).
		 *
		 * @param {number} blockId
		 * @param {string} itemCode
		 * @param {string} itemProp
		 */
		static getPendingMenuItemValue(blockId, itemCode, itemProp) {
			if (UI.pendingMenuItems[blockId] && UI.pendingMenuItems[blockId][itemCode]) {
				return UI.pendingMenuItems[blockId][itemCode][itemProp] || null;
			}
			return null;
		}

		/**
		 * Returns Designer Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getDesignerBlockButton(onClick) {
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_DESIGNER_BLOCK');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action --separate${onClick ? '' : ' landing-ui-disabled'}" type="button" title="${title}">
				<span class="landing-ui-button-text">${title}</span>
			</button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns Style Block Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getStyleBlockButton(onClick) {
			const label = Loc.getMessage('LANDING_TPL_EXT_BUTTON_STYLE_BLOCK');
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_STYLE_BLOCK_TITLE');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action --separate${onClick ? '' : ' landing-ui-disabled'}" type="button" title="${title}">
				<span class="landing-ui-button-text">${label}</span>
			</button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns Edit Block Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getEditBlockButton(onClick) {
			//data-id="content"
			const label = Loc.getMessage('LANDING_TPL_EXT_BUTTON_EDIT_BLOCK');
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_EDIT_BLOCK_TITLE');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action --separate${onClick ? '' : ' landing-ui-disabled'}" type="button" title="${title}" data-id="content">
				<span class="landing-ui-button-text">${label}</span>
			</button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns left container for block's actions.
		 *
		 * @param {LeftContainerOptions} options Options for left container.
		 * @return {HTMLDivElement}
		 */
		static getLeftContainer(options) {
			return main_core.Tag.render`
			<div class="landing-ui-external-left-container">
				<div class="landing-ui-external-left-top-hr"></div>
				<div class="landing-ui-external-body">
					<div class="landing-ui-external-panel">
						${UI.getDesignerBlockButton(options.designerBlockClick)}
						${UI.getStyleBlockButton(options.styleBlockClick)}
						${UI.getEditBlockButton(options.editBlockClick)}
					</div>
				</div>
				<div class="landing-ui-external-left-bottom-hr"></div>
			</div>
		`;
		}

		/**
		 * Returns Sort Down Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getSortDownBlockButton(onClick) {
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_DOWN_BLOCK');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action${onClick ? '' : ' landing-ui-disabled'}" type="button" data-id="down" title="${title}"><span class="landing-ui-button-text">&nbsp;</span></button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns Sort Up Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getSortUpBlockButton(onClick) {
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_UP_BLOCK');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action${onClick ? '' : ' landing-ui-disabled'}" type="button" data-id="up" title="${title}"><span class="landing-ui-button-text">&nbsp;</span></button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns Additional Items Menu for Block.
		 *
		 * @param {number} blockId Block id.
		 * @return {Menu}
		 */
		static getBlockAdditionalMenu(blockId) {
			return main_popup.MenuManager.getMenuById('block_actions_' + blockId);
		}

		/**
		 * Closes Additional Items Menu for Block.
		 *
		 * @param {number} blockId Block id.
		 */
		static closeBlockAdditionalMenu(blockId) {
			const menu = UI.getBlockAdditionalMenu(blockId);
			if (menu) {
				menu.close();
			}
		}

		/**
		 * Change state for Additional Menu Item 'Activate'.
		 *
		 * @param {number} blockId Block id.
		 * @param {boolean} state State.
		 */
		static changeStateMenuItem(blockId, state) {
			const menu = UI.getBlockAdditionalMenu(blockId);
			const title = Loc.getMessage(!state ? 'LANDING_TPL_EXT_BUTTON_ACTIONS_SHOW' : 'LANDING_TPL_EXT_BUTTON_ACTIONS_HIDE');
			if (menu) {
				BX.Landing.Utils.setTextContent(menu.getMenuItem('show_hide').getLayout()['text'], title);
			} else {
				UI.setPendingMenuItemValue(blockId, 'show_hide', 'state', state);
			}
		}

		/**
		 * Enables/disables paste-item.
		 *
		 * @param {number} blockId Block id.
		 * @param {boolean} enablePaste Flag.
		 */
		static changePasteMenuItem(blockId, enablePaste) {
			const menu = UI.getBlockAdditionalMenu(blockId);
			if (menu) {
				const item = menu.getMenuItem('paste');
				if (item) {
					if (enablePaste) {
						item.enable();
					} else {
						item.disable();
					}
				}
			} else {
				UI.setPendingMenuItemValue(blockId, 'paste', 'disabled', !enablePaste);
			}
		}

		/**
		 * Returns List of Actions for Block.
		 *
		 * @param {number} blockId Block id.
		 * @param {AdditionalActions} actions Additional actions for Block.
		 * @return {HTMLButtonElement}
		 */
		static getActionsList(blockId, actions) {
			const label = Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK');
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK_TITLE');
			const actionButton = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action" type="button" data-id="actions" title="${title}">
				<span class="landing-ui-button-text">${label}</span>
			</button>
		`;

			// when click is occurred open exists menu or create new one
			main_core.Event.bind(actionButton, 'click', event => {
				if (actions.onOpenAdditionalMenu) {
					actions.onOpenAdditionalMenu(blockId);
					event.stopPropagation();
				}
				const menu = UI.getBlockAdditionalMenu(blockId);
				if (menu) {
					menu.show();
					return;
				}
				main_popup.MenuManager.create({
					id: 'block_actions_' + blockId,
					bindElement: actionButton,
					className: 'landing-ui-block-actions-popup',
					angle: {
						position: 'top',
						offset: 95
					},
					offsetTop: -6,
					offsetLeft: -26,
					items: [new main_popup.MenuItem({
						id: 'show_hide',
						disabled: !actions.changeStateClick,
						text: Loc.getMessage(actions.state || UI.getPendingMenuItemValue(blockId, 'show_hide', 'state') ? 'LANDING_TPL_EXT_BUTTON_ACTIONS_HIDE' : 'LANDING_TPL_EXT_BUTTON_ACTIONS_SHOW'),
						onclick: () => {
							actions.changeStateClick();
						}
					}), new main_popup.MenuItem({
						id: 'cut',
						disabled: !actions.cutClick,
						text: Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_CUT'),
						onclick: () => {
							actions.cutClick();
						}
					}), new main_popup.MenuItem({
						id: 'copy',
						disabled: !actions.copyClick,
						text: Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_COPY'),
						onclick: () => {
							actions.copyClick();
						}
					}), new main_popup.MenuItem({
						id: 'paste',
						disabled: !actions.pasteClick || UI.getPendingMenuItemValue(blockId, 'paste', 'disabled'),
						text: Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_PASTE'),
						onclick: () => {
							actions.pasteClick();
						}
					}), new main_popup.MenuItem({
						id: 'feedback',
						disabled: !actions.feedbackClick,
						text: Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_FEEDBACK'),
						onclick: () => {
							actions.feedbackClick();
						}
					}), actions.saveInLibrary ? new main_popup.MenuItem({
						delimiter: true
					}) : null, new main_popup.MenuItem({
						id: 'save_in_library',
						disabled: !actions.saveInLibrary,
						text: Loc.getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_SAVE_IN_LIBRARY'),
						onclick: () => {
							actions.saveInLibrary();
						}
					})]
				}).show();
			});
			return actionButton;
		}

		/**
		 * Returns Remove Button.
		 *
		 * @param {() => {}} onClick Click handler.
		 * @return {HTMLButtonElement}
		 */
		static getRemoveBlockButton(onClick) {
			const title = Loc.getMessage('LANDING_TPL_EXT_BUTTON_REMOVE_BLOCK');
			const button = main_core.Tag.render`
			<button class="landing-ui-button landing-ui-button-action${onClick ? '' : ' landing-ui-disabled'}" type="button" data-id="remove" title="${title}"><span class="landing-ui-button-text">&nbsp;</span></button>
		`;
			if (onClick) {
				main_core.Event.bind(button, 'click', onClick);
			}
			return button;
		}

		/**
		 * Returns right container for block's actions.
		 *
		 * @param {RightContainerOptions} options Options for right container.
		 * @return {HTMLDivElement}
		 */
		static getRightContainer(options) {
			return main_core.Tag.render`
			<div class="landing-ui-external-right-container">
				<div class="landing-ui-external-right-top-hr"></div>
				<div class="landing-ui-external-body">
					<div class="landing-ui-external-panel">
						${UI.getSortDownBlockButton(options.sortDownBlockClick)}
						${UI.getSortUpBlockButton(options.sortUpBlockClick)}
						${UI.getActionsList(options.blockId, options)}
						${UI.getRemoveBlockButton(options.removeBlockClick)}
					</div>
				</div>
				<div class="landing-ui-external-right-bottom-hr"></div>
			</div>
		`;
		}
	}

	class ExternalControls {
		#action;
		#externalBlocks;
		#container;
		#iframeWrapper;
		#currentOpenBlockId;
		#currentOpenMenuBlock;
		constructor(options) {
			options = options || {};
			this.#container = options.container;
			this.#iframeWrapper = options.iframeWrapper;
			if (!main_core.Type.isDomNode(this.#container)) {
				throw new Error("Missed 'container' option as Dom Node.");
			}
			if (!main_core.Type.isDomNode(this.#iframeWrapper)) {
				throw new Error("Missed 'iframe' option as Dom Node.");
			}
			this.#externalBlocks = new Map();
			this.#action = new Action({
				iframe: this.#iframeWrapper.querySelector('iframe')
			});
			Loc.loadMessages(options.messages);
			window.addEventListener('message', this.#listenChildFrame.bind(this));
			this.#container.addEventListener('click', event => {
				this.#action.onHideEditorPanel();
			});
			window.addEventListener('storage', this.#onStorageChange.bind(this));
		}

		/**
		 * Handler on listening child iframe commands.
		 *
		 * @param event
		 */
		#listenChildFrame(event) {
			const data = event.data || {};
			if (!data.payload) {
				return;
			}
			if (data.action === 'register') {
				this.#registerBlocks(data.payload.blocks);
			} else if (data.action === 'showcontrols') {
				this.#showControls(data.payload.blockId, data.payload.top, data.payload.height);
			} else if (data.action === 'changestate') {
				this.#changeState(data.payload.blockId, data.payload.state);
			} else if (data.action === 'mode') {
				this.#onChangeMode(data.payload);
			} else if (data.action === 'hideall') {
				this.#hideAllControls();
			} else if (data.action === 'showblockcontrols') {
				this.#hideAllControls();
				this.#hideAndShowControls(data.payload.blockId);
			}
		}

		/**
		 * Handler on listening Storage changing.
		 */
		#onStorageChange() {
			const blocks = this.#externalBlocks.values();
			const allowPaste = !!window.localStorage.getItem('landingBlockId');
			for (let i = 0, c = this.#externalBlocks.size; i < c; i++) {
				const blockItem = blocks.next().value;
				UI.changePasteMenuItem(blockItem.id, allowPaste);
				this.#updateBlock(blockItem.id, {
					...blockItem,
					permissions: {
						...blockItem.permissions,
						allowPaste
					}
				});
			}
		}

		/**
		 * Registers Block's controls for current page.
		 *
		 * @param {Array<Block>} blocks Array of Blocks.
		 */
		#registerBlocks(blocks) {
			blocks.map(block => {
				const blockId = block.id;

				// left controls
				block.leftContainer = UI.getLeftContainer({
					designerBlockClick: block.permissions.allowDesignBlock ? () => {
						this.#action.onDesignerBlockClick(blockId);
					} : null,
					styleBlockClick: block.permissions.allowModifyStyles ? () => {
						this.#action.onStyleBlockClick(blockId);
					} : null,
					editBlockClick: block.permissions.allowEditContent ? () => {
						this.#action.onEditBlockClick(blockId);
					} : null
				});

				// right controls
				block.rightContainer = UI.getRightContainer({
					blockId,
					state: block.state,
					sortDownBlockClick: block.permissions.allowSorting ? () => {
						this.#action.onSortDownBlockClick(blockId);
						this.#hideAllControls();
					} : null,
					sortUpBlockClick: block.permissions.allowSorting ? () => {
						this.#action.onSortUpBlockClick(blockId);
						this.#hideAllControls();
					} : null,
					removeBlockClick: block.permissions.allowRemove ? () => {
						this.#action.onRemoveBlockClick(blockId);
						this.#hideAllControls();
					} : null,
					onOpenAdditionalMenu: blockId => {
						this.#currentOpenMenuBlock = blockId;
						setTimeout(() => {
							this.#action.onHideEditorPanel();
						}, 0);
					},
					changeStateClick: block.permissions.allowChangeState ? () => {
						UI.closeBlockAdditionalMenu(blockId);
						this.#action.onChangeStateBlockClick(blockId);
						this.#hideAndShowControls(blockId);
					} : null,
					cutClick: block.permissions.allowRemove ? () => {
						this.#action.onCutBlockClick(blockId);
						this.#hideAllControls();
					} : null,
					copyClick: () => {
						UI.closeBlockAdditionalMenu(blockId);
						this.#action.onCopyBlockClick(blockId);
						this.#hideAndShowControls(blockId);
					},
					pasteClick: () => {
						UI.closeBlockAdditionalMenu(blockId);
						this.#action.onPasteBlockClick(blockId);
						this.#hideAndShowControls(blockId);
					},
					feedbackClick: () => {
						UI.closeBlockAdditionalMenu(blockId);
						this.#action.onFeedbackClick(blockId);
					},
					saveInLibrary: block.permissions.allowSaveInLibrary ? () => {
						UI.closeBlockAdditionalMenu(blockId);
						this.#action.onSaveInLibraryClick(blockId);
					} : null
				});
				main_core.Dom.append(block.leftContainer, this.#container);
				main_core.Dom.append(block.rightContainer, this.#container);
				main_core.Dom.hide(block.leftContainer);
				main_core.Dom.hide(block.rightContainer);
				this.#externalBlocks.set(blockId, block);
			});
		}

		/**
		 * Creates new block or takes it from Map.
		 *
		 * @param {number} blockId Block id.
		 * @return {Block}
		 */
		#getBlock(blockId) {
			return this.#externalBlocks.get(parseInt(blockId));
		}

		/**
		 * Updates Block.
		 *
		 * @param blockId Block id.
		 * @param {Block} data New Block data.
		 */
		#updateBlock(blockId, data) {
			this.#externalBlocks.set(parseInt(blockId), data);
		}

		/**
		 * Changes state for the Block.
		 *
		 * @param {number} blockId Block id
		 * @param state
		 */
		#changeState(blockId, state) {
			const block = this.#getBlock(blockId);
			if (block) {
				UI.changeStateMenuItem(blockId, state);
				this.#updateBlock(blockId, {
					...block,
					state
				});
			}
		}

		/**
		 * Hides all controls.
		 */
		#hideAllControls() {
			if (this.#currentOpenBlockId) {
				const blockItem = this.#externalBlocks.get(this.#currentOpenBlockId);
				main_core.Dom.hide(blockItem.leftContainer);
				main_core.Dom.hide(blockItem.rightContainer);
			} else {
				const blocks = this.#externalBlocks.values();
				for (let i = 0, c = this.#externalBlocks.size; i < c; i++) {
					const blockItem = blocks.next().value;
					main_core.Dom.hide(blockItem.leftContainer);
					main_core.Dom.hide(blockItem.rightContainer);
				}
			}

			// if some menu is opened, close it
			if (this.#currentOpenMenuBlock) {
				UI.closeBlockAdditionalMenu(this.#currentOpenMenuBlock);
				this.#currentOpenMenuBlock = null;
			}
		}

		/**
		 * Shows controls for block.
		 *
		 * @param {number} blockId Block's id.
		 * @param {number} top Block's top position.
		 * @param {number} height Block's height.
		 */
		#showControls(blockId, top, height) {
			const block = this.#getBlock(blockId);
			if (!block) {
				return;
			}
			const iframeRect = this.#iframeWrapper.getBoundingClientRect();
			this.#hideAllControls();
			this.#currentOpenBlockId = block.id;
			this.#action.onHideEditorPanel();
			top = parseInt(top);

			// adjust top and bottom borders
			if (top < 0 && height + top > 50) {
				height = height + top;
				top = 0;
				main_core.Dom.addClass(block.leftContainer, 'hide-top');
				main_core.Dom.addClass(block.rightContainer, 'hide-top');
			} else {
				main_core.Dom.removeClass(block.leftContainer, 'hide-top');
				main_core.Dom.removeClass(block.rightContainer, 'hide-top');
			}
			main_core.Dom.show(block.leftContainer);
			main_core.Dom.show(block.rightContainer);

			// adjust top and heights
			block.leftContainer.style.width = iframeRect.left + 'px';
			block.leftContainer.style.top = top + 'px';
			block.leftContainer.style.height = height + 'px';
			block.rightContainer.style.width = iframeRect.left + 'px';
			block.rightContainer.style.left = iframeRect.left + iframeRect.width + 'px';
			block.rightContainer.style.top = top + 'px';
			block.rightContainer.style.height = height + 'px';
		}

		/**
		 * Hides and shows controls (blink) for specific Block.
		 *
		 * @param {blockId} blockId Block id.
		 */
		#hideAndShowControls(blockId) {
			const block = this.#getBlock(blockId);
			if (block) {
				this.#currentOpenBlockId = null;
				main_core.Dom.hide(block.leftContainer);
				main_core.Dom.hide(block.rightContainer);
				setTimeout(() => {
					this.#currentOpenBlockId = block.id;
					main_core.Dom.show(block.leftContainer);
					main_core.Dom.show(block.rightContainer);
				}, 500);
			}
		}

		/**
		 * When user toggles mode (internal vs external controls).
		 *
		 * @param {{[type: string]: string}} data New mode data.
		 */
		#onChangeMode(data) {
			if (data.type === 'internal') {
				this.#hideAllControls();
			}
		}
	}

	class SlidePanel {
		constructor() {
			this.layout = {
				container: null,
				pulse: null,
				close: null,
				preview: null
			};
			this.init();
		}
		showPreview() {
			main_core.Dom.addClass(this.getPreviewContainer(), '--show');
		}
		hidePreview() {
			main_core.Dom.removeClass(this.getPreviewContainer(), '--show');
		}
		getClose() {
			if (!this.layout.close) {
				this.layout.close = main_core.Tag.render`
				<div class="landing-slide-panel__navigation-item --close">
					<div class="ui-icon-set --cross-45"></div>
				</div>
			`;
				main_core.Event.bind(this.layout.close, 'click', () => this.hide());
			}
			return this.layout.close;
		}
		getPulse() {
			if (!this.layout.pulse) {
				this.layout.pulse = main_core.Tag.render`
				<div class="landing-slide-panel__navigation-item --pulse">
					<div class="ui-icon-set --mobile-2"></div>
				</div>
			`;
				main_core.Event.bind(this.layout.pulse, 'click', () => this.show());
			}
			return this.layout.pulse;
		}
		getPreviewContainer() {
			if (!this.layout.preview) {
				this.layout.preview = main_core.Tag.render`
				<div class="landing-slide-panel__container-item --preview"></div>
			`;
			}
			return this.layout.preview;
		}
		getContainer() {
			if (!this.layout.container) {
				this.layout.container = main_core.Tag.render`
				<div class="landing-slide-panel">
					<div class="landing-slide-panel-inner">					
						<div class="landing-slide-panel__container">
							${this.getPreviewContainer()}
						</div>
						<div class="landing-slide-panel__navigation">
							${this.getClose()}
						</div>
					</div>
					${this.getPulse()}
				</div>
			`;
			}
			return this.layout.container;
		}
		show() {
			main_core.Dom.addClass(this.getContainer(), '--open');
			this.showPreview();
		}
		hide() {
			main_core.Dom.removeClass(this.getContainer(), '--open');
			this.hidePreview();
		}
		init() {
			main_core.Dom.append(this.getContainer(), document.body);
		}
	}

	exports.Device = Device;
	exports.ExternalControls = ExternalControls;
	exports.SlidePanel = SlidePanel;

})(this.BX.Landing.View = this.BX.Landing.View || {}, BX, BX.Main);
//# sourceMappingURL=script.js.map
