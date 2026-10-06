/**
 * @module im/messenger/controller/chat-invite/tabs/guests/menu
 */
jn.define('im/messenger/controller/chat-invite/tabs/guests/menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');

	/**
	 * @param {InviteCasesMenuParams} args
	 * @return {Array<InviteCasesMenuItem>}
	 */
	const buildInviteCasesMenuItems = ({ getTestId, onSelectContacts, onSelectEmail, onSelectQR }) => [
		{
			id: 'contactlist',
			testId: getTestId('case-menu-item-fromContactsList'),
			title: Loc.getMessage('IMMOBILE_CHAT_INVITE_CASE_ITEM_CONTACTS_LIST'),
			iconName: Icon.CONTACT,
			onItemSelected: onSelectContacts,
		},
		{
			id: 'mail',
			testId: getTestId('case-menu-item-mail'),
			title: Loc.getMessage('IMMOBILE_CHAT_INVITE_CASE_ITEM_MAIL'),
			iconName: Icon.MAIL,
			onItemSelected: onSelectEmail,
		},
		{
			id: 'qr',
			testId: getTestId('case-menu-item-qr'),
			title: Loc.getMessage('IMMOBILE_CHAT_INVITE_CASE_ITEM_QR'),
			iconName: Icon.QR_CODE,
			onItemSelected: onSelectQR,
		},
	];

	module.exports = { buildInviteCasesMenuItems };
});