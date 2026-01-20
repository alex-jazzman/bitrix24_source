/**
 * @module im/messenger/lib/helper/url
 */
jn.define('im/messenger/lib/helper/url', (require, exports, module) => {
	const { Type } = require('type');
	const { URL } = require('utils/url');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { SmileManager } = require('im/messenger/lib/smile-manager');
	const logger = getLoggerWithContext('url-helper', 'Url');

	/**
	 * @class Url
	 */
	class Url
	{
		#value;

		/**
		 * @param {string} path
		 * @return {Url}
		 */
		static createFromPath(path)
		{
			return new this(`${currentDomain}${path}`);
		}

		/**
		 * @param {string} value
		 */
		constructor(value)
		{
			/** @type string */
			this.#value = Type.isString(value) ? value : '';
		}

		/**
		 * @return {string}
		 */
		get href()
		{
			return this.#value;
		}

		/**
		 * @return {boolean}
		 */
		get isLocal()
		{
			const startingPoints = [
				'bitrix24://',
				'/',
				currentDomain,
			];

			return startingPoints.some((item) => this.#value.startsWith(item));
		}

		/**
		 * @return {object}
		 */
		get queryParams()
		{
			const cutHash = (url) => url.split('#')[0];
			const queryString = cutHash(this.#value).split('?')[1];

			if (queryString)
			{
				return queryString.split('&').reduce(
					(params, param) => {
						const [key, value] = param.split('=');
						let decodedValue = '';
						if (value)
						{
							const replaced = value.replaceAll('+', ' ');
							try
							{
								decodedValue = decodeURIComponent(replaced);
							}
							catch
							{
								decodedValue = value;
							}
						}
						// eslint-disable-next-line no-param-reassign
						params[key] = decodedValue;

						return params;
					},
					{},
				);
			}

			return {};
		}

		/**
		 * @return {boolean}
		 */
		get isEncoded()
		{
			if (!Type.isString(this.href))
			{
				return false;
			}

			if (!/%[\da-f]{2}/i.test(this.href))
			{
				return false;
			}

			try
			{
				decodeURIComponent(this.href);

				return true;
			}
			catch
			{
				return false;
			}
		}

		/**
		 * @return {Set<string>}
		 */
		getSmilesUrl()
		{
			return SmileManager.getInstance().getSmilesUrl();
		}

		/**
		 * @return {Promise<boolean>}
		 */
		async isSmileUrlAsync()
		{
			if (!Type.isStringFilled(this.href))
			{
				return false;
			}

			await SmileManager.getInstance().ready();
			const smileUrlCollection = this.getSmilesUrl();

			let normalizedUrl = this.href.trim();
			try
			{
				const parsed = new URL(normalizedUrl);
				normalizedUrl = parsed?.pathname ?? '';
			}
			catch (error)
			{
				logger.error('isSmileUrlAsync URL parsed catch:', error);
				normalizedUrl = normalizedUrl.split('?')?.[0]?.split('#')?.[0];
			}

			if (smileUrlCollection.has(normalizedUrl))
			{
				return true;
			}

			if (!normalizedUrl.includes('/smiles/'))
			{
				return false;
			}

			return [...smileUrlCollection].some(
				(smilePath) => normalizedUrl.endsWith(smilePath) || smilePath.endsWith(normalizedUrl),
			);
		}
	}

	module.exports = {
		Url,
	};
});
