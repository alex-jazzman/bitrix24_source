import Type from './type';

import { type PageRedirectOptions } from '../lib/types/page';

export class Page
{
	static getRootWindow(): Window
	{
		return this.getTopWindowOfCurrentHost(window);
	}

	static isCrossOriginObject(currentWindow): boolean
	{
		try
		{
			void currentWindow.location.host;
		}
		catch
		{
			// cross-origin object
			return true;
		}

		return false;
	}

	static getTopWindowOfCurrentHost(currentWindow): Window
	{
		if (
			!this.isCrossOriginObject(currentWindow.parent)
			&& currentWindow.parent !== currentWindow
			&& currentWindow.parent.location.host === currentWindow.location.host
		)
		{
			return this.getTopWindowOfCurrentHost(currentWindow.parent);
		}

		return currentWindow;
	}

	static getParentWindowOfCurrentHost(currentWindow): Window
	{
		if (this.isCrossOriginObject(currentWindow.parent))
		{
			return currentWindow;
		}

		return currentWindow.parent;
	}

	static redirect(redirectUrl: string, redirectOptions: PageRedirectOptions = {}): void
	{
		if (!Type.isStringFilled(redirectUrl))
		{
			throw new Error('Redirect: "url" must be a non-empty string.');
		}

		const rootWindow = this.getRootWindow();
		let url: URL = null;
		try
		{
			url = new URL(redirectUrl, rootWindow.location.origin);
		}
		catch
		{
			throw new Error(`Redirect: invalid URL: ${redirectUrl}`);
		}

		const options = Type.isPlainObject(redirectOptions) ? redirectOptions : {};
		if (!this.#isSafeUrl(url, options.allowedOrigins))
		{
			console.error(`Redirect: blocked potentially unsafe URL: ${url}`);

			return;
		}

		const wholeUrl = url.toString();
		if (options.newTab === true)
		{
			const win = rootWindow.open(wholeUrl, '_blank', 'noopener,noreferrer');
			if (win)
			{
				win.opener = null;
			}

			return;
		}

		if (options.replaceHistory === true)
		{
			rootWindow.location.replace(wholeUrl);
		}
		else
		{
			rootWindow.location.assign(wholeUrl);
		}
	}

	static reload(): void
	{
		const rootWindow = this.getRootWindow();
		rootWindow.location.reload();
	}

	static #isSafeUrl(url: URL, allowedOrigins = []): boolean
	{
		if (!(url instanceof URL))
		{
			return false;
		}

		const allowedProtocols = ['http:', 'https:'];
		if (!allowedProtocols.includes(url.protocol))
		{
			return false;
		}

		const rootWindow = this.getRootWindow();
		if (url.origin === rootWindow.location.origin)
		{
			return true;
		}

		if (Type.isArray(allowedOrigins) && allowedOrigins.length > 0)
		{
			return allowedOrigins.includes(url.origin);
		}

		return false;
	}
}
