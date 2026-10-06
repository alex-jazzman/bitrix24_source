/**
 * @module im/messenger/controller/attach-chat/project-selector
 */
jn.define('im/messenger/controller/attach-chat/project-selector', (require, exports, module) => {
	const { openProjectSelector } = require('im/messenger/controller/attach-chat/project-selector/src/opener');

	/**
	 * @class ProjectSelector
	 */
	class ProjectSelector
	{
		/**
		 * Opens the project selector and returns the selected project or null if dismissed.
		 *
		 * @param {Object} options
		 * @param {string|number} options.chatId - the chat being attached (excluded from list)
		 * @param {PageManager} [options.parentWidget=PageManager]
		 * @return {Promise<{dialogId: string, name: string}|null>}
		 */
		static open({ chatId, parentWidget = PageManager })
		{
			return new Promise((resolve) => {
				let resolved = false;
				let selectedProject = null;

				// Resolve only once the selector is fully gone — onWidgetClosed after a selection,
				// onViewRemoved after a swipe-dismiss.
				const finish = () => {
					if (resolved)
					{
						return;
					}
					resolved = true;
					resolve(selectedProject);
				};

				openProjectSelector(
					{
						chatId,
						onItemSelected: ({ item }) => {
							selectedProject = {
								dialogId: String(item.id),
								chatId: item.params?.chatId,
								name: item.title || item.params?.title || '',
							};
						},
						onWidgetClosed: finish,
						onViewRemoved: finish,
					},
					parentWidget,
				).catch((error) => {
					console.error('ProjectSelector.open', error);
					finish();
				});
			});
		}
	}

	module.exports = { ProjectSelector };
});
