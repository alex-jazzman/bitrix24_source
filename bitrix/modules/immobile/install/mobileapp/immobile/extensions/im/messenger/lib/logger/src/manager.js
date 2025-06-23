/**
 * @module im/messenger/lib/logger/manager
 */
jn.define('im/messenger/lib/logger/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { Logger, LogType } = require('utils/logger');

	/**
	 * @class LoggerManager
	 */
	class LoggerManager
	{
		#externalConsole;

		/**
		 * @return LoggerManager
		 */
		static getInstance()
		{
			if (!this.instance)
			{
				this.instance = new this();
			}

			return this.instance;
		}

		constructor()
		{
			this.loggerCollection = new Map();

			this.storageId = 'IMMOBILE_LOGGER_MANAGER_V2';
			this.storage = Application.storageById(this.storageId);
			this.config = this.getConfig();
			Object.entries(this.config).forEach(([loggerName, loggerConfig]) => {
				this.getLogger(loggerName);
			});
			this.#externalConsole = null;
		}

		getExternalConsole()
		{
			return this.#externalConsole;
		}

		setExternalConsole(console)
		{
			this.#externalConsole = console;
		}

		/**
		 * @param {string} name
		 * @param {object} options
		 * @return Logger
		 */
		getLogger(name, options = {})
		{
			let logger = this.loggerCollection.get(name);
			if (!logger)
			{
				logger = this.createLogger(name);
				this.loggerCollection.set(name, logger);
				this.saveConfig();
			}

			return logger;
		}

		/**
		 * @private
		 * @return {Logger}
		 */
		createLogger(name)
		{
			const logger = new Proxy(new Logger(), this.getLoggerProxy());
			if (Type.isArray(this.config[name]))
			{
				logger.enabledLogTypes = new Set(this.config[name]);
			}
			else
			{
				logger.enabledLogTypes = new Set([
					LogType.ERROR,
					LogType.TRACE,
				]);
			}

			return logger;
		}

		getLoggerProxy()
		{
			return {
				get: (target, property) => {
					const logger = target;
					const methodName = property;
					const method = logger[methodName];

					if (this.checkShouldSaveConfig(method, methodName))
					{
						return this.getCallMethodAndSaveConfigHandler(logger, method);
					}

					if (this.checkShouldPrintToExternalConsole(method, methodName))
					{
						return this.getCallMethodAndPrintToExternalConsoleHandler(logger, method, methodName);
					}

					return method;
				},
			};
		}

		checkShouldSaveConfig(method, methodName)
		{
			const saveConfigMethodNameList = [
				'enable',
				'disable',
			];

			return Type.isFunction(method) && saveConfigMethodNameList.includes(methodName);
		}

		getCallMethodAndSaveConfigHandler(logger, method)
		{
			return (...args) => {
				const result = method.apply(logger, args);
				if (result === true)
				{
					this.saveConfig();
				}

				return result;
			};
		}

		checkShouldPrintToExternalConsole(method, methodName)
		{
			const printMethodNameList = [
				'log',
				'info',
				'warn',
				'error',
				'trace',
			];

			return Type.isFunction(method) && printMethodNameList.includes(methodName);
		}

		getCallMethodAndPrintToExternalConsoleHandler(logger, method, methodName)
		{
			return (...args) => {
				const result = method.apply(logger, args);
				// it works because the method name matches the logging level name
				if (logger.isEnabledLogType(methodName))
				{
					this.getExternalConsole()?.[methodName](args);
				}

				return result;
			};
		}

		saveConfig()
		{
			const config = {};
			this.loggerCollection.forEach((logger, name) => {
				config[name] = [...logger.enabledLogTypes];
			});

			this.storage.set('config', JSON.stringify(config));
		}

		getConfig()
		{
			const config = this.storage.get('config');
			if (config)
			{
				return JSON.parse(config);
			}

			return {};
		}
	}

	/**
	 * @param {string} name
	 * @param {object} options
	 * @return Logger
	 */
	const getLogger = (name, options = {}) => {
		return LoggerManager.getInstance().getLogger(name, options);
	};

	module.exports = {
		LoggerManager,
		getLogger,
	};
});
