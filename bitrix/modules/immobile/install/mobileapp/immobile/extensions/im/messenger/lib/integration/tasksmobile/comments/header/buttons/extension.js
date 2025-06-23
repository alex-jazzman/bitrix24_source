/**
 * @module im/messenger/lib/integration/tasksmobile/comments/header/buttons
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/header/buttons', (require, exports, module) => {
	const { DialogHeaderButtons } = require('im/messenger/api/dialog-integration/header/buttons');

	/**
	 * @class CommentsHeaderButtons
	 */
	class CommentsHeaderButtons extends DialogHeaderButtons
	{
		/**
		 * @protected
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtons()
		{
			return [];
		}

		/**
		 * @protected
		 * @param {string} buttonId
		 * @return void
		 */
		tapHandler(buttonId)
		{}
	}

	module.exports = {
		CommentsHeaderButtons,
	};
});
