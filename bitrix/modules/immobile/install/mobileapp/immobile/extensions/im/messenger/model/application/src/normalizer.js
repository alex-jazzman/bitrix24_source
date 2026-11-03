/**
 * @module im/messenger/model/application/normalizer
 */
jn.define('im/messenger/model/application/normalizer', (require, exports, module) => {
	const { AvailableAudioRates } = require('im/messenger/const');

	/**
	 * The rate leaves the model for the native players and for the message data, where only the
	 * values of the set are supported. It enters the model from the local setting as a plain number
	 * as well - a build with another set could have stored anything - so the set is checked here,
	 * at the single door into the state, and not in each of the readers.
	 *
	 * @param {*} rate
	 * @return {AudioRate}
	 */
	function normalizeAudioRate(rate)
	{
		return AvailableAudioRates.includes(rate) ? rate : AvailableAudioRates[0];
	}

	module.exports = { normalizeAudioRate };
});
