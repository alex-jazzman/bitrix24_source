/**
 * @module im/messenger/lib/folder-eligibility
 */
jn.define('im/messenger/lib/folder-eligibility', (require, exports, module) => {
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');

	class FolderEligibility
	{
		/**
		 * @param {string} type
		 * @return {boolean}
		 */
		static isAllowed(type)
		{
			return this.getAllowedTypes().includes(type);
		}

		/**
		 * @return {string[]}
		 */
		static getAllowedTypes()
		{
			const { allowedTypes } = MessengerParams.getFolders();

			return Type.isArray(allowedTypes) ? allowedTypes : [];
		}

		/**
		 * @return {MessengerFolderLimits}
		 */
		static getLimits()
		{
			const { limits } = MessengerParams.getFolders();

			return Type.isPlainObject(limits) ? limits : {};
		}
	}

	module.exports = { FolderEligibility };
});
