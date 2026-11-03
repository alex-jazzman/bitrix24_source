/**
 * @module intent/handlers/src/tasks
 */
jn.define('intent/handlers/src/tasks', (require, exports, module) => {
	/**
	 * @type {IntentActionEntry[]}
	 */
	const intentActions = [
		{
			codes: 'preset_task',
			action: () => {
				analytics.send(`preset_task_${Application.getPlatform()}`, { type: 'preset_task' }, ['fbonly']);
			},
		},
	];

	module.exports = { intentActions };
});
