/**
 * @module intent/handlers
 */
jn.define('intent/handlers', (require, exports, module) => {
	const { intentActions: tasks } = require('intent/handlers/src/tasks');
	const { intentActions: terminal } = require('intent/handlers/src/terminal');
	const { intentActions: checkIn } = require('intent/handlers/src/check-in');
	const { intentActions: calendar } = require('intent/handlers/src/calendar');

	/**
	 * @type {IntentActionEntry[]}
	 */
	const intentActions = [...tasks, ...terminal, ...checkIn, ...calendar];

	module.exports = { intentActions };
});
