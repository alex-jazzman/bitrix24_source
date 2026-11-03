/**
 * @module mail/sending-form/src/subject-generation-icon
 */
jn.define('mail/sending-form/src/subject-generation-icon', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');

	// Never cache the result: the path carries the current theme, and the form outlives a theme switch.
	function getSubjectGenerationIconUri()
	{
		return makeLibraryImagePath('bitrix-gpt.png', 'graphic');
	}

	module.exports = { getSubjectGenerationIconUri };
});
