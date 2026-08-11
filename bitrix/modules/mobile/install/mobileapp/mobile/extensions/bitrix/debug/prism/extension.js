/**
 * @module debug/prism
 */
jn.define('debug/prism', (require, exports, module) => {
	const { prism } = require('debug/prism/src/polyfill');
	const { PerfPoint } = require('debug/prism/src/perf-point');

	module.exports = { prism, PerfPoint };
});
