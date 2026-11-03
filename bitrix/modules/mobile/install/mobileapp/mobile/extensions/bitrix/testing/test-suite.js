/* eslint-disable no-await-in-loop */
/**
 * @module testing/test-suite
 */
jn.define('testing/test-suite', (require, exports, module) => {

	class TestSuite
	{
		constructor(title, report, parent = null)
		{
			/** @type {string} */
			this.title = title;

			/** @type {TestingReport} */
			this.report = report;

			/**
			 * The suite of the describe this one was declared in, null for a describe of the top level.
			 *
			 * @public
			 * @type {TestSuite|null}
			 */
			this.parent = parent;

			/**
			 * @public
			 * @type {boolean}
			 */
			this.$only = false;

			/**
			 * @public
			 * @type {boolean}
			 */
			this.$skip = false;

			/**
			 * @public
			 * @type {TestCase[]}
			 */
			this.testCases = [];

			/**
			 * @public
			 * @type {function[]}
			 */
			this.beforeAll = [];

			/**
			 * @public
			 * @type {function[]}
			 */
			this.afterAll = [];

			/**
			 * @public
			 * @type {function[]}
			 */
			this.beforeEach = [];

			/**
			 * @public
			 * @type {function[]}
			 */
			this.afterEach = [];
		}

		/**
		 * @public
		 */
		async execute()
		{
			this.report.group(this.title);

			const setUp = await this.#executeHooks(this.#ownHooks(this.beforeAll), 'beforeAll');

			const only = this.testCases.filter((testCase) => testCase.$only);
			const executables = setUp
				? (only.length > 0 ? only : this.testCases).filter((testCase) => !testCase.$skip)
				: []
			;

			const beforeEach = this.#beforeEachChain();
			const afterEach = this.#afterEachChain();

			for (const testCase of executables)
			{
				const arranged = await this.#executeHooks(beforeEach, 'beforeEach');

				if (arranged)
				{
					void await testCase.execute();
				}

				void await this.#executeHooks(afterEach, 'afterEach');
			}

			void await this.#executeHooks(this.#ownHooks(this.afterAll), 'afterAll');

			this.report.groupEnd();
		}

		/**
		 * A case of a nested describe runs under the hooks of the enclosing ones as well: on the way
		 * in the outermost goes first, on the way out it goes last. `beforeAll` and `afterAll` are not
		 * inherited - they belong to the suite that declares them and run in its own turn.
		 *
		 * A hook travels with the suite that declared it, so a broken one is named by its own describe
		 * and not by the nested one whose case was being prepared.
		 *
		 * @private
		 * @return {Array<{suite: TestSuite, fn: Function}>}
		 */
		#beforeEachChain()
		{
			return this.#selfAndAncestors()
				.reverse()
				.flatMap((suite) => suite.beforeEach.map((fn) => ({ suite, fn })))
			;
		}

		/**
		 * @private
		 * @return {Array<{suite: TestSuite, fn: Function}>}
		 */
		#afterEachChain()
		{
			return this.#selfAndAncestors().flatMap((suite) => suite.afterEach.map((fn) => ({ suite, fn })));
		}

		/**
		 * @private
		 * @param {Array<Function>} hooks
		 * @return {Array<{suite: TestSuite, fn: Function}>}
		 */
		#ownHooks(hooks)
		{
			return hooks.map((fn) => ({ suite: this, fn }));
		}

		/**
		 * @private
		 * @return {TestSuite[]} this suite first, then the enclosing ones outwards
		 */
		#selfAndAncestors()
		{
			const chain = [this];

			while (chain[chain.length - 1].parent !== null)
			{
				chain.push(chain[chain.length - 1].parent);
			}

			return chain;
		}

		/**
		 * A hook is code like any other, and it breaks: a global the runtime does not have, a module
		 * that failed to load. Then the suite says which hook of which suite broke and the run goes on -
		 * an escaping error would end the run at this suite and leave every suite after it unreported.
		 *
		 * @param {Array<{suite: TestSuite, fn: Function}>} hooks
		 * @param {string} declaration name of the hook, for the report
		 * @return {Promise<boolean>} false when a hook threw: what it had to arrange did not happen
		 */
		async #executeHooks(hooks, declaration)
		{
			for (const { suite, fn } of hooks)
			{
				try
				{
					void await fn();
				}
				catch (error)
				{
					this.report.fail(
						`${declaration} of "${suite.title}"`,
						'no error thrown',
						error instanceof Error ? error.message : String(error),
						error instanceof Error ? error.stack : undefined,
					);

					return false;
				}
			}

			return true;
		}

		/**
		 * @public
		 * @return {TestSuite}
		 */
		only()
		{
			this.$only = true;

			return this;
		}

		/**
		 * @public
		 * @return {TestSuite}
		 */
		skip()
		{
			this.$skip = true;

			return this;
		}
	}

	module.exports = {
		TestSuite,
	};
});
