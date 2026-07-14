/**
 * @module im/messenger/const/button
 */
jn.define('im/messenger/const/button', (require, exports, module) => {
	const ButtonDesignType = Object.freeze({
		filled: 'filled',
		tinted: 'tinted',
		outline: 'outline',
		outlineAccent1: 'outline-accent-1',
		outlineAccent2: 'outline-accent-2',
		outlineNoAccent: 'outline-no-accent',
		plain: 'plain',
		plainAccent: 'plain-accent',
		plainNoAccent: 'plain-no-accent',
	});

	module.exports = {
		ButtonDesignType,
	};
});
