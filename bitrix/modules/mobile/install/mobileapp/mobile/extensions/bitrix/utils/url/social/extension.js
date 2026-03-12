/**
 * @module utils/url/social
 */
jn.define('utils/url/social', (require, exports, module) => {
	const { URL, isValidLink } = require('utils/url');
	const { SocialPlatform } = require('utils/url/social/src/const');

	const SUPPORTED_PLATFORMS = Object.freeze([
		SocialPlatform.X,
		SocialPlatform.FACEBOOK,
		SocialPlatform.LINKEDIN,
		SocialPlatform.ZOOM,
		SocialPlatform.MICROSOFT_TEAMS,
		SocialPlatform.XING,
	]);

	/**
	 * Validates and normalizes social profile links for various platforms
	 *
	 * @param {SocialPlatform} platform - Platform name
	 * @param {string} input - User input (full URL, partial URL, @username, /username, or plain username)
	 * @return {string|null} - Normalized URL or null if invalid
	 */
	function normalizeSocialLink(platform, input)
	{
		if (!platform || !input)
		{
			return null;
		}

		if (!isSupportedPlatform(platform))
		{
			return null;
		}

		const value = input.trim();
		const normalizedUrl = (
			/^https?:\/\//i.test(value)
				? normalizeFullUrl(platform, value)
				: normalizePartialUrl(platform, value)
		);

		return isValidLink(normalizedUrl) ? normalizedUrl : null;
	}

	function isSupportedPlatform(platform)
	{
		if (!platform)
		{
			return false;
		}

		return SUPPORTED_PLATFORMS.includes(platform);
	}

	/**
	 * Validates and cleans URL if domain matches the platform
	 *
	 * @param {SocialPlatform} platform
	 * @param {string} value
	 * @return {string|null}
	 */
	function normalizeFullUrl(platform, value)
	{
		try
		{
			const url = new URL(value);
			const hostname = url.hostname.replace(/^www\./, '');

			switch (platform)
			{
				case SocialPlatform.X:
					if (hostname === 'x.com' || hostname === 'twitter.com')
					{
						return cleanUrl(url);
					}
					break;

				case SocialPlatform.FACEBOOK:
					if (hostname === 'facebook.com')
					{
						return cleanUrl(url);
					}
					break;

				case SocialPlatform.LINKEDIN:
					if (hostname === 'linkedin.com')
					{
						return cleanUrl(url);
					}
					break;

				case SocialPlatform.ZOOM:
					if (hostname === 'zoom.us')
					{
						return cleanUrl(url);
					}
					break;

				case SocialPlatform.MICROSOFT_TEAMS:
					if (hostname === 'teams.microsoft.com')
					{
						return cleanUrl(url, true);
					}
					break;

				case SocialPlatform.XING:
					if (hostname === 'xing.com')
					{
						return cleanUrl(url);
					}
					break;

				default:
					break;
			}

			return null;
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Normalizes partial URL or username for the platform
	 *
	 * @param {SocialPlatform} platform
	 * @param {string} value
	 * @return {string|null}
	 */
	// eslint-disable-next-line sonarjs/cognitive-complexity
	function normalizePartialUrl(platform, value)
	{
		const cleanedValue = (
			value
				.replace(/^@+/, '')
				.replace(/^\/+/, '')
				.replace(/\/+$/, '')
		);
		const isUsername = /^\w+(?:[.-]\w+)*$/.test(cleanedValue);

		switch (platform)
		{
			case SocialPlatform.X:
			{
				if (/^(x\.com|twitter\.com)\//i.test(cleanedValue))
				{
					return `https://${cleanedValue.replace(/^https?:\/\//i, '')}`;
				}

				if (isUsername)
				{
					return `https://x.com/${cleanedValue}`;
				}

				return null;
			}

			case SocialPlatform.FACEBOOK:
			{
				if (/^facebook\.com\//i.test(cleanedValue))
				{
					return `https://${cleanedValue.replace(/^https?:\/\//i, '')}`;
				}

				if (isUsername)
				{
					return `https://facebook.com/${cleanedValue}`;
				}

				return null;
			}

			case SocialPlatform.LINKEDIN:
			{
				if (/^linkedin\.com\//i.test(cleanedValue))
				{
					return `https://${cleanedValue.replace(/^https?:\/\//i, '')}`;
				}

				if (isUsername)
				{
					return `https://linkedin.com/in/${cleanedValue}`;
				}

				return null;
			}

			case SocialPlatform.ZOOM:
			{
				if (/^zoom\.us\//i.test(cleanedValue))
				{
					return `https://${cleanedValue.replace(/^https?:\/\//i, '')}`;
				}

				if (isUsername)
				{
					return `https://zoom.us/my/${cleanedValue}`;
				}

				return null;
			}

			case SocialPlatform.MICROSOFT_TEAMS:
			{
				const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedValue);
				if (isEmail)
				{
					return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(cleanedValue)}`;
				}

				return null;
			}

			case SocialPlatform.XING:
			{
				if (/^xing\.com\//i.test(cleanedValue))
				{
					return `https://${cleanedValue.replace(/^https?:\/\//i, '')}`;
				}

				if (isUsername)
				{
					return `https://xing.com/profile/${cleanedValue}`;
				}

				return null;
			}

			default:
				return null;
		}
	}

	/**
	 * Cleans URL by removing query parameters, hash, and trailing slash
	 *
	 * @param {URL} url
	 * @param {boolean} keepQuery - Keep query parameters (for Microsoft Teams)
	 * @return {string}
	 */
	function cleanUrl(url, keepQuery = false)
	{
		const host = url.host.replace(/^www\./, '');
		const search = keepQuery ? url.search : '';

		let cleanedUrlString = `${url.protocol}//${host}${url.pathname}${search}`;
		if (cleanedUrlString.endsWith('/'))
		{
			cleanedUrlString = cleanedUrlString.slice(0, -1);
		}

		return cleanedUrlString;
	}

	module.exports = {
		normalizeSocialLink,
		isSupportedPlatform,
		SocialPlatform,
	};
});
