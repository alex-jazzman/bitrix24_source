(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect, beforeEach, afterEach } = require('testing');
	const { Logger, LogType } = require('utils/logger');

	describe('Logger', () => {
		let originalConsole = null;

		beforeEach(() => {
			originalConsole = {};
			Logger.getSupportedLogTypes().forEach((type) => {
				originalConsole[type] = console[type];
			});
		});

		afterEach(() => {
			Logger.getSupportedLogTypes().forEach((type) => {
				console[type] = originalConsole[type];
			});
		});

		test('should enable supported log type', () => {
			const logger = new Logger();

			expect(logger.enable(LogType.LOG)).toBe(true);
			expect(logger.isEnabledLogType(LogType.LOG)).toBe(true);
		});

		test('should not enable unsupported log type', () => {
			const logger = new Logger();

			expect(logger.enable('unsupported')).toBe(false);
			expect(logger.isEnabledLogType('unsupported')).toBe(false);
		});

		test('should disable log type that was enabled in constructor', () => {
			const logger = new Logger([LogType.LOG]);

			expect(logger.disable(LogType.LOG)).toBe(true);
			expect(logger.isEnabledLogType(LogType.LOG)).toBe(false);
		});

		test('should not disable unsupported log type', () => {
			const logger = new Logger();

			expect(logger.disable('unsupported')).toBe(false);
		});

		test('should enable log types from constructor', () => {
			const logger = new Logger([LogType.LOG, LogType.ERROR]);

			expect(logger.isEnabledLogType(LogType.LOG)).toBe(true);
			expect(logger.isEnabledLogType(LogType.ERROR)).toBe(true);
			expect(logger.isEnabledLogType(LogType.WARN)).toBe(false);
		});

		Logger.getSupportedLogTypes().forEach((type) => {
			test(`should call console.${type} when ${type.toUpperCase()} is enabled`, () => {
				const logger = new Logger([type]);
				let called = false;
				console[type] = () => {
					called = true;
				};

				logger[type]('test');

				expect(called).toBe(true);
			});

			test(`should not call console.${type} when ${type.toUpperCase()} is not enabled`, () => {
				const logger = new Logger();
				let called = false;
				console[type] = () => {
					called = true;
				};

				logger[type]('test');

				expect(called).toBe(false);
			});
		});

		test('should pass all arguments to console method', () => {
			const logger = new Logger([LogType.LOG]);
			let receivedArgs = [];
			console.log = (...args) => {
				receivedArgs = args;
			};

			logger.log('message', { key: 'value' }, 42);

			expect(receivedArgs).toEqual(['message', { key: 'value' }, 42]);
		});

		test('should not call console when canLog is false', () => {
			Logger.getSupportedLogTypes().forEach((type) => {
				const logger = new Logger([type]);
				logger.canLog = false;

				let called = false;
				console[type] = () => {
					called = true;
				};

				logger[type]('test');

				expect(called).toBe(false);
			});
		});

		test('should call console when canLog is true', () => {
			Logger.getSupportedLogTypes().forEach((type) => {
				const logger = new Logger([type]);
				logger.canLog = true;

				let called = false;
				console[type] = () => {
					called = true;
				};

				logger[type]('test');

				expect(called).toBe(true);
			});
		});

		test('getSupportedLogTypes should return all log types', () => {
			expect(Logger.getSupportedLogTypes()).toEqual(['log', 'info', 'warn', 'error', 'trace']);
		});

		test('isSupportedLogType should return true for valid types', () => {
			expect(Logger.isSupportedLogType('log')).toBe(true);
			expect(Logger.isSupportedLogType('error')).toBe(true);
		});

		test('isSupportedLogType should return false for invalid types', () => {
			expect(Logger.isSupportedLogType('debug')).toBe(false);
			expect(Logger.isSupportedLogType('')).toBe(false);
		});
	});
})();
