/**
 * @module testing/runner
 */
jn.define('testing/runner', (require, exports, module) => {
	const { Type } = require('type');

	class TestingRunner
	{
		#importer;
		#testingProvider;

		constructor(options = {})
		{
			this.#importer = options.importer ?? ((extensionName) => jn.import(extensionName));
			this.#testingProvider = options.testingProvider ?? (() => require('testing'));
		}

		async run(params, onStateChange = () => {})
		{
			const { testSuites, report } = this.#testingProvider();
			const loadErrors = [];
			const executionErrors = [];
			let fatalError = null;
			let state = 'loading';

			onStateChange(state);

			try
			{
				if (!Type.isArrayFilled(params.extensionNames) && testSuites.length === 0)
				{
					throw new Error('No test suites were selected');
				}

				for (const extensionName of params.extensionNames)
				{
					try
					{
						const registeredSuites = new Set(testSuites);

						// eslint-disable-next-line no-await-in-loop
						await this.#importer(extensionName);

						if (!testSuites.some((suite) => !registeredSuites.has(suite)))
						{
							loadErrors.push({
								extensionName,
								message: 'The extension did not register any test suites',
							});
						}
					}
					catch (error)
					{
						loadErrors.push({
							extensionName,
							message: this.#getErrorMessage(error),
						});
					}
				}

				state = 'running';
				onStateChange(state);

				const onlySuites = testSuites.filter((suite) => suite.$only);
				const executableSuites = (onlySuites.length > 0 ? onlySuites : testSuites)
					.filter((suite) => !suite.$skip)
				;

				for (const suite of executableSuites)
				{
					const initialGroupDepth = this.#getReportGroupDepth(report);

					try
					{
						// eslint-disable-next-line no-await-in-loop
						await suite.execute();
					}
					catch (error)
					{
						this.#restoreReportGroupDepth(report, initialGroupDepth);
						executionErrors.push({
							suiteName: suite.title,
							message: this.#getErrorMessage(error),
						});
					}
				}

				state = loadErrors.length > 0 || executionErrors.length > 0 ? 'error' : 'result';
			}
			catch (error)
			{
				fatalError = { message: this.#getErrorMessage(error) };
				state = 'error';
			}

			const result = Object.freeze({
				state,
				report,
				loadErrors: Object.freeze(loadErrors),
				executionErrors: Object.freeze(executionErrors),
				fatalError,
				success: state === 'result' && report.totalFailures === 0,
			});

			onStateChange(state, result);

			return result;
		}

		#restoreReportGroupDepth(report, initialGroupDepth)
		{
			const openedGroupCount = this.#getReportGroupDepth(report) - initialGroupDepth;
			for (let index = 0; index < openedGroupCount; index++)
			{
				report.groupEnd?.();
			}
		}

		#getReportGroupDepth(report)
		{
			if (!Type.isArray(report?.log))
			{
				return 0;
			}

			return report.log.reduce((groupDepth, item) => {
				if (item.type === 'groupStart')
				{
					return groupDepth + 1;
				}

				return item.type === 'groupEnd' ? Math.max(0, groupDepth - 1) : groupDepth;
			}, 0);
		}

		#getErrorMessage(error)
		{
			if (error instanceof Error || Type.isString(error?.message))
			{
				return error.message;
			}

			if (Type.isObject(error))
			{
				try
				{
					return JSON.stringify(error);
				}
				catch
				{
					return String(error);
				}
			}

			return String(error);
		}
	}

	module.exports = { TestingRunner };
});
