import { Reflection, Dom, Event, Type, Browser } from 'main.core';
import { Slider as BaseSlider, SidePanel, type OuterBoundary, type SliderOptions } from 'main.sidepanel';

import { type ThemePicker } from 'intranet.theme-picker';

import { ChatMenuBar } from './chat-menu-bar';

const MENU_COLLAPSED_WIDTH = 65;
const MENU_EXPANDED_WIDTH = 240;

export class Slider extends BaseSlider
{
	#onWindowResize: Function = null;
	#chatMenuBar: ChatMenuBar = null;
	static #verticalScrollWidth: number = null;

	constructor(url: string, sliderOptions: SliderOptions)
	{
		const options: SliderOptions = Type.isPlainObject(sliderOptions) ? { ...sliderOptions } : {};
		const isMessenger = url.startsWith('im:slider');

		if (isMessenger)
		{
			options.hideControls = false;
			options.autoOffset = false;
			options.customRightBoundary = null;
		}

		options.customRightBoundary = null;

		super(url, options);

		this.#chatMenuBar = isMessenger ? new ChatMenuBar(this) : null;
		this.#onWindowResize = this.#handleWindowResize.bind(this);
	}

	applyHacks(): void
	{
		Slider.#verticalScrollWidth = window.innerWidth - document.documentElement.clientWidth;

		this.adjustBackgroundSize();
		Event.bind(window, 'resize', this.#onWindowResize);

		return true;
	}

	resetHacks(): void
	{
		this.resetBackgroundSize();
		Event.unbind(window, 'resize', this.#onWindowResize);
	}

	static isMessengerOpen(): boolean
	{
		const MessengerSlider = Reflection.getClass('BX.Messenger.v2.Lib.MessengerSlider');
		if (MessengerSlider && MessengerSlider.getInstance().isOpened())
		{
			return true;
		}

		return Slider.isMessengerEmbedded();
	}

	static isMessengerEmbedded(): boolean
	{
		const LayoutManager = Reflection.getClass('BX.Messenger.v2.Lib.LayoutManager');

		return LayoutManager && LayoutManager.getInstance().isEmbeddedMode();
	}

	static isMessengerOpenBeforeSlider(slider: Slider): boolean
	{
		if (Slider.isMessengerEmbedded())
		{
			return true;
		}

		const sliders = SidePanel.Instance.getOpenSliders();
		for (const openSlider of sliders)
		{
			if (openSlider === slider)
			{
				return false;
			}

			if (openSlider?.isMessengerSlider())
			{
				return true;
			}
		}

		return false;
	}

	isMessengerSlider(): boolean
	{
		return this.#chatMenuBar !== null;
	}

	static isVideoCallOpen(): boolean
	{
		const CallManager = Reflection.getClass('BX.Messenger.v2.Lib.CallManager');

		return CallManager && CallManager.getInstance().hasCurrentCall();
	}

	getRightBar(): HTMLElement | null
	{
		return document.getElementById('right-bar');
	}

	getRightPanel(): HTMLElement | null
	{
		return document.getElementById('app__right-panel');
	}

	isRightPanelOpen(): boolean
	{
		return this.getRightPanel()?.offsetWidth > 0;
	}

	getLeftBoundary(): number
	{
		const windowWidth = Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;
		if (windowWidth < 1260)
		{
			return this.getMinLeftBoundary();
		}

		const LeftMenu = Reflection.getClass('BX.Intranet.LeftMenu');

		return (
			LeftMenu?.isCollapsed() || this.isMessengerSlider()
				? MENU_COLLAPSED_WIDTH
				: MENU_EXPANDED_WIDTH
		);
	}

	getRightBoundary(): number
	{
		const viewer = Reflection.getClass('BX.UI.Viewer.Instance');
		if (viewer && viewer.isOpen())
		{
			return 0;
		}

		if (
			!this.isRightPanelOpen()
			&& (this.isMessengerSlider() || Slider.isMessengerOpenBeforeSlider(this) || Slider.isVideoCallOpen())
		)
		{
			return 0;
		}

		const rightPanel = this.getRightPanel() || this.getRightBar();
		if (rightPanel === null)
		{
			return 0;
		}

		const leftOffset = rightPanel.getBoundingClientRect().left;
		if (leftOffset === 0)
		{
			return 0;
		}

		// const rightMargin = Slider.#verticalScrollWidth + rightBarWidth;

		const windowWidth = Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;

		return windowWidth - leftOffset;
	}

	getTopBoundary(): number
	{
		return 0;
	}

	calculateOuterBoundary(): OuterBoundary
	{
		if (this.isMessengerSlider() || Slider.isMessengerOpenBeforeSlider(this) || Slider.isVideoCallOpen())
		{
			return {
				top: this.isMessengerSlider() ? 58 : 16,
				right: 18,
			};
		}

		const rightMargin = Slider.#verticalScrollWidth > 0 ? 0 : 18;

		return {
			top: 16,
			right: this.isRightPanelOpen() ? 18 : (this.getRightBar()?.offsetWidth > 0 ? 0 : rightMargin),
		};
	}

	adjustBackgroundSize(): void
	{
		const themePicker: ThemePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
		if (!themePicker)
		{
			return;
		}

		const theme = themePicker.getAppliedTheme();
		if (theme && theme.resizable === true)
		{
			if (theme.video)
			{
				this.adjustVideoSize();
			}
			else if (theme.width > 0 && theme.height > 0)
			{
				this.adjustImageSize(theme.width, theme.height);
			}
		}
	}

	adjustImageSize(imgWidth: number, imgHeight: number): void
	{
		const containerWidth = document.documentElement.clientWidth;
		const containerHeight = document.documentElement.clientHeight;

		const imgRatio = imgHeight / imgWidth;
		const containerRatio = containerHeight / containerWidth;
		const width = containerRatio > imgRatio ? containerHeight / imgRatio : containerWidth;
		const height = containerRatio > imgRatio ? containerHeight : containerWidth * imgRatio;

		Dom.style(document.body, '--air-theme-bg-size', `${width}px ${height}px`);
	}

	adjustVideoSize(): void
	{
		const themePicker: ThemePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
		if (!themePicker)
		{
			return;
		}

		const videoContainer: HTMLElement = themePicker.getVideoContainer();
		if (videoContainer)
		{
			Dom.style(videoContainer, 'right', `${window.innerWidth - document.documentElement.clientWidth}px`);
		}
	}

	resetBackgroundSize(): void
	{
		Dom.style(document.body, '--air-theme-bg-size', null);

		const themePicker: ThemePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
		if (themePicker)
		{
			const videoContainer: HTMLElement = themePicker.getVideoContainer();
			if (videoContainer)
			{
				Dom.style(videoContainer, 'right', null);
			}
		}
	}

	#handleWindowResize(): void
	{
		this.adjustBackgroundSize();
	}
}
