/**
 * @module layout/ui/field-filter/filter/src/action
 */
jn.define('layout/ui/field-filter/filter/src/action', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * One action of the filter of a list (CONTRACT-API-02). The method is fixed by the contract and
	 * the namespace belongs to the consumer - the module that owns the list - so every request of the
	 * filter is that pair plus the context naming the list.
	 *
	 * Called without the cache of the executor: the answers of the filter are the state of the list
	 * the user is filtering right now, and a cached one would show the conditions of the last time.
	 *
	 * @param {string} actionPrefix
	 * @param {string} method
	 * @param {object} [params] sent as they are, the context of the list among them
	 * @return {Promise<object|null>} the raw answer; the caller reads what it needs out of it
	 */
	const callFilterAction = (actionPrefix, method, params = {}) => (
		new RunActionExecutor(`${actionPrefix}.${method}`, params).call(false)
	);

	module.exports = { callFilterAction };
});
