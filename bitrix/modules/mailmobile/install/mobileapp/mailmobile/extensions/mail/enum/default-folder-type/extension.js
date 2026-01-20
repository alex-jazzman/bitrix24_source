/**
 * @module mail/enum/default-folder-type
 */
jn.define('mail/enum/default-folder-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class DefaultFolderType
	 * @extends {BaseEnum<DefaultFolderType>}
	 */
	class DefaultFolderType extends BaseEnum
	{
		static DEFAULT = new DefaultFolderType('DEFAULT', 'default');

		static OUTCOME = new DefaultFolderType('OUTCOME', 'outcome');

		static DRAFTS = new DefaultFolderType('DRAFTS', 'drafts');

		static TRASH = new DefaultFolderType('TRASH', 'trash');

		static SPAM = new DefaultFolderType('SPAM', 'spam');

		/**
		 * @param {DefaultFolderType.value} value
		 * @returns {Boolean}
		 * */
		static isFolderWithCounterStatus(value)
		{
			return value !== DefaultFolderType.OUTCOME.value
				|| value === DefaultFolderType.DRAFTS.value
				|| value === DefaultFolderType.TRASH.value
				|| value === DefaultFolderType.SPAM.value
			;
		}
	}

	module.exports = { DefaultFolderType };
});
