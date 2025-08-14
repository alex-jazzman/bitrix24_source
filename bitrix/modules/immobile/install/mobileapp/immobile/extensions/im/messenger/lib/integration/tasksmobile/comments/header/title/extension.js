/**
 * @module im/messenger/lib/integration/tasksmobile/comments/header/title
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/header/title', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { DialogHeaderTitle } = require('im/messenger/api/dialog-integration/header/title');

	/**
	 * @class CommentsHeaderTitle
	 */
	class CommentsHeaderTitle extends DialogHeaderTitle
	{
		/**
		 * @return {JNWidgetTitleParams}
		 */
		createTitleParams()
		{
			return {
				text: Loc.getMessage('IMMOBILE_INTEGRATION_M_TASK_DETAILS_COMMENTS_HEADER_TITLE'),
				type: 'wizard',
			};
		}
	}

	module.exports = {
		CommentsHeaderTitle,
	};
});
