/**
 * @module loc
 */
jn.define('loc', (require, exports, module) => {
	const { Loc } = require('loc/base');
	const { Loc: AiLoc } = require('loc/ai');

	module.exports = {
		Loc,
		AiLoc,
	};
});
