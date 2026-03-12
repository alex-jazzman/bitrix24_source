/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/messages/playback/validator
 */
jn.define('im/messenger/model/messages/playback/validator', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 *
	 * @param field
	 * @return {PlaybackModelState}
	 */
	function validatePlayback(field)
	{
		const result = {};
		if (Type.isNumber(field.playingTime))
		{
			result.playingTime = field.playingTime;
		}

		if (Type.isBoolean(field.isPlaying))
		{
			result.isPlaying = field.isPlaying;
		}

		return result;
	}

	module.exports = { validatePlayback };
});
