(() => {
	const require = (ext) => jn.require(ext);
	const { NotifyManager } = require('notify-manager');

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
					const extensionWithoutNamespace = extensionNameWithColon.replace(':', '/');
					resolve(require(extensionWithoutNamespace));
				})
				.catch((error) => {
					console.error(`${extensionNameWithColon}, extension not found`, error);

					reject(error);
				});
		})
			.catch((error) => {
				if (error.message === 'Request aborted')
				{
					console.log('Request aborted');
				}
			})
			.finally(() => {
				if (showLoader)
				{
					NotifyManager.hideLoadingIndicatorWithoutFallback();
				}
			});
	}

	jnexport(requireLazy);

	/**
	 * Be careful! Prefix extension modules with a colon instead of a slash. (e.g. use ['crm:type'], not ['crm/type'])
	 *
	 * @function requireLazyBatch
	 * @param {string[]} extensionsNamesWithColon
	 * @param {boolean} [showLoader]
	 * @returns {Map}
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
				const extensionWithoutNamespace = extensionNameWithColon.replace(':', '/');

				const requireResult = require(extensionWithoutNamespace);
				loadedExtensions.set(extensionNameWithColon, requireResult);

				return requireResult;
			})
				.catch(() => {
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

	jnexport(requireLazyBatch);
})();
