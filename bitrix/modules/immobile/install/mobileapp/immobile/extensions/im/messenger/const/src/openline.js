/**
 * @module im/messenger/const/openline
 */
jn.define('im/messenger/const/openline', (require, exports, module) => {
	const OpenlineStatus = Object.freeze({
		new: 'new',
		work: 'work',
		answered: 'answered',
	});

	module.exports = {
		OpenlineStatus,
	};
});
