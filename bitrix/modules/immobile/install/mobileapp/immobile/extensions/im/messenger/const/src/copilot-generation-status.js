/**
 * @module im/messenger/const/copilot-generation-status
 */
jn.define('im/messenger/const/copilot-generation-status', (require, exports, module) => {
	/**
	 * Statuses of the BitrixGPT generation state backend contract:
	 * pull command "copilotGenerationState" and REST im.v2.Copilot.Generation.stop.
	 */
	const CopilotGenerationStatus = Object.freeze({
		generating: 'generating',
		stopped: 'stopped',
		completed: 'completed',
		error: 'error',
	});

	module.exports = { CopilotGenerationStatus };
});
