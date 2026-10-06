/**
 * @module require-lazy
 */
jn.define('require-lazy', (require, exports, module) => {
	const { requireLazyBatch } = require('require-lazy/lazy-batch');
	const { requireLazy } = require('require-lazy/lazy');

	module.exports = {
		requireLazy,
		requireLazyBatch,
	};
});

// todo remove after all global usages in other modules will be cleaned
(function() {
	const require = (ext) => jn.require(ext);
	const { requireLazy, requireLazyBatch } = require('require-lazy');

	jnexport(requireLazyBatch);
	jnexport(requireLazy);
})();
