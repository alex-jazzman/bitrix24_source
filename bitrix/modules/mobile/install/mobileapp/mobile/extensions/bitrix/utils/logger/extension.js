/**
 * @module utils/logger
 */
jn.define('utils/logger', (require, exports, module) => {
	const LogType = {
		LOG: 'log',
		INFO: 'info',
		WARN: 'warn',
		ERROR: 'error',
		TRACE: 'trace',
	};

	/**
	 * @class Logger
	 * @typedef {Object} LoggerOptions
	 * @property {Array<string>} [enabledLogTypes=[]]
	 * @property {boolean} [onlyForBeta=false]
	 */
	class Logger
	{
		static getSupportedLogTypes()
		{
			return Object.values(LogType);
		}

		static isSupportedLogType(type)
		{
			return Logger.getSupportedLogTypes().includes(type);
		}

		constructor(enabledLogTypes = [], onlyForBeta = false)
		{
			this.enabledLogTypes = new Set();
			this.canLog = !onlyForBeta || Application.isBeta();

			enabledLogTypes.forEach((type) => this.enable(type));
		}

		isEnabledLogType(type)
		{
			return this.enabledLogTypes.has(type);
		}

		enable(type)
		{
			if (!Logger.isSupportedLogType(type))
			{
				return false;
			}

			this.enabledLogTypes.add(type);

			return true;
		}

		disable(type)
		{
			if (!Logger.isSupportedLogType(type))
			{
				return false;
			}

			this.enabledLogTypes.delete(type);

			return true;
		}

		log(...params)
		{
			if (this.isEnabledLogType(LogType.LOG) && this.canLog)
			{
				// eslint-disable-next-line no-console
				console.log(...params);
			}
		}

		info(...params)
		{
			if (this.isEnabledLogType(LogType.INFO) && this.canLog)
			{
				// eslint-disable-next-line no-console
				console.info(...params);
			}
		}

		warn(...params)
		{
			if (this.isEnabledLogType(LogType.WARN) && this.canLog)
			{
				// eslint-disable-next-line no-console
				console.warn(...params);
			}
		}

		error(...params)
		{
			if (this.isEnabledLogType(LogType.ERROR) && this.canLog)
			{
				// eslint-disable-next-line no-console
				console.error(...params);
			}
		}

		trace(...params)
		{
			if (this.isEnabledLogType(LogType.TRACE) && this.canLog)
			{
				// eslint-disable-next-line no-console
				console.trace(...params);
			}
		}
	}

	module.exports = { Logger, LogType };
});
