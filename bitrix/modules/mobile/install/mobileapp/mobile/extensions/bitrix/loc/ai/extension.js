/**
 * @module loc/ai
 */
jn.define('loc/ai', (require, exports, module) => {
	const { Loc: BaseLoc } = require('loc/base');

	class Loc extends BaseLoc
	{
		/**
		 * @override
		 * @param {string} messageId
		 * @param {object} replacements
		 * @return {?string}
		 */
		static getMessage(messageId, replacements = null)
		{
			return super.getMessage(messageId, {
				...replacements,
				'#COPILOT_NAME#': env.modulesData?.mobile?.aiName ?? 'CoPilot',
			});
		}
	}

	module.exports = {
		Loc,
	};
});
