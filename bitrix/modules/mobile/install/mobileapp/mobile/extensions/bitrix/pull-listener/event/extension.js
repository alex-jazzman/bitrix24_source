/**
 * @module pull-listener/event
 */
jn.define('pull-listener/event', (require, exports, module) => {
	/**
	 * @class PullEvent
	 * @param {PullEventParams} params
	 */
	class PullEvent
	{
		/**
		 * @typedef {Object} PullEventParams
		 * @property {String} id
		 * @property {String} moduleId
		 * @property {String} command
		 * @property {Function} callback
		 */
		constructor({ id, moduleId, command, callback })
		{
			this.id = id;
			this.moduleId = moduleId;
			this.command = command;
			this.callback = callback;
		}

		/**
		 * @returns {String}
		 */
		getId()
		{
			return this.id;
		}

		/**
		 * @returns {String}
		 */
		getModuleId()
		{
			return this.moduleId;
		}

		/**
		 * @returns {String}
		 */
		getCommand()
		{
			return this.command;
		}

		/**
		 * @returns {Function}
		 */
		getCallback()
		{
			return this.callback;
		}
	}

	module.exports = {
		PullEvent,
	};
});
