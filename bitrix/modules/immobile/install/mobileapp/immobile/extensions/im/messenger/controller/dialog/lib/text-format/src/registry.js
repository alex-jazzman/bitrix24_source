/**
 * @module im/messenger/controller/dialog/lib/text-format/src/registry
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/registry', (require, exports, module) => {
	/**
	 * @class TextFormatActionRegistry
	 */
	class TextFormatActionRegistry
	{
		#actions = new Map();

		/**
		 * @param {BaseAction} action
		 */
		register(action)
		{
			this.#actions.set(action.id, action);
		}

		/**
		 * @param {string} id
		 * @returns {BaseAction|null}
		 */
		getById(id)
		{
			return this.#actions.get(id) || null;
		}

		/**
		 * @returns {Array<BaseAction>}
		 */
		getAll()
		{
			return [...this.#actions.values()];
		}

		/**
		 * @returns {Array<{id: string, title: string}>}
		 */
		getAllConfigs()
		{
			return this.getAll().map((action) => action.getConfig());
		}
	}

	module.exports = { TextFormatActionRegistry };
});
