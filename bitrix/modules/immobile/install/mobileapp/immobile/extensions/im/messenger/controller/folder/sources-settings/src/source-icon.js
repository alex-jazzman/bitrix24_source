/**
 * @module im/messenger/controller/folder/sources-settings/source-icon
 */
jn.define('im/messenger/controller/folder/sources-settings/source-icon', (require, exports, module) => {
	const { Icon } = require('ui-system/blocks/icon');

	// The single place where a source folder code is bound to a glyph: the answer of the
	// server carries no icon field and never will, the client draws it by the code.
	const IconByFolderCode = Object.freeze({
		tasksTaskRoot: Icon.SOLID_TASK,
		copilot: Icon.SOLID_AI_STARS,
		channel: Icon.SOLID_SPEAKER,
		collab: Icon.SOLID_COLLAB,
		lines: Icon.SOLID_OPEN_CHANNELS,
	});

	// An unknown code is not an error: the showcase registry of the server may grow earlier
	// than the client, and a generic folder reads better than an empty place.
	const DefaultIcon = Icon.SOLID_FOLDER;

	class FolderSourceIcon
	{
		/**
		 * @param {string} code - the rest code of the source folder
		 * @return {Icon}
		 */
		static getByFolderCode(code)
		{
			// the code arrives with the answer of the server and no allowlist stands on the way,
			// so the map is asked about its own keys alone: an inherited name would otherwise
			// answer with a member of the prototype
			if (!Object.hasOwn(IconByFolderCode, code))
			{
				return DefaultIcon;
			}

			return IconByFolderCode[code];
		}
	}

	module.exports = { FolderSourceIcon };
});
