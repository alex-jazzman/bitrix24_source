/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/src/view
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/src/view', (require, exports, module) => {
	const { SidebarBaseView } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { ProjectInfoLink } = require('im/messenger/controller/sidebar-v2/controller/collab/src/project-info/link');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	class CollabSidebarView extends SidebarBaseView
	{
		/**
		 * @param {SidebarViewDefaultProps} props
		 */
		constructor(props)
		{
			super(props);

			/** @type {MessengerCoreStoreManager} */
			this.storeManager = serviceLocator.get('core').getStoreManager();
		}

		/**
		 * Renders the row leading to the project info, before the chat description. The row holds
		 * no fields of its own: the sheet it opens reads them from the store and follows them,
		 * because it outlives the redraws of this panel.
		 *
		 * @return {object}
		 */
		renderProjectInfoBeforeDescription()
		{
			return new ProjectInfoLink({
				store: this.store,
				storeManager: this.storeManager,
				dialogId: this.dialogId,
				description: this.dialogHelper.dialogModel?.description,
				loadProjectInfo: this.props.loadProjectInfo,
				// The sheet the row opens belongs to the panel, not to the page behind it: it has
				// to close with the panel and stack above it.
				parentWidget: this.widget,
			});
		}

		/**
		 * The description is a field of the project info sheet, see
		 * renderProjectInfoBeforeDescription.
		 *
		 * @return {null}
		 */
		renderDescription()
		{
			return null;
		}
	}

	module.exports = { CollabSidebarView };
});
