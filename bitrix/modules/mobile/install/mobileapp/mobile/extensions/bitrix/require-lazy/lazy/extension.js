/**
 * @module require-lazy/lazy
 */
jn.define('require-lazy/lazy', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');

	const getExtensionWithoutNamespace = (extensionNameWithColon) => extensionNameWithColon.replace(':', '/');

	/**
	 * Be careful! Prefix extension modules with a colon instead of a slash. (e.g. use crm:type, not crm/type)
	 *
	 * @function requireLazy
	 * @param {string} extensionNameWithColon
	 * @param {boolean} [showLoader]
	 * @returns {Promise}
	 */
	async function requireLazy(extensionNameWithColon, showLoader = true)
	{
		const extensionWithoutNamespace = getExtensionWithoutNamespace(extensionNameWithColon);
		if (jn.define.moduleMap[extensionWithoutNamespace])
		{
			return Promise.resolve(require(extensionWithoutNamespace));
		}

		return new Promise((resolve, reject) => {
			if (showLoader)
			{
				NotifyManager.showLoadingIndicator(true, {
					onTap: () => {
						reject(new Error('Request aborted'));
					},
				});
			}

			jn.import(extensionNameWithColon)
				.then(() => {
					resolve(require(extensionWithoutNamespace));
				})
				.catch((error) => {
					console.error(`${extensionNameWithColon}, extension not found`, error);

					reject(error);
				});
		}).catch((error) => {
			if (error.message === 'Request aborted')
			{
				console.log('Request aborted');
			}
		}).finally(() => {
			if (showLoader)
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		});
	}

	module.exports = {
		requireLazy,
	};
});
