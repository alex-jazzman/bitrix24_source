/**
 * @module call/const/signals-behavior
 */
jn.define('call/const/signals-behavior', (require, exports, module) => {
	const SignalsBehavior = Object.freeze({
		pingOnly: 'pingOnly',
		allSignals: 'allSignals',
	});

	module.exports = { SignalsBehavior };
});
