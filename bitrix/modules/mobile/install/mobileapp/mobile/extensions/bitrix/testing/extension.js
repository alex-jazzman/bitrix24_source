/**
 * @module testing
 */
jn.define('testing', (require, exports, module) => {
	const { SuiteRegistry } = require('testing/suite-registry');
	const { TestingExpectation } = require('testing/expectation');
	const { TestingReport } = require('testing/report');
	const { config } = require('testing/test-config');
	const { ConsolePrinter, JnLayoutPrinter } = require('testing/printers');
	const { expectationCount } = require('testing/expectation-count');

	/** @type {TestSuite[]} */
	const testSuites = [];

	const report = new TestingReport();

	const registry = new SuiteRegistry(report, testSuites);

	/**
	 * @param {string} title
	 * @param {function} setupFn
	 * @return {TestSuite}
	 */
	const describe = (title, setupFn) => registry.describe(title, setupFn);

	/**
	 * @param {string} title
	 * @param {function} callback
	 * @return {TestCase}
	 */
	const it = (title, callback) => registry.addTestCase(title, callback, 'it');

	/**
	 * @param {string} title
	 * @param {function} callback
	 * @return {TestCase}
	 */
	const test = (title, callback) => registry.addTestCase(title, callback, 'test');

	const expect = (value) => new TestingExpectation(value);

	expect.assertions = (requiredAssertionsCount) => {
		expectationCount.setRequiredCount(requiredAssertionsCount);
	};

	expect.hasAssertions = () => {
		expectationCount.setRequiredCount(1);
	};

	const beforeEach = (fn) => registry.beforeEach(fn);

	const afterEach = (fn) => registry.afterEach(fn);

	const beforeAll = (fn) => registry.beforeAll(fn);

	const afterAll = (fn) => registry.afterAll(fn);

	module.exports = {
		describe,
		it,
		test,
		expect,
		beforeEach,
		afterEach,
		beforeAll,
		afterAll,
		report,
		testSuites,
		SuiteRegistry,
		ConsolePrinter,
		JnLayoutPrinter,
		config,
	};
});
