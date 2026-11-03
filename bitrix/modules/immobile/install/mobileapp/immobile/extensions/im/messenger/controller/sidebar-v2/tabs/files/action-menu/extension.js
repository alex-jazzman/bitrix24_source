/**
 * @module im/messenger/controller/sidebar-v2/tabs/files/action-menu
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/files/action-menu', (require, exports, module) => {
	const { UIMenu } = require('layout/ui/menu');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const {
		onOpenMessageInChat,
		onDownloadFileToDevice,
		onDownloadFileToDisk,
	} = require('im/messenger/controller/sidebar-v2/user-actions/menu');

	class FileActionMenu
	{
		#props;

		/**
		 * @param {FileActionMenuParams} props
		 */
		constructor(props)
		{
			this.#props = props;
			this.dialogHelper = DialogHelper.createByDialogId(props.dialogId);
		}

		/**
		 * @returns {string}
		 */
		getTestId()
		{
			const { testId = 'sidebar-tab-file-item' } = this.#props;

			return `${testId}-action-menu`;
		}

		/**
		 * @returns {Array<SidebarMenuActionItem>}
		 */
		getActions()
		{
			const openInDialogTitle = this.dialogHelper?.isChannel
				? Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_OPEN_IN_CHANNEL')
				: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_OPEN_IN_CHAT');

			const { fileId } = this.#props;
			const fileModel = this.#getFileModel();
			const testId = this.getTestId();

			// A video note is not downloadable until task 734392 brings the upload policy in.
			const isVideoNote = Boolean(fileModel?.isVideoNote);

			const items = [
				isVideoNote ? null : onDownloadFileToDevice({ testId, fileUrl: fileModel?.urlDownload }),
				isVideoNote ? null : onDownloadFileToDisk({ testId, fileId: fileModel?.id ?? fileId }),
				onOpenMessageInChat({
					testId,
					openInDialogTitle,
					onClick: this.gotoMessage,
				}),
			];

			return items.filter(Boolean);
		}

		gotoMessage = () => {
			const { messageId, widgetNavigator } = this.#props;

			void widgetNavigator.backToChatMessage(Number(messageId));
		};

		show(target)
		{
			new UIMenu(this.getActions()).show({ target });
		}

		/**
		 * @returns {FilesModelState}
		 */
		#getFileModel()
		{
			const { fileId } = this.#props;

			return serviceLocator.get('core').getStore().getters['filesModel/getById'](fileId);
		}
	}

	module.exports = {
		fileActionMenu: (props) => new FileActionMenu(props),
	};
});
