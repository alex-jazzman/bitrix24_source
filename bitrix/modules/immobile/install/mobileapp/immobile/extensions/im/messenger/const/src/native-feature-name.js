/**
 * @module im/messenger/const/native-feature-name
 */
jn.define('im/messenger/const/native-feature-name', (require, exports, module) => {
	/**
	 * Names of native capability flags read by more than one consumer.
	 * A capability whose name is duplicated as a literal silently desynchronizes
	 * its readers on a rename or a typo, so the shared ones live here.
	 */
	const NativeFeatureName = Object.freeze({
		chatRecentItemButton: 'chat_recent_item_button',
	});

	module.exports = { NativeFeatureName };
});
