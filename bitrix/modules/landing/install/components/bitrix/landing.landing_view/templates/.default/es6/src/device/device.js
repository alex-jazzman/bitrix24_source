import { Dom, Tag, Event, Text, Type, Uri } from 'main.core';
import { Loc } from '../controls/controls.loc';

import { Devices, DeviceItem } from './device.data';
import DeviceUI from './device.ui';

type Options = {
	editorFrameWrapper: HTMLElement,
	frameUrl: string,
	messages: {[type: string]: string},
};

export class Device
{
	#options;
	#frameUrl: string;
	#editorFrameWrapper: HTMLElement;
	#previewElement: HTMLDivElement;
	#previewFrame: ?HTMLIFrameElement;
	#previewWindow;// window object of iframe
	#previewLoader: HTMLDivElement;
	#currentDevice: ?DeviceItem = null;
	#editorEnabled: boolean = false;
	#pendingReload: boolean = false;
	#commandsToRefresh = [
		'Landing::upBlock',
		'Landing::downBlock',
		'Landing::showBlock',
		'Landing::hideBlock',
		'Landing::markDeletedBlock',
		'Landing::addBlock',
		'Landing::copyBlock',
		'Landing::moveBlock',
		'Block::changeNodeName',
		'Block::updateContent',
		'Block::getContent',
		'Landing\\Block::addCard',
		'Landing\\Block::cloneCard',
		'Landing\\Block::removeCard',
		'Landing\\Block::updateNodes',
		'Landing\\Block::updateStyles',
		'Landing\\Block::saveForm', // fake-action
	];
	target: HTMLElement;

	// PROTO-01 (owner): device-preview postMessage protocol. Envelope {action, payload}.
	static #ACTION_SET_TOUCH = 'landing.device-preview:setTouch';
	static #ACTION_SCROLL_TO_PERCENT = 'landing.device-preview:scrollToPercent';
	static #ACTION_READY = 'landing.device-preview:ready';

	/**
	 * Device constructor.
	 *
	 * @param {Options} options Constructor options.
	 */
	constructor(options: Options)
	{
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
	#registerListeners(options: Options)
	{
		// when user click different window size
		BX.addCustomEvent('BX.Landing.Main:editorSizeChange', (deviceType: string) =>
		{
			this.#setDevice(this.#resolveDeviceByType(deviceType));
		});

		// listen messages from editor frame
		window.addEventListener('message', event => {
			const data = event.data || {};

			// PROTO-01: the sandboxed preview reports it is ready — resend the current state.
			// Accept ready only from the preview window; the editor channel uses event.source too.
			if (event.source === this.#previewWindow && data.action === Device.#ACTION_READY)
			{
				this.#sendPreviewState();

				return;
			}

			if (data.action === 'editorenable')
			{
				if (!!data.payload.enable)
				{
					this.#editorEnabled = true;
				}
				else
				{
					if (this.#pendingReload)
					{
						this.#reloadPreviewWindow();
					}
					this.#editorEnabled = false;
					this.#pendingReload = false;
				}
			}
			else if (data.action === 'backendaction')
			{
				this.#backendAction(data.payload);
			}
		});
	}

	/**
	 * Invokes when backend request occurred.
	 *
	 * @param {{action: string, data: Object}} payload Payload data.
	 */
	#backendAction(payload: {action: string, data: Object})
	{
		if (this.#commandsToRefresh.includes(payload.action))
		{
			if (this.#editorEnabled)
			{
				this.#pendingReload = true;
			}
			else
			{
				let blockId = null;

				if (payload.data?.block)
				{
					blockId = payload.data?.block;
				}

				if (payload.data?.updateNodes?.data?.block)
				{
					blockId = payload.data?.updateNodes?.data?.block;
				}

				blockId = Text.toInteger(blockId);
				if (blockId <= 0)
				{
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
	#reloadPreviewWindow(blockId: ?number)
	{
		if (this.#previewFrame)
		{
			const uri = new Uri(this.#frameUrl);
			uri.setQueryParam('ts', Date.now());

			if (Type.isNil(blockId))
			{
				uri.removeQueryParam('scrollTo');
			}
			else
			{
				uri.setQueryParam('scrollTo', `editor${blockId}`);
			}

			this.#previewFrame.src = uri.toString();
		}
	}

	#getDocumentMetrics(doc: ?Document): ?{ scrollHeight: number, scrollTop: number }
	{
		const body = doc?.body;
		const documentElement = doc?.documentElement;

		if (!body || !documentElement)
		{
			return null;
		}

		return {
			scrollHeight: Math.max(
				body.scrollHeight,
				documentElement.scrollHeight,
				body.offsetHeight,
				documentElement.offsetHeight,
				body.clientHeight,
				documentElement.clientHeight,
			),
			scrollTop: documentElement.scrollTop || body.scrollTop,
		};
	}

	/**
	 * Scrolls preview window for some percent.
	 *
	 * @param {number} topInPercent Percent from top to scroll.
	 */
	#scrollDevice(topInPercent: number)
	{
		// The sandboxed preview owns its height and converts the percent to pixels itself.
		this.#postToPreview(Device.#ACTION_SCROLL_TO_PERCENT, { percent: topInPercent });
	}

	/**
	 * Sends a PROTO-01 command to the sandboxed preview window.
	 *
	 * @param {string} action Namespaced action name.
	 * @param {Object} payload Command payload.
	 */
	#postToPreview(action: string, payload: Object)
	{
		if (this.#previewWindow)
		{
			// targetOrigin '*': the preview is opaque-origin and commands carry no privileged data.
			this.#previewWindow.postMessage({ action, payload }, '*');
		}
	}

	/**
	 * Pushes the current touch and scroll state to the preview (e.g. after it reports ready).
	 */
	#sendPreviewState()
	{
		this.#postToPreview(Device.#ACTION_SET_TOUCH, { touch: true });
		this.#adjustPreviewScroll();
	}

	/**
	 * Resolves and returns Device by its code.
	 *
	 * @param {string} deviceType Device type.
	 * @return {DeviceItem}
	 */
	#resolveDeviceByType(deviceType: string): DeviceItem
	{
		let deviceCode = localStorage.getItem('deviceCode');
		if (deviceCode && Devices.devices[deviceCode])
		{
			return Devices.devices[deviceCode];
		}

		deviceCode = Devices.defaultDevice?.[deviceType];
		if (!deviceCode)
		{
			return;
		}

		return Devices.devices[deviceCode];
	}

	#getPreviewNode(): HTMLDivElement
	{
		if (!this.#previewLoader)
		{
			Loc.loadMessages(this.#options.messages);

			this.#previewLoader = Tag.render`
				<div class="landing-device-loader">
					<div class="landing-device-loader-icon"></div>
					<div class="landing-device-loader-text">${Loc.getMessage('LANDING_TPL_PREVIEW_LOADING')}</div>
				</div>
			`;
		}

		return this.#previewLoader;
	}

	#setPreview(target: HTMLElement)
	{
		if (!target)
		{
			return;
		}

		Dom.append(this.#getPreviewNode(), target)
	}

	#removePreview()
	{
		Dom.addClass(this.#getPreviewNode(), '--hide');
		Event.bind(this.#getPreviewNode(), 'transitionend', () => {
			Dom.remove(this.#getPreviewNode());
		});
	}

	/**
	 * Sets new device.
	 *
	 * @param {DeviceItem|null} newDevice Device.
	 */
	#setDevice(newDevice: ?DeviceItem)
	{
		if (!newDevice)
		{
			return;
		}

		localStorage.setItem('deviceCode', newDevice.code);

		// remove old class within preview
		if (this.#currentDevice)
		{
			Dom.removeClass(this.#previewElement, this.#currentDevice.className);
			this.#previewElement.style.removeProperty('top');
		}

		this.#currentDevice = newDevice;
		this.#previewElement.querySelector('[data-role="device-name"]').innerHTML = newDevice.name;
		this.#previewElement.querySelector('[data-role="device-orientation"]').innerHTML = localStorage.getItem('deviceOrientation');
		const frame = this.#previewElement.querySelector('[data-role="landing-device-preview-iframe"]');
		const frameWrapper = this.#previewElement.querySelector('[data-role="landing-device-preview"]');

		frame.onload = () => this.#removePreview();

		// scale for device
		if (frame
			&& frameWrapper
			&& this.#currentDevice.width
			&& this.#currentDevice.height)
		{
			const maxDeviceHeight = this.#maxDeviceHeight(this.#currentDevice.type);
			const scale = window.innerHeight / (maxDeviceHeight + 300);
			const padding = parseInt(window.getComputedStyle(frameWrapper).padding);

			let param1 = this.#currentDevice.width;
			let param2 = this.#currentDevice.height;

			if (localStorage.getItem('deviceOrientation') === 'landscape')
			{
				param1 = this.#currentDevice.height;
				param2 = this.#currentDevice.width;
			}

			frame.style.setProperty('width', `${param1}px`);
			frame.style.setProperty('height', `${param2}px`);
			frameWrapper.style.setProperty('transform', `scale(${scale})`);
			this.#previewElement.style.setProperty('width', `${(param1 + (padding * 2)) * scale}px`);
			this.#previewElement.style.setProperty('height', `${(param2 + (padding * 2)) * scale}px`);
		}

		Dom.addClass(this.#previewElement, this.#currentDevice.className);
	}

	#maxDeviceHeight(type: 'mobile' | 'tablet'): number
	{
		let maxHeight = 0;
		Object.values(Devices.devices).forEach((device) => {
			if (device.type === type && device.height)
			{
				maxHeight = Math.max(maxHeight, device.height);
			}
		});

		return maxHeight;
	}

	/**
	 * Gets top scroll of editor window and adjusts device preview window.
	 */
	#adjustPreviewScroll()
	{
		const editorFrame = this.#editorFrameWrapper?.querySelector('iframe');
		const metrics = this.#getDocumentMetrics(editorFrame?.contentWindow?.document);
		if (!metrics || metrics.scrollHeight <= 0)
		{
			return;
		}

		this.#scrollDevice(metrics.scrollTop / metrics.scrollHeight * 100);
	}

	/**
	 * Creates Preview Popup.
	 *
	 * @param {Options} options Preview options.
	 */
	#buildPreview(options: Options)
	{
		if (!this.#previewElement)
		{
			this.#previewElement = DeviceUI.getPreview({
				frameUrl: options.frameUrl,
				clickHandler: this.#onClickDeviceSelector.bind(this),
				messages: options.messages,
			});
			Dom.hide(this.#previewElement);
			this.target.appendChild(this.#previewElement);

			const editorFrame = this.#editorFrameWrapper?.querySelector('iframe');
			if (editorFrame)
			{
				Event.bind(editorFrame, 'load', () => {
					this.#adjustPreviewScroll();
				});
			}

			const previewFrame = this.#previewElement.querySelector('iframe');
			if (previewFrame)
			{
				this.#previewFrame = previewFrame;
				Event.bind(previewFrame, 'load', () => {
					this.#previewWindow = previewFrame.contentWindow;
					// Under sandbox the preview document is opaque-origin: drive touch and scroll
					// through PROTO-01 instead of reading contentWindow.document directly.
					this.#sendPreviewState();
				});

				if (!this.#previewWindow)
				{
					this.#previewWindow = previewFrame.contentWindow;
				}
			}

			this.#adjustPreviewScroll();
		}
	}

	/**
	 * Invokes by clicking on device selector.
	 */
	#onClickDeviceSelector()
	{
		DeviceUI.openDeviceMenu(
			this.#previewElement.querySelector('[data-role="device-name"]'),
			Object.values(Devices.devices),
			this.#setDevice.bind(this),
		);
	}

	/**
	 * Creates and Shows Preview Popup.
	 */
	#showPreview()
	{
		Dom.show(this.#previewElement);
		this.#setPreview(this.#previewElement);
	}

	/**
	 * Hides Preview Popup.
	 */
	#hidePreview()
	{
		Dom.hide(this.#previewElement);
	}
}
