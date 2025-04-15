jn.define('src/util', (require, exports, module) => {
	const { Color } = require('tokens');
	function convertHexToColorEnum(color)
	{
		return new Color('avatarColor', color);
	}

	module.exports = {
		convertHexToColorEnum,
	};
});