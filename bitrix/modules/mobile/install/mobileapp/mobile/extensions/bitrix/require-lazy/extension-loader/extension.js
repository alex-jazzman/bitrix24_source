/**
 * @module require-lazy/extension-loader
 */
jn.define('require-lazy/extension-loader', (require, exports, module) => {
	const { isEmpty } = require('utils/object');
	const { isESClass } = require('utils/type');
	const { requireLazy } = require('require-lazy');

	/**
	 * Lazy loading and initialization of JaNative extensions via requireLazy
	 * @typedef {Object} LoadExtensionsParams
	 * @property {String[]} extensions
	 * @property {*} [context]
	 * @property {String} [logPrefix='extension-loader']
	 */
	class ExtensionLoader
	{
		constructor(logPrefix = 'extension-loader')
		{
			this.logPrefix = logPrefix;
		}

		/**
		 * @param {String[]} extensions
		 * @throws {Error}
		 */
		validateExtensions(extensions)
		{
			if (!Array.isArray(extensions))
			{
				throw new TypeError('extensions must be an array');
			}

			if (isEmpty(extensions))
			{
				throw new Error('no extensions to load');
			}
		}

		/**
		 * @param {String} message
		 * @param {Object} [context]
		 */
		logError(message, context = {})
		{
			// eslint-disable-next-line no-console
			console.error(`${this.logPrefix}: ${message}`, context);
		}

		/**
		 * Logs info message
		 * @param {String} message
		 */
		logInfo(message)
		{
			// eslint-disable-next-line no-console
			console.info(`${this.logPrefix}: ${message}`);
		}

		/**
		 * @param {Function} extensionModule
		 * @param {object} context
		 * @returns {object|null}
		 */
		initializeModule(extensionModule, context)
		{
			try
			{
				if (isESClass(extensionModule))
				{
					// eslint-disable-next-line new-cap
					return new extensionModule(context);
				}

				if (typeof extensionModule === 'function')
				{
					return extensionModule(context);
				}

				this.logError('unable to load extension:', extensionModule);

				return null;
			}
			catch (err)
			{
				this.logError('error while initializing extension', { error: err, extension: extensionModule });

				return null;
			}
		}

		/**
		 * @param {PromiseSettledResult} result
		 * @param {Any} context
		 * @returns {Any|null}
		 */
		processLoadResult(result, context)
		{
			if (result.status === 'rejected')
			{
				this.logError('extension loading rejected', { reason: result.reason });

				return null;
			}

			return this.initializeModule(result.value, context);
		}

		/**
		 * @param {LoadExtensionsParams} params
		 * @returns {Promise<any[]>}
		 */
		async load({ extensions, context })
		{
			try
			{
				this.validateExtensions(extensions);

				const extensionPromises = extensions.map((ext) => requireLazy(ext));
				const requireResults = await Promise.allSettled(extensionPromises);

				return requireResults
					.map((result) => this.processLoadResult(result, context))
					.filter(Boolean);
			}
			catch (error)
			{
				this.logInfo(error.message);

				return Promise.reject(error);
			}
		}
	}

	/**
	 * @param {LoadExtensionsParams} params
	 * @returns {Promise<any[]>}
	 */
	async function loadExtensions({ extensions, context, logPrefix = 'extension-loader' })
	{
		const loader = new ExtensionLoader(logPrefix);

		return loader.load({ extensions, context });
	}

	module.exports = {
		loadExtensions,
	};
});
