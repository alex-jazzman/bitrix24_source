/**
 * @module im/messenger/lib/helper/url
 */
jn.define('im/messenger/lib/helper/url', (require, exports, module) => {
	/**
	 * @class Url
	 */
	class Url
	{
		/**
		 * @param {string} value
		 */
		constructor(value)
		{
			/** @type string */
			this.value = value;
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

			return startingPoints.some((item) => this.value.startsWith(item));
		}

		/**
		 * @return {object}
		 */
		get queryParams()
		{
			const cutHash = (url) => url.split('#')[0];
			const queryString = cutHash(this.value).split('?')[1];

			if (queryString)
			{
				return queryString.split('&').reduce(
					(params, param) => {
						const [key, value] = param.split('=');
						// eslint-disable-next-line no-param-reassign
						params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';

						return params;
					},
					{},
				);
			}

			return {};
		}
	}

	module.exports = {
		Url,
	};
});
