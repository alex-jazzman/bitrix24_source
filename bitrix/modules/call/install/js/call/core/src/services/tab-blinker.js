import { CALL_PHONE_SVG } from '../icons.js';

export class TabBlinker
{
	#intervalId = null;
	#originalTitle = null;
	#originalFavicons = null;
	#callFaviconLink = null;
	#onFocus = () => this.stop();

	start(blinkText, intervalMs = 1000)
	{
		if (this.#intervalId !== null)
		{
			return;
		}

		this.#originalTitle = document.title;
		this.#setCallFavicon();

		let toggle = false;
		this.#intervalId = setInterval(() => {
			document.title = toggle ? this.#originalTitle : blinkText;
			toggle = !toggle;
		}, intervalMs);

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		window.addEventListener('focus', this.#onFocus, { once: true });
	}

	stop()
	{
		if (this.#intervalId !== null)
		{
			clearInterval(this.#intervalId);
			this.#intervalId = null;
		}

		if (this.#originalTitle !== null)
		{
			document.title = this.#originalTitle;
			this.#originalTitle = null;
		}

		this.#restoreFavicon();
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		window.removeEventListener('focus', this.#onFocus);
	}

	#setCallFavicon()
	{
		this.#originalFavicons = [...document.querySelectorAll("link[rel~='icon']")];
		this.#originalFavicons.forEach((link) => link.remove());

		this.#callFaviconLink = document.createElement('link');
		this.#callFaviconLink.rel = 'icon';
		this.#callFaviconLink.href = CALL_PHONE_SVG;
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
		document.head.appendChild(this.#callFaviconLink);
	}

	#restoreFavicon()
	{
		if (this.#callFaviconLink === null)
		{
			return;
		}

		this.#callFaviconLink.remove();
		this.#callFaviconLink = null;
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
		this.#originalFavicons?.forEach((link) => document.head.appendChild(link));
		this.#originalFavicons = null;
	}
}
