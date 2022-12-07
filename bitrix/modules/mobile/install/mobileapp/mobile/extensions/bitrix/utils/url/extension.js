/**
 * @module utils/url
 */
jn.define('utils/url', (require, exports, module) => {

	const { punycode } = require('utils/url/punycode');
	const { stringify } = require('utils/string');

	/**
	 * @function URL
	 * @param {String} value
	 * @return {Object}
	 */
	function URL(value)
	{
		const url = prepareLink(value).match(/^((\w+:)?\/\/([^\/]+))+([^?#]+)*$/i);

		if (!Array.isArray(url))
		{
			return {};
		}

		const pathname = url[4] || '';
		const hostname = punycode.toASCII(url[3]);
		const protocol = url[2];

		return {
			originHref: url[0],
			href: `${protocol}//${hostname}${pathname}`,
			origin: url[1],
			protocol,
			hostname,
			pathname,
		};
	}

	/**
	 * @function prepareLink
	 * @param {String} link
	 * @return {String}
	 */
	function prepareLink(link)
	{
		const url = stringify(link.trim());

		//Checks for if url doesn't match either of: http://example.com, https://example.com AND //example.com
		if (Boolean(url) && !/^(https?:)?\/\//i.test(url))
		{
			return `http://${url}`;
		}

		return link;
	}

	/**
	 * @function getHttpPath
	 * @param {String} url
	 * @return {String}
	 */
	function getHttpPath(url)
	{
		return URL(url).href || '';
	}

	/**
	 * @function isValidLink
	 * @param {String} url
	 * @return {Boolean}
	 */
	function isValidLink(url)
	{
		return Application.canOpenUrl(getHttpPath(url));
	}

	/**
	 * @function isValidEmail
	 * @return {Boolean}
	 */
	function isValidEmail(email)
	{
		if (typeof email !== 'string')
		{
			return false;
		}
		const regExp = /^[^@]+@[^@]+\.[^@]+$/;

		return regExp.test(email);
	}

	module.exports = {
		URL,
		prepareLink,
		isValidLink,
		isValidEmail,
		getHttpPath,
	};

});