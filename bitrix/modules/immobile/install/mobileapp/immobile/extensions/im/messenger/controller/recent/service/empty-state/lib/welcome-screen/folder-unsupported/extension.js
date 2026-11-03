/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder-unsupported
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder-unsupported', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * Empty state of the "All" tab on a build without chat folders: the tab is laid out over folders
	 * the build knows nothing about and stays empty whatever the user has. The screen says so and
	 * opens the ready update window, which takes the user to the store by itself.
	 *
	 * @implements IWelcomeScreen
	 */
	class FolderUnsupportedWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create({
				upperText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FOLDER_UNSUPPORTED_TITLE'),
				lowerText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FOLDER_UNSUPPORTED_TEXT'),
				iconName: 'ws_employees',
				listener: () => Feature.showUnsupportedWidget(),
				startChatButton: {
					text: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FOLDER_UNSUPPORTED_BUTTON'),
				},
			}).toChatRecentWidgetItem();
		}

		/**
		 * The button belongs to the widget item alone: the layout presentation has none, and without
		 * it the screen loses the only way out it offers.
		 *
		 * @return {boolean}
		 */
		isLayoutComponentSupported()
		{
			return false;
		}

		toLayoutComponent()
		{
			return null;
		}
	}

	module.exports = FolderUnsupportedWelcomeScreen;
});
