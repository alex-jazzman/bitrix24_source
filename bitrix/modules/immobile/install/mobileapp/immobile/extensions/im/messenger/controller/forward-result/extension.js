/**
 * @module im/messenger/controller/forward-result
 */
jn.define('im/messenger/controller/forward-result', (require, exports, module) => {
	const { ForwardResult } = require('im/messenger/controller/forward-result/src/forward-result');
	const { ForwardResultView } = require('im/messenger/controller/forward-result/src/result-view');

	module.exports = { ForwardResult, ForwardResultView };
});
