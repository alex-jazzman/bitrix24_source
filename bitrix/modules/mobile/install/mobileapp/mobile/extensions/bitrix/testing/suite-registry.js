/**
 * @module testing/suite-registry
 */
jn.define('testing/suite-registry', (require, exports, module) => {
	const { TestSuite } = require('testing/test-suite');
	const { TestCase } = require('testing/test-case');

	/**
	 * Keeps the suites of a run and answers the only question the declaration API asks: which suite
	 * does this declaration belong to. The answer is the describe that is open at the moment of the
	 * call, so the body of a nested describe takes its own declarations and everything after it goes
	 * back to the enclosing one.
	 *
	 * @class SuiteRegistry
	 */
	class SuiteRegistry
	{
		/** @type {TestSuite[]} */
		#openSuites = [];

		/**
		 * @param {TestingReport} report
		 * @param {TestSuite[]} suites flat list of the suites of the run, in declaration order
		 */
		constructor(report, suites = [])
		{
			/** @type {TestingReport} */
			this.report = report;

			/** @type {TestSuite[]} */
			this.suites = suites;
		}

		/**
		 * @public
		 * @param {string} title
		 * @param {function} setupFn
		 * @return {TestSuite}
		 */
		describe(title, setupFn)
		{
			const suite = new TestSuite(title, this.report, this.#openSuite());

			this.suites.push(suite);
			this.#openSuites.push(suite);

			try
			{
				setupFn();
			}
			finally
			{
				this.#openSuites.pop();
			}

			return suite;
		}

		/**
		 * @public
		 * @param {string} title
		 * @param {function} callback
		 * @param {string} prefix
		 * @return {TestCase}
		 */
		addTestCase(title, callback, prefix)
		{
			const suite = this.#requireOpenSuite(`${prefix} "${title}"`);
			const testCase = new TestCase(title, callback, prefix, this.report);

			suite.testCases.push(testCase);

			return testCase;
		}

		/**
		 * @public
		 * @param {function} fn
		 */
		beforeEach(fn)
		{
			this.#requireOpenSuite('beforeEach()').beforeEach.push(fn);
		}

		/**
		 * @public
		 * @param {function} fn
		 */
		afterEach(fn)
		{
			this.#requireOpenSuite('afterEach()').afterEach.push(fn);
		}

		/**
		 * @public
		 * @param {function} fn
		 */
		beforeAll(fn)
		{
			this.#requireOpenSuite('beforeAll()').beforeAll.push(fn);
		}

		/**
		 * @public
		 * @param {function} fn
		 */
		afterAll(fn)
		{
			this.#requireOpenSuite('afterAll()').afterAll.push(fn);
		}

		/**
		 * @private
		 * @return {TestSuite|null}
		 */
		#openSuite()
		{
			return this.#openSuites.length === 0 ? null : this.#openSuites[this.#openSuites.length - 1];
		}

		/**
		 * A declaration made while no describe is open belongs to no suite, and a runner executes
		 * suites - such a declaration would never run. Better an error at declaration time than a
		 * hook that silently prepares nothing.
		 *
		 * @private
		 * @param {string} declaration
		 * @return {TestSuite}
		 */
		#requireOpenSuite(declaration)
		{
			const suite = this.#openSuite();

			if (suite === null)
			{
				throw new Error(
					`${declaration} is declared outside of describe() and would never run. `
					+ 'Move the declaration inside the describe it belongs to, '
					+ 'or into a helper that every describe calls in its own body.',
				);
			}

			return suite;
		}
	}

	module.exports = {
		SuiteRegistry,
	};
});
