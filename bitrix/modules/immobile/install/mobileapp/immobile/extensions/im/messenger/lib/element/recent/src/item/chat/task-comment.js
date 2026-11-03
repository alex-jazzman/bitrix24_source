/**
 * @module im/messenger/lib/element/recent/item/chat/task-comment
 */
jn.define('im/messenger/lib/element/recent/item/chat/task-comment', (require, exports, module) => {
	const { ChatItem } = require('im/messenger/lib/element/recent/item/chat');

	/**
	 * @class TaskCommentItem
	 */
	class TaskCommentItem extends ChatItem
	{
		createActions()
		{
			this.actions = [
				this.getHideAction(),
				this.getAddToFolderAction(),
				this.getPinAction(),
				this.getReadAction(),
			].filter(Boolean);

			return this;
		}
	}

	module.exports = {
		TaskCommentItem,
	};
});
