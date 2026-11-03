/**
 * @module mail/folder/virtual/src/keys
 */
jn.define('mail/folder/virtual/src/keys', (require, exports, module) => {
	// Keys of the virtual folders, apart from the rest of the extension: the pure parts of the folder
	// selector need them without the store, the layout and the localization the extension pulls in.
	const ALL_MESSAGES = 'all_messages';
	const FAVORITES = 'favorites';
	const LABEL = 'label';

	module.exports = { ALL_MESSAGES, FAVORITES, LABEL };
});
