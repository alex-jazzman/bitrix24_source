/**
 * @module require-lazy/lazy-batch
 */
jn.define('require-lazy/lazy-batch', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');

	const getExtensionWithoutNamespace = (extensionNameWithColon) => extensionNameWithColon.replace(':', '/');

	/**
	 * Be careful! Prefix extension modules with a colon instead of a slash. (e.g. use ['crm:type'], not ['crm/type'])
	 *
	 * @function requireLazyBatch
	 * @param {string[]} extensionsNamesWithColon
	 * @param {boolean} [showLoader]
	 * @returns {Promise<Map<string, any>>}
	 */
	async function requireLazyBatch(extensionsNamesWithColon, showLoader = true)
	{
		if (showLoader)
		{
			NotifyManager.showLoadingIndicator();
		}

		const loadedExtensions = new Map();
		const loadPromises = extensionsNamesWithColon.map((extensionNameWithColon) => {
			// todo: implement the ability to load several extensions with single request (jn.importBatch)
			return jn.import(extensionNameWithColon).then(() => {
				const extensionWithoutNamespace = getExtensionWithoutNamespace(extensionNameWithColon);
				const requireResult = require(extensionWithoutNamespace);
				loadedExtensions.set(extensionNameWithColon, requireResult);

				return requireResult;
			}).catch(() => {
				console.error(`${extensionNameWithColon}, extension not found`);
			});
		});

		await Promise.allSettled(loadPromises).then(() => {
			if (showLoader)
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		});

		return loadedExtensions;
	}

	module.exports = {
		requireLazyBatch,
	};
});
