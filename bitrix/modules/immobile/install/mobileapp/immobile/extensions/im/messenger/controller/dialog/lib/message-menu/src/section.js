/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/section
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/section', (require, exports, module) => {

	const { MessageMenuSectionId } = require('im/messenger/const');

	/** @type MessageContextMenuSectionItem */
	const MoreSection = {
		id: MessageMenuSectionId.dialogMore,
		title: '',
		iconName: '',
		iconUrl: '',
	};
	/** @type MessageContextMenuSectionItem */
	const MainSection = {
		id: MessageMenuSectionId.dialogMain,
		title: '',
		iconName: '',
		iconUrl: '',
	};
	/** @type MessageContextMenuSectionItem */
	const MainSubSection = {
		id: MessageMenuSectionId.dialogFooter,
		title: '',
		iconName: '',
		iconUrl: '',
	};

	module.exports = {
		MoreSection,
		MainSection,
		MainSubSection,
	};
});
