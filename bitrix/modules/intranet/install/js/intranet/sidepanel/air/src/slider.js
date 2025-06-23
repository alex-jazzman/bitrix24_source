import { Reflection, Dom, Event, Type } from 'main.core';
import { Slider as BaseSlider, type OuterBoundary, type SliderOptions } from 'main.sidepanel';
import { ChatMenuBar } from './chat-menu-bar';

const MENU_COLLAPSED_WIDTH = 65;
const MENU_EXPANDED_WIDTH = 240;
const RIGHT_MARGIN = 18;

export class Slider extends BaseSlider
{
	#onWindowResize: Function = null;
	#chatMenuBar: ChatMenuBar = null;

	constructor(url: string, sliderOptions: SliderOptions)
	{
		const options: SliderOptions = Type.isPlainObject(sliderOptions) ? { ...sliderOptions } : {};
		const isMessenger = url.startsWith('im:slider');

		if (isMessenger)
		{
			options.hideControls = false;
			options.autoOffset = false;
		}

		if (Type.isNumber(options.customLeftBoundary) && options.customLeftBoundary < MENU_COLLAPSED_WIDTH)
		{
			options.customLeftBoundary = MENU_COLLAPSED_WIDTH + RIGHT_MARGIN;
		}

		super(url, options);

		this.#chatMenuBar = isMessenger ? new ChatMenuBar(this) : null;
		this.#onWindowResize = this.#handleWindowResize.bind(this);
	}

	applyHacks(): void
	{
		this.adjustBackgroundSize();
		Event.bind(window, 'resize', this.#onWindowResize);

		return true;
	}

	resetHacks(): void
	{
		this.resetBackgroundSize();
		Event.unbind(window, 'resize', this.#onWindowResize);
	}

	getLeftBoundary(): number
	{
		const LeftMenu = Reflection.getClass('BX.Intranet.LeftMenu');
		const leftMenu = (
			LeftMenu?.isCollapsed() || this.#chatMenuBar !== null
				? MENU_COLLAPSED_WIDTH
				: MENU_EXPANDED_WIDTH
		);

		return leftMenu + RIGHT_MARGIN;

		// const windowWidth = Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;
		//
		// return windowWidth < 1160 ? 0 : 240; // Left Menu Width
	}

	getRightBoundary(): number
	{
		return 0;
	}

	getTopBoundary(): number
	{
		return 0;
	}

	calculateOuterBoundary(): OuterBoundary
	{
		if (this.#chatMenuBar !== null)
		{
			return {
				top: 58,
				right: 18,
			};
		}

		return {
			top: 18,
			right: 18,
		};
	}

	adjustBackgroundSize(): void
	{
		const themePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
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

		Dom.style(document.body, 'background-size', `${width}px ${height}px`);
	}

	adjustVideoSize(): void
	{
		const themePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
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
		Dom.style(document.body, 'background-size', null);

		const themePicker = Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
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
