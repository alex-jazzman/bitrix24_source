/**
 * @module im/messenger/controller/sidebar-v2/user-actions/menu
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/menu', (require, exports, module) => {
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { Icon } = require('assets/icons');

	const {
		downloadFileToDevice,
		downloadFileToDisk,
	} = require('im/messenger/controller/sidebar-v2/utils/file');
	const { SidebarActionType } = require('im/messenger/const');
	const { createTestIdGenerator } = require('utils/test');

	const Sections = {
		COMMON: 'common',
	};

	/**
	 * The download target comes in as data: these are plain factories, not methods,
	 * so there is no instance to read the file from.
	 *
	 * @param {DownloadToDeviceActionParams} params
	 * @returns {SidebarMenuActionItem}
	 */
	const onDownloadFileToDevice = ({ testId, fileUrl }) => ({
		id: SidebarActionType.downloadFileToDevice,
		testId: createTestIdGenerator({ prefix: testId })(SidebarActionType.downloadFileToDevice),
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_FILE_ACTION_MENU_DOWNLOAD_TO_DEVICE'),
		iconName: Icon.DOWNLOAD,
		onItemSelected: () => downloadFileToDevice(fileUrl),
		section: Sections.COMMON,
		sort: 100,
	});

	/**
	 * @param {DownloadToDiskActionParams} params
	 * @returns {SidebarMenuActionItem}
	 */
	const onDownloadFileToDisk = ({ testId, fileId }) => ({
		id: SidebarActionType.downloadFileToDisk,
		testId: createTestIdGenerator({ prefix: testId })(SidebarActionType.downloadFileToDisk),
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_FILE_ACTION_MENU_DOWNLOAD_TO_DISK'),
		iconName: Icon.FOLDER_24,
		onItemSelected: () => downloadFileToDisk(fileId),
		section: Sections.COMMON,
		sort: 200,
	});

	/**
	 * @param {OpenMessageActionParams} params
	 * @returns {SidebarMenuActionItem}
	 */
	const onOpenMessageInChat = ({ testId, openInDialogTitle, onClick }) => ({
		id: SidebarActionType.openMessageInChat,
		testId: createTestIdGenerator({ prefix: testId })(SidebarActionType.openMessageInChat),
		title: openInDialogTitle,
		iconName: Icon.ARROW_TO_THE_RIGHT,
		onItemSelected: onClick,
		section: Sections.COMMON,
		sort: 300,
	});

	module.exports = {
		onDownloadFileToDevice,
		onDownloadFileToDisk,
		onOpenMessageInChat,
	};
});
