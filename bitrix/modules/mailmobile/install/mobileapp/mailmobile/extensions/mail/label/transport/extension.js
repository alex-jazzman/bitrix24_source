/**
 * @module mail/label/transport
 */
jn.define('mail/label/transport', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { readActionData } = require('mail/label/transport/src/envelope');

	/**
	 * A label action of the mail module: resolves with its payload, rejects when the action denied or
	 * when the request never reached the server.
	 *
	 * @param {string} action
	 * @param {object} options
	 * @return {Promise<object>}
	 */
	const runLabelAction = (action, options) => new Promise((resolve, reject) => {
		(new RunActionExecutor(action, options))
			.setHandler((response) => {
				try
				{
					resolve(readActionData(response));
				}
				catch (error)
				{
					reject(error);
				}
			})
			.call(false)
			.catch(reject)
		;
	});

	module.exports = { runLabelAction };
});
