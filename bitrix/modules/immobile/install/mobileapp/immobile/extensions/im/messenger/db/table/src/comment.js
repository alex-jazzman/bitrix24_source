/**
 * @module im/messenger/db/table/comment
 */
jn.define('im/messenger/db/table/comment', (require, exports, module) => {
	const {
		Table,
		FieldType,
	} = require('im/messenger/db/table/table');

	class CommentTable extends Table
	{
		getName()
		{
			return 'b_im_comment';
		}

		getPrimaryKey()
		{
			return 'commentChatId';
		}

		getFields()
		{
			return [
				{ name: 'commentChatId', type: FieldType.integer, unique: true, index: true },
				{ name: 'parentMessageId', type: FieldType.integer, index: true },
				{ name: 'parentChatId', type: FieldType.integer },
				// no default value on purpose: an empty column means "no data yet" and must not
				// turn into a zero reply count or an empty author list of a migrated row
				{ name: 'messageCount', type: FieldType.integer },
				{ name: 'lastUserIds', type: FieldType.array },
			];
		}
	}

	module.exports = {
		CommentTable,
	};
});
